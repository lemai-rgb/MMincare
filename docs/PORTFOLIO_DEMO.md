# MMinCare — trải nghiệm thử

## Phạm vi và giao diện

Main baseline: `3ecfc6b866f05425eb3674e3626d3a5c6cd0070f`, sau khi PR #25 merge. Bản sửa hiện tại chưa merge/deploy.

Demo dùng cùng màn, component, form và CSS với ứng dụng chính. `PetListView` và `PetDetailView` được tách nguyên markup từ server page; Auth/ownership/query vẫn ở protected server pages. Các form và component hiện có chỉ nhận thêm transport/navigation qua React context. Context mặc định dùng fetch và Next router như trước.

Chỉ trong cây `/demo`, adapter trả response từ dữ liệu tab-local và điều hướng tới `/demo?screen=...`. Adapter không gọi network; endpoint ngoài phạm vi trả lỗi. Không patch global fetch, không bypass thêm route/API, không thay Auth/RLS/Storage. Click link demo bằng modifier/open-new-tab vẫn mở URL demo.

Phần riêng hiển thị: nhãn **Trải nghiệm thử** và **Về trang chủ**. Click nhãn cho phép khôi phục mẫu sau xác nhận. Không có intro dashboard, card dọc, form hay biểu đồ riêng. Header, Pet cards/profile, Overview, Medical/Vaccine, Reminder, Health Log, chart/status tooltip và Notification popover dùng component production.

## Dữ liệu và thao tác

Ba Pet: Meo và Min dùng ảnh được cung cấp; Sushi là mèo nhà đực, khoảng một tuổi, avatar mặc định, hai nhật ký (3,0 và 3,1 kg), một mũi tiêm và một nhắc chăm sóc. Sushi chưa có lần khám để giữ một empty state có ý nghĩa. Tổng mẫu: 26 Health Logs, 4 Vaccine Records, 2 Medical Records, 7 Reminders và 3 thông báo hiện hành ban đầu.

Demo hỗ trợ các form hiện có: tạo/sửa Pet, chọn/đổi/bỏ ảnh; thêm/xóa Vaccine và Medical; attachment lựa chọn/mở tại trình duyệt; tạo nhắc hẹn thủ công/có nguồn, sửa ngày/ghi chú và hoàn thành; Health Log create/edit/delete; thống kê tuần/tháng; đọc notification. Không giả lập đăng nhập/email/Owner isolation hay máy chủ lưu file. Chưa có rule dataset nên gợi ý lịch tiêm giữ trạng thái unavailable và cho tự nhập ngày như ứng dụng hiện tại.

`sessionStorage` giữ dữ liệu và file đọc thành data URL chỉ trong trình duyệt. File không gửi lên Storage hoặc production. Nếu vượt quota hoặc storage bị chặn, UI báo rằng reload sẽ khôi phục mẫu; ứng dụng vẫn thao tác trong bộ nhớ. Không gửi dữ liệu riêng vào demo dùng cho portfolio. Tệp/ảnh được chọn không phải bằng chứng kiểm thử Storage thật.

Phiên cũ nâng cấp Sushi một lần nếu vẫn trống, giữ chỉnh sửa khác. Phiên đã nâng cấp giữ việc bỏ ảnh và xóa bản ghi qua reload. Reset chỉ ghi key demo, không xóa storage của website thật; reset/unmount thu hồi blob URLs dùng mở tệp.

## Kiểm chứng và release

- `test:demo`: fixture, adapter/contract, scoped boundary và rendered tests dùng các form/component thật.
- Regression app: Health Log lifecycle, Medical/Reminder loading, statistics timestamp, notifications, image validation/picker, Auth and reminder validation.
- Lint, TypeScript, production Webpack build, deterministic JSON/CSV export và diff checks.
- Test/build không chứng minh visual parity hoặc thao tác authenticated production. Ghi rõ browser/Preview smoke nào thực sự thực hiện; không ghi visual PASS khi chưa chụp/đối chiếu.
- Không cần migration hoặc seed Supabase. Giữ bản sửa trong PR cho review trước khi merge; chỉ dùng link CV sau khi đúng bản deploy được xác minh.

## Trải nghiệm cho người xem CV

1. Mở `/demo`: danh sách Meo, Min, Sushi trên giao diện ứng dụng.
2. Mở hồ sơ, xem Overview và Medical; thử thêm mũi tiêm/lần khám và nhắc hẹn có nguồn.
3. Vào Sức khỏe: thêm chỉ số, sửa/xóa có xác nhận; xem thống kê và status tooltip.
4. Mở Nhắc hẹn: tạo, lọc, chỉnh sửa ngày và hoàn thành; mở chuông để đọc thông báo.
5. Tải lại để kiểm tra trạng thái của tab. Nhấn Trải nghiệm thử để khôi phục mẫu, hoặc Về trang chủ để thoát.

Bộ export tại `demo/generated` dành cho đọc/BA/Tester, không dùng import production. CV/README nêu đúng vai trò thực tế và phạm vi kiểm chứng; demo không phải bằng chứng phân quyền hay hiệu năng backend.
