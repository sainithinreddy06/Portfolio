import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Isolate the database transport; no production credentials or database writes.
let stored: any[] = [];
let unavailable = false;
const database = {
  insert: () => ({ values: (value: any) => { if (unavailable) throw new Error('offline'); stored.push(value); return Promise.resolve(); } }),
  select: () => ({ from: () => ({ where: () => { if (unavailable) throw new Error('offline'); return Promise.resolve(stored); } }) }),
  delete: () => ({ where: () => { stored = []; return Promise.resolve(); } }),
};
mock.module('../db/index.ts', { namedExports: { getDb: () => database } });
const configuration: Record<string, string> = {
  ADMIN_EMAIL: 'admin@example.test', ADMIN_PASSWORD: crypto.randomBytes(20).toString('hex'), SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
};
mock.module('../server/runtimeEnv.ts', { namedExports: { env: (key: string) => configuration[key] } });
const auth = await import('../server/deployedAuthService');
const { default: admin } = await import('../netlify/functions/admin.mts');
const { handler: sync } = await import('../netlify/functions/sync');
const { readApiJson } = await import('../src/services/apiResponse');
const { default: missing } = await import('../netlify/functions/api-not-found.mts');
const context = { ip: '192.0.2.1' } as any;

test('signed sessions survive repeated verification, reject tampering, and revoke on logout', async () => {
  stored = [];
  const { token } = await auth.createAdminSession(configuration.ADMIN_EMAIL);
  assert.equal((await auth.verifyAdminToken(token)).valid, true);
  assert.equal((await auth.verifyAdminToken(token)).valid, true);
  assert.equal((await auth.verifyAdminToken(token + 'changed')).valid, false);
  assert.equal((await auth.verifyAdminToken('bad.token')).valid, false);
  await auth.revokeAdminSession(token);
  assert.equal((await auth.verifyAdminToken(token)).valid, false);
});
test('valid signature cannot bypass expiry or server-side session registration', async () => {
  stored = [];
  const payload = Buffer.from(JSON.stringify({ user: configuration.ADMIN_EMAIL, exp: Date.now() - 1 })).toString('base64url');
  const token = `${payload}.${crypto.createHmac('sha256', configuration.SESSION_SECRET).update(payload).digest('base64url')}`;
  assert.equal((await auth.verifyAdminToken(token)).valid, false);
  const session = await auth.createAdminSession(configuration.ADMIN_EMAIL);
  stored = [];
  assert.equal((await auth.verifyAdminToken(session.token)).valid, false);
});
test('credentials use configured owner and password; missing signing key fails closed', () => {
  assert.equal(auth.credentialsMatch(configuration.ADMIN_EMAIL, configuration.ADMIN_PASSWORD), true);
  assert.equal(auth.credentialsMatch('other@example.test', configuration.ADMIN_PASSWORD), false);
  assert.equal(auth.credentialsMatch(configuration.ADMIN_EMAIL, 'incorrect'), false);
  const secret = configuration.SESSION_SECRET;
  delete configuration.SESSION_SECRET;
  assert.equal(auth.isAuthConfigured(), false);
  configuration.SESSION_SECRET = secret;
});
test('admin routes return JSON for malformed input, unsupported methods, and invalid sessions', async () => {
  for (const [action, method, body, status] of [
    ['login', 'POST', '<bad>', 400], ['login', 'POST', 'null', 400],
    ['login', 'POST', '{"email":42,"password":{}}', 400], ['login', 'GET', undefined, 405],
    ['verify', 'GET', undefined, 401], ['unknown', 'POST', '{}', 404],
  ] as const) {
    const response = await admin(new Request(`https://example.test/api/admin/${action}`, { method, body }), context);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).success, false);
  }
});
test('storage outages return JSON 503 without exception details', async () => {
  const { token } = await auth.createAdminSession(configuration.ADMIN_EMAIL);
  unavailable = true;
  const response = await admin(new Request('https://example.test/api/admin/verify', { headers: { Authorization: `Bearer ${token}` } }), context);
  unavailable = false;
  assert.equal(response.status, 503);
  assert.equal(JSON.stringify(await response.json()).includes('offline'), false);
});
test('sync rejects unauthenticated requests and unsupported methods as JSON', async () => {
  for (const [method, status] of [['POST', 401], ['GET', 405]] as const) {
    const response = await sync({ body: '{}', headers: {}, queryStringParameters: null, httpMethod: method });
    assert.equal(response.statusCode, status);
    assert.equal(JSON.parse(response.body).success, false);
  }
});
test('unknown API endpoints produce JSON 404', async () => {
  const response = await missing();
  assert.equal(response.status, 404);
  assert.equal((await response.json()).success, false);
});
test('frontend reports HTML errors safely and preserves meaningful JSON', async () => {
  await assert.rejects(readApiJson(new Response('<html>error</html>', { status: 502, headers: { 'content-type': 'text/html' } })), /HTTP 502/);
  assert.deepEqual(await readApiJson(Response.json({ success: false, error: 'Rate limited.' }, { status: 429 })), { success: false, error: 'Rate limited.' });
});

test('authenticated sync rejects malformed JSON and other GitHub owners', async () => {
  stored = [];
  const { token } = await auth.createAdminSession(configuration.ADMIN_EMAIL);
  for (const body of ['<bad>', '{"username":"another-owner"}']) {
    const response = await sync({ body, headers: { authorization: `Bearer ${token}` }, queryStringParameters: null, httpMethod: 'POST' });
    assert.equal(response.statusCode, 400);
    assert.equal(JSON.parse(response.body).success, false);
  }
});
test('forced sync reports upstream GitHub failures instead of saving empty success', async () => {
  const github = await import('../server/githubService');
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 401 }));
  try {
    await assert.rejects(github.syncAllPortfolioRepositories('example-owner', true), { code: 'GITHUB_DISCOVERY_FAILED' });
  } finally { fetchMock.mock.restore(); }
});
