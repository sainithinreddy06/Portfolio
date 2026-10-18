import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PortfolioContent, ProjectItem } from './types';
import { initialPortfolioContent } from './portfolioData';

export type ThemeMode = 'day' | 'night';

export interface PortfolioContextType {
  content: PortfolioContent;
  projects: ProjectItem[];
  isLoadingProjects: boolean;
  projectsError: string | null;
  lastSyncedTimestamp: string | null;
  updateContent: (newContent: PortfolioContent) => void;
  resetContent: () => void;
  refreshServerPortfolio: () => Promise<void>;
  syncWithGitHubNow: () => Promise<void>;
  isCustomized: boolean;
  engineeringMode: boolean;
  toggleEngineeringMode: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  isResumeModalOpen: boolean;
  setIsResumeModalOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'sai_nithin_portfolio_content_v3';
const ENG_MODE_KEY = 'sai_nithin_engineering_mode_v2';
const THEME_KEY = 'sai_nithin_theme_pref';

/**
 * Deduplicates and sorts dynamic projects by priority/order.
 */
function normalizeProjectList(projects: ProjectItem[]): ProjectItem[] {
  const map = new Map<string, ProjectItem>();

  for (const p of projects) {
    if (!p.id || !p.name) continue;
    const key = p.id.toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, p);
    } else {
      // Merge: latest synchronized data takes precedence, while preserving curated architecture
      map.set(key, {
        ...existing,
        ...p,
        liveUrl: p.liveUrl || existing.liveUrl,
        githubUrl: p.githubUrl || existing.githubUrl,
        features: (existing.features && existing.features.length > 0) ? existing.features : (p.features || []),
        architectureFlow: existing.architectureFlow || p.architectureFlow,
        hasArchitecture: existing.hasArchitecture || p.hasArchitecture,
      });
    }
  }

  return Array.from(map.values());
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<PortfolioContent>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.profile?.name) {
          return {
            ...initialPortfolioContent,
            ...parsed,
            projects: normalizeProjectList(parsed.projects || initialPortfolioContent.projects),
            caseStudies: {
              ...initialPortfolioContent.caseStudies,
              ...(parsed.caseStudies || {}),
            },
            profile: {
              ...initialPortfolioContent.profile,
              ...parsed.profile,
            },
          };
        }
      }
    } catch {
      // Fallback
    }
    return initialPortfolioContent;
  });

  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<string | null>(content.lastSynced || null);

  const [engineeringMode, setEngineeringMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ENG_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'day' || saved === 'night') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'day';
      }
    } catch {
      // Fallback
    }
    return 'night';
  });

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  /**
   * Refreshes portfolio and projects from the backend /api/portfolio endpoint.
   * Updates state dynamically without requiring frontend rebuilds.
   */
  const refreshServerPortfolio = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectsError(null);
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.content) {
        const serverProjects = normalizeProjectList(data.content.projects || []);
        setContent((prev) => {
          const activePhoto =
            data.content?.profile?.photo ||
            prev.profile.photo ||
            initialPortfolioContent.profile.photo;

          const merged: PortfolioContent = {
            ...data.content,
            projects: serverProjects,
            caseStudies: {
              ...initialPortfolioContent.caseStudies,
              ...(data.content.caseStudies || {}),
            },
            skillCategories: initialPortfolioContent.skillCategories,
            profile: {
              ...data.content.profile,
              photo: activePhoto,
            },
            lastSynced: data.lastUpdated || new Date().toISOString(),
          };

          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {
            // Ignore quota issues
          }
          return merged;
        });
        setLastSyncedTimestamp(data.lastUpdated || new Date().toISOString());
      }
    } catch (err: any) {
      console.warn('[Portfolio Sync] Using cached portfolio state:', err.message);
      setProjectsError(err.message);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  /**
   * Trigger explicit manual sync with GitHub
   */
  const syncWithGitHubNow = useCallback(async () => {
    setIsLoadingProjects(true);
    setProjectsError(null);
    try {
      const token =
        sessionStorage.getItem('sai_nithin_admin_token') ||
        localStorage.getItem('sai_nithin_admin_token');
      if (token) {
        const res = await fetch('/api/github/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Sync API returned HTTP ${res.status}`);
        }
      }
      await refreshServerPortfolio();
    } catch (err: any) {
      console.error('[Manual Sync Error]', err);
      setProjectsError(err.message);
      throw err;
    } finally {
      setIsLoadingProjects(false);
    }
  }, [refreshServerPortfolio]);

  useEffect(() => {
    refreshServerPortfolio();
  }, [refreshServerPortfolio]);

  // Synchronize theme attribute on HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'day') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'day' ? 'night' : 'day'));
  };

  const updateContent = (newContent: PortfolioContent) => {
    setContent(newContent);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContent));
    } catch (e) {
      console.warn('Unable to persist content to localStorage', e);
    }
  };

  const resetContent = () => {
    setContent(initialPortfolioContent);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Unable to reset content', e);
    }
  };

  const toggleEngineeringMode = () => {
    setEngineeringMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(ENG_MODE_KEY, String(next));
      } catch (e) {
        console.warn('Unable to persist engineering mode', e);
      }
      return next;
    });
  };

  return (
    <PortfolioContext.Provider
      value={{
        content,
        projects: content.projects,
        isLoadingProjects,
        projectsError,
        lastSyncedTimestamp,
        updateContent,
        resetContent,
        refreshServerPortfolio,
        syncWithGitHubNow,
        isCustomized: JSON.stringify(content) !== JSON.stringify(initialPortfolioContent),
        engineeringMode,
        toggleEngineeringMode,
        theme,
        toggleTheme,
        isResumeModalOpen,
        setIsResumeModalOpen,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export * from './types';
export { initialPortfolioContent } from './portfolioData';
