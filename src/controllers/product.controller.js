const productService = require('../services/product.service');

function list(req, res, next) {
  try {
    const filter = {
      search:  req.query.search ? String(req.query.search) : undefined,
      nhom_sp: req.query.nhom_sp ? String(req.query.nhom_sp) : undefined,
      active:  req.query.active !== undefined ? Number(req.query.active) : undefined,
    };
    res.json({
      data: productService.list(req.dealerId, filter),
      groups: productService.groups(req.dealerId),
    });
  } catch (err) { next(err); }
}

function getOne(req, res, next) {
  try { res.json({ data: productService.getById(req.dealerId, Number(req.params.id)) }); }
  catch (err) { next(err); }
}

function create(req, res, next) {
  try { res.status(201).json({ data: productService.create(req.dealerId, req.body || {}) }); }
  catch (err) { next(err); }
}

function update(req, res, next) {
  try { res.json({ data: productService.update(req.dealerId, Number(req.params.id), req.body || {}) }); }
  catch (err) { next(err); }
}

function remove(req, res, next) {
  try {
    productService.remove(req.dealerId, Number(req.params.id));
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
