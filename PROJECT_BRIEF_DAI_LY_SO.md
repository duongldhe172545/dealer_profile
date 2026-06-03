# PROJECT BRIEF — ĐẠI LÝ SỐ

## Hệ Thống Hồ Sơ Năng Lực, Báo Giá, Đơn Hàng Và Quản Trị Dữ Liệu Thị Trường Đại Lý

Phiên bản: v1.0  
Ngày cập nhật: 01/06/2026  
Chủ dự án: Dương  
Đơn vị: ADG / Mạng lưới đại lý ngành cửa và vật liệu xây dựng

---

# 1. Giới thiệu

## 1.1. Mục đích

Tài liệu này là bản mô tả tổng quan (Project Brief) cho dự án "Đại Lý Số — Hệ thống Hồ sơ năng lực, Báo giá, Đơn hàng và Quản trị dữ liệu thị trường đại lý". Tài liệu được biên soạn nhằm giúp chủ dự án, đội phát triển, đội kinh doanh và các bên liên quan có cùng một hiểu biết thống nhất về mục tiêu, phạm vi, chức năng, dữ liệu, luồng vận hành và tiêu chí nghiệm thu của hệ thống.

Đại Lý Số được thiết kế như một công cụ làm việc hằng ngày cho đại lý, đồng thời là nền tảng dữ liệu tập trung cho admin/doanh nghiệp. Ở phía đại lý, hệ thống giúp tạo hồ sơ năng lực chuyên nghiệp, quản lý sản phẩm, khách hàng, báo giá, trạng thái đơn hàng và số liệu tài chính cơ bản. Ở phía admin, hệ thống giúp quan sát hoạt động thị trường thông qua dữ liệu báo giá thực tế: khách hàng nào đang được báo giá, sản phẩm nào đang được chào bán, giá thị trường đang dao động ra sao, đại lý nào hoạt động hiệu quả và khu vực nào có tín hiệu tốt.

Tài liệu này cũng đóng vai trò làm cơ sở để đánh giá, nghiệm thu sản phẩm, phát triển tài liệu kỹ thuật chi tiết hơn, và định hướng các giai đoạn mở rộng trong tương lai.

## 1.2. Bối cảnh

ADG hoạt động trong lĩnh vực vật liệu xây dựng, cửa, nhôm kính, cửa cuốn và các nhóm sản phẩm liên quan đến thi công công trình. Mạng lưới đại lý đóng vai trò quan trọng trong việc tư vấn, báo giá, bán hàng, thi công và chăm sóc khách hàng cuối. Tuy nhiên, hoạt động vận hành của đại lý thường phân tán trên nhiều công cụ rời rạc như Excel, Zalo, file báo giá cũ, ảnh sản phẩm, file hồ sơ năng lực tự làm và ghi chú cá nhân.

Cách làm thủ công này tạo ra nhiều vấn đề. Đại lý mất thời gian khi làm hồ sơ giới thiệu, khó tạo báo giá đồng nhất, khó theo dõi báo giá nào đã gửi, báo giá nào đã chốt, báo giá nào đã trượt, đơn hàng nào đang sản xuất hoặc lắp đặt. Dữ liệu khách hàng và sản phẩm nằm rải rác, khiến đại lý khó tái sử dụng thông tin và khó quản trị công nợ, giá vốn, lợi nhuận.

Ở góc độ admin/doanh nghiệp, dữ liệu thị trường không được tập trung. Doanh nghiệp khó biết đại lý đang chào sản phẩm gì, báo giá cho khách hàng nào, mức giá thực tế đang nằm trong khoảng nào, nhóm sản phẩm nào chạy mạnh, tỷ lệ chốt của từng đại lý ra sao, và khu vực nào có nhu cầu cao. Thiếu dữ liệu này khiến việc hỗ trợ đại lý, thiết kế chính sách bán hàng, xây dựng bảng giá và phân tích thị trường thiếu cơ sở thực tế.

Dự án Đại Lý Số ra đời để giải quyết hai mục tiêu song song. Một là tạo ra công cụ đủ dễ dùng và đủ hữu ích để đại lý dùng hằng ngày. Hai là biến dữ liệu phát sinh từ hoạt động thật của đại lý thành hệ thống dữ liệu thị trường có cấu trúc cho admin/doanh nghiệp.

---

# 2. Phạm vi Hệ thống (Scope)

## 2.1. Trong phạm vi (In Scope)

Hệ thống bao gồm các nhóm chức năng sau:

Thứ nhất là xác thực và phân quyền. Hệ thống hỗ trợ đăng nhập bằng username và password, xác thực bằng JWT, phân quyền theo vai trò admin và dealer, bảo vệ các API quản trị, và đảm bảo dealer chỉ truy cập dữ liệu thuộc phạm vi đại lý của mình.

Thứ hai là quản lý đại lý và tài khoản dealer. Admin có thể tạo đại lý, cấp mã đại lý, tạo tài khoản đăng nhập, cập nhật thông tin đại lý, khóa hoặc mở lại trạng thái hoạt động, reset mật khẩu, xem tổng quan dữ liệu của từng đại lý và drill-down vào hồ sơ, báo giá, khách hàng, sản phẩm của đại lý đó.

Thứ ba là hồ sơ năng lực đại lý. Dealer có thể quản lý thông tin giới thiệu, chủ đại lý, địa chỉ, khu vực phục vụ, kinh nghiệm, đội ngũ, năng lực thi công, dịch vụ, cam kết, điểm mạnh, chỉ số nổi bật, lời chứng thực, lời kêu gọi hành động, logo, ảnh chủ đại lý, ảnh hero, ảnh kho/xưởng, ảnh đội ngũ, ảnh công trình, QR code và logo đối tác. Hồ sơ hỗ trợ nhiều template, màu thương hiệu và preview A4 để in hoặc xuất PDF qua trình duyệt.

Thứ tư là kho ảnh. Hệ thống có kho ảnh dùng chung do admin quản lý và kho ảnh riêng của từng dealer. Ảnh được lưu bằng Cloudinary, có metadata như tên và danh mục, có thể dùng lại trong hồ sơ hoặc báo giá. Dealer nhìn thấy ảnh chung của admin và ảnh riêng của mình; admin nhìn thấy toàn bộ ảnh.

Thứ năm là quản lý sản phẩm/catalog. Mỗi dealer có danh mục sản phẩm riêng với mã sản phẩm, tên sản phẩm, nhóm sản phẩm, mô tả, đơn vị tính mặc định, đơn giá mặc định và trạng thái hoạt động. Khi sản phẩm được đưa vào báo giá, thông tin sản phẩm được snapshot vào line item để báo giá cũ không bị thay đổi khi catalog bị sửa sau này.

Thứ sáu là quản lý khách hàng. Mỗi dealer có CRM mini để lưu khách hàng với mã khách hàng, tên khách hàng, người liên hệ, điện thoại, email, địa chỉ và ghi chú. Khách hàng được liên kết với báo giá để dealer có thể xem lịch sử báo giá theo từng khách.

