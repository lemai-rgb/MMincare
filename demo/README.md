# Bộ dữ liệu mẫu MMinCare

Đây là dữ liệu nghiệp vụ hoàn toàn giả lập cho **portfolio demo**, không lấy từ Supabase hoặc tài khoản thật. Hai ảnh đại diện được người dùng cung cấp riêng để dùng cho demo. Không import bộ này vào production. Không có password, email, token, Auth user, object Storage hay rule tiêm phòng.

## Nội dung

| Hồ sơ | Loài | Kịch bản |
|---|---|---|
| Meo | Mèo, cái, tam thể | Lịch sử sức khỏe, tiêm phòng và khám; nhắc sắp đến hạn/quá hạn/hoàn thành; nhật ký gần nhất thiếu cân nặng |
| Min | Chó, đực, Corgi | Diễn biến cân nặng; bản ghi nhập bổ sung cho ngày cũ; nhắc thủ công và nhắc có nguồn |
| Sushi | Mèo, chưa rõ giới tính | Chưa có nhật ký, hồ sơ y tế hoặc nhắc hẹn; dùng để thử empty state và thêm nhật ký đầu tiên |

| Thực thể | Số lượng ban đầu |
|---|---:|
| Pet | 3 |
| Health Log | 24 |
| Vaccine Record | 3 |
| Medical Record | 2 |
| Reminder | 6 |
| Notification hiện hành | 3 — 2 chưa đọc, 1 đã đọc |

## Định dạng và ngày

- `dataset.template.json`: nguồn fixture, dùng offset ngày tương đối.
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

Meo dùng ảnh mèo tại `/images/demo/meo.webp`; Min dùng ảnh chó tại `/images/demo/min.webp`; Sushi có `picture_url = null` và giữ avatar mặc định theo loài. Hai ảnh được người dùng cung cấp, tối ưu thành WebP để giảm dung lượng, giữ nguyên nội dung và tỉ lệ ảnh; khung vuông dùng CSS `object-fit: cover`, căn giữa. Không upload Supabase Storage hoặc dùng ảnh của tài khoản thật. Session demo cũ tự nhận hai ảnh khi reload, vẫn giữ các chỉnh sửa nhật ký/nhắc hẹn.

Chi tiết trải nghiệm và acceptance: [Portfolio Demo](../docs/PORTFOLIO_DEMO.md).
