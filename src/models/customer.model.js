const db = require('../config/database');

const FIELDS = ['ma_kh', 'ten_kh', 'nguoi_lien_he', 'phone', 'email', 'dia_chi', 'ghi_chu'];

function list(dealerId, { search } = {}) {
  const where = ['dealer_id = @dealer_id'];
  const params = { dealer_id: dealerId };
  if (search) {
    where.push('(ten_kh LIKE @kw OR ma_kh LIKE @kw OR phone LIKE @kw OR nguoi_lien_he LIKE @kw)');
    params.kw = `%${search}%`;
  }
  return db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM quotations q WHERE q.customer_id = c.id) AS quotations_count
    FROM customers c
    WHERE ${where.join(' AND ')}
    ORDER BY c.created_at DESC
  `).all(params);
}

function findById(dealerId, id) {
  return db.prepare('SELECT * FROM customers WHERE dealer_id = ? AND id = ?').get(dealerId, id);
}

function findByCode(dealerId, ma_kh) {
  return db.prepare('SELECT id FROM customers WHERE dealer_id = ? AND ma_kh = ?').get(dealerId, ma_kh);
}

// Auto-gen mã KH: KH-0001, KH-0002... theo dealer
function nextCode(dealerId) {
  const row = db.prepare(`
    SELECT ma_kh FROM customers
    WHERE dealer_id = ? AND ma_kh LIKE 'KH-%'
    ORDER BY id DESC LIMIT 1
  `).get(dealerId);
  let n = 1;
  if (row && row.ma_kh) {
    const m = row.ma_kh.match(/KH-(\d+)/);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return 'KH-' + String(n).padStart(4, '0');
}

function create(dealerId, data) {
  const cols = ['dealer_id', ...FIELDS].join(', ');
  const placeholders = ['@dealer_id', ...FIELDS.map(f => `@${f}`)].join(', ');
  const payload = { dealer_id: dealerId, ...Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null])) };
  const info = db.prepare(`INSERT INTO customers (${cols}) VALUES (${placeholders})`).run(payload);
  return info.lastInsertRowid;
}

function update(dealerId, id, data) {
  const sets = FIELDS.map(f => `${f} = @${f}`).join(', ');
  const payload = { dealer_id: dealerId, id, ...Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null])) };
  db.prepare(`UPDATE customers SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE dealer_id = @dealer_id AND id = @id`).run(payload);
}

function remove(dealerId, id) {
  const info = db.prepare('DELETE FROM customers WHERE dealer_id = ? AND id = ?').run(dealerId, id);
  return info.changes > 0;
}

module.exports = { FIELDS, list, findById, findByCode, nextCode, create, update, remove };
