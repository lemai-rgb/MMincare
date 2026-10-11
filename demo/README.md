# Bộ dữ liệu mẫu MMinCare

**Cập nhật:** 2026-10-11 (VN) · **Application baseline:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf`  
**Đã triển khai:** PR #26 đã merge, [Vercel Production success](https://vercel.com/lemai-rgbs-projects/m-mincare/E3bmui2BdzU7iAzkP2kNtnM4XSLD).  
[Ứng dụng](https://m-mincare.vercel.app/) · [Trải nghiệm thử](https://m-mincare.vercel.app/demo)


Đây là dữ liệu nghiệp vụ hoàn toàn giả lập cho **portfolio demo**, không lấy từ Supabase hoặc tài khoản thật. Hai ảnh đại diện được người dùng cung cấp riêng để dùng cho demo. Không import bộ này vào production. Không có password, email, token, Auth user, object Storage hay rule tiêm phòng.

## Nội dung

| Hồ sơ | Loài | Kịch bản |
|---|---|---|
| Meo | Mèo, cái, tam thể | Lịch sử sức khỏe, tiêm phòng và khám; nhắc sắp đến hạn/quá hạn/hoàn thành; nhật ký gần nhất thiếu cân nặng |
| Min | Chó, đực, Corgi | Diễn biến cân nặng; bản ghi nhập bổ sung cho ngày cũ; nhắc thủ công và nhắc có nguồn |
| Sushi | Mèo nhà, đực, khoảng 1 tuổi | Avatar mặc định; hai nhật ký (3,0 → 3,1 kg), một mũi tiêm và một nhắc chăm sóc; chưa có lần khám |

| Thực thể | Số lượng ban đầu |
|---|---:|
| Pet | 3 |
| Health Log | 31 |
| Vaccine Record | 4 |
| Medical Record | 2 |
| Reminder | 7 |
| Notification hiện hành | 3 — 2 chưa đọc, 1 đã đọc |

Mỗi bé có lịch sử riêng, phân bố không đều; **Bình thường** là trạng thái thường gặp nhất. Meo có 15 nhật ký, gồm vài lần mệt mỏi/tiêu chảy và quan sát **Sốt**, **Tránh ánh sáng**. Min có 14 nhật ký, gồm ăn kém, mệt mỏi, một lần nôn và hai lần **Rụng lông** ở các ngày khác nhau. Sushi giữ hai nhật ký cơ bản. Không ép mỗi bé hoặc mỗi tuần/tháng phải có đủ sáu nhóm. Trạng thái gốc ngoài danh mục được gom vào **Khác** và giữ nhãn trong tooltip/chi tiết.

Năm quan sát thêm không có cân nặng; cân nặng, ngày và ảnh gốc giữ nguyên. Dữ liệu được chọn cố định để reload/export nhất quán, không bốc lại ngẫu nhiên khi xem biểu đồ.

## Định dạng và ngày

- `dataset.template.json`: nguồn fixture, dùng offset ngày tương đối; giữ khoảng cách giữa các lần ghi nhận, không dồn quan sát vào tuần hiện tại. Một nhóm có thể bằng 0 nếu không có nhật ký tương ứng trong kỳ.
- `lib/demo/data.ts`: tạo snapshot từ một ngày neo ở `Asia/Ho_Chi_Minh`; không gọi network.
- `generated/dataset.json`: snapshot cụ thể ngày 10/10/2026 để xem/đối chiếu.
- `generated/*.csv`: sáu bảng, UTF-8 BOM, giá trị null để trống. Phù hợp xem bằng Excel/Power BI; không phải lệnh seed database.
- `generated/manifest.json`: ngày neo, số lượng và giới hạn sử dụng.

Xuất lại từ repository root:

```bash
npm run demo:export -- --date 2026-10-10
```

Bỏ `--date` để lấy ngày hiện tại ở Việt Nam. Lệnh chỉ ghi file trong `demo/generated`; không kết nối Supabase. Demo trên web tự tạo theo ngày bắt đầu tab; các lần reload giữ thay đổi của tab. Nút khôi phục tạo lại bộ mẫu theo ngày hiện tại.

`Overdue` là trạng thái hiển thị từ `Upcoming` và ngày đến hạn, không phải status lưu. Reminder có tối đa một nguồn và nguồn thuộc cùng Pet. Lần tiêm/ngày ghi nhận không ở tương lai tại thời điểm tạo mẫu. Nhật ký được chọn mới nhất theo `recorded_on DESC → logged_at DESC → health_log_id DESC`.

## Mapping và giới hạn

Tên trường nghiệp vụ theo contract hiện tại: `pets.gender`, `medical_records.record_id`, `health_logs.food_amount` dạng text, Reminder status `Upcoming|Completed`. Offset chỉ tồn tại trong template, không phải cột database. `version`, `anchor_day` và `read_notifications` là state của demo, không phải schema Supabase.

Owner UUID trong mẫu là định danh hư cấu, **không tồn tại như một tài khoản Auth được tạo bởi bộ này**. Notification ID là khóa snapshot của demo (reminder/ngày/loại event), không phải UUID để import vào `notification_events`. Thời điểm `read_at` trong bản export chỉ minh họa trạng thái, không là audit log người dùng thật.

Nội dung vaccine/khám/lượng ăn chỉ minh họa form và dữ liệu. Không dùng làm hướng dẫn thú y, interval tiêm hoặc liều thuốc. Không seed `vaccine_schedule_rules`; CR-08 vẫn cần quyền/dataset nghiệp vụ được duyệt riêng.

Meo dùng ảnh mèo tại `/images/demo/meo.webp`; Min dùng ảnh chó tại `/images/demo/min.webp`; Sushi có `picture_url = null` và giữ avatar mặc định theo loài. Hai ảnh được người dùng cung cấp, tối ưu thành WebP để giảm dung lượng, giữ nguyên nội dung và tỉ lệ ảnh; khung vuông dùng CSS `object-fit: cover`, căn giữa. Không upload Supabase Storage hoặc dùng ảnh của tài khoản thật. Seed revision 4 nâng cấp phiên cũ một lần: thay các quan sát revision 3 chưa được chỉnh sửa và cập nhật trạng thái mẫu còn nguyên; giữ bản ghi người xem đã sửa, không khôi phục bản ghi gốc đã xóa và không tạo trùng. Phiên rất cũ vẫn bổ sung Sushi nếu còn trống. Sau nâng cấp, bản ghi người xem xóa không được tự khôi phục khi reload. Ảnh đã đổi/bỏ trong phiên mới được giữ nguyên khi reload.

Chi tiết trải nghiệm và acceptance: [Portfolio Demo](../docs/PORTFOLIO_DEMO.md).
