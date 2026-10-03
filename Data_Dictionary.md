# MMinCare Data Dictionary

**Phiên bản:** 2.1  
**Nền tảng dữ liệu:** Supabase Auth, PostgreSQL, Storage và Row Level Security (RLS)  
**Phạm vi:** MVP hiện tại và các bảng Phase 2 đã được xác định  
**Ngôn ngữ dữ liệu:** tên bảng/cột bằng tiếng Anh; mô tả nghiệp vụ bằng tiếng Việt

---

## 1. Mục đích và nguồn đối chiếu

Tài liệu này là bản Data Dictionary chuẩn hóa cho MMinCare, được cập nhật để thống nhất với:

- `MMinCare_Business_Rules(1).md` — phiên bản 1.1.
- `MMinCare_API_Documentation.md` — phiên bản 1.1.
- User Story, MVP, ERD và các quyết định sản phẩm đã chốt.
- Mô hình xác thực và phân quyền của Supabase.

Khi có khác biệt giữa tài liệu cũ, thứ tự ưu tiên áp dụng là:

1. Business Rules phiên bản mới nhất.
2. API Documentation phiên bản mới nhất.
3. Quyết định sản phẩm đã chốt.
4. Data Dictionary này.
5. ERD và User Story cũ.

> **Điểm đã thay thế:** quy tắc cũ mô tả lịch tiêm dựa chủ yếu vào `dose_number` không còn được áp dụng. Backend phải xác định gợi ý lịch tiếp theo bằng **loài + tên vaccine + độ tuổi của thú cưng tại ngày tiêm**. `dose_number` chỉ là dữ liệu bổ sung và không phải tiêu chí chính.

---

## 2. Các quyết định dữ liệu đã chốt

1. Supabase Auth (`auth.users`) quản lý email, mật khẩu, Google OAuth và phiên đăng nhập.
2. Không lưu `password_hash` trong bảng `public.users`.
3. Mỗi tài khoản Auth có một hồ sơ ứng dụng tương ứng trong `public.users`.
4. `users.name` là bắt buộc:
   - Đăng ký email: mặc định lấy phần trước ký tự `@`.
   - Đăng nhập Google: ưu tiên tên Google; nếu thiếu thì lấy phần trước `@`.
   - Người dùng có thể sửa tên sau đó.
5. Việc chọn card Chó/Mèo ở Home chỉ truyền lựa chọn qua URL; không tự tạo bản ghi thú cưng.
6. Thú cưng bắt buộc có `name`, `species`, `gender`; các trường giống, ngày sinh và ảnh là tùy chọn.
7. Không có ảnh riêng thì giao diện dùng ảnh mặc định theo loài; URL ảnh mặc định không cần lưu lặp lại trong từng bản ghi.
8. Không lưu `next_due_date` trong `vaccine_records`.
9. Ngày nhắc được người dùng xác nhận mới lưu vào `reminders.due_date`.
10. `display_status = Overdue` là giá trị suy ra khi hiển thị, không lưu trong cơ sở dữ liệu.
11. Người chăm sóc được chia sẻ có thể xem và thêm bản ghi vaccine, khám bệnh, nhật ký sức khỏe; không được sửa/xóa bản ghi có sẵn, sửa reminder hoặc chia sẻ tiếp.
12. Tất cả quyền truy cập dữ liệu người dùng phải được thực thi bằng Supabase RLS, không chỉ kiểm tra ở giao diện.
13. MVP không hỗ trợ hard-delete tài khoản; quan hệ `public.users.user_id → auth.users.id` dùng `ON DELETE RESTRICT`/`NO ACTION` và không cascade xóa dữ liệu chăm sóc.
14. Email Confirmation được bật; hồ sơ `public.users` được tạo/đồng bộ từ `auth.users` bằng trigger hoặc cơ chế server tin cậy.
15. Client chỉ được cập nhật `users.name` và `users.phone_number`; email được đồng bộ từ Auth.

---

## 3. Quy ước chung

