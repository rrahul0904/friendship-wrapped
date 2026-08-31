# Codex Implementation Prompt — ThreadTales Production Phase 0

## Production baseline, reliability, tests, CI, privacy hardening, and deployment synchronization

You are continuing implementation in the existing repository.

Repository:
`rrahul0904/friendship-wrapped`

Working branch:
`production-phase-0`

Base branch:
`main`

Product:
**ThreadTales / Friendship Wrapped** — a privacy-first browser application that turns exported chats into visual relationship stories while keeping raw chat content on the user's device during the free flow.

## Important: continue the existing implementation

DO NOT start a new project.
DO NOT replace the current architecture.
DO NOT rewrite working V1/V2 functionality unnecessarily.
DO NOT add a database, authentication, Stripe, AI, queues, Redis, Docker, microservices, a vector database, or a new backend service in this phase.
DO NOT upload raw chat content to any server, API route, Server Action, analytics product, log collector, or persistence layer.

The intended stack for this phase remains deliberately small:

- Next.js App Router
- React
- TypeScript
- plain CSS
- browser File APIs
- Vercel
- Vitest for unit tests
- Playwright for critical browser smoke tests
- GitHub Actions for CI

Before modifying code, inspect the repository and read at minimum:

- `README.md`
- `docs/PRODUCT_STRATEGY_2026.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/PLATFORM_ARCHITECTURE.md`
- `src/components/UploadAnalyzer.tsx`
- `src/components/WrappedStory.tsx`
- `src/lib/parser.ts`
- `src/lib/analyze.ts`
- `src/lib/share.ts`
- `src/lib/types.ts`
- `package.json`
- `tsconfig.json`

The current application already includes working browser-local parsing and analytics, derived-stat sharing, relationship modes, richer V2 analytics, and the multi-product product registry. Preserve them.

---

# Mission

Turn the existing ThreadTales V2 prototype into a production-grade baseline that is deterministic, testable, privacy-verifiable, CI-protected, and safe to deploy.

Phase 0 is complete only when a developer can clone the repository, run one documented verification command sequence, obtain green lint/typecheck/unit/E2E/build results, and deploy the same code to Vercel without introducing any new backend infrastructure.

---

# Workstream 1 — Baseline audit before edits

First inspect and document the current state.

Record in `docs/PHASE_0_STATUS.md`:

- current architecture
- current routes
- current parser formats
- current analytics outputs
- current share model
- current privacy assumptions
- current build/lint scripts
- missing automated test coverage
- known correctness risks discovered during inspection

Do not merely copy the roadmap. Base this on the actual repository.

Pay particular attention to:

1. date parsing correctness;
2. malformed dates that JavaScript `Date` might silently roll into another month;
3. multiline message handling;
4. timestamped WhatsApp system messages;
5. empty/short exports;
6. ambiguous MM/DD vs DD/MM exports;
7. 12-hour and 24-hour time formats;
8. Unicode directional/spacing characters commonly found in chat exports;
9. large files near the current client-side size guard;
10. whether any raw chat content can accidentally enter URLs, console output, server code, browser persistence, or share payloads.

---

# Workstream 2 — Package scripts and developer verification

Keep npm as the default workflow unless the repository itself proves another package manager is authoritative.

Add or normalize scripts so the project supports at least:

```json
{
  "lint": "...",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "build": "next build",
  "verify": "..."
}
```

`npm run verify` should run the fast deterministic checks appropriate before commit. If Playwright makes `verify` too slow, keep browser smoke tests in CI as a separate step and document the split.

Pin new dependency versions through the lockfile. Do not introduce a large testing framework stack when Vitest + Playwright is enough.

---

# Workstream 3 — Parser fixture suite

Create a small, explicit fixture suite under a clear test directory such as:

```text
tests/
  fixtures/
    whatsapp/
  unit/
  e2e/
```

Use synthetic fixture conversations only. Do not commit real private conversations.

Fixtures/tests must cover at minimum:

### Android-style exports
- MM/DD/YYYY
- DD/MM/YYYY
- two-digit year
- 12-hour time with AM/PM
- 24-hour time
- multiline messages

