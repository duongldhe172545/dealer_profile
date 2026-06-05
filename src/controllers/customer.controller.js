const customerService = require('../services/customer.service');

function list(req, res, next) {
  try {
    const filter = { search: req.query.search ? String(req.query.search) : undefined };
    res.json({ data: customerService.list(req.dealerId, filter) });
  } catch (err) { next(err); }
}

function getOne(req, res, next) {
  try { res.json({ data: customerService.getById(req.dealerId, Number(req.params.id)) }); }
  catch (err) { next(err); }
}

function create(req, res, next) {
  try { res.status(201).json({ data: customerService.create(req.dealerId, req.body || {}, { user: req.user, ip: req.ip }) }); }
  catch (err) { next(err); }
}

function update(req, res, next) {
  try { res.json({ data: customerService.update(req.dealerId, Number(req.params.id), req.body || {}) }); }
  catch (err) { next(err); }
}

function suggestCode(req, res, next) {
  try { res.json(customerService.suggestCode(req.dealerId)); }
  catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, suggestCode };
