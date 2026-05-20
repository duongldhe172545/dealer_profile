// Đổi BS (vận chuyển, lắp đặt, phụ phí…) hiển thị + lưu kiểu item-style:
//   so_bo × don_gia = amount (mode='fixed')
// Mode='percent' vẫn dùng value_percent. Adjustment cũ (chỉ có amount) tương thích
// vì 3 cột mới đều NULL → render fallback hiện label + amount như trước.
module.exports = {
  description: 'Thêm so_bo / don_vi / don_gia vào quotation_adjustments',
  up: (db) => {
    const cols = new Set(db.prepare(`PRAGMA table_info(quotation_adjustments)`).all().map(c => c.name));
    if (!cols.has('so_bo'))   db.exec(`ALTER TABLE quotation_adjustments ADD COLUMN so_bo INTEGER`);
    if (!cols.has('don_vi'))  db.exec(`ALTER TABLE quotation_adjustments ADD COLUMN don_vi TEXT`);
    if (!cols.has('don_gia')) db.exec(`ALTER TABLE quotation_adjustments ADD COLUMN don_gia INTEGER`);
  },
};