| Quy ước | Quy định |
|---|---|
| Khóa chính | `uuid`, sinh bằng `gen_random_uuid()` trừ `public.users.user_id` dùng ID từ `auth.users.id` |
| Khóa ngoại người dùng | Tham chiếu `auth.users(id)` hoặc `public.users(user_id)` tùy quan hệ |
| Thời gian | `timestamptz`, lưu theo UTC |
| Ngày nghiệp vụ | `date` |
| Chuỗi | `text`; chuẩn hóa bằng `trim`, email dùng chữ thường |
| Số thực | `numeric`, không dùng kiểu chuỗi cho cân nặng |
| Giá trị tùy chọn | Cho phép `NULL`; không dùng chuỗi rỗng thay cho `NULL` |
| Audit | Ưu tiên có `created_at`; bảng có chỉnh sửa hồ sơ dùng thêm `updated_at` |
| Xóa dữ liệu | MVP không hỗ trợ hard-delete tài khoản, thú cưng hoặc hồ sơ lịch sử; không cascade xóa pet và lịch sử chăm sóc. Tương lai dùng soft delete hoặc trạng thái inactive theo quy trình được kiểm soát |
| RLS | Bật trên mọi bảng thuộc `public` có dữ liệu người dùng |

### 3.1 Danh mục enum/check

Có thể triển khai bằng PostgreSQL enum hoặc cột `text` kèm `CHECK`. API phải trả đúng các giá trị sau:

| Nhóm | Giá trị hợp lệ |
|---|---|
| `pet_species` | `Dog`, `Cat` |
| `pet_gender` | `Male`, `Female`, `Unknown` |
| `reminder_type` | `Vaccine`, `Recheck`, `Medication`, `Other` |
| `reminder_status` | `Upcoming`, `Completed` |
| `pet_access_status` | `Pending`, `Active`, `Revoked` |
| `attachment_file_type` | `jpg`, `jpeg`, `png`, `pdf` |

`Expired` không cần lưu trong `pet_access.status`; trạng thái truy cập hết hạn được suy ra từ `valid_until < current_date`.

---

## 4. Sơ đồ bảng và phạm vi

| Bảng | Phạm vi | Mục đích |
|---|---|---|
| `auth.users` | Supabase managed | Danh tính, thông tin đăng nhập và OAuth |
| `public.users` | Core MVP | Hồ sơ ứng dụng của người dùng |
| `public.pets` | Core MVP | Hồ sơ thú cưng |
| `public.vaccine_schedule_rules` | Core MVP, backend | Bộ quy tắc gợi ý lịch vaccine |
| `public.vaccine_records` | Core MVP | Lịch sử tiêm vaccine |
| `public.reminders` | Core MVP | Nhắc lịch đã được người dùng xác nhận |
| `public.medical_records` | Core MVP | Hồ sơ khám/chữa bệnh |
| `public.medical_attachments` | Core MVP | Tệp đính kèm hồ sơ y tế |
| `public.health_logs` | Phase 2 | Nhật ký cân nặng, ăn uống và tình trạng |
| `public.pet_access` | Phase 2 | Chia sẻ quyền chăm sóc thú cưng |

---

## 5. Chi tiết bảng

### 5.1 `auth.users` — Supabase managed

Bảng do Supabase Auth quản lý. Ứng dụng không tự tạo schema, không ghi trực tiếp mật khẩu và không đưa bảng này vào API công khai.

| Thuộc tính liên quan | Ý nghĩa |
|---|---|
| `id` | UUID danh tính, được dùng làm `public.users.user_id` |
| `email` | Email đăng nhập do Supabase quản lý |
| `encrypted_password` | Do Supabase quản lý; tuyệt đối không sao chép sang `public` |
| `raw_user_meta_data` | Có thể chứa tên/avatar từ Google OAuth trước khi đồng bộ hồ sơ ứng dụng |

Quy tắc mật khẩu tối thiểu 8 ký tự và có ít nhất một chữ số được cấu hình/kiểm tra tại tầng Auth và validation của ứng dụng.

---

