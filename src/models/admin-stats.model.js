// Queries tổng hợp toàn hệ thống cho admin dashboard
const db = require('../config/database');

// ────────────────────────────────────────────────────────────
// OVERVIEW KPI
// ────────────────────────────────────────────────────────────

function overview() {
  const dealersActive = db.prepare("SELECT COUNT(*) AS n FROM dealers WHERE status = 'active'").get().n;
  const dealersTotal  = db.prepare("SELECT COUNT(*) AS n FROM dealers").get().n;

  const monthStart = monthStartISO();
  const q = db.prepare(`SELECT
      COUNT(*) AS count,
      COALESCE(SUM(tong_cong), 0) AS revenue
    FROM quotations WHERE ngay_bao_gia >= ?`).get(monthStart);

  const sent = db.prepare(`SELECT COUNT(*) AS n FROM quotations
    WHERE status IN ('sent','confirmed') AND ngay_bao_gia >= ?`).get(monthStart).n;

  const customersTotal = db.prepare("SELECT COUNT(*) AS n FROM customers").get().n;
  const productsTotal  = db.prepare("SELECT COUNT(*) AS n FROM products WHERE active = 1").get().n;
  const quotationsTotal = db.prepare("SELECT COUNT(*) AS n FROM quotations").get().n;

  return {
    dealers_active:    dealersActive,
    dealers_total:     dealersTotal,
    quotations_month:  q.count,
    revenue_month:     q.revenue,
    sent_month:        sent,
    customers_total:   customersTotal,
    products_total:    productsTotal,
    quotations_total:  quotationsTotal,
  };
}

// 12 tháng gần nhất: số báo giá + doanh số
function monthlyRevenue() {
  const rows = db.prepare(`
    SELECT substr(ngay_bao_gia, 1, 7) AS ym,
           COUNT(*) AS count,
           COALESCE(SUM(tong_cong), 0) AS revenue
    FROM quotations
    WHERE ngay_bao_gia >= date('now', '-12 months')
    GROUP BY ym ORDER BY ym
  `).all();
  return rows;
}

// Top đại lý theo tháng hiện tại
function topDealers({ from, limit = 5 } = {}) {
  return db.prepare(`
    SELECT d.id, d.dealer_code, d.ten_dai_ly, d.province,
           COUNT(q.id) AS quotations_count,
           COALESCE(SUM(q.tong_cong), 0) AS revenue
    FROM dealers d
    LEFT JOIN quotations q ON q.dealer_id = d.id
      AND q.status = 'confirmed'
      ${from ? 'AND q.ngay_bao_gia >= @from' : ''}
    GROUP BY d.id
    HAVING quotations_count > 0
    ORDER BY revenue DESC, quotations_count DESC
    LIMIT @limit
  `).all({ from: from || null, limit });
}

// Top sản phẩm (theo tần suất xuất hiện trong báo giá)
function topProducts({ from, limit = 10 } = {}) {
  return db.prepare(`
    SELECT i.ma_sp, i.nhom_sp,
           COUNT(*) AS times_used,
           SUM(i.sl) AS total_sl,
           SUM(i.thanh_tien) AS total_revenue,
           AVG(i.don_gia) AS avg_price
    FROM quotation_items i
    JOIN quotations q ON q.id = i.quotation_id
    WHERE i.ma_sp IS NOT NULL AND i.ma_sp <> ''
      ${from ? 'AND q.ngay_bao_gia >= @from' : ''}
    GROUP BY i.ma_sp, i.nhom_sp
    ORDER BY times_used DESC, total_revenue DESC
    LIMIT @limit
  `).all({ from: from || null, limit });
}

// ────────────────────────────────────────────────────────────
// CROSS-DEALER VIEWS
// ────────────────────────────────────────────────────────────

function quotationsAll({ search, status, dealer_id, from, to, limit = 200 } = {}) {
  const where = [];
  const params = {};
  if (search) {
    where.push('(q.so_bao_gia LIKE @kw OR q.dia_chi_cong_trinh LIKE @kw OR c.ten_kh LIKE @kw OR d.ten_dai_ly LIKE @kw)');
    params.kw = `%${search}%`;
  }
  if (status)    { where.push('q.status = @status'); params.status = status; }
  if (dealer_id) { where.push('q.dealer_id = @dealer_id'); params.dealer_id = Number(dealer_id); }
  if (from)      { where.push('q.ngay_bao_gia >= @from'); params.from = from; }
  if (to)        { where.push('q.ngay_bao_gia <= @to');   params.to = to; }
  params.limit = limit;

  return db.prepare(`
    SELECT q.id, q.so_bao_gia, q.ngay_bao_gia, q.status, q.sent_at, q.sent_method,
           q.tong_cong, q.dia_chi_cong_trinh, q.dealer_id,
           q.thanh_toan_thuc, q.gia_von, q.order_status,
           d.dealer_code, d.ten_dai_ly, d.province AS dealer_province,
           c.ma_kh, c.ten_kh AS customer_name,
           (SELECT COUNT(*) FROM quotation_items WHERE quotation_id = q.id) AS items_count
    FROM quotations q
    LEFT JOIN dealers d ON d.id = q.dealer_id
    LEFT JOIN customers c ON c.id = q.customer_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY q.ngay_bao_gia DESC, q.id DESC
    LIMIT @limit
  `).all(params);
}

