# Plan v4 — BG + Đơn hàng + Báo cáo dashboard

> Tài liệu này tổng hợp yêu cầu từ ảnh mockup Excel + 11 ý đã chốt với user + **bổ sung từ sếp**, **chưa phải code**.
> Mục đích: align hiểu, review chỗ chưa hợp lý, lên plan chi tiết + ước lượng workload.
>
> **Cập nhật mới nhất** (từ ảnh + ý sếp): bổ sung dashboard layout chi tiết (3 KPI cards + 5 sections cụ thể) + clarify "Đã trượt" + nút Xuất Excel + Tải per row. Xem mục **0. Bổ sung từ sếp** ngay dưới.

---

## 0. Bổ sung từ sếp (ảnh mới)

### 0.1. Bảng list BG — sếp khẳng định 15 cột theo Excel
```
NGÀY | KHÁCH HÀNG | CÔNG TRÌNH
| [Tình trạng BG] (badge) | [Tình trạng đơn hàng] (badge)
| DOANH THU | THANH TOÁN | CÔNG NỢ | GIÁ VỐN | LỢI NHUẬN
| XEM | SỬA | XOÁ | TẢI
```
- Trên cùng có: thanh tìm kiếm + 2 filter dropdown (Tình trạng BG / Tình trạng đơn hàng) + **nút "Xuất Excel"** + **nút "+ Tạo báo giá mới"** + nút "QUẢN LÝ"
- **Đề xuất 10 cột gộp của tôi (mục 3.3) phải bỏ** — sếp muốn full 15 cột. Trên mobile vẫn dùng card view.
- **"Đã trượt"** xuất hiện trong badge mẫu → có thể là trạng thái mới (xem mục 0.4)

### 0.2. Dashboard — bố cục 2 tầng theo ý sếp

**Tầng trên (KPI hero — 3 con số to nhất)**:
```
┌─────────────────────┬─────────────────┬─────────────────┐
│ 1,250,000,000 đ     │ 320,000,000 đ   │ 47              │
│ Tổng giá trị đơn    │ Công nợ         │ Số đơn hàng     │
└─────────────────────┴─────────────────┴─────────────────┘
```
3 cards lớn ngay đầu trang — đập vào mắt trước.

**Tầng giữa — Bộ lọc kỳ xem**:
- Filter theo tháng / năm / **Kỳ xem** (custom range from-to)
- Áp dụng cho TẤT CẢ sections phía dưới

**Tầng dưới — 5 sections**:

| Section | Hiển thị | Biểu đồ |
|---|---|---|
| **A. BC Tài chính** | 5 con số: Tổng giá trị báo giá, Tổng giá trị đơn hàng, Lợi nhuận, Chi phí, Công nợ | Có (line chart doanh thu/lợi nhuận theo tháng) |
| **B. BC Đơn hàng** | Tổng số đơn + count theo `order_status`: chưa sx / sx / lắp đặt / hoàn thiện | Có (pie chart breakdown) |
| **C. BC Báo giá** | Tổng số BG + count theo `status`: nháp / chưa gửi / đã gửi / đã chốt / đã huỷ (đã trượt?) | Có + **Tỉ lệ chuyển đổi** |
| **D. Chỉ số khách hàng** | KH mới (tháng/năm) · Tổng số KH · KH quay lại (≥ 2 đơn) | Không bắt buộc |
| **E. Nhóm sản phẩm** | Top nhóm SP theo Doanh thu + Số đơn (sort desc) | Có (bar chart top 6 nhóm) |

> ⚠ Sếp ghi "D. Tương tự phần BC về BG" — đoán là **chỉ số khách hàng** (giữ pattern 5 sections mockup cũ), không phải lặp BC báo giá. **Cần confirm với sếp** trước khi code.

### 0.3. Phân biệt 3 khái niệm tiền (sếp tách rõ)

| Tên | Công thức / Nguồn | Hiển thị ở đâu |
|---|---|---|
| **Tổng giá trị báo giá** | Σ `quotations.tong_cong` (giá báo cho khách trên PDF) | Tầng A — chỉ số "tổng giá trị báo giá" |
| **Tổng giá trị đơn hàng** | Σ `doanh_thu_thuc` (số thực thu, có thể giảm so với BG) | Tầng A + KPI hero |
| **Lợi nhuận** | Σ `doanh_thu_thuc − gia_von` | Tầng A |
| **Chi phí** | Σ `gia_von` | Tầng A |
| **Công nợ** | Σ `doanh_thu_thuc − thanh_toan_thuc` | Tầng A + KPI hero |

