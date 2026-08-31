# ThreadTales Phase 1 Performance Baseline

## Purpose

Phase 1 moves parsing and analytics from the browser main thread into a dedicated Web Worker. This document records measured CPU baselines and browser journey coverage. It is not a promise that every phone or browser will match CI timings.

## GitHub Actions baseline

Environment for the final code-complete measurement:

- Ubuntu 24.04 GitHub-hosted runner
- Node.js 24.19.0
- Vitest 3.2.7
- deterministic synthetic WhatsApp histories
- four participants
- parse and analyze measured separately with `performance.now()`

Measured run for commit `465fa6e7db1059e93f452693107841527bff1e83`:

| Messages | Parse | Analyze | Parse + analyze |
| ---: | ---: | ---: | ---: |
| 10,000 | 47.6 ms | 42.1 ms | 89.6 ms |
| 50,000 | 115.0 ms | 124.3 ms | 239.3 ms |
| 100,000 | 214.8 ms | 232.5 ms | 447.2 ms |

The numbers above exclude file reading, Worker startup/bundling overhead, browser scheduling, rendering, and device-specific costs. They are useful for regression tracking, not for guaranteeing wall-clock latency to users.

## Browser responsiveness validation

Playwright Chromium covers:

- a 30,000-message generated upload completing through the Worker;
- visible processing state while that analysis is running;
- a 75,000-message analysis being superseded by a newer upload;
- cancellation/reset of a 75,000-message analysis followed by successful reuse.

The important Phase 1 property is that parsing/analytics execute in a Worker rather than on the page main thread. The browser can therefore continue handling UI input while the Worker is busy.

## File-size policy

The Phase 0 15 MB file guard remains unchanged.

Phase 1 improves responsiveness, but it does not implement a streaming parser or make browser memory unlimited. A large import can still involve:

1. the browser-owned `File`;
2. an `ArrayBuffer` while the file is read;
3. a transferred buffer owned by the Worker;
4. decoded normalized text in the Worker;
5. parsed `ChatMessage[]` in the Worker;
6. maps/arrays required for derived analytics.

For real file uploads, `File.arrayBuffer()` is transferred to the Worker using the structured-clone transfer list. This avoids cloning that buffer into a second main-thread copy. Only the derived `ThreadTaleResultV2` is posted back to the page.

## Analyzer improvements

Phase 1 reduces avoidable work without introducing a streaming architecture:

- chronological parser output no longer gets copied/sorted again unless an ordering violation is detected;
- streak and silence calculations reuse the active-day set instead of creating complete timestamp arrays;
- busiest-day selection is a linear map scan rather than sorting every day entry;
- real uploads no longer decode the complete raw text on the main UI thread.

## Current tested ceiling

Automated CPU baselines cover 100,000 generated messages. Browser journeys cover 75,000 generated messages for supersession/cancellation and 30,000 for completion/status behavior.

The application still enforces the 15 MB input limit. ThreadTales does **not** claim universal 100k-message support on all devices; memory capacity, browser implementation, and message length vary substantially.

A future streaming/chunked parser should be considered only if real-user exports show that the 15 MB limit is materially constraining the product.