### 5.2 `public.users` — Hồ sơ người dùng

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `user_id` | `uuid` | Không | PK, FK → `auth.users.id`, `ON DELETE RESTRICT` hoặc mặc định `NO ACTION` | ID hồ sơ trùng với ID Supabase Auth; không hard-delete trong MVP |
| `email` | `text` | Không | UNIQUE, CHECK `email = lower(trim(email))`, email hợp lệ | Email dùng trong ứng dụng; chỉ đồng bộ từ Auth |
| `name` | `text` | Không | `CHECK (length(trim(name)) > 0)` | Tên hiển thị bắt buộc |
| `phone_number` | `text` | Có | Định dạng số điện thoại nếu nhập | Số điện thoại tùy chọn |
| `created_at` | `timestamptz` | Không | Default `now()` | Thời điểm tạo hồ sơ |
| `updated_at` | `timestamptz` | Không | Default `now()` | Thời điểm cập nhật gần nhất |

### Quy tắc tạo `name`

- Email/password: lấy phần trước `@` làm mặc định.
- Google OAuth: ưu tiên `full_name`/`name` từ metadata; nếu không có thì lấy phần trước `@`.
- Giá trị mặc định vẫn phải được ghi vào `name`, vì cột này không cho phép `NULL`.

### Đồng bộ và quyền cập nhật hồ sơ

- Profile được tạo từ `auth.users` bằng trigger hoặc cơ chế server tin cậy; không cho client tự tạo profile tùy ý.
- `phone_number` được phép `NULL`.
- Client chỉ được cập nhật `name` và `phone_number`; không được cập nhật `user_id`, `email` hoặc `created_at`.
- Khi email Auth thay đổi và đã được xác minh, cơ chế server/trigger đồng bộ `public.users.email = lower(trim(auth.users.email))`.
- `updated_at` phải được gán `now()` bằng trigger `BEFORE UPDATE`; không chỉ dựa vào giá trị default lúc insert.
- Không dùng service-role key trong client. Service role, nếu cần cho tác vụ quản trị tin cậy, chỉ tồn tại phía server.

### Không tồn tại trong bảng

- `password_hash`, access token, refresh token hoặc OAuth secret.
- Các giá trị này thuộc Supabase Auth/session.

---

### 5.3 `public.pets` — Hồ sơ thú cưng

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `pet_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID thú cưng |
| `owner_id` | `uuid` | Không | FK → `public.users.user_id` | Chủ sở hữu duy nhất của thú cưng |
| `name` | `text` | Không | Không được rỗng | Tên thú cưng |
| `species` | `pet_species` | Không | `Dog` hoặc `Cat` | Loài thú cưng |
| `gender` | `pet_gender` | Không | `Male`, `Female`, `Unknown` | Giới tính |
| `breed` | `text` | Có | — | Giống thú cưng |
| `date_of_birth` | `date` | Có | Không lớn hơn ngày hiện tại khi nhập chính thức | Ngày sinh; có thể chưa biết |
| `picture_url` | `text` | Có | URL/path Storage hợp lệ | Ảnh riêng của thú cưng; ảnh mới là object path private |
| `creation_key` | `text` | Có | Unique theo `owner_id` khi khác NULL | Khóa idempotency cho cùng một lần tạo |
| `creation_payload_hash` | `text` | Có | Hash payload tạo tương ứng | Phát hiện retry cùng khóa nhưng khác dữ liệu |
| `created_at` | `timestamptz` | Không | Default `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | Default `now()` | Thời điểm cập nhật |

### Lưu ý

- Một người dùng có thể có không giới hạn số thú cưng.
- Query `/register?species=cat|dog` và `/pets/new?species=...` chỉ là trạng thái điều hướng; không phải cột riêng.
- Chỉ chấp nhận `cat` hoặc `dog`; giá trị khác bị từ chối. Khi tạo pet, ánh xạ `cat → Cat` và `dog → Dog` trước khi ghi `pets.species`.
- Lựa chọn hợp lệ phải được bảo toàn qua Email Confirmation để callback chuyển đến `/pets/new?species=cat|dog` sau khi có session.
- Khi `picture_url IS NULL`, frontend chọn avatar mặc định theo `species`.
- Ảnh mới dùng bucket private `pet-photos`; URL signed không được lưu vào database. URL cũ/legacy vẫn được giữ.
- `creation_key` được scope theo Owner và unique để retry POST không tạo Pet trùng.
- Chỉ owner được sửa hồ sơ thú cưng. Caretaker chỉ được xem khi quyền chia sẻ còn hiệu lực.

