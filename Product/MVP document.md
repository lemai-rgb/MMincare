## 1\. Mục tiêu MVP

MVP của MminCare hướng đến việc giải quyết hai vấn đề cốt lõi của người nuôi thú cưng đó là thiếu công cụ lưu trữ thông tin sức khỏe tập trung và không có cơ chế nhắc lịch chăm sóc sức khỏe cho thú cưng. Khi giải quyết được các vấn đề này, người nuôi chủ động hơn trong việc theo dõi tình hình sức khỏe thú cưng

#### Nguyên tắc ưu tiên MVP

MVP ưu tiên giải quyết các pain point của Primary Persona trước nhằm kiểm chứng giá trị cốt lõi của sản phẩm. Các nhu cầu thuộc Secondary Persona sẽ được xem xét sau khi các chức năng cốt lõi đã được hoàn thiện.

### 2\. Định nghĩa MVP

   → Build đến đâu thì đủ để test với người dùng thực  
MVP được xem là hoàn chỉnh khi một người nuôi có thể: Tạo hồ sơ thú cưng với thông tin cơ bản (tên, độ tuổi, giới tính, loài); Ghi nhận và xem lịch sử tiêm phòng; Nhận nhắc lịch tiêm và tái khám; Ghi nhận lịch sử khám bệnh

### 3\. Assumptions & Constraints 

3.1 Assumptions

AS-01: Người dùng có thiết bị di động truy cập web để sử dụng hệ thống.

AS-02: Người dùng tự nhập thông tin sức khỏe thú cưng như hồ sơ tiêm phòng, lịch khám, cân nặng và ghi chú chăm sóc.

AS-03: MVP chưa tích hợp trực tiếp với hệ thống của phòng khám thú y; dữ liệu y tế được nhập thủ công bởi người dùng.

AS-04: Người dùng có kết nối internet khi truy cập hệ thống.

AS-05: Lịch nhắc vaccine trong MVP dựa trên ngày đến hạn do người dùng nhập hoặc ngày được hệ thống gợi ý theo logic đơn giản.

AS-06: MMinCare không thay thế tư vấn chuyên môn của bác sĩ thú y.

3.2 Constraints

CT-01: MVP chỉ hỗ trợ quản lý thú cưng là chó và mèo.

CT-02: MVP không bao gồm hệ thống quản lý dành cho phòng khám thú y.

CT-03: MVP không bao gồm AI tư vấn sức khỏe thú cưng.

CT-04: MVP không xử lý đặt lịch khám, thanh toán hoặc kết nối marketplace dịch vụ thú cưng.

CT-05: Reminder trong MVP tập trung vào việc hiển thị nhắc hẹn trong hệ thống; push notification/email notification có thể được mô phỏng hoặc để ở phiên bản sau.

CT-06: Caretaker Portal chưa phải trọng tâm kiểm chứng giá trị cốt lõi của MVP, nên chỉ được xem là Should Have hoặc Future Enhancement tùy scope cuối cùng.

### 4\. Persona Prioritization

| Persona | Priority | Lý do |
| ----- | ----- | ----- |
| Minh Anh (Người nuôi thú cưng lần đầu) | Primary Persona | Đại diện cho nhóm người dùng gặp các pain point cốt lõi của sản phẩm: quản lý hồ sơ sức khỏe và theo dõi lịch chăm sóc. |
| Quốc Huy (Người nuôi nhiều thú cưng, thường xuyên đi công tác) | Secondary Persona | Có thêm nhu cầu phối hợp chăm sóc và theo dõi từ xa, tuy nhiên đây là nhu cầu mở rộng sau khi giải quyết được các pain point cốt lõi. |

### 5\. MoSCoW Feature Matrix    

   → Must Have / Should Have / Won't Have (for now)  
   → Mỗi feature link rõ về Persona nào được giải quyết

