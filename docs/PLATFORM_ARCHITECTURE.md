# ThreadTales Story Platform Architecture

## Product model

The platform is one Next.js application with shared primitives and independent product experiences. Three products now prove the architecture:

| Product | Current input | Current output | Persistence model |
| --- | --- | --- | --- |
| ThreadTales | WhatsApp text export | deterministic relationship story, share link, PNG/keepsake | raw chat local; optional derived cloud save |
| MyYear.World | manual dated moments + locally selected photos | year timeline, eras, story cards, safe share summary | browser-memory MVP; optional derived cloud save |
| PetLife | pet profile, memories, milestones, local photo selections | reusable timeline + annual recap | intentional localStorage; optional private household cloud |

The remaining registry products are decision candidates, not implementation commitments.

## Runtime

```text
GitHub
  -> Vercel preview / production
  -> Next.js App Router
       ├ browser-local product engines
       ├ browser Web Worker for ThreadTales analysis
       └ optional route handlers
            ├ Stripe
            ├ Supabase
            ├ OpenAI
            └ telemetry endpoint
```

The free application requires no database, login, payment provider, AI key, queue, or separate backend service.

## Shared platform modules

```text
src/platform/
  ai/             replaceable optional story enrichment
  billing/        Stripe REST boundary
  entitlements/   signed premium entitlement
  export/         rendering-neutral story card export
  identity/       optional authenticated story session
  importers/      source importer contracts + WhatsApp adapter
  persistence/    Supabase REST/config + derived-content guard
  print/          vendor-neutral keepsake specification
  story/          deterministic modes/composition
  telemetry/      content-blind product event schema
  threadtales/    result V2 + worker client
  types.ts        shared story/event/export contracts

src/products/
  myyear/         MyYear-specific event, era and share logic
  petlife/        PetLife-specific timeline, recap and share logic
```

ThreadTales' legacy parser/analytics remains under `src/lib` because it is mature working code. Platform extraction is incremental rather than a destructive folder rewrite.

## Shared contracts

### Story events

```ts
interface StoryEvent {
  id: string;
  product: "threadtales" | "myyear" | "petlife";
  occurredAt: string;
  type: string;
  title: string;
  description?: string;
  location?: string;
  media?: Array<{
    id: string;
    name: string;
    url?: string;
    mimeType?: string;
  }>;
  metadata?: Record<string, string | number | boolean | null>;
}
```

The event contract stays intentionally small. Product-specific fields remain in product modules until more than one real product needs them.

### Story chapters

Story composition outputs rendering-neutral chapters with:

- stable ID/type;
- title/subtitle/metric/supporting copy;
- privacy level;
- rendering variant.

ThreadTales, MyYear and PetLife can therefore reuse the browser export renderer without sharing their business logic.

### Print model

ThreadTales keepsakes use a vendor-neutral `PrintBookSpec` with cover, trim size, bleed and pages. No print vendor is coupled to the product runtime.

## ThreadTales engine

```text
File API
 -> importer
 -> Web Worker when supported
 -> parser
 -> deterministic analytics
 -> ChatStats
 -> Result V2
 -> story mode composer
 -> detailed analytics UI + chapter deck
 -> optional share/export/cloud/payment/AI
```

Worker failure, returned error, timeout and browser-no-Worker fallback are independent paths. The deterministic analyzer remains the source of factual metrics; AI does not recalculate them.

## Occasion system

Occasions are configuration, not app forks:

```text
friends
couple
siblings
family
group
birthday
anniversary
long-distance
graduation
year-together
```

Each mode controls chapter priority, copy, theme and SEO surface while reusing one analysis engine.

## MyYear.World

MyYear proves the shared story/event/export contracts on a product that does not use chat parsing.

Current MVP:

```text
manual moment + date
+ optional caption/location
+ local photo selection metadata
 -> validated year summary
 -> month counts
 -> deterministic consecutive-month eras
 -> StoryEvent[]
 -> story chapters
 -> safe public manifest / browser export
```

Photo bytes are not uploaded or persisted by this MVP.

## PetLife

PetLife proves repeat-use local persistence and household authorization.

Local mode:

```text
pet profile + memories/milestones
 -> namespaced localStorage timeline
 -> annual recap
 -> story chapters/share/export
```

Cloud mode, when a dedicated Supabase project is configured:

```text
authenticated user
 -> household
 -> owner/member membership
 -> pet
 -> private memories
 -> optional invite / shared contribution
```

Owners manage households/pets/members. Members with `can_add_memories=true` can add memories through a server endpoint that rechecks pet access and membership before RLS performs the final database authorization.

## Identity and persistence

Supabase is optional and used as one simple provider for:

- magic-link authentication;
- Postgres;
- RLS;
- future media storage if/when needed.

The repository uses direct HTTP adapters rather than making every product depend on a large provider SDK. Browser requests use a publishable key + user access token. A server-only Supabase secret is reserved for narrowly elevated operations.

The reference schema is in `supabase/schema.sql`. It is not automatically applied by application startup or CI.

## Billing and entitlements

Stripe integration is also a thin REST boundary:

```text
premium CTA
 -> /api/checkout
 -> Stripe-hosted Checkout
 -> verified Session / webhook
 -> server-signed entitlement
 -> premium export + keepsake UI
```

The entitlement keeps the first purchase flow account-optional. A success URL alone never unlocks premium.

## Optional AI

Products call a replaceable `StoryEnrichmentProvider` contract. The initial provider uses OpenAI Responses API directly.

AI is used for copy enrichment only. ThreadTales sends an allowlisted derived representation, not the raw import, unless a user explicitly pastes and consents to a short selected snippet.

## Telemetry

The telemetry layer is a tiny content-blind event contract. It exists to support Phase 11 decisions without adding a heavyweight analytics dependency. The browser sends only event/product/mode to an internal route. If no external HTTPS endpoint is configured, the internal route returns 202 and does not transmit further.

## Deployment simplicity

The intended deployment remains:

```text
pull request
 -> Vercel preview
 -> GitHub Actions
 -> browser smoke verification
 -> merge
 -> Vercel production from main
```

No Docker image, Kubernetes cluster, Redis instance, queue, worker fleet, vector database or separate API deployment is required.

## Product boundary rule

Shared code is extracted only when multiple real products use it. Avoid giant `if (product === ...)` platform logic. Product-specific narrative, validation and retention behavior remains inside each product module.

## What is deliberately not being built in this wave

- Relationship Universe
- LifeMap
- BabyStory
- FamilyTree Live
- FounderWorld
- CreatorWorld
- new connector ecosystems
- print fulfillment
- a separate AI service

Those decisions are governed by `PRODUCT_DECISION_FRAMEWORK.md` after actual usage data exists.