---

### 5.4 `public.vaccine_schedule_rules` — Quy tắc lịch vaccine

Bảng nội bộ để backend tính gợi ý lịch tiếp theo. Client thông thường không được ghi hoặc đọc trực tiếp toàn bộ bảng này.

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `schedule_rule_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID quy tắc |
| `species` | `pet_species` | Không | `Dog` hoặc `Cat` | Loài áp dụng |
| `vaccine_name` | `text` | Không | Không rỗng; chuẩn hóa khi so khớp | Tên vaccine/nhóm vaccine |
| `min_age_days` | `integer` | Không | `>= 0` | Tuổi tối thiểu tại ngày tiêm |
| `max_age_days` | `integer` | Có | `>= min_age_days` | Tuổi tối đa; `NULL` nghĩa là không giới hạn |
| `standard_interval_days` | `integer` | Không | `> 0` | Khoảng cách chuẩn đến lần tiếp theo |
| `is_active` | `boolean` | Không | Default `true` | Quy tắc còn được sử dụng hay không |
| `note` | `text` | Có | — | Ghi chú quản trị |
| `created_at` | `timestamptz` | Không | Default `now()` | Thời điểm tạo |
| `updated_at` | `timestamptz` | Không | Default `now()` | Thời điểm cập nhật |

### Thuật toán gợi ý

1. Lấy `pets.species` và `pets.date_of_birth`.
2. Tính `age_in_days = vaccine_date - date_of_birth`.
3. Tìm quy tắc đang hoạt động khớp `species`, tên vaccine đã chuẩn hóa và khoảng tuổi.
4. Trả `suggested_next_date = vaccine_date + standard_interval_days`.
5. Nếu thiếu ngày sinh hoặc không có quy tắc khớp, trả `null`.
6. Người dùng có thể sửa ngày gợi ý trước khi xác nhận tạo Reminder.

`dose_number` không tham gia như tiêu chí chính trong thuật toán này.

---

### 5.5 `public.vaccine_records` — Lịch sử tiêm vaccine

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `vaccine_record_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID bản ghi tiêm |
| `pet_id` | `uuid` | Không | FK → `public.pets.pet_id` | Thú cưng được tiêm |
| `created_by` | `uuid` | Không | FK → `public.users.user_id` | Owner hoặc caretaker đã tạo bản ghi |
| `vaccine_name` | `text` | Không | Không rỗng | Tên vaccine |
| `vaccine_date` | `date` | Không | Cho phép ngày tương lai kèm cảnh báo mềm | Ngày tiêm/được lên kế hoạch |
| `dose_number` | `integer` | Có | `> 0` nếu nhập | Số mũi tùy chọn, phục vụ mô tả |
| `clinic_name` | `text` | Có | — | Cơ sở tiêm |
| `note` | `text` | Có | — | Ghi chú |
| `created_at` | `timestamptz` | Không | Default `now()` | Thời điểm tạo bản ghi |

### Không tồn tại trong bảng

- `next_due_date` hoặc `suggested_next_date`.
- Ngày nhắc chính thức thuộc `public.reminders.due_date`.
- Không có API sửa/xóa Vaccine Record trong MVP.

---

