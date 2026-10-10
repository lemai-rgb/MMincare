# MMinCare — delivery status

**Updated:** 10 October 2026 — demo UI parity correction
**Reviewed main baseline:** `3ecfc6b866f05425eb3674e3626d3a5c6cd0070f` (merged PR #25).
**Stage:** Owner MVP deployed; demo correction prepared for review, not yet deployed.

## Current delivery update

- PR #25 was merged and its demo is accessible, but it used separate screens and omitted working application flows. That implementation did not meet the requested product experience.
- This follow-up uses shared `PetListView`/`PetDetailView` shells extracted from the existing app markup, plus the existing Pet, Medical, Vaccine, Reminder, Notification and Health components. Application CSS, labels, validation and workflows are retained.
- An explicit React context adapter supplies browser-local requests and navigation only under `/demo`. Outside it, the existing fetch/router implementations are used. No global fetch override, API/Auth/RLS/Storage changes or production dataset writes.
- Demo-only UI: “Trải nghiệm thử” label (click to confirm reset) and “Về trang chủ”. The old intro/three-column cards/custom chart/guide UI is removed.
- Three initial Pets: Meo/Min keep supplied photos; Sushi retains default avatar and now has basic profile data, two Health Logs, one Vaccine Record and one manual Reminder.
- Automated checks cover shared forms, CRUD/reload, API response contracts and the public-route boundary. Real Owner A/B/Storage tests, production timing and authenticated manual QA remain separate and unverified.
- CR-08 remains open for approved production rule access/dataset; demo does not invent vaccine intervals.

## Historical 7 October checkpoint

Reviewed application baseline for the historical checkpoint below: `8b911540ddfb4856d29f414f1e771f0ae22dc989`.

## Status definitions

| Label | Meaning |
|---|---|
| Deployed | Merged application code with successful Vercel deployment status; not an automatic runtime QA pass |
| Automated pass | A named test/check has evidence at the stated baseline |
| Pending manual validation | Authenticated browser, visual or real-service scenario not checked in this review |
| Planned | Product/design scope without a shipped end-to-end implementation |
| Open defect | Code evidence or a local reproduction exists; not fixed by this documentation update |

## Delivery snapshot

| Workstream | Delivery | Evidence/remaining work |
|---|---|---|
| Email/password Auth, confirmation feedback and recovery | Deployed | Mapper/resend scripts pass; real mail/callback QA pending |
| Owner Pet create/view/edit and private photos | Deployed | [PR #19](https://github.com/lemai-rgb/MMincare/pull/19) merged; image tests pass; upload/change/remove/reload and A/B isolation pending |
| Vaccine/Medical records and confirmed deletion | Deployed | Create/history/DELETE routes present; dependency/attachment cleanup behavior needs manual evidence |
| Optional next-vaccination suggestion | Unavailable at checkpoint | CR-08: production rule table empty and user-client read denied; vaccine creation remains independent |
| Reminder create/edit/complete | Deployed | Edit script tests pass; manual date/status checks pending |
| Notification Center and unread red dot | Deployed | [PR #18](https://github.com/lemai-rgb/MMincare/pull/18) merged; 16 UI tests pass; real event/navigation QA pending |
| Health Log create/edit/delete and keyboard behavior | Deployed | [PR #20](https://github.com/lemai-rgb/MMincare/pull/20) merged; UI/API tests pass, with additional defects found in this review |
| Square photo fit, compact pet summary, loading safeguards | Deployed | PR #20; image/summary/request lifecycle tests pass; no measured production speed comparison |
| Compact Health Log footer | Deployed | [PR #21](https://github.com/lemai-rgb/MMincare/pull/21) merged; attribution left, actions right; desktop/mobile visual QA pending |
| Per-pet weekly/monthly statistics | Deployed | Dashboard route/payload tests present; calculations/period boundaries pending manual QA |
| Caretaker sharing, Google OAuth, email/push delivery, multi-pet aggregate | Planned | Existing design references do not establish implementation |
| Separate seeded portfolio demo | Planned | No public demo mode or dataset reset/isolation mechanism implemented |

## Release evidence

- PR #18 merge: `36829d5a86e8194490e5b8f65702316d9020a9c6`.
- PR #19 merge: `5e0fe323d6d44b3f457a22056ebe506e5c550073`.
- PR #20 merge: `10f616d83bbefba57165cc29fb29ec55cf4de71f`.
- PR #21 merge: `8b911540ddfb4856d29f414f1e771f0ae22dc989`.
- Reviewed main Vercel status: success — [deployment](https://vercel.com/lemai-rgbs-projects/m-mincare/DdgGF5VBsZ3Zs3j3rus6HL2N1Gn7).
- Relevant migration CI: [run #23](https://github.com/lemai-rgb/MMincare/actions/runs/37615187127), passed on PR #20 head `3f144f967fd44586516f03930056a41f1d9be008`, before merge.

Supabase migration history was read without changes. Recent production versions:

| Version | Name |
|---|---|
| `20261005081930` | `pet_photos_storage` |
| `20261005082042` | `pet_photos_private_and_pet_idempotency` |
| `20261007113449` | `owner_edit_delete_health_logs` |

Health Log Owner policies were inspected. Schema/policy presence is not a live cross-Owner access test. This review did not mutate production records, apply migrations, or alter Auth/Storage settings.

## Verification checkpoint

| Check | Result at reviewed baseline |
|---|---|
| Targeted Vitest suite | PASS — 45 tests, 11 files |
| Auth mapper/resend, Reminder edit, Notification selector/reducer scripts | PASS |
| HTTP timeout lifecycle script | PASS |
| ESLint / TypeScript / production build | PASS |
| Additional defect reproductions | Two local mock reproductions confirmed; original test files restored |
| Authenticated browser/manual regression | Not performed |
| Owner A/B isolation against live API/Storage | Not performed |
| Production loading timings | Not measured |

The sandbox prevented the `tsx` CLI from opening its IPC pipe. Equivalent script checks used `node --import tsx`; Vitest ran through its Node entry point. No dependency/configuration changes were needed.

## Prioritized follow-up

Priority is proposed project triage, not a measured incident severity. Detailed evidence is in the [code review](CODE_REVIEW_2026-10-07.md).

| Priority | Item | Acceptance criteria |
|---|---|---|
| P1 | Bound Health Log mutations and Notification GET/read waiting | Hung requests leave pending state after a defined limit; actionable error/retry; no stale updates; mutation retry accounts for ambiguous server success |
| P1 | Prevent GET overwriting successful Health Log mutations | Pre-mutation GET cannot erase/resurrect a created/edited/deleted row; deterministic race regressions pass |
| P2 | Restore optional vaccine schedule suggestion contract | Approved rule read access/dataset; no-match distinct from query failure; no automatic Reminder |
| P2 | Remove text-validation sentinel collision | Literal `invalid` accepted; non-string values rejected for create/edit |
| P2 | Restore focus after successful deletion | Focus moves to an existing row action/list heading/add button; cancel restores original trigger |
| P2 | Expand application CI | Source PRs run lint, TypeScript and relevant complete test groups, including health summary; build requirements documented |
| P2 | Review Supabase duplicate indexes/Reminder policies | Compare definitions, dependencies/plans first; approved migration preserves access; no index removed solely because unused |
| P2 | Capture real performance/manual QA evidence | Authenticated timing/flow result recorded with environment/date; no personal data/tokens |
| P3 | Clarify Health Log metric labels and visual checks | Explicit weight/food/amount labels; long/missing values readable on desktop/mobile |
| P3 | Seeded portfolio demo | Synthetic data, isolation from real users, safe reset and clear demo label before publication |

## Scope and documentation decisions

Original persona/MoSCoW/API/ERD material remains planning evidence. Current-scope notices distinguish planned sharing/OAuth/API examples from implemented routes. Health Logs/statistics/Notification Center moved into the deployed Owner product. Vaccine/medical deletion is implemented; editing remains a future decision.

Progress is feature/evidence based. No “100% complete”, percentage speedup, uptime guarantee or professional-role claim follows from passing checks. Informal user feedback informed photo selection, square fit, concise summaries, accidental-Enter prevention and compact cards.
