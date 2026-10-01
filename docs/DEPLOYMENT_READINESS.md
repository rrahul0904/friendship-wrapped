# Deployment Readiness

## Current release checkpoint — 2026-10-01

PR #17 is merged. The canonical main SHA and production `/api/version` are both `067c3d635e45413514850fb7fcab4504822ee216`; main CI run [34925302823](https://github.com/rrahul0904/friendship-wrapped/actions/runs/34925302823) passed. Draft [PR #19](https://github.com/rrahul0904/friendship-wrapped/pull/19) is at `67b8777e32a6265cf3d2094f3db1d1e7f781fa37`; exact-head CI [36910230791](https://github.com/rrahul0904/friendship-wrapped/actions/runs/36910230791) passed, and Vercel created a successful exact-head Preview.

The branch passes the production build and 49/49 Chromium E2E tests; all code checks also pass on hosted CI. Preview route verification succeeds and a TEST Checkout Session was created, but the strict Preview gate remains red because AI is disabled and telemetry delivery fails. Supabase account/RLS/storage, Stripe payment/webhook/entitlement, and OpenAI request flows remain uncertified. The Vercel dashboard still requires login to inspect project settings and build/runtime logs. Do not treat historical PR #6/#7 gates below as open PRs.

## Deployment model

Historical PR #6 deployment model (PR #6/#7/#13/#17 status is in the current release checkpoint above):

```text
production-all-phases
  -> PR #6
  -> GitHub Actions
  -> Vercel preview
  -> smoke/privacy verification
  -> merge decision
  -> main / production only after explicit merge
```

PR #6 is historical and is not an open merge decision.

## Required clean verification

The final branch head must pass one complete run of:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions must independently pass the equivalent sequence on the PR merge ref.

## Required preview routes

The latest preview must render without unexpected 500s:

```text
/
/create
/occasions
/occasions/anniversary
/products
/products/myyear
/products/petlife
/account
/privacy
```

The premium success page may be opened only as a non-payment smoke check; no purchase should be claimed without a verified Stripe Session.

## Disabled-integration expectations

A preview without optional credentials must still support ordinary free routes.

Expected behavior:

- Stripe absent → premium CTA returns a controlled configuration message, not an application crash.
- Supabase absent → cloud save / PetLife collaboration show local-mode messaging.
- OpenAI absent → deterministic story mode remains available.
- telemetry endpoint absent → allowlisted events produce no user-facing error and no remote delivery.

## Browser checks

Inspect the preview for:

- uncaught JavaScript errors;
- hydration failures;
- unexpected API 500s;
- CORS problems;
- failed worker loading;
- secret values in page/client output.

## Secret boundary

The following must remain server-only:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ENTITLEMENT_SIGNING_SECRET
SUPABASE_SECRET_KEY
OPENAI_API_KEY
TELEMETRY_API_KEY
```

Only intentionally public configuration may use `NEXT_PUBLIC_`.

## External services

A configuration-gated optional integration does not block merging when:

1. its code and disabled behavior are tested;
2. missing credentials do not break free routes;
3. documentation states that live verification has not occurred;
4. no secret is required at build time.

See `EXTERNAL_INTEGRATIONS.md` for the activation state of Stripe, Supabase, AI and telemetry.

## Final classification

PR #6 may be marked `READY TO MERGE` only when all of these are true on the final head:

```text
npm ci              PASS
lint                PASS
typecheck           PASS
unit tests          PASS
production build    PASS
Playwright          PASS
GitHub Actions      PASS
privacy audit       PASS
Vercel preview      PASS
```

Otherwise the final report must say `NOT READY TO MERGE` and list exact blockers.

## Production policy

The requested web deployment should use the existing Vercel project `threadtales`. A hosted Preview of the exact pushed branch is the next deployment step once Vercel and GitHub access are available. Keep production on the current merged SHA until all mandatory Preview and account-backed integration gates in the certification report pass; then deploy the exact approved merge SHA.
