// Queries tổng hợp cho dealer dashboard riêng của 1 đại lý
const db = require('../config/database');

function monthStartISO() {
  const d = new Date();
  d.setDate(1); d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// KPI thẻ số trên đầu dashboard
function overview(dealerId) {
  const monthStart = monthStartISO();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Doanh số + số BG tháng này (không tính cancelled)
  const monthQ = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(tong_cong),0) AS revenue
    FROM quotations
    WHERE dealer_id = ? AND ngay_bao_gia >= ? AND status != 'cancelled'
  `).get(dealerId, monthStart);

  // BG đã gửi tháng này
  const sentMonth = db.prepare(`
    SELECT COUNT(*) AS n FROM quotations
    WHERE dealer_id = ? AND ngay_bao_gia >= ? AND status IN ('sent','confirmed')
  `).get(dealerId, monthStart).n;

  // BG draft hiện tại (chưa gửi)
  const draftCount = db.prepare(`
    SELECT COUNT(*) AS n FROM quotations
    WHERE dealer_id = ? AND status = 'draft'
  `).get(dealerId).n;

  // KH mới 7 ngày
  const newCustomers = db.prepare(`
    SELECT COUNT(*) AS n FROM customers
    WHERE dealer_id = ? AND created_at >= ?
  `).get(dealerId, weekAgo).n;

  // Totals
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM quotations WHERE dealer_id = ?) AS quotations_total,
      (SELECT COUNT(*) FROM customers WHERE dealer_id = ?) AS customers_total,
      (SELECT COUNT(*) FROM products WHERE dealer_id = ? AND active = 1) AS products_total
  `).get(dealerId, dealerId, dealerId);

  return {
    revenue_month: monthQ.revenue,
    quotations_month: monthQ.count,
    sent_month: sentMonth,
    draft_count: draftCount,
    new_customers_week: newCustomers,
    quotations_total: totals.quotations_total,
    customers_total: totals.customers_total,
    products_total: totals.products_total,
  };
}

// Báo giá cần xử lý: draft > 7 ngày, hoặc sent > 5 ngày chưa confirm
function alerts(dealerId) {
  const draft7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sent5d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const staleDraft = db.prepare(`
    SELECT q.id, q.so_bao_gia, q.ngay_bao_gia, q.tong_cong, q.created_at,
           c.ten_kh AS customer_name
    FROM quotations q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE q.dealer_id = ? AND q.status = 'draft' AND q.created_at < ?
    ORDER BY q.created_at ASC LIMIT 10
  `).all(dealerId, draft7d);

  const stalePending = db.prepare(`
    SELECT q.id, q.so_bao_gia, q.ngay_bao_gia, q.tong_cong, q.sent_at,
           c.ten_kh AS customer_name
    FROM quotations q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE q.dealer_id = ? AND q.status = 'sent' AND q.sent_at < ?
    ORDER BY q.sent_at ASC LIMIT 10
  `).all(dealerId, sent5d);

  return { stale_draft: staleDraft, stale_pending: stalePending };
}

// 5 báo giá vừa cập nhật gần nhất
function recentQuotations(dealerId, limit = 5) {
  return db.prepare(`
    SELECT q.id, q.so_bao_gia, q.ngay_bao_gia, q.status, q.tong_cong,
           q.updated_at, c.ten_kh AS customer_name
    FROM quotations q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE q.dealer_id = ?
    ORDER BY q.updated_at DESC LIMIT ?
  `).all(dealerId, limit);
}

// Top 5 KH doanh số cao (sum tổng BG không cancelled)
function topCustomers(dealerId, limit = 5) {
  return db.prepare(`
    SELECT c.id, c.ma_kh, c.ten_kh, c.phone,
           COUNT(q.id) AS bg_count,
           COALESCE(SUM(q.tong_cong),0) AS revenue
    FROM customers c
    LEFT JOIN quotations q ON q.customer_id = c.id AND q.status != 'cancelled'
    WHERE c.dealer_id = ?
    GROUP BY c.id
    HAVING bg_count > 0
    ORDER BY revenue DESC LIMIT ?
  `).all(dealerId, limit);
}

