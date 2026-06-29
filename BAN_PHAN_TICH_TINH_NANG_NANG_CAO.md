# 🧭 Phân tích 2 tính năng nâng cao — Đại Lý Số

> Ngày: 2026-06-24 · Phân tích bám **code thật** của dự án (đã rà: cơ chế export, lưu trữ, kiến trúc/scale).

---

# TÍNH NĂNG 1 — Lưu vết file PDF đại lý xuất về admin

## 1. Nghiệp vụ
**Mục tiêu**: admin xem lại **đúng bản** đại lý đã gửi khách tại thời điểm xuất, để **kiểm soát nội dung** (đúng giá, đúng thương hiệu, không hứa sai), **đối soát** đơn/công nợ, và **làm bằng chứng khi tranh chấp**.
**Ai dùng**: chủ yếu **admin** (đại lý là người sinh bản ghi khi bấm Xuất; cho đại lý xem lịch sử của chính mình là tuỳ chọn phase sau).

## 2. Mấu chốt kỹ thuật (rất quan trọng)
- **PDF hồ sơ + báo giá hiện sinh 100% ở CLIENT** bằng `window.print()` (profile.html `printProfile`, quotation-edit.js `exportPDF`). **Server KHÔNG thấy, KHÔNG giữ, KHÔNG log** file PDF. `html2canvas`/`jspdf` có load nhưng **không dùng**.
- **Đại lý hiện tải PDF bằng gì?** Bằng **hộp thoại in của trình duyệt** (Ctrl+P → "Save as PDF") → PDF **vector chất lượng cao** (engine in của Chrome dựng). **KHÔNG phải D1 cũng không phải D2**, và **app không lấy được file này** (nằm giữa người dùng ↔ trình duyệt, JS không chạm tới). ⇒ Muốn lưu vết phải **tự sinh ra một file** mà server nắm được (D1 hoặc D2).
- **Báo giá vẫn sửa được sau khi gửi** (status sent/confirmed nhưng record còn editable) → đọc lại từ DB hôm nay **chưa chắc bằng** bản đã xuất hôm xuất. ⇒ Tính năng **phải khoá bản chốt tại thời điểm xuất**, không phải "mở lại báo giá hiện tại".
- Email gửi báo giá là `mailto:` (client) — không đính kèm PDF tự động.

## 3. Quyết định (ĐÃ CHỐT)
**Hướng D — file thật lên ổ dữ liệu, hệ thống chỉ giữ METADATA.**
- **Ổ lưu = Google Drive** (Gmail thường, qua **Service Account**).
- **Sinh file = D2 — server render Chromium (Puppeteer)** → PDF vector.

| Phương án (tham khảo) | Vì sao KHÔNG chọn |
|---|---|
| A. Client html2canvas → Cloudinary | file ảnh, kém nét, phụ thuộc client upload, ăn quota Cloudinary |
| D1. Client tạo file rồi đẩy lên | bản lưu là **ảnh** (lớn, không bôi đen chữ), có thể lệch template, dựa vào client chịu upload |
| C. Snapshot dữ liệu tái tạo | file **không chính xác 100%** khi template đổi sau này |
| **D2 + Google Drive ⭐** | **Vector đẹp = bản in, server chủ động lưu (chắc chắn), DB chỉ metadata, GDrive không cần quyền IT** |

> **GDrive (không SharePoint)**: SharePoint cần **IT/Azure admin** đăng ký app — bạn không có quyền. GDrive **Service Account** thì bạn **tự tạo** bằng tài khoản Google cá nhân, không cần admin tổ chức.
> **D2 (không D1)**: bạn có **Railway gói $5 (tới ~8GB RAM)** → Chromium chạy thoải mái; đổi lại được **PDF vector đúng như bản đại lý in** + **lưu vết chắc chắn** (không phụ thuộc client).

## 4. D2 hoạt động thế nào (server render Chromium)
Bản chất = chạy `window.print()` **trên server**, do code điều khiển nên **lấy được bytes**:
1. Đại lý bấm "Xuất" → gọi endpoint server.
2. Server bật **Chromium ẩn (Puppeteer)** → mở **đúng trang in của app** (vd `/dealer/quotation-edit.html?id=123&print=1`) kèm **token ngắn hạn** → trang tự render y hệt preview (cùng template/font/CSS).
3. Gọi `page.pdf(...)` → Chromium dựng **PDF vector** (cùng engine với `window.print()`) → **server cầm được Buffer**.
4. Server **upload Buffer lên Google Drive** (Drive API + Service Account) → nhận `file_id` + link.
5. Lưu metadata vào DB (`export_archives`) + ghi audit.