### iOS-style exports
- bracketed timestamps
- MM/DD/YYYY
- DD/MM/YYYY
- multiline messages

### Edge cases
- blank lines
- Unicode direction marks
- harmless Unicode spacing variation
- timestamped system lines
- media/system markers where currently supported
- sender names containing spaces
- message bodies containing additional colons
- invalid dates
- invalid times
- malformed lines between valid messages
- fewer than five parseable messages

### Correctness requirement

Fix parser correctness bugs discovered by the tests, but preserve the current supported product contract.

In particular, do not rely only on `new Date(year, month, day)` to validate calendar dates because JavaScript can normalize impossible dates. Validate that the constructed date round-trips to the requested year/month/day/time.

Do not expand into Telegram/iMessage/Instagram import work in Phase 0.

---

# Workstream 4 — Analytics unit coverage

Treat analytics as deterministic domain logic independent of React.

Add unit tests for the currently implemented metrics, including where applicable:

- total messages
- total words
- participants and participant split
- first/last date
- active span / active days
- longest streak
- biggest/busiest day
- longest quiet period
- peak hour
- favorite weekday
- late-night activity
- questions
- laughter signals
- heart signals
- media signals
- top words
- yearly timeline
- conversation starters
- reply-speed metric
- daily rhythm
- deterministic vibe/story scoring currently present

Use small hand-checkable datasets so expected values are obvious.

Do not add pseudo-scientific relationship scoring. Test only behavior the current application intentionally exposes.

---

# Workstream 5 — Error and state hardening

Improve the existing import/analyze flow without redesigning it.

Requirements:

- unsupported extension produces a clear actionable error;
- file over the configured client-side limit produces a clear error;
- empty file produces a clear error;
- too-few-message export produces a clear error;
- parser failure never crashes the page;
- selecting a new file clears stale errors/results appropriately;
- reset/retry behavior clears raw in-memory text references as much as practical;
- file input may be reused for a second import;
- buttons have correct disabled/busy states;
- drag/drop handles unsupported files safely;
- no fake success state after a parser error;
- accessibility basics exist for errors, file input, controls, and busy state.

Keep the current experience fast: no account, no onboarding wizard, no backend round trip.

Do not implement the Phase 1 Web Worker yet unless it is required to fix an actual Phase 0 correctness defect. Large-chat worker migration belongs to Phase 1.

---

# Workstream 6 — Share/privacy boundary tests

The public/share payload must contain derived statistics only.

Add tests that prove raw message text is not included in encoded/public share data.

Review `src/lib/share.ts` and all share routes/components.

Create `docs/PRIVACY_ARCHITECTURE.md` describing the actual implemented data flow:

```text
local file
  -> browser memory
  -> parser
  -> derived analytics
  -> story UI
  -> optional derived share payload
```

The document must explicitly state what does and does not leave the browser in the free flow.

Verify the source tree for accidental raw-content transmission/persistence patterns, including:

- `fetch`
- Server Actions
- API routes
- `console.log` of message data
- `localStorage`
- `sessionStorage`
- cookies containing message content
- URLs/query strings containing raw messages
- analytics events containing message text

If a mechanism exists for legitimate non-message application behavior, document why it is safe.

Do not claim security properties that are not supported by the code.

---

# Workstream 7 — Playwright critical-flow smoke tests

Add minimal Playwright coverage for the product-critical browser flow.

Required smoke tests:

1. landing page loads and primary CTA reaches `/create`;
2. demo mode produces a results story;
3. synthetic `.txt` fixture upload produces results;
4. invalid file type shows an error;
5. malformed/insufficient chat shows a recoverable error;
6. privacy page loads;
7. share flow, if currently functional without external infrastructure, produces a derived-stat share representation without raw message text.

Keep the E2E suite small and stable. It is a smoke barrier, not a giant UI test suite.

---

# Workstream 8 — GitHub Actions CI

Add a straightforward CI workflow under `.github/workflows/`.

On pull request and push to relevant branches, run:

