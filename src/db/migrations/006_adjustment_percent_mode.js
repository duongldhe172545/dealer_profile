// Báo giá v2 — adjustments cho phép nhập % (tính theo tam_tinh).
// Thêm 2 cột:
//   - mode TEXT NOT NULL DEFAULT 'fixed'   ('fixed' = đồng, 'percent' = %)
//   - value_percent REAL                   (chỉ dùng khi mode='percent')
//
// Idempotent: skip nếu đã có cột.
module.exports = {
  description: 'Adjustment v2: mode fixed/percent + value_percent column',
  up: (db) => {
    const cols = db.prepare(`PRAGMA table_info(quotation_adjustments)`).all();
    if (!cols.length) return;
    const names = new Set(cols.map(c => c.name));

    if (!names.has('mode')) {
      db.exec(`ALTER TABLE quotation_adjustments ADD COLUMN mode TEXT NOT NULL DEFAULT 'fixed'`);
    }
    if (!names.has('value_percent')) {
      db.exec(`ALTER TABLE quotation_adjustments ADD COLUMN value_percent REAL`);
    }
  }
};
