import React from 'react';
import { usePortfolio } from '../../content';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { GraduationCap, Award, Users } from 'lucide-react';

export const ExperienceEducation: React.FC = () => {
  const { content } = usePortfolio();
  const { timeline } = content;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Education':
        return <GraduationCap className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'Competition':
        return <Award className="w-4 h-4 text-[var(--color-warning)]" />;
      case 'Involvement':
      default:
        return <Users className="w-4 h-4 text-[var(--accent-secondary)]" />;
    }
  };

  return (
    <section
      id="experience"
      aria-label="Experience and Education"
      className="py-20 sm:py-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <EngineeringModeBadge
            componentName="ExperienceEducation"
            notes="Chaitanya Bharathi Institute of Technology (CBIT) · Computer Science & Engineering"
            className="mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
              06 / EXPERIENCE & EDUCATION
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Experience &amp; Education
          </h2>
          <div className="border-b border-dashed border-[var(--border-subtle)] my-2 w-full" />
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">
            Academic foundation and engineering participation. All records reflect factual achievements and club coordination roles.
          </p>
        </div>

        <div className="relative border-l border-[var(--border-subtle)] ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-6">
          {timeline.map((item) => (
            <div key={item.id} className="relative group">
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] group-hover:border-[var(--accent-primary)] group-hover:text-[var(--accent-primary)] transition-colors shadow-xs">
                {getTypeIcon(item.type)}
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 sm:p-6 transition-all duration-200 hover:border-[var(--text-primary)]/50 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {item.role}
                    </h3>
                    {item.achievementBadge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-[11px] font-mono font-medium">
                        <Award className="w-3 h-3" />
                        {item.achievementBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)] shrink-0">
                    {item.period}
                  </span>
                </div>
                <div className="text-xs font-medium text-[var(--accent-secondary)] font-mono mb-2">
                  {item.organization}
                </div>
                {item.description && (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
