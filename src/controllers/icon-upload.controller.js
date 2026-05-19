// Upload ảnh riêng làm icon sản phẩm (đại lý dùng cho catalog hoặc per-item BG).
// Folder Cloudinary: daily-so/icons/{dealer_id}/...
// Trả về { url, public_id } để FE lưu vào product / quotation_item.
const uploadService = require('../services/upload.service');
const { badRequest } = require('../utils/http');

async function upload(req, res, next) {
  try {
    if (!req.file) throw badRequest('Vui lòng chọn file');
    const dealerId = req.user.dealer_id;
    const result = await uploadService.uploadBuffer(
      req.file.buffer,
      `daily-so/icons/${dealerId}`
    );
    res.status(201).json({
      data: { url: result.secure_url, public_id: result.public_id }
    });
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const publicId = req.query.public_id || req.body.public_id;
    if (!publicId) throw badRequest('Thiếu public_id');
    // Chỉ cho phép xoá file trong folder của dealer hiện tại
    const dealerId = req.user.dealer_id;
    const prefix = `daily-so/icons/${dealerId}/`;
    if (!String(publicId).startsWith(prefix)) {
      throw badRequest('Không có quyền xoá file này');
    }
    await uploadService.deleteByPublicId(publicId);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = { upload, remove };
