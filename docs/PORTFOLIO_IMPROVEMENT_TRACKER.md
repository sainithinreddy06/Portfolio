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
**Status:** In progress  
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
**Status:** In progress  
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


### 2026-11-04 — SEO crawl-path corrections
- **Confirmed SEO issue:** `robots.txt` pointed crawlers to `https://sainithinreddy.me/sitemap.xml`, while the canonical production host is `https://sai-nithin-portfolio.onrender.com`. Updated the sitemap directive to the production host. Commit: `5ad44e8bbf8c04aa39d3a8ecae316407b0c82a5d`.
- **Confirmed sitemap issue:** sitemap entries used the obsolete `/case-study/:slug` route, but the React router and project links use `/work/:slug`. Replaced those entries with the five actual public case-study routes, including PRAVAAH, and removed the standalone résumé PDF from the sitemap. Commit: `536522f530e19de7d7acf1c93cd3e6c481ea8636`.
- **Verification boundary:** source files were updated on `main`; deployment and live HTTP responses for `/robots.txt` and `/sitemap.xml` are pending. Social preview image metadata/assets and per-case-study metadata remain to be audited. No Lighthouse or mobile viewport measurements have been run.
- P0-06 remains in progress; P0-05 performance/mobile audit remains open.


### 2026-11-04 — Initial bundle-size review and route splitting
- Render's production build reported a single client JavaScript bundle of **494.85 kB raw / 132.23 kB gzip** before this change. This is close to Vite's default 500 kB chunk warning threshold and means the admin and case-study page code was included in the initial route bundle.
- Changed `src/App.tsx` to lazy-load the home, case-study, admin, and not-found route components behind an accessible Suspense loading state. Commit: `e95e0a98d270360b1fc94ae4e4a8e12ad131119c`.
- **Verification pending:** wait for the new Render build and compare emitted chunk sizes. No Lighthouse score, Core Web Vitals, mobile viewport, or image transfer-size measurements have been collected. Do not mark P0-05 complete until measured and production-tested.
- Static review notes: the hero photo is processed through a canvas pixel scan before display; its actual cost depends on the delivered image dimensions and device. Review whether this processing is necessary after measuring rather than removing it speculatively.


### 2026-11-04 — Mobile layout, image loading, and social metadata pass
- Updated the system architecture flow to stack its stages vertically on narrow screens and retain the horizontal pipeline layout from the `sm` breakpoint upward. This avoids forcing a 700px-wide diagram inside a phone viewport. Commit: `4881af7fd6266b24117e4d53d0da9d134673b91a`.
- Profile photos now use eager/high-priority loading only for the hero image, lazy loading for non-hero instances, and asynchronous image decoding. Commit: `e5a35bf4ec09d4e66d0499bff17136e2e0b151c6`.
- Added the canonical production URL to Open Graph metadata and changed the Twitter card to `summary` because the repository currently has no confirmed social preview image asset. Commit: `0b90b1abb74872ebde3e3e81db055edd469baee7`.
- **Verification pending:** production build and deployment checks are queued after these changes. No real-device/mobile-browser walkthrough, Lighthouse audit, or social preview validator has been run. P0-05 and P0-06 remain in progress.


### 2026-11-04 — Resume and certification claim accuracy
- Removed unsupported verification language from the resume section: changed the badge to `RESUME PDF`, the engineering note to neutral resume wording, and the document description to a direct hosted PDF description. Commit: `e0dda8cda51f6094a1d8a16c0f8d589a903fa16b`.
- Changed the certification timeline from an asserted `Verified` period and `Industry Credentials` organization to `Listed in resume` and `Certificate details`, pending issuer names or verification URLs. Updated the unavailable-resume fallback copy to remove an unsupported verification claim. Commit: `9bcd2c47bf994c41de4c7b06ae7931069c7447a5`.
- **Verification boundary:** source changes are pushed to `main`; Render deployment is queued. No certificate issuer links or certificate files were supplied, so no independent verification is claimed. No GitHub Actions workflow is configured in `.github/workflows`; the repository's package scripts expose `npm test` and `npm run lint`, but these were not run in this pass. Continue to use Render's production build logs as build evidence only.


### 2026-11-04 — Case-study page metadata
- Added route-aware document titles, meta descriptions, Open Graph title/description/URL, Twitter title/description, and canonical URLs for `/work/:slug` pages. Metadata returns to the portfolio homepage defaults when navigating away from a case study. Commit: `51025fed1fffab3ae5860a365ba1a7e39f74d693`.
- Description text is derived from each case study's existing overview and shortened for metadata; no new project claims were introduced.
- **Verification pending:** this is a client-side React metadata update, not server-side rendering. Search crawlers and social scrapers that do not execute JavaScript may still receive the static homepage metadata. Render build and route-level browser checks are pending; do not treat this as fully verified SEO for crawlers.


### 2026-11-04 — Route metadata and CI
- Added client-side case-study page titles, descriptions, canonical URLs, Open Graph and Twitter metadata. Metadata resets to homepage defaults on route exit. Commit: `51025fed1fffab3ae5860a365ba1a7e39f74d693`.
- Added GitHub Actions checks for Node.js 24, `npm run lint`, `npm test`, and `npm run build` on pushes and pull requests to `main`. npm cache is disabled because the repository has no lockfile. Workflow commits: `ba861a33d3f206a69f44d064b2445b5712b777f9` and `4f33c4c3360a0b6361bca85a835345aa73e44233`.
- Verification is pending until the workflow runs and the Render queue deploys the current commit. Metadata is client-side; server-rendered crawler previews remain a separate limitation.