// KH cross-dealer + flag nếu trùng SĐT/email với KH của đại lý khác
function customersAll({ search, limit = 200 } = {}) {
  const where = [];
  const params = { limit };
  if (search) {
    where.push('(c.ten_kh LIKE @kw OR c.phone LIKE @kw OR c.email LIKE @kw)');
    params.kw = `%${search}%`;
  }
  return db.prepare(`
    SELECT c.id, c.ma_kh, c.ten_kh, c.nguoi_lien_he, c.phone, c.email, c.dia_chi,
           c.dealer_id, d.dealer_code, d.ten_dai_ly,
           (SELECT COUNT(*) FROM quotations q WHERE q.customer_id = c.id) AS quotations_count,
           (SELECT COALESCE(SUM(tong_cong), 0) FROM quotations q WHERE q.customer_id = c.id) AS total_value,
           (SELECT COUNT(*) FROM customers c2
              WHERE c2.id != c.id
                AND (c.phone IS NOT NULL AND c.phone <> '' AND c2.phone = c.phone)
           ) AS phone_duplicates
    FROM customers c
    LEFT JOIN dealers d ON d.id = c.dealer_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY c.created_at DESC
    LIMIT @limit
  `).all(params);
}

// Sản phẩm cross-dealer + range giá thị trường
function productsAll({ search, limit = 200 } = {}) {
  const where = [];
  const params = { limit };
  if (search) {
    where.push('(p.ma_sp LIKE @kw OR p.mo_ta LIKE @kw OR p.nhom_sp LIKE @kw)');
    params.kw = `%${search}%`;
  }
  return db.prepare(`
    SELECT p.id, p.ma_sp, p.nhom_sp, p.mo_ta, p.dvt_mac_dinh, p.cach_tinh_gia,
           p.don_gia_mac_dinh, p.active, p.dealer_id,
           d.dealer_code, d.ten_dai_ly
    FROM products p
    LEFT JOIN dealers d ON d.id = p.dealer_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.nhom_sp, p.ma_sp
    LIMIT @limit
  `).all(params);
}

// Stats theo cách tính giá: range giá theo nhóm SP (cross-dealer)
function priceRangeByGroup() {
  return db.prepare(`
    SELECT nhom_sp,
           COUNT(*) AS sp_count,
           MIN(don_gia_mac_dinh) AS min_price,
           MAX(don_gia_mac_dinh) AS max_price,
           AVG(don_gia_mac_dinh) AS avg_price
    FROM products
    WHERE active = 1 AND don_gia_mac_dinh > 0
      AND nhom_sp IS NOT NULL AND nhom_sp <> ''
    GROUP BY nhom_sp
    ORDER BY sp_count DESC
  `).all();
}

// ────────────────────────────────────────────────────────────
// DRILL-DOWN MỘT ĐẠI LÝ
// ────────────────────────────────────────────────────────────

function dealerFull(dealerId) {
  const dealer = db.prepare(`
    SELECT d.*, u.username, u.last_login_at, u.status AS user_status
    FROM dealers d
    LEFT JOIN users u ON u.dealer_id = d.id AND u.role = 'dealer'
    WHERE d.id = ?
  `).get(dealerId);
  if (!dealer) return null;

  const profile = db.prepare('SELECT * FROM dealer_profiles WHERE dealer_id = ?').get(dealerId);
  const images = db.prepare('SELECT slot, url FROM dealer_images WHERE dealer_id = ?').all(dealerId);
  const quotations = db.prepare(`
    SELECT q.id, q.so_bao_gia, q.ngay_bao_gia, q.status, q.tong_cong,
           c.ten_kh AS customer_name
    FROM quotations q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE q.dealer_id = ?
    ORDER BY q.ngay_bao_gia DESC LIMIT 50
  `).all(dealerId);
  const customers = db.prepare(`
    SELECT id, ma_kh, ten_kh, phone, email,
           (SELECT COUNT(*) FROM quotations q WHERE q.customer_id = customers.id) AS q_count
    FROM customers WHERE dealer_id = ?
    ORDER BY created_at DESC LIMIT 50
  `).all(dealerId);
  const products = db.prepare(`
    SELECT id, ma_sp, nhom_sp, mo_ta, cach_tinh_gia, don_gia_mac_dinh, active
    FROM products WHERE dealer_id = ?
    ORDER BY nhom_sp, ma_sp LIMIT 100
  `).all(dealerId);

  const totals = db.prepare(`
    SELECT COUNT(*) AS quotations_count, COALESCE(SUM(tong_cong), 0) AS revenue
    FROM quotations WHERE dealer_id = ?
  `).get(dealerId);

  return {
    dealer,
    profile: profile || null,
    images: Object.fromEntries(images.map(i => [i.slot, i.url])),
    quotations, customers, products,
    totals,
  };
}

