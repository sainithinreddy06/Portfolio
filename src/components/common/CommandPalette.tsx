import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../../content';
import {
  Search,
  ExternalLink,
  Terminal,
  FileText,
  Mail,
  Layers,
  GraduationCap,
  User,
  Settings,
  Sun,
  Moon,
  X,
  RefreshCw,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'Navigation' | 'External' | 'Preferences' | 'Actions';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {
    content,
    engineeringMode,
    toggleEngineeringMode,
    theme,
    toggleTheme,
    setIsResumeModalOpen,
    syncWithGitHubNow,
  } = usePortfolio();

  const scrollToSection = (id: string) => {
    onClose();
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const commands: CommandItem[] = [
    {
      id: 'nav-intro',
      label: 'Go to Intro / Hero',
      description: '01 / INTRO – Sai Nithin Reddy portfolio header',
      icon: <User className="w-4 h-4 text-[var(--accent-primary)]" />,
      category: 'Navigation',
      action: () => scrollToSection('hero'),
    },
    {
      id: 'nav-about',
      label: 'Go to About',
      description: '02 / ABOUT – Engineering mindset and personal profile',
      icon: <User className="w-4 h-4 text-[var(--text-primary)]" />,
      category: 'Navigation',
      action: () => scrollToSection('about'),
    },
    {
      id: 'nav-work',
      label: 'Go to Selected Work',
      description: '03 / SELECTED WORK – Dynamic GitHub repositories',
      icon: <Layers className="w-4 h-4 text-[var(--accent-primary)]" />,
      category: 'Navigation',
      action: () => scrollToSection('work'),
    },
    {
      id: 'action-sync-github',
      label: 'Synchronize Repositories from GitHub',
      description: 'Fetch latest descriptions, live demos, and topics from @sainithinreddy06',
      icon: <RefreshCw className="w-4 h-4 text-[var(--color-success)]" />,
      category: 'Actions',
      action: () => {
        onClose();
        syncWithGitHubNow();
      },
    },
    {
      id: 'nav-engineering',
      label: 'Go to Engineering & Stack',
      description: '04 / ENGINEERING – Python, FastAPI, React, Machine Learning',
      icon: <Terminal className="w-4 h-4 text-[var(--accent-secondary)]" />,
      category: 'Navigation',
      action: () => scrollToSection('engineering'),
    },
    {
      id: 'nav-architecture',
      label: 'Go to System Architecture',
      description: '05 / ARCHITECTURE – End-to-end pipeline diagrams and flows',
      icon: <Layers className="w-4 h-4 text-[var(--accent-primary)]" />,
      category: 'Navigation',
      action: () => scrollToSection('architecture'),
    },
    {
      id: 'nav-experience',
      label: 'Go to Experience & Education',
      description: '06 / EXPERIENCE & EDUCATION – CBIT Hyderabad (CGPA 9.06)',
      icon: <GraduationCap className="w-4 h-4 text-[var(--color-success)]" />,
      category: 'Navigation',
      action: () => scrollToSection('experience'),
    },
    {
      id: 'nav-resume',
      label: 'View Curriculum Vitae',
      description: '07 / RESUME – Verified document viewer & download',
      icon: <FileText className="w-4 h-4 text-[var(--color-warning)]" />,
      category: 'Navigation',
      action: () => {
        onClose();
        setIsResumeModalOpen(true);
      },
    },
    {
      id: 'nav-contact',
      label: 'Go to Contact',
      description: '08 / CONTACT – Direct email, GitHub, LinkedIn',
      icon: <Mail className="w-4 h-4 text-[var(--accent-primary)]" />,
      category: 'Navigation',
      action: () => scrollToSection('contact'),
    },
    {
      id: 'pref-theme',
      label: `Switch to ${theme === 'day' ? 'Night (Dark)' : 'Day (Light)'} Theme`,
      description: `Current theme: ${theme.toUpperCase()}`,
      icon: theme === 'day' ? <Moon className="w-4 h-4 text-[var(--accent-primary)]" /> : <Sun className="w-4 h-4 text-[var(--color-warning)]" />,
      category: 'Preferences',
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'pref-engineering-mode',
      label: `Toggle Engineering Mode (${engineeringMode ? 'Active' : 'Inactive'})`,
      description: 'Inspect component names, architecture tags, and technical metadata',
      icon: <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />,
      category: 'Preferences',
      action: () => {
        toggleEngineeringMode();
        onClose();
      },
    },
    {
      id: 'ext-github',
      label: 'Open GitHub Profile',
      description: 'https://github.com/sainithinreddy06',
      icon: <ExternalLink className="w-4 h-4 text-[var(--text-secondary)]" />,
      category: 'External',
      action: () => {
        window.open(content.profile.githubUrl, '_blank', 'noopener,noreferrer');
        onClose();
      },
    },
    {
      id: 'ext-linkedin',
      label: 'Open LinkedIn Profile',
      description: 'Sai Nithin Reddy Tadugam',
      icon: <ExternalLink className="w-4 h-4 text-[var(--accent-secondary)]" />,
      category: 'External',
      action: () => {
        window.open(content.profile.linkedinUrl, '_blank', 'noopener,noreferrer');
        onClose();
      },
    },
    {
      id: 'action-email',
      label: 'Send Email',
      description: content.profile.email,
      icon: <Mail className="w-4 h-4 text-[var(--color-success)]" />,
      category: 'External',
      action: () => {
        window.location.href = `mailto:${content.profile.email}`;
        onClose();
      },
    },
    {
      id: 'pref-admin',
      label: 'Open Admin CMS',
      description: 'Manage profile data, photo settings, and GitHub synchronization',
      icon: <Settings className="w-4 h-4 text-[var(--text-secondary)]" />,
      category: 'Preferences',
      action: () => {
        navigate('/admin');
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-[var(--border-card)] bg-[var(--bg-primary)] shadow-2xl overflow-hidden text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <Search className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to section..."
            aria-label="Search commands"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-mono"
            >
              CLEAR
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close command palette"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-[var(--text-muted)]">
              NO MATCHING COMMANDS FOUND
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                    isSelected ? 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)]' : 'hover:bg-[var(--surface-elevated)]/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 p-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                      {cmd.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--text-primary)] truncate">{cmd.label}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">{cmd.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 uppercase ml-2">
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[11px] font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>·</span>
            <span>↵ Select</span>
            <span>·</span>
            <span>Esc Close</span>
          </div>
          <span className="hidden sm:inline">SAI NITHIN REDDY · CSE CBIT</span>
        </div>
      </div>
    </div>
  );
};
