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

The Phase 0 parser/analyzer was deterministic and tested, but a complete large export was decoded, parsed, sorted/analyzed and tokenized on the browser main thread. `UploadAnalyzer` yielded once with `setTimeout(0)` so the busy state could paint, but the subsequent CPU work could still block interaction.

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

CPU baselines are recorded in `docs/PERFORMANCE_BASELINE.md`.

The 15 MB file guard remains intentionally unchanged. Web Worker migration fixes main-thread responsiveness; it does not remove all browser-memory constraints.

## Automated validation

Phase 1 extends the Phase 0 suite with tests for:

- date detection and explicit override;
- V2 determinism/serialization/raw-text exclusion;
- V2-to-legacy adapter parity;
- worker stages and structured errors;
- worker client cancellation/stale response behavior;
- worker source privacy boundary;
- 10,000-message unit analysis;
- 10k/50k/100k performance baselines;
- parser edge cases;
- worker-backed demo/upload/error paths;
- large-history processing status;
- superseding in-flight work;
- reset/cancel/reuse;
- auto DMY through the browser Worker.

## Privacy

Real uploaded files use a transferable `ArrayBuffer`. The browser moves buffer ownership to the Worker instead of cloning the file data into a second main-thread copy. The Worker decodes/parses/analyzes locally and returns only the derived V2 result.

The Worker execution path has no `fetch`, `XMLHttpRequest`, `sendBeacon` or WebSocket transport. Raw chat content is not sent to a server, persisted, logged, placed into browser storage, or added to the share schema.

PublicSnapshot remains V1 because Phase 1 does not require changing its public fields. Names and top words remain opt-in.

See `docs/PRIVACY_ARCHITECTURE.md`.

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
- no server persistence exists.

## Deployment state

Production is intentionally not changed by Phase 1. A Vercel preview must be verified against the existing `threadtales` project before this status is considered final.
