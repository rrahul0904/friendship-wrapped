# GitHub Repository Handoff

## Canonical repository

```text
https://github.com/rrahul0904/friendship-wrapped
```

GitHub owner: `rrahul0904`

Default branch: `main`

Latest end-to-end integration branch:

```text
platform-saas-media-live
```

Latest integration PR:

```text
#13 — Story Platform SaaS + Media OS launch
```

## Repository creation status

A GitHub repository already exists and the user has admin/push access, so **do not create a duplicate repository**.

If this project ever needs to be recreated under a new empty repository, the preferred commands are:

```bash
gh repo create rrahul0904/friendship-wrapped --public --source=. --remote=origin --push
```

If `gh` is unavailable:

```bash
git init
git add .
git commit -m "feat: initial end-to-end ThreadTales platform"
git branch -M main
git remote add origin https://github.com/rrahul0904/friendship-wrapped.git
git push -u origin main
```

If the repository name must change, create the new GitHub repository first and then point the existing local checkout at it:

```bash
git remote set-url origin https://github.com/rrahul0904/<new-repo-name>.git
git push -u origin main
```

Do not run those commands against the current project unless intentionally replacing/migrating the canonical repository.

## What is checked in

The latest integration branch contains the full repository implementation:

- Next.js App Router application
- local-first ThreadTales Web Worker analyzer
- deterministic story engine and Memory Cinema UI
- social/export/print foundations
- world/product models
- Supabase authentication and persistence adapters
- profile/onboarding/password flows
- world CRUD/import APIs
- media, albums, album-item and music APIs
- PetLife household/memory APIs
- billing/entitlement adapters
- Stripe integration/server routes
- optional AI enrichment adapter
- privacy-safe telemetry/PulseAtlas instrumentation
- Supabase schema and migrations
- RLS/index hardening
- production verification scripts
- GitHub Actions CI
- unit, E2E and large-history performance tests
- environment example
- architecture, privacy, deployment and product documentation

See `docs/PROJECT_STRUCTURE.md` for the canonical tree and responsibility map.

## Current integration safety status

The latest integration code is committed to GitHub and its exact pre-documentation head passed the complete production CI gate.

That does **not** mean authenticated persistence/media changes should be promoted automatically.

Before merging the latest integration branch to `main`, verify:

1. required Supabase migrations are applied to the intended environment;
2. production/preview environment variables are configured;
3. Vercel Preview is built from the exact integration SHA;
4. auth, profile, world, media, album and music flows are smoke tested;
5. no client bundle contains server secrets;
6. runtime logs show no critical errors;
7. only then merge/promote.

## Standard developer workflow

```bash
git clone https://github.com/rrahul0904/friendship-wrapped.git
cd friendship-wrapped
npm ci
npm run dev
```

Verification:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:performance
npm run build
npx playwright install chromium
npm run test:e2e
```

## Source-control policy

Use:

```text
feature branch
  ↓
PR
  ↓
exact-head CI
  ↓
preview
  ↓
runtime/browser verification
  ↓
main
```

Never commit:
- real API keys
- service-role tokens
- Stripe secrets
- database passwords
- private user exports
- raw chat fixtures from real users
- generated local environment files

The canonical source of truth is GitHub; production deployment is a separate release operation.
