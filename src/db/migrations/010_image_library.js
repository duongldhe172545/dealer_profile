// Kho ảnh chia sẻ — admin + dealer:
//   - dealer_id NULL → ảnh do admin upload, mọi đại lý đều thấy + dùng
//   - dealer_id có value → ảnh của 1 đại lý cụ thể, chỉ chính họ + admin thấy
//
// Cấu trúc đơn giản: chỉ lưu URL + tên + nhóm. Cloudinary lo storage.
// Khi đại lý chọn ảnh vào báo giá (5 slot đính kèm), URL + public_id được
// COPY sang quotation_images → ảnh trong BG ổn định kể cả khi xoá library.
module.exports = {
  description: 'Tạo image_library: kho ảnh shared admin (dealer_id NULL) + per-dealer',
  up: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS image_library (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        dealer_id   INTEGER REFERENCES dealers(id) ON DELETE CASCADE,
        name        TEXT NOT NULL,
        url         TEXT NOT NULL,
        public_id   TEXT,
        category    TEXT,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_image_library_dealer ON image_library(dealer_id);
      CREATE INDEX IF NOT EXISTS idx_image_library_category ON image_library(category);
    `);
  }
};
