# MMinCare — Current Implementation Status

> Ngày audit: 2026-08-16  
> Phạm vi: toàn bộ repository hiện tại, tập trung từ Authentication đến Hồ sơ y tế.  
> Phương thức: audit source/config/schema ở chế độ read-only. Ngoại lệ duy nhất là tạo báo cáo này. Không đọc hoặc ghi giá trị secret, không gọi database và không thay đổi dữ liệu.

## 1. Kết luận nhanh

Project đã có một vertical slice hoạt động về mặt source cho email/password Authentication, danh sách pet, tạo/sửa/xem pet, đọc lịch sử y tế và thêm bản ghi vaccine. Dữ liệu ở các luồng này chủ yếu đi qua Supabase thật, không phải một mock store.

Tuy nhiên, phạm vi từ Authentication đến Hồ sơ y tế **chưa hoàn tất end-to-end**. Google OAuth, quên mật khẩu, Caretaker, upload ảnh, thêm lần khám và xem chi tiết bản ghi y tế chưa được triển khai. Luồng gợi ý/tạo Reminder sau tiêm có endpoint và UI code nhưng hiện không thể đạt tới sau khi lưu vaccine. Repository cũng chưa có migration đầy đủ cho toàn bộ schema/RLS mà code ứng dụng đang phụ thuộc.

## 2. Tech stack và cấu trúc chính

- Next.js 16.2.9, App Router, React 19.2.4, TypeScript 5.9.3, strict mode.
- Styling: CSS Modules và `app/globals.css`; Tailwind 4 có dependency/PostCSS nhưng UI hiện tại chủ yếu dùng CSS Modules.
- Supabase: `@supabase/ssr` 0.12.4 và `@supabase/supabase-js` 2.112.2.
- Authentication: Supabase Auth email/password, email confirmation, cookie session qua `proxy.ts`.
- Data access:
  - Server Components đọc trực tiếp Supabase cho dashboard/pet detail/edit.
  - Client Components dùng Supabase browser client cho Auth và create/update pet.
  - Route Handlers dùng Supabase server client cho vaccine, reminder và medical history.
- Không có framework/unit/e2e test được cấu hình trong `package.json`.

### Cấu trúc

- `app/`: pages, auth confirmation và Route Handlers.
- `components/auth/`: form đăng ký, đăng nhập, logout và UI Auth.
- `components/home/`: landing/onboarding chọn chó hoặc mèo.
- `components/pets/`: form pet, dashboard/detail, lịch sử y tế và vaccine.
- `lib/supabase/`: browser/server client, env validation, session proxy.
- `lib/`: validation, safe redirect, pet/medical types và helpers.
- `database/schema.sql`: schema thiết kế nền, chưa phải snapshot triển khai đồng bộ với app hiện tại.
- `database/migrations/20260810000000_upgrade_auth_users_profile.sql`: migration nâng cấp `public.users`, trigger đồng bộ Supabase Auth và RLS riêng cho `users`.
- `docs/`: User Story, Business Rules, API Documentation, Data Dictionary và tài liệu thiết kế.

## 3. Danh sách route hiện có

| Route | Loại | Bảo vệ | Trạng thái |
|---|---|---:|---|
| `/` | Page | Public | Landing và chọn species; hoàn chỉnh về UI |
| `/login` | Page | Public/redirect nếu đã login | Email/password nối Supabase |
| `/register` | Page | Public/redirect nếu đã login | Đăng ký và email confirmation nối Supabase |
| `/dashboard` | Page | Auth | Danh sách pet thật và empty state |
| `/pets/new` | Page | Auth | Tạo pet thật |
| `/pets/[petId]` | Page | Auth + owner filter | Detail, overview và các tab |
| `/pets/[petId]/edit` | Page | Auth + owner filter | Sửa pet thật |
| `/auth/confirm` | Route Handler GET | Public callback | Verify OTP/PKCE và safe redirect |
| `/auth/confirm/error` | Page | Public | Trạng thái lỗi confirmation |
| `/api/pets/[petId]/medical-history` | Route Handler GET | Auth + owner filter | Gộp vaccine/medical record thật |
| `/api/pets/[petId]/vaccines` | Route Handler POST | Auth + owner filter | Tạo vaccine thật và tính ngày gợi ý |
| `/api/pets/[petId]/reminders` | Route Handler POST | Auth + owner filter | Tạo reminder từ vaccine; UI hiện chưa đi tới được |

