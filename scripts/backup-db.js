// =============================================================
// Backup SQLite DB — hot backup an toàn khi DB đang chạy.
//
// - Dùng better-sqlite3 backup API → đúng cách hơn copy file
//   (copy thẳng app.db có thể partial khi WAL chưa flush).
// - Lưu vào <dbDir>/backups/app-<ISO timestamp>.db
// - Tự xoá backup > RETENTION_DAYS ngày.
// - Trên fresh deploy chưa có DB: skip không lỗi.
//
// Gọi từ:
//   - npm run db:backup      (manual)
//   - npm start              (tự chạy trước khi migrate + start server)
//   - setInterval trong server.js (daily auto-backup)
// =============================================================
const fs = require('fs');
const path = require('path');
const env = require('../src/config/env');

const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const SRC = path.resolve(env.dbPath);
const BACKUP_DIR = path.join(path.dirname(SRC), 'backups');

async function runBackup() {
  // Fresh deploy chưa có DB → skip
  if (!fs.existsSync(SRC)) {
    console.log('  · Backup skipped: DB chưa tồn tại (fresh deploy)');
    return;
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dest = path.join(BACKUP_DIR, `app-${ts}.db`);

  const Database = require('better-sqlite3');
  const db = new Database(SRC, { readonly: true });

  try {
    await db.backup(dest);
    const sizeMB = (fs.statSync(dest).size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ Backed up to ${path.relative(process.cwd(), dest)} (${sizeMB} MB)`);
  } finally {
    db.close();
  }

  // Dọn backup cũ — giữ tối đa RETENTION_DAYS ngày
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(BACKUP_DIR).filter(f => /^app-.*\.db$/.test(f));
  let cleaned = 0;
  for (const f of files) {
    const p = path.join(BACKUP_DIR, f);
    if (fs.statSync(p).mtimeMs < cutoff) {
      fs.unlinkSync(p);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`  ✓ Cleaned ${cleaned} backup cũ (>${RETENTION_DAYS} ngày)`);
  }
}

if (require.main === module) {
  console.log('Backing up DB...');
  runBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('  ✗ Backup FAILED:', err.message);
      // Backup fail KHÔNG được chặn deploy — chỉ log warning rồi exit 0
      // (vì nếu chặn, schema migration không chạy được → tệ hơn)
      console.warn('  ! Bỏ qua backup fail, tiếp tục deploy. Kiểm tra disk volume.');
      process.exit(0);
    });
}

module.exports = runBackup;
