# MMinCare — API Documentation

**Scope:** MVP  
**Version:** 1.2  
**Prepared for:** BA/SA Portfolio  
**Business Rule reference:** `MMinCare_Business_Rules_v1.1.md`

## 1. API Overview

| Item | Decision |
|---|---|
| Base URL | `/api/v1` |
| Authentication | Bearer token/session do authentication layer cấp |
| Request/Response | JSON; `multipart/form-data` cho upload file |
| ID format | UUID biểu diễn dưới dạng string |
| Main actors | Owner, Caretaker |
| Owner scope | Quản lý pet do mình sở hữu và dữ liệu liên quan |
| Caretaker scope | View + Add only trên pet được chia sẻ và quyền còn hiệu lực |
| Vaccine suggestion | Backend suy ra từ loài + loại vaccine + độ tuổi tại ngày tiêm |
| Reminder stored status | `Upcoming`, `Completed` |
| Reminder display status | `Upcoming`, `Overdue`, `Completed` — do API suy ra |

### 1.1. Standard success response

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

### 1.2. Standard error response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  }
}
```

### 1.3. HTTP status codes

| HTTP Code | Meaning | Use case |
|---:|---|---|
| 200 | OK | Đọc/cập nhật thành công |
| 201 | Created | Tạo resource thành công |
| 302 | Redirect | Điều hướng trong Email Confirmation hoặc Google OAuth flow |
| 400 | Bad Request | Request sai cấu trúc hoặc thiếu dữ liệu |
| 401 | Unauthorized | Chưa đăng nhập hoặc phiên hết hiệu lực |
| 403 | Forbidden | Không có quyền truy cập resource |
| 404 | Not Found | Không tìm thấy resource |
| 409 | Conflict | Email đã tồn tại hoặc xung đột nghiệp vụ |
| 422 | Validation Error | Request đúng cấu trúc nhưng vi phạm Business Rule |

## 2. Entity & API Mapping

| Entity | API chính | Ghi chú |
|---|---|---|
| User/Profile | `/auth/*` | Email/password do authentication layer quản lý; hồ sơ luôn có `name` |
| Pet | `/pets`, `/pets/{pet_id}` | Thuộc Owner qua `owner_id` |
| VaccineRecord | `/pets/{pet_id}/vaccines` | Không lưu `next_due_date` |
| MedicalRecord | `/pets/{pet_id}/medical-records` | Có thể có nhiều attachment |
| MedicalAttachment | `/medical-records/{record_id}/attachments` | File tối đa 5MB |
| Reminder | `/pets/{pet_id}/reminders` | Có thể liên kết Vaccine Record nguồn |
| HealthLog | `/pets/{pet_id}/health-logs` | Mỗi lần nhập tạo log mới |
| PetAccess | `/pets/{pet_id}/access`, `/shared-pets` | Quyền theo pet và thời hạn |

## 3. Endpoint Index

| Group | Method | Endpoint | Purpose |
|---|---|---|---|
| Auth | POST | `/auth/register` | Đăng ký bằng email/password |
| Auth | POST | `/auth/login` | Đăng nhập bằng email/password |
| Auth | POST | `/auth/google` | Khởi tạo Google OAuth |
| Auth | GET | `/auth/callback` | Callback chung cho Email Confirmation và Google OAuth |
| Auth | POST | `/auth/logout` | Đăng xuất |
| Auth | GET | `/auth/me` | Lấy user hiện tại |
| Pet | GET | `/pets` | Danh sách pet có quyền truy cập |
| Pet | POST | `/pets` | Tạo pet |
| Pet | GET | `/pets/{pet_id}` | Xem pet detail |
| Pet | PUT | `/pets/{pet_id}` | Owner sửa pet |
| Vaccine | GET | `/pets/{pet_id}/vaccines` | Danh sách Vaccine Record |
| Vaccine | POST | `/pets/{pet_id}/vaccines` | Thêm Vaccine Record và nhận ngày gợi ý |
| Vaccine | GET | `/vaccines/{vaccine_record_id}` | Xem Vaccine Record detail |
| Medical | GET | `/pets/{pet_id}/medical-records` | Danh sách Medical Record |
| Medical | POST | `/pets/{pet_id}/medical-records` | Thêm Medical Record |
| Medical | GET | `/medical-records/{record_id}` | Xem Medical Record detail |
| Attachment | POST | `/medical-records/{record_id}/attachments` | Upload attachment |
| Attachment | GET | `/medical-records/{record_id}/attachments` | Xem attachments |
| Reminder | GET | `/pets/{pet_id}/reminders` | Xem Reminder theo pet |
| Reminder | POST | `/pets/{pet_id}/reminders` | Owner tạo Reminder |
| Reminder | PATCH | `/reminders/{reminder_id}/complete` | Owner đánh dấu hoàn thành |
| Reminder | PATCH | `/reminders/{reminder_id}` | Owner sửa ngày hẹn/ghi chú của Reminder Upcoming |
| Notification | GET | `/notifications` | Owner xem event đã đến lịch, chưa hủy |
| Notification | PATCH | `/notifications/{notification_id}/read` | Owner đánh dấu event đã đọc |

`GET /notifications` chỉ trả notification hiện hành: event chưa hủy, `scheduled_for <= now`, Reminder còn `Upcoming`; từ D+2 `overdue` thay thế `due_soon`, tối đa một event cho mỗi Reminder. Endpoint read chỉ đánh dấu event hiện hành và idempotent.

Web Notification Center dùng hai endpoint này trong shared header. Chuông hiển thị số event chưa đọc; panel có loading, retry, empty state và danh sách theo `event_type`. Chọn event chưa đọc gọi `PATCH /notifications/{notification_id}/read` một lần rồi điều hướng đến `/reminders?highlight={reminder_id}`; event đã đọc điều hướng trực tiếp. Không có thao tác đánh dấu tất cả, xóa notification hoặc push/email trong phạm vi web UI.
| HealthLog | GET | `/pets/{pet_id}/health-logs` | Xem Health Log |
| HealthLog | POST | `/pets/{pet_id}/health-logs` | Thêm Health Log |
| HealthLog | PATCH | `/pets/{pet_id}/health-logs/{health_log_id}` | Owner sửa trường nghiệp vụ Health Log |
| HealthLog | DELETE | `/pets/{pet_id}/health-logs/{health_log_id}` | Owner xóa Health Log sau xác nhận |
| Dashboard | GET | `/dashboard` | Tổng quan nhiều pet |
| Dashboard | GET | `/pets/{pet_id}/dashboard` | Tổng quan một pet |
| Access | POST | `/pets/{pet_id}/access` | Chia sẻ pet |
| Access | GET | `/pets/{pet_id}/access` | Danh sách quyền đã cấp |
| Access | PATCH | `/pet-access/{access_id}/revoke` | Thu hồi quyền |
| Access | GET | `/shared-pets` | Pet được chia sẻ cho Caretaker |

## 4. Authentication APIs

### 4.1. POST `/auth/register`

Đăng ký bằng email/password. Frontend không gửi `name`; backend tự tạo theo BR-AUTH-07.

**Actor:** Guest  
**Scope:** Must Have  
**Business Rules:** BR-AUTH-01, BR-AUTH-02, BR-AUTH-03, BR-AUTH-04, BR-AUTH-07

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| email | string | Yes | Email đăng ký |
| password | string | Yes | Tối thiểu 8 ký tự và có ít nhất 1 chữ số |
| phone_number | string | No | Số điện thoại |

Backend processing:

1. Trim và lowercase email.
2. Kiểm tra email unique.
3. Tạo tài khoản.
4. Tạo `name` từ phần trước `@`.
5. Trigger/cơ chế server tạo hồ sơ `public.users`; `phone_number` có thể là `null`.
6. Vì Email Confirmation được bật, `signUp` có thể chưa trả session. Khi đó trả trạng thái yêu cầu người dùng kiểm tra email, không redirect vào route được bảo vệ.

Success `201` data:

| Field | Type | Description |
|---|---|---|
| user_id | string | UUID user |
| email | string | Email đã chuẩn hóa |
| name | string | Tên do hệ thống tạo |
| session | object/null | `null` khi đang chờ xác nhận email |
| email_confirmation_required | boolean | `true` khi người dùng phải kiểm tra email |
| next | string | Internal path hợp lệ cần tiếp tục sau xác nhận, ví dụ `/pets/new?species=cat` |

Chỉ chuyển đến `/pets/new?species=cat|dog` khi callback đã exchange code thành công và session hợp lệ. `species` chỉ nhận `cat` hoặc `dog`; giá trị khác bị từ chối. Khi tạo pet, backend ánh xạ `cat → Cat` và `dog → Dog`.

### 4.2. POST `/auth/login`

**Actor:** Owner/Caretaker  
**Scope:** Must Have  
**Business Rules:** BR-AUTH-03, BR-AUTH-05, BR-AUTH-06

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| email | string | Yes | Email đăng nhập |
| password | string | Yes | Mật khẩu |

Success `200` data:

| Field | Type | Description |
|---|---|---|
| user | object | User profile |
| redirect_to | string | Luôn là `/dashboard` trong MVP |

Đăng nhập thất bại chỉ trả: `Email hoặc mật khẩu không đúng`.

### 4.3. POST `/auth/google` — checkpoint sau

Khởi tạo Google OAuth.

**Actor:** Guest  
**Scope:** Business Rule đã chốt, triển khai ở checkpoint riêng sau email/password Auth  
**Business Rules:** BR-AUTH-08

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| redirect_url | string | No | URL quay lại sau khi xác thực |

Success `200` data:

| Field | Type | Description |
|---|---|---|
| authorization_url | string | URL để frontend chuyển người dùng tới Google |

Cho đến khi endpoint này được triển khai hoàn chỉnh, UI không được hiển thị nút Google như một chức năng khả dụng.

### 4.4. GET `/auth/callback`

Callback dùng chung cho Email Confirmation và Google OAuth.

**Business Rules:** BR-AUTH-03, BR-AUTH-07, BR-AUTH-08

Query:

| Field | Type | Required | Description |
|---|---|:---:|---|
| code | string | Yes | Authorization code do Supabase Auth cấp |
| next | string | No | Internal path cần redirect sau callback |

Backend xử lý:

1. Dùng Supabase server client exchange `code` để tạo session.
2. Xác nhận session hợp lệ và tạo hoặc truy xuất hồ sơ `public.users`.
3. Với Google OAuth, chỉ dùng email đã được provider xác minh và áp dụng BR-AUTH-07 cho `name`.
4. Chỉ chấp nhận `next` là internal path bắt đầu bằng đúng một `/`, không chứa origin/protocol hoặc dạng `//host`; nếu không hợp lệ dùng `/dashboard`.
5. Với Email Confirmation từ onboarding, chỉ cho phép `/pets/new?species=cat` hoặc `/pets/new?species=dog`.
6. Redirect an toàn sau khi session đã tồn tại.

### 4.5. POST `/auth/logout`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-AUTH-06

Success `200`: kết thúc phiên hiện tại.

Route dành cho người đã đăng nhập phải kiểm tra session phía server. Cookie/session được refresh theo mô hình `@supabase/ssr`; không dùng service-role key ở client.

### 4.6. GET `/auth/me`

**Actor:** Owner/Caretaker

Success `200` data:

| Field | Type | Description |
|---|---|---|
| user_id | string | UUID user |
| email | string | Email |
| name | string | Tên hiển thị |
| phone_number | string/null | Số điện thoại |

## 5. Pet APIs

### 5.1. GET `/pets`

Owner thấy pet mình sở hữu; Caretaker thấy pet được chia sẻ và quyền còn hiệu lực.

**Business Rules:** BR-PET-05, BR-SHARE-04, BR-SHARE-05

Success data: `pets[]` gồm `pet_id`, `name`, `species`, `date_of_birth`, `age`, `picture_url`, `access_type`.

### 5.2. POST `/pets`

**Actor:** Owner  
**Scope:** Must Have  
**Business Rules:** BR-PET-01, BR-PET-02, BR-PET-03, BR-PET-04, BR-PET-07

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| name | string | Yes | Tên pet |
| species | enum | Yes | `Dog`, `Cat` |
| gender | enum | Yes | `Male`, `Female`, `Unknown` |
| breed | string | No | Giống |
| date_of_birth | date | No | Ngày sinh |
| image | file | No | JPG/JPEG/PNG/WebP, tối đa 5 MB; upload multipart |
| idempotency_key | string | Yes | Khóa retry cho cùng một thao tác tạo, scope theo Owner |

Success `201` data: Pet vừa tạo. `picture_url` là object path ổn định, không phải signed URL.

`POST` cùng `idempotency_key` và cùng payload trả lại cùng Pet; cùng khóa nhưng payload khác trả `409`.

### 5.3. GET `/pets/{pet_id}`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-PET-05, BR-SHARE-04, BR-SHARE-05

Success data:

| Field | Type | Description |
|---|---|---|
| pet | object | Pet detail |
| access | object | Vai trò và quyền hiện tại |

### 5.4. PUT `/pets/{pet_id}`

**Actor:** Owner  
**Business Rules:** BR-PET-01, BR-PET-02, BR-PET-06, BR-PET-07

Request giống POST `/pets`, thêm `remove_picture=true` để bỏ ảnh. Success data là Pet sau cập nhật; cleanup ảnh cũ thất bại trả `picture_cleanup: "pending"`.

### 5.5. GET `/api/pets/{pet_id}?photo=1`

Owner đã xác thực có thể đọc ảnh private của Pet mình. Server kiểm tra ownership rồi stream object từ bucket `pet-photos`; không phát hành URL public hoặc lưu signed URL vào database. Pet khác/anonymous nhận `401/404`.

Không cung cấp Pet Delete trong MVP.

## 6. Vaccine Record APIs

### 6.1. GET `/pets/{pet_id}/vaccines`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-01, BR-MEDHIST-05

Success data: `vaccines[]`, sắp xếp `vaccine_date` giảm dần.

### 6.2. POST `/pets/{pet_id}/vaccines`

Tạo Vaccine Record và trả ngày tiêm tiếp theo nếu tính được.

**Actor:** Owner/Caretaker  
**Business Rules:** BR-VAC-01 đến BR-VAC-08, BR-MEDHIST-02, BR-MEDHIST-05

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| vaccine_name | string | Yes | Tên/loại vaccine |
| vaccine_date | date | Yes | Ngày tiêm |
| dose_number | integer | No | Số liều, chỉ là dữ liệu mô tả |
| clinic_name | string | No | Tên phòng khám |
| note | string | No | Ghi chú |

Frontend không gửi `species`, `date_of_birth` hoặc tuổi.

Backend processing:

1. Kiểm tra quyền với Pet.
2. Lưu Vaccine Record và `created_by`.
3. Lấy `Pet.species` và `Pet.date_of_birth`.
4. Tính `age_at_vaccination` tại `vaccine_date`.
5. Tìm `standard_interval` theo loài + vaccine + độ tuổi.
6. Tính `suggested_next_due_date = vaccine_date + standard_interval`.
7. Không persist ngày gợi ý vào Vaccine Record.

Success `201` data:

| Field | Type | Description |
|---|---|---|
| vaccine_record | object | Vaccine Record vừa tạo |
| suggested_next_due_date | date/null | Ngày gợi ý hoặc null nếu không đủ cơ sở |
| warning | string/null | Cảnh báo mềm nếu ngày tiêm ở tương lai |

Người dùng có thể chỉnh ngày gợi ý trước khi gọi POST Reminder.

### 6.3. GET `/vaccines/{vaccine_record_id}`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-05

Success data: Vaccine Record detail.

Không cung cấp API sửa/xóa Vaccine Record trong MVP.

## 7. Medical Record APIs

### 7.1. GET `/pets/{pet_id}/medical-records`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-01, BR-MEDHIST-05

Success data: `medical_records[]`, sắp xếp `visit_date` giảm dần.

### 7.2. POST `/pets/{pet_id}/medical-records`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MED-01, BR-MED-02, BR-MEDHIST-02, BR-MEDHIST-05

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| visit_date | date | Yes | Ngày khám |
| clinic_name | string | No | Tên phòng khám |
| symptoms | text | No | Triệu chứng |
| diagnosis | text | No | Chẩn đoán |
| medication | text | No | Thuốc kê |
| note | string | No | Ghi chú |

Success `201` data: Medical Record vừa tạo, gồm `created_by`.

### 7.3. GET `/medical-records/{record_id}`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-05

Success data gồm Medical Record detail và `attachments[]`.

### 7.4. POST `/medical-records/{record_id}/attachments`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MED-03, BR-MEDHIST-05

Request `multipart/form-data`:

| Field | Type | Required | Description |
|---|---|:---:|---|
| file | file | Yes | jpg/png/pdf, tối đa 5MB |

Success `201` data: `attachment_id`, `file_url`, `file_type`, `file_size`, `uploaded_at`.

### 7.5. GET `/medical-records/{record_id}/attachments`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-MEDHIST-05

Success data: `attachments[]`.

Không cung cấp API sửa/xóa Medical Record trong MVP.

## 8. Reminder APIs

### 8.1. GET `/pets/{pet_id}/reminders`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-REM-05, BR-REM-06, BR-REM-09

Success data: `reminders[]` gồm:

| Field | Type | Description |
|---|---|---|
| reminder_id | string | UUID |
| due_date | date | Ngày hẹn |
| type | enum | Vaccine, Recheck, Medication, Other |
| status | enum | Trạng thái lưu trữ: Upcoming/Completed |
| display_status | enum | Upcoming/Overdue/Completed |
| is_overdue | boolean | Quá hạn và chưa hoàn thành |
| note | string/null | Ghi chú |
| source_vaccine_record_id | string/null | Vaccine Record nguồn |

### 8.2. POST `/pets/{pet_id}/reminders`

Owner tạo Reminder thủ công hoặc xác nhận ngày gợi ý từ Vaccine Record.

**Actor:** Owner  
**Business Rules:** BR-REM-01, BR-REM-02, BR-REM-03, BR-REM-04, BR-REM-07, BR-VAC-04

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| type | enum | Yes | Vaccine, Recheck, Medication, Other |
| due_date | date | Yes | Ngày người dùng xác nhận |
| note | string | No | Ghi chú |
| source_vaccine_record_id | string | No | Vaccine Record nguồn |

Success `201` data: Reminder vừa tạo với `status = Upcoming`.

### 8.3. PATCH `/reminders/{reminder_id}/complete`

**Actor:** Owner  
**Business Rules:** BR-REM-08

Success `200` data: Reminder với `status = Completed` và `display_status = Completed`.

## 9. Health Log APIs

Các endpoint trong mục này thuộc Should Have / Phase 2.

### 9.1. GET `/pets/{pet_id}/health-logs`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-HLOG-01, BR-HLOG-05

Success data: `health_logs[]`, sắp xếp `logged_at` giảm dần.

### 9.2. POST `/pets/{pet_id}/health-logs`

**Actor:** Owner/Caretaker  
**Business Rules:** BR-HLOG-01, BR-HLOG-02, BR-HLOG-05

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| recorded_on | date | Yes | Ngày nhật ký, không ở tương lai theo `Asia/Ho_Chi_Minh` |
| weight | decimal | No | Cân nặng kg |
| food_amount | string | No | Lượng thức ăn |
| food_type | string | No | Loại thức ăn |
| status | string | No | Trạng thái sức khỏe |
| note | string | No | Ghi chú |

Ít nhất một trường phải có giá trị. Success `201` trả Health Log vừa tạo. API không tự cảnh báo cân nặng bất thường vì chưa có rule xác định ngưỡng.

### 9.3. PATCH `/pets/{pet_id}/health-logs/{health_log_id}`

**Actor:** Owner của Pet

Chỉ nhận các trường `recorded_on`, `weight`, `food_amount`, `food_type`, `status` và `note`. Các trường định danh `health_log_id`, `pet_id`, `created_by` và `logged_at` không được sửa. Có thể gửi `null` để xóa giá trị của trường tùy chọn, nhưng bản ghi sau cập nhật vẫn phải có ít nhất một trường nghiệp vụ. `recorded_on` không được ở tương lai theo múi giờ `Asia/Ho_Chi_Minh`.

Success `200` trả `{ "health_log": ... }` là bản ghi chuẩn sau khi cập nhật. Owner khác, Caretaker và Anonymous không được truy cập; resource ngoài phạm vi trả `404` theo nguyên tắc bảo vệ riêng tư.

### 9.4. DELETE `/pets/{pet_id}/health-logs/{health_log_id}`

**Actor:** Owner của Pet

Xóa vĩnh viễn một Health Log sau khi UI xác nhận. Success `200` trả `{ "deleted_health_log_id": "..." }`. Request lặp hoặc resource ngoài phạm vi trả `404`; không thay đổi các bảng liên quan.

## 10. Dashboard APIs

Route UI `/dashboard` là landing/pet-list cơ bản thuộc Core MVP và là đích sau login. Các API tổng hợp/phân tích trong mục này vẫn thuộc Should Have / Phase 2.

### 10.1. GET `/dashboard`

**Actor:** Owner  
**Business Rules:** BR-HLOG-03, BR-HLOG-04, BR-REM-09

Query:

| Field | Type | Required | Description |
|---|---|:---:|---|
| period | enum | No | `week`, `month`; mặc định `week` |
| pet_id | string | No | Lọc theo pet |

Success data:

| Field | Type | Description |
|---|---|---|
| total_pets | integer | Tổng số pet |
| upcoming_reminders | array | Reminder chưa đến hạn |
| overdue_reminders | array | Reminder quá hạn chưa hoàn thành |
| latest_medical_records | array | Lần khám gần nhất |
| weight_trends | array/null | Dữ liệu cân nặng hoặc null nếu chưa đủ dữ liệu |

### 10.2. GET `/pets/{pet_id}/dashboard`

**Actor:** Owner  
**Business Rules:** BR-HLOG-03, BR-HLOG-04, BR-REM-09

Query: `period=week|month`.

Success data: Pet summary, upcoming/overdue reminders, latest medical record và weight trend.

## 11. Pet Access APIs

Các endpoint trong mục này thuộc Should Have / Phase 2.

### 11.1. POST `/pets/{pet_id}/access`

**Actor:** Owner  
**Business Rules:** BR-SHARE-01, BR-SHARE-02, BR-SHARE-04, BR-SHARE-05, BR-SHARE-06, BR-SHARE-08

Request:

| Field | Type | Required | Description |
|---|---|:---:|---|
| caretaker_email | string | Yes | Email Caretaker |
| valid_until | date | Yes | Ngày hết hiệu lực |

Success `201` data: `access_id`, `status`, `caretaker_email`, `valid_until`.

### 11.2. GET `/pets/{pet_id}/access`

**Actor:** Owner  
**Business Rules:** BR-SHARE-01, BR-SHARE-02

Success data: `access_list[]`.

### 11.3. PATCH `/pet-access/{access_id}/revoke`

**Actor:** Owner  
**Business Rules:** BR-SHARE-01, BR-SHARE-07

Success data: access với `status = Revoked`.

### 11.4. GET `/shared-pets`

**Actor:** Caretaker  
**Business Rules:** BR-PET-05, BR-SHARE-04, BR-SHARE-05

Success data: danh sách pet được chia sẻ và quyền còn hiệu lực.

## 12. Key Backend Logic

| Logic | Rule | Implementation requirement |
|---|---|---|
| Email normalization | BR-AUTH-03 | Trim + lowercase tại mọi điểm so khớp email |
| Name generation | BR-AUTH-07 | Email local-part hoặc Google name; luôn có fallback |
| Google OAuth | BR-AUTH-08 | Chỉ tin email đã được provider xác minh |
| Email confirmation | BR-AUTH-09/10 | Không giả định `signUp` luôn có session; callback exchange code trước khi redirect |
| Safe redirect | BR-AUTH-10/13 | Chỉ chấp nhận internal `next`; bảo toàn duy nhất `species=cat|dog` qua onboarding |
| User profile write | BR-AUTH-14 | Client chỉ sửa `name`, `phone_number`; email do Auth đồng bộ |
| Pet authorization | BR-PET-05, BR-SHARE-04/05 | Kiểm tra Owner hoặc PetAccess active, chưa hết hạn |
| Vaccine suggestion | BR-VAC-03/05/06/08 | Loài + vaccine + độ tuổi; vaccine_date là mốc cộng chu kỳ |
| Reminder creation | BR-REM-03/07 | Chỉ persist sau khi Owner xác nhận |
| Reminder display status | BR-REM-09 | Derive từ stored status, due_date và current date |
| Health Log validation | BR-HLOG-02 | Reject nếu tất cả trường nghiệp vụ đều trống |
| Attachment validation | BR-MED-03 | Reject nếu file > 5MB hoặc sai định dạng |
| Caretaker model | CC-03 | View + Add only, không sửa/xóa/hoàn thành Reminder |

## 13. Development Notes

- Không lưu `next_due_date` trong Vaccine Record.
- Frontend không gửi lại loài hoặc tuổi khi tạo Vaccine Record.
- Nếu thiếu ngày sinh hoặc không có chu kỳ phù hợp, trả ngày gợi ý là null.
- `dose_number` không phải tiêu chí chính để chọn chu kỳ trong rule hiện tại.
- Reminder chỉ được tạo sau khi Owner xác nhận ngày.
- Database lưu Reminder status là Upcoming/Completed; API suy ra Overdue.
- Không đưa Pet Delete vào MVP.
- Health Log có PATCH/DELETE Owner-only theo mục 9.3–9.4; Vaccine Record và Medical Record vẫn chưa có API sửa/xóa trong MVP.
- `/dashboard` landing/pet-list cơ bản thuộc MVP; Dashboard phân tích nâng cao, Health Log và Pet Access là Should Have / Phase 2.
- MVP không hỗ trợ hard-delete tài khoản; không cascade xóa pet hoặc lịch sử chăm sóc.
- Hạ tầng Auth dự kiến dùng `@supabase/ssr`, browser/server client tách riêng, cookie/session refresh và route protection.
- Không dùng service-role key ở client.
