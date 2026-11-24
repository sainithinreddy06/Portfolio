# Phases 5 and 6 · Interface review and release verification

## Phase 5 · Code quality, accessibility and SEO

**A. Executive summary.** Keyboard users can move focus past the header, operate the command palette with Enter, and return from case studies using a normal link. Case studies retain the declared production canonical origin when opened on a preview host. Leaving the page restores the original homepage metadata.

**B. Findings and C. priorities.**

| Priority | Finding in the Phase 4 build | User impact |
|---|---|---|
| Medium | The skip link targeted a non-focusable `main`. The regression test on `ffef667` observed an empty active-element ID after activating the link. | The viewport could move without keyboard focus reaching the main content. |
| Medium | The palette's window-level Enter handler ran the selected command even when a button had focus. Ctrl/Cmd+K could also open a second dialog over the site index. | Keyboard users could activate a different command or open competing focus traps. |
| Medium | A static architecture section in a case study declared itself a modal dialog. | Assistive technology received incorrect information about the scope of interaction. |
| Medium | Case-study canonical and Open Graph URLs used the current browser origin. Cleanup assigned hardcoded values and promoted a preview origin to the homepage canonical. | A shared preview link could advertise the wrong primary URL. |
| Low | Image dimensions appeared twice in the HTML metadata. Admin and missing pages shared the homepage browser title. An unknown case-study slug could match an inherited object property. | Ambiguous metadata, less useful browser history, and incorrect handling of an unavailable project. |

**D. Implementation.** Made the existing skip destination programmatically focusable. Limited command execution on Enter to the search field and kept Ctrl/Cmd+K from opening over another modal. Replaced the false dialog semantics with a named section. Case-study navigation uses a link, reads canonical origin from the HTML, normalizes description whitespace and restores each original metadata value on exit. Unknown studies get a missing-page title and a client-side noindex directive. Admin HTML includes an indexing directive before JavaScript runs. [App](../src/App.tsx) · [Command palette](../src/components/common/CommandPalette.tsx) · [Case studies](../src/pages/CaseStudyPage.tsx) · [HTML](../index.html)

**E. Verification and F. comparison.** Ran the expanded browser checks against the Phase 4 build and reproduced the skip-link failure. On the updated build, Tab followed by Enter focused `main-content`. Enter on the focused palette Close button dismissed it. Ctrl+K in the open index left one modal, and Escape restored focus to its trigger. The browser followed every case-study URL in the sitemap, checked canonical and Open Graph URLs, and returned home through the UI. All five round trips restored the production homepage URL. Checks also verified the published PNG signature and 1200 × 630 dimensions, mobile overflow, and the contact email link target. No email was sent.

**G. Remaining risks.** Automated checks cover the tested pages, themes and editor state. A screen-reader session and physical-device review would add evidence for spoken labels and touch behavior. Case-specific social metadata still requires JavaScript. Crawlers reading only the initial HTML receive the shared portfolio card. Unknown case-study slugs on the SPA can return a 200 shell before the client displays its missing-study view.

**H. Next step.** The verified interface entered the Phase 6 production build and browser gates below.

## Phase 6 · Production readiness

**A. Executive summary.** The compiled application passed the local release checks with a production-only dependency installation. The build tools and isolated browser-test tools remain available at their respective build and verification steps.

**B. Finding and C. priority.** The previous CI browser test ran after a full development install. A runtime import of a development-only package could therefore pass. Closing that gap has higher value than adding another test framework.

**D. Implementation.** CI builds with the full dependency set, then runs `npm ci --omit=dev` before running the compiled-server browser suite. Lighthouse, Chromium automation and axe run from a separate tools directory. The workflow propagates failed assertions, builds, checks and dependency audits. The browser suite also checks correct HTTP status on unknown top-level routes and the admin indexing header. [CI workflow](../.github/workflows/ci.yml) · [Browser suite](../scripts/check-browser.mjs)

**E. Verification.** Ran a clean install, ESLint, TypeScript, all 12 Node tests, the production frontend and server build, and npm audit. The audit returned zero known vulnerabilities. Copied the release artifacts into a fresh directory, installed production application dependencies there, and ran the compiled-server browser suite. It passed the 390 px and 1365 px homepage checks, light and dark themes, sampled routes, the authenticated resume editor, and the homepage transfer budget. All integration tests used disposable state. For reproduction, use the build and browser commands in [READINESS.md](READINESS.md#reproduce-locally) and run the browser command after `npm ci --omit=dev` in a disposable built checkout.

**F. Comparison.** The same test suite now runs against an installation without development packages and checks five sitemap round trips, keyboard focus transfer, modal exclusivity, and the social preview bytes. The Phase 4 build failed the new keyboard gate. The Phase 6 build passed it.

**Compatibility with current main.** A simulated merge with `main` at `cb3b194` applied cleanly but initially failed TypeScript. The newer Lucide release removed two brand exports, and the Express 5 type definitions widened untyped route parameters. Preserved the existing icon geometry and its license, typed the two named version parameters, and replaced the version-specific wildcard route strings. Both dependency sets now pass type checking, lint, 12 Node tests, production compilation, npm audit and the production-only browser suite. The simulation used a temporary checkout and did not update main.

| Final local mobile Lighthouse run | Review branch | Simulated merge with main |
|---|---:|---:|
| LCP | 2.56 s | 2.56 s |
| CLS | 0 | 0.083 |
| Homepage transfer | 229,079 bytes | 230,366 bytes |
| Requests | 11 | 11 |

**G. Remaining risks.** The local release checks do not verify GitHub-hosted Actions or CodeQL permissions, production Supabase grants, real webhook delivery, Render configuration, CDN headers, or real-user Web Vitals. Those items remain in the [deployment acceptance and rollback plan](READINESS.md#production-gates-and-rollback).

**H. Next step.** Phase 7 requires owner approval to create a separate static preview. Production traffic switching requires its own approval after the preview passes acceptance.
