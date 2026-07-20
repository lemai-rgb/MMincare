User Story Document \- MminCare

**Scope: MVP |** 

---

EPIC 1: AUTHENTICATION

---

**US-01 | Đăng ký tài khoản** Priority: Must Have Actor: Người nuôi thú cưng (Active Owner)

User Story:

"Là người nuôi thú cưng lần đầu, tôi muốn đăng ký tài khoản trên MminCare để bắt đầu quản lý thông tin sức khỏe thú cưng của mình."

Acceptance Criteria:

AC-01: Đăng ký thành công

* Given: Người dùng chưa có tài khoản và nhập đầy đủ thông tin hợp lệ  
* When: Người dùng nhấn nút "Đăng ký"  
* Then: Hệ thống tạo tài khoản thành công, lưu thông tin người dùng và chuyển đến màn hình tạo hồ sơ thú cưng

AC-02: Email đã tồn tại

* Given: Email đã được đăng ký trước đó  
* When: Người dùng thực hiện đăng ký với email đó  
* Then: Hệ thống hiển thị thông báo "Email đã tồn tại" và không tạo tài khoản mới

AC-03: Dữ liệu không hợp lệ

* Given: Người dùng nhập email sai định dạng hoặc mật khẩu không đạt yêu cầu  
* When: Người dùng nhấn "Đăng ký"  
* Then: Hệ thống hiển thị thông báo lỗi tương ứng và không cho phép người dùng gửi biểu mẫu khi dữ liệu chưa hợp lệ.

AC-04: Hệ thống tự tạo tên hiển thị

\* Given: Người dùng đăng ký bằng email/password với dữ liệu hợp lệ

\* When: Hệ thống tạo tài khoản thành công

\* Then: Hệ thống lấy phần trước ký tự @ của email làm name và lưu hồ sơ người dùng với name khác rỗng

Business Rules:

* BR-01: Email phải là duy nhất trong hệ thống  
* BR-02: Mật khẩu tối thiểu 8 ký tự và chứa ít nhất 1 chữ số  
* BR-03: Email được trim khoảng trắng đầu/cuối và xử lý không phân biệt hoa thường trước khi lưu  
* BR-04: Name là dữ liệu bắt buộc của hồ sơ nhưng không bắt buộc người dùng nhập trên form đăng ký. Hệ thống tự tạo Name từ phần trước ký tự @ của email.

Edge Cases:

* Bỏ trống trường bắt buộc → Hệ thống hiển thị thông báo lỗi tại các trường bắt buộc bị thiếu và không lưu hồ sơ, không cho submit  
* Email chứa khoảng trắng đầu/cuối → hệ thống tự trim trước khi validate

---

**US-02 | Đăng nhập tài khoản** Priority: Must Have Actor: Người nuôi thú cưng, Người chăm hộ

User Story:

"Là người dùng đã có tài khoản, tôi muốn đăng nhập để truy cập thông tin thú cưng của mình."

Acceptance Criteria:

AC-01: Đăng nhập thành công \- Người nuôi

* Given: Người nuôi đã có tài khoản và nhập đúng email, mật khẩu  
* When: Người dùng nhấn "Đăng nhập"  
* Then: Hệ thống xác thực thành công và chuyển đến màn hình danh sách thú cưng cá nhân

AC-02: Đăng nhập thành công \- Người chăm hộ

* Given: Người chăm hộ đã có tài khoản và được cấp quyền truy cập  
* When: Người chăm hộ đăng nhập  
* Then: Hệ thống chuyển đến màn hình danh sách thú cưng được chia sẻ, không phải danh sách cá nhân

AC-03: Thông tin đăng nhập sai

* Given: Người dùng nhập sai email hoặc mật khẩu  
* When: Người dùng nhấn "Đăng nhập"  
* Then: Hệ thống hiển thị thông báo lỗi chung "Email hoặc mật khẩu không đúng" mà không chỉ rõ trường nào sai

AC-04: Duy trì phiên đăng nhập

* Given: Người dùng đã đăng nhập thành công  
* When: Người dùng tắt app và mở lại  
* Then: Hệ thống giữ nguyên phiên đăng nhập cho đến khi người dùng chủ động logout

AC-05: Đăng nhập bằng Google thành công

\* Given: Người dùng chọn "Tiếp tục với Google"

