# MMinCare — Business Rules Document

**Scope:** MVP  
**Version:** 1.2  
**Source:** 14 User Stories, Acceptance Criteria, Data Dictionary và các quyết định sản phẩm đã chốt

## 1. Mục đích

Tài liệu này là nguồn tham chiếu nghiệp vụ thống nhất cho MMinCare. Business Rules được dùng để:

- Thiết kế giao diện, API và database.
- Triển khai validation và authorization.
- Viết test case và RTM.
- Kiểm soát sự nhất quán giữa User Story, API, ERD và source code.

## 2. Quy ước

Mã rule có cấu trúc `BR-[NHÓM]-[STT]`, ví dụ `BR-VAC-03`.

| Rule Type | Ý nghĩa |
|---|---|
| Validation | Điều kiện hợp lệ của dữ liệu đầu vào |
| Authorization | Quyền truy cập hoặc hành động theo vai trò |
| Process | Trình tự và trạng thái của luồng nghiệp vụ |
| Data Integrity | Tính nhất quán giữa các entity |
| Computation / Derivation | Giá trị do hệ thống tính hoặc suy ra |
| Constraint | Giới hạn số lượng, dung lượng hoặc phạm vi |
| Security | Quy tắc bảo mật |
| Data Definition | Dữ liệu bắt buộc, tùy chọn hoặc tập giá trị |
| Data Standardization | Chuẩn hóa dữ liệu trước khi lưu/so khớp |
| Display | Quy tắc hiển thị |
| Audit | Lưu dấu người tạo hoặc hành động |
| Default Value | Giá trị mặc định |

## 3. Danh mục Business Rules

### 3.1. Tài khoản và xác thực (AUTH)

Nguồn: US-01, US-02 và quyết định xác thực đã chốt.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-AUTH-01 | Email phải là duy nhất trong toàn hệ thống. | Data Integrity | US-01 |
| BR-AUTH-02 | Mật khẩu phải có tối thiểu 8 ký tự và chứa ít nhất 1 chữ số. | Validation | US-01 |
| BR-AUTH-03 | Email được trim khoảng trắng đầu/cuối và chuẩn hóa về chữ thường trước khi validate, lưu hoặc so khớp. | Data Standardization | US-01 |
| BR-AUTH-04 | Hệ thống chặn submit khi còn trường bắt buộc trống hoặc dữ liệu sai định dạng; lỗi được hiển thị tại trường liên quan. | Validation | US-01, US-03 |
| BR-AUTH-05 | Khi đăng nhập thất bại, hệ thống chỉ trả thông báo chung “Email hoặc mật khẩu không đúng”, không tiết lộ thông tin nào sai. | Security | US-02 |
| BR-AUTH-06 | Phiên đăng nhập được duy trì cho đến khi người dùng chủ động đăng xuất hoặc phiên hết hiệu lực theo cơ chế bảo mật của hệ thống. | Process / Security | US-02 |
| BR-AUTH-07 | `name` là dữ liệu bắt buộc của hồ sơ nhưng không bắt buộc người dùng nhập trên form đăng ký. Với email/password, hệ thống tạo `name` từ phần trước ký tự `@`. Với Google OAuth, hệ thống ưu tiên tên do Google cung cấp; nếu không có thì dùng phần trước `@` của email. | Computation / Default Value | US-01, US-02; Product Decision |
| BR-AUTH-08 | Hệ thống cho phép đăng nhập bằng Google OAuth. Sau khi Google xác thực thành công, hệ thống tạo hoặc truy xuất hồ sơ theo email đã được provider xác minh và áp dụng BR-AUTH-07 để xác định `name`. | Process / Security | US-02; Product Decision |
| BR-AUTH-09 | Supabase Email Confirmation được bật. Sau đăng ký, nếu chưa có session, hệ thống yêu cầu người dùng kiểm tra email; chỉ điều hướng vào khu vực đã xác thực sau khi callback hoàn tất và session hợp lệ. | Process / Security | Product Decision; ADL-002 |
| BR-AUTH-10 | `/auth/callback` dùng chung cho Email Confirmation và Google OAuth: exchange authorization code lấy session, chỉ chấp nhận `next` là internal path hợp lệ và dùng fallback an toàn nếu `next` không hợp lệ. | Process / Security | Product Decision; ADL-003 |
| BR-AUTH-11 | MVP không hỗ trợ hard-delete tài khoản. Không cascade xóa pet hoặc lịch sử chăm sóc; nhu cầu vô hiệu hóa/xóa về sau dùng soft delete hoặc trạng thái inactive. | Data Integrity / Security | Product Decision; ADL-001 |
| BR-AUTH-12 | Sau đăng nhập email/password thành công, hệ thống điều hướng đến `/dashboard`. Trong MVP đây là landing/pet-list cơ bản; dashboard phân tích nâng cao vẫn thuộc Phase 2. | Process / Display | Product Decision; ADL-004 |
| BR-AUTH-13 | Lựa chọn onboarding chỉ chấp nhận `species=cat|dog`, phải được bảo toàn qua Email Confirmation và ánh xạ `cat → Cat`, `dog → Dog` khi tạo pet. Giá trị khác bị từ chối và không được ghi database. | Validation / Process | Product Decision; ADL-005 |
| BR-AUTH-14 | Hồ sơ `public.users` được tạo/đồng bộ từ `auth.users` bằng cơ chế tin cậy phía server hoặc trigger. Client chỉ được sửa `name` và `phone_number`; không được sửa `user_id`, `email`, `created_at`. | Authorization / Data Integrity | Product Decision; ADL-007 |

