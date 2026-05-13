const customerService = require('../services/customer.service');
const { unauthorized } = require('../utils/http');

function dealerId(req) {
  const id = req.user && req.user.dealer_id;
  if (!id) throw unauthorized('Tài khoản chưa gắn với đại lý');
  return id;
}

function list(req, res, next) {
  try {
    const filter = { search: req.query.search ? String(req.query.search) : undefined };
    res.json({ data: customerService.list(dealerId(req), filter) });
  } catch (err) { next(err); }
}

function getOne(req, res, next) {
  try { res.json({ data: customerService.getById(dealerId(req), Number(req.params.id)) }); }
  catch (err) { next(err); }
}

function create(req, res, next) {
  try { res.status(201).json({ data: customerService.create(dealerId(req), req.body || {}, { user: req.user, ip: req.ip }) }); }
  catch (err) { next(err); }
}

function update(req, res, next) {
  try { res.json({ data: customerService.update(dealerId(req), Number(req.params.id), req.body || {}) }); }
  catch (err) { next(err); }
}

function suggestCode(req, res, next) {
  try { res.json(customerService.suggestCode(dealerId(req))); }
  catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, suggestCode };
