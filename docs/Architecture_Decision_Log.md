# MMinCare — Architecture Decision Log

**Version:** 1.1  
**Updated:** 2026-08-10  
**Scope:** Auth và dữ liệu người dùng cho MVP

## Trạng thái quyết định

| ID | Quyết định | Trạng thái |
|---|---|---|
| ADL-001 | Không hard-delete tài khoản trong MVP | Accepted |
| ADL-002 | Bật Supabase Email Confirmation | Accepted |
| ADL-003 | Tách Email Confirmation tại `/auth/confirm` và kiểm tra redirect an toàn | Implemented / Passed |
| ADL-004 | `/dashboard` là landing/pet-list cơ bản của MVP | Accepted |
| ADL-005 | Bảo toàn và ánh xạ onboarding species | Accepted |
| ADL-006 | Google OAuth triển khai ở checkpoint riêng | Accepted |
| ADL-007 | `public.users` là hồ sơ 1–1 được quản lý qua Auth/server | Accepted |
| ADL-008 | Chuẩn hóa email bằng CHECK và một UNIQUE constraint | Accepted |
| ADL-009 | Auth SSR dùng `@supabase/ssr`, không lộ service role | Accepted |

## ADL-001 — Vòng đời tài khoản

- MVP không cung cấp hard-delete tài khoản.
- FK `public.users.user_id → auth.users.id` dùng `ON DELETE RESTRICT` hoặc mặc định `NO ACTION`.
- Không cascade xóa pet, medical record, vaccine record, reminder hoặc lịch sử chăm sóc.
- Nếu cần ẩn/vô hiệu hóa tài khoản trong tương lai, dùng soft delete hoặc trạng thái inactive sau khi có đặc tả riêng.

## ADL-002 — Email Confirmation

- Supabase Email Confirmation được bật.
- `signUp` có thể trả user nhưng không có session.
- Khi chưa có session, UI hiển thị trạng thái yêu cầu kiểm tra email; không hiển thị thành công giả và không vào route được bảo vệ.
- Chỉ redirect tiếp sau khi `/auth/confirm` tạo và xác minh được session hợp lệ.
- Flow email/password đã được kiểm thử thủ công thành công ngày 2026-08-10 tại commit `c48fc3e`.

## ADL-003 — Route xác nhận email và redirect an toàn

- Email Confirmation dùng `/auth/confirm`; route này hỗ trợ `token_hash` qua `verifyOtp()` và PKCE `code` qua `exchangeCodeForSession()`.
- Chỉ redirect sau khi session được xác minh bằng Supabase Auth.
- `next` chỉ chấp nhận đúng `/dashboard`, `/pets/new?species=cat` hoặc `/pets/new?species=dog`; mọi giá trị khác dùng fallback `/dashboard`.
- `/auth/callback` không còn là route dùng chung cho Email Confirmation và được dành cho Google OAuth ở checkpoint sau nếu cần.

## ADL-004 — Điều hướng sau login

- Login thành công redirect đến `/dashboard`.
- Trong MVP, `/dashboard` là landing/pet-list cơ bản.
- Dashboard phân tích nâng cao, biểu đồ và tổng hợp sức khỏe vẫn thuộc Phase 2.
- Không dùng `landing_type` để điều hướng tới route chưa tồn tại.

## ADL-005 — Onboarding species

- Home chỉ tạo URL `/register?species=cat|dog`; không tạo pet.
- Chỉ chấp nhận `cat` hoặc `dog`; giá trị khác bị từ chối.
- Species hợp lệ được bảo toàn qua Email Confirmation.
- Sau khi có session, redirect đến `/pets/new?species=cat|dog`.
- Khi ghi database, ánh xạ `cat → Cat`, `dog → Dog`.
- Implementation note: `/pets/new` chưa được triển khai; commit `c48fc3e` tạm redirect đến `/dashboard?species=cat|dog` để giữ species. Đây không thay đổi đích sản phẩm cuối cùng.

## ADL-006 — Google OAuth

- BR-AUTH-08 vẫn là quyết định sản phẩm đã chốt.
- Google OAuth được triển khai ở checkpoint riêng sau email/password Auth.
- Trước khi hoàn tất, Google button được ẩn và không được trình bày như một chức năng khả dụng.

## ADL-007 — Hồ sơ `public.users`

- Mỗi `auth.users` có một `public.users` cùng UUID.
- Profile được tạo và đồng bộ bằng trigger hoặc cơ chế server tin cậy.
- `phone_number` nullable; `name` bắt buộc và có fallback từ email local-part.
- Client chỉ được sửa `name`, `phone_number`.
- Client không được sửa `user_id`, `email`, `created_at`.
- Email được đồng bộ từ Auth sau khi chuẩn hóa.
- Trigger `BEFORE UPDATE` cập nhật `updated_at = now()`.
- Trigger đã được xác minh tạo `public.users` cùng UUID với `auth.users`, sinh `name` từ email local-part và lưu email đã chuẩn hóa.

## ADL-008 — Chuẩn hóa email

- Mọi điểm lưu/so khớp dùng `lower(trim(email))`.
- `public.users.email` có CHECK bảo đảm dữ liệu đã chuẩn hóa và một UNIQUE constraint.
- Không tạo đồng thời UNIQUE trên email và expression unique index trùng chức năng.

## ADL-009 — Hạ tầng Auth SSR

- Dùng `@supabase/ssr` theo Next.js App Router.
- Browser client và server client tách riêng.
- Cookie/session được refresh và route dành cho authenticated user được bảo vệ phía server.
- Publishable key được phép dùng ở client; service-role key tuyệt đối không được đưa vào client hoặc biến `NEXT_PUBLIC_*`.
- Browser/server client, cookie refresh, route protection và logout đã được triển khai, kiểm thử tại commit `c48fc3e`.

## Tài liệu chịu tác động

- `Requirements/MMinCare_Business_Rules.md`
- `MMinCare_API_Documentation.md`
- `system design/Data_Dictionary.md`
- User Flow/ERD cũ chỉ dùng tham khảo; khi khác biệt, các quyết định Accepted trong log này và Business Rules mới hơn được ưu tiên.