// ────────────────────────────────────────────────────────────
// EXPORT (CSV)
// ────────────────────────────────────────────────────────────

function quotationsForExport() {
  return db.prepare(`
    SELECT q.so_bao_gia, q.ngay_bao_gia, q.status, q.sent_at, q.sent_method,
           q.tam_tinh, q.chi_phi_van_chuyen, q.chi_phi_lap_dat, q.vat_amount, q.tong_cong,
           q.dia_chi_cong_trinh, q.ghi_chu_thuong_mai,
           d.dealer_code, d.ten_dai_ly, d.province AS dealer_province,
           c.ma_kh, c.ten_kh AS customer_name, c.phone AS customer_phone, c.email AS customer_email
    FROM quotations q
    LEFT JOIN dealers d ON d.id = q.dealer_id
    LEFT JOIN customers c ON c.id = q.customer_id
    ORDER BY q.ngay_bao_gia DESC
  `).all();
}

function customersForExport() {
  return db.prepare(`
    SELECT c.ma_kh, c.ten_kh, c.nguoi_lien_he, c.phone, c.email, c.dia_chi, c.ghi_chu,
           d.dealer_code, d.ten_dai_ly,
           (SELECT COUNT(*) FROM quotations q WHERE q.customer_id = c.id) AS quotations_count
    FROM customers c
    LEFT JOIN dealers d ON d.id = c.dealer_id
    ORDER BY c.created_at DESC
  `).all();
}

function productsForExport() {
  return db.prepare(`
    SELECT p.ma_sp, p.nhom_sp, p.mo_ta, p.dvt_mac_dinh, p.cach_tinh_gia,
           p.don_gia_mac_dinh, p.active,
           d.dealer_code, d.ten_dai_ly
    FROM products p
    LEFT JOIN dealers d ON d.id = p.dealer_id
    ORDER BY d.dealer_code, p.nhom_sp, p.ma_sp
  `).all();
}

function dealersForExport() {
  return db.prepare(`
    SELECT d.dealer_code, d.ten_dai_ly, d.chu_dai_ly, d.phone, d.email,
           d.address, d.district, d.province, d.coverage,
           d.years_experience, d.team_size, d.projects_monthly,
           d.status, d.created_at,
           (SELECT COUNT(*) FROM quotations q WHERE q.dealer_id = d.id) AS quotations_count,
           (SELECT COALESCE(SUM(tong_cong), 0) FROM quotations q WHERE q.dealer_id = d.id) AS revenue,
           u.username, u.last_login_at
    FROM dealers d
    LEFT JOIN users u ON u.dealer_id = d.id AND u.role = 'dealer'
    ORDER BY d.created_at DESC
  `).all();
}

// ────────────────────────────────────────────────────────────
// ADMIN DASHBOARD V2 — Filtered by year/month (system-wide)
// Mirrors dealer-stats.model dashboardV4 but across ALL dealers
// ────────────────────────────────────────────────────────────

function adminPeriodFilter(filter) {
  if (!filter || (!filter.year && !filter.month)) return { sql: '', params: {} };
  if (filter.year && filter.month) {
    const period = `${filter.year}-${String(filter.month).padStart(2, '0')}`;
    return { sql: " AND substr(ngay_bao_gia, 1, 7) = @period", params: { period } };
  }
  if (filter.year) {
    return { sql: " AND substr(ngay_bao_gia, 1, 4) = @period", params: { period: String(filter.year) } };
  }
  return { sql: '', params: {} };
}