// Top 5 SP catalog xuất hiện nhiều nhất trong BG
function topProducts(dealerId, limit = 5) {
  return db.prepare(`
    SELECT it.ma_sp,
           COALESCE(it.ten_sp, '') AS ten_sp,
           COUNT(*) AS times_used,
           SUM(it.thanh_tien) AS total_value
    FROM quotation_items it
    INNER JOIN quotations q ON q.id = it.quotation_id
    WHERE q.dealer_id = ? AND q.status != 'cancelled' AND it.ma_sp IS NOT NULL AND it.ma_sp != ''
    GROUP BY it.ma_sp
    ORDER BY times_used DESC, total_value DESC
    LIMIT ?
  `).all(dealerId, limit);
}

// 6 tháng gần nhất: doanh số + số BG
function monthlyTrend(dealerId) {
  return db.prepare(`
    SELECT substr(ngay_bao_gia, 1, 7) AS ym,
           COUNT(*) AS count,
           COALESCE(SUM(tong_cong),0) AS revenue
    FROM quotations
    WHERE dealer_id = ? AND status != 'cancelled'
      AND ngay_bao_gia >= date('now', 'start of month', '-5 months')
    GROUP BY ym ORDER BY ym
  `).all(dealerId);
}

// ───────────────────────────────────────────────────────────────────────────
// V4 — Dashboard 5 sections theo mockup sếp (mig 015)
// Filter: { mode: 'month'|'year', period: '2026-05' | '2026' }
// Status mapping (mig 015):
//   nhap     → status='draft'     AND ready_to_send=0
//   chua_gui → status='draft'     AND ready_to_send=1
//   da_gui   → status='sent'
//   da_chot  → status='confirmed'
//   da_truot → status='cancelled'
// Definitions (theo sếp):
//   Doanh số = Σ tong_cong, BG đã gửi (sent + confirmed + cancelled)
//   Doanh thu = Σ tong_cong, BG đã chốt (confirmed)
//   Lợi nhuận = Σ (tong_cong − gia_von), BG đã chốt có gia_von
//   Chi phí = Σ gia_von, BG đã chốt
//   Công nợ = Σ (tong_cong − COALESCE(thanh_toan_thuc, 0)), BG đã chốt
// ───────────────────────────────────────────────────────────────────────────

function periodFilter(filter) {
  // Returns SQL fragment "AND substr(ngay_bao_gia, 1, X) = Y" + params
  if (!filter || !filter.period) return { sql: '', params: {} };
  if (filter.mode === 'year') {
    return { sql: " AND substr(ngay_bao_gia, 1, 4) = @period", params: { period: String(filter.period) } };
  }
  return { sql: " AND substr(ngay_bao_gia, 1, 7) = @period", params: { period: String(filter.period) } };
}

