import fs from 'fs';
import path from 'path';
import { PortfolioContent, ProjectItem } from '../src/content/types';
import { initialPortfolioContent } from '../src/content/portfolioData';
import { ExtractedGitHubProject } from './githubService';
import { PortfolioStoreState, ExtendedProjectItem, ResumeDiffResult } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'syncedPortfolio.json');

// In-memory cache
let cachedState: PortfolioStoreState | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Normalizes project names for matching (e.g. 'TAPAS - Thermal Analytics...' -> 'tapas').
 */
export function normalizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[- (–].*$/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Initializes or loads the portfolio store state from disk.
 */
export function getPortfolioStore(): PortfolioStoreState {
  if (cachedState) {
    return cachedState;
  }

  ensureDataDir();

  if (fs.existsSync(STORE_FILE)) {
    try {
      const fileData = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed: PortfolioStoreState = JSON.parse(fileData);

      // Verify photo file on disk in data/ or public/images/
      const photoFiles = [
        'profile-photo.png',
        'profile-photo.jpg',
        'profile-photo.jpeg',
        'profile-photo.webp',
        'profile.png',
        'profile.jpg',
        'portrait.png',
        'portrait.jpg',
      ];
      const publicImagesDir = path.resolve(process.cwd(), 'public', 'images');
      const foundInPublic = photoFiles.find((f) => fs.existsSync(path.join(publicImagesDir, f)));
      const foundInData = photoFiles.find((f) => fs.existsSync(path.join(DATA_DIR, f)));
      let stateModified = false;

      if ((foundInData || foundInPublic) && (!parsed.content.profile.photo.url || parsed.content.profile.photo.isPlaceholder)) {
        parsed.content.profile.photo.url = foundInPublic ? `/images/${foundInPublic}` : '/api/portfolio/photo';
        parsed.content.profile.photo.isPlaceholder = false;
        stateModified = true;
      }

      // Ensure verified baseline curated case studies and skills exist
      parsed.content.caseStudies = {
        ...initialPortfolioContent.caseStudies,
        ...parsed.content.caseStudies,
      };
      parsed.content.skillCategories = initialPortfolioContent.skillCategories;

      if (stateModified) {
        savePortfolioStore(parsed);
      }
      cachedState = parsed;
      return cachedState;
    } catch (err) {
      console.warn('[PortfolioStore] Failed to read existing store file, falling back to base curated data:', err);
    }
  }

  // Base state with initial curated data
  const defaultState: PortfolioStoreState = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    content: initialPortfolioContent,
    syncedRepositories: {},
    manualOverrides: {
      hiddenProjectIds: [],
      featuredProjectIds: [],
      projectOrder: [],
      customProjectFields: {},
    },
  };

  savePortfolioStore(defaultState);
  cachedState = defaultState;
  return defaultState;
}

/**
 * Persists the portfolio store state to disk.
 */
export function savePortfolioStore(state: PortfolioStoreState): void {
  ensureDataDir();
  state.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf8');
    cachedState = state;
  } catch (err) {
    console.error('[PortfolioStore] Error saving store file:', err);
  }
}

/**
 * Merges a GitHub project into existing portfolio projects with strict source priority:
 * - Match by repository ID, repository name, or URL.
 * - Update description, stack, live demo URL.
 * - Preserve curated feature status matrix and architecture flow.
 * - Never invent fake data.
 */
