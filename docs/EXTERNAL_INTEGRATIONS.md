# External Integrations

## Current live evidence — 2026-10-01

Production's public integration endpoint reports Stripe checkout/webhook/subscriptions disabled and AI disabled. It reports Supabase public/server/auth/storage environment flags set and telemetry configured for Supabase. A real allowlisted telemetry smoke returned HTTP 502 (`fetch failed`). The exact-head Vercel Preview reports Stripe checkout/webhook and Supabase public/server/auth/storage configured, AI disabled, and Supabase telemetry enabled; the strict Preview smoke created a TEST Checkout Session but telemetry again did not deliver. The dedicated project was reported `INACTIVE`, and its host failed DNS resolution during verification. Environment flags are not proof of provider health.

The Preview can create a Stripe TEST Checkout Session, but no test payment, webhook, or entitlement has been verified. Supabase account/RLS/storage and OpenAI live requests remain unverified. The certification Preview exists and passes route checks; its strict integration gate remains red on AI and telemetry. See `PRODUCTION_CERTIFICATION.md` for exact evidence and owner actions.

The free ThreadTales flow requires none of these services. Each integration must fail closed without breaking anonymous local analysis. This document distinguishes implementation from actual activation.

## Stripe

```text
code implemented: yes
production status: checkout=false, webhook=false, subscriptions=false
test product/price: historical IDs exist in older notes; not re-read during this check
Preview TEST Checkout Session: created on candidate SHA `67b8777e32a6265cf3d2094f3db1d1e7f781fa37`
test payment/webhook/entitlement verified: no
live product/price/webhook verified: no
```

Historical test resource record (not re-read in this certification):

```text
product: prod_VAw1yBd5k9jxqB
one-time USD price ($9): price_1UAa91RB8OGmEnBwX3Z1GHqf
```

Older account notes say test-mode creation succeeded and creation endpoints were unavailable through that prior connection. This session has no connected Stripe account, so those permissions and product records are unverified today.

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
dedicated project named `threadtales-story-platform` exists per the canonical project handoff
current health: reported INACTIVE in the task handoff; direct host DNS lookup failed on 2026-10-01
remote migration history/schema: unverified
RLS verified against live Story Platform database: no
multi-user isolation verified live: no
```

An older 2026-09-01 checkpoint says project creation hit the account's free-project limit. That statement is historical: the current canonical handoff identifies an existing dedicated ThreadTales project. Restore that project; do not create a duplicate or repurpose another database.

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
production status: disabled (public `/api/integrations/status`)
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

Production currently reports AI disabled. Add an authorized server-side key through deployment secret management before testing.

## Telemetry

```text
code implemented: yes
allowlisted events instrumented: yes
Supabase server-only sink implemented: yes
production status: Supabase sink reported configured
production delivery: FAILED; allowlisted smoke returned HTTP 502 `fetch failed`
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
3. safe HTTP 202 no-op when neither exists. Production currently chooses Supabase but the send is failing; status flags do not establish delivery.

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
