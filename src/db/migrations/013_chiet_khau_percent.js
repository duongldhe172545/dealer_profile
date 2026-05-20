// Chiết khấu giờ là 1 field độc lập trên quotations (giống vat_percent),
// không còn dùng minus adjustments list nữa. Cách tính:
//   chiet_khau_amount = (tam_tinh + Σ plus_adjustments) × chiet_khau_percent / 100
//   pre_tax           = tam_tinh + Σ plus − chiet_khau_amount
//   vat_amount        = pre_tax × vat_percent / 100
//   tong_cong         = pre_tax + vat_amount
//
// BG cũ có minus adjustments → vẫn được tính (giữ backward compat).
module.exports = {
  description: 'quotations.chiet_khau_percent (REAL default 0)',
  up: (db) => {
    const cols = new Set(db.prepare(`PRAGMA table_info(quotations)`).all().map(c => c.name));
    if (!cols.has('chiet_khau_percent')) {
      db.exec(`ALTER TABLE quotations ADD COLUMN chiet_khau_percent REAL NOT NULL DEFAULT 0`);
    }
  },
};
