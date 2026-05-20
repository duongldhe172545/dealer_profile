// Bỏ chức năng gán icon cho từng SP (theo user feedback).
// Drop 3 cột icon_* khỏi products + quotation_items.
// Drop bảng icon_library cũ (admin-only) — sẽ thay bằng image_library (mig 010).
//
// SQLite hỗ trợ DROP COLUMN từ 3.35+. Idempotent qua PRAGMA check.
module.exports = {
  description: 'Drop icon_* columns + icon_library table (đập chức năng cũ)',
  up: (db) => {
    const dropColsIfExist = (table, cols) => {
      const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name));
      for (const c of cols) {
        if (existing.has(c)) {
          db.exec(`ALTER TABLE ${table} DROP COLUMN ${c}`);
        }
      }
    };
    dropColsIfExist('products',        ['icon_preset', 'icon_url', 'icon_public_id']);
    dropColsIfExist('quotation_items', ['icon_preset', 'icon_url', 'icon_public_id']);

    // Drop bảng icon_library (Đợt 1 cũ — admin upload SVG icons cho catalog SP)
    db.exec(`DROP TABLE IF EXISTS icon_library`);
  }
};
