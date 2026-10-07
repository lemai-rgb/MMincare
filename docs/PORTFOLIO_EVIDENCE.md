# BA / PM / Tester portfolio evidence

**Checkpoint:** 7 October 2026 · **Application baseline:** `8b91154`  
This maps available project artifacts to reviewable skills, separating implemented features, automated checks and planned manual validation.

## Evidence map

| Perspective | Evidence | What reviewers can inspect |
|---|---|---|
| BA: problem analysis | [Problem](../Product/Problem%20statement.md), [personas](../Product/Persona%20Document.md) | Pain points and primary/secondary users |
| BA: prioritization | [MVP/MoSCoW](../Product/MVP%20document.md), [current status](PROJECT_STATUS.md) | Original priorities, shipped/future scope |
| BA: rules/data | [Business Rules](../MMinCare_Business_Rules.md), [Data Dictionary](../Data_Dictionary.md), [ERD](../ERD%20-%20WEB%20MMin%20Care.drawio), [Use Case](../Use%20Case_MMinCare.drawio) | Validation, ownership, state and data relationships; diagrams retain design scope |
| BA: interface | [API document](../MMinCare_API_Documentation.md) | Implemented route inventory contrasted with original design examples |
| PM/Product: delivery | [Merged PRs](https://github.com/lemai-rgb/MMincare/pulls?q=is%3Apr+is%3Amerged), [status/backlog](PROJECT_STATUS.md) | Feature boundaries, sequence, priorities, acceptance criteria |
| PM/Product: decisions | [Architecture Decision Log](../Architecture_Decision_Log.md), PRs #19–#21 | Photo/summary/keyboard/card/loading changes based on informal user feedback |
| Tester: design/evidence | Mapping/scenarios below; [code review](CODE_REVIEW_2026-10-07.md), tests/workflow | Negative/permission/lifecycle cases, reproduced defects and verification limits |

Independent-project artifacts with AI-assisted development/review are not evidence of employment in three job roles. No formal UAT sign-off, adoption metric or measured speed improvement is claimed.

## Lightweight traceability

`PF-*` IDs are new portfolio mapping IDs, not replacements for original US/BR IDs. This is sampled traceability, not complete acceptance-criteria coverage.

| ID | Requirement/decision | Implementation | Automated evidence | Manual evidence |
|---|---|---|---|---|
| PF-01 | Appropriate confirmation/resend/error feedback | Auth forms; `lib/auth/` | Mapper/resend scripts pass | Real mail/callback not executed |
| PF-02 | Optional image, format/size validation, species fallback | `PetImagePicker`, `PetAvatar`, image helper | 6 image tests pass | Upload/change/remove/reload pending |
| PF-03 | Owner-only private access | API ownership and RLS/Storage policies | Policy assertions/route review | A/B runtime isolation pending |
| PF-04 | Eligible Reminder editing; completion distinct | Edit helper/API/database guard | Edit script/migration assertions | Date/status boundaries pending |
| PF-05 | Notification read/invalidation/navigation | Notification UI/reducer/validation | Selector/reducer and 16 UI tests pass | Real events pending; CR-01 open |
| PF-06 | Health Log business date/permitted edits | Health Log routes | 3 mutation API tests pass | Persistence/A/B pending; CR-03 open |
| PF-07 | Enter in measurement/food inputs must not save | Health Log form | 3 keyboard/composition tests pass | Real keyboard/mobile IME pending |
| PF-08 | Journal updates; confirmed deletion | Health Log history | 2 existing mutation UI tests pass | CR-02/CR-04 open |
| PF-09 | Read timeout/retry/stale protection | HTTP helper/read components | Lifecycle/UI/validation checks pass | Production timing pending |
| PF-10 | Concise latest journal summary | Summary helper/batch dashboard query | 3 summary tests pass separately | Desktop/mobile appearance pending |

The total of 45 covers 11 Vitest files, not 45 browser end-to-end tests. Script suites add coverage but are not counted as another 45 tests. Database replay uses isolated local CI; reading production policies is not exercising two live Owner sessions.

## Manual regression scenarios — not executed here

Use synthetic data and separate Owner A/B sessions. Record date, device/browser, application commit and actual results. Never store passwords, cookies, tokens or personal data in evidence.

| ID | Steps | Expected result | Status |
|---|---|---|---|
| MAN-01 | Register, confirm email, login, password recovery | Clear feedback, valid session, safe redirects | Not run |
| MAN-02 | Create without image; switch species | Profile saved, correct fallback | Not run |
| MAN-03 | Upload portrait/landscape/square; save/reload | Centered square crop, private image persists | Not run |
| MAN-04 | Invalid/oversized selection; change/remove valid photo | Specific error, valid state preserved, fallback on removal | Not run |
| MAN-05 | Owner B requests A's Pet/photo/Health Log and mutations | No exposure/mutation; private-resource handling | Not run |
| MAN-06 | Enter in weight/food/amount; explicit save; textarea/IME | No accidental save; button keyboard works; newline/composition preserved | Not run |
| MAN-07 | Create/edit/delete log; reload; inspect summaries | Canonical values/count/order and confirmed deletion | Not run |
| MAN-08 | Delay GET; mutate while old read pending | No erased change/resurrected row — CR-02 target | Local defect; manual not run |
| MAN-09 | Stall mutation/notification; retry unknown outcome | Released pending state, actionable error, no duplicate creation — CR-01 target | Source risk; manual not run |
| MAN-10 | Edit/complete Reminder; inspect dot/deep link | Correct states/event/badge and highlighted destination | Not run |
| MAN-11 | Delete vaccine/medical record with dependencies; cleanup failure | Confirmed deletion, documented reminder/attachment handling, warning if needed | Not run |
| MAN-12 | Keyboard open/cancel/confirm delete | Focus trap/Escape and meaningful restored focus — CR-04 target | Not run |
| MAN-13 | Mobile/desktop; long/missing content | Readable compact card, square image, accessible actions, no overflow | Not run |
| MAN-14 | Measure cold/warm authenticated tabs/server stages | Browser/network/Auth/database waits distinguished; no guessed speedup | Not run |

## Execution record template

| Scenario | Date / environment / commit | Actual result | Pass/Fail | Evidence / defect ID |
|---|---|---|---|---|
| MAN-xx | Fill after execution | Fill after execution | Not run | Sanitized screenshot/log |

## Supported CV wording

Choose the emphasis for the application rather than presenting three professional titles:

- **BA:** Defined a pet-care MVP through problem/persona analysis, MoSCoW prioritization, business rules, API/data documentation and requirement-to-test mapping.
- **PM/Product:** Tracked Owner MVP delivery through GitHub PRs, scope decisions and a prioritized quality backlog; translated informal feedback into photo-upload, summary and keyboard-UX improvements.
- **Tester:** Designed negative, permission and lifecycle scenarios; maintained regression evidence and documented reproduced defects with verification limits.

Only add user counts, speed percentages, formal interview/UAT or team leadership claims when supported. Share an accessible artifact/repository link and the live-app link; label any future seeded demo separately.
