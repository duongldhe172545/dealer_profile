const productModel = require('../models/product.model');
const uploadService = require('./upload.service');
const { badRequest, notFound, conflict } = require('../utils/http');
const { cleanString } = require('../utils/sanitize');

const VALID_CACH_TINH = ['kich_thuoc', 'dien_tich', 'dai', 'can', 'so_luong'];

const clean = (value, max = 200) => cleanString(value, max);

function parseNumber(value, label) {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw badRequest(`${label} phải là số không âm`);
  return Math.round(n);
}

function normalize(body) {
  const ma_sp = clean(body.ma_sp, 50);
  if (!ma_sp) throw badRequest('Vui lòng nhập mã sản phẩm');

  const cach_tinh_gia = body.cach_tinh_gia || 'so_luong';
  if (!VALID_CACH_TINH.includes(cach_tinh_gia)) {
    throw badRequest('Cách tính giá không hợp lệ');
  }

  return {
    ma_sp,
    ten_sp: clean(body.ten_sp, 200),
    nhom_sp: clean(body.nhom_sp, 100),
    mo_ta: clean(body.mo_ta, 500),
    dvt_mac_dinh: clean(body.dvt_mac_dinh, 50),
    cach_tinh_gia,
    don_gia_mac_dinh: parseNumber(body.don_gia_mac_dinh, 'Đơn giá mặc định'),
    active: body.active === 0 || body.active === false ? 0 : 1,
    icon_preset: clean(body.icon_preset, 80),
    icon_url: clean(body.icon_url, 500),
    icon_public_id: clean(body.icon_public_id, 200),
  };
}

function list(dealerId, filter) {
  return productModel.list(dealerId, filter);
}

function listActive(dealerId) {
  return productModel.listActive(dealerId);
}

function groups(dealerId) {
  return productModel.distinctGroups(dealerId);
}

function getById(dealerId, id) {
  const p = productModel.findById(dealerId, id);
  if (!p) throw notFound('Không tìm thấy sản phẩm');
  return p;
}

function create(dealerId, body) {
  const data = normalize(body);
  if (productModel.findByCode(dealerId, data.ma_sp)) {
    throw conflict('Mã sản phẩm đã tồn tại');
  }
  const id = productModel.create(dealerId, data);
  return productModel.findById(dealerId, id);
}

function update(dealerId, id, body) {
  const oldRow = getById(dealerId, id);
  const data = normalize(body);
  const existing = productModel.findByCode(dealerId, data.ma_sp);
  if (existing && existing.id !== id) throw conflict('Mã sản phẩm đã tồn tại');
  productModel.update(dealerId, id, data);
  // Cleanup Cloudinary orphan: nếu icon_public_id cũ != mới → xoá ảnh cũ
  if (oldRow.icon_public_id && oldRow.icon_public_id !== data.icon_public_id) {
    uploadService.deleteByPublicId(oldRow.icon_public_id).catch(() => {});
  }
  return productModel.findById(dealerId, id);
}

function remove(dealerId, id) {
  const oldRow = getById(dealerId, id);
  productModel.remove(dealerId, id);
  if (oldRow.icon_public_id) {
    uploadService.deleteByPublicId(oldRow.icon_public_id).catch(() => {});
  }
}

module.exports = { list, listActive, groups, getById, create, update, remove, VALID_CACH_TINH };
