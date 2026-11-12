import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePortfolio } from '../content';
import { EngineeringModeBadge } from '../components/common/EngineeringModeBadge';
import {
  ArrowLeft,
  Github,
  ExternalLink,
  Cpu,
  Terminal,
  Database,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const CaseStudyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { content } = usePortfolio();

  const matchingProject = content.projects.find(
    (p) => p.caseStudySlug === slug || p.id.toLowerCase() === slug?.toLowerCase()
  );
  const storedCaseStudy = slug ? content.caseStudies[slug] : undefined;

  // GitHub-discovered projects receive a useful generated case study automatically.
  // Curated case studies always take precedence when richer project-specific content exists.
  const caseStudy = storedCaseStudy || (matchingProject ? {
    slug: matchingProject.caseStudySlug || matchingProject.id,
    title: matchingProject.name,
    subtitle: matchingProject.tagline || matchingProject.category || 'Project Case Study',
    overview: matchingProject.description || matchingProject.summary || `${matchingProject.name} is a software project documented from its available portfolio and repository metadata.`,
    problem: `This project explores the problem space described by its repository and project summary: ${matchingProject.summary || matchingProject.description || matchingProject.tagline || 'building a practical software solution'}.`,
    whyBuilt: `This project was developed to explore and implement ${matchingProject.tagline || matchingProject.name + ' capabilities'} using the technologies and engineering approach listed below. This generated case study is a starting point and can be enriched with project-specific implementation details.`,
    architectureSummary: matchingProject.architectureFlow?.summary || `The project is organised around the technologies in its stack: ${(matchingProject.stack || []).join(', ') || 'the project technology stack'}. The architecture description is based on available repository metadata and should be expanded as implementation details are confirmed.`,
    architectureFlow: matchingProject.architectureFlow?.nodes || [
      { id: '1', label: 'User Interface', sublabel: 'Project client and interaction layer', status: 'Prototype' as const },
      { id: '2', label: 'Application Services', sublabel: 'Core application logic and APIs', status: 'Prototype' as const },
      { id: '3', label: 'Data & Integrations', sublabel: 'Persistence and external services', status: 'Prototype' as const },
    ],
    dataPipeline: matchingProject.summary || matchingProject.description || 'Data flow details will be added as the repository implementation is reviewed.',
    frontendNotes: `Frontend technologies identified for this project: ${(matchingProject.stack || []).filter((item) => /react|next|vue|angular|html|css|vite|tailwind/i.test(item)).join(', ') || 'See the repository for the current client implementation.'}`,
    backendNotes: `Backend and service technologies identified for this project: ${(matchingProject.stack || []).filter((item) => /python|fastapi|node|express|java|spring|django|flask|go|rust/i.test(item)).join(', ') || 'See the repository for the current service implementation.'}`,
    databaseNotes: `Data technologies identified for this project: ${(matchingProject.stack || []).filter((item) => /sql|mongo|postgres|mysql|supabase|firebase|redis/i.test(item)).join(', ') || 'Database details should be confirmed from the repository configuration.'}`,
    technicalDecisions: [{
      decision: 'Technology selection',
      rationale: `The listed stack includes ${(matchingProject.stack || []).join(', ') || 'the technologies documented in the repository'}. Specific trade-offs should be documented after reviewing the implementation.`,
    }],
    challenges: ['Implementation-specific challenges should be added after reviewing the repository issues, code, and development history.'],
    lessons: ['Document measurable engineering outcomes and lessons as the project evolves.'],
    futureWork: [{ item: 'Expand this generated case study with verified architecture, implementation details, and project outcomes', status: 'Planned' as const }],
    repoUrl: matchingProject.githubUrl,
    stack: matchingProject.stack || [],
  } : undefined);
  const liveUrl = matchingProject?.liveUrl;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const baseTitle = 'Sai Nithin Reddy – AI Engineer & Full-Stack Developer';
    const baseDescription = 'Third-year Computer Science & Engineering student at CBIT Hyderabad. Explore Sai Nithin Reddy’s AI, full-stack, and software engineering projects.';
    const baseUrl = window.location.origin + '/';
    const description = caseStudy?.overview
      ? caseStudy.overview.replace(/\\s+/g, ' ').slice(0, 157).trimEnd() + (caseStudy.overview.length > 157 ? '…' : '')
      : baseDescription;
    const title = caseStudy ? `${caseStudy.title} | Sai Nithin Reddy` : baseTitle;
    const canonicalUrl = caseStudy ? window.location.origin + window.location.pathname : baseUrl;

    document.title = title;
    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.content = value;
    };
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    return () => {
      document.title = baseTitle;
      setMeta('meta[name="description"]', 'name', 'description', baseDescription);
      setMeta('meta[property="og:title"]', 'property', 'og:title', baseTitle);
      setMeta('meta[property="og:description"]', 'property', 'og:description', baseDescription);
      setMeta('meta[property="og:url"]', 'property', 'og:url', baseUrl);
      setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', baseTitle);
      setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', baseDescription);
      if (canonical) canonical.href = baseUrl;
    };
  }, [caseStudy]);

  if (!caseStudy) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 max-w-4xl mx-auto text-center text-[var(--text-primary)]">
        <h1 className="text-2xl font-bold mb-4">Case Study Not Found</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          This case study is unavailable. Check the project link or return to the portfolio.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-mono tracking-wider font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Portfolio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-24 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 focus-visible:outline-hidden cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO PORTFOLIO</span>
          </button>
        </div>

        <EngineeringModeBadge
          componentName={`CaseStudy:${caseStudy.slug}`}
          notes="Project Technical Overview"
          className="mb-4"
        />

        <header className="mb-12 pb-8 border-b border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--accent-secondary)] mb-2">
            <span>TECHNICAL CASE STUDY</span>
            <span aria-hidden="true" className="text-[var(--text-muted)] opacity-40">·</span>
            <span>SYSTEM DESIGN</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {caseStudy.title}
          </h1>
          <div className="border-b border-dashed border-[var(--border-subtle)] my-3 w-full" />
          <p className="mt-2 text-base sm:text-lg text-[var(--text-secondary)]">
            {caseStudy.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="font-mono text-[var(--text-muted)]">STACK:</span>
              {caseStudy.stack.map((t, idx) => (
                <React.Fragment key={t}>
                  <span className="font-mono text-[var(--text-primary)]">{t}</span>
                  {idx < caseStudy.stack.length - 1 && <span className="text-[var(--text-muted)] opacity-40">·</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {liveUrl && (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 text-xs font-mono font-semibold transition-opacity cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>OPEN LIVE DEMO</span>
                </a>
              )}
              {caseStudy.repoUrl && (
                <a
                  href={caseStudy.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--text-primary)] text-xs font-mono text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <Github className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>VIEW REPOSITORY</span>
                  <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                </a>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-12">
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--accent-primary)]">01</span>
              <span>Overview</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              {caseStudy.overview}
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                <span>The Engineering Problem</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {caseStudy.problem}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[var(--accent-secondary)]" />
                <span>Why I Built It</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {caseStudy.whyBuilt}
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--accent-primary)]">02</span>
              <span>Architecture &amp; Pipeline</span>
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-6">
              {caseStudy.architectureSummary}
            </p>
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-transparent">
              <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-4">
                Component Flow
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {caseStudy.architectureFlow.map((node, i) => (
                  <div
                    key={node.id}
                    className="p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
                      <span>0{i + 1}</span>
                      <span className={node.status === 'Implemented' ? 'text-[var(--color-success)]' : 'text-[var(--accent-secondary)]'}>
                        {node.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">{node.label}</div>
                    {node.sublabel && (
                      <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                        {node.sublabel}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--accent-primary)]">03</span>
                <span>Data Pipeline &amp; Modeling</span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {caseStudy.dataPipeline}
              </p>
            </div>
            {caseStudy.mlPipeline && (
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-secondary)] mb-2">
                  <Cpu className="w-4 h-4" />
                  <span>MACHINE LEARNING PIPELINE</span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {caseStudy.mlPipeline}
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="text-xs font-mono text-[var(--accent-primary)]">04</span>
              <span>Subsystem Breakdown</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-primary)] mb-2 font-semibold">
                  <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Frontend</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {caseStudy.frontendNotes}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-secondary)] mb-2 font-semibold">
                  <Cpu className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <span>Backend</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {caseStudy.backendNotes}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-primary)] mb-2 font-semibold">
                  <Database className="w-4 h-4 text-[var(--color-success)]" />
                  <span>Database</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {caseStudy.databaseNotes}
                </p>
              </div>
            </div>
          </section>

          {caseStudy.technicalDecisions && caseStudy.technicalDecisions.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--accent-primary)]">05</span>
                <span>Technical Decisions</span>
              </h2>
              <div className="space-y-3">
                {caseStudy.technicalDecisions.map((td, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]"
                  >
                    <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                      {td.decision}
                    </div>
                    <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {td.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" />
                <span>Actual Challenges Encountered</span>
              </h2>
              <ul className="space-y-2">
                {caseStudy.challenges.map((c, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--color-danger)] mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
                <span>Engineering Lessons</span>
              </h2>
              <ul className="space-y-2">
                {caseStudy.lessons.map((l, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--color-success)] mt-0.5">•</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="p-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Future Work &amp; Next Iterations</span>
            </h2>
            <div className="space-y-2">
              {caseStudy.futureWork.map((fw, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-[var(--text-secondary)] py-1 border-b border-[var(--border-subtle)] last:border-0"
                >
                  <span>{fw.item}</span>
                  <span className="font-mono text-[10px] text-[var(--accent-secondary)] uppercase">
                    [{fw.status}]
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