Thứ bảy là tạo và quản lý báo giá. Dealer có thể tạo, sửa, xóa, xem, in và xuất báo giá. Báo giá bao gồm số báo giá, ngày báo giá, khách hàng, địa chỉ công trình, tiêu đề báo giá, thông tin đại lý có thể override theo từng báo giá, ghi chú hồ sơ, ghi chú thương mại, điều khoản thanh toán, tiến độ, bảo hành, nhóm hạng mục, line item, VAT, chiết khấu phần trăm, khoản cộng/trừ, ảnh minh họa và chú thích ảnh.

Thứ tám là tính toán báo giá. Hệ thống phải tính tạm tính, VAT, chiết khấu, khoản cộng/trừ và tổng cộng. Line item phải hỗ trợ nhập số lượng, rộng, cao, khối lượng/diện tích, đơn vị tính, đơn giá và thành tiền. Với các đơn vị như m2, md hoặc bộ, hệ thống hỗ trợ tự tính khối lượng theo quy tắc phù hợp, đồng thời vẫn cho phép dealer nhập thủ công khi cần.

Thứ chín là trạng thái báo giá và trạng thái đơn hàng. Mỗi báo giá có hai trục trạng thái độc lập: trạng thái báo giá và trạng thái đơn hàng. Trạng thái báo giá gồm Nháp, Chưa gửi, Đã gửi, Đã chốt và Đã trượt. Trạng thái đơn hàng gồm Chờ sản xuất, Sản xuất, Lắp đặt và Hoàn thiện. Khi báo giá ở trạng thái Đã trượt, trạng thái đơn hàng không còn ý nghĩa sản xuất và phải được xử lý phù hợp trên giao diện cũng như dữ liệu.

Thứ mười là tài chính báo giá/đơn hàng. Hệ thống phải phân biệt rõ tổng giá trị báo giá, doanh số, doanh thu thực tế, thanh toán thực tế, giá vốn, công nợ và lợi nhuận. Tổng giá trị báo giá là số tiền trên báo giá gửi khách. Doanh số là tổng giá trị báo giá đã được gửi đi hoặc đã xử lý trong pipeline bán hàng. Doanh thu thực tế là số tiền kỳ vọng hoặc thực tế được ghi nhận cho báo giá đã chốt, có thể khác tổng báo giá nếu sau khi chốt có giảm giá hoặc điều chỉnh. Thanh toán thực tế là số tiền khách đã trả. Công nợ là phần doanh thu/tổng giá trị còn chưa thanh toán theo quy tắc báo cáo được duyệt. Lợi nhuận là doanh thu hoặc tổng giá trị trừ giá vốn theo quy tắc báo cáo được duyệt.

Thứ mười một là dashboard dealer. Dealer có dashboard để xem KPI bán hàng, giá trị báo giá, giá trị đơn hàng, doanh thu, chi phí, lợi nhuận, công nợ, số đơn, báo cáo tài chính theo thời gian, trạng thái đơn hàng, trạng thái báo giá, tỷ lệ chuyển đổi, chỉ số khách hàng và nhóm sản phẩm đóng góp doanh thu.

Thứ mười hai là dashboard admin và dữ liệu chéo toàn hệ thống. Admin có dashboard tổng quan số đại lý, báo giá, doanh số, khách hàng, sản phẩm, top đại lý, top sản phẩm và biểu đồ theo tháng. Admin có thể xem dữ liệu báo giá, khách hàng, sản phẩm theo nhiều đại lý để phân tích thị trường, giá chào bán, sản phẩm phổ biến, hiệu suất dealer, khu vực hoạt động và tín hiệu nhu cầu.

Thứ mười ba là export và backup. Hệ thống hỗ trợ export dữ liệu báo giá của dealer ra Excel `.xlsx`, export dữ liệu admin theo từng nhóm như đại lý, báo giá, khách hàng, sản phẩm, tải database SQLite và tạo bản backup HTML dễ đọc cho admin.

Thứ mười bốn là audit log. Hệ thống ghi nhận các hành động nghiệp vụ quan trọng như tạo đại lý, tạo khách hàng, tạo báo giá, gửi báo giá, xác nhận/chốt báo giá, và các thao tác quản trị quan trọng khác theo định hướng mở rộng. Audit log phải lưu người thao tác, vai trò, đại lý liên quan, loại đối tượng, ID đối tượng, metadata, IP và thời gian.

## 2.2. Ngoài phạm vi v1 (Out of Scope)

Các chức năng sau không thuộc phạm vi bắt buộc của phiên bản v1, nhưng là định hướng có thể phát triển sau khi hệ thống có dữ liệu thật và quy trình vận hành ổn định:

Ứng dụng mobile native cho iOS/Android. Phiên bản v1 ưu tiên web responsive chạy tốt trên trình duyệt hiện đại.

ERP hoặc kế toán đầy đủ. Hệ thống chỉ quản lý báo giá, đơn hàng và tài chính cơ bản ở mức phục vụ dealer/admin; chưa thay thế phần mềm kế toán, tồn kho, hóa đơn điện tử hoặc ERP.

Thanh toán online. Hệ thống chưa xử lý cổng thanh toán, đối soát ngân hàng tự động hoặc thu tiền trực tuyến.

Zalo OA, SMS marketing và email automation hoàn chỉnh. Phiên bản v1 có thể hỗ trợ ghi nhận phương thức gửi hoặc mở công cụ gửi thủ công, nhưng các luồng gửi tự động, tracking nâng cao và chăm sóc khách hàng đa kênh là phần mở rộng.

Multi-tenant enterprise nâng cao. Hệ thống phục vụ mô hình admin/dealer trước; phân quyền nhiều tầng, tổ chức nhiều công ty, nhiều chi nhánh, nhiều vai trò nội bộ và chính sách dữ liệu phức tạp thuộc giai đoạn sau.

Server-side PDF. Phiên bản v1 ưu tiên preview và in/xuất PDF qua trình duyệt. Việc sinh PDF phía server, lưu bản PDF đã phát hành, ký số hoặc khóa phiên bản báo giá là phần mở rộng khi quy trình phát hành cần kiểm soát cao hơn.

---

# 3. Mô tả Tổng quan

## 3.1. Đối tượng Người dùng

Người dùng thứ nhất là admin hệ thống. Admin chịu trách nhiệm tạo và quản lý đại lý, quản lý tài khoản dealer, theo dõi dữ liệu toàn hệ thống, xem dashboard tổng quan, phân tích dữ liệu báo giá/khách hàng/sản phẩm, quản lý kho ảnh chung, xem audit log, export dữ liệu và tải backup khi cần.

Người dùng thứ hai là dealer hoặc chủ đại lý. Dealer dùng hệ thống để xây dựng hồ sơ năng lực, lưu ảnh, quản lý sản phẩm, quản lý khách hàng, tạo báo giá, gửi báo giá cho khách, cập nhật trạng thái báo giá, theo dõi trạng thái đơn hàng, nhập thanh toán/giá vốn và xem dashboard hoạt động kinh doanh của mình.

