# MMinCare — delivery status

**Cập nhật:** 2026-10-11 (VN) · **Application baseline:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf`  
**Đã triển khai:** PR #26 đã merge, [Vercel Production success](https://vercel.com/lemai-rgbs-projects/m-mincare/E3bmui2BdzU7iAzkP2kNtnM4XSLD).  
[Ứng dụng](https://m-mincare.vercel.app/) · [Trải nghiệm thử](https://m-mincare.vercel.app/demo)

## Current delivery

| Workstream | Implementation | Evidence / remaining |
|---|---|---|
| Email/password, confirm/resend, recovery | Deployed | Auth regression; real email/callback matrix pending |
| Owner Pet profile and photos | Deployed | Private upload/change/remove, cover/fallback; live A/B/storage/reload pending |
| Vaccine/Medical, optional private attachments | Deployed | Create/read/delete + source detach/cleanup reporting; no edit endpoints; real cleanup/permission QA pending |
| Reminder create/edit/complete | Deployed | Edit eligible Upcoming date/note; Overdue derived; real mutation/navigation matrix pending |
| Notification Center red dot/read/deep-link | Deployed | Revalidation, stale/timeout/error safeguards, 16 rendered tests at prior checkpoints; real event QA pending |
| Health Log CRUD and Enter behavior | Deployed | PR #20/#22; immutable identity/logged_at, idempotent POST/canonical recovery, cancel revalidation, delete ambiguity; real retry/A/B pending |
| Compact summaries/cards and square images | Deployed | Latest log/date/status/weight link, attribution left/actions right; full desktop/mobile visual pending |
| Per-Pet weekly/monthly statistics | Deployed | Weight/status tooltips; PR #24 fixed timestamp/range contract; public demo chart smoke, authenticated calculation matrix pending |
| Responsive Pet layout | Deployed | PR #23 tabs2×2/wrap/shared layout; not a full device sign-off |
| Public demo same UI and isolated dataset | Deployed | PR #26;3 Pets/31 Health Logs; browser-local adapter; public smoke detailed below |
| Optional vaccine schedule suggestion | Partially delivered / unavailable | CR-08 status contract fixed; approved read access/dataset not complete; manual dates allowed |
| Caretaker, OAuth, push/email, aggregate analytics | Planned | Reserved designs do not mean runtime permission |

## Latest release evidence

- Application main `bcd14b5`: merged [PR #26](https://github.com/lemai-rgb/MMincare/pull/26), same application UI/forms/styles for demo, distinct fixture histories and non-empty Sushi profile.
- [CI run 38068595221](https://github.com/lemai-rgb/MMincare/actions/runs/38068595221): PASS at PR head `7b777d16928148f1e83afc888e79521220eb28f2`, before merge. No separate merge-SHA CI run was claimed.
- Demo suite:31 tests/4 files at that release head. Lint, TypeScript, Webpack production build and diff checks passed at release. This is not31 browser end-to-end tests; prior app suites have their own checkpoint evidence.
- Exact merged-main Vercel deployment above succeeded.
- Public production browser smoke: Meo/Min/Sushi cards; Min14 logs; monthly Meo/Min status frequencies differ; Min Khác details include two Rụng lông observations; Về trang chủ returns root. This is a sampled smoke, not all forms/device sizes.
- Latest demo needs no migration or Supabase seed. Dataset/table counts in `demo/generated/manifest.json` are synthetic, not production counts.

## Database delivery references

Previously deployed migration versions: `20260926193909` notification Phase1; `20261005081930` pet photos; `20261005082042` private photos/Pet idempotency; `20261007113449` Owner Health edit/delete; `20261009180809` Health POST idempotency. Repo filenames match recorded remote versions. The docs sync performs no new production audit, migration, repair, grant or dataset mutation.

## Review follow-up

| Item | Current status | Next evidence/action |
|---|---|---|
| CR-01 bounded waiting/unknown POST outcome | Delivered PR #22 | Real lost-response/retry with test data remains pending |
| CR-02 stale Health GET and cancellation recovery | Delivered PR #22 | Create/edit/delete race regressions; real runtime pending |
| CR-03 literal invalid / Vietnamese encoding | Delivered PR #22 | Structured validation and UTF-8 warning; negative/manual checks pending |
| CR-04 deletion focus | Not re-certified in this sync | Inspect current mounted target and execute keyboard scenario; do not infer fixed |
| CR-05 broad CI / summary coverage | Not re-certified | Audit workflow path coverage and required checks; no configuration changed here |
| CR-06 duplicate-index/policy advisors | Historical advisory | Read current definitions/plans before approved migration; no index dropped |
| CR-07 Auth hardening/reserved-table advisory | Historical configuration limitation | Check plan/configuration separately; no change made |
| CR-08 schedule rules | Contract delivered; permission/dataset outstanding | Approved rule/read contract, no guessed clinical intervals |
| Performance | Code safeguards delivered; unmeasured | Authenticated network/stage timings before/after; no speed percentage |
| Real Owner A/B, upload/cleanup/email, full mobile QA | Pending manual validation | Use separate synthetic Owner fixtures and execution template |

The [7 October review](CODE_REVIEW_2026-10-07.md) remains dated historical evidence; its findings are not all current open defects. Use this status table for current dispositions. Do not use demo operations as proof of live access controls.

## Documentation baseline

All11 product/technical artifacts (eight Markdown, ERD, User Flow, Use Case) now describe the application SHA above. BR/US/ADL IDs are preserved; new stories/decisions cover delivered feedback and public demo. API examples reflect actual handlers; Data Dictionary uses real column/FK names plus incremental migration fields. Personas/quotes are design hypotheses, not interviews. README/portfolio material distinguishes shipped features, checked evidence, planned work and runtime limitations.

No “100% complete”, user-adoption count, production SLA, formal UAT sign-off or measured business improvement is claimed.
