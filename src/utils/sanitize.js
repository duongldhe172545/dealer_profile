// Helpers chuẩn hoá input từ FE trước khi nhét vào DB.
// Mỗi service có thể bọc thêm 1 hàm `clean()` với default max riêng.
const { badRequest } = require('./http');

// Trim + null nếu rỗng + throw 400 nếu vượt max ký tự.
// max optional: undefined → không check độ dài.
function cleanString(value, max) {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (max != null && v.length > max) {
    throw badRequest(`Giá trị quá dài (tối đa ${max} ký tự)`);
  }
  return v;
}

module.exports = { cleanString };
