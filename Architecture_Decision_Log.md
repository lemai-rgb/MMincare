# MMinCare — Architecture Decision Log

## ADR-005 — Per-pet Caretaker read-only sharing (Phase 2.1)

- Owner invitations are stored in `pet_access` as Pending until a verified
  Caretaker account accepts the exact normalized email invite.
- Active access is per Pet and expires by `valid_until`; revoke/expiry is
  enforced by API and RLS for every subsequent request.
- Phase 2.1 allows only basic Pet data and textual Vaccine/Medical history.
  Health Log, Reminder, statistics, Notification Center, private assets,
  writes and further sharing remain denied.

**Phiên bản:** 2.0 · **Cập nhật:** 2026-10-11 (Asia/Ho_Chi_Minh)  
**Baseline ứng dụng:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf` — PR #26 đã merge, Vercel Production thành công.  
**Ứng dụng:** https://m-mincare.vercel.app/ · **Trải nghiệm thử:** https://m-mincare.vercel.app/demo

> Current = code đã triển khai tại baseline trên. Trạng thái này không có nghĩa mọi kịch bản đã kiểm thử thực tế. Demo dùng dữ liệu giả lập ở trình duyệt; không chứng minh Auth, Owner A/B, Storage hoặc hiệu năng backend.

## 1. Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| Accepted / Current | Đã được chấp nhận và thuộc baseline hiện tại. |
| Superseded | Quyết định cũ đã được thay thế; giữ lại để truy vết. |
| Planned | Có định hướng nhưng chưa phải hành vi production. |
| Proposed | Cần chốt thêm trước khi triển khai. |
| Pending deployment | Đã có thay đổi ngoài `main`, chưa được coi là production. |

## 2. Decision register

### ADL-001 — Không cung cấp hard-delete tài khoản trong MVP

- **Trạng thái:** Accepted / Current
- **Quyết định:** MVP không có luồng xóa vĩnh viễn tài khoản.
- **Lý do:** tránh xóa dây chuyền dữ liệu sức khỏe và cần thêm chính sách lưu trữ/audit trước khi triển khai.

### ADL-002 — Đăng ký bằng email cần xác nhận email

- **Trạng thái:** Accepted / Current
- **Quyết định:** dùng Supabase Auth email/password; người dùng xác nhận email trước khi sử dụng đầy đủ hệ thống.
- **Hệ quả:** Auth redirect allowlist và origin production phải được cấu hình đúng.

### ADL-003 — Redirect xác thực phải được kiểm soát

- **Trạng thái:** Superseded bởi ADL-015
- **Quyết định cũ:** chỉ redirect đến đường dẫn nội bộ hợp lệ.
- **Ghi chú:** nguyên tắc vẫn còn hiệu lực; luồng recovery hiện được mô tả đầy đủ ở ADL-015.

### ADL-004 — Dashboard gắn với từng Pet

- **Trạng thái:** Accepted / Current
- **Quyết định:** dashboard sức khỏe được truy cập trong ngữ cảnh một Pet qua `/api/pets/{petId}/dashboard`, hỗ trợ `period=week|month`.
- **Hệ quả:** mọi truy vấn dashboard phải xác thực quyền trên Pet trước khi tổng hợp.

### ADL-005 — Tạo Pet là một luồng chính thức

- **Trạng thái:** Accepted / Current
- **Quyết định:** Owner có thể tạo, xem và cập nhật Pet; ghi chú cũ cho rằng thiếu `/pets/new` không còn là trạng thái hiện tại.

### ADL-006 — Google OAuth không thuộc baseline hiện tại

- **Trạng thái:** Planned
- **Quyết định:** giữ Google OAuth trong Phase 1 khi cấu hình provider và redirect hoàn chỉnh; không mô tả là đã deploy.

### ADL-007 — Hồ sơ ứng dụng tách khỏi `auth.users`

- **Trạng thái:** Accepted / Current
- **Quyết định:** danh tính xác thực thuộc `auth.users`; dữ liệu hồ sơ ứng dụng thuộc bảng public tương ứng và liên kết bằng user id.

### ADL-008 — Chuẩn hóa email tại lớp Auth

- **Trạng thái:** Accepted / Current
- **Quyết định:** dựa vào cơ chế xác thực/unique của Supabase Auth; không tạo một nguồn email cạnh tranh trong nghiệp vụ.

### ADL-009 — Next.js SSR dùng cookie session

- **Trạng thái:** Accepted / Current
- **Quyết định:** session phía server được đọc/ghi bằng cookie; route server phải xác thực user trước khi truy cập dữ liệu.
- **Hệ quả:** môi trường cần `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### ADL-010 — Nhắc lịch trong ứng dụng là kênh MVP

