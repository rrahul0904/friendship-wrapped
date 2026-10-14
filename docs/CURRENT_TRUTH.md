# ThreadTales current truth

**Audit time:** 2026-10-13 21:46 EDT (2026-10-14 01:46 UTC)  
**Classification:** phase-0 baseline; provider flags are configuration indicators, not proof of provider health.  
**Canonical repository:** [`rrahul0904/friendship-wrapped`](https://github.com/rrahul0904/friendship-wrapped)

## Machine-readable baseline

```json
{
  "repo": "rrahul0904/friendship-wrapped",
  "main_sha": "8859495cd9062eb2a6a842c80a75639453d61026",
  "production_sha": "8859495cd9062eb2a6a842c80a75639453d61026",
  "production_deployment_id": "6992138130",
  "production_url": "https://threadtales-five.vercel.app",
  "preview_sha": "f76176e0ad0c9e90871bde56ac6c064d03f742e4",
  "preview_pr": 25,
  "preview_deployment_id": "7029009666",
  "preview_url": "https://threadtales-ltl6z4him-rrahul0904-5013s-projects.vercel.app",
  "open_prs": [
    {"number": 23, "head": "6e7e667c1b8b939345988e351d8f879f055b64eb", "base": "rebuild/source-first-threadtales", "status": "open-draft", "ci": "pass"},
    {"number": 25, "head": "f76176e0ad0c9e90871bde56ac6c064d03f742e4", "base": "main", "status": "open-ready", "ci": "fail-memory-keeper-e2e"},
    {"number": 26, "head": "782ea189268c9046f6cdc95dae9bb49c5f7709ab", "base": "reverse-os/threadtales-memory-keeper", "status": "open-draft-stacked", "ci": "pass-on-stacked-base", "merge_state": "dirty"},
    {"number": 27, "head": "16f71207e6eaf468b398086e0f61f9fe4586ebe2", "base": "reverse-os/threadtales-memory-candidates", "status": "open-draft-stacked", "ci": "pass-on-stacked-base"},
    {"number": 28, "head": "58e4454ee05a90acd3ae98a132066258987e4afa", "base": "reverse-os/threadtales-memory-story-plan", "status": "open-draft-stacked", "ci": "pass-on-stacked-base"}
  ],
  "ci_status": {
    "main_run": "38119383860",
    "main_conclusion": "success",
    "pr25_run": "38339878303",
    "pr25_conclusion": "failure",
    "pr25_failure": "Memory Keeper conversation test waits for demo control not rendered by canonical source-first /create"
  },
  "routes": {
    "primary": ["/", "/create", "/rebuild", "/memory/new (PR25 only)", "/memory/[id] (PR25 only)", "/memory/story (PR27 only)", "/memory/studio (PR28 only)"],
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
    "vercel_project_settings_and_env_key_inventory": "unknown; no Vercel CLI/project credentials available",
    "supabase_public_server_auth_storage": "application reports configured; service health/schema unknown",
    "stripe_production_checkout_webhook_subscriptions": "disabled",
    "preview_stripe_checkout_webhook": "application reports configured; transaction not tested",
    "openai": "disabled",
    "telemetry": "application reports configured; event delivery unverified"
  },
  "stripe_status": "not monetization-verified; no current product/price/webhook account inspection or test payment",
  "supabase_status": "unverified; documented project hostname fails DNS in the current audit; migrations/RLS/auth/storage not remotely verified",
  "known_blockers": [
    "PR25 route handoff regression fails one Chromium E2E; source-first /create does not enter Memory Keeper candidate review",
    "PR26 is dirty against its stacked parent; downstream green runs do not prove mergeability against canonical main",
    "five-user first-session emotional/product UAT and real-device share validation are absent",
    "Stripe payment, signed webhook, idempotent entitlement, and premium unlock are unverified",
    "Supabase health, remote schema/migrations, RLS, storage, deletion, and authenticated recovery are unverified",
    "no production cloud Memory Vault, durable media upload, private hosted share links, or licensed MP4 renderer is claimed"
  ],
  "next_phase": "Phase 1/2: preserve the verified source-first /create journey while integrating the MemorySpace conversation handoff; repair PR25's failing E2E before advancing the stack"
}
```

## Evidence ledger

| ID | Class | Evidence | Result |
| --- | --- | --- | --- |
| TT-P0-001 | VERIFIED | GitHub `main` and merged-main CI [38119383860](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38119383860) | Main is `8859495`; CI success. |
| TT-P0-002 | VERIFIED | Production `/api/version`; GitHub deployment `6992138130` | Production alias serves `8859495`, environment `production`. |
| TT-P0-003 | VERIFIED | Latest successful #25 Preview deployment `7029009666` | Preview serves `f76176e`; this is not production. |
| TT-P0-004 | VERIFIED | Exact-head PR #25 CI [38339878303](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38339878303) | 47 browser tests pass; one Memory Keeper conversation flow fails because `/create` does not render `Use demo chat`. |
| TT-P0-005 | VERIFIED | [PR #25](https://github.com/rrahul0904/friendship-wrapped/pull/25), [#26](https://github.com/rrahul0904/friendship-wrapped/pull/26), [#27](https://github.com/rrahul0904/friendship-wrapped/pull/27), [#28](https://github.com/rrahul0904/friendship-wrapped/pull/28) metadata and diffs | MemorySpace work is an open stacked implementation, not deployed functionality. |
| TT-P0-006 | VERIFIED | Production and #25 Preview `/api/integrations/status` | Flags match this file's service summary; flags alone do not prove remote service health. |
| TT-P0-007 | VERIFIED | Source-first code and E2E tests on `main`; `docs/uat/SOURCE_FIRST_FIRST_SESSION_UAT.md` | Local analysis/story/share behavior is implemented and browser-tested; human UAT is missing. |
| TT-P0-008 | UNKNOWN | Vercel dashboard/project env inventory, Supabase console, Stripe account | Account settings, remote migrations, payment/webhook state and runtime logs were inaccessible to this audit. |
| TT-P0-009 | VERIFIED | Supabase host DNS probe and available local credentials/tools | Documented host does not resolve; provider credentials/CLI access are absent. |

## Assumption and unknowns ledger

- **OBSERVED:** `/create` on canonical `main` renders the source-first ThreadTales experience; PR #25's `/memory/new` hands conversation intake to `/create?memorySpaceId=...`.
- **INFERRED:** PR #25's intended UI is reachable if `/create` selects the existing `UploadAnalyzer` for a valid MemorySpace query parameter; the failing E2E supports this diagnosis.
- **UNKNOWN:** Whether the current PR stack is independently mergeable after all branches are rebased on current `main`; only PR #25's current failing run and PR #26 dirty state were observed.
- **UNKNOWN:** Whether configured provider flags correspond to a healthy, correctly owned remote project, valid migrations, or verified payment settlement.
- **UNKNOWN:** Whether first-time users find the new MemorySpace architecture emotionally clear; no human UAT results exist.

## Contradiction to resolve

At this baseline's audit time, older certification/roadmap documents still identified `067c3d6` and PR #19 as current/open. PR #19 merged as `f571150`, and PR #22 subsequently moved main and production to `8859495`. The implementation work now date-labels those historical records. This baseline remains a point-in-time record; see the implementation tracker for subsequent route-fix verification.