```text
checkout
-> setup Node
-> npm ci
-> lint
-> typecheck
-> unit tests
-> build
-> Playwright smoke tests
```

Cache dependencies using standard supported actions/configuration.

Do not add a custom CI platform.

Do not store secrets because Phase 0 should not require any.

The workflow must be reproducible locally with documented commands.

---

# Workstream 9 — Production/Vercel synchronization readiness

The currently live Vercel production deployment may lag behind GitHub `main`.

Do not blindly promote production before validation.

Prepare the branch so that, after review/merge, Vercel Git integration can deploy the exact verified commit.

Verify:

- `npm run build` succeeds;
- no server secret is required for the free product;
- `NEXT_PUBLIC_SITE_URL` behavior remains sane;
- routes build cleanly;
- there are no Node-only APIs in browser-local parser/analytics modules;
- no raw chat content enters Vercel Functions during the free flow.

If Vercel CLI/authentication is available in the Codex environment, you may create/inspect a preview deployment after all checks pass. Do not overwrite or promote production until the branch is green and the repository workflow permits it.

Document the final deployment verification in `docs/PHASE_0_STATUS.md`.

---

# Workstream 10 — Documentation cleanup

Update README only where necessary so a new contributor can find:

- product strategy
- implementation roadmap
- Phase 0 status
- privacy architecture
- local development commands
- verification commands
- Vercel deployment model

Do not turn README into a giant design document.

---

# Required implementation quality

Prefer small pure functions and explicit domain types.

Do not refactor working UI merely for stylistic preference.

Avoid adding abstractions unless they remove a real current duplication or make deterministic logic testable.

Do not add an ORM.
Do not add Supabase.
Do not add Stripe.
Do not add AI SDKs.
Do not add Tailwind or a component library just to restyle existing screens.
Do not introduce state-management libraries unless the existing React state demonstrably cannot support Phase 0.

The product must remain easy to understand and easy to deploy.

---

# Acceptance criteria

Phase 0 is complete only if all of the following are true:

- existing ThreadTales functionality still works;
- TypeScript strict mode remains enabled;
- parser fixtures cover iOS/Android and major edge cases;
- impossible calendar dates cannot silently normalize into valid messages;
- analytics calculations have deterministic unit coverage;
- share tests prove raw message text is excluded;
- import errors are recoverable and user-friendly;
- Playwright smoke tests cover the core journey;
- GitHub Actions runs lint + typecheck + unit tests + build + E2E smoke;
- `npm ci` from a clean checkout works;
- `npm run build` passes;
- raw chats remain browser-local in the free product path;
- no database/auth/AI/payment infrastructure is introduced;
- `docs/PHASE_0_STATUS.md` truthfully records what was implemented and any remaining limitations;
- the branch is safe to merge and deploy through the existing Vercel project.

---

# Commit strategy

Use focused commits rather than one giant dump. A good sequence is approximately:

1. `test: establish vitest parser and analytics fixtures`
2. `fix: harden chat parsing and import failure handling`
3. `test: add privacy and share boundary coverage`
4. `test: add playwright critical-flow smoke tests`
5. `ci: add production verification workflow`
6. `docs: record phase 0 privacy and production status`

Adjust the sequence when repository reality requires it.

Do not create artificial commits with no meaningful implementation.

---

# Final Codex report

When finished, report:

1. branch and final commit SHA;
2. files added/changed;
3. bugs found and fixed;
4. parser fixture matrix;
5. analytics test coverage added;
6. privacy verification performed;
7. CI workflow status;
8. build/test commands and results;
9. preview/production deployment status;
10. known limitations intentionally deferred to Phase 1;
11. whether the branch is ready to merge.

Do not claim Phase 1 features such as Web Worker migration, new import providers, payments, persistence, or AI are complete unless they were independently implemented and tested outside this Phase 0 scope.

## After Phase 0

Stop after Phase 0 and report results.

The planned next implementation wave is **Phase 1 — Import/Analytics Engine V2 hardening for large real-world histories, including Web Worker processing and result-schema versioning**. Do not begin it in this run.