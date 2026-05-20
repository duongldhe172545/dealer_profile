const imageModel = require('../models/image-library.model');
const uploadService = require('./upload.service');
const { badRequest, notFound, forbidden } = require('../utils/http');
const { cleanString } = require('../utils/sanitize');

function clean(v, max) { return cleanString(v, max); }

function normalizeMeta(body) {
  const name = clean(body.name, 200);
  if (!name) throw badRequest('Vui lòng nhập tên ảnh');
  return {
    name,
    category: clean(body.category, 50),
  };
}

// Admin: xem tất cả
function listAll(filter) {
  return imageModel.listAll(filter);
}

// Dealer: admin's + own
function listForDealer(dealerId, filter) {
  return imageModel.listForDealer(dealerId, filter);
}

// Tạo entry sau khi upload Cloudinary
//   ctx.dealer_id = null (admin) hoặc dealer_id (dealer)
async function createFromFile(file, body, { dealerId, folder }) {
  if (!file) throw badRequest('Vui lòng chọn file');
  const meta = normalizeMeta(body);
  const result = await uploadService.uploadBuffer(file.buffer, folder);
  const id = imageModel.create({
    dealer_id: dealerId,    // null nếu admin
    name: meta.name,
    url: result.secure_url,
    public_id: result.public_id,
    category: meta.category,
  });
  return imageModel.findById(id);
}

function updateMeta(id, body, currentUser) {
  const existing = imageModel.findById(id);
  if (!existing) throw notFound('Không tìm thấy ảnh');
  // Permission:
  //   admin sửa được tất cả
  //   dealer chỉ sửa ảnh của chính họ (dealer_id khớp)
  if (currentUser.role !== 'admin' && existing.dealer_id !== currentUser.dealer_id) {
    throw forbidden('Không có quyền sửa ảnh này');
  }
  const meta = normalizeMeta(body);
  imageModel.update(id, {
    dealer_id: existing.dealer_id,   // giữ owner
    name: meta.name,
    url: existing.url,
    public_id: existing.public_id,
    category: meta.category,
  });
  return imageModel.findById(id);
}

async function remove(id, currentUser) {
  const existing = imageModel.findById(id);
  if (!existing) throw notFound('Không tìm thấy ảnh');
  if (currentUser.role !== 'admin' && existing.dealer_id !== currentUser.dealer_id) {
    throw forbidden('Không có quyền xoá ảnh này');
  }
  imageModel.remove(id);
  // Xoá Cloudinary file (best-effort)
  if (existing.public_id) {
    uploadService.deleteByPublicId(existing.public_id).catch(() => {});
  }
}

module.exports = { listAll, listForDealer, createFromFile, updateMeta, remove };
