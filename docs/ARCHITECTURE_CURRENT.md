# Current architecture (production baseline)

**Baseline SHA:** `8859495cd9062eb2a6a842c80a75639453d61026` (main and production).  
**Status:** verified source-first release; MemorySpace stack remains unmerged.

## Runtime map

```text
Desktop/mobile browser
  -> Next.js App Router on Vercel
      -> /create and /rebuild
          -> source-first import/demo journey
          -> Web Worker parses and analyzes locally
          -> deterministic 12-chapter story
          -> local PNG/download/share actions
      -> existing product routes
      -> optional API routes
          -> Supabase auth/storage/persistence (configured flags; health unverified)
          -> Stripe checkout/webhook/entitlement (production flags disabled)
          -> OpenAI enrichment (disabled)
          -> privacy-bounded telemetry (delivery unverified)
```

The production create journey is `SourceFirstThreadTales` in `src/components/SourceFirstThreadTales.tsx`. The flow reads a selected WhatsApp `.txt` or Telegram `.json` file through the browser File API, sends the text to the local worker client, and creates a deterministic 12-beat reveal. The local demo and parser tests/E2E cover pair and group stories, mobile sizing, reduced motion, no raw-chat network transmission, and PNG/share fallbacks.

## Production route families

- **Entry/story:** `/`, `/create`, `/rebuild`, `/occasions`, `/occasions/[mode]`, `/share`.
- **Product identities:** `/products`, `/products/[slug]`, `/relationship`, `/babystory`, `/familytree`, `/petlife`, `/homestory`, `/lifemap`, `/myyear`, `/founderworld`, `/creatorworld`.
- **Account/platform:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account`, `/settings`, `/billing`, `/albums`, `/worlds/[id]`, admin routes.
- **Server boundaries:** `src/app/api/**` route handlers cover auth/account, AI, checkout/billing/entitlements, integrations/telemetry, albums/media/worlds/PetLife, and `/api/version`.

## Canonical journey and privacy boundary

```text
/create
  -> choose WhatsApp/Telegram export or demo
  -> local read + Web Worker analysis
  -> source-first 12-chapter story
  -> per-chapter save/share or keepsake actions
```

No login, cloud provider, AI call, or raw-chat server upload is required for this path. Explicit user-initiated sharing may include story values and participant names; the public privacy architecture must distinguish that action from anonymous legacy snapshot defaults. Production API flags show integrations are optional/configuration-gated, not independently certified.

## Unmerged MemorySpace architecture

Open PRs #25–#28 introduce a separate, not-yet-production branch of the architecture:

```text
/memory/new
  -> local MemorySpace manifest/index
  -> source selector
  -> /create?memorySpaceId=...
  -> local analysis -> candidate review -> explicit approval
  -> local MemoryGraph
  -> /memory/[id] -> intent story / local studio (stacked PRs #27/#28)
```

PR #25 currently fails because production's canonical source-first `/create` does not branch into `UploadAnalyzer` for `memorySpaceId`; the MemorySpace wizard therefore hands users to a route that cannot reach the candidate review. PR #25 also descends from an older reverse-engineering pilot base, so the stack needs compatibility/rebase assessment after this regression is fixed. Do not describe MemorySpace, Memory Graph, story composer, or Memory Studio as deployed features until a verified merge and production SHA prove them.

## Service state

| Service | Production report | Independently proven |
| --- | --- | --- |
| Vercel | production deployment succeeds on `8859495` | Production alias and `/api/version` matched. Project settings/env keys/logs not inspected. |
| Supabase | public/server/auth/storage flags true | No; host DNS failed. Health, schema, migrations, RLS, storage, user flows unknown. |
| Stripe | checkout/webhook/subscriptions false | No active payment or entitlement evidence. |
| OpenAI | disabled | No provider request; no provider certification. |
| Telemetry | enabled with Supabase sink | No event delivery/row proof. |

## Source references

- `src/app/create/page.tsx`
- `src/components/SourceFirstThreadTales.tsx`
- `src/platform/threadtales/worker-client.ts`
- `src/app/api/**`
- Open PR implementation: `src/lib/memory-platform.ts`, `src/lib/memory-graph.ts`, `src/components/NewMemoryClient.tsx`, `src/components/MemoryCandidateReview.tsx`