### 3.2. Hồ sơ thú cưng (PET)

Nguồn: US-03, US-04, US-05.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-PET-01 | Trường bắt buộc khi tạo hồ sơ thú cưng gồm tên, loài và giới tính. Loài chỉ nhận Dog hoặc Cat. | Validation | US-03 |
| BR-PET-02 | Giống, ngày sinh và ảnh đại diện là các trường tùy chọn. | Data Definition | US-03 |
| BR-PET-03 | Một tài khoản được tạo không giới hạn số hồ sơ thú cưng trong MVP. | Constraint | US-03 |
| BR-PET-04 | Nếu không có ảnh đại diện, hệ thống hiển thị avatar mặc định theo loài chó/mèo. | Computation / Default Value | US-03 AC-03 |
| BR-PET-05 | Owner chỉ thấy pet do mình sở hữu; Caretaker chỉ thấy pet được chia sẻ riêng cho mình và quyền vẫn còn hiệu lực. | Authorization | US-04, US-14 |
| BR-PET-06 | Chỉ Owner được chỉnh sửa thông tin hồ sơ cơ bản của pet; Caretaker không có quyền chỉnh sửa. | Authorization | US-05 |
| BR-PET-07 | Ảnh đại diện pet chỉ hỗ trợ định dạng jpg/png và phải nằm trong giới hạn dung lượng hệ thống cho phép. | Constraint | US-03 |

### 3.3. Tiêm phòng (VAC)

Nguồn: US-06.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-VAC-01 | Trường bắt buộc khi thêm Vaccine Record gồm tên vaccine và ngày tiêm. | Validation | US-06 |
| BR-VAC-02 | Số liều, tên phòng khám và ghi chú là các trường tùy chọn. | Data Definition | US-06 |
| BR-VAC-03 | Chu kỳ tiêm chuẩn được xác định dựa trên ba yếu tố: loài, loại vaccine và độ tuổi của pet tại ngày tiêm. | Computation / Derivation | US-06 |
| BR-VAC-04 | Ngày tiêm tiếp theo do hệ thống gợi ý có thể được người dùng chỉnh sửa trước khi xác nhận tạo Reminder. | Process | US-06 |
| BR-VAC-05 | Vaccine Record không lưu `next_due_date`; ngày nhắc tiêm tiếp theo được quản lý tại Reminder. | Data Integrity | US-06 |
| BR-VAC-06 | Backend lấy `species` và `date_of_birth` từ Pet, tính độ tuổi tại `vaccine_date`, chọn chu kỳ chuẩn theo `species + vaccine_name + age_at_vaccination`, sau đó tính `suggested_next_due_date = vaccine_date + standard_interval`. `dose_number` là thông tin tùy chọn, không phải tiêu chí chính để chọn chu kỳ. | Computation / Derivation | US-06 |
| BR-VAC-07 | Ngày tiêm trong tương lai vẫn được phép lưu nhưng hệ thống phải trả cảnh báo mềm “Ngày tiêm chưa đến”. | Validation / Soft Warning | US-06 AC-03 |
| BR-VAC-08 | Nếu Pet chưa có `date_of_birth` hoặc không tìm thấy chu kỳ phù hợp, backend không tự đoán và trả `suggested_next_due_date = null`; người dùng vẫn có thể tự nhập ngày để tạo Reminder. | Process / Fallback | US-06; Product Decision |

### 3.4. Hồ sơ khám bệnh (MED)

