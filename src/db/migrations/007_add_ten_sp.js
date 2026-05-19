// Thêm field "Tên sản phẩm" (ten_sp) — tách khỏi mô tả chi tiết (mo_ta).
//   - products.ten_sp        : tên SP trong catalog (vd "Cửa đi mở quay 1 cánh")
//   - quotation_items.ten_sp : snapshot tên SP khi thêm vào báo giá
//
// Idempotent: skip nếu cột đã tồn tại.
// Data cũ: ten_sp=NULL, render fallback empty trong UI.
module.exports = {
  description: 'Add ten_sp column to products + quotation_items',
  up: (db) => {
    // products
    const pCols = db.prepare(`PRAGMA table_info(products)`).all();
    if (pCols.length && !pCols.some(c => c.name === 'ten_sp')) {
      db.exec(`ALTER TABLE products ADD COLUMN ten_sp TEXT`);
    }
    // quotation_items
    const qCols = db.prepare(`PRAGMA table_info(quotation_items)`).all();
    if (qCols.length && !qCols.some(c => c.name === 'ten_sp')) {
      db.exec(`ALTER TABLE quotation_items ADD COLUMN ten_sp TEXT`);
    }
  }
};
