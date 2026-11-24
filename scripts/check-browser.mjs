// Run against the compiled app with disposable state and offline service fixtures.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const resolveTool = createRequire(path.resolve(process.env.BROWSER_TOOLS || '.', 'package.json')).resolve;
const { default: puppeteer } = await import(pathToFileURL(resolveTool('puppeteer-core')));
const { default: lighthouse } = await import(pathToFileURL(resolveTool('lighthouse')));
const axe = await readFile(resolveTool('axe-core/axe.min.js'), 'utf8');
async function checkAccessibility(page, description) {
  await page.evaluate(axe);
  const issues = await page.evaluate(async () => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
    return result.violations.map(v => ({ id: v.id, count: v.nodes.length, examples: v.nodes.slice(0, 3).map(n => n.html) }));
  });
  assert.deepEqual(issues, [], description);
}

const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-browser-'));
let app, browser;
try {
  await mkdir(path.join(dir, 'data'));
  await cp('data/syncedPortfolio.json', path.join(dir, 'data/syncedPortfolio.json'));
  await cp('public', path.join(dir, 'public'), { recursive: true });
  await writeFile(path.join(dir, 'github.json'), '{"list":[],"details":{}}');
  app = fork(new URL('../tests/fixtures/publication-server.mjs', import.meta.url), ['--production', '--built', '--port', '0'], {
    cwd: dir, env: { NODE_ENV: 'production', PATH: process.env.PATH, GITHUB_USERNAME: 'owner', ADMIN_EMAIL: 'editor@example.invalid', ADMIN_PASSWORD: 'fixture-password' }, execArgv: [], silent: true,
  });
  app.stdout.resume();
  app.stderr.pipe(process.stderr);
  const [{ port }] = await once(app, 'message', { signal: AbortSignal.timeout(15000) });
  const origin = 'http://127.0.0.1:' + port;
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    args: JSON.parse(process.env.CHROME_FLAGS || '["--no-sandbox"]'),
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', req => req.url().startsWith(origin + '/') || req.url().startsWith('data:') ? req.continue() : req.abort());
  for (const theme of ['light', 'dark']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    for (const [route, width] of [['/', 390], ['/', 1365], ['/work/pravaah', 390], ['/admin', 390], ['/missing', 390]]) {
      await page.setViewport({ width, height: 820 });
      const navigation = await page.goto(origin + route, { waitUntil: 'networkidle2' });
      assert.equal(navigation.status(), route === '/missing' ? 404 : 200);
      await page.waitForSelector('main h1');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow at ' + route);
      if (route === '/admin') {
        assert.equal(navigation.headers()['x-robots-tag'], 'noindex, nofollow');
        assert.match(await page.title(), /Portfolio Admin/);
      }
      if (route === '/missing') assert.match(await page.title(), /Page Not Found/);
      await checkAccessibility(page, [theme, width, route].join(' '));
      if (route === '/') {
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '#main-content');
        await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');
        assert.ok(await page.$eval('picture img', img => img.naturalWidth && img.currentSrc.endsWith('.webp')));
        await page.keyboard.down('Control');
        await page.keyboard.press('k');
        await page.keyboard.up('Control');
        await page.waitForSelector('[aria-label="Command Palette"]');
        await page.focus('[aria-label="Close command palette"]');
        await page.keyboard.press('Enter');
        await page.waitForSelector('[aria-label="Command Palette"]', { hidden: true });
        const index = '[aria-label="Open index menu"]';
        await page.click(index);
        await page.waitForSelector('[aria-label="Site Index Navigation"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('k');
        await page.keyboard.up('Control');
        assert.equal(await page.$$eval('[aria-modal="true"]', nodes => nodes.length), 1);
        await page.keyboard.press('Escape');
        await page.waitForFunction(selector => document.activeElement.matches(selector), {}, index);
        const email = await page.$eval('#contact a[href^="mailto:"]', link => link.getAttribute('href'));
        assert.match(email, /^mailto:[^@\s]+@[^@\s]+$/);
      }
      console.log(theme, width, route, 'passed');
    }
  }
  const sitemap = await (await fetch(origin + '/sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
  const home = urls.find(url => url.pathname === '/');
  assert.ok(home);
  const studies = urls.filter(url => url.pathname.startsWith('/work/'));
  assert.ok(studies.length);
  for (const url of studies) {
    const response = await page.goto(origin + url.pathname, { waitUntil: 'networkidle2' });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.title.endsWith('| Sai Nithin Reddy'));
    assert.equal(await page.$eval('link[rel="canonical"]', el => el.href), url.href);
    assert.equal(await page.$eval('meta[property="og:url"]', el => el.content), url.href);
    assert.equal(await page.$$eval('main [aria-modal="true"]', nodes => nodes.length), 0);
    await page.click('main a[href="/"]');
    await page.waitForSelector('picture img');
    assert.equal(await page.$eval('link[rel="canonical"]', el => el.href), home.href);
    assert.equal(await page.$eval('meta[property="og:url"]', el => el.content), home.href);
  }
  assert.equal(await page.$$eval('meta[property="og:image:width"]', nodes => nodes.length), 1);
  const preview = new URL(await page.$eval('meta[property="og:image"]', el => el.content));
  const previewResponse = await fetch(origin + preview.pathname);
  assert.equal(previewResponse.status, 200);
  const png = Buffer.from(await previewResponse.arrayBuffer());
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
  console.log(studies.length, 'sitemap case studies, return navigation and social preview passed');
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(origin + '/admin', { waitUntil: 'networkidle2' });
  await page.type('#admin-email', 'editor@example.invalid');
  await page.type('#admin-password', 'fixture-password');
  const editor = page.waitForResponse(r => r.url() === origin + '/api/admin/portfolio' && r.status() === 200);
  await page.click('button[type=submit]');
  await editor;
  await page.waitForSelector('a[href="/resume.pdf"]');
  await checkAccessibility(page, 'Authenticated resume editor');
  console.log('Authenticated resume editor passed');
  assert.deepEqual(errors, []);
  const { lhr } = await lighthouse(origin, {
    port: Number(new URL(browser.wsEndpoint()).port), onlyCategories: ['performance', 'seo'],
    logLevel: 'error',
  });
  assert.equal(lhr.runtimeError, undefined, lhr.runtimeError?.message);
  const audits = lhr.audits;
  const externalTypography = audits['network-requests'].details.items.filter(item =>
    ['Font', 'Stylesheet'].includes(item.resourceType) && new URL(item.url).origin !== origin);
  assert.deepEqual(externalTypography.map(item => item.url), [], 'External font or stylesheet on homepage');
  console.log('Mobile Lighthouse', Object.fromEntries(['largest-contentful-paint', 'first-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'total-byte-weight'].map(k => [k, audits[k].numericValue])));
  console.log('Homepage requests', audits['network-requests'].details.items.length);
  assert.ok(audits['total-byte-weight'].numericValue < 450000, 'Homepage transfer exceeded 450 kB');
  assert.equal(audits['document-title'].score, 1);
} finally {
  await browser?.close();
  if (app && app.exitCode === null && app.signalCode === null) {
    const exited = once(app, 'exit');
    app.kill('SIGKILL');
    await exited;
  }
  await rm(dir, { recursive: true, force: true });
}
