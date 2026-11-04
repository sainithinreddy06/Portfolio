# Portfolio Improvement Master Tracker

> **Purpose:** Durable working log and prioritized execution plan for the portfolio at https://sai-nithin-portfolio.onrender.com and repository https://github.com/sainithinreddy06/Portfolio.
>
> **Last updated:** 2026-11-04  
> **Default branch inspected:** `main`  
> **Owner:** Sai Nithin Reddy  
> **Working rule:** This tracker is the source of truth for portfolio improvement work. Update it whenever portfolio work is started, changed, tested, deployed, blocked, or deliberately deferred.

---

## 1. How to maintain this tracker

Every future portfolio task must be recorded here before or as work begins.

For each task:
1. Confirm the current implementation before proposing changes.
2. Record the scope, affected files/pages, and acceptance criteria.
3. Implement in a focused change; avoid unrelated redesigns.
4. Run the relevant checks (typecheck/lint, tests, build, browser/API checks).
5. Verify the deployed result when the change affects production.
6. Update status, evidence, commit/deployment references, and date.
7. Never mark a task complete because it was merely discussed or code was written.

### Status definitions
- **Not started:** Identified, no implementation begun.
- **In progress:** Work has started but acceptance criteria are not all met.
- **Blocked:** Cannot proceed; record the exact dependency.
- **Implemented — unverified:** Code/content exists but required checks are incomplete.
- **Verified:** Acceptance criteria passed with recorded evidence.
- **Deferred:** Deliberately postponed, with reason.

### Priority definitions
- **P0 — Essential:** Trust, recruiter conversion, core project evidence, accessibility, performance, SEO, and reliability.
- **P1 — High value:** Technical writing, verified engineering activity, useful project health information.
- **P2 — Optional:** Enhancements that add real value after P0/P1; avoid novelty for its own sake.

### Completion standard
A task is **Verified** only when the implementation is reviewed, relevant tests/checks pass, and the actual user-facing behavior is confirmed. For production changes, record the live deployment or explain why live verification was unavailable. Do not invent metrics, test results, screenshots, or deployment status.

---

## 2. Project baseline

### Repository and deployment
- Repository: https://github.com/sainithinreddy06/Portfolio
- Production site: https://sai-nithin-portfolio.onrender.com
- Hosting: Render, full-stack Node/Express application serving the React frontend.
- Data persistence: Supabase `public.portfolio_state`; asset bucket: `portfolio-assets`.
- Stack documented in README: React, TypeScript, Vite, Tailwind CSS, Motion, Node.js, Express, TypeScript.
- Main app routes observed in `src/App.tsx`: `/`, `/work/:slug`, `/admin`, and fallback 404.
- Existing capabilities documented or inspected: curated project showcases, case-study route, admin content management, GitHub project synchronization/webhook support, resume and profile asset management, persistent portfolio state.

### Current featured projects listed in README
- PRAVAAH
- TAPAS
- SureStep
- TRAFFIQ
- VidyaVistaar

### Baseline limitations
- A complete visual and functional audit of the live site has **not** yet been completed.
- No Lighthouse/PageSpeed, Core Web Vitals, accessibility, SEO, or mobile audit results have been recorded yet.
- Existing case-study route is confirmed; the quality and completeness of each individual case study still need inspection.
- Do not assume a feature is missing solely because it was not visible in the files inspected so far.

---

## 3. Work completed and verified so far

| Date | Work/check | Result | Evidence / caveat |
|---|---|---|---|
| 2026-11-04 | Read repository README and `src/App.tsx` | Verified baseline stack, documented capabilities, and app routes | GitHub `main`; no code changed in this review |
| 2026-11-04 | Reviewed server-side admin verification behavior | Verified source has `GET /api/admin/verify` and returns 401 when token is missing/invalid | `server.ts` source inspection |
| 2026-11-04 | Production missing-token check | Passed | Browser showed `{"success":false,"error":"Token is missing","requiresLogin":true}`; screenshot supplied by owner |
| 2026-11-04 | Production unauthenticated write test | Passed | `POST /api/portfolio/save` with empty JSON and no credentials returned HTTP 401 with `requiresLogin: true`; no portfolio data changed |
| 2026-11-04 | Supabase table access/RLS inspection | Verified as previously inspected | RLS enabled; anon/authenticated have no table grants; service_role has required table privileges |
| 2026-11-04 | Resume/profile-photo persistence | Owner-confirmed | Owner reported assets persist after upload and restart/redeploy; not independently re-tested in this audit |
| 2026-11-04 | Login rate-limiting decision | Keep enabled | Recommended to retain and improve; configuration still needs source/config verification |
| 2026-11-04 | TAPAS and SureStep demo-link audit | TAPAS Render frontend URL added to portfolio data; SureStep has backend/ML services but no frontend deployment listed in the connected Render workspace | TAPAS service `srv-dah3n5h42hec73eld8g0` reports a `live` deploy at `https://tapas-g0ly.onrender.com`; SureStep should not be given a fabricated frontend URL. Live HTTP/browser smoke test remains outstanding |
| 2026-11-04 | Resume/navigation wording pass | Removed unsupported `Verified` claims from resume labels and changed the engineering navigation descriptor to `Focus Areas` | Commits `7472e902f6632468868df101decb490957f2030b` and `06aee16868ff7568ce431195abcdbc9959ebb924`; source updated, production deployment not yet confirmed |

