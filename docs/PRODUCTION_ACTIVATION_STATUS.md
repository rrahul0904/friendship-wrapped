# Production Activation Status

Last updated: 2026-09-01

This is the resumable checkpoint for the `production-integrations-live` activation wave. Do not merge PR #7 until the external-service gates below are genuinely active and verified.

## Repository baseline

```text
repository: rrahul0904/friendship-wrapped
production base main: 7cdcc71974fd22db3f5d43dd0c5769ace10a8474
activation branch: production-integrations-live
activation PR: #7
production URL: https://threadtales-five.vercel.app
rollback deployment: dpl_CFhP6YdbAz3JLiXETyhxY6woUAsu
latest verified activation CI before this docs commit: 036904c62a7826ef063991d93f11faffb9357dc0 / run #134
```

## What is already live

The browser-local product surface remains healthy in production:

- ThreadTales local analyzer and Web Worker processing;
- deterministic analytics and story engine;
- privacy-safe sharing/export;
- occasion modes;
- keepsake/browser PDF;
- MyYear local MVP;
- PetLife local MVP.

The raw ThreadTales chat boundary remains browser-only.

## Activation code completed in PR #7

- server-only Supabase configuration detection;
- privacy-safe Supabase `product_events` telemetry sink;
- server-write-only telemetry migration with browser roles revoked;
- `/api/integrations/status` boolean-only integration status endpoint;
- preview-only `/api/integrations/stripe-preview-smoke` route that refuses live Stripe keys and creates a real test Checkout Session when Preview secrets exist;
- integration-status, telemetry, and Stripe Preview smoke regression tests;
- `npm run verify:production` route verifier;
- strict `REQUIRE_ALL_INTEGRATIONS=1 npm run verify:production` gate.

The strict verifier now exercises remote integrations rather than trusting configuration booleans alone. In strict mode it must:

1. create a real Stripe Checkout Session (`cs_test_...` for Preview or live Stripe Checkout for Production);
2. receive a real OpenAI enrichment response through `/api/ai/enrich` using safe derived-only input;
3. receive `accepted: true, delivered: true` from `/api/telemetry`;
4. still require Stripe webhook, Supabase public/server configuration, AI, and telemetry status gates.

## CI

Production CI run #134 on `036904c62a7826ef063991d93f11faffb9357dc0` passed:

```text
install            PASS
lint               PASS
typecheck          PASS
unit tests         PASS
production build   PASS
client secret scan PASS
Chromium install   PASS
browser smoke      PASS
```

## Vercel

Project:

```text
threadtales
prj_nkUfVeRw1fEQaROoAOOi4SI6GwVh
team_zmEezpOKGZy2sH5nqTfO44LD
```

Production remains healthy on `dpl_CFhP6YdbAz3JLiXETyhxY6woUAsu` and no recent runtime error clusters were found.

A manual READY Preview exists (`dpl_2Nzmbe6KxUTDYjkVyvENR6FiRzV3`) whose build output contains the PR #7 activation routes, including `/api/integrations/status` and `/api/integrations/stripe-preview-smoke`.

Automatic Git-based PR Preview deployment is still not proven. The connected Vercel surface can read projects/deployments/logs and create deployments, but it does not expose project environment-variable writes or Git-integration mutation. Official supported activation paths are Vercel Project Settings, `vercel env add`, or the Vercel Project Env REST/SDK API using authorized credentials.

## Stripe

Connected account: Rahul Singh.

### Test resource

```text
product: prod_VAw1yBd5k9jxqB
price: price_1UAa91RB8OGmEnBwX3Z1GHqf
amount: USD 9.00 one time
active: yes
```

### Live resource

```text
product: prod_VAwYeFKyjsvtW1
price: price_1UAafNRB8OGmEnBw0jaCUXdm
amount: USD 9.00 one time
active: yes
```

The connected Stripe surface still exposes Checkout Session reads but not `POST /v1/checkout/sessions`. This is not an application architecture blocker: ThreadTales already calls Stripe REST directly from its server route using `STRIPE_SECRET_KEY`.

No test Checkout Session has yet been created in the Stripe account, so test Checkout is not verified.

Do not switch to Payment Links merely to bypass this connector limitation.

### Required Vercel Stripe configuration

Preview:

