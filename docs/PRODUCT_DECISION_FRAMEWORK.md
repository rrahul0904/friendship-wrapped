# Product Decision Framework

## Purpose

Phase 11 is an evidence gate, not permission to build every product in the registry. ThreadTales, MyYear.World and PetLife should first prove acquisition, sharing, payment, repeat use and collaboration. The thresholds below are **working hypotheses**, not current production results.

## Core scorecard

| Signal | Weak | Promising | Strong |
| --- | ---: | ---: | ---: |
| Story completion | <30% | 30–50% | >50% |
| Share creation | <8% | 8–20% | >20% |
| Paid conversion | <1% | 1–4% | >4% |
| Repeat use | <5% | 5–15% | >15% |
| Cloud-save adoption | <3% | 3–10% | >10% |
| Household collaboration | <2% | 2–8% | >8% |

Do not make a build decision from one metric in isolation. Require a coherent pattern plus qualitative demand.

## Measurement definitions

- **Story completion:** completed story views / analysis or builder starts.
- **Share creation:** safe share/export actions / completed stories.
- **Paid conversion:** verified premium purchases / activated ThreadTales users.
- **Repeat use:** users or anonymous device cohorts returning for a second meaningful creation where measurement is privacy-safe.
- **Cloud-save adoption:** successful optional saves / activated eligible users.
- **Household collaboration:** households with at least one accepted contributing member / cloud-enabled PetLife households.

Current telemetry intentionally records only content-blind product events. Additional dimensions must not be added merely to improve analytics if they weaken privacy boundaries.

## Relationship Universe gate

Consider implementation only when multiple signals agree:

- couple and/or anniversary modes are among the strongest ThreadTales acquisition or purchase segments;
- users ask for persistent shared memories rather than one-off recap cards;
- optional cloud save is meaningfully adopted by relationship-mode users;
- qualitative requests repeatedly mention photos, trips, songs or milestones in one persistent couple space.

Useful evidence:

```text
couple / anniversary usage
share creation
verified purchase conversion
cloud-save adoption
repeat creation
explicit persistent-couple-archive demand
```

Do not build it solely because the registry already contains the concept.

## LifeMap gate

Consider implementation after MyYear demonstrates that richer connected personal timelines are useful.

Positive signals:

- users add multiple dated memories rather than one token highlight;
- repeat-year behavior appears;
- optional location entry is used often enough to justify a map experience;
- users request automatic imports/connectors;
- the value of connector automation clearly exceeds its OAuth/support/privacy complexity.

Until then, keep MyYear manual/local-first and avoid Google Photos, Calendar, Spotify or other connector expansion.

## BabyStory / FamilyTree Live gate

PetLife is the household-collaboration proving ground.

Consider family products only when:

- household invitations are accepted and used;
- multiple members contribute memories;
- timelines show repeat activity over time;
- annual recap creation is meaningful;
- users ask for long-lived family archives, child milestones or intergenerational stories.

If collaboration is weak, do not assume the same household model will succeed for BabyStory or FamilyTree.

## FounderWorld / CreatorWorld gate

Treat these as likely separate B2B/SaaS product families even if some internal story/event/export primitives can be reused.

Before implementation, require evidence for:

- a distinct business buyer;
- recurring operational value rather than emotional keepsake value;
- willingness to connect revenue/analytics/GitHub/social systems;
- a separate pricing and GTM motion.

Do not mix them into the consumer-memory navigation merely because code reuse is possible.

## Decision cadence

Evaluate candidates only after enough real product events exist to avoid reacting to tiny samples. A decision memo should include:

1. funnel metrics and sample sizes;
2. retention/repeat-use evidence;
3. purchase behavior where applicable;
4. qualitative demand;
5. incremental privacy/security complexity;
6. implementation cost and operational burden;
7. which existing shared primitives are genuinely reusable;
8. explicit go / hold / retire decision.

## Current rule

Do not begin Relationship Universe, LifeMap, BabyStory, FamilyTree Live, FounderWorld or CreatorWorld during the Phase 1–11 completion PR. Finish and measure the three implemented products first.
