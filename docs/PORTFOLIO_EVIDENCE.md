# BA / PM / Tester portfolio evidence

**Cập nhật:** 2026-10-11 (VN) · **Application baseline:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf`  
**Đã triển khai:** PR #26 đã merge, [Vercel Production success](https://vercel.com/lemai-rgbs-projects/m-mincare/E3bmui2BdzU7iAzkP2kNtnM4XSLD).  
[Ứng dụng](https://m-mincare.vercel.app/) · [Trải nghiệm thử](https://m-mincare.vercel.app/demo)

## Artifact map

| Perspective | Available evidence | Limit |
|---|---|---|
| BA: analysis and requirements | [Problem](../Product/Problem%20statement.md), [constructed personas](../Product/Persona%20Document.md), [MVP/MoSCoW](../Product/MVP%20document.md), [User Stories](../Product/User%20story.md) | Personas/quotes illustrative; no formal interview or market metric |
| BA: rules/data/flows | [BR](../MMinCare_Business_Rules.md), [API](../MMinCare_API_Documentation.md), [DD](../Data_Dictionary.md), [ERD](../ERD%20-%20WEB%20MMin%20Care.drawio), [Use Case](../Use%20Case_MMinCare.drawio), [User Flow](../Product/User%20flow%20Web%20theo%20d%C3%B5i%20th%C3%BA%20c%C6%B0ng.drawio) | Current/Planned separated; actual route/table names, preserved IDs |
| PM/Product | [Delivery/backlog](PROJECT_STATUS.md), [ADL](../Architecture_Decision_Log.md), merged PRs | Feedback translated into scope/acceptance/release decisions; no team/employment claim |
| Tester | Tests, migration replay, [dated defects](CODE_REVIEW_2026-10-07.md), manual matrix below | Mock/rendered tests differ from real service/security/UAT |
| Product demonstration | [Demo](https://m-mincare.vercel.app/demo), [guide](PORTFOLIO_DEMO.md), [sample dataset](../demo/README.md) | Same product components, synthetic browser-local state; not real Owner access proof |

Independent project with AI-assisted implementation/review. Evidence supports project activities, not three professional job titles or certification.

## Sample traceability (PF IDs preserved)

This is sampled mapping, not full acceptance/test coverage. Original US/BR IDs remain stable.

| ID | Requirement | Implementation / automated evidence | Runtime evidence |
|---|---|---|---|
| PF-01 | US-01…03 / BR-AUTH | Auth forms/error-resend scripts, callback/session guards | Real email/callback pending |
| PF-02 | US-20 / BR-PET-05 | Picker/validation/fallback/cover,6 image tests at prior checkpoint | Live upload/change/remove/reload pending |
| PF-03 | BR-PHOTO-01 / Owner access | API/RLS/Storage review and CI assertions | A/B real sessions pending |
| PF-04 | US-18 / BR-REM-08…09 | Edit allowlist/eligibility/helper/migration guards | Real date/status race pending |
| PF-05 | US-19 / BR-NOTIF | Read/invalidation/deep link/timeout,16 rendered tests at prior checkpoint | Real scheduler/read/navigation pending |
| PF-06 | US-12/21 / BR-HLOG | Date/business allowlist, literal invalid accepted, immutable identity | Owner persistence/A-B pending |
| PF-07 | BR-UX-01 | Enter/textarea/button/IME regression | Real mobile IME pending |
| PF-08 | US-21 / BR-HLOG-14…16 | Cancel GET recovery, stale mutation protection, POST key/snapshot, DELETE ambiguity regressions | Real retry/cleanup pending |
| PF-09 | ADL-030 |15s whole-response helper, cleanup/retry/timing instrumentation | Production timing unmeasured |
| PF-10 | BR-PET-06 / ADL-013 | Batch latest Health summary, no N+1, ordering/fallback tests | Full visual pending |
| PF-11 | US-22 / BR-DEMO |31 demo tests/4 files, scoped adapter/persistence/migration contracts | Production public smoke, sampled |
| PF-12 | US-23 / BR-UX-02 | Responsive tabs2×2/grouped metadata/footer | Full viewport/device matrix pending |

## Evidence checkpoint

- Current application main bcd14b5; exact Vercel deployment success linked above.
- Latest [CI](https://github.com/lemai-rgb/MMincare/actions/runs/38068595221) passed on release feature head7b777d1. Demo31 tests/4 files; lint/TypeScript/Webpack build passed. These are release-head checks, not a separate merged-SHA CI run.
- Public production smoke:3 Pet cards, Min14 logs, different monthly Meo/Min frequency data, two Rụng lông in Min Other details, return-home.
- Historical45 Vitest/11 files at8b91154 and earlier app suite results stay historical; do not sum into a made-up total of current E2E tests.
- No formal UAT sign-off or live Owner A/B/security/performance validation claimed.

## Manual regression matrix

Use synthetic data and separate Owner A/B sessions; record environment, commit, date, actual result. Do not store credentials/cookies/tokens or personal data in evidence.

| ID | Steps / expected outcome | Status |
|---|---|---|
| MAN-01 | Register/confirm/login/recovery, safe session/redirect and feedback | Real flow not run |
| MAN-02 | Create no-image Pet/switch species; correct fallback | Real flow not run |
| MAN-03 | Portrait/landscape/square upload/save/reload; private image persists | Not run |
| MAN-04 | Invalid/oversized/change/remove; specific error and fallback | Not run |
| MAN-05 | B accesses A's Pet/image/log and mutations; no data exposure or change | Not run |
| MAN-06 | Enter weight/food/amount, textarea, date/select, Save focus, IME | Automated regression; real keyboard/device pending |
| MAN-07 | Health create/edit/delete/reload; canonical summary/count/order | Automated regressions; real flow pending |
| MAN-08 | Delay GET then create/edit/delete; old read cannot overwrite/resurrect | CR-02 delivered; real race pending |
| MAN-09 | Server may commit while response lost; retry same key/snapshot; no duplicate creation, DELETE404 revalidation | PR #22 regressions; real retry pending |
| MAN-10 | Edit/complete Reminder/read notification/deep link; dot/filter/highlight consistent | Automated coverage; real flow pending |
| MAN-11 | Delete care source/attachments; source null and cleanup warning accurate | Real dependency cleanup pending |
| MAN-12 | Delete keyboard trap/Escape, cancel trigger and post-delete live focus target | Not re-certified / pending |
| MAN-13 |320/360/390/430/768/1280/1440, long/missing content, readable controls/no overflow | Full visual not run |
| MAN-14 | Cold/warm authenticated tab timings; network/Auth/DB/render separated | Not measured |
| MAN-15 | Public demo3 Pets, Min logs, month statuses/Other, home | Sampled production smoke PASS; not all interactions |
| MAN-16 | Demo CRUD/file local/reload/reset; storage quota/new-tab behavior and no prod mutation | Automated tests; complete browser matrix pending |

## Execution record

| Scenario | Date/environment/application SHA | Actual | Pass/Fail/Blocked | Sanitized evidence/defect |
|---|---|---|---|---|
| MAN-xx | Fill when executed | Describe actual result | Not run | Screenshot/log/issue |

## Supported CV wording

- BA emphasis: defined a pet-care MVP using problem/persona hypotheses, MoSCoW, business rules, User Stories, API/data/flow documentation and sampled requirement-to-test mapping.
- Product/PM emphasis: tracked feature/fix delivery through GitHub PRs and scope/acceptance decisions; translated informal feedback into photo, summary, keyboard, responsive and demo improvements.
- Tester emphasis: designed validation/permission/lifecycle scenarios, maintained regression tests and dated defects, and separated automated/smoke evidence from pending manual tests.

Use [public demo](https://m-mincare.vercel.app/demo) on the CV; app link is the real authenticated system. Repository access must be granted or visibility checked before giving it to recruiters. Do not claim adoption numbers, measured speedup, formal interviews/UAT, team leadership or real security PASS without evidence.
