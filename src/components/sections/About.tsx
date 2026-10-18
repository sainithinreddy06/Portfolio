import React from 'react';
import { usePortfolio } from '../../content';
import { PhotoFrame } from '../common/PhotoFrame';
import { EngineeringModeBadge } from '../common/EngineeringModeBadge';

export const About: React.FC = () => {
  const { content } = usePortfolio();
  const { profile } = content;

  return (
    <section
      id="about"
      aria-label="About Sai Nithin Reddy"
      className="py-20 sm:py-28 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <EngineeringModeBadge
          componentName="AboutSection"
          notes="Editorial Storytelling · Engineering Mindset · Chaitanya Bharathi Institute of Technology (CBIT)"
          className="mb-4"
        />

        <div className="flex items-center gap-2 mb-6">
          <span className="font-mono text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">
            02 / ABOUT
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start pb-8 sm:pb-12">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-bold tracking-tight text-[var(--text-primary)] leading-[1.14]">
              I build intelligent systems,{' '}
              <br className="hidden sm:inline" />
              <span className="font-serif italic font-normal text-[var(--text-primary)]">
                and turn real-world problems into software.
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
              INTRODUCTION
            </div>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              I work at the intersection of AI/ML and full-stack development, building practical
              systems that connect intelligent data pipelines with dependable, human-centered
              software.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start pt-2 sm:pt-4">
          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            <p>
              I am a third-year Computer Science &amp; Engineering student at Chaitanya Bharathi
              Institute of Technology (CBIT), pursuing my degree from 2024 to 2028. My interest lies
              in artificial intelligence, machine learning, and core software engineering, and I
              have found that the most effective way for me to understand complex technology is to
              learn primarily through building.
            </p>
            <p>
              I enjoy turning ideas into working software designed to solve real-world problems. My
              work connects frontend interfaces and backend architectures with data and
              intelligent systems, spanning areas like data-driven applications, geospatial
              platforms, computer vision, environmental intelligence, and machine-learning
              solutions without stopping at superficial demos.
            </p>
            <p>
              I approach engineering by understanding the entire lifecycle of a system: how data
              enters, how it is processed, where intelligence belongs, how APIs and services
              communicate, and how the frontend interacts with the backend. Ultimately, what
              matters most is how the final system behaves for real users—which is why I prioritize
              practicality, clean architecture, continuous experimentation, and reliable software.
            </p>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {profile.photo?.showInAbout && profile.photo?.url && !profile.photo?.isPlaceholder && (
              <div className="pb-2">
                <PhotoFrame
                  photo={profile.photo}
                  size="about"
                  caption={profile.name}
                  captionAlign="left"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
                EDUCATION
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-medium text-[var(--text-primary)]">
                  Computer Science &amp; Engineering
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Chaitanya Bharathi Institute of Technology (CBIT)
                </p>
                <div className="font-mono text-xs text-[var(--text-muted)] pt-0.5 space-y-0.5">
                  <p>2024 – 2028</p>
                  <p>Third Year · CGPA: 9.06</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)]" />

            <div className="space-y-3.5">
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
                CURRENTLY
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-medium text-[var(--text-primary)]">
                    Building
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    AI-powered and full-stack systems
                  </p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-[var(--text-primary)]">
                    Exploring
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    AI / ML · Distributed Systems · Edge Computer Vision
                  </p>
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Hyderabad, India
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
