# ThreadTales Phase 0 Privacy Architecture

## Scope

This document describes the implemented free ThreadTales / Friendship Wrapped flow on the `production-phase-0` branch. It is intentionally limited to what the code currently does. It does not describe future account, payment, AI, persistence, or import-provider features.

## Implemented data flow

```text
local WhatsApp .txt file
  -> browser File API (`File.text()`)
  -> ephemeral raw string in browser memory
  -> `parseChat()`
  -> in-memory `ChatMessage[]`
  -> `analyzeChat()`
  -> derived `ChatStats`
  -> ThreadTales story UI
  -> optional `createSnapshot()`
  -> derived JSON snapshot
  -> base64url encoding
  -> `/share#<derived-payload>`
  -> recipient browser decodes the fragment locally
```

The raw imported chat is used only to produce in-memory parsed messages and derived statistics. The React application does not persist the raw text in component state, local storage, session storage, cookies, a database, or a server request.

## What stays on the device

During the free flow, the following remains in the user's browser process:

- the selected local `.txt` file;
- the raw file text returned by `File.text()`;
- parsed message bodies in the temporary `ChatMessage[]` used by the analyzer;
- participant names before the user chooses whether to include them in a public share snapshot;
- top words before the user chooses whether to include them in a public share snapshot.

The raw text is held in local JavaScript memory only while the import/analyze operation is executing. The application does not intentionally retain the raw string after analysis. Selecting another file or resetting the result replaces/clears application analysis state and resets the file input. Browser/runtime memory reclamation itself is controlled by the browser.

## What can leave the device in the free flow

Ordinary application assets and page requests are served by Vercel, but the application does not attach imported chat content to those requests.

The one user-controlled outbound artifact is the optional share URL. It contains a **derived** snapshot in the URL fragment (`#...`). URL fragments are handled by the browser and are not part of the HTTP request sent to the `/share` server route. The `/share` client code reads and decodes the fragment after the page loads.

The derived snapshot can contain:

- total messages and words;
- date range and active-day statistics;
- streak/silence/reply metrics;
- busiest day, peak hour, weekday and daypart aggregates;
- question/laughter/heart counts;
- participant message percentages and other derived participant aggregates;
- yearly counts;
- deterministic vibe values;
- selected story mode.

By default participant names are replaced with `Person 1`, `Person 2`, etc. Top words are omitted by default. Names and top words are included only when the user explicitly enables the corresponding share options.

## What is not transmitted or persisted

A Phase 0 source-tree audit found no application path that sends or persists raw imported chat content through:

- `fetch()` or other application API calls;
- Next.js API route handlers;
- Server Actions (`"use server"`);
- `localStorage`;
- `sessionStorage`;
- application cookies;
- `console.log` logging;
- an analytics SDK;
- a database or object store;
- an AI/model API;
- a query-string parameter containing raw messages.

There is no database, authentication provider, payment provider, AI SDK, queue, Redis instance, or raw-file storage service required by the Phase 0 free flow.

## Share payload privacy boundary

`src/lib/share.ts` creates a separate `PublicSnapshot` rather than serializing `ChatMessage[]` or `ChatStats` wholesale. Unit tests verify that a known secret message sentence is absent from the public snapshot and that default snapshots also exclude participant names and top words.

The public payload is **base64url encoded, not encrypted**. Anyone who receives the complete share URL can decode the derived snapshot. Users should therefore treat a public share link as public information and should enable names or top words only when they are comfortable sharing them.

The complete link matters because ThreadTales Phase 0 does not keep a server-side copy of the share payload.

## Clipboard and native sharing

The share UI can copy the derived share URL to the clipboard or pass that URL to the browser's Web Share API. Those mechanisms receive the derived URL only, not the raw chat text.

## Error and retry behavior

Unsupported file types, files over the configured 15 MB limit, empty files, unreadable files, and exports with fewer than five parseable messages produce recoverable UI errors. A failed new import clears prior result state so the application does not display a stale successful analysis.

The file input is reset after each import attempt so the same file can be selected again. The user can also choose `Analyze another chat` to clear the current derived result.

## Verification

Automated privacy checks live in:

- `tests/unit/share.test.ts` — validates the public share schema and raw-text exclusion;
- `tests/e2e/threadtales.spec.ts` — validates the anonymous derived-share flow in Chromium;
- parser and import-validation tests — ensure malformed input remains a recoverable local failure.

The Phase 0 CI pipeline runs lint, strict TypeScript checking, unit tests, the production build, and Playwright browser smoke tests from a clean checkout.

## Current limitations

This architecture reduces exposure but is not a claim that the user's device is a trusted execution environment. Browser extensions, compromised devices, developer tools, or future third-party scripts could change the threat model.

Other deliberate Phase 0 limitations:

- parsing/analysis is synchronous on the main thread; Web Worker migration is Phase 1;
- only the current WhatsApp text formats are supported;
- ambiguous dates are US-first in `auto` mode and can be overridden with the explicit MM/DD or DD/MM selector;
- the 15 MB file guard protects the current main-thread implementation but is not a claim of universal device capacity;
- the share hash can become longer as derived data grows;
- no server-side revocation exists for a copied share URL because no server-side share record exists;
- no telemetry has been added in Phase 0.

Any later feature that sends raw or selected message content off-device must be separately disclosed, explicitly opted into, minimized, and documented. It must not silently weaken this default free-flow boundary.
