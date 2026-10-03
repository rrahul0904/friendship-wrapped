# ThreadTales source-first rebuild — 2026-10-03

## Why this branch exists

The previous implementation drifted from the original Friendship Wrapped thesis into a broad story-platform/SaaS product. This branch is a clean-room product reset. Existing code is not treated as the product specification.

## Original lineage

1. **Your Love Page / personalized emotional web gift pattern**
   - Original project conversation referenced `mrrplanet.com/p/your-love-page`.
   - Current public Your Love Page product: `https://www.yourlovepage.online/`.
   - Product lesson: one recipient, one emotional outcome, highly specific memories, photos/music, instant one-link sharing, and keepsake value.
2. **Wrapped metaphor**
   - Personalized data becomes a sequence of surprising, shareable story moments rather than an analytics dashboard.
3. **Friendship Wrapped / ThreadTales**
   - User-originated product thesis: upload a private chat and turn the history of a friendship/relationship into a visual story.

## Later benchmarks, not origin sources

- Spotify Wrapped — pacing, reveal, shareable moments, recap structure.
- WhatsWrapped / WeSayWhat / Chat Wrapped — direct competitors used to study metric choices, privacy, pair-vs-group behavior, and user complaints.
- Instagram Stories — mobile navigation convention.

## Product contract

ThreadTales is **not** a general story platform. Its core product is:

> Give it one conversation. Get back a personal, emotionally legible story about that relationship, processed locally and worth sending to the other person.

### Golden journey

1. Land on one clear promise.
2. Choose a chat export or launch a demo.
3. The browser reads the conversation locally.
4. A short reveal transition builds anticipation.
5. Enter directly into a full-screen story deck.
6. Every screen contains one idea, one visual hierarchy, and one emotional beat.
7. Pair chats and group chats use different editorial questions.
8. Any chapter can be saved/shared without exposing raw chat.
9. The final screen is a keepsake/recap, not an upsell dashboard.

## Pair chat chapter grammar

1. Cover / names / span of relationship
2. The beginning — when the chat starts
3. Scale — total messages and active days
4. Who reaches first — conversation starters
5. Reply rhythm — median response behavior
6. Staying power — longest streak / longest silence
7. Peak chaos — biggest day / late-night pattern
8. Affection / laughter / questions — measured signals, no psychology claim
9. Balance — how evenly the conversation is carried
10. Timeline — how volume changes over time
11. Local lore — optional repeated phrases, never public by default
12. Closing keepsake

## Group chat chapter grammar

1. Cover / group span
2. Total messages / active days
3. Participation leaderboard
4. Who starts the most conversations
5. Fastest / slowest reply rhythm by participant where available
6. Peak chaos day / time
7. Late-night behavior
8. Laughter / hearts / questions at group level
9. Participation balance
10. Timeline
11. Optional local-only lore
12. Closing keepsake

A group is not a pair deck with more names.

## Privacy contract

- Raw chat is processed in-browser by default.
- No raw messages in telemetry.
- No raw messages in share payloads.
- Participant names and local lore require explicit exposure in any public artifact.
- Core story generation must not require AI or a server call.
- Any future cloud/AI feature is outside the golden journey and separately consented.

## Keep / replace / remove matrix

### Keep as source-neutral infrastructure

- WhatsApp/Telegram parsers
- Web Worker analysis path
- deterministic metrics
- input validation
- raw-chat no-network boundary

### Replace in the core journey

- existing SaaS-style `/create` composition
- pre-story controls and architecture copy
- analytics-grid-first results
- duplicated story/cinematic surfaces
- generic platform navigation in the reveal experience
- old chapter taxonomy when it does not distinguish pair vs group

### Remove from the first-session critical path

- Premium dashboard
- Cloud Save dashboard
- AI enrichment panel
- account/platform/product-world cross-sells
- six-step process explanations
- infrastructure vocabulary

## Acceptance gates

- Demo enters the real story directly.
- Pair and group fixtures produce materially different chapter structures.
- 9:16 mobile-first deck with keyboard/touch navigation.
- No raw-chat network transmission.
- Share/save works per chapter.
- Five first-time users: at least four complete the flow without instruction and can name one chapter they would send to the other person.
- No production promotion from CI alone; exact deployed Preview UAT is required.
