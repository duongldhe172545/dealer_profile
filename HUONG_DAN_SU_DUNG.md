# Hướng dẫn sử dụng — Đại Lý Số

> Tài liệu này dành cho **2 đối tượng**:
> - **Phần A** — Quản trị viên (Admin / sếp): theo dõi toàn bộ đại lý, xem báo cáo
> - **Phần B** — Đại lý: tự làm hồ sơ + tạo báo giá gửi khách
>
> Nếu mới dùng lần đầu, đọc đúng phần của mình thôi là đủ.

---

## A. DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)

### A1. Đăng nhập lần đầu

1. Mở trình duyệt → vào địa chỉ web của hệ thống (vd `https://daily-so.up.railway.app`)
2. Nhập tên đăng nhập + mật khẩu admin _(được cung cấp khi bàn giao hệ thống)_
3. **Đổi mật khẩu ngay**: vào góc phải header click tên → trang **Tài khoản của tôi** → mục "Đổi mật khẩu". Đặt mật khẩu tối thiểu 8 ký tự.

### A2. Trang Tổng quan

Sau khi login, mặc định mở trang **Tổng quan**. Trang này hiển thị nhanh sức khoẻ hệ thống:

- **4 thẻ KPI** trên cùng: Tổng đại lý / Báo giá tháng này / Doanh thu / Khách hàng
- **Biểu đồ doanh thu** 6 tháng gần nhất
- **Top 5 đại lý** doanh thu cao nhất
- **Top 5 sản phẩm** bán chạy nhất

Tất cả tự cập nhật theo dữ liệu thật, không cần làm gì.

### A3. Quản lý đại lý

Menu trên cùng → **Đại lý**.

**Thêm đại lý mới**:
1. Click nút **+ Thêm đại lý**
2. Nhập thông tin cơ bản: Mã đại lý (chỉ chữ và số, ví dụ `DL-001`), Tên đại lý, Chủ đại lý, SĐT, Email, Địa chỉ, Khu vực phụ trách
3. Phần **Tài khoản đăng nhập** (chỉ hiện khi tạo mới):
   - Tên đăng nhập: chỉ chữ thường + số, không dấu (vd `minhtam`)
   - Mật khẩu: gõ tay 1 mật khẩu tạm (vd `Daily2026!`). Đại lý sẽ tự đổi sau.
4. Click **Thêm** → tài khoản tạo xong. Đưa username + password cho đại lý là họ login được.

**Sửa thông tin đại lý**:
- Click nút **Sửa** ở dòng đại lý cần chỉnh → sửa các trường → **Lưu**.
- Lưu ý: KHÔNG sửa được mã đại lý sau khi đã tạo.

**Reset password cho đại lý** (khi đại lý quên mật khẩu):
- Click nút **Đặt lại mật khẩu** ở dòng đại lý → nhập mật khẩu mới → **Lưu**
- Báo mật khẩu mới cho đại lý. Họ login bằng mật khẩu mới.

**Khoá / mở khoá tài khoản đại lý**:
- Click nút **Khoá** để chặn đại lý đó đăng nhập (hợp đồng hết hạn, vi phạm...). Click lại để mở.

**Xem chi tiết đại lý**:
- Click vào dòng đại lý → mở trang chi tiết với 3 tab:
  - **Thông tin**: tất cả thông tin liên hệ + quy mô
  - **Hồ sơ**: hồ sơ marketing đại lý đang dùng
  - **Hoạt động**: số báo giá đã tạo, doanh thu

### A4. Xem tất cả báo giá (cross-dealer)

Menu → **Tất cả báo giá**.

- Bảng liệt kê báo giá của **mọi đại lý** trong hệ thống
- Filter theo: trạng thái (nháp/đã gửi/đã chốt), khoảng ngày, đại lý, khách hàng
- Click vào dòng để xem chi tiết báo giá đó (đầy đủ items, ảnh, ghi chú)
- **Export CSV** (nút góc phải bảng) để mở trong Excel — dùng cho báo cáo cấp trên

### A5. Audit log — theo dõi thao tác

Menu → **Audit log**.

