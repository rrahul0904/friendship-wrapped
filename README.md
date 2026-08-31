# ThreadTales / WorldCore

**Turn the data of your life into stories and worlds worth keeping.**

ThreadTales is the first live product: it turns a supported chat export into a visual friendship/relationship story while keeping the raw chat entirely in the browser for the core experience.

The repository is also the starting point for WorldCore, the shared platform planned for LifeMap, Relationship Universe, PetLife, BabyStory, HomeStory, MyYear.World, FounderWorld, CreatorWorld, and FamilyTree Live.

## Privacy architecture

The cheapest architecture is also the strongest privacy story:

1. The `.txt` export is opened with the browser File API.
2. Parsing and analytics happen client-side.
3. No raw chat is uploaded, persisted, logged, added to checkout metadata, or sent to an AI model by the free/deterministic story flow.
4. Share links contain a compact derived-stat snapshot only.
5. Participant names and top words remain opt-in for public links.
6. Wave 3 checkout continuity stores only derived analysis state in the browser session, never the raw export.

Do not turn the raw-chat local-only pipeline into a silent server upload. Any future cloud or AI feature that needs source content must be separately disclosed and explicitly opt-in.

## Live deployment

Vercel project: `threadtales`  
Current production URL: `https://threadtales-five.vercel.app`

The GitHub repository should be connected to this existing Vercel project so `main` deploys to production and feature branches receive previews.

## Current product features

- WhatsApp Android and iOS text export parsing
- US (`MM/DD`) and international (`DD/MM`) date modes
- multiline message support
- friends/couple/siblings/family/group story modes
- message, word and participant split analytics
- first/last date, active days and longest streak
- longest quiet spell
- median reply time
- biggest chat day
- conversation starter analysis
- daypart and peak-hour analysis
- questions/laughter/hearts/media signals
- top words and year-by-year timeline
- deterministic vibe scores and cast cards
- privacy-safe derived-stat share links
- built-in demo chat
- responsive UI

## Wave 3 — monetization + WorldCore

Workstream: `docs/CODEX_WAVE_3_IMPLEMENTATION.md`  
GitHub tracking issue: `#3`

The Wave 3 branch introduces:

- deterministic 12-chapter premium story
- first 3 chapters free; 9 premium chapters locked
- configurable one-time premium offer (initial target `$9.99`)
- Stripe-hosted Checkout creation through a server route
- server-side Checkout Session verification before premium unlock
- browser-session restoration of derived analysis after the Stripe redirect
- WorldCore product/event/world/people/share contracts
- privacy-safe analytics event contract
- Neon-compatible initial WorldCore migration
- CI lint/build validation

### Paid flow

```text
chat export
   ↓
browser-only parser + analytics
   ↓
free ThreadTale
   ↓
3 premium chapter previews
   ↓
POST /api/checkout
   ↓
Stripe-hosted Checkout
   ↓
return with Checkout Session ID
   ↓
GET /api/entitlements/verify
   ↓
server verifies paid status + product metadata + expected Price ID
   ↓
unlock all 12 chapters
```

The Checkout Session ID can be cached in browser session storage for convenience, but it is never treated as proof of purchase until the server re-verifies it with Stripe.

## WorldCore model

Future products should reuse shared primitives rather than create separate stacks:

```text
source data
   ↓
connector / parser
   ↓
StoryEvent[]
   ↓
World
   ↓
timeline / map / universe / city / graph / book / cinematic renderer
```

Platform contracts currently live under:

```text
src/platform/
  analytics/
  entitlements/
  events/
  people/
  products/
  sharing/
  worlds/
```

Initial persistence design is in `db/migrations/001_worldcore.sql`. The database is for persistent worlds and commercial state; the free ThreadTales analyzer does not depend on it.

## Tech stack

- Next.js App Router
- React + TypeScript
- Vercel
- plain CSS
- Stripe Checkout for the first paid entitlement flow
- Neon/Postgres planned for persistent WorldCore state
- no database required for free analysis
- no raw chat storage
- no AI dependency for free or deterministic premium chapters

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PREMIUM_PRICE_LABEL=$9.99
STRIPE_SECRET_KEY=
STRIPE_FRIENDSHIP_PRICE_ID=
DATABASE_URL=
```

`STRIPE_SECRET_KEY` and `STRIPE_FRIENDSHIP_PRICE_ID` are server-only values. Never expose them through `NEXT_PUBLIC_*` variables.

## Validation

```bash
npm install
npm run lint
npm run build
```

GitHub Actions runs the same lint/build gate on the Codex branch and pull requests.

## Product and implementation docs

- [Product strategy](docs/PRODUCT_STRATEGY_2026.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Multi-product platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Codex Wave 3 implementation contract](docs/CODEX_WAVE_3_IMPLEMENTATION.md)

## Immediate execution order

1. Get Wave 3 CI green.
2. Configure Stripe test-mode secret + one-time Price ID in Vercel preview environment.
3. Verify the real Checkout redirect/unlock flow with the demo story.
4. Connect the GitHub repository to the existing Vercel project if it is not already connected.
5. Ship a preview deployment and smoke-test `/`, `/create?demo=1`, `/share`, and `/products`.
6. Only after the paid ThreadTales funnel works, continue into persistent WorldCore/Neon and the next product (MyYear.World).
