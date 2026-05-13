const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const env = require('../config/env');

function applySchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
  console.log('  ✓ Schema applied');
}

// Migration idempotent áp dụng cho DB đã có dữ liệu cũ:
//   - Bỏ cột dealers.mst (nếu còn)
//   - Thêm cột dealer_profiles.partners_title (nếu thiếu)
//   - Mở rộng CHECK của dealer_images.slot để chấp nhận partner_logo_1..5
function applyMigrations() {
  // 1) Drop dealers.mst nếu còn tồn tại
  const dealerCols = db.prepare(`PRAGMA table_info(dealers)`).all();
  if (dealerCols.some(c => c.name === 'mst')) {
    try {
      db.exec(`ALTER TABLE dealers DROP COLUMN mst`);
      console.log('  ✓ Dropped dealers.mst');
    } catch (err) {
      console.warn('  ! Không thể drop dealers.mst (SQLite cũ?):', err.message);
    }
  }

  // 2) Thêm dealer_profiles.partners_title nếu thiếu
  const profileCols = db.prepare(`PRAGMA table_info(dealer_profiles)`).all();
  if (profileCols.length && !profileCols.some(c => c.name === 'partners_title')) {
    db.exec(`ALTER TABLE dealer_profiles ADD COLUMN partners_title TEXT`);
    console.log('  ✓ Added dealer_profiles.partners_title');
  }

  // 3) Mở rộng CHECK constraint của dealer_images.slot
  const imgSchema = db.prepare(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='dealer_images'`
  ).get();
  if (imgSchema && !imgSchema.sql.includes('partner_logo_1')) {
    // Dùng db.transaction() để auto-rollback nếu lỗi giữa chừng
    // (raw BEGIN/COMMIT trong exec không tự rollback khi statement giữa fail).
    const rebuildImageSlots = db.transaction(() => {
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
    });
    rebuildImageSlots();
    console.log('  ✓ Expanded dealer_images.slot CHECK to include partner_logo_1..5');
  }
}

function seedAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (existing) {
    console.log('  ✓ Admin already exists, skip seeding');
    return;
  }

  const passwordHash = bcrypt.hashSync(env.seedAdmin.password, env.bcrypt.rounds);
  db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, status)
    VALUES (?, ?, ?, 'admin', 'active')
  `).run(env.seedAdmin.username, passwordHash, 'Quản trị viên');

  console.log(`  ✓ Created admin: ${env.seedAdmin.username}`);
}

function run() {
  console.log('Migrating database...');
  applySchema();
  applyMigrations();
  seedAdmin();
  console.log('Done.');
}

if (require.main === module) {
  try {
    run();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

module.exports = run;
