const db = require('../config/database');

function list({ action, user_id, dealer_id, from, to, limit = 200 } = {}) {
  const where = [];
  const params = { limit };
  if (action)    { where.push('action = @action'); params.action = action; }
  if (user_id)   { where.push('user_id = @user_id'); params.user_id = Number(user_id); }
  if (dealer_id) { where.push('dealer_id = @dealer_id'); params.dealer_id = Number(dealer_id); }
  if (from)      { where.push('created_at >= @from'); params.from = from; }
  if (to)        { where.push('created_at <= @to');   params.to = to + ' 23:59:59'; }

  return db.prepare(`
    SELECT l.*, d.ten_dai_ly, d.dealer_code
    FROM audit_logs l
    LEFT JOIN dealers d ON d.id = l.dealer_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT @limit
  `).all(params);
}

module.exports = { list };
