# ThreadTales Memory Intent Model — 2026-10-05

## Canonical idea

ThreadTales is a private memory home for the people and groups in a user's life.

The durable object is the `MemorySpace` and its `MemoryGraph`.

The experience a user creates at any particular moment is driven by a separate `MemoryIntent`.

This distinction is fundamental:

- `MemorySpace` answers **who is this about?**
- `MemoryGraph` answers **what do we remember about them?**
- `MemoryIntent` answers **what am I trying to say or make them feel right now?**
- `MemoryStory` / `MemoryFilm` answers **what should I send or keep?**

A single relationship must support many intents over time without duplicating the underlying memories.

Example:

`Rahul + Wife` can produce:
- Memory Lane
- Valentine's Gift
- I Love You
- Anniversary
- I'm Sorry
- Be My Date
- Proud of You

The memories are shared; the editorial grammar changes.

---

## Product equation

```text
Person / Group
  + MemorySpace
  + MemoryGraph
  + MemoryIntent
  + Soundtrack / Media choices
  = Memory Experience
```

ThreadTales must not create a separate app, database model, or product shell for every occasion.

---

## First-class MemoryIntent categories

### 1. MEMORY_LANE

Goal: relive the relationship or group history.

Typical users:
- partner
- friend
- parent/child
- family
- group

Story grammar:
1. where it began
2. early memories
3. shared rituals / language
4. eras or turning points
5. photos / videos / places
6. funny or chaotic moments
7. ordinary recurring moments
8. today
9. closing reflection

Primary CTA:
- `Take a walk down memory lane`

Output emphasis:
- timeline
- continuity
- emotional contrast
- nostalgia

---

### 2. VALENTINE_GIFT

Goal: create a romantic gift grounded in real shared history.

Story grammar:
1. why this person
2. first / early memories
3. things only we understand
4. favorite photos / videos
5. shared song
6. selected real messages
7. what I love about us
8. personal dedication

Primary CTA:
- `Be my Valentine`

Output emphasis:
- romance
- soundtrack
- personal dedication
- recipient reveal

Hard rule:
Do not infer feelings or relationship quality from behavioral data. User-authored statements may express emotion; machine-derived statements must stay evidence-grounded.

---

### 3. PROM_INVITATION

Goal: ask someone to prom using a personalized memory story.

Story grammar:
1. playful opening
2. shared moments / context
3. inside joke or relevant memory
4. build anticipation
5. final reveal
6. explicit question

Primary CTA:
- `Will you go to prom with me?`

Output emphasis:
- short duration
- surprise
- strong ending
- easy private sharing

Important:
This intent may have very little historical data. ThreadTales must support manual memories and media rather than requiring a long conversation history.

---

### 4. DATE_INVITATION

Goal: ask someone to be a date for an event or occasion.

Story grammar:
1. why I thought of you
2. one or more shared moments
3. playful buildup
4. event context
5. direct ask

Primary CTA:
- `Be my date?`

Output emphasis:
- concise
- playful
- recipient action

---

### 5. APOLOGY

Goal: say "I'm sorry" with context, accountability and care.

Story grammar:
1. acknowledge the relationship / person
2. selected memories that show why they matter
3. user-authored apology
4. what the user wishes they had done differently
5. optional commitment / next step
6. close without emotional pressure

Primary CTA:
- `I'm sorry`

Hard safety/product rules:
- Never generate manipulative guilt language.
- Never infer that the recipient owes forgiveness.
- Never use private conversation evidence to pressure or shame the recipient.
- The core apology must be user-authored or explicitly approved.

---

### 6. I_LOVE_YOU

Goal: express affection through shared memories.

Story grammar:
1. this is us
2. small recurring moments
3. selected photos/videos
4. shared language
5. selected message(s)
6. soundtrack peak
7. personal declaration

Primary CTA:
- `I love you`

Output emphasis:
- intimacy
- specificity
- personal voice

---

### 7. ANNIVERSARY

Goal: mark time and show how a relationship has grown.

Story grammar:
1. `X years of us`
2. beginning
3. each major era / milestone
4. ordinary recurring rituals
5. trips / photos / videos
6. messages over time
7. today
8. personal dedication
9. next chapter

Primary CTA:
- `Happy anniversary`

Output emphasis:
- longitudinal Memory Graph
- era comparison
- permanence

---

### 8. PROUD_OF_YOU

Goal: celebrate another person's growth, effort or achievement.

Typical recipients:
- child
- partner
- friend
- sibling
- parent
- teammate / group member

Story grammar:
1. where you started
2. effort / milestones
3. supporting photos/videos/messages
4. people / moments that matter
5. achievement
6. user-authored reflection
7. `I'm proud of you`

Primary CTA:
- `I'm proud of you`

Output emphasis:
- growth
- milestones
- encouragement

Hard rule:
Do not invent accomplishment, struggle or motivation. Only use confirmed milestones and user-supplied statements.

---

### 9. GROUP_MEMORY

Goal: preserve a shared group history.

Typical groups:
- family
- friend group
- school / college friends
- wedding party
- coworkers / team

Story grammar:
1. cast
2. beginning / origin
3. eras
4. group rituals / running jokes
5. places / trips
6. peak chaos
7. contributions from multiple members
8. people / roles without ranking worth
9. group timeline
10. closing group memory

Primary CTA:
- `Remember this?`

Output emphasis:
- multi-contributor Memory Graph
- group-specific language
- shared media
- no forced pair/couple grammar

---

## Relationship type and intent are independent dimensions

Do not encode occasions inside relationship types.

