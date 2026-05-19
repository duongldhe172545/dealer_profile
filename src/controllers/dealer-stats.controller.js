const dealerStatsService = require('../services/dealer-stats.service');

function dashboard(req, res, next) {
  try {
    res.json({ data: dealerStatsService.dashboard(req.user.dealer_id) });
  } catch (e) { next(e); }
}

module.exports = { dashboard };
