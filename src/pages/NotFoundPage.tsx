import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Terminal } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-md w-full p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-center shadow-xl">
        <div className="w-12 h-12 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--accent-primary)] flex items-center justify-center mx-auto mb-4">
          <Terminal className="w-6 h-6" />
        </div>
        <div className="font-mono text-xs text-[var(--accent-secondary)] mb-1">ERROR 404</div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Route Not Found</h1>
        <div className="border-b border-dashed border-[var(--border-subtle)] my-3 w-full" />
        <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
          The requested system path does not resolve to an active portfolio component or case study.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono tracking-wider uppercase font-semibold transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Engineering Portfolio</span>
        </Link>
      </div>
    </div>
  );
};