Người dùng thứ ba là nhân viên đại lý trong tương lai. Nhóm người dùng này có thể được phân quyền để tạo báo giá, cập nhật khách hàng, cập nhật trạng thái đơn hàng hoặc xem dashboard mà không nhất thiết có quyền sửa hồ sơ hoặc thay đổi các thiết lập quan trọng của đại lý.

Người dùng thứ tư là quản lý hoặc ban lãnh đạo trong tương lai. Nhóm người dùng này cần quyền xem báo cáo, phân tích thị trường, hiệu suất đại lý, biến động giá, sản phẩm phổ biến và các chỉ số vận hành mà không trực tiếp nhập liệu hằng ngày.

## 3.2. Luồng Người dùng (User Flow)

### Luồng 1: Admin tạo và quản lý đại lý

Bước 1. Admin đăng nhập vào hệ thống bằng tài khoản admin.

Bước 2. Admin truy cập trang quản lý đại lý và tạo đại lý mới bằng các thông tin: mã đại lý, tên đại lý, chủ đại lý, số điện thoại, email, địa chỉ, quận/huyện, tỉnh/thành, khu vực phục vụ, kinh nghiệm, quy mô đội ngũ, số công trình trung bình và giờ mở cửa.

Bước 3. Admin tạo tài khoản dealer tương ứng bằng username và password ban đầu.

Bước 4. Hệ thống lưu đại lý, tài khoản đăng nhập và liên kết tài khoản với dealer_id. Dealer chỉ truy cập được dữ liệu của chính đại lý đó.

Bước 5. Admin có thể sửa thông tin đại lý, khóa/mở trạng thái hoạt động, reset mật khẩu hoặc xem chi tiết dữ liệu của đại lý.

### Luồng 2: Dealer hoàn thiện hồ sơ năng lực

Bước 1. Dealer đăng nhập và truy cập trang Hồ sơ.

Bước 2. Dealer nhập thông tin giới thiệu, tagline, điểm mạnh, dịch vụ, cam kết, chỉ số nổi bật, lời chứng thực, thông tin CTA và các nội dung marketing khác.

Bước 3. Dealer upload hoặc thay thế các ảnh hồ sơ như logo, avatar chủ đại lý, ảnh hero, kho/xưởng, đội ngũ, công trình, QR code và logo đối tác.

Bước 4. Dealer chọn template hồ sơ, chỉnh màu thương hiệu và xem preview A4 trực tiếp.

Bước 5. Dealer lưu hồ sơ và dùng bản preview để in hoặc xuất PDF qua trình duyệt.

### Luồng 3: Dealer quản lý sản phẩm

Bước 1. Dealer truy cập trang Sản phẩm.

Bước 2. Dealer thêm sản phẩm với mã sản phẩm, tên sản phẩm, nhóm sản phẩm, mô tả, đơn vị tính mặc định và đơn giá mặc định.

Bước 3. Dealer có thể tìm kiếm, lọc theo nhóm, lọc theo trạng thái hoạt động, sửa thông tin sản phẩm hoặc xóa sản phẩm không còn sử dụng.

Bước 4. Khi tạo báo giá, dealer chọn sản phẩm từ catalog để tự động điền thông tin line item. Dữ liệu sản phẩm được snapshot vào báo giá để giữ nguyên lịch sử.

### Luồng 4: Dealer quản lý khách hàng

Bước 1. Dealer truy cập trang Khách hàng.

Bước 2. Dealer thêm khách hàng với mã khách hàng, tên khách hàng, người liên hệ, điện thoại, email, địa chỉ và ghi chú.

Bước 3. Hệ thống hỗ trợ gợi ý mã khách hàng theo định dạng tăng dần để dealer nhập liệu nhanh.

Bước 4. Dealer có thể tìm kiếm khách hàng, sửa thông tin khách hàng và xem các báo giá liên quan đến khách hàng đó.

### Luồng 5: Dealer tạo báo giá

Bước 1. Dealer truy cập trang Báo giá và bấm tạo báo giá mới.

Bước 2. Hệ thống gợi ý số báo giá theo ngày/năm, dealer chọn khách hàng hoặc tạo nhanh khách hàng mới.

Bước 3. Dealer nhập địa chỉ công trình, tiêu đề báo giá, ghi chú hồ sơ, ghi chú thương mại và các điều khoản thanh toán, tiến độ, bảo hành.

Bước 4. Dealer thêm nhóm hạng mục, thêm line item bằng cách chọn sản phẩm từ catalog hoặc nhập tự do. Mỗi line item có mã sản phẩm, tên sản phẩm, nhóm sản phẩm, mô tả, kích thước, khối lượng, số lượng, đơn vị tính, đơn giá và thành tiền.

Bước 5. Hệ thống tính tạm tính, chiết khấu, VAT, khoản bổ sung, khoản trừ và tổng cộng.

Bước 6. Dealer thêm ảnh minh họa báo giá bằng cách upload trực tiếp hoặc chọn từ kho ảnh, kèm chú thích ảnh.

Bước 7. Dealer xem preview báo giá, lưu nháp, in/xuất PDF hoặc quay lại danh sách báo giá.

### Luồng 6: Dealer gửi và cập nhật báo giá

Bước 1. Dealer hoàn thiện nội dung báo giá và chuyển trạng thái từ Nháp sang Chưa gửi khi báo giá đã sẵn sàng.

Bước 2. Dealer gửi báo giá cho khách bằng kênh phù hợp như Zalo, email, in giấy hoặc phương thức khác.

Bước 3. Dealer cập nhật trạng thái báo giá thành Đã gửi sau khi đã gửi cho khách.

Bước 4. Khi khách đồng ý mua, dealer cập nhật trạng thái thành Đã chốt. Khi khách không mua, dealer cập nhật trạng thái thành Đã trượt.

Bước 5. Hệ thống ghi nhận trạng thái để dashboard tính tỷ lệ chuyển đổi, doanh số, doanh thu và các báo cáo liên quan.

### Luồng 7: Dealer theo dõi đơn hàng và tài chính

Bước 1. Với báo giá đang xử lý như một đơn hàng, dealer cập nhật trạng thái đơn hàng: Chờ sản xuất, Sản xuất, Lắp đặt hoặc Hoàn thiện.

Bước 2. Dealer nhập số tiền khách đã thanh toán thực tế.

Bước 3. Dealer nhập giá vốn khi có dữ liệu chi phí.

Bước 4. Hệ thống tính công nợ và lợi nhuận theo quy tắc báo cáo được duyệt.

Bước 5. Dealer xem các chỉ số tài chính, đơn hàng, báo giá, khách hàng và nhóm sản phẩm trên dashboard.

### Luồng 8: Admin xem dashboard và dữ liệu thị trường

Bước 1. Admin đăng nhập và truy cập dashboard.

