const service = require('../services/admin-stats.service');

function overview(req, res, next) {
  try { res.json({ data: service.overview() }); }
  catch (err) { next(err); }
}

function quotations(req, res, next) {
  try {
    res.json({
      data: service.quotationsAll({
        search: req.query.search,
        status: req.query.status,
        dealer_id: req.query.dealer_id,
        from: req.query.from,
        to: req.query.to,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      })
    });
  } catch (err) { next(err); }
}

function customers(req, res, next) {
  try {
    res.json({
      data: service.customersAll({
        search: req.query.search,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      })
    });
  } catch (err) { next(err); }
}

function products(req, res, next) {
  try {
    res.json({
      data: service.productsAll({
        search: req.query.search,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      })
    });
  } catch (err) { next(err); }
}

function dealerDetail(req, res, next) {
  try { res.json({ data: service.dealerFull(Number(req.params.id)) }); }
  catch (err) { next(err); }
}

function exportCSV(req, res, next) {
  try {
    const type = req.params.type;
    const csv = service.exportCSV(type);
    const filename = `${type}-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { next(err); }
}

function dashboard(req, res, next) {
  try {
    const filter = {};
    if (req.query.year) filter.year = req.query.year;
    if (req.query.month) filter.month = req.query.month;
    res.json({ data: service.dashboardAdmin(filter) });
  } catch (err) { next(err); }
}

function dealerDashboard(req, res, next) {
  try {
    const dealerStatsModel = require('../models/dealer-stats.model');
    const dealerId = Number(req.params.id);
    const filter = {};
    if (req.query.year && req.query.month) {
      filter.mode = 'month';
      filter.period = `${req.query.year}-${String(req.query.month).padStart(2, '0')}`;
    } else if (req.query.year) {
      filter.mode = 'year';
      filter.period = req.query.year;
    } else {
      filter.mode = 'all';
    }
    res.json({ data: dealerStatsModel.dashboardV4(dealerId, filter) });
  } catch (err) { next(err); }
}

module.exports = { overview, quotations, customers, products, dealerDetail, exportCSV, dashboard, dealerDashboard };
