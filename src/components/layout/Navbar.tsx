import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePortfolio } from '../../content';
import { Sun, Moon, X, Terminal, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);
  const { content, engineeringMode, toggleEngineeringMode, theme, toggleTheme } = usePortfolio();
  const location = useLocation();
  const navigate = useNavigate();
  const indexButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setIsScrolled(currentScroll > 20);
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((currentScroll / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && indexOpen) {
        setIndexOpen(false);
        indexButtonRef.current?.focus();
      }
    };
    if (indexOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [indexOpen]);

  const handleNavClick = (sectionId: string) => {
    setIndexOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const allSections = [
    { num: '01', label: 'INTRO', target: 'hero', desc: 'Identity, Degree & Core Focus' },
    { num: '02', label: 'ABOUT', target: 'about', desc: 'Engineering Mindset & Personal Profile' },
    { num: '03', label: 'SELECTED WORK', target: 'work', desc: 'Engineering Project Index & Selected Work' },
    { num: '04', label: 'ENGINEERING', target: 'engineering', desc: 'Technical Stack & Verified Disciplines' },
    { num: '05', label: 'ARCHITECTURE', target: 'architecture', desc: 'System Pipeline Diagrams & Ingestion Flows' },
    { num: '06', label: 'EXPERIENCE & EDUCATION', target: 'experience', desc: 'CBIT Education, Club Leadership & Competitions' },
    { num: '07', label: 'RESUME', target: 'resume', desc: 'Verified Curriculum Vitae & Download' },
    { num: '08', label: 'CONTACT', target: 'contact', desc: 'Direct Channels (Email, GitHub, LinkedIn)' },
  ];

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[var(--accent-primary)] text-white font-medium text-xs rounded-md shadow-lg outline-none font-mono"
      >
        Skip to main content
      </a>
      <div
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 border-b ${
          isScrolled
            ? 'bg-[var(--bg-primary)]/90 backdrop-blur-md border-[var(--border-subtle)] py-3 shadow-md'
            : 'bg-transparent border-transparent py-4'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            to="/"
            className="text-sm sm:text-base font-bold font-mono tracking-widest uppercase text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors focus-visible:outline-hidden"
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            {content.profile.wordmark}
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="hidden md:flex items-center gap-6 font-mono text-xs tracking-wider uppercase text-[var(--text-secondary)]">
              <button
                onClick={() => handleNavClick('about')}
                className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-hidden cursor-pointer"
              >
                ABOUT
              </button>
              <button
                onClick={() => handleNavClick('work')}
                className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-hidden cursor-pointer"
              >
                WORK
              </button>
              <button
                onClick={() => handleNavClick('engineering')}
                className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-hidden cursor-pointer"
              >
                ENGINEERING
              </button>
              <button
                onClick={() => handleNavClick('resume')}
                className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-hidden cursor-pointer"
              >
                RESUME
              </button>
              <a
                href={content.profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--text-primary)] transition-colors focus-visible:outline-hidden inline-flex items-center gap-1 cursor-pointer"
              >
                <span>GITHUB</span>
                <span className="text-[10px] text-[var(--text-muted)]">↗</span>
              </a>
            </nav>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'day' ? 'Night' : 'Day'} theme`}
              aria-pressed={theme === 'night'}
              className="px-2.5 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-mono tracking-widest uppercase transition-colors flex items-center gap-1.5 focus-visible:outline-hidden cursor-pointer"
            >
              {theme === 'day' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>NIGHT</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                  <span>DAY</span>
                </>
              )}
            </button>
            <button
              ref={indexButtonRef}
              onClick={() => setIndexOpen(true)}
              aria-expanded={indexOpen}
              aria-haspopup="dialog"
              aria-label="Open index menu"
              className="px-3 py-1.5 rounded-sm border border-[var(--text-primary)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] text-[11px] font-mono tracking-widest uppercase font-semibold transition-all duration-150 focus-visible:outline-hidden cursor-pointer"
            >
              INDEX
            </button>
          </div>
        </div>
      </header>

      {indexOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site Index Navigation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIndexOpen(false)}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-2xl rounded-xl border border-[var(--border-card)] bg-[var(--bg-primary)] p-6 sm:p-8 shadow-2xl text-[var(--text-primary)] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] mb-6">
              <div>
                <span className="text-xs font-mono text-[var(--accent-secondary)] tracking-widest uppercase block font-semibold">
                  SYSTEM DIRECTORY
                </span>
                <h2 className="text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
                  SITE INDEX
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleEngineeringMode}
                  title="Toggle Engineering Mode"
                  className={`px-2.5 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                    engineeringMode
                      ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold'
                      : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>ENG MODE: {engineeringMode ? 'ON' : 'OFF'}</span>
                  </span>
                </button>
                <button
                  onClick={() => setIndexOpen(false)}
                  aria-label="Close index dialog"
                  className="p-1.5 rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <nav className="overflow-y-auto space-y-2 pr-1 flex-1 py-1">
              {allSections.map((sec) => (
                <button
                  key={sec.target}
                  onClick={() => handleNavClick(sec.target)}
                  className="w-full text-left p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-baseline gap-3 sm:gap-4 min-w-0">
                    <span className="text-sm font-mono text-[var(--accent-primary)] font-bold tracking-widest shrink-0">
                      {sec.num} /
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                        {sec.label}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] truncate hidden sm:block mt-0.5">
                        {sec.desc}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                </button>
              ))}
            </nav>

            <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-3">
                <a
                  href={content.profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  GITHUB ↗
                </a>
                <span>·</span>
                <a
                  href={content.profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  LINKEDIN ↗
                </a>
                <span>·</span>
                <a
                  href={`mailto:${content.profile.email}`}
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  EMAIL ↗
                </a>
              </div>
              <div className="text-[10px]">
                PRESS <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">ESC</kbd> TO CLOSE
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