Bước 2. Hệ thống hiển thị KPI tổng quan về đại lý, báo giá, doanh số, khách hàng và sản phẩm.

Bước 3. Admin xem top đại lý, top sản phẩm, xu hướng theo tháng và khoảng giá thị trường theo nhóm sản phẩm.

Bước 4. Admin truy cập danh sách toàn bộ báo giá để xem khách hàng nào đang được báo giá, đại lý nào báo giá, giá trị bao nhiêu, trạng thái ra sao và thời điểm nào.

Bước 5. Admin truy cập dữ liệu khách hàng và sản phẩm toàn hệ thống để phân tích trùng lặp, nhu cầu thị trường, sản phẩm phổ biến và mức giá chào bán.

Bước 6. Admin export dữ liệu phục vụ phân tích offline hoặc tải backup để lưu trữ.

### Luồng 9: Quản lý kho ảnh

Bước 1. Admin upload ảnh vào kho chung để mọi dealer có thể sử dụng.

Bước 2. Dealer upload ảnh vào kho riêng của mình để dùng lại trong hồ sơ hoặc báo giá.

Bước 3. Người dùng có quyền phù hợp có thể sửa tên, danh mục hoặc xóa ảnh.

Bước 4. Khi chọn ảnh cho báo giá hoặc hồ sơ, hệ thống hiển thị ảnh từ kho chung và kho riêng theo quyền truy cập.

### Luồng 10: Audit và backup

Bước 1. Hệ thống ghi lại các thao tác quan trọng theo audit log.

Bước 2. Admin truy cập trang audit để lọc theo hành động, người dùng, đại lý, thời gian hoặc giới hạn số dòng.

Bước 3. Admin tải database SQLite hoặc bản HTML backup để kiểm tra và lưu trữ.

Bước 4. Hệ thống chạy migration và backup theo quy trình deploy/vận hành được cấu hình.

---

# 4. Đặc tả Yêu cầu

## 4.1. Yêu cầu chức năng (Functional Requirements)

FR-01: Hệ thống phải cho phép người dùng đăng nhập bằng username và password.

FR-02: Hệ thống phải xác thực API bằng JWT và trả về thông tin người dùng hiện tại khi token hợp lệ.

FR-03: Hệ thống phải hỗ trợ hai vai trò chính là admin và dealer.

FR-04: Hệ thống phải chặn dealer truy cập dữ liệu của đại lý khác.

FR-05: Hệ thống phải cho phép người dùng cập nhật thông tin cá nhân cơ bản và đổi mật khẩu.

FR-06: Hệ thống phải áp dụng rate limit cho API đăng nhập để giảm rủi ro brute force.

FR-07: Admin phải quản lý được danh sách đại lý với tìm kiếm, lọc trạng thái và xem số liệu cơ bản.

FR-08: Admin phải tạo được đại lý mới kèm tài khoản dealer.

FR-09: Admin phải cập nhật được thông tin đại lý.

FR-10: Admin phải khóa hoặc mở lại trạng thái hoạt động của đại lý.

FR-11: Admin phải reset được mật khẩu cho tài khoản dealer.

FR-12: Admin phải xem được chi tiết một đại lý gồm thông tin hồ sơ, ảnh, báo giá, khách hàng, sản phẩm và tổng số liệu liên quan.

FR-13: Dealer phải xem và cập nhật được hồ sơ đại lý của mình.

FR-14: Hồ sơ đại lý phải lưu được thông tin nhận diện, thông tin chủ đại lý, địa chỉ, tỉnh/thành, khu vực phục vụ, kinh nghiệm, đội ngũ, năng lực công trình và giờ mở cửa.

FR-15: Hồ sơ đại lý phải lưu được nội dung marketing gồm tagline, USP, dịch vụ, cam kết, lời chứng thực, CTA, badge, highlight và chỉ số nổi bật.

FR-16: Hồ sơ đại lý phải hỗ trợ các ảnh theo slot cố định: logo đại lý, avatar chủ, hero, kho/xưởng, đội ngũ, QR code, công trình và logo đối tác.

FR-17: Hồ sơ đại lý phải hỗ trợ nhiều template trình bày và cho phép chọn template sử dụng.

FR-18: Hồ sơ đại lý phải hỗ trợ màu thương hiệu chính và màu phụ để cá nhân hóa giao diện.

FR-19: Hồ sơ đại lý phải có preview A4 trực tiếp và hỗ trợ in/xuất PDF qua trình duyệt.

FR-20: Hệ thống phải có cơ chế lưu nháp cục bộ hoặc cảnh báo khi người dùng rời trang trong lúc hồ sơ chưa lưu.

FR-21: Hệ thống phải có kho ảnh chung do admin quản lý.

FR-22: Hệ thống phải có kho ảnh riêng của từng dealer.

FR-23: Ảnh phải được upload qua backend, kiểm tra loại file/kích thước và lưu trên Cloudinary.

FR-24: Admin phải xem, tìm kiếm, lọc, thêm, sửa metadata và xóa ảnh trong kho ảnh.

FR-25: Dealer phải xem được ảnh kho chung và ảnh kho riêng của mình.

FR-26: Dealer phải thêm, sửa metadata và xóa ảnh thuộc kho riêng của mình.

FR-27: Dealer phải quản lý được danh mục sản phẩm của đại lý.

FR-28: Sản phẩm phải có mã sản phẩm duy nhất trong phạm vi từng dealer.

FR-29: Sản phẩm phải có tên sản phẩm, nhóm sản phẩm, mô tả, đơn vị tính mặc định, đơn giá mặc định và trạng thái hoạt động.

FR-30: Dealer phải tìm kiếm và lọc sản phẩm theo từ khóa, nhóm sản phẩm và trạng thái hoạt động.

FR-31: Dealer phải tạo, xem, sửa và xóa sản phẩm.

FR-32: Khi sản phẩm được đưa vào báo giá, hệ thống phải snapshot thông tin sản phẩm vào line item.

FR-33: Dealer phải quản lý được danh sách khách hàng của đại lý.

FR-34: Khách hàng phải có mã khách hàng duy nhất trong phạm vi từng dealer.

FR-35: Hệ thống phải gợi ý mã khách hàng mới theo quy tắc tăng dần.

FR-36: Khách hàng phải lưu được tên khách hàng, người liên hệ, điện thoại, email, địa chỉ và ghi chú.

FR-37: Dealer phải tìm kiếm, xem, thêm và sửa khách hàng.

FR-38: Dealer phải xem được số lượng hoặc danh sách báo giá liên quan đến từng khách hàng.

FR-39: Dealer phải quản lý được danh sách báo giá của đại lý.

FR-40: Hệ thống phải gợi ý số báo giá mới theo ngày/năm và thứ tự phát sinh.

FR-41: Báo giá phải có header gồm số báo giá, ngày báo giá, khách hàng, địa chỉ công trình, ghi chú hồ sơ, ghi chú thương mại, tiêu đề báo giá và thông tin đại lý override khi cần.