Ghi lại 5 hành động quan trọng có dấu thời gian + người làm:
- Tạo đại lý mới
- Tạo khách hàng mới
- Tạo báo giá
- Gửi báo giá
- Chốt báo giá (confirmed)

Dùng để rà soát khi có nghi ngờ (vd "ai đã sửa báo giá #BG-001?").

### A6. Export dữ liệu

Mỗi bảng (Đại lý, Báo giá, Khách hàng, Sản phẩm) đều có nút **Tải xuống CSV** ở góc phải. File mở được bằng Excel, có sẵn dấu BOM UTF-8 → tiếng Việt không bị lỗi font.

Dùng cho:
- Báo cáo định kỳ gửi sếp lớn
- Phân tích sâu (vẽ biểu đồ Excel, pivot table)
- Backup dữ liệu thủ công

---

## B. DÀNH CHO ĐẠI LÝ

### B1. Đăng nhập lần đầu

1. Mở địa chỉ web hệ thống _(admin cấp cho)_ trên trình duyệt — máy tính hoặc điện thoại đều được
2. Nhập **Tên đăng nhập** + **Mật khẩu** admin cấp
3. **Đổi mật khẩu ngay**: góc phải header → click tên mình → **Tài khoản của tôi** → "Đổi mật khẩu". Nhập mật khẩu cũ (admin cho) + mật khẩu mới (tối thiểu 8 ký tự).

> 💡 **Tip**: Lưu địa chỉ web vào bookmark trình duyệt (hoặc "Thêm vào màn hình chính" nếu dùng điện thoại) để vào nhanh.

### B2. Trang chính sau khi login

Bạn sẽ thấy 5 menu trên cùng:

| Menu | Để làm gì |
|---|---|
| Trang chính | Tóm tắt nhanh: số báo giá tháng, doanh thu, ... |
| Hồ sơ | Làm trang giới thiệu đại lý (như brochure) |
| Sản phẩm | Lưu danh mục sản phẩm để báo giá nhanh |
| Khách hàng | Lưu thông tin KH để dùng lại |
| Báo giá | Tạo + gửi báo giá cho khách |

**Trình tự đề xuất cho người mới**:
1. Vào **Hồ sơ** → điền thông tin đại lý + upload vài ảnh (xem B3)
2. Vào **Sản phẩm** → thêm 5-10 sản phẩm hay bán (xem B4)
3. Khi có khách hỏi giá → vào **Báo giá** tạo báo giá mới (xem B6). Hệ thống tự lưu khách hàng.

### B3. Làm Hồ sơ đại lý

Hồ sơ là 1 trang A4 đẹp giới thiệu năng lực của bạn cho khách xem. Có thể in ra giấy hoặc xuất PDF gửi qua Zalo/email.

**Bước 1 — Vào menu Hồ sơ**

Bên trái là form nhập liệu (4 tab), bên phải là **xem trước** (live preview) — gõ tới đâu thấy tới đó.

**Bước 2 — Điền 4 tab thông tin**

- **Tab 1. Thông tin chung**: Tên đại lý, Chủ đại lý, SĐT, Email, Địa chỉ, Khu vực phủ, Giờ mở cửa, Số năm kinh nghiệm, Quy mô đội ngũ, Dự án/tháng
- **Tab 2. Mô tả & năng lực**:
  - **Tagline**: câu định vị ngắn (vd "Khảo sát hôm nay, lắp đặt ngày mai")
  - **Năng lực nổi bật**: liệt kê mỗi dòng 1 ý (vd "Khảo sát tận nơi 24h", "Bảo hành 24 tháng")
  - **Sản phẩm & dịch vụ**: tương tự
  - **Cam kết chăm sóc**: tương tự
  - **Phản hồi khách hàng**: 1 câu quote tích cực
  - **Câu giới thiệu đối tác**: tự động điền theo tên đại lý, có thể chỉnh tay
- **Tab 3. Điểm nhấn & KPI**:
  - 3 huy hiệu nhỏ (vd: "Đã xác thực", "Có kho/xưởng", "Hỗ trợ 24h")
  - 3 ưu điểm nổi bật (số 1, 2, 3 lớn)
  - 3 chỉ số ấn tượng (vd "35+" dự án/tháng, "24h" phản hồi, "4.8/5" đánh giá)
  - Mô tả 3 ảnh công trình tiêu biểu
