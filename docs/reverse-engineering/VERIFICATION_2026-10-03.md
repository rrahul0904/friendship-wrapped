# ThreadTales rebuild verification — 2026-10-03

## Exact verified head

`e210afed8d96e4811062534d4fe6dc2d021ed85f`

## GitHub Actions

Production CI run `37151154232`: **PASS**.

The exact-head suite includes:
- lint;
- typecheck;
- unit tests;
- large-history performance regression;
- credential scan;
- production build;
- client-bundle secret scan;
- Chromium browser tests;
- exact 12-beat pair and group story checks;
- 390×844 mobile viewport coverage;
- reduced-motion coverage;
- raw-chat no-API-transmission check;
- visual-keepsake Web Share file test.

The visual-share gate stubs a file-capable Web Share client and verifies that the share payload contains one `image/svg+xml` file named `threadtales-1.svg`; the sentinel raw chat phrase is absent from the share text.

## Vercel Preview

Exact-head deployment: `dpl_H5tjGGRR2f2DpZWYqyocNn5Suchp`

Preview URL:
`https://threadtales-az5e9shht-rrahul0904-5013s-projects.vercel.app/rebuild`

State: **READY**

Authenticated fetch of `/rebuild`: **HTTP 200**.

The served candidate shows the source-first promise and twelve-story-beat experience. Production remains unchanged.

## Truthful remaining gate

This establishes exact-head repository, browser and hosted behavior. It does not establish human product quality.

Before promotion:
- run the first-session UAT in `docs/uat/SOURCE_FIRST_FIRST_SESSION_UAT.md` with five people who did not build it;
- verify native visual file sharing on at least one real iPhone-class device and one non-iOS path/fallback;
- require 4/5 unassisted completion and 4/5 identifying a reveal they would genuinely share;
- address any pacing, trust or emotional-quality failures before merging.