FR-42: Báo giá phải có điều khoản thanh toán, tiến độ và bảo hành.

FR-43: Báo giá phải hỗ trợ nhiều nhóm hạng mục/section.

FR-44: Báo giá phải hỗ trợ line item thuộc section hoặc nhóm chưa phân loại.

FR-45: Line item phải lưu mã sản phẩm, tên sản phẩm, nhóm sản phẩm, mô tả, kích thước, khối lượng, số lượng, đơn vị tính, đơn giá và thành tiền.

FR-46: Hệ thống phải cho phép chọn sản phẩm từ catalog để tự động điền thông tin line item.

FR-47: Hệ thống phải cho phép nhập line item tự do không bắt buộc có product_id.

FR-48: Hệ thống phải hỗ trợ tính khối lượng/diện tích theo rộng, cao, số lượng và đơn vị tính phù hợp.

FR-49: Hệ thống phải cho phép người dùng nhập thủ công khối lượng/diện tích khi công thức tự động không phù hợp.

FR-50: Báo giá phải hỗ trợ VAT theo phần trăm.

FR-51: Báo giá phải hỗ trợ chiết khấu theo phần trăm.

FR-52: Báo giá phải hỗ trợ các khoản cộng hoặc trừ như vận chuyển, lắp đặt, phụ phí hoặc điều chỉnh khác.

FR-53: Hệ thống phải tính tạm tính, VAT, chiết khấu, khoản cộng/trừ và tổng cộng.

FR-54: Báo giá phải hỗ trợ tối đa 5 ảnh minh họa kèm chú thích.

FR-55: Ảnh báo giá phải có thể upload trực tiếp hoặc chọn từ kho ảnh.

FR-56: Dealer phải xem được preview báo giá trước khi in/xuất PDF.

FR-57: Dealer phải in hoặc xuất PDF báo giá qua trình duyệt.

FR-58: Dealer phải tạo được báo giá nháp trống để có ID phục vụ upload ảnh hoặc thao tác tiếp theo.

FR-59: Dealer phải lưu, sửa và xóa báo giá.

FR-60: Dealer phải xem nhanh báo giá từ danh sách mà không cần mở form sửa.

FR-61: Dealer phải export danh sách báo giá ra file Excel `.xlsx`, áp dụng các bộ lọc hiện tại khi xuất.

FR-62: Danh sách báo giá phải hỗ trợ tìm kiếm theo số báo giá, khách hàng hoặc nội dung liên quan.

FR-63: Danh sách báo giá phải hỗ trợ lọc theo trạng thái báo giá.

FR-64: Danh sách báo giá phải hỗ trợ lọc theo khách hàng.

FR-65: Danh sách báo giá phải hỗ trợ lọc theo trạng thái đơn hàng.

FR-66: Trạng thái báo giá phải gồm 5 trạng thái nghiệp vụ: Nháp, Chưa gửi, Đã gửi, Đã chốt, Đã trượt.

FR-67: Trạng thái Nháp dùng cho báo giá đang làm dở.

FR-68: Trạng thái Chưa gửi dùng cho báo giá đã hoàn thiện nhưng chưa gửi khách.

FR-69: Trạng thái Đã gửi dùng cho báo giá đã được gửi cho khách.

FR-70: Trạng thái Đã chốt dùng cho báo giá khách đã đồng ý mua.

FR-71: Trạng thái Đã trượt dùng cho báo giá khách không mua hoặc cơ hội không thành công.

FR-72: Trạng thái đơn hàng phải gồm Chờ sản xuất, Sản xuất, Lắp đặt và Hoàn thiện.

FR-73: Hệ thống phải tự xử lý trạng thái đơn hàng khi báo giá chuyển sang Đã trượt để tránh hiển thị quy trình sản xuất không còn ý nghĩa.

FR-74: Dealer phải cập nhật được trạng thái báo giá trực tiếp từ danh sách báo giá.

FR-75: Dealer phải cập nhật được trạng thái đơn hàng trực tiếp từ danh sách báo giá.

FR-76: Dealer phải cập nhật được thanh toán thực tế và giá vốn trực tiếp từ danh sách báo giá.

FR-77: Hệ thống phải tính công nợ từ tổng giá trị/doanh thu và thanh toán thực tế theo quy tắc báo cáo được duyệt.

FR-78: Hệ thống phải tính lợi nhuận từ tổng giá trị/doanh thu và giá vốn theo quy tắc báo cáo được duyệt.

FR-79: Hệ thống phải phân biệt rõ doanh số và doanh thu trong dashboard, export và nhãn giao diện.

FR-80: Doanh số phải phản ánh giá trị báo giá đã được đưa vào pipeline bán hàng.

FR-81: Doanh thu phải phản ánh giá trị đơn hàng đã chốt hoặc doanh thu thực tế theo định nghĩa nghiệp vụ được duyệt.

FR-82: Thanh toán thực tế phải phản ánh số tiền khách đã trả.

FR-83: Giá vốn phải phản ánh chi phí đầu vào của đơn hàng/báo giá.

FR-84: Công nợ phải phản ánh phần còn phải thu.

FR-85: Lợi nhuận phải phản ánh phần chênh lệch giữa doanh thu/tổng giá trị và giá vốn.

FR-86: Dashboard dealer phải có KPI tổng quan về giá trị đơn hàng, công nợ và số đơn.

FR-87: Dashboard dealer phải có báo cáo tài chính gồm doanh số, doanh thu, chi phí, lợi nhuận và công nợ.

FR-88: Dashboard dealer phải hỗ trợ xem dữ liệu theo tháng, năm hoặc toàn bộ thời gian.

FR-89: Dashboard dealer phải có báo cáo trạng thái đơn hàng.

FR-90: Dashboard dealer phải có báo cáo trạng thái báo giá và tỷ lệ chuyển đổi.

FR-91: Dashboard dealer phải có chỉ số khách hàng như tổng khách, khách mới trong kỳ và khách quay lại.

FR-92: Dashboard dealer phải có báo cáo nhóm sản phẩm gồm doanh thu, số đơn và tỷ trọng.

FR-93: Admin dashboard phải hiển thị KPI tổng quan toàn hệ thống: đại lý, báo giá, doanh số, khách hàng và sản phẩm.

FR-94: Admin dashboard phải có biểu đồ xu hướng theo tháng.

FR-95: Admin dashboard phải hiển thị top đại lý theo số báo giá hoặc giá trị.

FR-96: Admin dashboard phải hiển thị top sản phẩm hoặc nhóm sản phẩm phổ biến.

FR-97: Admin dashboard phải hiển thị phân tích khoảng giá theo nhóm sản phẩm.

FR-98: Admin phải xem được toàn bộ báo giá trên hệ thống theo quyền quản trị.

FR-99: Admin phải lọc toàn bộ báo giá theo từ khóa, trạng thái, đại lý và khoảng ngày.

FR-100: Admin phải xem được dữ liệu khách hàng chéo toàn hệ thống để phân tích nhu cầu và khả năng trùng lặp.