export function mergeGitHubProject(
  currentProjects: ProjectItem[],
  githubProj: ExtractedGitHubProject
): { projects: ProjectItem[]; matchedProject: ProjectItem } {
  // Exclude meta portfolio repositories
  if (/^portfolio(-.*)?$/i.test(githubProj.name)) {
    return { projects: currentProjects, matchedProject: currentProjects[0] };
  }

  const normGitName = normalizeProjectName(githubProj.name);
  const rawGitName = githubProj.name.toLowerCase().replace(/[^a-z0-9]/g, '');

  const existingIdx = currentProjects.findIndex((p) => {
    const pExt = p as ExtendedProjectItem;
    if (pExt.repositoryId && pExt.repositoryId === githubProj.repoId) {
      return true;
    }
    if (p.githubUrl && githubProj.githubUrl) {
      const pRepo = p.githubUrl.toLowerCase().replace(/\/$/, '').split('/').pop();
      const gRepo = githubProj.githubUrl.toLowerCase().replace(/\/$/, '').split('/').pop();
      if (pRepo && gRepo && pRepo === gRepo) return true;
    }
    const pFullName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (pFullName.includes(rawGitName) || rawGitName.includes(pFullName)) {
      return true;
    }
    const normPName = normalizeProjectName(p.name);
    return normPName === normGitName || normPName.includes(normGitName) || normGitName.includes(normPName);
  });

  const updatedProjects = [...currentProjects];

  if (existingIdx >= 0) {
    const existing = updatedProjects[existingIdx] as ExtendedProjectItem;

    // Reflect repository description changes from GitHub unless user explicitly set a manual override
    const description =
      existing.isManualOverride
        ? existing.description
        : (githubProj.description || existing.description);

    // Combine technologies cleanly
    const combinedTech = Array.from(
      new Set([...existing.stack, ...githubProj.stack.filter((t) => t.length > 1)])
    );

    // Live URL update:
    // If GitHub provides a new/changed demo URL, update it.
    // If GitHub didn't provide one this time, keep existing known valid liveUrl (protection against temporary API glitch)
    const liveUrl = githubProj.liveUrl || existing.liveUrl;

    const merged: ExtendedProjectItem = {
      ...existing,
      repositoryId: githubProj.repoId,
      githubUrl: githubProj.githubUrl || existing.githubUrl,
      liveUrl,
      deploymentInfo: githubProj.deploymentInfo || existing.deploymentInfo,
      description,
      summary: existing.summary || description.slice(0, 150),
      stack: existing.stack.length > 0 ? existing.stack : combinedTech,
      lastSyncedAt: new Date().toISOString(),
      lastUpdated: githubProj.updatedAt || existing.lastUpdated,
      starsCount: githubProj.stars,
      topics: githubProj.topics,
      isArchived: Boolean(githubProj.isArchived),
      isUnavailable: false,
      // Curated features and case study slugs are strictly preserved
      features: existing.features || [],
      caseStudySlug: existing.caseStudySlug,
      hasArchitecture: existing.hasArchitecture,
      architectureFlow: existing.architectureFlow,
    };

    updatedProjects[existingIdx] = merged;
    return { projects: updatedProjects, matchedProject: merged };
  } else {
    // New eligible repository discovered
    const newProjId = githubProj.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newProject: ExtendedProjectItem = {
      id: newProjId,
      name: githubProj.name,
      tagline: githubProj.tagline || 'Open-Source System',
      category: githubProj.category || 'FULL STACK',
      description: githubProj.description,
      summary: githubProj.description.slice(0, 150),
      stack: githubProj.stack,
      status: githubProj.isArchived ? 'Research' : 'Implemented',
      features: [], // Never invent fake features
      githubUrl: githubProj.githubUrl,
      liveUrl: githubProj.liveUrl,
      deploymentInfo: githubProj.deploymentInfo,
      repositoryId: githubProj.repoId,
      hasArchitecture: false,
      starsCount: githubProj.stars,
      lastSyncedAt: new Date().toISOString(),
      lastUpdated: githubProj.updatedAt,
      topics: githubProj.topics,
      isArchived: Boolean(githubProj.isArchived),
    };

    updatedProjects.push(newProject);
    return { projects: updatedProjects, matchedProject: newProject };
  }
}

/**
 * Applies a batch of GitHub projects to the store.
 */
