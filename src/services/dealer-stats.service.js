const m = require('../models/dealer-stats.model');

function dashboardV4(dealerId, filter) {
  // Normalize filter
  // Nếu không truyền filter, hoặc mode là 'all', hoặc thiếu mode/period -> xem toàn bộ thời gian
  if (!filter || filter.mode === 'all' || !filter.mode || !filter.period) {
    return m.dashboardV4(dealerId, { mode: 'all', period: '' });
  }
  const f = { mode: 'month', period: String(filter.period).trim() };
  if (filter.mode === 'year' || filter.mode === 'month') f.mode = filter.mode;
  return m.dashboardV4(dealerId, f);
}

module.exports = { dashboardV4 };