FR-101: Admin phải xem được dữ liệu sản phẩm chéo toàn hệ thống để phân tích sản phẩm phổ biến và khoảng giá thị trường.

FR-102: Admin phải export dữ liệu đại lý, báo giá, khách hàng và sản phẩm.

FR-103: Admin phải tải được database SQLite để backup.

FR-104: Admin phải tải được bản backup HTML dễ đọc để kiểm tra dữ liệu bằng trình duyệt.

FR-105: Hệ thống phải ghi audit log cho các hành động nghiệp vụ quan trọng.

FR-106: Audit log phải lưu thời gian, người thao tác, vai trò, đại lý liên quan, hành động, loại đối tượng, ID đối tượng, metadata và IP.

FR-107: Admin phải lọc audit log theo hành động, người dùng, đại lý, khoảng thời gian và giới hạn số dòng.

FR-108: Hệ thống phải có endpoint healthcheck để phục vụ kiểm tra tình trạng deploy.

FR-109: Hệ thống phải chạy migration database khi deploy để đảm bảo schema được cập nhật.

FR-110: Hệ thống phải chạy backup database theo quy trình vận hành trước hoặc trong quá trình start app.

## 4.2. Yêu cầu phi chức năng (Non-functional Requirements)

NFR-01 Hiệu năng. Các trang danh sách chính như đại lý, sản phẩm, khách hàng và báo giá phải phản hồi nhanh với dữ liệu ở quy mô pilot và có khả năng mở rộng bằng pagination khi dữ liệu tăng.

NFR-02 Toàn vẹn dữ liệu. Mã đại lý phải duy nhất toàn hệ thống. Username phải duy nhất toàn hệ thống. Mã sản phẩm và mã khách hàng phải duy nhất trong phạm vi từng dealer. Số báo giá phải duy nhất trong phạm vi từng dealer.

NFR-03 Cô lập dữ liệu. Tất cả truy vấn dealer phải giới hạn theo dealer_id của người dùng hiện tại. Dealer không được xem hoặc sửa dữ liệu của dealer khác.

NFR-04 Bảo mật. Mật khẩu phải được hash bằng thuật toán phù hợp trước khi lưu. JWT secret, Cloudinary credential và các cấu hình nhạy cảm phải nằm trong biến môi trường, không hard-code trong mã nguồn.

NFR-05 Quyền riêng tư. Dữ liệu khách hàng, báo giá và tài chính là dữ liệu nhạy cảm. Hệ thống phải có quy tắc rõ ràng về quyền truy cập của admin, dealer và các vai trò mở rộng trong tương lai.

NFR-06 Upload an toàn. Hệ thống chỉ cho phép upload định dạng ảnh hợp lệ, giới hạn kích thước file và xử lý lỗi upload rõ ràng.

NFR-07 Khả năng mở rộng. Cấu trúc code phải tách rõ routes, controllers, services, models, database, config và frontend assets để dễ mở rộng module.

NFR-08 Khả năng vận hành. Hệ thống phải có healthcheck, migration, backup và hướng dẫn deploy rõ ràng.

NFR-09 Sao lưu và khôi phục. Database SQLite phải được lưu ở volume bền vững khi deploy và có cơ chế backup thủ công hoặc tự động để giảm rủi ro mất dữ liệu.

NFR-10 Tương thích trình duyệt. Giao diện phải hoạt động trên các trình duyệt hiện đại như Chrome, Edge và Firefox.

NFR-11 Tương thích Excel. File export phải mở được bằng Microsoft Excel và Google Sheets. File báo giá dealer xuất `.xlsx` phải có header, định dạng số tiền và dữ liệu dễ đọc.

NFR-12 Trải nghiệm người dùng. Giao diện phải dễ dùng với dealer không chuyên kỹ thuật, ưu tiên thao tác nhanh, label rõ, form dễ nhập, bảng dễ lọc và workflow không làm mất dữ liệu đang nhập.

NFR-13 Responsive. Các màn hình chính phải sử dụng được trên laptop và màn hình nhỏ. Các bảng rộng như báo giá cần hỗ trợ scroll ngang hoặc bố cục phù hợp.

NFR-14 In ấn/PDF. Hồ sơ và báo giá phải được tối ưu cho khổ A4, đảm bảo nội dung không bị vỡ layout khi in hoặc lưu PDF từ trình duyệt.

NFR-15 Khả năng bảo trì. Các thuật ngữ tài chính, trạng thái báo giá và trạng thái đơn hàng phải được định nghĩa tập trung, nhất quán giữa backend, frontend, export và dashboard.

NFR-16 Khả năng quan sát. Các lỗi quan trọng, thao tác nghiệp vụ và thay đổi dữ liệu nhạy cảm phải có log/audit đủ để truy vết.

---

# 5. Từ điển Dữ liệu

Phần này mô tả ý nghĩa nghiệp vụ của các nhóm dữ liệu chính trong hệ thống. Đây không phải mô tả chi tiết database, mà là mô tả để đội phát triển, kinh doanh và quản lý hiểu cùng một ngôn ngữ.

## 5.1. Nhóm tài khoản/người dùng

**Người dùng (user).** Đại diện cho tài khoản đăng nhập vào hệ thống. Mỗi user có username, password hash, họ tên, vai trò, trạng thái, thời điểm đăng nhập gần nhất và thông tin tạo/cập nhật.

**Username.** Tên đăng nhập duy nhất của user. Hệ thống sử dụng username thay vì email để phù hợp với thói quen dealer.

**Mật khẩu.** Chuỗi bí mật do người dùng nhập khi đăng nhập. Mật khẩu không được lưu dạng plain text mà phải hash trước khi lưu.

**Vai trò (role).** Xác định phạm vi quyền của user. Hai vai trò chính là admin và dealer.

**Dealer ID.** Liên kết user role dealer với thực thể đại lý tương ứng. Admin không nhất thiết có dealer_id.

**Trạng thái tài khoản.** Cho biết tài khoản đang hoạt động hay bị vô hiệu hóa.

## 5.2. Nhóm đại lý

**Đại lý (dealer).** Thực thể kinh doanh chính trong hệ thống. Đại lý có hồ sơ, sản phẩm, khách hàng, báo giá, ảnh và dashboard riêng.

**Mã đại lý (dealer_code).** Mã định danh duy nhất của đại lý, ví dụ DL-001. Mã này dùng để quản trị, phân biệt đại lý và liên kết dữ liệu.

**Tên đại lý.** Tên cửa hàng, công ty hoặc thương hiệu đại lý hiển thị trên hồ sơ và báo giá.

**Chủ đại lý.** Người đại diện chính của đại lý.

**Thông tin liên hệ.** Gồm điện thoại, email, địa chỉ, quận/huyện, tỉnh/thành.

**Khu vực phục vụ.** Mô tả phạm vi địa lý hoặc thị trường mà đại lý nhận phục vụ.

