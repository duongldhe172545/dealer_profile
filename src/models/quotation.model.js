// Quotation model v2 — đã support sections + adjustments.
// Backward compat: legacy cột chi_phi_van_chuyen + chi_phi_lap_dat vẫn tồn tại
// trong DB (data cũ); code mới luôn UPDATE = 0 vì giá trị đã chuyển sang
// bảng quotation_adjustments khi migrate 005.
const db = require('../config/database');

// HEADER_FIELDS = full set, dùng cho create (INSERT all).
// HEADER_FIELDS_UPDATE = subset, dùng cho update (UPDATE chỉ core fields).
// Loại trừ 4 field cập nhật qua endpoint riêng (PATCH order-status / financials)
// để full PUT từ BG editor không vô tình reset chúng về null.
const PARTIAL_FIELDS = ['order_status', 'ready_to_send', 'thanh_toan_thuc', 'gia_von'];
const HEADER_FIELDS = [
  'customer_id', 'so_bao_gia', 'ngay_bao_gia', 'dia_chi_cong_trinh',
  'ghi_chu_ho_so', 'ghi_chu_thuong_mai',
  'tam_tinh',
  'chi_phi_van_chuyen', 'chi_phi_lap_dat',   // legacy — luôn 0 trên save mới
  'vat_percent', 'vat_amount', 'tong_cong',
  'chiet_khau_percent',                       // mig 013
  'thanh_toan', 'tien_do', 'bao_hanh',
  // mig 014
  'dealer_name_override', 'dealer_address_override',
  'dealer_phone_override', 'dealer_email_override',
  'quote_title', 'selected_template',
  // mig 015 — 2 trục state + tài chính nhập tay (cập nhật qua endpoint riêng)
  ...PARTIAL_FIELDS,
  'status', 'sent_at', 'sent_method', 'sent_note',
];
const HEADER_FIELDS_UPDATE = HEADER_FIELDS.filter(f => !PARTIAL_FIELDS.includes(f));

const ITEM_FIELDS = [
  'product_id', 'stt', 'ma_sp', 'ten_sp', 'nhom_sp', 'mo_ta',
  'cach_tinh_gia', 'rong', 'cao', 'dien_tich', 'dai', 'can_nang',
  'sl', 'dvt', 'don_gia', 'thanh_tien',
  'section_id',                              // v2 — trỏ về quotation_sections.id
];

// Filter `status` (DB enum) hoặc `logical_status` (5 trạng thái FE).
// logical_status map ngược về (status, ready_to_send) theo bảng:
//   'nhap'     → status='draft'     AND ready_to_send=0
//   'chua_gui' → status='draft'     AND ready_to_send=1
//   'da_gui'   → status='sent'
//   'da_chot'  → status='confirmed'
//   'da_truot' → status='cancelled'
function list(dealerId, { search, status, logical_status, customer_id, from, to } = {}) {
  const where = ['q.dealer_id = @dealer_id'];
  const params = { dealer_id: dealerId };
  if (search) {
    where.push('(q.so_bao_gia LIKE @kw OR q.dia_chi_cong_trinh LIKE @kw OR c.ten_kh LIKE @kw)');
    params.kw = `%${search}%`;
  }
  if (logical_status) {
    if      (logical_status === 'nhap')     { where.push("q.status = 'draft' AND q.ready_to_send = 0"); }
    else if (logical_status === 'chua_gui') { where.push("q.status = 'draft' AND q.ready_to_send = 1"); }
    else if (logical_status === 'da_gui')   { where.push("q.status = 'sent'"); }
    else if (logical_status === 'da_chot')  { where.push("q.status = 'confirmed'"); }
    else if (logical_status === 'da_truot') { where.push("q.status = 'cancelled'"); }
  } else if (status) {
    where.push('q.status = @status');
    params.status = status;
  }
  if (customer_id) { where.push('q.customer_id = @customer_id'); params.customer_id = Number(customer_id); }
  if (from) { where.push('q.ngay_bao_gia >= @from'); params.from = from; }
  if (to)   { where.push('q.ngay_bao_gia <= @to');   params.to = to; }

  return db.prepare(`
    SELECT q.id, q.so_bao_gia, q.ngay_bao_gia, q.status, q.ready_to_send, q.sent_at, q.sent_method,
           q.tong_cong, q.dia_chi_cong_trinh,
           q.order_status, q.thanh_toan_thuc, q.gia_von,
           q.customer_id, c.ten_kh AS customer_name, c.ma_kh AS customer_code,
           (SELECT COUNT(*) FROM quotation_items i WHERE i.quotation_id = q.id) AS items_count
    FROM quotations q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE ${where.join(' AND ')}
    ORDER BY q.ngay_bao_gia DESC, q.id DESC
  `).all(params);
}

