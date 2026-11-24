import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('sessions expire and an unreadable session archive fails closed', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-session-'));
  const cwd = process.cwd();
  process.chdir(dir);
  process.env.ADMIN_EMAIL = 'editor@example.invalid';
  process.env.ADMIN_PASSWORD = 'fixture-password';
  process.env.SESSION_SECRET = 'test-only-key-for-the-isolated-session-fixture';
  try {
    const { createAdminSession, verifyAdminToken } = await import('../server/authService.ts');
    const { token, expiresAt } = createAdminSession('editor@example.invalid');
    assert.equal(verifyAdminToken(token).valid, true);
    const clock = t.mock.method(Date, 'now', () => expiresAt);
    assert.equal(verifyAdminToken(token).valid, false);
    clock.mock.restore();
    await writeFile('data/admin-sessions.json', '{');
    assert.equal(verifyAdminToken(token).valid, false);
    assert.throws(() => createAdminSession('editor@example.invalid'), /storage/);
  } finally {
    process.chdir(cwd);
    await rm(dir, { recursive: true, force: true });
  }
});
