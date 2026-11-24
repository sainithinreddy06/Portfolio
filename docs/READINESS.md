# Portfolio readiness review · 24 November 2026

The review branch is `improve/portfolio-readiness`. The comparison build is `0518c14`, which already includes the first repository-publication fix. The application still serves the original React design and the existing Express API. All implementation and browser tests used local processes, disposable data and synthetic credentials. Production acceptance is pending.

## Phase record

| Phase | A · Executive summary | B · Technical findings | C · Priorities | D · Implementation |
|---|---|---|---|---|
| 1 · Audit | Render wake-up, application startup and browser rendering all contribute to perceived delay. | The document, JS and API share one service. The client mounts with React `createRoot`. The original listener awaited a storage read with a 10-second deadline. | Keep measurements for each layer separate. Protect repository visibility and persistence first. | Preserved the audit baseline and repeated local mobile measurements on its production build. |
| 2 · Security | Admin changes now require successful persistence. Public project eligibility and admin editing have separate read paths. | The old store mutated shared memory, returned early on cloud writes, and overwrote active asset files before upload confirmation. Production CORS admitted localhost, and all routes accepted 25 MB bodies. | Protect public data, then make saves reliable, restrict inputs, and reduce dependencies. | Added isolated write drafts, conditional Supabase writes, atomic local replacement, versioned assets, guarded upload parsing, session and webhook checks, explicit CORS and CSP. Removed unreferenced Sentry packages. |
| 3 · Frontend performance | The default portrait caused the largest avoidable transfer. | A 1,630,340-byte PNG was downloaded and inspected with canvas despite already having transparency. The loading fallback occupied only half the viewport. | Deliver the right image size, reserve space and compress fingerprinted assets. | Added 340px and 680px transparent WebPs with a PNG fallback. Preserved processing for custom uploads. Served hashed JS/CSS with compression and a one-year immutable cache. |
| 4 · Backend and architecture | Static HTML can be served while storage initializes. A separate frontend can use the same backend. | Production previously ran TypeScript through a development dependency. Gemini loaded even when unused. Server-relative API and resume URLs assumed one origin. | Compile the production entry, decouple HTML from storage, then verify split hosting locally. | Vite builds `dist/`. esbuild compiles the Express entry to `portfolio-server.mjs` outside that public directory. Gemini loads on demand. `VITE_API_ORIGIN` controls API and mutable asset URLs. |
| 5 · Quality, accessibility and SEO | Shared color changes resolved the measured contrast failures. The existing design and navigation remain. | Ctrl/Cmd+K closed a dialog even when it was closed. A second server, client GitHub pipeline and logger had no runtime callers. The homepage constructed duplicate structured data that its child never rendered. | Restore keyboard behavior, adjust the failing colors, then delete unused paths. | Fixed the shortcut, kept focus restoration, updated light-theme tokens, removed dead modules, retained the structured data in HTML, added a PNG social preview and accurate HTTP status for unknown routes. |
| 6 · Verification | Build, static checks, storage regressions and browser checks have executable entry points. | The previous “lint” script only ran TypeScript. Lighthouse suppressed failures. CodeQL and Dependabot had invalid configuration. | Require genuine failures to reach CI and isolate test credentials. | Added ESLint, a distinct type check, npm audit, unit and HTTP tests, a compiled-server browser check, and corrected GitHub configuration. |
| 7 · Deployment | Ready for owner review of a future deployment. | No replacement domain, service tier, credentials or production database policies were inspected in the dashboard. | Verify the production prerequisites below before creating or switching anything. | Prepared a local two-origin build and checked the existing API contract. The review branch contains no deployment automation. |

