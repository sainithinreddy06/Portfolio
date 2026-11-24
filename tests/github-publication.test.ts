import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { createHmac } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { initialPortfolioContent } from '../src/content/portfolioData.ts';

function repository(id: number, name: string, visibility?: string) {
  return { id, name, visibility, private: visibility === 'private', owner: { login: 'owner' },
    html_url: `https://github.com/owner/${name}`, description: 'Fixture description', size: 10, fork: false };
}

test('public HTTP reads, admin sync, and visibility changes share one publication policy', { timeout: 30000 }, async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-publication-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'data'));
  const content = structuredClone(initialPortfolioContent);
  content.projects[0].repositoryId = 202;
  content.projects[0].description = 'Stale imported description';
  const legacy = { ...content.projects[0], id: 'withheld-card', repositoryId: 101,
    name: 'Withheld legacy title', caseStudySlug: 'withheld-study' };
  content.projects.push(legacy);
  content.caseStudies['withheld-study'] = { ...Object.values(content.caseStudies)[0], title: legacy.name };
  const seed = { content, lastUpdated: '2025-01-01', syncedRepositories: { 101: { repoId: 101, name: legacy.name } } };
  const storePath = path.join(dir, 'data/syncedPortfolio.json');
  await writeFile(storePath, JSON.stringify(seed));
  await writeFile(path.join(dir, 'data/githubProjectsCache.json'), JSON.stringify({ projects: [legacy] }));
  const open = repository(51, 'open-library', 'public');
  const restricted = repository(52, 'restricted', 'private');
  const internal = repository(53, 'internal', 'internal');
  const unknown = repository(54, 'unknown');
  const changed = repository(55, 'changed', 'public');
  const list = [open, restricted, internal, unknown, changed];
  const details = { [open.name]: open, [changed.name]: { ...changed, visibility: 'private', private: true } };
  async function configure(listing: typeof list, hold?: string) {
    await writeFile(path.join(dir, 'github.json'), JSON.stringify({ list: listing, details, hold }));
  }
  await configure([], '/users/owner/repos');
  const log = () => readFile(path.join(dir, 'requests.log'), 'utf8');
  await writeFile(path.join(dir, 'hold-initial-read'), '');
  const child = fork(new URL('./fixtures/publication-server.mjs', import.meta.url), ['--production', '--port', '0'], {
    cwd: dir, execArgv: ['--import', import.meta.resolve('tsx')], silent: true,
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, NODE_ENV: 'production',
      ADMIN_EMAIL: 'editor@example.invalid', ADMIN_PASSWORD: 'disposable-password',
      GITHUB_WEBHOOK_SECRET: 'fixture-key', GITHUB_USERNAME: 'owner', GITHUB_TOKEN: 'fixture-token',
      SUPABASE_URL: 'https://storage.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture-role' },
  });
  child.stdout?.resume();
  child.stderr?.resume();
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exit = once(child, 'exit');
      child.kill('SIGKILL');
      await exit;
    }
  });
  const [{ port }] = await once(child, 'message');
  const get = (url: string, headers?: Record<string, string>) => fetch(`http://127.0.0.1:${port}${url}`, { headers });
  const post = (url: string, body: object, headers: Record<string, string> = {}) =>
    fetch(`http://127.0.0.1:${port}${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const snapshot = async () => (await get('/api/portfolio')).json();
  const waitFor = async (predicate: () => Promise<boolean>) => {
    for (let i = 0; i < 300; i++) {
      if (await predicate()) return;
      await delay(10);
    }
    assert.fail('fixture operation did not finish');
  };
  const release = () => writeFile(path.join(dir, 'release'), '');
  const hook = (action: string, repo: typeof open) => {
    const body = { action, repository: repo };
    const signature = createHmac('sha256', 'fixture-key').update(JSON.stringify(body)).digest('hex');
    return post('/api/github/webhook', body, { 'x-github-event': 'repository', 'x-hub-signature-256': 'sha256=' + signature });
  };

  assert.equal((await get('/api/health')).status, 200);
  assert.equal((await get('/api/ready')).status, 503);
  assert.equal((await get('/api/admin/verify')).status, 401);
  await rm(path.join(dir, 'hold-initial-read'));
  await waitFor(async () => (await log()).includes('/users/owner/repos'));
  assert.deepEqual(await (await get('/api/ready')).json(), { readyForReads: true, storage: 'durable' });
  const login = await (await post('/api/admin/login', { email: 'editor@example.invalid', password: 'disposable-password' })).json();
  assert.ok(login.token);
  const auth = { Authorization: 'Bearer ' + login.token };
  const initialRequests = await log();
  const initialState = await readFile(storePath, 'utf8');
  for (const headers of [undefined, auth]) {
    for (const url of ['/api/projects', '/api/github/projects', '/api/projects?refresh=true', '/api/github/projects?refresh=true', '/api/portfolio']) {
      const response = await get(url, headers);
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.ok((data.projects ?? data.content.projects).some((p: {id: string}) => p.id === 'pravaah'));
      assert.doesNotMatch(JSON.stringify(data), /Withheld legacy title|withheld-study|Stale imported description/);
    }
  }
  assert.equal(await log(), initialRequests);
  assert.equal(await readFile(storePath, 'utf8'), initialState);
  assert.equal((await get('/api/admin/portfolio')).status, 401);
  assert.equal((await get('/api/github/status')).status, 401);
  assert.equal((await post('/api/github/sync', {})).status, 401);
  assert.match(await (await get('/api/admin/portfolio', auth)).text(), /Withheld legacy title/);

  await release();
  await waitFor(async () => !!(await (await get('/api/github/status', auth)).json()).diagnostics.lastSyncedAt);
  await configure(list);
  assert.equal((await post('/api/github/sync', {}, auth)).status, 200);
  let view = await snapshot();
  assert.deepEqual(Object.keys(view.syncedRepositories), ['51']);
  assert.ok(view.content.projects.some((p: {repositoryId: number}) => p.repositoryId === 51));
  const requests = await log();
  assert.doesNotMatch(requests, /"\/user\/repos"|\/owner\/(restricted|internal|unknown)/);
  assert.doesNotMatch(requests, /changed\/languages|raw.githubusercontent.com","\/owner\/changed/);

  // An older scan must not restore a card revoked while enrichment is pending.
  await rm(path.join(dir, 'release'));
  const beforeRace = (await log()).length;
  await configure([open], '/repos/owner/open-library/languages');
  const refreshing = post('/api/github/sync', {}, auth);
  await waitFor(async () => (await log()).slice(beforeRace).includes('/repos/owner/open-library/languages'));
  assert.equal((await hook('privatized', { ...open, private: true, visibility: 'private' })).status, 200);
  assert.doesNotMatch(JSON.stringify(await snapshot()), /open-library/);
  await release();
  assert.equal((await refreshing).status, 200);
  assert.doesNotMatch(JSON.stringify(await snapshot()), /open-library/);
  assert.doesNotMatch(await (await get('/api/github/status', auth)).text(), /open-library/);

  // Legacy editor versions can omit the server's provenance when saving a card.
  // A legitimate edit must retain its repository identity and stay withheld.
  const archive = (await (await get('/api/admin/portfolio', auth)).json()).content;
  const edited = archive.projects.find((p: {repositoryId?: number}) => p.repositoryId === open.id);
  assert.ok(edited);
  delete edited.repositoryId;
  edited.source = 'manual';
  edited.description = 'Private editor draft';
  assert.equal((await post('/api/portfolio/save', { content: archive }, auth)).status, 200);
  assert.doesNotMatch(JSON.stringify(await snapshot()), /Private editor draft/);
  const saved = (await (await get('/api/admin/portfolio', auth)).json()).content.projects;
  assert.equal(saved.find((p: {description: string}) => p.description === 'Private editor draft').repositoryId, open.id);

  await configure([open]);
  assert.equal((await hook('publicized', open)).status, 200);
  assert.ok((await snapshot()).syncedRepositories['51']);
  // A missed webhook is covered by a successful full scan, including zero rows.
  await configure([]);
  assert.equal((await post('/api/github/sync', {}, auth)).status, 200);
  view = await snapshot();
  assert.deepEqual(Object.keys(view.syncedRepositories), []);
  assert.doesNotMatch(JSON.stringify(view.content), /open-library|Withheld legacy title/);
  assert.match(await (await get('/api/admin/portfolio', auth)).text(), /open-library/);

  await t.test('durable write failures leave published content and assets intact', async () => {
    const archive = async () => (await (await get('/api/admin/portfolio', auth)).json());
    const before = await archive();
    const changed = structuredClone(before.content);
    changed.profile.positioning += ' test edit';
    await writeFile(path.join(dir, 'save-fail'), '');
    const failed = await post('/api/portfolio/save', { content: changed, lastUpdated: before.lastUpdated }, auth);
    assert.equal(failed.status, 503);
    assert.deepEqual(await archive(), before);
    const upload = { fileName: 'test.pdf', dataUri: Buffer.from('%PDF-1.4 fixture').toString('base64') };
    assert.equal((await post('/api/portfolio/resume', upload, auth)).status, 503);
    assert.deepEqual(await archive(), before);
    await rm(path.join(dir, 'save-fail'));
    await writeFile(path.join(dir, 'asset-fail'), '');
    assert.equal((await post('/api/portfolio/resume', upload, auth)).status, 503);
    assert.deepEqual(await archive(), before);
    assert.equal(await readFile(storePath, 'utf8'), initialState);
    await rm(path.join(dir, 'asset-fail'));
    const first = await (await post('/api/portfolio/resume', upload, auth)).json();
    const second = await (await post('/api/portfolio/resume', upload, auth)).json();
    assert.ok(first.version.id !== second.version.id);
    assert.equal((await post('/api/portfolio/resume/rollback', { versionId: first.version.id }, auth)).status, 200);
    const served = await fetch(`http://127.0.0.1:${port}/resume.pdf`, { redirect: 'manual' });
    assert.equal(served.headers.get('location'), first.version.fileUrl);
    assert.equal((await snapshot()).content.profile.resume.versions, undefined);
    assert.equal((await post('/api/portfolio/save', { content: changed, lastUpdated: before.lastUpdated }, auth)).status, 409);
    assert.equal((await post('/api/portfolio/photo', { imageUrl: '//example.invalid' }, auth)).status, 400);
  });

  await t.test('protected routes, request limits, CORS and revocation', async () => {
    for (const route of ['/api/portfolio/photo', '/api/portfolio/resume', '/api/resume/parse',
      '/api/portfolio/reset', '/api/resume/apply', '/api/portfolio/save', '/api/portfolio/photo/rollback',
      '/api/portfolio/resume/rollback']) assert.equal((await post(route, {})).status, 401, route);
    assert.equal((await post('/api/resume/parse', { pdfBase64: 'AAAA' }, auth)).status, 400);
    assert.equal((await post('/api/admin/login', { value: 'x'.repeat(1024 * 1024) })).status, 413);
    const cors = await get('/api/portfolio', { Origin: 'http://localhost:3000' });
    assert.equal(cors.headers.has('access-control-allow-origin'), false);
    assert.match(cors.headers.get('vary')!, /Origin/);
    assert.ok(cors.headers.get('content-security-policy'));
    assert.equal((await post('/api/admin/logout', {}, auth)).status, 200);
    assert.equal((await get('/api/admin/verify', auth)).status, 401);
    for (let i = 0; i < 5; i++) assert.equal((await post('/api/admin/login', { email: 'editor@example.invalid', password: 'incorrect' })).status, 401);
    assert.equal((await post('/api/admin/login', { email: 'editor@example.invalid', password: 'incorrect' })).status, 429);
  });
});
