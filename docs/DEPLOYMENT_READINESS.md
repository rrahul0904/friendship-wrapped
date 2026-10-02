# Deployment Readiness

## Current release checkpoint — 2026-10-01

PR #17 is merged. The canonical main SHA and production `/api/version` are both `067c3d635e45413514850fb7fcab4504822ee216`; main CI run [34925302823](https://github.com/rrahul0904/friendship-wrapped/actions/runs/34925302823) passed. Draft [PR #19](https://github.com/rrahul0904/friendship-wrapped/pull/19) is open at audited head `ef7a94b5df4cdd460485f0f36c8b5bc483e13e1e`; exact-head CI [36911136761](https://github.com/rrahul0904/friendship-wrapped/actions/runs/36911136761) passed, and Vercel produced a successful exact-head Preview at `https://threadtales-iekpoesmx-rrahul0904-5013s-projects.vercel.app`.

The prior candidate passed production build and 49/49 Chromium E2E tests. Exact Preview route verification passed all 19 public and 16 protected routes, and a TEST Checkout Session was created. Strict Preview certification remains incomplete: AI is disabled, telemetry delivery failed, and Supabase health/migrations/RLS/storage, Stripe payment/webhook/entitlement, and authenticated cloud flows remain uncertified. Current local changes add an AI privacy projection and a 16 KiB request-body cap; focused tests, typecheck, and targeted lint pass, but the changed SHA still needs exact-head hosted CI and Preview. Vercel dashboard authentication is needed for project settings and logs. Do not treat historical PR #6/#7 gates below as open PRs.

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

A configuration-gated optional integration is not certified merely because:

1. its code and disabled behavior are tested;
2. missing credentials do not break free routes;
3. documentation states that live verification has not occurred;
4. no secret is required at build time.

For this release, exact-head CI and required code review determine whether PR #19 can merge. Provider configuration, authenticated security UAT, and end-to-end certification remain separate gates; a merge does not certify providers or authorize claims of full production readiness. Any automatic main deployment must be checked against the merged SHA.

See `EXTERNAL_INTEGRATIONS.md` for the activation state of Stripe, Supabase, AI and telemetry.

## Final classification

PR #19 may be marked `READY TO MERGE` when these code checks and repository-required independent review are green on the exact final head:

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

Otherwise the final report must say `NOT READY TO MERGE` and list exact code/review blockers. Provider gates continue to block production certification even if the code is merged.

## Production policy

The requested web deployment should use the existing Vercel project `threadtales`. A hosted Preview of the exact pushed branch is the next deployment step once Vercel and GitHub access are available. Keep production on the current merged SHA until all mandatory Preview and account-backed integration gates in the certification report pass; then deploy the exact approved merge SHA.
