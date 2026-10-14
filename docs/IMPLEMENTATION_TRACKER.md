# ThreadTales implementation tracker

**Last reconciled:** 2026-10-13 22:23 EDT.
**Canonical production SHA:** `8859495cd9062eb2a6a842c80a75639453d61026`.

Statuses are deliberately distinct: `RESEARCHED`, `SPECIFIED`, `IMPLEMENTING`, `IMPLEMENTED`, `VERIFIED`, `DEPLOYED`, `CERTIFIED`.

| ID | Feature | Phase | Priority | Status | Owner/worker | Source evidence | Implementation / tests | Deployment / receipt | Blocker / next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TT-001 | Source-first ThreadTales create journey | 2/4/5/6/10/11 | P0 | DEPLOYED; human UAT pending | Core team + independent UAT | Main `8859495`; `docs/uat/SOURCE_FIRST_FIRST_SESSION_UAT.md` | Worker/parser/story/share E2E; main CI `38119383860` pass | Production deployment `6992138130`; `/api/version`=`8859495` | Run five first-time user sessions; verify real phone share on exact release. |
| TT-002 | MemorySpace setup and local manifest | 1/3 | P0 | IMPLEMENTING | PR #25 | PR #25 head `f76176e` | `src/lib/memory-space.ts`, `memory-platform.ts`; unit/E2E in PR | PR Preview `7029009666`; not in production | Branch lineage stale relative to main; assess/rebase after handoff fix. |
| TT-003 | Conversation-to-candidate intake via `/create?memorySpaceId=` | 3/4 | P0 | IMPLEMENTED + locally VERIFIED; hosted verification pending | PR #25 + this implementation | CI `38339878303` exposed the route mismatch; merged candidate `a48aad1` includes current main | `/create` selects candidate intake only for a valid `memorySpaceId`; bare `/create` remains source-first. Both-path regression and full Keep→graph→story Memory Keeper flow pass in Chromium. | No updated Preview yet; baseline Preview `7029009666` is at old SHA | Push integrated head; hosted CI and a fresh Preview must pass before calling this verified for release. |
| TT-004 | Keep/Skip and approved MemoryGraph | 3 | P0 | IMPLEMENTING | PR #25/#26 | Candidate and graph contracts on stacked heads | Unit tests exist; full conversation E2E fails at route boundary | Not deployed | Verify approval boundary, graph schema, raw-text exclusion, cross-space rejection, and reload. |
| TT-005 | Intent-specific deterministic story plan | 5 | P1 | IMPLEMENTING | PR #27 | Head `16f7120` | `src/lib/memory-story.ts` and tests | Stacked Preview CI pass only | Re-run against current main after repairing/settling parent chain; evaluate distinct narratives. |
| TT-006 | Local Memory Studio/media references | 6 | P1 | IMPLEMENTING | PR #28 | Head `58e4454` | Studio/UI tests on stacked branch | Stacked Preview CI pass only | Verify bytes remain local, browser support, export/share, and storage truth. |
| TT-007 | Human product UAT | 10 | P0 | SPECIFIED | Independent UAT lead | Source-first UAT checklist | No result artifact | Not applicable | Schedule five first-time users and exact-head owner review; no completion claim before pass. |
| TT-008 | Stripe checkout, signed webhook, entitlement | 8 | P1 | IMPLEMENTED_NOT_VERIFIED | Payments owner | Existing billing routes; production flags false | Test/mocked coverage only; no current provider test | Production monetization unverified | Obtain TEST account access; create no live charge; verify replay, failure, refund/revoke behavior. |
| TT-009 | Supabase cloud persistence/security | 7/9 | P1 | IMPLEMENTED_NOT_VERIFIED | Persistence/security owner | Migrations and route code | Remote integration tests unavailable | Production health/RLS unknown | Restore DNS/account access; inspect remote history before applying changes; test ownership/deletion. |
| TT-010 | Content-blind production telemetry | 12 | P1 | IMPLEMENTED_NOT_VERIFIED | Operations owner | `/api/telemetry`, integration status | Delivery not verified | Production flags report Supabase sink | Prove allowlisted event delivery and diagnose route/provider failures without content. |
| TT-011 | Exact-SHA release certification | 11/13 | P0 | DEPLOYED_NOT_CERTIFIED | Release manager + independent verifier | `CURRENT_TRUTH.md` evidence TT-P0-001–009 | Main CI green; integrated PR candidate has local checks; UAT and provider gates remain | Prod currently `8859495` | Refresh exact-SHA receipt after merge/deploy; close product/provider gates individually. |
| TT-012 | Delete a local MemorySpace and approved graph | 3 | P0 | IMPLEMENTED locally; hosted verification pending | PR #25 + this implementation | Phase 3 exit requirement; old PR stack had export but no delete control | MemorySpace home asks for explicit confirmation, removes only that manifest/graph/index entry and matching unfinished draft, then returns to creation. Focused regression passes cancel behavior and preserves a second space in Chromium and WebKit/iPhone. | Not deployed; this slice is local only | Run full hosted checks on the updated candidate; review local media cleanup semantics before phase completion. |

## Active execution order

1. Push the delete slice and rerun exact-head hosted CI; candidate `7bda9e5` passed all GitHub checks, including 49 Chromium and 7 WebKit/iPhone tests, before this addition.
2. Obtain a new exact-head Preview after Vercel's reported rate limit lifts; do not use baseline Preview `7029009666` as current proof.
3. Resolve PR #25 independent review and handle PR #26's dirty stacked base; do not treat downstream checks as independent proof.
4. Review graph runtime validation and local media cleanup before marking TT-002/004 or Phase 3 complete.
5. Run product UAT in parallel with the next code slice when human participants and devices are available.
6. Keep provider status and production certification gates open until direct provider evidence is available.

## Integrated verification receipt — 2026-10-13

- Candidate: PR #25 branch integrated with canonical main `8859495`; source SHA `a48aad1d268baad634741dafc886d43a06dcfc28`.
- Passed locally on the integrated tree: lint (0 errors; 17 existing warnings), typecheck, 186 unit tests, 3 performance tests, optimized production build, 49 Chromium browser tests, 7 WebKit/iPhone browser tests, reverse-engineering process gate, credential-like scan, and `git diff --check`.
- The new route regression and full Memory Keeper Keep→graph→story path passed in Chromium.
- Hosted CI run `38499976718` passed on `7bda9e57d8a8ded220b04421a3317b0ba686698e`, including Chromium and WebKit/iPhone. The deletion addition is newer and still needs a new run.
- The deletion update passed the full local static/unit/performance checks and production build; all four Memory Keeper tests pass in Chromium and WebKit/iPhone, and the combined WebKit profile passes 11/11. The full 49-test Chromium suite passed on the immediately preceding candidate; updated full hosted Chromium is pending.
- Vercel check on that head failed: “Deployment rate limited — retry in 24 hours.” No fresh Preview deployment exists.
- Pending: hosted CI for deletion, fresh Preview, independent review, and provider/human UAT gates.
- No production deploy, provider write, or payment was performed.
