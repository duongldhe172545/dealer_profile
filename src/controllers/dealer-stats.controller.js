const dealerStatsService = require('../services/dealer-stats.service');

// V4 — Dashboard 5 sections (mig 015). Query: ?mode=month|year&period=2026-05 hoặc 2026
function dashboardV4(req, res, next) {
  try {
    res.json({ data: dealerStatsService.dashboardV4(req.dealerId, {
      mode: req.query.mode,
      period: req.query.period,
    }) });
  } catch (e) { next(e); }
}

module.exports = { dashboardV4 };
