import React from 'react';
import { usePortfolio } from '../../content';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { Terminal, Cpu, Database, Wrench } from 'lucide-react';

export const Engineering: React.FC = () => {
  const { content } = usePortfolio();
  const { skillCategories } = content;

  const categoryIcons = [
    <Cpu key="ai" className="w-4 h-4 text-[var(--accent-primary)]" />,
    <Terminal key="se" className="w-4 h-4 text-[var(--accent-secondary)]" />,
    <Database key="fs" className="w-4 h-4 text-[var(--color-success)]" />,
    <Wrench key="tools" className="w-4 h-4 text-[var(--color-warning)]" />,
  ];

  return (
    <section
      id="engineering"
      aria-label="Engineering & Technologies"
      className="relative py-20 sm:py-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-precision-grid pointer-events-none select-none"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <EngineeringModeBadge
            componentName="EngineeringSection"
            notes="Categorized Competencies · No Arbitrary Percentage Bars"
            className="mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
              04 / ENGINEERING
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Engineering &amp; Technologies
          </h2>
          <div className="border-b border-dashed border-[var(--border-subtle)] my-2 w-full" />
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">
            Core toolchains and software engineering disciplines. Grouped by technical focus without superficial score bars or vanity percentage meters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {skillCategories.map((cat, idx) => (
            <div
              key={cat.title}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 hover:border-[var(--text-primary)]/50 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
                <div className="p-1.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
                  {categoryIcons[idx % categoryIcons.length]}
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
                  {cat.title}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {cat.skills.map((skill) => (
                  <li
                    key={skill.name}
                    className="text-xs text-[var(--text-primary)] font-mono"
                  >
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
