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

  // Render text user nhập:
  //   - 1 dòng → text thường (esc HTML)
  //   - >1 dòng → <ul class="bullet-list"> với chấm tròn tự động + bỏ dấu "-" / "*" / "•" / "·" đầu dòng nếu user vô tình gõ
  // CSS chấm tròn xem global rule .bullet-list bên dưới (hoặc trong file render kèm).
  const multiLine = s => {
    const arr = lines(s);
    if (!arr.length) return '';
    if (arr.length === 1) return esc(arr[0]);
    return '<ul class="bullet-list">' + arr.map(x => {
      const clean = x.replace(/^[\-\*•·]\s*/, '');   // bỏ dấu đầu dòng nếu có
      return `<li>${esc(clean)}</li>`;
    }).join('') + '</ul>';
  };

  // True nếu giá trị "có thực" (không null/undefined/chuỗi rỗng).
  // Dùng khắp nơi để quyết định render placeholder vs giá trị thực.
  const has = v => v != null && String(v).trim() !== '';

  global.AppHelpers = { esc, escMulti, lines, multiLine, has };
})(window);
