// Thêm cột selected_template vào bảng quotations.
// Mặc định là 't1' (mẫu 1), hỗ trợ các mẫu khác như 't2', 't3'.
module.exports = {
  description: 'quotations: selected_template field for selecting quotation template',
  up: (db) => {
    const cols = new Set(
      db.prepare(`PRAGMA table_info(quotations)`).all().map(c => c.name)
    );
    if (!cols.has('selected_template')) {
      db.exec(`ALTER TABLE quotations ADD COLUMN selected_template TEXT NOT NULL DEFAULT 't1'`);
    }
  },
};