\* When: Google xác thực tài khoản thành công

\* Then: Hệ thống đăng nhập người dùng và lấy tên từ thông tin tài khoản Google

AC-06: Google không cung cấp tên

\* Given: Google xác thực thành công nhưng không trả về tên người dùng

\* When: Hệ thống tạo hồ sơ người dùng

\* Then: Hệ thống dùng phần trước ký tự @ của email làm name

Business Rules:

* BR-01: Không tiết lộ trường nào sai khi đăng nhập thất bại để bảo mật tài khoản  
* BR-02: Phiên đăng nhập được duy trì trừ khi người dùng chủ động logout

Edge Cases:

* Tài khoản chưa được cấp quyền Caretaker cho thú cưng nào → hiển thị empty state với thông báo "Chưa có thú cưng được chia sẻ"

---

EPIC 2: QUẢN LÝ HỒ SƠ THÚ CƯNG

---

**US-03 | Tạo hồ sơ thú cưng** Priority: Must Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi thú cưng, tôi muốn tạo hồ sơ cho từng con thú cưng để lưu trữ thông tin cơ bản tập trung tại một nơi."

Acceptance Criteria:

AC-01: Tạo hồ sơ thành công

* Given: Người dùng đã đăng nhập và nhập đầy đủ thông tin bắt buộc  
* When: Người dùng nhấn "Lưu hồ sơ"  
* Then: Hệ thống tạo hồ sơ thành công và hồ sơ xuất hiện ngay trong danh sách thú cưng

AC-02: Thiếu thông tin bắt buộc

* Given: Người dùng bỏ trống một hoặc nhiều trường bắt buộc  
* When: Người dùng nhấn "Lưu hồ sơ"  
* Then: Hệ thống hiển thị thông báo lỗi tại các trường bắt buộc bị thiếu và không lưu hồ sơ.

AC-03: Không upload ảnh đại diện

* Given: Người dùng không chọn ảnh đại diện cho thú cưng  
* When: Hồ sơ được tạo thành công  
* Then: Hệ thống tự động gán avatar mặc định theo loài (chó hoặc mèo)

Business Rules:

* BR-01: Các trường bắt buộc gồm: tên, loài (chó/mèo), giới tính  
* BR-02: Các trường tùy chọn gồm: giống, ngày sinh, ảnh đại diện  
* BR-03: Một tài khoản có thể tạo không giới hạn số hồ sơ thú cưng trong MVP

Edge Cases:

* Người dùng chưa có hồ sơ thú cưng nào sau đăng ký → hiển thị màn hình tạo hồ sơ đầu tiên với hướng dẫn ngắn

---

**US-04 | Xem danh sách thú cưng** Priority: Must Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi nhiều thú cưng, tôi muốn xem danh sách tất cả thú cưng của mình trên một màn hình để nhanh chóng chọn con cần xem thông tin."

Acceptance Criteria:

AC-01: Hiển thị danh sách

* Given: Người dùng đã có ít nhất một hồ sơ thú cưng  
* When: Người dùng đăng nhập thành công hoặc quay lại màn hình chính  
* Then: Hệ thống hiển thị tất cả thú cưng dưới dạng card gồm: ảnh, tên, loài, tuổi

AC-02: Truy cập hồ sơ chi tiết

* Given: Danh sách thú cưng đang hiển thị  
* When: Người dùng bấm vào card của một thú cưng  
* Then: Hệ thống chuyển đến trang hồ sơ chi tiết của thú cưng đó

AC-03: Chưa có hồ sơ nào

* Given: Người dùng chưa tạo hồ sơ thú cưng nào  
* When: Người dùng vào màn hình danh sách  
* Then: Hệ thống hiển thị empty state với nút "Thêm thú cưng đầu tiên"

Business Rules:

* BR-01: Chỉ hiển thị thú cưng thuộc tài khoản đang đăng nhập

---

**US-05 | Chỉnh sửa hồ sơ thú cưng** Priority: Must Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi thú cưng, tôi muốn chỉnh sửa thông tin hồ sơ thú cưng khi có thay đổi để đảm bảo dữ liệu luôn chính xác."

Acceptance Criteria:

AC-01: Chỉnh sửa thành công