- **CI evidence:** GitHub Actions run `41814068361` completed successfully on commit `4f33c4c3360a0b6361bca85a835345aa73e44233`; dependency installation, TypeScript typecheck, test suite, and production Vite build all passed. This commit includes the case-study metadata implementation. The tracker-only follow-up commit does not change application code.
- **Render status:** latest deployment remains queued while the earlier Render deployment is still reported as `update_in_progress`; do not claim the current main revision is live until Render reports `live`.


### 2026-11-04 — Project-link and technical-claim audit
- Confirmed the five project GitHub repositories are publicly discoverable through the GitHub API: PRAVAAH-2 (API redirects to its canonical repository record), TAPAS, SureStep, TRAFFIQ, and VidyaVistaar. This confirms repository existence/public visibility, not build health or project feature completeness.
- Removed unsupported precision claims from portfolio copy: TRAFFIQ's sub-50ms response-time and 60fps statements are now qualified descriptions without benchmark promises; removed the unsupported "zero glue" phrasing; removed an unsourced EAMCET candidate-count comparison; changed TAPAS "verified" health guidance to neutral reference-guidance wording. Commit: `ac2f1ae2e7b346512c9a18629f7f159d7f8f3583`.
- The TAPAS and PRAVAAH live demo hosts were not independently smoke-tested in this pass. SureStep has no live URL configured in the project card. Treat demo availability as unverified, not broken or live.


### 2026-11-04 — Case-study evidence alignment
- Compared portfolio case-study copy with the available project README/package documentation for TAPAS, SureStep, TRAFFIQ, and VidyaVistaar.
- Updated TAPAS to distinguish its working location/weather/map interface from optional scientific-risk feeds and authority-sourced relief inventories. Removed unsupported claims that verified cooling shelters are provided by default.
- Updated VidyaVistaar wording to avoid implying measured learning outcomes or guaranteed zero-latency API behavior.
- Confirmed TAPAS package metadata documents Next.js 15, React 19, MapLibre GL, D3 Contour, and Recharts. SureStep, TRAFFIQ, and VidyaVistaar README claims were reviewed; no additional source-code-level feature verification was performed in this pass.
- Portfolio content commit: `40f03da283efa31a9eed818af644149185e00868`.


### 2026-11-04 — Accessibility and touch-target pass
- Audited the command palette, resume modal, site index dialog, navbar, contact actions, case-study page, and global styles. Existing dialogs already implement Escape handling, focus restoration, body-scroll locking, and keyboard focus containment; the command palette also supports arrow-key selection.
- Increased the minimum height of the navbar theme/index controls, the site-index close control, contact action links and email-copy control, and the case-study return control to improve touch usability on narrow screens.
- Commits: contact targets `7f262ad1fe9597103de6d3c39765c3d8b88fe1b6`; navbar targets `577a9617e18e5f763994b2663b9e74418375838d`; case-study return target `68d9562fd5d95b13fd1307adb924ce44bc8afa30`.
- **Verification boundary:** source review only at this stage. Automated CI and Render deployment for the latest commit must pass; keyboard/screen-reader testing and real-device viewport checks have not yet been performed. P0-04 and P0-05 remain in progress.


### 2026-11-04 — Responsive architecture and control sizing
- Fixed a tablet-width overflow risk in architecture diagrams: stages now use a one-column mobile layout, two-column tablet layout, and horizontal desktop layout; removed the forced 700px minimum width below desktop. Flow arrows rotate only while the desktop row is active.
- Added safe word wrapping to the hero name and improved minimum touch-target sizing for hero actions and resume-viewer tabs/close control. Normalized the remaining contact profile-link target sizing.
- Commits: architecture `1bf6b2bcec6ef30952f2edf427bcd519a830c602`; hero `5b9166cc10e2fabf50cb7153e698c32d6f3815cb`; resume viewer `2c4318a991475531115bd49c433adad23e1bcf7d`; contact links `2567e7c53154754d53cd21d6712968533f694cfa`.
- **Verification boundary:** CI and Render deployment are required for this revision. Actual 320px/375px/768px/1024px device viewport testing and screen-reader verification remain outstanding; P0-04 and P0-05 remain in progress.


### 2026-11-04 — Project catalogue accessibility pass
- Corrected the project category filter semantics: these controls filter a list and are now exposed as a labeled button group with `aria-pressed`, rather than incorrectly using tablist/tab roles without tab keyboard behavior.
- Added live announcement semantics to sync feedback and alert semantics to the offline/error notice. Increased touch target sizing for category filters, retry/sync actions, repository links, case-study links, and the all-repositories action.
- Commit: `092b7edede6901cd8402b8b58ac89608068a00a3`.
- Responsive source review: project entries stack into one column until the large breakpoint, technology tags wrap, and action links use flex wrapping. No fixed-width project card was found in this section.
- **Verification boundary:** source-level review only. Keyboard walkthrough, screen-reader announcement test, and 320px/375px/768px/1024px browser viewport checks are still outstanding. P0-04 and P0-05 remain in progress.
