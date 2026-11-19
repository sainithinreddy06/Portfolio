import React, { useState } from 'react';
import { usePortfolio } from '../../content';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { downloadResume, getResumeFileUrl } from '../../utils/resumeManager';

export const ResumeSection: React.FC = () => {
  const { content } = usePortfolio();
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
            notes="Original Resume PDF"
            className="mb-3"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
              07 / RESUME
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Original Resume
          </h2>
          <div className="border-b border-dashed border-[var(--border-subtle)] my-2 w-full" />
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-2xl">
            View or download the original PDF. The document is served as supplied, without AI rewriting or reconstruction.
          </p>
        </div>

        <div className="p-0 sm:p-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--accent-primary)] shrink-0 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {resume.fileName || 'Original Resume.pdf'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  PDF document
                  {resume.fileSize ? ` · ${resume.fileSize}` : ''}
                  {typeof content.profile.cgpa === 'number' && ` · CGPA: ${content.profile.cgpa.toFixed(2)}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={resumeFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View original resume PDF in a new tab"
                className="px-5 py-2.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs tracking-wider uppercase font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs cursor-pointer focus-visible:outline-hidden"
              >
                <ExternalLink className="w-4 h-4" />
                <span>VIEW RESUME</span>
              </a>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                aria-label="Download original resume PDF"
                className="px-5 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-mono text-xs tracking-wider uppercase font-semibold transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-hidden shadow-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-[var(--color-success)]" />
                <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD ORIGINAL RESUME'}</span>
              </button>
            </div>
          </div>

          {resume.isAvailable ? (
            <div className="mt-6 overflow-hidden rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              <iframe
                src={resumeFileUrl}
                title={`${content.profile.name} original resume PDF`}
                className="block w-full min-h-[560px] sm:min-h-[760px]"
                loading="lazy"
              />
              <p className="px-4 py-3 text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)]">
                If the PDF preview is unavailable in your browser, use View Resume or Download Original Resume.
              </p>
            </div>
          ) : (
            <p role="status" className="mt-6 rounded-sm border border-[var(--border-subtle)] p-5 text-sm text-[var(--text-secondary)]">
              The original resume PDF is currently unavailable.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
