import React, { useState } from 'react';
import { usePortfolio } from '../../content';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { FileText, Download, ExternalLink, Eye, GraduationCap, Award, Briefcase } from 'lucide-react';
import { downloadResume, getResumeFileUrl } from '../../utils/resumeManager';

export const ResumeSection: React.FC = () => {
  const { content, setIsResumeModalOpen } = usePortfolio();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const resume = content.profile.resume;
  const resumeFileUrl = getResumeFileUrl(content);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDownloading(true);
    try {
      await downloadResume(content);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  return (
    <section
      id="resume"
      aria-label="Resume"
      className="py-20 sm:py-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <EngineeringModeBadge
            componentName="ResumeSection"
            notes="Verified Document View · Factual Educational & Engineering Credentials"
            className="mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
              07 / RESUME
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Resume &amp; Credentials
          </h2>
          <div className="border-b border-dashed border-[var(--border-subtle)] my-2 w-full" />
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-2xl">
            Official curriculum vitae detailing undergraduate coursework at Chaitanya Bharathi Institute of Technology (CBIT), full-stack software systems, ML pipelines, and technical leadership.
          </p>
        </div>

        {/* Main Document Card */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--accent-primary)] shrink-0 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {content.profile.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                    OFFICIAL PDF
                  </span>
                </div>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
                  File: <span className="text-[var(--text-primary)]">{resume.fileName || 'Sai_Nithin_Reddy_Resume.pdf'}</span> ({resume.fileSize || '137 KB'})
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Computer Science &amp; Engineering · Chaitanya Bharathi Institute of Technology (CBIT) · CGPA: 9.06
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={resumeFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Resume PDF in New Tab"
                className="px-5 py-2.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs tracking-wider uppercase font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs cursor-pointer focus-visible:outline-hidden"
              >
                <ExternalLink className="w-4 h-4" />
                <span>VIEW RESUME</span>
              </a>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label="Download Original Resume PDF"
                className="px-5 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-mono text-xs tracking-wider uppercase font-semibold transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-hidden shadow-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[var(--color-success)]" />
                <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD RESUME'}</span>
              </button>

              <button
                onClick={() => setIsResumeModalOpen(true)}
                aria-label="Preview Structured CV"
                className="px-5 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] font-mono text-xs tracking-wider uppercase font-semibold transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-hidden shadow-xs"
              >
                <Eye className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>STRUCTURED CV</span>
              </button>
            </div>
          </div>

          {/* Quick Credential Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--accent-primary)] text-xs font-mono font-semibold mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>EDUCATION</span>
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">B.E. Computer Science</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">CBIT · CGPA: 9.06 (2022–2026)</p>
            </div>

            <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--color-success)] text-xs font-mono font-semibold mb-1">
                <Briefcase className="w-4 h-4" />
                <span>FOCUS DOMAINS</span>
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">AI Systems &amp; Full Stack</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">Python, React, TypeScript, Node.js</p>
            </div>

            <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--accent-primary)] text-xs font-mono font-semibold mb-1">
                <Award className="w-4 h-4" />
                <span>DOCUMENT INTEGRITY</span>
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Direct PDF Delivery</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">Original Authoritative Document</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