Examples:

| Relationship | Intent | Result |
|---|---|---|
| Partner | ANNIVERSARY | Longitudinal relationship story |
| Partner | APOLOGY | Memory-supported apology |
| Friend | MEMORY_LANE | Friendship retrospective |
| Friend | DATE_INVITATION | Personalized invitation |
| Child | PROUD_OF_YOU | Growth / milestone celebration |
| Child | MEMORY_LANE | Childhood memory film |
| Family | GROUP_MEMORY | Family story |
| Friend group | GROUP_MEMORY | Group recap |
| Other | PROM_INVITATION | Short surprise ask |

This composition prevents product sprawl.

---

## Proposed typed contract

```ts
type RelationshipType =
  | "PARTNER"
  | "CHILD"
  | "PARENT"
  | "FRIEND"
  | "FAMILY_GROUP"
  | "OTHER";

type MemoryIntentKind =
  | "MEMORY_LANE"
  | "VALENTINE_GIFT"
  | "PROM_INVITATION"
  | "DATE_INVITATION"
  | "APOLOGY"
  | "I_LOVE_YOU"
  | "ANNIVERSARY"
  | "PROUD_OF_YOU"
  | "GROUP_MEMORY";

interface MemoryIntent {
  schemaVersion: 1;
  id: string;
  kind: MemoryIntentKind;
  relationshipType: RelationshipType;
  occasionDate?: string;
  eventName?: string;
  desiredTone?: "WARM" | "ROMANTIC" | "PLAYFUL" | "NOSTALGIC" | "SINCERE" | "CELEBRATORY";
  soundtrackMode?: "REFERENCE_ONLY" | "PLATFORM_ADD_LATER" | "USER_CLEARED_AUDIO";
  finalMessage?: string;
  finalQuestion?: string;
}
```

`MemoryIntent` is a generation/editorial input. It must not duplicate `MemoryGraph` data.

---

## Creation flow v2

### Step 1 — Who is this for?

- Partner
- Child
- Parent
- Friend
- Family / Group
- Other

### Step 2 — What are you creating?

Recommended intent cards should adapt to relationship type, but every valid intent remains data-driven.

Examples:

Partner:
- Memory Lane
- Valentine's Gift
- Anniversary
- I Love You
- I'm Sorry
- Be My Date

Child:
- Memory Lane
- Proud of You
- Birthday / milestone later
- Family Memory

Friend:
- Memory Lane
- Proud of You
- Group Memory
- I'm Sorry
- Be My Date / Prom where applicable

Family / Group:
- Group Memory
- Memory Lane
- Celebration

### Step 3 — Where should we start?

- Conversation
- Photos & Videos
- Start Manually
- Add existing MemorySpace later

### Step 4 — Add soundtrack

- choose a reference track
- add platform music later
- user-cleared upload
- no music

Do not imply that a commercial catalog track can be embedded into an exported MP4 unless rights permit it.

### Step 5 — Memory Miner

Generate private `MemoryCandidate` records from available local sources.

### Step 6 — User approval

Candidate -> approved `MemoryNode` or rejected.

No candidate silently becomes public or persistent.

### Step 7 — Compose

`MemoryGraph + MemoryIntent + approved media + soundtrack mode -> MemoryStorySpec`

### Step 8 — Preview / edit

Only lightweight editorial choices:
- keep/remove
- reorder bounded sections
- change photo/video
- approve a message
- edit final note/question

### Step 9 — Render

- private interactive Memory Story
- 9:16 Memory Film
- share cards / clips
- archive export

### Step 10 — Share or keep

- native share sheet
- private recipient link
- download
- archive

---

## Permanent product model

A user should be able to create many experiences from one MemorySpace over years.

```text
MemorySpace: Rahul + Wife
  ├── MemoryGraph (durable)
  ├── 2026 Anniversary Story
  ├── 2027 Valentine's Film
  ├── 2027 I'm Sorry Story
  ├── 2028 Memory Lane Film
  └── 2030 Anniversary Story
```

The graph compounds. The intent changes.

This is the retention loop.

---

## What not to build

- nine separate apps for nine occasions
- a public social network
- a general-purpose video editor
- AI-generated relationship psychology
- generic greeting-card templates detached from real memories
- a subscription gate that prevents export/access to already-created memories
- a dashboard that appears before the emotional experience

---

## First implementation delta from Issue #24

Issue #24's `/memory/new` slice should now include an intent step.

Required minimum flow:

```text
/memory/new
  -> Who is this for?
  -> What are you creating?
  -> Name the MemorySpace
  -> Choose starting source
  -> Create local versioned draft
  -> Route to intake
```

Acceptance additions:
- all nine initial MemoryIntent kinds represented in a data-driven registry;
- relationship-specific recommendation filtering without hard-coded separate pages;
- selected intent persists across refresh in the local draft;
- invalid relationship/intent combinations degrade safely to the full intent chooser rather than crash;
- no raw content network transmission;
- no legacy Story Platform / WorldCore / Premium / Cloud Save / AI surfaces in this path;
- browser coverage for Partner/ANNIVERSARY, Child/PROUD_OF_YOU, Friend/MEMORY_LANE, Family-Group/GROUP_MEMORY and Other/PROM_INVITATION;
- mobile and keyboard-accessible intent selection.

---

## Canonical product promise

> **Keep the story of the people you love — and turn those memories into something meaningful whenever words alone are not enough.**

ThreadTales is not an occasion-card generator.

The occasion is the reason to create now.

The Memory Graph is what makes the result personal.

The MemorySpace is what makes it last.
