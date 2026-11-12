import React, { useState } from 'react';
import { ProjectItem } from '../../content/types';
import { ProjectPreview } from './ProjectPreview';
import { ProjectConfirmation } from './ProjectConfirmation';
import { Eye, Plus, Save, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface ProjectFormProps {
  initialProject?: ProjectItem;
  mode: 'add' | 'edit';
  onSave: (project: ProjectItem) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialProject,
  mode,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<Partial<ProjectItem>>(() => {
    if (initialProject) {
      return { ...initialProject };
    }
    return {
      id: '',
      name: '',
      tagline: '',
      category: 'AI / ML',
      status: 'Prototype',
      description: '',
      summary: '',
      stack: [],
      features: [],
      githubUrl: '',
      liveUrl: '',
      caseStudySlug: '',
      achievementBadge: '',
      hasArchitecture: false,
    };
  });

  const [techInput, setTechInput] = useState<string>(
    initialProject?.stack ? initialProject.stack.join(', ') : ''
  );
  const [featuresInput, setFeaturesInput] = useState<string>(
    initialProject?.features ? initialProject.features.map((f) => f.name).join('\n') : ''
  );
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleTechChange = (val: string) => {
    setTechInput(val);
    const parsed = val
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setDraft((prev) => ({ ...prev, stack: parsed }));
  };

  const handleFeaturesChange = (val: string) => {
    setFeaturesInput(val);
    const items = val
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((name) => ({ name, status: 'Implemented' as const }));
    setDraft((prev) => ({ ...prev, features: items }));
  };

  const handleOpenConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!draft.name?.trim()) {
      setValidationError('Project name is required.');
      return;
    }
    if (!draft.description?.trim()) {
      setValidationError('Project description is required.');
      return;
    }

    const finalId =
      draft.id ||
      draft.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const finalProject: ProjectItem = {
      id: finalId,
      name: draft.name.trim(),
      tagline: draft.tagline?.trim() || `${draft.name.trim()} System Architecture`,
      category: draft.category?.trim() || 'AI / ML',
      status: draft.status || 'Prototype',
      description: draft.description.trim(),
      summary: draft.summary?.trim() || draft.description.trim().slice(0, 180),
      stack: draft.stack && draft.stack.length > 0 ? draft.stack : ['Python', 'React'],
      features: draft.features || [],
      githubUrl: draft.githubUrl?.trim() || undefined,
      liveUrl: draft.liveUrl?.trim() || undefined,
      caseStudySlug: draft.caseStudySlug?.trim() || undefined,
      achievementBadge: draft.achievementBadge?.trim() || undefined,
      hasArchitecture: Boolean(draft.hasArchitecture),
      source: 'manual',
    };

    setDraft(finalProject);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    setIsConfirmModalOpen(false);
    onSave(draft as ProjectItem);
  };

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] font-mono uppercase tracking-tight">
            {mode === 'add' ? 'ADD NEW PROJECT TO ARCHIVE' : `EDIT PROJECT: ${draft.name}`}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {mode === 'add'
              ? 'Draft project details. Mandatory confirmation is required before public publication.'
              : 'Modify project parameters. Changes will require explicit user confirmation before saving.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>CANCEL DRAFT</span>
        </button>
      </div>

      {validationError && (
        <div className="p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 text-xs text-[var(--color-danger)] font-mono">
          {validationError}
        </div>
      )}

      <form onSubmit={handleOpenConfirmation} className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
            01 / Basic Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={draft.name || ''}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. TAPAS or SureStep"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Category
              </label>
              <select
                value={draft.category || 'AI / ML'}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)] cursor-pointer"
              >
                <option value="AI / ML">AI / ML</option>
                <option value="FULL STACK">FULL STACK</option>
                <option value="COMPUTER VISION">COMPUTER VISION</option>
                <option value="AI AGENT">AI AGENT</option>
                <option value="RESEARCH">RESEARCH</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Status
              </label>
              <select
                value={draft.status || 'Prototype'}
                onChange={(e) =>
                  setDraft({ ...draft, status: e.target.value as ProjectItem['status'] })
                }
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)] cursor-pointer"
              >
                <option value="Implemented">Implemented</option>
                <option value="Prototype">Prototype</option>
                <option value="Research">Research</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={draft.tagline || ''}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                placeholder="e.g. Thermal Analytics & Public-health Advisory System"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
              Short Technical Description *
            </label>
            <textarea
              required
              rows={3}
              value={draft.description || ''}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  description: e.target.value,
                  summary: e.target.value.slice(0, 180),
                })
              }
              placeholder="Concise technical description of the project, architecture, algorithms, and real-world utility."
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-sans focus:outline-hidden focus:border-[var(--accent-primary)] leading-relaxed"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
          <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
            02 / Technical &amp; Repository Information
          </h4>
          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
              Technologies (Comma Separated) *
            </label>
            <input
              type="text"
              required
              value={techInput}
              onChange={(e) => handleTechChange(e.target.value)}
              placeholder="React, FastAPI, Python, MongoDB, Scikit-learn"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={draft.githubUrl || ''}
                onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                placeholder="https://github.com/sainithinreddy06/TAPAS"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Live Deployment URL (e.g. Netlify / Vercel)
              </label>
              <input
                type="url"
                value={draft.liveUrl || ''}
                onChange={(e) => setDraft({ ...draft, liveUrl: e.target.value })}
                placeholder="https://tapas-heat-intelligence.netlify.app/"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Case Study Slug (Optional)
              </label>
              <input
                type="text"
                value={draft.caseStudySlug || ''}
                onChange={(e) => setDraft({ ...draft, caseStudySlug: e.target.value })}
                placeholder="e.g. tapas or surestep"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                Achievement Badge (Optional)
              </label>
              <input
                type="text"
                value={draft.achievementBadge || ''}
                onChange={(e) => setDraft({ ...draft, achievementBadge: e.target.value })}
                placeholder="e.g. 3rd Place Hackathon"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setShowOptionalFields((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-mono text-[var(--accent-primary)] hover:underline uppercase cursor-pointer"
          >
            {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>
              {showOptionalFields ? 'Hide Optional Fields (Architecture, Features)' : 'Show Optional Fields (Architecture, Features)'}
            </span>
          </button>

          {showOptionalFields && (
            <div className="space-y-4 pt-4 mt-2">
              <div>
                <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5 uppercase">
                  Key Features (One per line)
                </label>
                <textarea
                  rows={4}
                  value={featuresInput}
                  onChange={(e) => handleFeaturesChange(e.target.value)}
                  placeholder="Real-time sensor anomaly detection&#10;Spatial density estimation&#10;FastAPI microservices pipeline"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-[var(--accent-primary)] leading-relaxed"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasArchCheckbox"
                  checked={Boolean(draft.hasArchitecture)}
                  onChange={(e) => setDraft({ ...draft, hasArchitecture: e.target.checked })}
                  className="rounded border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--accent-primary)]"
                />
                <label htmlFor="hasArchCheckbox" className="text-xs font-mono text-[var(--text-primary)] cursor-pointer">
                  Includes Interactive System Architecture Diagram
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--accent-primary)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>{showPreview ? 'HIDE ROW PREVIEW' : 'SHOW LIVE ROW PREVIEW'}</span>
          </button>
          {showPreview && (
            <div className="mt-4">
              <ProjectPreview project={draft as ProjectItem} number="01" />
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer uppercase tracking-wider"
          >
            CANCEL
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-mono text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2"
          >
            {mode === 'add' ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>PREVIEW &amp; ADD PROJECT</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>PREVIEW &amp; SAVE CHANGES</span>
              </>
            )}
          </button>
        </div>
      </form>

      <ProjectConfirmation
        isOpen={isConfirmModalOpen}
        type={mode === 'add' ? 'ADD' : 'EDIT'}
        projectName={draft.name || 'Project'}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};