→ **Tại bảng list BG**, cột "DOANH THU" thực tế là số `doanh_thu_thuc` (thực thu). KHÔNG phải `tong_cong` (giá trên BG). Cần label rõ.

### 0.4. "Đã trượt" — trạng thái mới?

Trong ảnh có badge "Đã trượt" ở 1 row BG. Có 2 cách hiểu:
- **(a)** = "Đã huỷ" — sếp gọi tên khác. Cùng 1 status `da_huy`.
- **(b)** Là trạng thái RIÊNG biệt với "Đã huỷ":
  - Đã trượt = khách không chốt (deal failed) — passive
  - Đã huỷ = dealer chủ động huỷ
- → **Cần hỏi sếp**: 1 hay 2 status?

### 0.5. Nút mới cần build

| Nút | Chức năng đề xuất |
|---|---|
| **Xuất Excel** (toàn bảng) | Export bảng list BG đang xem (đã filter) thành file .xlsx hoặc .csv |
| **Tải** (per row) | Export 1 BG ra PDF (đã có `exportPDF()` trong BG editor — gọi lại tương tự) |
| **QUẢN LÝ** (góc phải) | ❓ Không rõ — có thể là chế độ "Quản lý bảng" (chọn cột hiển thị, sắp xếp). **Cần hỏi sếp**. |

### 0.6. Sếp gửi mockup HTML hoàn chỉnh — `dashboard_baogia_donhang_v7.html`

Đọc file đó thấy mọi thứ chi tiết hơn nhiều. **Override các giả định trước đó**.

> **⚠ User feedback sau khi sếp gửi mockup v7 — phải override tiếp các điểm dưới đây**:
> 1. **"Đã trượt" = "Đã huỷ"** (1 status thôi, đổi tên cho hợp ngữ cảnh sales)
> 2. **Nhóm SP** lấy DYNAMIC từ `products.nhom_sp` của dealer (KHÔNG cố định 6 nhóm)
> 3. **Doanh số** vs **Doanh thu** — định nghĩa lại theo ý sếp (xem mục 0.7 dưới)
> 4. **Xuất file .xlsx** (không phải CSV)
> 5. **Status BG vẫn 5 trạng thái** (Nháp + Chưa gửi + Đã gửi + Đã chốt + Đã trượt) — mockup v7 chỉ vẽ 4 nhưng user muốn 5
> 6. Bảng 15 cột: dùng **horizontal scroll** trên mobile (không cần card view như tôi đề xuất)


#### Layout tổng:
- **1 page duy nhất** với **2 tabs**:
  - **Tab 1 — Quản lý báo giá & đơn hàng** (= bảng list BG)
  - **Tab 2 — Báo cáo** (= dashboard 5 sections)
- Phía trên 2 tabs có **HERO** chung: title + 3 chip nhỏ (Tổng BG, Đơn hàng theo dõi, KH quay lại) + 4 progress bars "Tiến độ đơn hàng" (Chờ sản xuất / Sản xuất / Lắp đặt / Hoàn thiện)

→ **Khác plan của tôi**: tôi chia thành 2 trang riêng (`/dealer/quotations.html` + `/dealer/index.html`). Mockup gộp 1 page với tabs.
→ **Đề xuất**: giữ 2 page riêng nhưng share component header (Hero + tab navigation). Đỡ phải load lại khi tab tài nguyên lớn.

#### Trạng thái BG — **5 trạng thái** (user chốt giữ 5, không rút gọn như mockup v7 vẽ)
- `nhap` (Nháp — đang soạn dở)
- `chua_gui` (Chưa gửi — đã xong nhưng chưa gửi cho khách)
- `da_gui` (Đã gửi)
- `da_chot` (Đã chốt)
- `da_truot` (Đã trượt — alias của "Đã huỷ", chỉ đổi label)

→ Mockup v7 chỉ vẽ 4 (gộp Nháp + Chưa gửi). User muốn giữ tách biệt 5 trạng thái như đã trao đổi từ đầu.
→ Section C dashboard sẽ có **5 progress bars** thay vì 4 trong mockup.

#### Trạng thái đơn hàng — 4 trạng thái
- `cho_san_xuat` (Chờ sản xuất — KHÔNG phải "Chưa sản xuất" như tôi đoán)
- `san_xuat`
- `lap_dat`
- `hoan_thien`

#### Filter báo cáo — đơn giản hơn:
- Dropdown 1: **Chế độ dữ liệu** (Theo tháng / Theo năm)
- Dropdown 2: **Kỳ xem** (list các tháng/năm có data)
- **KHÔNG có custom date range from-to** → đỡ phức tạp UI

