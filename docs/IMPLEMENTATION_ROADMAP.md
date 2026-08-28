# ThreadTales / Story Platform — Phase-by-Phase Implementation Roadmap

## Delivery philosophy

The implementation should stay deliberately simple:

- one GitHub repository;
- one Next.js application;
- Vercel as the default deployment target;
- browser-side processing wherever possible;
- no account before first value;
- no database until a feature genuinely requires persistence;
- no AI in the critical path;
- no microservices;
- no infrastructure that cannot be explained in one diagram.

Every phase must end in a deployable, testable product state. A later phase should not be required to make an earlier phase usable.

---

# Phase 0 — Production Baseline and Architecture Cleanup

## Goal

Turn the current working prototype into a stable foundation without changing the product promise.

## Scope

### Repository structure

Refactor gradually toward:

```text
src/
  app/
  products/
    threadtales/
  platform/
    importers/
    analytics/
    stories/
    sharing/
    exports/
  components/
```

Do not create empty framework folders unless code is actually being moved into them.

### Code quality

- establish strict TypeScript configuration;
- remove implicit `any` and fragile type casts;
- centralize shared domain types;
- establish error/result types for parsing and analysis;
- keep pure analysis code independent from React;
- separate sample/demo data from production parsing logic.

### Testing

Add:

- unit tests for parser behavior;
- unit tests for analytics calculations;
- fixtures for common WhatsApp iOS/Android formats;
- multiline message tests;
- locale/date ambiguity tests;
- malformed-file tests;
- large synthetic-chat tests;
- Playwright smoke test for landing -> demo -> results;
- Playwright smoke test for file import -> result when browser fixture upload is practical.

### CI

On pull request / push:

```text
install
-> lint
-> typecheck
-> unit tests
-> build
-> critical browser smoke test
```

Keep deployment through Vercel Git integration.

### Privacy hardening

- verify raw chat text never enters a server action or API route;
- verify analytics/event logging never contains message content;
- add a developer privacy document explaining the local pipeline;
- add user-visible privacy copy immediately before file import;
- clear raw in-memory state when analysis is reset;
- avoid storing imported raw text in localStorage/sessionStorage.

## Acceptance criteria

- `npm run build` succeeds cleanly;
- lint/typecheck/tests are green;
- supported fixture formats parse deterministically;
- malformed input fails with useful user-facing messages;
- raw chat never leaves the browser during the normal free flow;
- production deployment remains functional on Vercel.

## Do not add in Phase 0

- database;
- authentication;
- Stripe;
- AI;
- background jobs;
- new products.

---

# Phase 1 — ThreadTales Import and Analytics Engine V2

## Goal

Make importing real-world chats highly reliable and capable of handling large histories without freezing the page.

## Scope

### Import abstraction

Create a small adapter contract:

```ts
interface ChatImporter {
  canHandle(input: ImportInput): boolean;
  parse(input: ImportInput, options: ParseOptions): Promise<ParseResult>;
}
```

Implement:

- WhatsApp text importer;
- `.zip` wrapper support where practical without sending the file to a server;
- explicit date-format selection/detection;
- clear unsupported-format errors.

### Web Worker

Move expensive work into a worker:

```text
main UI
  -> read file
  -> worker parses
  -> worker analyzes
  -> sends derived result
  -> UI renders story
```

The main thread should remain responsive during large imports.

### Analytics V2

Keep calculations deterministic.

Core metrics:

- total messages;
- total words;
- participant split;
- active days;
- first/last message date;
- longest streak;
- busiest day;
- peak hour;
- favorite weekday;
- late-night activity;
- questions;
- laughter signals;
- heart signals;
- media/system-message signals;
- top words;
- yearly/monthly activity;
- response-gap distribution where data makes the calculation defensible;
- conversation-balance patterns.

Avoid pseudo-scientific relationship claims.

### Result schema versioning

Introduce a versioned derived result:

```ts
interface ThreadTaleResultV2 {
  schemaVersion: 2;
  generatedAt: string;
  source: "whatsapp" | "telegram" | "other";
  range: { start: string; end: string };
  participants: DerivedParticipant[];
  metrics: DerivedMetrics;
  timeline: DerivedTimelinePoint[];
}
```

Public share data must use a separate smaller schema.

## Acceptance criteria

