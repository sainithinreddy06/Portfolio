import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SECRET_FILE = path.join(DATA_DIR, '.session-secret');
const SESSIONS_FILE = path.join(DATA_DIR, 'admin-sessions.json');
const RATE_LIMITS_FILE = path.join(DATA_DIR, 'rate-limits.json');

// Strict email allowlist (lowercased)
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sainithinreddytadugam@gmail.com').toLowerCase().trim();
export const ALLOWED_ADMIN_USERS = [
  ADMIN_EMAIL,
  'sainithinreddytadugam@gmail.com',
  'tsainithinreddy@gmail.com',
  'sainithinreddy06',
  'sainithinreddy',
  'sainithin',
  'nithin',
  'nithinreddy_06',
  'admin',
].map((u) => u.toLowerCase().trim());

// Rate limiting parameters
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes lockout

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

/**
 * Returns configured admin password.
 * Fails closed: returns null if ADMIN_PASSWORD environment variable is missing or empty.
 * Never falls back to hardcoded default passwords.
 */
export function getAdminPassword(): string | null {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd || typeof pwd !== 'string' || pwd.trim().length === 0) {
    return null;
  }
  return pwd.trim();
}

/**
 * Checks whether admin authentication is configured on the server
 */
export function isAuthConfigured(): boolean {
  return getAdminPassword() !== null;
}

/**
 * Verifies provided password against configured ADMIN_PASSWORD using constant-time comparison
 */
export function verifyAdminPassword(provided: string): { valid: boolean; error?: string } {
  const expected = getAdminPassword();
  if (!expected) {
    return {
      valid: false,
      error: 'Admin authentication is currently disabled: ADMIN_PASSWORD environment variable is not configured.',
    };
  }

  if (typeof provided !== 'string' || provided.length === 0) {
    return { valid: false, error: 'Password is required.' };
  }

  const pBuf = Buffer.from(provided, 'utf8');
  const eBuf = Buffer.from(expected, 'utf8');

  // Prevent timing leaks by always executing timingSafeEqual
  if (pBuf.length !== eBuf.length) {
    crypto.timingSafeEqual(pBuf, pBuf);
    return { valid: false, error: 'Invalid credentials.' };
  }

  const match = crypto.timingSafeEqual(pBuf, eBuf);
  return match ? { valid: true } : { valid: false, error: 'Invalid credentials.' };
}

/**
 * Retrieves or generates the persistent HMAC secret key.
 */
export function getSessionSecret(): string {
  ensureDataDir();
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 32) {
    return process.env.SESSION_SECRET.trim();
  }
  if (fs.existsSync(SECRET_FILE)) {
    try {
      const secret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
      if (secret.length >= 32) return secret;
    } catch {
      // fallback to generation
    }
  }
  const newSecret = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(SECRET_FILE, newSecret, 'utf8');
  } catch (err) {
    console.warn('[AuthService] Could not persist session secret to file, using in-memory:', err);
  }
  return newSecret;
}

/**
 * Rotates the session secret and revokes all active sessions
 */
export function rotateSessionSecret(): string {
  ensureDataDir();
  const newSecret = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(SECRET_FILE, newSecret, 'utf8');
  } catch (err) {
    console.warn('[AuthService] Could not write rotated session secret:', err);
  }
  // Invalidate all existing sessions upon secret rotation
  saveSessions([]);
  return newSecret;
}

interface StoredSession {
  tokenHash: string;
  user: string;
  createdAt: number;
  expiresAt: number;
}

