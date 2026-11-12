import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export type ConfirmationType = 'ADD' | 'EDIT' | 'DELETE';

export interface ProjectConfirmationProps {
  isOpen: boolean;
  type: ConfirmationType;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ProjectConfirmation: React.FC<ProjectConfirmationProps> = ({
  isOpen,
  type,
  projectName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const config = {
    ADD: {
      title: 'ADD PROJECT',
      heading: 'Confirm Project Addition',
      message:
        'Are you sure you want to add this project to the public portfolio? This project will be added to the portfolio and become visible in the Selected Work section.',
      confirmLabel: 'ADD PROJECT',
      confirmClass:
        'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white',
      icon: <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" />,
    },
    EDIT: {
      title: 'SAVE CHANGES',
      heading: 'Confirm Project Changes',
      message: `Save these changes to "${projectName}"? The public portfolio will update to reflect these modified attributes.`,
      confirmLabel: 'SAVE CHANGES',
      confirmClass:
        'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white',
      icon: <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" />,
    },
    DELETE: {
      title: 'REMOVE PROJECT',
      heading: 'Confirm Project Removal',
      message: `Are you sure you want to remove "${projectName}" from the portfolio? This project will be removed from the public Selected Work section.`,
      confirmLabel: 'REMOVE PROJECT',
      confirmClass:
        'bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white',
      icon: <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />,
    },
  }[type];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
              {config.icon}
            </div>
            <div>
              <h3
                id="confirmation-title"
                className="text-base font-bold text-[var(--text-primary)] font-mono tracking-tight"
              >
                {config.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">
                {projectName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-t border-b border-[var(--border-subtle)] py-3">
          {config.message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--text-primary)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer uppercase tracking-wider"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-sm font-mono text-xs font-semibold tracking-wider transition-colors cursor-pointer uppercase ${config.confirmClass}`}
          >
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProjectConfirmationModal = ProjectConfirmation;
