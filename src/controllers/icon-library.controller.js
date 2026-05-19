const iconService = require('../services/icon-library.service');

function list(req, res, next) {
  try { res.json({ data: iconService.list({ category: req.query.category }) }); }
  catch (e) { next(e); }
}

function categories(req, res, next) {
  try { res.json({ data: iconService.categories() }); }
  catch (e) { next(e); }
}

function create(req, res, next) {
  try { res.status(201).json({ data: iconService.create(req.body) }); }
  catch (e) { next(e); }
}

function update(req, res, next) {
  try { res.json({ data: iconService.update(Number(req.params.id), req.body) }); }
  catch (e) { next(e); }
}

function remove(req, res, next) {
  try { iconService.remove(Number(req.params.id)); res.json({ ok: true }); }
  catch (e) { next(e); }
}

module.exports = { list, categories, create, update, remove };
