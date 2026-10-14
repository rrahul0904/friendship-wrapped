# ThreadTales implementation tracker

**Last reconciled:** 2026-10-13 22:49 EDT.
**Canonical production SHA:** `8859495cd9062eb2a6a842c80a75639453d61026`.

Statuses are deliberately distinct: `RESEARCHED`, `SPECIFIED`, `IMPLEMENTING`, `IMPLEMENTED`, `VERIFIED`, `DEPLOYED`, `CERTIFIED`.

| ID | Feature | Phase | Priority | Status | Owner/worker | Source evidence | Implementation / tests | Deployment / receipt | Blocker / next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TT-001 | Source-first ThreadTales create journey | 2/4/5/6/10/11 | P0 | DEPLOYED; human UAT pending | Core team + independent UAT | Main `8859495`; `docs/uat/SOURCE_FIRST_FIRST_SESSION_UAT.md` | Worker/parser/story/share E2E; main CI `38119383860` pass | Production deployment `6992138130`; `/api/version`=`8859495` | Run five first-time user sessions; verify real phone share on exact release. |
| TT-002 | MemorySpace setup and local manifest | 1/3 | P0 | IMPLEMENTING | PR #25 | Integrated PR #25 candidate | `memory-platform.ts` rejects malformed enum/date/oversized manifests; exact ID is required before local intake/review; manifest unit tests pass | No fresh Preview; not in production | Run hosted CI; review malformed storage and deletion semantics. |
| TT-003 | Conversation-to-candidate intake via `/create?memorySpaceId=` | 3/4 | P0 | LOCALLY VERIFIED; latest hosted CI pending | PR #25 + this implementation | CI `38501788837` passed on previous head `abe1268`; current code follow-up is `3be1f81` | `/create` selects candidate intake only for an exact valid local manifest; bare `/create` remains source-first. Current production build plus Chromium 4/4 and WebKit/iPhone 11/11 pass; privacy canaries and telemetry allowlist assertions pass. | No updated Preview; Vercel rate-limits fresh deployment | Verify latest exact head in hosted CI and fresh Preview before release verification. |
| TT-004 | Keep/Skip and approved MemoryGraph | 3 | P0 | IMPLEMENTING | PR #25/#26 | Candidate and graph contracts on stacked heads | Runtime graph validator rejects malformed node/schema data; corrupted graph bytes remain available for recovery, writers are blocked until explicit replacement, and recovery flow passes unit/browser tests locally | Not deployed | Run hosted CI for `3be1f81`; retain approval boundary, raw-text exclusion, cross-space rejection, and reload checks. |
| TT-005 | Intent-specific deterministic story plan | 5 | P1 | IMPLEMENTING | PR #27 | Head `16f7120` | `src/lib/memory-story.ts` and tests | Stacked Preview CI pass only | Re-run against current main after repairing/settling parent chain; evaluate distinct narratives. |
| TT-006 | Local Memory Studio/media references | 6 | P1 | IMPLEMENTING | PR #28 | Head `58e4454` | Studio/UI tests on stacked branch | Stacked Preview CI pass only | Verify bytes remain local, browser support, export/share, and storage truth. |
| TT-007 | Human product UAT | 10 | P0 | SPECIFIED | Independent UAT lead | Source-first UAT checklist | No result artifact | Not applicable | Schedule five first-time users and exact-head owner review; no completion claim before pass. |
| TT-008 | Stripe checkout, signed webhook, entitlement | 8 | P1 | IMPLEMENTED_NOT_VERIFIED | Payments owner | Existing billing routes; production flags false | Test/mocked coverage only; no current provider test | Production monetization unverified | Obtain TEST account access; create no live charge; verify replay, failure, refund/revoke behavior. |
| TT-009 | Supabase cloud persistence/security | 7/9 | P1 | IMPLEMENTED_NOT_VERIFIED | Persistence/security owner | Migrations and route code | Remote integration tests unavailable | Production health/RLS unknown | Restore DNS/account access; inspect remote history before applying changes; test ownership/deletion. |
| TT-010 | Content-blind production telemetry | 12 | P1 | IMPLEMENTED_NOT_VERIFIED | Operations owner | `/api/telemetry`, integration status | Delivery not verified | Production flags report Supabase sink | Prove allowlisted event delivery and diagnose route/provider failures without content. |
| TT-011 | Exact-SHA release certification | 11/13 | P0 | DEPLOYED_NOT_CERTIFIED | Release manager + independent verifier | `CURRENT_TRUTH.md` evidence TT-P0-001–009 | Main CI green; integrated PR candidate has local checks; UAT and provider gates remain | Prod currently `8859495` | Refresh exact-SHA receipt after merge/deploy; close product/provider gates individually. |
| TT-012 | Delete a local MemorySpace and approved graph | 3 | P0 | IMPLEMENTED locally; hosted verification pending | PR #25 + this implementation | Phase 3 exit requirement; old PR stack had export but no delete control | Explicit confirmation removes only that manifest/graph/index entry and matching unfinished draft. PetLife mirror deletion explains its original timeline remains. Chromium and WebKit/iPhone pass delete isolation/cancel and current stale-ID tests. | Candidate `3be1f81`; not deployed | Verify exact-head hosted CI; review local media cleanup semantics before phase completion. |

## Active execution order

1. Push the locally verified manifest/graph guards and privacy regressions, then verify exact-head hosted CI; `7bda9e5` passed all checks before deletion and these follow-up changes.
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
- Deletion candidate `c1aa410a0a341634aad20cfeec12800b3aa379b0` passed hosted CI run `38500655942`; Vercel check failed with “Deployment rate limited — retry in 24 hours.” No fresh Preview deployment exists.
- Current implementation commit: `3be1f81d4dc3605935b1491854e37f3730383121` (recovery-preserving graph validation and lens identity guard). It is newer than hosted CI run `38501788837`, which passed PR head `abe12686ee377659f12ae56d226824626ae19796` before this follow-up.
- Implementation now adds strict manifest/graph validation, exact manifest-ID guards, preserves unreadable graph bytes for a user-directed recovery download, and blocks writes until explicit replacement. Local verification passed: lint (0 errors, 17 existing warnings), typecheck, 188 unit tests, 3 performance tests, optimized production build, 4 Chromium Memory Keeper tests, 11 WebKit/iPhone Memory Keeper + source-first tests, and `git diff --check`.
- Independent review of `fa1cb73` surfaced two P2 issues (lens ID mismatch and destructive malformed-graph recovery); both are fixed in `3be1f81`, and a second read-only review is pending. Hosted CI and fresh Preview for `3be1f81` are pending. Vercel reports its 24-hour deployment rate limit; no current Preview exists.
- No production deploy, provider write, or payment was performed.