- large supported chats do not visibly lock the UI;
- fixture coverage includes common iOS and Android exports;
- all deterministic metrics are covered by tests;
- parser error messages explain how to recover;
- derived result can evolve independently from raw parser internals.

---

# Phase 2 — Story Engine and Viral Export Loop

## Goal

Turn analytics into something people actively want to send to another person or post publicly.

This phase is more important to product success than adding dozens of new statistics.

## Scope

### Story model

Build a rendering-neutral story definition:

```ts
interface StoryChapter {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  metric?: string | number;
  supportingText?: string;
  privacyLevel: "safe" | "sensitive";
  renderVariant: string;
}
```

Analytics creates facts. A deterministic story composer decides which facts become chapters.

### Core story sequence

Example:

1. cover;
2. "your story began";
3. total conversation scale;
4. message balance;
5. longest streak;
6. busiest day;
7. late-night chapter;
8. shared vocabulary/laughter;
9. yearly evolution;
10. closing card.

### Export renderer

One export engine should support at least:

- 9:16 vertical social card;
- 1:1 social card;
- high-resolution PNG;
- multi-page PDF later from the same chapter definitions.

Prefer SVG/canvas/browser rendering before introducing server-side image generation.

### Native sharing

Where supported:

- Web Share API;
- download image;
- copy share link;
- platform-specific guidance for Instagram/TikTok when direct posting is unavailable.

### Public share manifest

Public output should contain only approved derived information.

Example:

```ts
interface ThreadTaleShareManifest {
  version: 1;
  title?: string;
  cards: PublicStoryCard[];
  attribution: boolean;
}
```

No raw messages.

No hidden participant names.

No top words or quoted text unless explicitly selected.

### Growth attribution

Privacy-safe tracking:

- share created;
- share opened;
- CTA clicked;
- recipient create started.

No imported content in telemetry.

## Acceptance criteria

- user can generate a polished vertical export in-browser;
- exported card looks intentionally designed on mobile;
- free card contains tasteful ThreadTales attribution;
- recipient can go from shared result to "Make yours" in one action;
- public data schema contains no raw source content.

---

# Phase 3 — Occasion Modes

## Goal

Make ThreadTales useful throughout the year instead of only as a December "wrapped" novelty.

## Initial modes

- Best Friends;
- Birthday;
- Anniversary;
- Long Distance;
- Graduation / Group Chat;
- Year Together.

## Architecture

Do not fork the application per occasion.

Use configuration:

```ts
interface StoryMode {
  id: string;
  chapterPriority: string[];
  copyTone: string;
  theme: string;
  recommendedExports: string[];
}
```

The same analytics result can generate a different narrative order and theme.

## Product changes

- mode picker after import or before results;
- mode-specific cover/title;
- mode-specific chapter ordering;
- event-specific landing pages;
- event-specific SEO metadata;
- share card CTA tuned to the occasion.

## Acceptance criteria

- each mode uses the same underlying metrics;
- no duplicate parser/analytics code;
- each mode feels meaningfully different in story structure/design;
- landing pages can be indexed independently.

---

# Phase 4 — First Monetization: One-Time Premium Artifacts

## Goal

Test willingness to pay without introducing a subscription or mandatory account.

## Product model

Free analysis remains valuable.

Premium unlocks better artifacts.

### Premium candidates

- premium theme pack;
- branding removal;
- high-resolution full story export;
- PDF keepsake;
- custom title/date cover;
- extra story layouts;
- premium occasion template.

## Technical architecture

Add Stripe only here.

Flow:

```text
result
 -> premium preview
 -> Stripe Checkout
 -> secure callback/webhook
 -> signed entitlement
 -> premium export unlocked
```

The secure verification path must be server-side.

Do not trust a query parameter saying payment succeeded.

### Accountless entitlement

For the first monetization experiment, support a simple purchase reference tied to:

- Stripe checkout/customer identity;
- signed entitlement token or server lookup;
- email-based recovery path if needed.

Do not require a user to create a password before purchasing a one-time export.

## Acceptance criteria

- successful payment reliably unlocks premium export;
- refresh/revisit has a documented entitlement recovery path;
- failed/cancelled checkout never unlocks premium;
- no card/payment secrets enter client code;
- free product is not artificially crippled.

---

# Phase 5 — Optional Accounts and Saved Derived Stories

## Goal

Introduce persistence only for users who ask for it.

This is the point where the platform can add a backend provider.

## Recommended provider

Use Supabase for:

- Postgres;
- authentication;
- storage.

Keep provider-specific code behind adapters.

## Key rule

**Do not upload raw ThreadTales chats for ordinary saved stories.**

Persist:

- derived story result;
- story mode/theme selection;
- public share manifest;
- purchase entitlement;
- generated export metadata.

## Core data model

```text
users
worlds
story_runs
share_manifests
entitlements
media_assets
```

For ThreadTales, `story_runs` stores derived results only.

## Auth UX

Account creation should be offered after value:

- "Save this story";
- "Access premium purchase on another device";
- "Create another product world".

Prefer passwordless/magic-link or simple OAuth choices over a large registration form.

## Security

- row-level security on user-owned tables;
- private storage by default;
- signed access for private assets;
- service-role secrets server-side only;
- public share manifests separate from private records;
- deletion workflow.

## Acceptance criteria

- anonymous free flow still works;
- account user can save and reopen derived story;
- user A cannot access user B's private records;
- deleting a story removes its private saved representation;
- public link reveals only the manifest.

---

# Phase 6 — Premium PDF and Print-Ready Keepsake

## Goal

Move from disposable social novelty to a product someone can give or keep.

## Scope

### PDF

Generate a polished storybook PDF from the same story chapters used by web/social rendering.

Include:

- cover;
- selected chapters;
- timeline pages;
- optional user-written dedication;
- custom date range;
- ending page.

### Print preparation

Create an internal print document model independent from any fulfillment vendor.

```ts
interface PrintBookSpec {
  trimSize: string;
  pages: PrintPage[];
  cover: PrintCover;
  bleed: number;
}
```

Do not deeply couple product code to a print vendor.

## Acceptance criteria

- PDF can be generated from a ThreadTale without raw messages;
- print layout validates required dimensions/bleed;
- user sees a preview before ordering;
- print fulfillment can later be swapped behind an adapter.

---

# Phase 7 — MyYear.World MVP

## Goal

Prove that shared platform primitives work for a second consumer product.

Do not begin with connector complexity.

## MVP input

- selected photos;
- manual title/highlights;
- optional date/location metadata available in imported images;
- optional calendar file/import only if straightforward.

## MVP output

- year timeline;
- months/eras;
- locations from available metadata;
- favorite moments selected by user;
- social recap cards;
- cinematic-style sequence definition;
- private saved year for signed-in users.

## Shared platform reuse

Reuse:

- StoryEvent model;
- media layer;
- story chapter renderer;
- export renderer;
- share manifest;
- billing/entitlement layer;
- identity/persistence.

## Acceptance criteria

- MyYear is not implemented as a copy of ThreadTales;
- shared primitives are extracted only where both products genuinely need them;
- ThreadTales remains unaffected by MyYear persistence requirements;
- one Vercel deployment serves both product experiences.

---

# Phase 8 — PetLife MVP

## Goal

Test recurring usage and annual subscription/keepsake economics.

## Core objects

```text
pet
household
memory/event
media
milestone
story/recap
share manifest
```

## MVP features

- create pet profile;
- add photo + memory;
- add milestone/date;
- browse timeline;
- invite household member;
- create annual recap;
- export/share recap;
- private-by-default storage.

## Monetization test

Test:

- free starter tier;
- annual private archive plan;
- annual book/video add-ons.

Do not add complex health tracking or veterinary integrations in MVP.

## Acceptance criteria

- repeat visits make sense even without an annual recap;
- household permissions are enforced;
- annual recap reuses the shared story/export engine;
- storage economics are measured.

---

# Phase 9 — Platform Consolidation

## Goal

Only after three products exist, formalize common platform modules.

## Extract proven shared capabilities

Likely:

- identity/households;
- event normalization;
- media storage;
- story composition;
- rendering/export;
- sharing;
- billing/entitlements;
- privacy/consent;
- product registry.

## Do not over-generalize

Product-specific logic remains under each product.

Example:

```text
products/threadtales/analytics
products/myyear/photo-selection
products/petlife/milestones
```

Shared modules should not contain giant `if (product === ...)` branches.

## Acceptance criteria

- each product has a clear boundary;
- shared modules have multiple real consumers;
- deployment remains one Next.js application;
- onboarding and navigation make product boundaries clear.

---

# Phase 10 — Optional AI Story Enrichment

## Goal

Use AI only where it creates obvious incremental value.

## Good AI uses

