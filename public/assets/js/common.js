// Tiện ích dùng chung cho frontend
(function (global) {
  // Format số VN: 1.000.000 đ
  function formatMoney(value) {
    if (value == null || value === '') return '';
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    return Math.round(n).toLocaleString('vi-VN') + ' đ';
  }
  function formatNumber(value, digits = 0) {
    if (value == null || value === '') return '';
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    return n.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  // Format ngày dd/mm/yyyy
  function formatDate(value) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  function formatDateTime(value) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${formatDate(d)} ${hh}:${mi}`;
  }

  // Cách tính giá → label hiển thị + field cần nhập
  // Thứ tự: so_luong đầu (case phổ biến nhất, dùng làm default cho line item mới)
  // Lưu ý: m²/mét/kg KHÔNG có 'sl' — đại lý nhập tổng giá trị 1 lần, công thức không nhân SL
  const PRICING_MODES = {
    so_luong:   { label: 'Theo số lượng',                fields: ['sl'],                default_dvt: 'cái' },
    kich_thuoc: { label: 'Theo kích thước (rộng × cao)', fields: ['rong', 'cao', 'sl'], default_dvt: 'bộ' },
    dien_tich:  { label: 'Theo diện tích (m²)',          fields: ['dien_tich'],         default_dvt: 'm²' },
    dai:        { label: 'Theo mét dài',                 fields: ['dai'],               default_dvt: 'mét' },
    can:        { label: 'Theo cân (kg)',                fields: ['can_nang'],          default_dvt: 'kg' },
  };

  // ─── Input số tiền: format với dấu chấm ngàn, parse ngược ───
  // Dùng kèm input type="text" inputmode="numeric"
  function formatMoneyInput(n) {
    if (n == null || n === '') return '';
    const v = Number(n);
    if (!Number.isFinite(v) || v === 0) return '0';
    return v.toLocaleString('vi-VN');
  }
  function parseMoneyInput(s) {
    if (s == null || s === '') return 0;
    // Bỏ tất cả ký tự không phải số (vi-VN dùng dấu chấm làm thousand separator)
    const digits = String(s).replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }

  global.Fmt = { formatMoney, formatNumber, formatDate, formatDateTime, formatMoneyInput, parseMoneyInput };
  global.PRICING_MODES = PRICING_MODES;
})(window);
