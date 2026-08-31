# CODEX IMPLEMENTATION PROMPT — Wave 3: Monetization + WorldCore

## Mission

Move ThreadTales from a free privacy-first chat analyzer into the first revenue-producing product on top of a reusable WorldCore platform.

Repository: `rrahul0904/friendship-wrapped`

Work branch: `codex/wave-3-monetization-worldcore`

Production target: the existing Vercel project `threadtales`.

The product must preserve its strongest property: raw chat exports are processed in the browser by default and are not uploaded to our backend merely to generate the free story.

## Product outcome

A stranger should be able to:

1. Open ThreadTales.
2. Upload a supported chat export locally.
3. Receive a useful free story immediately.
4. See a compelling preview of a premium 12-chapter story.
5. Purchase the premium story with a one-time Stripe Checkout payment.
6. Return from Stripe and have the purchase verified server-side.
7. Unlock the complete premium story without us storing the raw chat.
8. Generate privacy-safe shareable artifacts.

The first commercial success criterion is not feature count. It is a successful real one-time purchase by a user who did not build the product.

---

# Non-negotiables

## Privacy

- Raw chat text remains client-side for the normal free experience.
- Never add raw messages to URL payloads, analytics events, logs, checkout metadata, error reports, or public share payloads.
- Premium deterministic chapters must be generated from derived `ChatStats` wherever possible.
- Any future AI feature that needs message content must require explicit opt-in and send only the minimum selected content.
- Participant names remain private in public artifacts unless the user explicitly enables them.

## Security

- Never expose `STRIPE_SECRET_KEY` to client components.
- Never trust a `paid=true` query parameter or localStorage boolean as proof of purchase.
- Verify Stripe Checkout Sessions server-side before granting a premium entitlement.
- Validate Stripe response object type, `payment_status`, product metadata, and expected price/product identity.
- Do not put secrets in the repository.
- Do not introduce an auth/database dependency solely to prove the first purchase flow.

## Cost discipline

- Keep the free analyzer client-side.
- Avoid always-on infrastructure.
- Do not add queues, Redis, vector databases, or AI calls to the core free flow.
- Prefer Vercel serverless route handlers for payment verification and lightweight server work.

## Architecture discipline

- Product-specific presentation belongs under `src/products/friendship` or components that consume product services.
- Reusable platform contracts belong under `src/platform`.
- Do not make WorldCore depend on WhatsApp-specific types.
- Do not split into multiple deployable apps yet.

---

# Current state

The repository already includes:

- Next.js App Router + TypeScript.
- Browser-local chat parsing.
- Deterministic chat analytics.
- Relationship modes: friends, couple, siblings, family, group.
- Privacy-safe share snapshots.
- Product catalog for ten future products.
- Multi-product architecture document.
- V2 analytics including reply time, conversation starts, biggest day, silence, dayparts, cast cards, and vibe metrics.

Do not regress these features.

---

# Workstream 1 — Premium story engine

Implement a deterministic premium story system first. This must work with zero AI calls.

Create/maintain:

```text
src/products/friendship/
  premium-story.ts
```

Define:

```ts
export interface PremiumChapter {
  id: string;
  ordinal: number;
  title: string;
  kicker: string;
  body: string;
  metric?: string;
  lockedByDefault: boolean;
}

export interface PremiumStory {
  version: 1;
  mode: StoryMode;
  title: string;
  subtitle: string;
  chapters: PremiumChapter[];
}
```

Implement:

```ts
generatePremiumStory(stats: ChatStats, mode: StoryMode): PremiumStory
```

Generate 12 meaningful chapters from derived statistics. Chapters should include concepts such as:

1. The beginning.
2. Who kept it alive.
3. Your busiest era.
4. The day the chat exploded.
5. Reply rhythm.
6. Midnight behavior.
7. Curiosity/questions.
8. Humor/laughter.
9. Affection signals.
10. The longest silence and comeback.
11. Cast/personality dynamics.
12. The story so far.

Requirements:

- No fabricated factual memories.
- Do not claim a specific event occurred unless it is present in derived data.
- Copy must adapt to `StoryMode`.
- Copy should be warm/funny but avoid pretending to know emotions the data cannot establish.
- The first 3 chapters should be free preview chapters; chapters 4–12 should be premium by default.
- Unit-test the generator with at least two modes and edge cases for one participant/group chats.

---

# Workstream 2 — Premium UI and funnel

Create:

