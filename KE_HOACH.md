# Kế hoạch — Dealer Suite (Hồ sơ + Báo giá)

## 0. Mục tiêu thật của project

**Bên ngoài (cho đại lý):** tool miễn phí giúp đại lý làm hồ sơ giới thiệu năng lực + tạo báo giá chuyên nghiệp gửi khách hàng.

**Bên trong (cho admin = ông):** thu thập market data từ hoạt động hằng ngày của đại lý:
- KH nào đang được báo giá (danh sách KH từ tất cả đại lý)
- Giá thị trường thực (đại lý đang chào KH giá bao nhiêu)
- Sản phẩm gì đang chạy (catalog + tần suất xuất hiện trong báo giá)
- Đại lý nào active, năng lực ra sao

→ Hệ quả: **UX cho đại lý phải đủ ngon** để họ dùng hằng ngày, và **admin dashboard là tính năng CHÍNH** về mặt business (dù về user-facing thì đại lý dùng nhiều hơn).

---

## 1. Stack đề xuất

| Layer | Chọn | Lý do |
|---|---|---|
| **Backend** | Node.js + Express | Tái dùng scaffold ở `Ho_So_dealer/backend`. Stack quen, đủ nhanh |
| **Database** | SQLite (file đơn) | Đủ cho quy mô vài trăm đại lý. Đổi Postgres sau dễ. Railway hỗ trợ SQLite |
| **Frontend** | HTML + **Tailwind CSS** + **Alpine.js** | Không cần build step, không cần React. Tailwind cho UI hiện đại, Alpine cho interactivity. **Code mới hoàn toàn**, 2 file HTML cũ chỉ tham khảo data fields, KHÔNG đưa vào project |
| **Ngôn ngữ UI** | **100% tiếng Việt** | Đại lý không hiểu tiếng Anh. Format số/ngày kiểu VN |
| **Auth** | JWT, **username + password** (không phải email) | Đại lý nhớ username dễ hơn email. Vd: `duongle` / `duongdeptrai123` |
| **PDF Export** | Print-to-PDF browser (`window.print()` + `@media print`) | Không cần Puppeteer server. PDF render từ data lưu trong DB |
| **Image storage** | **Cloudinary free tier** (25GB) | Auto optimize WebP + CDN + resize URL-based. ~10 ảnh/đại lý cố định, dư xa cho 5000+ đại lý. Xem mục 3 |
| **Hosting** | **Railway** (có persistent volume cho ảnh) | ✅ Đã chốt |

---

## 2. Database schema (sơ bộ)

