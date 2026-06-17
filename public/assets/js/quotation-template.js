// Template render báo giá A4 — Whitelabel version.
// Nhận data { dealer, profile, images, customer, quotation, items, sections, adjustments, quotationImages }
// và trả về HTML string khớp layout mẫu UI/UX (template_bao_gia_mau.jfif).
//
// Whitelabel: profile.brand_primary + profile.brand_secondary → inject CSS variables
// → toàn bộ tông màu template tự đổi.
(function (global) {
  if (!global.AppHelpers) {
    throw new Error('quotation-template.js cần _helpers.js load trước (window.AppHelpers).');
  }
  const { esc, has, multiLine } = global.AppHelpers;
  const money = v => (Number(v) || 0).toLocaleString('vi-VN') + '&nbsp;đ';
  const num = (v, d = 0) => (Number(v) || 0).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const numQty = v => {
    const n = Number(v) || 0;
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(4).replace(/\.?0+$/, '');
  };
  const fmtDate = v => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };
  const numInt = v => has(v) ? Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) : '—';
  const numArea = v => {
    if (!has(v) || Number(v) === 0) return '—';
    const n = Number(v);
    return n.toFixed(2).replace(/\.?0+$/, '');
  };

  // ── SVG Icons (inline, stroke-based) ─────────────────────────────────
  const IC = {
    user: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>`,
    phone: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></svg>`,
    pin: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>`,
    camera: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>`,
    clipboard: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 12h6M9 16h4"/></svg>`,
    banknote: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M2 9h2M20 9h2M2 15h2M20 15h2"/></svg>`,
    clock: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    shield: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
    grid: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    fileText: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>`,
    list: `<svg class="q-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  function adjAmount(a, tamTinh, plusSum) {
    if (!a) return 0;
    if (a.mode === 'percent') {
      const pct = Number(a.value_percent ?? a.amount) || 0;
      const base = a.kind === 'minus'
        ? (Number(tamTinh) || 0) + (Number(plusSum) || 0)
        : (Number(tamTinh) || 0);
      return Math.round(base * pct / 100);
    }
    const sb = Number(a.so_bo) || 0;
    const dg = Number(a.don_gia) || 0;
    if (dg > 0) return Math.round((sb || 1) * dg);
    return Number(a.amount) || 0;
  }

  function sumPlus(adjustments, tamTinh) {
    if (!Array.isArray(adjustments)) return 0;
    return adjustments.filter(a => a.kind === 'plus')
      .reduce((s, a) => s + adjAmount(a, tamTinh, 0), 0);
  }

  // ── Section header bar ────────────────────────────────────────────────
  function sectionHdr(icon, title) {
    return `<div class="q-sec-hdr">
      <span class="q-sec-icon">${icon}</span>
      <span class="q-sec-title">${esc(title)}</span>
    </div>`;
  }

  // ── Render item row ───────────────────────────────────────────────────
  function renderItemRow(it, stt) {
    return `
      <tr>
        <td class="center">${stt}</td>
        <td class="ma">${esc(it.ma_sp || '—')}</td>
        <td class="ten-sp">${esc(it.ten_sp || '—')}</td>
        <td class="desc">${multiLine(it.mo_ta)}</td>
        <td class="center">${numInt(it.rong)}</td>
        <td class="center">${numInt(it.cao)}</td>
        <td class="center qty-cell">${numQty(it.sl)}</td>
        <td class="center area-cell">${numArea(it.dien_tich)}</td>
        <td class="center">${esc(it.dvt || '')}</td>
        <td class="num">${money(it.don_gia)}</td>
        <td class="num total">${money(it.thanh_tien)}</td>
      </tr>`;
  }

  const ITEMS_TABLE_HEAD = `
    <thead>
      <tr>
        <th style="width:28px" class="center">STT</th>
        <th style="width:60px">Mã SP</th>
        <th style="width:92px">Tên SP</th>
        <th>Mô tả sản phẩm / cấu hình</th>
        <th style="width:46px" class="center">Rộng</th>
        <th style="width:46px" class="center">Cao</th>
        <th style="width:30px" class="center">SL</th>
        <th style="width:52px" class="center">Khối lượng</th>
        <th style="width:34px" class="center">ĐVT</th>
        <th style="width:70px" class="num">Đơn giá</th>
        <th style="width:78px" class="num">Thành tiền</th>
      </tr>
    </thead>`;

  function renderBsRow(a, bsIdx, tamTinh, plusSum) {
    const eff = adjAmount(a, tamTinh, plusSum);
    const sb = Number(a.so_bo) || 0;
    const dg = Number(a.don_gia) || 0;
    return `
      <tr class="q-bs-row">
        <td class="center" colspan="2" style="font-weight:700;color:var(--primary);white-space:nowrap">BS${bsIdx}</td>
        <td class="ten-sp" colspan="2">${esc(a.label || '—')}</td>
        <td></td>
        <td></td>
        <td class="center">${sb > 0 ? numQty(sb) : ''}</td>
        <td></td>
        <td class="center">${esc(a.don_vi || '')}</td>
        <td class="num">${dg > 0 ? money(dg) : ''}</td>
        <td class="num total">${money(eff)}</td>
      </tr>`;
  }

  function renderItemsTable(sections, fallbackItems, adjustments, quotation) {
    const tt = Number(quotation && quotation.tam_tinh) || 0;
    const plusList = Array.isArray(adjustments) ? adjustments.filter(a => a.kind === 'plus') : [];
    const plusSum = plusList.reduce((s, a) => s + adjAmount(a, tt, 0), 0);
    const bsRowsHtml = plusList.map((a, i) => renderBsRow(a, i + 1, tt, plusSum)).join('');

    const tongNhomRow = `
      <tr class="q-grand-sub">
        <td colspan="10" style="font-weight:800;text-align:right;padding-right:8px">Tổng các nhóm</td>
        <td class="num" style="font-weight:800">${money(tt)}</td>
      </tr>`;
    const tongBsRow = plusList.length > 0 ? `
      <tr class="q-grand-sub">
        <td colspan="10" style="font-weight:800;color:#92400e;text-align:right;padding-right:8px">Tổng các BS</td>
        <td class="num" style="font-weight:800;color:#92400e">${money(plusSum)}</td>
      </tr>` : '';

    // V2: render theo sections
    if (Array.isArray(sections) && sections.length) {
      const hasNamed = sections.some(s => (s.ten || '').trim());

      if (!hasNamed) {
        const items = sections.flatMap(s => s.items || []);
        if (!items.length && !bsRowsHtml) {
          return `<table class="q-items">${ITEMS_TABLE_HEAD}
            <tbody><tr><td colspan="11" style="text-align:center;padding:20px;color:#94a3b8;font-style:italic">Chưa có sản phẩm</td></tr></tbody>
          </table>`;
        }
        return `<table class="q-items">${ITEMS_TABLE_HEAD}
          <tbody>
            ${items.map((it, i) => renderItemRow(it, i + 1)).join('')}
            ${items.length ? tongNhomRow : ''}
            ${bsRowsHtml}
            ${tongBsRow}
          </tbody>
        </table>`;
      }

      let runningStt = 0;
      const bodyRows = sections.map(sec => {
        const isNamed = !!(sec.ten || '').trim();
        const itemRows = (sec.items || []).map(it => {
          runningStt += 1;
          return renderItemRow(it, runningStt);
        }).join('');
        if (!isNamed) return itemRows;

        const letter = esc(sec.letter || '');
        const ten = esc(sec.ten);
        const sectionHeader = `
          <tr class="q-sec-hdr-row">
            <td class="center" style="font-weight:800;color:var(--primary)">${letter}</td>
            <td colspan="10" style="font-weight:700">${ten}</td>
          </tr>`;
        const subtotalSoBo = (sec.items || []).reduce((s, it) => s + (Number(it.sl) || 0), 0);
        const subtotalRow = `
          <tr class="q-sec-sub">
            <td colspan="6" style="font-weight:700;color:#9f1239;text-align:left;padding-left:8px">
              Tổng nhóm ${letter}${ten ? ' — ' + ten : ''}
            </td>
            <td class="center" style="font-weight:700;color:#9f1239">${subtotalSoBo > 0 ? numQty(subtotalSoBo) : ''}</td>
            <td colspan="3"></td>
            <td class="num total" style="font-weight:800;color:#9f1239">${money(sec.subtotal || 0)}</td>
          </tr>`;
        return sectionHeader + itemRows + subtotalRow;
      }).join('');
      return `<table class="q-items">${ITEMS_TABLE_HEAD}<tbody>${bodyRows}${tongNhomRow}${bsRowsHtml}${tongBsRow}</tbody></table>`;
    }

    // Fallback: flat items (legacy)
    const items = fallbackItems || [];
    if (!items.length && !bsRowsHtml) {
      return `<table class="q-items">${ITEMS_TABLE_HEAD}
        <tbody><tr><td colspan="11" style="text-align:center;padding:20px;color:#94a3b8;font-style:italic">Chưa có sản phẩm</td></tr></tbody>
      </table>`;
    }
    return `<table class="q-items">${ITEMS_TABLE_HEAD}
      <tbody>
        ${items.map((it, i) => renderItemRow(it, i + 1)).join('')}
        ${items.length ? tongNhomRow : ''}
        ${bsRowsHtml}
        ${tongBsRow}
      </tbody>
    </table>`;
  }

  // ── Render gallery ảnh ────────────────────────────────────────────────
  function renderQuotationImages(qImages) {
    if (!qImages || !qImages.length) return '';
    const count = qImages.length;
    return `
      ${sectionHdr(IC.camera, 'HÌNH ẢNH NĂNG LỰC & HỆ SẢN PHẨM')}
      <div class="q-images count-${count}">
        ${qImages.map(img => `
          <div class="q-img-card">
            <div class="q-img-frame"><img src="${esc(img.url)}" alt="Ảnh ${img.slot}"></div>
            <div class="cap">${esc(has(img.caption) ? img.caption : img.slot + '. Ảnh sản phẩm')}</div>
          </div>
        `).join('')}
      </div>`;
  }

  // ── Helper: render items table for Template 2 (9 columns) ──────────
  function renderItemsTableT2(sections, fallbackItems, adjustments, quotation) {
    const tt = Number(quotation && quotation.tam_tinh) || 0;
    const plusList = Array.isArray(adjustments) ? adjustments.filter(a => a.kind === 'plus') : [];
    const plusSum = plusList.reduce((s, a) => s + adjAmount(a, tt, 0), 0);

    const T2_HEAD = `<thead class="t2-thead"><tr>
      <th class="t2-th-center" style="width:28px">STT</th>
      <th style="width:92px">Nhóm SP</th>
      <th>Mô tả sản phẩm / cấu hình</th>
      <th class="t2-th-center" style="width:80px">Kích thước<br><span class="t2-th-sub">(Rộng x Cao)</span></th>
      <th class="t2-th-center" style="width:52px">Khối lượng</th>
      <th class="t2-th-center" style="width:34px">ĐVT</th>
      <th class="t2-th-right" style="width:70px">Đơn giá<br><span class="t2-th-sub">(VNĐ)</span></th>
      <th class="t2-th-center" style="width:30px">SL</th>
      <th class="t2-th-right" style="width:78px">Thành tiền<br><span class="t2-th-sub">(VNĐ)</span></th>
    </tr></thead>`;

    const itemRow = (it, stt) => {
      const sz = (has(it.rong) || has(it.cao)) ? `${numInt(it.rong)} × ${numInt(it.cao)}` : '—';
      return `<tr class="t2-item-row">
        <td class="t2-td-center">${stt}</td>
        <td><div class="t2-sp-name">${esc(it.ten_sp || '—')}</div><div class="t2-sp-code">${esc(it.ma_sp || '')}</div></td>
        <td class="t2-td-desc">${multiLine(it.mo_ta)}</td>
        <td class="t2-td-center t2-td-muted">${sz}</td>
        <td class="t2-td-center t2-td-muted">${numArea(it.dien_tich)}</td>
        <td class="t2-td-center t2-td-muted">${esc(it.dvt || '')}</td>
        <td class="t2-td-right">${money(it.don_gia)}</td>
        <td class="t2-td-center t2-td-bold">${numQty(it.sl)}</td>
        <td class="t2-td-right t2-td-bold">${money(it.thanh_tien)}</td>
      </tr>`;
    };

    const bsRow = (a, idx) => {
      const eff = adjAmount(a, tt, plusSum);
      return `<tr class="t2-item-row">
        <td class="t2-td-center">${idx}</td>
        <td class="t2-td-bold" colspan="4">${esc(a.label || '—')}</td>
        <td class="t2-td-center t2-td-muted">${esc(a.don_vi || 'bộ')}</td>
        <td class="t2-td-right">${money(Number(a.don_gia) || eff)}</td>
        <td class="t2-td-center t2-td-bold">${numQty(Number(a.so_bo) || 1)}</td>
        <td class="t2-td-right t2-td-bold">${money(eff)}</td>
      </tr>`;
    };

    const bsHtml = plusList.map((a, i) => bsRow(a, i + 1)).join('');
    const bsHeader = plusList.length > 0 ? `<tr class="t2-group-row">
      <td colspan="6">BỔ SUNG</td>
      <td class="t2-td-right t2-td-muted">TỔNG CỘNG BS</td>
      <td class="t2-td-center">${plusList.reduce((s, a) => s + (Number(a.so_bo) || 1), 0)}</td>
      <td class="t2-td-right t2-td-accent">${money(plusSum)}</td>
    </tr>` : '';

    if (Array.isArray(sections) && sections.length) {
      const hasNamed = sections.some(s => (s.ten || '').trim());
      if (!hasNamed) {
        const flat = sections.flatMap(s => s.items || []);
        if (!flat.length && !bsHtml) return `<table class="t2-table">${T2_HEAD}<tbody><tr><td colspan="9" class="t2-empty">Chưa có sản phẩm</td></tr></tbody></table>`;
        return `<table class="t2-table">${T2_HEAD}<tbody>${flat.map((it, i) => itemRow(it, i + 1)).join('')}${bsHeader}${bsHtml}</tbody></table>`;
      }
      let stt = 0;
      const rows = sections.map(sec => {
        const named = !!(sec.ten || '').trim();
        const items = (sec.items || []).map(it => { stt++; return itemRow(it, stt); }).join('');
        if (!named) return items;
        const letter = esc(sec.letter || '');
        const ten = esc(sec.ten);
        const subtotalQty = (sec.items || []).reduce((s, it) => s + (Number(it.sl) || 0), 0);
        const groupHdr = `<tr class="t2-group-row">
          <td colspan="6">${letter ? letter + '. ' : ''}${ten.toUpperCase()}</td>
          <td class="t2-td-right t2-td-muted">TỔNG CỘNG ${letter}</td>
          <td class="t2-td-center">${subtotalQty}</td>
          <td class="t2-td-right t2-td-accent">${money(sec.subtotal || 0)}</td>
        </tr>`;
        return groupHdr + items;
      }).join('');
      return `<table class="t2-table">${T2_HEAD}<tbody>${rows}${bsHeader}${bsHtml}</tbody></table>`;
    }

    const flat = fallbackItems || [];
    if (!flat.length && !bsHtml) return `<table class="t2-table">${T2_HEAD}<tbody><tr><td colspan="9" class="t2-empty">Chưa có sản phẩm</td></tr></tbody></table>`;
    return `<table class="t2-table">${T2_HEAD}<tbody>${flat.map((it, i) => itemRow(it, i + 1)).join('')}${bsHeader}${bsHtml}</tbody></table>`;
  }

  // ── SVG icons cho Template 2 (filled, viewBox 20) ─────────────────────
  const T2IC = {
    home: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>`,
    photo: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/></svg>`,
    doc: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>`,
    phone: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>`,
    pin: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>`,
    card: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/></svg>`,
    clock: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>`,
    shield: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
    mail: `<svg class="t2-ic" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>`,
  };

  // ── Mẫu 2 (TNT 579 Style) ────────────────────────────────────────────
  function renderTpl2({
    brandPrimary, brandSecondary,
    dealerName, dealerAddrFull, dealerPhone, dealerEmail, quoteTitle, tagline,
    customer, quotation, sections, adjustments, items, quotationImages, dealer, images
  }) {
    // Images gallery
    const imgHtml = (quotationImages && quotationImages.length)
      ? `<section class="t2-section">
          <div class="t2-sec-hdr"><div class="t2-sec-badge">${T2IC.photo}</div><h2 class="t2-sec-title">HÌNH ẢNH SẢN PHẨM</h2></div>
          <div class="t2-img-grid">
            ${quotationImages.map(img => `<div class="t2-img-card">
              <img src="${esc(img.url)}" alt="${esc(img.caption || '')}">
              <div class="t2-img-cap">${esc(img.caption || 'Ảnh ' + img.slot)}</div>
            </div>`).join('')}
          </div>
        </section>` : '';

    // Totals
    const tt = Number(quotation.tam_tinh) || 0;
    const ps = sumPlus(adjustments, tt);
    const ckPct = Number(quotation.chiet_khau_percent) || 0;
    const ckAmt = Math.round((tt + ps) * ckPct / 100);
    const vatPct = Number(quotation.vat_percent) || 0;
    const vatAmt = Number(quotation.vat_amount) || 0;
    const total = Number(quotation.tong_cong) || 0;

    return `
    <section class="q-page t2-page" style="--primary:${brandPrimary};--secondary:${brandSecondary}">
      <!-- ═══ HEADER ═══ -->
      <header class="t2-hdr">
        <div class="t2-hdr-left">
          <div class="t2-logo-box">
            ${has(images.logo_dai_ly)
              ? `<img src="${esc(images.logo_dai_ly)}" alt="Logo">`
              : `<div class="t2-logo-placeholder">${esc(dealerName.substring(0, 3).toUpperCase())}</div>`}
          </div>
          <div class="t2-dealer-info">
            <h1 class="t2-dealer-name">${esc(dealerName)}</h1>
            ${has(tagline) ? `<h2 class="t2-tagline">${esc(tagline)}</h2>` : ''}
            <div class="t2-contact-lines">
              ${has(dealerPhone) ? `<div class="t2-contact-line"><span class="t2-contact-badge">${T2IC.phone}</span><span class="t2-phone-text">${esc(dealerPhone)}</span></div>` : ''}
              ${has(dealerAddrFull) ? `<div class="t2-contact-line"><span class="t2-contact-badge">${T2IC.pin}</span><span>${esc(dealerAddrFull)}</span></div>` : ''}
              ${has(dealerEmail) ? `<div class="t2-contact-line"><span class="t2-contact-badge">${T2IC.mail}</span><span>${esc(dealerEmail)}</span></div>` : ''}
            </div>
          </div>
        </div>
        <div class="t2-quote-box">
          <h3 class="t2-quote-title">${esc(quoteTitle)}</h3>
          <div class="t2-quote-meta">
            <div><span class="t2-meta-k">Mã báo giá</span><span class="t2-meta-v">${esc(quotation.so_bao_gia || '—')}</span></div>
            <div><span class="t2-meta-k">Ngày lập</span><span class="t2-meta-v">${fmtDate(quotation.ngay_bao_gia) || '—'}</span></div>
          </div>
        </div>
      </header>

      <!-- ═══ BODY ═══ -->
      <div class="t2-body">
        <!-- Khách hàng & Công trình -->
        <section class="t2-section">
          <div class="t2-sec-hdr"><div class="t2-sec-badge">${T2IC.home}</div><h2 class="t2-sec-title">KHÁCH HÀNG &amp; CÔNG TRÌNH</h2></div>
          <div class="t2-info-2col">
            <div class="t2-info-card">
              <div class="t2-info-item"><span class="t2-info-k">Khách hàng</span><span class="t2-info-v">${esc(customer && customer.ten_kh || '—')}</span></div>
              <div class="t2-info-item"><span class="t2-info-k">Mã KH</span><span class="t2-info-v">${esc(customer && customer.ma_kh || '—')}</span></div>
              <div class="t2-info-item"><span class="t2-info-k">Người phụ trách</span><span class="t2-info-v">${esc(customer && customer.nguoi_lien_he || '—')}</span></div>
              <div class="t2-info-item"><span class="t2-info-k">Điện thoại</span><span class="t2-info-v">${esc(customer && customer.phone || '—')}</span></div>
            </div>
            <div class="t2-info-card">
              <div class="t2-info-item"><span class="t2-info-k">Email</span><span class="t2-info-v">${esc(customer && customer.email || '—')}</span></div>
              <div class="t2-info-item"><span class="t2-info-k">Địa chỉ KH</span><span class="t2-info-v">${esc(customer && customer.dia_chi || '—')}</span></div>
              <div class="t2-info-item"><span class="t2-info-k">Tên &amp; địa chỉ công trình</span><span class="t2-info-v">${esc(quotation.dia_chi_cong_trinh || '—')}</span></div>
              <div class="t2-info-item"><span class="t2-info-k">Ghi chú hồ sơ</span><span class="t2-info-v">${esc(quotation.ghi_chu_ho_so || '—')}</span></div>
            </div>
          </div>
        </section>

        <!-- Hình ảnh sản phẩm -->
        ${imgHtml}

        <!-- Chi tiết báo giá -->
        <section class="t2-section">
          <div class="t2-sec-hdr"><div class="t2-sec-badge">${T2IC.doc}</div><h2 class="t2-sec-title">CHI TIẾT BÁO GIÁ</h2></div>
          ${renderItemsTable(sections, items, adjustments, quotation)}
        </section>

        <!-- Ghi chú + Tổng hợp -->
        <section class="t2-summary-row">
          <div class="t2-notes-box">
            <h3 class="t2-notes-title">GHI CHÚ VỀ BẢNG GIÁ:</h3>
            <div class="t2-notes-body">
              ${has(quotation.ghi_chu_thuong_mai) ? multiLine(quotation.ghi_chu_thuong_mai)
                : `<ul><li>Báo giá áp dụng cho khối lượng và quy cách nêu trên.</li>
                   <li>Đơn giá có thể điều chỉnh theo khảo sát thực tế tại công trình.</li>
                   <li>Báo giá có hiệu lực trong vòng 15 ngày kể từ ngày báo giá.</li>
                   <li>Thời gian giao hàng được tính từ ngày chốt đơn.</li></ul>`}
            </div>
            <p class="t2-notes-asterisk">* Đơn giá chưa bao gồm VAT và có thể thay đổi theo thời điểm.</p>
          </div>
          <div class="t2-totals-box">
            <div class="t2-totals-body">
              <div class="t2-totals-row"><span>Tạm tính</span><span class="t2-totals-val">${money(tt)}</span></div>
              ${ps > 0 ? `<div class="t2-totals-row"><span>Tổng bổ sung</span><span class="t2-totals-val">${money(ps)}</span></div>` : ''}
              ${ckAmt > 0 ? `<div class="t2-totals-row"><span>Chiết khấu (${num(ckPct, ckPct % 1 ? 1 : 0)}%)</span><span class="t2-totals-val">${money(ckAmt)}</span></div>` : ''}
              <div class="t2-totals-row"><span>VAT (${num(vatPct)}%)</span><span class="t2-totals-val">${vatAmt > 0 ? money(vatAmt) : 'Chưa bao gồm'}</span></div>
            </div>
            <div class="t2-totals-grand">
              <span>Tổng cộng:</span>
              <span>${money(total)}</span>
            </div>
          </div>
        </section>

        <!-- Điều khoản -->
        <section class="t2-terms-row">
          <div class="t2-term-card">
            <div class="t2-term-hdr"><div class="t2-sec-badge">${T2IC.card}</div><h3>THANH TOÁN</h3></div>
            <p class="t2-term-body">${has(quotation.thanh_toan) ? multiLine(quotation.thanh_toan) : '— chưa quy định —'}</p>
          </div>
          <div class="t2-term-card">
            <div class="t2-term-hdr"><div class="t2-sec-badge">${T2IC.clock}</div><h3>TIẾN ĐỘ</h3></div>
            <p class="t2-term-body">${has(quotation.tien_do) ? multiLine(quotation.tien_do) : '— chưa quy định —'}</p>
          </div>
          <div class="t2-term-card">
            <div class="t2-term-hdr"><div class="t2-sec-badge">${T2IC.shield}</div><h3>BẢO HÀNH</h3></div>
            <p class="t2-term-body">${has(quotation.bao_hanh) ? multiLine(quotation.bao_hanh) : '— chưa quy định —'}</p>
          </div>
        </section>

        <!-- Chữ ký -->
        <section class="t2-sig-section">
          <div class="t2-sig-grid">
            <div class="t2-sig-col">
              <div><h4 class="t2-sig-role">KHÁCH HÀNG XÁC NHẬN</h4><p class="t2-sig-hint">(Ký, ghi rõ họ tên)</p></div>
              <p class="t2-sig-date">Ngày ......./......./..........</p>
            </div>
            <div class="t2-sig-col">
              <div><h4 class="t2-sig-role">KINH DOANH / TƯ VẤN</h4><p class="t2-sig-hint">(Ký, ghi rõ họ tên)</p></div>
              <p class="t2-sig-date">Ngày ......./......./..........</p>
            </div>
            <div class="t2-sig-col">
              <div><h4 class="t2-sig-role">NGƯỜI ĐẠI DIỆN</h4><p class="t2-sig-hint">(Ký, ghi rõ họ tên, đóng dấu)</p></div>
              <p class="t2-sig-date">Ngày ......./......./..........</p>
            </div>
          </div>
        </section>
      </div>
    </section>`;
  }

  // ── Mẫu 1 (Classic – Original) ────────────────────────────────────────
  function renderTpl1({
    brandPrimary, brandSecondary,
    dealerName, dealerAddrFull, dealerPhone, dealerEmail, quoteTitle, tagline,
    customer, quotation, sections, adjustments, items, quotationImages, dealer, images
  }) {
    return `
      <section class="q-page" style="--primary:${brandPrimary};--secondary:${brandSecondary}">

        <!-- ════════ HEADER ════════ -->
        <header class="q-hdr">
          <div class="q-hdr-left">
            <div class="q-hdr-row">
              <div class="q-logo">
                ${has(images.logo_dai_ly)
        ? `<img src="${esc(images.logo_dai_ly)}" alt="Logo">`
        : `<div class="no-img">LOGO<br>ĐẠI LÝ</div>`}
              </div>
              <div class="q-dealer-info">
                <h1 class="q-dealer-name">${esc(dealerName)}</h1>
                ${tagline ? `<div class="q-tagline">${esc(tagline)}</div>` : ''}
                <div class="q-dealer-contact">
                  ${has(dealerPhone) ? `<div class="q-hdr-line"><span class="q-ic-badge">${IC.phone}</span><span>HOTLINE: <strong>${esc(dealerPhone)}</strong></span></div>` : ''}
                  ${has(dealerAddrFull) ? `<div class="q-hdr-line"><span class="q-ic-badge">${IC.pin}</span><span>${esc(dealerAddrFull)}</span></div>` : ''}
                </div>
              </div>
            </div>
          </div>
          <div class="q-hdr-right">
            <div class="q-hdr-title">${esc(quoteTitle)}</div>
            <div class="q-meta-table">
              <div class="q-meta-row"><span class="k">Số báo giá</span><span class="v">${esc(quotation.so_bao_gia || '—')}</span></div>
              <div class="q-meta-row"><span class="k">Ngày</span><span class="v">${esc(fmtDate(quotation.ngay_bao_gia) || '—')}</span></div>
            </div>
          </div>
        </header>

        <div class="q-body">

          <!-- ════════ KHÁCH HÀNG & CÔNG TRÌNH ════════ -->
          ${sectionHdr(IC.user, 'KHÁCH HÀNG & CÔNG TRÌNH')}
          <div class="q-customer">
            <div class="q-info-col">
              <div class="q-info-row"><span class="k">Khách hàng</span><span class="sep">:</span><span class="v">${esc(customer && customer.ten_kh || '—')}</span></div>
              <div class="q-info-row"><span class="k">Mã KH</span><span class="sep">:</span><span class="v">${esc(customer && customer.ma_kh || '—')}</span></div>
              <div class="q-info-row"><span class="k">Người phụ trách</span><span class="sep">:</span><span class="v">${esc(customer && customer.nguoi_lien_he || '—')}</span></div>
              <div class="q-info-row"><span class="k">Điện thoại</span><span class="sep">:</span><span class="v">${esc(customer && customer.phone || '—')}</span></div>
            </div>
            <div class="q-info-col">
              <div class="q-info-row"><span class="k">Email</span><span class="sep">:</span><span class="v">${esc(customer && customer.email || '—')}</span></div>
              <div class="q-info-row"><span class="k">Địa chỉ KH</span><span class="sep">:</span><span class="v">${esc(customer && customer.dia_chi || '—')}</span></div>
              <div class="q-info-row"><span class="k">Tên &amp; địa chỉ công trình</span><span class="sep">:</span><span class="v">${has(quotation.dia_chi_cong_trinh) ? multiLine(quotation.dia_chi_cong_trinh) : '—'}</span></div>
              <div class="q-info-row"><span class="k">Ghi chú hồ sơ</span><span class="sep">:</span><span class="v">${has(quotation.ghi_chu_ho_so) ? multiLine(quotation.ghi_chu_ho_so) : '—'}</span></div>
            </div>
          </div>

          <!-- ════════ HÌNH ẢNH ════════ -->
          ${renderQuotationImages(quotationImages)}

          <!-- ════════ DANH MỤC SẢN PHẨM ════════ -->
          ${sectionHdr(IC.grid, 'DANH MỤC SẢN PHẨM')}
          ${renderItemsTable(sections, items, adjustments, quotation)}
          <div class="q-footnote">* Đơn giá chưa bao gồm VAT. Báo giá có hiệu lực trong 15 ngày kể từ ngày báo giá.</div>

          <!-- ════════ GHI CHÚ + TỔNG HỢP ════════ -->
          <div class="q-bottom-grid">
            <div class="q-note-card">
              ${sectionHdr(IC.fileText, 'GHI CHÚ THƯƠNG MẠI')}
              <div class="q-note-body">
                ${has(quotation.ghi_chu_thuong_mai)
        ? multiLine(quotation.ghi_chu_thuong_mai)
        : '<span style="color:#94a3b8;font-style:italic">Chưa nhập ghi chú thương mại</span>'}
              </div>
            </div>
            <div class="q-total-card">
              <div class="q-total-hdr">TỔNG HỢP GIÁ TRỊ</div>
              ${(() => {
        const tt = Number(quotation.tam_tinh) || 0;
        const plusSum_val = sumPlus(adjustments, tt);
        const tongCong = tt + plusSum_val;
        const ckPct = Number(quotation.chiet_khau_percent) || 0;
        const ckAmount = Math.round(tongCong * ckPct / 100);
        const preTax = tongCong - ckAmount;
        const vatAmt = Number(quotation.vat_amount) || 0;
        const total = Number(quotation.tong_cong) || 0;

        // Render BS rows in total card
        const plusList = Array.isArray(adjustments) ? adjustments.filter(a => a.kind === 'plus') : [];
        const bsRows = plusList.map(a => {
          const eff = adjAmount(a, tt, plusSum_val);
          return `<div class="q-total-row"><span class="k">${esc(a.label || 'Bổ sung')}</span><span class="v">${money(eff)}</span></div>`;
        }).join('');

        return `<div class="q-total-body">
                  <div class="q-total-row"><span class="k">Tạm tính</span><span class="v">${money(tt)}</span></div>
                  ${bsRows}
                  ${ckAmount > 0 ? `<div class="q-total-row minus"><span class="k">Chiết khấu (${num(ckPct, ckPct % 1 ? 1 : 0)}%)</span><span class="v">−${money(ckAmount)}</span></div>` : ''}
                  <div class="q-total-row"><span class="k">VAT (${num(quotation.vat_percent)}%)</span><span class="v">${money(vatAmt)}</span></div>
                  <div class="q-total-row grand"><span class="k">TỔNG CỘNG</span><span class="v">${money(total)}</span></div>
                </div>`;
      })()}
            </div>
          </div>

          <!-- ════════ ĐIỀU KHOẢN ĐỀ XUẤT ════════ -->
          ${sectionHdr(IC.list, 'ĐIỀU KHOẢN ĐỀ XUẤT')}
          <div class="q-terms">
            <div class="q-term">
              <div class="q-term-hdr">${IC.banknote}<span>THANH TOÁN</span></div>
              <div class="q-term-body">${has(quotation.thanh_toan) ? multiLine(quotation.thanh_toan) : '— chưa quy định —'}</div>
            </div>
            <div class="q-term">
              <div class="q-term-hdr">${IC.clock}<span>TIẾN ĐỘ</span></div>
              <div class="q-term-body">${has(quotation.tien_do) ? multiLine(quotation.tien_do) : '— chưa quy định —'}</div>
            </div>
            <div class="q-term">
              <div class="q-term-hdr">${IC.shield}<span>BẢO HÀNH</span></div>
              <div class="q-term-body">${has(quotation.bao_hanh) ? multiLine(quotation.bao_hanh) : '— chưa quy định —'}</div>
            </div>
          </div>

          <!-- ════════ CHỮ KÝ ════════ -->
          <div class="q-signatures">
            <div class="q-sig">
              <div class="role">KHÁCH HÀNG XÁC NHẬN</div>
              <div class="hint">(Ký, ghi rõ họ tên)</div>
              <div class="sig-space"></div>
              <div class="sig-date">Ngày ......../........./..........</div>
            </div>
            <div class="q-sig">
              <div class="role">KINH DOANH / TƯ VẤN</div>
              <div class="hint">(Ký, ghi rõ họ tên)</div>
              <div class="sig-space"></div>
              <div class="sig-date">Ngày ......../........./..........</div>
            </div>
            <div class="q-sig">
              <div class="role">ĐẠI DIỆN ĐẠI LÝ</div>
              <div class="hint">(Ký, ghi rõ họ tên, đóng dấu)</div>
              <div class="sig-space"></div>
              <div class="sig-date">Ngày ......../........./..........</div>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  // ── Main render router ────────────────────────────────────────────────
  function render({
    dealer = {}, profile = {}, images = {},
    customer, quotation = {},
    sections = null, adjustments = [],
    items = [], quotationImages = [],
  }) {
    // Brand colors — từ profile, fallback cam đất + đen
    const brandPrimary = profile.brand_primary || '#D35400';
    const brandSecondary = profile.brand_secondary || '#1A1A1A';

    // Header — info đại lý (override > dealer profile)
    const dealerName = has(quotation.dealer_name_override)
      ? quotation.dealer_name_override
      : (dealer.ten_dai_ly || 'Tên đại lý');
    const dealerAddrFull = has(quotation.dealer_address_override)
      ? quotation.dealer_address_override
      : [dealer.address, dealer.district, dealer.province].filter(has).join(', ');
    const dealerPhone = has(quotation.dealer_phone_override) ? quotation.dealer_phone_override : (dealer.phone || '');
    const dealerEmail = has(quotation.dealer_email_override) ? quotation.dealer_email_override : (dealer.email || '');
    const quoteTitle = has(quotation.quote_title) ? quotation.quote_title : 'PHIẾU BÁO GIÁ';
    const tagline = has(profile.tagline) ? profile.tagline : '';

    const ctx = {
      brandPrimary, brandSecondary,
      dealerName, dealerAddrFull, dealerPhone, dealerEmail, quoteTitle, tagline,
      dealer, profile, images, customer, quotation, sections, adjustments, items, quotationImages
    };

    const tpl = quotation.selected_template || 't1';
    if (tpl === 't2') return renderTpl2(ctx);
    return renderTpl1(ctx);
  }

  global.QuotationTemplate = { render };
})(window);