- chapter-title suggestions;
- recap summaries;
- user-approved memory captions;
- interview/story editing;
- video narration scripts;
- optional thematic clustering.

## ThreadTales constraint

Raw chat content must not silently leave the device.

Possible approaches:

### A. Derived-data AI

Send only derived metrics and user-selected snippets.

Lowest privacy risk.

### B. Explicit raw-content opt-in

User explicitly chooses an AI narrative feature and is told that selected content will be processed remotely.

### C. On-device model later

Only if browser/device capabilities make the experience reliable enough.

## Acceptance criteria

- AI feature is not required for deterministic core product;
- consent screen is explicit;
- data sent to AI is inspectable/understandable;
- AI failures do not break the core story;
- generated text is editable before publishing/exporting.

---

# Phase 11 — Remaining Product Decisions

Do not implement the remaining registry sequentially just because they exist.

Use evidence from the first three products.

## Candidates

### Relationship Universe

Build if:

- ThreadTales couples/anniversary mode converts strongly;
- users ask to add photos/trips/songs and maintain an ongoing world.

### BabyStory

Build if:

- PetLife validates household collaboration + memory retention;
- family audience acquisition is working.

### FamilyTree Live

Build if:

- family collaboration and voice/story preservation show strong demand;
- long-term archive trust is established.

### LifeMap

Build when:

- connector infrastructure is justified;
- users already value MyYear and request a multi-year persistent view.

### FounderWorld / CreatorWorld

Treat as separate GTM experiments even if they reuse internal engine code.

Do not surface them in the same consumer navigation unless there is a clear brand reason.

---

# Simple Production Stack by Phase

| Capability | Early choice | Add when |
| --- | --- | --- |
| Web app | Next.js + React + TypeScript | Already present |
| Styling | Plain CSS / CSS modules | Already present |
| Hosting | Vercel | Already present |
| Raw chat processing | Browser + Web Worker | Phase 1 |
| Unit testing | Vitest | Phase 0 |
| Browser testing | Playwright | Phase 0 |
| Social image export | Browser SVG/Canvas | Phase 2 |
| Payments | Stripe Checkout | Phase 4 |
| Database | Supabase Postgres | Phase 5 |
| Auth | Supabase Auth | Phase 5 |
| Media | Supabase Storage | Phase 5/7 |
| Email | Add provider only when invites/receipts need it | Later |
| Background jobs | Add only for long video/print work | Later |
| AI | Server-side provider wrapper | Phase 10 |

---

# Deployment Model

Keep deployment this simple:

```text
GitHub main
    ↓
Vercel build
    ↓
production
```

Preview branch/PR:

```text
GitHub PR
    ↓
Vercel Preview
    ↓
Playwright/smoke verification
    ↓
merge
```

When Supabase is introduced:

```text
Next.js/Vercel
  ├── browser-local raw processing
  ├── server actions for secure billing/persistence operations
  └── Supabase for opt-in persistent data
```

There should still be no separately operated backend service.

---

# Product Analytics Without Violating Trust

Track product behavior, not personal content.

Allowed examples:

- import source type;
- approximate file-size bucket;
- parse success/failure reason code;
- message-count bucket;
- result viewed;
- export type;
- share initiated;
- checkout conversion;
- product/occasion mode.

Never log:

- raw message text;
- participant names;
- phone numbers;
- top words;
- quoted memories;
- uploaded raw file contents.

---

# Definition of Done for Every Phase

A phase is not complete because code exists.

Each phase must have:

1. user-visible working flow;
2. tests for critical logic;
3. Vercel deployment verification;
4. privacy/security review appropriate to that phase;
5. basic analytics for the new funnel step;
6. updated documentation;
7. rollback path;
8. no known blocker that makes the phase unusable on production.

---

# Immediate Implementation Order

The next engineering work should follow this exact sequence:

```text
1. Phase 0 — tests + architecture cleanup + privacy verification
2. Phase 1 — parser/analytics worker + reliability
3. Phase 2 — export/share engine
4. Phase 3 — occasion modes
5. Phase 4 — one-time premium payment test
6. Phase 5 — optional accounts/persistence
7. Phase 6 — keepsake PDF/print
8. Phase 7 — MyYear.World
9. Phase 8 — PetLife
10. Phase 9+ only after metrics justify it
```

The core discipline is simple: **ship the smallest architecture that can prove the next business assumption.**
