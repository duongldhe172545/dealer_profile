// Mở rộng CHECK constraint của dealer_images.slot để chấp nhận partner_logo_1..5.
// SQLite không hỗ trợ ALTER CHECK → phải rebuild table.
// Idempotent: skip nếu schema hiện tại đã include 'partner_logo_1'.
module.exports = {
  description: 'Expand dealer_images.slot CHECK to include partner_logo_1..5',
  up: (db) => {
    const row = db.prepare(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='dealer_images'`
    ).get();
    if (!row) return;                                 // bảng chưa tồn tại
    if (row.sql && row.sql.includes('partner_logo_1')) return;  // đã expand rồi

    db.exec(`
      CREATE TABLE dealer_images_new (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        dealer_id       INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
        slot            TEXT NOT NULL CHECK (slot IN (
                          'logo_dai_ly', 'avatar_chu', 'hero', 'kho_xuong',
                          'doi_ngu_1', 'doi_ngu_2', 'qr_code',
                          'cong_trinh_1', 'cong_trinh_2', 'cong_trinh_3',
                          'partner_logo_1', 'partner_logo_2', 'partner_logo_3',
                          'partner_logo_4', 'partner_logo_5'
                        )),
        url             TEXT NOT NULL,
        public_id       TEXT,
        uploaded_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (dealer_id, slot)
      );
      INSERT INTO dealer_images_new (id, dealer_id, slot, url, public_id, uploaded_at)
        SELECT id, dealer_id, slot, url, public_id, uploaded_at FROM dealer_images;
      DROP TABLE dealer_images;
      ALTER TABLE dealer_images_new RENAME TO dealer_images;
      CREATE INDEX IF NOT EXISTS idx_dealer_images_dealer ON dealer_images(dealer_id);
    `);
  }
};