### 5.6 `public.reminders` — Nhắc lịch

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `reminder_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID nhắc lịch |
| `user_id` | `uuid` | Không | FK → `public.users.user_id` | Owner chịu trách nhiệm với reminder |
| `pet_id` | `uuid` | Không | FK → `public.pets.pet_id` | Thú cưng liên quan |
| `source_vaccine_record_id` | `uuid` | Có | FK → `public.vaccine_records.vaccine_record_id` | Nguồn vaccine nếu reminder được tạo từ gợi ý |
| `due_date` | `date` | Không | — | Ngày nhắc do owner xác nhận; cho phép ngày quá khứ |
| `type` | `reminder_type` | Không | Enum hợp lệ | Loại nhắc |
| `status` | `reminder_status` | Không | Default `Upcoming` | Trạng thái lưu trữ |
| `note` | `text` | Có | — | Ghi chú |
| `completed_at` | `timestamptz` | Có | Có khi `status = Completed` | Thời điểm hoàn thành |
| `created_at` | `timestamptz` | Không | Default `now()` | Thời điểm tạo |

### Quy tắc

- Chỉ tạo khi owner xác nhận, kể cả khi backend đã trả ngày gợi ý.
- Cho phép nhiều reminder trùng ngày hoặc cùng loại.
- `user_id` phải là `owner_id` của `pet_id`.
- Nếu có `source_vaccine_record_id`, vaccine record phải thuộc cùng `pet_id`.
- Caretaker chỉ được xem reminder của pet được chia sẻ; không được tạo/sửa/hoàn thành/xóa.
- Chỉ owner được đánh dấu hoàn thành.

### Trạng thái hiển thị suy ra

```text
display_status =
  Completed, nếu status = Completed
  Overdue,   nếu status = Upcoming và due_date < current_date
  Upcoming,  trong các trường hợp còn lại
```

Không tạo cột `display_status` hoặc lưu giá trị `Overdue`.

---

### 5.7 `public.medical_records` — Hồ sơ khám bệnh

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `record_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID hồ sơ y tế |
| `pet_id` | `uuid` | Không | FK → `public.pets.pet_id` | Thú cưng liên quan |
| `created_by` | `uuid` | Không | FK → `public.users.user_id` | Owner hoặc caretaker tạo hồ sơ |
| `visit_date` | `date` | Không | — | Ngày khám bắt buộc |
| `diagnosis` | `text` | Có | — | Chẩn đoán |
| `symptoms` | `text` | Có | — | Triệu chứng |
| `medication` | `text` | Có | — | Thuốc/điều trị |
| `clinic_name` | `text` | Có | — | Tên cơ sở khám |
| `note` | `text` | Có | — | Ghi chú |
| `created_at` | `timestamptz` | Không | Default `now()` | Thời điểm tạo |

Không có API sửa/xóa Medical Record trong MVP. Lịch sử được sắp xếp mới nhất trước và có thể lọc theo loại/ngày.

---

### 5.8 `public.medical_attachments` — Tệp hồ sơ y tế

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `attachment_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID tệp |
| `record_id` | `uuid` | Không | FK → `public.medical_records.record_id` | Hồ sơ y tế chứa tệp |
| `uploaded_by` | `uuid` | Không | FK → `public.users.user_id` | Người tải lên, phục vụ audit |
| `file_url` | `text` | Không | Storage path/URL hợp lệ | Đường dẫn tệp |
| `file_type` | `attachment_file_type` | Không | `jpg`, `jpeg`, `png`, `pdf` | Loại tệp |
| `file_size` | `bigint` | Không | `> 0` và `<= 5 * 1024 * 1024` | Kích thước byte, tối đa 5 MB |
| `uploaded_at` | `timestamptz` | Không | Default `now()` | Thời điểm tải lên |

Storage policy phải đồng bộ với RLS của Medical Record: owner và caretaker còn quyền có thể xem/tải lên; không có thao tác sửa/xóa trong MVP.

---

### 5.9 `public.health_logs` — Nhật ký sức khỏe (Phase 2)

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `health_log_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID nhật ký |
| `pet_id` | `uuid` | Không | FK → `public.pets.pet_id` | Thú cưng liên quan |
| `created_by` | `uuid` | Không | FK → `public.users.user_id` | Owner hoặc caretaker tạo |
| `weight` | `numeric(6,2)` | Có | `> 0` nếu nhập | Cân nặng, đơn vị kg |
| `food_amount` | `text` | Có | — | Lượng thức ăn, giữ cả số và đơn vị người dùng nhập |
| `food_type` | `text` | Có | — | Loại thức ăn |
| `status` | `text` | Có | — | Trạng thái/tình trạng tổng quát |
| `note` | `text` | Có | — | Ghi chú |
| `logged_at` | `timestamptz` | Không | Default `now()` | Thời điểm ghi nhận |

Phải có ít nhất một trong `weight`, `food_amount`, `food_type`, `status`, `note`. Mỗi lần ghi nhận tạo bản ghi mới; caretaker không được sửa/xóa bản ghi đã có.

---

