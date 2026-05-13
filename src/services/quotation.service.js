const db = require('../config/database');
const quotationModel = require('../models/quotation.model');
const customerModel = require('../models/customer.model');
const productModel = require('../models/product.model');
const audit = require('../utils/audit');
const { badRequest, notFound, conflict } = require('../utils/http');

const VALID_PRICING = ['kich_thuoc', 'dien_tich', 'dai', 'can', 'so_luong'];
const VALID_STATUS  = ['draft', 'sent', 'confirmed', 'cancelled'];
const VALID_METHODS = ['zalo', 'email', 'in_giay', 'khac'];

function clean(value, max = 500) {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (v.length > max) throw badRequest(`Giá trị quá dài (tối đa ${max} ký tự)`);
  return v;
}

function num(value, label, { allowNull = true, integer = false, min = 0 } = {}) {
  if (value == null || value === '') return allowNull ? null : (integer ? 0 : 0);
  const n = Number(value);
  if (!Number.isFinite(n)) throw badRequest(`${label} phải là số`);
  if (n < min) throw badRequest(`${label} phải >= ${min}`);
  return integer ? Math.round(n) : n;
}

// Tính thành tiền: luôn = SL × Đơn giá.
// Đơn vị tính (ĐVT) là chuẩn để tính tiền (bộ, m², mét, kg, cái…).
// Rộng, Dài chỉ là thông tin hiển thị trên báo giá, KHÔNG dùng vào công thức.
function computeLineTotal(it) {
  return Math.round(Number(it.sl || 0) * Number(it.don_gia || 0));
}

function normalizeItem(it) {
  const cach_tinh_gia = it.cach_tinh_gia || 'so_luong';
  if (!VALID_PRICING.includes(cach_tinh_gia)) throw badRequest('Cách tính giá không hợp lệ');

  const cleaned = {
    product_id: it.product_id ? Number(it.product_id) : null,
    stt: Number(it.stt) || null,
    ma_sp: clean(it.ma_sp, 50),
    nhom_sp: clean(it.nhom_sp, 100),
    mo_ta: clean(it.mo_ta, 500),
    cach_tinh_gia,
    rong: num(it.rong, 'Rộng'),
    cao: num(it.cao, 'Cao'),
    dien_tich: num(it.dien_tich, 'Diện tích'),
    dai: num(it.dai, 'Mét dài'),
    can_nang: num(it.can_nang, 'Cân nặng'),
    sl: num(it.sl, 'Số lượng', { allowNull: false }) || 1,
    dvt: clean(it.dvt, 50),
    don_gia: num(it.don_gia, 'Đơn giá', { allowNull: false, integer: true }),
    thanh_tien: 0,
  };
  cleaned.thanh_tien = computeLineTotal(cleaned);
  return cleaned;
}

function normalizeHeader(dealerId, body, autoGenNumber) {
  const ngay = clean(body.ngay_bao_gia, 30) || new Date().toISOString().slice(0, 10);
  let so_bao_gia = clean(body.so_bao_gia, 30);
  if (!so_bao_gia && autoGenNumber) {
    const year = (ngay.match(/^(\d{4})/) || [])[1] || String(new Date().getFullYear());
    so_bao_gia = quotationModel.nextNumber(dealerId, year);
  }

  return {
    customer_id: body.customer_id ? Number(body.customer_id) : null,
    so_bao_gia,
    ngay_bao_gia: ngay,
    dia_chi_cong_trinh: clean(body.dia_chi_cong_trinh, 300),
    ghi_chu_ho_so: clean(body.ghi_chu_ho_so, 500),
    ghi_chu_thuong_mai: clean(body.ghi_chu_thuong_mai, 500),
    chi_phi_van_chuyen: num(body.chi_phi_van_chuyen, 'Chi phí vận chuyển', { integer: true }) || 0,
    chi_phi_lap_dat: num(body.chi_phi_lap_dat, 'Chi phí lắp đặt', { integer: true }) || 0,
    vat_percent: num(body.vat_percent, 'VAT %') || 0,
    thanh_toan: clean(body.thanh_toan, 300),
    tien_do: clean(body.tien_do, 300),
    bao_hanh: clean(body.bao_hanh, 300),
    status: body.status && VALID_STATUS.includes(body.status) ? body.status : 'draft',
  };
}

