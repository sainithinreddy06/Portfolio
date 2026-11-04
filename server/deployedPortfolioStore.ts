import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { portfolio } from '../db/schema.js';
import seed from '../data/syncedPortfolio.json';
import { initialPortfolioContent } from '../src/content/portfolioData';
import { mergeGitHubProject } from './portfolioStore';
import type { PortfolioStoreState, ExtendedProjectItem } from './types';
import type { ExtractedGitHubProject } from './githubService';

export async function getPortfolioStore(): Promise<PortfolioStoreState> {
  let state: PortfolioStoreState;
  try {
    const [row] = await getDb().select().from(portfolio).where(eq(portfolio.id, 'main'));
    state = structuredClone(row?.state ?? seed) as PortfolioStoreState;
  } catch (error) {
    // The public portfolio must remain available even when an optional database
    // connection is not provisioned or temporarily unavailable on the host.
    console.warn('[Portfolio Store] Database unavailable; serving the committed portfolio snapshot.', error);
    state = structuredClone(seed) as PortfolioStoreState;
  }

  // Legacy uploaded files are absent from a static deploy; retain the public portrait.
  if (/^\/api\/portfolio\/photo(?:[?#]|$)/.test(state.content.profile.photo.url || '')) state.content.profile.photo.url = '/images/profile-photo.png';
  state.content.caseStudies = { ...initialPortfolioContent.caseStudies, ...state.content.caseStudies };
  state.content.skillCategories = initialPortfolioContent.skillCategories;
  return state;
}
export async function savePortfolioStore(state: PortfolioStoreState) {
  state.lastUpdated = new Date().toISOString();
  await getDb().insert(portfolio).values({ id: 'main', state }).onConflictDoUpdate({ target: portfolio.id, set: { state } });
}
export async function syncGitHubProjects(projects: ExtractedGitHubProject[]) {
  const store = await getPortfolioStore();
  for (const project of projects) {
    if (!project.isEligible || project.isFork) continue;
    store.content.projects = mergeGitHubProject(store.content.projects, project).projects;
    store.syncedRepositories[String(project.repoId)] = {
      repoId: project.repoId, name: project.name, fullName: project.name,
      liveUrl: project.liveUrl, syncedAt: new Date().toISOString(), topics: project.topics,
    };
  }
  store.content.lastSynced = new Date().toISOString();
  await savePortfolioStore(store);
  return store.content;
}
export async function handleRepositoryUntagged(repoId: number) {
  const store = await getPortfolioStore();
  delete store.syncedRepositories[String(repoId)];
  store.content.projects = store.content.projects.map(p => (p as ExtendedProjectItem).repositoryId === repoId ? { ...p, isUnavailable: true } : p);
  await savePortfolioStore(store);
}
