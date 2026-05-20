// Đổi semantic của quotation_items.dien_tich:
//   Cũ:  diện tích 1 đơn vị (m² của 1 bộ)            → thanh_tien = dt × sl × don_gia
//   Mới: KHỐI LƯỢNG TỔNG (đã nhân số bộ)             → thanh_tien = dt × don_gia
//
// Migrate data: dien_tich = dien_tich * sl (cho row có cả 2 > 0). Giữ thanh_tien
// không đổi (đã đúng). Sau migration, recompute trong code mới sẽ ra cùng số.
//
// Lý do giữ tên cột `dien_tich`: tránh ALTER COLUMN rename (SQLite chỉ support
// từ 3.25+, và rename phải cập nhật mọi index/FK reference). Code mới hiểu
// dien_tich = khối lượng. Comment đã rõ.
module.exports = {
  description: 'quotation_items.dien_tich = khối lượng tổng (× sl)',
  up: (db) => {
    db.exec(`
      UPDATE quotation_items
      SET dien_tich = dien_tich * sl
      WHERE dien_tich IS NOT NULL AND dien_tich > 0 AND sl IS NOT NULL AND sl > 0
    `);
  },
};
