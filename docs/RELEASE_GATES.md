# ThreadTales release gates

**Current status:** `DEPLOYED_NOT_CERTIFIED`. Production serves `8859495cd9062eb2a6a842c80a75639453d61026`; current MemorySpace work is not merged/deployed.

| Gate | Required evidence | Current state | Exit condition |
| --- | --- | --- | --- |
| Exact source baseline | Main SHA, PR head, CI run, Vercel deployment, production `/api/version` | Main/production match `8859495`; CI `38119383860` passed. | Refresh receipt on each release; production endpoint matches intended merge SHA. |
| Primary create regression | `/create` and `/rebuild` preserve current source-first flow; MemorySpace query enters candidate review | PR #25 fails one E2E; 47 Chromium tests pass. | Both flows green in exact-head Chromium and WebKit suite. |
| Privacy | Raw chat local by default; only derived, approved node stored; no raw text in network/log/storage | Existing source-first network test passes; Memory Keeper full flow not yet reachable. | Add exact flow network/localStorage/privacy tests and independent review. |
| MemorySpace graph | Create, approve, reload/reopen, reuse, export/archive, delete; malformed storage rejected safely | Local-only partial implementation in open PR stack | All operations pass meaningful unit/integration/browser tests; schema versioning documented. |
| Intent composer | Canonical intents differ structurally, use approved evidence only, sparse graph is truthful | PR #27 implementation on stacked branch; not verified against current main | Intent matrix, evidence grounding, sparse fallback, and UAT pass. |
| Story output/share | Download/share works on desktop/mobile, fallback is usable, sensitive content only with user action | Source-first PNG/share is in production; no MemorySpace story proof | Exact release tested at phone/tablet/laptop/desktop and visual output reviewed. |
| Human product UAT | Five first-time users; ≥4/5 unassisted and would-share, zero unsupported-psychology interpretation; owner review exact SHA; real phone share plus fallback | No UAT result artifact | All criteria have dated evidence and no critical phone failure. |
| GitHub CI/review | Exact PR head: install, lint, typecheck, unit, perf, secret scan, build, browser; independent review | Main green; PR25 CI red; stacked PRs green only on their own lineage | Exact final candidate and relevant stacked descendants green; review findings resolved. |
| Preview | Exact PR SHA deployment, version endpoint, route smoke and browser UAT | #25 Preview exists for `f76176e`, but failing E2E invalidates candidate readiness | Exact final PR head deployed and checks pass. |
| Supabase | Correct project identity, health, migrations/schema, RLS, auth, storage, deletion and cross-user denial | App flags true; host DNS failed; remote state unknown | Authorized provider-backed tests and migration reconciliation pass. |
| Stripe | TEST checkout, signed webhook, idempotency, entitlement/premium unlock, failure/refund/revocation behavior; production readiness separately | Production flags false; current resources not inspected; no transaction verified | End-to-end TEST proof without real card; live config verified without exposing values before claiming monetizable. |
| AI | Safe allowlisted payload, consent, provider policy, rate/usage controls, real bounded request | Disabled; key inaccessible; public route controls require verification | Rate controls and secret placement verified before enabling; privacy-safe request proven. |
| Telemetry/operations | Content-free allowlist event delivery; health/errors traceable to SHA | App flags enabled; actual delivery unknown | Test event delivered in authorized test and no message/memory text collected. |
| Production | Merge SHA, production deployment READY, public alias exact SHA, critical route/browser checks, runtime errors inspected | Production currently `8859495`; next candidate not merged | Intended SHA serves on public alias; smoke and error review pass. |
| Certification | All product, engineering, privacy, monetization, deployment and UAT gates pass | Not complete | Only then use `CERTIFIED_DEPLOYED_PRODUCT`; otherwise state exact accurate status. |

## No-side-effect rule for production checks

Do not run `npm run verify:production` against production without first inspecting its current behavior: this script can initiate Stripe checkout, AI, and telemetry actions when flags are enabled. Use read-only version, route, and integration-status probes for baseline work. Run transactional tests only against explicitly authorized TEST environments, with controlled, documented side effects.