* Given: Người dùng đang xem hồ sơ chi tiết của thú cưng  
* When: Người dùng chỉnh sửa thông tin và nhấn "Lưu"  
* Then: Hệ thống cập nhật dữ liệu ngay lập tức và hiển thị thông báo "Đã lưu thay đổi"

AC-02: Hủy chỉnh sửa

* Given: Người dùng đang trong chế độ chỉnh sửa  
* When: Người dùng nhấn "Hủy"  
* Then: Hệ thống giữ nguyên dữ liệu cũ và thoát chế độ chỉnh sửa

AC-03: Người chăm hộ không có quyền chỉnh sửa

* Given: Người chăm hộ đang xem hồ sơ thú cưng được chia sẻ  
* When: Người chăm hộ truy cập hồ sơ  
* Then: Hệ thống không hiển thị nút chỉnh sửa hồ sơ cơ bản

Business Rules:

* BR-01: Chỉ Owner mới có quyền chỉnh sửa thông tin hồ sơ cơ bản của thú cưng

---

EPIC 3: HỒ SƠ Y TẾ

---

**US-06 | Thêm bản ghi tiêm phòng** Priority: Must Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi thú cưng lần đầu, tôi muốn ghi lại thông tin từng mũi tiêm sau mỗi lần đi khám để không còn phụ thuộc vào sổ tiêm giấy dễ thất lạc."

Acceptance Criteria:

AC-01: Thêm bản ghi thành công

* Given: Người dùng đang xem hồ sơ y tế của thú cưng  
* When: Người dùng nhập đầy đủ thông tin và nhấn "Lưu"  
* Then: Hệ thống lưu bản ghi và hiển thị trong lịch sử tiêm phòng ngay lập tức

AC-02: Gợi ý lịch tiêm tiếp theo

* Given: Người dùng vừa lưu bản ghi tiêm phòng thành công  
* When: Hệ thống nhận diện được loại vaccine  
* Then: Hệ thống tự động gợi ý ngày tiêm mũi tiếp theo dựa trên chu kỳ chuẩn

AC-03: Nhập ngày tiêm trong tương lai

* Given: Người dùng nhập ngày tiêm là ngày trong tương lai  
* When: Người dùng nhấn "Lưu"  
* Then: Hệ thống hiển thị cảnh báo "Ngày tiêm chưa đến" nhưng vẫn cho phép lưu

Business Rules:

* BR-01: Các trường bắt buộc: tên vaccine, ngày tiêm  
* BR-02: Các trường tùy chọn: liều số mấy, tên phòng khám, ghi chú  
* BR-03: Chu kỳ vaccine phụ thuộc: Loài; Loại vaccine; Độ tuổi  
* BR-04: Người dùng có thể chỉnh sửa ngày gợi ý.  
* BR-05: Hệ thống không lưu next\_due\_date trong Vaccine Record. Ngày nhắc tiêm tiếp theo được tạo và quản lý thông qua bảng Reminder.  
* BR-06: Nếu hệ thống tự gợi ý lịch tiêm, ngày gợi ý được tính bởi backend dựa trên vaccine\_name, vaccine\_date, species và dose\_number.

Edge Cases:

* Người chăm hộ không có quyền cập nhật y tế → hệ thống không hiển thị nút "Thêm bản ghi tiêm phòng".

---

**US-07 | Thêm bản ghi khám bệnh** Priority: Must Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi thú cưng, tôi muốn ghi lại kết quả mỗi lần khám bệnh để khi đổi phòng khám vẫn có đủ thông tin cung cấp cho bác sĩ mới."

Acceptance Criteria:

AC-01: Thêm bản ghi thành công

* Given: Người dùng đang xem hồ sơ y tế của thú cưng  
* When: Người dùng nhập thông tin khám và nhấn "Lưu"  
* Then: Hệ thống lưu bản ghi và hiển thị trong lịch sử khám bệnh ngay lập tức

AC-02: Đính kèm ảnh toa thuốc

* Given: Người dùng muốn đính kèm ảnh phiếu khám hoặc toa thuốc  
* When: Người dùng chọn ảnh từ thiết bị  
* Then: Hệ thống hiển thị preview ảnh và lưu cùng bản ghi

AC-03: File đính kèm quá lớn

* Given: Người dùng chọn ảnh có dung lượng vượt quá giới hạn cho phép  
* When: Người dùng xác nhận đính kèm  
* Then: Hệ thống báo lỗi và yêu cầu chọn file khác, không lưu file đó

