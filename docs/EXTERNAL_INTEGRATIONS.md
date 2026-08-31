# External Integrations

The free ThreadTales flow requires none of these services. Each integration is optional and must fail closed without breaking anonymous local analysis.

## Stripe

```text
code implemented: yes
credentials configured in repository: no (secrets are never committed)
test mode verified against live Stripe: not claimed
live mode verified: not claimed
```

Implemented boundary:

- direct server-side Stripe REST adapter;
- hosted Checkout Session;
- mode/product metadata only;
- raw-body webhook signature verification;
- server retrieval of Checkout Session before entitlement issuance;
- HMAC-signed premium entitlement;
- disabled-state browser coverage when env values are absent.

Required server-only variables:

```text
STRIPE_SECRET_KEY
STRIPE_PRICE_THREADTALES_PREMIUM
STRIPE_WEBHOOK_SECRET
ENTITLEMENT_SIGNING_SECRET
```

Configuration-gated Stripe is not a blocker for the free app if the disabled state remains green.

## Supabase

```text
code implemented: yes
dedicated Story Platform project configured: no dedicated project has been identified/applied in this implementation wave
schema applied: no
RLS verified against a live Story Platform database: not claimed
multi-user isolation verified live: not claimed
```

The connected Supabase project inspected during implementation contains unrelated campaign/agent/growth application tables. It was deliberately left unchanged. Do not apply `supabase/schema.sql` to that project.

Implemented boundary:

- magic-link auth adapter;
- user-session cookie;
- derived story persistence;
- raw ThreadTales payload rejection;
- RLS reference schema;
- PetLife household/member permissions;
- hashed one-time invitations;
- owner/member memory contribution path.

Required values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

The URL and publishable key are browser-safe public configuration. `SUPABASE_SECRET_KEY` is server-only and is used only for narrowly elevated backend operations.

Before activation in production:

1. create/select a dedicated Story Platform Supabase project;
2. review the current schema as a migration rather than blindly pasting SQL;
3. apply migration;
4. run Supabase security advisors;
5. verify owner/member/unrelated-user isolation with real test accounts;
6. configure only the dedicated project credentials in Vercel.

## OpenAI story enrichment

```text
provider abstraction implemented: yes
OpenAI provider implementation: yes
credentials configured in repository: no
real API request verified in this wave: not claimed
store=false behavior: implemented and covered by mocked request tests
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

Without the key, the product presents deterministic local mode and no AI network request is made.

## Telemetry

```text
code implemented: yes
allowlisted events instrumented: yes
external endpoint configured in repository: no
remote delivery verified live: not claimed
```

Allowed client dimensions are only:

```text
event
product
recognized story mode (optional)
```

`/api/telemetry` adds a server timestamp only after sanitization. If `TELEMETRY_ENDPOINT` is absent, it returns HTTP 202 and performs no external request.

Optional server-only values:

```text
TELEMETRY_ENDPOINT
TELEMETRY_API_KEY
```

The endpoint must be HTTPS.

## Activation principle

`code implemented` is not the same as `service configured`, and `service configured` is not the same as `production verified`. PR and deployment reports must keep these states separate.
