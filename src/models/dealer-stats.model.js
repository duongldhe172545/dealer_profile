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

module.exports = { overview, alerts, recentQuotations, topCustomers, topProducts, monthlyTrend };
