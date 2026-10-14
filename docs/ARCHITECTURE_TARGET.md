# Target architecture — reusable local-first MemorySpaces

## Product model

```text
MemorySubject
  -> MemorySpace
      -> SourceArtifact (local/source reference)
      -> MemoryCandidate[] (derived, reviewable, initially pending)
      -> explicit Keep / Skip
      -> approved MemoryGraph (versioned nodes and edges)
          -> MemoryIntent + selected nodes + user-authored text/media
          -> Story / StoryChapter / Export / explicit Share
```

A MemorySpace is the durable local-first home for a person, relationship, child, family, pet, group, home, or life chapter. Its approved memories can support many future intents. Relationship type and editorial intent are distinct fields; changing intent changes story structure, not just a heading.

## Required intent enum

`MEMORY_LANE`, `VALENTINE_GIFT`, `PROM_INVITATION`, `DATE_INVITATION`, `APOLOGY`, `I_LOVE_YOU`, `ANNIVERSARY`, `PROUD_OF_YOU`, `GROUP_MEMORY`.

Intents are composers over the same approved graph. Additional modes require user value and evidence, not a separate product architecture.

## Trust boundaries

1. Raw conversation remains in the browser by default and is never a MemoryGraph node.
2. Parsing and candidate extraction are deterministic/local first; candidates carry provenance and remain pending.
3. Only an explicit user Keep transition may create an approved derived node in the selected MemorySpace.
4. User-authored manual entries may be approved on save because the user is the author.
5. Photo/video bytes remain local unless a distinct upload action describes durable storage, access, and deletion; metadata-only references must say so.
6. Every MemorySpace, candidate, node, edge, story, and export is scoped to one validated space ID; cross-space writes are rejected.
7. Local browser storage is not cloud persistence. Archives, shares, and premium capabilities must state where data lives and how it can be removed.
8. ProgressSpace products (FounderWorld/CreatorWorld) can reuse neutral primitives but never inject business metrics into personal memory graphs.

## Migration map

| Product | Target role | Compatibility rule |
| --- | --- | --- |
| Friendship Wrapped / Relationship Universe | MemorySpace templates and story composers | Keep existing public routes and recognizable entry journeys. |
| BabyStory / FamilyTree Live / PetLife / HomeStory | MemorySpace templates with domain-specific UX | Migrate incrementally; no duplicate graph or silent import. |
| LifeMap / MyYear | Lenses over approved place/date/milestone nodes | Avoid a separate approved-memory copy. |
| FounderWorld / CreatorWorld | Separate ProgressSpace semantics | Shared renderer/storage primitives only; no personal graph contamination. |

## Phased implementation shape

1. **Current route integration:** preserve direct source-first `/create`; for an explicit valid `memorySpaceId`, route the source UI to the candidate-review analyzer. Ensure raw chat remains local and only Keep writes derived graph nodes.
2. **Core graph slice:** validate manifests, stable namespaced IDs, schema versioning, indexes, idempotent writes, approval/rejection, space scoping, reset/delete, archive import/export.
3. **Intent composer:** derive distinct deterministic chapter plans only from approved nodes plus current user input; sparse graphs get truthful manual-first fallbacks.
4. **Media/story studio:** keep selected media local in the first slice, label metadata and bytes truthfully, support PNG export and native/text share fallback; do not claim MP4 or licensed audio.
5. **Cross-product migration:** consume graph nodes through adapters while preserving existing routes and product-specific semantics.
6. **Cloud and premium:** only after provider credentials, schema/RLS, account recovery/deletion, Stripe signed webhooks/idempotency, and real UAT are available.

## Target flow

```text
Who is it for?
  -> What are you making?
  -> Name this memory home
  -> Choose an easy source
  -> Analyze locally / add a memory manually
  -> Review candidates: Keep / Skip
  -> Return to the MemorySpace
  -> Compose an intent-specific story from approved memories
  -> Personalize, preview, export/share, return later
```

Technical terminology stays out of the consumer journey. MemorySpace/Memory Graph are engineering concepts; consumers see a named memory home and clear Keep/Skip choices.

## Architecture guardrails

- No phase may break the source-first `/create` path or public product aliases.
- No implementation may silently promote candidates, raw messages, or selected media to durable storage.
- Contracts are versioned before persistent schema changes.
- Pure parser, graph, and composer logic stays framework-independent and unit-testable.
- Implementers must not be the sole verifier; use independent review and browser/device evidence.
- When human product UAT or provider credentials are missing, use `IMPLEMENTED_NOT_VERIFIED` / `DEPLOYED_NOT_CERTIFIED`, never completion language.
