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

// Export HTML view — DB browser style (đơn giản như SSMS / DB Browser).
// Sidebar liệt kê các bảng; main area dump data từng bảng, không format.
async function exportHtml(req, res, next) {
  let db = null;
  let snapshotPath = null;
  try {
    const dbPath = path.resolve(env.dbPath);
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'DB file không tồn tại' });
    }
    // Backup ra snapshot tạm rồi đọc từ đó (giống downloadDb) để có snapshot
    // nhất quán, không đọc trực tiếp file đang ghi (WAL) → tránh data lệch.
    const dir = path.join(path.dirname(dbPath), 'tmp');
    fs.mkdirSync(dir, { recursive: true });
    const snapTs = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    snapshotPath = path.join(dir, `dbview-${snapTs}.db`);
    const sourceDb = new Database(dbPath, { readonly: true });
    await sourceDb.backup(snapshotPath);
    sourceDb.close();

    db = new Database(snapshotPath, { readonly: true });
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all().map(r => r.name);

    const esc = s => s == null ? '' : String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const fmtCell = (v) => {
      if (v == null) return '<i class="null">NULL</i>';
      const s = String(v);
      if (s.length > 100) return esc(s.slice(0, 100)) + '<span class="more"> … +' + (s.length - 100) + ' ký tự</span>';
      return esc(s);
    };

    const sections = tables.map((tbl, idx) => {
      const rows = db.prepare(`SELECT * FROM "${tbl}" LIMIT 5000`).all();
      const cols = rows.length ? Object.keys(rows[0]) : [];
      const total = db.prepare(`SELECT COUNT(*) c FROM "${tbl}"`).get().c;

      const headHtml = cols.map(c => `<th>${esc(c)}</th>`).join('');
      const bodyHtml = rows.map((r, i) =>
        `<tr><td class="rownum">${i + 1}</td>` + cols.map(c => `<td>${fmtCell(r[c])}</td>`).join('') + '</tr>'
      ).join('');
      const truncNote = total > rows.length
        ? `<div class="trunc">⚠ Hiển thị ${rows.length}/${total} dòng (giới hạn 5000).</div>` : '';

      return `
        <section id="t-${idx}">
          <h2>${esc(tbl)} <span class="meta">${total} dòng · ${cols.length} cột</span></h2>
          ${truncNote}
          ${rows.length ? `
            <div class="tbl-wrap">
              <table>
                <thead><tr><th class="rownum">#</th>${headHtml}</tr></thead>
                <tbody>${bodyHtml}</tbody>
              </table>
            </div>` : '<div class="empty">(bảng rỗng)</div>'}
        </section>`;
    }).join('');

    const tocHtml = tables.map((t, i) => {
      const cnt = db.prepare(`SELECT COUNT(*) c FROM "${t}"`).get().c;
      return `<a href="#t-${i}">${esc(t)} <span class="cnt">${cnt}</span></a>`;
    }).join('');

    const ts = new Date().toLocaleString('vi-VN');
    const tsFile = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8">
<title>DB · ${esc(ts)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif; margin: 0; background: #fff; color: #1e293b; font-size: 13px; }
  header { background: #1e293b; color: #fff; padding: 10px 18px; position: sticky; top: 0; z-index: 20; font-size: 12px; }
  header b { color: #fff; }
  .layout { display: grid; grid-template-columns: 240px 1fr; min-height: calc(100vh - 38px); }
  nav.toc { background: #f1f5f9; border-right: 1px solid #cbd5e1; padding: 8px; position: sticky; top: 38px; align-self: start; max-height: calc(100vh - 38px); overflow-y: auto; }
  nav.toc .toc-title { font-size: 11px; font-weight: 700; color: #64748b; padding: 4px 8px; text-transform: uppercase; }
  nav.toc a { display: flex; justify-content: space-between; padding: 5px 8px; text-decoration: none; color: #0f172a; font-family: ui-monospace, monospace; font-size: 12px; border-radius: 3px; }
  nav.toc a:hover { background: #e2e8f0; }
  nav.toc .cnt { color: #94a3b8; font-size: 11px; }
  main { padding: 12px 18px; min-width: 0; }
  section { margin-bottom: 24px; }
  section h2 { margin: 0 0 8px; font-size: 14px; font-family: ui-monospace, monospace; color: #0f172a; padding-bottom: 4px; border-bottom: 2px solid #1e293b; }
  section h2 .meta { font-size: 11px; color: #64748b; font-family: -apple-system, sans-serif; margin-left: 8px; font-weight: normal; }
  .trunc { font-size: 11px; color: #b45309; padding: 4px 8px; background: #fef3c7; border-radius: 3px; margin-bottom: 6px; display: inline-block; }
  .empty { color: #94a3b8; font-style: italic; padding: 8px; }
  .tbl-wrap { overflow-x: auto; border: 1px solid #cbd5e1; }
  table { border-collapse: collapse; font-size: 12px; font-family: ui-monospace, 'Consolas', monospace; }
  thead th { background: #475569; color: #fff; padding: 5px 8px; text-align: left; font-weight: 600; white-space: nowrap; border-right: 1px solid #334155; position: sticky; top: 0; }
  tbody td { padding: 3px 8px; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #f1f5f9; vertical-align: top; white-space: nowrap; max-width: 360px; overflow: hidden; text-overflow: ellipsis; }
  tbody td:hover { white-space: normal; word-break: break-word; max-width: 600px; background: #fef9c3; }
  tbody tr:nth-child(even) td { background: #fafbfc; }
  tbody tr:nth-child(even) td:hover { background: #fef9c3; }
  .rownum { background: #f1f5f9 !important; color: #94a3b8; text-align: right; font-weight: 600; min-width: 36px; max-width: 36px; }
  .null { color: #cbd5e1; font-style: italic; }
  .more { color: #94a3b8; font-style: italic; font-size: 11px; }
</style>
</head><body>
  <header>Snapshot lúc <b>${esc(ts)}</b> · ${tables.length} bảng. Hover vào ô để xem full nội dung.</header>
  <div class="layout">
    <nav class="toc">
      <div class="toc-title">Tables</div>
      ${tocHtml}
    </nav>
    <main>${sections}</main>
  </div>
</body></html>`;
    db.close(); db = null;
    if (snapshotPath) { unlinkSnapshot(snapshotPath); snapshotPath = null; }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="db-view-${tsFile}.html"`);
    res.send(html);
  } catch (e) {
    if (db) try { db.close(); } catch {}
    if (snapshotPath) unlinkSnapshot(snapshotPath);
    next(e);
  }
}

// Xoá snapshot .db + sidecar WAL/SHM (mở readonly có thể sinh -shm).
function unlinkSnapshot(p) {
  for (const ext of ['', '-wal', '-shm']) fs.unlink(p + ext, () => {});
}

module.exports = { downloadDb, exportHtml };