#### Bảng list BG — **16 cột** (không phải 15)
Thêm cột **Mã KH** đầu tiên:
```
Mã KH | Số BG | Ngày | Khách hàng | Công trình
| [Tình trạng BG] | [Tình trạng đơn hàng]
| Doanh thu | Thanh toán | Công nợ | Giá vốn | Lợi nhuận
| Xem | Sửa | Xoá | Tải
```

→ Tổng 16 cells. Cột "DOANH THU" trên bảng = `doanh_thu_thuc` (= tổng giá trị đơn hàng), KHÔNG phải `tong_cong` BG.

#### Section A — BC Tài chính chi tiết
Hiển thị bảng + biểu đồ:

| Chỉ số | Hiển thị |
|---|---|
| **Doanh số tháng** | Series 6 tháng: `T1: 132M • T2: 158M • ... • T6: 235M` *(= Σ tong_cong BG mỗi tháng)* |
| **Doanh thu tháng** | Series 6 tháng tương tự *(= Σ doanh_thu_thuc)* |
| **Doanh số năm** | `2025: 2.42B • 2026: 2.78B • 2027: 3.18B` |
| **Doanh thu năm** | Tương tự |
| **Công nợ** | Số của kỳ xem hiện tại (vd "Tháng 6: 157M") |
| **Lợi nhuận** | Số của kỳ xem hiện tại |
| **Biểu đồ cột stacked** | 2 series: Doanh thu (xanh) + Lợi nhuận (xanh lá) theo tháng |