- **Trạng thái:** Accepted / Current
- **Quyết định:** reminder hiện hiển thị trong ứng dụng; push/email notification chưa thuộc baseline.

### ADL-011 — Vaccine Record là sự kiện đã xảy ra

- **Trạng thái:** Accepted / Current
- **Quyết định:** `vaccine_date` không được ở tương lai. Ngày gợi ý tiếp theo chỉ là giá trị hỗ trợ nhập liệu, không tự động trở thành một mũi tiêm đã thực hiện.

### ADL-012 — Medical Record và attachment riêng tư

- **Trạng thái:** Accepted / Current
- **Quyết định:** hồ sơ y tế có thể kèm tệp trong bucket private `medical-record-attachments`; truy cập bằng signed URL sau khi kiểm tra quyền.
- **Hệ quả:** upload có trạng thái lỗi và cho phép retry; không công khai URL tĩnh.

### ADL-013 — Health Log dùng ngày ghi nhận và thời điểm nhập

- **Trạng thái:** Accepted / Current
- **Quyết định:** `recorded_on` biểu diễn ngày sức khỏe; `logged_at` biểu diễn thời điểm nhập. Không cho ngày tương lai theo múi giờ Việt Nam.
- **Sắp xếp mới nhất:** `recorded_on DESC`, `logged_at DESC`, `health_log_id DESC`.

### ADL-014 — Owner-only ở runtime hiện tại

- **Trạng thái:** Accepted / Current
- **Quyết định:** Owner là actor vận hành hiện tại. Caretaker/pet access chỉ là phần schema/Phase 2, chưa quảng bá là khả dụng.

### ADL-015 — Password recovery dùng callback an toàn

- **Trạng thái:** Accepted / Current
- **Quyết định:** hỗ trợ cả PKCE code và token hash qua callback xác thực, sau đó chuyển đến `/reset-password` để đặt mật khẩu mới.
- **Hệ quả:** callback URL phải có trong allowlist của Auth ở mọi môi trường.

### ADL-016 — Reminder có tối đa một nguồn nghiệp vụ

- **Trạng thái:** Accepted / Current
- **Quyết định:** reminder có thể tạo thủ công, từ Vaccine Record hoặc từ Medical Record. Hai khóa `source_vaccine_record_id` và `source_medical_record_id` không được cùng có giá trị.

### ADL-017 — Hoàn tất reminder là thao tác được giới hạn

- **Trạng thái:** Accepted / Current
- **Quyết định:** hoàn tất reminder chỉ cập nhật `status` và `completed_at`; UI chặn double-click trong khi request đang chạy.
- **Bảo mật:** anon không có quyền; authenticated chỉ có grant cần thiết và vẫn chịu RLS/kiểm tra ownership.

### ADL-018 — Dashboard sức khỏe dùng taxonomy cố định

- **Trạng thái:** Accepted / Current
- **Quyết định:** sáu nhóm trạng thái là `Bình thường`, `Mệt mỏi`, `Ăn kém/Bỏ ăn`, `Nôn`, `Tiêu chảy`, `Khác`; giá trị ngoài năm nhóm chuẩn được gom vào `Khác`.
- **Tương tác hiện tại:** tooltip biểu đồ trạng thái hỗ trợ hover, keyboard focus, Enter/Space và tap; hiển thị tối đa 3 bản ghi gần nhất cùng số lượng còn lại, không gọi thêm API.

### ADL-019 — Thu hồi quyền chạy hàm quản trị RLS

- **Trạng thái:** Accepted / Current
- **Quyết định:** `rls_auto_enable()` không được thực thi bởi `anon` hoặc `authenticated`.

### ADL-020 — Migration là nguồn sự thật nhưng phải xử lý drift

