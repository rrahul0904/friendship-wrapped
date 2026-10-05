# ThreadTales Memory Keeper — Product Reset

Date: 2026-10-05
Status: clean-room reconstruction specification draft
Depends on: `MEMORY_KEEPER_MARKET_DOSSIER_2026-10-05.md`

## Product thesis

ThreadTales is a private memory home for the people in your life.

It helps a user take the material already scattered across conversations, photos, videos, voice notes, songs, places, dates, and written memories; organize that material around a person or group; approve the moments that matter; and turn the result into a living memory timeline plus cinematic stories that can be kept privately or shared externally.

The flagship promise is not "chat analytics" and not "make a slideshow."

> Keep the story of the people you love.

Supporting promise:

> Turn years of messages, photos, videos, music and milestones into memories you can keep, revisit and share.

## Organizing object

The primary product object is a `MemorySpace` centered on one person or group.

Examples:
- My wife
- My daughter
- My best friend
- My parents
- Our family
- College friends
- Someone I want to remember

The relationship type changes storytelling grammar but does not create a separate product.

## Golden journey — first creation

1. Land on one promise.
2. Choose **who this is for**.
3. Choose a starting source:
   - conversation export;
   - photos/videos;
   - start manually.
4. Process sensitive source material locally where feasible.
5. Generate private candidate memories; candidates are not automatically published or persisted.
6. User approves/rejects/edit-labels candidate memories.
7. Add optional media: photos, video, voice, places, milestone dates, personal note.
8. Choose a song/soundtrack strategy.
9. Build a Memory Graph.
10. Compose a cinematic Memory Story from approved nodes.
11. Preview the recipient/private-view experience.
12. Produce outputs:
    - private interactive story link;
    - vertical Memory Film (MP4 where supported);
    - share cards/clips;
    - archive/PDF/export.
13. Share through native/system surfaces; add direct provider publishing only where APIs and permissions make it appropriate.
14. Save the MemorySpace so it can grow over time.

## Long-lived journey

A MemorySpace must not become stale after the first story.

Over time the user can:
- add new moments manually;
- import another conversation period;
- add photos/video/voice;
- invite approved contributors;
- attach a moment to people, date, place, event and relationship era;
- generate anniversary/birthday/yearly/trip/family stories from the same graph;
- receive resurfaced memory candidates without automatically exposing them;
- export the entire MemorySpace in a durable user-owned format.

## Memory Graph model

### Core entities

`Person`
- id
- displayName
- role/relationship label
- optional birth/date metadata
- privacy scope

`MemorySpace`
- id
- owner
- title
- relationshipType
- participants
- createdAt
- privacyMode

`MemoryNode`
- id
- spaceId
- type
- date/range
- title
- body/context
- source provenance
- confidence
- approval state
- privacy/sensitivity
- participant refs
- place refs
- media refs
- evidence refs

`MediaAsset`
- photo | video | audio | live-photo-derived asset | document
- original provenance
- capture date
- user ownership/rights status
- local/cloud storage state
- render-safe derivatives

`ConversationEvidence`
- source app
- source range
- measured claim
- selected excerpt if explicitly approved
- local-only/raw boundary

`Milestone`
- birthday | wedding | trip | school | first | loss | move | custom

`SongReference`
- provider or user-owned file
- title/artist metadata
- rights/render mode
- private-playback vs export eligibility

`RelationshipEra`
- user-approved period label or source-derived candidate

`Contributor`
- owner/editor/viewer/recipient roles

`Story`
- purpose/occasion
- audience
- sequence of beats
- soundtrack strategy
- render targets
- source graph revision

`ExportReceipt`
- story id
- graph revision
- output type
- content hash
- timestamp
- limitations/rights notes

## Candidate-memory rule

Analysis may propose candidate memories, but the system must separate:

`Observed evidence -> Candidate interpretation -> User-approved memory`

A source-derived candidate must never silently become a public/persistent statement about another person.

Example:
- Observed: "drive safe" appears 1,284 times.
- Candidate: "A ritual you kept repeating."
- Approved node: user chooses to include it in their MemorySpace.

## Story grammar

### Partner
- beginning
- shared language
- rituals
- eras
- ordinary days
- travel/milestones
- selected photos/video
- chosen song
- personal dedication

### Child
- beginnings
- growth/milestones
- funny phrases
- voice
- school/trips
- family relationships
- letters for later
- yearly chapters

### Friend
- origin
- inside jokes
- trips
- recurring people/places
- chaos/late nights
- life eras
- selected photos/video
- dedication

### Parent / grandparent
- stories they told
- voice
- traditions
- recipes/places
- family milestones
- messages/letters
- legacy memories

### Family / group
- cast
- traditions
- events
- shared places
- group eras
- contributions from multiple members
- group film/recap

## Memory Film contract

The first film engine must be bounded rather than becoming a general editor.

Inputs:
- approved MemoryNodes
- selected photos/video/audio
- optional approved message excerpts
- soundtrack plan
- visual theme
- target duration

Composer responsibilities:
- choose a coherent beat sequence;
- respect chronology unless an intentional narrative rule overrides it;
- avoid duplicate evidence;
- balance text/media density;
- provide deterministic fallback when AI is unavailable;
- preserve source provenance.

Renderer responsibilities:
- vertical 9:16 primary target;
- still/photo motion treatment;
- video trims without destructive source mutation;
- text/milestone cards;
- soundtrack timing;
- transitions;
- subtitles/captions where needed;
- safe-area aware output;
- export to a shareable file format supported by target runtime.

The output must be watchable without additional editing.

## Soundtrack / music contract