### Security verification boundaries
- The unauthenticated `/api/portfolio/save` request was rejected with 401 in production.
- This does **not** prove every protected endpoint is correctly guarded.
- Login rate-limit thresholds, persistence behavior, lockout reset behavior, and multi-instance behavior still need inspection and tests.
- Login endpoint behavior remains a separate issue to investigate if legitimate login attempts continue to fail.
- Do not publish secrets, tokens, passwords, or sensitive environment values in this tracker.

---

## 4. Prioritized improvement backlog

## P0 — Essential

### P0-01: Complete page-by-page portfolio audit
**Status:** In progress  
**Goal:** Establish an accurate baseline before changing design or functionality.

Scope:
- Inspect desktop and mobile layouts for home, each case study, admin entry/login, resume modal, navigation, footer, and 404 page.
- Review content hierarchy, responsiveness, readability, navigation, contact/resume discoverability, and consistency.
- Capture issues with page, viewport, severity, and reproducible steps.

Acceptance criteria:
- Every public page and important interaction is inspected.
- Findings are recorded with severity and recommended fix.
- No unverified assumptions are described as defects.

### P0-02: Upgrade flagship project case studies
**Status:** In progress

**2026-11-04 update:** Added the first PRAVAAH case study to `src/content/portfolioData.ts` and connected the PRAVAAH project card with `caseStudySlug: 'pravaah'`. Content is based on the PRAVAAH repository README and deliberately describes the system as an academic/hackathon prototype, distinguishes rule-based readiness support from official approval, and records audit-chain boundaries. Commit: `812f8e1bce956b08d2ed12a364043eebb82f6347`. Production route and visual rendering are not yet verified.  
**Goal:** Turn project listings into credible engineering evidence.

Initial order:
1. PRAVAAH
2. TRAFFIQ
3. SureStep
4. TAPAS
5. VidyaVistaar

Each case study should include, where applicable:
- Problem and target users.
- Project status and live/demo/repository links.
- Exact personal contribution versus team contribution.
- Architecture diagram and data flow.
- Key engineering decisions and trade-offs.
- Challenges and how they were resolved.
- Testing and evaluation methodology.
- Verified outcomes, limitations, and future work.
- Genuine product screenshots.

Acceptance criteria:
- Each flagship project has a complete, accurate case study.
- Claims and metrics have evidence; no fabricated users, performance, accuracy, or impact.
- Screenshots are from the actual project, not generic illustrative images.
- Links are tested and clearly labelled.

### P0-03: Add engineering evidence and ownership
**Status:** Not started  
**Goal:** Demonstrate how the owner engineers and contributes, not just what projects exist.

Potential evidence:
- Selected meaningful commits and pull requests.
- Specific modules/features personally implemented.
- Tests and CI checks.
- Technical decisions and engineering notes.
- Open-source contributions, only when verifiable.

Acceptance criteria:
- Every displayed contribution links to a real public source or is clearly described as project work.
- Team work and individual work are distinguished.
- No fake GitHub activity or decorative success indicators.

### P0-04: Accessibility audit and fixes
**Status:** Not started  
**Goal:** Make the portfolio usable with keyboard, assistive technology, and varied display settings.

Audit:
- Semantic headings and landmarks.
- Keyboard access and visible focus.
- Accessible names for controls and icon-only buttons.
- Color contrast.
- Form labels and error announcements.
- Reduced-motion support.
- Modal focus management and escape behavior.
- Touch target sizing and mobile usability.

Acceptance criteria:
- Critical accessibility defects are fixed.
- Keyboard-only walkthrough is completed.
- Automated accessibility scan results and remaining known issues are recorded.

