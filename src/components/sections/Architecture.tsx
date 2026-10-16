import React, { useState } from 'react';
import { usePortfolio, ArchitectureDiagramNode } from '../../content';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { ArrowRight, CheckCircle2, Clock, Cpu } from 'lucide-react';

export const Architecture: React.FC = () => {
  const { content } = usePortfolio();
  const architectureProjects = content.projects.filter(
    (p) => p.hasArchitecture && p.architectureFlow
  );
  const [activeProjectId, setActiveProjectId] = useState<string>(
    architectureProjects[0]?.id || 'tapas'
  );

  const currentProject =
    architectureProjects.find((p) => p.id === activeProjectId) || architectureProjects[0];

  const getStatusIcon = (status: ArchitectureDiagramNode['status']) => {
    switch (status) {
      case 'Implemented':
        return <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />;
      case 'Prototype':
        return <Cpu className="w-3 h-3 text-[var(--accent-secondary)]" />;
      case 'Planned':
      default:
        return <Clock className="w-3 h-3 text-[var(--text-muted)]" />;
    }
  };

  return (
    <section
      id="architecture"
      aria-label="System Architecture"
      className="py-20 sm:py-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <EngineeringModeBadge
            componentName="ArchitectureSection"
            notes="End-to-End Pipeline Diagrams · Accessible SVG & HTML Flows"
            className="mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
              05 / ARCHITECTURE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            System Architecture
          </h2>
          <div className="border-b border-dashed border-[var(--border-subtle)] my-2 w-full" />
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">
            High-level intended system pipelines and execution paths. Non-implemented stages are explicitly designated as Planned.
          </p>
        </div>

        {architectureProjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] w-fit">
            {architectureProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                  activeProjectId === p.id
                    ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {currentProject && currentProject.architectureFlow && (
          <div className="relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-6 sm:p-8 shadow-xs overflow-hidden">
            <div
              className="absolute inset-0 bg-precision-grid pointer-events-none select-none opacity-50"
              aria-hidden="true"
            />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-[var(--border-subtle)] mb-8">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {currentProject.architectureFlow.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {currentProject.architectureFlow.summary}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" /> Implemented
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" /> Prototype
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" /> Planned
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-4">
                <div className="flex items-stretch min-w-[700px] gap-2">
                  {currentProject.architectureFlow.nodes.map((node, idx, arr) => (
                    <React.Fragment key={node.id}>
                      <div className="flex-1 flex flex-col justify-between p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)]/50 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            0{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(node.status)}
                            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                              {node.status}
                            </span>
                          </div>
                        </div>
                        <div className="my-2">
                          <div className="text-xs font-bold text-[var(--text-primary)]">
                            {node.label}
                          </div>
                          {node.sublabel && (
                            <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-1">
                              {node.sublabel}
                            </div>
                          )}
                        </div>
                        <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                          <span>STAGE</span>
                          <span className="text-[var(--accent-secondary)]">VERIFIED</span>
                        </div>
                      </div>

                      {idx < arr.length - 1 && (
                        <div className="flex items-center justify-center px-1 text-[var(--text-muted)]">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
