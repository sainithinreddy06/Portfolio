import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface GitHubRepoPayload {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  owner: {
    login: string;
  };
  fork: boolean;
  size?: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at?: string;
  stargazers_count: number;
  forks_count?: number;
  language: string | null;
  archived?: boolean;
  visibility?: string;
  private?: boolean;
}

export interface DeploymentSourceInfo {
  provider: 'netlify' | 'vercel' | 'github_pages' | 'github_homepage' | 'readme_docs' | 'fallback_verified';
  url: string;
  verified: boolean;
  notes?: string;
}

export interface ExtractedGitHubProject {
  repoId: number;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  githubUrl: string;
  liveUrl?: string;
  deploymentInfo?: DeploymentSourceInfo;
  topics: string[];
  defaultBranch: string;
  createdAt?: string;
  updatedAt: string;
  stars: number;
  forks?: number;
  hasPortfolioTopic: boolean;
  isFork: boolean;
  isEligible: boolean;
  category?: string;
  imageUrl?: string;
  isArchived?: boolean;
  visibility?: string;
}

export interface GitHubSyncDiagnostics {
  username: string;
  lastSyncedAt: string;
  rateLimitRemaining: number | null;
  rateLimitReset: string | null;
  hasTokenConfigured: boolean;
  hasWebhookSecretConfigured: boolean;
  hasNetlifyTokenConfigured: boolean;
  totalReposDiscovered: number;
  eligibleReposCount: number;
  projects: ExtractedGitHubProject[];
  errors: string[];
}

const DEFAULT_GITHUB_USERNAME = 'sainithinreddy06';
const CACHE_FILE_PATH = path.resolve(process.cwd(), 'data', 'githubProjectsCache.json');
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

// In-memory cache
let inMemoryCache: {
  timestamp: number;
  username: string;
  projects: ExtractedGitHubProject[];
} | null = null;

let lastRateLimitRemaining: number | null = null;
let lastRateLimitReset: string | null = null;
let lastSyncErrors: string[] = [];

/**
 * Verifies GitHub HMAC-SHA256 signature using the raw request body.
 */
export function verifyGitHubSignature(
  rawBody: Buffer | string | undefined,
  signatureHeader: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret) {
    console.warn('[GitHub Webhook] GITHUB_WEBHOOK_SECRET is not configured.');
    return false;
  }
  if (!signatureHeader || !rawBody) {
    return false;
  }

  const prefix = 'sha256=';
  if (!signatureHeader.startsWith(prefix)) {
    return false;
  }

  const providedSignature = signatureHeader.substring(prefix.length);
  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyBuffer)
    .digest('hex');

  const providedBuffer = Buffer.from(providedSignature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Gets configured GitHub headers (including Bearer token securely if provided in server env).
 */
function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'sainithinreddy-portfolio-discovery',
  };
  const token = process.env.GITHUB_TOKEN;
  if (token && token.trim() !== '') {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return headers;
}

/**
 * Record rate limit status from response headers
 */
function trackRateLimit(res: globalThis.Response) {
  const remaining = res.headers.get('x-ratelimit-remaining');
  const reset = res.headers.get('x-ratelimit-reset');
  if (remaining !== null) {
    lastRateLimitRemaining = parseInt(remaining, 10);
  }
  if (reset !== null) {
    lastRateLimitReset = new Date(parseInt(reset, 10) * 1000).toISOString();
  }
}

/**
 * Backward compatibility helper for topic checking.
 */
export function hasPortfolioTopic(topics?: string[]): boolean {
  if (!topics || !Array.isArray(topics)) return false;
  return topics.some((t) => t.trim().toLowerCase() === 'portfolio');
}

/**
 * Determines whether a repository is eligible for portfolio display:
 * - Excludes forks
 * - Excludes the portfolio repository itself
 * - Excludes empty scratch repos without code/documentation
 */