// Tính tổng cộng từ items + chi phí phụ
function computeTotals(header, items) {
  const tam_tinh = items.reduce((s, it) => s + (Number(it.thanh_tien) || 0), 0);
  const sub = tam_tinh + (header.chi_phi_van_chuyen || 0) + (header.chi_phi_lap_dat || 0);
  const vat_amount = Math.round(sub * (Number(header.vat_percent) || 0) / 100);
  const tong_cong = sub + vat_amount;
  return { tam_tinh, vat_amount, tong_cong };
}

function list(dealerId, filter) {
  return quotationModel.list(dealerId, filter);
}

function getById(dealerId, id) {
  const q = quotationModel.findById(dealerId, id);
  if (!q) throw notFound('Không tìm thấy báo giá');
  return q;
}

function suggestNumber(dealerId, ngay_bao_gia) {
  const ngay = ngay_bao_gia || new Date().toISOString().slice(0, 10);
  const year = (ngay.match(/^(\d{4})/) || [])[1] || String(new Date().getFullYear());
  return { so_bao_gia: quotationModel.nextNumber(dealerId, year) };
}

function create(dealerId, body, ctx) {
  const items = (body.items || []).map((it, idx) => ({ ...normalizeItem(it), stt: idx + 1 }));
  if (!items.length) throw badRequest('Vui lòng thêm ít nhất 1 dòng sản phẩm');

  const header = normalizeHeader(dealerId, body, true);
  if (!header.so_bao_gia) throw badRequest('Thiếu số báo giá');

  // Validate customer thuộc dealer
  if (header.customer_id) {
    const c = customerModel.findById(dealerId, header.customer_id);
    if (!c) throw badRequest('Khách hàng không tồn tại');
  }

  // Check trùng số báo giá
  const existing = db.prepare('SELECT id FROM quotations WHERE dealer_id = ? AND so_bao_gia = ?').get(dealerId, header.so_bao_gia);
  if (existing) throw conflict('Số báo giá đã tồn tại');

  const totals = computeTotals(header, items);
  Object.assign(header, totals);

  const id = quotationModel.create(dealerId, header, items);
  audit.log(ctx, 'quotation.create', 'quotation', id, {
    so_bao_gia: header.so_bao_gia, tong_cong: header.tong_cong,
    items_count: items.length, customer_id: header.customer_id,
  });
  return quotationModel.findById(dealerId, id);
}

function update(dealerId, id, body) {
  const existing = getById(dealerId, id);
  if (existing.status !== 'draft') {
    throw badRequest('Báo giá đã gửi, không thể sửa. Tạo bản sao để sửa.');
  }

  const items = (body.items || []).map((it, idx) => ({ ...normalizeItem(it), stt: idx + 1 }));
  if (!items.length) throw badRequest('Vui lòng thêm ít nhất 1 dòng sản phẩm');

  const header = normalizeHeader(dealerId, body, false);
  if (!header.so_bao_gia) header.so_bao_gia = existing.so_bao_gia;

  if (header.customer_id) {
    const c = customerModel.findById(dealerId, header.customer_id);
    if (!c) throw badRequest('Khách hàng không tồn tại');
  }

  // Check trùng số báo giá (khác id)
  const dup = db.prepare('SELECT id FROM quotations WHERE dealer_id = ? AND so_bao_gia = ? AND id != ?').get(dealerId, header.so_bao_gia, id);
  if (dup) throw conflict('Số báo giá đã tồn tại');

  const totals = computeTotals(header, items);
  Object.assign(header, totals);
  header.sent_at = existing.sent_at;
  header.sent_method = existing.sent_method;
  header.sent_note = existing.sent_note;

  quotationModel.update(dealerId, id, header, items);
  return quotationModel.findById(dealerId, id);
}

function remove(dealerId, id) {
  getById(dealerId, id);
  quotationModel.remove(dealerId, id);
}

