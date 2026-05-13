const db = require('../config/database');

const DEALER_FIELDS = [
  'dealer_code', 'ten_dai_ly', 'chu_dai_ly', 'phone', 'email', 'mst',
  'address', 'district', 'province', 'coverage',
  'years_experience', 'team_size', 'projects_monthly', 'open_hours',
];

function listWithStats({ search, status } = {}) {
  const where = [];
  const params = {};
  if (status) { where.push('d.status = @status'); params.status = status; }
  if (search) {
    where.push('(d.ten_dai_ly LIKE @kw OR d.dealer_code LIKE @kw OR d.phone LIKE @kw)');
    params.kw = `%${search}%`;
  }
  const sql = `
    SELECT d.*,
           u.id AS user_id, u.username, u.last_login_at,
           (SELECT COUNT(*) FROM quotations q WHERE q.dealer_id = d.id) AS quotations_count
    FROM dealers d
    LEFT JOIN users u ON u.dealer_id = d.id AND u.role = 'dealer'
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY d.created_at DESC
  `;
  return db.prepare(sql).all(params);
}

function findById(id) {
  return db.prepare(`
    SELECT d.*, u.id AS user_id, u.username, u.last_login_at
    FROM dealers d
    LEFT JOIN users u ON u.dealer_id = d.id AND u.role = 'dealer'
    WHERE d.id = ?
  `).get(id);
}

function findByCode(code) {
  return db.prepare('SELECT id FROM dealers WHERE dealer_code = ?').get(code);
}

// Tạo đại lý + user dealer trong cùng 1 transaction. Trả về id của dealer.
function createWithUser({ dealer, username, passwordHash, fullName }) {
  const cols = DEALER_FIELDS.join(', ');
  const placeholders = DEALER_FIELDS.map(f => `@${f}`).join(', ');
  const params = Object.fromEntries(DEALER_FIELDS.map(f => [f, dealer[f] ?? null]));

  const tx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO dealers (${cols}) VALUES (${placeholders})`).run(params);
    const dealerId = info.lastInsertRowid;
    db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, dealer_id)
      VALUES (?, ?, ?, 'dealer', ?)
    `).run(username, passwordHash, fullName || null, dealerId);
    db.prepare('INSERT INTO dealer_profiles (dealer_id) VALUES (?)').run(dealerId);
    return dealerId;
  });
  return tx();
}

function update(id, dealer) {
  const sets = DEALER_FIELDS.map(f => `${f} = @${f}`).join(', ');
  const params = { id, ...Object.fromEntries(DEALER_FIELDS.map(f => [f, dealer[f] ?? null])) };
  db.prepare(`UPDATE dealers SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run(params);
}

function setStatus(id, status) {
  const tx = db.transaction(() => {
    db.prepare('UPDATE dealers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    const userStatus = status === 'active' ? 'active' : 'disabled';
    db.prepare("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE dealer_id = ? AND role = 'dealer'").run(userStatus, id);
  });
  tx();
}

function resetPassword(dealerId, newHash) {
  const info = db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = ? AND role = 'dealer'
  `).run(newHash, dealerId);
  return info.changes > 0;
}

module.exports = {
  listWithStats, findById, findByCode,
  createWithUser, update, setStatus, resetPassword,
};