Music is first-class but rights-sensitive.

Supported modes should be explicit:
1. `REFERENCE_ONLY` — Spotify/Apple/etc. reference for private interactive experience where permitted.
2. `USER_CLEARED_AUDIO` — user-owned/licensed upload that may be rendered into export if rights are confirmed.
3. `PLATFORM_ADD_AFTER_EXPORT` — export film without commercial track; user adds licensed music inside Instagram/Facebook/etc.
4. `LICENSED_THREADTALES_CATALOG` — future curated/licensed catalog.

Never assume a streaming-catalog selection may legally be embedded in a distributable MP4.

## Sharing contract

Primary V1:
- Web Share / OS share sheet with generated MP4/image/link where supported;
- copy private link;
- save/download film/card;
- explicit recipient-view mode.

Provider-specific direct publishing is an integration layer, not a prerequisite for the first product.

The system must never claim a platform was posted to unless the provider returns successful evidence.

## Permanence contract

"Forever" means user ownership and durable portability, not a claim that one vendor will exist forever.

Every MemorySpace must support export of user-approved persistent material in an open/documented archive structure containing:
- manifest/version;
- people/relationships;
- timeline/memory nodes;
- provenance;
- approved text;
- user-owned/eligible media or references;
- exportable stories;
- checksums where practical.

Previously created user memories must not become inaccessible merely because a subscription lapses. Premium storage/generation can stop, but user-owned export/access to existing memories requires a separate explicit retention policy.

## Privacy architecture

### Local-first source zone
Raw conversation imports remain in the browser/device by default.

### Candidate zone
Derived private memory candidates may exist transiently until approved.

### Persistent graph zone
Only user-approved memory data enters the durable graph.

### Public/share zone
Only explicitly selected story output is included in external share artifacts.

### Contributor zone
Access is scoped by MemorySpace role and specific permissions.

No raw chat in telemetry, URLs, logs, public artifacts or payment metadata.

## Product boundaries

### Core V1
- create MemorySpace for any person/group;
- import one conversation or media set;
- local candidate mining;
- approve memory nodes;
- attach photo/video/note/milestone/song reference;
- Memory Graph persistence;
- one cinematic vertical Memory Story;
- private recipient link;
- native share/download;
- full user archive export contract.

### Next
- recurring/yearly resurfacing;
- collaborative contributors;
- additional chat importers;
- voice-note ingestion;
- automatic media/date association;
- multiple films from one graph;
- printed/physical outputs.

### Deferred
- public social feed;
- generic video editor;
- generative voice cloning;
- child wellness gamification;
- broad Story Platform marketplace;
- relationship psychology scores;
- hidden AI interpretation of private relationships.

## First vertical slice

### Slice: "Create a memory for someone"

User action:
- Open `/memory/new`.
- Choose `Partner`, `Child`, `Parent`, `Friend`, `Family/Group`, or `Other`.
- Name the MemorySpace.
- Choose `Conversation`, `Photos/Videos`, or `Start manually`.

System:
- creates a local draft `MemorySpace`;
- writes no raw sensitive import to server;
- routes to a source-specific intake surface;
- shows the graph as empty/private until memories are approved.

Evidence required:
- relationship types are data-driven, not separate apps;
- draft survives refresh using privacy-safe local persistence;
- no network call contains draft raw imported content;
- mobile and desktop interaction verified;
- accessibility labels and keyboard interaction verified;
- unit test for schema/version and invalid states;
- browser test for each start-source path.

Done condition:
- a user can create a MemorySpace for wife/daughter/friend/family and reach the correct intake path with no legacy SaaS/dashboard leakage.

## Second vertical slice

### Slice: "Conversation -> approved memory candidates"

Reuse existing ThreadTales local parser/analyzer.

Transform selected deterministic evidence into typed `MemoryCandidate` records such as:
- first message/date;
- recurring phrase/ritual;
- active era;
- late-night period;
- selected message excerpt candidate;
- milestone-like date candidate.

The user can approve, reject or edit-label candidates before graph persistence.

No candidate approval -> no durable memory node.

## Third vertical slice

### Slice: "Memory Graph -> 60-second Memory Film"

Use synthetic/local fixtures first.

Inputs:
- 6–10 approved nodes;
- 4+ photos;
- 1+ short video optional;
- soundtrack mode.

Output:
- deterministic story spec;
- browser preview;
- 9:16 share artifact proof;
- no claim of embedded commercial music unless rights mode permits it.

## Product acceptance test

Canonical scenario:

> A user wants to create something for his wife. He creates a Partner MemorySpace, imports years of conversation locally, approves meaningful rituals/moments, adds a song reference, wedding/travel photos and short videos, writes a final dedication, and receives a cinematic memory story. He can send a private link and share/export a vertical film. One year later he adds another chapter to the same MemorySpace rather than starting over.

The same engine must work for:
- daughter;
- friend;
- parents;
- family/group;
without changing the product into separate applications.

## Success metrics for pilot UAT

Do not use engagement vanity metrics as the initial product gate.

First-session quality:
- 4/5 users understand that the product is for a person/group, not just chat analytics;
- 4/5 create a MemorySpace without instruction;
- 4/5 identify at least one candidate they genuinely want to preserve;
- 4/5 understand what stays private vs what will be shared;
- 4/5 say the final story feels meaningfully more personal than an automatic camera-roll slideshow;
- no user believes an inferred psychological statement was an observed fact.

Durability/trust:
- all persistent user-approved memory data can be exported;
- deletion behavior is explicit;
- generated artifact is bound to an exact graph revision and receipt;
- changing source/graph after render marks old parity/render evidence stale where applicable.