Nguồn: US-07.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-MED-01 | Ngày khám là trường bắt buộc khi thêm Medical Record. | Validation | US-07 |
| BR-MED-02 | Tên phòng khám, triệu chứng, chẩn đoán, thuốc kê, ghi chú và file đính kèm là tùy chọn. | Data Definition | US-07 |
| BR-MED-03 | Mỗi file đính kèm tối đa 5MB; file vượt giới hạn hoặc sai định dạng bị từ chối. | Constraint | US-07 |

### 3.5. Lịch sử y tế và kiểm soát truy cập (MEDHIST)

Nguồn: US-08, US-09.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-MEDHIST-01 | Lịch sử y tế gồm Vaccine Record và Medical Record, hiển thị mới nhất trước và có thể lọc theo loại bản ghi. | Process / Display | US-08 |
| BR-MEDHIST-02 | Mỗi Vaccine Record và Medical Record phải lưu người tạo là Owner hoặc Caretaker. | Data Integrity / Audit | US-09 |
| BR-MEDHIST-03 | Caretaker không được xóa bất kỳ bản ghi y tế nào. | Authorization | US-09 |
| BR-MEDHIST-04 | Caretaker không được chỉnh sửa bản ghi y tế đã tồn tại, kể cả bản ghi do chính Caretaker tạo. | Authorization | US-09 |
| BR-MEDHIST-05 | Caretaker chỉ được truy cập hồ sơ y tế của pet đã được chia sẻ và quyền còn hiệu lực. | Authorization | US-09 |

### 3.6. Nhắc hẹn (REM)

Nguồn: US-10, US-11.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-REM-01 | Trường bắt buộc khi tạo Reminder gồm pet, loại nhắc hẹn và ngày hẹn. | Validation | US-10 |
| BR-REM-02 | Reminder có ngày hẹn đã qua vẫn được phép lưu để ghi nhận lịch sử. | Process | US-10 |
| BR-REM-03 | Khi Reminder được tạo từ gợi ý sau tiêm, ngày hẹn được lưu tại `Reminder.due_date`, không lưu trong Vaccine Record. | Data Integrity | US-10 |
| BR-REM-04 | Hệ thống cho phép nhiều Reminder cùng ngày cho cùng một pet, không chặn trùng. | Constraint | US-10 |
| BR-REM-05 | Caretaker chỉ được xem Reminder của pet đã được chia sẻ và quyền còn hiệu lực. | Authorization | US-11 |
| BR-REM-06 | Caretaker không được tạo, sửa, hoàn thành hoặc xóa Reminder. | Authorization | US-11 |
| BR-REM-07 | Sau khi lưu Vaccine Record, hệ thống chỉ tạo Reminder khi Owner xác nhận ngày gợi ý hoặc ngày đã chỉnh sửa. | Process | US-06, US-10 |
| BR-REM-08 | Chỉ Owner được đánh dấu Reminder là Completed. Khi hoàn thành, hệ thống cập nhật trạng thái lưu trữ thành `Completed`. | Authorization / Process | US-10 AC-03 |
| BR-REM-09 | Trạng thái lưu trữ gồm `Upcoming` và `Completed`. `display_status` được suy ra khi đọc dữ liệu: Completed nếu trạng thái lưu trữ là Completed; Overdue nếu chưa hoàn thành và `due_date < current_date`; Upcoming trong các trường hợp còn lại. | Computation / Display | US-10; Product Decision |

### 3.7. Chỉ số sức khỏe (HLOG)

Nguồn: US-12, US-13.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-HLOG-01 | Mỗi lần nhập Health Log tạo một bản ghi mới có timestamp; không ghi đè dữ liệu cũ. | Data Integrity | US-12 |
| BR-HLOG-02 | Health Log phải có ít nhất một trong các trường: weight, food_amount, food_type, status hoặc note. | Validation | US-12 |
| BR-HLOG-03 | Biểu đồ xu hướng cân nặng hiển thị theo tuần hoặc tháng tùy lựa chọn của người dùng. | Display / Computation | US-13 |
| BR-HLOG-04 | Nếu pet có dưới hai bản ghi cân nặng, Dashboard hiển thị “Chưa đủ dữ liệu” thay vì biểu đồ trống. | Data Sufficiency | US-13 AC-03 |
| BR-HLOG-05 | Caretaker được thêm Health Log cho pet được chia sẻ, nhưng không được sửa hoặc xóa Health Log đã tồn tại. | Authorization | US-12, US-14 |

### 3.8. Phân quyền và chia sẻ (SHARE)

Nguồn: US-14.