function statsKPI(dealerId, filter) {
  const pf = periodFilter(filter);
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong ELSE 0 END), 0) AS doanh_thu,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(thanh_toan_thuc, 0) ELSE 0 END), 0) AS cong_no,
      SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS so_don_hang
    FROM quotations
    WHERE dealer_id = @dealer_id ${pf.sql}
  `).get({ dealer_id: dealerId, ...pf.params });
  return row;
}

function statsFinancial(dealerId, filter) {
  const pf = periodFilter(filter);
  const params = { dealer_id: dealerId, ...pf.params };

  // Tổng tài chính của period
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status IN ('sent','confirmed','cancelled') THEN tong_cong ELSE 0 END), 0) AS doanh_so,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong ELSE 0 END), 0) AS doanh_thu,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN COALESCE(gia_von, 0) ELSE 0 END), 0) AS chi_phi,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(gia_von, 0) ELSE 0 END), 0) AS loi_nhuan,
      COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(thanh_toan_thuc, 0) ELSE 0 END), 0) AS cong_no
    FROM quotations
    WHERE dealer_id = @dealer_id ${pf.sql}
  `).get(params);

  // Series 12 tháng (cho biểu đồ): doanh số + doanh thu mỗi tháng của NĂM HIỆN TẠI
  // Nếu filter year → lấy năm đó. Nếu filter month → lấy năm của month đó.
  let year;
  if (filter && filter.mode === 'year' && filter.period) year = String(filter.period).slice(0, 4);
  else if (filter && filter.mode === 'month' && filter.period) year = String(filter.period).slice(0, 4);
  else year = new Date().getFullYear().toString();

  const FIN_COLS = `
    COALESCE(SUM(CASE WHEN status IN ('sent','confirmed','cancelled') THEN tong_cong ELSE 0 END), 0) AS doanh_so,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong ELSE 0 END), 0) AS doanh_thu,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN COALESCE(gia_von, 0) ELSE 0 END), 0) AS chi_phi,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(gia_von, 0) ELSE 0 END), 0) AS loi_nhuan,
    COALESCE(SUM(CASE WHEN status='confirmed' THEN tong_cong - COALESCE(thanh_toan_thuc, 0) ELSE 0 END), 0) AS cong_no
  `;

  const months = db.prepare(`
    SELECT substr(ngay_bao_gia, 6, 2) AS m, ${FIN_COLS}
    FROM quotations
    WHERE dealer_id = @dealer_id AND substr(ngay_bao_gia, 1, 4) = @year
    GROUP BY m ORDER BY m
  `).all({ dealer_id: dealerId, year });

  // Format 12 tháng — fill 0 cho tháng thiếu
  const emptyRow = { doanh_so: 0, doanh_thu: 0, chi_phi: 0, loi_nhuan: 0, cong_no: 0 };
  const months_series = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = months.find(x => x.m === m) || emptyRow;
    return { month: i + 1, ...{ doanh_so: found.doanh_so, doanh_thu: found.doanh_thu, chi_phi: found.chi_phi, loi_nhuan: found.loi_nhuan, cong_no: found.cong_no } };
  });

  // Series 5 năm gần nhất (dùng cho mode 'all')
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4;
  const years = db.prepare(`
    SELECT substr(ngay_bao_gia, 1, 4) AS y, ${FIN_COLS}
    FROM quotations
    WHERE dealer_id = ? AND CAST(substr(ngay_bao_gia, 1, 4) AS INTEGER) >= ?
    GROUP BY y ORDER BY y
  `).all(dealerId, startYear);
  const years_series = Array.from({ length: 5 }, (_, i) => {
    const y = String(startYear + i);
    const found = years.find(x => x.y === y) || emptyRow;
    return { year: startYear + i, doanh_so: found.doanh_so, doanh_thu: found.doanh_thu, chi_phi: found.chi_phi, loi_nhuan: found.loi_nhuan, cong_no: found.cong_no };
  });

  // Series 6 tháng gần nhất (dùng cho mode 'month' để xem context)
  // Lấy 6 tháng kết thúc tại period nếu mode='month', ngược lại tại tháng hiện tại
  let endMonth = new Date();
  if (filter && filter.mode === 'month' && filter.period) {
    const [yy, mm] = String(filter.period).split('-');
    endMonth = new Date(parseInt(yy), parseInt(mm) - 1, 1);
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
      WHERE dealer_id = ? AND substr(ngay_bao_gia, 1, 7) = ?
    `).get(dealerId, key);
    months6.push({
      label: `T${d.getMonth() + 1}/${String(yy).slice(2)}`,
      year: yy, month: d.getMonth() + 1,
      doanh_so: row.doanh_so, doanh_thu: row.doanh_thu,
      chi_phi: row.chi_phi, loi_nhuan: row.loi_nhuan, cong_no: row.cong_no,
    });
  }

  return { ...totals, year: Number(year), months_series, years_series, months_6_series: months6 };
}

function statsOrders(dealerId, filter) {
  const pf = periodFilter(filter);
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN order_status = 'cho_san_xuat' THEN 1 ELSE 0 END) AS cho_san_xuat,
      SUM(CASE WHEN order_status = 'san_xuat'     THEN 1 ELSE 0 END) AS san_xuat,
      SUM(CASE WHEN order_status = 'lap_dat'      THEN 1 ELSE 0 END) AS lap_dat,
      SUM(CASE WHEN order_status = 'hoan_thien'   THEN 1 ELSE 0 END) AS hoan_thien,
      COUNT(CASE WHEN order_status IS NOT NULL THEN 1 END) AS total
    FROM quotations
    WHERE dealer_id = @dealer_id AND status != 'cancelled' ${pf.sql}
  `).get({ dealer_id: dealerId, ...pf.params });
  return {
    total: row.total || 0,
    cho_san_xuat: row.cho_san_xuat || 0,
    san_xuat:     row.san_xuat     || 0,
    lap_dat:      row.lap_dat      || 0,
    hoan_thien:   row.hoan_thien   || 0,
  };
}