Business Rules:

* BR-01: Trường bắt buộc: ngày khám  
* BR-02: Trường tùy chọn: tên phòng khám, triệu chứng, chẩn đoán, thuốc kê, ghi chú, ảnh đính kèm  
* BR-03: Dung lượng file đính kèm tối đa 5MB mỗi ảnh

---

**US-08 | Xem lịch sử y tế** Priority: Must Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi nhiều thú cưng, tôi muốn xem toàn bộ lịch sử tiêm phòng và khám bệnh của từng con để nhanh chóng cung cấp thông tin khi cần."

Acceptance Criteria:

AC-01: Hiển thị lịch sử

* Given: Người dùng đang xem hồ sơ của một thú cưng  
* When: Người dùng vào mục lịch sử y tế  
* Then: Hệ thống hiển thị toàn bộ bản ghi theo thứ tự thời gian mới nhất lên trên

AC-02: Lọc theo loại

* Given: Lịch sử y tế đang hiển thị  
* When: Người dùng chọn bộ lọc "Tiêm phòng" hoặc "Khám bệnh"  
* Then: Hệ thống chỉ hiển thị các bản ghi thuộc loại được chọn

AC-03: Xem chi tiết bản ghi

* Given: Danh sách lịch sử đang hiển thị  
* When: Người dùng bấm vào một bản ghi  
* Then: Hệ thống hiển thị toàn bộ thông tin chi tiết của bản ghi đó

AC-04: Chưa có bản ghi nào

* Given: Thú cưng chưa có bản ghi y tế nào  
* When: Người dùng vào mục lịch sử y tế  
* Then: Hệ thống hiển thị empty state với gợi ý thêm bản ghi đầu tiên

---

**US-09 | Cập nhật hồ sơ y tế (Người chăm hộ)** Priority: Should Have Actor: Người chăm hộ (Caretaker)

User Story:

"Là người chăm hộ được ủy quyền, tôi muốn cập nhật hồ sơ y tế của thú cưng đang chăm sóc để chủ nuôi luôn nắm được tình trạng sức khỏe dù không trực tiếp có mặt."

Acceptance Criteria:

AC-01: Thêm bản ghi khám bệnh

* Given: Caretaker được cấp quyền truy cập và đang xem hồ sơ y tế  
* When: Caretaker thêm thông tin khám bệnh và nhấn "Lưu"  
* Then: Hệ thống lưu bản ghi, đánh dấu người tạo là Caretaker và hiển thị trong lịch sử

AC-02: Thêm bản ghi tiêm phòng

* Given: Caretaker được cấp quyền truy cập và đang xem hồ sơ y tế  
* When: Caretaker nhập thông tin mũi tiêm và nhấn "Lưu"  
* Then: Hệ thống lưu bản ghi tiêm phòng và cập nhật lịch sử

AC-03: Giới hạn quyền xóa

* Given: Caretaker đang xem lịch sử y tế  
* When: Caretaker truy cập bất kỳ bản ghi nào  
* Then: Hệ thống không hiển thị nút xóa với Caretaker

AC-04: Giới hạn quyền chỉnh sửa bản ghi của Owner

* Given: Caretaker đang xem bản ghi do Owner tạo  
* When: Caretaker cố chỉnh sửa bản ghi đó  
* Then: Hệ thống không cho phép thực hiện và hiển thị thông báo lỗi phân quyền

Business Rules:

* BR-01: Caretaker chỉ được truy cập thú cưng được chia sẻ  
* BR-02: Caretaker không được xóa bất kỳ bản ghi y tế nào  
* BR-03: Caretaker không được chỉnh sửa bản ghi do Owner tạo  
* BR-04: Hệ thống lưu thông tin người tạo (Owner hoặc Caretaker) cho từng bản ghi  
* BR-05: Caretaker chỉ được thêm bản ghi y tế nếu được Owner cấp quyền cập nhật.  
* BR-06: Nếu Caretaker chỉ có quyền xem, hệ thống không cho phép thêm, sửa hoặc xóa bản ghi.

---

EPIC 4: NHẮC HẸN

---