**Kinh nghiệm.** Số năm hoạt động hoặc mô tả năng lực kinh nghiệm của đại lý.

**Quy mô đội ngũ.** Số lượng nhân sự, đội thi công hoặc quy mô vận hành.

**Số công trình/tháng.** Chỉ số thể hiện năng lực xử lý công việc trung bình của đại lý.

**Giờ mở cửa.** Thông tin phục vụ khách hàng và hiển thị trên hồ sơ.

## 5.3. Nhóm hồ sơ đại lý

**Hồ sơ năng lực.** Trang giới thiệu chuyên nghiệp của đại lý, dùng để gửi khách hàng hoặc in thành PDF.

**Tagline.** Câu mô tả ngắn thể hiện định vị của đại lý.

**USP.** Điểm bán hàng khác biệt, giải thích vì sao khách hàng nên chọn đại lý.

**Dịch vụ.** Danh sách hoặc mô tả các dịch vụ đại lý cung cấp.

**Cam kết.** Các cam kết về chất lượng, tiến độ, bảo hành, tư vấn hoặc thi công.

**Lời chứng thực.** Trích dẫn nhận xét từ khách hàng hoặc nội dung tạo độ tin cậy.

**CTA.** Lời kêu gọi hành động, ví dụ liên hệ tư vấn, gọi hotline hoặc quét QR.

**Badge.** Các nhãn ngắn làm nổi bật uy tín, kinh nghiệm, phạm vi phục vụ hoặc chứng nhận.

**Highlight.** Các điểm mạnh nổi bật như thi công nhanh, bảo hành rõ, đội ngũ riêng, báo giá minh bạch.

**Metric.** Chỉ số định lượng như số năm kinh nghiệm, số công trình, số khách hàng hoặc quy mô đội ngũ.

**Template hồ sơ.** Mẫu trình bày hồ sơ. Hệ thống hỗ trợ nhiều template để dealer chọn phong cách phù hợp.

**Màu thương hiệu.** Màu chính và màu phụ dùng để cá nhân hóa hồ sơ theo nhận diện của đại lý.

## 5.4. Nhóm ảnh

**Ảnh hồ sơ.** Ảnh được gắn vào slot cụ thể trong hồ sơ đại lý.

**Logo đại lý.** Ảnh nhận diện thương hiệu của đại lý.

**Avatar chủ đại lý.** Ảnh người đại diện/chủ đại lý.

**Hero.** Ảnh lớn tạo ấn tượng đầu tiên trong hồ sơ.

**Kho/xưởng.** Ảnh thể hiện năng lực cơ sở vật chất.

**Đội ngũ.** Ảnh nhân sự, kỹ thuật hoặc thi công.

**Công trình.** Ảnh dự án/công trình đã thực hiện.

**QR code.** Mã QR để khách hàng liên hệ hoặc truy cập kênh của đại lý.

**Logo đối tác.** Logo thương hiệu, nhà cung cấp hoặc đối tác liên quan.

**Kho ảnh chung.** Kho ảnh do admin upload, mọi dealer có thể nhìn thấy và sử dụng.

**Kho ảnh riêng.** Kho ảnh do dealer upload, chỉ dealer đó và admin nhìn thấy.

**Public ID.** Mã định danh ảnh trên Cloudinary để phục vụ quản lý hoặc xóa ảnh.

## 5.5. Nhóm sản phẩm

**Sản phẩm.** Một mặt hàng hoặc dịch vụ được dealer đưa vào catalog và sử dụng khi tạo báo giá.

**Mã sản phẩm.** Mã duy nhất trong phạm vi từng dealer, dùng để tìm kiếm và chọn nhanh khi báo giá.

**Tên sản phẩm.** Tên hiển thị của sản phẩm.

**Nhóm sản phẩm.** Phân loại sản phẩm như cửa nhôm, cửa cuốn, phụ kiện, thi công, vận chuyển hoặc nhóm do dealer tự đặt.

**Mô tả.** Thông tin chi tiết về cấu hình, chất liệu, thông số hoặc ghi chú sản phẩm.

**Đơn vị tính mặc định.** Đơn vị thường dùng khi báo giá, ví dụ m2, md, bộ, cái hoặc đơn vị tự nhập.

**Đơn giá mặc định.** Giá gợi ý ban đầu khi sản phẩm được chọn vào báo giá.

**Trạng thái hoạt động.** Cho biết sản phẩm còn được dùng trong báo giá mới hay không.

**Snapshot sản phẩm.** Bản sao thông tin sản phẩm được lưu trong line item báo giá tại thời điểm tạo báo giá.

## 5.6. Nhóm khách hàng

**Khách hàng.** Cá nhân, hộ gia đình, nhà thầu, công ty hoặc tổ chức mà dealer tư vấn và báo giá.

**Mã khách hàng.** Mã định danh duy nhất trong phạm vi từng dealer, dùng để quản lý CRM.

**Tên khách hàng.** Tên người mua, tên công ty hoặc tên thường gọi.

**Người liên hệ.** Người đại diện trao đổi trực tiếp nếu khác tên khách hàng.

**Điện thoại.** Số điện thoại liên hệ chính.

**Email.** Địa chỉ email nếu có.

**Địa chỉ.** Địa chỉ khách hàng hoặc địa điểm liên hệ.

**Ghi chú.** Thông tin tự do về nhu cầu, lịch sử trao đổi, yêu cầu đặc biệt hoặc lưu ý chăm sóc.

## 5.7. Nhóm báo giá

**Báo giá.** Tài liệu chào giá cho khách hàng, đồng thời là đơn vị theo dõi cơ hội bán hàng và đơn hàng.

**Số báo giá.** Mã định danh báo giá duy nhất trong phạm vi từng dealer, ví dụ BG-2026-001.

**Ngày báo giá.** Ngày phát hành hoặc lập báo giá.

**Địa chỉ công trình.** Địa điểm thi công hoặc nơi áp dụng báo giá.

**Tiêu đề báo giá.** Tên báo giá hoặc mô tả ngắn về công trình/hạng mục.

**Ghi chú hồ sơ.** Ghi chú phục vụ phần hồ sơ hoặc thông tin nội bộ liên quan báo giá.

**Ghi chú thương mại.** Ghi chú hiển thị cho khách hoặc điều kiện bán hàng.

**Thanh toán.** Điều khoản thanh toán, đặt cọc hoặc phương thức thanh toán.

**Tiến độ.** Thời gian sản xuất, giao hàng, lắp đặt hoặc hoàn thiện.

**Bảo hành.** Điều khoản bảo hành.

**Tạm tính.** Tổng giá trị line item trước VAT, chiết khấu và điều chỉnh.

**VAT.** Thuế giá trị gia tăng tính theo phần trăm.

**Chiết khấu.** Khoản giảm giá tính theo phần trăm.

**Tổng cộng.** Giá trị cuối cùng trên báo giá gửi khách.

**Phương thức gửi.** Cách báo giá được gửi cho khách, ví dụ Zalo, email, in giấy hoặc khác.

