const profileService = require('../services/profile.service');
const { badRequest } = require('../utils/http');

function getMine(req, res, next) {
  try { res.json({ data: profileService.get(req.dealerId) }); }
  catch (err) { next(err); }
}

function updateMine(req, res, next) {
  try { res.json({ data: profileService.update(req.dealerId, req.body || {}) }); }
  catch (err) { next(err); }
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) throw badRequest('Vui lòng chọn file ảnh');
    const data = await profileService.uploadImage(req.dealerId, req.params.slot, req.file.buffer);
    res.json({ data });
  } catch (err) { next(err); }
}

async function deleteImage(req, res, next) {
  try {
    await profileService.deleteImage(req.dealerId, req.params.slot);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { getMine, updateMine, uploadImage, deleteImage };
