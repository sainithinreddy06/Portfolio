export interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  created_at: string;
  fork: boolean;
}

const GITHUB_USERNAME = 'sainithinreddy06';
const CACHE_KEY = 'sai_nithin_github_repos_cache_v2';
const CACHE_TTL_MS = 30 * 60 * 1000;

const EXCLUDED_REPO_NAMES = new Set([
  'git',
  'git-workshop-2025',
  'test-demo',
  'portfolio',
  'dotfiles',
  'practice',
  'assignment',
  'test',
]);

export async function fetchGitHubRepos(forceRefresh = false): Promise<GitHubRepo[]> {
  if (!forceRefresh && typeof window !== 'undefined' && window.localStorage) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const age = Date.now() - (cached.timestamp || 0);
        if (age < CACHE_TTL_MS && Array.isArray(cached.data) && cached.data.length > 0) {
          return cached.data;
        }
      }
    } catch (e) {
      console.warn('Failed to read GitHub cache:', e);
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      return getCachedFallback();
    }

    const repos: any[] = await response.json();
    if (!Array.isArray(repos)) {
      return getCachedFallback();
    }

    const normalized: GitHubRepo[] = repos.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || null,
      html_url: r.html_url,
      homepage: r.homepage || null,
      topics: Array.isArray(r.topics) ? r.topics : [],
      language: r.language || null,
      stargazers_count: typeof r.stargazers_count === 'number' ? r.stargazers_count : 0,
      updated_at: r.updated_at,
      created_at: r.created_at,
      fork: Boolean(r.fork),
    }));

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: normalized,
          })
        );
      } catch (e) {
        console.warn('Failed to write GitHub cache:', e);
      }
    }

    return normalized;
  } catch (error) {
    return getCachedFallback();
  }
}

function getCachedFallback(): GitHubRepo[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (Array.isArray(cached.data)) {
          return cached.data;
        }
      }
    } catch {
      // Ignore
    }
  }
  return [];
}

export function filterEligibleRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return repos.filter((repo) => {
    if (repo.fork) return false;
    const lowerName = repo.name.toLowerCase();
    if (EXCLUDED_REPO_NAMES.has(lowerName)) return false;
    if (lowerName.startsWith('test-') || lowerName.endsWith('-test')) return false;
    if (lowerName.includes('assignment') || lowerName.includes('workshop')) return false;
    return true;
  });
}
