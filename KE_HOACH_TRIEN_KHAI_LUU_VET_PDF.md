# KẾ HOẠCH TRIỂN KHAI — TÍNH NĂNG "LƯU VẾT PDF"

> Tài liệu **kỹ thuật triển khai**. Nghiệp vụ chi tiết xem [NGHIEP_VU_LUU_VET_PDF.md](NGHIEP_VU_LUU_VET_PDF.md).
> Gồm 2 phần: **A. việc bạn tự làm 1 lần** (setup Google Drive) — **B. việc code** (chia bước, mỗi bước test được).
>
> 4 quyết định đã chốt (v1): ① chỉ PDF · ② gộp theo vân tay nội dung + khoá nút 3s · ③ chỉ admin xem · ④ giữ file Drive vĩnh viễn.

---

## Ý TƯỞNG KỸ THUẬT CỐT LÕI (đọc trước khi vào chi tiết)

Hiện tại nút **📄 PDF** ([quotation-edit.html:279](public/dealer/quotation-edit.html#L279)) gọi `exportPDF()` ([quotation-edit.js:830](public/dealer/quotation-edit.js)) → render `renderPreview()` vào `.q-print-root` → đặt `@page` theo chiều cao → `window.print()`.

**Cách làm thông minh:** server **không** viết lại logic render template. Server bật **Chromium ẩn (Puppeteer)** mở **chính trang đó** (`quotation-edit.html?id=X`), tiêm sẵn token đăng nhập vào `localStorage['dls_token']`, đợi trang tự render xong, rồi gọi `page.pdf()`.

→ **Tái dùng 100%** `renderPreview()` + `profile-templates.js` + CSS hiện có. PDF ra **giống hệt** bản đại lý tự in. Sau này sửa template, không phải đụng tới code render PDF.

```
Đại lý bấm 📄  ─►  POST /api/dealer/quotations/:id/export
                        │
                        ▼
   server: mint JWT ngắn hạn (5')  ─►  Puppeteer mở
   http://localhost:PORT/dealer/quotation-edit.html?id=X&server_pdf=1
   (tiêm localStorage['dls_token']=JWT trước khi trang chạy)
                        │  trang tự fetch API + render preview + set window.__PDF_READY__=true
                        ▼
   page.pdf()  ─►  Buffer PDF  ─►  tính content_hash
                        │
              ┌─────────┴──────────┐
       hash trùng lần trước?    hash khác / lần đầu
        update export_count       upload Google Drive
        trả link cũ               + INSERT export_archives
                        │
                        ▼
        trả { success, file_url } ─► toast cho đại lý
```

**Phụ thuộc mới cần cài:** `puppeteer-core` (điều khiển Chromium) + `googleapis` (Drive API). Chromium **không** bundle trong npm mà cài qua Nixpacks (nhẹ + ổn trên Railway $5) — xem bước B6.

---

# PHẦN A — SETUP GOOGLE DRIVE (bạn tự làm, ~15 phút, 1 lần)

> Mục tiêu: có **1 file JSON key** (tài khoản dịch vụ) + **1 Folder ID** để dán vào biến môi trường. Không cần quyền IT, dùng Gmail thường.

### A1. Tạo project trên Google Cloud
1. Vào https://console.cloud.google.com → đăng nhập Gmail.
2. Góc trên, bấm dropdown project → **New Project** → đặt tên `dai-ly-so-drive` → **Create**.
3. Chọn project vừa tạo (đảm bảo thanh trên hiển thị đúng tên).

### A2. Bật Google Drive API
1. Menu trái → **APIs & Services** → **Library**.
2. Tìm **"Google Drive API"** → bấm vào → **Enable**.

### A3. Tạo Service Account (tài khoản dịch vụ)
1. **APIs & Services** → **Credentials** → **Create Credentials** → **Service account**.
2. Tên: `dls-uploader` → **Create and Continue** → (bỏ qua phần role) → **Done**.
3. Trong danh sách Service Accounts, bấm vào account vừa tạo → tab **Keys** → **Add Key** → **Create new key** → chọn **JSON** → **Create**.
4. Trình duyệt tải về 1 file `.json`. **Đây là chìa khoá — giữ bí mật, không commit lên git.**
5. Mở file JSON, copy giá trị `client_email` (dạng `dls-uploader@…iam.gserviceaccount.com`) — cần ở bước A4.

### A4. Tạo thư mục Drive + chia sẻ cho Service Account
1. Vào https://drive.google.com → **New** → **New folder** → đặt tên `LuuVet_PDF_DaiLy`.
2. Mở thư mục đó → bấm phải → **Share** → dán **client_email** ở bước A3 → quyền **Editor** → **Send** (bỏ tích "notify").
   *(Service Account giờ có quyền ghi file vào thư mục này.)*
3. Vẫn ở trong thư mục, nhìn thanh địa chỉ trình duyệt:
   `https://drive.google.com/drive/folders/`**`1AbC2dEfG3hIjK…`** → phần in đậm là **Folder ID**. Copy lại.

### A5. Bàn giao cho phần code
Gửi mình (hoặc tự dán vào `.env` server) **2 thứ**:
- **Nội dung file JSON** (toàn bộ) → sẽ thành biến `GDRIVE_SA_KEY`.
- **Folder ID** → biến `GDRIVE_FOLDER_ID`.

> ⚠️ **Bảo mật:** file JSON key chỉ nằm trong biến môi trường server (Railway → Variables). KHÔNG để trong `public/`, KHÔNG commit. `.env` đã nằm trong `.gitignore` (cần verify ở bước B1).

> 📌 **Lưu ý quota:** Service Account **không có** dung lượng riêng — file đếm vào **15GB Drive của Gmail bạn** (chủ thư mục). Đủ cho v1 (~1+ năm). Khi gần đầy → Phase 2.

---

# PHẦN B — CÁC BƯỚC CODE (theo thứ tự, mỗi bước test được)

> Quy ước dự án (CLAUDE.md): migration = file mới `NNN_*.js`; cột mới NULL/DEFAULT; money INTEGER; mọi query dealer phải filter `dealer_id`; layer `routes → controllers → services → models`.

## B0. Thêm phụ thuộc + biến môi trường

**Cài package:**
```
npm i puppeteer-core googleapis
```
*(không cài `puppeteer` full vì nó tải Chromium ~300MB; ta dùng Chromium hệ thống qua Nixpacks ở B6.)*

**Thêm vào [src/config/env.js](src/config/env.js)** khối mới:
```js
gdrive: {
  saKey: optional('GDRIVE_SA_KEY', ''),        // nội dung JSON service account
  folderId: optional('GDRIVE_FOLDER_ID', ''),
},
pdf: {
  chromiumPath: optional('CHROMIUM_PATH', ''), // đường dẫn Chromium (Railway set; local tự dò)
  baseUrl: optional('APP_PRINT_BASE_URL', `http://localhost:${optional('PORT', 3000)}`),
},
```

**`.env` local** thêm (điền giá trị từ Phần A):
```
GDRIVE_SA_KEY={"type":"service_account",...}   # cả JSON 1 dòng
GDRIVE_FOLDER_ID=1AbC2dEfG3hIjK...
# CHROMIUM_PATH= (local để trống, code tự dò Chrome/Edge đã cài)
```

**Test:** `node -e "require('./src/config/env')"` không lỗi. `git status` không thấy `.env`.

---

## B1. Migration `021_export_archives.js`

Tạo [src/db/migrations/021_export_archives.js](src/db/migrations/021_export_archives.js) theo đúng pattern file 019/020 (`module.exports = { description, up(db) }`, idempotent).

**Bảng `export_archives`** (metadata-only, không lưu nội dung PDF):
```sql
CREATE TABLE IF NOT EXISTS export_archives (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  dealer_id            INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  export_kind          TEXT NOT NULL,            -- 'quotation' | 'profile'
  quotation_id         INTEGER REFERENCES quotations(id) ON DELETE SET NULL,  -- NULL nếu profile / BG đã xoá
  so_bao_gia           TEXT,                     -- snapshot số BG lúc xuất
  file_type            TEXT NOT NULL DEFAULT 'pdf',
  exported_by_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  exported_by_username TEXT,                     -- snapshot username
  exported_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_exported_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- lần xuất gần nhất cùng nội dung
  export_count         INTEGER NOT NULL DEFAULT 1,                   -- số lần xuất cùng nội dung
  ip                   TEXT,
  content_hash         TEXT,                     -- vân tay nội dung để gộp trùng
  storage_provider     TEXT NOT NULL DEFAULT 'gdrive',
  file_id              TEXT,                     -- Drive file ID
  file_url             TEXT,                     -- Drive webViewLink
  file_name            TEXT,
  file_size            INTEGER,
  status               TEXT NOT NULL DEFAULT 'success',  -- 'success' | 'failed'
  error_message        TEXT,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_export_archives_dealer ON export_archives(dealer_id, exported_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_archives_quotation ON export_archives(quotation_id);
CREATE INDEX IF NOT EXISTS idx_export_archives_hash ON export_archives(dealer_id, export_kind, quotation_id, content_hash);
```
Cập nhật [src/db/schema.sql](src/db/schema.sql) cho khớp (reference, không runtime).

**Test:** `npm run db:migrate` → log `Applied 021`. Chạy lại → `up to date` (không lỗi double).

---

## B2. Service render PDF (Puppeteer)

Tạo `src/services/pdf-render.service.js`:
- `launchBrowser()`: `puppeteer-core.launch({ executablePath: resolveChromium(), headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] })`.
  - `resolveChromium()`: ưu tiên `env.pdf.chromiumPath`; local Windows tự dò Edge/Chrome (`C:\Program Files\…\chrome.exe` / `msedge.exe`).
- `renderToPdf({ path, token })`:
  1. `mintExportToken(user)` → JWT ngắn hạn (5') bằng [src/utils/jwt.js](src/utils/jwt.js).
  2. `page.evaluateOnNewDocument(t => localStorage.setItem('dls_token', t), token)` — tiêm token **trước** khi script trang chạy → trang tưởng đang đăng nhập.
  3. `page.goto(env.pdf.baseUrl + path, { waitUntil: 'networkidle0', timeout: 30000 })`.
  4. `page.waitForFunction('window.__PDF_READY__ === true', { timeout: 30000 })`.
  5. `const buf = await page.pdf({ printBackground: true, preferCSSPageSize: true })` — tôn trọng `@page` mà JS trang tự set.
  6. `finally { await browser.close() }`.
- Quản lý vòng đời: dùng **1 browser tái sử dụng** (singleton) thay vì mở/đóng mỗi request (tiết kiệm RAM/thời gian); mỗi export mở 1 `page` rồi đóng page. Có timeout + try/catch trả lỗi rõ ràng.

**Sửa frontend (nhỏ) — thêm chế độ render server, KHÔNG bật hộp thoại in:**
- [quotation-edit.js](public/dealer/quotation-edit.js): trong nhánh khởi tạo (chỗ xử lý `?print=1` ở dòng ~454), thêm: nếu URL có `?server_pdf=1` → gọi hàm `renderForServer()` = giống `exportPDF()` nhưng **bỏ `window.print()`**, thay bằng `window.__PDF_READY__ = true` sau khi đã render xong + set `@page`.
- [profile.html](public/dealer/profile.html): tương tự cho `printProfile` — nhánh `?server_pdf=1` render rồi set cờ.

**Test (chưa cần Drive):** viết script tạm `node scripts/test-render.js` gọi `renderToPdf` cho 1 BG có thật → ghi ra `scratchpad/test.pdf` → mở xem có đúng layout không.

---

## B3. Service Google Drive

Tạo `src/services/gdrive.service.js`:
- `getClient()`: `new google.auth.GoogleAuth({ credentials: JSON.parse(env.gdrive.saKey), scopes: ['https://www.googleapis.com/auth/drive.file'] })`.
- `uploadPdf({ buffer, fileName })`:
  1. (tuỳ chọn) đảm bảo subfolder theo `dealer_id` tồn tại trong `folderId` (tạo nếu chưa) → giữ Drive gọn.
  2. `drive.files.create({ requestBody: { name, parents:[folderId] }, media: { mimeType:'application/pdf', body: Readable.from(buffer) }, fields:'id,webViewLink' })`.
  3. (nếu muốn admin mở link không cần login Drive) set permission `reader/anyone` hoặc chỉ chia sẻ trong tổ chức — **mặc định v1: để private**, admin mở bằng tài khoản chủ Drive. Trả `{ file_id, file_url }`.
- `checkFileAlive(file_id)`: `drive.files.get` → bắt 404 → trả trạng thái `deleted` (dùng cho badge "Bị xoá" khi admin tải lại).

**Test:** script tạm upload `scratchpad/test.pdf` → in ra link → mở link kiểm tra file lên Drive đúng thư mục.

---

## B4. Model + Service nghiệp vụ lưu vết

**Model** `src/models/export-archive.model.js` (theo pattern [audit.model.js](src/models/audit.model.js)):
- `findLatestByContent({ dealer_id, export_kind, quotation_id })` → lấy bản gần nhất để so hash.
- `bumpExisting(id)` → `export_count = export_count + 1, last_exported_at = CURRENT_TIMESTAMP`.
- `insert(record)` → tạo dòng mới.
- `list({ dealer_id?, export_kind?, from?, to?, limit })` → cho admin, JOIN `dealers` lấy `ten_dai_ly, dealer_code`, sort `exported_at DESC`.
- `markStatus(file_id, status)` → cập nhật khi phát hiện file Drive bị xoá.

**Service** `src/services/export-archive.service.js` — hàm `exportQuotation(dealerId, user, quotationId, ip)`:
1. Load BG qua [quotation.service.js](src/services/quotation.service.js) (đã filter dealer_id) → 404 nếu không thuộc đại lý.
2. Tính `content_hash = sha256(canonicalJSON(bg))` (các trường ảnh hưởng nội dung in: khách, items, giá, tổng, template, brand colors).
3. `findLatestByContent(...)`:
   - **Trùng hash** → `bumpExisting(id)` → trả `{ success, file_url, deduped:true }` (KHÔNG render lại, KHÔNG upload — tiết kiệm).
   - **Khác/không có** → `renderToPdf` → `uploadPdf` → `insert(...)` → trả `{ success, file_url }`.
4. Lỗi render/upload → `insert({ status:'failed', error_message })` + trả `{ success:false, message }` (KHÔNG ném lỗi 500 — data BG không bị ảnh hưởng).
5. Ghi audit `quotation.export` qua [audit.model.js](src/models/audit.model.js).
- `exportProfile(dealerId, user, ip)` tương tự, `export_kind='profile'`, `quotation_id=null`, hash từ dữ liệu hồ sơ.

**Test:** unit-test thủ công gọi service 2 lần liên tiếp cùng BG → lần 2 `deduped:true`, DB chỉ 1 dòng `export_count=2`. Sửa giá → gọi lại → 2 dòng.

---

## B5. Endpoints + Frontend

**Routes đại lý** ([dealer.routes.js](src/routes/dealer.routes.js)):
```js
router.post('/quotations/:id/export', quotationController.exportPdf);
router.post('/profile/export',        profileController.exportPdf);
```
Controller đọc `req.dealerId`, `req.user`, `req.ip` → gọi service → trả JSON. **Rate-limit** riêng (dùng `express-rate-limit` đã có): tối đa ~10 lần/phút/đại lý (chống spam tầng server, bổ sung cho khoá nút 3s ở FE).

**Frontend đại lý:**
- Sửa `exportPDF()` ([quotation-edit.js](public/dealer/quotation-edit.js)) + `printProfile()` ([profile.html](public/dealer/profile.html)): thay vì `window.print()`, gọi `await API.post('/api/dealer/quotations/'+id+'/export')` → hiện **toast xanh** "Đã lưu bản xuất PDF" + nút **[Mở Drive]** (`file_url`) / **[Tải máy]**; lỗi → **toast đỏ** (BG không bị ảnh hưởng).
- **Khoá nút 3s** sau mỗi lần bấm (`:disabled` + cờ `exporting` + `setTimeout`).
- Nút "Tải" trên [quotations.html](public/dealer/quotations.html): trỏ sang cùng cơ chế export (ghi vết).
- *(Cờ `window.__PDF_READY__` + nhánh `?server_pdf=1` đã làm ở B2 phục vụ Puppeteer — không ảnh hưởng nút thường.)*

**Routes admin** ([admin.routes.js](src/routes/admin.routes.js)):
```js
router.get('/pdf-exports', exportArchiveController.list);   // filter: from,to,dealer_id,type,limit
router.delete('/pdf-exports/:id', exportArchiveController.remove);   // tuỳ chọn, có xác nhận
```

**Frontend admin — màn mới** `public/admin/pdf-exports.html` (clone layout [audit.html] / [products.html](public/admin/products.html): dùng `admin-shell.js`, Alpine, filter bar, bảng, phân trang FE `limit=5000`):
- Cột: STT · Ngày xuất · Đại lý (link `dealer-detail.html?id=`) · Loại (badge) · Số BG · Người xuất · Trạng thái link · [Mở Drive].
- Filter: từ ngày / đến ngày / đại lý (dropdown từ `/api/admin/dealers`) / loại.
- Thêm link **"Lịch sử xuất file"** vào nav trong `admin-shell.js`.
- **Tab "Lịch sử xuất"** trong `dealer-detail.html`: cùng bảng, ẩn filter "Đại lý", cố định `dealer_id` đang xem.

**Test:** xuất vài BG/hồ sơ ở UI đại lý → mở màn admin thấy đủ dòng, badge đúng, bấm "Mở Drive" mở file, filter chạy, tab trong dealer-detail lọc đúng 1 đại lý.

---

## B6. Cấu hình Chromium cho Railway (deploy)

Railway dùng **Nixpacks**. Thêm `nixpacks.toml` ở gốc để cài Chromium:
```toml
[phases.setup]
nixPkgs = ["...", "chromium"]   # giữ các pkg mặc định, thêm chromium

[variables]
CHROMIUM_PATH = "/nix/store/.../bin/chromium"   # hoặc set qua Railway Variables
```
*(Cách ổn định hơn: cài `chromium` rồi set `CHROMIUM_PATH` = kết quả `which chromium` trong build; hoặc dùng buildpack apt. Sẽ chốt chính xác lúc deploy.)*

**Biến môi trường Railway** (Settings → Variables): `GDRIVE_SA_KEY`, `GDRIVE_FOLDER_ID`, `CHROMIUM_PATH`, `APP_PRINT_BASE_URL=http://localhost:$PORT`.

**RAM:** Chromium + 1 page ~150–300MB. Gói $5 (~8GB) thừa sức cho vài export đồng thời. Dùng browser singleton + đóng page sau mỗi lần để tránh rò rỉ.

**Test:** deploy staging → xuất 1 BG thật → kiểm tra file lên Drive + dòng lưu vết.

---

# THỨ TỰ THỰC HIỆN & MỐC KIỂM TRA

| Bước | Nội dung | Test xong khi |
|------|----------|---------------|
| A1–A5 | Bạn setup Google Drive | Có JSON key + Folder ID |
| B0 | Package + env | `require('env')` OK, `.env` không bị track |
| B1 | Migration 021 | `db:migrate` tạo bảng, chạy lại không lỗi |
| B2 | Render PDF Puppeteer | `test.pdf` ra đúng layout (local) |
| B3 | Upload Drive | File lên đúng thư mục Drive |
| B4 | Service lưu vết + dedup | Xuất 2 lần cùng ND = 1 dòng; sửa ND = 2 dòng |
| B5 | Endpoints + UI | Đại lý xuất thấy toast; admin thấy danh sách |
| B6 | Railway Chromium | Xuất chạy được trên server thật |

**Phụ thuộc giữa các bước:** B2 & B3 độc lập (làm song song được) → B4 cần cả hai → B5 cần B4 → B6 cuối cùng. Phần A nên làm trước hoặc song song B0–B2 (chỉ B3 mới thật sự cần key Drive).

---

# RỦI RO & GIẢM THIỂU

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Chromium không cài được trên Railway | Test deploy sớm (B6); fallback dùng image Docker có sẵn Chromium |
| Puppeteer render sai layout vs bản in tay | Tái dùng đúng trang + `preferCSSPageSize` → khớp; so trực tiếp với `window.print()` khi test |
| Token tiêm localStorage hết hạn giữa render | JWT 5' đủ dài; render thường <10s |
| Drive 15GB đầy dần | v1 theo dõi; Phase 2 dọn/nâng cấp (đã chốt) |
| Đại lý sửa BG đúng lúc render → lệch <5s | Chấp nhận ở v1; muốn tuyệt đối → lock BG khi render (Phase 2) |
| RAM rò rỉ do browser | Singleton browser + đóng page mỗi lần + restart định kỳ nếu cần |

---

# NGOÀI PHẠM VI v1 (Phase 2)

- Đại lý tự xem lịch sử của mình (đã chốt: v1 chỉ admin).
- Lưu vết Excel.
- Dọn file Drive theo retention / nâng Google One.
- Lock BG khi render để snapshot tuyệt đối.
- Job định kỳ quét `checkFileAlive` cập nhật badge "Bị xoá".
