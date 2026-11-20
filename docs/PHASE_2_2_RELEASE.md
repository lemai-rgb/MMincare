# Phase 2.2 — triển khai và bằng chứng xác minh

**Ngày:** 21/11/2026, giờ Việt Nam.  
**Release:** [PR #36](https://github.com/lemai-rgb/MMincare/pull/36). PR ghi nhận HEAD, CI, merge SHA và deployment sau khi mỗi bước trả kết quả.

## Kết quả nghiệp vụ

Caretaker đã xác nhận email, có quyền Active còn hạn, được thêm bản ghi tiêm phòng hoặc lần khám dạng văn bản cho đúng Pet được chia sẻ. Database tự xác định người tạo từ phiên đăng nhập. Owner xem và xóa được hồ sơ của Pet mình, kể cả hồ sơ Caretaker thêm.

Không mở quyền Caretaker sửa/xóa bản ghi, chia sẻ tiếp, đọc ảnh/file private, Health Log, quản lý Reminder hoặc Notification. Các policy truy cập bảng gốc vẫn giới hạn Owner. RPC trả các trường văn bản/ID bản ghi theo projection đã định nghĩa, không trả identity hoặc metadata file.

## Nhật ký thao tác

| Thứ tự | Thao tác | Kết quả kiểm chứng |
|---|---|---|
| 1 | Đọc trạng thái dự án, migration history, schema/policies và advisors | Supabase ACTIVE_HEALTHY; trước thay đổi có 19 migration, thiếu đúng hai migration Phase 2.2 |
| 2 | Ghi nhận dữ liệu trước thay đổi | Pet 5, Vaccine 7, Medical 5, Pet access 0; lưu fingerprint toàn bộ row theo khóa chính |
| 3 | Nhận xác nhận của người dùng cho cả hai migration | Chỉ áp dụng sau xác nhận; lần thử trước đó bị duyệt tự động chặn và không tạo entry |
| 4 | Apply caretaker_add_records qua Supabase MCP | Thành công; remote version 20261120183551 |
| 5 | Apply owner_delete_caretaker_records qua Supabase MCP | Thành công; remote version 20261120183616 |
| 6 | Đọc lại migration history, pg_proc và pg_policies | Tổng 21 entry; RPC public/private tồn tại; ACL, search_path, Owner SELECT/DELETE đúng thiết kế |
| 7 | Thử fixture phân quyền trong transaction dự kiến rollback | Lượt gọi bị ngắt trước khi trả kết quả; không có bằng chứng để công bố PASS |
| 8 | Kiểm tra lại sau ngắt | Không có phiên fixture/idle-in-transaction; Pet/Vaccine/Medical/Pet access có count và fingerprint như trước |
| 9 | Đối chiếu repository với production history | Đổi tên hai file theo remote version, giữ nguyên nội dung SQL/blob; không repair history hoặc chạy lại migration |
| 10 | Kiểm tra CI trên HEAD mới, merge và kiểm tra deployment | Kết quả cụ thể được cập nhật tại checklist PR #36; không suy ra deploy thành công chỉ từ merge |

## Mapping migration

| Tên file lúc phát triển | Tên file khớp production | SQL |
|---|---|---|
| 20261120155104_caretaker_add_records.sql | 20261120183551_caretaker_add_records.sql | Không đổi, blob 6c6e1cca5384e8676865a65aabf98a0c4448d326 |
| 20261120163018_owner_delete_caretaker_records.sql | 20261120183616_owner_delete_caretaker_records.sql | Không đổi, blob dffc057b63d33853037180911a95fd703e695c79 |

Remote version do Supabase cấp khi apply; repository dùng đúng phiên bản đó để lần triển khai sau không nhận nhầm migration chưa chạy. Không đổi lịch sử database đã áp dụng.

## Xác minh database production

- public.add_shared_pet_record là SECURITY INVOKER; private.add_shared_pet_record là SECURITY DEFINER. Cả hai có search_path rỗng; anon không có EXECUTE, authenticated có EXECUTE theo thiết kế.
- Hàm private yêu cầu auth.uid(), email đã xác nhận, dòng pet_access Active đúng Pet/caretaker và valid_until chưa hết theo ngày Việt Nam.
- Hàm khóa dòng quyền bằng FOR UPDATE trước khi ghi: write đã giữ khóa có thể hoàn tất trước revoke; revoke đã commit chặn request tiếp theo. Đây là kiểm tra định nghĩa, chưa phải thử race đồng thời trên production.
- Medical SELECT/DELETE và Vaccine SELECT/DELETE dựa trên Owner của Pet; Medical/Vaccine INSERT bảng gốc vẫn đòi created_by là actor và Pet ownership.
- Không thêm policy Caretaker SELECT/INSERT/DELETE lên các bảng hồ sơ gốc.
- Security advisors sau apply không thêm nhóm cảnh báo so với preflight. Cảnh báo cũ về các RPC Phase 2.1 có chủ đích, leaked-password protection và bảng rules không có policy vẫn còn; không tuyên bố toàn bộ security audit PASS.

Advisory references: [function execution](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [RLS without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Dữ liệu trước/sau

| Bảng | Số dòng trước/sau | MD5 fingerprint trước/sau |
|---|---:|---|
| pets | 5 / 5 | dbb14ad002601d0acd9eee567d7c3fd1 |
| vaccine_records | 7 / 7 | 6041822c1e5e59d3b371409042a21836 |
| medical_records | 5 / 5 | c56ef47191cac30d5f17da8d0ba431e7 |
| pet_access | 0 / 0 | d41d8cd98f00b204e9800998ecf8427e |

Fingerprint là kiểm tra tính nguyên vẹn các bảng nêu trên, không phải backup hoặc chứng nhận mọi bảng chưa đổi. Không công bố nội dung hồ sơ hay thông tin tài khoản.

## Bằng chứng kiểm thử và giới hạn

Application HEAD trước reconcile: dbaf56af26bc8d06416cedad4622264b9d3ae6f7.

- [Migration Replay #55](https://github.com/lemai-rgb/MMincare/actions/runs/44774592381): PASS trên Supabase local sạch và legacy; SQL fixture và Playwright chạy ứng dụng thật, gồm Caretaker thêm hồ sơ, Owner dùng UI xóa cả hai loại hồ sơ và revoke chặn link cũ.
- [Portfolio Demo Checks #37](https://github.com/lemai-rgb/MMincare/actions/runs/44774592385): PASS.
- Sau đổi tên migration/tài liệu, phải kiểm tra lại CI cho HEAD mới; kết quả được liên kết tại PR.
- Production đã xác minh history, định nghĩa hàm, quyền, policy và fingerprint. Lượt fixture production không có kết quả; không ghi nhận production runtime PASS.
- Full authenticated production UAT, race revoke/write đồng thời, Preview visual QA và toàn bộ thiết bị vẫn chưa được xác nhận.

## Theo dõi sau merge

Checklist PR #36 được cập nhật theo kết quả thực tế: commit đã merge, trạng thái Vercel cho commit đó, URL production, HTTP smoke và công việc còn lại. Trạng thái database, application deployment và nghiệm thu người dùng được ghi riêng để tránh nhầm đã deploy với đã UAT đầy đủ.
