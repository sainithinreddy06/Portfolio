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
    <main id="main-content" className="min-h-screen">
      <Hero />
      <About />
      <SelectedWork />
      <Engineering />
      <Architecture />
      <ExperienceEducation />
      <ResumeSection />
      <ContactSection />
    </main>
  );
};
