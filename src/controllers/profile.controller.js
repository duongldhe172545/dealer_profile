const profileService = require('../services/profile.service');
const { unauthorized, badRequest } = require('../utils/http');

function currentDealerId(req) {
  const id = req.user && req.user.dealer_id;
  if (!id) throw unauthorized('Tài khoản chưa gắn với đại lý');
  return id;
}

function getMine(req, res, next) {
  try { res.json({ data: profileService.get(currentDealerId(req)) }); }
  catch (err) { next(err); }
}

function updateMine(req, res, next) {
  try { res.json({ data: profileService.update(currentDealerId(req), req.body || {}) }); }
  catch (err) { next(err); }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) throw badRequest('Vui lòng chọn file ảnh');
    const data = await profileService.uploadImage(currentDealerId(req), req.params.slot, req.file.buffer);
    res.json({ data });
  } catch (err) { next(err); }
}

async function deleteImage(req, res, next) {
  try {
    await profileService.deleteImage(currentDealerId(req), req.params.slot);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { getMine, updateMine, uploadImage, deleteImage };
