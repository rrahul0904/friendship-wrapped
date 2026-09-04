# ThreadTales — End-to-End Project Structure

> Canonical repository: `rrahul0904/friendship-wrapped`
>
> Product: ThreadTales / WorldCore Story Platform
>
> Current integration branch: `platform-saas-media-live`

## 1. Product architecture

ThreadTales is a privacy-first story platform that turns personal data into visual stories and persistent "worlds".

The platform has two execution modes:

1. **Local-first ThreadTales analysis**
   - WhatsApp exports are read in the browser.
   - Parsing and heavy analytics run in a Web Worker.
   - Raw chat content stays local by default.
   - Only derived results enter story/export/share flows unless the user explicitly opts into a cloud feature.

2. **Account-backed Story Platform**
   - Supabase Auth provides identity and sessions.
   - Supabase/Postgres stores worlds, profiles, media metadata, albums, memberships, entitlements, telemetry and product state.
   - Private media is uploaded through authenticated API routes.
   - Stripe-backed billing and entitlement adapters support paid plans.
   - AI, telemetry and external services are isolated behind platform adapters.

## 2. Top-level repository layout

```text
friendship-wrapped/
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── ALL_PHASES_STATUS.md
│   ├── DEPLOYMENT_READINESS.md
│   ├── EXTERNAL_INTEGRATIONS.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   ├── MEMORY_CINEMA_IMPLEMENTATION.md
│   ├── PHASE_0_STATUS.md
│   ├── PLATFORM_ARCHITECTURE.md
│   ├── PRIVACY_ARCHITECTURE.md
│   ├── PRODUCTION_ACTIVATION_STATUS.md
│   ├── PRODUCT_DECISION_FRAMEWORK.md
│   ├── PRODUCT_STRATEGY_2026.md
│   ├── PULSEATLAS_INSTRUMENTATION.md
│   └── PROJECT_STRUCTURE.md
├── scripts/
│   └── verify-production.mjs
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── platform/
│   ├── products/
│   └── workers/
├── supabase/
│   ├── migrations/
│   └── schema.sql
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   ├── helpers/
│   ├── performance/
│   └── unit/
├── proxy.ts
├── next.config.ts
├── playwright.config.ts
├── vitest.config.ts
├── vitest.performance.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

## 3. Application layer

`src/app/` is the Next.js App Router surface.

### Consumer pages

The application contains:
- landing and product discovery
- create/import experiences
- results and cinematic Memory Cinema experiences
- account/profile areas
- login/register/password recovery/onboarding
- product/world experiences
- sharing surfaces
- privacy and product information

### API routes

`src/app/api/` contains the server boundary.

Major route families include:

```text
api/
├── ai/
│   └── enrich/
├── albums/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── items/
├── auth/
│   ├── login/
│   ├── logout/
│   ├── magic-link/
│   ├── recover/
│   ├── register/
│   └── update-password/
├── checkout/
├── entitlements/
├── integrations/
│   ├── status/
│   └── stripe-preview-smoke/
├── media/
│   ├── route.ts
│   └── [id]/
├── music/
├── petlife/
│   ├── invites/
│   ├── members/
│   └── memories/
├── profile/
├── stories/
├── telemetry/
├── worlds/
│   ├── route.ts
│   ├── import/
│   └── [id]/
│       └── tracks/
└── webhooks/
```

Rules:
- raw ThreadTales chat must not be posted to a server in the default analyzer flow;
- server secrets are isolated to server modules/routes;
- authorization is enforced at route and database policy boundaries;
- browser bundles must not contain server secret identifiers.

## 4. Local-first ThreadTales engine

The local analyzer is intentionally separated from cloud persistence.

```text
local .txt export
      ↓
File.arrayBuffer()
      ↓
transferable browser buffer
      ↓
src/workers/threadtales.worker.ts
      ↓
parse + normalize + analyze
      ↓
ThreadTaleResultV2
      ↓
story composition
      ↓
UI / export / privacy-safe share
```

Key modules live under:

```text
src/platform/threadtales/
├── lore.ts
├── result-v2.ts
└── worker-client.ts
```

Worker entry point:

```text
src/workers/threadtales.worker.ts
```

The local-first boundary is part of the product contract, not an implementation accident.

## 5. Story engine

Shared story composition lives under:

```text
src/platform/story/
├── compose.ts
├── modes.ts
└── themes.ts
```

Responsibilities:
- convert derived product data into deterministic story chapters;
- keep rendering logic separate from business logic;
- support multiple relationship/product modes;
- expose theme metadata;
- avoid unsupported psychological claims;
- feed cinematic UI, export and sharing surfaces from one source of truth.

## 6. WorldCore/platform layer

`src/platform/` is the reusable platform boundary.

Major domains include:

```text
platform/
├── ai/
├── billing/
├── identity/
├── integrations/
├── media/
├── persistence/
├── print/
├── story/
├── telemetry/
├── threadtales/
├── worlds/
└── types.ts
```

### Identity
- Supabase-backed account/session integration
- secure cookie helpers
- server-side session resolution
- login/logout/register/recovery support

### Persistence
- configuration helpers
- Supabase REST wrapper
- authenticated CRUD for worlds/media/profile/albums/music

### Billing
- plan catalog
- subscription helpers
- Stripe integration through server routes/adapters
- entitlement evaluation

### Media
- local and remote/private media abstractions
- metadata persistence
- authenticated asset routes

### Telemetry
- privacy-safe product events
- PulseAtlas portfolio instrumentation
- no raw chat/message content in telemetry payloads

### Print/export
- printable ThreadTales book/story artifacts
- deterministic derived content

## 7. Product layer

`src/products/` contains product-specific domain models rather than duplicating the platform.

Current domain models include:

```text
products/
├── myyear/
│   └── model.ts
├── petlife/
│   └── model.ts
└── worlds/
    └── config.ts
