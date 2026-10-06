# ThreadTales Product Portfolio Architecture — 2026-10-06

## Decision

ThreadTales Memory Keeper does **not** replace the existing product catalog. It becomes the shared consumer-memory substrate beneath the existing life/memory products.

The catalog already contains ten live products. The correct architecture is therefore layered, not additive: existing products keep their identities and URLs while converging on shared MemorySpace / MemoryGraph / Composer / Renderer / Vault primitives.

## Product taxonomy

### A. Durable memory-space products

These are user-facing products that represent a long-lived subject or relationship and should converge onto MemorySpace + MemoryGraph:

- `friendship` — friendship / group relationship memory space
- `relationship` — partner / couple relationship memory space
- `babystory` — child / growing-up memory space
- `familytree` — family / genealogy memory space with relationship graph
- `petlife` — pet memory space
- `homestory` — home / place memory space

These are not intents. They are persistent homes for memories.

### B. Cross-cutting views / composers

These should not own separate copies of the same memories:

- `lifemap` — geographic / era / timeline lens across approved memories
- `myyear` — annual composer / recap generated from memories in one or more spaces

They may still remain marketable product entry points and retain their current URLs, but internally they should query shared graph data rather than create isolated memory silos.

### C. Memory intents / occasions

These are temporary storytelling goals applied to a MemorySpace or selected graph subset. They are **not separate products**:

- Memory Lane
- Valentine gift
- Ask to prom
- Be my date
- I am sorry
- I love you
- Anniversary
- Proud of you
- Group memory

An intent changes selection, pacing, tone, duration, ending, soundtrack treatment, and output format. It does not duplicate the underlying memories.

### D. Professional progress worlds

These should remain a separate ThreadTales product family:

- `founderworld`
- `creatorworld`

They can share infrastructure such as event storage, import, rendering, export, sharing, audit receipts, and persistence, but their domain model is progress/metrics rather than personal memory.

Do not force revenue metrics, audience metrics, startup incidents, or creator analytics into the consumer MemoryGraph vocabulary.

## Correct platform model

ThreadTales should expose a common platform substrate with two semantic domains.

### Shared substrate

- `Space`
- `Subject`
- `Entry`
- `MediaAsset`
- `Contributor`
- `Place`
- `Timeline`
- `Composer`
- `RenderArtifact`
- `ShareReceipt`
- `ExportArchive`
- privacy / provenance / approval metadata

### Consumer-memory domain

- `MemorySpace`
- `MemoryCandidate`
- `MemoryNode`
- `ConversationEvidence`
- `Milestone`
- `SongReference`
- `RelationshipEdge`
- `MemoryIntent`

### Professional-world domain

- `ProgressSpace`
- `MetricEvent`
- `LaunchEvent`
- `AudienceEvent`
- `RevenueEvent`
- `IncidentEvent`

Both can use shared storage and rendering primitives while preserving different semantics and UX.

## Memory subject model

The current Memory Keeper pilot starts from Partner / Child / Parent / Friend / Family-Group / Other. Existing products prove this root is too narrow.

The durable subject model must support:

- `SELF`
- `PERSON`
- `RELATIONSHIP`
- `GROUP`
- `FAMILY`
- `PET`
- `HOME`

A product template presets subject type, terminology, allowed memory kinds, recommended intents, and views.

Examples:

- Relationship Universe -> `RELATIONSHIP`
- Friendship Wrapped -> `RELATIONSHIP` or `GROUP`
- BabyStory -> `PERSON` with role `CHILD`
- FamilyTree Live -> `FAMILY`
- PetLife -> `PET`
- HomeStory -> `HOME`

## Product adapters

Keep public URLs and product identities:

- `/products/relationship`
- `/products/friendship`
- `/products/babystory`
- `/products/familytree`
- `/products/petlife`
- `/products/homestory`
- `/products/lifemap`
- `/products/myyear`

Each page becomes an adapter into the common memory system.

Example:

`/products/babystory`
-> explains BabyStory
-> `Create BabyStory`
-> creates/opens a `MemorySpace` using template `babystory`
-> recommended source choices: photos/video, manual milestone, family contribution
-> recommended intents: Memory Lane, Proud of You, Birthday/annual chapter later
-> views: timeline, growth, annual chapter

`/products/relationship`
-> creates/opens a relationship MemorySpace
-> sources: chat, photos/video, manual memories, places, songs
-> intents: Anniversary, Valentine, I Love You, I'm Sorry, Date Invitation, Memory Lane

`/products/friendship`
-> creates/opens friendship/group MemorySpace
-> sources: chat, photos/video, manual memories
-> intents: Memory Lane, Anniversary of friendship, Group Memory, Proud of You

## Preserve specialized value

Do not flatten products into one generic CRUD form.

Each product keeps its own:

- vocabulary
- onboarding defaults
- recommended memory kinds
- domain-specific views
- story grammar
- visual identity
- output templates
- pricing / packaging where justified

The common graph eliminates duplicated storage and import logic; it does not eliminate product personality.

## Current-code migration strategy

Current `WorldBuilder` stores independent local state under `story-platform:world:<slug>:v1` and models events as title/date/detail/people/place/extra/kind. This is useful migration input but creates product silos.

Migration should be adapter-first:

1. Define canonical MemorySpace / Subject / MemoryNode contracts.
2. Create `WorldEvent -> MemoryNode` adapter for consumer-memory products.
3. Read existing local product state and offer explicit local migration into a MemorySpace; do not silently rewrite user data.
4. Keep existing product builders operational while graph-backed builders are introduced one product at a time.
5. Make LifeMap and MyYear read graph data before removing their standalone stores.
6. Keep FounderWorld / CreatorWorld on separate ProgressSpace semantics.
7. Preserve existing URLs and export compatibility throughout migration.

## Recommended migration order

1. Relationship Universe — closest to current Memory Keeper thesis.
2. Friendship Wrapped — reuse chat miner + candidate approval already implemented.
3. BabyStory — proves person/child + media/manual memories.
4. PetLife — proves non-human subject.
5. HomeStory — proves place/home subject.
6. FamilyTree Live — proves contributors + relationship graph.
7. LifeMap — convert to shared graph lens.
8. MyYear — convert to shared annual composer.
9. FounderWorld / CreatorWorld — share infrastructure only; do not merge semantics.

## Core UX after migration

A user can enter ThreadTales from either direction:

### Product-first

`Products -> BabyStory -> Create -> MemorySpace -> add memories -> create intent story`

### Person/subject-first

`Create -> who/what is this about -> choose template -> add memories -> choose intent -> story`

Both routes converge on the same graph.

## Example: one relationship, many outputs

A single Relationship MemorySpace can contain conversation evidence, photos, videos, places, songs, trips, wedding, rituals and notes.

From the same approved graph the user can later create:

- Memory Lane
- Valentine gift
- Anniversary film
- I Love You story
- I'm Sorry story
- Be My Date invitation
- annual MyYear chapter
- LifeMap view

No source re-upload and no duplicate relationship archive is required.

## Example: one child, many outputs

A BabyStory MemorySpace can grow from birth through school and adulthood.

The same graph can generate:

- first-year BabyStory
- birthday chapter
- Proud of You story
- graduation film
- Memory Lane
- annual MyYear recap
- family contribution collection

## Hard boundaries

- Do not delete or hide existing live product URLs during migration.
- Do not duplicate a memory merely because it appears in multiple stories or products.
- Intents never own source data.
- LifeMap and MyYear become graph views/composers, not memory silos.
- Raw conversation remains local by default.
- Candidate -> MemoryNode remains explicit-user-approval only.
- FounderWorld / CreatorWorld remain semantically separate from personal memories.
- Existing local user data must have an explicit migration/export path.

## Next engineering action

Generalize the Memory Keeper root model from relationship-only terminology to subject/template terminology while preserving the existing `/memory/new` behavior. Then implement a Relationship Universe adapter as the first graph-backed existing product.
