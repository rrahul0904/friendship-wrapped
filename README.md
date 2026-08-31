# ThreadTales (friendship-wrapped)

**Your chats, turned into a story.**

ThreadTales turns a WhatsApp text export into a visual relationship story while keeping the raw chat in the browser.

## Current architecture

Production Phase 1 moves expensive parsing and analytics into a dedicated browser Web Worker:

```text
local .txt -> transferable browser buffer -> Web Worker -> derived Result V2 -> UI -> optional derived share hash
```

Raw message text is not uploaded to ThreadTales. The public share format is a separate derived-only schema; names and top words are excluded by default.

## Documentation

- [Product strategy](docs/PRODUCT_STRATEGY_2026.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Platform architecture](docs/PLATFORM_ARCHITECTURE.md)
- [Phase 0 production baseline](docs/PHASE_0_STATUS.md)
- [Phase 1 large-history status](docs/PHASE_1_STATUS.md)
- [Privacy architecture](docs/PRIVACY_ARCHITECTURE.md)
- [Performance baseline](docs/PERFORMANCE_BASELINE.md)

## Free analyzer capabilities

- WhatsApp Android and iOS text export parsing
- deterministic MM/DD vs DD/MM detection with manual override
- 12-hour/24-hour timestamps, seconds, multiline and Unicode normalization
- browser Web Worker processing for responsive large-history analysis
- versioned `ThreadTaleResultV2` derived-data contract
- participant/activity/reply/top-word/year/month/vibe analytics
- privacy-safe public share links
- built-in sample chat
- recoverable cancellation, reset and superseding imports
- mobile-responsive UI

## Tech stack

- Next.js App Router
- React + strict TypeScript
- plain CSS
- browser File APIs + Web Workers
- Vitest + Playwright
- GitHub Actions
- Vercel deployment target
- no database/auth/AI requirement for the free analyzer

## Run locally

```bash
npm ci
npm run dev
```

## Verify

Fast verification:

```bash
npm run verify
```

Large-history CPU baseline:

```bash
npm run test:performance
```

Full browser/production verification:

```bash
npm run build
npx playwright install chromium
npm run test:e2e
```

## Current guardrails

The current main-thread-free analyzer still enforces a 15 MB input guard. Phase 1 does not implement streaming parsing, accounts, persistence, payments, AI, or additional chat providers.

Any future cloud/AI feature that needs message content must be separately disclosed and explicit opt-in; it must not silently weaken the browser-local default.
