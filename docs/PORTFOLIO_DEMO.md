# MMinCare — Portfolio Demo

## Quyết định và trạng thái

Baseline: `main` `fd7145ef7ad72f3bda7fe36613f88e5f22a795cd` (PR #23 đã merge). Nhánh demo bổ sung route công khai `/demo`, bộ mẫu và sandbox tương tác. Chưa được gọi là production-deployed cho tới khi PR merge và deployment được xác minh.

Đã push [Draft PR #25](https://github.com/lemai-rgb/MMincare/pull/25). Trên commit code `cffae9c9c332022a12629193934905903bf488a9`, [Portfolio Demo Checks](https://github.com/lemai-rgb/MMincare/actions/runs/37980089248) đã PASS (demo tests, export deterministic, TypeScript và lint); Vercel Preview status là success. Local có 75 test/14 file đạt, các script Auth/Reminder đạt, full lint/TypeScript/diff check đạt. Build production bằng Webpack đạt và `/demo` là static page; build mặc định Turbopack bị chặn bởi symlink `node_modules` bên ngoài project trong môi trường local.

Browser local không kết nối được; lần mở Preview bị browser URL policy chặn. Chưa có browser smoke, screenshot hoặc visual QA mobile/desktop; trạng thái deployment thành công không chứng minh những mục này.

Website thật giữ Supabase Auth, API, Owner RLS và private Storage. Demo dùng dataset hư cấu và state client, tách khỏi backend. Chỉ route chính xác `/demo` hoặc `/demo/` bỏ qua session refresh; không mở bypass cho các API hoặc protected page. Không có mock API, service-role key, Auth account chung, migration hoặc seed production.

`sessionStorage` giữ dữ liệu theo tab và qua reload. Hai trình duyệt/tab mới có bộ mẫu độc lập; tab được nhân bản có thể nhận bản sao khởi đầu theo hành vi trình duyệt, nhưng thao tác sau đó độc lập. Đây không phải chứng minh phân quyền Owner A/B của hệ thống thật. Nếu trình duyệt chặn storage, demo vẫn chạy trong bộ nhớ và báo rằng reload sẽ mất thay đổi.

## Phạm vi trải nghiệm

| Khả năng | Demo | Website thật |
|---|---|---|
| Xem hồ sơ Pet, summary, empty state | Có, ba hồ sơ mẫu | Owner-authenticated |
| Thêm/sửa/xóa Health Log | Có, state của tab | API và RLS |
| Enter trong input / textarea | Input text không implicit submit; textarea xuống dòng | Logic nghiệp vụ hiện có |
| Thống kê tuần/tháng | Tính từ fixture bằng helper dashboard dùng chung; chart và bảng dữ liệu | API dashboard và component production |
| Đổi ngày/ghi chú và hoàn thành Reminder | Có; source date được kiểm tra; Completed không sửa | API và RLS |
| Thông báo và unread dot | Có; đọc idempotent, date snapshot mới khi đổi ngày, ẩn event của Reminder completed | API/trigger database |
| Tiêm phòng và khám | Chỉ xem | Có create/delete |
| Tạo/sửa Pet, upload ảnh/tệp | Chưa có trong demo | Có sau đăng nhập |
| Đăng nhập, email confirmation/recovery | Không mô phỏng | Auth thật |
| Owner isolation / Storage security | Không dùng demo làm bằng chứng | Phải kiểm thử với hai tài khoản thật |
| Email/push, gợi ý lịch tiêm | Không triển khai bằng fixture | Theo trạng thái sản phẩm hiện tại; rule read/dataset còn riêng |

Demo tái sử dụng taxonomy, date/period, weight/status aggregation, reminder labels/status và avatar mặc định. Nó là UI sandbox cho các luồng đã nêu, không phải bản sao toàn bộ giao diện/Auth/API production. Chart demo phân bổ theo thứ tự lần cân và có bảng giá trị; không tuyên bố hỗ trợ đủ tooltip/trục thời gian của chart production.

## Hướng dẫn nhà tuyển dụng — 3 phút

1. Mở `<DEMO_ORIGIN>/demo`, không cần tài khoản.
2. Mở **Meo → Sức khỏe → Thống kê**. Đổi tuần/tháng; đối chiếu cân nặng và tình trạng.
3. Mở **Sushi → Sức khỏe**, xem empty state. Thêm nhật ký có cân nặng và ghi chú, sửa cân nặng, reload và mở lại Sushi, sau đó xóa có xác nhận.
4. Mở **Nhắc hẹn**, lọc quá hạn; sửa ngày, hoàn thành. Kiểm tra badge và thông báo cập nhật.
5. Mở chuông, đọc một event. Dùng **Khôi phục dữ liệu mẫu** để bắt đầu lại; có thể tải JSON của state hiện tại.

## Dataset và kịch bản QA

Dataset: [demo/README](../demo/README.md), [template](../demo/dataset.template.json), [snapshot JSON](../demo/generated/dataset.json), [manifest](../demo/generated/manifest.json).

| ID | Kịch bản | Kết quả mong đợi | Bằng chứng |
|---|---|---|---|
| DEMO-01 | Mở demo khi không có session/env backend | Có ba Pet; không gọi API nghiệp vụ | Store/component/proxy tests; browser runtime cần xác minh riêng |
| DEMO-02 | Sushi chưa có dữ liệu | Empty state rõ ràng, có nút thêm | Rendered test |
| DEMO-03 | Thêm/sửa/xóa nhật ký | Summary/thống kê dùng state mới; edit giữ ID/`logged_at`; delete phải xác nhận | Store và rendered tests |
| DEMO-04 | Nhấn Enter trong input | Không tự lưu; nút Lưu vẫn thực hiện submit | Rendered test; IME/mobile keyboard cần manual |
| DEMO-05 | Reload / reset | Reload giữ state tab; reset chỉ ghi key demo, không xóa storage khác | Store và rendered tests |
| DEMO-06 | Đọc notification / complete / đổi ngày | Đọc một lần; completed không còn event; ngày mới không kế thừa read cũ | Store và rendered tests |
| DEMO-07 | Storage bị chặn hoặc payload hỏng | Không crash; fallback mẫu/thông báo rõ | Store tests |
| DEMO-08 | Mobile 320/360/390/430 và desktop | Không mất chữ/tràn trang; dialog scroll; vùng chạm ≥44px | Chưa visual QA bằng browser |

Chạy `npm run test:demo`. Các test mock browser/Next component không chứng minh upload, RLS hoặc hiệu năng production. Không ghi PASS cho manual scenario chưa thực hiện.

## Đưa vào CV BA/PM/Tester

Đặt hai link sau khi có deployment:

- **Website:** `https://m-mincare.vercel.app/` — sản phẩm có đăng nhập.
- **Live Demo:** `<DEMO_ORIGIN>/demo` — dữ liệu giả lập, không cần đăng ký.

Mô tả theo công việc thực sự của dự án: phân tích vấn đề/persona, xác định MVP và business rules, mô hình hóa dữ liệu/use case, ưu tiên feedback, viết acceptance criteria/test scenarios và quản lý thay đổi qua PR. Code có hỗ trợ AI; không trình bày dự án cá nhân thành kinh nghiệm làm việc hoặc thêm KPI chưa đo.

Repo có thể cần quyền truy cập; kiểm tra visibility trước khi đặt link GitHub vào CV. Chưa xuất bản CV hay thay đổi visibility trong task này.

## Release

Nhánh demo không yêu cầu env Supabase cho riêng `/demo`, nhưng các route thật và build hệ thống vẫn giữ yêu cầu hiện có. Inter vẫn do `next/font/google` tải khi build. Không đổi font hoặc bypass Auth để né lỗi môi trường.

Sau khi Preview sẵn sàng, xác minh `/demo` truy cập không đăng nhập, thao tác/reset/reload và mobile/desktop. Chỉ sau merge và production check mới thay `<DEMO_ORIGIN>` bằng URL chính thức trong CV. Hai ảnh chó/mèo được cung cấp sau sẽ là thay đổi asset riêng, không phải seed database.