→ **Phân biệt 2 từ chuyên dụng** (cực kỳ quan trọng — sếp lưu ý #1):
- **Doanh số** = tổng giá trị BG = Σ `quotations.tong_cong`
- **Doanh thu** = tổng giá trị đơn hàng = Σ `doanh_thu_thuc`
- Đừng nhầm lẫn 2 cái này.

#### Section B — BC Đơn hàng
- Số đơn hàng theo bộ lọc (số to)
- Badge "Theo tháng 6" cho biết filter đang dùng
- Tổng giá trị đơn hàng theo bộ lọc (= Σ doanh_thu_thuc)
- 4 progress bars + count:
  - Đơn chưa sản xuất (vd 1)
  - Sản xuất (vd 2)
  - Lắp đặt (vd 1)
  - Hoàn thiện (vd 2)

#### Section C — BC Báo giá
- 4 progress bars: Nháp / Đã gửi / Đã chốt / Đã trượt
- **Tỉ lệ chuyển đổi** = Chốt / Đã gửi → 1 con số % to + mini progress bar
- **CHỈ HIỂN THỊ MỘT CHỖ** — sếp lưu ý không lặp lại nhiều lần

→ **Câu 9 của tôi** (lifetime vs period) đã rõ: chỉ tính theo period filter, không cần dual.

#### Section D — Chỉ số khách hàng (3 metric cards)
- Số KH mới + badge "Tháng 6"
- Tổng số KH + badge "Theo bộ lọc báo cáo"
- Số KH quay lại (≥ 2 đơn) + badge "Nhóm khách tốt"

#### Section E — Nhóm sản phẩm (bảng)
| Nhóm SP | Doanh thu | Số đơn | **Tỉ trọng doanh thu (%)** | Biểu đồ (mini bar) |
|---|---|---|---|---|
| Cửa nhôm | 68M | 2 | 31% | ▰▰▰▱▱▱▱▱▱▱ |
| ... | | | | |

→ **Nhóm SP lấy DYNAMIC từ `products.nhom_sp`** của dealer hiện tại (DISTINCT). KHÔNG hardcode 6 nhóm như mockup.
→ Đếm doanh thu theo từng nhóm = Σ `quotation_items.thanh_tien` GROUP BY `nhom_sp` (lấy từ items đã snapshot tại BG).
→ Số đơn = đếm distinct quotation_id có items thuộc nhóm SP đó (1 BG có nhiều nhóm chỉ đếm 1 lần cho mỗi nhóm).
→ Sắp xếp giảm dần theo doanh thu. Mỗi đại lý sẽ có set nhóm khác nhau.

#### Hero progress bars (trên cùng — trước tabs)
```
Tiến độ đơn hàng tổng quan
Chờ sản xuất  ━━━━━░░░░░  5 đơn
Sản xuất       ━━━━━━━░░░  8 đơn
Lắp đặt        ━━━░░░░░░░  4 đơn
Hoàn thiện     ━━━━━━░░░░  7 đơn
```
Đếm tổng số đơn theo `order_status` (toàn bộ thời gian, không filter).

#### Lưu ý quan trọng từ user:
> 1. **Doanh thu = tổng giá trị đơn hàng** (≠ tổng giá trị báo giá!)
> 2. **Biểu đồ phải có** (Section A stacked bar, các section khác mini progress bars)
> 3. "Tỉ lệ chuyển đổi" chỉ hiển thị 1 chỗ
> 4. Bộ lọc đồng bộ tất cả sections

---

### 0.7. Doanh số vs Doanh thu — định nghĩa cuối cùng (theo ý sếp + tôi check kỹ)

User truyền lời sếp:
> "tổng giá trị báo giá đã gửi (tính cả đã huỷ) là **doanh số**"
> "tổng giá trị các báo giá đã chốt là **doanh thu**"

User cũng note: "sếp tôi có thể cũng hơi loạn → mày check kỹ nhé".

Tôi check kỹ — đây là 2 chỉ số khác nhau, dùng cho 2 mục đích:

| Chỉ số | Công thức | Ý nghĩa |
|---|---|---|
| **Doanh số** | Σ `tong_cong` của BG có status ∈ `{da_gui, da_chot, da_truot}` (đã gửi đi cho khách, kể cả sau đó trượt) | Đánh giá **hoạt động bán hàng** — đã chào hàng được bao nhiêu giá trị, kể cả khách không chốt |
| **Doanh thu** | Σ `doanh_thu_thuc` của BG có status = `da_chot` (đã chốt — khách OK mua) | **Tiền sẽ về** — sau khi khách chốt, có thể giảm giá thêm nên dùng `doanh_thu_thuc` (default = tong_cong, dealer sửa được) |

**Per BG (cột "Doanh thu" trên bảng list)** = `doanh_thu_thuc` của riêng BG đó.

**Dashboard tổng**:
- Doanh số tháng/năm = Σ tong_cong (BG đã gửi)
- Doanh thu tháng/năm = Σ doanh_thu_thuc (BG đã chốt)
- Lợi nhuận = Σ (doanh_thu_thuc − gia_von) của BG đã chốt
- Công nợ = Σ (doanh_thu_thuc − thanh_toan_thuc) của BG đã chốt (chưa thanh toán hết)
- Chi phí = Σ gia_von của BG đã chốt

→ Có thể có chỗ "loạn" sếp đề cập: trong Excel BG mẫu, doanh thu = 250M = tong_cong (vì không giảm). Nếu sau này dealer giảm thêm cho khách (BG báo 250M nhưng chốt 240M), thì doanh_thu_thuc = 240M. Lúc đó:
- Doanh số = 250M (giá báo cho khách)
- Doanh thu = 240M (số khách OK mua)

Logic này đúng nghiệp vụ ngành sales. **Cần sếp confirm**.

> ❓ **Câu hỏi quan trọng cần sếp duyệt**:
> Khi dealer giảm giá thêm sau chốt (vd BG 250M, KH chốt với deal 240M), Doanh thu = 240M hay 250M?
> - Cách 1 (đề xuất): 240M (= doanh_thu_thuc, tiền thực thu sẽ về)
> - Cách 2: 250M (= tong_cong, "tổng giá trị BG" như sếp nói)
>
> Khác biệt nhỏ nếu dealer ít giảm giá, lớn nếu thường xuyên giảm. Cần chọn 1.

---

## 1. Tóm tắt yêu cầu

User muốn mở rộng dự án theo 2 hướng:

**A. Bảng list báo giá hiện tại** thêm **7 cột mới**:
1. Tình trạng BG (dropdown 5 trạng thái)
2. Tình trạng đơn hàng (dropdown 4 trạng thái)
3. Doanh thu (nhập tay, mặc định = Tổng cộng BG)
4. Thanh toán (nhập tay)
5. Công nợ (auto = DT − Thanh toán)
6. Giá vốn (nhập tay, 1 ô tổng)
7. Lợi nhuận (auto = DT − Giá vốn)

**B. Dashboard 5 sections** thay cho dashboard hiện tại:
1. BC Tài chính (doanh số/doanh thu/công nợ/lợi nhuận theo tháng-năm + biểu đồ)
2. BC Đơn hàng (đếm theo `order_status` + biểu đồ)
3. BC Báo giá (đếm theo `status` + Tỉ lệ chuyển đổi)
4. Chỉ số khách hàng (KH mới / tổng KH / KH quay lại)
5. Nhóm sản phẩm (Top theo doanh thu + số đơn + biểu đồ)

---

## 2. 11 ý user đã chốt — diễn giải lại

| # | User trả lời | Hiểu thành | Ghi chú |
|---|---|---|---|
| 1 | Restart local | ✓ đã restart | — |
| 2 | "Đơn hàng = báo giá luôn" | Mọi BG đều có `order_status` song song với `status` BG | 2 trục state độc lập trên cùng 1 row |
| 3 | Nháp = làm dở · Chưa gửi = xong nhưng chưa gửi · user tự click chuyển | Cần thêm 1 trạng thái BG so với hiện tại (đang có 4: `draft/sent/confirmed/cancelled`) | Map: `nhap` + `chua_gui` thay vì 1 `draft` |
| 4 | Phề = đã huỷ | Map `cancelled` | Đổi label hiển thị thành "Đã huỷ" |
| 5 | order_status mặc định = "Chưa sản xuất", user chỉnh sau | DEFAULT mọi BG mới: `order_status = 'chua_sx'` | — |
| 6 | Doanh thu thực mặc định = Tổng cộng BG | Khi BG vừa lưu lần đầu: `doanh_thu_thuc = tong_cong`. User edit sau | Edit độc lập với tong_cong (không sync lại) |
| 7 | Giá vốn 1 ô tổng | Không break down (NVL/NC/VC) — đơn giản cho v1 | — |
| 8 | UX cho đại lý u40-u50 | Ưu tiên **modal** với button to, **dropdown** kiểu `<select>` 1 tap mở list — không inline edit cell nhỏ | Mobile-first |
| 9 | "Tỉ lệ chuyển đổi lifetime vs period filter là sao?" | Giải đáp dưới ↓ | — |
| 10 | Lợi nhuận = DT − Giá vốn | Confirm | — |
| 11 | Top nhóm SP tính từ tất cả BG | Tính trên TẤT CẢ BG (kể cả nháp/huỷ?) | **Đề xuất loại trừ huỷ** — xem mục 3 |

### Giải đáp ý 9 — Tỉ lệ chuyển đổi

Tỉ lệ chuyển đổi = số BG được khách chốt ÷ số BG đã gửi cho khách. Đo độ hiệu quả bán hàng.

- **Lifetime** = tính từ trước tới nay. Vd: từ ngày mở shop tới giờ gửi 100 BG, chốt 35 → tỉ lệ 35%.
- **Period filter** = chỉ tính trong khoảng thời gian filter (vd tháng 5/2026). Vd tháng này gửi 10 BG chốt 4 → 40%.

**Đề xuất**: hiện **cả 2** trên dashboard để user thấy trend:
```
Tỉ lệ chuyển đổi
  Tháng 5/2026:  42% (4/10)
  Toàn thời gian: 35% (35/100)
```

---

## 3. Đánh giá yêu cầu — Hợp lý / Cần xem lại

### ✓ Hợp lý
- **2 trục state song song** (BG status + order status): match nghiệp vụ ngành nội thất / xây dựng VN — báo giá xong là tiến hành sản xuất + lắp đặt
- **Doanh thu thực ≠ Tổng cộng**: cho phép giảm giá thêm sau, hoặc cộng phụ phí phát sinh
- **Giá vốn tự nhập**: đại lý nhỏ thường nắm tổng cost trong đầu, không cần module phức tạp
- **5 trạng thái BG**: `nhap → chua_gui → da_gui → da_chot → da_huy` đầy đủ cho workflow bán hàng
- **Tỉ lệ chuyển đổi**: KPI chuẩn ngành — rất hữu ích để đánh giá năng lực

### ⚠ Cần xem lại

**3.1. Nháp vs Chưa gửi — có thật sự cần tách?**
- Hai trạng thái này khá gần nhau. Cả 2 đều = "chưa send cho khách".
- Lý do user muốn: muốn đánh dấu BG nào đã hoàn chỉnh sẵn sàng gửi (chưa gửi) vs BG đang đùn đó dở dang (nháp).
- **OK chốt giữ 2 trạng thái** — overhead chỉ 1 lần chuyển status, không phức tạp.

**3.2. order_status cho BG đã huỷ — meaningless**
- BG `da_huy` không cần `order_status` vì không sản xuất gì.
- **Đề xuất**: khi user chuyển status BG → `da_huy`, tự động set `order_status = null` (ẩn dropdown này). Logic ngược lại: khi BG đang ở status khác `da_huy`, `order_status` luôn có giá trị (default `chua_sx`).

**3.3. Bảng list BG sẽ có 15 cột — không vừa màn hình**
- Hiện tại: 8 cột (Số BG · Ngày · KH · Công trình · Số dòng SP · Tổng cộng · Trạng thái · Thao tác)
- Mockup yêu cầu thêm 7 cột → **15 cột** → không hợp lý cho desktop, càng tệ cho mobile.
- **Đề xuất sửa lại layout**:
  - **Cột "Trạng thái" hiện tại** → split thành 2 dropdown nhỏ (BG status + Order status) trong cùng 1 cell stack vertical
  - **Cột "💰 Tài chính"** mới — hiện gọn: "DT 250M · Nợ 220M · LN 50M" 3 dòng nhỏ. Click cell → mở **modal** sửa cả 4 ô (Doanh thu, Thanh toán, Giá vốn). Lợi nhuận + Công nợ auto.
  - **Total cột mới = 2** (gộp lại) thay vì 7 → bảng 10 cột vẫn quản lý được.

**3.4. Top nhóm SP — tính từ tất cả BG?**
- Bao gồm cả BG **nháp** + **đã huỷ** sẽ làm số liệu sai (nháp chưa chắc thật, huỷ thì không phát sinh doanh thu).
- **Đề xuất**: chỉ tính từ BG có status ∈ `{da_gui, da_chot}` (đã có giá trị bán hàng). Loại trừ `nhap, chua_gui, da_huy`.
- Có thể thêm filter trong dashboard: "Chỉ tính BG đã chốt" toggle.

**3.5. Báo cáo cho admin?**
- Mockup chỉ vẽ cho dealer. Admin có cần xem tổng hợp tất cả đại lý không?
- **Đề xuất v1**: chỉ làm cho dealer. Admin v2 nếu cần (có sẵn `admin-stats.controller.js` để mở rộng).

**3.6. Filter tháng/năm dashboard — default**
- Default = tháng hiện tại? Hay cả năm? Hay 30 ngày gần nhất?
- **Đề xuất**: default = **30 ngày gần nhất**. Có nút "Tháng này" / "Năm này" / "Tất cả thời gian" để toggle.

**3.7. Mobile dashboard 5 sections**
- 5 sections + nhiều biểu đồ → màn đth scroll dài.
- **Đề xuất**: chuyển sang **tabs** trên mobile (Tài chính | Đơn hàng | BG | KH | SP). Desktop vẫn stack.

---

## 4. Plan code chi tiết

### 4.1. Database (1 migration)

**Mig 015** — `quotations` thêm cột + relax status enum:

```sql
-- SQLite không support DROP/ADD CHECK directly. Phải recreate table HOẶC bỏ check ở code.
-- Đề xuất: bỏ CHECK constraint trên status ở DB (recreate table 1 lần), validate ở backend service.

-- Trạng thái BG = 5 giá trị (thêm 'chua_gui' so với hiện tại):
--   draft → 'Nháp'
--   chua_gui → 'Chưa gửi' (mới — user nhấn nút "Đã hoàn thành, chờ gửi")
--   sent → 'Đã gửi'
--   confirmed → 'Đã chốt'
--   cancelled → 'Đã trượt' (đổi label, giữ enum DB)

-- Cột mới:
ALTER TABLE quotations ADD COLUMN order_status TEXT DEFAULT 'cho_san_xuat'
  CHECK (order_status IS NULL OR order_status IN ('cho_san_xuat','san_xuat','lap_dat','hoan_thien'));

-- Tài chính per BG (NULL = chưa nhập, hiển thị fallback)
ALTER TABLE quotations ADD COLUMN doanh_thu_thuc INTEGER;
ALTER TABLE quotations ADD COLUMN thanh_toan_thuc INTEGER;
ALTER TABLE quotations ADD COLUMN gia_von INTEGER;

-- Backfill order_status: BG cũ (chưa có) — set theo logic:
UPDATE quotations
SET order_status = CASE WHEN status = 'cancelled' THEN NULL ELSE 'cho_san_xuat' END
WHERE order_status IS NULL;

-- Update status CHECK: cần recreate table với enum mới. Hoặc bỏ CHECK ở DB:
-- Tạm thời enum DB chỉ gồm 4 cũ. Status 'chua_gui' mới sẽ KHÔNG insert được.
-- → Migration phải recreate table hoặc dùng PRAGMA writable_schema (hacky).
-- → Đề xuất: recreate quotations table — SQLite recommended pattern.
```

**Mapping status (DB ↔ label hiển thị)**:
| DB enum | Label tiếng Việt |
|---|---|
| `draft` | Nháp |
| `chua_gui` (mới) | Chưa gửi |
| `sent` | Đã gửi |
| `confirmed` | Đã chốt |
| `cancelled` | Đã trượt |

→ Frontend dùng `BG_STATUS_LABELS` constant cho display, gửi enum DB qua API.
→ `VALID_STATUS = ['draft','chua_gui','sent','confirmed','cancelled']` trong service.

### 4.2. Backend

| File | Sửa gì |
|---|---|
| `src/models/quotation.model.js` | HEADER_FIELDS thêm `order_status, doanh_thu_thuc, thanh_toan_thuc, gia_von` |
| `src/services/quotation.service.js` | `normalizeHeader` clean 4 field mới + map status enum cũ ↔ mới |
| | `VALID_STATUS` mở rộng: `['nhap','chua_gui','da_gui','da_chot','da_huy']` |
| | `VALID_ORDER_STATUS = ['chua_sx','san_xuat','lap_dat','hoan_thien']` |
| | `setStatus()` xử lý logic: status='da_huy' → order_status=null; status khác 'da_huy' và order_status đang null → set 'chua_sx' |
| `src/controllers/quotation.controller.js` | Thêm endpoint `PATCH /quotations/:id/order-status` |
| | Thêm endpoint `PATCH /quotations/:id/financials` (update 3 field tài chính) |
| `src/routes/dealer.routes.js` | Wire 2 route mới |
| `src/models/dealer-stats.model.js` | Thêm queries cho 5 sections dashboard |
| `src/services/dealer-stats.service.js` | Aggregate logic cho từng section |
| `src/controllers/dealer-stats.controller.js` | Thêm endpoint `/dashboard/v4?from=&to=` |

### 4.3. Frontend

| File | Sửa gì |
|---|---|
| `public/dealer/quotations.html` | Bảng list: thêm 2 cột (Trạng thái stack, 💰 Tài chính). Drop button cũ "Đã gửi/KH chốt/KH huỷ" → 2 dropdown `<select>` trong cell trạng thái. Click cell 💰 → mở modal |
| `public/dealer/quotations.html` (mới) | Modal "Cập nhật tài chính" — 4 input (Doanh thu / Thanh toán / Giá vốn / Auto preview Công nợ + Lợi nhuận) |
| `public/dealer/index.html` | Refactor thành **5 sections** + filter tháng/năm + tabs mobile |
| | Tích hợp Chart.js (đã có) — biểu đồ doanh số tháng, breakdown order_status, top nhóm SP |
| `public/dealer/quotation-edit.html` | Nhỏ — đổi 1 label "Trạng thái BG" mapping mới |
| `public/assets/js/common.js` | Thêm constants `BG_STATUS_LABELS` + `ORDER_STATUS_LABELS` (i18n VN) |

### 4.4. Mobile UX (đặc biệt cho u40-u50)

- **Bảng list BG mobile**: card view (giống items table BG-edit). Mỗi BG = 1 card hiện tóm tắt + nút "Cập nhật" mở modal full-screen
- **Modal tài chính**: input lớn (16px+), label rõ ràng "Số tiền khách đã trả: ___", buttons "💾 Lưu" / "Huỷ" cỡ ngón cái
- **Dropdown trạng thái**: `<select>` native (phone hiện picker đẹp)
- **Dashboard tabs**: 5 tabs ngang trên cùng, swipe-friendly

### 4.5. Endpoints mới

```
PATCH  /api/dealer/quotations/:id/order-status   { order_status: 'san_xuat' }
PATCH  /api/dealer/quotations/:id/financials     { doanh_thu_thuc, thanh_toan_thuc, gia_von }
GET    /api/dealer/dashboard/v4?from=&to=         → { kpi: {tong_dh, cong_no, so_dh}, financial, orders, quotations, customers, products }
GET    /api/dealer/quotations/export?...           → file .xlsx (Xuất Excel — toàn bảng đã filter)
```

Backend cho Xuất Excel: dùng lib `exceljs` (~5MB, ổn định cho server-side .xlsx) hoặc tự build CSV (nhẹ hơn, đỡ dep). Đề xuất CSV cho v1 nếu user OK (vẫn mở được trong Excel), sau nâng cấp .xlsx nếu cần style.

### 4.6. Audit log
- Thêm action `quotation.update_financials` (track ai đổi doanh thu/giá vốn)
- Thêm action `quotation.update_order_status`
- Đã có cơ chế audit, chỉ cần wire vào service

---

## 5. Ước lượng workload

| Phần | Estimate | Note |
|---|---|---|
| Mig 015 + backend (model/service/controller/routes) | 3-4h | Phức tạp ở chỗ map status enum cũ ↔ mới + logic order_status |
| Quotations list page (bảng 15 cột + 2 dropdown filter + modal tài chính + action icons Xem/Sửa/Xoá/Tải) | 6-7h | Bảng rộng, cần horizontal scroll + sticky cột đầu. Mobile chuyển card view |
| **Xuất Excel** (server-side build CSV/XLSX) | 2-3h | CSV nhẹ; nếu chọn XLSX cần thêm `exceljs` |
| Dashboard v4 (KPI hero + filter kỳ xem + 5 sections + chart) | 8-10h | Filter custom range from-to phức tạp hơn dropdown tháng. Chart.js setup + tabs mobile |
| Mobile polish (card view BG list + modal full-screen) | 3-4h | Test trên đth thực + iOS Safari quirks |
| Smoke test E2E (tạo BG → chuyển status → nhập tài chính → xem dashboard → xuất Excel) | 2-3h | |
| Buffer cho bug + tinh chỉnh | 2-3h | |
| **TỔNG** | **26-34h** | ~3.5-4 ngày làm việc (tăng so với 22-28h trước do thêm KPI hero + Xuất Excel + bảng 15 cột) |

Có thể chia thành **3 milestones**:
- **M1** (~11-14h): Mig + backend + quotations list 15 cột + modal tài chính + Xuất Excel → ngày 1-1.5
- **M2** (~10-13h): Dashboard v4 (KPI hero + filter kỳ xem + 5 sections + chart) → ngày 2-3
- **M3** (~5-7h): Mobile polish + Smoke test E2E + Buffer → ngày 3.5-4

---

## 6. Câu hỏi cuối còn lại (đã rút gọn rất nhiều)

### Đã rõ từ user trả lời 6 ý:
- ✓ Status BG = **5 trạng thái** (giữ Nháp + Chưa gửi tách biệt)
- ✓ "Đã trượt" = "Đã huỷ" → 1 status, dùng label "Đã trượt"
- ✓ Nhóm SP DYNAMIC theo `products.nhom_sp` của dealer
- ✓ Doanh số (= Σ tong_cong BG đã gửi) ≠ Doanh thu (= Σ doanh_thu_thuc BG đã chốt) — mục 0.7
- ✓ Xuất file **.xlsx** (cần `exceljs`)
- ✓ Bảng 15 cột — horizontal scroll trên mobile (không cần card view)
- ✓ "QUẢN LÝ" = eyebrow label, không phải button
- ✓ Filter báo cáo: 2 dropdown đơn giản (tháng/năm)
- ✓ Tỉ lệ chuyển đổi chỉ hiển thị 1 chỗ
- ✓ Section D = Chỉ số khách hàng

### Còn 1 câu QUAN TRỌNG cần sếp confirm:

**Doanh thu = `doanh_thu_thuc` (thực thu) hay `tong_cong` (giá BG)?**

Tình huống: BG báo giá 250M cho khách. Khi chốt, dealer giảm giá thêm 10M → khách OK 240M.
- Doanh thu = 240M (Cách 1 — đề xuất): dùng `doanh_thu_thuc` field, dealer nhập tay sau chốt
- Doanh thu = 250M (Cách 2): dùng `tong_cong` thuần, không quan tâm sửa sau

User truyền lời sếp: "tổng giá trị các báo giá đã chốt là doanh thu" — chữ "tổng giá trị" gợi `tong_cong`. Nhưng nếu vậy thì cột `doanh_thu_thuc` trên bảng list dùng làm gì?

→ **Đề xuất Cách 1** (`doanh_thu_thuc`): phản ánh đúng tiền thực sẽ về. Cần xác nhận với sếp.

### Tôi tự quyết (sếp duyệt nhanh):

1. **Layout**: 2 page riêng (`/dealer/quotations.html` + `/dealer/index.html`) với header chung có 2 link tab. URL deep-link được.

2. **Hero progress bars "Tiến độ đơn hàng tổng quan"** chỉ hiện ở Tab Báo cáo.

3. **3 KPI cards** ở Tab Báo cáo chỉ display thuần (không click filter).

4. **Status mặc định BG mới**: `draft` (Nháp). `order_status` = `cho_san_xuat`.

5. **Preview live khi edit modal tài chính** (Doanh thu, Thanh toán, Giá vốn) → Công nợ + Lợi nhuận auto cập nhật ngay khi gõ.

6. **Nút "Tải" per row** → export 1 BG ra PDF.

7. **Top nhóm SP** — tính từ items của BG `da_gui + da_chot` (loại Nháp + Chưa gửi + Đã trượt — đỡ noise).

8. **Báo cáo cho admin** — hoãn v2.

9. **Khi status BG → `da_truot`**, order_status đang set có giá trị → tự null hoá.

10. **`doanh_thu_thuc` mặc định** khi BG mới được tạo = `tong_cong`. User có thể sửa sau khi chốt.

11. **`thanh_toan_thuc` mặc định** = 0. Dealer nhập tay từng đợt.

12. **`gia_von` mặc định** = null (chưa biết). Dealer nhập tay khi có data.

Sếp confirm câu chính (Doanh thu = doanh_thu_thuc hay tong_cong) + duyệt 12 quyết định trên thì tôi bắt đầu code theo plan này.
