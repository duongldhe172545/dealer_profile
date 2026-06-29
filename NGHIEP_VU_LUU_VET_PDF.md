# NGHIỆP VỤ CHI TIẾT — TÍNH NĂNG "LƯU VẾT PDF"

> Đại lý xuất báo giá / hồ sơ ra PDF → hệ thống **tự render bản PDF y hệt bản in**, đẩy lên **Google Drive**, và **ghi lại dấu vết** để admin xem được "đại lý đã gửi gì cho khách, lúc nào, ai gửi".
>
> Tài liệu này mô tả **luồng người dùng thực tế** (bấm gì → ra gì → thấy gì), không phải code.

---

## 0. Bức tranh tổng — 1 phút hiểu hết

```
        ĐẠI LÝ                          HỆ THỐNG (server)                  ADMIN
   ┌──────────────┐               ┌─────────────────────────┐       ┌──────────────┐
   │ Bấm "Xuất PDF"│ ──────────►  │ 1. Render PDF (Chromium) │       │ Vào trang    │
   │ trên BG/hồ sơ │               │ 2. Đẩy lên Google Drive  │ ───►  │ "Lịch sử xuất│
   └──────────────┘               │ 3. Lưu dấu vết vào DB    │       │  file"       │
          ▲                        └─────────────────────────┘       │ Thấy ai xuất │
          │  Toast: "Đã lưu bản xuất ✓"                              │ gì, lúc nào, │
          │  + nút [Mở Drive] [Tải máy]                              │ mở Drive xem │
          └──────────────────────────────────────────────           └──────────────┘
```

**3 điều cốt lõi:**
1. Đại lý **không phải làm gì khác** so với hiện tại — vẫn bấm nút Xuất như cũ, chỉ là giờ có thêm bản lưu.
2. Đại lý **không cần đăng nhập Google** — server tự đẩy lên Drive bằng tài khoản dịch vụ (Service Account).
3. Server **chỉ lưu cái link + thông tin**, không ôm file PDF → máy chủ không phình to.

---

## 1. LUỒNG ĐẠI LÝ — click từng bước

### 1A. Xuất PDF một **báo giá** (màn sửa báo giá)

**Bối cảnh:** Đại lý đang ở màn `quotation-edit.html`, đã soạn xong báo giá cho khách.

| Bước | Đại lý làm gì | Hệ thống làm gì | Đại lý thấy gì |
|------|---------------|-----------------|----------------|
| 1 | Bấm nút **📄 PDF** ở thanh action (cạnh 💾 Lưu, ✉ Email) | Kiểm tra BG đã lưu chưa | Nút chuyển trạng thái "Đang xử lý…" (spinner) |
| 2 | — | Nếu BG **chưa lưu** → tự lưu trước. Nếu lưu lỗi (thiếu khách, chưa có dòng SP) → **dừng, không xuất** | Toast đỏ: *"Báo giá chưa hợp lệ — …"* |
| 3 | — | Mở Chromium ẩn ở server, render trang in → ra PDF (vector, nét y hệt bản in tay) | (không thấy gì — **không bật hộp thoại in của trình duyệt**) |
| 4 | — | Đẩy PDF lên Google Drive → nhận link | — |
| 5 | — | Ghi 1 dòng dấu vết vào DB (ai xuất, lúc nào, BG nào, link Drive) | — |
| 6 | (xong) | Trả kết quả về | **Toast xanh:** *"Đã lưu bản xuất PDF ✓"* + nút **[Mở Drive]** (tab mới) và **[Tải máy]** |

> **Khác biệt quan trọng với hiện tại:** Bây giờ nút "📄 PDF" mở hộp thoại in của trình duyệt (Ctrl+P). Sau khi làm tính năng này, nút sẽ render ở server thay vì bật hộp thoại in. Đại lý vẫn có thể tải file về máy qua nút **[Tải máy]** trong toast.

### 1B. Xuất PDF **hồ sơ năng lực** (màn hồ sơ)

Y hệt luồng trên, chỉ khác:
- Bấm nút **📄 Xuất PDF** trên `profile.html`.
- Không có "số báo giá" → dấu vết ghi loại = **hồ sơ**, không gắn báo giá nào.
- Tên file trên Drive: `HOSO_<mã đại lý>_<ngày>.pdf`.

