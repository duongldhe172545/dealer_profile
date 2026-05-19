// =============================================================
// Migration runner — versioned, idempotent, transaction-safe.
//
// Mỗi file trong src/db/migrations/ tên dạng NNN_description.{sql|js}
// được chạy đúng 1 lần và ghi vào bảng schema_migrations.
//
// Quy ước:
//   - .sql  : runner đọc file, exec trong 1 transaction
//   - .js   : runner require + gọi module.exports.up(db) trong 1 transaction
//   - NNN   : số thứ tự (3 chữ số, sort được dạng lexicographic)
//   - Migration FAIL → transaction rollback, runner dừng, exit code != 0
//
// QUY TẮC CHO DEV / AI khi đổi schema (PHẢI nhớ):
//   1. KHÔNG sửa migration cũ đã chạy production. Tạo file mới.
//   2. Cột mới: luôn NULL được hoặc DEFAULT. KHÔNG NOT NULL không default.
//   3. Đổi tên cột / xoá cột → cẩn thận, đọc docs/MIGRATION.md trước.
//   4. Mỗi thay đổi schema = 1 file mới ở folder migrations/.
// =============================================================
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const env = require('../config/env');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function ensureMigrationsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      filename   TEXT NOT NULL,
      ran_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getAppliedVersions() {
  return new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}_.+\.(sql|js)$/.test(f))
    .sort();
}

function versionOf(filename) {
  return filename.match(/^(\d{3})_/)[1];
}

function runOneMigration(filename) {
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  const version = versionOf(filename);

  // Chạy nội dung + record trong 1 transaction → fail giữa chừng auto rollback.
  const tx = db.transaction(() => {
    if (filename.endsWith('.sql')) {
      db.exec(fs.readFileSync(fullPath, 'utf8'));
    } else if (filename.endsWith('.js')) {
      // Xoá cache để dev mode hot-reload migration vừa sửa
      delete require.cache[require.resolve(fullPath)];
      const mod = require(fullPath);
      if (typeof mod.up !== 'function') {
        throw new Error(`Migration ${filename} thiếu export 'up(db)'`);
      }
      mod.up(db);
    }
    db.prepare(
      'INSERT INTO schema_migrations (version, filename) VALUES (?, ?)'
    ).run(version, filename);
  });
  tx();
}

function applyMigrations() {
  ensureMigrationsTable();
  const applied = getAppliedVersions();
  const files = listMigrationFiles();

  if (!files.length) {
    console.log('  ! Không tìm thấy migration nào ở src/db/migrations/');
    return;
  }

  let count = 0;
  for (const f of files) {
    const v = versionOf(f);
    if (applied.has(v)) continue;
    console.log(`  → Running ${f}...`);
    try {
      runOneMigration(f);
      console.log(`  ✓ Applied ${f}`);
      count++;
    } catch (err) {
      console.error(`  ✗ FAILED ${f}: ${err.message}`);
      throw err;     // halt — đừng chạy migration kế tiếp khi 1 cái fail
    }
  }
  if (count === 0) console.log('  ✓ All migrations up to date');
  else console.log(`  ✓ Applied ${count} new migration(s)`);
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