`proxy.ts` bảo vệ `/dashboard` và `/pets/new`. Các route động `/pets/[petId]` và API tự kiểm tra session/owner trong implementation; chúng không nằm trong `PROTECTED_PREFIXES` của proxy.

## 4. Màn hình và luồng đã hoàn thành

“Hoàn thành” dưới đây nghĩa là UI chính và data flow cốt lõi đã có trong source; chưa đồng nghĩa đã được xác nhận bằng live database/e2e.

### Authentication

- Đăng ký email/password: normalize email, validate email/mật khẩu/xác nhận mật khẩu, gọi Supabase `signUp`, xử lý trường hợp có/không có session.
- Email confirmation: hỗ trợ `token_hash` và PKCE `code`; chỉ redirect sau khi claims hợp lệ; giới hạn redirect nội bộ.
- Đăng nhập email/password: validation tại field, thông báo lỗi chung, gọi `signInWithPassword` và redirect dashboard.
- Duy trì/refresh session: Supabase SSR client + proxy cookie refresh.
- Đăng xuất: gọi `signOut`, về trang chủ.
- Migration profile user có trigger tạo `public.users` từ `auth.users`, tạo name mặc định và đồng bộ email.

### Pet profile

- Landing/onboarding chọn Cat/Dog và mang lựa chọn qua query string.
- Dashboard đọc danh sách pet của owner, có populated state, empty state và trạng thái lỗi.
- Tạo pet: validate tên/loài/giới tính/ngày sinh; insert Supabase; avatar mặc định theo species.
- Xem pet detail: đọc pet theo `pet_id + owner_id`, hiển thị metadata và số vaccine.
- Sửa pet: đọc dữ liệu thật, update theo `pet_id + owner_id`.

### Hồ sơ y tế

- GET medical history xác thực owner, đọc `vaccine_records` và `medical_records`, chuẩn hóa về một timeline và sort mới nhất trước.
- Timeline có empty/loading/error state và filter Tất cả/Tiêm phòng/Khám bệnh.
- Form thêm vaccine nối Route Handler và Supabase insert thật.
- Backend vaccine kiểm tra ownership, required fields, dose number, ghi `created_by`, tra schedule rule theo species + vaccine name + tuổi tại ngày tiêm, và trả `suggested_next_due_date`.

## 5. Màn hình/luồng đang làm dở hoặc chỉ có UI mock

| Hạng mục | Hiện trạng |
|---|---|
| Google OAuth | Có component nút disabled/không khả dụng, không được render trong form; không có `/auth/callback` hay OAuth action |
| Quên mật khẩu | Nút `type="button"`, không có handler/route |
| Account/Profile | Chỉ là text nav, không có route/màn hình |
| Dashboard nav Nhắc hẹn/Hồ sơ y tế | Chỉ là `span`, không điều hướng |
| Pet detail — Nhắc hẹn | Tab có placeholder “checkpoint tiếp theo”; không đọc danh sách reminder |
| Pet detail — Sức khỏe | Tab placeholder; không có Health Log UI/API |
| Thêm lần khám | Menu bị disabled; query `form=medical-record` chỉ hiện “Sắp có” |
| Chi tiết vaccine/medical record | Card timeline không clickable, không có detail route |
| Upload ảnh pet | Chỉ nhận URL; UI ghi rõ upload Storage ở checkpoint sau |
| Medical attachment | Chưa có UI, API hoặc Storage integration |
| Caretaker/shared pets | Chưa có UI/API/data access; dashboard chỉ query `owner_id` |
| Xóa/hoàn tác | Không thuộc phạm vi MVP hard-delete; không có chức năng xóa |
| Vaccine → Reminder | Endpoint POST tồn tại nhưng sau save, `handleVaccineSaved` luôn chuyển về history; state `suggestion`/`saved-no-suggestion` không bao giờ được set nên UI xác nhận reminder không thể đạt tới |

## 6. Mock data, hard-coded data và dữ liệu thật

### Dữ liệu thật từ Supabase

- Session/claims và Auth: đăng ký, đăng nhập, đăng xuất, email confirmation.
- `pets`: list, create, detail, edit.
- `vaccine_records`: count, list qua medical history, insert.
- `medical_records`: read-only qua medical history.
- `vaccine_schedule_rules`: đọc để tính gợi ý ngày tiêm tiếp theo.
- `reminders`: endpoint insert có thật, nhưng chưa có luồng UI đạt tới và chưa có list UI.

### Hard-coded/static