function adminStatsKPI(filter) {
  const pf = adminPeriodFilter(filter);
  return db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong ELSE 0 END), 0) AS doanh_thu,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(thanh_toan_thuc, 0) ELSE 0 END), 0) AS cong_no,
      SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS so_don_hang
    FROM quotations
    WHERE 1=1 ${pf.sql}
  `).get({ ...pf.params });
}

function adminStatsFinancial(filter) {
  const pf = adminPeriodFilter(filter);
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status IN ('sent','confirmed','cancelled') THEN tong_cong ELSE 0 END), 0) AS doanh_so,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong ELSE 0 END), 0) AS doanh_thu,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN COALESCE(gia_von, 0) ELSE 0 END), 0) AS chi_phi,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(gia_von, 0) ELSE 0 END), 0) AS loi_nhuan,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(thanh_toan_thuc, 0) ELSE 0 END), 0) AS cong_no
    FROM quotations
    WHERE 1=1 ${pf.sql}
  `).get({ ...pf.params });

  // Determine which year to use for monthly series
  let year;
  if (filter && filter.year) year = String(filter.year);
  else year = new Date().getFullYear().toString();

  const FIN_COLS = `
    COALESCE(SUM(CASE WHEN status IN ('sent','confirmed','cancelled') THEN tong_cong ELSE 0 END), 0) AS doanh_so,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong ELSE 0 END), 0) AS doanh_thu,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN COALESCE(gia_von, 0) ELSE 0 END), 0) AS chi_phi,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(gia_von, 0) ELSE 0 END), 0) AS loi_nhuan,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(thanh_toan_thuc, 0) ELSE 0 END), 0) AS cong_no
  `;

  // Monthly series for the year
  const months = db.prepare(`
    SELECT substr(ngay_bao_gia, 6, 2) AS m, ${FIN_COLS}
    FROM quotations
    WHERE substr(ngay_bao_gia, 1, 4) = @year
    GROUP BY m ORDER BY m
  `).all({ year });

  const emptyRow = { doanh_so: 0, doanh_thu: 0, chi_phi: 0, loi_nhuan: 0, cong_no: 0 };
  const months_series = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = months.find(x => x.m === m) || emptyRow;
    return { month: i + 1, doanh_so: found.doanh_so, doanh_thu: found.doanh_thu, chi_phi: found.chi_phi, loi_nhuan: found.loi_nhuan, cong_no: found.cong_no };
  });

  // 5-year series
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4;
  const years = db.prepare(`
    SELECT substr(ngay_bao_gia, 1, 4) AS y, ${FIN_COLS}
    FROM quotations
    WHERE CAST(substr(ngay_bao_gia, 1, 4) AS INTEGER) >= ?
    GROUP BY y ORDER BY y
  `).all(startYear);
  const years_series = Array.from({ length: 5 }, (_, i) => {
    const y = String(startYear + i);
    const found = years.find(x => x.y === y) || emptyRow;
    return { year: startYear + i, doanh_so: found.doanh_so, doanh_thu: found.doanh_thu, chi_phi: found.chi_phi, loi_nhuan: found.loi_nhuan, cong_no: found.cong_no };
  });

  // 6-month trailing series
  let endMonth = new Date();
  if (filter && filter.year && filter.month) {
    endMonth = new Date(parseInt(filter.year), parseInt(filter.month) - 1, 1);
  }
  const months6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(endMonth.getFullYear(), endMonth.getMonth() - i, 1);
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yy}-${mm}`;
    const row = db.prepare(`
      SELECT ${FIN_COLS}
      FROM quotations
      WHERE substr(ngay_bao_gia, 1, 7) = ?
    `).get(key);
    months6.push({
      label: `T${d.getMonth() + 1}/${String(yy).slice(2)}`,
      year: yy, month: d.getMonth() + 1,
      doanh_so: row.doanh_so, doanh_thu: row.doanh_thu,
      chi_phi: row.chi_phi, loi_nhuan: row.loi_nhuan, cong_no: row.cong_no,
    });
  }

  return { ...totals, year: Number(year), months_series, years_series, months_6_series: months6 };
}

function adminStatsQuotations(filter) {
  const pf = adminPeriodFilter(filter);
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN status='draft'     AND ready_to_send=0 THEN 1 ELSE 0 END) AS nhap,
      SUM(CASE WHEN status='draft'     AND ready_to_send=1 THEN 1 ELSE 0 END) AS chua_gui,
      SUM(CASE WHEN status='sent'      THEN 1 ELSE 0 END) AS da_gui,
      SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS da_chot,
      SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS da_truot,
      COUNT(*) AS total
    FROM quotations
    WHERE 1=1 ${pf.sql}
  `).get({ ...pf.params });
  const sent_total = (row.da_gui || 0) + (row.da_chot || 0) + (row.da_truot || 0);
  const conversion_rate = sent_total > 0 ? Math.round((row.da_chot || 0) / sent_total * 1000) / 10 : 0;
  return {
    nhap: row.nhap || 0, chua_gui: row.chua_gui || 0,
    da_gui: row.da_gui || 0, da_chot: row.da_chot || 0, da_truot: row.da_truot || 0,
    total: row.total || 0, conversion_rate, conversion_base: sent_total,
  };
}

