const db = require('../config/database');

const FIELDS = ['icon_key', 'label', 'svg_content', 'category', 'sort_order'];

function list({ category } = {}) {
  const where = [];
  const params = {};
  if (category) { where.push('category = @category'); params.category = category; }
  const sql = `SELECT id, icon_key, label, svg_content, category, sort_order
               FROM icon_library
               ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
               ORDER BY sort_order, label`;
  return db.prepare(sql).all(params);
}

function findById(id) {
  return db.prepare('SELECT * FROM icon_library WHERE id = ?').get(id);
}

function findByKey(icon_key) {
  return db.prepare('SELECT * FROM icon_library WHERE icon_key = ?').get(icon_key);
}

function categories() {
  return db.prepare(`SELECT DISTINCT category FROM icon_library WHERE category IS NOT NULL AND category <> '' ORDER BY category`)
    .all().map(r => r.category);
}

function create(data) {
  const cols = FIELDS.join(', ');
  const placeholders = FIELDS.map(f => `@${f}`).join(', ');
  const payload = Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null]));
  const info = db.prepare(`INSERT INTO icon_library (${cols}) VALUES (${placeholders})`).run(payload);
  return info.lastInsertRowid;
}

function update(id, data) {
  const sets = FIELDS.map(f => `${f} = @${f}`).join(', ');
  const payload = { id, ...Object.fromEntries(FIELDS.map(f => [f, data[f] ?? null])) };
  db.prepare(`UPDATE icon_library SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run(payload);
}

function remove(id) {
  const info = db.prepare('DELETE FROM icon_library WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = { FIELDS, list, findById, findByKey, categories, create, update, remove };
