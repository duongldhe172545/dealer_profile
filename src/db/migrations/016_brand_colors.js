// Thêm 2 cột brand colors vào dealer_profiles.
// Dealer chọn 2 màu chủ đạo từ logo → template báo giá + hồ sơ tự đổi tông.
//   brand_primary   — màu nhấn (header, bảng, accent)   VD: '#D4651A'
//   brand_secondary — màu phụ (text đậm, footer, viền)  VD: '#1A1A1A'
// NULL = chưa chọn → template dùng default (#D35400 cam đất + #1A1A1A đen).
module.exports = {
  description: 'dealer_profiles: brand_primary + brand_secondary colors',
  up: (db) => {
    const cols = new Set(
      db.prepare(`PRAGMA table_info(dealer_profiles)`).all().map(c => c.name)
    );
    if (!cols.has('brand_primary'))   db.exec(`ALTER TABLE dealer_profiles ADD COLUMN brand_primary TEXT`);
    if (!cols.has('brand_secondary')) db.exec(`ALTER TABLE dealer_profiles ADD COLUMN brand_secondary TEXT`);
  },
};
