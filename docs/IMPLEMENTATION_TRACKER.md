# ThreadTales implementation tracker

**Last reconciled:** 2026-10-13 22:10 EDT.  
**Canonical production SHA:** `8859495cd9062eb2a6a842c80a75639453d61026`.

Statuses are deliberately distinct: `RESEARCHED`, `SPECIFIED`, `IMPLEMENTING`, `IMPLEMENTED`, `VERIFIED`, `DEPLOYED`, `CERTIFIED`.

| ID | Feature | Phase | Priority | Status | Owner/worker | Source evidence | Implementation / tests | Deployment / receipt | Blocker / next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TT-001 | Source-first ThreadTales create journey | 2/4/5/6/10/11 | P0 | DEPLOYED; human UAT pending | Core team + independent UAT | Main `8859495`; `docs/uat/SOURCE_FIRST_FIRST_SESSION_UAT.md` | Worker/parser/story/share E2E; main CI `38119383860` pass | Production deployment `6992138130`; `/api/version`=`8859495` | Run five first-time user sessions; verify real phone share on exact release. |
| TT-002 | MemorySpace setup and local manifest | 1/3 | P0 | IMPLEMENTING | PR #25 | PR #25 head `f76176e` | `src/lib/memory-space.ts`, `memory-platform.ts`; unit/E2E in PR | PR Preview `7029009666`; not in production | Branch lineage stale relative to main; assess/rebase after handoff fix. |
| TT-003 | Conversation-to-candidate intake via `/create?memorySpaceId=` | 3/4 | P0 | IMPLEMENTED locally; hosted verification pending | PR #25 + this implementation | CI `38339878303` reproduced the route mismatch | `/create` now selects candidate intake only for a valid `memorySpaceId`; default route remains source-first. Focused Memory Keeper flow passes locally; regression asserts both routes. | Existing Preview still points to old SHA; no new Preview yet | Push normal update to PR #25, then require merge-ref CI and Preview checks before calling this verified. |
| TT-004 | Keep/Skip and approved MemoryGraph | 3 | P0 | IMPLEMENTING | PR #25/#26 | Candidate and graph contracts on stacked heads | Unit tests exist; full conversation E2E fails at route boundary | Not deployed | Verify approval boundary, graph schema, raw-text exclusion, cross-space rejection, and reload. |
| TT-005 | Intent-specific deterministic story plan | 5 | P1 | IMPLEMENTING | PR #27 | Head `16f7120` | `src/lib/memory-story.ts` and tests | Stacked Preview CI pass only | Re-run against current main after repairing/settling parent chain; evaluate distinct narratives. |
| TT-006 | Local Memory Studio/media references | 6 | P1 | IMPLEMENTING | PR #28 | Head `58e4454` | Studio/UI tests on stacked branch | Stacked Preview CI pass only | Verify bytes remain local, browser support, export/share, and storage truth. |
| TT-007 | Human product UAT | 10 | P0 | SPECIFIED | Independent UAT lead | Source-first UAT checklist | No result artifact | Not applicable | Schedule five first-time users and exact-head owner review; no completion claim before pass. |
| TT-008 | Stripe checkout, signed webhook, entitlement | 8 | P1 | IMPLEMENTED_NOT_VERIFIED | Payments owner | Existing billing routes; production flags false | Test/mocked coverage only; no current provider test | Production monetization unverified | Obtain TEST account access; create no live charge; verify replay, failure, refund/revoke behavior. |
| TT-009 | Supabase cloud persistence/security | 7/9 | P1 | IMPLEMENTED_NOT_VERIFIED | Persistence/security owner | Migrations and route code | Remote integration tests unavailable | Production health/RLS unknown | Restore DNS/account access; inspect remote history before applying changes; test ownership/deletion. |
| TT-010 | Content-blind production telemetry | 12 | P1 | IMPLEMENTED_NOT_VERIFIED | Operations owner | `/api/telemetry`, integration status | Delivery not verified | Production flags report Supabase sink | Prove allowlisted event delivery and diagnose route/provider failures without content. |
| TT-011 | Exact-SHA release certification | 11/13 | P0 | DEPLOYED_NOT_CERTIFIED | Release manager + independent verifier | `CURRENT_TRUTH.md` evidence TT-P0-001–009 | Main CI green; UAT and provider gates remain | Prod currently `8859495` | Refresh exact-SHA receipt after next merge/deploy; close product/provider gates individually. |

## Active execution order

1. Push the TT-003 route fix to PR #25 and verify it on exact-head CI and Preview.
2. Run the full Chromium suite, then WebKit/iPhone gate on the updated candidate; repair any failures at the correct layer.
3. Resolve PR #25 lineage/review issues and handle PR #26's dirty stacked base; do not treat downstream checks as independent proof.
4. Review graph runtime validation and export/delete behavior before marking TT-002/004 verified.
5. Run product UAT in parallel with the next code slice when human participants and devices are available.
6. Reconcile dated release records to canonical production `8859495` without rewriting historical provider evidence.

## Local verification receipt — 2026-10-13

- Candidate base/head: PR #25 current head `f76176e` plus uncommitted local route fix; no implementation SHA exists until commit.
- Passed: lint (0 errors; 17 existing warnings), typecheck, 186 unit tests, focused Memory Keeper browser flow, and six WebKit/iPhone source-first E2E tests.
- Production build passed before the final documentation/test-only edits.
- Pending: exact-head GitHub merge-ref CI, updated Preview, independent review, and full Chromium regression on the integrated branch.
- No production deploy, provider write, or payment was performed.
