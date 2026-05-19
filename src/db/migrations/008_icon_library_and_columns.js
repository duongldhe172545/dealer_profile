// Icon library cho sản phẩm — Đợt 1: chỉ preset (admin upload SVG vào library
// rồi đại lý chọn từ thư viện). Đợt 2 sẽ thêm upload ảnh riêng qua Cloudinary.
//
// Schema:
//   - Bảng icon_library: admin CRUD, đại lý read-only
//   - products: 3 cột reference (icon_preset → key trong library;
//     icon_url + icon_public_id → để dành cho Đợt 2 upload)
//   - quotation_items: 3 cột tương tự (snapshot pattern,
//     báo giá cũ giữ icon đúng khi product bị đổi/xoá)
//
// Idempotent: skip nếu đã có cột / bảng.
module.exports = {
  description: 'Icon library table + reference columns on products/quotation_items',
  up: (db) => {
    // 1) Bảng icon_library
    db.exec(`
      CREATE TABLE IF NOT EXISTS icon_library (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        icon_key     TEXT NOT NULL UNIQUE,
        label        TEXT NOT NULL,
        svg_content  TEXT NOT NULL,
        category     TEXT,
        sort_order   INTEGER NOT NULL DEFAULT 0,
        created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_icon_library_category ON icon_library(category);
      CREATE INDEX IF NOT EXISTS idx_icon_library_sort ON icon_library(sort_order);
    `);

    // 2) products: 3 cột icon (nếu thiếu)
    const pCols = db.prepare(`PRAGMA table_info(products)`).all();
    if (pCols.length) {
      const names = new Set(pCols.map(c => c.name));
      if (!names.has('icon_preset'))    db.exec(`ALTER TABLE products ADD COLUMN icon_preset TEXT`);
      if (!names.has('icon_url'))       db.exec(`ALTER TABLE products ADD COLUMN icon_url TEXT`);
      if (!names.has('icon_public_id')) db.exec(`ALTER TABLE products ADD COLUMN icon_public_id TEXT`);
    }

    // 3) quotation_items: 3 cột icon snapshot
    const qCols = db.prepare(`PRAGMA table_info(quotation_items)`).all();
    if (qCols.length) {
      const names = new Set(qCols.map(c => c.name));
      if (!names.has('icon_preset'))    db.exec(`ALTER TABLE quotation_items ADD COLUMN icon_preset TEXT`);
      if (!names.has('icon_url'))       db.exec(`ALTER TABLE quotation_items ADD COLUMN icon_url TEXT`);
      if (!names.has('icon_public_id')) db.exec(`ALTER TABLE quotation_items ADD COLUMN icon_public_id TEXT`);
    }

    // 4) Seed 5 icon mẫu (line-art SVG đơn giản, admin có thể edit/replace sau)
    const seedCount = db.prepare(`SELECT COUNT(*) c FROM icon_library`).get().c;
    if (seedCount === 0) {
      const seeds = [
        {
          key: 'cua-di-mo-quay',
          label: 'Cửa đi mở quay',
          category: 'cua',
          sort: 10,
          svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="0.5"/><circle cx="16" cy="12" r="0.8" fill="currentColor"/></svg>`
        },
        {
          key: 'cua-di-mo-truot',
          label: 'Cửa đi mở trượt',
          category: 'cua',
          sort: 20,
          svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="18"/><rect x="13" y="3" width="8" height="18"/><path d="M9 12h2M13 12h2"/></svg>`
        },
        {
          key: 'cua-cuon',
          label: 'Cửa cuốn',
          category: 'cua',
          sort: 30,
          svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18"/><path d="M3 7h18M3 11h18M3 15h18M3 19h18"/></svg>`
        },
        {
          key: 'vach-kinh',
          label: 'Vách kính',
          category: 'vach',
          sort: 40,
          svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16"/><path d="M12 4v16M4 12h16"/></svg>`
        },
        {
          key: 'cua-so',
          label: 'Cửa sổ',
          category: 'cua',
          sort: 50,
          svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14"/><path d="M12 5v14M4 12h16"/></svg>`
        }
      ];
      const insert = db.prepare(`
        INSERT INTO icon_library (icon_key, label, svg_content, category, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const s of seeds) insert.run(s.key, s.label, s.svg, s.category, s.sort);
    }
  }
};