- **Tab 4. Hình ảnh**: tải lên các ảnh. Mỗi ô có hướng dẫn kích thước đề xuất:
  - Logo đại lý (vuông 500×500)
  - Ảnh chủ đại lý (vuông 600×600)
  - Ảnh bìa hero (ngang 21:9 hoặc 16:9)
  - Ảnh kho/xưởng, ảnh đội ngũ (1, 2)
  - 3 ảnh công trình thực tế
  - QR code liên hệ (vuông 500×500)
  - **5 logo đối tác** (ngang ~3:1, nền trắng) — hiển thị ở khối "đối tác chiến lược" cuối hồ sơ

> 💡 Ảnh tự động được nén nhỏ khi tải lên (giảm ~5MB còn ~200KB) nên không sợ chậm.

**Bước 3 — Chọn mẫu hồ sơ (template)**

Phía trên ô xem trước có 5 ô **T1 T2 T3 T4 T5** — bấm để đổi giao diện. Chọn cái nào bạn thích nhất.

**Bước 4 — Lưu hồ sơ**

- Mỗi lần gõ, hệ thống tự lưu **nháp** vào trình duyệt (F5 hay mất mạng không mất việc)
- Khi xong, bấm **Lưu hồ sơ** (góc trên phải) để đẩy lên hệ thống thật. Khách sẽ thấy bản đã lưu khi quét QR.

**Bước 5 — Xuất PDF hoặc In**

- Bấm **📄 Xuất PDF** → mở hộp thoại in của trình duyệt
- Chọn **"Lưu thành PDF"** (Save as PDF) → file PDF 1 trang A4 sẵn sàng gửi khách
- Hoặc chọn máy in thật để in giấy

### B4. Quản lý sản phẩm

Menu → **Sản phẩm**.

**Mục đích**: lưu sẵn các sản phẩm hay bán để khi tạo báo giá chỉ cần chọn — không phải gõ lại mỗi lần.

**Thêm sản phẩm**:
1. Bấm **+ Thêm sản phẩm**
2. Điền:
   - **Mã sản phẩm** (vd `NA-XINGFA01`) — bắt buộc, không trùng nhau
   - **Nhóm sản phẩm** (vd "Cửa nhôm")
   - **Mô tả** (vd "Hệ nhôm cầu cách nhiệt, kính hộp Low-E")
   - **Đơn vị tính** (bộ / m² / kg / cái...)
   - **Đơn giá mặc định** (số tiền, vd `2500000`)
3. **Lưu** → sản phẩm vào danh sách.

**Bộ lọc**:
- Ô tìm: gõ mã / mô tả / nhóm
- Dropdown nhóm: lọc theo nhóm sản phẩm
- Dropdown trạng thái: "Đang bán" / "Ngừng bán"

**Lưu ý**: Khi tạo báo giá, bạn vẫn có thể **nhập tự do** tên sản phẩm/đơn giá mà không cần có sẵn ở đây — danh mục chỉ để tiện thôi.

### B5. Quản lý khách hàng

Menu → **Khách hàng**. Hoạt động tương tự Sản phẩm:

- **+ Thêm khách hàng** → điền: Tên KH (bắt buộc), Người liên hệ, SĐT, Email, Địa chỉ, Ghi chú
- Mã KH có thể để trống → hệ thống tự sinh (vd `KH-0001`)
- Mỗi dòng có nút **Xem báo giá** (nếu KH đã có báo giá) — bấm để xem nhanh

> 💡 Khi tạo báo giá lần đầu cho 1 khách mới, có thể tạo khách hàng trực tiếp trong form báo giá — không cần vào menu này trước.

### B6. Tạo báo giá

Đây là chức năng quan trọng nhất. Menu → **Báo giá** → bấm **+ Báo giá mới**.

**Bước 1 — Thông tin chung**

