// HttpError: lỗi có status code đi kèm. Throw từ controller/service,
// middleware/error.js sẽ bắt và trả response.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, msg, details);
const unauthorized = (msg = 'Chưa đăng nhập') => new HttpError(401, msg);
const forbidden = (msg = 'Không có quyền') => new HttpError(403, msg);
const notFound = (msg = 'Không tìm thấy') => new HttpError(404, msg);
const conflict = (msg) => new HttpError(409, msg);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
