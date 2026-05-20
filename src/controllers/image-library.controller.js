const imageService = require('../services/image-library.service');

// Admin: list tất cả ảnh (admin's + tất cả dealer)
function adminList(req, res, next) {
  try { res.json({ data: imageService.listAll({ category: req.query.category }) }); }
  catch (e) { next(e); }
}

// Dealer: list admin's NULL + own
function dealerList(req, res, next) {
  try {
    res.json({ data: imageService.listForDealer(req.user.dealer_id, { category: req.query.category }) });
  } catch (e) { next(e); }
}

// Admin upload: dealer_id = null (shared)
async function adminUpload(req, res, next) {
  try {
    const item = await imageService.createFromFile(req.file, req.body, {
      dealerId: null,
      folder: 'daily-so/images/shared',
    });
    res.status(201).json({ data: item });
  } catch (e) { next(e); }
}

// Dealer upload: dealer_id = req.user.dealer_id
async function dealerUpload(req, res, next) {
  try {
    const dealerId = req.user.dealer_id;
    const item = await imageService.createFromFile(req.file, req.body, {
      dealerId,
      folder: `daily-so/images/${dealerId}`,
    });
    res.status(201).json({ data: item });
  } catch (e) { next(e); }
}

function updateMeta(req, res, next) {
  try {
    const item = imageService.updateMeta(Number(req.params.id), req.body, req.user);
    res.json({ data: item });
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    await imageService.remove(Number(req.params.id), req.user);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { adminList, dealerList, adminUpload, dealerUpload, updateMeta, remove };
