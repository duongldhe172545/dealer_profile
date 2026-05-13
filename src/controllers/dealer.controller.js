const dealerService = require('../services/dealer.service');

async function list(req, res, next) {
  try {
    const data = dealerService.list({
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
    });
    res.json({ data });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try { res.json({ data: dealerService.getById(Number(req.params.id)) }); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try { res.status(201).json({ data: await dealerService.create(req.body || {}, { user: req.user, ip: req.ip }) }); }
  catch (err) { next(err); }
}

async function update(req, res, next) {
  try { res.json({ data: dealerService.update(Number(req.params.id), req.body || {}) }); }
  catch (err) { next(err); }
}

async function setStatus(req, res, next) {
  try {
    const status = (req.body && req.body.status) || '';
    res.json({ data: dealerService.setStatus(Number(req.params.id), status) });
  } catch (err) { next(err); }
}

async function resetPassword(req, res, next) {
  try {
    const password = (req.body && req.body.password) || '';
    await dealerService.resetPassword(Number(req.params.id), password);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, setStatus, resetPassword };