export function isEligibleRepository(
  repo: Partial<GitHubRepoPayload>,
  hasReadmeOrCode = true
): boolean {
  if (repo.fork) return false;
  const name = (repo.name || '').trim().toLowerCase();
  if (!name) return false;

  // Exclude meta/portfolio site repositories
  if (/^portfolio(-.*)?$/i.test(name)) return false;
  // Exclude obvious temporary scratch/test repos if they have no documentation
  if (/^(test|temp|scratch|practice|sandbox|assignment|workshop)$/i.test(name) && !hasReadmeOrCode) return false;
  // If repo size is 0 and no readme/code found, exclude
  if (repo.size === 0 && !hasReadmeOrCode) return false;

  return true;
}

/**
 * Formats a raw repository name into a clean, human-readable display title.
 */
function formatProjectName(rawName: string): string {
  const upper = rawName.toUpperCase();
  if (upper === 'TRAFFIQ') return 'TRAFFIQ';
  if (upper === 'TAPAS') return 'TAPAS';
  if (rawName.toLowerCase() === 'surestep') return 'SureStep';
  if (rawName.toLowerCase() === 'vidyavistaar') return 'VidyaVistaar';

  if (/[a-z][A-Z]/.test(rawName)) {
    return rawName;
  }
  return rawName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Infers appropriate high-level technical category.
 */
function inferCategory(name: string, description: string, stack: string[]): string {
  const combined = `${name} ${description} ${stack.join(' ')}`.toLowerCase();
  if (combined.includes('yolo') || combined.includes('opencv') || combined.includes('computer vision')) {
    return 'COMPUTER VISION';
  }
  if (
    combined.includes('scikit') ||
    combined.includes('pytorch') ||
    combined.includes('tensorflow') ||
    combined.includes('prediction') ||
    combined.includes('traffic') ||
    combined.includes('heatwave') ||
    combined.includes('ai / ml')
  ) {
    return 'AI / ML';
  }
  if (combined.includes('agent') || combined.includes('autonomous')) {
    return 'AI AGENT';
  }
  if (combined.includes('solidity') || combined.includes('web3') || combined.includes('blockchain')) {
    return 'WEB3';
  }
  return 'FULL STACK';
}

/**
 * Normalizes package.json and requirements.txt dependency names into badges.
 */
function normalizeDependencies(deps: string[]): string[] {
  const badgeMap: Record<string, string> = {
    next: 'Next.js 15',
    react: 'React 19',
    'react-dom': 'React 19',
    typescript: 'TypeScript',
    '@google/genai': 'Google Gemini AI',
    recharts: 'Recharts',
    'maplibre-gl': 'MapLibre GL',
    'd3-contour': 'D3 Contour',
    'd3-delaunay': 'D3 Delaunay',
    tailwindcss: 'Tailwind CSS',
    '@tailwindcss/vite': 'Tailwind CSS',
    fastapi: 'FastAPI',
    python: 'Python',
    torch: 'PyTorch',
    pytorch: 'PyTorch',
    ultralytics: 'Ultralytics YOLO',
    'scikit-learn': 'Scikit-learn',
    sklearn: 'Scikit-learn',
    opencv: 'OpenCV',
    'opencv-python': 'OpenCV',
    mongodb: 'MongoDB',
    pymongo: 'MongoDB',
    vite: 'Vite',
    node: 'Node.js',
    express: 'Express',
    leaflet: 'Leaflet Maps',
    'react-leaflet': 'Leaflet Maps',
    firebase: 'Firebase',
    'framer-motion': 'Framer Motion',
    motion: 'Motion',
    '@supabase/supabase-js': 'Supabase',
    '@tanstack/react-query': 'TanStack Query',
  };

  const priorityOrder = [
    'Next.js 15',
    'React 19',
    'React',
    'FastAPI',
    'Python',
    'PyTorch',
    'Ultralytics YOLO',
    'Scikit-learn',
    'Google Gemini AI',
    'MapLibre GL',
    'D3 Contour',
    'Recharts',
    'Leaflet Maps',
    'MongoDB',
    'Supabase',
    'TypeScript',
    'Tailwind CSS',
    'Vite',
    'Firebase',
  ];

  const set = new Set<string>();
  for (const dep of deps) {
    const clean = dep.toLowerCase().trim();
    if (badgeMap[clean]) {
      set.add(badgeMap[clean]);
    } else if (clean.length > 1 && clean.length < 24 && !clean.startsWith('@types/')) {
      const formatted = clean
        .replace(/^@[\w-]+\//, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      set.add(formatted);
    }
  }

  return Array.from(set).sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Parses README text for explicit technical overview, tools, and live demo links.
 */
export function parseReadmeContent(
  readmeText: string,
  fallbackLanguages: string[] = []
): {
  overview?: string;
  technologies: string[];
  discoveredLiveUrl?: string;
} {
  if (!readmeText) {
    return { technologies: fallbackLanguages };
  }

  const lines = readmeText.split('\n');
  let overview = '';
  const detectedTech = new Set<string>();
  let discoveredLiveUrl: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('![') &&
      !trimmed.startsWith('[!') &&
      !trimmed.startsWith('```') &&
      !trimmed.startsWith('<')
    ) {
      if (!overview && trimmed.length > 25 && !trimmed.toLowerCase().includes('build status')) {
        overview = trimmed
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/^>\s*/, '');
        break;
      }
    }
  }

  // Scan for live deployment URLs in README (e.g. netlify.app, vercel.app, etc.)
  const urlMatches = readmeText.match(/https?:\/\/[^\s\)\"\'<>]+/g) || [];
  for (const rawUrl of urlMatches) {
    const cleanUrl = rawUrl.replace(/[.,;:]+$/, '');
    const lower = cleanUrl.toLowerCase();
    if (
      lower.includes('github.com') ||
      lower.includes('localhost') ||
      lower.includes('127.0.0.1') ||
      lower.includes('shields.io') ||
      lower.includes('badgen.net') ||
      lower.includes('openstreetmap.org') ||
      lower.includes('open-meteo.com') ||
      lower.includes('weather.gov') ||
      lower.includes('gov.in') ||
      lower.includes('nic.in')
    ) {
      continue;
    }
    if (
      lower.includes('.netlify.app') ||
      lower.includes('.vercel.app') ||
      lower.includes('.pages.dev') ||
      lower.includes('.github.io')
    ) {
      discoveredLiveUrl = cleanUrl;
      break;
    }
  }

  // Look for explicit tech sections
  const techSectionRegex =
    /##?\s*(built with|technologies|tech stack|stack|tools|built using|frontend|backend|machine learning|database|computer vision)/i;
  let inTechSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (techSectionRegex.test(line)) {
      inTechSection = true;
      continue;
    }
    if (inTechSection) {
      if (/^##\s+(prerequisites|installation|getting started|how to run|license|author|contributing)/i.test(line)) {
        inTechSection = false;
        continue;
      }
      const tableMatch = line.match(/^\|\s*([a-zA-Z0-9.\s+/+#-]+?)\s*\|/);
      if (tableMatch && tableMatch[1]) {
        const item = tableMatch[1].trim();
        if (
          item.length > 1 &&
          item.length < 30 &&
          !item.toLowerCase().includes('technology') &&
          !item.includes('---') &&
          !item.toLowerCase().includes('purpose')
        ) {
          detectedTech.add(item);
        }
      }
      const bulletMatch = line.match(/^[-* ]\s+(?:\*\*)?([a-zA-Z0-9.\s+/+#-]+?)(?:\*\*)?(?::|\s+-|\s+–|\s+\(|$)/);
      if (bulletMatch && bulletMatch[1]) {
        const item = bulletMatch[1].trim();
        if (
          item.length > 1 &&
          item.length < 28 &&
          !item.toLowerCase().includes('http') &&
          !item.includes('layout') &&
          !item.includes('interface')
        ) {
          detectedTech.add(item);
        }
      }
      const boldMatch = line.match(/^\*\*([a-zA-Z0-9.\s+/+#-]+?)\*\*/);
      if (boldMatch && boldMatch[1]) {
        const item = boldMatch[1].trim();
        if (item.length > 1 && item.length < 25) {
          detectedTech.add(item);
        }
      }
    }
  }

  if (detectedTech.size === 0 && fallbackLanguages.length > 0) {
    fallbackLanguages.forEach((lang) => detectedTech.add(lang));
  }

  return {
    overview: overview || undefined,
    technologies: Array.from(detectedTech),
    discoveredLiveUrl,
  };
}

/**
 * Lightweight check to confirm that a deployment URL is reachable and returning a 2xx or 3xx status.
 */
async function verifyUrlReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'sainithinreddy-portfolio-discovery' },
    });
    return res.status < 400;
  } catch {
    try {
      const getRes = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'sainithinreddy-portfolio-discovery' },
      });
      return getRes.status < 400;
    } catch {
      return false;
    }
  }
}

/**
 * Discovers verified live deployment URL according to multi-tier hierarchy:
 * 1. GitHub repository homepage metadata (e.g. repo.homepage set on GitHub)
 * 2. README and documentation links
 * 3. GitHub Pages deployment information
 * 4. GitHub Deployments API
 * 5. Netlify API (if NETLIFY_AUTH_TOKEN is configured)
 * 6. Verified fallback for confirmed repositories (TAPAS, SureStep)
 */
export async function discoverLiveDeployment(
  owner: string,
  repoName: string,
  repoPayload: Partial<GitHubRepoPayload> | null,
  readmeLiveUrl?: string,
  previousKnownUrl?: string
): Promise<DeploymentSourceInfo | null> {
  const headers = getGitHubHeaders();

  // Tier 1: Check GitHub repository homepage metadata
  // When user adds or changes homepage on GitHub, this reflects immediately
  if (repoPayload?.homepage && typeof repoPayload.homepage === 'string') {
    const rawHomepage = repoPayload.homepage.trim();
    if (rawHomepage.startsWith('http')) {
      const isOk = await verifyUrlReachable(rawHomepage);
      if (isOk) {
        return {
          provider: 'github_homepage',
          url: rawHomepage,
          verified: true,
          notes: 'Discovered from GitHub repository homepage metadata',
        };
      } else {
        // If homepage was provided explicitly by the user on GitHub, trust it even if transient check was slow
        return {
          provider: 'github_homepage',
          url: rawHomepage,
          verified: false,
          notes: 'Configured in GitHub repository homepage (transient HTTP timeout)',
        };
      }
    }
  }

  // Tier 2: Check README discovered link
  if (readmeLiveUrl && readmeLiveUrl.startsWith('http')) {
    const isOk = await verifyUrlReachable(readmeLiveUrl);
    if (isOk) {
      return {
        provider: 'readme_docs',
        url: readmeLiveUrl,
        verified: true,
        notes: 'Discovered from repository README documentation',
      };
    }
  }

  // Tier 3: Check GitHub Pages
  try {
    const pagesRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pages`, {
      headers,
      signal: AbortSignal.timeout(3000),
    });
    trackRateLimit(pagesRes);
    if (pagesRes.ok) {
      const pagesData = (await pagesRes.json()) as any;
      if (pagesData?.html_url) {
        const isOk = await verifyUrlReachable(pagesData.html_url);
        if (isOk) {
          return {
            provider: 'github_pages',
            url: pagesData.html_url,
            verified: true,
            notes: 'Discovered from GitHub Pages configuration',
          };
        }
      }
    }
  } catch {
    // Non-fatal
  }

  // Tier 4: Check GitHub Deployments API
  try {
    const depsRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/deployments`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    trackRateLimit(depsRes);
    if (depsRes.ok) {
      const deps = (await depsRes.json()) as any[];
      if (Array.isArray(deps) && deps.length > 0) {
        for (const dep of deps.slice(0, 3)) {
          if (!dep.statuses_url) continue;
          try {
            const statRes = await fetch(dep.statuses_url, {
              headers,
              signal: AbortSignal.timeout(3000),
            });
            trackRateLimit(statRes);
            if (statRes.ok) {
              const statuses = (await statRes.json()) as any[];
              const successful = statuses.find((s) => s.state === 'success' && (s.environment_url || s.target_url));
              if (successful) {
                const targetUrl = (successful.environment_url || successful.target_url) as string;
                if (targetUrl && !targetUrl.includes('vercel.com/sso') && !targetUrl.includes('api.github.com')) {
                  const isOk = await verifyUrlReachable(targetUrl);
                  if (isOk) {
                    const isVercel = (dep.creator?.login || '').includes('vercel');
                    const isNetlify = (dep.creator?.login || '').includes('netlify');
                    return {
                      provider: isNetlify ? 'netlify' : isVercel ? 'vercel' : 'fallback_verified',
                      url: targetUrl,
                      verified: true,
                      notes: `Discovered from GitHub Deployment (${dep.creator?.login || 'deployment'})`,
                    };
                  }
                }
              }
            }
          } catch {
            // Ignore single status fetch failure
          }
        }
      }
    }
  } catch {
    // Non-fatal
  }

  // Tier 5: Netlify API (if NETLIFY_AUTH_TOKEN is configured in server environment)
  const netlifyToken = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_TOKEN;
  if (netlifyToken) {
    try {
      const netlifyRes = await fetch('https://api.netlify.com/api/v1/sites', {
        headers: {
          Authorization: `Bearer ${netlifyToken.trim()}`,
          'User-Agent': 'sainithinreddy-portfolio-discovery',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (netlifyRes.ok) {
        const sites = (await netlifyRes.json()) as any[];
        const matchedSite = sites.find((s) => {
          const repoPath = s.build_settings?.repo_path || '';
          const repoUrl = s.build_settings?.repo_url || '';
          return (
            repoPath.toLowerCase() === `${owner}/${repoName}`.toLowerCase() ||
            repoUrl.toLowerCase().includes(`/${owner}/${repoName}`.toLowerCase())
          );
        });
        if (matchedSite?.ssl_url || matchedSite?.url) {
          const siteUrl = (matchedSite.ssl_url || matchedSite.url) as string;
          const isPublished = Boolean(matchedSite.published_deploy?.state === 'ready');
          if (isPublished) {
            return {
              provider: 'netlify',
              url: siteUrl,
              verified: true,
              notes: `Discovered from Netlify API (Site: ${matchedSite.name})`,
            };
          }
        }
      }
    } catch (e) {
      console.warn('[Netlify API] Failed to query sites:', e);
    }
  }

  // Tier 6: Retain verified fallback for confirmed live projects
  // User confirmed project: TAPAS -> https://tapas-heat-intelligence.netlify.app/
  if (repoName.toLowerCase() === 'tapas') {
    const verifiedTapasUrl = 'https://tapas-heat-intelligence.netlify.app/';
    return {
      provider: 'fallback_verified',
      url: verifiedTapasUrl,
      verified: true,
      notes: 'Confirmed live Netlify production deployment for TAPAS',
    };
  }

  // SureStep confirmed live deployment -> https://terra-guard-ai-five.vercel.app
  if (repoName.toLowerCase() === 'surestep') {
    const verifiedSureStepUrl = 'https://terra-guard-ai-five.vercel.app';
    return {
      provider: 'fallback_verified',
      url: verifiedSureStepUrl,
      verified: true,
      notes: 'Confirmed live Vercel production deployment for SureStep',
    };
  }

  // Do not remove a previously known valid URL just because of a temporary transient API error
  if (previousKnownUrl && previousKnownUrl.startsWith('http')) {
    return {
      provider: 'fallback_verified',
      url: previousKnownUrl,
      verified: true,
      notes: 'Retained previously verified live demo URL',
    };
  }

  return null;
}

/**
 * Fetches repository README, package.json files, requirements.txt, and languages with retry.
 */
export async function fetchRepositoryData(
  owner: string,
  repoName: string,
  previousKnownUrl?: string
): Promise<ExtractedGitHubProject | null> {
  const headers = getGitHubHeaders();
  let repoPayload: Partial<GitHubRepoPayload> | null = null;
  let languages: string[] = [];
  let readmeText = '';
  let packageJsonData: any = null;
  let subPackageJsonData: any = null;
  let requirementsText = '';

  // 1. Fetch repo metadata via API with retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      trackRateLimit(repoRes);
      if (repoRes.ok) {
        repoPayload = await repoRes.json();
        break;
      } else if (repoRes.status === 404) {
        console.warn(`[GitHub Sync] Repo ${owner}/${repoName} not found (404).`);
        break;
      } else {
        console.warn(`[GitHub Sync] API returned ${repoRes.status} for ${owner}/${repoName} (attempt ${attempt}).`);
      }
    } catch (e: any) {
      console.warn(`[GitHub Sync] API fetch error for ${owner}/${repoName} (attempt ${attempt}): ${e.message}`);
      if (attempt === 1) await new Promise((r) => setTimeout(r, 600));
    }
  }

  // 2. Fetch languages
  if (repoPayload) {
    try {
      const langRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/languages`, {
        headers,
        signal: AbortSignal.timeout(4000),
      });
      trackRateLimit(langRes);
      if (langRes.ok) {
        const langData = (await langRes.json()) as Record<string, number>;
        languages = Object.keys(langData).slice(0, 6);
      }
    } catch {
      // Non-fatal
    }
  }

  // 3. Fetch README (tries default_branch then main then master)
  const branches = [repoPayload?.default_branch || 'main', 'main', 'master'];
  for (const branch of Array.from(new Set(branches))) {
    try {
      const rawRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/README.md`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (rawRes.ok) {
        const text = await rawRes.text();
        if (text && !text.includes('404: Not Found')) {
          readmeText = text;
          break;
        }
      }
    } catch {
      // Non-fatal
    }
  }

  // 4. Fetch package.json dependencies (root or frontend)
  for (const branch of Array.from(new Set(branches))) {
    try {
      const pkgRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/package.json`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (pkgRes.ok) {
        const text = await pkgRes.text();
        if (text && !text.includes('404: Not Found')) {
          packageJsonData = JSON.parse(text);
          break;
        }
      }
    } catch {
      // Non-fatal
    }
  }

  // Also check subfolder frontend/package.json
  if (!packageJsonData) {
    for (const branch of Array.from(new Set(branches))) {
      try {
        const subPkgRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/frontend/package.json`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (subPkgRes.ok) {
          const text = await subPkgRes.text();
          if (text && !text.includes('404: Not Found')) {
            subPackageJsonData = JSON.parse(text);
            break;
          }
        }
      } catch {
        // Non-fatal
      }
    }
  }

  // 5. Fetch requirements.txt
  for (const branch of Array.from(new Set(branches))) {
    const reqPaths = ['requirements.txt', 'backend/requirements.txt', 'ml-service/requirements.txt'];
    for (const rPath of reqPaths) {
      try {
        const reqRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${rPath}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (reqRes.ok) {
          const text = await reqRes.text();
          if (text && !text.includes('404: Not Found')) {
            requirementsText += `\n${text}`;
          }
        }
      } catch {
        // Non-fatal
      }
    }
  }

  const hasReadmeOrCode = Boolean(
    (readmeText && readmeText.trim().length > 20) ||
    packageJsonData ||
    subPackageJsonData ||
    requirementsText ||
    languages.length > 0
  );

  // Check eligibility
  if (repoPayload && !isEligibleRepository(repoPayload, hasReadmeOrCode)) {
    return null;
  }
  if (!repoPayload && !hasReadmeOrCode) {
    return null;
  }

  // Aggregate tech stack
  const rawDeps: string[] = [];
  const activePkg = packageJsonData || subPackageJsonData;
  if (activePkg?.dependencies) {
    rawDeps.push(...Object.keys(activePkg.dependencies));
  }
  if (activePkg?.devDependencies) {
    rawDeps.push(...Object.keys(activePkg.devDependencies));
  }
  if (requirementsText) {
    const reqLines = requirementsText
      .split('\n')
      .map((l) => l.trim().split(/[=><~]/)[0].trim())
      .filter((l) => l && !l.startsWith('#'));
    rawDeps.push(...reqLines);
  }

  const parsedReadme = parseReadmeContent(readmeText, languages);
  const normalizedDependencies = normalizeDependencies(rawDeps);
  const combinedStackSet = new Set<string>([
    ...normalizedDependencies,
    ...parsedReadme.technologies,
    ...languages,
  ]);

  const finalStack = Array.from(combinedStackSet)
    .filter((s) => s.length > 1 && s.length < 30)
    .slice(0, 8);

  const formattedName = formatProjectName(repoName);

  const description =
    activePkg?.description ||
    parsedReadme.overview ||
    repoPayload?.description ||
    `${formattedName} engineered and open-sourced on GitHub.`;

  let tagline = repoPayload?.description || '';
  if (!tagline && activePkg?.description) {
    tagline = activePkg.description;
  }
  if (!tagline) {
    tagline = description.slice(0, 90);
  }

  // Live demo discovery
  const deploymentInfo = await discoverLiveDeployment(
    owner,
    repoName,
    repoPayload,
    parsedReadme.discoveredLiveUrl,
    previousKnownUrl
  );

  const category = inferCategory(formattedName, description, finalStack);

  return {
    repoId: repoPayload?.id || Math.abs(repoName.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)),
    name: formattedName,
    tagline,
    description,
    stack: finalStack.length > 0 ? finalStack : languages.length > 0 ? languages : ['Full Stack'],
    githubUrl: repoPayload?.html_url || `https://github.com/${owner}/${repoName}`,
    liveUrl: deploymentInfo?.url,
    deploymentInfo: deploymentInfo || undefined,
    topics: repoPayload?.topics || [],
    defaultBranch: repoPayload?.default_branch || 'main',
    createdAt: repoPayload?.created_at,
    updatedAt: repoPayload?.pushed_at || repoPayload?.updated_at || new Date().toISOString(),
    stars: repoPayload?.stargazers_count || 0,
    forks: repoPayload?.forks_count || 0,
    hasPortfolioTopic: hasPortfolioTopic(repoPayload?.topics),
    isFork: repoPayload?.fork || false,
    isEligible: true,
    category,
    isArchived: repoPayload?.archived || false,
    visibility: repoPayload?.visibility || 'public',
  };
}

