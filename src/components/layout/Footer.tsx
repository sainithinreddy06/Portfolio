import React from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../../content';
import { Github, Linkedin, Mail, Code2, ShieldCheck, RefreshCw } from 'lucide-react';

interface FooterProps {
  onOpenCommandPalette: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCommandPalette }) => {
  const { content, lastSyncedTimestamp } = usePortfolio();

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--text-secondary)]">
        {/* Left: Identity & Degree */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="font-semibold text-[var(--text-primary)]">{content.profile.name}</span>
          <span className="hidden sm:inline text-[var(--text-muted)] opacity-40">·</span>
          <span>Computer Science &amp; Engineering, CBIT</span>
          <span className="hidden sm:inline text-[var(--text-muted)] opacity-40">·</span>
          <span className="font-mono text-[var(--text-muted)]">2024 – 2028</span>
        </div>

        {/* Center: System status indicator */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--text-muted)]">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-success)]" />
          <span>PORTFOLIO · LIVE SYNC</span>
          {lastSyncedTimestamp && (
            <span className="text-[10px] text-[var(--text-muted)] opacity-80">
              ({new Date(lastSyncedTimestamp).toLocaleDateString()})
            </span>
          )}
        </div>

        {/* Right: Verified links & admin shortcut */}
        <div className="flex items-center gap-4">
          <a
            href={content.profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href={content.profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          {content.profile.leetcodeUrl && (
            <a
              href={content.profile.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LeetCode Profile"
              className="hover:text-[#FFA116] transition-colors cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
            </a>
          )}
          <a
            href={`mailto:${content.profile.email}`}
            aria-label="Email Sai Nithin Reddy"
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
          </a>
          <button
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
            className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-2 cursor-pointer"
          >
            [CMD+K]
          </button>
          <Link
            to="/admin"
            title="Admin CMS & Sync Status"
            aria-label="Admin CMS"
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
};
