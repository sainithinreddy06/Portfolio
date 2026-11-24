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
  if (p.currentYear !== undefined && typeof p.currentYear !== 'string') return false;
  if (p.cgpa !== undefined && p.cgpa !== null && (typeof p.cgpa !== 'number' || !Number.isFinite(p.cgpa) || p.cgpa < 0 || p.cgpa > 10)) return false;
  if (!isSafeAssetUrl(p.photo.url) || !isSafeAssetUrl(p.resume.fileUrl)) return false;
  if (![p.githubUrl, p.linkedinUrl, p.leetcodeUrl].every(url => !url || isSafeAssetUrl(url))) return false;
  if (!value.skillCategories.every((c: any) => typeof c?.title === 'string' && Array.isArray(c.skills) && c.skills.every((s: any) => typeof s?.name === 'string'))) return false;
  if (!value.timeline.every((e: any) => e && ['id','role','organization','period','type'].every(k => typeof e[k] === 'string'))) return false;
  if (!Object.values(value.caseStudies).every((study: any) => study && (!study.repoUrl || isSafeAssetUrl(study.repoUrl)) &&
    ['architectureFlow','technicalDecisions','challenges','lessons','futureWork','stack'].every(key => Array.isArray(study[key])))) return false;
  return value.projects.every((project: any) => project && typeof project.id === 'string' && typeof project.name === 'string' && project.name.trim() && typeof project.description === 'string' && Array.isArray(project.stack) && project.stack.every((s: unknown) => typeof s === 'string') && Array.isArray(project.features) && [project.githubUrl, project.liveUrl].every(url => !url || isSafeAssetUrl(url)));
}