function findById(dealerId, id) {
  const header = db.prepare(`
    SELECT q.*, c.ten_kh AS customer_name, c.ma_kh AS customer_code,
           c.nguoi_lien_he AS customer_contact, c.phone AS customer_phone,
           c.email AS customer_email, c.dia_chi AS customer_address
    FROM quotations q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE q.dealer_id = ? AND q.id = ?
  `).get(dealerId, id);
  if (!header) return null;
  const sections = db.prepare(
    'SELECT id, position, ten FROM quotation_sections WHERE quotation_id = ? ORDER BY position'
  ).all(id);
  const items = db.prepare(
    'SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY stt'
  ).all(id);
  const adjustments = db.prepare(
    'SELECT id, position, kind, label, amount, mode, value_percent, so_bo, don_vi, don_gia FROM quotation_adjustments WHERE quotation_id = ? ORDER BY position'
  ).all(id);
  const images = db.prepare(
    'SELECT slot, url, public_id, caption FROM quotation_images WHERE quotation_id = ? ORDER BY slot'
  ).all(id);
  return { ...header, sections, items, adjustments, images };
}

function getImages(quotationId) {
  return db.prepare('SELECT slot, url, public_id, caption FROM quotation_images WHERE quotation_id = ? ORDER BY slot').all(quotationId);
}

