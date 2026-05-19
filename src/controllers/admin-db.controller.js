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

// Mapping table/column → label tiếng Việt + ẩn cột kỹ thuật
const TABLE_LABELS = {
  users: 'Tài khoản',
  dealers: 'Đại lý',
  dealer_profiles: 'Hồ sơ marketing đại lý',
  dealer_images: 'Ảnh hồ sơ đại lý',
  products: 'Sản phẩm (catalog)',
  customers: 'Khách hàng',
  quotations: 'Báo giá',
  quotation_sections: 'Báo giá — nhóm sản phẩm',
  quotation_items: 'Báo giá — dòng sản phẩm',
  quotation_adjustments: 'Báo giá — khoản cộng/trừ',
  quotation_images: 'Báo giá — ảnh đính kèm',
  icon_library: 'Thư viện ảnh minh hoạ (icon)',
  audit_logs: 'Nhật ký hệ thống',
  schema_migrations: 'Lịch sử nâng cấp DB',
};

const COLUMN_LABELS = {
  id: 'ID', dealer_id: 'ID đại lý', customer_id: 'ID khách', product_id: 'ID SP',
  quotation_id: 'ID báo giá', section_id: 'ID nhóm', user_id: 'ID user',
  username: 'Tên đăng nhập', password_hash: 'Mật khẩu (mã hoá)', full_name: 'Họ tên',
  role: 'Vai trò', status: 'Trạng thái', last_login_at: 'Đăng nhập lần cuối',
  created_at: 'Ngày tạo', updated_at: 'Cập nhật', uploaded_at: 'Ngày tải lên',
  dealer_code: 'Mã đại lý', ten_dai_ly: 'Tên đại lý', chu_dai_ly: 'Chủ đại lý',
  phone: 'Số điện thoại', email: 'Email', address: 'Địa chỉ',
  district: 'Quận/Huyện', province: 'Tỉnh/TP', coverage: 'Khu vực phục vụ',
  years_experience: 'Số năm KN', team_size: 'Quy mô đội', projects_monthly: 'Dự án/tháng',
  open_hours: 'Giờ làm việc',
  tagline: 'Slogan', usp_text: 'Năng lực', services_text: 'Dịch vụ',
  commitments_text: 'Cam kết', customer_quote: 'Lời chứng khách', cta_text: 'Lời mời',
  selected_template: 'Mẫu hồ sơ',
  ma_sp: 'Mã SP', ten_sp: 'Tên SP', nhom_sp: 'Nhóm SP', mo_ta: 'Mô tả',
  dvt_mac_dinh: 'ĐVT mặc định', don_gia_mac_dinh: 'Đơn giá mặc định',
  cach_tinh_gia: 'Cách tính giá', active: 'Đang bán',
  icon_preset: 'Icon (preset)', icon_url: 'Icon (URL)', icon_public_id: 'Icon (Cloudinary ID)',
  ma_kh: 'Mã KH', ten_kh: 'Tên KH', nguoi_lien_he: 'Người liên hệ',
  dia_chi: 'Địa chỉ', ghi_chu: 'Ghi chú',
  so_bao_gia: 'Số BG', ngay_bao_gia: 'Ngày BG', dia_chi_cong_trinh: 'Địa chỉ công trình',
  ghi_chu_ho_so: 'Ghi chú hồ sơ', ghi_chu_thuong_mai: 'Ghi chú thương mại',
  tam_tinh: 'Tạm tính', chi_phi_van_chuyen: 'Phí VC (cũ)', chi_phi_lap_dat: 'Phí LĐ (cũ)',
  vat_percent: 'VAT (%)', vat_amount: 'Tiền VAT', tong_cong: 'Tổng cộng',
  thanh_toan: 'Thanh toán', tien_do: 'Tiến độ', bao_hanh: 'Bảo hành',
  sent_at: 'Ngày gửi', sent_method: 'Cách gửi', sent_note: 'Ghi chú gửi',
  position: 'Thứ tự', ten: 'Tên nhóm',
  kind: 'Loại', label: 'Tên khoản', amount: 'Số tiền',
  mode: 'Kiểu nhập', value_percent: 'Giá trị (%)',
  stt: 'STT', rong: 'Rộng (mm)', cao: 'Cao (mm)', dien_tich: 'Diện tích (m²)',
  dai: 'Mét dài', can_nang: 'Cân nặng (kg)', sl: 'SL', dvt: 'ĐVT',
  don_gia: 'Đơn giá', thanh_tien: 'Thành tiền',
  slot: 'Vị trí ảnh', url: 'URL ảnh', public_id: 'Cloudinary ID', caption: 'Chú thích',
  icon_key: 'Key icon', svg_content: 'Nội dung SVG', category: 'Nhóm', sort_order: 'Thứ tự',
  action: 'Hành động', entity_type: 'Loại', entity_id: 'ID đối tượng',
  meta_json: 'Chi tiết', ip: 'IP',
  version: 'Phiên bản', filename: 'File migration', ran_at: 'Ngày chạy',
};

