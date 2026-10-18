import crypto from 'node:crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { sessions, loginAttempts } from '../db/schema.js';
import { env } from './runtimeEnv';

export function isAuthConfigured() {
  return Boolean(env('ADMIN_EMAIL')?.trim() && env('ADMIN_PASSWORD')?.trim() && (env('SESSION_SECRET')?.trim().length ?? 0) >= 32);
}
export function credentialsMatch(email: string, password: string) {
  const expected = crypto.createHash('sha256').update(env('ADMIN_PASSWORD')?.trim() || '').digest();
  const provided = crypto.createHash('sha256').update(password).digest();
  const validPassword = crypto.timingSafeEqual(expected, provided);
  return validPassword && email === env('ADMIN_EMAIL')?.trim().toLowerCase();
}
function secret() {
  const value = env('SESSION_SECRET')?.trim();
  if (!value || value.length < 32) throw new Error('Admin session signing is not configured. Set SESSION_SECRET to at least 32 characters.');
  return value;
}
const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
export async function createAdminSession(user: string) {
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ user, iat: now, exp: expiresAt, salt: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  const token = `${payload}.${crypto.createHmac('sha256', secret()).update(payload).digest('base64url')}`;
  await getDb().insert(sessions).values({ tokenHash: hash(token), user, expiresAt });
  return { token, expiresAt };
}
export async function verifyAdminToken(token: string | undefined): Promise<{ valid: boolean; user?: string }> {
  if (!token || token.split('.').length !== 2) return { valid: false };
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest();
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return { valid: false };
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return { valid: false }; }
  if (typeof data.exp !== 'number' || data.exp <= Date.now() || data.user !== env('ADMIN_EMAIL')?.trim().toLowerCase()) return { valid: false };
  const [session] = await getDb().select().from(sessions).where(and(eq(sessions.tokenHash, hash(token)), gt(sessions.expiresAt, Date.now())));
  return session && session.user === data.user ? { valid: true, user: data.user } : { valid: false };
}
export async function revokeAdminSession(token: string | undefined) {
  if (token) await getDb().delete(sessions).where(eq(sessions.tokenHash, hash(token)));
}
// Atomically reserve an attempt before checking credentials, preventing concurrent bypass.
export async function reserveLoginAttempt(ip: string) {
  const now = Date.now(), window = 15 * 60 * 1000, block = 30 * 60 * 1000;
  const [row] = await getDb().insert(loginAttempts).values({ ip, count: 1, firstAttempt: now, blockedUntil: 0 })
    .onConflictDoUpdate({ target: loginAttempts.ip, set: {
      count: sql`CASE WHEN ${loginAttempts.blockedUntil} > ${now} THEN ${loginAttempts.count} + 1 WHEN ${loginAttempts.firstAttempt} < ${now - window} THEN 1 ELSE ${loginAttempts.count} + 1 END`,
      firstAttempt: sql`CASE WHEN ${loginAttempts.blockedUntil} <= ${now} AND ${loginAttempts.firstAttempt} < ${now - window} THEN ${now} ELSE ${loginAttempts.firstAttempt} END`,
      blockedUntil: sql`CASE WHEN ${loginAttempts.blockedUntil} > ${now} THEN ${loginAttempts.blockedUntil} WHEN ${loginAttempts.firstAttempt} < ${now - window} THEN 0 WHEN ${loginAttempts.count} >= 4 THEN ${now + block} ELSE 0 END`,
    } }).returning();
  return { allowed: row.count <= 5, waitSeconds: Math.max(1, Math.ceil((row.blockedUntil - now) / 1000)) };
}
export async function recordSuccessfulLogin(ip: string) {
  await getDb().delete(loginAttempts).where(eq(loginAttempts.ip, ip));
}
