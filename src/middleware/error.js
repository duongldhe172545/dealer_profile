const { HttpError } = require('../utils/http');

// Global error handler. Đặt cuối cùng trong chuỗi middleware của Express.
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại' });
}

// 404 cho route không khớp
function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Không tìm thấy đường dẫn' });
}

module.exports = { errorHandler, notFoundHandler };
