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

module.exports = { dashboard };