- **Trạng thái:** Accepted / Current
- **Quyết định:** migration trong repository là nguồn lịch sử schema; khi môi trường có drift phải reconcile trước khi replay hoặc promote.
- **Hệ quả:** không suy đoán production schema chỉ từ một file migration cũ.

### ADL-021 — Baseline triển khai có thể tái tạo

- **Trạng thái:** Accepted / Current
- **Quyết định:** dùng Next.js `16.3.5`, Node.js `>=20.9`, cài phụ thuộc bằng `npm ci` và xác minh bằng `npm run build`.
- **Phụ thuộc ngoài mã nguồn:** Supabase URL/key, Auth redirect/origin, migrations, RLS/grants, constraints/indexes và private Storage bucket.

### ADL-022 — Owner xác nhận xóa Vaccine/Medical Record

- **Trạng thái:** Accepted / Current; thay quyết định Proposed ở v1.6.
- **Quyết định:** hard-delete bản ghi sau dialog xác nhận; chưa có sửa Vaccine/Medical Record.
- **Phụ thuộc:** Reminder tham chiếu nguồn được giữ lại, FK nguồn thành null; xóa Medical cascade metadata attachment và dọn object Storage. Nếu cleanup object thất bại, API trả cảnh báo, không báo rằng bản ghi còn tồn tại.
- **Giới hạn:** không có xóa Pet/tài khoản, không bổ sung quyền Caretaker, không tuyên bố đã có audit trail cho xóa.

### ADL-023 — Biểu đồ cân nặng và trạng thái thuộc production

- **Trạng thái:** Accepted / Current; trạng thái pending PR #7 đã kết thúc.
- **Quyết định:** kỳ tuần/tháng, trục toàn kỳ, tooltip dữ liệu tại điểm; trạng thái theo sáu nhóm, nhãn gốc của Khác được giữ trong chi tiết. Dữ liệu thiếu/không đủ điểm có thông báo, không dựng giá trị thay thế.

### ADL-024 — Sửa Reminder tách khỏi hoàn tất

- **Trạng thái:** Accepted / Current.
- **Quyết định:** chỉ sửa `due_date`, `note` khi status lưu là `Upcoming`; `Overdue` là trạng thái suy ra và không tự làm Reminder hết quyền sửa. Complete là endpoint riêng, cập nhật `status`, `completed_at`.

### ADL-025 — Notification Center và chấm đỏ chưa đọc

- **Trạng thái:** Accepted / Current.
- **Quyết định:** event `due_soon`/`overdue` từ Reminder; chỉ chấm đỏ khi còn unread, không hiện số/dòng mô tả dưới chuông. Accessible name vẫn truyền đạt unread. Mở panel không tự đánh dấu đọc; đọc thành công rồi điều hướng Reminder highlight.
- **Hệ quả:** revalidate/invalidation, timeout và request lỗi thời phải được xử lý; không suy ra có push/email từ in-app notification.

### ADL-026 — Ảnh Pet không bắt buộc, private Storage

- **Trạng thái:** Accepted / Current.
- **Quyết định:** chọn JPG/JPEG/PNG/WebP tối đa 5 MiB; kiểm tra file ở client/server; bucket `pet-photos` private ngay từ migration đầu. Object path theo user và tên duy nhất; stream ảnh qua endpoint Owner-authorized.
- **UI:** ảnh thật phủ khung vuông bằng cover, avatar mặc định theo loài giữ contain; bỏ ảnh trở về avatar. Không bắt người dùng nhập URL; đường dẫn ảnh cũ được giữ tương thích.
- **Retry:** POST Pet có key/hash chống tạo trùng; không dùng service-role phía client.

### ADL-027 — Health Log CRUD và kết quả lưu chưa xác định

- **Trạng thái:** Accepted / Current.
- **Quyết định:** Owner được POST/PATCH/DELETE; chỉ các trường nghiệp vụ được sửa. ID, Owner và `logged_at` bất biến. POST bắt buộc `idempotency_key`, unique theo Owner/Pet/key.
- **Timeout:** không coi mất response là chưa lưu. Giữ snapshot payload/key bất biến, khóa trường khi chưa rõ kết quả; retry cùng snapshot nhận canonical row. Khi Hủy sau lỗi/timeout, invalidate operation cũ và GET lại.
- **DELETE:** retry 404 sau mất phản hồi không tự suy ra thành công; đồng bộ bằng GET canonical.

