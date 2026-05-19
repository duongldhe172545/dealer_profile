// Bỏ cột dealers.mst (đã không dùng từ vòng tái cấu trúc đầu).
// Idempotent: chỉ drop nếu cột còn tồn tại.
module.exports = {
  description: 'Drop deprecated dealers.mst column',
  up: (db) => {
    const cols = db.prepare(`PRAGMA table_info(dealers)`).all();
    if (cols.some(c => c.name === 'mst')) {
      db.exec(`ALTER TABLE dealers DROP COLUMN mst`);
    }
  }
};
