# MMinCare — Current Implementation Status

> Ngày audit: 2026-08-23
>
> Phạm vi: toàn bộ repository hiện tại, tập trung từ Authentication đến Hồ sơ y tế.
>
> Baseline requirement chính thức: `D:\MMinCare\docs` — User Story 1.4, Business Rules 1.4, Data Dictionary 2.3, API Documentation 1.4 và Architecture Decision Log 1.4. Version được xác nhận từ header trong nội dung tài liệu, không suy luận từ tên file.
>
> Phương thức: đọc source, config, tài liệu và SQL trong repository. Ngoại lệ ghi duy nhất là cập nhật báo cáo này. Không dùng bản sao tài liệu trong repository làm baseline, không đọc giá trị `.env`, không gọi Supabase remote và không thay đổi database.

## 1. Kết luận nhanh

Project đã có vertical slice dùng dữ liệu Supabase thật cho email/password Authentication, danh sách/tạo/xem/sửa pet, timeline lịch sử y tế, tạo Vaccine Record, Owner xác nhận tạo Reminder, danh sách Reminder tổng hợp và đánh dấu Reminder hoàn thành.

Phạm vi Core MVP vẫn chưa hoàn tất end-to-end. Google OAuth là **Not Implemented — Phase 1 checkpoint B**; quên mật khẩu, upload ảnh pet, tạo lần khám, attachment, chi tiết bản ghi y tế, tạo Reminder thủ công và Caretaker/shared pet cũng chưa được triển khai đầy đủ.

Client và API từ chối `vaccine_date` ở tương lai. Hành vi này **đúng requirement hiện hành**: Vaccine Record chỉ biểu diễn mũi tiêm đã xảy ra; ngày dự kiến trong tương lai phải được quản lý qua Reminder. ADL-005, ADL-010, DEC-08 và ADL-012 hiện đều ở mức Partial theo phạm vi chi tiết bên dưới. Schema, migrations và policies được mô tả trong repository chỉ là target implementation; trạng thái Supabase thực tế là **Unverified Live**.

## 2. Tech stack và cấu trúc chính

- Next.js 16.2.9 App Router, React 19.2.4, TypeScript strict.
- Styling bằng CSS Modules và `app/globals.css`; Tailwind 4 có dependency/PostCSS nhưng UI hiện chủ yếu dùng CSS Modules.
- Supabase Auth/Data qua `@supabase/ssr` và `@supabase/supabase-js`.
- Supabase SSR cookie session được refresh tại `proxy.ts`.
- Server Components đọc Supabase cho dashboard/pet detail/edit; Client Components dùng browser client cho Auth và pet create/update; Route Handlers xử lý medical history, vaccine và reminder.
- Không có Server Action và không có unit/integration/e2e test framework hoặc script test trong `package.json`.

### Cấu trúc chính

- `app/`: pages, Auth confirmation và API Route Handlers.
- `components/auth/`: login, register, logout và Auth UI.
- `components/home/`: landing/onboarding chọn Cat/Dog.
- `components/pets/`: dashboard cards, pet form/detail/overview, medical timeline và vaccine form.
- `lib/supabase/`: browser/server client, env-name validation và session proxy.
- `lib/`: validation, safe redirect, types và helpers.
- `database/schema.sql`: target schema đã được alignment với Data Dictionary.
- `database/migrations/`: migration profile Auth cũ.
- `supabase/migrations/20260816182123_core_schema_alignment.sql`: incremental alignment draft cho Core MVP/RLS; không có clinical seed.
- `docs/`: User Story, Business Rules, API Documentation, Data Dictionary và báo cáo này.

## 3. Danh sách route

