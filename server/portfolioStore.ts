import fs from 'fs';
import { isPortfolioContent } from './portfolioValidation';
import path from 'path';
import { PortfolioContent, ProjectItem } from '../src/content/types';
import { initialPortfolioContent } from '../src/content/portfolioData';
import { ExtractedGitHubProject } from './githubService';
import { PortfolioStoreState, ExtendedProjectItem, ResumeDiffResult } from './types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SEED_FILE = path.join(DATA_DIR, 'syncedPortfolio.json');
const STORE_FILE = path.join(DATA_DIR, 'portfolio-runtime.json');
let localReadFailed = false;

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

  const source = fs.existsSync(STORE_FILE) ? STORE_FILE : SEED_FILE;
  if (fs.existsSync(source)) {
    try {
      const fileData = fs.readFileSync(source, 'utf8');
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


      if ((foundInData || foundInPublic) && (!parsed.content.profile.photo.url || parsed.content.profile.photo.isPlaceholder)) {
        parsed.content.profile.photo.url = foundInPublic ? `/images/${foundInPublic}` : '/api/portfolio/photo';
        parsed.content.profile.photo.isPlaceholder = false;

      }

      // Ensure verified baseline curated case studies and skills exist
      parsed.content.caseStudies = {
        ...initialPortfolioContent.caseStudies,
        ...parsed.content.caseStudies,
      };
      parsed.content.skillCategories ??= initialPortfolioContent.skillCategories;


      cachedState = parsed;
      return cachedState;
    } catch (err) {
      localReadFailed = true;
      console.warn('[PortfolioStore] Cannot read the existing snapshot. Local edits are disabled until recovery.');
    }
  }

  // Base state with initial curated data
  const defaultState: PortfolioStoreState = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    content: structuredClone(initialPortfolioContent),
    syncedRepositories: {},
    manualOverrides: {
      hiddenProjectIds: [],
      featuredProjectIds: [],
      projectOrder: [],
      customProjectFields: {},
    },
  };

  cachedState = defaultState;
  return defaultState;
}

/**
 * Persists the portfolio store state to disk.
 */
const getSupabaseConfig = () => ({
  url: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
});

let revision: string | null | undefined;
let saving = false;

export class StoreError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

async function database(query: string, options: RequestInit = {}) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(url + '/rest/v1/portfolio_state?' + query, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 409) throw conflict();
  if (!response.ok) throw new StoreError(503, 'Portfolio storage is unavailable.');
  return response.json();
}

function conflict() {
  return new StoreError(409, 'Portfolio changed. Reload the editor before saving.');
}

async function loadRemote() {
  const rows = await database('id=eq.main&select=state,updated_at&limit=1');
  if (!Array.isArray(rows)) throw new Error('Invalid portfolio response.');
  if (!rows.length) { revision = null; return; }
  if (!isPortfolioContent(rows[0].state?.content) || !rows[0].state.syncedRepositories ||
      !Number.isFinite(Date.parse(rows[0].state.lastUpdated)) || !rows[0].updated_at) {
    throw new Error('Invalid portfolio record.');
  }
  cachedState = rows[0].state;
  revision = rows[0].updated_at;
}

export async function initializePortfolioStore(): Promise<void> {
  getPortfolioStore();
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return;
  try { await loadRemote(); }
  catch { console.warn('[PortfolioStore] Durable storage unavailable. Serving the local snapshot.'); }
}

export function draftPortfolioStore() {
  return structuredClone(getPortfolioStore());
}

