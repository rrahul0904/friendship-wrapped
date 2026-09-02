# ThreadTales / Story Platform

**Turn private digital history into stories worth sharing and keeping.**

This repository is one simple Next.js application containing three implemented product experiences:

- **ThreadTales** — a privacy-first WhatsApp story/analyzer;
- **MyYear.World** — a deterministic year-in-review builder;
- **PetLife** — a repeat-use pet memory timeline and annual recap.

ThreadTales uses the **Memory Cinema OS** interface: a private memory-capsule import flow, paced processing/reveal sequence, Wrapped-style story chapters, cinematic recap, four visual themes, and share/keepsake tools. The free experience remains browser-local and does not require an account.

The platform deliberately keeps optional infrastructure behind configuration gates so the free/local experiences remain deployable without accounts, a database, payments, AI, queues, or a separate backend.

## ThreadTales privacy promise

The free ThreadTales flow is local-first:

```text
WhatsApp .txt
 -> browser File API
 -> Web Worker when available
 -> parser + deterministic analytics
 -> derived story
 -> optional privacy-safe share/export
```

Raw imported chat is not silently uploaded to Vercel functions, Supabase, Stripe, telemetry, or an AI provider. Public share links use a separate derived snapshot; participant names and top words are excluded by default.

See [Privacy architecture](docs/PRIVACY_ARCHITECTURE.md) for every implemented boundary.

## Product surface

### ThreadTales

- Android/iOS WhatsApp text parsing
- MM/DD and DD/MM modes
- 12/24-hour timestamps and multiline messages
- Web Worker processing with fallback/error/timeout behavior
- message/word/participant analytics
- streaks, silence, reply speed, conversation starts
- busiest day, peak hour, weekday/dayparts
- laughter/heart/media/question signals
- monthly/yearly timeline and deterministic vibe scores
- ten story modes including birthday and anniversary experiences
- rendering-neutral chapter composer
- Midnight, Sunset, Paper, and Neon story themes
- cinematic recap with accessible playback controls and reduced-motion support
- 9:16, 4:5, and 1:1 browser PNG exports plus native-share fallback
- privacy-safe public share payloads
- optional one-time Stripe premium architecture
- optional derived-story Supabase save
- vendor-neutral keepsake/print model
- optional derived-data AI enrichment
- content-blind product telemetry

### MyYear.World

- manual dated highlights
- locally selected photo metadata
- optional caption/location
- deterministic monthly counts and consecutive-month eras
- story chapters and vertical export
- privacy-safe share manifest excluding captions/locations/photo bytes
- optional derived cloud save

### PetLife

- local pet profile
- memory/milestone timeline
- intentionally namespaced browser persistence
- local delete control
- annual recap and story export
- privacy-safe recap manifest
- optional Supabase household model
- owner/member roles and `can_add_memories`
- hashed one-time seven-day invitations
- permitted shared-memory contribution path

## Architecture

Keep the stack boring:

```text
Next.js App Router
React
TypeScript strict mode
plain CSS
Browser APIs / Web Worker
Vitest
Playwright
GitHub Actions
Vercel

optional only:
Stripe
Supabase
OpenAI
HTTPS telemetry endpoint
```

Not present/required:

- Redis
- Kafka
- Docker/Kubernetes
- microservices
- Python backend
- queue infrastructure
- vector database

See [Platform architecture](docs/PLATFORM_ARCHITECTURE.md).

## External integrations

Optional integrations are intentionally distinguished as:

```text
implemented
configured
verified
```

Code being implemented does not imply a live service is configured. See [External integrations](docs/EXTERNAL_INTEGRATIONS.md).

The free/local product needs no secret.

Copy `.env.example` only when enabling optional capabilities.

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Verification

Fast verification:

```bash
npm run verify
```

Full production gate:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs the clean-checkout equivalent for pull requests.

## Deployment

Vercel project: `threadtales`.

The intended lifecycle is:

```text
feature/production branch
 -> pull request
 -> GitHub Actions
 -> Vercel preview
 -> smoke/privacy verification
 -> explicit merge
 -> production from main
```

Do not promote an unverified feature branch over production. See [Deployment readiness](docs/DEPLOYMENT_READINESS.md).

The current production-activation checkpoint, including whether the latest `main` commit has reached the public URL, is recorded in [Production activation status](docs/PRODUCTION_ACTIVATION_STATUS.md).

## Product roadmap status

- [All phases status](docs/ALL_PHASES_STATUS.md)
- [Product strategy](docs/PRODUCT_STRATEGY_2026.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Privacy architecture](docs/PRIVACY_ARCHITECTURE.md)
- [External integrations](docs/EXTERNAL_INTEGRATIONS.md)
- [Deployment readiness](docs/DEPLOYMENT_READINESS.md)
- [Product decision framework](docs/PRODUCT_DECISION_FRAMEWORK.md)
- [Phase 0 historical status](docs/PHASE_0_STATUS.md)

## Decision discipline

ThreadTales, MyYear and PetLife are the proving products. Relationship Universe, LifeMap, BabyStory, FamilyTree Live, FounderWorld and CreatorWorld remain evidence-gated ideas. Do not build them merely because they exist in the product registry; use the measurable gates in [Product decision framework](docs/PRODUCT_DECISION_FRAMEWORK.md).

## Core principle

Do not weaken the anonymous local ThreadTales pipeline for convenience. Any persistence, payment, telemetry, or AI feature must remain separate, minimized, explicit where content is involved, and accurately documented.