```

The broader product catalog represented by the app includes the ThreadTales/WorldCore family:
- Friendship Wrapped / ThreadTales
- MyYear.World
- PetLife
- Relationship Universe
- BabyStory
- HomeStory
- LifeMap
- FamilyTree Live
- FounderWorld
- CreatorWorld

Product code should reuse platform identity, media, billing, persistence, story, telemetry and world contracts.

## 8. Database layer

Supabase/Postgres is managed through checked-in SQL.

```text
supabase/
├── schema.sql
└── migrations/
    ├── 20260831_product_events.sql
    ├── 20260902_full_platform_live.sql
    ├── 20260903_saas_media_os.sql
    ├── 20260903_security_and_fk_indexes.sql
    └── 20260904_saas_media_hardening.sql
```

Database responsibilities include:
- user/profile-linked world ownership;
- world membership;
- media metadata;
- albums and album items;
- music/soundtrack associations;
- subscriptions/entitlements where enabled;
- product/telemetry state;
- RLS policies and FK/index hardening.

Security rules:
- authenticated data is scoped to its owner/member relationship;
- RLS remains enabled for private tables;
- migrations are additive, versioned and committed;
- application code must not rely on a service-role secret in the browser.

## 9. Authentication and request protection

`proxy.ts` is the request-level guard for protected account/product surfaces.

Authentication pages/routes include:
- login
- registration
- magic link
- email confirmation
- password recovery
- password reset
- onboarding
- logout

The frontend must not treat UI visibility as authorization. Backend routes and RLS remain authoritative.

## 10. Billing and entitlements

Billing is isolated under platform/server boundaries.

Responsibilities:
- public plan definitions;
- Stripe Checkout/payment/subscription integration;
- webhook verification;
- entitlement materialization;
- route-level feature checks;
- preview smoke verification.

No Stripe secret may enter client bundles.

## 11. Media OS

The latest SaaS/media layer adds:
- private media CRUD;
- album CRUD;
- album-item management;
- soundtrack/music metadata;
- world-linked media;
- authenticated persistence;
- onboarding/profile flows.

The media system should remain storage-provider adaptable and keep database records separate from binary-object storage.

## 12. Testing structure

```text
tests/
├── e2e/
│   ├── memory-cinema.spec.ts
│   ├── parity.spec.ts
│   ├── threadtales.spec.ts
│   └── world-products.spec.ts
├── fixtures/
│   └── whatsapp/
├── helpers/
│   └── synthetic-chat.ts
├── performance/
│   └── large-history.perf.test.ts
├── pulseatlas-telemetry.test.ts
└── unit/
    ├── ai-intents.test.ts
    ├── analyze.test.ts
    ├── entitlement-route.test.ts
    ├── import-validation.test.ts
    ├── importer-lore.test.ts
    ├── integration-status.test.ts
    ├── media-memorial.test.ts
    ├── myyear-calendar-import.test.ts
    ├── parity-story.test.ts
    ├── parser.test.ts
    ├── petlife-household-security.test.ts
    ├── platform-story.test.ts
    ├── product-models.test.ts
    ├── security-integrations.test.ts
    ├── share.test.ts
    ├── stripe-preview-smoke.test.ts
    ├── stripe-webhook-route.test.ts
    ├── telemetry-route.test.ts
    └── worker-client.test.ts
```

The production CI gate is:

```text
npm ci
  ↓
lint
  ↓
typecheck
  ↓
unit tests
  ↓
large-history performance regression
  ↓
production build
  ↓
client-bundle secret identifier verification
  ↓
Playwright Chromium
  ↓
browser smoke tests
```

## 13. Environment configuration

`.env.example` is the contract for external configuration.

Expected integration families include:
- Supabase
- Stripe
- AI provider/gateway
- telemetry/PulseAtlas
- site/deployment configuration

Rules:
- never commit real secrets;
- server-only values must not use `NEXT_PUBLIC_`;
- deployment environments should be separated into development, preview and production;
- missing optional integrations should fail closed or degrade gracefully.

## 14. Production verification

`scripts/verify-production.mjs` is the production verification entry point.

Production release order:

```text
GitHub branch
  ↓
exact-head CI
  ↓
Vercel Preview
  ↓
browser/runtime verification
  ↓
merge to main
  ↓
production deployment
  ↓
canonical-domain verification
  ↓
runtime/error review
```

Do not equate "code is in GitHub" with "production is verified".

## 15. Development commands

```bash
npm ci
npm run dev
```

Core verification:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:performance
npm run build
npm run test:e2e
```

Production verification uses the checked-in script and environment contract documented in the repository.

## 16. Git workflow

Canonical repository:

```text
https://github.com/rrahul0904/friendship-wrapped
```

Default branch:

```text
main
```

Current latest end-to-end integration branch:

```text
platform-saas-media-live
```

PR:
```text
#13 — Story Platform SaaS + Media OS launch
```

The branch contains the latest complete superset of the application. It must only be promoted to `main` after its deployment gate is satisfied because it changes authenticated persistence/media behavior.

## 17. Definition of "end-to-end complete"

Repository-level completeness requires all of the following to exist in source control:
- product UI;
- browser-local ThreadTales engine;
- story/rendering platform;
- product/world models;
- authentication;
- API routes;
- persistence adapters;
- database schema/migrations;
- media/albums/music;
- billing/entitlements;
- external integration adapters;
- privacy/telemetry controls;
- CI;
- unit/E2E/performance tests;
- environment example;
- deployment verification;
- architecture/status documentation.

This repository now contains those layers.

Production completeness is a separate gate and requires configured external services plus successful preview/production verification.
