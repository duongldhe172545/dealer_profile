// Admin DB download — tạo snapshot DB qua better-sqlite3 backup API
// rồi stream về client. Cho phép admin tải backup khi cần (đặc biệt
// trên Railway free tier không có Backup tab dashboard).
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const env = require('../config/env');

async function downloadDb(req, res, next) {
  let snapshotPath = null;
  let sourceDb = null;
  try {
    const dbPath = path.resolve(env.dbPath);
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'DB file không tồn tại trên server' });
    }

    // Tạo snapshot consistent (handle WAL mode) qua backup API.
    // Better hơn copy thẳng .db (có thể partial khi WAL chưa flush).
    const dir = path.join(path.dirname(dbPath), 'tmp');
    fs.mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    snapshotPath = path.join(dir, `download-${ts}.db`);

    sourceDb = new Database(dbPath, { readonly: true });
    await sourceDb.backup(snapshotPath);
    sourceDb.close(); sourceDb = null;

    const stat = fs.statSync(snapshotPath);
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="app-${ts}.db"`);
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(snapshotPath);
    stream.pipe(res);
    // Cleanup temp file sau khi stream xong (success or error)
    const cleanup = () => {
      if (snapshotPath) fs.unlink(snapshotPath, () => {});
      snapshotPath = null;
    };
    stream.on('end', cleanup);
    stream.on('error', cleanup);
    res.on('close', cleanup);
  } catch (e) {
    if (sourceDb) try { sourceDb.close(); } catch {}
    if (snapshotPath) fs.unlink(snapshotPath, () => {});
    next(e);
  }
}

module.exports = { downloadDb };
