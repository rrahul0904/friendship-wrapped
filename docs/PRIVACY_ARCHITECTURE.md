# ThreadTales Privacy Architecture

## Scope

This document describes the free ThreadTales browser-processing flow through Production Phase 1. It describes implemented behavior only; it does not describe future account, payment, persistence, AI, or additional-import-provider features.

## Phase 1 data flow

```text
local WhatsApp .txt file
  -> browser File API (`File.arrayBuffer()`)
  -> transferable ArrayBuffer
  -> dedicated browser Web Worker
      -> `TextDecoder`
      -> `parseChatDetailed()`
      -> temporary in-worker `ChatMessage[]`
      -> `analyzeThreadTale()`
      -> derived `ThreadTaleResultV2`
  -> main browser thread
  -> story UI
  -> optional `createSnapshot()`
  -> PublicSnapshot V1 derived JSON
  -> base64url encoding
  -> `/share#<derived-payload>`
```

The Worker is part of the user's browser process. It is a performance/isolation boundary, **not** a cloud-processing service.

## Real upload memory ownership

For real file uploads, the main page reads the file as an `ArrayBuffer` and posts it to the Worker with a transfer list. Transferring detaches the sender-side buffer and gives ownership to the Worker, avoiding structured-clone duplication of that buffer.

Inside the Worker, the buffer is decoded into text, normalized, parsed and analyzed. Parsed message bodies exist temporarily inside the Worker because analytics such as top-word counts require reading message text.

Only `ThreadTaleResultV2` returns to the page. That result is deliberately derived and does not include the complete raw text or `ChatMessage[]`.

Completed, errored, cancelled and superseded Worker tasks are terminated. JavaScript/browser garbage collection controls the exact timing of memory reclamation; ThreadTales does not claim secure memory erasure.

## What stays on device

The following stays inside the browser during the free analysis flow:

- selected `.txt` file;
- its transferred binary buffer;
- decoded raw text inside the Worker;
- normalized text/line representation;
- temporary parsed message bodies;
- participant names before optional public sharing;
- derived result data.

## Network boundary

The Phase 1 Worker execution path performs no application network request. Source and automated privacy tests verify the Worker/engine path does not use:

- `fetch()`;
- `XMLHttpRequest`;
- `navigator.sendBeacon`;
- WebSocket transport.

There is no chat-processing API route or Server Action. Raw content is not sent to Vercel Functions, a database, object storage, an analytics SDK, or an AI/model endpoint.

Normal page assets and navigation requests are still served by Vercel; imported chat content is not attached to those requests.

## Browser persistence boundary

The free Phase 1 flow does not intentionally put raw chat content into:

- `localStorage`;
- `sessionStorage`;
- cookies;
- IndexedDB;
- application logs;
- query-string parameters;
- server persistence.

The derived result is held in React memory for the current page session.

## Public sharing remains a separate schema

`ThreadTaleResultV2` is an internal derived result. It is **not** serialized wholesale into public links.

The existing `PublicSnapshot` V1 remains the public contract because Phase 1 does not need new public fields. `createSnapshot()` explicitly selects allowed derived values. Participant names are pseudonymized by default and top words are omitted by default; both require explicit user opt-in.

The public snapshot is base64url **encoded, not encrypted**. Anyone with the complete URL can decode its derived contents. The fragment (`#...`) is interpreted by the recipient browser and is not sent as part of the HTTP request for `/share`.

## Cancellation and stale work

Each analysis has a unique request ID and the UI also tracks a monotonically increasing operation generation.

When a user:

- chooses another file;
- presses Cancel analysis;
- resets the page result;
- leaves/unmounts the analyzer;

the active Worker is terminated. The task promise is rejected locally with `AbortError` and stale messages/results are ignored.

This is important both for correctness and for minimizing how long superseded raw content remains reachable.

## Current limitations

- the Worker does not make the browser a trusted execution environment;
- extensions or compromised devices remain outside ThreadTales' control;
- the parser is not streaming, so decoded text and parsed messages coexist temporarily inside the Worker;
- the 15 MB guard remains to limit current memory exposure;
- public share links are not encrypted or server-revocable;
- the free flow has no accounts/persistence;
- browser/runtime garbage collection timing is not controllable by application code.

Any future feature that transmits selected/raw message content off-device must be separately disclosed, explicit opt-in, minimized, and documented. It must not silently weaken this default free-flow boundary.