### 5.10 `public.pet_access` — Chia sẻ người chăm sóc (Phase 2)

| Cột | Kiểu | Null | Khóa/Ràng buộc | Mô tả |
|---|---|---:|---|---|
| `access_id` | `uuid` | Không | PK, default `gen_random_uuid()` | ID quyền truy cập |
| `pet_id` | `uuid` | Không | FK → `public.pets.pet_id` | Thú cưng được chia sẻ |
| `granted_by` | `uuid` | Không | FK → `public.users.user_id` | Owner cấp quyền |
| `caretaker_email` | `text` | Không | Lowercase/trim, email hợp lệ | Email được mời; dùng cả khi tài khoản chưa tồn tại |
| `caretaker_id` | `uuid` | Có | FK → `public.users.user_id` | `NULL` khi lời mời còn Pending |
| `valid_until` | `date` | Không | Không sớm hơn ngày cấp khi tạo | Ngày hết hiệu lực bắt buộc |
| `status` | `pet_access_status` | Không | `Pending`, `Active`, `Revoked` | Trạng thái lưu trữ |
| `granted_at` | `timestamptz` | Không | Default `now()` | Thời điểm cấp/mời |
| `activated_at` | `timestamptz` | Có | — | Thời điểm lời mời kích hoạt |
| `revoked_at` | `timestamptz` | Có | — | Thời điểm thu hồi |

### Quy tắc lời mời

- Email đã có tài khoản: gán `caretaker_id` và tạo quyền `Active`.
- Email chưa có tài khoản: `caretaker_id = NULL`, trạng thái `Pending`; khi đăng ký đúng email thì liên kết và chuyển `Active` nếu vẫn còn hạn.
- Owner không được chia sẻ cho chính mình.
- Chỉ owner được cấp hoặc thu hồi quyền.
- Caretaker không được chia sẻ tiếp.
- Thu hồi có hiệu lực ngay lập tức.
- Quyền hiệu lực khi `status = Active`, `caretaker_id` khớp người dùng hiện tại và `valid_until >= current_date`.

---

## 6. Dữ liệu suy ra hoặc chỉ tồn tại tạm thời

Các giá trị sau không được tạo thành cột lưu trữ độc lập:

| Giá trị | Nguồn tính/giữ | Lý do không lưu |
|---|---|---|
| `password_hash` | Supabase Auth | Tránh trùng lặp và rủi ro bảo mật |
| `selected_species` ở Home | Query `species=cat|dog` | Chỉ là trạng thái onboarding trước khi tạo pet |
| Avatar mặc định | Frontend chọn theo `pets.species` | Không lưu cùng URL mặc định cho mọi pet |
| Tuổi thú cưng | `current_date - date_of_birth` hoặc tại `vaccine_date` | Thay đổi theo thời gian/ngữ cảnh |
| `suggested_next_date` | Backend + `vaccine_schedule_rules` | Chỉ là gợi ý, chưa phải dữ liệu đã xác nhận |
| `next_due_date` | Không sử dụng | Ngày nhắc chính thức nằm trong `reminders.due_date` |
| `display_status`/`Overdue` | `reminders.status` + `due_date` | Là trạng thái trình bày |
| `pet_access` hết hạn | `valid_until < current_date` | Có thể suy ra; không cần trạng thái lưu `Expired` |
| Dashboard metrics | Truy vấn tổng hợp | Tránh dữ liệu tổng hợp bị lệch nguồn |

---

## 7. Quan hệ dữ liệu

| Quan hệ | Cardinality |
|---|---|
| `auth.users` — `public.users` | 1 — 1 |
| `users` — `pets` (owner) | 1 — N |
| `pets` — `vaccine_records` | 1 — N |
| `pets` — `medical_records` | 1 — N |
| `medical_records` — `medical_attachments` | 1 — N |
| `pets` — `reminders` | 1 — N |
| `vaccine_records` — `reminders` | 1 — 0..N, liên kết tùy chọn |
| `pets` — `health_logs` | 1 — N |
| `pets` — `pet_access` | 1 — N |
| `users` — bản ghi qua `created_by` | 1 — N |

---

## 8. Ma trận quyền RLS tối thiểu

