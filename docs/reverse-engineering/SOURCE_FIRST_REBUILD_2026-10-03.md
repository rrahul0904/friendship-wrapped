# ThreadTales source-first rebuild — 2026-10-03

## Why this branch exists

The previous implementation drifted from the original Friendship Wrapped thesis into a broad story-platform/SaaS product. This branch is a clean-room product reset. Existing code is not treated as the product specification.

## Original lineage

1. **Your Love Page / personalized emotional web gift pattern**
   - Original project conversation referenced `mrrplanet.com/p/your-love-page`.
   - Current public Your Love Page product: `https://www.yourlovepage.online/`.
   - Product lesson: one recipient, one emotional outcome, highly specific memories, photos/music, instant one-link sharing, and keepsake value.
   - Current Love Wrapped is described as nine interactive chapters built from personal moments/numbers, places, photos, qualities, inside jokes, a song, and a final letter. It uses one-time permanent publishing rather than a subscription-first funnel.
2. **Wrapped metaphor**
   - Personalized data becomes a sequence of surprising, shareable story moments rather than an analytics dashboard.
3. **Friendship Wrapped / ThreadTales**
   - User-originated product thesis: upload a private chat and turn the history of a friendship/relationship into a visual story.

## Later benchmarks, not origin sources

- Spotify Wrapped — pacing, reveal, shareable moments, recap structure.
- WhatsWrapped / WeSayWhat / Chat Wrapped — direct competitors used to study metric choices, privacy, pair-vs-group behavior, and user complaints.
- Instagram Stories — mobile navigation convention.

See `SOURCE_EVIDENCE_MATRIX_2026-10-03.md` for source-by-source findings and the keep/replace/remove matrix.

## Product contract

ThreadTales is **not** a general story platform. Its core product is:

> Give it one conversation. Get back a personal, emotionally legible story about that relationship, processed locally and worth sending to the other person.

### Golden journey

1. Land on one clear promise.
2. Choose a chat export or launch a demo.
3. The browser reads the conversation locally.
4. Enter directly into a full-screen story deck.
5. Every screen contains one measured idea and one emotional beat.
6. Pair chats and group chats use different editorial questions.
7. Every story is exactly twelve beats in the current focused candidate.
8. Any chapter can be saved/shared without exposing raw chat.
9. The chapters intentionally change atmosphere as the story progresses; the deck must not feel like one analytics card repeated twelve times.
10. The final screen is a keepsake/recap, not an upsell dashboard.

## Pair chat chapter grammar

1. Cover / names / span of relationship
2. The beginning — when the chat starts
3. Scale — total messages and active days
4. Who reaches first — conversation starters
5. Reply rhythm — median response behavior
6. Staying power — longest active-day streak
7. Longest silence
8. Peak chaos — biggest day / favorite day / peak hour
9. Signals — hearts / laughter / questions / late-night messages
10. Balance — how evenly the conversation is carried
11. Timeline — how volume changes over time
12. Closing keepsake

## Group chat chapter grammar

1. Cover / group span
2. First day
3. Total messages / active days
4. Participation leaderboard / cast
5. Who starts the most conversations
6. Fastest measured reply rhythm where available
7. Longest silence
8. Peak chaos day / time
9. Group-level hearts / laughter / questions / late-night activity
10. Participation balance
11. Timeline
12. Closing group keepsake

A group is not a pair deck with more names. The focused group deck deliberately uses its extra editorial slot for the cast/participation view instead of copying the pair-specific streak beat.

## Claim-safety contract

- Counts and timings may be framed memorably, but not converted into unsupported psychology.
- A reply-time result may say how quickly someone replied; it must not claim how much they cared.
- A conversation-start result may say who initiated measured sessions; it must not say who valued the relationship more.
- Silence reports duration, not motive.
- Heart/laughter/question signals are literal measured signals, not sentiment analysis.

## Privacy contract

- Raw chat is processed in-browser by default.
- No raw messages in telemetry.
- No raw messages in share payloads.
- Participant names and any future local lore require explicit exposure in public artifacts.
- Core story generation does not require AI or a server call.
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
- old chapter taxonomy that did not sufficiently distinguish pair vs group
- identical visual treatment for every chapter

### Remove from the first-session critical path

- Premium dashboard
- Cloud Save dashboard
- AI enrichment panel
- account/platform/product-world cross-sells
- six-step process explanations
- infrastructure vocabulary

## Acceptance gates

Automated:
- Demo enters the real story directly.
- Pair and group fixtures each produce exactly twelve story beats.
- Pair and group structures are materially different.
- 9:16 mobile-first deck supports keyboard/touch navigation.
- No raw-chat network transmission.
- Share/save is available per chapter.
- Reduced-motion handling is preserved.

Human:
- Five first-time users follow `docs/uat/SOURCE_FIRST_FIRST_SESSION_UAT.md`.
- At least four complete without instruction.
- At least four name a reveal they would actually send to the other person/group.
- No unsupported psychological claim is perceived as factual.
- Exact deployed Preview is reviewed on a real phone before production promotion.

No production promotion from CI alone.
