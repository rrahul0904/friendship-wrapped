# ThreadTales Production Phase 1 Status

## Scope

Production Phase 1 implements the large-history browser engine while preserving the Phase 0 privacy and reliability baseline.

Implementation branch: `production-phase-1`

Phase 0 is now landed on `main` at `724f640ca317c6dd4fcb2e790c5484fa73533600`. Phase 1 was created from that exact SHA, so the branch is already correctly based on the current `main`; no history rewrite or code rebase is required.

No database, authentication, Stripe, AI, server-side chat parsing, raw file upload, object storage, queue, Redis, Docker, new importer, or new consumer product is part of this phase.

## Baseline audit

Before Phase 1:

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

The Phase 0 parser/analyzer was deterministic and tested, but a complete large export was decoded, parsed and analyzed on the browser main thread. The 15 MB guard reduced worst-case exposure but did not eliminate responsiveness risk.

Identified costs included full decoded text on the UI thread, redundant sorting/copying, additional timestamp/day arrays for streak calculations, sorting all day-map entries for busiest-day selection, and an unversioned private analytics result.

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

Phase 1 introduces an explicit serializable private result contract with `schemaVersion: 2` containing source/detection metadata, date range, totals, participant metrics, streak/silence/busiest-day/peak-hour/daypart activity, yearly and monthly activity, reply metrics, top derived words and deterministic presentation values.

It does **not** contain raw message bodies or the full `ChatMessage[]`.

`resultToChatStats()` is a temporary compatibility adapter so the existing `WrappedStory` and PublicSnapshot V1 path remain stable. Calculations still have one source of truth.

## Worker protocol and lifecycle

Typed request messages:

- `ANALYZE_CHAT`
- `CANCEL`

Typed responses:

- `PROGRESS`
- `SUCCESS`
- `ERROR`
- `CANCELLED`

Progress stages are validating, parsing, analyzing and finalizing.

Each task has a unique request ID and the UI also tracks an operation generation number. Superseded work cannot overwrite a newer result. Cancellation terminates the Worker and rejects the local task promise with `AbortError`. Completed, failed and cancelled workers are terminated.

## Date-order detection

`auto` scans valid WhatsApp records for explainable evidence:

- first field > 12 and second field <= 12 -> DMY evidence;
- second field > 12 and first field <= 12 -> MDY evidence;
- evidence from only one order -> high-confidence detection;
- no evidence or conflicting evidence -> ambiguous.

Ambiguous input retains the Phase 0 US-first MDY fallback. Explicit MM/DD or DD/MM selection always overrides detection.

## Parser hardening

Phase 1 adds coverage for UTF-8 BOM, CRLF/LF, no final newline, timestamps with seconds, Unicode spacing, participant names containing emoji, leap-day validation, year boundaries, empty message bodies, multiline text, mixed Android/iOS records and large generated histories. Existing impossible-date, invalid-time, Unicode, multiline and malformed-timestamp protections remain.

## Large-history behavior and memory strategy

Synthetic generation is deterministic and does not commit massive fixtures.

Real uploads use `File.arrayBuffer()` and transfer ownership to the Worker rather than creating a second cloned file buffer on the UI thread. Raw text is decoded only inside the Worker for real uploads. Chronological parser output avoids a redundant sort/copy unless disorder is detected; active-day state is reused for streak/silence calculations; busiest-day selection is linear; only derived Result V2 returns to the main page.

The 15 MB file guard remains intentionally unchanged. Worker migration improves responsiveness but does not remove browser-memory limits.

## Privacy

The Worker execution path has no `fetch`, `XMLHttpRequest`, `sendBeacon` or WebSocket transport. Raw chat content is not sent to a server, persisted, logged, placed in browser storage, or added to the public share schema.

PublicSnapshot remains V1 and separate from the private Result V2 contract. Names and top words remain opt-in. Base64url is encoding, not encryption.

See `docs/PRIVACY_ARCHITECTURE.md`.

## Verified test and performance baseline

The code-complete Phase 1 head before this status-only update passed:

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

Measured GitHub Actions CPU baseline, Node 24.19.0, deterministic 4-person synthetic history:

| Messages | Parse | Analyze | Total |
| ---: | ---: | ---: | ---: |
| 10,000 | 47.6 ms | 42.1 ms | 89.6 ms |
| 50,000 | 115.0 ms | 124.3 ms | 239.3 ms |
| 100,000 | 214.8 ms | 232.5 ms | 447.2 ms |

These are CPU regression baselines, not browser/device latency promises.

Browser coverage includes the Phase 0 journeys plus worker-backed demo/upload, real processing status, 30k-message completion, 75k supersession, 75k cancellation/reset/reuse, and auto DMY detection through the Worker pipeline.

This documentation update intentionally creates a new Phase 1 head so the same full CI gate can run again against the actual post-Phase-0 `main`.

## Vercel deployment audit

Existing Vercel project:

- name: `threadtales`
- project ID: `prj_nkUfVeRw1fEQaROoAOOi4SI6GwVh`
- team ID: `team_zmEezpOKGZy2sH5nqTfO44LD`
- current production deployment: `dpl_H8hYU4P6jQUeANKF6H8ZdXThNVQn`
- current production state: `READY`
- production alias: `threadtales-five.vercel.app`

At the last audit, Vercel still listed only the original production deployment. No Phase 1 preview had been created automatically. Production was not changed.

The next deployment step is to connect the existing `threadtales` Vercel project to `rrahul0904/friendship-wrapped` with `main` as the production branch, then obtain and verify a preview for `production-phase-1`. A second Vercel project must not be created for this purpose.

## Known limitations

- 15 MB file guard remains;
- no streaming/chunked parser;
- CPU performance is device-dependent;
- E2E coverage is Chromium-focused;
- tokenization/stop words are primarily English-oriented;
- WhatsApp remains the only implemented import provider;
- ambiguous all-<=12 dates remain US-first unless explicitly overridden;
- public share fragments are base64url-encoded, not encrypted or revocable;
- the story UI still consumes a temporary `ChatStats` compatibility adapter;
- no server persistence exists;
- Phase 1 still requires a Vercel preview before production promotion.

## Merge readiness

Phase 0 dependency: **RESOLVED**.

`production-phase-1` is based on the exact Phase 0 SHA now on `main`, so it is expected to be ahead-only with no rebase required. Merge readiness now depends on two remaining gates:

1. the new Phase 1 head must pass the complete CI suite against current `main`;
2. the exact Phase 1 head must receive and pass verification on a Vercel preview of the existing `threadtales` project.

Phase 2 remains intentionally unstarted.