```text
STRIPE_SECRET_KEY=<test secret key>
STRIPE_PRICE_THREADTALES_PREMIUM=price_1UAa91RB8OGmEnBwX3Z1GHqf
ENTITLEMENT_SIGNING_SECRET=<unique strong preview secret>
```

Production:

```text
STRIPE_SECRET_KEY=<live secret key>
STRIPE_PRICE_THREADTALES_PREMIUM=price_1UAafNRB8OGmEnBw0jaCUXdm
ENTITLEMENT_SIGNING_SECRET=<unique strong production secret>
NEXT_PUBLIC_SITE_URL=https://threadtales-five.vercel.app
```

Do not put these secrets in Git or chat.

Create Stripe test/live webhooks only after their `whsec_...` values can be installed immediately in the corresponding Vercel environment as `STRIPE_WEBHOOK_SECRET`.

## Supabase

Organization:

```text
BruceWayne_RahulSingh
organization id: lfpgusafjkdqnfygykiv
```

Current active projects are unrelated applications and were not modified:

```text
mioyiocrgdghmajyzzic
cikxzxxreryycfjumwsd (provenance-cleaner)
```

Supabase reports a new `threadtales-story-platform` project in `us-east-2` would cost `$0/month`. Project creation was retried on 2026-09-01 after a fresh cost confirmation and failed again because the account owner is at the two-active-free-project limit.

Do not repurpose, pause, or delete either unrelated project without explicit owner approval.

Smallest required account action: add one Supabase active-project slot (upgrade/increase capacity), or explicitly authorize pausing/deleting one unrelated project.

After capacity exists:

1. create `threadtales-story-platform`;
2. apply all Story Platform migrations including `20260831_product_events.sql`;
3. configure modern publishable/server keys;
4. configure auth redirects;
5. run security advisors;
6. verify Owner / permitted Member / denied Member / Unrelated User RLS behavior across SELECT/INSERT/UPDATE/DELETE;
7. install Preview/Production Supabase variables in Vercel;
8. verify ThreadTales, MyYear and PetLife persistence plus household collaboration and telemetry.

## OpenAI

The existing provider uses the Responses API, `store: false`, a configurable model, derived ThreadTales facts, and share-safe chapters. Selected snippets require explicit consent and are capped by the current 600-character contract.

Current blocker: no authorized `OPENAI_API_KEY` is available in the Vercel deployment environment through the connected tools.

Required deployment values:

```text
OPENAI_API_KEY=<server-only key>
OPENAI_STORY_MODEL=gpt-5.6-luna
```

Do not put the key in Git, chat, or `NEXT_PUBLIC_*`.

After configuration, the strict production verifier performs a real safe AI request before the release can pass.

## Telemetry

The PR #7 Supabase sink stores only:

```text
event
product
recognized mode or null
created_at
```

Browser roles are explicitly denied direct table privileges. Telemetry becomes live when the dedicated Supabase server configuration is installed, unless an approved HTTPS `TELEMETRY_ENDPOINT` is supplied instead.

The strict verifier requires actual delivery (`delivered: true`).

## Current release blockers

1. **Vercel environment write access** — required server secrets cannot be installed through the currently connected Vercel tool surface.
2. **Supabase capacity** — dedicated project creation is rejected by the two-active-free-project limit.
3. **OpenAI deployment credential** — `OPENAI_API_KEY` is not available through an authorized secret-management surface.
4. **Stripe end-to-end test** — requires the Stripe test secret installed in Vercel Preview so the application's own `/api/checkout` path can create a real test Checkout Session.
5. **Stripe webhook verification** — intentionally deferred until the generated webhook signing secret can be immediately stored in Vercel.
6. **Automatic Vercel Git previews** — manual Preview works, but automatic PR Preview linkage is not yet verified/repaired.

## Merge rule

PR #7 remains open/draft. Do not merge until all of the following are green:

```text
repository CI                PASS
Vercel Preview               PASS
Stripe test Checkout         PASS
Stripe webhook               PASS
entitlement                  PASS
Stripe live configuration    PASS
dedicated Supabase project   PASS
RLS isolation                PASS
Auth                         PASS
story persistence            PASS
MyYear persistence           PASS
PetLife cloud/collaboration  PASS
OpenAI real request          PASS
telemetry delivery           PASS
privacy audit                PASS
strict integration verifier  PASS
```

Current classification: **NOT FULLY LIVE — EXTERNAL ACCOUNT/SECRET-MANAGEMENT GATES REMAIN**.
