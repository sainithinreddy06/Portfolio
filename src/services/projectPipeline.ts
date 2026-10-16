import { ProjectItem, ProjectFeature } from '../content/types';
import { GitHubRepo, filterEligibleRepos } from './githubProjectSync';

function normalizeKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function mergeProjectData(
  curated: ProjectItem,
  repo?: GitHubRepo,
  manualOverride?: Partial<ProjectItem>
): ProjectItem {
  if (!repo) {
    return {
      ...curated,
      ...(manualOverride || {}),
      source: curated.source || 'curated',
    };
  }

  const githubUrl = repo.html_url || curated.githubUrl;
  const liveUrl = repo.homepage || curated.liveUrl;

  const description =
    curated.description && curated.description.trim().length > 0
      ? curated.description
      : repo.description || curated.description;

  let stack = curated.stack && curated.stack.length > 0 ? [...curated.stack] : [];
  if (stack.length === 0) {
    const fromGit = [repo.language, ...repo.topics].filter(Boolean) as string[];
    stack = fromGit.length > 0 ? fromGit : ['Software Systems'];
  }

  const features: ProjectFeature[] = Array.isArray(curated.features) ? [...curated.features] : [];

  const merged: ProjectItem = {
    ...curated,
    githubUrl,
    liveUrl,
    description,
    stack,
    features,
    githubRepoName: repo.name,
    starsCount: repo.stargazers_count,
    lastUpdated: repo.updated_at,
    topics: repo.topics,
    source: 'hybrid',
    ...(manualOverride || {}),
  };

  return merged;
}

export function createProjectFromGitHub(repo: GitHubRepo): ProjectItem {
  const id = repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const stack = [repo.language, ...repo.topics].filter(Boolean) as string[];

  return {
    id,
    name: repo.name,
    tagline: repo.description || 'Public Open-Source Engineering Project',
    description: repo.description || `Public repository maintained at github.com/sainithinreddy06/${repo.name}`,
    summary: repo.description || '',
    status: 'Prototype',
    stack: stack.length > 0 ? stack : ['Open Source'],
    features: [],
    githubUrl: repo.html_url,
    liveUrl: repo.homepage || undefined,
    hasArchitecture: false,
    githubRepoName: repo.name,
    starsCount: repo.stargazers_count,
    lastUpdated: repo.updated_at,
    topics: repo.topics,
    source: 'github',
    visible: true,
  };
}

export function buildNormalizedProjects(
  curatedProjects: ProjectItem[],
  githubRepos: GitHubRepo[],
  manualOverrides: Record<string, Partial<ProjectItem>> = {}
): ProjectItem[] {
  const eligibleRepos = filterEligibleRepos(githubRepos);
  const matchedRepoIds = new Set<number>();

  const result: ProjectItem[] = curatedProjects.map((curated) => {
    const curatedNorm = normalizeKey(curated.id);
    const curatedNameNorm = normalizeKey(curated.name);

    const matchedRepo = eligibleRepos.find((repo) => {
      const repoNorm = normalizeKey(repo.name);
      return (
        repoNorm === curatedNorm ||
        repoNorm === curatedNameNorm ||
        curatedNorm.includes(repoNorm) ||
        repoNorm.includes(curatedNorm) ||
        (curated.githubUrl && curated.githubUrl.toLowerCase().endsWith(`/${repo.name.toLowerCase()}`))
      );
    });

    if (matchedRepo) {
      matchedRepoIds.add(matchedRepo.id);
    }
    return mergeProjectData(curated, matchedRepo, manualOverrides[curated.id]);
  });

  for (const repo of eligibleRepos) {
    if (matchedRepoIds.has(repo.id)) continue;
    const repoSlug = repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const override = manualOverrides[repoSlug];
    if (override && override.visible === false) {
      continue;
    }

    const newProj = createProjectFromGitHub(repo);
    result.push({
      ...newProj,
      ...(override || {}),
    });
  }

  return result
    .filter((p) => p.visible !== false)
    .sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 999;
      const orderB = typeof b.order === 'number' ? b.order : 999;
      return orderA - orderB;
    });
}