```sql
-- Tài khoản & quyền
users (
  id INTEGER PK,
  username TEXT UNIQUE,      -- vd 'duongle', 'daily_ha'
  password_hash TEXT,
  full_name TEXT,            -- tên hiển thị
  role TEXT,                 -- 'admin' | 'dealer'
  dealer_id INTEGER FK,      -- NULL nếu là admin
  created_at, last_login_at
)

-- Đại lý (1-1 với 1 user dealer)
dealers (
  id INTEGER PK,
  dealer_code TEXT UNIQUE,   -- vd 'DL-001' (admin tự cấp)
  ten_dai_ly, chu_dai_ly, phone, email, mst,
  address, district, province, coverage,
  years_experience, team_size, projects_monthly, open_hours,
  status TEXT,               -- 'active' | 'inactive'
  created_at, updated_at
)

-- Hồ sơ marketing (1-1 với dealer)
dealer_profiles (
  dealer_id INTEGER PK FK,
  tagline, usp_text, services_text, commitments_text, quote, cta,
  badge1, badge2, badge3,
  usp_highlight1, usp_highlight2, usp_highlight3,
  metric1, metric1_label, metric2, metric2_label, metric3, metric3_label,
  project_caption1, project_caption2, project_caption3,
  selected_template TEXT,    -- 't1'..'t5'
  updated_at
)

-- Ảnh của đại lý (1-N)
dealer_images (
  id INTEGER PK,
  dealer_id INTEGER FK,
  slot TEXT,    -- 'logo' | 'hero' | 'warehouse' | 'team1' | 'team2' | 'owner' | 'qr' | 'project1' | 'project2' | 'project3'
  url TEXT      -- hoặc base64 nếu lưu inline (xem câu hỏi cuối)
)

-- Catalog sản phẩm của mỗi đại lý
products (
  id INTEGER PK,
  dealer_id INTEGER FK,
  ma_sp TEXT,
  nhom_sp TEXT,                  -- 'Cửa nhôm' | 'Cửa thép' | 'Phụ kiện' | 'Vật tư' | 'Combo' | ...
  mo_ta TEXT,
  dvt_mac_dinh TEXT,             -- 'bộ' | 'cái' | 'm²' | 'mét' | 'kg' | 'set'
  cach_tinh_gia TEXT,            -- 'kich_thuoc' (rộng×cao) | 'dien_tich' (m²) | 'dai' (mét dài) | 'can' (kg) | 'so_luong' (chỉ SL)
  don_gia_mac_dinh INTEGER,
  active BOOLEAN,
  created_at, updated_at
)

-- Khách hàng (CRM nhỏ cho đại lý)
customers (
  id INTEGER PK,
  dealer_id INTEGER FK,
  ma_kh TEXT,            -- 'KH-0001' (auto-gen per dealer)
  ten_kh TEXT,
  nguoi_lien_he, phone, email,
  dia_chi, ghi_chu,
  created_at, updated_at
)

-- Header báo giá
quotations (
  id INTEGER PK,
  dealer_id INTEGER FK,
  customer_id INTEGER FK,
  so_bao_gia TEXT,       -- 'BG-2026-001' (auto-gen per dealer per year)
  ngay_bao_gia DATE,
  dia_chi_cong_trinh TEXT,
  ghi_chu_ho_so TEXT,
  ghi_chu_thuong_mai TEXT,

  tam_tinh INTEGER,
  chi_phi_van_chuyen INTEGER,
  chi_phi_lap_dat INTEGER,
  vat_percent REAL,
  vat_amount INTEGER,
  tong_cong INTEGER,

  thanh_toan TEXT,       -- 'Đặt cọc 40% · 50% khi giao · 10% nghiệm thu'
  tien_do TEXT,
  bao_hanh TEXT,

  status TEXT,           -- 'draft' | 'sent' | 'confirmed' | 'cancelled'
  sent_at DATETIME,      -- NULL nếu chưa gửi. Set khi đại lý click "Đánh dấu đã gửi"
  sent_method TEXT,      -- 'zalo' | 'email' | 'in_giay' | 'khac' — đại lý chọn lúc đánh dấu
  sent_note TEXT,        -- ghi chú tự do (vd "đã gửi qua Zalo lúc 14:30")

  created_at, updated_at
)

-- Line items (LINH HOẠT — không cứng rộng/cao)
quotation_items (
  id INTEGER PK,
  quotation_id INTEGER FK,
  stt INTEGER,
  product_id INTEGER FK NULL,    -- NULL nếu nhập tự do, không có trong catalog
  nhom_sp, ma_sp, mo_ta,         -- snapshot tại lúc tạo (đỡ rối khi đổi catalog sau)

  -- Cách tính giá đa dạng:
  cach_tinh_gia TEXT,            -- 'kich_thuoc' | 'dien_tich' | 'dai' | 'can' | 'so_luong'
  rong INTEGER NULL,             -- mm, chỉ điền khi cach_tinh_gia='kich_thuoc'
  cao INTEGER NULL,              -- mm, chỉ điền khi cach_tinh_gia='kich_thuoc'
  dien_tich REAL NULL,           -- m², khi cach_tinh_gia='dien_tich'
  dai REAL NULL,                 -- mét, khi cach_tinh_gia='dai'
  can_nang REAL NULL,            -- kg, khi cach_tinh_gia='can'

  sl REAL,                       -- số lượng (cho phép thập phân vd 1.5 m)
  dvt TEXT,                      -- 'bộ' | 'cái' | 'm²' | 'mét' | 'kg' | 'set' — đại lý tự gõ hoặc chọn
  don_gia INTEGER,               -- đơn giá theo dvt
  thanh_tien INTEGER             -- tính tự động theo cách tính giá
)
```

**Nguyên tắc:**
- Snapshot data sản phẩm vào `quotation_items` (đỡ rối khi đại lý xoá/sửa product sau này)
- `so_bao_gia` auto-generate theo format `BG-{year}-{seq}`, seq tăng theo dealer mỗi năm
- Tất cả query backend đều WHERE `dealer_id = current_user.dealer_id` (trừ admin)

