# MMinCare — Data Dictionary

**Phiên bản:** 3.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## 1. Nguồn và phạm vi

Cột/khóa dưới đây đối chiếu `database/schema.sql` cùng migration mới hơn `20261009180809_health_logs_post_idempotency.sql` (thêm hai cột Health Log và index). Schema snapshot chưa chứa hai cột đó; snapshot không thay migration source of truth. Đây là tài liệu đồng bộ, không apply/replay SQL hoặc thay dữ liệu.

`auth.users` do Supabase Auth quản lý: `id` là PK; email và metadata phục vụ Auth, không đọc/ghi trực tiếp từ client. `public.users` là hồ sơ ứng dụng. Nullability/default/constraint trong bảng là định nghĩa DDL; validation bổ sung ở API được nêu sau.

## 2. Enum

| Kiểu | Giá trị lưu |
|---|---|
| pet_species | Dog, Cat |
| pet_gender | Male, Female, Unknown |
| reminder_type | Vaccine, Recheck, Medication, Other |
| reminder_status | Upcoming, Completed — Overdue là trạng thái hiển thị suy ra |
| attachment_file_type | jpg, jpeg, png, pdf |
| pet_access_status | Pending, Active, Revoked — reserved Phase 2 |

## 3. Bảng và cột

### public.users

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `user_id` | `uuid primary key references auth.users (id) on delete restrict`; NOT NULL (PK) | ID hồ sơ, liên kết Auth; ID người nhận/Owner tùy bảng. |
| `email` | `text not null unique`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `name` | `text not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `phone_number` | `text`; NULL được phép | Số điện thoại hồ sơ tùy chọn, không phải Auth identifier. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.pets

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `pet_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `owner_id` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | Owner của Pet, không nhận từ client. |
| `name` | `text not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `species` | `public.pet_species not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `gender` | `public.pet_gender not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `breed` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `date_of_birth` | `date`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `picture_url` | `text`; NULL được phép | Legacy URL hoặc path private pet-photos; không đồng nghĩa bucket public. |
| `creation_key` | `text`; NULL được phép | Key nội bộ chống lặp POST; null cho dữ liệu trước migration. |
| `creation_payload_hash` | `text`; NULL được phép | Hash payload chuẩn hóa nội bộ; không sửa từ client. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.vaccine_schedule_rules

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `schedule_rule_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `species` | `public.pet_species not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `vaccine_name` | `text not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `min_age_days` | `integer not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `max_age_days` | `integer`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `standard_interval_days` | `integer not null`; NOT NULL | Quy tắc được duyệt mới dùng gợi ý; không lấy fixture để định interval. |
| `is_active` | `boolean not null default true`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `note` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.vaccine_records

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `vaccine_record_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `created_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | Người tạo; không sửa Health Log. |
| `vaccine_name` | `text not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `vaccine_date` | `date not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `dose_number` | `integer`; NULL được phép | Số mũi, integer dương tùy chọn. |
| `clinic_name` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `note` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.medical_records

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `record_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `created_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | Người tạo; không sửa Health Log. |
| `visit_date` | `date not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `diagnosis` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `symptoms` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `medication` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `clinic_name` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `note` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.medical_attachments

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `attachment_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `record_id` | `uuid not null references public.medical_records (record_id) on delete cascade`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `uploaded_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `file_url` | `text not null`; NOT NULL | Path object trong bucket private medical-record-attachments. |
| `file_type` | `public.attachment_file_type not null`; NOT NULL | Extension enum jpg/jpeg/png/pdf, không phải MIME string. |
| `file_size` | `bigint not null`; NOT NULL | Bytes; >0 và ≤5,242,880. |
| `uploaded_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.reminders

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `reminder_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `user_id` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | ID hồ sơ, liên kết Auth; ID người nhận/Owner tùy bảng. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `source_vaccine_record_id` | `uuid references public.vaccine_records (vaccine_record_id) on delete set null`; NULL được phép | Nguồn tùy chọn; SET NULL khi Vaccine bị xóa. |
| `source_medical_record_id` | `uuid references public.medical_records (record_id) on delete set null`; NULL được phép | Nguồn tùy chọn; SET NULL khi Medical bị xóa. |
| `due_date` | `date not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `type` | `public.reminder_type not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `status` | `public.reminder_status not null default 'Upcoming'`; NOT NULL | Enum theo bảng, hoặc text quan sát ở Health Log. |
| `note` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `completed_at` | `timestamptz`; NULL được phép | Timestamp hoàn tất Reminder; trạng thái Upcoming không có completion hợp lệ. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.notification_events

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `notification_event_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `user_id` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | ID hồ sơ, liên kết Auth; ID người nhận/Owner tùy bảng. |
| `reminder_id` | `uuid not null references public.reminders (reminder_id) on delete cascade`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `event_type` | `text not null check (event_type in ('due_soon', 'overdue'))`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `due_date_snapshot` | `date not null`; NOT NULL | Ngày Reminder tại lần lên lịch event, dùng loại bỏ event cũ. |
| `scheduled_for` | `timestamptz not null`; NOT NULL | Thời điểm event được lên lịch. |
| `read_at` | `timestamptz`; NULL được phép | Null = chưa đọc; timestamp canonical khi đã đọc. |
| `cancelled_at` | `timestamptz`; NULL được phép | Event không còn hiệu lực. |
| `created_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `updated_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

### public.health_logs

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `health_log_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `created_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | Người tạo; không sửa Health Log. |
| `weight` | `numeric(6, 2)`; NULL được phép | numeric(6,2), kg, null hoặc >0; API giới hạn9999.99. |
| `food_amount` | `text`; NULL được phép | Text mô tả lượng ăn, không phải số chuẩn hóa dùng tính dinh dưỡng. |
| `food_type` | `text`; NULL được phép | Text loại/tên thức ăn. |
| `status` | `text`; NULL được phép | Enum theo bảng, hoặc text quan sát ở Health Log. |
| `note` | `text`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `recorded_on` | `date not null default ((now() at time zone 'Asia/Ho_Chi_Minh')::date)`; NOT NULL | Ngày ghi nhận nghiệp vụ; không tương lai theo Việt Nam. |
| `logged_at` | `timestamptz not null default now()`; NOT NULL | Timestamp nhập ban đầu bất biến khi sửa Health Log. |
| `creation_key` | `text`; NULL được phép | Key nội bộ chống lặp POST; null cho dữ liệu trước migration. |
| `creation_payload_hash` | `text`; NULL được phép | Hash payload chuẩn hóa nội bộ; không sửa từ client. |

### public.pet_access — schema reserved, chưa runtime

| Cột | Kiểu / nullability / default / khóa | Ý nghĩa |
|---|---|---|
| `access_id` | `uuid primary key default gen_random_uuid()`; NOT NULL (PK) | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `pet_id` | `uuid not null references public.pets (pet_id) on delete restrict`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `granted_by` | `uuid not null references public.users (user_id) on delete restrict`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `caretaker_email` | `text not null`; NOT NULL | Email normalized dùng thiết kế mời Phase 2; chưa luồng production. |
| `caretaker_id` | `uuid references public.users (user_id) on delete restrict`; NULL được phép | ID người được mời sau activation; schema reserved, chưa runtime. |
| `valid_until` | `date not null`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `status` | `public.pet_access_status not null`; NOT NULL | Enum theo bảng, hoặc text quan sát ở Health Log. |
| `granted_at` | `timestamptz not null default now()`; NOT NULL | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `activated_at` | `timestamptz`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |
| `revoked_at` | `timestamptz`; NULL được phép | Trường nghiệp vụ/metadata theo tên; xem API và Business Rules. |

## 4. Quan hệ và xử lý xóa

| Parent → child | Cardinality / FK action |
|---|---|
| auth.users → public.users | 1 → 0..1 hồ sơ; users.user_id FK RESTRICT |
| users → pets | 1 → 0..N; pets.owner_id NOT NULL, RESTRICT |
| pets → vaccine_records/medical_records/health_logs/reminders | 1 → 0..N; Pet FK NOT NULL, RESTRICT |
| users → bản ghi tạo/nhắc/đính kèm | 1 → 0..N qua created_by/user_id/uploaded_by, RESTRICT |
| medical_records → medical_attachments | 1 → 0..N; record_id NOT NULL, CASCADE metadata |
| vaccine_records/medical_records → reminders | N Reminders có 0..1 nguồn mỗi loại; nullable FK SET NULL, tổng số nguồn ≤1 |
| reminders → notification_events | 1 → 0..N; FK NOT NULL, CASCADE |
| vaccine_schedule_rules | Tra cứu species/vaccine/age; không FK sang từng Vaccine Record, không interval được tự bịa |
| pet_access | Pet/User FK và lifecycle mời reserved; không mở quyền Caretaker từ việc bảng tồn tại |

Việc xóa Medical metadata không tự xóa object Storage: API thực hiện cleanup riêng và trả warning/pending nếu lỗi. Reminder mất nguồn vẫn được giữ, không cascade xóa. Không có xóa Pet/tài khoản trong API hiện tại.

## 5. Constraints, indexes và quyền

- users: email normalized/format/unique, name không rỗng; profile sync từ Auth.
- pets: name không rỗng, date_of_birth không tương lai; `pets_owner_creation_key_uidx` unique partial `(owner_id,creation_key)` khi key khác null.
- health_logs: weight null hoặc dương, recorded_on không tương lai ở Việt Nam; ít nhất một weight/text nghiệp vụ. `health_logs_owner_pet_creation_key_uidx` unique partial `(created_by,pet_id,creation_key)` khi key khác null. Latest order recorded_on DESC →logged_at DESC →health_log_id DESC; index phục vụ Pet/date/time, không đồng nghĩa tie-breaker đã là mọi index column.
- reminders: tối đa một FK nguồn, nguồn cùng Pet được API kiểm tra; completion consistency và Owner-only edit/complete enforced qua migration, grants/RLS/API.
- notification_events: event_type chỉ due_soon/overdue, index active-schedule chống event trùng và Owner/schedule/unread hỗ trợ truy vấn; snapshot/cancel giữ event cũ không phải event hiện hành.
- Owner-only RLS ở bảng dữ liệu; grants tối thiểu không thay thế ownership. Health Log UPDATE chỉ cột nghiệp vụ/date, identity/creator/logged_at không được client sửa; DELETE Owner cho phép. `rls_auto_enable()` không executable bởi anon/authenticated.
- `vaccine_schedule_rules`: có bảng/RLS không có nghĩa người dùng đã đọc được hoặc có dataset. CR-08 quyền/rule data chưa hoàn tất; không sửa grant trong đợt tài liệu này.

## 6. Storage (không phải bảng public PetPhoto)

| Bucket | Quyền và file | Truy cập runtime |
|---|---|---|
| pet-photos | Private từ migration đầu;5 MiB; image/jpeg,image/png,image/webp; Owner folder auth.uid(), SELECT/INSERT/DELETE | GET /api/pets/{petId}?photo=1 kiểm tra Owner rồi stream; tên object duy nhất, không cần grant UPDATE/upsert |
| medical-record-attachments | Private; file limit5 MiB; JPEG/PNG/PDF theo route | Owner authorization rồi signed URL60s; metadata medical_attachments lưu path |

`storage.objects` là object metadata do Supabase Storage quản lý; không thêm một bảng public chứa binary. Preview/blob/dataURL không phải permanent production URL. Legacy picture_url khác managed path không tự chuyển thành object Storage.

## 7. Dữ liệu demo tách biệt

Mẫu ban đầu:3 Pet,31 Health Logs (Meo 15/Min 14/Sushi 2),4 Vaccine,2 Medical,7 Reminders,3 notification hiện hành (2 unread,1 read). Ngày neo Việt Nam lúc bắt đầu/reset. Meo/Min ảnh demo được cung cấp, Sushi picture_url null →fallback. Các nhóm trạng thái không phân bố bằng nhau hoặc bắt buộc đủ mỗi kỳ.

`demo/dataset.template.json` dùng day offsets; export JSON/CSV là snapshot để đọc, không import production. Demo `version,anchor_day,read_notifications`, snapshot notification IDs và sessionStorage là dữ liệu adapter, không cột/UUID hợp lệ để seed database. Owner UUID mẫu không có Auth account thật. File do người xem chọn được giữ browser-local, không upload Storage. Không chứa secret, password hoặc vaccine rule interval.

## 8. Migration references và giới hạn kiểm chứng

| Version đồng bộ | Nội dung |
|---|---|
| 20260926193909 | notification_events_phase1 |
| 20261005081930 | pet_photos_storage |
| 20261005082042 | pet_photos_private_and_pet_idempotency |
| 20261007113449 | owner_edit_delete_health_logs |
| 20261009180809 | health_logs_post_idempotency |

Đây là các version được ghi nhận trong lịch sử triển khai trước đó, không phải toàn bộ migration history và không phải một audit production mới. Không repair hoặc apply lại chỉ để cập nhật tài liệu. Presence của policy/index không là bằng chứng Owner A/B runtime PASS.

### Phase 2.1 access boundary

`pet_access` grants per-Pet read-only Caretaker access after verified-email
acceptance. Pending invitations expose only the Pet-name snapshot and expiry.
Active access is required for Pet/Vaccine/Medical reads; Health Log, Reminder,
statistics, Notification Center and private assets remain unavailable.

| Version | Date | Change |
|---|---|---|
| 3.0 | 2026-10-11 | Sửa đúng tên/cột/FK thực tế, thêm Notification/rules/idempotency/Storage và ranh giới demo. |
| 2.5 | 2026-09-22 | Phiên bản cũ được thay trong lần đồng bộ; bản này nâng lên3.0, thuộc cùng release đồng bộ2026-10-11. |

