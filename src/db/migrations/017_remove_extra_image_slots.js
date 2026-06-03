// Xoá bỏ các slot ảnh dư thừa trong bảng dealer_images (hero, kho_xuong, avatar_chu, partner_logo_4, partner_logo_5)
// để khớp hoàn toàn với thiết kế mới và bộ lọc của Editor.
module.exports = {
  description: 'dealer_images: delete unused image slot records',
  up: (db) => {
    db.prepare(`
      DELETE FROM dealer_images
      WHERE slot IN ('hero', 'kho_xuong', 'avatar_chu', 'partner_logo_4', 'partner_logo_5')
    `).run();
  },
};