### P0-05: Performance and responsive audit
**Status:** Not started  
**Goal:** Ensure fast, stable experience across common devices and networks.

Audit:
- Lighthouse/PageSpeed for representative pages.
- Core Web Vitals: LCP, INP, CLS.
- Image formats, dimensions, lazy loading and layout shifts.
- JavaScript bundle size and unnecessary dependencies.
- Animation/cursor performance, especially on touch devices.
- Mobile viewport and network behavior.

Acceptance criteria:
- Baseline and post-fix measurements are recorded with test date/device/context.
- Major bottlenecks are addressed.
- Avoid heavy effects that reduce usability or performance.

### P0-06: SEO and social sharing
**Status:** Not started  
**Goal:** Make the portfolio and project pages discoverable and share well.

Audit/implementation:
- Unique page titles and descriptions.
- Canonical URLs.
- Open Graph and social preview images.
- Sitemap and robots rules.
- Structured data only where accurate and appropriate.
- Descriptive headings and link text.
- Correct indexing behavior for public pages; admin routes should not be indexed.

Acceptance criteria:
- Metadata is correct on home and project pages.
- Sitemap/robots behavior is checked.
- Social previews are tested with available validators.
- No private/admin information is exposed.

### P0-07: Contact and recruiter conversion
**Status:** Not started  
**Goal:** Make it effortless for a recruiter or collaborator to take the next step.

Audit/implementation:
- Clear email/contact action.
- Easy-to-find résumé download.
- LinkedIn and GitHub links.
- Project demo/repository actions.
- Clear availability or interests only if the owner wants to publish them.

Acceptance criteria:
- All contact and résumé actions work on desktop and mobile.
- Links use correct destinations and safe external-link behavior.
- No unnecessary personal information is exposed.

---

## P1 — High value

### P1-01: Technical writing section
**Status:** Not started  
**Goal:** Demonstrate technical depth through original explanations.

Suggested first articles:
1. PRAVAAH: designing an auditable workflow and obligation ledger.
2. TRAFFIQ: building a traffic-risk prediction pipeline.
3. SureStep: integrating mobile camera workflows with AI-assisted analysis.

Acceptance criteria:
- Articles are original and technically accurate.
- Diagrams/code snippets are owned or properly attributed.
- Articles explain trade-offs and lessons, not just list technologies.
- Reading experience is accessible and responsive.

### P1-02: Verified project health and release information
**Status:** Not started  
**Goal:** Show useful, trustworthy engineering status.

Potential fields:
- Latest release/deployment date.
- Build/test status from a real CI provider.
- Repository activity or release links.
- Demo availability.

Acceptance criteria:
- Status is fetched from a reliable source or clearly timestamped.
- Failures/stale data are not displayed as passing.
- No fake uptime, test coverage, or deployment badges.
- If reliable integration is not practical, omit the feature.

### P1-03: Login rate-limiting review
**Status:** In progress (decision made; implementation/config not audited)  
**Goal:** Retain brute-force protection and verify it is robust.

Inspect:
- Attempt threshold and lockout duration.
- Server-side persistence across restarts.
- Behavior across multiple instances.
- Successful-login reset behavior.
- Generic failure messages that do not reveal account existence.
- Correct HTTP 429 behavior.
- Trusted proxy/IP handling on Render.
- Safe logging without credentials or tokens.

Acceptance criteria:
- Thresholds are documented and tested.
- Failed attempts are throttled as intended.
- Counters persist as designed.
- Legitimate users are not unnecessarily locked out.
- No secrets are logged.

### P1-04: Content quality and consistency pass
**Status:** Not started  
**Goal:** Ensure the portfolio is polished, current, and truthful.

Review:
- Bio, skills, education dates, résumé and project status.
- Consistent project naming and descriptions.
- Spelling, grammar and concise professional copy.
- Correct dates, links, awards and role descriptions.

Acceptance criteria:
- Content is confirmed by the owner where facts are personal.
- No stale claims or broken links remain.

---

## P2 — Optional, after P0/P1

### P2-01: Searchable/filterable project catalogue
**Status:** Not started  
**Goal:** Help visitors find projects by domain, technology, or type.

Acceptance criteria:
- Filters work with keyboard and touch.
- Empty states are clear.
- No excessive UI complexity.

### P2-02: Lightweight interactive technical showcase
**Status:** Not started  
**Goal:** Add one genuinely useful interaction, such as an architecture explorer or small live visualization.

Acceptance criteria:
- Adds explanatory value beyond a static screenshot.
- Does not compromise performance or accessibility.
- Works on mobile and has a non-interactive fallback.