**US-10 | Tạo nhắc hẹn** Priority: Must Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi thú cưng bận rộn, tôi muốn đặt nhắc hẹn cho lịch tiêm và tái khám sắp tới để không còn bỏ sót mũi tiêm quan trọng vì quên."

Acceptance Criteria:

AC-01: Tạo nhắc hẹn thành công

* Given: Người dùng đã chọn thú cưng và nhập đầy đủ thông tin nhắc hẹn  
* When: Người dùng nhấn "Lưu nhắc hẹn"  
* Then: Hệ thống lưu nhắc hẹn và hiển thị trong danh sách lịch sắp tới

AC-02: Gửi thông báo nhắc hẹn

* Given: Nhắc hẹn đã được tạo và đến thời điểm nhắc  
* When: Hệ thống phát hiện ngày hẹn sắp đến  
* Then: Hệ thống gửi thông báo đến người dùng trước ngày hẹn

AC-03: Đánh dấu hoàn thành

* Given: Người dùng đã thực hiện việc tiêm hoặc tái khám  
* When: Người dùng đánh dấu nhắc hẹn là "Hoàn thành"  
* Then: Hệ thống cập nhật trạng thái và chuyển nhắc hẹn sang mục lịch sử

AC-04: Chưa chọn thú cưng

* Given: Người dùng chưa chọn thú cưng khi tạo nhắc hẹn  
* When: Người dùng nhấn "Lưu"  
* Then: Hệ thống yêu cầu chọn thú cưng trước khi tiếp tục

Business Rules:

* BR-01: Trường bắt buộc: thú cưng, loại nhắc hẹn, ngày hẹn  
* BR-02: Nhắc hẹn với ngày đã qua vẫn được lưu để ghi nhận lịch sử  
* BR-03: Khi người dùng tạo reminder sau khi nhập vaccine record, hệ thống lưu ngày cần tiêm tiếp theo tại Reminder.due\_date.

Edge Cases:

* Người dùng tạo hai nhắc hẹn cùng ngày cho cùng một thú cưng → hệ thống cho phép, không chặn

---

**US-11 | Xem nhắc hẹn (Người chăm hộ)** Priority: Should Have Actor: Người chăm hộ

User Story:

"Là người chăm hộ, tôi muốn xem các nhắc hẹn sắp tới của thú cưng đang trông để chủ động thực hiện đúng lịch."

Acceptance Criteria:

AC-01: Xem danh sách nhắc hẹn

* Given: Caretaker được cấp quyền truy cập thú cưng  
* When: Caretaker vào mục nhắc hẹn  
* Then: Hệ thống hiển thị danh sách nhắc hẹn của thú cưng được chia sẻ gồm: ngày, loại, ghi chú

AC-02: Giới hạn quyền quản lý nhắc hẹn

* Given: Caretaker đang xem danh sách nhắc hẹn  
* When: Caretaker truy cập bất kỳ nhắc hẹn nào  
* Then: Hệ thống không hiển thị nút tạo, sửa hoặc xóa nhắc hẹn

AC-03: Không có nhắc hẹn

* Given: Thú cưng không có nhắc hẹn nào sắp tới  
* When: Caretaker vào mục nhắc hẹn  
* Then: Hệ thống hiển thị empty state

Business Rules:

* BR-01: Caretaker chỉ xem được nhắc hẹn của thú cưng được chia sẻ  
* BR-02: Caretaker không có quyền tạo, sửa hoặc xóa nhắc hẹn

---

EPIC 5: CHỈ SỐ SỨC KHỎE

---

**US-12 | Cập nhật chỉ số sức khỏe** Priority: Should Have Actor: Người nuôi thú cưng, Người chăm hộ

User Story:

"Là người nuôi thú cưng, tôi muốn ghi nhận chỉ số sức khỏe định kỳ như cân nặng và chế độ ăn để phát hiện sớm các bất thường theo thời gian."

Acceptance Criteria:

AC-01: Ghi nhận chỉ số thành công

* Given: Người dùng hoặc Caretaker đang xem hồ sơ thú cưng  
* When: Nhập chỉ số sức khỏe và nhấn "Lưu"  
* Then: Hệ thống lưu bản ghi kèm timestamp và hiển thị trong lịch sử chỉ số

AC-02: Caretaker cập nhật chỉ số

