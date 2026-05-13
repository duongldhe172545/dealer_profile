const db = require('../config/database');

function findByUsername(username) {
  return db.prepare(`
    SELECT id, username, password_hash, full_name, role, dealer_id, status
    FROM users WHERE username = ?
  `).get(username);
}

function updateLastLogin(userId) {
  db.prepare("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?").run(userId);
}

function findById(userId) {
  return db.prepare(`
    SELECT id, username, password_hash, full_name, role, dealer_id, status, last_login_at, created_at
    FROM users WHERE id = ?
  `).get(userId);
}

function updateFullName(userId, fullName) {
  db.prepare('UPDATE users SET full_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(fullName, userId);
}

function updatePassword(userId, newHash) {
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, userId);
}

module.exports = { findByUsername, updateLastLogin, findById, updateFullName, updatePassword };
