// Template render báo giá A4. Nhận data { dealer, profile, images, customer, quotation, items }
// và trả về HTML string của 1 trang A4.
(function (global) {
  if (!global.AppHelpers) {
    throw new Error('quotation-template.js cần _helpers.js load trước (window.AppHelpers).');
  }
  const { esc, has } = global.AppHelpers;
  const money = v => (Number(v) || 0).toLocaleString('vi-VN') + ' đ';
  const num = (v, d = 0) => (Number(v) || 0).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
  // Số lượng: cho phép thập phân (vd 10.224), giữ dấu chấm làm decimal separator,
  // không format kiểu vi-VN tránh nhầm lẫn với dấu cách hàng nghìn.
  // Integer → "10", decimal → "10.224", trim trailing zero.
  const numQty = v => {
    const n = Number(v) || 0;
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(4).replace(/\.?0+$/, '');
  };
  const fmtDate = v => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  function infoLine(k, v, fallback = '—') {
    const isEmpty = !has(v);
    return `<div>
      <span class="k">${esc(k)}</span>
      <span class="v ${isEmpty ? 'empty' : ''}">${esc(isEmpty ? fallback : v)}</span>
    </div>`;
  }

  // Số nguyên (rộng/cao mm) — không thập phân
  const numInt = v => has(v) ? Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) : '—';
  // Diện tích m² — 2 chữ số thập phân, trim trailing zero
  const numArea = v => {
    if (!has(v) || Number(v) === 0) return '—';
    const n = Number(v);
    return n.toFixed(2).replace(/\.?0+$/, '');
  };

  // Resolve icon SVG cho 1 item:
  //   - icon_url     → <img>
  //   - icon_preset  → resolve từ IconPicker library (cache trong window)
  //   - không có    → empty
  function resolveItemIcon(it) {
    if (!it) return '';
    if (it.icon_url) return `<img src="${esc(it.icon_url)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain">`;
    if (it.icon_preset && window.IconPicker) {
      const svg = window.IconPicker.getSvgByKey(it.icon_preset);
      if (svg) return svg;
    }
    return '';
  }

  // Render 1 item row.
  // Bảng 12 cột: STT | Icon | Mã SP | Tên SP | Mô tả | Rộng | Cao | Diện tích | ĐVT | SL | Đơn giá | Thành tiền
  function renderItemRow(it, stt) {
    const iconHtml = resolveItemIcon(it);
    return `
      <tr>
        <td class="center">${stt}</td>
        <td class="center icon-cell">${iconHtml}</td>
        <td class="ma">${esc(it.ma_sp || '—')}</td>
        <td class="ten-sp">${esc(it.ten_sp || '—')}</td>
        <td class="desc">${esc(it.mo_ta || '')}</td>
        <td class="center">${numInt(it.rong)}</td>
        <td class="center">${numInt(it.cao)}</td>
        <td class="center area-cell">${numArea(it.dien_tich)}</td>
        <td class="center">${esc(it.dvt || '')}</td>
        <td class="center qty-cell">${numQty(it.sl)}</td>
        <td class="num">${money(it.don_gia)}</td>
        <td class="num total">${money(it.thanh_tien)}</td>
      </tr>`;
  }

  // Width A4 portrait usable = ~688px. Thêm cột Icon 30px → cắt bớt cột khác:
  //   STT 22 + Icon 30 + Mã 46 + Tên SP 96 + Mô tả flex + Rộng 38 + Cao 38 +
  //   DT 44 + ĐVT 30 + SL 32 + Đơn giá 68 + Thành tiền 80 = 524 fixed
  //   → Mô tả flex ~164px ✓
  const ITEMS_TABLE_HEAD = `
    <thead>
      <tr>
        <th style="width:22px" class="center">STT</th>
        <th style="width:30px" class="center">Ảnh MH</th>
        <th style="width:46px">Mã SP</th>
        <th style="width:96px">Tên SP</th>
        <th>Mô tả / quy cách</th>
        <th style="width:38px" class="center">Rộng</th>
        <th style="width:38px" class="center">Cao</th>
        <th style="width:44px" class="center">DT (m²)</th>
        <th style="width:30px" class="center">ĐVT</th>
        <th style="width:32px" class="center">SL</th>
        <th style="width:68px" class="num">Đơn giá</th>
        <th style="width:80px" class="num">Thành tiền</th>
      </tr>
    </thead>`;

  // Render bảng items.
  // - V2 grouped (>=2 sections HOẶC có tên): section header A/B/C + subtotal mỗi nhóm
  // - V2 flat (1 section, ten=''): render flat, không letter/header/subtotal
  // - Fallback items[] (legacy): render flat
  function renderItemsTable(sections, fallbackItems) {
    // V2: render theo sections
    if (Array.isArray(sections) && sections.length) {
      const isGrouped = sections.length > 1 || sections.some(s => (s.ten || '').trim());

      if (!isGrouped) {
        // Flat: bỏ section UI, chỉ list items
        const items = (sections[0] && sections[0].items) || [];
        if (!items.length) {
          return `<table class="q-items">${ITEMS_TABLE_HEAD}
            <tbody><tr><td colspan="12" style="text-align:center;padding:20px;color:#94a3b8;font-style:italic">Chưa có sản phẩm</td></tr></tbody>
          </table>`;
        }
        return `<table class="q-items">${ITEMS_TABLE_HEAD}
          <tbody>${items.map((it, i) => renderItemRow(it, i + 1)).join('')}</tbody>
        </table>`;
      }

      // Grouped: header A/B/C... + subtotal mỗi nhóm
      let runningStt = 0;
      const bodyRows = sections.map(sec => {
        const letter = esc(sec.letter || '');
        const ten = esc(sec.ten || '— chưa đặt tên nhóm —');
        const sectionHeader = `
          <tr class="q-sec-hdr">
            <td class="center" style="font-weight:800;color:#0a6fd6">${letter}</td>
            <td colspan="11" style="font-weight:700">${ten}</td>
          </tr>`;
        const itemRows = (sec.items || []).map(it => {
          runningStt += 1;
          return renderItemRow(it, runningStt);
        }).join('');
        const subtotalRow = `
          <tr class="q-sec-sub">
            <td colspan="11" class="num" style="font-weight:700;color:#475569;padding-right:8px">
              Tổng nhóm ${letter}${ten ? ' — ' + ten : ''}
            </td>
            <td class="num total" style="font-weight:800">${money(sec.subtotal || 0)}</td>
          </tr>`;
        return sectionHeader + itemRows + subtotalRow;
      }).join('');
      return `<table class="q-items">${ITEMS_TABLE_HEAD}<tbody>${bodyRows}</tbody></table>`;
    }

    // Fallback: flat items (legacy)
    const items = fallbackItems || [];
    if (!items.length) {
      return `<table class="q-items">${ITEMS_TABLE_HEAD}
        <tbody><tr><td colspan="12" style="text-align:center;padding:20px;color:#94a3b8;font-style:italic">Chưa có sản phẩm</td></tr></tbody>
      </table>`;
    }
    return `<table class="q-items">${ITEMS_TABLE_HEAD}
      <tbody>${items.map((it, i) => renderItemRow(it, i + 1)).join('')}</tbody>
    </table>`;
  }

  // Render rows điều chỉnh footer (Vận chuyển / Lắp đặt / Chiết khấu …).
  // Robust với cả 2 nguồn:
  //   FE state shape:  a.amount = pct (khi mode='percent') hoặc đồng (mode='fixed')
  //   DB shape:        a.amount = đồng (0 khi percent), a.value_percent = pct
  function renderAdjRows(adjustments, tamTinh) {
    if (!Array.isArray(adjustments) || !adjustments.length) return '';
    const baseTT = Number(tamTinh) || 0;
    const rowFor = (a, sign, klass) => {
      const isPct = a.mode === 'percent';
      const pct = Number(a.value_percent ?? (isPct ? a.amount : 0)) || 0;
      const eff = isPct ? Math.round(baseTT * pct / 100) : (Number(a.amount) || 0);
      const suffix = isPct ? ` (${num(pct, pct % 1 ? 1 : 0)}%)` : '';
      const valTxt = sign === '−' ? `−${money(eff)}` : money(eff);
      return `<div class="row ${klass}"><span class="k">${sign} ${esc(a.label)}${suffix}</span><span class="v">${valTxt}</span></div>`;
    };
    const plus = adjustments.filter(a => a.kind === 'plus').map(a => rowFor(a, '+', '')).join('');
    const minus = adjustments.filter(a => a.kind === 'minus').map(a => rowFor(a, '−', 'minus')).join('');
    return plus + minus;
  }

  // Render gallery 1..5 ảnh — luôn hiện caption dưới (fallback "Ảnh N" nếu chưa nhập)
  function renderQuotationImages(qImages) {
    if (!qImages || !qImages.length) return '';
    const count = qImages.length;
    return `
      <section>
        <h3 class="q-section-title">Hình ảnh sản phẩm / công trình</h3>
        <div class="q-images count-${count}">
          ${qImages.map(img => `
            <div class="q-img-card">
              <div class="q-img-frame"><img src="${esc(img.url)}" alt="Ảnh ${img.slot}"></div>
              <div class="cap">${esc(has(img.caption) ? img.caption : 'Ảnh ' + img.slot)}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  function render({
    dealer = {}, profile = {}, images = {},
    customer, quotation = {},
    sections = null, adjustments = [],
    items = [], quotationImages = [],
  }) {
    // Header — info đại lý (left)
    const dealerInfo = [
      has(dealer.address || dealer.district || dealer.province) && [
        dealer.address, dealer.district, dealer.province
      ].filter(has).join(', '),
      has(dealer.phone) && `📞 ${dealer.phone}`,
      has(dealer.email) && `✉️ ${dealer.email}`,
    ].filter(Boolean);

    return `
      <section class="q-page">
        <header class="q-hdr">
          <div class="q-hdr-grid">
            <div class="q-logo">
              ${has(images.logo_dai_ly)
                ? `<img src="${esc(images.logo_dai_ly)}" alt="Logo">`
                : `<div class="no-img">LOGO<br>ĐẠI LÝ</div>`}
            </div>
            <div class="q-dealer">
              <h1>${esc(dealer.ten_dai_ly || 'Tên đại lý')}</h1>
              <div class="info">
                ${dealerInfo.map(l => `<div>${esc(l)}</div>`).join('')}
              </div>
            </div>
            <div class="q-meta">
              <div class="title">Báo giá</div>
              <div class="row"><span class="k">Số báo giá</span><span class="v">${esc(quotation.so_bao_gia || '—')}</span></div>
              <div class="row"><span class="k">Ngày</span><span class="v">${esc(fmtDate(quotation.ngay_bao_gia) || '—')}</span></div>
            </div>
          </div>
        </header>

        <div class="q-body">
          <div class="q-title-banner">
            <h2>PHIẾU BÁO GIÁ</h2>
            <p>Số ${esc(quotation.so_bao_gia || '—')} · Ngày ${esc(fmtDate(quotation.ngay_bao_gia) || '—')}</p>
          </div>

          <section class="q-card">
            <h3 class="q-section-title">Khách hàng & công trình</h3>
            <div class="q-customer">
              <div class="q-info-rows">
                ${infoLine('Khách hàng', customer && customer.ten_kh)}
                ${infoLine('Mã KH', customer && customer.ma_kh)}
                ${infoLine('Người phụ trách', customer && customer.nguoi_lien_he)}
                ${infoLine('Điện thoại', customer && customer.phone)}
              </div>
              <div class="q-info-rows">
                ${infoLine('Email', customer && customer.email)}
                ${infoLine('Địa chỉ KH', customer && customer.dia_chi)}
                ${infoLine('Địa chỉ công trình', quotation.dia_chi_cong_trinh)}
                ${infoLine('Ghi chú hồ sơ', quotation.ghi_chu_ho_so)}
              </div>
            </div>
          </section>

          <section>
            <h3 class="q-section-title">Danh mục sản phẩm</h3>
            ${renderItemsTable(sections, items)}
          </section>

          <section class="q-summary">
            <div class="q-card">
              <h3 class="q-section-title">Ghi chú thương mại</h3>
              <p style="font-size:10.5px;color:#475569;line-height:1.5">
                ${esc(quotation.ghi_chu_thuong_mai || 'Giá đã bao gồm tư vấn kỹ thuật. Vận chuyển và lắp đặt có thể tách riêng theo phạm vi công trình.')}
              </p>
            </div>
            <div class="q-totals">
              <div class="row"><span class="k">Tổng giá trị (cộng tất cả nhóm)</span><span class="v">${money(quotation.tam_tinh)}</span></div>
              ${renderAdjRows(adjustments, quotation.tam_tinh)}
              <div class="row pre-tax"><span class="k">Thành tiền chưa thuế</span><span class="v">${money(quotation.pre_tax != null ? quotation.pre_tax : (quotation.tong_cong - quotation.vat_amount))}</span></div>
              <div class="row"><span class="k">VAT (${num(quotation.vat_percent)}%)</span><span class="v">${money(quotation.vat_amount)}</span></div>
              <div class="row grand"><span class="k">Tổng tiền có thuế</span><span class="v">${money(quotation.tong_cong)}</span></div>
            </div>
          </section>

          ${renderQuotationImages(quotationImages)}

          <section>
            <h3 class="q-section-title">Điều khoản đề xuất</h3>
            <div class="q-terms">
              <div class="term">
                <div class="k">Thanh toán</div>
                <div class="v ${has(quotation.thanh_toan) ? '' : 'empty'}">${esc(quotation.thanh_toan || '— chưa quy định —')}</div>
              </div>
              <div class="term">
                <div class="k">Tiến độ</div>
                <div class="v ${has(quotation.tien_do) ? '' : 'empty'}">${esc(quotation.tien_do || '— chưa quy định —')}</div>
              </div>
              <div class="term">
                <div class="k">Bảo hành</div>
                <div class="v ${has(quotation.bao_hanh) ? '' : 'empty'}">${esc(quotation.bao_hanh || '— chưa quy định —')}</div>
              </div>
            </div>
          </section>

          <section class="q-signatures">
            <div class="q-sig"><div class="role">Khách hàng xác nhận</div><div class="hint">Ký và ghi rõ họ tên</div></div>
            <div class="q-sig"><div class="role">Kinh doanh / tư vấn</div><div class="hint">Đại diện phát hành báo giá</div></div>
            <div class="q-sig"><div class="role">Đại diện đại lý</div><div class="hint">Ký tên, đóng dấu</div></div>
          </section>
        </div>

        <footer class="q-ftr">
          <span>${esc(dealer.ten_dai_ly || 'Đại lý')}</span>
          <span>${esc(quotation.so_bao_gia || '')} · ${esc(fmtDate(quotation.ngay_bao_gia))}</span>
        </footer>
      </section>
    `;
  }

  global.QuotationTemplate = { render };
})(window);