```text
src/components/PremiumStory.tsx
```

The component should:

- Display the 12 chapter structure after the free story.
- Render the first 3 chapters fully.
- Render locked chapter titles/previews for the remaining chapters.
- Clearly explain what the one-time purchase unlocks.
- Have one primary CTA: `Unlock the full story`.
- Display the configured one-time price in UI from a public non-secret config value or shared catalog constant.
- Handle checkout errors gracefully.
- If a verified entitlement is present, render all chapters.

Do not hide the existing free share flow.

Recommended initial offer:

```text
ThreadTales Premium Story
$9.99 one-time
```

The implementation should make the price configurable.

---

# Workstream 3 — Stripe Checkout without SDK lock-in

Implement Stripe Checkout using server-side `fetch` against Stripe's API so the first payment flow does not require a large SDK dependency.

Environment variables:

```text
STRIPE_SECRET_KEY=
STRIPE_FRIENDSHIP_PRICE_ID=
NEXT_PUBLIC_PREMIUM_PRICE_LABEL=$9.99
NEXT_PUBLIC_SITE_URL=
```

Create:

```text
src/app/api/checkout/route.ts
```

POST contract:

```json
{
  "product": "friendship-premium-v1",
  "returnPath": "/create"
}
```

Server behavior:

1. Validate the product against a server-owned catalog.
2. Build an `application/x-www-form-urlencoded` request.
3. POST to `https://api.stripe.com/v1/checkout/sessions` using Bearer auth.
4. Use `mode=payment`.
5. Use exactly one server-configured Stripe Price ID.
6. Add safe metadata such as `product=friendship-premium-v1` only. Never include chat data or participant names.
7. Set a success URL that returns the Checkout Session ID.
8. Set a cancel URL back to the story.
9. Return only `{ url }` to the client.
10. Fail closed when Stripe configuration is absent.

Stripe documentation confirms Checkout Sessions are created through `POST /v1/checkout/sessions`, with `mode=payment`, `line_items`, and hosted success/cancel URLs. Keep the implementation aligned with current official docs.

---

# Workstream 4 — Server-verified lightweight entitlement

For the first paid transaction, do not require user accounts or Neon yet.

Create:

```text
src/app/api/entitlements/verify/route.ts
src/platform/entitlements/catalog.ts
src/platform/entitlements/types.ts
```

The client stores the successful Checkout Session ID locally, but that ID is not itself proof of payment.

Verification flow:

```text
browser session id
      ↓
GET /api/entitlements/verify?session_id=...
      ↓
server retrieves Stripe Checkout Session
      ↓
validate:
  object == checkout.session
  payment_status == paid
  metadata.product == friendship-premium-v1
      ↓
return entitlement snapshot
```

Response example:

```json
{
  "entitled": true,
  "product": "friendship-premium-v1"
}
```

The client may cache the session ID for convenience, but must re-verify it server-side before rendering paid content after a reload.

This is intentionally an MVP entitlement. The later database-backed implementation will map payment/customer identity to persistent user entitlements.

---

# Workstream 5 — WorldCore contracts

Seed the reusable platform now without overbuilding it.

Create:

```text
src/platform/events/types.ts
src/platform/worlds/types.ts
src/platform/people/types.ts
src/platform/sharing/types.ts
```

Minimum contracts:

```ts
export type ProductType =
  | "friendship"
  | "lifemap"
  | "relationship"
  | "petlife"
  | "babystory"
  | "homestory"
  | "myyear"
  | "founderworld"
  | "creatorworld"
  | "familytree";

export interface StoryEvent {
  id: string;
  worldId: string;
  productType: ProductType;
  type: string;
  occurredAt: string;
  title: string;
  description?: string;
  peopleIds: string[];
  placeIds: string[];
  mediaIds: string[];
  source?: string;
  metadata: Record<string, unknown>;
}
```

World:

```ts
export interface World {
  id: string;
  productType: ProductType;
  title: string;
  visibility: "private" | "unlisted" | "public";
  createdAt: string;
  updatedAt: string;
}
```

Do not connect these contracts to a database yet unless the migration workstream below is being executed in the same Codex run.

---

# Workstream 6 — Persistence migration design

Add a SQL migration but do not make the free analyzer depend on it.

Create:

```text
db/migrations/001_worldcore.sql
```

Tables:

```text
users
worlds
world_members
people
story_events
media
share_pages
purchases
entitlements
```

Requirements:

- PostgreSQL-compatible SQL suitable for Neon.
- UUID primary keys.
- `product_type` constraint or enum that supports all ten registered products.
- JSONB metadata for product-specific extension.
- indexes on world/event ownership and time-based retrieval.
- timestamps with timezone.
- explicit foreign keys.
- no raw chat-message table in this migration.

The database is for persistent worlds and commercial state, not a reason to upload private source chats.

---

# Workstream 7 — Share/export foundation

Add a product-neutral share manifest contract under `src/platform/sharing`.

A share manifest must whitelist what becomes public. Never infer that all world data can be published.

Prepare for later outputs:

- public web story
- vertical social card
- PDF story
- cinematic/video recap

Do not add a heavy PDF/video rendering dependency in this wave unless it can be isolated behind an interface.

---

# Workstream 8 — CI and production readiness

Add a GitHub Actions workflow that runs on PRs and pushes to `main`:

```text
npm ci
npm run lint
npm run build
```

If a lockfile is absent, create/update it using the repository's chosen package manager and commit it.

Add/maintain:

```text
.env.example
```

Document every required variable without adding real values.

The existing Vercel project should ultimately be Git-connected to this repository so:

```text
main -> production
feature branches -> preview deployments
```

Do not create a second production Vercel project unless necessary.

---

# Workstream 9 — Observability with privacy constraints

Track funnel events without chat content:

```text
landing_viewed
analyzer_started
analysis_completed
premium_preview_viewed
checkout_started
checkout_completed
share_link_created
```

Safe dimensions may include:

```text
story_mode
message_count_bucket
year_count_bucket
product
```

Never include participant names, top words, message text, file name, or raw share payload in analytics.

A provider is optional in this wave; first define a typed internal analytics interface.

---

# Testing matrix

At minimum test:

## Parser regression
- WhatsApp Android style.
- WhatsApp iOS style.
- multiline messages.
- MM/DD and DD/MM handling.
- group chat participant counts.

## Premium story
- two-person friendship.
- couple mode.
- family/group mode.
- sparse stats.
- no fabricated event claims.

## Checkout
- missing Stripe configuration returns a safe 503/500-class response without leaking secrets.
- unsupported product rejected.
- Stripe non-2xx response mapped to safe client error.

## Entitlement
- invalid session ID rejected.
- unpaid session does not unlock.
- wrong product metadata does not unlock.
- paid correct product unlocks.

## Privacy
- raw message samples never appear in server route inputs/outputs.
- checkout metadata contains no names/text.
- public snapshot behavior remains opt-in for names/top words.

---

# Definition of Done

Do not call Wave 3 complete until all of these are true:

- [ ] Free chat analysis still works without login or server upload.
- [ ] 12 deterministic premium chapters exist.
- [ ] 3 chapters preview free; remaining chapters visually lock.
- [ ] Checkout endpoint is implemented with server-owned product/price configuration.
- [ ] Successful Stripe Checkout can be verified server-side.
- [ ] Paid state unlocks the premium story after verification.
- [ ] No raw chat content is sent to Stripe or server routes.
- [ ] WorldCore base contracts exist.
- [ ] Neon-compatible initial migration exists.
- [ ] Typed analytics interface exists.
- [ ] CI runs lint and production build.
- [ ] `.env.example` documents required configuration.
- [ ] README explains the paid flow and privacy boundary.
- [ ] Vercel preview build passes.
- [ ] Production smoke test passes for `/`, `/create?demo=1`, `/share`, `/products`.

---

# Codex execution rules

1. Inspect existing code before modifying it.
2. Work on `codex/wave-3-monetization-worldcore` unless instructed otherwise.
3. Make small coherent commits.
4. Run tests/lint/build after meaningful changes.
5. Fix build failures before proceeding.
6. Do not remove privacy protections to simplify implementation.
7. Do not introduce speculative infrastructure.
8. Do not hard-code production secrets or Stripe IDs.
9. Preserve backwards compatibility for existing share URLs.
10. End with a concise implementation report containing:
   - commits created
   - tests run and results
   - Vercel preview URL if available
   - remaining environment/config steps
   - known limitations

## Priority order

If the full wave cannot be completed in one run, prioritize in this order:

1. Premium deterministic story + UI.
2. Checkout + server verification.
3. WorldCore contracts.
4. Database migration.
5. CI.
6. Analytics abstraction.
7. Export interfaces.

Do not stop after planning. Implement working code.