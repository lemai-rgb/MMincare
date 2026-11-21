# Phase 2.2 — triển khai và bằng chứng xác minh

## Cập nhật sau PR #37 — 22/11/2026 (giờ Việt Nam)

[PR #37](https://github.com/lemai-rgb/MMincare/pull/37) đã merge vào `main` lúc 23:46 ngày 21/11/2026. Commit ứng dụng production là [`f7738c38b7b93ee0b13073ca0c60200a266229e1`](https://github.com/lemai-rgb/MMincare/commit/f7738c38b7b93ee0b13073ca0c60200a266229e1). Bằng chứng trong phần này được ghi nhận trong lượt triển khai ngày 21/11/2026.

### Hành vi đã sửa

- Owner xóa hồ sơ tiêm/khám có nhắc hẹn liên kết. Khóa nguồn chuyển về NULL, các trường còn lại của nhắc hẹn được giữ, gồm trạng thái Completed.
- API dọn object tệp sau khi xóa hồ sơ và trả trạng thái cần thử lại khi Storage còn tệp. UI có thao tác thử dọn lại.
- Owner mời lại cùng email sau khi quyền cũ hết hạn trong một giao dịch. Lời mời/quyền còn hiệu lực vẫn bị chặn trùng.
- Biểu mẫu, API tiêm/khám và trạng thái nhắc hẹn dùng ngày Việt Nam.
- Owner tạo được nhắc hẹn từ lần khám Caretaker ghi cho cùng Pet.
- Form/API upload ảnh Pet và tệp khám dùng giới hạn 4 MiB.

### Thao tác và bằng chứng

| Thứ tự | Thao tác | Kết quả |
|---|---|---|
| 1 | Rà lại diff, CI và Vercel Preview ở `d21c119` | Demo #40, Replay #58 và Preview đạt. Playwright thực hiện cả hai form Caretaker, Owner xóa hồ sơ có nhắc hẹn và dọn tệp |
| 2 | Kiểm tra production trước migration | Lịch sử có 21 migration. Hai FK nguồn Reminder dùng ON DELETE SET NULL. Storage hỗ trợ các hàm giới hạn operation. Bucket tệp private, object hiện có thuộc phạm vi đường dẫn dọn tệp |
| 3 | Áp dụng SQL đã kiểm thử | Supabase trả thành công, ghi phiên bản `20261121163456_fix_phase22_audit_regressions`, nâng lịch sử lên 22 migration |
| 4 | Đối chiếu sau áp dụng | Số lượng và mã đối chiếu toàn bộ row của bảy nhóm dữ liệu trong bảng bên dưới khớp. ACL, trigger, policy Reminder và hai policy dọn tệp đạt |
| 5 | Đồng bộ migration trên GitHub | Đổi tên file từ `20261121160524_fix_phase22_audit_regressions.sql` sang `20261121163456_fix_phase22_audit_regressions.sql`. Git xác nhận rename 100%, blob SQL `609377aa36bffffc288604e51bce05ec10285dad` |
| 6 | Kiểm thử SQL production | Fixture Owner/Caretaker kiểm tra lời mời, thêm hồ sơ, Owner xóa và giữ nhắc hẹn, quyền sau revoke. Giao dịch rollback và kiểm tra tài khoản/Pet thử đã được loại bỏ |
| 7 | Chạy lại CI ở HEAD cuối `1604009` | [Migration Replay #59](https://github.com/lemai-rgb/MMincare/actions/runs/44925460928), [Demo Checks #41](https://github.com/lemai-rgb/MMincare/actions/runs/44925460985) và [Vercel Preview](https://vercel.com/lemai-rgbs-projects/m-mincare/wjxFTshbsH9mFj74G9J5v4Q2Bj4d) đạt |
| 8 | Merge đúng HEAD đã kiểm thử | Merge `f7738c3`, Git xác nhận tree giống HEAD `1604009` |
| 9 | Chờ Vercel và kiểm tra sau deploy | [Vercel Production](https://vercel.com/lemai-rgbs-projects/m-mincare/ExfczfeCMTaYiEkSZkRGUWixNNKn) thành công. [Deployment #7966331282](https://api.github.com/repos/lemai-rgb/MMincare/deployments/7966331282/statuses) ghi môi trường Production |
| 10 | Smoke HTTP website production | Đạt 9/9 trên trang chủ, đăng nhập, demo, dashboard, API danh sách Pet chia sẻ, lời mời, thông báo và hai API Caretaker thêm hồ sơ |

### Đối chiếu dữ liệu trong lượt PR #37

Mã MD5 ở đây được tính từ chuỗi JSON toàn bộ row sắp xếp theo nội dung JSON. Bảng lịch sử PR #36 bên dưới dùng lượt kiểm tra khác.

| Nhóm dữ liệu | Số lượng trước/sau | MD5 trước/sau |
|---|---|---|
| pets | 5 / 5 | `37e58c01ab25e33ae5423cce4bc6eab4` |
| vaccine_records | 7 / 7 | `70e87d64d945132d8a1e7344a3e3821b` |
| medical_records | 5 / 5 | `8f1cb276825f2d25e77c5a1262cf7ffb` |
| pet_access | 0 / 0 | `d41d8cd98f00b204e9800998ecf8427e` |
| reminders | 8 / 8 | `4498bfae248f91616b8fcf44a9a5049f` |
| medical_attachments | 1 / 1 | `09b8f54a96b735f1f011e0baab7e42c3` |
| storage.objects trong medical-record-attachments | 1 / 1 | `0e3ef1b62d02fc392a46607b80f86482` |

### Phần còn chờ

- [ ] CARE-15 qua giao diện production với hai tài khoản Owner/Caretaker đã đăng nhập.
- [ ] Kiểm thử revoke/write đồng thời trên production.
- [ ] Ma trận thiết bị, bàn phím và giao diện đầy đủ.
- [ ] Các kiểm thử email thực, retry và đo hiệu năng còn chờ trong [trang tiến độ](PROJECT_STATUS.md).

Các kết quả SQL production, Playwright trên Supabase sạch/legacy và smoke HTTP được ghi theo đúng môi trường đã chạy. CARE-15 production tiếp tục giữ trạng thái chờ.

## Lịch sử triển khai PR #36

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
- Production đã xác minh history, định nghĩa hàm, quyền, policy và fingerprint. Lượt fixture production ban đầu bị ngắt. Kết quả của lượt kiểm tra SQL sau merge được ghi ở mục bên dưới.
- Full authenticated production UAT, race revoke/write đồng thời, Preview visual QA và toàn bộ thiết bị vẫn chưa được xác nhận.

## Theo dõi sau merge

Checklist PR #36 được cập nhật theo kết quả thực tế: commit đã merge, trạng thái Vercel cho commit đó, URL production, HTTP smoke và công việc còn lại. Trạng thái database, application deployment và nghiệm thu người dùng được ghi riêng để tránh nhầm đã deploy với đã UAT đầy đủ.


## Kết quả sau merge — 21/11/2026 (giờ Việt Nam)

- [PR #36](https://github.com/lemai-rgb/MMincare/pull/36) đã merge; commit `5b70a12f064fbcabe606444ab492a3d340dc6590`.
- HEAD trước merge `f79569e1b8ebd285b124798aaa3099bfae708d85`: [Migration Replay #56](https://github.com/lemai-rgb/MMincare/actions/runs/44802823492) PASS và [Demo Checks #38](https://github.com/lemai-rgb/MMincare/actions/runs/44802823433) PASS. Vercel Preview của HEAD này cũng success.
- GitHub compare xác nhận hai migration được rename với 0 dòng SQL thay đổi. Merge tree giống tree của HEAD đã kiểm thử.
- Cập nhật sau merge này chỉ ghi kết quả vào tài liệu, không thay đổi ứng dụng, SQL hay dữ liệu production. Feature branch được giữ lại.
- [Vercel Production](https://vercel.com/lemai-rgbs-projects/m-mincare/DHm98qvXf68z1RiJMnbNxNWdmvx9) `success` cho merge commit `5b70a12f064fbcabe606444ab492a3d340dc6590`, được xác nhận qua [GitHub Deployment #7950761337](https://api.github.com/repos/lemai-rgb/MMincare/deployments/7950761337/statuses).
- [Trang chủ](https://m-mincare.vercel.app/) và [demo](https://m-mincare.vercel.app/demo) trả HTTP 200. `/dashboard` chuyển đến `/login` khi chưa đăng nhập. Hai POST route thêm Vaccine/Medical trả HTTP 401 khi chưa đăng nhập. Demo mở được dashboard và hiện mô tả quyền xem và thêm hồ sơ trong hộp thoại chia sẻ.
- PASS trên Supabase production với một Pet và ba tài khoản giả trong transaction có rollback. Caretaker Active tạo một mũi tiêm và một lần khám qua RPC, cả hai ghi đúng `created_by`. Owner đọc và xóa được cả hai. Caretaker và tài khoản không liên quan xóa được 0 dòng. Kiểm tra sau rollback không còn tài khoản, Pet, quyền chia sẻ hay hồ sơ của lượt thử.
- Số dòng và fingerprint trước/sau lượt SQL khớp ở cả bốn bảng Pet, Vaccine, Medical và Pet access. Tại thời điểm kiểm tra, không có Vaccine/Medical production nào do người khác Owner tạo.
- Playwright trên Supabase local xác nhận nút xóa Owner cho cả hai loại bản ghi. UAT UI với Owner/Caretaker đã đăng nhập trên production, kiểm thử revoke/write đồng thời và QA đa thiết bị vẫn đang chờ.