// Cột "kỹ thuật" — ẩn mặc định (user có thể bật qua checkbox)
const TECH_COLS = new Set([
  'id', 'dealer_id', 'customer_id', 'product_id', 'quotation_id', 'section_id', 'user_id',
  'password_hash', 'public_id', 'icon_public_id', 'meta_json', 'ip', 'created_at', 'updated_at',
  'uploaded_at', 'last_login_at', 'cach_tinh_gia', 'stt',
]);

// Cột format kiểu tiền (integer VND)
const MONEY_COLS = new Set([
  'tam_tinh', 'chi_phi_van_chuyen', 'chi_phi_lap_dat', 'vat_amount', 'tong_cong',
  'don_gia', 'thanh_tien', 'amount', 'don_gia_mac_dinh',
]);

// Cột format kiểu ngày
const DATE_COLS = new Set([
  'created_at', 'updated_at', 'uploaded_at', 'last_login_at', 'sent_at',
  'ngay_bao_gia', 'ran_at',
]);

// Cột boolean (0/1 → Có/Không)
const BOOL_COLS = new Set(['active']);

// Cột nội dung dài cần truncate cứng (vd svg_content)
const TRUNCATE_HARD_COLS = new Set(['svg_content', 'password_hash', 'meta_json', 'url']);

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

    const fmtMoney = n => {
      const v = Number(n);
      if (!Number.isFinite(v)) return esc(n);
      return v.toLocaleString('vi-VN') + ' đ';
    };

    const fmtDate = v => {
      if (!v) return '';
      try {
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return esc(String(v));
        return d.toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      } catch { return esc(String(v)); }
    };

    const fmtCell = (col, v) => {
      if (v == null || v === '') return '<span class="null">—</span>';
      if (MONEY_COLS.has(col)) {
        const n = Number(v) || 0;
        return `<span class="money">${esc(fmtMoney(n))}</span>`;
      }
      if (DATE_COLS.has(col)) return `<span class="date">${esc(fmtDate(v))}</span>`;
      if (BOOL_COLS.has(col)) return v == 1 || v === true ? '<span class="bool-yes">Có</span>' : '<span class="bool-no">Không</span>';
      if (TRUNCATE_HARD_COLS.has(col)) {
        const s = String(v);
        if (s.length > 30) return `<span class="muted" title="${esc(s.slice(0, 200))}">${esc(s.slice(0, 30))}… (${s.length} ký tự)</span>`;
        return esc(s);
      }
      if (col === 'kind') {
        return v === 'plus' ? '<span class="badge-plus">+ Cộng</span>' : v === 'minus' ? '<span class="badge-minus">− Trừ</span>' : esc(String(v));
      }
      if (col === 'mode') {
        return v === 'percent' ? '<span class="badge-pct">%</span>' : '<span class="badge-fixed">đ</span>';
      }
      if (col === 'status') {
        const map = { active: 'Đang hoạt động', inactive: 'Tạm ngừng', draft: 'Bản nháp', sent: 'Đã gửi', confirmed: 'Đã xác nhận', cancelled: 'Đã huỷ', disabled: 'Đã khoá' };
        return `<span class="status-${esc(v)}">${esc(map[v] || v)}</span>`;
      }
      if (col === 'role') {
        return v === 'admin' ? '<span class="role-admin">Admin</span>' : v === 'dealer' ? '<span class="role-dealer">Đại lý</span>' : esc(String(v));
      }
      const s = String(v);
      if (s.length > 200) return `${esc(s.slice(0, 200))}<span class="muted">… (${s.length} ký tự)</span>`;
      return esc(s);
    };

    const labelOf = (col) => COLUMN_LABELS[col] || col;
    const tableLabelOf = (tbl) => TABLE_LABELS[tbl] || tbl;

    // KPI tổng hợp (summary cards trên đầu trang)
    const kpis = {};
    try {
      kpis.dealers = db.prepare(`SELECT COUNT(*) c FROM dealers`).get().c;
      kpis.customers = db.prepare(`SELECT COUNT(*) c FROM customers`).get().c;
      kpis.products = db.prepare(`SELECT COUNT(*) c FROM products`).get().c;
      kpis.quotations = db.prepare(`SELECT COUNT(*) c FROM quotations`).get().c;
      const tongRow = db.prepare(`SELECT COALESCE(SUM(tong_cong),0) s FROM quotations WHERE status != 'cancelled'`).get();
      kpis.tongValue = tongRow.s || 0;
      kpis.icons = db.prepare(`SELECT COUNT(*) c FROM icon_library`).get().c;
    } catch {}

    const sections = tables.map((tbl, idx) => {
      const rows = db.prepare(`SELECT * FROM "${tbl}" LIMIT 5000`).all();
      const allCols = rows.length ? Object.keys(rows[0]) : [];
      const totalRow = db.prepare(`SELECT COUNT(*) c FROM "${tbl}"`).get().c;

      const headHtml = allCols.map(c => {
        const techClass = TECH_COLS.has(c) ? ' tech-col' : '';
        return `<th class="col-${esc(c)}${techClass}" title="${esc(c)}">${esc(labelOf(c))}</th>`;
      }).join('');
      const bodyHtml = rows.map(r =>
        '<tr>' + allCols.map(c => {
          const techClass = TECH_COLS.has(c) ? ' tech-col' : '';
          return `<td class="col-${esc(c)}${techClass}">${fmtCell(c, r[c])}</td>`;
        }).join('') + '</tr>'
      ).join('');
      const truncatedNote = totalRow > rows.length
        ? `<div class="trunc">⚠ Hiển thị ${rows.length}/${totalRow} dòng (giới hạn 5000)</div>`
        : '';
      return `
        <section class="tbl-sec" data-tbl="${esc(tbl)}">
          <h2 id="t-${idx}">
            <span class="tbl-name">${esc(tableLabelOf(tbl))}</span>
            <code class="tbl-code">${esc(tbl)}</code>
            <span class="tbl-count">${totalRow.toLocaleString('vi-VN')} dòng</span>
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
      return `<a href="#t-${i}"><span class="toc-name">${esc(tableLabelOf(t))}</span><span class="toc-count">${cnt.toLocaleString('vi-VN')}</span></a>`;
    }).join('');

    const ts = new Date().toLocaleString('vi-VN');
    const tsFile = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8">
<title>Backup dữ liệu · ${esc(ts)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', 'Be Vietnam Pro', Tahoma, sans-serif; margin: 0; background: #f1f5f9; color: #0f172a; font-size: 13px; line-height: 1.5; }
  header { background: linear-gradient(135deg, #0a1f3d, #163c70); color: #fff; padding: 18px 28px; position: sticky; top: 0; z-index: 50; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  header h1 { margin: 0; font-size: 20px; font-weight: 800; }
  header .meta { font-size: 12px; opacity: 0.85; margin-top: 4px; }
  .ctrl-row { display: flex; gap: 12px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
  .ctrl-row input { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 7px 12px; border-radius: 6px; width: 320px; font-size: 13px; }
  .ctrl-row input::placeholder { color: rgba(255,255,255,0.6); }
  .ctrl-row label { font-size: 12px; opacity: 0.9; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }

  .kpi-bar { background: #fff; padding: 16px 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; border-bottom: 1px solid #e2e8f0; }
  .kpi { background: linear-gradient(135deg, #f8fafc, #fff); border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
  .kpi .lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpi .val { font-size: 22px; font-weight: 800; color: #0a1f3d; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .kpi .sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  .layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; padding: 16px 24px; }
  nav.toc { position: sticky; top: 200px; align-self: start; max-height: calc(100vh - 220px); overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
  nav.toc .toc-title { font-size: 11px; font-weight: 700; color: #64748b; padding: 4px 8px 8px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; margin-bottom: 6px; }
  nav.toc a { display: flex; justify-content: space-between; padding: 7px 10px; border-radius: 4px; color: #334155; text-decoration: none; font-size: 12.5px; gap: 8px; }
  nav.toc a:hover { background: #f1f5f9; color: #0a1f3d; }
  nav.toc .toc-name { font-weight: 500; flex: 1; }
  nav.toc .toc-count { color: #94a3b8; font-variant-numeric: tabular-nums; font-size: 11px; }

  section.tbl-sec { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; }
  section h2 { margin: 0 0 10px; font-size: 16px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .tbl-name { color: #0a1f3d; font-weight: 800; }
  .tbl-code { background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-family: ui-monospace, monospace; }
  .tbl-count { font-size: 12px; color: #64748b; font-weight: 500; margin-left: auto; }
  .trunc { font-size: 11px; color: #b45309; background: #fef3c7; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px; display: inline-block; }
  .empty { color: #94a3b8; font-style: italic; padding: 16px; text-align: center; background: #f8fafc; border-radius: 4px; }
  .tbl-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  thead th { background: #0a1f3d; color: #fff; padding: 8px 10px; text-align: left; font-weight: 700; position: sticky; top: 0; white-space: nowrap; font-size: 11.5px; }
  tbody td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; max-width: 320px; word-break: break-word; }
  tbody tr:nth-child(even) td { background: #fafbfc; }
  tbody tr:hover td { background: #fef9c3; }

  /* Format value cells */
  .null { color: #cbd5e1; font-style: italic; }
  .money { font-family: ui-monospace, monospace; color: #047857; font-weight: 700; white-space: nowrap; }
  .date { color: #475569; font-size: 11.5px; white-space: nowrap; }
  .bool-yes { background: #d1fae5; color: #065f46; padding: 1px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .bool-no { background: #fee2e2; color: #b91c1c; padding: 1px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .muted { color: #94a3b8; font-style: italic; }
  .badge-plus { background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .badge-minus { background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .badge-pct { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-family: ui-monospace, monospace; }
  .badge-fixed { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-family: ui-monospace, monospace; }
  .role-admin { background: #fef3c7; color: #92400e; padding: 1px 7px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .role-dealer { background: #dbeafe; color: #1e40af; padding: 1px 7px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  [class^="status-"] { padding: 1px 7px; border-radius: 3px; font-weight: 600; font-size: 11px; }
  .status-active, .status-sent, .status-confirmed { background: #d1fae5; color: #065f46; }
  .status-inactive, .status-cancelled, .status-disabled { background: #fee2e2; color: #b91c1c; }
  .status-draft { background: #fef3c7; color: #92400e; }

  /* Ẩn cột kỹ thuật khi checkbox tắt */
  body.hide-tech .tech-col { display: none; }

  @media (max-width: 768px) {
    .layout { grid-template-columns: 1fr; }
    nav.toc { position: static; max-height: none; }
  }
</style>
</head><body class="hide-tech">
  <header>
    <h1>📦 Backup hệ thống Đại Lý Số</h1>
    <div class="meta">Sinh lúc: <b>${esc(ts)}</b> · ${tables.length} bảng dữ liệu</div>
    <div class="ctrl-row">
      <input type="text" id="searchInput" placeholder="🔍 Tìm trong toàn bộ nội dung...">
      <label><input type="checkbox" id="showTech"> Hiện cột kỹ thuật (ID, timestamps, hash...)</label>
    </div>
  </header>

  <div class="kpi-bar">
    <div class="kpi">
      <div class="lbl">Đại lý</div>
      <div class="val">${(kpis.dealers || 0).toLocaleString('vi-VN')}</div>
      <div class="sub">tổng số đại lý đăng ký</div>
    </div>
    <div class="kpi">
      <div class="lbl">Khách hàng</div>
      <div class="val">${(kpis.customers || 0).toLocaleString('vi-VN')}</div>
      <div class="sub">do các đại lý quản lý</div>
    </div>
    <div class="kpi">
      <div class="lbl">Sản phẩm catalog</div>
      <div class="val">${(kpis.products || 0).toLocaleString('vi-VN')}</div>
      <div class="sub">tổng SP toàn hệ thống</div>
    </div>
    <div class="kpi">
      <div class="lbl">Báo giá</div>
      <div class="val">${(kpis.quotations || 0).toLocaleString('vi-VN')}</div>
      <div class="sub">đã tạo</div>
    </div>
    <div class="kpi">
      <div class="lbl">Tổng giá trị BG</div>
      <div class="val" style="color:#047857">${esc(fmtMoney(kpis.tongValue || 0))}</div>
      <div class="sub">không tính BG huỷ</div>
    </div>
    <div class="kpi">
      <div class="lbl">Ảnh minh hoạ</div>
      <div class="val">${(kpis.icons || 0).toLocaleString('vi-VN')}</div>
      <div class="sub">trong thư viện</div>
    </div>
  </div>

  <div class="layout">
    <nav class="toc">
      <div class="toc-title">Danh sách bảng</div>
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
  // Toggle cột kỹ thuật
  const showTech = document.getElementById('showTech');
  showTech.addEventListener('change', () => {
    document.body.classList.toggle('hide-tech', !showTech.checked);
  });
</script>
</body></html>`;
    db.close(); db = null;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="backup-readable-${tsFile}.html"`);
    res.send(html);
  } catch (e) {
    if (db) try { db.close(); } catch {}
    next(e);
  }
}

module.exports = { downloadDb, exportHtml };