### 1C. Tải nhanh từ **danh sách báo giá**

Trên `quotations.html`, cột "Thao tác" có nút **Tải**. Nút này hiện mở trang sửa BG kèm `?print=1` để in tự động. Sau khi làm tính năng:
- Nút **Tải** vẫn hoạt động như cũ với đại lý,
- Nhưng phía sau **vẫn ghi 1 dấu vết** (xuất từ danh sách cũng được lưu).

### Đại lý thấy gì sau khi xuất (tóm tắt UI)
- **Toast góc trên phải**, tự ẩn sau 5 giây hoặc bấm ✕ để tắt.
  - Thành công → xanh: *"Đã lưu bản xuất PDF"* + [Mở Drive] + [Tải máy].
  - Lỗi → đỏ: *"Lỗi lưu vết PDF: …, bạn vẫn in/tải bình thường được"* (data báo giá **không hề bị ảnh hưởng**).
- **Nút 📄** bị **mờ (disabled)** khi: BG chưa lưu được, hoặc đang xử lý.
- **Không có thay đổi nào khác** trên màn hình chính của đại lý.

---

## 2. MÀN ADMIN — "Lịch sử xuất file" (màn mới)

**Vào từ:** menu trên cùng của admin → thêm mục mới **"Lịch sử xuất file"** (cạnh Audit/Đại lý/Sản phẩm…).