/**
 * Reads cached GitHub projects from disk if available.
 */
function readDiskCache(): ExtractedGitHubProject[] | null {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        return parsed.projects;
      }
    }
  } catch {
    // Non-fatal
  }
  return null;
}

/**
 * Saves GitHub projects cache to disk.
 */
function writeDiskCache(username: string, projects: ExtractedGitHubProject[]): void {
  try {
    const dir = path.dirname(CACHE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      CACHE_FILE_PATH,
      JSON.stringify(
        {
          username,
          timestamp: Date.now(),
          lastUpdated: new Date().toISOString(),
          projects,
        },
        null,
        2
      ),
      'utf8'
    );
  } catch (err) {
    console.error('[GitHub Cache] Failed to write cache:', err);
  }
}

/**
 * Fetches all repositories for a user with pagination support (handles 100+ repos).
 */
async function fetchAllUserReposWithPagination(
  username: string,
  headers: Record<string, string>
): Promise<GitHubRepoPayload[]> {
  const allRepos: GitHubRepoPayload[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?sort=updated&page=${page}&per_page=${perPage}`,
        { headers, signal: AbortSignal.timeout(8000) }
      );
      trackRateLimit(res);
      if (!res.ok) {
        const errorMsg = `HTTP ${res.status} from GitHub API /users/${username}/repos?page=${page}`;
        console.warn(`[GitHub Pagination] ${errorMsg}`);
        lastSyncErrors.push(errorMsg);
        break;
      }
      const repos = (await res.json()) as GitHubRepoPayload[];
      if (!Array.isArray(repos) || repos.length === 0) {
        hasMore = false;
        break;
      }
      allRepos.push(...repos);
      const linkHeader = res.headers.get('link');
      if (!linkHeader || !linkHeader.includes('rel="next"')) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (err: any) {
      const errorMsg = `Error fetching page ${page}: ${err.message}`;
      console.warn(`[GitHub Pagination] ${errorMsg}`);
      lastSyncErrors.push(errorMsg);
      break;
    }
  }

  // If authenticated, also fetch /user/repos with pagination to capture any private/internal repos
  if (headers.Authorization) {
    try {
      let userPage = 1;
      let userHasMore = true;
      while (userHasMore) {
        const userRes = await fetch(
          `https://api.github.com/user/repos?page=${userPage}&per_page=${perPage}&type=all`,
          { headers, signal: AbortSignal.timeout(8000) }
        );
        trackRateLimit(userRes);
        if (!userRes.ok) break;
        const userRepos = (await userRes.json()) as GitHubRepoPayload[];
        if (!Array.isArray(userRepos) || userRepos.length === 0) break;
        for (const ur of userRepos) {
          if (
            ur.owner?.login?.toLowerCase() === username.toLowerCase() &&
            !allRepos.some((r) => r.id === ur.id)
          ) {
            allRepos.push(ur);
          }
        }
        const linkHeader = userRes.headers.get('link');
        if (!linkHeader || !linkHeader.includes('rel="next"')) {
          userHasMore = false;
        } else {
          userPage++;
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return allRepos;
}

/**
 * Synchronizes all eligible repositories belonging to the GitHub user.
 */
export async function syncAllPortfolioRepositories(
  targetUsername?: string,
  forceRefresh = false,
  previousKnownUrls: Record<string, string> = {}
): Promise<ExtractedGitHubProject[]> {
  const username = targetUsername || process.env.GITHUB_USERNAME || DEFAULT_GITHUB_USERNAME;
  const now = Date.now();
  lastSyncErrors = [];

  // 1. Check in-memory cache if not forced
  if (!forceRefresh && inMemoryCache && inMemoryCache.username === username) {
    if (now - inMemoryCache.timestamp < CACHE_TTL_MS) {
      return inMemoryCache.projects;
    }
  }

  const headers = getGitHubHeaders();
  console.log(`[GitHub Sync] Scanning repositories with pagination for user: ${username} (auth: ${Boolean(headers.Authorization)})...`);

  try {
    const allRepos = await fetchAllUserReposWithPagination(username, headers);
    const projects: ExtractedGitHubProject[] = [];

    // Filter and process eligible repositories
    for (const repo of allRepos) {
      if (repo.fork) continue;
      if (/^portfolio(-.*)?$/i.test(repo.name)) continue;

      const previousUrl = previousKnownUrls[repo.name.toLowerCase()];
      const project = await fetchRepositoryData(username, repo.name, previousUrl);
      if (project && project.isEligible) {
        projects.push(project);
      }
    }

    if (projects.length > 0) {
      inMemoryCache = {
        timestamp: now,
        username,
        projects,
      };
      writeDiskCache(username, projects);
      console.log(`[GitHub Sync] Successfully discovered ${projects.length} eligible repositories for ${username}.`);
      return projects;
    }

    // Fallback if API returned 0 projects (e.g. rate limit reached without token)
    const diskFallback = readDiskCache();
    if (diskFallback && diskFallback.length > 0) {
      console.log(`[GitHub Sync] Using disk cache fallback (${diskFallback.length} projects).`);
      return diskFallback;
    }
    return [];
  } catch (err: any) {
    console.error('[GitHub Sync] Error syncing user repositories:', err);
    lastSyncErrors.push(err.message);
    const diskFallback = readDiskCache();
    if (diskFallback && diskFallback.length > 0) {
      console.log(`[GitHub Sync] Recovered using disk cache fallback (${diskFallback.length} projects).`);
      return diskFallback;
    }
    return [];
  }
}

/**
 * Returns diagnostic information for GitHub sync status and API limits.
 */
export function getGitHubDiagnostics(): GitHubSyncDiagnostics {
  const disk = readDiskCache();
  const currentProjects = inMemoryCache?.projects || disk || [];
  return {
    username: process.env.GITHUB_USERNAME || DEFAULT_GITHUB_USERNAME,
    lastSyncedAt: new Date(inMemoryCache?.timestamp || Date.now()).toISOString(),
    rateLimitRemaining: lastRateLimitRemaining,
    rateLimitReset: lastRateLimitReset,
    hasTokenConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim() !== ''),
    hasWebhookSecretConfigured: Boolean(process.env.GITHUB_WEBHOOK_SECRET && process.env.GITHUB_WEBHOOK_SECRET.trim() !== ''),
    hasNetlifyTokenConfigured: Boolean(process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_TOKEN),
    totalReposDiscovered: currentProjects.length,
    eligibleReposCount: currentProjects.filter((p) => p.isEligible).length,
    projects: currentProjects,
    errors: lastSyncErrors,
  };
}

/**
 * Returns currently cached projects without waiting for remote API.
 */
export function getCachedGitHubProjects(): ExtractedGitHubProject[] {
  if (inMemoryCache) {
    return inMemoryCache.projects;
  }
  const disk = readDiskCache();
  if (disk) return disk;
  return [];
}
