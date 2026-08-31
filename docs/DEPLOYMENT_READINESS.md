# Deployment Readiness

## Deployment model

```text
production-all-phases
  -> PR #6
  -> GitHub Actions
  -> Vercel preview
  -> smoke/privacy verification
  -> merge decision
  -> main / production only after explicit merge
```

PR #6 must not be promoted over production during the verification wave.

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

This document does not authorize deployment. The verification wave leaves the current production deployment untouched. Production changes only after an explicit merge decision and deployment verification of the merged commit.