| Route | Loại | Bảo vệ | Trạng thái |
|---|---|---:|---|
| `/` | Page | Public | Landing/chọn species; UI hoàn chỉnh |
| `/login` | Page | Public; redirect nếu đã login | Email/password nối Supabase Auth |
| `/register` | Page | Public; redirect nếu đã login | Sign-up và email confirmation nối Supabase |
| `/dashboard` | Page | Auth qua proxy | Danh sách pet thật, error/empty/populated states |
| `/pets/new` | Page | Auth qua proxy | Tạo pet thật |
| `/pets/[petId]` | Page | Auth + owner predicate | Overview và các tab pet |
| `/pets/[petId]/edit` | Page | Auth + owner predicate | Sửa pet thật |
| `/reminders` | Page | Auth qua proxy | Danh sách Reminder toàn bộ pet, filter và complete flow |
| `/auth/confirm` | GET Route Handler | Public callback | OTP/PKCE confirmation, safe redirect |
| `/auth/confirm/error` | Page | Public | Confirmation error state |
| `/api/pets/[petId]/medical-history` | GET Route Handler | Auth + owner predicate | Timeline vaccine/medical record thật |
| `/api/pets/[petId]/vaccines` | POST Route Handler | Auth + owner predicate | Insert Vaccine Record, thử tính suggested date |
| `/api/pets/[petId]/reminders` | POST Route Handler | Auth + owner predicate | Insert Reminder sau Owner xác nhận |
| `/api/reminders` | GET Route Handler | Auth + owner predicate/RLS | Aggregate Owner pets, reminders và nguồn Vaccine |
| `/api/reminders/[reminderId]/complete` | PATCH Route Handler | Auth + owner predicate/RLS | Chuyển stored status sang `Completed` và ghi `completed_at` |

`proxy.ts` liệt kê `/dashboard`, `/pets/new` và `/reminders` trong protected prefixes. Dynamic pet pages và các API nhạy cảm tự kiểm tra session/owner trong implementation.

## 4. Màn hình và luồng đã code hoàn chỉnh

“Hoàn chỉnh” ở đây nghĩa là source đã có UI và data flow cốt lõi; chưa phải xác nhận runtime/e2e với live database.

### Authentication

- Đăng ký email/password: normalize email, validate password/xác nhận mật khẩu, gọi `signUp`, xử lý có hoặc chưa có session.
- Email confirmation: hỗ trợ `token_hash` và PKCE `code`, kiểm tra claims và chỉ cho internal redirect hợp lệ.
- Đăng nhập email/password: field validation, thông báo lỗi chung, `signInWithPassword`, redirect dashboard.
- Session refresh, redirect auth/protected pages và logout đã nối Supabase.
- SQL trong repository có trigger/profile flow tạo `public.users` từ `auth.users` và giới hạn cập nhật profile.

### Pet profile

- Landing chọn Cat/Dog và truyền lựa chọn onboarding.
- Dashboard query pet theo Owner, có loading/error/empty/populated behavior ở cấp page/component.
- Tạo pet: validate tên, loài, giới tính, ngày sinh; insert Supabase; fallback avatar theo species.
- Xem pet: query theo `pet_id + owner_id`, hiển thị metadata và vaccine count.
- Sửa pet: đọc dữ liệu thật và update theo `pet_id + owner_id`.

### Hồ sơ y tế và Vaccine → Reminder

- Medical History API đọc `vaccine_records` và `medical_records`, chuẩn hóa thành timeline, sort mới nhất trước.
- Timeline có loading/error/empty state và filter Tất cả/Tiêm phòng/Khám bệnh.
- Form vaccine POST vào Route Handler; backend kiểm tra Auth/Owner, required fields/dose, ghi `created_by`, insert Vaccine Record và tra schedule rule.
- Sau khi vaccine được lưu, component hiện giữ record vừa tạo, warning và suggested date. Có hai post-save state: có gợi ý thì prefill nhưng cho sửa; không có gợi ý thì cho nhập ngày thủ công.
- Reminder chỉ được POST sau khi Owner bấm xác nhận; “Để sau” chỉ đóng prompt. Nếu Reminder lỗi, Vaccine Record vẫn được xem là đã lưu và post-save state được giữ lại.
- `/reminders` hiển thị Reminder của tất cả pet thuộc Owner, suy ra Upcoming/Overdue/Completed, filter theo trạng thái/pet và có loading/empty/error states.
- Complete flow có modal xác nhận, synchronous guard, user-scoped PATCH, toast và giữ Reminder trong tab Tất cả/Hoàn thành.
- Luồng trên chỉ mở ngay sau khi vừa tạo Vaccine Record. Timeline chưa có detail/action để mở lại Vaccine Record cũ và tạo Reminder bổ sung.

## 5. Màn hình/luồng đang làm dở hoặc chỉ có UI mock

