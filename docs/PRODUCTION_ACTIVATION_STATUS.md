# Production Activation Status

Evidence refreshed 2026-10-13 against canonical GitHub state, production, and the current MemorySpace Preview. This file does not claim provider-backed certification.

## Current certification checkpoint (updated 2026-10-13)

Production `/api/version` returned `8859495cd9062eb2a6a842c80a75639453d61026`, the current canonical main SHA. Main CI run [38119383860](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38119383860) passed and Vercel deployment `6992138130` is successful. PR #19 merged on 2026-10-02 as `f5711507dd51c65799a8197504fe90a0f128694c`; PR #22 later merged the source-first experience, moving main and production to `8859495`.

The latest production integration-status response reports Stripe checkout/webhook/subscriptions disabled, AI disabled, and Supabase public/server/auth/storage configured with telemetry set to Supabase. These flags prove configuration presence only. The dedicated Supabase host failed DNS resolution; health, remote schema, migration state, RLS, storage, and telemetry delivery remain unknown. Current release and service evidence is in [CURRENT_TRUTH.md](CURRENT_TRUTH.md) and [PRODUCTION_CERTIFICATION.md](PRODUCTION_CERTIFICATION.md).

The MemorySpace implementation is staged in PRs #25–#28. PR #25's baseline head `f76176e` has a successful Preview, but CI run [38339878303](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38339878303) exposed a conversation handoff failure. A local fix now routes valid `memorySpaceId` requests to candidate review while preserving source-first bare `/create`; focused local flow passes. The fix has not yet been pushed or verified by hosted CI/Preview. PR #26 is marked dirty against its stacked base; green checks on PRs #26–#28 do not prove independent mergeability against current main.

The source-first main journey is locally processed and browser-tested, but human product UAT is missing. The required five-first-time-user review and real-device share tests have not been performed. Vercel settings/runtime logs and provider account resources could not be inspected; no current paid transaction was run.

### Historical PR #19 checkpoint (2026-10-02)

The detailed historical PR #19 provider attempt and implementation evidence are retained below this paragraph and in the historical section of [PRODUCTION_CERTIFICATION.md](PRODUCTION_CERTIFICATION.md). Do not use those pre-merge SHA/status claims as current release evidence.

Historical checkpoint for the `production-integrations-live` activation wave. PR #7 merged on 2026-09-01. The statements below that checkpoint describe what was observed on 2026-09-01; they are not current account truth. The 2026-10-13 evidence at the top of this document supersedes historical project-slot, Vercel-link, secret, and PR status claims.

## Repository baseline

```text
repository: rrahul0904/friendship-wrapped
production base main: 7cdcc71974fd22db3f5d43dd0c5769ace10a8474
activation branch: production-integrations-live
activation PR: #7
activation head before this checkpoint commit: 9a12235d40ac140dbc1d36b0053cedb011acfb93
production URL: https://threadtales-five.vercel.app
rollback deployment: dpl_CFhP6YdbAz3JLiXETyhxY6woUAsu
manual READY Preview: dpl_2Nzmbe6KxUTDYjkVyvENR6FiRzV3
```

Production CI run #135 on `9a12235d40ac140dbc1d36b0053cedb011acfb93` passed install, lint, typecheck, unit tests, production build, client-bundle secret scan, Chromium install, and browser smoke tests.

## Already live

The browser-local product surface remains healthy in production:

- ThreadTales local analyzer and Web Worker;
- deterministic analytics and story engine;
- privacy-safe sharing/export;
- occasion modes;
- keepsake/browser PDF;
- MyYear local MVP;
- PetLife local MVP.

The raw ThreadTales chat boundary remains browser-only.

## Activation code already completed in PR #7

- server-only Supabase configuration detection;
- privacy-safe Supabase `product_events` telemetry sink;
- server-write-only telemetry migration with browser roles revoked;
- `/api/integrations/status` boolean-only integration status endpoint;
- preview-only `/api/integrations/stripe-preview-smoke` route that refuses live Stripe keys and creates a real test Checkout Session when Preview secrets exist;
- integration-status, telemetry, and Stripe Preview smoke regression tests;
- `npm run verify:production` route verifier;
- strict `REQUIRE_ALL_INTEGRATIONS=1 npm run verify:production` gate.

Strict mode must prove real remote behavior, not only environment-variable presence:

1. create a real Stripe Checkout Session;
2. receive a real OpenAI enrichment response using safe derived-only input;
3. receive `accepted: true, delivered: true` from telemetry;
4. require Stripe webhook plus Supabase public/server configuration.

## Historical account findings — 2026-09-01; not current verified state

The following Vercel, Stripe, and Supabase account details were captured in the earlier activation wave on 2026-09-01. They are retained as historical handoff context and have not been re-verified in this certification.

### Historical Vercel details — superseded by the 2026-10-02 PR #19 Preview audit

Project:

```text
name: threadtales
project: prj_nkUfVeRw1fEQaROoAOOi4SI6GwVh
team: team_zmEezpOKGZy2sH5nqTfO44LD
framework: nextjs
node: 24.x
Git link: NONE (`link: null`)
```

The 2026-09-01 check found no Git link and no automatic PR Preview. This finding is historical: PR #19 later produced successful automatic Preview deployments, including exact audited SHA `ef7a94b5df4cdd460485f0f36c8b5bc483e13e1e`.

Current production deployment remains READY:

```text
dpl_CFhP6YdbAz3JLiXETyhxY6woUAsu
```

Current manual activation Preview remains READY:

```text
dpl_2Nzmbe6KxUTDYjkVyvENR6FiRzV3
```

Vercel runtime audit returned no current error clusters.

The connected Vercel tool surface can inspect projects, deployments, builds and runtime logs, but does not expose project environment-variable writes or Git-link mutation. Supported owner-side activation paths are Vercel Project Settings, `vercel env add`, or Vercel Project Env/Git APIs with an authorized token.

### Historical Stripe details

Connected account: Rahul Singh (`acct_1QrNa7RB8OGmEnBw`).

### TEST

```text
product: prod_VAw1yBd5k9jxqB
price: price_1UAa91RB8OGmEnBwX3Z1GHqf
amount: USD 9.00 one-time
active: true
livemode: false
```

### LIVE

```text
product: prod_VAwYeFKyjsvtW1
price: price_1UAafNRB8OGmEnBw0jaCUXdm
amount: USD 9.00 one-time
active: true
livemode: true
```

Both prices were re-read directly from Stripe and are active.

There are still zero ThreadTales test Checkout Sessions. The connected Stripe API search still exposes Checkout Session reads but not Checkout Session creation, so the application's own Vercel server route must perform the real test Checkout after the TEST secret is installed in Preview.

Current TEST webhooks belong only to Provenance Cleaner and were left unchanged. There is no ThreadTales test webhook yet.

Current LIVE webhook list is empty. Do not create ThreadTales webhook endpoints until each generated `whsec_...` can be stored immediately in the matching Vercel environment.

Required Vercel Stripe configuration:

### Preview

```text
STRIPE_SECRET_KEY=<TEST secret key>
STRIPE_PRICE_THREADTALES_PREMIUM=price_1UAa91RB8OGmEnBwX3Z1GHqf
ENTITLEMENT_SIGNING_SECRET=<unique strong Preview secret>
```

### Production

```text
STRIPE_SECRET_KEY=<LIVE secret key>
STRIPE_PRICE_THREADTALES_PREMIUM=price_1UAafNRB8OGmEnBw0jaCUXdm
ENTITLEMENT_SIGNING_SECRET=<unique strong Production secret>
NEXT_PUBLIC_SITE_URL=https://threadtales-five.vercel.app
```

Do not put any secret values in Git, PR text, logs, or chat.

### Historical Supabase details

Organization:

```text
BruceWayne_RahulSingh
organization id: lfpgusafjkdqnfygykiv
```

Current active projects are unrelated applications and remain untouched:

```text
mioyiocrgdghmajyzzic
cikxzxxreryycfjumwsd (provenance-cleaner)
```

A fresh project-cost check on 2026-09-01 again returned `$0/month` for a new project. Cost confirmation was completed and creation of `threadtales-story-platform` in `us-east-2` was retried. Supabase rejected creation only because the account owner remains at the 2-active-free-project limit.

Do not repurpose, pause, or delete either unrelated project without explicit owner approval.

After one additional active-project slot exists:

1. create `threadtales-story-platform`;
2. wait for `ACTIVE_HEALTHY`;
3. apply all Story Platform migrations, including `20260831_product_events.sql`;
4. retrieve modern publishable/server keys;
5. configure auth redirects;
6. run security and performance advisors;
7. verify Owner / permitted Member / denied Member / Unrelated User RLS across SELECT/INSERT/UPDATE/DELETE;
8. install Preview/Production Supabase variables in Vercel;
9. verify ThreadTales, MyYear and PetLife persistence, household collaboration and telemetry.

