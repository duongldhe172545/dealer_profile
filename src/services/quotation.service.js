const db = require('../config/database');
const quotationModel = require('../models/quotation.model');
const customerModel = require('../models/customer.model');
const productModel = require('../models/product.model');
const audit = require('../utils/audit');
const { badRequest, notFound, conflict } = require('../utils/http');
const { cleanString } = require('../utils/sanitize');

const VALID_PRICING = ['kich_thuoc', 'dien_tich', 'dai', 'can', 'so_luong'];
const VALID_STATUS  = ['draft', 'sent', 'confirmed', 'cancelled'];
const VALID_METHODS = ['zalo', 'email', 'in_giay', 'khac'];
const VALID_ADJ_KIND = ['plus', 'minus'];
const VALID_ADJ_MODE = ['fixed', 'percent'];
const DEFAULT_VAT_NEW = 8;   // báo giá mới mặc định VAT 8% (theo mẫu mới)

const clean = (value, max = 500) => cleanString(value, max);

function num(value, label, { allowNull = true, integer = false, min = 0 } = {}) {
  if (value == null || value === '') return allowNull ? null : (integer ? 0 : 0);
  const n = Number(value);
  if (!Number.isFinite(n)) throw badRequest(`${label} phải là số`);
  if (n < min) throw badRequest(`${label} phải >= ${min}`);
  return integer ? Math.round(n) : n;
}

// Thành tiền 1 dòng (theo Excel BG):
//   - Có khối lượng (dien_tich đã chứa số bộ): thanh_tien = khối_lượng × đơn_giá
//   - Không có khối lượng: thanh_tien = số_bộ × đơn_giá   (fallback đơn vị 'cái', 'gói'…)
function computeLineTotal(it) {
  const sl = Number(it.sl) || 0;
  const dg = Number(it.don_gia) || 0;
  const kl = Number(it.dien_tich) || 0;
  if (kl > 0) return Math.round(kl * dg);
  return Math.round(sl * dg);
}