---

## 2b. Báo giá — các case sản phẩm phải đáp ứng

Template hiện tại đang cứng "Rộng × Cao" cho mọi line item — SAI. Ngành cửa có nhiều loại sản phẩm tính giá khác nhau:

| Cách tính giá (`cach_tinh_gia`) | Áp dụng cho | Trường nhập | Ví dụ thành tiền |
|---|---|---|---|
| `kich_thuoc` (Rộng × Cao) | Cửa nhôm, cửa thép, cửa gỗ — sản phẩm có khổ | rong, cao, sl | 1.8m × 2.4m × 2 bộ × đơn giá/m² |
| `dien_tich` (m²) | Tấm panel, kính cường lực, tôn tấm | dien_tich, sl | 12.5 m² × đơn giá/m² |
| `dai` (mét dài) | Ray nhôm, gioăng, dây cáp, ống nhựa | dai, sl | 8 m × đơn giá/mét |
| `can` (kg) | Tôn rời, sắt thép vụn, phụ kiện bán theo cân | can_nang, sl | 30 kg × đơn giá/kg |
| `so_luong` (chỉ SL × đơn giá) | Motor, lưu điện, khoá, tay nắm, remote, phụ kiện đếm cái | sl, dvt | 3 cái × đơn giá/cái |

UI: line item có dropdown chọn "Cách tính giá" → form tự đổi label/field cho phù hợp:
- Chọn "Theo kích thước" → hiện ô Rộng + Cao + SL
- Chọn "Theo diện tích" → hiện ô Diện tích + SL
- Chọn "Theo số lượng" → chỉ hiện SL + ĐVT (đại lý tự gõ "cái"/"bộ"/"hộp"...)
- v.v.

Nếu đại lý chọn từ catalog → autofill `cach_tinh_gia` và `dvt_mac_dinh` từ products, nhưng vẫn override được trong line item đó.

**Tổng kết báo giá** vẫn giữ nguyên: Tạm tính → + Vận chuyển → + Lắp đặt → + VAT → Tổng cộng. Cả 3 chi phí phụ này đại lý tự gõ tay (hoặc bằng 0).

---

## 3. Lưu ảnh — đánh giá lại đầy đủ

### Phạm vi ảnh (cập nhật theo ông xác nhận)

Ảnh CHỈ thuộc **hồ sơ đại lý**, KHÔNG có ảnh trong báo giá, KHÔNG có ảnh sản phẩm catalog:

| Loại ảnh | Số lượng / đại lý |
|---|---|
| Avatar chủ đại lý | 1 |
| Logo đại lý | 1 |
| Ảnh hero (banner đầu trang) | 1 |
| Ảnh kho/xưởng | 1 |
| Ảnh đội ngũ | 2 |
| QR code | 1 |
| Ảnh công trình thực tế | 3 |
| **Tổng** | **~10 ảnh cố định** |

→ Ảnh **không tăng theo thời gian** (không như báo giá đại lý đẻ ra mỗi tuần). Chỉ tăng theo SỐ ĐẠI LÝ.

### Tính dung lượng

| Quy mô | Số ảnh | Raw (~5MB/ảnh) | Đã nén (~200KB/ảnh) |
|---|---|---|---|
| Pilot 3-4 đại lý | 40 | 200 MB | 8 MB |
| 50 đại lý | 500 | 2.5 GB | 100 MB |
| 200 đại lý | 2,000 | 10 GB | 400 MB |
| 1000 đại lý | 10,000 | 50 GB | **2 GB** |

→ Với nén, **đến 1000 đại lý vẫn dưới 2GB**. Nhỏ hơn tôi tính trước 100 lần.

### So sánh các option storage theo 3 tiêu chí của ông

