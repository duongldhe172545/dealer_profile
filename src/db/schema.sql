-- =============================================================
-- Đại Lý Số - Database Schema
-- SQLite via better-sqlite3
-- =============================================================

-- -------------------------------------------------------------
-- Tài khoản đăng nhập (admin + dealer accounts)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       TEXT,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'dealer')),
  dealer_id       INTEGER REFERENCES dealers(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  last_login_at   DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_dealer ON users(dealer_id);

-- -------------------------------------------------------------
-- Đại lý (thực thể chính, 1-1 với 1 user role='dealer')
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  dealer_code         TEXT NOT NULL UNIQUE,
  ten_dai_ly          TEXT NOT NULL,
  chu_dai_ly          TEXT,
  phone               TEXT,
  email               TEXT,
  address             TEXT,
  district            TEXT,
  province            TEXT,
  coverage            TEXT,
  years_experience    TEXT,
  team_size           TEXT,
  projects_monthly    TEXT,
  open_hours          TEXT,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dealers_code ON dealers(dealer_code);
CREATE INDEX IF NOT EXISTS idx_dealers_status ON dealers(status);

-- -------------------------------------------------------------
-- Hồ sơ marketing của đại lý (1-1 với dealer)
-- Chứa text dài, tagline, USP, dịch vụ, KPI... cho 5 mẫu hồ sơ
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_profiles (
  dealer_id           INTEGER PRIMARY KEY REFERENCES dealers(id) ON DELETE CASCADE,
  tagline             TEXT,
  usp_text            TEXT,
  services_text       TEXT,
  commitments_text    TEXT,
  customer_quote      TEXT,
  cta_text            TEXT,
  badge1              TEXT,
  badge2              TEXT,
  badge3              TEXT,
  usp_highlight1      TEXT,
  usp_highlight2      TEXT,
  usp_highlight3      TEXT,
  metric1_value       TEXT,
  metric1_label       TEXT,
  metric2_value       TEXT,
  metric2_label       TEXT,
  metric3_value       TEXT,
  metric3_label       TEXT,
  project_caption1    TEXT,
  project_caption2    TEXT,
  project_caption3    TEXT,
  partners_title      TEXT,
  selected_template   TEXT NOT NULL DEFAULT 't1' CHECK (selected_template IN ('t1','t2','t3','t4','t5')),
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Ảnh hồ sơ (1-N theo dealer, 1 ảnh cho mỗi slot)
-- slot xác định ảnh đó là gì: logo, hero, kho/xưởng, đội ngũ...
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dealer_images (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  dealer_id       INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  slot            TEXT NOT NULL CHECK (slot IN (
                    'logo_dai_ly', 'avatar_chu', 'hero', 'kho_xuong',
                    'doi_ngu_1', 'doi_ngu_2', 'qr_code',
                    'cong_trinh_1', 'cong_trinh_2', 'cong_trinh_3',
                    'partner_logo_1', 'partner_logo_2', 'partner_logo_3',
                    'partner_logo_4', 'partner_logo_5'
                  )),
  url             TEXT NOT NULL,
  public_id       TEXT,
  uploaded_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (dealer_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_dealer_images_dealer ON dealer_images(dealer_id);

-- -------------------------------------------------------------
-- Sản phẩm trong catalog của từng đại lý
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  dealer_id           INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  ma_sp               TEXT NOT NULL,
  nhom_sp             TEXT,
  mo_ta               TEXT,
  dvt_mac_dinh        TEXT,
  cach_tinh_gia       TEXT NOT NULL DEFAULT 'so_luong' CHECK (cach_tinh_gia IN (
                        'kich_thuoc', 'dien_tich', 'dai', 'can', 'so_luong'
                      )),
  don_gia_mac_dinh    INTEGER NOT NULL DEFAULT 0,
  active              INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (dealer_id, ma_sp)
);

CREATE INDEX IF NOT EXISTS idx_products_dealer ON products(dealer_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(dealer_id, active);

-- -------------------------------------------------------------
-- Khách hàng của từng đại lý (CRM mini)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  dealer_id           INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  ma_kh               TEXT NOT NULL,
  ten_kh              TEXT NOT NULL,
  nguoi_lien_he       TEXT,
  phone               TEXT,
  email               TEXT,
  dia_chi             TEXT,
  ghi_chu             TEXT,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (dealer_id, ma_kh)
);

CREATE INDEX IF NOT EXISTS idx_customers_dealer ON customers(dealer_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- -------------------------------------------------------------
-- Báo giá (header)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  dealer_id               INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  customer_id             INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  so_bao_gia              TEXT NOT NULL,
  ngay_bao_gia            DATE NOT NULL,
  dia_chi_cong_trinh      TEXT,
  ghi_chu_ho_so           TEXT,
  ghi_chu_thuong_mai      TEXT,

  tam_tinh                INTEGER NOT NULL DEFAULT 0,
  chi_phi_van_chuyen      INTEGER NOT NULL DEFAULT 0,
  chi_phi_lap_dat         INTEGER NOT NULL DEFAULT 0,
  vat_percent             REAL NOT NULL DEFAULT 10,
  vat_amount              INTEGER NOT NULL DEFAULT 0,
  tong_cong               INTEGER NOT NULL DEFAULT 0,

  thanh_toan              TEXT,
  tien_do                 TEXT,
  bao_hanh                TEXT,

  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                            'draft', 'sent', 'confirmed', 'cancelled'
                          )),
  sent_at                 DATETIME,
  sent_method             TEXT CHECK (sent_method IN ('zalo', 'email', 'in_giay', 'khac') OR sent_method IS NULL),
  sent_note               TEXT,

  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (dealer_id, so_bao_gia)
);

CREATE INDEX IF NOT EXISTS idx_quotations_dealer ON quotations(dealer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_ngay ON quotations(ngay_bao_gia);

-- -------------------------------------------------------------
-- Line items của báo giá
-- Snapshot thông tin sản phẩm tại thời điểm tạo (đỡ rối khi đại lý
-- sửa/xoá catalog sau này).
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_items (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id        INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id          INTEGER REFERENCES products(id) ON DELETE SET NULL,
  stt                 INTEGER NOT NULL,

  -- snapshot từ products tại lúc thêm
  ma_sp               TEXT,
  nhom_sp             TEXT,
  mo_ta               TEXT,

  cach_tinh_gia       TEXT NOT NULL CHECK (cach_tinh_gia IN (
                        'kich_thuoc', 'dien_tich', 'dai', 'can', 'so_luong'
                      )),
  rong                INTEGER,
  cao                 INTEGER,
  dien_tich           REAL,
  dai                 REAL,
  can_nang            REAL,

  sl                  REAL NOT NULL DEFAULT 1,
  dvt                 TEXT,
  don_gia             INTEGER NOT NULL DEFAULT 0,
  thanh_tien          INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_qitems_quotation ON quotation_items(quotation_id);

-- -------------------------------------------------------------
-- Ảnh đính kèm báo giá (tối đa 5, slot 1..5)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_images (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id    INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  slot            INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 5),
  url             TEXT NOT NULL,
  public_id       TEXT,
  caption         TEXT,
  uploaded_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (quotation_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_qimg_quotation ON quotation_images(quotation_id);

-- -------------------------------------------------------------
-- Audit log — chỉ ghi 5 action quan trọng (theo yêu cầu user)
--   dealer.create | customer.create | quotation.create
--   quotation.send | quotation.confirm
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER,
  username      TEXT,
  role          TEXT,
  dealer_id     INTEGER,
  action        TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     INTEGER,
  meta_json     TEXT,
  ip            TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_dealer  ON audit_logs(dealer_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
