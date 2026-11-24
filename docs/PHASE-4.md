# Phase 4 · Backend and architecture

## A. Executive summary

The server can authenticate an editor while portfolio storage is starting. After a transient database outage it can also recover the authoritative portfolio without a restart or a write. The tests use the compiled Express service, loopback HTTP and disposable storage fixtures. No production settings or data were used.

## B. Findings and C. Priorities

| Priority | Finding and impact at Phase 3 commit `d4f0709` | Regression to guard against |
|---|---|---|
| High | A failed initial Supabase read left the service serving a fallback until a subsequent write retried the database. A valid JSON file with incomplete metadata could also enter the local cache. | Preserve the previous snapshot on failure. Reject stale drafts after recovery. Protect a damaged local file from overwrite. |
| Medium | The global storage middleware also delayed login, verification and logout. Those routes use the local session store independently of portfolio data. | Keep portfolio content, history, mutations and active assets behind the initial storage read. |
| Medium | Shutdown drained HTTP requests, then exited even when the scheduled GitHub reconciliation was still working. | Prevent new scheduled scans while draining. Bound shutdown if an upstream dependency stalls. |
| Low | PostgREST writes requested a representation of the entire saved row, but only its revision was consumed. | Keep the revision filter and empty-result conflict detection on updates. |

## D. Implementation and architecture decisions

- Moved the three session routes ahead of the portfolio readiness gate. Existing authentication, rate limits and body parsing still apply. [Session routes and readiness middleware](../server.ts#L205)
- Validate the snapshot content, revision timestamp and repository map before caching. Retry configured degraded storage once per minute in the background. Overlapping retries and writes share an in-flight database read. Healthy public reads continue to use memory. Conditional writes request only `updated_at` in the response. [Store](../server/portfolioStore.ts#L34)
- Stop scheduling reconciliation on shutdown, drain active HTTP and the scheduled reconciliation, and cap shutdown at 25 seconds. An exceeded deadline exits with a failure status. [Server lifecycle](../server.ts#L976)
- The frontend shell, route bundles, CSS, icons and responsive default portrait can be static. Current public content, repository visibility, mutable asset URLs, admin edits, sessions, uploads, signed webhooks and optional resume parsing need the API. The existing `VITE_API_ORIGIN` boundary already supports this split. Keep public authorization-sensitive snapshots uncached at the HTTP layer because visibility can change between requests. Static and fingerprinted asset caching stay in place.
- Kept the existing Express entry point, domain modules and compiled Node startup command. Moving handlers into extra routers would not change the observed wait or recovery behavior.

## E. Verification and F. Comparison

Ran ESLint, TypeScript, the Node suite (12 passing), and the Vite/esbuild production build. The compiled browser suite passed both themes, sampled mobile and desktop routes, the authenticated editor, accessibility checks and the homepage transfer budget. [HTTP coverage](../tests/github-publication.test.ts) · [Storage recovery coverage](../tests/storage-recovery.test.ts)

Three fresh compiled processes per revision held the initial Supabase fixture response for 500 ms. After liveness returned, the client requested an anonymous session verification and public portfolio simultaneously. Session verification correctly returned 401 in all trials. Portfolio reads returned 200 after initialization.

| Loopback latency, milliseconds | Phase 3 trials | Phase 4 trials | Median before → after |
|---|---|---|---|
| Session verification | 512, 513, 510 | 3, 2, 2 | 512 → 2 |
| Portfolio snapshot | 513, 514, 510 | 511, 512, 516 | 513 → 512 |

In a separate compiled-service check, the first storage read returned 503. The background retry restored durable status after 60 seconds without an edit. Sending SIGTERM during a held GitHub scan kept the process alive until the scan was released, then it exited with code 0.

To reproduce the functional gates, run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run the compiled browser suite using the [browser setup instructions](READINESS.md#reproduce-locally). The HTTP test deliberately holds the initial store read while verification completes. The storage test injects a failed read, then overlaps two recovery attempts, verifies a single retry, and submits a stale draft.

## G. Remaining risks and H. Next phase

The latency experiment isolates a startup dependency. Hosted Render wake-up time, real Supabase latency and proxy behavior still require an approved hosted test. Read readiness permits fallback content while durable storage is offline. A persistent outage can keep it stale. Local sessions and throttling still assume a single writable backend instance. Production storage permissions and platform shutdown timing remain acceptance checks.

Phase 5 is code quality, UI/UX, accessibility and SEO. Existing work on the review branch is input to that phase. Deployment remains subject to separate approval.