function loadSessions(): StoredSession[] {
  ensureDataDir();
  if (!fs.existsSync(SESSIONS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    const list: StoredSession[] = JSON.parse(raw);
    const now = Date.now();
    return Array.isArray(list) ? list.filter((s) => s.expiresAt > now) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: StoredSession[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (err) {
    console.error('[AuthService] Failed to write admin sessions to disk:', err);
  }
}

// -------------------------------------------------------------
// PERSISTENT RATE LIMITING (SURVIVES RESTARTS)
// -------------------------------------------------------------

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

function loadRateLimits(): Record<string, RateLimitRecord> {
  ensureDataDir();
  if (!fs.existsSync(RATE_LIMITS_FILE)) return {};
  try {
    const raw = fs.readFileSync(RATE_LIMITS_FILE, 'utf8');
    const data = JSON.parse(raw);
    const now = Date.now();
    const pruned: Record<string, RateLimitRecord> = {};
    if (data && typeof data === 'object') {
      for (const [ip, rec] of Object.entries(data as Record<string, RateLimitRecord>)) {
        if (rec && typeof rec === 'object') {
          if ((rec.blockedUntil && rec.blockedUntil > now) || (now - rec.firstAttempt < RATE_LIMIT_WINDOW_MS)) {
            pruned[ip] = rec;
          }
        }
      }
    }
    return pruned;
  } catch {
    return {};
  }
}

function saveRateLimits(map: Record<string, RateLimitRecord>): void {
  ensureDataDir();
  try {
    fs.writeFileSync(RATE_LIMITS_FILE, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.warn('[AuthService] Could not persist rate limits:', err);
  }
}

/**
 * Checks persistent rate limiting for login attempts
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const limits = loadRateLimits();
  const record = limits[ip];
  if (!record) return { allowed: true };

  if (record.blockedUntil && record.blockedUntil > now) {
    const waitSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // Reset window if older than window
  if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    delete limits[ip];
    saveRateLimits(limits);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    limits[ip] = record;
    saveRateLimits(limits);
    const waitSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { allowed: false, waitSeconds };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const limits = loadRateLimits();
  const record = limits[ip];
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    limits[ip] = { count: 1, firstAttempt: now };
  } else {
    record.count += 1;
    if (record.count >= MAX_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_DURATION_MS;
    }
    limits[ip] = record;
  }
  saveRateLimits(limits);
}

export function recordSuccessfulLogin(ip: string): void {
  const limits = loadRateLimits();
  if (limits[ip]) {
    delete limits[ip];
    saveRateLimits(limits);
  }
}

/**
 * Creates an HMAC signed session token that lasts for 7 days.
 */
export function createAdminSession(user: string): { token: string; expiresAt: number } {
  const secret = getSessionSecret();
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = {
    user: user.toLowerCase().trim(),
    iat: now,
    exp: expiresAt,
    salt: crypto.randomBytes(16).toString('hex'),
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  const token = `${payloadB64}.${signature}`;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = loadSessions();
  sessions.push({
    tokenHash,
    user: payload.user,
    createdAt: now,
    expiresAt,
  });
  saveSessions(sessions);

  return { token, expiresAt };
}

/**
 * Validates a session token
 */
export function verifyAdminToken(token: string | undefined): { valid: boolean; user?: string; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is missing' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [payloadB64, signature] = parts;
  const secret = getSessionSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');

  if (signature.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Date.now();
    if (!payload.exp || payload.exp < now) {
      return { valid: false, error: 'Session token has expired' };
    }

    // Check if token was revoked
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sessions = loadSessions();
    const match = sessions.find((s) => s.tokenHash === tokenHash);
    if (!match) {
      return { valid: false, error: 'Session has been invalidated or logged out' };
    }

    return { valid: true, user: payload.user };
  } catch {
    return { valid: false, error: 'Malformed token payload' };
  }
}

/**
 * Revokes a session token on logout
 */
export function revokeAdminSession(token: string | undefined): void {
  if (!token) return;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = loadSessions().filter((s) => s.tokenHash !== tokenHash);
  saveSessions(sessions);
}

/**
 * Express middleware to enforce admin authentication
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.headers['x-admin-token'] as string);

  if (token) {
    const result = verifyAdminToken(token);
    if (result.valid) {
      (req as any).adminUser = result.user;
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized. Valid admin session token or admin authorization required.',
    requiresLogin: true,
  });
}