| Mã BR | Business Rule | Loại Rule | Nguồn |
|---|---|---|---|
| BR-SHARE-01 | Chỉ Owner được cấp hoặc thu hồi quyền Caretaker. | Authorization | US-14 |
| BR-SHARE-02 | Một pet có thể được chia sẻ cho nhiều Caretaker cùng lúc. | Constraint | US-14 |
| BR-SHARE-03 | Caretaker không được chia sẻ tiếp quyền truy cập cho người khác. | Authorization | US-14 |
| BR-SHARE-04 | Caretaker chỉ thấy pet được Owner chỉ định chia sẻ. | Authorization | US-14 |
| BR-SHARE-05 | Mỗi quyền Caretaker phải có ngày hết hiệu lực. | Constraint | US-14 |
| BR-SHARE-06 | Nếu email đã có tài khoản, quyền được cấp ngay; nếu email chưa có tài khoản, hệ thống gửi lời mời và chỉ kích hoạt quyền sau khi người được mời đăng ký. | Process | US-14 |
| BR-SHARE-07 | Thu hồi quyền có hiệu lực ngay lập tức; request tiếp theo của Caretaker phải bị chặn và giao diện phải rời khỏi dữ liệu vừa bị thu hồi. | Process / Security | US-14 |
| BR-SHARE-08 | Owner không được chia sẻ pet cho chính email của mình. | Validation | US-14 |

## 4. Cross-cutting Rules

### CC-01. Vaccine Record → Reminder

Backend lưu Vaccine Record trước, sau đó:

1. Lấy `species` và `date_of_birth` từ Pet.
2. Tính độ tuổi tại `vaccine_date`.
3. Chọn chu kỳ chuẩn theo loài, loại vaccine và độ tuổi.
4. Trả `suggested_next_due_date` nhưng không lưu vào Vaccine Record.
5. Chỉ tạo Reminder khi Owner xác nhận; ngày được lưu tại `Reminder.due_date` và liên kết nguồn bằng `source_vaccine_record_id`.

### CC-02. Chuẩn hóa email

BR-AUTH-03 áp dụng tại mọi điểm so khớp email, bao gồm đăng ký, đăng nhập, Google OAuth, mời Caretaker và kiểm tra Owner tự chia sẻ cho chính mình.

Email lưu trong `public.users` phải thỏa `email = lower(trim(email))` và dùng một UNIQUE constraint trên giá trị đã chuẩn hóa. Không tạo thêm expression unique index trùng chức năng.

### CC-03. Lộ trình Google OAuth

BR-AUTH-08 vẫn là Business Rule đã chốt. Tuy nhiên, Google OAuth được triển khai ở checkpoint riêng sau email/password Auth. Trước khi hoàn tất checkpoint đó, giao diện không được trình bày nút Google như một chức năng khả dụng.

### CC-04. Quyền cố định của Caretaker

Trong MVP, Caretaker có quyền **View + Add only** trên đúng pet được chia sẻ và còn hiệu lực:

- Được xem hồ sơ pet, lịch sử y tế và Reminder.
- Được thêm Vaccine Record, Medical Record và Health Log.
- Không được sửa/xóa dữ liệu đã tồn tại.
- Không được tạo, sửa, hoàn thành hoặc xóa Reminder.
- Không được cấp quyền cho người khác.

### CC-05. Reminder status

Database chỉ cần lưu `Upcoming` hoặc `Completed`. API suy ra `display_status` dựa trên `status`, `due_date` và ngày hiện tại; không cần tiến trình cập nhật trạng thái mỗi ngày.

## 5. Thống kê

| Nhóm | Tiền tố | Số rule |
|---|---:|---:|
| Authentication | AUTH | 14 |
| Pet | PET | 7 |
| Vaccine | VAC | 8 |
| Medical Record | MED | 3 |
| Medical History | MEDHIST | 5 |
| Reminder | REM | 9 |
| Health Log | HLOG | 5 |
| Sharing | SHARE | 8 |
| **Tổng cộng** |  | **59** |

## 6. Quyết định phạm vi triển khai

- Core MVP: Authentication, Pet Profile, Vaccine Record, Reminder và Medical Record.
- Core MVP: `/dashboard` làm landing/pet-list cơ bản sau đăng nhập.
- Should Have / Phase 2: Health Log, Dashboard phân tích nâng cao và Caretaker Sharing.
- Google OAuth được triển khai trong checkpoint riêng sau email/password Auth; BR-AUTH-08 không bị hủy bỏ.
- Không hỗ trợ hard-delete tài khoản trong MVP; phương án tương lai là soft delete hoặc trạng thái inactive.
- Không đưa API sửa/xóa Vaccine Record, Medical Record hoặc Health Log vào MVP.
- Không đưa Pet Delete vào MVP khi chưa có User Story và Business Rule riêng.
- Không tích hợp AI, clinic-side system, booking hoặc payment trong MVP.
