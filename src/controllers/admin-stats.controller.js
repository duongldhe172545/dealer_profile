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

module.exports = { overview, quotations, customers, products, dealerDetail, exportCSV };
