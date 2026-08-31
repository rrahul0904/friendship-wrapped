# External Integrations

The free ThreadTales flow requires none of these services. Each integration must fail closed without breaking anonymous local analysis. This document distinguishes implementation from actual activation.

## Stripe

```text
code implemented: yes
test product configured: yes
test checkout API write permission: blocked by current connected Stripe scope
live product configured: no
production checkout verified: no
```

Dedicated test resources created for ThreadTales:

```text
product: prod_VAw1yBd5k9jxqB
one-time USD price ($9): price_1UAa91RB8OGmEnBwX3Z1GHqf
```

The connected Stripe account already contained products for other applications; they were deliberately left unchanged. Test mode accepted creation of the isolated ThreadTales product. The current connected scope does not permit `PostCheckoutSessions`, and live mode does not permit `PostProducts`; Stripe account re-consent/permission expansion is required before checkout/webhook/live activation can be completed.

Implemented boundary:

- direct server-side Stripe REST adapter;
- hosted Checkout Session;
- product/mode metadata only;
- raw-body webhook signature verification;
- server retrieval of Checkout Session before entitlement issuance;
- Checkout recovery requires both `payment_status = paid` and `status = complete`;
- HMAC-signed premium entitlement;
- disabled-state browser coverage when env values are absent.

Required server-only production values:

```text
STRIPE_SECRET_KEY
STRIPE_PRICE_THREADTALES_PREMIUM
STRIPE_WEBHOOK_SECRET
ENTITLEMENT_SIGNING_SECRET
```

No raw ThreadTales chat or derived result payload is sent to Stripe.

## Supabase

```text
code implemented: yes
dedicated Story Platform project configured: no
schema applied: no
RLS verified against live Story Platform database: no
multi-user isolation verified live: no
```

The connected organization currently has two active projects, both belonging to other applications. A new `threadtales-story-platform` project was attempted in `us-east-2`; Supabase reported a $0/month project cost but rejected creation because the account has reached its two-active-free-project limit.

Neither existing project was paused, deleted, repurposed, or modified.

Activation requires either:

1. an additional Supabase project slot / plan upgrade; or
2. explicit owner authorization to retire an unrelated project outside this repository's release process.

The second option must never be performed automatically from this repository.

Implemented boundary:

- magic-link auth adapter;
- user-session cookie;
- derived story persistence;
- raw ThreadTales payload rejection;
- RLS reference schema;
- PetLife household/member permissions;
- hashed one-time invitations;
- owner/member memory contribution path;
- server-only privacy-safe `product_events` telemetry migration.

Required values after a dedicated project exists:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

Before production activation:

1. provision the dedicated project;
2. apply repository migrations;
3. run Supabase security advisors;
4. verify owner/member/unrelated-user isolation with real test identities;
5. configure only the dedicated project's credentials in Vercel.

## OpenAI story enrichment

```text
provider abstraction implemented: yes
OpenAI provider implementation: yes
credentials configured in production: no
real production request verified: no
store=false behavior: implemented and unit-tested
```

The provider uses the OpenAI Responses API. Default model configuration is `gpt-5.6-luna`, overridable by `OPENAI_STORY_MODEL`.

Default ThreadTales AI payload contains only allowlisted derived metrics and share-safe deterministic chapters. A user-selected snippet is limited to 600 characters and requires explicit consent.

Required server-only value:

```text
OPENAI_API_KEY
```

Optional:

```text
OPENAI_STORY_MODEL
```

Production currently reports AI disabled until an authorized API key is installed in Vercel.

## Telemetry

```text
code implemented: yes
allowlisted events instrumented: yes
Supabase server-only sink implemented: yes
external endpoint configured in production: no
production delivery verified: no
```

Allowed client dimensions remain only:

```text
event
product
recognized story mode (optional)
```

The API sanitizes the payload before delivery. Sink precedence is:

1. configured HTTPS `TELEMETRY_ENDPOINT`;
2. dedicated Supabase `product_events` table when server persistence is configured;
3. safe HTTP 202 no-op when neither exists.

The `product_events` migration grants no browser-role table access. It contains only event, product, optional recognized mode and database timestamp; no arbitrary JSON or private content is stored.

## Vercel activation

```text
production project: threadtales
canonical URL: https://threadtales-five.vercel.app
current production state: READY
automatic PR preview deployment observed for activation branch: no
environment-variable write capability available to current connected agent: no
```

The current connected Vercel surface supports project/deployment/log inspection and deployment operations but does not expose project environment-variable or Git-integration mutations. Those account-level settings must be authorized through a Vercel write-capable surface before the external services can become live.

## Safe status endpoint

The activation branch exposes:

```text
GET /api/integrations/status
```

It reports capability booleans and provider/sink names only. It never returns credential values. The final production verifier uses this endpoint as the strict integration gate.

## Activation principle

`code implemented` is not the same as `service configured`, and `service configured` is not the same as `production verified`. Do not call the platform `FULLY LIVE` until the strict production verifier and integration-level checks pass.