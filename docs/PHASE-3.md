# Phase 3 · Frontend performance

**A. Summary.** The homepage was waiting for a third-party stylesheet that supplied no fonts to its rendered text. Removing the stylesheet and its two preconnect hints preserved the observed typography and eliminated a dependency from the first paint. This phase builds on review commit `99e7084`. That commit already contains responsive portrait variants, reserved route space, lazy routes, and compression of hashed assets.

**B. Findings.** Medium severity. In the comparison build, `index.html:49` requested Inter and JetBrains Mono. The document body and React shell use Tailwind's system sans stack, and the standalone `.font-mono-code` rule had no React or HTML caller. On a 390 × 844 homepage, Chromium observed one external stylesheet request, zero font-file requests and three computed text stacks (system sans, monospace and serif). The same stacks were present after the change. The self-contained social preview artwork is rendered separately.

**C. Priority.** Remove the confirmed render-blocking request first. The tested build had no reduction in emitted JavaScript from this change. Existing lazy routes and portrait handling already address different parts of the load path. Further component splitting needs a new trace showing a JS bottleneck.

**D. Implementation.** Removed the external stylesheet and preconnects from `index.html`, aligned the HTML base with the existing system sans variable in `src/index.css`, and removed the unused mono rule. The production browser check now runs Lighthouse without its previous Google Fonts exclusion, checks for external fonts and stylesheets in the homepage request log, and prints paint, transfer, request and blocking metrics.

**E. Verification.** Ran `npm run lint`, `npm run typecheck`, `npm test` (11 passed), and `npm run build`. Ran the compiled-server suite in `scripts/check-browser.mjs` using the isolated browser tools documented in [READINESS.md](READINESS.md#reproduce-locally). Mobile and desktop layout, light and dark themes, axe checks, the command shortcut, admin sign-in, the authenticated resume editor, the transfer budget and the new network check passed.

**F. Comparison.** Three cold-context Chromium navigations per production bundle, ordered before/after/after/before/before/after. A loopback static server served both bundles, the portfolio API returned an empty fixture response and browser caching was disabled. In the baseline, request interception delivered the fetched Google Fonts CSS after an imposed 400 ms wait. This isolates sensitivity to that dependency. The delay is an experimental input. It is not a measured Google latency.

| Metric | Before | After |
|---|---:|---:|
| Median first contentful paint | 516 ms | 100 ms |
| Median largest contentful paint | 632 ms | 156 ms |
| Median layout shift | 0 | 0 |
| Median HTML TTFB over loopback | 5.0 ms | 2.8 ms |
| External typography requests per navigation | 1 stylesheet, 0 fonts | 0 |
| All emitted JS, uncompressed | 512,288 B | 512,288 B |
| Emitted CSS, uncompressed | 55,284 B | 55,132 B |

The separate mobile Lighthouse run against the compiled Express service measured **2.56 s LCP, 0.91 s FCP, 0 CLS, 18 ms total blocking time, 229,112 bytes and 11 requests**. A second run also measured 2.56 s LCP, with CLS 0.083. Previously recorded mobile LCP on the review branch was already 2.56 s with Google Fonts blocked. The evidence supports removing the external wait. It does not establish a new mobile LCP gain under those previously blocked conditions.

**G. Remaining risks.** Browser and Lighthouse results are local lab observations. Field INP, mobile-network latency and TTFB after Render inactivity require field or hosted measurements. The authenticated editor and public pages exercised here are a sample of UI states. No hosted service or production settings were changed.

**H. Next phase.** Phase 4 is the backend and architecture review. Treat the implementation already on the review branch as input for verification. Final deployment and traffic changes require separate approval.
