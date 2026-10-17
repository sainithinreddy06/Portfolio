import type { PortfolioContent } from '../src/content/types';

export function isSafeAssetUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim()) return false;
  if (value === '#resume-view') return true;
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/[\r\n]/.test(value)) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

export function isPortfolioContent(value: any): value is PortfolioContent {
  if (!value || !value.profile || !Array.isArray(value.projects) || !Array.isArray(value.timeline) || !Array.isArray(value.skillCategories) || !value.caseStudies || typeof value.caseStudies !== 'object' || Array.isArray(value.caseStudies)) return false;
  const p = value.profile;
  if (!p.photo || !p.resume || !Array.isArray(p.aboutText) || !p.aboutText.every((s: unknown) => typeof s === 'string')) return false;
  if (!['name','wordmark','positioning','headline','supportingCopy','institution','degree','batchPeriod','email','githubUrl','linkedinUrl','currentLearningDirection'].every(k => typeof p[k] === 'string')) return false;
  if (!isSafeAssetUrl(p.photo.url) || !isSafeAssetUrl(p.resume.fileUrl)) return false;
  return value.projects.every((project: any) => project && typeof project.id === 'string' && typeof project.name === 'string' && project.name.trim() && typeof project.description === 'string' && Array.isArray(project.stack) && project.stack.every((s: unknown) => typeof s === 'string') && Array.isArray(project.features) && [project.githubUrl, project.liveUrl].every(url => !url || isSafeAssetUrl(url)));
}
