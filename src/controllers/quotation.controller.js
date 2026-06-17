const quotationService = require('../services/quotation.service');
const quotationExportService = require('../services/quotation-export.service');

function list(req, res, next) {
  try {
    const filter = {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      logical_status: req.query.logical_status ? String(req.query.logical_status) : undefined,
      customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
      from: req.query.from ? String(req.query.from) : undefined,
      to: req.query.to ? String(req.query.to) : undefined,
    };
    res.json({ data: quotationService.list(req.dealerId, filter) });
  } catch (err) { next(err); }
}

function getOne(req, res, next) {
  try { res.json({ data: quotationService.getById(req.dealerId, Number(req.params.id)) }); }
  catch (err) { next(err); }
}

function suggestNumber(req, res, next) {
  try { res.json(quotationService.suggestNumber(req.dealerId, req.query.ngay_bao_gia)); }
  catch (err) { next(err); }
}

function create(req, res, next) {
  try { res.status(201).json({ data: quotationService.create(req.dealerId, req.body || {}, { user: req.user, ip: req.ip }) }); }
  catch (err) { next(err); }
}

function update(req, res, next) {
  try { res.json({ data: quotationService.update(req.dealerId, Number(req.params.id), req.body || {}) }); }
  catch (err) { next(err); }
}

function remove(req, res, next) {
  try { quotationService.remove(req.dealerId, Number(req.params.id)); res.json({ ok: true }); }
  catch (err) { next(err); }
}

function markSent(req, res, next) {
  try { res.json({ data: quotationService.markSent(req.dealerId, Number(req.params.id), req.body || {}, { user: req.user, ip: req.ip }) }); }
  catch (err) { next(err); }
}

async function uploadImage(req, res, next) {
  try {
    const data = await quotationService.uploadImage(req.dealerId, Number(req.params.id), req.params.slot, req.file);
    res.json({ data });
  } catch (err) { next(err); }
}

async function deleteImage(req, res, next) {
  try {
    await quotationService.deleteImage(req.dealerId, Number(req.params.id), req.params.slot);
    res.status(204).send();
  } catch (err) { next(err); }
}

function updateImageCaption(req, res, next) {
  try {
    const caption = quotationService.updateImageCaption(
      req.dealerId, Number(req.params.id), req.params.slot, req.body && req.body.caption
    );
    res.json({ data: { slot: Number(req.params.slot), caption } });
  } catch (err) { next(err); }
}

async function setImageFromLibrary(req, res, next) {
  try {
    const imageId = req.body && req.body.image_id;
    const data = await quotationService.setImageFromLibrary(
      req.dealerId, Number(req.params.id), req.params.slot, imageId
    );
    res.json({ data });
  } catch (err) { next(err); }
}

// Mig 015: PATCH /:id/logical-status — đổi 1 trong 5 trạng thái BG
function setLogicalStatus(req, res, next) {
  try {
    const logical_status = req.body && req.body.logical_status;
    const data = quotationService.setLogicalStatus(
      req.dealerId, Number(req.params.id), logical_status,
      { user: req.user, ip: req.ip }
    );
    res.json({ data });
  } catch (err) { next(err); }
}

// Mig 015: PATCH /:id/order-status — đổi trạng thái đơn hàng
function setOrderStatus(req, res, next) {
  try {
    const order_status = req.body && req.body.order_status;
    const data = quotationService.setOrderStatus(
      req.dealerId, Number(req.params.id), order_status
    );
    res.json({ data });
  } catch (err) { next(err); }
}

// Mig 015: PATCH /:id/financials — cập nhật thanh toán + giá vốn
function setFinancials(req, res, next) {
  try {
    const data = quotationService.setFinancials(
      req.dealerId, Number(req.params.id),
      {
        thanh_toan_thuc: req.body && req.body.thanh_toan_thuc,
        gia_von:         req.body && req.body.gia_von,
      }
    );
    res.json({ data });
  } catch (err) { next(err); }
}

// Mig 015 — Xuất Excel danh sách BG (cùng filter như endpoint list)
async function exportXlsx(req, res, next) {
  try {
    const filter = {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      logical_status: req.query.logical_status ? String(req.query.logical_status) : undefined,
      customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
      from: req.query.from ? String(req.query.from) : undefined,
      to: req.query.to ? String(req.query.to) : undefined,
    };
    const buf = await quotationExportService.exportXlsx(req.dealerId, filter);
    const fname = 'bao-gia-' + new Date().toISOString().slice(0, 10) + '.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(Buffer.from(buf));
  } catch (err) { next(err); }
}

module.exports = {
  list, getOne, suggestNumber, create, update, remove,
  markSent, setLogicalStatus, setOrderStatus, setFinancials,
  uploadImage, deleteImage, updateImageCaption,
  setImageFromLibrary, exportXlsx,
};
