# Production Activation Status

Last verified against public source, current PR Preview, and production endpoints: 2026-10-01. This update does not claim authenticated provider certification.

## Current certification checkpoint (updated 2026-10-02)

The deployed main SHA is `067c3d635e45413514850fb7fcab4504822ee216`, also returned by production `/api/version`. GitHub confirms PR #7, #13, and #17 have merged. Draft [PR #19](https://github.com/rrahul0904/friendship-wrapped/pull/19) is open against `main`; its latest remotely audited head is `ef7a94b5df4cdd460485f0f36c8b5bc483e13e1e`. The working candidate includes additional local AI privacy boundary changes that still need commit and exact-head CI/Preview verification.

Production `/api/integrations/status` reports Stripe checkout/webhook/subscriptions disabled, AI disabled, and Supabase public/server/auth/storage variables present with telemetry configured for Supabase. These flags prove environment presence only. They do not establish project identity, database health, migration state, RLS, storage access, or telemetry delivery. The dedicated Supabase ref `pkmkynhkgitdslhadupj` failed DNS resolution during the current audit; its health and database state need connected provider access to verify.

The certification branch now passes clean dependency audit (0 vulnerabilities), lint (0 errors; 17 warnings), typecheck, 179 unit tests, and the unchanged performance budget (100,000 messages in 1,146ms on isolated rerun). The optimized Next.js build completed, and all 49 Chromium E2E tests passed against that production build. Separately, the deployed production `/create?demo=1` flow rendered at desktop (1440px) and mobile (390px) with no overflow or page errors. That browser smoke applies to current production main, not the unpushed branch. Public production route verification found `/admin` redirects to `/app?admin=denied`; the verifier follows protected internal redirects and requires eventual login/denial.

GitHub access is available. Draft PR #19's audited head `ef7a94b5df4cdd460485f0f36c8b5bc483e13e1e` passed exact-head CI [36911136761](https://github.com/rrahul0904/friendship-wrapped/actions/runs/36911136761), and Vercel automatically produced a successful Preview at `https://threadtales-iekpoesmx-rrahul0904-5013s-projects.vercel.app`; Preview `/api/version` reports that exact SHA. All 19 public and 16 protected routes passed read-only checks. The Vercel dashboard, CLI auth, and project context are unavailable, so project settings and build/runtime logs cannot be inspected from this session.

The strict Preview verifier at implementation SHA `67b8777e32a6265cf3d2094f3db1d1e7f781fa37` created a Stripe TEST Checkout Session but failed truthfully: AI is disabled and the allowlisted telemetry event was not delivered. That implementation is the source-identical ancestor of the audited documentation follow-up at `ef7a94b5`. No test payment/webhook, authenticated Supabase/RLS/storage path, production change, or merge has occurred. The current local candidate also adds server-side projection of AI chapter data and a bounded request body; focused regression tests pass but hosted verification is pending.

See [CERTIFICATION_BASELINE.md](CERTIFICATION_BASELINE.md) for the evidence matrix and [PRODUCTION_CERTIFICATION.md](PRODUCTION_CERTIFICATION.md) for remaining gates.

Historical checkpoint for the `production-integrations-live` activation wave. PR #7 merged on 2026-09-01. The statements below that checkpoint describe what was observed on 2026-09-01; they are not current account truth. The 2026-10-01 evidence at the top of this document supersedes historical project-slot, Vercel-link, secret, and PR status claims.

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

### Historical Vercel details — superseded by the 2026-10-01 PR #19 Preview audit

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
503 Supabase persistence is not configured.

GET /api/petlife
503 Supabase persistence is not configured for PetLife.
```

The AI provider code remains ready for Responses API usage with `store: false`, a derived ThreadTales allowlist, share-safe chapters, and explicit consent for the selected-snippet path.

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

Code merge readiness is based on the pushed PR candidate's exact-head CI, independent review, and repository-required checks. Provider access and UAT gates are tracked separately and still block full production certification. The latest audit found no branch protection configured on `main`, but the candidate still requires its new hosted run and review. Production `/api/version` last returned `067c3d635e45413514850fb7fcab4504822ee216`. Current results and owner actions are in [PRODUCTION_CERTIFICATION.md](PRODUCTION_CERTIFICATION.md); certification remains **NOT COMPLETE**.