export function syncGitHubProjects(projects: ExtractedGitHubProject[]): PortfolioContent {
  const store = getPortfolioStore();
  let currentProjects = [...store.content.projects];

  for (const gitProj of projects) {
    if (gitProj.isEligible && !gitProj.isFork) {
      const result = mergeGitHubProject(currentProjects, gitProj);
      currentProjects = result.projects;
      store.syncedRepositories[gitProj.repoId.toString()] = {
        repoId: gitProj.repoId,
        name: gitProj.name,
        fullName: gitProj.name,
        liveUrl: gitProj.liveUrl,
        syncedAt: new Date().toISOString(),
        topics: gitProj.topics,
      };
    }
  }

  store.content.projects = currentProjects;
  store.content.lastSynced = new Date().toISOString();
  savePortfolioStore(store);
  return store.content;
}

/**
 * Handles removal or untagging of a repository safely without destroying curated information.
 */
export function handleRepositoryUntagged(repoId: number): void {
  const store = getPortfolioStore();
  const repoKey = repoId.toString();
  if (store.syncedRepositories[repoKey]) {
    delete store.syncedRepositories[repoKey];
  }

  store.content.projects = store.content.projects.map((p) => {
    const pExt = p as ExtendedProjectItem;
    if (pExt.repositoryId === repoId) {
      return {
        ...p,
        isUnavailable: true,
      };
    }
    return p;
  });

  savePortfolioStore(store);
}

/**
 * Applies approved resume changes to the portfolio store.
 */
export function applyApprovedResumeChanges(
  diff: ResumeDiffResult,
  approvedIds: string[]
): PortfolioContent {
  const store = getPortfolioStore();
  const approvedSet = new Set(approvedIds);
  const changesToApply = diff.changes.filter((c) => approvedSet.has(c.id));

  for (const change of changesToApply) {
    if (change.category === 'skill' && change.action === 'add') {
      const newSkillName = change.incomingValue as string;
      let targetCat = store.content.skillCategories.find((c) =>
        c.title.toLowerCase().includes('technical') || c.title.toLowerCase().includes('core')
      );
      if (!targetCat && store.content.skillCategories.length > 0) {
        targetCat = store.content.skillCategories[0];
      }
      if (targetCat) {
        const exists = targetCat.skills.some(
          (s) => s.name.toLowerCase() === newSkillName.toLowerCase()
        );
        if (!exists) {
          targetCat.skills.push({ name: newSkillName, verifyTag: true });
        }
      }
    } else if (change.category === 'profile') {
      if (change.id === 'profile-email-update') {
        store.content.profile.email = change.incomingValue;
      } else if (change.id === 'profile-positioning-update') {
        store.content.profile.positioning = change.incomingValue;
      }
    } else if (change.category === 'project') {
      if (change.action === 'update') {
        const projIdMatch = change.id.match(/^proj-tech-([a-zA-Z0-9-]+)-/);
        if (projIdMatch && projIdMatch[1]) {
          const p = store.content.projects.find((proj) => proj.id === projIdMatch[1]);
          if (p) {
            p.stack = change.incomingValue;
          }
        }
      } else if (change.action === 'add') {
        const inc = change.incomingValue;
        const newProjId = inc.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const exists = store.content.projects.some((p) => p.id === newProjId);
        if (!exists) {
          store.content.projects.push({
            id: newProjId,
            name: inc.name,
            tagline: inc.tagline || 'Engineered System',
            description: inc.description,
            summary: inc.description.slice(0, 150),
            stack: inc.stack || [],
            status: 'Implemented',
            features: [],
            githubUrl: inc.githubUrl,
            liveUrl: inc.liveUrl,
            hasArchitecture: false,
          });
        }
      }
    } else if (change.category === 'experience' && change.action === 'add') {
      const exp = change.incomingValue;
      store.content.timeline.push(exp);
    }
  }

  savePortfolioStore(store);
  return store.content;
}

/**
 * Resets portfolio store to initial curated baseline.
 */
export function resetPortfolioStore(): PortfolioContent {
  const defaultState: PortfolioStoreState = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    content: initialPortfolioContent,
    syncedRepositories: {},
    manualOverrides: {},
  };
  savePortfolioStore(defaultState);
  return defaultState.content;
}