**Thời điểm gửi.** Thời gian báo giá được đánh dấu đã gửi.

## 5.8. Nhóm hạng mục báo giá

**Section.** Nhóm hạng mục trong báo giá, dùng để gom các line item theo khu vực, loại sản phẩm hoặc giai đoạn thi công.

**Line item.** Một dòng sản phẩm/dịch vụ trong báo giá.

**Thứ tự.** Vị trí hiển thị của section hoặc line item trong báo giá.

**Kích thước.** Rộng, cao hoặc thông số đo đạc phục vụ tính khối lượng.

**Khối lượng/diện tích.** Giá trị dùng để nhân đơn giá, có thể tự tính hoặc nhập tay.

**Số lượng.** Số bộ, số cái hoặc số lần áp dụng.

**Đơn vị tính.** Đơn vị hiển thị cho line item.

**Đơn giá.** Giá trên một đơn vị tính.

**Thành tiền.** Giá trị của line item sau khi nhân khối lượng/số lượng với đơn giá.

**Adjustment.** Khoản cộng hoặc trừ trong báo giá như vận chuyển, lắp đặt, phụ phí hoặc chiết khấu đặc biệt.

**Ảnh báo giá.** Ảnh minh họa đính kèm báo giá.

**Chú thích ảnh.** Nội dung mô tả ảnh báo giá.

## 5.9. Nhóm trạng thái báo giá và đơn hàng

**Nháp.** Báo giá đang làm dở, chưa sẵn sàng gửi khách.

**Chưa gửi.** Báo giá đã hoàn thiện nội dung nhưng chưa gửi khách.

**Đã gửi.** Báo giá đã được gửi cho khách qua một kênh cụ thể.

**Đã chốt.** Khách hàng đồng ý mua, báo giá trở thành đơn hàng.

**Đã trượt.** Khách hàng không mua hoặc cơ hội bán hàng thất bại.

**Chờ sản xuất.** Đơn hàng đã phát sinh nhưng chưa bắt đầu sản xuất.

**Sản xuất.** Đơn hàng đang trong giai đoạn sản xuất/gia công.

**Lắp đặt.** Đơn hàng đang trong giai đoạn lắp đặt tại công trình.

**Hoàn thiện.** Đơn hàng đã hoàn tất lắp đặt/bàn giao.

## 5.10. Nhóm tài chính

**Tổng giá trị báo giá.** Số tiền cuối cùng trên báo giá gửi khách, thường tương ứng tổng cộng.

**Doanh số.** Tổng giá trị báo giá đã đi vào pipeline bán hàng, thường dùng để đo hoạt động chào giá.

**Doanh thu thực tế.** Giá trị đơn hàng được ghi nhận sau khi khách chốt, có thể khác tổng giá trị báo giá nếu có điều chỉnh sau chốt.

**Thanh toán thực tế.** Số tiền khách đã trả.

**Giá vốn.** Chi phí đầu vào hoặc chi phí thực hiện đơn hàng.

**Công nợ.** Phần tiền còn phải thu từ khách.

**Lợi nhuận.** Phần chênh lệch giữa doanh thu/tổng giá trị và giá vốn.

**Chi phí.** Tổng giá vốn hoặc các khoản chi phí được ghi nhận trong kỳ báo cáo.

**Tỷ lệ chuyển đổi.** Tỷ lệ báo giá đã chốt trên tổng báo giá đã gửi hoặc tổng cơ hội có ý nghĩa theo quy tắc báo cáo được duyệt.

## 5.11. Nhóm audit, export và backup

**Audit log.** Nhật ký thao tác quan trọng để truy vết ai đã làm gì, lúc nào, với dữ liệu nào.

**Action.** Loại hành động trong audit log, ví dụ tạo đại lý, tạo khách hàng, tạo báo giá, gửi báo giá, chốt báo giá.

**Entity type.** Loại đối tượng bị tác động, ví dụ dealer, customer, quotation, product hoặc image.

**Entity ID.** ID của đối tượng bị tác động.

**Metadata.** Dữ liệu bổ sung mô tả hành động, có thể lưu dạng JSON.

**Export.** Tệp dữ liệu được xuất ra để phân tích offline, thường là CSV hoặc Excel `.xlsx` tùy module.

**Backup database.** Bản sao SQLite database phục vụ khôi phục hoặc lưu trữ.

**Backup HTML.** Bản xuất dữ liệu dạng HTML dễ mở bằng trình duyệt để kiểm tra nhanh.

---

# 6. Tổng kết

Đại Lý Số là hệ thống số hóa vận hành đại lý trong ngành cửa và vật liệu xây dựng, tập trung vào hai giá trị cốt lõi: giúp đại lý làm việc chuyên nghiệp hơn và giúp admin/doanh nghiệp có dữ liệu thị trường thật hơn.

Với dealer, hệ thống là công cụ hằng ngày để tạo hồ sơ năng lực, lưu ảnh, quản lý sản phẩm, lưu khách hàng, tạo báo giá đẹp, theo dõi trạng thái báo giá, trạng thái đơn hàng, thanh toán, công nợ và lợi nhuận. Dealer có thể tái sử dụng dữ liệu sẵn có thay vì làm thủ công lại từng lần, đồng thời có dashboard để nắm tình hình kinh doanh của chính mình.

Với admin/doanh nghiệp, hệ thống là nền tảng thu thập và phân tích dữ liệu thị trường từ hoạt động thực tế của đại lý. Dữ liệu báo giá giúp nhận diện sản phẩm đang chạy, mức giá chào bán, khu vực có nhu cầu, khách hàng đang được tư vấn, hiệu suất từng dealer và tỷ lệ chuyển đổi theo thời gian. Đây là cơ sở quan trọng để hỗ trợ đại lý, thiết kế chính sách kinh doanh, điều chỉnh bảng giá, phát hiện cơ hội thị trường và quản trị mạng lưới hiệu quả hơn.

Về kỹ thuật, hệ thống sử dụng Node.js, Express, SQLite, frontend HTML/Tailwind/Alpine, Cloudinary cho ảnh và ExcelJS cho xuất file Excel. Kiến trúc cần tiếp tục giữ rõ ràng giữa routes, controllers, services, models, database và frontend để dễ mở rộng các module như phân quyền nhiều cấp, CRM nâng cao, chia sẻ public link, gửi email/Zalo thật, server-side PDF, tích hợp kế toán/ERP và chuyển đổi sang database lớn hơn khi quy mô tăng.

Định hướng phát triển tiếp theo là hoàn thiện lớp quản trị dữ liệu thị trường cho admin, chuẩn hóa sâu hơn các khái niệm tài chính như doanh số/doanh thu/thanh toán/giá vốn/công nợ/lợi nhuận, mở rộng audit log, cải thiện khả năng import/export, bổ sung follow-up CRM, quản lý phiên bản báo giá, link chia sẻ báo giá/hồ sơ và các cơ chế bảo mật/phân quyền phù hợp khi số lượng dealer tăng.