function statsQuotations(dealerId, filter) {
  const pf = periodFilter(filter);
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN status='draft'     AND ready_to_send=0 THEN 1 ELSE 0 END) AS nhap,
      SUM(CASE WHEN status='draft'     AND ready_to_send=1 THEN 1 ELSE 0 END) AS chua_gui,
      SUM(CASE WHEN status='sent'      THEN 1 ELSE 0 END) AS da_gui,
      SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS da_chot,
      SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS da_truot,
      COUNT(*) AS total
    FROM quotations
    WHERE dealer_id = @dealer_id ${pf.sql}
  `).get({ dealer_id: dealerId, ...pf.params });

  // Tỉ lệ chuyển đổi = chốt / (đã gửi đi cho khách = sent + confirmed + cancelled)
  const sent_total = (row.da_gui || 0) + (row.da_chot || 0) + (row.da_truot || 0);
  const conversion_rate = sent_total > 0 ? Math.round((row.da_chot || 0) / sent_total * 1000) / 10 : 0;

  return {
    nhap:     row.nhap     || 0,
    chua_gui: row.chua_gui || 0,
    da_gui:   row.da_gui   || 0,
    da_chot:  row.da_chot  || 0,
    da_truot: row.da_truot || 0,
    total:    row.total    || 0,
    conversion_rate,
    conversion_base: sent_total,
  };
}

function statsCustomers(dealerId, filter) {
  // KH mới trong period (theo customers.created_at)
  let newRow;
  if (filter && filter.mode === 'all') {
    newRow = db.prepare(`SELECT COUNT(*) AS n FROM customers WHERE dealer_id = ?`).get(dealerId);
  } else if (filter && filter.period) {
    const len = filter.mode === 'year' ? 4 : 7;
    newRow = db.prepare(`
      SELECT COUNT(*) AS n FROM customers
      WHERE dealer_id = ? AND substr(created_at, 1, ?) = ?
    `).get(dealerId, len, String(filter.period));
  } else {
    newRow = { n: 0 };
  }
  const total = db.prepare(`SELECT COUNT(*) AS n FROM customers WHERE dealer_id = ?`).get(dealerId).n;
  // KH quay lại = có >= 2 BG (kể cả status nào)
  const returning = db.prepare(`
    SELECT COUNT(*) AS n FROM (
      SELECT customer_id FROM quotations
      WHERE dealer_id = ? AND customer_id IS NOT NULL
      GROUP BY customer_id HAVING COUNT(*) >= 2
    )
  `).get(dealerId).n;
  return { new_in_period: newRow.n, total, returning };
}

function statsProductGroups(dealerId, filter) {
  // Nhóm SP từ quotation_items (snapshot), GROUP BY nhom_sp.
  // User chốt "tính từ TẤT CẢ BG" (kể cả nháp + đã trượt) — không filter status BG.
  const pf = periodFilter(filter);
  const rows = db.prepare(`
    SELECT
      COALESCE(NULLIF(it.nhom_sp, ''), '(không nhóm)') AS nhom_sp,
      COALESCE(SUM(it.thanh_tien), 0) AS doanh_thu,
      COUNT(DISTINCT it.quotation_id) AS so_don
    FROM quotation_items it
    INNER JOIN quotations q ON q.id = it.quotation_id
    WHERE q.dealer_id = @dealer_id ${pf.sql.replace(/ngay_bao_gia/g, 'q.ngay_bao_gia')}
    GROUP BY nhom_sp
    ORDER BY doanh_thu DESC
  `).all({ dealer_id: dealerId, ...pf.params });
  const total = rows.reduce((s, r) => s + r.doanh_thu, 0) || 1;
  return rows.map(r => ({ ...r, ti_trong_pct: Math.round(r.doanh_thu / total * 1000) / 10 }));
}

// Tiến độ đơn hàng tổng quan (KHÔNG filter — toàn bộ thời gian)
function statsOrderProgress(dealerId) {
  return statsOrders(dealerId, null);
}

function dashboardV4(dealerId, filter) {
  return {
    filter: filter || { mode: 'month', period: new Date().toISOString().slice(0, 7) },
    order_progress: statsOrderProgress(dealerId),
    kpi: statsKPI(dealerId, filter),
    financial: statsFinancial(dealerId, filter),
    orders: statsOrders(dealerId, filter),
    quotations: statsQuotations(dealerId, filter),
    customers: statsCustomers(dealerId, filter),
    product_groups: statsProductGroups(dealerId, filter),
  };
}

module.exports = {
  overview, alerts, recentQuotations, topCustomers, topProducts, monthlyTrend,
  dashboardV4,
};
