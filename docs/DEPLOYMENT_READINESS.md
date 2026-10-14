# Deployment Readiness

## Current release checkpoint — 2026-10-13

Canonical `main` and production `/api/version` match `8859495cd9062eb2a6a842c80a75639453d61026`; main CI [38119383860](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38119383860) passed. Production deployment `6992138130` is ready/successful. PR #25–#28 are an open stacked MemorySpace implementation; the baseline PR #25 Preview is deployed for `f76176e`. CI [38339878303](https://github.com/rrahul0904/friendship-wrapped/actions/runs/38339878303) found a route handoff regression, which is fixed locally and awaits updated hosted CI/Preview. See [CURRENT_TRUTH.md](CURRENT_TRUTH.md) for baseline lineage and [IMPLEMENTATION_TRACKER.md](IMPLEMENTATION_TRACKER.md) for the current work receipt.

Production status is **DEPLOYED_NOT_CERTIFIED**. Stripe and AI are disabled in production. Supabase flags are present but health, migrations, RLS, and storage remain unverified; telemetry delivery is unverified. The source-first product has browser coverage but required human product UAT is absent. Updated PR #25 CI/Preview is the immediate code gate; provider gates remain separate certification blockers.

## Deployment model

Historical PR #6 deployment model (PR #6/#7/#13/#17/#19 status is in the dated release records above):

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

For this release, exact-head CI and any repository-required code review determine whether PR #19 can merge. The repository audit found no branch protection configured on `main`; independent read-only code review found no merge-blocking issue, while GitHub has no formal review decision. Provider configuration, authenticated security UAT, and end-to-end certification remain separate gates; a merge does not certify providers or authorize claims of full production readiness. Any automatic main deployment must be checked against the merged SHA.

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

The existing Vercel project `threadtales` produced an automatic Preview for the audited PR head. Merging PR #19 may trigger an automatic production deployment; verify the resulting deployment and `/api/version` against the merge commit. Provider-backed certification remains incomplete regardless of deployment status, and production claims must reflect that status.
