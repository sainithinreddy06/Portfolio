import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../../content';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { ExternalLink, ArrowRight, Github, Award, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SelectedWork: React.FC = () => {
  const {
    projects,
    isLoadingProjects,
    projectsError,
    lastSyncedTimestamp,
    refreshServerPortfolio,
    syncWithGitHubNow,
  } = usePortfolio();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await syncWithGitHubNow();
      setSyncFeedback('Projects updated with latest repository metadata.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err: any) {
      console.error('Failed to sync repositories:', err);
      setSyncFeedback('Could not reach GitHub API; displayed cached projects.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Derive categories and counts dynamically from actual synchronized project data
  const { categories, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = { ALL: projects.length };
    const catsSet = new Set<string>();

    projects.forEach((p) => {
      const cat = p.category
        ? p.category.trim().toUpperCase()
        : p.status === 'Research'
        ? 'RESEARCH'
        : p.stack.some((s) => /scikit|learn|ml|ai|yolo|pytorch|vision/i.test(s))
        ? 'AI / ML'
        : 'FULL STACK';
      catsSet.add(cat);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const preferredOrder = [
      'AI AGENT',
      'MERN STACK',
      'FULL STACK',
      'WEB3',
      'AI / ML',
      'COMPUTER VISION',
      'RESEARCH',
    ];

    const sortedCategories = Array.from(catsSet).sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return {
      categories: sortedCategories,
      categoryCounts: counts,
    };
  }, [projects]);

  // Filter projects dynamically based on category
  const filteredProjects = useMemo(() => {
    if (activeCategory === 'ALL') return projects;
    return projects.filter((p) => {
      const cat = p.category
        ? p.category.trim().toUpperCase()
        : p.status === 'Research'
        ? 'RESEARCH'
        : p.stack.some((s) => /scikit|learn|ml|ai|yolo|pytorch|vision/i.test(s))
        ? 'AI / ML'
        : 'FULL STACK';
      return cat === activeCategory;
    });
  }, [projects, activeCategory]);

  return (
    <section
      id="work"
      aria-label="Selected Work"
      className="py-20 sm:py-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <EngineeringModeBadge
              componentName="SelectedWork"
              notes={`${projects.length} Synchronized Repositories · Dynamic Feed`}
              className="mb-3"
            />
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
                03 / SELECTED WORK
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Selected Work
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Engineering project archive automatically synchronized with GitHub (@sainithinreddy06). Reflects real-time repository descriptions, live demo links, and verified architectures.
            </p>
          </div>

          {/* Dynamic Category Filter Bar */}
          {categories.length > 1 && (
            <div
              role="tablist"
              aria-label="Filter projects by category"
              className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] self-start sm:self-auto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'ALL'}
                onClick={() => setActiveCategory('ALL')}
                className={`px-3 py-1.5 rounded-md font-mono text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === 'ALL'
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                <span>ALL</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">
                  ({categoryCounts.ALL})
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-md font-mono text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">
                    ({categoryCounts[cat] || 0})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sync Feedback Toast */}
        {syncFeedback && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--accent-primary)]/40 text-xs font-mono text-[var(--text-primary)] flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Error State with Graceful Fallback */}
        {projectsError && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-xs font-mono text-[var(--color-warning)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Offline or network notice: displaying cached repository snapshot.</span>
            </div>
            <button
              onClick={refreshServerPortfolio}
              className="underline hover:text-[var(--text-primary)] text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoadingProjects && projects.length === 0 ? (
          <div className="space-y-6 animate-pulse py-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)]/40">
                <div className="h-4 bg-[var(--surface-elevated)] rounded-sm w-1/4 mb-3" />
                <div className="h-3 bg-[var(--surface-elevated)] rounded-sm w-3/4 mb-2" />
                <div className="h-3 bg-[var(--surface-elevated)] rounded-sm w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div className="py-20 px-6 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-card)]/40 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2 font-semibold">
              NO ELIGIBLE REPOSITORIES FOUND
            </p>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
              Synchronize with GitHub using the button below to discover public repositories.
            </p>
            <button
              onClick={handleManualSync}
              className="px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono font-medium tracking-wider uppercase inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync GitHub Repositories</span>
            </button>
          </div>
        ) : (
          /* Dynamic Editorial Engineering Project Index */
          <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {filteredProjects.map((project, index) => {
              const projectNumber = String(index + 1).padStart(2, '0');
              const categoryLabel = project.category
                ? project.category.toUpperCase()
                : project.status === 'Research'
                ? 'RESEARCH'
                : project.stack.some((s) => /scikit|learn|ml|ai|yolo|pytorch|vision/i.test(s))
                ? 'AI / ML'
                : 'FULL STACK';

              return (
                <article
                  key={project.id}
                  data-cursor="project"
                  className="group relative py-7 sm:py-9 transition-colors duration-200 hover:bg-[var(--surface-elevated)]/25 px-2 sm:px-4 -mx-2 sm:-mx-4 rounded-lg"
                >
                  {/* Subtle Accent Indicator on Desktop Hover */}
                  <div
                    aria-hidden="true"
                    className="absolute left-0 top-3 bottom-3 w-[2px] bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                  />

                  {/* Responsive Row Grid:
                      Mobile: Stacked 1-column
                      Desktop: 3-column [Left: 30-35%] [Center: 38-42%] [Right: 25-30%] */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
                    {/* LEFT COLUMN: Project Number, Name, Category & Status */}
                    <div className="lg:col-span-4 flex items-start gap-4">
                      {/* Project Number */}
                      <span className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors shrink-0 pt-0.5 select-none">
                        {projectNumber}
                      </span>
                      <div className="space-y-1 min-w-0">
                        {/* Project Name */}
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors tracking-tight leading-snug">
                          {project.name}
                        </h3>
                        {/* Category & Status */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--text-secondary)] font-medium">
                            {categoryLabel}
                          </span>
                          <span className="text-[var(--text-muted)] text-[10px]" aria-hidden="true">
                            ·
                          </span>
                          {project.achievementBadge ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono tracking-wider uppercase text-[var(--color-warning)] font-medium">
                              <Award className="w-3 h-3 shrink-0" />
                              <span>{project.achievementBadge}</span>
                            </span>
                          ) : (
                            <span className={`text-[11px] font-mono tracking-wider uppercase ${project.isArchived ? 'text-[var(--text-muted)]' : 'text-[var(--accent-secondary)]'}`}>
                              {project.isArchived ? 'Archived' : project.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CENTER COLUMN: Technical Description from synchronized repository */}
                    <div className="lg:col-span-5">
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                        {project.description || project.summary}
                      </p>
                    </div>

                    {/* RIGHT COLUMN: Technologies & Actions */}
                    <div className="lg:col-span-3 flex flex-col justify-between gap-4 lg:items-end">
                      {/* Technology Tags */}
                      {project.stack && project.stack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 lg:justify-end">
                          {project.stack.map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[10px] font-mono tracking-wide text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:border-[var(--border-subtle)]/80 transition-colors"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Available Actions: CODE, LIVE DEMO, CASE STUDY */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 lg:justify-end">
                        {/* VIEW ON GITHUB Action */}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group/link"
                            aria-label={`View source repository for ${project.name} on GitHub`}
                          >
                            <Github className="w-3.5 h-3.5 shrink-0 group-hover/link:text-[var(--accent-primary)] transition-colors" />
                            <span>CODE</span>
                            <span className="text-[11px] text-[var(--text-muted)] group-hover/link:text-[var(--text-primary)] transition-colors">↗</span>
                          </a>
                        )}

                        {/* LIVE DEMO Action: STRICTLY displayed only when verified deployment URL exists */}
                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium tracking-wider text-[var(--color-success)] hover:underline transition-colors cursor-pointer"
                            aria-label={`View verified live demo for ${project.name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span>LIVE DEMO</span>
                            <span className="text-[11px]">↗</span>
                          </a>
                        )}

                        {/* CASE STUDY Action */}
                        {project.caseStudySlug && (
                          <Link
                            to={`/work/${project.caseStudySlug}`}
                            data-cursor="case-study"
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium tracking-wider text-[var(--accent-primary)] hover:underline transition-colors ml-auto lg:ml-0 cursor-pointer"
                            aria-label={`Detailed case study for ${project.name}`}
                          >
                            <span>CASE STUDY</span>
                            <span className="text-[11px]">→</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* GitHub Synchronization & View All Repositories Footer */}
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
            </span>
            <div className="flex items-center gap-2">
              <span>SYNCHRONIZED WITH GITHUB:</span>
              <a
                href="https://github.com/sainithinreddy06"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-primary)] hover:underline font-medium"
              >
                @sainithinreddy06
              </a>
            </div>
            {lastSyncedTimestamp && (
              <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
                [{new Date(lastSyncedTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
              </span>
            )}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Revalidate repository data from GitHub"
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              aria-label="Refresh GitHub repositories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[var(--accent-primary)]' : ''}`} />
              <span className="text-[10px] sm:hidden">REFRESH</span>
            </button>
          </div>
          <a
            href="https://github.com/sainithinreddy06"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:bg-[var(--surface-elevated)] hover:border-[var(--accent-primary)]/60 text-xs font-mono font-semibold tracking-wider text-[var(--text-primary)] transition-all group cursor-pointer shadow-2xs"
          >
            <Github className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
            <span>VIEW ALL REPOSITORIES</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
        </div>
      </div>
    </section>
  );
};
