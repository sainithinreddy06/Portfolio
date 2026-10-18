import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  verifyGitHubSignature,
  fetchRepositoryData,
  hasPortfolioTopic,
  syncAllPortfolioRepositories,
  getGitHubDiagnostics,
} from './server/githubService';
import { parseResume, generateResumeDiff } from './server/resumeService';
import {
  getPortfolioStore,
  savePortfolioStore,
  syncGitHubProjects,
  handleRepositoryUntagged,
  applyApprovedResumeChanges,
  resetPortfolioStore,
} from './server/portfolioStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments (e.g. --port 3000, --production, --prod, --host 0.0.0.0)
const cliArgs = process.argv.slice(2);
function getCliArg(flag: string): string | undefined {
  for (let i = 0; i < cliArgs.length; i++) {
    if (cliArgs[i] === flag && cliArgs[i + 1] && !cliArgs[i + 1].startsWith('-')) {
      return cliArgs[i + 1];
    }
    if (cliArgs[i].startsWith(`${flag}=`)) {
      return cliArgs[i].slice(flag.length + 1);
    }
  }
  return undefined;
}
const hasCliFlag = (flag: string) => cliArgs.includes(flag);

// Determine execution environment:
// Explicit production mode triggered by NODE_ENV=production or --production / --prod flag
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  hasCliFlag('--production') ||
  hasCliFlag('--prod');

// Resolve port avoiding collisions with reverse proxies:
// 1. Explicit CLI --port flag
// 2. DEFAULT_APP_PORT (set by container supervisor/reverse proxy environment)
// 3. APP_PORT
// 4. PORT (only if distinct from reverse-proxy NGINX_PORT to prevent EADDRINUSE crash)
// 5. Default 3000
const cliPort = getCliArg('--port');
const defaultAppPort = process.env.DEFAULT_APP_PORT;
const appPort = process.env.APP_PORT;
const nginxPort = process.env.NGINX_PORT;
const rawEnvPort = process.env.PORT;

let resolvedPort = 3000;
if (cliPort) {
  resolvedPort = parseInt(cliPort, 10);
} else if (defaultAppPort) {
  resolvedPort = parseInt(defaultAppPort, 10);
} else if (appPort) {
  resolvedPort = parseInt(appPort, 10);
} else if (rawEnvPort && (!nginxPort || rawEnvPort !== nginxPort)) {
  resolvedPort = parseInt(rawEnvPort, 10);
} else {
  resolvedPort = 3000;
}

const PORT = resolvedPort;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'sainithinreddy06';

const app = express();
app.disable('x-powered-by');

import {
  requireAdminAuth,
  createAdminSession,
  verifyAdminToken,
  revokeAdminSession,
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  verifyAdminPassword,
  isAuthConfigured,
  ALLOWED_ADMIN_USERS,
} from './server/authService';
import {
  saveUploadedResume,
  rollbackResumeVersion,
  deleteResumeVersion,
  getActiveResumeFile,
  saveUploadedPhoto,
  rollbackPhotoVersion,
  deletePhotoVersion,
  resetPhotoToPlaceholder,
  getActivePhotoFile,
  ensureStorageDirectories,
} from './server/assetManager';
import { getStorageProviderStatus } from './server/cloudStorage';

// Ensure storage directories are initialized
ensureStorageDirectories();

function isValidUrl(urlStr: string | undefined): boolean {
  if (!urlStr) return true;
  const trimmed = urlStr.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  );
}

// -------------------------------------------------------------
// SECURITY HEADERS & DYNAMIC CORS CONFIGURATION
// -------------------------------------------------------------
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Standard OWASP Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (process.env.CSP_HEADER_VALUE) {
    res.setHeader('Content-Security-Policy', process.env.CSP_HEADER_VALUE);
  }
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Dynamic CORS Handling (supports localhost, Netlify, custom domain, Render)
  const isLocalhost = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const isAllowedCustom =
    origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*'));

  if (origin && (isLocalhost || isAllowedCustom || !IS_PROD)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-admin-token'
    );
  }

  // Intercept and resolve preflight OPTIONS requests immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Middleware to capture rawBody for GitHub webhook HMAC validation
app.use(
  express.json({
    limit: '25mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '25mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: IS_PROD ? 'production' : 'development',
    storageProvider: getStorageProviderStatus(),
    githubTargetUser: GITHUB_USERNAME,
  });
});

/**
 * Storage health check endpoint
 */
