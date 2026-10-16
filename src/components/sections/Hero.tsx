import React from 'react';
import { usePortfolio } from '../../content';
import { PhotoFrame } from '../common/PhotoFrame';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';
import { WarpedMeshBackground } from '../common/WarpedMeshBackground';
import { ArrowDown, Github, Linkedin, ExternalLink } from 'lucide-react';

export const Hero: React.FC = () => {
  const { content } = usePortfolio();
  const { profile } = content;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const showHeroPhoto = profile.photo.showInHero !== false;

  return (
    <section
      id="hero"
      aria-label="Hero Introduction"
      className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden"
    >
      <WarpedMeshBackground opacity={0.9} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <EngineeringModeBadge
          componentName="HeroSection"
          notes="Identity, Degree, Core Positioning"
          className="mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className={`${showHeroPhoto ? 'md:col-span-7 lg:col-span-8' : 'md:col-span-12'} space-y-5`}>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
                01 / INTRO
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[var(--text-primary)] leading-[1.05]">
              {profile.name}.
            </h1>

            <p className="text-xs sm:text-sm font-mono tracking-widest uppercase text-[var(--text-secondary)] font-medium">
              {profile.positioning}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[11px] font-mono tracking-wider text-[var(--text-primary)] shadow-xs">
                {profile.institution}
              </span>
              <span className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[11px] font-mono tracking-wider text-[var(--text-primary)] shadow-xs">
                {profile.degree}
              </span>
              <span className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[11px] font-mono tracking-wider text-[var(--text-muted)] shadow-xs">
                {profile.batchPeriod}
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                {profile.headline}
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                {profile.supportingCopy}
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => scrollTo('work')}
                className="px-5 py-2.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] font-mono text-xs tracking-wider uppercase font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm focus-visible:outline-hidden cursor-pointer"
              >
                <span>VIEW WORK</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-2 focus-visible:outline-hidden shadow-xs cursor-pointer"
                aria-label="GitHub Profile"
              >
                <Github className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GITHUB</span>
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
              </a>
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-2 focus-visible:outline-hidden shadow-xs cursor-pointer"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LINKEDIN</span>
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
              </a>
            </div>
          </div>

          {showHeroPhoto && (
            <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center md:items-end justify-start pt-2">
              <PhotoFrame
                photo={profile.photo}
                size="hero"
                caption={profile.wordmark || profile.name}
                captionAlign="center"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