**Lưu ý kỹ thuật**:
- Puppeteer cần Chromium trong image Railway → cấu hình **Nixpacks** cài (hoặc puppeteer tự tải lúc build). Làm 1 lần.
- **Auth cho Puppeteer**: server mint **JWT ngắn hạn** đúng đại lý đó, truyền qua URL/header để trang in gọi API lấy data của chính đại lý.
- Mỗi lần render ~**1-3s**, RAM ~300-400MB/lần → ổn với gói $5. Nên bật Chromium theo yêu cầu (hoặc giữ 1 instance ấm).

## 5. Cấu hình Google Drive (bạn TỰ làm, không cần IT)
1. Tạo **Google Cloud project** (miễn phí) bằng tài khoản Google.
2. Bật **Google Drive API**.
3. Tạo **Service Account** → tải **JSON key**.
4. Tạo 1 **thư mục trên Drive** → **share cho email Service Account** (quyền Editor) → lấy **Folder ID** (trong URL thư mục).
5. Bàn giao dev: **JSON key** + **Folder ID**.

**Lưu ý**: Gmail thường → file nằm trong thư mục bạn share, **tính vào 15GB** Drive của bạn (PDF nhẹ → chứa hàng chục nghìn, dư rất lâu). JSON key cất ở **env server** (bí mật).

## 6. Thay đổi dữ liệu (chỉ metadata)
- **Migration mới `021_export_archives.js`** → bảng `export_archives`:
  `id, dealer_id, export_kind('quotation'|'profile'), quotation_id(null), so_bao_gia, file_type('pdf'), exported_by_user_id/username, exported_at, ip,` **`storage_provider('gdrive'), file_id (id trên Drive), file_url (webViewLink), file_name`**.
- Index: `dealer_id`, `quotation_id`, `exported_at`.
- **DB nhẹ** — file thật trên Google Drive; backup hiện tại bao trùm metadata.
- Thêm action `quotation.export` / `profile.export` vào `src/utils/audit.js`.
- Thư viện mới: `puppeteer` (hoặc `puppeteer-core` + chromium), `googleapis`.
- Env mới: `GDRIVE_SA_KEY` (JSON service account, base64), `GDRIVE_FOLDER_ID`, `APP_PRINT_BASE_URL` (URL server tự gọi). Token render tái dùng `JWT_SECRET`.

## 7. Lộ trình triển khai
1. **Bạn**: tạo Google Cloud project + Service Account + thư mục Drive (mục 5) → đưa **JSON key + Folder ID**.
2. Backend nền: `pdf.service.js` (Puppeteer render → Buffer) + `gdrive.service.js` (upload Drive) + migration `021_export_archives` + audit action.
3. Endpoint: `POST /api/dealer/quotations/:id/exports` + `POST /api/dealer/profile/exports` → render PDF → upload Drive → lưu metadata.
4. Hook client: nút Xuất gọi endpoint (chạy nền, không chặn việc đại lý tự in/tải).
5. Admin UI: trang "Lịch sử xuất file" (list **có phân trang**) → bấm mở link Drive.
6. Cấu hình Railway: cài Chromium (Nixpacks) + set env + kiểm RAM/thời gian render.

## 8. ❓ Còn vài điểm nhỏ cần chốt
1. Lưu vết **mọi lần** bấm Xuất, hay chỉ lần gửi chính thức (vd BG = "Đã gửi")? (ảnh hưởng số file)
2. Có lưu vết cả **Excel** danh sách báo giá (server-side, đã có) không, hay chỉ PDF hồ sơ/báo giá?
3. Cấu trúc thư mục Drive: `/<mã ĐL>/<năm>/` hay phẳng?
4. Đại lý có xem lịch sử xuất của **chính mình** không, hay chỉ admin?

---

# TÍNH NĂNG 2 — Chống quá tải khi đại lý/báo giá tăng

## 1. Nghiệp vụ
Giữ hệ thống nhanh & không sập khi tăng từ vài đại lý pilot → hàng chục/trăm, báo giá từ vài trăm → vài chục nghìn. Điểm đau: mở **danh sách báo giá** và **dashboard**.

## 2. Điểm nghẽn thực tế (theo thứ tự "vỡ" trước)
| # | Nghẽn | Bằng chứng | Vỡ khi |
|---|-------|-----------|--------|
| 1 | **List báo giá không phân trang** + **N+1** (subquery `items_count` mỗi dòng) + admin ép `limit=5000` | `quotation.model.js` list (~L65-75), `admin/quotations.html` | Vài nghìn BG → JSON khổng lồ, browser đơ |
| 2 | **Dashboard quét toàn bảng**: filter ngày dùng `substr(ngay_bao_gia,1,7)=period` → **index ngày vô dụng** | `dealer-stats.model.js` L31-33,81,126 | Nhiều BG hoặc nhiều user xem dashboard cùng lúc |
| 3 | **SQLite 1-writer**: mọi ghi (tạo/sửa BG) xếp hàng qua 1 writer | `database.js` (WAL nhưng vẫn 1 writer) | Nhiều đại lý cùng lưu lúc cao điểm |
| 4 | **Volume / Cloudinary free tier** đầy (ảnh, +PDF nếu lưu) | Cloudinary ~25GB store / ~1GB bandwidth-tháng | 1000+ đại lý nhiều ảnh |