- **Số báo giá**: tự sinh theo định dạng `BG-YYYYMMDD-NN`, có thể sửa
- **Ngày báo giá**: mặc định hôm nay
- **Khách hàng**: chọn từ dropdown (sẵn có) HOẶC bấm **+ Thêm KH mới** ngay trong form
- **Địa chỉ công trình**: nơi sẽ lắp đặt (có thể khác địa chỉ KH)

**Bước 2 — Thêm sản phẩm vào báo giá**

Click **+ Thêm sản phẩm** → 1 dòng mới hiện ra. Mỗi dòng có 11 cột:

| Cột | Ý nghĩa | Ghi chú |
|---|---|---|
| STT | Tự đánh số | |
| Mã SP | Gõ vào hoặc chọn từ catalog | Nếu chọn từ catalog, các ô bên cạnh tự điền |
| Nhóm | Hiển thị nhóm SP | Tự lấy theo Mã SP |
| Mô tả | Mô tả chi tiết | Tự lấy hoặc gõ tay |
| Rộng / Dài | Kích thước (mm hoặc cm) | **Chỉ để hiển thị**, không tính tiền |
| SL | Số lượng | Bắt buộc |
| ĐVT | Đơn vị tính | Tự lấy hoặc gõ tay |
| Đơn giá | Giá 1 đơn vị | Bắt buộc |
| Thành tiền | **= SL × Đơn giá** | Tự tính, không sửa được |

Thêm bao nhiêu dòng cũng được. Xoá dòng: bấm dấu **✕** đỏ cuối dòng.

**Bước 3 — Phí khác + VAT**

- **Chi phí vận chuyển**: VND
- **Chi phí lắp đặt**: VND
- **VAT (%)**: mặc định 10, sửa được

Hệ thống tự tính:
- **Tạm tính** = tổng thành tiền các dòng
- **VAT** = (tạm tính + phí) × %VAT
- **Tổng cộng** = tạm tính + phí + VAT

**Bước 4 — Thông tin thương mại** (tuỳ chọn nhưng nên có)

- **Thanh toán**: vd "30% đặt cọc, 70% khi giao hàng"
- **Tiến độ**: vd "10 ngày kể từ khi đặt cọc"
- **Bảo hành**: vd "24 tháng theo hãng"

**Bước 5 — Ảnh đính kèm** (tuỳ chọn)

Tải lên tới **5 ảnh** (vd ảnh mặt bằng, ảnh sản phẩm tham khảo). Có thể gõ chú thích dưới mỗi ảnh.

**Bước 6 — Ghi chú**

- **Ghi chú hồ sơ**: nội bộ — KH không thấy
- **Ghi chú thương mại**: hiện trên bản báo giá KH thấy

**Bước 7 — Lưu nháp / In / Gửi**

Ở góc trên có 4 nút:

- **Lưu nháp**: lưu lại, vẫn ở trạng thái nháp, có thể sửa
- **📄 Xuất PDF**: tạo file PDF báo giá 1 trang A4 đẹp (gồm logo, info đại lý, bảng items, ảnh đính kèm)
- **✉ Gửi email**: mở app email mặc định với báo giá đã đính kèm sẵn (subject + body)
- **Đánh dấu đã gửi**: chuyển trạng thái từ "nháp" → "đã gửi" (đếm vào KPI)

### B7. Theo dõi báo giá

Menu **Báo giá** → bảng liệt kê tất cả báo giá của bạn.

Trạng thái:
- 🟡 **Nháp** — chưa gửi, vẫn sửa được
- 🔵 **Đã gửi** — đã gửi cho khách
- 🟢 **Đã chốt** — khách đã đồng ý mua
- 🔴 **Hủy** — khách không lấy

Sửa trạng thái bằng nút **Cập nhật trạng thái** ở chi tiết báo giá.

Filter trên đầu bảng: theo trạng thái, khoảng ngày, khách hàng.

### B8. Đổi mật khẩu / Cập nhật profile cá nhân

Góc phải header → click tên mình → vào trang **Tài khoản của tôi**:

- Đổi tên hiển thị (hiện ở header)
- Đổi mật khẩu (cần nhập mật khẩu cũ + 2 lần mật khẩu mới)
- Xem ngày tạo tài khoản, lần đăng nhập gần nhất

