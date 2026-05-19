// Báo giá v2: thêm section grouping (A/B/C/D) + adjustments dynamic
// (Vận chuyển / Lắp đặt / Chiết khấu / bất kỳ label đại lý nhập).
//
// Schema mới:
//   - quotation_sections    : grouping label cho items (A,B,C...)
//   - quotation_adjustments : footer rows kind='plus'/'minus'
//   - quotation_items.section_id : trỏ về section
//
// Migration data cũ (KHÔNG MẤT):
//   - Mỗi báo giá cũ → 1 section default "Chưa phân nhóm" (position=0)
//   - Tất cả items cũ → section_id của section đó
//   - chi_phi_van_chuyen > 0 → adjustment kind=plus "Vận chuyển"
//   - chi_phi_lap_dat   > 0 → adjustment kind=plus "Lắp đặt"
//   - Giữ nguyên cột chi_phi_* (backward compat, code mới ngừng dùng)
//
// Idempotent: skip nếu schema đã đổi (check qua sqlite_master).
module.exports = {
  description: 'Báo giá v2: thêm sections + adjustments, migrate data cũ',
  up: (db) => {
    // ---- 1. Bảng quotation_sections ----
    db.exec(`
      CREATE TABLE IF NOT EXISTS quotation_sections (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id  INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        position      INTEGER NOT NULL,
        ten           TEXT,
        UNIQUE (quotation_id, position)
      );
      CREATE INDEX IF NOT EXISTS idx_qsections_quotation ON quotation_sections(quotation_id);
    `);

    // ---- 2. Bảng quotation_adjustments ----
    db.exec(`
      CREATE TABLE IF NOT EXISTS quotation_adjustments (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        quotation_id  INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
        position      INTEGER NOT NULL,
        kind          TEXT NOT NULL CHECK (kind IN ('plus','minus')),
        label         TEXT NOT NULL,
        amount        INTEGER NOT NULL DEFAULT 0,
        UNIQUE (quotation_id, position)
      );
      CREATE INDEX IF NOT EXISTS idx_qadj_quotation ON quotation_adjustments(quotation_id);
    `);

    // ---- 3. Thêm cột section_id vào quotation_items (nếu thiếu) ----
    const itemCols = db.prepare(`PRAGMA table_info(quotation_items)`).all();
    if (!itemCols.some(c => c.name === 'section_id')) {
      db.exec(`ALTER TABLE quotation_items ADD COLUMN section_id INTEGER REFERENCES quotation_sections(id) ON DELETE SET NULL`);
    }

    // ---- 4. Migrate data cũ ----
    const orphanQuotations = db.prepare(`
      SELECT q.id FROM quotations q
      WHERE NOT EXISTS (SELECT 1 FROM quotation_sections s WHERE s.quotation_id = q.id)
    `).all();

    const insertSection = db.prepare(
      `INSERT INTO quotation_sections (quotation_id, position, ten) VALUES (?, 0, 'Chưa phân nhóm')`
    );
    const updateItemsSection = db.prepare(
      `UPDATE quotation_items SET section_id = ? WHERE quotation_id = ? AND section_id IS NULL`
    );
    const insertAdjustment = db.prepare(
      `INSERT INTO quotation_adjustments (quotation_id, position, kind, label, amount) VALUES (?, ?, 'plus', ?, ?)`
    );
    const getQuotation = db.prepare(
      `SELECT chi_phi_van_chuyen, chi_phi_lap_dat FROM quotations WHERE id = ?`
    );

    for (const { id: qid } of orphanQuotations) {
      const secResult = insertSection.run(qid);
      const sectionId = secResult.lastInsertRowid;
      updateItemsSection.run(sectionId, qid);

      const q = getQuotation.get(qid);
      let pos = 0;
      if (q && q.chi_phi_van_chuyen > 0) {
        insertAdjustment.run(qid, pos++, 'Vận chuyển', q.chi_phi_van_chuyen);
      }
      if (q && q.chi_phi_lap_dat > 0) {
        insertAdjustment.run(qid, pos++, 'Lắp đặt', q.chi_phi_lap_dat);
      }
    }
  }
};