| Tính năng | Mô tả | Persona | Ưu tiên |
| :---- | :---- | :---- | :---- |
| Kiểm soát cân nặng | Ghi nhận lịch sử cân nặng theo thời gian | Minh Anh  | Should have |
| Hồ sơ thông tin thú cưng | Ghi nhận thông tin cơ bản của thú cưng | Cả hai  | Must have |
| Nhắc lịch tiêm phòng | Nhắc lịch tiêm phòng theo chu kỳ y tế  | Cả hai | Must have |
| Quyền truy cập cho người chăm hộ | Chia sẻ quyền cập nhật cho người chăm hộ  | Quốc Huy  | Should have |
| Authentication | Xác nhận người dùng hệ thống | Cả hai | Must have |
| Theo dõi tiêm phòng | Ghi nhận lịch sử vắc xin đã sử dụng của thú cưng | Cả hai | Must have |
| Lịch sử khám bệnh  | Ghi nhận lịch sử khám bệnh của thú cưng | Cả hai | Must have |
| Dashboard dữ liệu sức khỏe tổng quan định kỳ | Tổng hợp số liệu sức khỏe thú cưng theo chu kỳ  | Quốc Huy | Should have |
| Thực đơn của thú cưng | Ghi nhận thực đơn thú cưng định kỳ | Minh Anh | Should have |
| Đề xuất lời khuyên của Al | Al đề xuất thêm các cách chăm sóc hiệu quả | Minh Anh | Won’t have |

### 6\. Lý do ra quyết định (Rationale)

| Tính năng | Xếp loại | Lý do |
| :---- | :---- | :---- |
| Kiểm soát cân nặng | Should have | Biết tình trạng cân nặng của thú cưng để điều chỉnh phù hợp. Có giá trị theo dõi sức khỏe nhưng không trực tiếp giải quyết pain point cốt lõi là quản lý hồ sơ và nhắc lịch chăm sóc.  |
| Hồ sơ thông tin thú cưng | Must have | Đây là data foundation của toàn hệ thống, không có hồ sơ thú cưng thì không có context để gắn lịch tiêm, lịch khám hay quyền Caretaker  |
| Nhắc lịch tiêm phòng | Must have | Pain point số 1 của cả hai persona: Minh Anh không biết lịch, Quốc Huy biết nhưng quên. Đây là lý do MminCare tồn tại  |
| Quyền truy cập cho người chăm hộ | Should have | Feature này giải quyết nhu cầu theo dõi và phối hợp chăm sóc từ xa của Secondary Persona (Quốc Huy). Tuy nhiên sản phẩm vẫn có thể giải quyết các pain point cốt lõi về quản lý hồ sơ sức khỏe và nhắc lịch chăm sóc nếu chưa triển khai chức năng này. Do đó feature được ưu tiên ở mức Should Have trong giai đoạn MVP  |
| Authentication | Must have | Bắt buộc để quản lý dữ liệu người dùng  |
| Theo dõi tiêm phòng | Must have | Giải quyết vấn đề theo dõi lượng vaccines đã tiêm phòng |
| Lịch sử khám bệnh  | Must have | Giải quyết vấn đề theo dõi lịch sử khám, dùng thuốc của thú cưng |
| Dashboard dữ liệu sức khỏe tổng quan định kỳ | Should have | Theo dõi tổng quan sức khỏe trong thời kỳ nhất định. Cung cấp góc nhìn tổng quan nhưng hệ thống vẫn giải quyết được bài toán chính nếu chưa có dashboard  |
| Thực đơn của thú cưng | Should have | Hỗ trợ chăm sóc thú cưng, theo dõi nguồn thức ăn để đảm bảo sức khỏe |
| Đề xuất lời khuyên của Al | Won’t have | Ngoài phạm vi MVP |

### 7\. Tiêu chí thành công (Success Metrics)

   → Người dùng làm được gì sau khi dùng MVP

- Người dùng hoàn thành việc tạo hồ sơ và ghi nhận ít nhất 1 lần khám bệnh mà không cần hỗ trợ kỹ thuật  
- Người dùng nhận được thông báo nhắc lịch tiêm trước ngày đến hạn 

### 8\. Out of Scope

   → Danh sách rõ ràng kèm lý do loại trừ

- Đề xuất Al được loại trừ vì không phải yếu tố chính xử lý các pain point, cấu trúc dữ liệu phức tạp, cần tích hợp với bên thứ 3, có thể thêm trong các phiên bản mới của hệ thống  
- Hỗ trợ loài khác ngoài chó và mèo: Chưa có vaccination schedule chuẩn để model  
- Hệ thống quản lý phía phòng khám (Clinic-side): Domain riêng biệt, đã loại trừ trong WHO   
- Tính năng cộng đồng / mạng xã hội: Nằm ngoài core value của MminCare   
- Tích hợp đặt lịch phòng khám trực tuyến: Phụ thuộc third-party, tăng complexity không cần thiết ở MVP 