| Phase | E · Verification | F · Before and after | G · Remaining risks | H · Next step |
|---|---|---|---|---|
| 1 | Source, lockfile, active entry points, local production builds and previous live observations. | Earlier observed first and repeat requests were 34.68 s and 7.52 s. Render returned its sleeping-service robots response before the first request. This branch has no post-deployment measurement. | That pair alone cannot establish the Render plan or isolate every network hop. | Correlate an idle and warm navigation trace with Render service events. |
| 2 | HTTP fixtures inject cloud asset and state failures, verify rollback and stale-edit conflicts, check public filtering, request rejection, rate limiting and session revocation. Local tests exercise failed file replacement, expiry and unreadable session records. | npm audit went from 21 moderate findings to zero. Dependency inventory went from 431 to 385, including development dependencies. | Production RLS and bucket policies require inspection. Local session/rate-limit files assume one writable server instance. | Review grants, policies, proxy topology and backups using the checks below. |
| 3 | Three cold-browser mobile Lighthouse runs per build on loopback, with the same font-blocking policy. | Median LCP fell from 12.01 s to 2.56 s. See the full table below. | Production fonts, CDN behavior, devices, field INP and idle TTFB remain unmeasured on this code. | Recheck after an approved preview with real fonts and a representative mobile connection. |
| 4 | Injected a 1.5 s storage read at startup. Ran a compiled API and an independently built frontend on different loopback origins. | Median time to first HTML fell from 1,720 ms to 129 ms in the injected-delay test. Split-host login, authenticated edit, PDF, photo, logout and revocation passed. | The new /api/ready endpoint distinguishes starting, local, durable and degraded storage. Startup logs time the listener and initial storage read. API responses can still wait on storage. Render can still spin down the combined service. | Use the same build and origin settings in the eventual preview. |
| 5 | axe, keyboard shortcut, route headings and horizontal overflow on mobile/desktop. Inspected canonical, sitemap, robots, Open Graph and structured data. | Light-theme homepage contrast violations affected 69 elements on each tested width. The final checks found zero automated WCAG A/AA violations in the sampled states. | Screen readers, every authenticated editor dialog and all external destinations still need manual acceptance. Case-study preview metadata for JS-free crawlers uses the shared HTML shell. | Review the editor and case studies with the owner on a phone and a screen reader. |
| 6 | Clean installation, ESLint, TypeScript, production client/server build, 11 Node tests, audit, and compiled-browser checks. A separate production-only install also served HTML and the API with npm start. | CI now fails on failed tests/audits, browser assertions and the 450 kB homepage transfer budget. | Local execution does not prove hosted Actions permissions or runner/network availability. | Review the first hosted CI and CodeQL runs when the branch is proposed for merge. |
| 7 | Exercised the split using loopback servers. Production DNS, routing, storage and secrets were untouched. | Local API use works on either origin configuration. Production traffic continues to use the existing release. | Static hosting headers, public URLs, provider caching and idle behavior require a real preview. | Obtain the owner's deployment approval, then follow the cutover and rollback sequence. |

## Finding register

Severity describes the impact of the original implementation. Rows through the accessibility findings are confirmed from code or the tests described. The production policy row is unverified.

