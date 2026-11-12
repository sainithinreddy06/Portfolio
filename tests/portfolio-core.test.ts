import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { isSafeAssetUrl, isPortfolioContent } from '../server/portfolioValidation.ts';
import { verifyGitHubSignature, parseReadmeContent } from '../server/githubService.ts';
import { initialPortfolioContent } from '../src/content/portfolioData.ts';

test('asset URLs reject script schemes and protocol-relative URLs', () => {
  assert.equal(isSafeAssetUrl('https://example.com/cv.pdf'), true);
  assert.equal(isSafeAssetUrl('/resume.pdf'), true);
  assert.equal(isSafeAssetUrl('javascript:alert(1)'), false);
  assert.equal(isSafeAssetUrl('//evil.example/file'), false);
  assert.equal(isSafeAssetUrl('data:text/html,hi'), false);
});

test('portfolio content validator accepts curated content and rejects unsafe asset URLs', () => {
  const content = structuredClone(initialPortfolioContent);
  assert.equal(isPortfolioContent(content), true);
  content.profile.photo.url = 'javascript:alert(1)';
  assert.equal(isPortfolioContent(content), false);
});

test('portfolio profile accepts editable academic year and validates CGPA on a 10-point scale', () => {
  const content = structuredClone(initialPortfolioContent);
  content.profile.currentYear = 'Fourth Year';
  content.profile.cgpa = 9.25;
  assert.equal(isPortfolioContent(content), true);
  content.profile.cgpa = 10.5;
  assert.equal(isPortfolioContent(content), false);
  content.profile.cgpa = -0.1;
  assert.equal(isPortfolioContent(content), false);
});

test('GitHub webhook signature verification requires a valid HMAC', () => {
  const secret = 'test-webhook-secret';
  const body = Buffer.from('{"action":"opened"}');
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifyGitHubSignature(body, `sha256=${digest}`, secret), true);
  assert.equal(verifyGitHubSignature(body, 'sha256=bad', secret), false);
  assert.equal(verifyGitHubSignature(body, `sha256=${digest}`, undefined), false);
});

test('README discovery recognizes Render deployments', () => {
  const result = parseReadmeContent('Project description with enough detail to be considered an overview.\n\nLive demo: https://sample-project.onrender.com');
  assert.equal(result.discoveredLiveUrl, 'https://sample-project.onrender.com');
});
