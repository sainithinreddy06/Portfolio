import React from 'react';
import { Hero } from '../components/sections/Hero';
import { SelectedWork } from '../components/sections/SelectedWork';
import { Engineering } from '../components/sections/Engineering';
import { Architecture } from '../components/sections/Architecture';
import { ExperienceEducation } from '../components/sections/ExperienceEducation';
import { About } from '../components/sections/About';
import { ResumeSection } from '../components/sections/ResumeSection';
import { ContactSection } from '../components/sections/ContactSection';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <About />
      <SelectedWork />
      <Engineering />
      <Architecture />
      <ExperienceEducation />
      <ResumeSection />
      <ContactSection>
        <div
          className="mt-8 p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]"
          dangerouslySetInnerHTML={{
            __html: `
              <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "Person",
                  "name": "Sai Nithin Reddy",
                  "url": "https://sai-nithin-portfolio.onrender.com",
                  "image": "https://sai-nithin-portfolio.onrender.com/images/profile-photo.png",
                  "email": "sainithinreddytadugam@gmail.com",
                  "description": "AI Engineer & Full-Stack Developer — building AI-first full-stack systems with React, Node, and cloud infrastructure. Specializing in turning research prototypes into production-grade systems with measurable engineering outcomes.",
                  "worksFor": "Chaitanya Bharathi Institute of Technology (CBIT)",
                  "sameAs": [
                    "https://github.com/sainithinreddy06",
                    "https://www.linkedin.com/in/sai-nithin-reddy-tadugam-906825372"
                  ]
                }
              </script>
            `,
          }}
        />
      </ContactSection>
    </div>
  );
};
