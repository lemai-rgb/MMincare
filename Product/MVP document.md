# MMinCare — MVP Document

**Phiên bản:** 2.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## 1. Product goal

MMinCare helps pet owners keep pet profiles, vaccination history, medical records, attachments, health observations and care reminders in one place. The MVP validates whether an owner can maintain a usable longitudinal record without relying on paper records, chat messages or memory.

MMinCare is not a veterinary diagnostic system and does not replace professional advice.

## 2. Người dùng và phạm vi hiện tại

Owner đăng nhập dùng sản phẩm thật. Người xem CV mở public `/demo` để trải nghiệm nghiệp vụ với mẫu browser-local; không cần account. MMinCare/Supabase là thành phần hệ thống, không phải actor người dùng của Use Case. Caretaker sharing reserved Phase 2, chưa runtime.

## 3. Owner MVP đã triển khai

1. Email/password signup/confirm/resend, login/logout, protected session và recovery an toàn.
2. Tạo/xem/sửa Pet, chọn/đổi/bỏ ảnh JPEG/PNG/WebP ≤5 MiB; ảnh private, fallback theo loài, ảnh thật phủ khung vuông.
3. Pet card gọn: ngày nhật ký gần nhất, tình trạng/cân nặng và Xem nhật ký; thiếu dữ liệu được ghi rõ.
4. Vaccine event không tương lai, create/read/delete có xác nhận; chưa edit. Suggestion contract phân biệt trạng thái nhưng CR-08 quyền/dataset chưa hoàn tất, có thể tự nhập Reminder.
5. Medical create/read/delete, attachment private tùy chọn/retry/signed access; xóa xử lý phụ thuộc và cleanup warning, chưa edit.
6. Reminder manual hoặc một nguồn Vaccine/Medical cùng Pet; view/filter Upcoming/Overdue/Completed, sửa ngày/ghi chú Upcoming, complete riêng.
7. Notification Center in-app, unread red dot/read/retry/deep link, Escape/outside/focus, invalidation theo Reminder.
8. Health Log Owner CRUD, date nghiệp vụ và timestamp bất biến, confirmation delete; POST idempotency/canonical retry, chống stale GET/mutation.
9. Keyboard UX: Enter trong ba ô đo/ăn không lưu; textarea, native control, Save keyboard và IME được giữ.
10. Thống kê tuần/tháng cho một Pet, weight trend/status frequency và tooltips; sửa contract timestamp/range.
11. Request timeout 15s/body, abort/cleanup/retry và giảm summary query theo tab; không có số đo chứng minh tăng tốc production.
12. Responsive Pet tabs2 × 2 mobile, metadata wrap, compact journal footer/actions; chưa kiểm thử visual đủ thiết bị.

## 4. Demo đã triển khai

[Trải nghiệm thử](https://m-mincare.vercel.app/demo) dùng cùng component/form/CSS app thật, nhãn Trải nghiệm thử/reset có xác nhận và Về trang chủ. Ba bé Meo/Min/Sushi, ảnh thật và fallback, lịch sử/tình trạng không giống nhau;31 Health Logs và các hồ sơ chăm sóc/reminder/notification.

Các thao tác chạy browser-local qua scoped adapter, reload giữ state từng tab nếu sessionStorage có sẵn. Reset chỉ thay key demo và neo ngày hiện tại Việt Nam. Không ghi backend, không mô phỏng bằng chứng real Auth/email/Owner A/B/Storage/performance. Sushi có dữ liệu cơ bản nhưng không có Medical Record để thể hiện empty state. Export JSON/CSV dùng portfolio, không seed Supabase.

## 5. Implemented beyond original prioritization

Health Log/dashboard/tooltips, recovery, photo upload, Notification và correction/deletion đã được triển khai. Giữ MoSCoW gốc cho truy vết; Should Have không đồng nghĩa chưa làm. Feedback người dùng được thuật lại đã dẫn đến bỏ URL ảnh, tránh Enter vô tình lưu, card ngắn và chỉnh responsive; không gọi đây là nghiên cứu định lượng hoặc UAT sign-off.

## 6. Giới hạn và tồn đọng

- Không có Pet/account delete, Vaccine/Medical edit, Caretaker sharing, Google OAuth, push/email hay aggregate đa-Pet.
- CR-08 chỉ sửa contract trạng thái; rule access/dataset production chưa hoàn tất, demo không bịa interval.
- Real email/callback, upload/change/remove/reload, Owner A/B, real retry/cleanup và full desktop/mobile QA chưa đủ bằng chứng.
- Đã có public demo smoke; build/deploy/test PASS không là SLA, security certification hoặc measured speedup.
- Migration trong repository đồng bộ version remote; cần inventory trước promotion, không replay/repair lịch sử tùy tiện.


## 7. MoSCoW baseline

| Capability | Priority | Current status |
|---|---|---|
| Authentication and recovery | Must Have | Implemented |
| Pet profile | Must Have | Implemented |
| Vaccine Record | Must Have | Implemented |
| Medical Record and attachment | Must Have | Implemented |
| In-app Reminder | Must Have | Implemented |
| Health Log | Should Have | Implemented early for Owner |
| Per-Pet Health Dashboard | Should Have | Implemented early for Owner |
| Caretaker sharing | Should Have | Phase 2 |
| Aggregate multi-Pet dashboard | Should Have | Phase 2 |
| Google OAuth | Phase 1 planned | Pending configuration |
| Push/email reminders | Future | Not implemented |
| AI health advice | Won't Have for MVP | Excluded |

## 8. Acceptance checklist và trạng thái kiểm chứng

| Nhóm | Mong đợi | Bằng chứng hiện có / còn thiếu |
|---|---|---|
| Public demo |3 Pet, same UI, thử CRUD/reminder/notification/reset/reload | Automated31 demo tests; production smoke3 cards, Min history/month/status detail và return-home; không phải full UAT |
| Real Owner flows |Auth, Pet photo, care-record CRUD, Health CRUD, Reminder/read | Code/CI/regression có; real authenticated manual matrix chưa hoàn tất |
| Quyền |Owner A không truy cập/chỉnh dữ liệu B | API/RLS/policy review và CI assertions; hai session live chưa kiểm thử |
| Keyboard/mobile |Không Enter lưu nhầm, không cắt chữ/control | Regression và CSS responsive; IME/device/fullvisual manual pending |
| Hiệu năng |Không loading vô hạn, lấy canonical data | Timeout/race tests; TTFB/production before-after chưa đo |

## 9. Success measures (mục tiêu, chưa công bố đạt)

Người dùng hoàn tất flow không trợ giúp, tìm đúng lịch sử/Pet, sửa lỗi nhập mà không tạo trùng, attachment failure không mất Medical Record, Reminder/Notification nhất quán khi reload. Đo completion/error/time bằng kịch bản và dữ liệu giả lập, ghi rõ môi trường/commit. Chưa có user count, speed percentage, uptime hoặc formal UAT để dùng trên CV.


## 10. Changelog

| Version | Date | Change |
|---|---|---|
| 2.0 | 2026-10-11 | Đồng bộ code đã triển khai, CRUD/ảnh/thông báo, request lifecycle/idempotency và demo cùng UI; tách phạm vi kiểm chứng và kế hoạch. |
| 1.1 | 2026-09-22 | Rebuilt Current/Implemented Beyond Initial MVP/Phase 2 scope from deployed baseline; added recovery, Health Log/dashboard, current limitations and pending PR #7 boundary. |
| 1.0 | 2026-07-23 | Initial MVP definition and prioritization. |