function adminStatsOrders(filter) {
  const pf = adminPeriodFilter(filter);
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN order_status = 'cho_san_xuat' THEN 1 ELSE 0 END) AS cho_san_xuat,
      SUM(CASE WHEN order_status = 'san_xuat'     THEN 1 ELSE 0 END) AS san_xuat,
      SUM(CASE WHEN order_status = 'lap_dat'      THEN 1 ELSE 0 END) AS lap_dat,
      SUM(CASE WHEN order_status = 'hoan_thien'   THEN 1 ELSE 0 END) AS hoan_thien,
      COUNT(CASE WHEN order_status IS NOT NULL THEN 1 END) AS total
    FROM quotations
    WHERE status != 'cancelled' ${pf.sql}
  `).get({ ...pf.params });
  return {
    total: row.total || 0,
    cho_san_xuat: row.cho_san_xuat || 0,
    san_xuat: row.san_xuat || 0,
    lap_dat: row.lap_dat || 0,
    hoan_thien: row.hoan_thien || 0,
  };
}

function adminStatsCustomers(filter) {
  let newCount;
  if (!filter || (!filter.year && !filter.month)) {
    newCount = db.prepare(`SELECT COUNT(*) AS n FROM customers`).get().n;
  } else if (filter.year && filter.month) {
    const period = `${filter.year}-${String(filter.month).padStart(2, '0')}`;
    newCount = db.prepare(`SELECT COUNT(*) AS n FROM customers WHERE substr(created_at, 1, 7) = ?`).get(period).n;
  } else if (filter.year) {
    newCount = db.prepare(`SELECT COUNT(*) AS n FROM customers WHERE substr(created_at, 1, 4) = ?`).get(String(filter.year)).n;
  } else {
    newCount = 0;
  }
  const total = db.prepare(`SELECT COUNT(*) AS n FROM customers`).get().n;
  const returning = db.prepare(`
    SELECT COUNT(*) AS n FROM (
      SELECT customer_id FROM quotations
      WHERE customer_id IS NOT NULL
      GROUP BY customer_id HAVING COUNT(*) >= 2
    )
  `).get().n;
  return { new_in_period: newCount, total, returning };
}

function adminStatsProductGroups(filter) {
  const pf = adminPeriodFilter(filter);
  const rows = db.prepare(`
    SELECT
      COALESCE(NULLIF(it.nhom_sp, ''), '(không nhóm)') AS nhom_sp,
      COALESCE(SUM(it.thanh_tien), 0) AS doanh_thu,
      COUNT(DISTINCT it.quotation_id) AS so_don
    FROM quotation_items it
    INNER JOIN quotations q ON q.id = it.quotation_id
    WHERE 1=1 ${pf.sql.replace(/ngay_bao_gia/g, 'q.ngay_bao_gia')}
    GROUP BY nhom_sp
    ORDER BY doanh_thu DESC
  `).all({ ...pf.params });
  const total = rows.reduce((s, r) => s + r.doanh_thu, 0) || 1;
  return rows.map(r => ({ ...r, ti_trong_pct: Math.round(r.doanh_thu / total * 1000) / 10 }));
}

function dashboardAdmin(filter) {
  return {
    filter: filter || {},
    kpi: adminStatsKPI(filter),
    financial: adminStatsFinancial(filter),
    quotations: adminStatsQuotations(filter),
    orders: adminStatsOrders(filter),
    customers: adminStatsCustomers(filter),
    product_groups: adminStatsProductGroups(filter),
    // Also include existing overview data (dealers count, etc.)
    overview_kpi: overview(),
    top_dealers: topDealers({ from: filter && filter.year ? `${filter.year}-01-01` : undefined, limit: 5 }),
    top_products: topProducts({ from: filter && filter.year ? `${filter.year}-01-01` : undefined, limit: 10 }),
    price_groups: priceRangeByGroup(),
    monthly: monthlyRevenue(),
  };
}

// Helpers
function monthStartISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

module.exports = {
  overview, monthlyRevenue, topDealers, topProducts,
  quotationsAll, customersAll, productsAll, priceRangeByGroup,
  dealerFull, dashboardAdmin,
  quotationsForExport, customersForExport, productsForExport, dealersForExport,
};