### P2-03: Optional privacy-conscious analytics
**Status:** Not started  
**Goal:** Understand aggregate portfolio usage without invasive tracking.

Acceptance criteria:
- Privacy implications are reviewed.
- No sensitive form content or personal data is collected unnecessarily.
- Analytics is disclosed where required.
- Feature is omitted if it adds little value.

---

## 5. Deliberately avoid unless a real need is demonstrated

- Generic chatbot that cannot answer useful questions about actual work.
- Heavy 3D effects, excessive animations, or cursor effects that harm usability.
- Fake visitor counters, GitHub statistics, uptime, test coverage, or performance badges.
- Inflated project outcomes or unverified metrics.
- Technologies listed without evidence of use.
- Unnecessary admin complexity that expands the attack surface.
- Public exposure of private files, secrets, admin data, or service-role credentials.

---

## 6. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-11-04 | Keep login rate limiting enabled | Reduces brute-force risk; improve configuration rather than remove it |
| 2026-11-04 | Prioritize case studies, engineering evidence, accessibility, performance and SEO before novelty features | These directly improve credibility, usability and recruiter evaluation |
| 2026-11-04 | Do not claim full security audit completion based on two unauthenticated checks | Only the verification endpoint and one protected write endpoint were tested live |

---

## 7. Change log

Append a new entry for every meaningful portfolio work session.

### 2026-11-04 — P0-01 case-study and content-accuracy audit continued
- Read the tracker before work; continued with P0-01 as the highest-priority task.
- Inspected the production homepage and admin login page through the connected browser.
- Reviewed source for `App.tsx`, `HomePage.tsx`, `CaseStudyPage.tsx`, `ResumeModal.tsx`, `ResumeSection.tsx`, `Architecture.tsx`, `ExperienceEducation.tsx`, `Navbar.tsx`, and `Footer.tsx`.
- Confirmed the homepage currently exposes eight main sections, five project cards, project filters, architecture selector, résumé actions, contact links, theme toggle, index dialog, command-palette entry point, and admin shortcut.
- **Confirmed issue:** `Architecture.tsx` displayed the literal label `VERIFIED` for every stage regardless of its actual `node.status`. Changed the footer label to display `node.status.toUpperCase()` instead. Commit: `961e49770ebea39df734e67ca6d56a94bbeb6b7f`.
- **Needs reconciliation:** the live browser text extraction showed an Education summary of `2022–2026` in the résumé section, while the current `ResumeSection.tsx` source says `2024–2028` and the structured CV source also says `2024–2028`. Treat as possible stale deployment/content until a fresh production check confirms it; do not change the correct source based only on this discrepancy.
- The architecture flow has a `min-w-[700px]` horizontal diagram with an overflow-x scroll container. This is an intentional responsive fallback but should be checked on narrow mobile viewports.
- Admin login page content was inspected; no credentials were entered and no admin data was changed.
- Desktop/mobile visual interaction, case-study route coverage, accessibility, performance, SEO, and all links remain to be audited.
- **Case-study accuracy fix:** Removed the engineering-mode label `Verified Technical Specification`; it now reads `Project Technical Overview`. The case-study content describes a technical overview and does not itself establish independent verification. Commit: `8629fd45cf6eafe0c3746db669702eeabd34ea3b`.
- **Project archive accuracy fix:** Replaced the claim that the archive reflects real-time repository descriptions and verified architectures with a more accurate description of curated project information and repository links. Changed the live-demo link's accessible label from `verified live demo` to `open live demo`; URL presence alone is not proof of current availability. Commit: `58e398411e384716eb14cd7c2f52ae82f4dfd929`.
- **Source cleanup:** Removed a duplicate `source: 'curated'` property from the PRAVAAH object in `initialPortfolioContent`. Commit: `fb107a5bda4ffedbd9537c971ed861378f442128`.
- **Deployment evidence:** Render reports homepage landmark fix commit `dcabccf872573cfa41424c1d83604a8b1d71f263` as `live`. New content/copy commits were queued after that and have not yet been confirmed live; no build/test result is claimed here.
- **Confirmed accessibility/HTML issue:** `App.tsx` already provides the page-level `<main id="main-content">`, while `HomePage.tsx` rendered another nested `<main>` with the same ID. Changed the homepage wrapper to a `<div>` so the document has one page-level main landmark and no duplicate `main-content` ID. Commit: `dcabccf872573cfa41424c1d83604a8b1d71f263`. This is implemented in source; build and browser verification are still pending.
- Reviewed the case-study page renderer and structured project data. The page includes overview, problem, architecture, pipeline, subsystem notes, decisions, challenges, lessons and future work; actual completeness/accuracy of each project narrative still needs a separate content audit. PRAVAAH, SureStep and TRAFFIQ project cards are marked Prototype in source; TAPAS is marked Implemented. No project status was changed.
- P0-01 remains in progress; no claim of full audit completion.

