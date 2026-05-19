// =============================================================
// Helpers dùng chung cho mọi template + form ở frontend.
// Expose qua `window.AppHelpers`. Load TRƯỚC mọi script template.
// =============================================================
(function (global) {
  // Escape ký tự HTML đặc biệt. Dùng cho mọi giá trị user-input
  // trước khi nhét vào template string.
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  // Escape + giữ xuống dòng (Shift+Enter → <br>).
  // Dùng cho caption ảnh, tagline, mô tả nhiều dòng.
  const escMulti = s => esc(s).replace(/\r?\n/g, '<br>');

  // Tách 1 chuỗi nhiều dòng thành mảng dòng đã trim, bỏ dòng trống.
  // Dùng cho usp_text / services_text / commitments_text ở profile.
  const lines = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);

  // True nếu giá trị "có thực" (không null/undefined/chuỗi rỗng).
  // Dùng khắp nơi để quyết định render placeholder vs giá trị thực.
  const has = v => v != null && String(v).trim() !== '';

  global.AppHelpers = { esc, escMulti, lines, has };
})(window);
