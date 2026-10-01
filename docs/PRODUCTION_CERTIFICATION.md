# Production certification evidence

Checked 2026-10-01. Statuses below distinguish deployed source, public observations, and authenticated provider checks.

| Area | Result | Exact evidence | SHA/deployment | Remaining issue |
| --- | --- | --- | --- | --- |
| Repository/main | PASS | Canonical `main` remains the parent of the certification branch | Main `067c3d635e45413514850fb7fcab4504822ee216`; candidate `67b8777e32a6265cf3d2094f3db1d1e7f781fa37` | No merge or production promotion performed |
| PRs | PASS | #7/#13/#17 merged; [PR #19](https://github.com/rrahul0904/friendship-wrapped/pull/19) is open as draft | Exact head `67b8777e32a6265cf3d2094f3db1d1e7f781fa37` | Keep draft until remaining provider gates pass |
| GitHub CI | PASS | [Production CI 36910230791](https://github.com/rrahul0904/friendship-wrapped/actions/runs/36910230791) passed all steps on the exact PR head | Candidate SHA `67b8777e32a6265cf3d2094f3db1d1e7f781fa37` | Existing warnings only |
| npm clean install/audit | PASS | Final clean install completed; production and development audit reported 0 vulnerabilities | Local branch dependencies | None identified by npm audit |
| Lint/typecheck | PASS | ESLint: zero errors, 17 warnings; `tsc --noEmit` succeeded | Local branch | Existing lint warnings remain |
| Unit tests | PASS | 24 files, 179 tests passed, including cloud projection and proxy regressions | Local branch | None |
| Performance | PASS | 10k/50k/100k message benchmarks: 149ms / 621ms / 1,146ms, below the unchanged 30s budget | Local host, isolated rerun | None |
| Production build | PASS | Next.js 16.3.8 optimized build completed and generated 71 pages; proxy appears in build output | Local branch | None |
| Playwright | PASS | 49/49 Chromium end-to-end tests passed against `next start` production build | Local branch | Hosted Preview still pending |
| Client secret scan | PASS | Tracked-file credential scan and `.next/static` server-only identifier scan passed | Local branch | None |
| Public routes | PASS | All 19 public routes returned 200 on Production and on the exact-head Preview, including `/create?demo=1` and legacy aliases | Preview candidate SHA `67b8777`; Production SHA `067c3d6` | Preview interactive checks beyond CI E2E remain limited |
| Protected routes | PASS | All 16 protected route paths redirected to login on the exact-head Preview; Production verifier also passed | Preview candidate SHA `67b8777`; Production SHA `067c3d6` | Controlled authenticated role tests pending |
| Production browser baseline | PASS | Canonical `/create?demo=1` produced a story at 1440px and 390px, no horizontal overflow, one chapter preview, and no page errors | Production SHA `067c3d6` | This verifies current deployed main only; certification branch needs its exact-head Preview |
| Production version | PASS | `GET /api/version` returned expected exact SHA and `environment=production` | Production | None for current deployed SHA |
| Local import/story/exports | PASS | Production browser tests cover WhatsApp/Telegram fixtures, demo story modes, share boundaries, local lore, and exports | Local branch | User-provided data has not been used in tests |
| Authentication | BLOCKED | Unauthenticated stories/PetLife API returned 401; production Supabase integration flags are set | Production | Successful controlled registration/login/refresh/logout not exercised |
| Supabase project | FAIL/UNKNOWN | Dedicated project ref in task is `pkmkynhkgitdslhadupj`; direct project host did not resolve during check; production auth boundary returned 401 unauthenticated | Target project | Restore/verify active state through Supabase provider |
| Migrations/RLS/storage | UNVERIFIED | Source migrations include RLS and private bucket policies; no remote migration history or advisor access | Local files only | Compare/apply migrations, advisors, owner/member/unrelated-user/storage tests |
| Stories/worlds/PetLife cloud | UNVERIFIED | Routes and RLS source exist; unauthorized API requests are denied | Production/local source | Controlled successful save/list/open/delete/world/member/media flows |
| Stripe TEST/webhook/entitlements | PARTIAL | Exact-head Preview reports checkout/webhook configured; the Preview smoke created a real TEST Checkout Session | Preview candidate SHA `67b8777` | Complete a test payment; verify signed webhook, entitlement, and idempotency |
| Stripe LIVE | BLOCKED | Production status flags report live checkout/webhook false | Production SHA `067c3d6` | Configure/verify live Checkout and webhook without charge |
| OpenAI | BLOCKED | Production reports `enabled=false`; official model page confirms `gpt-5.6-luna` supports Responses API; request keeps `store:false` | Local source / production config | Server key and bounded real request unavailable |
| Telemetry | FAIL | POST allowlisted `analysis_started` returned HTTP 502 `fetch failed`; status endpoint reports configured Supabase sink | Production SHA `067c3d6` | Restore dedicated Supabase, confirm `delivered=true` and database row |
| Privacy | SOURCE TESTS PASS; REMOTE AUDIT PENDING | Cloud result projects anonymous labels, metrics, and empty vocabulary; AI validator and telemetry allowlist tests cover leakage guards | Local branch | Browser/network and provider logs with real request paths pending |
| Dependencies | PASS | Patched Next.js 16.3.8 and Vitest 4.1.11; final `npm audit` reports 0 vulnerabilities | Local branch | None identified by npm audit |
| Vercel Preview | PASS | GitHub deployment `6792599848` succeeded; Vercel check says “Deployment has completed”; preview `/api/version` returns exact candidate SHA and `environment=preview` | [Preview URL](https://threadtales-qe47xnaik-rrahul0904-5013s-projects.vercel.app) · deployment `EhPTsgYda9AwPR4sBEzAWdbCeEYz` | Vercel dashboard/build-log and environment-name inspection remain unavailable; CLI token/context absent |
| Production runtime errors | UNVERIFIED | No Vercel runtime-log access | Existing production | Inspect Vercel logs after provider access |
| Documentation | UPDATED | Certification matrix, integration limitations, and hosted-deploy owner action reconciled with current evidence | Local branch | Push reviewed docs with implementation |

`verify:production` now follows same-origin redirects for public aliases, checks all expected public/protected paths, enforces the expected SHA when provided, records integration status truthfully, and exits nonzero if an enabled telemetry smoke fails. A public-route pass is not an end-to-end integration certification.

BLOCKED ACTION | WHY | EXACT OWNER ACTION REQUIRED | WHAT IS ALREADY VERIFIED | HOW TO RESUME

| ACTION | WHY | EXACT OWNER ACTION REQUIRED | WHAT IS ALREADY VERIFIED | HOW TO RESUME |
| --- | --- | --- | --- | --- |
| Inspect Vercel account settings/build logs | The Vercel dashboard redirects to login; no Vercel CLI, token, or local project context is available | Sign in to the existing Vercel project `threadtales` (`prj_nkUfVeRw1fEQaROoAOOi4SI6GwVh`) to inspect its configured production branch, environment variable names/status, and build/runtime logs. Do not create another project. | GitHub's Vercel check and deployment record show an automatic successful Preview for this repository and exact candidate SHA | Review Preview configuration and logs in Vercel, then continue the provider gates |
| Restore dedicated Supabase | Project ref `pkmkynhkgitdslhadupj` is unreachable by DNS during verification and production telemetry fails to connect | Resume/restore the existing project in Supabase; confirm project ref and health; compare migration history before applying missing migrations | Source migration files and policy review; production returns telemetry 502 rather than falsely reporting delivery | Apply only missing migrations, run advisors and controlled RLS/storage tests, install correct project keys in Preview |
| Configure payment/AI environments | Production reports Stripe and AI disabled; no credential-management access is available | Install correct Stripe TEST/LIVE secrets, price IDs, webhook secrets and signing secrets in matching Vercel environments; install server-side OpenAI project key | Checkout/webhook/privacy code paths and synthetic unit coverage; official model supports Responses API | Verify test payment/webhook/entitlement, live checkout without charge, and one bounded AI request |
| Complete Preview UAT/provider gates | Strict Preview verification reports AI disabled and telemetry delivery failure; Stripe payment/webhook and authenticated Supabase/RLS/storage flows are not yet verified | Restore the existing Supabase project, fix and prove telemetry delivery, configure the server-side OpenAI key, then complete Stripe TEST payment/webhook/entitlement and authenticated persistence/media tests in Preview | Exact-SHA GitHub CI and Vercel deployment pass; 19 public/16 protected routes pass; Preview TEST Checkout Session created | Update PR evidence and keep it draft until all mandatory exact-head Preview gates pass |

The exact-head Vercel Preview is deployed and route-verified. No production merge/promotion, live payment, migration, or production configuration change was performed. Full end-to-end certification remains blocked on the Preview provider/UAT gates above.
