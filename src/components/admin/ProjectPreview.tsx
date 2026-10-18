import React from 'react';
import { ProjectItem } from '../../content/types';
import { Github, Award } from 'lucide-react';

interface ProjectPreviewProps {
  project: ProjectItem;
  number?: string;
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({ project, number = '01' }) => {
  const categoryLabel = project.category
    ? project.category.toUpperCase()
    : project.status === 'Research'
    ? 'RESEARCH'
    : 'ENGINEERING';

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
          Live Index Row Preview
        </span>
        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
          Draft Preview Only
        </span>
      </div>

      <div className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          <div className="lg:col-span-4 flex items-start gap-4">
            <span className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-[var(--accent-primary)] shrink-0 pt-0.5">
              {number}
            </span>
            <div className="space-y-1 min-w-0">
              <h4 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                {project.name || 'Untitled Project'}
              </h4>
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
                  <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--accent-secondary)]">
                    {project.status || 'Prototype'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
              {project.summary || project.description || 'No description provided.'}
            </p>
          </div>

          <div className="lg:col-span-3 flex flex-col justify-between gap-4 lg:items-end">
            {project.stack && project.stack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 lg:justify-end">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[10px] font-mono tracking-wide text-[var(--text-secondary)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1 lg:justify-end">
              {project.githubUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-[var(--text-secondary)]">
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  <span>CODE</span>
                  <span className="text-[11px] text-[var(--text-muted)]">↗</span>
                </span>
              )}
              {project.liveUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-[var(--color-success)]">
                  <span>LIVE</span>
                  <span className="text-[11px]">↗</span>
                </span>
              )}
              {project.caseStudySlug && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium tracking-wider text-[var(--accent-primary)]">
                  <span>CASE STUDY</span>
                  <span className="text-[11px]">→</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
