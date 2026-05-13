const quotationService = require('../services/quotation.service');
const { unauthorized } = require('../utils/http');

function dealerId(req) {
  const id = req.user && req.user.dealer_id;
  if (!id) throw unauthorized('Tài khoản chưa gắn với đại lý');
  return id;
}

function list(req, res, next) {
  try {
    const filter = {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
      from: req.query.from ? String(req.query.from) : undefined,
      to: req.query.to ? String(req.query.to) : undefined,
    };
    res.json({ data: quotationService.list(dealerId(req), filter) });
  } catch (err) { next(err); }
}

function getOne(req, res, next) {
  try { res.json({ data: quotationService.getById(dealerId(req), Number(req.params.id)) }); }
  catch (err) { next(err); }
}

function suggestNumber(req, res, next) {
  try { res.json(quotationService.suggestNumber(dealerId(req), req.query.ngay_bao_gia)); }
  catch (err) { next(err); }
}

function create(req, res, next) {
  try { res.status(201).json({ data: quotationService.create(dealerId(req), req.body || {}, { user: req.user, ip: req.ip }) }); }
  catch (err) { next(err); }
}

function update(req, res, next) {
  try { res.json({ data: quotationService.update(dealerId(req), Number(req.params.id), req.body || {}) }); }
  catch (err) { next(err); }
}

function remove(req, res, next) {
  try { quotationService.remove(dealerId(req), Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
}

function markSent(req, res, next) {
  try { res.json({ data: quotationService.markSent(dealerId(req), Number(req.params.id), req.body || {}, { user: req.user, ip: req.ip }) }); }
  catch (err) { next(err); }
}

function setStatus(req, res, next) {
  try {
    const status = (req.body && req.body.status) || '';
    res.json({ data: quotationService.setStatus(dealerId(req), Number(req.params.id), status, { user: req.user, ip: req.ip }) });
  } catch (err) { next(err); }
}

function clone(req, res, next) {
  try { res.status(201).json({ data: quotationService.clone(dealerId(req), Number(req.params.id)) }); }
  catch (err) { next(err); }
}

async function uploadImage(req, res, next) {
  try {
    const data = await quotationService.uploadImage(dealerId(req), Number(req.params.id), req.params.slot, req.file);
    res.json({ data });
  } catch (err) { next(err); }
}

async function deleteImage(req, res, next) {
  try {
    await quotationService.deleteImage(dealerId(req), Number(req.params.id), req.params.slot);
    res.status(204).send();
  } catch (err) { next(err); }
}

function updateImageCaption(req, res, next) {
  try {
    const caption = quotationService.updateImageCaption(
      dealerId(req), Number(req.params.id), req.params.slot, req.body && req.body.caption
    );
    res.json({ data: { slot: Number(req.params.slot), caption } });
  } catch (err) { next(err); }
}

module.exports = {
  list, getOne, suggestNumber, create, update, remove,
  markSent, setStatus, clone, uploadImage, deleteImage, updateImageCaption,
};
