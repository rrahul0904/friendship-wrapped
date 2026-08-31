# ThreadTales / Story Platform Privacy Architecture

## Scope

This document describes the implemented architecture on `production-all-phases` for ThreadTales, MyYear.World, and PetLife. The central rule is unchanged: **the free ThreadTales analyzer does not upload the imported WhatsApp chat**. Optional payment, cloud persistence, AI enrichment, and telemetry are separate boundaries with narrow schemas and graceful disabled states.

## Data-boundary summary

| Path | Feature | Data crossing boundary | User initiated? | Raw content possible? | Persistence | Protection |
| --- | --- | --- | --- | --- | --- | --- |
| Browser → Web Worker | ThreadTales free analysis | Raw `.txt` and parsed messages | Yes, file selection/demo | Yes, inside browser only | Ephemeral browser memory | Worker/local processing; no server call |
| Browser URL fragment | ThreadTales public share | Derived `PublicSnapshot` | Yes | No raw messages; names/top words opt-in | No server copy | Fragment is client-decoded; base64url is encoding, not encryption |
| Browser → `/api/checkout` → Stripe | Premium checkout | Story mode, product/price/session metadata | Yes | No | Stripe payment/session records | Server-only Stripe key; no chat/result payload |
| Browser → `/api/entitlements` | Premium recovery | Checkout Session ID or signed entitlement | Yes | No | Signed token may be stored locally | Stripe session is verified server-side; HMAC entitlement |
| Browser → `/api/stories` → Supabase | Optional story save | Explicit derived story/result | Yes | Raw ThreadTales messages rejected | Optional private cloud records | Auth + RLS + server sanitizer |
| Browser → `/api/ai/enrich` → OpenAI | Optional AI enrichment | Allowlisted derived metrics + share-safe chapters; optional consented snippet | Yes | Only an explicitly pasted ≤600-char snippet | Provider request configured with `store: false` | Server-only API key, allowlist, consent validation |
| Browser → `/api/telemetry` | Product telemetry | Event name, product, recognized mode | Best-effort after user action | No content fields exist | Optional external endpoint | Allowlist/sanitizer; 202 no-op when endpoint absent |
| Browser memory | MyYear selected photos | Selected `File` objects / metadata | Yes | Personal media remains local | No photo-byte persistence in MVP | Share/cloud result excludes photo bytes |
| Browser → `/api/stories` | MyYear optional save | Derived year summary | Yes | Captions/locations may exist in private derived summary; photo bytes do not | Optional Supabase | Auth + RLS + explicit save |
| `localStorage` | PetLife local timeline | Pet profile + memory/milestone text + photo counts | Yes | Yes, PetLife memory text by design | Local browser only | Namespaced key + visible delete-local-data control |
| Browser → PetLife APIs → Supabase | PetLife households | Profile, memories, membership/invite metadata | Yes | PetLife memory text may be private cloud data | Optional Supabase | Auth, owner/member permissions, RLS, one-time invite token |

## 1. ThreadTales free local path

```text
local WhatsApp .txt
  -> File.text()
  -> browser memory
  -> Web Worker when available
  -> parser
  -> ChatMessage[] in worker/browser memory
  -> deterministic analytics
  -> derived ChatStats / Result V2
  -> story UI
```

The raw imported chat is not intentionally written to:

- `localStorage`;
- `sessionStorage`;
- cookies;
- a URL or query string;
- Supabase;
- Stripe;
- telemetry;
- the AI endpoint;
- application logs.

If Worker support is unavailable, the same parser runs in the browser main thread. That fallback does not move the raw chat to the server.

## 2. ThreadTales public sharing

The legacy/public share flow creates a separate derived `PublicSnapshot`. It does not serialize `ChatMessage[]` or the raw import. By default:

- participant names are replaced with anonymous labels;
- top words are omitted;
- the raw chat is absent.

Names and top words require separate explicit toggles.

The story-engine share manifest also filters `privacyLevel: "sensitive"` chapters by default. A prior regression allowed participant names to appear in a cover chapter marked share-safe; the cover is now anonymous and regression tests use unmistakable secret fixture strings to protect that boundary.

Share data is base64url encoded, **not encrypted**. Anyone with the complete share URL can decode the derived payload. The URL fragment is read client-side and is not sent as the HTTP path/query to the `/share` route.

## 3. Stripe boundary

`/api/checkout` accepts the story mode and creates a Stripe-hosted Checkout Session. The Stripe request contains purchase configuration and mode metadata only.

It must never contain:

- imported chat text;
- participant names;
- top words;
- `ChatStats` / Result V2;
- story chapters;
- MyYear/PetLife private content.

A browser redirect or `?success=true` is not trusted as proof of payment. Entitlement recovery calls the server with a Checkout Session ID; the server retrieves the Session from Stripe and issues a signed entitlement only for an accepted paid state. Webhook verification uses the raw request body and Stripe signature HMAC.

The signed premium entitlement is stored in browser `localStorage` under `threadtales:premium-entitlement`. That token is purchase metadata, not chat content.

## 4. Optional Supabase persistence

Cloud save is opt-in and appears after the local product already has value. The Story Platform uses publishable credentials for user-scoped requests and a server-only secret only for narrowly elevated operations such as one-time PetLife invitation acceptance.

The repository contains `supabase/schema.sql` as an activation reference. It enables RLS on all exposed Story Platform tables. It has **not** been automatically applied to any connected Supabase project.

### ThreadTales cloud save

Only the versioned derived Result V2 is accepted. The server recursively rejects raw-content container keys including normalized forms of:

