const db = require('../config/database');

// Whitelist 5 action theo yêu cầu user — tránh log bừa
const ALLOWED_ACTIONS = new Set([
  'dealer.create',
  'customer.create',
  'quotation.create',
  'quotation.send',
  'quotation.confirm',
]);

const stmt = db.prepare(`
  INSERT INTO audit_logs (user_id, username, role, dealer_id, action, entity_type, entity_id, meta_json, ip)
  VALUES (@user_id, @username, @role, @dealer_id, @action, @entity_type, @entity_id, @meta_json, @ip)
`);

/**
 * Ghi 1 dòng audit log. Tự nuốt lỗi (không fail request chính nếu log fail).
 * @param {object} ctx - { user: req.user, ip: req.ip }
 * @param {string} action - vd 'dealer.create'
 * @param {string} entityType - vd 'dealer', 'customer', 'quotation'
 * @param {number} entityId
 * @param {object} meta - JSON nhỏ chứa context (vd { dealer_code, customer_name })
 */
function log(ctx, action, entityType, entityId, meta) {
  if (!ALLOWED_ACTIONS.has(action)) return;
  try {
    const user = (ctx && ctx.user) || {};
    stmt.run({
      user_id:     user.id || null,
      username:    user.username || null,
      role:        user.role || null,
      dealer_id:   user.dealer_id || null,
      action,
      entity_type: entityType || null,
      entity_id:   entityId || null,
      meta_json:   meta ? JSON.stringify(meta) : null,
      ip:          (ctx && ctx.ip) || null,
    });
  } catch (err) {
    console.warn('[audit] failed to log:', action, err.message);
  }
}

module.exports = { log, ALLOWED_ACTIONS };