function normalizeItem(it) {
  const cach_tinh_gia = it.cach_tinh_gia || 'so_luong';
  if (!VALID_PRICING.includes(cach_tinh_gia)) throw badRequest('Cách tính giá không hợp lệ');

  const cleaned = {
    product_id: it.product_id ? Number(it.product_id) : null,
    stt: Number(it.stt) || null,
    ma_sp: clean(it.ma_sp, 50),
    ten_sp: clean(it.ten_sp, 200),
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

function normalizeAdjustment(a, idx) {
  if (!a || !VALID_ADJ_KIND.includes(a.kind)) {
    throw badRequest('Kind dòng điều chỉnh phải là "plus" hoặc "minus"');
  }
  const label = clean(a.label, 100);
  if (!label) throw badRequest('Phải nhập tên cho dòng điều chỉnh');
  const mode = VALID_ADJ_MODE.includes(a.mode) ? a.mode : 'fixed';

  if (mode === 'percent') {
    // a.amount = giá trị % (vd 5.5 = 5.5%). Lưu vào value_percent, amount=0.
    const pct = Number(a.amount);
    if (!Number.isFinite(pct) || pct < 0 || pct > 1000) {
      throw badRequest('Phần trăm điều chỉnh phải 0–1000');
    }
    return {
      position: idx, kind: a.kind, label, mode,
      amount: 0, value_percent: pct,
      so_bo: null, don_vi: null, don_gia: null,
    };
  }

  // fixed — hỗ trợ 2 cách input:
  //   (1) FE mới: gửi { so_bo, don_vi, don_gia } → amount tự tính = so_bo × don_gia
  //   (2) BG cũ / quick input: chỉ gửi amount
  const so_bo = a.so_bo != null && a.so_bo !== '' ? num(a.so_bo, 'Số bộ điều chỉnh', { integer: true }) : null;
  const don_vi = clean(a.don_vi, 50) || null;
  const don_gia = a.don_gia != null && a.don_gia !== '' ? num(a.don_gia, 'Đơn giá điều chỉnh', { integer: true }) : null;

  let amount;
  if (so_bo != null && don_gia != null) {
    amount = Math.round((so_bo || 1) * don_gia);
  } else if (don_gia != null && so_bo == null) {
    amount = don_gia;   // gõ mỗi đơn giá → coi như số bộ = 1
  } else {
    amount = num(a.amount, 'Số tiền điều chỉnh', { allowNull: false, integer: true }) || 0;
  }

  return {
    position: idx, kind: a.kind, label, mode,
    amount, value_percent: null,
    so_bo, don_vi, don_gia,
  };
}

// Convert body của FE → cấu trúc chuẩn: { sections[], items[], adjustments[] }.
// Backward compat:
//   - FE chưa update gửi items flat (không có sections) → tự bọc 1 section default
//   - FE chưa update gửi chi_phi_van_chuyen / chi_phi_lap_dat → tự convert sang
//     adjustments kind=plus (khi không có adjustments truyền vào)
//   - BG draft trống hoàn toàn (no sections, no items) → để rỗng, không wrap
function prepareSectionedPayload(body) {
  // Sections + items
  let rawSections;
  if (Array.isArray(body.sections) && body.sections.length) {
    rawSections = body.sections;
  } else if (Array.isArray(body.items) && body.items.length) {
    // FE cũ: items flat → wrap 1 section default
    rawSections = [{ ten: 'Chưa phân nhóm', items: body.items }];
  } else {
    // BG draft trống — cho phép save để có id (upload ảnh / xuất PDF cần id)
    rawSections = [];
  }

  const sections = [];
  const items = [];
  rawSections.forEach((s, sIdx) => {
    const sectionTen = clean(s.ten, 100);
    sections.push({ position: sIdx, ten: sectionTen });
    const sItems = s.items || [];
    sItems.forEach(it => {
      const normalized = normalizeItem(it);
      normalized.section_position = sIdx;
      normalized.stt = items.length + 1; // STT đánh số toàn báo giá
      // Backward compat: nếu FE không gửi nhom_sp riêng → set từ section.ten
      // (giữ field cũ trong DB cho search/filter sau này).
      if (!normalized.nhom_sp && sectionTen) normalized.nhom_sp = sectionTen;
      items.push(normalized);
    });
  });

  // Adjustments
  let adjustments;
  if (Array.isArray(body.adjustments)) {
    adjustments = body.adjustments.map((a, idx) => normalizeAdjustment(a, idx));
  } else {
    // FE cũ: convert chi_phi_van_chuyen + chi_phi_lap_dat → adjustments plus
    adjustments = [];
    let pos = 0;
    const vc = num(body.chi_phi_van_chuyen, 'Chi phí vận chuyển', { integer: true }) || 0;
    const ld = num(body.chi_phi_lap_dat, 'Chi phí lắp đặt', { integer: true }) || 0;
    if (vc > 0) adjustments.push({ position: pos++, kind: 'plus', label: 'Vận chuyển', amount: vc });
    if (ld > 0) adjustments.push({ position: pos++, kind: 'plus', label: 'Lắp đặt', amount: ld });
  }

  return { sections, items, adjustments };
}

function normalizeHeader(dealerId, body, autoGenNumber, defaultVat = 0) {
  const ngay = clean(body.ngay_bao_gia, 30) || new Date().toISOString().slice(0, 10);
  let so_bao_gia = clean(body.so_bao_gia, 30);
  if (!so_bao_gia && autoGenNumber) {
    const year = (ngay.match(/^(\d{4})/) || [])[1] || String(new Date().getFullYear());
    so_bao_gia = quotationModel.nextNumber(dealerId, year);
  }

  // VAT %: nếu FE truyền explicit (kể cả 0) → giữ; nếu thiếu hẳn → default
  const vatProvided = body.vat_percent != null && body.vat_percent !== '';
  const vat_percent = vatProvided ? (num(body.vat_percent, 'VAT %') || 0) : defaultVat;

  // Chiết khấu % độc lập (mig 013) — clamp 0..100
  let chiet_khau_percent = 0;
  if (body.chiet_khau_percent != null && body.chiet_khau_percent !== '') {
    const ck = Number(body.chiet_khau_percent);
    if (Number.isFinite(ck) && ck >= 0 && ck <= 100) chiet_khau_percent = ck;
  }

  return {
    customer_id: body.customer_id ? Number(body.customer_id) : null,
    so_bao_gia,
    ngay_bao_gia: ngay,
    dia_chi_cong_trinh: clean(body.dia_chi_cong_trinh, 300),
    ghi_chu_ho_so: clean(body.ghi_chu_ho_so, 500),
    ghi_chu_thuong_mai: clean(body.ghi_chu_thuong_mai, 500),
    // Legacy fields — luôn 0 trên save mới (data thực ở quotation_adjustments)
    chi_phi_van_chuyen: 0,
    chi_phi_lap_dat: 0,
    vat_percent,
    chiet_khau_percent,
    thanh_toan: clean(body.thanh_toan, 500),
    tien_do: clean(body.tien_do, 500),
    bao_hanh: clean(body.bao_hanh, 500),
    status: body.status && VALID_STATUS.includes(body.status) ? body.status : 'draft',
  };
}

// Tổng cộng v2 (Excel-style):
//   tam_tinh            = Σ items.thanh_tien                       (TỔNG A+B+C+...)
//   plus%               base = tam_tinh                            (phụ phí % tính trên giá SP)
//   tong_cong_truoc_ck  = tam_tinh + Σ plus                        (Tổng cộng)
//   minus%              base = tong_cong_truoc_ck                  (chiết khấu trên Tổng cộng)
//   pre_tax             = tong_cong_truoc_ck − Σ minus             (Giá sau chiết khấu)
//   vat_amount          = pre_tax × vat% / 100                     (VAT trên giá sau ck)
//   tong_cong           = pre_tax + vat_amount                     (Thành tiền)
function computeTotals(header, items, adjustments) {
  const tam_tinh = items.reduce((s, it) => s + (Number(it.thanh_tien) || 0), 0);

  let plus_sum = 0;
  for (const a of adjustments) {
    if (a.kind !== 'plus') continue;
    if (a.mode === 'percent') {
      plus_sum += Math.round(tam_tinh * (Number(a.value_percent) || 0) / 100);
    } else {
      plus_sum += Number(a.amount) || 0;
    }
  }
  const tong_cong_truoc_ck = tam_tinh + plus_sum;

  // Chiết khấu: ưu tiên header.chiet_khau_percent (mig 013).
  // Legacy: nếu BG cũ có minus adjustments → vẫn sum vào để không break.
  const ck_pct = Number(header.chiet_khau_percent) || 0;
  let minus_sum = Math.round(tong_cong_truoc_ck * ck_pct / 100);
  for (const a of adjustments) {
    if (a.kind !== 'minus') continue;
    if (a.mode === 'percent') {
      minus_sum += Math.round(tong_cong_truoc_ck * (Number(a.value_percent) || 0) / 100);
    } else {
      minus_sum += Number(a.amount) || 0;
    }
  }

  const pre_tax = tong_cong_truoc_ck - minus_sum;
  const vat_amount = Math.round(pre_tax * (Number(header.vat_percent) || 0) / 100);
  const tong_cong = pre_tax + vat_amount;
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
  const { sections, items, adjustments } = prepareSectionedPayload(body);
  // KHÔNG check items.length — cho phép tạo BG draft trống (để có id upload ảnh,
  // xuất PDF, ...). Validation "ít nhất 1 item" sẽ áp khi đại lý markSent.

  const header = normalizeHeader(dealerId, body, true, DEFAULT_VAT_NEW);
  if (!header.so_bao_gia) throw badRequest('Thiếu số báo giá');

  if (header.customer_id) {
    const c = customerModel.findById(dealerId, header.customer_id);
    if (!c) throw badRequest('Khách hàng không tồn tại');
  }

  const existing = db.prepare('SELECT id FROM quotations WHERE dealer_id = ? AND so_bao_gia = ?').get(dealerId, header.so_bao_gia);
  if (existing) throw conflict('Số báo giá đã tồn tại');

  const totals = computeTotals(header, items, adjustments);
  Object.assign(header, totals);

  const id = quotationModel.create(dealerId, header, sections, items, adjustments);
  audit.log(ctx, 'quotation.create', 'quotation', id, {
    so_bao_gia: header.so_bao_gia, tong_cong: header.tong_cong,
    items_count: items.length, sections_count: sections.length,
    customer_id: header.customer_id,
  });
  return quotationModel.findById(dealerId, id);
}

function update(dealerId, id, body) {
  const existing = getById(dealerId, id);
  if (existing.status !== 'draft') {
    throw badRequest('Báo giá đã gửi, không thể sửa. Tạo bản sao để sửa.');
  }

  const { sections, items, adjustments } = prepareSectionedPayload(body);
  // KHÔNG check items.length — cho phép save draft trống. Sẽ kiểm khi markSent.

  const header = normalizeHeader(dealerId, body, false, existing.vat_percent || 0);
  if (!header.so_bao_gia) header.so_bao_gia = existing.so_bao_gia;

  if (header.customer_id) {
    const c = customerModel.findById(dealerId, header.customer_id);
    if (!c) throw badRequest('Khách hàng không tồn tại');
  }

  const dup = db.prepare('SELECT id FROM quotations WHERE dealer_id = ? AND so_bao_gia = ? AND id != ?').get(dealerId, header.so_bao_gia, id);
  if (dup) throw conflict('Số báo giá đã tồn tại');

  const totals = computeTotals(header, items, adjustments);
  Object.assign(header, totals);
  header.sent_at = existing.sent_at;
  header.sent_method = existing.sent_method;
  header.sent_note = existing.sent_note;

  quotationModel.update(dealerId, id, header, sections, items, adjustments);
  return quotationModel.findById(dealerId, id);
}

function remove(dealerId, id) {
  getById(dealerId, id);
  quotationModel.remove(dealerId, id);
}

function markSent(dealerId, id, body, ctx) {
  const existing = getById(dealerId, id);
  // Khi gửi BG đi → bắt buộc có ít nhất 1 dòng sản phẩm
  if (!existing.items || !existing.items.length) {
    throw badRequest('Báo giá chưa có dòng sản phẩm nào — không thể gửi đi');
  }
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

// Clone báo giá: tạo bản nháp mới từ báo giá cũ, giữ nguyên sections + adjustments.
function clone(dealerId, id) {
  const original = getById(dealerId, id);

  // Group items theo section_id để rebuild structure
  const itemsBySection = new Map();
  for (const it of (original.items || [])) {
    const sId = it.section_id;
    if (!itemsBySection.has(sId)) itemsBySection.set(sId, []);
    itemsBySection.get(sId).push(it);
  }

  const sections = (original.sections || []).map(s => ({
    ten: s.ten,
    items: itemsBySection.get(s.id) || [],
  }));
  // Items không thuộc section nào (legacy edge case) → 1 section "Khác" cuối cùng
  const orphanItems = itemsBySection.get(null) || [];
  if (orphanItems.length) sections.push({ ten: 'Khác', items: orphanItems });

  const body = {
    customer_id: original.customer_id,
    ngay_bao_gia: new Date().toISOString().slice(0, 10),
    dia_chi_cong_trinh: original.dia_chi_cong_trinh,
    ghi_chu_ho_so: original.ghi_chu_ho_so,
    ghi_chu_thuong_mai: original.ghi_chu_thuong_mai,
    vat_percent: original.vat_percent,
    thanh_toan: original.thanh_toan,
    tien_do: original.tien_do,
    bao_hanh: original.bao_hanh,
    sections,
    adjustments: (original.adjustments || []).map(a => ({
      kind: a.kind, label: a.label, amount: a.amount,
    })),
  };
  return create(dealerId, body);
}

// ─── Ảnh đính kèm báo giá (tối đa 5 slot 1..5) ─────────────────────────────
const uploadService = require('./upload.service');
const imageModel = require('../models/image-library.model');

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

// Đính ảnh từ kho ảnh chung vào 1 slot báo giá.
// Snapshot URL — KHÔNG copy public_id (để xoá slot không đụng ảnh trong kho).
async function setImageFromLibrary(dealerId, quotationId, slot, imageId) {
  const slotNum = Number(slot);
  if (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 5) {
    throw badRequest('Vị trí ảnh không hợp lệ');
  }
  getById(dealerId, quotationId);
  const img = imageModel.findById(Number(imageId));
  if (!img) throw badRequest('Không tìm thấy ảnh trong kho');
  // Quyền: admin's NULL (mọi đại lý xem được) hoặc của chính dealer
  if (img.dealer_id != null && img.dealer_id !== dealerId) {
    throw badRequest('Không có quyền dùng ảnh này');
  }
  const oldPublicId = quotationModel.upsertImage(quotationId, slotNum, { url: img.url, publicId: null });
  // Nếu slot trước đó có ảnh Cloudinary riêng (upload trực tiếp), cleanup
  if (oldPublicId) uploadService.deleteByPublicId(oldPublicId).catch(() => {});
  return { slot: slotNum, url: img.url, public_id: null };
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
  uploadImage, deleteImage, updateImageCaption, setImageFromLibrary,
  VALID_PRICING, VALID_STATUS, VALID_METHODS, VALID_ADJ_KIND, DEFAULT_VAT_NEW,
};
