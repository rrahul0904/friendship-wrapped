# ThreadTales current truth

**Audit time:** 2026-10-14 13:56 EDT (2026-10-14 17:56 UTC)
**Classification:** refreshed phase-0 baseline; provider flags are configuration indicators, not proof of provider health.
**Canonical repository:** [`rrahul0904/friendship-wrapped`](https://github.com/rrahul0904/friendship-wrapped)

## Machine-readable baseline

```json
{
  "repo": "rrahul0904/friendship-wrapped",
  "main_sha": "8859495cd9062eb2a6a842c80a75639453d61026",
  "production_sha": "8859495cd9062eb2a6a842c80a75639453d61026",
  "production_deployment_id": "6992138130",
  "production_url": "https://threadtales-five.vercel.app",
  "implementation_branch": "reverse-os/threadtales-memory-keeper",
  "implementation_sha": "433bf4ae47d8d5b633715310ee7ff444f6e4e03d",
  "preview_sha": "433bf4ae47d8d5b633715310ee7ff444f6e4e03d",
  "preview_pr": 25,
  "preview_deployment_id": "7073001489",
  "preview_url": "https://threadtales-5mz1c0xtb-rrahul0904-5013s-projects.vercel.app",
  "open_prs": [
    {"number": 23, "head": "6e7e667c1b8b939345988e351d8f879f055b64eb", "base": "rebuild/source-first-threadtales", "status": "open-draft"},
    {"number": 25, "head": "433bf4ae47d8d5b633715310ee7ff444f6e4e03d", "base": "main", "status": "open-ready", "merge_state": "CLEAN", "ci": "success_2026-10-14_run_38610233469", "vercel": "success_exact_sha_preview_7073001489"},
    {"number": 26, "head": "782ea189268c9046f6cdc95dae9bb49c5f7709ab", "base": "reverse-os/threadtales-memory-keeper", "status": "open-draft-stacked", "ci": "success_2026-10-06", "merge_state": "UNKNOWN"},
    {"number": 27, "head": "16f71207e6eaf468b398086e0f61f9fe4586ebe2", "base": "reverse-os/threadtales-memory-candidates", "status": "open-draft-stacked", "ci": "success_2026-10-06", "merge_state": "CLEAN"},
    {"number": 28, "head": "58e4454ee05a90acd3ae98a132066258987e4afa", "base": "reverse-os/threadtales-memory-story-plan", "status": "open-draft-stacked", "ci": "success_2026-10-06", "merge_state": "CLEAN"}
  ],
  "ci_status": {
    "main_run": "38119383860",
    "main_conclusion": "success",
    "pr25_previous_run": "38512461422",
    "pr25_previous_head": "6286c3222c6bd45d1cb96523936b3582e33da908",
    "pr25_previous_conclusion": "failure: 43 passed, 7 failures from stale reset-message expectation",
    "pr25_head": "433bf4ae47d8d5b633715310ee7ff444f6e4e03d",
    "pr25_run": "38610233469",
    "pr25_conclusion": "success"
  },
  "routes": {
    "primary": ["/", "/create", "/rebuild", "/memory/new (PR25 only)", "/memory/[id] (PR25 only)", "/memory/intake/[source] (PR25 only)", "/memory/story (PR27 only)", "/memory/studio (PR28 only)"],
    "existing_products": ["/relationship", "/babystory", "/familytree", "/petlife", "/homestory", "/lifemap", "/myyear", "/founderworld", "/creatorworld", "/products/*"],
    "account_and_platform": ["/login", "/register", "/account", "/settings", "/billing", "/albums", "/worlds/*", "/share"]
  },
  "services": {
    "application": "Next.js App Router on Vercel",
    "primary_analysis": "browser-local Web Worker; no account required",
    "database_and_auth": "optional Supabase integration; remote project health not verified",
    "payments": "optional Stripe integration; live checkout/webhook not configured in production",
    "ai": "optional OpenAI enrichment; disabled in production and Preview",
    "telemetry": "app reports enabled with Supabase sink; delivery not verified"
  },
  "env_status": {
    "vercel_project_settings_and_env_key_inventory": "unknown; no CLI, project link, or project credentials available",
    "supabase_public_server_auth_storage": "application reports configured; documented project host fails DNS; health/schema unknown",
    "stripe_production_checkout_webhook_subscriptions": "disabled",
    "preview_stripe_checkout_webhook": "application flags previously reported configured; transaction not tested",
    "openai": "disabled",
    "telemetry": "application reports configured; event delivery unverified"
  },
  "stripe_status": "not monetization-verified; no current product/price/webhook account inspection or test payment",
  "supabase_status": "unverified; documented project hostname fails DNS in the current audit; migrations/RLS/auth/storage not remotely verified",
  "known_blockers": [
    "PR25 is verified on exact-head CI and Preview but remains unmerged; merge state is UNSTABLE",
    "PR26–#28 use stacked bases and have older successful checks; current exact-head integration against canonical main is unverified",
    "five-user first-session emotional/product UAT and real-device share validation are absent",
    "Stripe payment, signed webhook, idempotent entitlement, and premium unlock are unverified",
    "Supabase health, remote schema/migrations, RLS, storage, deletion, and authenticated recovery are unverified",
    "no production cloud Memory Vault, durable media upload, private hosted share links, or licensed MP4 renderer is claimed"
  ],
  "next_phase": "Complete first-time-user and owner UAT on exact Preview 7073001489; resolve provider and stacked-PR integration gates before production promotion"
}
```

The baseline above is live as of the audit time. Current PR head `433bf4a` is available on exact-SHA Preview deployment `7073001489`, and route smoke passes. Exact-head CI run `38610233469` passed. Production remains unchanged at `8859495`.

## Evidence ledger

| ID | Class | Evidence | Result |
| --- | --- | --- | --- |
| TT-P0-001 | VERIFIED | GitHub `main` and merged-main CI [38119383860](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38119383860) | Main is `8859495`; CI success. |
| TT-P0-002 | VERIFIED | Production `/api/version`; GitHub deployment `6992138130` | Production alias serves `8859495`, environment `production`. |
| TT-P0-003 | VERIFIED | Exact-SHA #25 Preview deployment `7073001489`; `/api/version` and route smoke | Preview serves `433bf4a`; `/`, `/create`, `/memory/new`, manual intake, Relationship Universe, LifeMap, and MyYear return HTTP 200. It is not production. |
| TT-P0-004 | VERIFIED | Exact-head PR #25 CI [38610233469](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38610233469) | Candidate `433bf4a` passed lint, typecheck, unit, performance, secret scans, production build, Chromium, and WebKit/iPhone. Previous head `6286c32` failed seven reset-message assertions; follow-up restored compatible wording and added PetLife recovery feedback. |
| TT-P0-005 | VERIFIED | [PR #25](https://github.com/rrahul0904/friendship-wrapped/pull/25), [#26](https://github.com/rrahul0904/friendship-wrapped/pull/26), [#27](https://github.com/rrahul0904/friendship-wrapped/pull/27), [#28](https://github.com/rrahul0904/friendship-wrapped/pull/28) live metadata | MemorySpace work remains an open stacked implementation, not deployed functionality. PR #25 has an exact-SHA Preview; production is unchanged. |
| TT-P0-006 | VERIFIED | Production and #25 Preview `/api/integrations/status` | Flags match this file's service summary; flags alone do not prove remote service health. |
| TT-P0-007 | VERIFIED | Source-first code and E2E tests on `main`; `docs/uat/SOURCE_FIRST_FIRST_SESSION_UAT.md` | Local analysis/story/share behavior is implemented and browser-tested; human UAT is missing. |
| TT-P0-008 | UNKNOWN | Vercel project settings, Supabase console, Stripe account; provider audit | No Vercel CLI/project credentials, Supabase access, or Stripe CLI/API credential is available. Env key inventory, settings, remote migrations, payments/webhooks, and runtime logs remain unverified. |
| TT-P0-009 | VERIFIED | Supabase host DNS probe and available local credentials/tools | Documented Supabase host fails DNS resolution; `/auth/v1/health` is unreachable (HTTP 000). |
| TT-P0-010 | VERIFIED | Production `/api/version`, `/api/integrations/status`, GitHub deployment `6992138130` | Production still serves `8859495`; Stripe flags are disabled, Supabase flags are configured, AI is disabled, telemetry reports Supabase sink. Flags do not prove provider health. |
| TT-P0-011 | VERIFIED | Current candidate local build/tests and independent MemorySpace review | `433bf4a` passes local lint (0 errors; 17 existing warnings), typecheck, 192 unit tests, 3 performance tests, optimized production build, 15 production-mode Chromium tests for parity/world flows, and `git diff --check`; independent re-review found no actionable issue. Exact-head hosted CI [`38610233469`](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38610233469) passed. |
| TT-P0-012 | VERIFIED | Vercel deployment status and current PR #25 Vercel check | Exact-SHA Preview `7073001489` serves candidate `433bf4a`; `/api/version` matches and route smoke passes. |

## Assumption and unknowns ledger

- **OBSERVED:** `/create` on canonical `main` renders the source-first ThreadTales experience; PR #25's `/memory/new` hands conversation intake to `/create?memorySpaceId=...`.
- **VERIFIED:** On candidate `433bf4a`, `/create` remains source-first by default and a valid local MemorySpace query enters candidate review; the branch E2E covers both paths.
- **UNKNOWN:** Whether PR #26–#28 remain mergeable against their live stacked parents and canonical `main`; their recorded CI passes date to 2026-10-06.
- **UNKNOWN:** Whether configured provider flags correspond to a healthy, correctly owned remote project, valid migrations, or verified payment settlement.
- **UNKNOWN:** Whether first-time users find the new MemorySpace architecture emotionally clear; no human UAT results exist.

## Contradiction to resolve

At this baseline's audit time, older certification/roadmap documents still identified `067c3d6` and PR #19 as current/open. PR #19 merged as `f571150`, and PR #22 subsequently moved main and production to `8859495`. The implementation work now date-labels those historical records. This baseline remains a point-in-time record; see the implementation tracker for subsequent route-fix verification.