export async function savePortfolioStore(state: PortfolioStoreState): Promise<void> {
  if (saving) throw conflict();
  saving = true;
  try {
    const { url, key } = getSupabaseConfig();
    if (Boolean(url) !== Boolean(key)) throw new StoreError(503, 'Portfolio storage configuration is incomplete.');
    if (!url && localReadFailed) throw new StoreError(503, 'Restore the local portfolio snapshot before saving.');
    if (url && revision === undefined) await loadRemote();
    if (state.lastUpdated !== getPortfolioStore().lastUpdated) throw conflict();
    state.lastUpdated = new Date(Math.max(Date.now(), Date.parse(state.lastUpdated) + 1)).toISOString();
    if (url) {
      const query = revision === null ? '' : 'id=eq.main&updated_at=eq.' + encodeURIComponent(revision!);
      try {
        const rows = await database(query, {
          method: revision === null ? 'POST' : 'PATCH',
          body: JSON.stringify({ id: 'main', state, updated_at: state.lastUpdated }),
        });
        if (!rows[0]?.updated_at) throw conflict();
        revision = rows[0].updated_at;
      } catch (error) {
        revision = undefined;
        // Reconcile an ambiguous write before an editor can retry it.
        try { await loadRemote(); } catch { /* retry on the next write */ }
        throw error;
      }
    }
    try {
      ensureDataDir();
      fs.writeFileSync(STORE_FILE + '.tmp', JSON.stringify(state, null, 2), { mode: 0o600 });
      fs.renameSync(STORE_FILE + '.tmp', STORE_FILE);
    } catch {
      if (!url) throw new StoreError(503, 'Local portfolio storage is unavailable.');
      console.warn('[PortfolioStore] Could not update the local cache.');
    }
    cachedState = state;
  } catch (error) {
    if (error instanceof StoreError) throw error;
    throw new StoreError(503, 'Portfolio storage is unavailable.');
  } finally {
    saving = false;
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
    if (pExt.repositoryId !== undefined) {
      return pExt.repositoryId === githubProj.repoId;
    }
    if (p.githubUrl && githubProj.githubUrl) {
      return p.githubUrl.toLowerCase().replace(/\/$/, '') === githubProj.githubUrl.toLowerCase().replace(/\/$/, '');
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

    // Curated/manual project data owns the live URL decision. This intentionally
    // preserves an absent liveUrl too, preventing stale README/homepage links from
    // reappearing after sync. GitHub discovery is used only for non-curated projects.
    const hasCuratedLiveUrlDecision =
      existing.isManualOverride === true || existing.source === 'curated' || existing.source === 'manual';
    const liveUrl = hasCuratedLiveUrlDecision
      ? existing.liveUrl
      : (githubProj.liveUrl || existing.liveUrl);

    const merged: ExtendedProjectItem = {
      ...existing,
      repositoryId: githubProj.repoId,
      githubUrl: githubProj.githubUrl || existing.githubUrl,
      liveUrl,
      deploymentInfo: hasCuratedLiveUrlDecision
        ? existing.deploymentInfo
        : (githubProj.deploymentInfo || existing.deploymentInfo),
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
      source: 'github',
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
export async function syncGitHubProjects(projects: ExtractedGitHubProject[]): Promise<PortfolioContent> {
  const store = draftPortfolioStore();
  let currentProjects = [...store.content.projects];

  for (const gitProj of projects) {
    if (gitProj.visibility === 'public' && gitProj.isEligible && !gitProj.isFork) {
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
  await savePortfolioStore(store);
  return store.content;
}

/**
 * Applies approved resume changes to the portfolio store.
 */
export async function applyApprovedResumeChanges(
  diff: ResumeDiffResult,
  approvedIds: string[]
): Promise<PortfolioContent> {
  const store = draftPortfolioStore();
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

  if (!isPortfolioContent(store.content)) throw new StoreError(400, 'Invalid resume changes.');
  await savePortfolioStore(store);
  return store.content;
}

/**
 * Resets portfolio store to initial curated baseline.
 */
export async function resetPortfolioStore(): Promise<PortfolioContent> {
  const defaultState: PortfolioStoreState = {
    version: 1,
    lastUpdated: getPortfolioStore().lastUpdated,
    content: structuredClone(initialPortfolioContent),
    syncedRepositories: {},
    manualOverrides: {},
  };
  await savePortfolioStore(defaultState);
  return defaultState.content;
}