| Bảng | Owner | Caretaker Active, còn hạn | Người khác |
|---|---|---|---|
| `users` | Xem hồ sơ của chính mình; chỉ sửa `name`, `phone_number` | Chỉ hồ sơ của chính mình; chỉ sửa `name`, `phone_number` | Không |
| `pets` | Xem, tạo, sửa pet của mình | Chỉ xem pet được chia sẻ | Không |
| `vaccine_records` | Xem, thêm | Xem, thêm | Không |
| `medical_records` | Xem, thêm | Xem, thêm | Không |
| `medical_attachments` | Xem, thêm | Xem, thêm | Không |
| `reminders` | Xem, tạo, sửa trạng thái | Chỉ xem | Không |
| `health_logs` | Xem, thêm | Xem, thêm | Không |
| `pet_access` | Xem, cấp, thu hồi trên pet của mình | Xem quyền của chính mình | Không |
| `vaccine_schedule_rules` | Không truy cập trực tiếp | Không truy cập trực tiếp | Không; backend/service role quản lý |

Với Vaccine Record, Medical Record và Health Log, MVP/Business Rules không cho owner hoặc caretaker sửa/xóa bản ghi lịch sử đã tạo. Nếu cần hiệu chỉnh sau này, nên dùng cơ chế audit/correction riêng thay vì ghi đè lịch sử.

---

## 9. Chỉ mục và ràng buộc đề xuất

| Bảng | Chỉ mục/ràng buộc |
|---|---|
| `users` | CHECK `email = lower(trim(email))`; một UNIQUE constraint trên `email`; không tạo expression unique index trùng chức năng; trigger `BEFORE UPDATE` cập nhật `updated_at` |
| `pets` | INDEX `(owner_id, created_at DESC)` |
| `vaccine_schedule_rules` | INDEX `(species, lower(vaccine_name), is_active)`; tránh khoảng tuổi chồng lấn cho cùng rule |
| `vaccine_records` | INDEX `(pet_id, vaccine_date DESC)`; INDEX `created_by` |
| `medical_records` | INDEX `(pet_id, visit_date DESC)`; INDEX `created_by` |
| `medical_attachments` | INDEX `record_id` |
| `reminders` | INDEX `(user_id, due_date, status)`; INDEX `(pet_id, due_date)` |
| `health_logs` | INDEX `(pet_id, logged_at DESC)` |
| `pet_access` | INDEX `(caretaker_id, status, valid_until)`; INDEX `(pet_id, status)`; hạn chế quyền active trùng cho cùng pet/caretaker |

Không đặt UNIQUE trên Reminder theo ngày/loại vì Business Rules cho phép trùng.

---

## 10. Supabase Storage

Đề xuất tách bucket hoặc prefix:

| Nhóm | Nội dung | Quyền |
|---|---|---|
| `pet-photos` | Ảnh đại diện thú cưng JPG/PNG/WebP, tối đa 5 MB | Private; Owner của Pet upload/đọc/xóa theo prefix user |
| `medical-attachments` | JPG/PNG/PDF tối đa 5 MB | Owner/caretaker active được đọc và thêm theo quyền Medical Record |

Không dùng public bucket cho hồ sơ y tế. Storage policies phải kiểm tra quyền dựa trên `pet_id`/`record_id`, tương thích với RLS bảng dữ liệu.

---

## 11. Thay đổi so với Data Dictionary cũ

| Nội dung cũ | Bản 2.0 |
|---|---|
| ID dạng `VARCHAR(36)` | Dùng PostgreSQL `uuid` |
| `users.password_hash` | Loại bỏ; Supabase Auth quản lý |
| `DATETIME` | Dùng `timestamptz` |
| Chưa có bảng quy tắc lịch tiêm | Thêm `vaccine_schedule_rules` cho backend |
| Có thể hiểu ngày tiêm kế tiếp thuộc Vaccine Record | Khẳng định không lưu; Reminder giữ `due_date` |
| Gợi ý lịch dựa vào số mũi | Dựa vào loài + tên vaccine + độ tuổi; số mũi tùy chọn |
| `pet_access.caretaker_id` bắt buộc | Cho phép `NULL` để hỗ trợ email chưa đăng ký |
| Pet Access không lưu email lời mời | Thêm `caretaker_email` bắt buộc |
| Thiếu audit lời mời/thu hồi | Thêm `activated_at`, `revoked_at` |
| Reminder chỉ có status đơn giản | Làm rõ status lưu trữ và `Overdue` suy ra |
| Health Log không bắt buộc nội dung | Thêm CHECK phải có ít nhất một dữ liệu sức khỏe |
| Attachment thiếu người tải lên | Thêm `uploaded_by` để audit và áp dụng RLS |
| Chưa mô tả RLS | Bổ sung ma trận quyền theo Owner/Caretaker |

