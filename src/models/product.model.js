const db = require('../config/database');

const FIELDS = ['ma_sp', 'nhom_sp', 'mo_ta', 'dvt_mac_dinh', 'cach_tinh_gia', 'don_gia_mac_dinh', 'active'];

function list(dealerId, { search, nhom_sp, active } = {}) {
  const where = ['dealer_id = @dealer_id'];
  const params = { dealer_id: dealerId };
  if (search) {
    where.push('(ma_sp LIKE @kw OR mo_ta LIKE @kw OR nhom_sp LIKE @kw)');
    params.kw = `%${search}%`;
  }
  if (nhom_sp) { where.push('nhom_sp = @nhom_sp'); params.nhom_sp = nhom_sp; }
  if (active === 1 || active === 0) { where.push('active = @active'); params.active = active; }
  return db.prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY nhom_sp, ma_sp`).all(params);
}

function listActive(dealerId) {
  return db.prepare(`SELECT id, ma_sp, nhom_sp, mo_ta, dvt_mac_dinh, cach_tinh_gia, don_gia_mac_dinh
    FROM products WHERE dealer_id = ? AND active = 1 ORDER BY nhom_sp, ma_sp`).all(dealerId);
}

function findById(dealerId, id) {
  return db.prepare('SELECT * FROM products WHERE dealer_id = ? AND id = ?').get(dealerId, id);
}

function findByCode(dealerId, ma_sp) {
  return db.prepare('SELECT id FROM products WHERE dealer_id = ? AND ma_sp = ?').get(dealerId, ma_sp);
}

function distinctGroups(dealerId) {
  return db.prepare("SELECT DISTINCT nhom_sp FROM products WHERE dealer_id = ? AND nhom_sp IS NOT NULL AND nhom_sp <> '' ORDER BY nhom_sp").all(dealerId).map(r => r.nhom_sp);
}

function create(dealerId, data) {
  const cols = ['dealer_id', ...FIELDS].join(', ');
  const placeholders = ['@dealer_id', ...FIELDS.map(f => `@${f}`)].join(', ');
  const payload = { dealer_id: dealerId, ...Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null])) };
  const info = db.prepare(`INSERT INTO products (${cols}) VALUES (${placeholders})`).run(payload);
  return info.lastInsertRowid;
}

function update(dealerId, id, data) {
  const sets = FIELDS.map(f => `${f} = @${f}`).join(', ');
  const payload = { dealer_id: dealerId, id, ...Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null])) };
  db.prepare(`UPDATE products SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE dealer_id = @dealer_id AND id = @id`).run(payload);
}

function remove(dealerId, id) {
  const info = db.prepare('DELETE FROM products WHERE dealer_id = ? AND id = ?').run(dealerId, id);
  return info.changes > 0;
}

module.exports = { FIELDS, list, listActive, findById, findByCode, distinctGroups, create, update, remove };