| Severity | Location | Evidence, cause and impact | Change and regression check |
|---|---|---|---|
| High | [server/githubPublication.ts:81](../server/githubPublication.ts#L81), `publicSnapshot` and repository event handlers | Durable state can contain imported rows after visibility changes. Serving the raw state could disclose previously imported content. | Keep the editable archive authenticated, require recent public evidence, and recheck revocation after asynchronous writes. Test withdrawal during enrichment and a missed webhook. |
| High | [server/portfolioStore.ts:165](../server/portfolioStore.ts#L165), `savePortfolioStore` and `loadRemote` | The old asynchronous upsert swallowed errors. Mutating the live object also changed public responses before durability was known. | New writes use a detached draft. PATCH compares the loaded database revision, a missing row uses insert, and local writes use rename. Verify 503 and unchanged public state on failure, 409 on stale edits, and persistence after retry. |
| High | [server/assetManager.ts:193](../server/assetManager.ts#L193), upload, rollback and active-file functions; [server/cloudStorage.ts:8](../server/cloudStorage.ts#L8) | Active mirrors could change after a failed upload. A bundled PDF could take priority over the current durable version after restart. | Store a new object under a unique key, then change the active pointer. Rollback uses the recorded cloud URL or a local archive. Verify both failure stages and that the old URL or bytes still win. Historical public object URLs can remain reachable by design. |
| Medium | [server/githubService.ts:431](../server/githubService.ts#L431), `verifyUrlReachable` and deployment status discovery | Candidate links supplied by repository metadata triggered backend requests. | Limit probes to HTTPS platform subdomains, reject alternate ports and credentials, disable redirect following, and derive authenticated status URLs from the GitHub API path. An owner-supplied custom homepage can still display as unverified. |
| Medium | `server.ts`, CORS and body parser middleware; [server/portfolioValidation.ts:10](../server/portfolioValidation.ts#L10) | A 25 MB global limit allocated upload-sized bodies for ordinary requests. The production origin check also accepted localhost. The active save handler used only shallow validation. | Authenticate upload routes before parsing. Bound general JSON to 1 MB, forms to 64 kB, and uploads to 21 MB encoded with decoded file limits. Allow configured production origins and validate saved content/URLs. Test 401, 400, 413, CORS and the real cross-origin browser flow. |
| Medium | [server/authService.ts:260](../server/authService.ts#L260), session verification and file persistence; `src/pages/AdminPage.tsx` | A bearer token persisted across browser sessions. Session and rate-limit file write errors could be swallowed. | New logins use tab session storage. Verified legacy tokens migrate. Auth files use atomic replacement, and expired/revoked tokens fail verification. Test login throttling, expiry, corruption and logout. Closing the tab can require signing in again. |
| Medium | [src/components/common/PhotoFrame.tsx:230](../src/components/common/PhotoFrame.tsx#L230), `PhotoFrame`; [src/App.tsx:35](../src/App.tsx#L35), Suspense fallback; `server.ts`, production static middleware | Original size, canvas processing, layout movement and uncompressed JS/CSS delayed the first mobile view. | Responsive WebPs and reserved space address the browser cost. Hashed assets get compression and immutable caching. Test real portrait selection and the transfer budget. |
| Medium | [src/index.css:38](../src/index.css#L38), light-theme tokens; [src/components/common/CommandPalette.tsx:275](../src/components/common/CommandPalette.tsx#L275), keyboard handler | Contrast failures repeated across small text and controls. The advertised shortcut failed to open its dialog. | Updated the shared foreground colors and toggle. Checked two themes, focus handling, mobile overflow and an actual key sequence. |
| Medium, unverified | Supabase policies and Render proxy configuration | A service-role credential can bypass RLS. The presence of a server-side check does not establish the database policies seen by anonymous clients. IP-based login limits may group visitors behind one proxy. | Inspect the provider settings. Preserve single-instance assumptions until the session store and proxy trust model have been verified. |

## Performance measurements

Mobile Lighthouse with Chromium, a fresh browser profile per run, a production bundle on loopback, and an offline GitHub fixture. Google Fonts requests were blocked consistently. The middle build includes the Phase 2 changes and the portrait/fallback optimization. The final group includes the compiled server, hashed-asset compression and accessibility changes. Each value is the median of three runs. Asset and font network behavior will differ on the public internet.

| Metric | Comparison build | Portrait and route fallback | Optimized build |
|---|---:|---:|---:|
| Largest Contentful Paint | 12.01 s | 4.40 s | 2.56 s |
| First Contentful Paint | 3.22 s | 3.35 s | 1.87 s |
| Cumulative Layout Shift | 0.299 | 0.083 | 0.091 |
| Total blocking time | 95 ms | 0 ms | 0 ms |
| Page transfer | 2,145,629 B | 560,828 B | 229,376 B |
| Network requests | 10 | 11 | 12 |
| Local document server response | 2 ms | 1 ms | 1 ms |

Request count rose while bytes and render time fell. The repeatable gain came from sending less data, especially the portrait and compiled JS. The lab measured total blocking time. Field INP requires real interactions across visits. It cannot be inferred from a zero TBT reading.

The separate startup experiment launched a fresh process three times per version, injected the same 1,500 ms successful durable read, and polled for usable HTML every 20 ms. Individual samples were 1,808 / 1,717 / 1,720 ms before and 109 / 129 / 131 ms after. Those numbers measure the application's startup dependency. A sleeping host still has to wake before Node can serve anything. Render documents its free-service spin-down behavior at <https://render.com/docs/free>.

## Reproduce locally

Use Node 22.18+ on the 22.x line or Node 24.11+. Start from a clean branch checkout. Tests provide disposable storage and credentials.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

The compiled entry point is `npm start`. With no optional credentials, the portfolio serves local content. To run the browser gates, install the same isolated tools as CI and point to an installed Chrome or Chromium. This avoids adding browser tooling to the production application.

```sh
browser_tools="$(mktemp -d)"
npm install --prefix "$browser_tools" --no-audit --no-fund lighthouse@13.6.0 axe-core@4.14.1 puppeteer-core@25.18.1
BROWSER_TOOLS="$browser_tools" CHROME_PATH="$(command -v google-chrome)" node scripts/check-browser.mjs
```

The browser suite starts the compiled service with isolated state, checks the homepage at 390 and 1365 px, and checks a case study, the admin sign-in screen and the missing-page route at 390 px in both themes. It signs into the resume editor using a disposable account and checks the rendered editor for accessibility. The test includes a first-load Lighthouse pass and a transfer budget. The contact section uses mail and external profile links. Sending a message was outside this verification.

## Production gates and rollback

1. **Database and assets.** Confirm `portfolio_state.id` is unique, `state` holds the JSON, and `updated_at` supports the conditional revision writes. Check the configured bucket and public read behavior. Keep the service-role key exclusively in the backend. Verify the owner can recover a backup before an approved change. No migration is required by this branch.
2. **Read-only policy review.** These queries inspect configuration without returning portfolio records, credentials or uploaded files. Review the results in Supabase alongside the table grants and bucket settings. Anonymous clients should have no path to read the editable state or write portfolio files. Source: <https://supabase.com/docs/guides/database/postgres/row-level-security>.
3. **Static preview after approval.** Build the React frontend with `VITE_API_ORIGIN` set to the intended backend HTTPS origin. Publish only `dist/`. Set the backend's `ALLOWED_ORIGINS` to the exact preview origin. Configure a navigation rewrite for SPA routes, real missing-asset responses, the CSP and MIME headers, short/revalidated HTML caching and immutable caching for hashed assets. Keep secrets and the compiled server outside the static artifact.
4. **Acceptance before traffic.** Exercise admin login, upload/rollback, public visibility, signed webhook delivery, resume download and the authenticated editor. Confirm production CSP/CORS, both themes, canonical/sitemap URLs and the social image on the chosen host. Take an idle and warm navigation trace with separate HTML and API timings. Verify real-device interaction latency, service tier and startup events. Measure fonts with external access enabled.
5. **Rollback.** Retain the current service, previous build and traffic mapping. Keep the preview isolated until approved. Revert the frontend mapping to the previous service if acceptance fails. If rolling back the backend, preserve storage and take an approved backup first. New local writes live in `data/portfolio-runtime.json`; an older binary reads the legacy filename. A local-only rollback needs that data reconciled before the older process accepts edits. The Supabase row shape remains compatible.
6. **Known limits.** Older editors that omit a revision retain compatibility and do not get stale-form detection across separate editing sessions. Local fallback on an ephemeral host cannot guarantee durability. Asset bytes and the database row are separate operations. A failure after an object upload can leave an unreferenced object, and removing a history entry does not invalidate a previously shared public URL. Determine retention before deleting anything. Gemini, real GitHub hooks, deployed database policy, hosted CI and field Web Vitals require their respective environments.

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where (schemaname, tablename) in (('public','portfolio_state'), ('storage','objects'));

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname, tablename) in (('public','portfolio_state'), ('storage','objects'));

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'portfolio_state';
```

## Remaining improvement priorities

- Complete the owner-approved production preview and acceptance gates above; independently verify cold-start and warm timings, uptime, real mobile browsers, screen-reader flows, security headers and social previews.
- Strengthen PRAVAAH and TAPAS case studies with personally attributable contributions, linked commits/tests, real screenshots, verified outcomes, trade-offs and limitations. Review the prototype case studies for consistency; avoid unsupported metrics and claims.
- Verify résumé, contact, project and profile links on real devices; reconcile résumé, skills, achievements and project-status claims with owner-confirmed evidence.
- Add reliable project CI/release status and a minimal uptime alert only if useful. Original technical writing is optional; defer additional analytics, interactive showcases and tooling unless a real need arises.

The older internal evaluation, gap analysis, plan and tracker are archived in Git history. This file is the current verification and deployment record.