---

## 12. Checklist triển khai Supabase

- [ ] Dùng Supabase Auth cho email/password; bật Email Confirmation.
- [ ] Triển khai Google OAuth ở checkpoint riêng; trước đó không hiển thị nút Google như chức năng khả dụng.
- [ ] Tạo trigger hoặc server callback để đồng bộ `auth.users` → `public.users` và sinh `name` mặc định.
- [ ] Dùng FK `public.users.user_id → auth.users.id` với `ON DELETE RESTRICT`/`NO ACTION`; không hard-delete tài khoản trong MVP.
- [ ] Tạo trigger `BEFORE UPDATE` cho `public.users.updated_at`.
- [ ] Giới hạn quyền update client trên `public.users` ở `name`, `phone_number`.
- [ ] Dùng `@supabase/ssr`, tách browser/server client, refresh cookie/session và bảo vệ route phía server.
- [ ] Dùng chung `/auth/callback` cho Email Confirmation và Google OAuth; exchange code và chỉ redirect tới internal path đã kiểm tra.
- [ ] Không đưa service-role key vào client hoặc biến môi trường `NEXT_PUBLIC_*`.
- [ ] Không tạo cột `password_hash` trong schema public.
- [ ] Bật RLS trên tất cả bảng dữ liệu người dùng.
- [ ] Tạo policy Owner/Caretaker đúng ma trận quyền.
- [ ] Tạo và seed `vaccine_schedule_rules` từ nguồn quy tắc nghiệp vụ đã được duyệt.
- [ ] Tính gợi ý lịch vaccine ở backend; không tin dữ liệu tuổi/interval do client gửi.
- [ ] Chỉ tạo Reminder sau khi owner xác nhận ngày.
- [ ] Áp dụng Storage policy và giới hạn loại/kích thước tệp.
- [ ] Kiểm tra constraint liên bảng: owner của Reminder, source vaccine cùng pet, người cấp quyền là owner.

## notification_events (Notification Phase 1)

| Column | Type | Rule |
|---|---|---|
| notification_event_id | uuid | PK, generated |
| user_id | uuid | Owner, FK users |
| reminder_id | uuid | FK reminders, ON DELETE CASCADE |
| event_type | text | `due_soon` hoặc `overdue` |
| due_date_snapshot | date | Ngày hẹn tại lúc tạo lịch |
| scheduled_for | timestamptz | D-2/D+2 lúc 08:00 Asia/Ho_Chi_Minh |
| read_at | timestamptz nullable | Chỉ trường client được phép cập nhật |
| cancelled_at | timestamptz nullable | Hủy khi đổi ngày/hoàn thành |
| created_at, updated_at | timestamptz | Audit timestamps |

Partial unique index bảo đảm tối đa một event đang hoạt động cho `(reminder_id, event_type, due_date_snapshot)` nhưng vẫn giữ lịch sử đã hủy.

Notification query dùng `overdue` thay `due_soon` sau D+2; event tương lai, đã hủy hoặc Reminder Completed không phải notification hiện hành.
- [ ] Kiểm thử RLS bằng ít nhất ba tài khoản: owner, caretaker và người không có quyền.

---

**Kết luận:** Schema này phân tách rõ dữ liệu xác thực, dữ liệu nghiệp vụ được lưu, dữ liệu suy ra và dữ liệu chỉ dùng trong luồng giao diện. Đây là bản Data Dictionary nên được dùng làm nguồn chuẩn khi tạo migration Supabase, TypeScript types và triển khai API MMinCare.
