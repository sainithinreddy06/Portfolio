import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('degraded reads recover without an edit and concurrent recovery uses one database request', async t => {
  const cwd = process.cwd();
  const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-recovery-'));
  process.chdir(dir);
  t.after(async () => { process.chdir(cwd); await rm(dir, { recursive: true, force: true }); });
  await mkdir('data');
  const { initialPortfolioContent } = await import('../src/content/portfolioData.ts');
  await writeFile('data/portfolio-runtime.json', JSON.stringify({ content: initialPortfolioContent }));
  const store = await import('../server/portfolioStore.ts');
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  await store.initializePortfolioStore();
  assert.equal(store.storageStatus(), 'degraded');
  await assert.rejects(store.savePortfolioStore(store.draftPortfolioStore()), { status: 503 });
  const stale = store.draftPortfolioStore();
  process.env.SUPABASE_URL = 'https://storage.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-role';
  let online = false;
  const reads = t.mock.method(globalThis, 'fetch', async () => online
    ? Response.json([{ state: { ...stale, lastUpdated: '2025-02-01' }, updated_at: '2025-02-01' }])
    : new Response(null, { status: 503 }));
  await store.initializePortfolioStore();
  assert.equal(store.storageStatus(), 'degraded');
  online = true;
  await Promise.all([store.initializePortfolioStore(), store.initializePortfolioStore()]);
  assert.equal(reads.mock.callCount(), 2);
  assert.equal(store.storageStatus(), 'durable');
  assert.equal(store.getPortfolioStore().lastUpdated, '2025-02-01');
  await assert.rejects(store.savePortfolioStore(stale), { status: 409 });
  await store.initializePortfolioStore();
  assert.equal(reads.mock.callCount(), 2);
});
