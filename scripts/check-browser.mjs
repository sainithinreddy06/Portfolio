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
const dir = await mkdtemp(path.join(tmpdir(), 'portfolio-browser-'));
let app, browser;
try {
  await mkdir(path.join(dir, 'data'));
  await cp('data/syncedPortfolio.json', path.join(dir, 'data/syncedPortfolio.json'));
  await cp('public', path.join(dir, 'public'), { recursive: true });
  await writeFile(path.join(dir, 'github.json'), '{"list":[],"details":{}}');
  app = fork(new URL('../tests/fixtures/publication-server.mjs', import.meta.url), ['--production', '--built', '--port', '0'], {
    cwd: dir, env: { NODE_ENV: 'production', PATH: process.env.PATH, GITHUB_USERNAME: 'owner' }, execArgv: [], silent: true,
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
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', req => req.url().startsWith(origin + '/') || req.url().startsWith('data:') ? req.continue() : req.abort());
  for (const theme of ['light', 'dark']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    for (const [route, width] of [['/', 390], ['/', 1365], ['/work/pravaah', 390], ['/admin', 390], ['/missing', 390]]) {
      await page.setViewport({ width, height: 820 });
      await page.goto(origin + route, { waitUntil: 'networkidle2' });
      await page.waitForSelector('main h1');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow at ' + route);
      await page.evaluate(axe);
      const issues = await page.evaluate(async () => {
        const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return result.violations.map(v => ({ id: v.id, count: v.nodes.length, examples: v.nodes.slice(0, 3).map(n => n.html) }));
      });
      assert.deepEqual(issues, [], [theme, width, route].join(' '));
      if (route === '/') {
        assert.ok(await page.$eval('picture img', img => img.naturalWidth && img.currentSrc.endsWith('.webp')));
        await page.keyboard.down('Control');
        await page.keyboard.press('k');
        await page.keyboard.up('Control');
        await page.waitForSelector('[aria-label="Command Palette"]');
        await page.keyboard.press('Escape');
        await page.waitForSelector('[aria-label="Command Palette"]', { hidden: true });
      }
      console.log(theme, width, route, 'passed');
    }
  }
  assert.deepEqual(errors, []);
  const { lhr } = await lighthouse(origin, {
    port: Number(new URL(browser.wsEndpoint()).port), onlyCategories: ['performance', 'seo'],
    blockedUrlPatterns: ['https://fonts.googleapis.com/*', 'https://fonts.gstatic.com/*'], logLevel: 'error',
  });
  assert.equal(lhr.runtimeError, undefined, lhr.runtimeError?.message);
  const audits = lhr.audits;
  console.log('Mobile Lighthouse', Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-byte-weight'].map(k => [k, audits[k].numericValue])));
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
