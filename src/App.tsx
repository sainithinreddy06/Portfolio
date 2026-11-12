import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PortfolioProvider } from './content';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CustomCursor } from './components/common/CustomCursor';
import { CommandPalette } from './components/common/CommandPalette';
import { ResumeModal } from './components/common/ResumeModal';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const CaseStudyPage = lazy(() => import('./pages/CaseStudyPage').then((module) => ({ default: module.CaseStudyPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

export default function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <PortfolioProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-primary)]/30 selection:text-[var(--text-primary)] relative flex flex-col justify-between transition-colors duration-200">
          <CustomCursor />
          <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />
          <ResumeModal />
          <main id="main-content" className="flex-1">
            <Suspense
              fallback={
                <div className="min-h-[50vh] flex items-center justify-center text-sm text-[var(--text-secondary)]" role="status" aria-live="polite">
                  Loading page…
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/work/:slug" element={<CaseStudyPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
        </div>
      </BrowserRouter>
    </PortfolioProvider>
  );
}
