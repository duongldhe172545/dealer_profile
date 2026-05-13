// Format số kiểu Việt Nam: phân cách ngàn bằng dấu chấm, thập phân bằng dấu phẩy.
function formatNumber(value, fractionDigits = 0) {
  if (value == null || Number.isNaN(Number(value))) return '';
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatMoney(value) {
  return `${formatNumber(value)} đ`;
}

// Format ngày dd/mm/yyyy
function formatDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Format datetime dd/mm/yyyy HH:mm
function formatDateTime(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${hh}:${mi}`;
}

module.exports = { formatNumber, formatMoney, formatDate, formatDateTime };