### Bố cục màn hình

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Lịch sử xuất file PDF                                          [↻ Tải lại]│
│  Tất cả bản báo giá / hồ sơ mà đại lý đã xuất ra.                          │
├──────────────────────────────────────────────────────────────────────────┤
│  [Từ ngày ▼] [Đến ngày ▼]   [Đại lý: Tất cả ▼]   [Loại: Tất cả ▼]         │ ← filter
├────┬────────────────┬─────────────┬────────┬──────────┬──────────┬────────┤
│STT │ Ngày xuất      │ Đại lý      │ Loại   │ Số BG    │ Người xuất│ Link   │
├────┼────────────────┼─────────────┼────────┼──────────┼──────────┼────────┤
│ 1  │ 24/06 10:30    │ The Anh (DL1│ 🔵Báo giá│BG-2026-01│ thoxuong │✓ Mở    │
│ 2  │ 24/06 09:15    │ TNT (DL07)  │ 🟣Hồ sơ │   —      │ admin_dl │✓ Mở    │
│ 3  │ 23/06 17:42    │ The Anh (DL1│ 🔵Báo giá│BG-2026-00│ thoxuong │✗ Bị xoá│
├────┴────────────────┴─────────────┴────────┴──────────┴──────────┴────────┤
│  Trang 1 / 12   (235 bản ghi)         [⇤] [← Trước] [Sau →] [⇥]            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Từng cột hiển thị gì

| Cột | Nội dung | Ghi chú |
|-----|----------|---------|
| **STT** | Số thứ tự theo trang | |
| **Ngày xuất** | `24/06/2026 10:30` | mới nhất lên đầu |
| **Đại lý** | Tên đại lý (**có link** sang trang chi tiết đại lý) + mã đại lý nhỏ bên dưới | Nếu đại lý đã xoá → ghi *"Đại lý đã xoá"* |
| **Loại** | Badge 🔵 **Báo giá** / 🟣 **Hồ sơ** | màu phân biệt nhanh |
| **Số BG** | `BG-2026-001` (nếu là báo giá); hồ sơ để `—` | snapshot tại lúc xuất, không đổi kể cả BG sau này bị sửa/xoá |
| **Người xuất** | username của người bấm xuất | lấy từ token đăng nhập |
| **Trạng thái link** | ✓ **Có sẵn** / ✗ **Bị xoá** / ! **Lỗi** | xem mục 4 |
| **Thao tác** | nút **Mở Drive** (mở tab mới xem/tải PDF) | chỉ bật khi link còn sống |

### Admin làm được gì trên màn này
1. **Lọc** theo khoảng ngày + đại lý + loại (báo giá/hồ sơ) → bảng cập nhật ngay.
2. **Bấm 1 dòng / nút "Mở Drive"** → mở file PDF trên Google Drive ở tab mới (xem hoặc tải).
3. **Bấm tên đại lý** → nhảy sang trang chi tiết đại lý đó.
4. **Phân trang** 20 dòng/trang.
5. (tuỳ chọn) **Xoá 1 dấu vết** — có xác nhận; nên hạn chế vì đây là dữ liệu kiểm soát.

### Tab "Lịch sử xuất" trong trang **chi tiết đại lý**
Trang `dealer-detail.html` hiện có 5 tab (Dashboard / Thông tin / Báo giá / Khách hàng / Sản phẩm). Thêm tab thứ 6 **"Lịch sử xuất"**:
- Bảng **giống hệt** màn trên, nhưng **chỉ của đại lý đang xem** (bỏ filter "Đại lý").
- Dùng khi admin muốn soi nhanh 1 đại lý cụ thể đã gửi gì cho khách.

---

## 3. DỮ LIỆU LƯU LẠI — mỗi lần xuất ghi gì?

Mỗi lần xuất tạo **đúng 1 dòng** trong bảng mới `export_archives`. Đây là toàn bộ thông tin lưu (KHÔNG lưu nội dung file, chỉ metadata + link):

| Trường | Ý nghĩa | Ví dụ |
|--------|---------|-------|
| `id` | mã dòng | 1024 |
| `dealer_id` | đại lý nào | 7 |
| `export_kind` | loại: `quotation` / `profile` | quotation |
| `quotation_id` | báo giá nào (rỗng nếu là hồ sơ) | 583 |
| `so_bao_gia` | **chụp lại** số BG lúc xuất | BG-2026-001 |
| `file_type` | `pdf` (sau này có thể `xlsx`) | pdf |
| `exported_by_user_id` + `username` | ai bấm xuất | 12 / thoxuong |
| `exported_at` | thời điểm xuất | 2026-06-24 10:30 |
| `ip` | IP người xuất | 113.161.x.x |
| `storage_provider` | nơi lưu | gdrive |
| `file_id` | ID file trên Drive | 1a2B3c… |
| `file_url` | link mở/tải | https://drive.google.com/… |
| `file_name` | tên file trên Drive | BAOGIA_BG-2026-001_20260624.pdf |
| `file_size` | dung lượng (byte) | 842000 |
| `content_hash` | **vân tay nội dung** (để gộp các lần xuất trùng) | a1b2c3… |
| `export_count` | đã xuất **bao nhiêu lần** với nội dung này | 12 |
| `last_exported_at` | lần xuất gần nhất (cùng nội dung) | 2026-06-24 14:05 |
| `status` | `success` / `failed` | success |
| `error_message` | lý do nếu lỗi | (rỗng) |

**Quy ước tên file trên Drive:**
- Báo giá: `BAOGIA_<số BG>_<ngày>.pdf` → `BAOGIA_BG-2026-001_20260624.pdf`
- Hồ sơ: `HOSO_<mã đại lý>_<ngày>.pdf` → `HOSO_DL001_20260624.pdf`

**Cấu trúc thư mục Drive:** 1 thư mục gốc (admin tạo, chia sẻ cho tài khoản dịch vụ) → bên trong chia theo từng đại lý: `/<mã đại lý>/<file>.pdf`.

---

## 4. KHI NÀO TẠO DẤU VẾT (trigger) — gộp theo VÂN TAY NỘI DUNG

Đại lý hay bấm xuất nhiều lần chỉ để **xem / test** cùng một bản không đổi → nếu lưu hết sẽ ngập rác. Cách xử lý: **gộp theo nội dung, không theo số lần bấm.**

- Mỗi lần render, hệ thống tính 1 **vân tay (hash)** từ nội dung báo giá/hồ sơ (khách, các dòng SP, đơn giá, tổng tiền…).
- Khi xuất, so vân tay với **lần lưu vết gần nhất của đúng BG đó**:
  - **Trùng vân tay** (nội dung y hệt → đang xem lại / test) → **KHÔNG tạo dòng mới**. Chỉ cập nhật `last_exported_at` + tăng `export_count` trên dòng cũ. *(Vẫn upload Drive 1 lần đầu; lần trùng sau dùng lại file cũ, không tạo file mới.)*
  - **Khác vân tay** (đại lý đã sửa giá/SP rồi xuất lại → **bản mới thực sự gửi khách**) → tạo **1 dòng mới** + 1 file Drive mới.
- Kèm **khoá nút ~3 giây** sau mỗi lần bấm để chống double-click và giảm tải server.
- Tạo dấu vết **bất kể trạng thái BG** (nháp / đã gửi / đã chốt) — miễn nội dung khác lần trước.

→ Test 50 lần cùng nội dung = **1 dòng (đếm 50)**. Sửa giá rồi xuất lại = thêm 1 dòng. Admin thấy đúng **các phiên bản khác nhau đã đưa khách**, không rác.

**Tính bất biến:** Sau khi đã xuất, đại lý sửa lại báo giá thì **bản PDF cũ trên Drive vẫn nguyên** → admin luôn biết chính xác "bản đã đưa cho khách lúc đó là gì". Đây là giá trị cốt lõi của tính năng.
- **Báo giá bị xoá** → dấu vết **vẫn còn** (gỡ liên kết `quotation_id`, nhưng giữ `so_bao_gia` đã chụp). Admin vẫn thấy "BG-2026-001 (đã xoá) — đã từng xuất ngày…".
- **PDF không phụ thuộc template đổi về sau:** vì render đúng tại thời điểm bấm, đổi template sau này không làm méo bản cũ.

---

## 5. CÁC TÌNH HUỐNG ĐẶC BIỆT (edge case) + cách xử lý

| Tình huống | Xử lý |
|------------|-------|
| **BG chưa hợp lệ** (thiếu khách / chưa có dòng SP) khi bấm Xuất | Tự lưu thử → fail → toast đỏ, **không** xuất. Đại lý sửa rồi bấm lại. |
| **Đại lý spam bấm Xuất** (xem/test nhiều lần) | **Gộp theo vân tay nội dung** (mục 4): cùng nội dung → không đẻ dòng mới, chỉ tăng đếm. Kèm **khoá nút 3s** chống double-click. |
| **Google Drive lỗi / đầy quota** | Ghi dấu vết `status=failed` + lý do; toast đỏ cho đại lý ("vẫn in/tải bình thường được"); admin thấy bản failed để xử lý. **Data BG không mất.** |
| **Render quá lâu (>30s) hoặc Chromium crash** | Timeout 30s → `status=failed`, không treo trình duyệt đại lý. |
| **File trên Drive bị xoá tay** | Khi admin tải lại trang, server kiểm tra link → đổi badge sang ✗ **Bị xoá**, khoá nút Mở Drive. |
| **PDF quá nặng** (nhiều ảnh 4K) | Giảm chất lượng ảnh khi render / cảnh báo khi >10MB. |
| **Quota Drive của admin đầy dần** | v1 **giữ vĩnh viễn** (Drive Gmail 15GB ≈ đủ ~1+ năm). Theo dõi dung lượng; gần đầy thì dọn file cũ hoặc nâng Google One — để Phase 2. |
| **Đại lý đang sửa BG đúng lúc render** | Bản PDF lấy dữ liệu tại thời điểm render (sai lệch <5s). Muốn tuyệt đối chính xác thì khoá BG khi render — để **Phase 2**. |
| **Triển khai Railway**: cần cài Chromium trong image | Cấu hình `nixpacks.toml`/Dockerfile để cài Chromium — việc một lần khi deploy. |

---

## 6. CÁC QUYẾT ĐỊNH ĐÃ CHỐT (v1)

| # | Quyết định | Chốt |
|---|-----------|------|
| 1 | Loại file lưu vết | **Chỉ PDF.** Excel không lưu vết. |
| 2 | Chống xuất trùng (test/xem nhiều lần) | **Gộp theo vân tay nội dung** + **khoá nút 3s**. Cùng nội dung = 1 dòng (tăng đếm); nội dung khác = dòng mới. (xem mục 4) |
| 3 | Ai được xem lưu vết | **Chỉ admin.** Đại lý **không bao giờ** thấy lưu vết của mình. |
| 4 | Giữ file Drive | **Giữ vĩnh viễn (v1).** Theo dõi dung lượng; dọn/nâng cấp để Phase 2. |

---

*Phần kỹ thuật (Service Account, biến môi trường, migration `021_export_archives`, Puppeteer/Chromium, roadmap) đã có trong [BAN_PHAN_TICH_TINH_NANG_NANG_CAO.md](BAN_PHAN_TICH_TINH_NANG_NANG_CAO.md). File này tập trung mô tả nghiệp vụ.*