## 3. Phương án theo 3 giai đoạn
**GĐ1 — Quick wins (✅ ĐÃ CHỐT — làm 4 việc cốt lõi, công sức thấp, rủi ro thấp):**
1. ✅ `database.js`: thêm `busy_timeout=5000` + `synchronous=NORMAL` (1-2 dòng, chặn lỗi "database is locked").
2. ✅ `quotation.model.js` list: thêm **LIMIT/OFFSET** + trần limit (vd 100) + trả total; **bỏ N+1** (JOIN GROUP BY hoặc bỏ `items_count`).
3. ✅ Migration: **compound index** `(dealer_id, ngay_bao_gia, status)` (+ cân nhắc `(dealer_id, status)`).
4. ✅ FE: bỏ `limit=5000`, **lazy load / phân trang** danh sách.
- _(Tạm BỎ qua, để GĐ2/sau)_: rate-limit nâng cao, tối ưu dashboard, cache, archive.

**GĐ2 — Trung hạn (khi BG tới ~vài chục nghìn HOẶC dashboard >1-2s):**
- Đổi dashboard filter ngày `substr()` → **range** `>= @from AND < @to` để index ngày phát huy.
- Gộp các query loop (6 tháng/12 tháng/5 năm) thành ít `GROUP BY` hơn.
- **Cache** dashboard theo (dealer_id, period) TTL ngắn + invalidate khi ghi.
- **Archive** báo giá cũ (cờ `archived` / bảng riêng) để bảng nóng nhỏ.
- Export giới hạn theo khoảng ngày / stream thay vì `.all()` toàn bộ.

**GĐ3 — Dài hạn (chỉ khi ĐÔNG thật, KHÔNG làm ở pilot):**
- SQLite → **Postgres managed** (nhiều writer, replica đọc) — viết lại data layer sync→async.
- **Object storage** (S3/R2) cho file lớn.
- **Scale nhiều instance** sau load balancer (chỉ khả thi sau khi bỏ SQLite single-file).

## 4. ⭐ Khuyến nghị
- Pilot hiện tại → **KHÔNG đụng GĐ3** (over-engineering).
- **Làm GĐ1 ngay**, ưu tiên: (a) `busy_timeout` (1 dòng, risk ~0) → (b) phân trang list + bỏ N+1 → (c) compound index → (d) FE lazy load + bỏ limit 5000 → (e) rate limit.
- Chỉ sang **GĐ2** khi dashboard/list bắt đầu chậm (>1-2s) hoặc BG vượt vài chục nghìn. **GĐ3** khi nhiều writer xếp hàng rõ rệt hoặc quota sắp cạn.

## 5. Thay đổi dữ liệu
- GĐ1: **chỉ thêm INDEX** qua 1 migration (không bảng/cột nghiệp vụ mới). `busy_timeout/synchronous` là cấu hình runtime ở `database.js` (không phải migration).
- GĐ2 (nếu archive): thêm `archived INTEGER NOT NULL DEFAULT 0` hoặc bảng `quotations_archive`.

## 6. ❓ Cần bạn quyết
1. **Pilot dự kiến**: bao nhiêu đại lý + báo giá/tháng trong 6-12 tháng tới? (quyết có cần GĐ2 sớm không)
2. List báo giá có **thực sự cần `items_count`** (số dòng) mỗi dòng không? Không cần → bỏ N+1 là quick win sạch nhất.
3. Chấp nhận đổi API list sang **dạng phân trang** `{data, total, page}` (phải sửa cả FE dealer + admin) không?
4. Có ràng buộc giữ **lịch sử báo giá vĩnh viễn** (kế toán/pháp lý)? → GĐ2 phải archive chứ không xoá.
5. Ngân sách hạ tầng: sẵn sàng trả **Postgres + object storage** khi cần GĐ3, hay bám free tier càng lâu càng tốt?

---

## 🔗 Liên hệ giữa 2 tính năng
- Tính năng 1 (snapshot) làm **tăng dữ liệu** → phải đi kèm tư duy GĐ1/GĐ2 của tính năng 2 (phân trang + index cho cả trang "Lịch sử xuất").
- Cùng nguyên tắc: **DB chỉ lưu URL/metadata + snapshot nhẹ; không nhồi file nhị phân vào SQLite**.
