# REA intake: Photoburst → ThreadTales Memory Burst

**Captured:** 2026-10-18 (public-source snapshot)  
**Governance:** https://github.com/rrahul0904/agent-work-os/issues/300  
**Delivery issue:** https://github.com/rrahul0904/friendship-wrapped/issues/29  
**Upstream:** https://photoburst.app/  
**Reddit:** https://www.reddit.com/r/sideprojects/comments/1x95k7q/i_built_a_photosharing_app_with_no_accounts_on/  
**Owning repo:** this repository; **classification:** DONOR / EXTENSION, not standalone.

## Source-first findings and limits

- A creator-described phone photo/video -> interactive album ("burst") workflow, with a title, music, optional map flyover and link sharing.
- Creator described a no-account hypothesis, abandoned for phone-number identity and then replaced with Apple/Google sign-in only at save/share time.
- Recipient one-tap open and reactions are marketed features, **not** validated by our own authenticated runtime tests.
- External app is not represented as open source; source/license for the product code was **not** inspected or identified. Public descriptions are **behavioral references only**.
- Site's 2026-10-18 pricing text contains early-access and 14-day trials. Do not treat it as locked competitor pricing.
- No private APIs, media assets, tracking logic, source bundles or branding from Photoburst were copied.

## Existing ThreadTales substrate (stacked work)

1. PR #25: MemorySpaces / Memory Graph.
2. PR #26: explicitly approved MemoryCandidates.
3. PR #27: deterministic, provenance-preserving StoryPlan.
4. PR #28: browser IndexedDB MemoryMedia, dedicated Memory Studio, local dedication and soundtrack *reference*, 9:16 manual interactive preview.
5. This branch: reuse #28, add typed BurstFrame compiler, image/story timed playback, video-ended navigation, pause/skip controls, and a browser-only no-account presentation route.

## Decision table

| REA choice | Donor behavior | Owned implementation |
| --- | --- | --- |
| MATCH | Experience before signup | `/memory/burst` reads existing browser-local state with no auth; no backend API |
| MATCH | Interactive phone presentation | 9:16, next/previous, progress + play/pause |
| IMPROVE | Photo/video stories | Add approved Memory Graph beats and human dedication while preserving provenance |
| IMPROVE | Song choice | Metadata reference only; no unlicensed streaming, downloads or media embedding |
| NEW | Reusable framing | `src/lib/memory-burst.ts` pure timeline compiler / scheduler |
| DEFER | Recipient one-tap link | Requires explicit media-hosting consent, private signed object access, expiring/revocable share grants, abuse controls and deletion |
| DEFER | Save/share identity | Retain value-first flow; optional save/share sign-in only after provider and privacy hardening |
| OMIT | Address book, covert identity matching | No contact import or personal identifier harvesting |
| OMIT | Exact visuals/code/assets of donor | Original product UI and clean-room code |

## Release / proof checklist

- [x] Owning product found; no new repo needed.
- [x] Clean-room source evidence, feature route, tests and research branch committed.
- [x] Full-screen local playback from existing Memory Studio with manual controls.
- [x] No newly implemented network writes, public media/recipient links or licensed soundtrack playback.
- [ ] Fresh checkout lint + strict typecheck.
- [ ] Unit + Playwright browser verification, including video-ended behavior and mobile Safari.
- [ ] Production build and exact-head CI.
- [ ] Preview deployment browser acceptance.
- [ ] Security/privacy and human UAT before merging.
- [ ] Later user-consented, recipient-safe sharing design + separate threat-model approval.

### Threat-model note

A link to `/memory/burst?memorySpaceId=...` is **not** a share link: it only references IndexedDB / localStorage on the same device and origin. It will not provide photos to a different device or person. A future real share link must never serialize raw private chat content into URL fragments or expose media by unscoped permanent public URLs. Personal photos are never uploaded by this slice.

### Shipping policy

Stack this PR against `reverse-os/threadtales-memory-studio` until its parent dependency is reviewed. It is a review candidate, **not** a production release. Do not auto-merge or deploy without explicit gates.