- `raw`;
- `rawText`;
- `rawChat`;
- `messages`;
- `chatMessages`;
- `messageText`;
- `sender`;
- `transcript`;
- `conversation`;
- `text`.

Derived counters such as `totalMessages` and `lateNightMessages` remain valid because the sanitizer matches forbidden raw-content keys exactly after normalization rather than substring-matching `messages` everywhere.

### MyYear cloud save

The MVP can save the derived year summary after sign-in. Selected browser photo bytes are not included in that payload. Captions and locations are private story fields and are not part of the public MyYear share manifest.

### PetLife cloud save

PetLife is intentionally different from ThreadTales: it is a repeat-use memory product, so private pet profile/memory text may be persisted locally and, when explicitly synced, in the private household database.

Cloud authorization is enforced by RLS and API checks:

- owner manages the household and pet;
- member access derives from household membership;
- `can_add_memories` controls member contribution;
- unrelated users cannot select household pets/memories under the reference policies;
- owner/member creation metadata is checked against the authenticated user.

Invitation tokens are random, one-time, seven-day values. Only their SHA-256 hash is stored. Acceptance requires the signed-in account email to match the invited email. The raw invitation token is returned only in the invitation link.

## 5. Optional AI boundary

AI enrichment is not part of deterministic analytics. Without `OPENAI_API_KEY`, the API reports disabled state and the product continues normally.

Default ThreadTales AI input is constructed from an allowlist of aggregate fields such as message counts, active days, streaks, timing aggregates, and year count. Participant names and top words are not part of that allowlist. Only deterministic chapters marked share-safe are automatically sent.

A user may paste a selected snippet of up to 600 characters. If a non-empty snippet is present, an explicit consent boolean is required before the server accepts the request.

The current OpenAI provider uses the Responses API with `store: false`. Provider failures are surfaced as optional-enrichment errors and do not invalidate the deterministic story.

## 6. Telemetry boundary

Telemetry accepts only a fixed event allowlist and these dimensions:

```text
event
product
recognized story mode (optional)
```

The schema has no output fields for:

- chat text;
- participant names;
- top words;
- captions;
- locations;
- pet notes;
- file names;
- photo contents;
- AI snippets.

Client delivery is best effort and non-blocking. If `TELEMETRY_ENDPOINT` is absent, the server returns HTTP 202 without making an external request. If configured, the endpoint must use HTTPS and receives only the sanitized event plus a server-created timestamp.

## 7. Local storage inventory

### ThreadTales raw import

No intentional local/session storage of the raw WhatsApp import.

### Premium entitlement

`threadtales:premium-entitlement` stores only a signed purchase entitlement.

### PetLife

`story-platform:petlife:v1` intentionally stores the local PetLife profile and memory timeline so PetLife works across browser sessions. Selected photo bytes are not stored there; each memory stores only `photoCount` for media selection in this MVP.

PetLife exposes **Delete local PetLife data**, which removes the namespaced key and resets the local product state.

### MyYear

The current MyYear draft lives in React/browser memory only. Selected `File` objects are not persisted by the MVP.

## 8. Server secret boundary

These values are server-only and must never be prefixed with `NEXT_PUBLIC_`:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ENTITLEMENT_SIGNING_SECRET
SUPABASE_SECRET_KEY
OPENAI_API_KEY
TELEMETRY_API_KEY
```

Only Supabase URL/publishable key and the optional canonical site URL are browser-safe public configuration.

## 9. Security-sensitive route inventory

| Route | Purpose | Primary controls |
| --- | --- | --- |
| `/api/checkout` | Stripe Checkout | narrow request body, server secret, no content payload |
| `/api/entitlements` | paid-session verification / token validation | Stripe retrieval + HMAC token verification |
| `/api/stripe/webhook` | Stripe events | raw-body signature verification |
| `/api/auth/*` | optional magic-link session | Supabase publishable auth flow; HTTP-only session cookie |
| `/api/stories` | optional derived story persistence | authenticated session, RLS, raw-content sanitizer |
| `/api/petlife` | private household/pet sync | authenticated session + RLS |
| `/api/petlife/invites` | invitations | owner check; hashed token; email/expiry/one-use verification |
| `/api/petlife/members` | membership removal | owner authorization + RLS |
| `/api/petlife/memories` | permitted shared memory contribution | authenticated user, accessible pet, membership permission + RLS |
| `/api/ai/enrich` | optional AI copy | provider gate, allowlisted facts, safe chapters, consented snippet |
| `/api/telemetry` | content-blind product events | strict allowlist, HTTPS destination, no-op when disabled |

## 10. Verification

Privacy regression coverage includes:

- raw chat exclusion from ThreadTales share payloads;
- anonymous default story manifests;
- Result V2 derived-only checks;
- cloud persistence raw-key rejection;
- Stripe payload/signature tests;
- AI allowlist/consent/`store:false` tests;
- telemetry schema stripping;
- MyYear caption/location/media exclusion from public manifests;
- PetLife note/media exclusion from public manifests;
- browser flows for disabled optional integrations.

The final merge-readiness gate additionally requires lint, strict TypeScript, unit tests, production build, Playwright, GitHub Actions, and Vercel preview verification on the final head.

## Limitations and threat model

This design reduces server-side exposure but does not make the browser a trusted enclave. A compromised device, malicious browser extension, or future third-party client script can change the threat model. Optional cloud persistence necessarily creates a different data boundary from the anonymous local analyzer, which is why it remains explicit and configuration-gated.
