import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('local uploads switch on commit, survive rollback and keep the active version when a save fails', async () => {
  const cwd = process.cwd();
  const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-local-'));
  const url = process.env.SUPABASE_URL, role = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.chdir(dir);
  try {
    const assets = await import('../server/assetManager.ts');
    const store = await import('../server/portfolioStore.ts');
    const statePath = path.join(dir, 'data/portfolio-runtime.json');
    const first = await assets.saveUploadedResume(Buffer.from('%PDF-first'), 'first.pdf');
    const second = await assets.saveUploadedResume(Buffer.from('%PDF-second'), 'second.pdf');
    assert.equal(await readFile(assets.getActiveResumeFile().filePath!, 'utf8'), '%PDF-second');
    await assets.rollbackResumeVersion(first.version.id);
    assert.equal(await readFile(assets.getActiveResumeFile().filePath!, 'utf8'), '%PDF-first');
    await assets.deleteResumeVersion(second.version.id);
    assert.equal(JSON.parse(await readFile(statePath, 'utf8')).content.profile.resume.versions.length, 1);
    const before = store.getPortfolioStore().lastUpdated;
    const draft = store.draftPortfolioStore();
    await rm(statePath);
    await mkdir(statePath);
    await assert.rejects(store.savePortfolioStore(draft), { status: 503 });
    assert.equal(store.getPortfolioStore().lastUpdated, before);
    assert.equal(await readFile(assets.getActiveResumeFile().filePath!, 'utf8'), '%PDF-first');
  } finally {
    process.chdir(cwd);
    if (url !== undefined) process.env.SUPABASE_URL = url;
    if (role !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = role;
    await rm(dir, { recursive: true, force: true });
  }
});