### 2026-11-04 — Initial benchmark and tracker creation
- Read `README.md` and `src/App.tsx` from `main`.
- Confirmed documented stack, project list, admin/content capabilities, and route structure.
- Recorded security test evidence from the current conversation.
- Compared the portfolio direction with public portfolio references.
- Created prioritized P0/P1/P2 backlog.
- No portfolio application code was changed during this review.
- Live visual audit and performance/accessibility/SEO measurements remain outstanding.

---

## 8. Session handoff checklist

At the start of every future portfolio session:
1. Read this tracker before making recommendations or edits.
2. Check the current repository branch and latest commit.
3. Check whether the relevant task has already been completed or changed.
4. Continue the highest-priority unblocked task; do not skip P0 for P2 polish.
5. Confirm whether the user wants direct implementation, a plan, or review if ambiguous.

At the end of every session:
1. Update the relevant task status and evidence.
2. Add a dated change-log entry.
3. Record commits, pull requests, deployment IDs and test results where available.
4. List blockers and the next exact action.
5. Keep unfinished tasks open. Do not silently drop work.

**Next recommended task:** P0-01 — verify the latest Render deployment, then complete case-study route coverage, keyboard/focus behavior for dialogs and navigation, contact/resume actions, and mobile layouts. Record only checks actually performed.

### 2026-11-04 — PRAVAAH case study deployed; resume modal accessibility pass
- **Production deployment:** Render reports the PRAVAAH case-study commit `812f8e1bce956b08d2ed12a364043eebb82f6347` as `live`. The intended route is `/work/pravaah`. This is deployment-state evidence; a full visual browser walkthrough is still outstanding.
- **Case-study route coverage:** Source data contains project slugs for `pravaah`, `tapas`, `surestep`, `traffiq`, and `vidyavistaar`, and corresponding case-study definitions are present. This is a static source check, not a live route test.
- **Resume modal:** Replaced the unsupported `VERIFIED DOCUMENT` label with `RESUME DOCUMENT`; added initial focus, Tab/Shift+Tab focus containment, Escape handling, focus restoration, and restoration of the previous body overflow style. Commit: `0dd7d7f60884c1f6fb7101c53375e127b7505991`. Runtime keyboard testing remains outstanding.
- **Case-study fallback copy:** Removed wording that implied an unavailable route was “not verified”; the message now explains that the case study is unavailable and suggests checking the link. Commit: `9e61e694111169468a35b6bf2ce1214e934a1942`.
- P0-01 and P0-02 remain in progress. No full accessibility, mobile, or end-to-end route audit is claimed.
- **Command palette:** Added an accessible combobox/listbox relationship with active-option announcement, selected-option scrolling, Tab/Shift+Tab focus containment, initial focus, focus restoration, and preservation of the previous body overflow style. Commit: `97b9a03d3ad8090a59f9ab4c77fccf89df1ead01`. Keyboard behavior has been improved in source but still needs runtime testing with keyboard and screen reader.

### 2026-11-04 — Navbar, contact, and footer audit
- **Site index dialog:** Added initial focus, Tab/Shift+Tab focus containment, Escape handling, focus restoration, and restoration of the prior body scroll-lock value. Added `aria-controls` linkage. Commit: `4cdde45275ba48b04d0f7f665c5576f8efe019f9`.
- **Contact email copy:** Handles unavailable/rejected Clipboard API access and announces success/failure through a polite live region instead of silently failing. Commit: `0fcd5454b523a3655de2fae596f7abe1db4a0144`.
- **Footer status:** Replaced the always-green `LIVE SYNC` wording with `CONTENT READY`; clarified that the timestamp is the last content sync. Commit: `6029b67cf06ff2db5bbb47192eb82be713995460`.
- **Verification boundary:** These changes are committed to `main`; the latest Render deploy was still queued/in progress when checked. No production behavior or runtime keyboard test is claimed. Package scripts expose `npm run lint` (TypeScript no-emit), `npm test`, and `npm run build`; none was run in this remote-source pass.
- P0-01 remains in progress pending deployment completion, runtime checks, responsive review, and link verification.