function upsertImage(quotationId, slot, { url, publicId, caption }) {
  const ex = db.prepare('SELECT id, public_id FROM quotation_images WHERE quotation_id=? AND slot=?').get(quotationId, slot);
  if (ex) {
    db.prepare('UPDATE quotation_images SET url=?, public_id=?, caption=?, uploaded_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(url, publicId, caption ?? null, ex.id);
    return ex.public_id;
  }
  db.prepare('INSERT INTO quotation_images (quotation_id, slot, url, public_id, caption) VALUES (?, ?, ?, ?, ?)')
    .run(quotationId, slot, url, publicId, caption ?? null);
  return null;
}

function deleteImage(quotationId, slot) {
  const ex = db.prepare('SELECT public_id FROM quotation_images WHERE quotation_id=? AND slot=?').get(quotationId, slot);
  db.prepare('DELETE FROM quotation_images WHERE quotation_id=? AND slot=?').run(quotationId, slot);
  return ex ? ex.public_id : null;
}

function updateImageCaption(quotationId, slot, caption) {
  const info = db.prepare('UPDATE quotation_images SET caption=? WHERE quotation_id=? AND slot=?')
    .run(caption ?? null, quotationId, slot);
  return info.changes > 0;
}

// Auto-gen số báo giá: BG-2026-001, theo dealer + năm
function nextNumber(dealerId, year) {
  const prefix = `BG-${year}-`;
  const row = db.prepare(`
    SELECT so_bao_gia FROM quotations
    WHERE dealer_id = ? AND so_bao_gia LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(dealerId, prefix + '%');
  let n = 1;
  if (row && row.so_bao_gia) {
    const m = row.so_bao_gia.match(/BG-\d{4}-(\d+)/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return prefix + String(n).padStart(3, '0');
}

// Insert sections cho 1 báo giá. Trả map { position → newId } để items chỉ trỏ đúng.
function insertSections(quotationId, sections) {
  const map = {};
  if (!sections || !sections.length) return map;
  const stmt = db.prepare(
    'INSERT INTO quotation_sections (quotation_id, position, ten) VALUES (?, ?, ?)'
  );
  for (const s of sections) {
    const info = stmt.run(quotationId, s.position, s.ten ?? null);
    map[s.position] = info.lastInsertRowid;
  }
  return map;
}

function insertItems(quotationId, items, sectionIdMap) {
  if (!items || !items.length) return;
  const cols = ['quotation_id', ...ITEM_FIELDS].join(', ');
  const placeholders = ['@quotation_id', ...ITEM_FIELDS.map(f => `@${f}`)].join(', ');
  const stmt = db.prepare(`INSERT INTO quotation_items (${cols}) VALUES (${placeholders})`);
  items.forEach((it, idx) => {
    // it.section_position (FE input dạng chỉ số) → map thành section_id thực
    const sectionId = it.section_position != null && sectionIdMap[it.section_position] != null
      ? sectionIdMap[it.section_position]
      : null;
    const payload = {
      quotation_id: quotationId,
      ...Object.fromEntries(ITEM_FIELDS.map(f => [f, it[f] ?? null])),
      section_id: sectionId,
    };
    if (payload.stt == null) payload.stt = idx + 1;
    stmt.run(payload);
  });
}

function insertAdjustments(quotationId, adjustments) {
  if (!adjustments || !adjustments.length) return;
  const stmt = db.prepare(
    `INSERT INTO quotation_adjustments
       (quotation_id, position, kind, label, amount, mode, value_percent, so_bo, don_vi, don_gia)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const a of adjustments) {
    stmt.run(
      quotationId, a.position, a.kind, a.label,
      a.amount ?? 0,
      a.mode || 'fixed',
      a.value_percent ?? null,
      a.so_bo ?? null,
      a.don_vi ?? null,
      a.don_gia ?? null
    );
  }
}

function create(dealerId, header, sections, items, adjustments) {
  const tx = db.transaction(() => {
    // BG mới: default cho 4 partial fields (mig 015)
    const PARTIAL_DEFAULTS = {
      order_status:    'cho_san_xuat',
      ready_to_send:   0,
      thanh_toan_thuc: null,
      gia_von:         null,
    };
    const cols = ['dealer_id', ...HEADER_FIELDS].join(', ');
    const placeholders = ['@dealer_id', ...HEADER_FIELDS.map(f => `@${f}`)].join(', ');
    const payload = {
      dealer_id: dealerId,
      ...Object.fromEntries(HEADER_FIELDS.map(f => [
        f,
        header[f] !== undefined ? header[f] : (PARTIAL_DEFAULTS[f] !== undefined ? PARTIAL_DEFAULTS[f] : null),
      ])),
    };
    const info = db.prepare(`INSERT INTO quotations (${cols}) VALUES (${placeholders})`).run(payload);
    const quotationId = info.lastInsertRowid;
    const sectionIdMap = insertSections(quotationId, sections);
    insertItems(quotationId, items, sectionIdMap);
    insertAdjustments(quotationId, adjustments);
    return quotationId;
  });
  return tx();
}

function update(dealerId, id, header, sections, items, adjustments) {
  const tx = db.transaction(() => {
    const sets = HEADER_FIELDS_UPDATE.map(f => `${f} = @${f}`).join(', ');
    const payload = {
      dealer_id: dealerId, id,
      ...Object.fromEntries(HEADER_FIELDS_UPDATE.map(f => [f, header[f] ?? null])),
    };
    db.prepare(`UPDATE quotations SET ${sets}, updated_at = CURRENT_TIMESTAMP
      WHERE dealer_id = @dealer_id AND id = @id`).run(payload);

    // Xoá hết items + sections + adjustments cũ rồi insert lại (đơn giản, idempotent)
    db.prepare('DELETE FROM quotation_items WHERE quotation_id = ?').run(id);
    db.prepare('DELETE FROM quotation_sections WHERE quotation_id = ?').run(id);
    db.prepare('DELETE FROM quotation_adjustments WHERE quotation_id = ?').run(id);
    const sectionIdMap = insertSections(id, sections);
    insertItems(id, items, sectionIdMap);
    insertAdjustments(id, adjustments);
  });
  tx();
}

function remove(dealerId, id) {
  const info = db.prepare('DELETE FROM quotations WHERE dealer_id = ? AND id = ?').run(dealerId, id);
  return info.changes > 0;
}

// Partial update — chỉ set order_status (mig 015)
function setOrderStatus(dealerId, id, order_status) {
  const info = db.prepare(`
    UPDATE quotations SET order_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = ? AND id = ?
  `).run(order_status, dealerId, id);
  return info.changes > 0;
}

// Partial update — set logical status (status + ready_to_send) qua mapping
function setLogicalStatus(dealerId, id, dbStatus, ready_to_send) {
  const info = db.prepare(`
    UPDATE quotations SET status = ?, ready_to_send = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = ? AND id = ?
  `).run(dbStatus, ready_to_send ? 1 : 0, dealerId, id);
  return info.changes > 0;
}

// Partial update — financial fields (mig 015)
function setFinancials(dealerId, id, { thanh_toan_thuc, gia_von }) {
  const info = db.prepare(`
    UPDATE quotations SET thanh_toan_thuc = ?, gia_von = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = ? AND id = ?
  `).run(
    thanh_toan_thuc == null ? null : Math.round(Number(thanh_toan_thuc)),
    gia_von == null ? null : Math.round(Number(gia_von)),
    dealerId, id
  );
  return info.changes > 0;
}

function markSent(dealerId, id, { sent_at, sent_method, sent_note }) {
  const info = db.prepare(`
    UPDATE quotations
    SET status = 'sent', sent_at = ?, sent_method = ?, sent_note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = ? AND id = ?
  `).run(sent_at, sent_method, sent_note, dealerId, id);
  return info.changes > 0;
}

module.exports = {
  HEADER_FIELDS, ITEM_FIELDS,
  list, findById, nextNumber, create, update, remove, markSent,
  setOrderStatus, setLogicalStatus, setFinancials,
  getImages, upsertImage, deleteImage, updateImageCaption,
};
