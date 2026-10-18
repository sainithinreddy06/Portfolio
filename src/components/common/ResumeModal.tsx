import React, { useEffect, useRef, useState } from 'react';
import { usePortfolio } from '../../content';
import { X, Printer, Download, Mail, Github, Linkedin, Code2, ExternalLink, FileText, Eye } from 'lucide-react';
import { downloadResume, getResumeFileUrl } from '../../utils/resumeManager';

export const ResumeModal: React.FC = () => {
  const { isResumeModalOpen, setIsResumeModalOpen, content } = usePortfolio();
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'pdf' | 'transcript'>('transcript');
  const modalRef = useRef<HTMLDivElement>(null);
  const resume = content.profile.resume;
  const isAvailable = resume?.isAvailable !== false;
  const resumeFileUrl = getResumeFileUrl(content);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isResumeModalOpen) {
        setIsResumeModalOpen(false);
      }
    };
    if (isResumeModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isResumeModalOpen, setIsResumeModalOpen]);

  if (!isResumeModalOpen) return null;

  const handlePrint = () => {
    if (!isAvailable) return;
    window.print();
  };

  const handleDownload = async () => {
    if (!isAvailable) return;
    setIsDownloading(true);
    try {
      await downloadResume(content);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Curriculum Vitae of Tadugam Sai Nithin Reddy"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white"
      onClick={() => setIsResumeModalOpen(false)}
    >
      <div
        ref={modalRef}
        className="w-full max-w-4xl bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-card)] rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:text-black print:bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-primary)] uppercase">
              {isAvailable ? 'VERIFIED DOCUMENT' : 'DOCUMENT STATUS'}
            </span>
            <div className="flex items-center gap-1 bg-[var(--surface-elevated)] p-0.5 rounded border border-[var(--border-subtle)] text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setViewMode('pdf')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'pdf'
                    ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                PDF Document
              </button>
              <button
                type="button"
                onClick={() => setViewMode('transcript')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'transcript'
                    ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Structured CV
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <a
                href={resumeFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open original resume PDF in new tab"
                className="px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-xs font-mono tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>OPEN PDF</span>
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/40 text-[var(--text-muted)] text-xs font-mono tracking-wider flex items-center gap-1.5 opacity-50 cursor-not-allowed select-none"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OPEN PDF</span>
              </span>
            )}
            <button
              onClick={handleDownload}
              disabled={isDownloading || !isAvailable}
              aria-label="Download original resume"
              className="px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-xs font-mono tracking-wider text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-success)]" />
              <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD ORIGINAL RESUME'}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={!isAvailable}
              aria-label="Print resume"
              className="hidden sm:flex px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-xs font-mono tracking-wider text-[var(--text-primary)] items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>PRINT</span>
            </button>
            <button
              onClick={() => setIsResumeModalOpen(false)}
              aria-label="Close resume viewer"
              className="p-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'pdf' ? (
          isAvailable ? (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[var(--bg-secondary)] min-h-[55vh]">
              <div className="p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--accent-primary)] mb-4 shadow-xs">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1">
                Sai_Nithin_Reddy_Resume.pdf
              </h3>
              <p className="text-xs font-mono text-[var(--text-secondary)] mb-6 max-w-md">
                Official Curriculum Vitae · Computer Science &amp; Engineering · CBIT (CGPA: 9.06)
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
                <a
                  href={resumeFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs tracking-wider uppercase font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>OPEN PDF IN FULL TAB</span>
                </a>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-5 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-mono text-xs tracking-wider uppercase font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[var(--color-success)]" />
                  <span>DOWNLOAD ORIGINAL RESUME</span>
                </button>
                <button
                  onClick={() => setViewMode('transcript')}
                  className="px-5 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] font-mono text-xs tracking-wider uppercase font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>VIEW STRUCTURED CV</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-secondary)] min-h-[50vh]">
              <div className="w-14 h-14 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-4 text-[var(--accent-primary)] shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold font-mono uppercase tracking-wider text-[var(--text-primary)] mb-2">
                Resume Temporarily Unavailable
              </h3>
              <p className="max-w-md text-xs sm:text-sm text-[var(--text-secondary)] mb-6 font-mono leading-relaxed">
                {resume.comingSoonMessage || 'The curriculum vitae is currently being updated by the administrator. Please check back shortly or explore the interactive Structured CV view.'}
              </p>
              <button
                type="button"
                onClick={() => setViewMode('transcript')}
                className="px-4 py-2 rounded-sm bg-[var(--accent-primary)] text-black font-mono text-xs font-bold tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                VIEW STRUCTURED CV
              </button>
            </div>
          )
        ) : (
          <div className="overflow-y-auto p-6 sm:p-10 font-sans print:p-0 print:overflow-visible">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center pb-4 border-b border-[var(--border-subtle)]">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Tadugam Sai Nithin Reddy
                </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-mono text-[var(--text-secondary)]">
                <a
                  href="mailto:sainithinreddytadugam@gmail.com"
                  className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors"
                >
                  <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>sainithinreddytadugam@gmail.com</span>
                </a>
                <span>·</span>
                <a
                  href="https://github.com/sainithinreddy06"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors"
                >
                  <Github className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>sainithinreddy06</span>
                </a>
                <span>·</span>
                <a
                  href="https://www.linkedin.com/in/sai-nithin-reddy-tadugam-906825372"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors"
                >
                  <Linkedin className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>Sai Nithin Reddy Tadugam</span>
                </a>
                {content.profile.leetcodeUrl && (
                  <>
                    <span>·</span>
                    <a
                      href={content.profile.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <Code2 className="w-3 h-3 text-[#FFA116]" />
                      <span>leetcode/{content.profile.leetcodeUsername || 'Nithinreddy_06'}</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] pb-1 border-b border-[var(--border-subtle)] mb-2">
                Introduction
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Third-year Computer Science undergraduate with proficiency in Python, C, C++, Java, JavaScript, SQL, and web development, with a strong foundation in Data Structures, Object-Oriented Programming, and Machine Learning. Experienced in developing AI-powered and full-stack applications using React, FastAPI, Node.js, MongoDB, and modern APIs, with a focus on building practical software solutions.
              </p>
            </div>

            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] pb-1 border-b border-[var(--border-subtle)] mb-3">
                Education
              </h2>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">
                      Chaitanya Bharathi Institute of Technology (CBIT), Hyderabad
                    </span>
                    <div className="text-[var(--text-secondary)] text-xs mt-0.5">
                      B.E./B.Tech. – Computer Science &amp; Engineering
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-[var(--text-muted)] mt-1 sm:mt-0">
                    <span className="font-semibold text-[var(--color-success)]">CGPA: 9.06</span>
                    <span className="mx-2">·</span>
                    <span>2024 – 2028</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">
                      Narayana Institutions, Hyderabad
                    </span>
                    <div className="text-[var(--text-secondary)] text-xs mt-0.5">
                      Board of Intermediate Education, Telangana
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-[var(--text-muted)] mt-1 sm:mt-0">
                    <span className="font-semibold text-[var(--color-success)]">CGPA: 9.41</span>
                    <span className="mx-2">·</span>
                    <span>2022 – 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] pb-1 border-b border-[var(--border-subtle)] mb-2.5">
                Technical Skills
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Programming Languages: </span>
                  <span className="text-[var(--text-secondary)] font-mono">Python, C, C++, Java, JavaScript, SQL</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Web Technologies: </span>
                  <span className="text-[var(--text-secondary)] font-mono">HTML, CSS, React, Node.js, FastAPI</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Databases: </span>
                  <span className="text-[var(--text-secondary)] font-mono">MySQL, MongoDB, PostgreSQL</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Machine Learning: </span>
                  <span className="text-[var(--text-secondary)] font-mono">Scikit-learn, XGBoost, Pandas, NumPy</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Tools &amp; Infrastructure: </span>
                  <span className="text-[var(--text-secondary)] font-mono">Git, GitHub, Docker, VS Code</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Core Concepts: </span>
                  <span className="text-[var(--text-secondary)] font-mono">Data Structures, Algorithms, OOP, DBMS, OS, Computer Networks</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] pb-1 border-b border-[var(--border-subtle)] mb-3">
                Key Engineering Projects
              </h2>
              <div className="space-y-4 text-xs">
                {content.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between font-bold text-[var(--text-primary)]">
                      <span>{proj.name} – {proj.tagline}</span>
                      <span className="font-mono text-[11px] text-[var(--accent-secondary)] font-normal">{proj.status}</span>
                    </div>
                    <div className="font-mono text-[11px] text-[var(--text-muted)] mb-1">
                      {proj.stack.join(', ')}
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      {proj.description || proj.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
