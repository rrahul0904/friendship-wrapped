# ThreadTales (friendship-wrapped)

**Your chats, turned into a story.**

V1 turns a WhatsApp text export into a visual friendship story while keeping the raw chat entirely in the browser.

## Why this architecture

The cheapest architecture is also the strongest privacy story:

1. The `.txt` export is opened with the browser File API.
2. Parsing and analytics happen client-side.
3. No raw chat is uploaded, persisted, logged, or sent to an AI model.
4. Share links contain a compact base64url-encoded JSON snapshot of derived statistics only.
5. A database is not required for the free V1.

This means the static/client-heavy workload scales extremely well on Vercel with almost no backend cost.

## Live deployment

Vercel project: `threadtales`  
Live URL: `https://threadtales-five.vercel.app`

The first Vercel production build completed successfully with Next.js 16.3.3 and TypeScript checks.

## Product strategy and implementation

- [Product strategy, business model, architecture, monetization and go-to-market](docs/PRODUCT_STRATEGY_2026.md)
- [Phase-by-phase implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Multi-product platform architecture](docs/PLATFORM_ARCHITECTURE.md)

Current implementation priority: **ThreadTales reliability -> share/export loop -> premium artifacts -> optional persistence -> MyYear.World -> PetLife.**

## V1 features

- WhatsApp Android and iOS text export parsing
- US (`MM/DD`) and international (`DD/MM`) date modes
- Multiline message support
- Message and word counts
- Participant message split
- First/last date and active-day span
- Longest daily messaging streak
- Peak hour and favorite weekday
- Late-night message count
- Question, laughter, heart, and media signals
- Top words (local result)
- Year-by-year timeline
- Deterministic vibe scores
- Privacy-safe share links
- Participant names and top words excluded from public links by default
- Built-in sample chat/demo
- Mobile responsive UI
- SEO basics, sitemap, robots

## Tech stack

- Next.js App Router
- React + TypeScript
- Plain CSS (zero UI framework dependency)
- Vercel deployment target
- No database for V1
- No raw file storage
- No AI dependency for the free analyzer

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

Import the GitHub repository into Vercel or run:

```bash
vercel
```

Set:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

## Product roadmap

### V1.1
- More export formats (Telegram, iMessage via normalized import, Instagram data export)
- Client-side Web Worker for very large chats
- Better language-aware stop words
- Downloadable social cards
- Custom themes

### V1.2 paid
- One-time premium themes
- Video recap export
- Password-protected saved stories
- Optional cloud persistence of derived stats
- Stripe checkout

### V2 opt-in AI
- Story chapters and relationship eras
- Inside-joke clustering
- Topic evolution
- Emotional highlights

AI enrichment must be explicit opt-in because message content would need to leave the browser unless an on-device model is used.

## Privacy principle

Do not convert the raw-chat local-only pipeline into a silent server upload. Any future cloud or AI feature must be separately disclosed and opt-in.
