# MMinCare — tiến độ triển khai

## Mốc mới nhất — 22/11/2026 (giờ Việt Nam)

Trạng thái này được cập nhật sau [PR #37](https://github.com/lemai-rgb/MMincare/pull/37). Bằng chứng triển khai và kiểm thử dưới đây được ghi nhận ngày 21/11/2026. Commit ứng dụng đã phát hành là [`f7738c3`](https://github.com/lemai-rgb/MMincare/commit/f7738c38b7b93ee0b13073ca0c60200a266229e1).

| Hạng mục | Trạng thái đã xác minh | Bằng chứng và phần còn lại |
|---|---|---|
| Caretaker Phase 2.1–2.2 | Đã triển khai | PR #30, #31 và #36 đã merge. Caretaker có email xác nhận và quyền Active còn hạn được xem dữ liệu giới hạn, thêm hồ sơ tiêm/khám dạng văn bản cho Pet được chia sẻ |
| Sửa lỗi sau audit | PR #37 đã merge | Sửa xóa hồ sơ có nhắc hẹn liên kết, dọn tệp có thể thử lại, mời lại sau hết hạn, ngày Việt Nam, Owner tạo nhắc hẹn từ lần khám Caretaker ghi và giới hạn upload ứng dụng 4 MiB |
| Database production | Đã áp dụng đủ 22 migration | Migration mới `20261121163456_fix_phase22_audit_regressions` áp dụng trước merge. Tên file trong repository khớp phiên bản Supabase ghi nhận |
| Quyền database và Storage | Kiểm tra catalog/ACL/policy đạt | RPC mời lại và hàm dọn tệp dùng SECURITY INVOKER. authenticated được EXECUTE, anon bị chặn. Hai policy dọn tệp giới hạn bucket, chủ tệp, đường dẫn và thao tác Storage |
| Dữ liệu trước/sau migration | Số lượng và mã đối chiếu khớp | Pet 5, Vaccine 7, Medical 5, pet_access 0, Reminder 8, metadata tệp 1, object tệp riêng tư 1 tại thời điểm kiểm tra |
| CI ở HEAD cuối `1604009` | Cả hai workflow đạt | [Migration Replay #59](https://github.com/lemai-rgb/MMincare/actions/runs/44925460928), [Demo Checks #41](https://github.com/lemai-rgb/MMincare/actions/runs/44925460985) |
| Luồng giao diện tự động | Playwright đạt trên Supabase sạch và legacy | Caretaker gửi cả hai form, Owner tạo nhắc hẹn có nguồn và xóa hồ sơ qua UI, kiểm tra dọn tệp riêng tư |
| Kiểm thử SQL production | Đạt với fixture trong giao dịch rollback | Mời lại, chặn mời trùng, Owner xóa hồ sơ Caretaker tạo, giữ nhắc hẹn khi bỏ nguồn và thu hồi quyền. Đã xác nhận fixture được rollback |
| Bản phát hành production | Vercel thành công cho commit merge | [Deployment của `f7738c3`](https://vercel.com/lemai-rgbs-projects/m-mincare/ExfczfeCMTaYiEkSZkRGUWixNNKn). Git xác nhận tree merge giống tree đã kiểm thử |
| Smoke HTTP production | Đạt 9/9 | Trang chủ/đăng nhập/demo trả 200, dashboard chuyển về đăng nhập. API chia sẻ, lời mời, thông báo và hai API Caretaker thêm hồ sơ trả 401 khi chưa đăng nhập |
| CARE-15 trên giao diện production | Chờ thực hiện | Chưa chạy toàn bộ luồng với hai tài khoản Owner/Caretaker đã đăng nhập trên production |
| QA còn lại | Chờ thực hiện | Revoke/write đồng thời trên production, ma trận thiết bị/giao diện, kiểm thử email thực và đo hiệu năng |

Caretaker được thêm hồ sơ dạng văn bản. Owner xem, tạo nhắc hẹn từ hồ sơ cùng Pet và xóa được cả hồ sơ Caretaker tạo. Các giới hạn quyền Caretaker được mô tả trong [nhật ký phát hành](PHASE_2_2_RELEASE.md).

Xem [bằng chứng kiểm thử](PORTFOLIO_EVIDENCE.md) và [checklist PR #37](https://github.com/lemai-rgb/MMincare/pull/37) để theo dõi CARE-15 cùng những mục QA còn chờ.

## Mốc lịch sử PR #36 — 2026-11-21 (Asia/Ho_Chi_Minh)

| Workstream | Verified state | Evidence / remaining |
|---|---|---|
| Phase 2.1 | PR #30 and #31 merged | Per-Pet invitations, accept, limited reads, revoke; recorded database baseline |
| Phase 2.2 database | Both production migrations applied successfully | `20261120183551_caretaker_add_records`, then `20261120183616_owner_delete_caretaker_records`; 21 history entries |
| Database authorization | Catalog, function ACL and RLS checked after apply | Public invoker wrapper/private definer, empty search_path, anon denied; Owner SELECT/DELETE by Pet ownership; base INSERT remains Owner-only |
| Data integrity | Unchanged before/after | Pet 5, Vaccine 7, Medical 5, Pet access 0; matching full-row fingerprints |
| Application release | [PR #36](https://github.com/lemai-rgb/MMincare/pull/36) merged | [Vercel Production success](https://vercel.com/lemai-rgbs-projects/m-mincare/DHm98qvXf68z1RiJMnbNxNWdmvx9) for merge SHA `5b70a12f064fbcabe606444ab492a3d340dc6590` |
| Automated behavior | SQL and Playwright PASS at reconciled HEAD `f79569e1` | [Replay #56](https://github.com/lemai-rgb/MMincare/actions/runs/44802823492), [Demo #38](https://github.com/lemai-rgb/MMincare/actions/runs/44802823433); both completed successfully before merge |
| Public production smoke | Passed | Home and demo returned HTTP 200, dashboard redirected to login, both unauthenticated create requests returned HTTP 401 |
| Production SQL behavior | Passed with transaction-scoped fixtures | Caretaker created both record types, Owner read and deleted both, Caretaker and unrelated account deleted zero rows. Fixtures rolled back and the four table fingerprints matched. |
| Production authenticated UI UAT | Pending | Local Playwright covers the Owner delete buttons and confirmations. The production SQL run exercised the database layer. |
| Remaining QA | Explicitly pending | Full authenticated production Owner/Caretaker flow, simultaneous revoke/write race, visual/device matrix |

Phase 2.2 allows confirmed Caretakers with Active, unexpired access to add Vaccine/Medical text records. Owner can see/delete those records. Caretakers cannot edit/delete, share onward, access private photos/files, Health Logs or manage Reminders.

See [the detailed release log](PHASE_2_2_RELEASE.md) for operations, migration mapping, evidence and limitations. Production migrations are already applied: do not run them again. Repository filenames match the recorded remote versions; no production history repair was performed.

## Historical checkpoint — 2026-10-11


**Cập nhật:** 2026-10-11 (VN) · **Application baseline:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf`  
**Đã triển khai:** PR #26 đã merge, [Vercel Production success](https://vercel.com/lemai-rgbs-projects/m-mincare/E3bmui2BdzU7iAzkP2kNtnM4XSLD).  
[Ứng dụng](https://m-mincare.vercel.app/) · [Trải nghiệm thử](https://m-mincare.vercel.app/demo)

## Historical delivery matrix — 2026-10-11

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

## Historical release evidence — PR #26

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

## Owner deletion follow-up (PR #36)
Owner can delete vaccine/medical records for their own Pet regardless of author. API creator filters are removed only after the Pet owner check; medical DELETE RLS is owner-scoped. UI buttons remain visible to Owner. SQL and Playwright tests cover deletion of Caretaker-created records. The earlier INACTIVE checkpoint is superseded by the production migration/catalog verification above. Production SQL verified Owner deletion of one synthetic Caretaker-created record of each type. Authenticated production UI UAT remains pending.