- Danh sách vaccine theo Cat/Dog trong `VaccineCreateForm` là mảng hard-coded, không đọc catalog/rules từ database. Tên phải khớp rule bằng so sánh chuỗi case-insensitive thì backend mới gợi ý được lịch.
- Avatar mặc định Cat/Dog và toàn bộ decorative assets là file local; đây là static asset hợp lệ, không phải dữ liệu nghiệp vụ giả.
- Dashboard card luôn ghi “Chưa có thông tin sức khỏe” dù pet có thể đã có dữ liệu.
- Overview “Nhắc hẹn sắp tới” luôn ghi chưa có lịch; không query reminder.
- Overview “Lần khám gần nhất” luôn ghi chưa có dữ liệu; dù API medical history đã trả medical record.
- Các label, species/gender enum, text status và navigation được hard-code trong client.

Không tìm thấy mock server, JSON fixture hay in-memory mock database.

## 7. API/Supabase đã kết nối

### Đã kết nối

- Browser client và server client lấy duy nhất public URL + publishable key qua env helper.
- Không thấy service-role key trong source và báo cáo không ghi bất kỳ giá trị env nào.
- Auth SSR dùng cookie store và `getClaims()`; proxy refresh cookie và redirect auth/protected pages.
- Route Handlers hiện có đều kiểm tra Auth; pet-sensitive operations thêm owner predicate.
- `public.users` migration bật RLS, policy own-profile và giới hạn column update cho `name`, `phone_number`.

### Khoảng trống/rủi ro integration

- Repository không có migration tạo/upgrade đầy đủ cho `pets`, `vaccine_records`, `medical_records`, `reminders`, `health_logs`, `pet_access`, `vaccine_schedule_rules` và RLS tương ứng. `schema.sql` cũng không bật RLS cho các bảng nghiệp vụ.
- `schema.sql` lệch app/migration: `users` còn `password_hash` và thiếu timestamps; `pets` thiếu `created_at/updated_at` nhưng app select/order các cột này; migration users tham chiếu `created_at` vốn không có trong file schema; `vaccine_schedule_rules` được code query nhưng không có định nghĩa trong schema hiện tại.
- Vì không truy cập live database, audit không thể xác nhận schema/policies thực tế trên Supabase có được tạo thủ công ngoài repository hay không.
- Client create/update pet phụ thuộc RLS live database. Owner predicates ở client không thay thế được RLS.
- API medical history/vaccine/reminder chỉ hỗ trợ owner, chưa hỗ trợ Caretaker theo Business Rules.

## 8. Sai lệch với User Story / Business Rules / API Documentation

### Authentication

- US-01 nói đăng ký thành công đi tới tạo hồ sơ pet; implementation mặc định đi `/dashboard`, chỉ giữ onboarding species khi bắt đầu từ species card. Đây là một phần phù hợp quyết định BR-AUTH-12/13 mới hơn, nhưng chưa khớp nguyên văn US-01.
- BR-AUTH-08/US-02 Google OAuth chưa triển khai; phù hợp ghi chú “checkpoint sau”, nhưng chưa thể coi Authentication đầy đủ.
- Quên mật khẩu không được mô tả trong API index nhưng UI đã hiển thị nút không hoạt động.
- API documentation mô tả REST endpoints `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`; implementation dùng Supabase SDK trực tiếp, không có các Route Handler này. Hành vi có thể tương đương, contract/path thì không khớp.

### Pet profile

- US-03/BR-PET-07 yêu cầu upload jpg/png và giới hạn dung lượng; implementation chỉ lưu URL ảnh, không upload/validate file.
- US-05 yêu cầu thông báo “Đã lưu thay đổi”; implementation redirect detail ngay, không có success feedback.
- API docs mô tả `/pets` GET/POST và `/pets/{id}` GET/PUT; implementation dùng Supabase SDK trực tiếp và page routes, không có REST contract tương ứng.
- Caretaker visibility/edit restrictions chưa triển khai; hiện chỉ owner được query nên an toàn theo hướng deny, nhưng chưa đáp ứng shared-pet flows.

### Vaccine, Reminder và Medical History