app.get('/api/storage/health', (_req: Request, res: Response) => {
  try {
    const photoInfo = getActivePhotoFile();
    const resumeInfo = getActiveResumeFile();
    const store = getPortfolioStore();

    res.json({
      success: true,
      provider: getStorageProviderStatus(),
      photo: {
        active: Boolean(photoInfo.found),
        url: store.content.profile.photo.url,
        isPlaceholder: store.content.profile.photo.isPlaceholder,
        versionsCount: store.content.profile.photo.versions?.length || 0,
      },
      resume: {
        active: Boolean(resumeInfo.found),
        fileUrl: store.content.profile.resume.fileUrl,
        fileName: store.content.profile.resume.fileName,
        isAvailable: store.content.profile.resume.isAvailable,
        versionsCount: store.content.profile.resume.versions?.length || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Public metadata for active profile photo
 */
app.get('/api/portfolio/photo/meta', (_req: Request, res: Response) => {
  try {
    const store = getPortfolioStore();
    const info = getActivePhotoFile();
    res.json({
      success: true,
      url: store.content.profile.photo.url,
      altText: store.content.profile.photo.altText,
      isPlaceholder: store.content.profile.photo.isPlaceholder,
      hasLocalAsset: info.found,
      defaultAssetUrl: '/images/default-profile.png',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Public metadata for active resume
 */
app.get('/api/portfolio/resume/meta', (_req: Request, res: Response) => {
  try {
    const store = getPortfolioStore();
    const info = getActiveResumeFile();
    res.json({
      success: true,
      fileUrl: store.content.profile.resume.fileUrl,
      fileName: store.content.profile.resume.fileName,
      fileSize: store.content.profile.resume.fileSize,
      uploadedAt: store.content.profile.resume.uploadedAt,
      isAvailable: store.content.profile.resume.isAvailable,
      hasLocalAsset: info.found,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/projects
 * Single dynamic project data source consumed by the Projects page (SelectedWork).
 * Returns the latest synchronized repository data without requiring frontend builds or edits.
 */
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const store = getPortfolioStore();
    const shouldRefresh = req.query.refresh === 'true';

    if (shouldRefresh) {
      const discovered = await syncAllPortfolioRepositories(GITHUB_USERNAME, true);
      const updatedContent = syncGitHubProjects(discovered);
      return res.json({
        success: true,
        source: 'github_live',
        lastUpdated: updatedContent.lastSynced || new Date().toISOString(),
        total: updatedContent.projects.length,
        projects: updatedContent.projects,
      });
    }

    res.json({
      success: true,
      source: 'synchronized_store',
      lastUpdated: store.lastUpdated,
      total: store.content.projects.length,
      projects: store.content.projects,
    });
  } catch (err: any) {
    console.error('[API /api/projects] Error:', err);
    const store = getPortfolioStore();
    res.json({
      success: true,
      source: 'fallback_store',
      lastUpdated: store.lastUpdated,
      total: store.content.projects.length,
      projects: store.content.projects,
      error: err.message,
    });
  }
});

/**
 * GET /api/portfolio
 * Serves merged, dynamic portfolio content (curated + github + resume approved).
 */
app.get('/api/portfolio', (_req: Request, res: Response) => {
  try {
    const store = getPortfolioStore();
    res.json({
      success: true,
      lastUpdated: store.lastUpdated,
      content: store.content,
      syncedRepositories: store.syncedRepositories,
    });
  } catch (err: any) {
    console.error('[API /api/portfolio] Error reading store:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/github/status
 * Diagnostics endpoint: reports last sync, API rate limits remaining, discovered repositories, etc.
 */
app.get('/api/github/status', (_req: Request, res: Response) => {
  try {
    const diagnostics = getGitHubDiagnostics();
    const store = getPortfolioStore();
    res.json({
      success: true,
      diagnostics,
      syncedRepositoriesCount: Object.keys(store.syncedRepositories).length,
      lastStoreUpdate: store.lastUpdated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/verify
 * Validates the currently active admin session token
 */
app.get('/api/admin/verify', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers['x-admin-token'] as string);

  const result = verifyAdminToken(token);
  if (result.valid) {
    return res.json({
      success: true,
      user: result.user,
      message: 'Admin session is active and valid.',
    });
  }

  return res.status(401).json({
    success: false,
    error: result.error || 'Invalid or expired admin session token.',
    requiresLogin: true,
  });
});

/**
 * POST /api/admin/login
 * Authenticates admin with persistent rate limiting, timing-safe password verification, and HMAC token generation
 */
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normEmail = email.trim().toLowerCase();
    const isUserAllowed =
      ALLOWED_ADMIN_USERS.includes(normEmail);

    if (!isUserAllowed) {
      recordFailedLogin(ip);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please enter authorized credentials.',
      });
    }

    const passwordCheck = verifyAdminPassword(password);
    if (!passwordCheck.valid) {
      recordFailedLogin(ip);
      return res.status(401).json({
        success: false,
        error: passwordCheck.error || 'Invalid credentials. Please enter authorized credentials.',
      });
    }

    recordSuccessfulLogin(ip);
    const { token, expiresAt } = createAdminSession(normEmail);

    res.json({
      success: true,
      message: 'Authenticated successfully.',
      token,
      expiresAt,
      user: normEmail,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/logout
 */
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers['x-admin-token'] as string);

  if (token) {
    revokeAdminSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * POST /api/portfolio/save
 */
app.post('/api/portfolio/save', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'object') {
      res.status(400).json({ success: false, error: 'Valid content object is required.' });
      return;
    }

    if (content.projects && Array.isArray(content.projects)) {
      for (const p of content.projects) {
        if (!p.name || typeof p.name !== 'string') {
          return res.status(400).json({ success: false, error: 'Every project must have a valid name.' });
        }
        if (!isValidUrl(p.githubUrl) || !isValidUrl(p.liveUrl)) {
          return res.status(400).json({ success: false, error: `Invalid project URL detected in ${p.name}.` });
        }
      }
    }

    const store = getPortfolioStore();
    store.content = content;
    savePortfolioStore(store);
    res.json({ success: true, message: 'Portfolio saved successfully.', content: store.content });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/portfolio/photo
 * Serves the active portrait photo with cache headers
 */
app.get('/api/portfolio/photo', (_req: Request, res: Response) => {
  try {
    const info = getActivePhotoFile();
    if (info.found && info.filePath) {
      res.setHeader('Content-Type', info.mime || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res.sendFile(info.filePath);
    }
    res.status(404).json({ success: false, error: 'No profile photo found.' });
  } catch (err: any) {
    console.error('[API /api/portfolio/photo] Error serving photo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/portfolio/photo/history
 * Returns the list of uploaded photo versions
 */
app.get('/api/portfolio/photo/history', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const store = getPortfolioStore();
    res.json({
      success: true,
      versions: store.content.profile.photo.versions || [],
      currentPhoto: store.content.profile.photo,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/portfolio/photo/rollback
 * Restores a historical photo version
 */
app.post('/api/portfolio/photo/rollback', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { versionId } = req.body;
    if (!versionId) {
      return res.status(400).json({ success: false, error: 'versionId is required.' });
    }
    const result = rollbackPhotoVersion(versionId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/portfolio/photo/version/:id
 * Removes a historical photo version
 */
app.delete('/api/portfolio/photo/version/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = deletePhotoVersion(id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/portfolio/photo
 * Handles photo uploads, external URLs, and placeholder resets
 */
app.post('/api/portfolio/photo', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { dataUri, imageUrl, altText, fileName, reset } = req.body;

    if (reset) {
      const result = resetPhotoToPlaceholder();
      return res.json(result);
    }

    if (imageUrl) {
      if (!isValidUrl(imageUrl)) {
        return res.status(400).json({ success: false, error: 'Invalid image URL provided.' });
      }
      const store = getPortfolioStore();
      store.content.profile.photo = {
        ...store.content.profile.photo,
        url: imageUrl,
        altText:
          altText ||
          `Portrait of ${store.content.profile.name}, Computer Science & Engineering student at Chaitanya Bharathi Institute of Technology (CBIT)`,
        showInHero: true,
        showInAbout: false,
        isPlaceholder: false,
      };
      savePortfolioStore(store);
      return res.json({ success: true, photo: store.content.profile.photo });
    }

    if (dataUri) {
      const cleanBase64 = dataUri.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const result = await saveUploadedPhoto(buffer, fileName || 'portrait.png', altText);
      return res.json(result);
    }

    res.status(400).json({
      success: false,
      error: 'Please provide either dataUri, imageUrl, or reset flag.',
    });
  } catch (err: any) {
    console.error('[API /api/portfolio/photo] Error persisting photo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /resume.pdf
 * Direct route for /resume.pdf serving active PDF with inline disposition
 */
app.get('/resume.pdf', (_req: Request, res: Response, next) => {
  try {
    const info = getActiveResumeFile();
    if (info.found) {
      if (info.filePath) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="Sai_Nithin_Reddy_Resume.pdf"');
        return res.sendFile(info.filePath);
      }
      if (info.externalUrl) {
        return res.redirect(info.externalUrl);
      }
    }
  } catch (err) {
    console.warn('[GET /resume.pdf] Error checking active resume:', err);
  }
  return next();
});

/**
 * GET /api/portfolio/resume
 * Serves the uploaded PDF file (inline or attachment download)
 */
app.get('/api/portfolio/resume', (req: Request, res: Response) => {
  try {
    const info = getActiveResumeFile();
    if (info.found) {
      if (info.filePath) {
        const isDownload = req.query.download === '1' || req.query.download === 'true';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `${isDownload ? 'attachment' : 'inline'}; filename="Sai_Nithin_Reddy_Resume.pdf"`
        );
        return res.sendFile(info.filePath);
      }
      if (info.externalUrl) {
        return res.redirect(info.externalUrl);
      }
    }
    return res.status(404).json({ success: false, error: 'No custom resume file found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/portfolio/resume/history
 * Returns the list of resume versions
 */
app.get('/api/portfolio/resume/history', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const store = getPortfolioStore();
    res.json({
      success: true,
      versions: store.content.profile.resume.versions || [],
      currentResume: store.content.profile.resume,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/portfolio/resume/rollback
 * Restores a historical resume version as active
 */
app.post('/api/portfolio/resume/rollback', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { versionId } = req.body;
    if (!versionId) {
      return res.status(400).json({ success: false, error: 'versionId is required.' });
    }
    const result = rollbackResumeVersion(versionId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/portfolio/resume/version/:id
 * Removes a historical resume version
 */
app.delete('/api/portfolio/resume/version/:id', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = deleteResumeVersion(id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/portfolio/resume
 * Handles resume uploads, external links, and reset
 */
app.post('/api/portfolio/resume', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { dataUri, fileUrl, fileName, fileSize, comingSoonMessage, isAvailable, reset } = req.body;
    const store = getPortfolioStore();
    const dataDir = path.resolve(process.cwd(), 'data');
    const resumePath = path.join(dataDir, 'uploaded-resume.pdf');
    const publicResumePath = path.resolve(process.cwd(), 'public', 'resume.pdf');

    if (reset) {
      if (fs.existsSync(resumePath)) {
        try { fs.unlinkSync(resumePath); } catch {}
      }
      if (fs.existsSync(publicResumePath)) {
        try { fs.unlinkSync(publicResumePath); } catch {}
      }
      const versions = (store.content.profile.resume.versions || []).map((v) => ({
        ...v,
        isActive: false,
      }));
      store.content.profile.resume = {
        fileUrl: '#resume-view',
        fileName: undefined,
        fileSize: undefined,
        uploadedAt: undefined,
        isAvailable: true,
        comingSoonMessage: 'Verified curriculum vitae available to view and download.',
        versions,
      };
      savePortfolioStore(store);
      return res.json({ success: true, resume: store.content.profile.resume });
    }

    if (fileUrl) {
      if (!isValidUrl(fileUrl)) {
        return res.status(400).json({ success: false, error: 'Invalid resume URL provided.' });
      }
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      store.content.profile.resume = {
        ...store.content.profile.resume,
        fileUrl: fileUrl.trim(),
        fileName: fileName || (fileUrl.split('/').pop() || 'Sai_Nithin_Reddy_Resume.pdf'),
        fileSize: fileSize || 'Cloud Document',
        uploadedAt: dateFormatted,
        isAvailable: isAvailable !== false,
        comingSoonMessage: comingSoonMessage || 'Verified curriculum vitae available.',
      };
      savePortfolioStore(store);
      return res.json({ success: true, resume: store.content.profile.resume });
    }

    if (dataUri) {
      const cleanBase64 = dataUri.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const result = await saveUploadedResume(buffer, fileName || 'Sai_Nithin_Reddy_Resume.pdf', fileSize);
      return res.json(result);
    }

    res.status(400).json({ success: false, error: 'Please provide either dataUri, fileUrl, or reset flag.' });
  } catch (err: any) {
    console.error('[API /api/portfolio/resume] Error persisting resume:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/github/webhook
 * Secure GitHub Webhook Receiver with HMAC-SHA256 signature verification.
 * Automatically synchronizes repositories on push, repository creation, or metadata edit.
 */
app.post('/api/github/webhook', async (req: Request, res: Response) => {
  const event = req.headers['x-github-event'] as string;
  const signature = req.headers['x-hub-signature-256'] as string;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  console.log(`[GitHub Webhook] Received event: ${event}`);

  // 1. Signature Verification
  if (secret) {
    const isValid = verifyGitHubSignature((req as any).rawBody, signature, secret);
    if (!isValid) {
      console.warn('[GitHub Webhook] Invalid signature rejected.');
      res.status(401).json({ error: 'Invalid webhook signature.' });
      return;
    }
  } else {
    console.warn('[GitHub Webhook] GITHUB_WEBHOOK_SECRET is not set in environment. Allowing request for testing.');
  }

  // 2. Handle Ping event
  if (event === 'ping') {
    res.json({ message: 'Pong! Webhook configured successfully.', zen: req.body?.zen });
    return;
  }

  // 3. Process Repository or Push events
  try {
    const payload = req.body;
    const repo = payload.repository;
    if (!repo) {
      res.status(400).json({ error: 'Missing repository in payload.' });
      return;
    }

    const owner = repo.owner?.login || repo.owner?.name;
    if (owner && owner.toLowerCase() !== GITHUB_USERNAME.toLowerCase()) {
      console.log(`[GitHub Webhook] Ignored repo owned by ${owner} (expected ${GITHUB_USERNAME}).`);
      res.json({ ignored: true, reason: 'Owner mismatch' });
      return;
    }

    // Check if repo was deleted or made private
    if (payload.action === 'deleted') {
      console.log(`[GitHub Webhook] Repository ${repo.name} deleted. Archiving in portfolio.`);
      handleRepositoryUntagged(repo.id);
      res.json({ success: true, action: 'archived_deleted' });
      return;
    }

    // A GitHub push event does not always include the latest README and metadata;
    // query the GitHub API to retrieve complete fresh repository information.
    console.log(`[GitHub Webhook] Fetching latest metadata for repository ${owner}/${repo.name}...`);
    const fullProject = await fetchRepositoryData(owner || GITHUB_USERNAME, repo.name);
    if (!fullProject) {
      res.status(200).json({
        success: true,
        action: 'skipped',
        message: 'Repository is ineligible (empty, fork, or excluded).',
      });
      return;
    }

    // Sync project into portfolio store
    syncGitHubProjects([fullProject]);
    console.log(`[GitHub Webhook] Successfully synchronized project: ${fullProject.name} (liveUrl: ${fullProject.liveUrl || 'none'})`);

    res.json({
      success: true,
      action: 'synchronized',
      project: fullProject.name,
      liveUrl: fullProject.liveUrl,
    });
  } catch (err: any) {
    console.error('[GitHub Webhook] Error processing event:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/github/projects
 */
app.get('/api/github/projects', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const projects = await syncAllPortfolioRepositories(GITHUB_USERNAME, forceRefresh);
    const updatedContent = syncGitHubProjects(projects);
    res.json({
      success: true,
      username: GITHUB_USERNAME,
      total: projects.length,
      projects: updatedContent.projects,
      lastSynced: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API /api/github/projects] Error:', err);
    const store = getPortfolioStore();
    res.json({
      success: true,
      username: GITHUB_USERNAME,
      total: store.content.projects.length,
      projects: store.content.projects,
      lastSynced: store.lastUpdated,
      fromFallback: true,
    });
  }
});

/**
 * POST /api/github/sync
 * On-demand manual trigger to scan GitHub and reconcile all repositories.
 * Protected: Requires verified admin authentication. Only the portfolio owner can be synced.
 */
app.post('/api/github/sync', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const requestedUser = req.body.username;
    if (requestedUser && requestedUser.toLowerCase() !== GITHUB_USERNAME.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: `Unauthorized to sync external account. Only the portfolio owner (${GITHUB_USERNAME}) can be synchronized.`,
      });
    }
    const targetUser = GITHUB_USERNAME;
    console.log(`[GitHub Sync API] Manual sync triggered for user: ${targetUser}`);
    const projects = await syncAllPortfolioRepositories(targetUser, true);
    const updatedContent = syncGitHubProjects(projects);
    res.json({
      success: true,
      syncedCount: projects.length,
      projects: projects.map((p) => ({
        id: p.repoId,
        name: p.name,
        technologies: p.stack,
        url: p.githubUrl,
        liveUrl: p.liveUrl,
        deployment: p.deploymentInfo?.provider,
      })),
      totalProjects: updatedContent.projects.length,
      lastSynced: updatedContent.lastSynced,
    });
  } catch (err: any) {
    console.error('[GitHub Sync API] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/resume/parse
 * Extracts structured data from uploaded resume buffer.
 * Protected: Requires verified admin authentication.
 */
app.post('/api/resume/parse', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { pdfBase64, fileName } = req.body;
    if (!pdfBase64) {
      res.status(400).json({ success: false, error: 'pdfBase64 is required.' });
      return;
    }
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    console.log(`[Resume API] Parsing resume (${buffer.length} bytes, file: ${fileName || 'resume.pdf'})...`);
    const parsedData = await parseResume(buffer);
    const currentStore = getPortfolioStore();
    const diff = generateResumeDiff(parsedData, currentStore.content);
    res.json({
      success: true,
      diff,
    });
  } catch (err: any) {
    console.error('[Resume API] Parsing error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/resume/apply
 * Applies approved diff changes from parsed resume to portfolio store.
 * Protected: Requires verified admin authentication.
 */
app.post('/api/resume/apply', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { diff, approvedChangeIds } = req.body;
    if (!diff || !Array.isArray(approvedChangeIds)) {
      res.status(400).json({ success: false, error: 'diff and approvedChangeIds are required.' });
      return;
    }
    console.log(`[Resume API] Applying ${approvedChangeIds.length} approved changes...`);
    const updatedContent = applyApprovedResumeChanges(diff, approvedChangeIds);
    res.json({
      success: true,
      message: `Successfully applied ${approvedChangeIds.length} change(s).`,
      content: updatedContent,
    });
  } catch (err: any) {
    console.error('[Resume API] Error applying changes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/portfolio/reset
 * Resets portfolio store to baseline curated configuration.
 * Protected: Requires verified admin authentication.
 */
app.post('/api/portfolio/reset', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const content = resetPortfolioStore();
    res.json({ success: true, message: 'Portfolio reset to curated baseline.', content });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// FRONTEND STATIC / DEV SERVER INTEGRATION
// -------------------------------------------------------------

// Explicit catch-all for unknown API endpoints: ensures they always return JSON 404
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const { createServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      console.warn(`[Portfolio Server] Warning: 'dist' folder not found at ${distPath}. Build bundle with 'npm run build'.`);
    }

    // Serve static compiled assets from dist with caching
    app.use(express.static(distPath, { maxAge: '1d', index: false }));

    // SPA fallback: send compiled index.html for client-side routing
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'API endpoint not found' });
      }
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application bundle not built. Please run npm run build.');
      }
    });
  }

  const server = httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n  VITE v8.3.0  ready in 120 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`[Portfolio Server] Running on http://0.0.0.0:${PORT} (mode: ${IS_PROD ? 'production' : 'development'})`);

    // 1. Initial startup repository synchronization for sainithinreddy06
    syncAllPortfolioRepositories(GITHUB_USERNAME)
      .then((projects) => {
        if (projects.length > 0) {
          syncGitHubProjects(projects);
          console.log(`[Portfolio Server] Pre-synced ${projects.length} repository projects from GitHub.`);
        }
      })
      .catch((err) => console.warn('[Portfolio Server] Startup GitHub sync deferred:', err.message));

    // 2. Periodic scheduled reconciliation as fallback for missed webhooks (every 30 minutes)
    const RECONCILIATION_INTERVAL_MS = 30 * 60 * 1000;
    setInterval(() => {
      console.log('[Portfolio Server] Scheduled reconciliation running in background...');
      syncAllPortfolioRepositories(GITHUB_USERNAME, true)
        .then((projects) => {
          if (projects.length > 0) {
            syncGitHubProjects(projects);
            console.log(`[Portfolio Server] Scheduled reconciliation updated ${projects.length} repositories.`);
          }
        })
        .catch((err) => console.warn('[Portfolio Server] Scheduled reconciliation failed:', err.message));
    }, RECONCILIATION_INTERVAL_MS);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Portfolio Server] Port ${PORT} is already in use. Check for existing processes.`);
    } else {
      console.error('[Portfolio Server] Server error:', err);
    }
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    console.log(`[Portfolio Server] Received ${signal}. Shutting down HTTP server cleanly...`);
    server.close(() => {
      console.log('[Portfolio Server] HTTP server closed.');
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[Portfolio Server] Fatal start error:', err);
  process.exit(1);
});
