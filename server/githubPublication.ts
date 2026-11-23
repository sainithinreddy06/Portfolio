import { initialPortfolioContent } from '../src/content/portfolioData';
import type { ProjectItem } from '../src/content/types';
import {
  discoverPublicProjects, fetchRepositoryData, getGitHubDiagnostics,
  type ExtractedGitHubProject,
} from './githubService';
import { getPortfolioStore, syncGitHubProjects } from './portfolioStore';

// A restart requires fresh evidence. Cap the lifetime of a successful check
// as well, in case both webhook delivery and the next scheduled scan fail.
const verificationLifetime = 60 * 60 * 1000;
const verified = new Map<number, { project: ExtractedGitHubProject; checkedAt: number }>();
let lastScan: string | null = null;
let pendingScan: Promise<ExtractedGitHubProject[]> | undefined;
let revision = 0;
let completedScanRevision = 0;
const latestEvent = new Map<number, number>();

function isVerified(id: number, now: number): boolean {
  const entry = verified.get(id);
  return !!entry && now - entry.checkedAt < verificationLifetime;
}

export function publicationDiagnostics() {
  const now = Date.now();
  const projects = [...verified.values()].filter(entry => isVerified(entry.project.repoId, now));
  return getGitHubDiagnostics(projects.map(entry => entry.project), lastScan);
}

async function scan(owner: string): Promise<ExtractedGitHubProject[]> {
  const started = Date.now();
  const scanRevision = ++revision;
  const projects = await discoverPublicProjects(owner);
  // Later events win, including a revocation received during enrichment.
  const untouched = (id: number) => (latestEvent.get(id) ?? 0) <= scanRevision;
  const current = projects.filter(project => untouched(project.repoId));
  for (const id of verified.keys()) {
    if (untouched(id)) verified.delete(id);
  }
  if (current.length) syncGitHubProjects(current);
  for (const project of current) verified.set(project.repoId, { project, checkedAt: started });
  completedScanRevision = scanRevision;
  lastScan = new Date().toISOString();
  return current;
}

export function refreshPublication(owner: string) {
  pendingScan ??= scan(owner).finally(() => { pendingScan = undefined; });
  return pendingScan;
}

export async function applyRepositoryEvent(owner: string, id: number, name: string, withdrawn: boolean) {
  const eventRevision = ++revision;
  latestEvent.set(id, eventRevision);
  if (withdrawn) {
    verified.delete(id);
    return null;
  }
  const started = Date.now();
  const project = await fetchRepositoryData(owner, name, id);
  if (latestEvent.get(id) !== eventRevision || completedScanRevision > eventRevision) return null;
  if (!project) {
    verified.delete(id);
    return null;
  }
  syncGitHubProjects([project]);
  verified.set(id, { project, checkedAt: started });
  return project;
}

function requiresVerification(project: ProjectItem) {
  return project.repositoryId !== undefined || !!project.lastSyncedAt || !!project.githubRepoName ||
    project.source === 'github' || project.source === 'hybrid';
}

function withheld(project: ProjectItem, now: number) {
  return requiresVerification(project) && !isVerified(project.repositoryId ?? 0, now);
}

export function publicSnapshot() {
  const store = getPortfolioStore();
  const now = Date.now();
  const projects: ProjectItem[] = [];
  const caseStudies = { ...store.content.caseStudies };
  for (const project of store.content.projects) {
    if (!withheld(project, now)) {
      projects.push(project);
      continue;
    }
    // Discard imported fields. A hand-authored case study can stand alone.
    delete caseStudies[project.id];
    if (project.caseStudySlug) delete caseStudies[project.caseStudySlug];
    const original = initialPortfolioContent.projects.find(item => item.id === project.id);
    if (original) {
      projects.push({ ...original, githubUrl: undefined });
      const slug = original.caseStudySlug ?? original.id;
      const study = initialPortfolioContent.caseStudies[slug];
      if (study) caseStudies[slug] = { ...study, repoUrl: undefined };
    }
  }
  // Authored content may exist before the first scan. Show its text, but
  // enable GitHub repository links only with current public evidence.
  const publicUrls = new Set([...verified.values()]
    .filter(entry => isVerified(entry.project.repoId, now))
    .map(entry => entry.project.githubUrl.toLowerCase().replace(/\/$/, '')));
  function allowedLink(url?: string) {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      if (!['github.com', 'www.github.com'].includes(parsed.hostname)) return true;
      const [owner, repo] = parsed.pathname.split('/').filter(Boolean);
      if (!owner || !repo) return true;
      return publicUrls.has(`https://github.com/${owner}/${repo.replace(/\.git$/i, '')}`.toLowerCase());
    } catch { return false; }
  }
  for (const [slug, study] of Object.entries(caseStudies)) {
    if (!allowedLink(study.repoUrl)) caseStudies[slug] = { ...study, repoUrl: undefined };
  }
  const syncedRepositories = Object.fromEntries(Object.entries(store.syncedRepositories)
    .filter(([id]) => isVerified(Number(id), now)));
  const publicProjects = projects.map(project =>
    allowedLink(project.githubUrl) ? project : { ...project, githubUrl: undefined }
  );
  return {
    lastUpdated: store.lastUpdated,
    publicationPending: pendingScan !== undefined,
    content: { ...store.content, projects: publicProjects, caseStudies },
    syncedRepositories,
  };
}