| Hạng mục | Hiện trạng |
|---|---|
| Google OAuth | **Not Implemented — Phase 1 checkpoint B**; component nút không khả dụng, không được render và chưa có OAuth callback/action |
| Quên mật khẩu | Nút không có handler/route |
| Account/Profile | Chỉ là nav text, không có route |
| Dashboard nav Hồ sơ y tế | Chỉ là `span`, không điều hướng; Nhắc hẹn đã dẫn tới `/reminders` |
| Pet detail — Nhắc hẹn | Tab theo từng pet vẫn là placeholder; danh sách tổng hợp đã có tại `/reminders` |
| Pet detail — Sức khỏe | Placeholder; chưa có Health Log UI/API |
| Thêm lần khám | Action disabled; `form=medical-record` chỉ hiện “Sắp có” |
| Chi tiết medical/vaccine record | Timeline card không mở detail; không có detail route/API tương ứng |
| Upload ảnh pet | Chỉ lưu URL; chưa upload/validate file với Storage |
| Medical Record/Attachment — ADL-012 | **Partial / application flow mostly missing**; target schema có quan hệ và constraints nhưng chưa có create/upload API, UI, Storage integration hoặc retry flow |
| Caretaker/shared pets | Chưa có UI/API/data flow; các query hiện chỉ phục vụ Owner |
| Reminder — ADL-010 / DEC-08 | **Partial**; list/filter/complete đã có nhưng chưa có form tạo chung hoặc tạo Reminder bổ sung từ Vaccine Record cũ |

## 6. Mock data, hard-coded data và dữ liệu thật

### Dữ liệu thật qua Supabase

- Auth session, đăng ký, đăng nhập, đăng xuất và email confirmation.
- `pets`: list/create/detail/update.
- `vaccine_records`: count/list/insert.
- `medical_records`: read-only trong aggregate history.
- `vaccine_schedule_rules`: code có query để tính gợi ý; kết quả có thể null.
- `reminders`: POST insert sau xác nhận, aggregate GET list và PATCH complete dùng Owner-scoped SSR client/RLS.

### Hard-coded/static

- Danh sách vaccine Cat/Dog nằm trực tiếp trong `VaccineCreateForm`, không đọc catalog từ database. Tên chuỗi phải khớp rule case-insensitive mới có suggestion.
- Avatar mặc định và decorative assets là local static assets hợp lệ.
- Dashboard card luôn hiển thị “Chưa có thông tin sức khỏe”.
- Pet Overview luôn hiển thị chưa có Reminder và chưa có lần khám gần nhất, dù medical history có thể đã chứa Medical Record.
- Species/gender options, labels, status text và một số navigation đều hard-coded trong client.

Không tìm thấy mock server, JSON fixture hay in-memory mock database.

## 7. API/Supabase đã kết nối và khoảng trống

### Đã kết nối trong source

- Client chỉ tham chiếu public Supabase URL và publishable key qua env helper; audit không đọc giá trị env.
- Không thấy service-role credential trong source đã đọc.
- Auth SSR dùng cookie store/claims; Route Handlers đều kiểm tra Auth và các thao tác theo pet có owner predicate.
- Target schema và incremental migration đã có `vaccine_schedule_rules`, chuẩn hóa stored reminder status thành `Upcoming`/`Completed`, Owner policies cho medical records/attachments/reminders, deny-all Phase 2 và revoke RPC nguy hiểm.
- Reminder List bổ sung contract `{ reminders, pets }`; mỗi reminder trả `display_status`/`is_overdue` được suy ra, pet name, nguồn Vaccine nếu có và `completed_at`. `Overdue` không được persist.
- Migration `reminders_owner_complete` bổ sung nullable `completed_at`, column-level UPDATE grant và Owner UPDATE policy; migration chỉ được tạo local, chưa apply remote.

### Khoảng trống/rủi ro

