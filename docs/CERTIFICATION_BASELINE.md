# Production certification baseline

Evidence collected 2026-10-01. This is a baseline assessment, not a production certification.

- Canonical repository: `rrahul0904/friendship-wrapped`; clean `main` fetched and fast-forward checked at `067c3d635e45413514850fb7fcab4504822ee216`.
- Working branch: `codex/threadtales-production-certification`.
- Production `GET /api/version`: same SHA, environment `production`.
- GitHub API confirms PR #7 merged 2026-09-01, #13 merged 2026-09-07, #17 merged 2026-09-15.
- Baseline merged-main CI: [34925302823](https://github.com/rrahul0904/friendship-wrapped/actions/runs/34925302823), completed/success on the exact baseline SHA. This does not certify the new branch.
- No local deployment secrets, GitHub Git credential, or connected Supabase/Vercel/Stripe provider tools were available at baseline. Provider installation/connection suggestions are pending. Account state and remote migration history cannot be inferred from public configuration.

| Capability | Implemented | Configured | Live verified | Missing/broken | Evidence |
| --- | --- | --- | --- | --- | --- |
| Local import/analyze/story/Memory Cinema | Yes, source | No service required | Pending browser verification | Full clean verification pending | `src/components/UploadAnalyzer.tsx`, worker/importers/story modules, existing E2E tests |
| Sharing/image/print | Yes, source | No service required | Pending | Privacy/network/export verification pending | `src/lib/share.ts`, platform export/print modules |
| Auth/session | Yes, source | Production reports public Supabase config | No | No controlled identities or provider access | identity modules, auth routes, public integration status |
| Story persistence | Yes, source | Production reports Supabase config | No | Derived result timeline uses `messages`, which the raw-content guard rejects; persistence payload includes participant names/top words | `result-v2.ts`, `supabase-rest.ts`, stories route |
| Worlds/albums/private media | Yes, source | Production reports Supabase config | No | Upload/read/delete and cross-user access unverified | worlds/albums/media routes, storage adapters |
| PetLife collaboration | Yes, source | Production reports Supabase config | No | Household RLS correction exists in source; remote application unverified | `20260907_petlife_household_rls_scope.sql`, PetLife routes |
| Supabase health/migrations/RLS | SQL exists | Public endpoint reports variables present | No | Existing ref `pkmkynhkgitdslhadupj` reported INACTIVE by task input; current provider health cannot yet be independently confirmed | schema + six migration files; no account connection |
| Stripe checkout/webhook/entitlement | Yes, source and mocked tests | Production reports all Stripe flags false | No | TEST payment/webhook and LIVE configuration unavailable | checkout/webhook/entitlement routes, public integration status |
| Recurring subscriptions | Yes, source | Production reports false | No | Configuration-gated; release scope must be explicit | billing modules/status endpoint |
| OpenAI enrichment | Yes, source, `store: false` | Production reports disabled | No | Nested chapter objects forwarded without a field projection; truthy consent accepted; default model needs verification | AI validator/provider; privacy tests only cover top-level extra fields |
| Telemetry | Yes, bounded sanitization | Production reports enabled, Supabase sink | No | Actual delivery and corresponding database row unverified | telemetry route/events/migration, public integration status |
| CI | Workflow exists | GitHub baseline run completed | Baseline only | New branch exact-head CI pending | run 34925302823 |
| Preview | Verification script exists | Unknown | No | No exact-branch deployment yet | Vercel account access pending |
| Production | Public deployment accessible | Version endpoint responds | Exact baseline version only | Routes, browser, runtime logs and integrations still pending | canonical URL `/api/version` |
| Documentation | Exists | N/A | Drift confirmed | #7/#13 pending-merge and project-creation claims stale | GitHub PR API versus status documents |

No implementation changes preceded this matrix. Follow-up results belong in `PRODUCTION_CERTIFICATION.md` and must distinguish source tests, public observations, and authenticated provider evidence.
