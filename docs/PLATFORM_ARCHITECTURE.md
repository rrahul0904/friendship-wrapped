# Multi-Product Platform Architecture

ThreadTales is the first product in a broader platform for turning personal or business data into interactive stories, timelines, worlds, and shareable artifacts.

## Product model

One codebase, shared platform services, independent product experiences.

| Product | Primary input | Core output | Persistence | Monetization |
| --- | --- | --- | --- | --- |
| LifeMap | Photos, travel, Spotify, calendar | Living personal map | Required | Archive, print, yearly recap |
| Friendship Wrapped | Chat exports | Friendship story | Optional | One-time premium story/video/book |
| Relationship Universe | Photos, trips, songs, milestones | Couple world | Required | Subscription |
| PetLife | Photos, dates, walks, memories | Pet world/timeline | Required | Storage, AI, memorial products |
| BabyStory | Photos, milestones, recordings | Growing-up timeline | Required | Family plan, books, storage |
| HomeStory | Photos, documents, renovations | Home memory capsule | Required | Archive, transfer, print |
| MyYear.World | Photos, music, travel, workouts, journal | Live year-in-review | Required | Annual premium recap |
| FounderWorld | Stripe, analytics, GitHub, socials | Startup city | Required | SaaS subscription |
| CreatorWorld | YouTube, TikTok, Instagram, Spotify | Creator world | Required | Analytics subscription |
| FamilyTree Live | People, photos, voice, stories, documents | Interactive family graph/world | Required | Family plan, archive, AI interviews |

## Shared platform layers

### 1. Identity and households
- Users
- Households / families / teams
- Roles and invitations
- Private/public sharing controls

### 2. Universal event model
Every product turns source data into the same normalized event shape:

```ts
interface StoryEvent {
  id: string;
  worldId: string;
  type: string;
  occurredAt: string;
  title: string;
  description?: string;
  people?: string[];
  places?: string[];
  media?: string[];
  source?: string;
  metadata?: Record<string, unknown>;
}
```

Examples:
- Friendship: message milestone, longest streak, first message
- PetLife: adoption, vet visit, birthday, favorite walk
- BabyStory: first word, first step, school day
- FounderWorld: new customer, churn, deployment, revenue milestone

The UI engines render events differently by product, but the storage and timeline system stay shared.

### 3. Media layer
- Photos
- Video
- Audio
- PDFs/documents
- Generated images
- Thumbnails and metadata

Raw personal content remains private by default. Public pages use explicit share manifests.

### 4. Connector layer
Adapters convert external sources into normalized events.

Examples:
- WhatsApp export adapter
- Apple/Google calendar adapter
- Spotify adapter
- Google Photos / photo import adapter
- Stripe adapter
- GitHub adapter
- YouTube adapter
- Instagram/TikTok adapter when API access permits

### 5. Story intelligence layer
Deterministic analysis first; AI enrichment second.

Deterministic:
- counts
- streaks
- timelines
- geography
- milestones
- recurrence
- comparisons
- growth

Optional AI:
- chapter names
- summaries
- inside-joke detection
- memory captions
- interview-to-story conversion
- image generation
- video narration

### 6. World rendering engine
A shared renderer supports multiple visual metaphors:
- Timeline
- Map
- Universe
- City
- Family graph
- Memory book
- Cinematic recap

Each product supplies a theme and mapping rules rather than building a new visualization engine from scratch.

### 7. Share engine
Every product can produce a privacy-safe public artifact.

```text
private world
   -> user selects shareable sections
   -> share manifest
   -> public page /s/:slug
```

Never publish raw source data by default.

### 8. Billing and entitlements
Shared checkout and entitlement model:
- one-time unlock
- annual plan
- monthly subscription
- storage tier
- premium export
- print/video add-on

## Recommended Vercel-first stack

### Frontend and application runtime
- Next.js App Router
- Vercel deployments/CDN/functions
- React + TypeScript

### Persistent data
- Neon Postgres
- Start with ordinary relational tables + JSONB for product-specific metadata
- Add pgvector only when semantic search is actually needed

### Media
- Vercel Blob initially
- Abstract behind a storage interface so R2/S3 can be introduced later if economics require it

### Authentication
- Auth.js or another hosted identity provider behind a small adapter
- Do not make individual products depend directly on provider-specific APIs

### Background sync
- Vercel Cron for low-frequency connector sync
- Queue/background provider only when workloads require it

### AI
- Server-side AI gateway wrapper
- Product features call one internal interface, never provider SDKs directly

## Repository structure

```text
src/
  app/
    (marketing)/
    products/
      friendship/
      lifemap/
      relationship/
      petlife/
      babystory/
      homestory/
      myyear/
      founderworld/
      creatorworld/
      familytree/
    s/[slug]/
    api/
  products/
    friendship/
    lifemap/
    relationship/
    petlife/
    babystory/
    homestory/
    myyear/
    founderworld/
    creatorworld/
    familytree/
  platform/
    auth/
    billing/
    connectors/
    events/
    media/
    sharing/
    storage/
    world-engine/
    ai/
```

We should keep this as a single Next.js application until deployment size, team boundaries, or scaling requirements justify splitting into a monorepo with multiple apps.

## Build order

### Wave 1 — prove virality
1. Friendship Wrapped / ThreadTales
2. MyYear.World
3. PetLife

### Wave 2 — recurring emotional products
4. Relationship Universe
5. BabyStory
6. FamilyTree Live

### Wave 3 — connector-heavy products
7. LifeMap
8. FounderWorld
9. CreatorWorld

### Wave 4 — niche durable archive
10. HomeStory

The key is not to build ten separate stacks. Build shared primitives once, then let every product become a different lens on the same event, media, graph, sharing, and rendering platform.