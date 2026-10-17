import { reportApiFailure } from '../../server/apiErrors';
import type { Context } from '@netlify/functions';
import { isAuthConfigured, credentialsMatch, reserveLoginAttempt, recordSuccessfulLogin, createAdminSession, verifyAdminToken, revokeAdminSession } from '../../server/deployedAuthService';

export default async (request: Request, context: Context) => {
  const json = (body: object, status = 200, extra = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
  try {
    const action = new URL(request.url).pathname.split('/').pop();
    const method = action === 'verify' ? 'GET' : 'POST';
    if (!['login', 'verify', 'logout'].includes(action || '')) return json({ success: false, error: 'API route not found.' }, 404);
    if (request.method !== method) return json({ success: false, error: 'Method not allowed.' }, 405, { Allow: method });
    if (!isAuthConfigured()) return json({ success: false, error: 'Admin authentication requires ADMIN_EMAIL, ADMIN_PASSWORD, and SESSION_SECRET (at least 32 characters) in the Functions environment.' }, 503);
    const authorization = request.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : request.headers.get('x-admin-token') || undefined;
    if (action === 'verify') {
      const result = await verifyAdminToken(token);
      return result.valid ? json({ success: true, user: result.user }) : json({ success: false, requiresLogin: true, error: 'Invalid or expired admin session.' }, 401);
    }
    if (action === 'logout') {
      await revokeAdminSession(token);
      return json({ success: true });
    }
    let body;
    try { body = await request.json(); } catch { return json({ success: false, error: 'Request body must be valid JSON.' }, 400); }
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string' || !body.email.trim() || !body.password) return json({ success: false, error: 'Email and password are required.' }, 400);
    const ip = context.ip;
    const limit = await reserveLoginAttempt(ip);
    if (!limit.allowed) return json({ success: false, error: `Too many failed login attempts. Please wait ${limit.waitSeconds} seconds.` }, 429, { 'Retry-After': String(limit.waitSeconds) });
    const email = body.email.trim().toLowerCase();
    if (!credentialsMatch(email, body.password)) return json({ success: false, error: 'Invalid credentials.' }, 401);
    const session = await createAdminSession(email);
    await recordSuccessfulLogin(ip);
    return json({ success: true, user: email, ...session });
  } catch (error) {
    reportApiFailure('admin', error);
    return json({ success: false, error: 'Authentication storage is unavailable. Please retry or check the database configuration.' }, 503);
  }
};