---

## C. CÂU HỎI THƯỜNG GẶP (FAQ)

**Q: Tôi quên mật khẩu, làm sao?**
A: Báo admin reset hộ. Admin vào menu Đại lý → tìm tài khoản → bấm **Đặt lại mật khẩu** → nhập mật khẩu mới → báo lại cho bạn.

**Q: Hồ sơ tôi lỡ chỉnh sai, có khôi phục được không?**
A: Hệ thống không tự sao lưu lịch sử hồ sơ. Tuy nhiên: trước khi bấm **Lưu hồ sơ**, mọi chỉnh sửa chỉ là nháp trong trình duyệt — đóng tab/F5 sẽ giữ nguyên bản đã lưu cũ. Chỉ khi bấm **Lưu hồ sơ** thì mới ghi đè.

**Q: Tôi tải ảnh lên có giới hạn không?**
A: Mỗi ảnh tối đa 5MB. Hệ thống tự nén còn ~200KB nên không lo dung lượng. Định dạng JPG/PNG/WEBP đều được.

**Q: Báo giá xuất PDF in ra bị mờ / lệch?**
A:
- Trong hộp thoại in (sau khi bấm Xuất PDF), chọn **"Lưu thành PDF"** thay vì in trực tiếp — chất lượng cao hơn.
- Tắt tuỳ chọn "Headers and footers" trong dialog in để không có chữ ngày giờ + URL lạ.
- Khổ giấy chọn **A4**, lề **Mặc định** hoặc **None**.

**Q: Đổi template hồ sơ có mất dữ liệu không?**
A: Không. Đổi T1 → T2 → T3 chỉ đổi cách trình bày, dữ liệu giữ nguyên. Mỗi template có cách sắp xếp khác nhau — chọn cái hợp gu.

**Q: Khách hàng cũ tôi đã tạo, có thể chỉnh sửa không?**
A: Được. Menu Khách hàng → bấm **Sửa** ở dòng khách đó. Lưu ý: nếu đổi tên KH, các báo giá cũ vẫn giữ tên mới (vì là cùng 1 khách).

**Q: Tôi xoá nhầm sản phẩm thì sao?**
A: Báo giá đã tạo trước đó **không bị ảnh hưởng** (vì hệ thống đã chụp lại thông tin SP tại lúc tạo). Bạn chỉ cần tạo lại SP đó trong catalog nếu muốn dùng tiếp.

**Q: Tôi có thể tạo báo giá cho 2 khách cùng lúc không?**
A: Mở 2 tab trình duyệt, tạo 2 báo giá riêng. Hệ thống không khoá session.

**Q: Đại lý khác có thấy được dữ liệu của tôi không?**
A: KHÔNG. Mỗi đại lý chỉ thấy báo giá, KH, SP của riêng mình. Chỉ admin tổng mới thấy chéo các đại lý.

**Q: Mã đại lý của tôi đặt ở đâu trên hồ sơ?**
A: Có hiển thị trên các template (góc trái hoặc footer tuỳ template). Đây là mã định danh, ko cần cho khách biết — nhưng dùng để admin tra cứu dễ.

**Q: Tôi quên gửi báo giá, hệ thống có nhắc không?**
A: Hiện tại chưa có. Hãy tự đánh dấu "Đã gửi" sau khi gửi để theo dõi.

---

## D. Liên hệ hỗ trợ

- **Vấn đề kỹ thuật** (không login được, lỗi mất dữ liệu, web không tải...): liên hệ admin / quản trị viên hệ thống.
- **Yêu cầu thêm tính năng / báo lỗi giao diện**: gửi mô tả chi tiết + ảnh chụp màn hình cho admin để chuyển đội dev.
- **Cập nhật hệ thống mới**: admin sẽ thông báo khi có thay đổi (template mới, tính năng mới).

---

> 📌 **Mẹo cuối**: Hệ thống chạy 100% trên web — không cần cài đặt phần mềm. Có internet là dùng được. Trên điện thoại nhỏ thì nên xoay ngang khi tạo báo giá để bảng items rộng rãi hơn.
