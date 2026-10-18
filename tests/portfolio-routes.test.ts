import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { initialPortfolioContent } from '../src/content/portfolioData';
import type { PortfolioStoreState } from '../server/types';
let state: PortfolioStoreState;
let authorized = true;
let failSave = false;
const files = new Map<string, ArrayBuffer>();
mock.module('../server/deployedAuthService.ts', { namedExports: { verifyAdminToken: async () => ({ valid: authorized }) } });
mock.module('../server/deployedPortfolioStore.ts', { namedExports: {
  getPortfolioStore: async () => structuredClone(state),
  savePortfolioStore: async (next: PortfolioStoreState) => { if (failSave) throw new Error('offline'); state = structuredClone(next); },
} });
mock.module('@netlify/blobs', { namedExports: { getStore: () => ({
  set: async (key: string, bytes: ArrayBuffer) => { files.set(key, bytes); },
  get: async (key: string) => files.get(key) || null,
  delete: async (key: string) => { files.delete(key); },
}) } });
const { default: save } = await import('../netlify/functions/save.mts');
const { default: photo } = await import('../netlify/functions/photo.mts');
const { default: resume } = await import('../netlify/functions/resume.mts');
const { decodeUpload } = await import('../server/portfolioAssets');
const { getResumeFileUrl } = await import('../src/utils/resumeManager');
function reset() {
  state = { version: 1, lastUpdated: '', content: structuredClone(initialPortfolioContent), syncedRepositories: {}, manualOverrides: {} };
  state.content.profile.photo.url = '/images/profile-photo.png';
  authorized = true;
  failSave = false;
  files.clear();
}
function req(path: string, body?: unknown, method = 'POST') {
  return new Request(`https://example.test/api/portfolio/${path}`, { method, ...(method === 'GET' ? {} : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }) });
}
test('portfolio save persists content and preserves sync metadata', async () => {
  reset();
  const content = structuredClone(state.content);
  content.profile.headline = 'Updated headline';
  const response = await save(req('save', { content }));
  assert.equal(response.status, 200);
  assert.equal(state.content.profile.headline, 'Updated headline');
  assert.deepEqual(state.syncedRepositories, {});
});
test('save rejects unauthorized, incomplete, unsafe and malformed requests', async () => {
  reset(); authorized = false;
  assert.equal((await save(req('save', { content: state.content }))).status, 401);
  authorized = true;
  assert.equal((await save(req('save', { content: {} }))).status, 400);
  const content = structuredClone(state.content);
  content.profile.photo.url = 'javascript:alert(1)';
  assert.equal((await save(req('save', { content }))).status, 400);
  assert.equal((await save(new Request('https://example.test/api/portfolio/save', { method: 'POST', body: '<html>' }))).status, 400);
  assert.equal((await save(req('save', undefined, 'GET'))).status, 405);
});
test('save storage failure returns JSON and does not alter persisted content', async () => {
  reset(); failSave = true;
  const content = structuredClone(state.content); content.profile.headline = 'Unsaved';
  const response = await save(req('save', { content }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).success, false);
  assert.notEqual(state.content.profile.headline, 'Unsaved');
});
test('legacy photo URL redirects to the published portrait', async () => {
  reset();
  const response = await photo(req('photo', undefined, 'GET'));
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://example.test/images/profile-photo.png');
});
test('PDF upload, byte delivery, reset, rollback and version deletion remain functional', async () => {
  reset();
  const bytes = Buffer.from('%PDF-1.7\nexample document');
  const response = await resume(req('resume', { dataUri: `data:application/pdf;base64,${bytes.toString('base64')}`, fileName: 'cv.pdf' }));
  assert.equal(response.status, 200);
  const uploaded = (await response.json()).resume;
  const url = uploaded.fileUrl;
  assert.equal(files.size, 1);
  const file = await resume(new Request(`https://example.test${url}`));
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), bytes);
  const versionId = uploaded.versions[0].id;
  assert.equal((await resume(req(`resume/version/${versionId}`, undefined, 'DELETE'))).status, 400);
  assert.equal((await resume(req('resume', { reset: true }))).status, 200);
  assert.equal(state.content.profile.resume.fileUrl, '#resume-view');
  assert.equal((await resume(req('resume/rollback', { versionId }))).status, 200);
  assert.equal(state.content.profile.resume.fileUrl, url);
  await resume(req('resume', { reset: true }));
  assert.equal((await resume(req(`resume/version/${versionId}`, undefined, 'DELETE'))).status, 200);
  assert.equal(files.size, 0);
});
test('portrait upload serves validated image bytes and supports external URLs', async () => {
  reset();
  const bytes = Buffer.from([137,80,78,71,13,10,26,10,0]);
  const response = await photo(req('photo', { dataUri: `data:image/png;base64,${bytes.toString('base64')}` }));
  assert.equal(response.status, 200);
  const uploaded = (await response.json()).photo;
  const file = await photo(new Request(`https://example.test${uploaded.url}`));
  assert.equal(file.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), bytes);
  assert.equal((await photo(req('photo', { imageUrl: 'https://example.test/portrait.png' }))).status, 200);
  assert.equal(state.content.profile.photo.url, 'https://example.test/portrait.png');
});
test('asset writes require authentication and reject invalid files and unsafe URLs', async () => {
  reset(); authorized = false;
  assert.equal((await resume(req('resume', { reset: true }))).status, 401);
  assert.equal((await photo(req('photo', { reset: true }))).status, 401);
  authorized = true;
  assert.equal((await resume(req('resume', { dataUri: 'data:application/pdf;base64,PGh0bWw+' }))).status, 400);
  assert.equal((await photo(req('photo', { dataUri: 'data:image/svg+xml;base64,PHN2Zz4=' }))).status, 400);
  assert.equal((await photo(req('photo', { imageUrl: '/api/portfolio/photo' }))).status, 400);
  assert.equal((await resume(req('resume', { fileUrl: 'javascript:alert(1)' }))).status, 400);
  assert.equal((await resume(req('resume', null))).status, 400);
  assert.equal(files.size, 0);
});
test('upload size validation and external resume download links stay consistent', () => {
  assert.throws(() => decodeUpload(`data:application/pdf;base64,${Buffer.alloc(4 * 1024 * 1024 + 1).toString('base64')}`, 'resume'), /4 MB/);
  reset(); state.content.profile.resume.fileUrl = 'https://example.test/cv.pdf';
  assert.equal(getResumeFileUrl(state.content), 'https://example.test/cv.pdf');
});