function markSent(dealerId, id, body, ctx) {
  const existing = getById(dealerId, id);
  const sent_method = body.sent_method;
  if (!VALID_METHODS.includes(sent_method)) throw badRequest('Phương thức gửi không hợp lệ');
  const ok = quotationModel.markSent(dealerId, id, {
    sent_at: new Date().toISOString(),
    sent_method,
    sent_note: clean(body.sent_note, 300),
  });
  if (!ok) throw notFound('Không tìm thấy báo giá');
  audit.log(ctx, 'quotation.send', 'quotation', id, {
    so_bao_gia: existing.so_bao_gia, sent_method,
  });
  return quotationModel.findById(dealerId, id);
}

function setStatus(dealerId, id, status, ctx) {
  if (!VALID_STATUS.includes(status)) throw badRequest('Trạng thái không hợp lệ');
  const existing = getById(dealerId, id);
  quotationModel.setStatus(dealerId, id, status);
  if (status === 'confirmed') {
    audit.log(ctx, 'quotation.confirm', 'quotation', id, {
      so_bao_gia: existing.so_bao_gia, tong_cong: existing.tong_cong,
    });
  }
  return quotationModel.findById(dealerId, id);
}

// Clone báo giá: tạo bản nháp mới từ báo giá cũ
function clone(dealerId, id) {
  const original = getById(dealerId, id);
  const body = {
    customer_id: original.customer_id,
    ngay_bao_gia: new Date().toISOString().slice(0, 10),
    dia_chi_cong_trinh: original.dia_chi_cong_trinh,
    ghi_chu_ho_so: original.ghi_chu_ho_so,
    ghi_chu_thuong_mai: original.ghi_chu_thuong_mai,
    chi_phi_van_chuyen: original.chi_phi_van_chuyen,
    chi_phi_lap_dat: original.chi_phi_lap_dat,
    vat_percent: original.vat_percent,
    thanh_toan: original.thanh_toan,
    tien_do: original.tien_do,
    bao_hanh: original.bao_hanh,
    items: original.items,
  };
  return create(dealerId, body);
}

// ─── Ảnh đính kèm báo giá (tối đa 5 slot 1..5) ─────────────────────────────
const uploadService = require('./upload.service');

async function uploadImage(dealerId, quotationId, slot, file) {
  if (!file) throw badRequest('Vui lòng chọn file');
  const slotNum = Number(slot);
  if (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 5) {
    throw badRequest('Vị trí ảnh không hợp lệ (chỉ slot 1..5)');
  }
  getById(dealerId, quotationId); // verify ownership, throws if not found

  const result = await uploadService.uploadBuffer(file.buffer, `daily-so/quotations/${dealerId}/${quotationId}`);
  const oldPublicId = quotationModel.upsertImage(quotationId, slotNum, { url: result.secure_url, publicId: result.public_id });
  if (oldPublicId) uploadService.deleteByPublicId(oldPublicId).catch(() => {});
  return { slot: slotNum, url: result.secure_url, public_id: result.public_id };
}

async function deleteImage(dealerId, quotationId, slot) {
  const slotNum = Number(slot);
  if (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 5) {
    throw badRequest('Vị trí ảnh không hợp lệ');
  }
  getById(dealerId, quotationId);
  const oldPublicId = quotationModel.deleteImage(quotationId, slotNum);
  if (oldPublicId) uploadService.deleteByPublicId(oldPublicId).catch(() => {});
}

function updateImageCaption(dealerId, quotationId, slot, caption) {
  const slotNum = Number(slot);
  if (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 5) {
    throw badRequest('Vị trí ảnh không hợp lệ');
  }
  getById(dealerId, quotationId);
  const cap = caption == null ? null : String(caption).trim().slice(0, 200) || null;
  quotationModel.updateImageCaption(quotationId, slotNum, cap);
  return cap;
}

module.exports = {
  list, getById, suggestNumber, create, update, remove,
  markSent, setStatus, clone, computeLineTotal, computeTotals,
  uploadImage, deleteImage, updateImageCaption,
  VALID_PRICING, VALID_STATUS, VALID_METHODS,
};
