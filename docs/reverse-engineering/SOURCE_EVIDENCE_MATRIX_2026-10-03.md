# ThreadTales source evidence matrix — 2026-10-03

This file separates **origin**, **later competitors**, and **interaction benchmarks**. A later competitor must never be rewritten as the original inspiration.

## 1. Origin

### Your Love Page / Love Wrapped

Sources:
- Original project-context reference: `mrrplanet.com/p/your-love-page`
- Current product: `https://www.yourlovepage.online/`
- Current product/about: `https://www.yourlovepage.online/about`
- Current Love Wrapped description: `https://www.yourlovepage.online/boyfriends-day`

Observed product principles:
- One narrow job: say something personal to one specific person.
- Recipient needs only a browser link; no recipient account/app requirement.
- Live editing and previewing happen before publishing.
- Love Wrapped is described as nine interactive chapters assembled from personal numbers, places, photos, qualities, inside jokes, a song, and a final letter.
- Monetization is primarily one-time permanent publishing rather than subscription-first upsell.

ThreadTales implication:
- The output must feel like a personal keepsake, not an analytics report.
- Analysis exists to create emotional material.
- The final artifact and ability to send it to the other person are core product value.

## 2. Wrapped storytelling benchmark

### Spotify Wrapped

Role: storytelling benchmark, not product origin.

Principles to preserve:
- One idea per reveal.
- Numbers are framed as story moments rather than chart rows.
- Sequential pacing creates anticipation.
- Individual moments can stand alone when shared.

## 3. Later direct competitors

### WeSayWhat

Source: `https://www.wesaywhat.com/`

Observed behavior:
- One chat produces twelve story-style reveals.
- Publicly listed topics include conversation start, ghosting, response time, message count, most active day, emoji, media, longest silence, longest message, activity patterns, edits, and night-owl/early-bird behavior.
- The reveal cadence is explicitly editorial: establish context, make a measured claim, show the number, finish with a memorable line.
- 9:16 sharing is first-class.
- Chat processing is on-device and the public copy says no account/upload is needed for the chat-processing path.
- The product explicitly says it analyzes patterns rather than sentiment/meaning.
- Pair, couple, best-friend and group use cases are all called out.

ThreadTales implication:
- Twelve beats is a useful upper bound for a complete recap.
- Pattern claims must remain measurable and avoid fake psychological interpretation.
- Sharing must be built into the reveal, not buried at the end.
- Group editorial questions must differ from pair questions.

### WhatsWrapped.io

Sources:
- `https://www.whatswrapped.io/learn/whatsapp-wrapped`
- `https://www.whatswrapped.io/privacy`
- `https://www.whatswrapped.io/for/family-group-chat`

Observed behavior:
- Defines the format as a short slide-by-slide recap built from a user-exported chat.
- Parses chat exports in a browser Web Worker.
- Raw chat is not uploaded.
- Saved recaps may store derived statistics, but not raw message text.
- Group pages emphasize per-person ranking and group-specific timelines rather than forcing a pair model onto a group.
- Metric documentation explicitly distinguishes real messages from WhatsApp system lines.

ThreadTales implication:
- Preserve Worker/local-first architecture.
- Keep raw content separate from derived statistics.
- Treat group parsing/system events carefully.
- A group is not a pair recap with additional names.

### Whats-wrapped.com / older WhatsWrapped

Source: `https://whats-wrapped.com/`

Observed behavior:
- Browser-local chat analysis.
- Wrapped highlights plus a deeper analytics dashboard.
- Group-only concepts such as polls and group events appear in detailed analytics.

ThreadTales implication:
- Detailed analytics can exist outside the golden journey, but the rebuild should not put a dashboard before the emotional recap.

## 4. Current rebuild gap matrix

| Capability | Source lesson | Rebuild status | Decision |
|---|---|---|---|
| One clear promise | Origin | Present | KEEP |
| Local chat parsing | Competitor/source-neutral | Present | KEEP |
| No raw-chat API transmission | Competitor/source-neutral | Automated test present | KEEP |
| Sequential story | Wrapped / direct competitors | Present | KEEP |
| Complete 12-beat recap | WeSayWhat + current product spec | Partial | CLOSE NOW |
| Pair/group editorial divergence | Direct competitors | Present but incomplete | STRENGTHEN |
| One idea per reveal | Wrapped | Present | KEEP |
| Share per reveal | Direct competitors | Present | KEEP |
| 9:16 keepsake | Direct competitors / social sharing | Present as SVG, needs visual UAT | VERIFY |
| Personal final keepsake | Origin | Basic | STRENGTHEN AFTER CORE |
| Photos/song/personal note | Origin | Not present | POST-STORY OPTIONAL, NOT FIRST BLOCKER |
| Dashboard before story | Old implementation | Removed in rebuild | REMOVE |
| Premium/cloud/AI panels | Old implementation | Removed in rebuild | REMOVE |
| Product-world cross-sells | Old implementation | Removed in rebuild | REMOVE |
| Human first-session evidence | Product gate | Missing | REQUIRED BEFORE PROMOTION |

## 5. Product gate

Do not merge because CI is green. The candidate must first demonstrate:
- 4/5 first-time users complete the story without instruction.
- 4/5 can name a reveal they would actually send to the other person/group.
- No participant interprets a measured pattern as an unsupported psychological claim.
- Mobile visual pacing is acceptable on a real phone.
