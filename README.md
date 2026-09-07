# ThreadTales / WorldCore Story Platform

**Turn private digital history into stories worth sharing and keeping.**

ThreadTales is the flagship experience in a broader story-platform codebase. The repository now contains both a privacy-first local analyzer and an optional account-backed SaaS/media layer.

## What is implemented

### ThreadTales
- WhatsApp Android/iOS parsing
- deterministic date-order detection
- strict timestamp/Unicode normalization
- Web Worker large-history processing
- `ThreadTaleResultV2`
- deterministic story composition
- Memory Cinema presentation
- social/image/print foundations
- privacy-safe public sharing
- local-first default: raw chat is not silently uploaded

### Story platform / WorldCore
- reusable world/story contracts
- multiple story-world product configurations
- MyYear and PetLife domain models
- identity/session layer
- Supabase persistence
- world CRUD/import
- profile/onboarding
- private media APIs
- albums and album items
- music/soundtrack metadata
- billing/entitlement adapters
- Stripe server integration
- optional AI enrichment
- privacy-safe telemetry/PulseAtlas instrumentation

## Architecture

```text
PRIVATE THREADTALES FLOW

local chat export
      ↓
browser File API
      ↓
Web Worker
      ↓
parse + analyze
      ↓
ThreadTaleResultV2
      ↓
story / export / share


OPTIONAL ACCOUNT-BACKED FLOW

browser
  ↓
Next.js route handlers
  ↓
identity / authorization
  ↓
platform services
  ↓
Supabase / Stripe / AI / telemetry
```

The local analyzer and cloud platform are intentionally separated. Enabling accounts, persistence, payments or AI must not silently weaken the local privacy boundary.

## Repository map

Start here:

- [End-to-end project structure](docs/PROJECT_STRUCTURE.md)
- [GitHub repository handoff](docs/GITHUB_HANDOFF.md)
- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Privacy architecture](docs/PRIVACY_ARCHITECTURE.md)
- [External integrations](docs/EXTERNAL_INTEGRATIONS.md)
- [Deployment readiness](docs/DEPLOYMENT_READINESS.md)
- [Production activation status](docs/PRODUCTION_ACTIVATION_STATUS.md)
- [All phases status](docs/ALL_PHASES_STATUS.md)
- [Product strategy](docs/PRODUCT_STRATEGY_2026.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)

High-level source layout:

```text
src/
├── app/          # Next.js pages and API routes
├── components/   # UI / Memory Cinema / auth experiences
├── lib/          # shared local utility/domain logic
├── platform/     # identity, persistence, story, billing, media, AI, telemetry
├── products/     # product-specific domain models/config
└── workers/      # local ThreadTales Web Worker

supabase/
├── schema.sql
└── migrations/

tests/
├── unit/
├── e2e/
├── performance/
├── fixtures/
└── helpers/
```

See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the full responsibility map.

## Tech stack

- Next.js App Router
- React
- strict TypeScript
- plain CSS
- browser File API + Web Workers
- Supabase/Postgres
- Stripe
- optional AI provider
- optional telemetry/PulseAtlas
- Vitest
- Playwright
- GitHub Actions
- Vercel

There is no requirement for Redis, Kafka, Docker/Kubernetes, a Python backend or a separate microservice stack for the current product.

## Local development

```bash
git clone https://github.com/rrahul0904/friendship-wrapped.git
cd friendship-wrapped
npm ci
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:performance
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs the clean-checkout production equivalent and additionally verifies client bundles do not contain server-secret identifiers.

## Environment configuration

Use:

```text
.env.example
```

Never commit real secrets.

The optional integration families include:
- Supabase
- Stripe
- AI provider/gateway
- telemetry
- deployment/site settings

The local ThreadTales analyzer remains usable without those external services.

## Database

Versioned database state is checked in under:

```text
supabase/schema.sql
supabase/migrations/
```

The latest SaaS/media migrations include authenticated world/media/album/music persistence plus RLS and index hardening.

## Deployment policy

Canonical repository:

```text
https://github.com/rrahul0904/friendship-wrapped
```

Canonical release flow:

```text
branch
  ↓
pull request
  ↓
exact-head CI
  ↓
Vercel preview
  ↓
browser + runtime verification
  ↓
main
  ↓
production
```

Do not promote authenticated persistence/media changes solely because CI is green. Preview configuration, migrations and runtime behavior must also be verified.

## Current latest integration work

The latest end-to-end SaaS/media implementation is tracked in:

```text
branch: platform-saas-media-live
PR: #13 — Story Platform SaaS + Media OS launch
```

That branch is the newest complete source superset and is already checked into GitHub. Its release remains gated by deployment/environment verification before promotion to `main`.

## Privacy rule

Raw ThreadTales chat content must not silently enter:
- Supabase
- Stripe
- telemetry
- AI
- logs
- public share payloads

Any future content-bearing cloud feature must be explicit, minimized and accurately disclosed.
