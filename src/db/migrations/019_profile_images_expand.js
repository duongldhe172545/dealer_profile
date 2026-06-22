// Mở rộng ảnh hồ sơ đại lý: tối đa 10 ảnh nội dung (1 đội ngũ + 5 công trình + 4 sản phẩm).
//
//   1. dealer_images: bỏ CHECK cứng trên cột `slot` → cho phép thêm slot
//      (cong_trinh_4/5, san_pham_1..4) và các template tương lai mà KHÔNG phải
//      rebuild bảng lần nữa. Validate slot chuyển hẳn về service (IMAGE_SLOTS).
//   2. Đổi ảnh "đội ngũ 2" (doi_ngu_2) hiện có → "công trình 4" (cong_trinh_4):
//      đội ngũ giảm 2→1, ảnh cũ không mất mà chuyển sang nhóm công trình.
//   3. dealer_profiles: thêm caption cho công trình 4/5 + sản phẩm 1..4;
//      dời caption đội ngũ 2 → caption công trình 4.
//
// Idempotent: bỏ qua phần nào đã làm rồi.
module.exports = {
  description: 'profile images: flexible dealer_images slots, migrate doi_ngu_2->cong_trinh_4, add cong_trinh/product captions',
  up: (db) => {
    // ── 1. Rebuild dealer_images bỏ CHECK (chỉ khi CHECK còn tồn tại) ──
    const tbl = db.prepare(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='dealer_images'`
    ).get();
    if (tbl && tbl.sql && /CHECK\s*\(\s*slot/i.test(tbl.sql)) {
      db.exec(`
        CREATE TABLE dealer_images_new (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          dealer_id       INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
          slot            TEXT NOT NULL,
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

    // ── 2. Thêm cột caption mới vào dealer_profiles (nếu chưa có) ──
    const cols = new Set(
      db.prepare(`PRAGMA table_info(dealer_profiles)`).all().map(c => c.name)
    );
    const addCol = (name) => {
      if (!cols.has(name)) db.exec(`ALTER TABLE dealer_profiles ADD COLUMN ${name} TEXT`);
    };
    addCol('project_caption4');
    addCol('project_caption5');
    addCol('product_caption1');
    addCol('product_caption2');
    addCol('product_caption3');
    addCol('product_caption4');

    // ── 3. Dời caption đội ngũ 2 → caption công trình 4 (chỉ khi đích còn trống) ──
    db.exec(`
      UPDATE dealer_profiles
      SET project_caption4 = team_caption_doi_ngu_2
      WHERE (project_caption4 IS NULL OR project_caption4 = '')
        AND team_caption_doi_ngu_2 IS NOT NULL AND team_caption_doi_ngu_2 <> ''
    `);

    // ── 4. Đổi ảnh đội ngũ 2 → công trình 4 (giữ ảnh; UNIQUE(dealer_id,slot) bảo vệ) ──
    db.exec(`UPDATE dealer_images SET slot = 'cong_trinh_4' WHERE slot = 'doi_ngu_2'`);
  },
};
