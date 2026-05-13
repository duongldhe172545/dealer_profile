const jwt = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/http');

// Parse token từ header Authorization: Bearer <token>
function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

// Middleware: yêu cầu đăng nhập. Gán req.user = { id, username, role, dealer_id }
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next(unauthorized());

  try {
    req.user = jwt.verify(token);
    next();
  } catch (err) {
    next(unauthorized('Phiên đăng nhập đã hết hạn'));
  }
}

// Middleware: yêu cầu role cụ thể. Dùng sau requireAuth.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!allowedRoles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

module.exports = { requireAuth, requireRole };
