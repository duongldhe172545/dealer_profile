// Kho ảnh shared (admin + dealer)
//   dealer_id IS NULL → admin tạo, mọi đại lý thấy
//   dealer_id = X     → đại lý X tạo, chỉ X + admin thấy
const db = require('../config/database');

const FIELDS = ['dealer_id', 'name', 'url', 'public_id', 'category'];

// Admin xem tất cả
function listAll({ category } = {}) {
  const where = [];
  const params = {};
  if (category) { where.push('category = @category'); params.category = category; }
  const sql = `SELECT i.id, i.dealer_id, i.name, i.url, i.public_id, i.category, i.created_at,
                      d.ten_dai_ly AS dealer_name
               FROM image_library i
               LEFT JOIN dealers d ON d.id = i.dealer_id
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY i.dealer_id NULLS FIRST, i.created_at DESC`;
  return db.prepare(sql).all(params);
}

// Dealer xem: admin's (NULL) + own
function listForDealer(dealerId, { category } = {}) {
  const where = ['(i.dealer_id IS NULL OR i.dealer_id = @dealer_id)'];
  const params = { dealer_id: dealerId };
  if (category) { where.push('i.category = @category'); params.category = category; }
  const sql = `SELECT i.id, i.dealer_id, i.name, i.url, i.public_id, i.category, i.created_at
               FROM image_library i
               WHERE ${where.join(' AND ')}
               ORDER BY i.dealer_id NULLS FIRST, i.created_at DESC`;
  return db.prepare(sql).all(params);
}

function findById(id) {
  return db.prepare('SELECT * FROM image_library WHERE id = ?').get(id);
}

function create(data) {
  const cols = FIELDS.join(', ');
  const placeholders = FIELDS.map(f => `@${f}`).join(', ');
  const payload = Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null]));
  const info = db.prepare(`INSERT INTO image_library (${cols}) VALUES (${placeholders})`).run(payload);
  return info.lastInsertRowid;
}

function update(id, data) {
  const sets = FIELDS.map(f => `${f} = @${f}`).join(', ');
  const payload = { id, ...Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null])) };
  db.prepare(`UPDATE image_library SET ${sets} WHERE id = @id`).run(payload);
}

function remove(id) {
  const info = db.prepare('DELETE FROM image_library WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = { FIELDS, listAll, listForDealer, findById, create, update, remove };