| Option | Chất lượng | Giá thành | Dễ code | Tổng |
|---|---|---|---|---|
| **Cloudinary** | ⭐⭐⭐⭐⭐ (CDN + auto optimize WebP, resize trên URL) | 25GB free → đủ tới 5000+ đại lý | ⭐⭐⭐⭐⭐ (SDK Node 3 dòng, có upload widget sẵn) | **🏆 Best** |
| **Cloudflare R2** | ⭐⭐⭐⭐⭐ (CDN toàn cầu) | 10GB free, $0.015/GB sau đó, không tính bandwidth | ⭐⭐⭐ (SDK S3-compatible, phải tự resize bằng `sharp`) | Tốt nếu vượt 25GB |
| **Local disk + sharp** | ⭐⭐ (không CDN, tốc độ phụ vào Railway server) | Free (đã trả Railway), nhưng volume Railway free chỉ 1GB | ⭐⭐⭐⭐ (multer + sharp, không phụ thuộc bên ngoài) | OK cho MVP nhưng phải migrate sau |
| **AWS S3** | ⭐⭐⭐⭐ (cần CloudFront thêm tiền) | $0.023/GB + bandwidth → đắt | ⭐⭐⭐ (setup IAM/bucket policy lằng nhằng) | Không đáng cho dự án này |
| **Backblaze B2** | ⭐⭐⭐ (cần CDN ngoài để nhanh) | $0.006/GB — rẻ nhất | ⭐⭐⭐ (S3-compatible nhưng ít docs hơn) | Tốt nếu siêu lớn |
| **Supabase Storage** | ⭐⭐⭐⭐ | 1GB free, $0.021/GB | ⭐⭐⭐⭐ (SDK đẹp) | OK nhưng buộc phải dùng Supabase nguyên hệ sinh thái |

### Đề xuất: **Cloudinary**

Đáp ứng tốt nhất cả 3 tiêu chí ông yêu cầu:

1. **Chất lượng**: tự động convert ảnh sang WebP cho trình duyệt hỗ trợ → ảnh nhẹ 70-80% mà sắc nét. CDN toàn cầu (đại lý ở tỉnh xa load vẫn nhanh). URL-based transform: muốn ảnh thumbnail 200x200 chỉ cần đổi URL `w_200,h_200,c_fill` — không cần resize sẵn nhiều bản.

2. **Giá thành**: free tier 25GB storage + 25GB bandwidth/tháng → dư xa cho **5000+ đại lý**. Không cần lo billing trong vài năm tới. Nếu sau quá thì plan $89/tháng (đến lúc đó user base đã đủ lớn để tài trợ).

3. **Dễ code**:
   ```js
   const cloudinary = require('cloudinary').v2;
   const result = await cloudinary.uploader.upload(file.path, { folder: `dealers/${dealer_id}` });
   // result.secure_url → lưu vào DB
   ```
   FE có **upload widget** copy-paste sẵn, đại lý click → popup chọn file → upload xong trả URL → mình lưu URL. Không tự xử lý multer, không tự nén, không lo serve, không lo backup.

### So sánh nhanh với cách `Cham_diem_dealer` đang làm

| | Cham_diem (local) | Cloudinary |
|---|---|---|
| Setup | multer + folder + nén sharp | npm install + 1 file config |
| Code upload | ~50 dòng | ~5 dòng |
| Tốc độ load cho user | Tùy server Railway | CDN toàn cầu, luôn nhanh |
| Backup | Tự lo | Auto replicated |
| Migrate khi scale | Phải làm lại | Không cần |
| Cost | Free đến giới hạn Railway disk | Free đến 25GB |

→ **Cloudinary thắng toàn diện cho dự án này.** Lần trước tôi đổi sang local vì sợ phụ thuộc bên ngoài, nhưng giờ tính lại đầy đủ thì Cloudinary đúng hơn.

### Triển khai cụ thể

- Đăng ký account Cloudinary free (không cần thẻ credit)
- Lấy `CLOUD_NAME`, `API_KEY`, `API_SECRET` → vào `.env`
- Backend route `POST /api/upload` → nhận file → upload Cloudinary → trả URL → FE lưu URL vào field tương ứng
- DB schema lưu `image_url` text (URL Cloudinary đầy đủ), không cần bảng `dealer_photos` riêng (mỗi ảnh là 1 field trong `dealer_profiles`: `avatar_url`, `logo_url`, `warehouse_url`, ...)
- Khi đại lý xoá/thay ảnh: gọi Cloudinary API xoá ảnh cũ → upload ảnh mới → update URL trong DB

---

## 4. Roadmap (cập nhật, có admin dashboard rộng)