- **Unverified Live:** Không truy cập Supabase remote nên không xác nhận migration alignment đã apply, migration history, live schema, grants hay live RLS policies. Mọi nhận định schema/policy bên dưới chỉ mô tả artifact trong repository.
- `vaccine_schedule_rules` trong migration bị revoke khỏi `authenticated` và không có SELECT policy. Trong khi Route Handler dùng Supabase server client theo session người dùng, query schedule có thể không đọc được rule sau khi migration được apply; implementation hiện nuốt lỗi query và fallback suggestion null.
- Migration không seed lịch vaccine theo chủ đích, nên dù quyền đọc được giải quyết thì suggestion vẫn null cho tới khi có dữ liệu chuyên môn được duyệt.
- Create/update pet chạy từ browser, do đó an toàn thực tế phụ thuộc RLS live; client owner predicate không thay thế RLS.
- Các API hiện chỉ hỗ trợ Owner; chưa hỗ trợ Caretaker theo các User Story chia sẻ.
- SQL migration nằm ở cả `database/migrations` và `supabase/migrations`; cần thống nhất source of truth và quy trình migration.

## 8. Sai lệch với User Story / Business Rules / API Documentation / Data Dictionary

### Authentication

- US-01 mô tả sau đăng ký đi tạo pet; implementation thường đi dashboard. BR-AUTH-12 mới hơn chốt login về dashboard, nhưng luồng onboarding species vẫn chưa luôn dẫn thẳng tới create pet như kỳ vọng User Story.
- BR-AUTH-08/US-02 Google OAuth là **Not Implemented — Phase 1 checkpoint B**.
- Quên mật khẩu xuất hiện trong UI nhưng không có contract/implementation.
- API docs mô tả `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`; app dùng Supabase SDK trực tiếp và không có các Route Handler đó.

### Pet profile

- US-03/BR-PET-07 yêu cầu upload jpg/png và giới hạn dung lượng; app chỉ lưu URL ảnh.
- US-05 yêu cầu feedback “Đã lưu thay đổi”; edit hiện redirect ngay, không có success feedback rõ ràng.
- API docs định nghĩa REST `/pets` và `/pets/{id}`; app dùng Supabase SDK trực tiếp, nên path/response contract không khớp tài liệu.
- Owner flow đã có; Caretaker visibility/shared pets chưa có.

### Vaccine, Reminder và Medical History

- **BR-VAC-07/US-06 AC-03 đạt về validation ngày:** client đặt `max=today` và từ chối ngày tương lai; POST API kiểm tra độc lập và cũng từ chối. Đây là hành vi đúng requirement hiện hành, không phải source defect. Nhánh warning cho future Vaccine Record trong response là unreachable/dead code nhưng không làm thay đổi hành vi nghiệp vụ đã chốt.
- BR-VAC-04/BR-REM-07 đã được nối ở state/UI hiện tại, nhưng chưa có automated/runtime test và còn phụ thuộc schedule rule access/data.
- Chống duplicate submit mới dựa vào disabled/loading state; chưa có synchronous re-entry guard hoặc idempotency key/database uniqueness cho double-click/request retry.
- US-07/BR-MED chưa có create Medical Record và attachment.
- US-08 AC hiển thị/sort/filter đã có; xem chi tiết record chưa có.
- API docs yêu cầu các list/detail endpoint riêng cho vaccine, medical record và reminder; source chỉ có GET aggregate history, POST vaccine và POST reminder.
- API docs dùng success envelope `data`; Route Handlers trả payload trực tiếp. Error `{ error }` nhìn chung tương thích.

### Data Dictionary/schema

- `database/schema.sql` hiện đã phản ánh target chính: `public.users` không có `password_hash`, có timestamps/FK/constraints/indexes, `vaccine_schedule_rules`, stored reminder status chỉ `Upcoming`/`Completed` và RLS target.
- Incremental migration không seed clinical schedule và có fallback null phù hợp BR-VAC-08, nhưng trạng thái live chưa được xác minh/apply trong audit này.
- `health_logs` và `pet_access` vẫn deny-all theo Phase 2; do đó chưa đáp ứng Caretaker stories, phù hợp checkpoint database hiện tại.

### Architecture Decision recheck

