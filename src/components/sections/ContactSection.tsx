import React, { useState } from 'react';
import { usePortfolio } from '../../content';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { Mail, Copy, Check, Github, Linkedin, Code2, ExternalLink } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const { content } = usePortfolio();
  const { profile } = content;
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="contact"
      aria-label="Contact Sai Nithin Reddy"
      className="py-20 sm:py-28 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <EngineeringModeBadge
            componentName="ContactSection"
            notes="Direct Verified Channels · No Mock Contact Forms"
            className="mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
              08 / CONTACT
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            LET&apos;S BUILD SOMETHING WORTH SHIPPING.
          </h2>
          <div className="border-b border-dashed border-[var(--border-subtle)] my-3 w-full" />
          <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl">
            I&apos;m open to meaningful engineering projects, collaborations and opportunities to build useful systems.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col justify-between hover:border-[var(--text-primary)]/50 transition-colors shadow-xs">
            <div>
              <div className="p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--accent-primary)] w-fit mb-3">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Email</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono break-all line-clamp-1">
                {profile.email}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
              <a
                href={`mailto:${profile.email}`}
                className="flex-1 text-center py-1.5 px-2.5 rounded-sm bg-[var(--text-primary)] hover:opacity-90 text-[var(--bg-primary)] text-xs font-mono tracking-wider uppercase font-semibold transition-opacity"
              >
                Send Email
              </a>
              <button
                onClick={handleCopyEmail}
                aria-label="Copy email address"
                className="p-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Copy email to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col justify-between hover:border-[var(--text-primary)]/50 transition-colors shadow-xs">
            <div>
              <div className="p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--accent-secondary)] w-fit mb-3">
                <Github className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">GitHub</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
                sainithinreddy06
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-1.5 px-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-xs font-mono tracking-wider uppercase font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Profile</span>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </a>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col justify-between hover:border-[var(--text-primary)]/50 transition-colors shadow-xs">
            <div>
              <div className="p-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--color-success)] w-fit mb-3">
                <Linkedin className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">LinkedIn</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono truncate">
                sai-nithin-reddy-tadugam
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-1.5 px-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-xs font-mono tracking-wider uppercase font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Connect</span>
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </a>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col justify-between hover:border-[#FFA116]/50 transition-colors shadow-xs">
            <div>
              <div className="p-2.5 rounded-lg bg-[#FFA116]/10 border border-[#FFA116]/30 text-[#FFA116] w-fit mb-3">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">LeetCode</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono truncate">
                {profile.leetcodeUsername || 'Nithinreddy_06'}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
              <a
                href={profile.leetcodeUrl || 'https://leetcode.com/u/Nithinreddy_06/'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-1.5 px-2.5 rounded-sm border border-[#FFA116]/40 hover:bg-[#FFA116]/10 text-[#FFA116] text-xs font-mono tracking-wider uppercase font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Solve</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#FFA116]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