## Production cloud/AI state

Production currently confirms these integrations are still disabled rather than mysteriously failing:

```text
GET /api/ai/enrich
200 { enabled: false, provider: null }

GET /api/stories
401 Sign in to save and reopen stories.

GET /api/petlife
401 Sign in to use PetLife cloud features.
```

The exact Preview and production integration endpoints report Supabase and telemetry environment flags present; these do not prove provider health or successful database access. Unauthenticated stories and PetLife API reads return 401. The AI provider code uses the Responses API with `store: false`, an allowlisted ThreadTales fact schema, chapter-type labels, and explicit consent for the selected-snippet path. Preview AI is disabled; the public endpoint has no rate limit or usage quota, so platform-side controls are required before a key is enabled.

Required Vercel OpenAI configuration:

```text
OPENAI_API_KEY=<server-only project key>
OPENAI_STORY_MODEL=<currently verified supported model>
```

Verify current OpenAI model/API documentation at activation time rather than assuming an older model ID remains current.

## Telemetry

The built-in Supabase telemetry sink stores only:

```text
event
product
recognized mode or null
created_at
```

Browser roles receive no direct table privileges. Telemetry becomes live automatically when the dedicated Supabase server configuration is installed unless an approved HTTPS `TELEMETRY_ENDPOINT` is configured instead.

Strict verification requires actual delivery (`delivered: true`).

## SUPERSEDED — historical owner-action checklist (2026-09-01)

The following checklist records the 2026-09-01 activation attempt. It is not current account truth or the active merge rule. Current provider evidence and owner actions are in [PRODUCTION_CERTIFICATION.md](PRODUCTION_CERTIFICATION.md).

### ACTION 1 — Vercel Git linkage

In Vercel project `threadtales`, connect the existing project to:

```text
GitHub repository: rrahul0904/friendship-wrapped
Production branch: main
Preview deployments: enabled
```

Do not create a second Vercel project.

### ACTION 2 — Vercel environment secrets

Install the required Preview and Production server variables directly in Vercel. Never paste their secret values into chat or Git.

Preview requires TEST Stripe secret, TEST price ID, unique Preview entitlement signing secret, Supabase variables after project creation, and OpenAI variables.

Production requires LIVE Stripe secret, LIVE price ID, unique Production entitlement signing secret, `NEXT_PUBLIC_SITE_URL=https://threadtales-five.vercel.app`, Supabase variables after project creation, and OpenAI variables.

Leave `STRIPE_WEBHOOK_SECRET` unset until the webhook endpoints are created; install each generated signing secret immediately afterward.

### ACTION 3 — Supabase capacity (historical)

The earlier attempt said creating a new project was blocked by the account's free-project quota. The current handoff identifies an existing dedicated ThreadTales project; restore and verify that project instead of creating a duplicate.

Do not delete/pause either unrelated project unless explicitly intended.

### ACTION 4 — OpenAI project key

Create/authorize a server-side OpenAI API key for ThreadTales and store it directly in Vercel as `OPENAI_API_KEY`. Do not paste the key into chat.

## Historical continuation plan — superseded

Resume without another architecture phase:

```text
create dedicated Supabase project
→ apply migrations
→ RLS/advisor verification
→ install Supabase Vercel config
→ automatic Vercel Preview
→ real Stripe TEST Checkout Session
→ complete TEST payment
→ create/install TEST webhook
→ webhook delivery
→ entitlement verification
→ Auth/cloud/MyYear/PetLife household tests
→ real OpenAI privacy-trap request
→ telemetry delivered=true
→ strict Preview verifier
→ final PR #7 CI
→ READY TO MERGE
→ merge exact verified head
→ merged-main CI
→ automatic exact-SHA Production deployment
→ configure/verify LIVE Stripe webhook and Checkout creation
→ production route/API/browser/runtime/privacy audit
→ FULLY LIVE
```

## Current release classification

This paragraph is retained as a historical release snapshot and is superseded by the current status at the top of this document and [CURRENT_TRUTH.md](CURRENT_TRUTH.md). It described the candidate and production state at the time it was written; do not use its SHA or review status as current. Certification remains **NOT COMPLETE**.