- **BR-VAC-07/US-06 AC-03 bị vi phạm:** UI đặt `max=today` và reject ngày tương lai; API cũng reject. Rule yêu cầu vẫn lưu và trả soft warning. Nhánh `warning` ở response hiện trở thành dead code.
- **BR-VAC-04, BR-REM-07 chưa chạy end-to-end:** UI gợi ý/chỉnh ngày/tạo reminder tồn tại nhưng unreachable do `handleVaccineSaved` luôn về history.
- `vaccine_schedule_rules` không có schema/migration trong repository, nên tính gợi ý phụ thuộc cấu trúc live DB không được version-control.
- US-07/BR-MED chưa triển khai create Medical Record và attachment.
- US-08 AC-01/02 đã có; AC-03 xem chi tiết record chưa có.
- API docs yêu cầu các GET/detail endpoints riêng cho vaccine/medical/reminder; repository chỉ có GET aggregate `medical-history`, POST vaccine và POST reminder.
- API success format tài liệu dùng envelope `data`; các Route Handler hiện trả payload trực tiếp. Error `{ error }` nhìn chung phù hợp.

### Data Dictionary/schema

- Schema checked-in không phản ánh đúng Data Dictionary/current app cho timestamps, Auth-backed `users`, vaccine schedule rules và RLS.
- `reminder_status` trong `schema.sql` chứa `Due Soon` và `Overdue`, trong khi Business Rules hiện hành yêu cầu stored status chỉ `Upcoming`/`Completed`, còn display status mới được derive.
- `schema.sql` comment nói quyền Reminder “enforced ở app”; với Supabase Data API, authorization phải được bảo vệ bằng grants/RLS, không chỉ dựa vào UI/app predicate.

## 9. Build, typecheck, lint và test

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Typecheck | Pass | `npx.cmd tsc --noEmit --incremental false` |
| Lint | Pass | `npm.cmd run lint` |
| Test | Không chạy | Không có script test/spec/e2e trong `package.json` |
| Build | Không chạy | `next build` ghi output vào `.next`, mâu thuẫn với yêu cầu audit không tạo/thay đổi file |
| Dev server/UI localhost | Không chạy | Static inspection đủ để lập inventory; chạy dev cũng ghi `.next`. Không có tài khoản test được cấp để kiểm chứng authenticated routes mà không thay đổi Auth/database |

Lần gọi lint đầu tiên nằm chung với typecheck đã hết timeout sau khi typecheck pass; chạy lại riêng lint hoàn tất với exit code 0. Worktree sạch trước các check; chỉ file báo cáo này được thêm sau audit.

## 10. Năm việc nên làm tiếp theo

1. **Version-control schema Supabase chuẩn và RLS đầy đủ.** Tạo baseline/migrations khớp Data Dictionary và code cho timestamps, `vaccine_schedule_rules`, mọi bảng Core MVP, grants và owner/caretaker policies; xác minh bằng Supabase advisors và test quyền.
2. **Hoàn tất Vaccine → Reminder đúng BR-VAC/BR-REM.** Cho phép ngày vaccine tương lai với warning mềm; sửa state transition để hiện gợi ý hoặc manual date, cho chỉnh ngày và chỉ insert Reminder sau xác nhận.
3. **Hoàn tất Medical Record (US-07) và record detail (US-08 AC-03).** Thêm create/read detail, validation, upload attachment qua Supabase Storage với type/5MB enforcement và RLS.
4. **Đồng bộ API contract với tài liệu.** Chọn rõ Supabase SDK trực tiếp hay Route Handlers làm public contract; sau đó cập nhật implementation hoặc API Documentation, chuẩn hóa response envelope/status/error và bổ sung các endpoint còn thiếu.
5. **Thêm automated tests và smoke test runtime.** Ưu tiên auth validation/safe redirect, ownership/RLS, pet CRUD, vaccine date/rule calculation, medical-history sorting/filter và Vaccine → Reminder e2e; sau đó chạy build + localhost smoke test trong môi trường cho phép tạo `.next` và dùng database test riêng.

## 11. Mức độ hoàn thành theo User Story trọng tâm

| User Story | Đánh giá |
|---|---|
| US-01 Đăng ký | Gần hoàn thành; thiếu xác nhận runtime/e2e và default redirect không luôn tới create pet |
| US-02 Đăng nhập | Một phần tốt cho email/password; thiếu Google và Caretaker landing |
| US-03 Tạo pet | Gần hoàn thành; thiếu upload ảnh thật |
| US-04 Danh sách pet | Hoàn thành cho Owner; chưa có shared pets/Caretaker |
| US-05 Sửa pet | Gần hoàn thành cho Owner; thiếu success feedback và Caretaker flow |
| US-06 Vaccine | Đang làm dở; insert/history có thật, future-date và reminder suggestion sai/chưa nối |
| US-07 Medical Record | Chưa triển khai create/attachment; mới đọc dữ liệu nếu DB đã có |
| US-08 Medical History | Một phần lớn đã có; thiếu record detail |