| Phase | Nội dung | Thời gian |
|---|---|---|
| **0. Setup** | Tạo project mới (BE + FE), git, env, DB migration, Cloudinary setup | 1-2 ngày |
| **1. Auth + Admin tài khoản** | JWT login. Admin CRUD đại lý, cấp dealer_code, reset password | 3-4 ngày |
| **2. Module Hồ sơ — redesign** | UI mới (Tailwind), form nhập, upload ảnh Cloudinary, "Lưu hồ sơ" → DB, "Xuất PDF" → browser print | 5-6 ngày (cần thêm vì làm UI mới) |
| **3. Module Sản phẩm** | CRUD catalog của đại lý. Import Excel optional | 3 ngày |
| **4. Module Khách hàng** | CRUD KH, auto-gen mã KH, search/filter | 2 ngày |
| **5. Module Báo giá** | Form tạo báo giá: chọn KH, add line items từ catalog (hoặc nhập tự do), tính tổng + VAT. Snapshot product info. Xuất PDF. List báo giá cũ, lọc theo KH/ngày | 6-7 ngày |
| **6. Admin Dashboard** | **Trang chính cho admin**: tổng quan toàn hệ thống. Chi tiết ở mục 5 dưới | 4-5 ngày |
| **7. Deploy Railway** | Domain, HTTPS, env vars, backup DB cron, log monitoring | 2-3 ngày |
| **8. Polish** | Bug fix, mobile responsive, onboarding guide cho đại lý | 2-3 ngày |

**Tổng:** ~5-6 tuần làm 1 mình.

---

## 4. Cấu trúc thư mục đề xuất

```
Ho_so_bao_gia_dealer/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── dealers.js
│   │   │   ├── profiles.js
│   │   │   ├── products.js
│   │   │   ├── customers.js
│   │   │   └── quotations.js
│   │   ├── middleware/auth.js
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── migrations/
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── login.html
│   ├── admin/
│   │   ├── dealers.html
│   │   └── ...
│   ├── dealer/
│   │   ├── profile.html      ← port từ Ho_so_dai_ly_blue_edition_v6_custom.html
│   │   ├── products.html
│   │   ├── customers.html
│   │   └── quotation.html    ← form tạo báo giá
│   └── shared/
│       ├── api.js
│       └── styles.css
├── data/
│   └── app.db                ← SQLite, gitignore
└── README.md
```

---

## 5. Admin Dashboard — chi tiết

Đây là **trái tim** của project về mặt business. Phải có 4 view chính:

### 5.1. Overview (trang chủ admin)
- KPI tổng: số đại lý đang active, số báo giá tháng này, tổng giá trị báo giá tháng, số KH unique
- Biểu đồ doanh số báo giá theo tháng (line chart)
- Top 5 đại lý tháng này (theo số báo giá + giá trị)
- Top 5 sản phẩm xuất hiện nhiều nhất trong báo giá

### 5.2. Danh sách đại lý
- Bảng: dealer_code, tên, sđt, tỉnh, số báo giá total, doanh số total, last_active
- Filter: tỉnh, status, có/không active 30 ngày
- Click 1 dòng → drill xuống hồ sơ + tất cả báo giá + tất cả KH + tất cả products của đại lý đó
- Action: cấp tk mới, disable, reset password

### 5.3. View dữ liệu chéo (đây là cái "spy" thực sự)
- **Tất cả báo giá** (cross-dealer): xem báo giá nào, KH nào, đại lý nào, ngày nào, giá trị bao nhiêu. Filter theo ngày/đại lý/tỉnh/giá trị
- **Tất cả KH** (cross-dealer): danh sách KH unique theo SĐT/MST từ tất cả đại lý. Có thể có KH bị 2-3 đại lý cùng báo giá → flag ra để biết market đang ai chạy
- **Tất cả sản phẩm**: list products các đại lý đang bán. Phân tích: sản phẩm gì phổ biến, đơn giá range thị trường (min/max/avg)

### 5.4. Export
- Export Excel toàn bộ data theo từng module (đại lý, báo giá, KH, sản phẩm). Để admin offline analytics

→ Bảo mật: API endpoint admin tách bạch (`/api/admin/*`), check JWT role = 'admin'. Đại lý không bao giờ thấy data của đại lý khác.

---

## 6. Tên app — tiếng Việt, neutral (không gắn 1 brand cụ thể)

4 cái đề xuất:

1. **Đại Lý Số** — gợi "đại lý phiên bản số hoá". Ngắn, modern, brand-able.
2. **Sổ Tay Đại Lý** — gợi "công cụ ghi chép hằng ngày". Thân thiện với đại lý chân chất.
3. **Trợ Lý Đại Lý** — gợi "tool hỗ trợ". Rõ đối tượng dùng.
4. **Nhà Đại Lý** — gợi "ngôi nhà quản lý mọi thứ" (hồ sơ + KH + sản phẩm + báo giá).

→ Tôi nghiêng **Đại Lý Số** vì:
- Ngắn (2 chữ, dễ nhớ, dễ in lên tài liệu)
- Modern, gợi đến chuyển đổi số → phù hợp với hãng/ADG đang push digital
- Trung tính, không bó vào 1 module nào (không như "Sổ Tay" bó vào ghi chép, hay "Trợ Lý" có cảm giác phụ trợ)

Domain gợi ý: `dailyso.vn`, `dailyso.com`, `dailyso.app`.

---

## 7. UX/UI — concept redesign

Template HTML hiện tại (Blue Edition v6) "khá đần" — sẽ làm lại.

**Concept đề xuất:**
- **Style**: clean, modern, navy + gold accent. Reference: Stripe Dashboard, Linear, Notion.
- **Layout 2 vai trò khác nhau:**
  - **Admin**: layout dashboard kiểu analytics (sidebar trái cố định, top KPI cards, table + chart). Tham khảo Vercel Dashboard.
  - **Dealer**: layout app kiểu workspace (sidebar trái nav giữa các module, main content rộng, form gọn). Tham khảo Notion/Linear.
- **Mobile responsive**: đại lý hay dùng điện thoại — form phải gõ được trên mobile, list scroll được. Báo giá in PDF chắc vẫn cần desktop.
- **Print stylesheet**: tách riêng `@media print` cho PDF — bố cục PDF không cần giống màn hình.
- **Component library**: Tailwind + Alpine.js. Có thể bốc 1 ít từ shadcn/ui (port thuần CSS không React).

**Số mẫu hồ sơ**: HTML cũ có 5 mẫu (t1-t5). Hỏi ông: giữ 5 mẫu hay rút còn 2-3 mẫu (1 modern, 1 classic, 1 minimal)? Nhiều mẫu tốn công làm + bảo trì.

---

## 8. Đã chốt — Quyết định cuối

| Câu hỏi | Quyết |
|---|---|
| Lưu KH thành bảng | ✅ Có |
| Auth | ✅ Username + password (không phải email) |
| Lưu ảnh | ✅ Cloudinary free tier — đủ tới 5000+ đại lý, không cần migrate |
| Tên app | ✅ **Đại Lý Số** |
| UI language | ✅ 100% tiếng Việt (code/DB tiếng Anh OK) |
| Tái dùng HTML cũ | ❌ Không. Code mới hoàn toàn, 2 file HTML chỉ tham khảo data fields |
| Báo giá cách tính giá | ✅ Linh hoạt 5 cách: kích thước / diện tích / mét dài / cân / số lượng |
| Deploy | ✅ Railway |
| Số mẫu hồ sơ | ✅ Giữ 5 mẫu (sẽ redesign UI/UX) |
| Brand neutral (không gắn 1 hãng cụ thể) | ✅ |
| Quy mô | ✅ Pilot 3-4 đại lý trước, scale sau |
| Thợ có account riêng | ❌ Không — thợ dùng nhờ account của đại lý (share password) |

**Hệ quả của "thợ dùng nhờ":**
- Không cần sub-account / multi-user trong 1 dealer
- Không cần permission chi tiết (kiểu "thợ chỉ tạo báo giá, không sửa hồ sơ")
- Đại lý tự quản lý chuyện share password cho thợ của họ
- Đỡ 1 đống code RBAC phức tạp

**Hệ quả của "pilot 3-4 đại lý":**
- SQLite + Railway free tier thừa sức
- Cloudinary free tier 25GB dư xa
- Có thể tách roadmap thành 2 milestone:
  - **MVP (~4 tuần)**: Phase 0-5 + deploy basic → 3-4 đại lý pilot dùng được
  - **V1 (~2 tuần thêm)**: Phase 6 admin dashboard + polish, sau khi có data thật từ pilot

---

## 9. Tất cả đã chốt — Sẵn sàng Phase 0

Mọi quyết định đã rõ. Phase 0 (setup project skeleton) có thể bắt đầu bất cứ lúc nào ông OK.