### ADL-028 — Enter không vô tình lưu nhật ký

- **Trạng thái:** Accepted / Current.
- **Quyết định:** Enter ở cân nặng/thức ăn/lượng ăn không submit; ghi chú xuống dòng, dropdown/ngày giữ hành vi control; nút Lưu focus vẫn Enter/Space. Tôn trọng IME; không chặn Enter toàn trang hoặc tự chuyển focus.

### ADL-029 — Demo dùng chính giao diện và nghiệp vụ ứng dụng

- **Trạng thái:** Accepted / Current — PR #26 đã merge/deploy.
- **Quyết định:** public `/demo` tái sử dụng component/form/CSS production; adapter request/navigation qua React context chỉ trong cây demo; không patch global fetch. Nhãn riêng Trải nghiệm thử (reset có xác nhận) và Về trang chủ.
- **Dữ liệu:** Meo/Min có ảnh, Sushi avatar mặc định và dữ liệu cơ bản; tổng 31 Health Logs phân bố khác nhau. Snapshot ngày Việt Nam; sessionStorage từng tab; reload giữ thay đổi, reset tạo mẫu mới. Không ghi Supabase/API/Storage production.
- **Giới hạn:** chỉ mô phỏng nghiệp vụ tại trình duyệt; không chứng minh phân quyền thật, gửi email hoặc hiệu năng backend.

### ADL-030 — Responsive và thời gian chờ có kiểm soát

- **Trạng thái:** Accepted / Current.
- **Quyết định:** tab Pet mobile 2 × 2, metadata wrap, cụm tuổi nguyên nhóm, khoảng cách dương; footer nhật ký attribution trái/actions phải; vùng chạm ít nhất 44px.
- **Request:** timeout 15 giây bao phủ nhận response body, abort/cleanup, retry, chống stale GET/mutation; giảm summary query theo tab đang mở; giữ Auth/RLS và force-dynamic.
- **Bằng chứng:** có regression tests và instrumentation tùy chọn; chưa có số đo production trước/sau, không công bố mức tăng tốc.


## 3. Current và Planned

| Phạm vi | Current | Planned / chưa hoàn tất |
|---|---|---|
| Actor | Owner của app; người xem demo public | Caretaker |
| Auth | Email/password, confirmation, recovery | Google OAuth |
| Reminder/Notification | Create/edit/complete, in-app event/read/red dot | Push/email |
| Hồ sơ | Pet và ảnh; Vaccine/Medical create/read/delete; Health CRUD | Pet/account delete, Vaccine/Medical edit |
| Thống kê | Per-Pet, tuần/tháng, weight/status tooltips | Aggregate nhiều Pet |
| Demo | Cùng UI, mẫu browser-local, reset | Không thay thế kiểm thử dịch vụ thật |
| Gợi ý ngày tiêm | Contract matched/no_match/unavailable/not_checked | CR-08: quyền đọc và dataset được duyệt |


## 4. Checklist promote một quyết định sang Current

1. Thay đổi đã merge vào `main` và có commit xác định.
2. Migration liên quan đã reconcile và áp dụng đúng thứ tự.
3. `npm ci` và `npm run build` thành công với Node.js phù hợp.
4. Cấu hình Auth, Storage, RLS/grants, constraints/indexes đã được xác minh ở môi trường đích.
5. Smoke test đúng actor, đúng timezone và đúng luồng lỗi.
6. Cập nhật đồng thời Business Rules, User Stories, API, Data Dictionary và ba sơ đồ.

## 5. Lịch sử phiên bản

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 2.0 | 2026-10-11 | Đồng bộ code đã triển khai, CRUD/ảnh/thông báo, request lifecycle/idempotency và demo cùng UI; tách phạm vi kiểm chứng và kế hoạch. |
| 1.6 | 22/09/2026 | Đồng bộ decision register với baseline `cd701979…`; bổ sung recovery, source reminder, dashboard sức khỏe, hardening RLS, portability, CR delete và trạng thái PR #7. |
| 1.5 trở về trước | Trước 22/09/2026 | Lịch sử cũ; các mục mâu thuẫn được đánh dấu Superseded trong bản này. |

