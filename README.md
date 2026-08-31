# ThreadTales (friendship-wrapped)

**Your chats, turned into a story.**

ThreadTales turns a WhatsApp text export into a visual relationship story while keeping raw chat content in the browser during the free flow.

## Architecture

The free product is intentionally client-heavy:

1. The `.txt` export is opened with the browser File API.
2. Parsing and deterministic analytics run locally.
3. Raw chat content is not uploaded, persisted, logged, or sent to an AI model.
4. Optional share links contain a separate derived-stat snapshot only.
5. No account, database, payment provider, or backend secret is required for the free flow.

See [Phase 0 privacy architecture](docs/PRIVACY_ARCHITECTURE.md) for the implemented data boundary.

## Live deployment

Vercel project: `threadtales`  
Current production URL: `https://threadtales-five.vercel.app`

Production currently predates the Phase 0 branch. See [Phase 0 status](docs/PHASE_0_STATUS.md) for verification and deployment synchronization state.

## Product and implementation docs

- [Product strategy](docs/PRODUCT_STRATEGY_2026.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Multi-product platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Phase 0 status](docs/PHASE_0_STATUS.md)
- [Phase 0 privacy architecture](docs/PRIVACY_ARCHITECTURE.md)
- [Codex Phase 0 implementation prompt](docs/CODEX_PHASE_0_IMPLEMENTATION_PROMPT.md)

## Current features

- WhatsApp Android and iOS text export parsing
- US (`MM/DD`) and international (`DD/MM`) date modes
- 12-hour and 24-hour timestamps
- multiline message support
- message and word counts
- participant message split
- first/last date and active-day span
- longest streak and quiet period
- busiest day, peak hour, favorite weekday, and daypart activity
- reply-speed and conversation-start metrics
- question, laughter, heart, and media signals
- top words and year-by-year timeline
- deterministic vibe scores
- privacy-safe derived-stat share links
- participant names and top words excluded from public links by default
- built-in sample chat/demo
- mobile-responsive UI
- automated parser, analytics, privacy, and browser smoke coverage

## Tech stack

- Next.js App Router
- React + TypeScript (`strict`)
- plain CSS
- browser File APIs
- Vitest
- Playwright
- GitHub Actions
- Vercel deployment target

## Local development

Use the committed lockfile:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Verification

Fast pre-commit verification:

```bash
npm run verify
```

This runs lint, strict TypeScript checking, and unit tests.

Production and browser checks:

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

On Linux/CI, Playwright browser dependencies can be installed with:

```bash
npx playwright install --with-deps chromium
```

GitHub Actions runs the complete clean-checkout sequence:

```text
npm ci
-> lint
-> typecheck
-> unit tests
-> production build
-> Chromium smoke tests
```

## Vercel deployment model

The intended production model is Vercel Git integration with `main` as the production branch and pull-request/feature branches as previews. Phase 0 itself requires no server secret.

`NEXT_PUBLIC_SITE_URL` can be set to the canonical deployed URL for metadata/robots/sitemap behavior. It does not contain imported data.

Do not promote an unverified branch to production. Merge only after Phase 0 CI is green, then deploy the exact merged commit through the existing `threadtales` Vercel project.

## Privacy principle

Do not convert the raw-chat local-only pipeline into a silent server upload. Future persistence, payment, telemetry, or AI features must preserve the default free-flow boundary or introduce a separate explicit consent model.
