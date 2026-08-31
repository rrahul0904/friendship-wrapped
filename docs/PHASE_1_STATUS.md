# ThreadTales Production Phase 1 Status

## Scope

Phase 1 implements the large-history browser engine described by the Phase 1 Codex contract while preserving the Phase 0 privacy and reliability baseline.

Implementation branch: `production-phase-1`

Phase 1 is based directly on verified Phase 0 SHA `724f640ca317c6dd4fcb2e790c5484fa73533600` because Phase 0 PR #2 was still open when Phase 1 began. Phase 0 must merge before this PR is finally rebased/merged to `main`.

No database, authentication, Stripe, AI, server-side chat parsing, raw file upload, object storage, queue, Redis, Docker, new importer, or new consumer product is part of this phase.

## Baseline audit

### Before Phase 1

```text
File.text()
  -> raw string on main UI thread
  -> parseChat()
  -> ChatMessage[]
  -> analyzeChat()
  -> unversioned ChatStats
  -> React story UI
  -> optional PublicSnapshot V1
```

The Phase 0 parser/analyzer was deterministic and tested, but a complete large export was decoded, parsed, sorted/analyzed and tokenized on the browser main thread. `UploadAnalyzer` yielded once so the busy state could paint, but the subsequent CPU work could still block interaction.

The 15 MB guard reduced worst-case exposure but did not eliminate main-thread responsiveness risk.

### Memory/computation risks identified

- `File.text()` created the full decoded raw string on the UI thread;
- parser normalization created a normalized string and split-line array;
- analyzer always copied/sorted the parsed message array even though parser output is normally chronological;
- streak and quiet-period helpers created complete timestamp arrays and additional normalized day arrays;
- busiest-day selection sorted all day-map entries;
- `ChatStats` had no explicit schema version, making future migrations harder to reason about;
- public-share V1 and private analytics needed to remain separate contracts.

## Phase 1 architecture

```text
local WhatsApp .txt
  -> File.arrayBuffer()
  -> transferable ArrayBuffer
  -> browser Web Worker
      -> TextDecoder
      -> date-order detection
      -> parseChatDetailed()
      -> analyzeThreadTale()
      -> ThreadTaleResultV2
  -> main UI thread
  -> temporary V2 -> ChatStats adapter
  -> existing story/share UI
```

The Web Worker is a browser performance boundary, not a cloud boundary.

## ThreadTaleResultV2

Phase 1 introduces an explicit serializable result contract with `schemaVersion: 2`.

It contains:

- source provider, detected format, resolved date order and confidence;
- range and active-day span;
- totals for messages, words, participants, media, questions, laughs, hearts and late-night messages;
- derived participant metrics;
- streak, silence, busiest-day, peak-hour, weekday and daypart activity;
- yearly and monthly activity;
- median reply time and top derived words;
- the existing deterministic presentation vibe values.

It does **not** contain raw message bodies or the full `ChatMessage[]`.

`resultToChatStats()` is a temporary compatibility adapter so the existing `WrappedStory` and PublicSnapshot V1 path can remain stable during this phase. Calculations still have one source of truth: `analyzeChat()` / `analyzeThreadTale()`.

## Worker protocol

Typed request messages:

- `ANALYZE_CHAT` — request ID, text/buffer content, date-order option;
- `CANCEL` — request ID.

Typed responses:

- `PROGRESS` — validating, parsing, analyzing or finalizing;
- `SUCCESS` — `ThreadTaleResultV2`;
- `ERROR` — serialized recoverable error;
- `CANCELLED`.

Each task has a unique request ID. The UI also keeps an operation generation number. A superseded task cannot overwrite a newer result even if a stale message arrives.

Cancellation terminates the Worker immediately and rejects the local task promise with `AbortError`. Completed, failed and cancelled workers are terminated.

## Date-order detection

`auto` now scans valid WhatsApp records for explainable evidence:

- first field > 12 and second field <= 12 -> DMY evidence;
- second field > 12 and first field <= 12 -> MDY evidence;
- evidence from only one order -> high-confidence detection;
- no evidence or conflicting evidence -> ambiguous.

Ambiguous input retains the Phase 0 US-first MDY fallback. The explicit MM/DD or DD/MM selector always overrides detection.

## Parser hardening

Phase 1 adds coverage for:

- UTF-8 BOM;
- CRLF/LF;
- no final newline;
- timestamps containing seconds;
- non-breaking/narrow spaces through existing normalization;
- participant names containing emoji;
- leap-day validation;
- year boundaries;
- empty message bodies;
- multiline text containing time-like content;
- mixed Android/iOS records;
- large generated histories.

Existing impossible-date, invalid-time, Unicode, multiline and malformed-timestamp protections remain in place.

## Large-history behavior

Synthetic generation is deterministic and does not commit massive fixtures. The generator supports configurable message/participant counts and adds questions, emoji, media markers, multiline records and conversation gaps.

The final code-complete CI run executed 11 unit-test files / 46 unit tests, three performance cases, the Next.js 16.3.3 production build, and 12 Chromium journeys successfully.

CPU baselines are recorded in `docs/PERFORMANCE_BASELINE.md`.

The 15 MB file guard remains intentionally unchanged. Web Worker migration fixes main-thread responsiveness; it does not remove all browser-memory constraints.

## Privacy

Real uploaded files use a transferable `ArrayBuffer`. The browser moves buffer ownership to the Worker instead of cloning the file data into a second main-thread copy. The Worker decodes/parses/analyzes locally and returns only the derived V2 result.

The Worker execution path has no `fetch`, `XMLHttpRequest`, `sendBeacon` or WebSocket transport. Raw chat content is not sent to a server, persisted, logged, placed into browser storage, or added to the share schema.

PublicSnapshot remains V1 because Phase 1 does not require changing its public fields. Names and top words remain opt-in.

See `docs/PRIVACY_ARCHITECTURE.md`.

## CI validation

Code-complete commit `465fa6e7db1059e93f452693107841527bff1e83` passed:

```text
npm ci                    PASS
npm run lint              PASS
npm run typecheck         PASS
npm run test              PASS — 46/46
npm run test:performance  PASS — 10k/50k/100k
npm run build             PASS — Next.js 16.3.3
Playwright Chromium       PASS
npm run test:e2e          PASS — 12/12
```

## Vercel deployment audit

Existing Vercel project:

- name: `threadtales`
- project ID: `prj_nkUfVeRw1fEQaROoAOOi4SI6GwVh`
- team ID: `team_zmEezpOKGZy2sH5nqTfO44LD`
- production deployment: `dpl_H8hYU4P6jQUeANKF6H8ZdXThNVQn`
- production state: `READY`
- production alias: `threadtales-five.vercel.app`

Deployment listing still contains only the original production deployment. No `production-phase-1` preview was created automatically, which confirms the existing Vercel project is not currently producing Git-based preview deployments for this repository.

The connected Vercel surface available during this implementation exposes project/deployment inspection but no project Git-repository linking mutation. Creating a second project, inventing credentials, or replacing the existing production deployment would violate the Phase 1 deployment boundary, so none of those were done.

A production runtime-log check for the previous 24 hours found no error/fatal entries. That check applies to the existing production deployment, not to Phase 1, which has not been deployed.

Therefore:

- Phase 1 preview URL: **not available**;
- Phase 1 deployment ID: **not available**;
- Phase 1 Vercel runtime errors: **not measurable because no preview exists**;
- production changed: **NO**.

The missing preview is an external Git-integration limitation, not a claim that Phase 1 is deployed. After repository/Vercel Git integration is enabled, the exact Phase 1 commit should receive a preview before production promotion.

## Known limitations

- 15 MB file guard remains;
- no streaming/chunked parser;
- CPU performance is device-dependent;
- E2E coverage is Chromium-focused;
- tokenization/stop words are primarily English-oriented;
- WhatsApp remains the only implemented import provider;
- ambiguous all-<=12 dates remain US-first unless the user overrides the selector;
- public share fragments remain base64url-encoded, not encrypted or revocable;
- the story UI still consumes a temporary `ChatStats` compatibility adapter;
- no server persistence exists;
- Phase 1 has no Vercel preview until Git integration is enabled.

## Merge readiness

The Phase 1 code is green and internally merge-ready, but PR #5 should **not** be merged into the old `main` before Phase 0 PR #2 lands. Phase 1 intentionally includes the verified Phase 0 head as its base dependency. After #2 merges, rebase/update PR #5 onto the new `main` and rerun the same CI gate; then a Vercel preview should be produced once Git integration is enabled.
