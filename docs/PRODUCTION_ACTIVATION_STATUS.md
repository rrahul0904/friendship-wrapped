# Production Activation Status

Last updated: 2026-08-31

This file is the resumable checkpoint for the `production-integrations-live` release wave. It records what is live, what is implemented but blocked by external account configuration, and the exact gates required before PR #7 can merge.

## Baseline

```text
repository: rrahul0904/friendship-wrapped
production base main: 7cdcc71974fd22db3f5d43dd0c5769ace10a8474
activation branch: production-integrations-live
activation PR: #7
production URL: https://threadtales-five.vercel.app
rollback deployment: dpl_CFhP6YdbAz3JLiXETyhxY6woUAsu
```

## Current capability matrix

| Capability | Implemented | Account configured | Production verified | State |
| --- | ---: | ---: | ---: | --- |
| ThreadTales local analyzer | yes | n/a | yes | LIVE |
| Story/share/export | yes | n/a | yes | LIVE |
| Occasion modes | yes | n/a | yes | LIVE |
| Keepsake/browser PDF | yes | n/a | yes | LIVE |
| MyYear local MVP | yes | n/a | yes | LIVE |
| PetLife local MVP | yes | n/a | yes | LIVE |
| Stripe premium | yes | live product/price created; Checkout write still unavailable | no | BLOCKED |
| Premium entitlements | yes | partial dependency | no live payment verification | BLOCKED |
| Supabase Auth | yes | no dedicated project | no | BLOCKED |
| Story cloud save | yes | no dedicated project | no | BLOCKED |
| MyYear cloud save | yes | no dedicated project | no | BLOCKED |
| PetLife cloud sync | yes | no dedicated project | no | BLOCKED |
| PetLife household collaboration | yes | no dedicated project | no | BLOCKED |
| OpenAI enrichment | yes | no production API key | no | BLOCKED |
| Privacy-safe telemetry | yes | no live sink | no | BLOCKED |
| Automatic Vercel PR previews | application compatible | Git integration not producing branch preview | no | BLOCKED |

## Verified production baseline

The currently deployed production app remains usable for all browser-local functionality. Production checks confirm:

- `/` responds successfully;
- `/create` responds successfully;
- `/products/myyear` responds successfully with the MyYear builder;
- `/products/petlife` responds successfully with the PetLife MVP;
- Vercel reports no runtime error clusters in the inspected baseline;
- `/api/ai/enrich` reports AI disabled rather than failing unexpectedly;
- `/api/stories` and `/api/petlife` fail closed with explicit Supabase-not-configured responses.

Those 503 configuration responses are activation blockers, not unknown runtime failures.

## Stripe checkpoint

Connected Stripe account: Rahul Singh.

### Test mode

Dedicated ThreadTales test resource:

```text
product: prod_VAw1yBd5k9jxqB
price: price_1UAa91RB8OGmEnBwX3Z1GHqf
amount: USD 9.00 one time
```

### Live mode

After Stripe re-consent, live `product_write` became available and the dedicated production resource was created successfully:

```text
product: prod_VAwYeFKyjsvtW1
price: price_1UAafNRB8OGmEnBw0jaCUXdm
amount: USD 9.00 one time
billing model: one-time payment
```

No unrelated Stripe product was reused or modified.

### Remaining Stripe blocker

The refreshed connected Stripe key still does not have the permission required for `PostCheckoutSessions`. Stripe explicitly rejects Checkout Session write access even though product writes now work.

Therefore the application cannot yet truthfully pass the required real test Checkout flow through its existing `/api/checkout` architecture.

Do not replace the existing Checkout Session architecture with Payment Links or another billing flow merely to bypass this permission boundary.

After Checkout Session permission is available:

1. verify test Checkout Session creation using `price_1UAa91RB8OGmEnBwX3Z1GHqf`;
2. create/configure test webhook only when its signing secret can immediately be installed into the target deployment;
3. exercise the test payment + paid/complete recovery path;
4. verify signed entitlement issuance and tamper rejection;
5. configure production with live price `price_1UAafNRB8OGmEnBw0jaCUXdm`;
6. create/configure the production webhook only when its signing secret can immediately be installed into Vercel;
7. do not perform an unnecessary real customer charge.

## Supabase checkpoint

Organization: `BruceWayne_RahulSingh`.

A dedicated `threadtales-story-platform` project was requested in `us-east-2` after Supabase reported a $0/month cost. Creation was rejected because the account has reached its two-active-free-project limit.

The two existing projects belong to other applications and were not modified.

Required resolution:

- increase the Supabase active-project allowance / upgrade, or
- independently retire an unrelated project with explicit owner approval.

After a slot is available:

1. create `threadtales-story-platform`;
2. apply repository migrations including `20260831_product_events.sql`;
3. retrieve supported publishable/server keys;
4. configure auth redirect URLs;
5. run security advisors;
6. verify owner/member/unrelated-user RLS behavior;
7. install dedicated project credentials into Vercel.

## OpenAI checkpoint

The application provider is ready and current:

- Responses API;
- configurable model;
- default `gpt-5.6-luna`;
- `store: false`;
- default ThreadTales payload uses allowlisted derived facts/share-safe chapters;
- selected snippet requires explicit consent and length validation.

Current blocker: no authorized production `OPENAI_API_KEY` is available to the deployment environment.

After authorization, perform one real privacy-trap request through the deployed route before marking AI live.

## Telemetry checkpoint

The activation branch now supports a built-in Supabase sink. `product_events` is server-write-only and stores only:

```text
event
product
recognized mode or null
created_at
```

No browser role receives table access.

Telemetry becomes live automatically when the dedicated Supabase server configuration is installed, unless an explicit HTTPS `TELEMETRY_ENDPOINT` is configured instead.

## Vercel checkpoint

Current production project/deployment remains healthy. The connected Vercel capability used in this release can inspect deployments/logs and deploy builds, but it does not expose project environment-variable writes or Git-integration mutation.

No automatic activation-branch preview deployment was observed after PR #7 opened.

Required resolution: grant/use a Vercel write-capable project-settings surface so Preview/Production environment variables and Git integration can be configured.

## Strict production verifier

The activation branch adds:

```bash
npm run verify:production
```

which checks public production routes and the safe integration status endpoint.

The final release gate is:

```bash
REQUIRE_ALL_INTEGRATIONS=1 npm run verify:production
```

That strict command must fail while any of Stripe Checkout/webhook, Supabase public/server config, AI, or telemetry remains disabled.

## Merge rule

PR #7 must remain open/draft until:

- repository CI is green;
- dedicated Supabase integration + RLS isolation are live-verified;
- Stripe test checkout passes and production resources are configured;
- a real OpenAI request passes the privacy boundary;
- telemetry delivery is confirmed;
- automatic Vercel Preview deployment is restored;
- Preview smoke/runtime checks pass;
- strict production verifier can pass after merge/deployment.

Do not classify this release as `FULLY LIVE` before those gates are complete.