| Quyết định | Trạng thái | Đối chiếu implementation |
|---|---|---|
| ADL-005 — Onboarding species | **Partial** | Chỉ nhận `cat\|dog` và bảo toàn lựa chọn, nhưng confirmation helper vẫn dùng đích tạm `/dashboard?species=...` thay vì đi thẳng tới `/pets/new?species=...`. |
| ADL-010 — In-app Reminder | **Partial** | Có POST, list/filter/display-status và complete flow; chưa có general-create UI hoặc notification delivery. |
| DEC-08 — Vaccine Record `1 — 0..N` Reminder | **Partial** | Schema/API cho phép insert nhiều Reminder cùng `source_vaccine_record_id`; UI chỉ tạo trong post-save state và chưa có action tạo Reminder bổ sung từ Vaccine Record cũ. |
| ADL-012 — Medical Record độc lập Attachment | **Partial / application flow mostly missing** | Target schema có quan hệ `0..N`, constraints và RLS target; chưa có create/upload API, UI, Storage integration, giữ `record_id` sau lỗi hoặc retry attachment. |

## 9. Build, typecheck, lint và test

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Typecheck | Pass | `npx.cmd tsc --noEmit --incremental false`, exit 0; khoảng 16 giây |
| Lint | Pass | `npm.cmd run lint`, exit 0; khoảng 28 giây |
| Test | Không chạy | Không có script `test` hoặc test framework/spec/e2e trong repository/package scripts |
| Build | **Unverified Environment / Windows `.next` cache lock** | Lần build gặp `EPERM` liên quan cache lock trong `.next`; chưa có bằng chứng đây là source failure. Documentation-only recheck không chạy lại build hoặc sửa/xóa cache. |
| Dev server/UI localhost | Không chạy | Static inspection đủ để inventory; `next dev` cũng ghi `.next`, và authenticated smoke test cần tài khoản/database test |

Audit bắt đầu với thay đổi chưa commit tại `components/pets/PetMedicalHistory.tsx`; đây được xem là implementation hiện tại và không bị chỉnh sửa. Ngoài báo cáo này, audit không chủ động thay đổi file source/config/schema.

## 10. Năm việc nên làm tiếp theo

1. **Harden Vaccine → Reminder theo requirement hiện hành.** Giữ validation từ chối future `vaccine_date`; thêm test client/API cho hành vi reject, synchronous submit guard/idempotency và test lỗi Reminder không làm sai trạng thái Vaccine Record.
2. **Giải quyết access/data cho `vaccine_schedule_rules`.** Chọn read-only policy/RPC tin cậy cho lookup, nạp rule chỉ sau khi nguồn chuyên môn được duyệt, và test rõ fallback null.
3. **Triển khai Medical Record và record detail.** Thêm create/read detail, validation và attachment Storage với giới hạn type/5MB cùng RLS.
4. **Hoàn thiện phần Reminder còn lại.** Thêm tạo độc lập và action tạo Reminder bổ sung từ Vaccine Record cũ; giữ Owner-only ở checkpoint hiện tại.
5. **Thêm automated tests và runtime smoke environment.** Bao phủ Auth/safe redirect, RLS ownership, pet CRUD, vaccine calculation/future-date rejection, post-save và supplemental Reminder, medical-history sort/filter; sau đó chạy build và localhost e2e trên database test riêng.

## 11. Mức độ hoàn thành User Story trọng tâm

| User Story | Đánh giá |
|---|---|
| US-01 Đăng ký | Gần hoàn thành; thiếu runtime/e2e và redirect onboarding chưa khớp hoàn toàn |
| US-02 Đăng nhập | Hoàn thành phần email/password; Google OAuth **Not Implemented — Phase 1 checkpoint B**, thiếu Caretaker experience |
| US-03 Tạo pet | Gần hoàn thành; thiếu upload ảnh thật |
| US-04 Danh sách pet | Hoàn thành cho Owner; chưa có shared pets/Caretaker |
| US-05 Sửa pet | Gần hoàn thành cho Owner; thiếu success feedback |
| US-06 Vaccine | Một phần lớn đã có; insert, calculation/post-save Reminder UI và future-date rejection phù hợp requirement; còn thiếu automated/runtime verification và hardening |
| US-07 Medical Record | **Partial / application flow mostly missing**; mới đọc record nếu dữ liệu tồn tại, chưa có create/attachment flow theo ADL-012 |
| US-08 Medical History | Phần lớn đã có; thiếu record detail |
| US-10 Reminder | **Partial**; create-from-vaccine, list/filter và complete đã có; chưa có general create hoặc tạo Reminder bổ sung từ Vaccine Record cũ |