* Given: Caretaker được cấp quyền truy cập  
* When: Caretaker nhập chỉ số sức khỏe trong thời gian được ủy quyền  
* Then: Hệ thống lưu bản ghi và đánh dấu người tạo là Caretaker

Business Rules:

* BR-01: Mỗi lần nhập tạo ra một bản ghi riêng biệt có timestamp, không ghi đè dữ liệu cũ  
* BR-02: Khi tạo Health Log, người dùng phải nhập ít nhất một trong các trường: weight, food\_amount, food\_type, status hoặc note.

---

**US-13 | Xem dashboard tổng hợp sức khỏe** Priority: Should Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi nhiều thú cưng, tôi muốn xem tổng quan sức khỏe của tất cả thú cưng trên một màn hình để nhanh chóng nắm được tình trạng chung."

Acceptance Criteria:

AC-01: Hiển thị dashboard

* Given: Người dùng đã có ít nhất một thú cưng với dữ liệu sức khỏe  
* When: Người dùng vào màn hình dashboard  
* Then: Hệ thống hiển thị: xu hướng cân nặng theo thời gian, nhắc hẹn sắp tới, lần khám gần nhất

AC-02: Lọc theo thú cưng

* Given: Dashboard đang hiển thị tổng hợp tất cả  
* When: Người dùng chọn một thú cưng cụ thể  
* Then: Hệ thống chỉ hiển thị dữ liệu của thú cưng được chọn

AC-03: Chưa đủ dữ liệu

* Given: Thú cưng có ít hơn 2 bản ghi cân nặng  
* When: Người dùng xem dashboard  
* Then: Hệ thống hiển thị thông báo "Chưa đủ dữ liệu để hiển thị biểu đồ" thay vì biểu đồ trống

Business Rules:

* BR-01: Biểu đồ cân nặng hiển thị theo đơn vị tuần hoặc tháng tùy lựa chọn người dùng

---

EPIC 6: PHÂN QUYỀN

---

**US-14 | Chia sẻ quyền truy cập cho Người chăm hộ** Priority: Should Have Actor: Người nuôi thú cưng

User Story:

"Là người nuôi thú cưng thường xuyên đi công tác, tôi muốn chia sẻ quyền truy cập cho người chăm hộ để họ có đủ thông tin chăm sóc thú cưng và cập nhật tình trạng khi cần."

Acceptance Criteria:

AC-01: Chia sẻ cho tài khoản đã tồn tại

* Given: Caretaker đã có tài khoản trong hệ thống  
* When: Owner nhập email Caretaker và xác nhận chia sẻ  
* Then: Hệ thống cấp quyền truy cập ngay lập tức và Caretaker thấy thú cưng được chia sẻ khi đăng nhập

AC-02: Chia sẻ cho người chưa có tài khoản

* Given: Email chưa tồn tại trong hệ thống  
* When: Owner gửi lời mời  
* Then: Hệ thống gửi email mời đăng ký kèm link đặc biệt, quyền được cấp sau khi Caretaker đăng ký

AC-03: Thu hồi quyền truy cập

* Given: Caretaker đang được cấp quyền truy cập  
* When: Owner thu hồi quyền  
* Then: Caretaker mất quyền truy cập ngay lập tức và bị redirect về màn hình thông báo nếu đang trong phiên đăng nhập

AC-04: Chọn thú cưng được chia sẻ

* Given: Owner đang cấp quyền cho Caretaker  
* When: Owner chọn thú cưng cụ thể để chia sẻ  
* Then: Caretaker chỉ thấy thú cưng được chọn, không thấy toàn bộ tài khoản

AC-05: Tự chia sẻ cho chính mình

* Given: Owner nhập email của chính mình vào form chia sẻ  
* When: Owner nhấn xác nhận  
* Then: Hệ thống hiển thị thông báo lỗi và không thực hiện chia sẻ

Business Rules:

* BR-01: Chỉ Owner mới có quyền cấp hoặc thu hồi quyền Caretaker  
* BR-02: Một thú cưng có thể được chia sẻ cho nhiều Caretaker cùng lúc  
* BR-03: Caretaker không được chia sẻ tiếp quyền truy cập cho người khác  
* BR-04: Caretaker chỉ thấy thú cưng được Owner chỉ định chia sẻ  
* BR-05: Mỗi quyền Caretaker phải có ngày hết hiệu lực.

