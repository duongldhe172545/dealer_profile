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

// Export HTML view của toàn DB — file 1 trang HTML duy nhất, double-click mở
// trong browser là xem được mọi bảng + filter, không cần cài tool gì.
function exportHtml(req, res, next) {
  let db = null;
  try {
    const dbPath = path.resolve(env.dbPath);
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'DB file không tồn tại' });
    }
    db = new Database(dbPath, { readonly: true });
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all().map(r => r.name);

    const esc = s => s == null ? '' : String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const fmt = v => {
      if (v == null) return '<span style="color:#cbd5e1">NULL</span>';
      if (typeof v === 'number') return String(v);
      const s = String(v);
      if (s.length > 200) return esc(s.slice(0, 200)) + '<span style="color:#94a3b8">… (' + s.length + ' ký tự)</span>';
      return esc(s);
    };

    const sections = tables.map((tbl, idx) => {
      const rows = db.prepare(`SELECT * FROM "${tbl}" LIMIT 5000`).all();
      const cols = rows.length ? Object.keys(rows[0]) : [];
      const totalRow = db.prepare(`SELECT COUNT(*) c FROM "${tbl}"`).get().c;
      const headHtml = cols.map(c => `<th>${esc(c)}</th>`).join('');
      const bodyHtml = rows.map(r =>
        '<tr>' + cols.map(c => `<td>${fmt(r[c])}</td>`).join('') + '</tr>'
      ).join('');
      const truncatedNote = totalRow > rows.length
        ? `<div class="trunc">Hiển thị ${rows.length}/${totalRow} dòng (giới hạn 5000 để giảm dung lượng file)</div>`
        : '';
      return `
        <section class="tbl-sec" data-tbl="${esc(tbl)}">
          <h2 id="t-${idx}">
            <span class="tbl-name">${esc(tbl)}</span>
            <span class="tbl-count">${totalRow} dòng · ${cols.length} cột</span>
          </h2>
          ${truncatedNote}
          ${rows.length ? `
            <div class="tbl-wrap">
              <table>
                <thead><tr>${headHtml}</tr></thead>
                <tbody>${bodyHtml}</tbody>
              </table>
            </div>
          ` : '<div class="empty">— Bảng rỗng —</div>'}
        </section>`;
    }).join('');

    const tocHtml = tables.map((t, i) => {
      const cnt = db.prepare(`SELECT COUNT(*) c FROM "${t}"`).get().c;
      return `<a href="#t-${i}"><span class="toc-name">${esc(t)}</span><span class="toc-count">${cnt}</span></a>`;
    }).join('');

    const ts = new Date().toLocaleString('vi-VN');
    const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8">
<title>Backup DB · ${esc(ts)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Tahoma, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; font-size: 13px; }
  header { background: #0f2744; color: #fff; padding: 16px 24px; position: sticky; top: 0; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  header h1 { margin: 0; font-size: 18px; }
  header .meta { font-size: 12px; opacity: 0.8; margin-top: 4px; }
  header input { background: #1e3a5f; border: 1px solid #2d4a73; color: #fff; padding: 6px 10px; border-radius: 6px; width: 280px; margin-top: 8px; font-size: 13px; }
  header input::placeholder { color: #94a3b8; }
  .layout { display: grid; grid-template-columns: 240px 1fr; gap: 16px; padding: 16px 24px; }
  nav.toc { position: sticky; top: 110px; height: calc(100vh - 130px); overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
  nav.toc a { display: flex; justify-content: space-between; padding: 6px 10px; border-radius: 4px; color: #334155; text-decoration: none; font-size: 12px; }
  nav.toc a:hover { background: #f1f5f9; }
  nav.toc .toc-name { font-weight: 600; }
  nav.toc .toc-count { color: #94a3b8; font-variant-numeric: tabular-nums; }
  section.tbl-sec { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
  section h2 { margin: 0 0 8px; font-size: 15px; display: flex; align-items: baseline; gap: 12px; }
  .tbl-name { color: #0f2744; }
  .tbl-count { font-size: 11px; color: #64748b; font-weight: normal; }
  .trunc { font-size: 11px; color: #b91c1c; font-style: italic; margin-bottom: 6px; }
  .empty { color: #94a3b8; font-style: italic; padding: 12px; text-align: center; }
  .tbl-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #f1f5f9; padding: 6px 8px; text-align: left; border-bottom: 1px solid #cbd5e1; font-weight: 700; position: sticky; top: 0; white-space: nowrap; }
  tbody td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafbfc; }
  tbody tr:hover td { background: #fef3c7; }
  tbody td { max-width: 400px; word-break: break-word; }
</style>
</head><body>
  <header>
    <h1>📦 Backup dữ liệu hệ thống Đại Lý Số</h1>
    <div class="meta">Sinh lúc: <b>${esc(ts)}</b> · ${tables.length} bảng</div>
    <input type="text" id="searchInput" placeholder="Tìm trong nội dung... (Ctrl+F của browser cũng OK)">
  </header>
  <div class="layout">
    <nav class="toc">
      <div style="font-size:11px;font-weight:700;color:#64748b;padding:6px 10px;text-transform:uppercase">Danh sách bảng</div>
      ${tocHtml}
    </nav>
    <main>${sections}</main>
  </div>
<script>
  // Live filter rows theo nội dung
  const input = document.getElementById('searchInput');
  input.addEventListener('input', () => {
    const kw = input.value.trim().toLowerCase();
    document.querySelectorAll('section.tbl-sec').forEach(sec => {
      let visibleRows = 0;
      sec.querySelectorAll('tbody tr').forEach(tr => {
        const match = !kw || tr.textContent.toLowerCase().includes(kw);
        tr.style.display = match ? '' : 'none';
        if (match) visibleRows++;
      });
      sec.style.display = (!kw || visibleRows > 0) ? '' : 'none';
    });
  });
</script>
</body></html>`;
    db.close(); db = null;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const tsFile = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Disposition', `attachment; filename="backup-readable-${tsFile}.html"`);
    res.send(html);
  } catch (e) {
    if (db) try { db.close(); } catch {}
    next(e);
  }
}

module.exports = { downloadDb, exportHtml };
