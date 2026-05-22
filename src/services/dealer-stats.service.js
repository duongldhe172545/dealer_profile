const m = require('../models/dealer-stats.model');

function dashboard(dealerId) {
  return {
    kpi: m.overview(dealerId),
    alerts: m.alerts(dealerId),
    recent_quotations: m.recentQuotations(dealerId, 5),
    top_customers: m.topCustomers(dealerId, 5),
    top_products: m.topProducts(dealerId, 5),
    monthly: m.monthlyTrend(dealerId),
  };
}

// V4 — Dashboard 5 sections theo mockup sếp
function dashboardV4(dealerId, filter) {
  // Normalize filter
  const f = { mode: 'month', period: new Date().toISOString().slice(0, 7) };
  if (filter && (filter.mode === 'month' || filter.mode === 'year')) f.mode = filter.mode;
  if (filter && filter.period) f.period = String(filter.period).trim();
  return m.dashboardV4(dealerId, f);
}

module.exports = { dashboard, dashboardV4 };
