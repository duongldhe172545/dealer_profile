// Template render báo giá A4. Nhận data { dealer, profile, images, customer, quotation, items }
// và trả về HTML string của 1 trang A4.
(function (global) {
  if (!global.AppHelpers) {
    throw new Error('quotation-template.js cần _helpers.js load trước (window.AppHelpers).');
  }
  const { esc, has, multiLine } = global.AppHelpers;
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
    const body = isEmpty ? esc(fallback) : multiLine(v);
    return `<div>
      <span class="k">${esc(k)}</span>
      <div class="v ${isEmpty ? 'empty' : ''}">${body}</div>
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

  // Render 1 item row.
  // Bảng 11 cột: STT | Mã SP | Tên SP | Mô tả | Rộng | Cao | Số bộ | Khối lượng | Đơn vị | Đơn giá | Thành tiền
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

  // Width A4 portrait usable = ~688px:
  //   STT 22 + Mã 42 + Tên SP 100 + Mô tả flex + Rộng 38 + Cao 38 +
  //   Số bộ 34 + KL 50 + ĐV 34 + Đơn giá 70 + Thành tiền 82 = 510 fixed
  //   → Mô tả flex ~178px ✓
  const ITEMS_TABLE_HEAD = `
    <thead>
      <tr>
        <th style="width:22px" class="center">STT</th>
        <th style="width:42px">Mã SP</th>
        <th style="width:100px">Tên SP</th>
        <th>Mô tả / quy cách</th>
        <th style="width:38px" class="center">Rộng</th>
        <th style="width:38px" class="center">Cao</th>
        <th style="width:34px" class="center">Số bộ</th>
        <th style="width:50px" class="center">Khối lượng</th>
        <th style="width:34px" class="center">Đơn vị</th>
        <th style="width:70px" class="num">Đơn giá</th>
        <th style="width:82px" class="num">Thành tiền</th>
      </tr>
    </thead>`;

  // Render 1 BS row (Bổ sung — vận chuyển, lắp đặt…) trong bảng items.
  // 11 cột: STT+MaSP merge cho "BS1" (rộng ~64px, không wrap) | Tên+Mô tả (colspan 2) | _ | _ | Số bộ | _ | Đơn vị | Đơn giá | Thành tiền
  function renderBsRow(a, bsIdx, tamTinh, plusSum) {
    const eff = adjAmount(a, tamTinh, plusSum);
    const sb = Number(a.so_bo) || 0;
    const dg = Number(a.don_gia) || 0;
    return `
      <tr class="q-bs-row">
        <td class="center" colspan="2" style="font-weight:700;color:#0a6fd6;white-space:nowrap">BS${bsIdx}</td>
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

  // Render bảng items + BS rows (BS đặt cuối bảng, sau tất cả nhóm).
  // Trong bảng: A/B/C/... → Tổng các nhóm → BS1, BS2, ... → Tổng các BS.
  // Dưới bảng (q-totals): Tổng cộng / Chiết khấu / Giá sau ck / VAT / Thành tiền.
  function renderItemsTable(sections, fallbackItems, adjustments, quotation) {
    const tt = Number(quotation && quotation.tam_tinh) || 0;
    const plusList = Array.isArray(adjustments) ? adjustments.filter(a => a.kind === 'plus') : [];
    const plusSum = plusList.reduce((s, a) => s + adjAmount(a, tt, 0), 0);
    const bsRowsHtml = plusList.map((a, i) => renderBsRow(a, i + 1, tt, plusSum)).join('');

    // 2 row tổng đặt trong bảng (theo cấu trúc Excel)
    const tongNhomRow = `
      <tr class="q-grand-sub">
        <td colspan="10" style="font-weight:800;color:#0f172a;text-align:right;padding-right:8px">Tổng các nhóm</td>
        <td class="num" style="font-weight:800;color:#0f172a">${money(tt)}</td>
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
          <tr class="q-sec-hdr">
            <td class="center" style="font-weight:800;color:#0a6fd6">${letter}</td>
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

  // Tính effective amount cho 1 adjustment (Excel-style):
  //   fixed         → so_bo × don_gia (BS-style) hoặc fallback a.amount
  //   plus percent  → tam_tinh × pct / 100
  //   minus percent → (tam_tinh + Σplus) × pct / 100  — base passed in
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

  // Tổng phụ phí (plus) — dùng làm base cho chiết khấu %
  function sumPlus(adjustments, tamTinh) {
    if (!Array.isArray(adjustments)) return 0;
    return adjustments.filter(a => a.kind === 'plus')
      .reduce((s, a) => s + adjAmount(a, tamTinh, 0), 0);
  }

  // Render rows điều chỉnh footer.
  //   - kind='plus' fixed (có so_bo + don_gia): "BS  Vận chuyển  1 gói × 1,000,000 = 1,000,000"
  //   - kind='plus' percent: "+ Phụ phí (5%) = 14,824,725"
  //   - kind='minus' fixed: "− Chiết khấu = 1,000,000"
  //   - kind='minus' percent: "− Chiết khấu (10%) = 29,649,450"
  function renderAdjRows(adjustments, tamTinh) {
    if (!Array.isArray(adjustments) || !adjustments.length) return '';
    const rowFor = (a, sign, klass) => {
      const isPct = a.mode === 'percent';
      const eff = adjAmount(a, tamTinh);
      let label = esc(a.label || '');
      if (isPct) {
        const pct = Number(a.value_percent ?? a.amount) || 0;
        label += ` (${num(pct, pct % 1 ? 1 : 0)}%)`;
      } else if (Number(a.don_gia) > 0) {
        const sb = Number(a.so_bo) || 1;
        const dv = esc(a.don_vi || '');
        label += ` <span style="color:#94a3b8;font-weight:500">· ${numQty(sb)}${dv ? ' ' + dv : ''} × ${money(a.don_gia)}</span>`;
      }
      const valTxt = sign === '−' ? `−${money(eff)}` : money(eff);
      return `<div class="row ${klass}"><span class="k">${sign} ${label}</span><span class="v">${valTxt}</span></div>`;
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
    // Header — info đại lý (mig 014): override > dealer profile
    const dealerName = has(quotation.dealer_name_override)
      ? quotation.dealer_name_override
      : (dealer.ten_dai_ly || 'Tên đại lý');
    const dealerAddrFull = has(quotation.dealer_address_override)
      ? quotation.dealer_address_override
      : [dealer.address, dealer.district, dealer.province].filter(has).join(', ');
    const dealerPhone = has(quotation.dealer_phone_override) ? quotation.dealer_phone_override : (dealer.phone || '');
    const dealerEmail = has(quotation.dealer_email_override) ? quotation.dealer_email_override : (dealer.email || '');
    const dealerInfo = [
      has(dealerAddrFull) && dealerAddrFull,
      has(dealerPhone) && `📞 ${dealerPhone}`,
      has(dealerEmail) && `✉️ ${dealerEmail}`,
    ].filter(Boolean);
    const quoteTitle = has(quotation.quote_title) ? quotation.quote_title : 'PHIẾU BÁO GIÁ';

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
              <h1>${esc(dealerName)}</h1>
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
            <h2>${esc(quoteTitle)}</h2>
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
            ${renderItemsTable(sections, items, adjustments, quotation)}
          </section>

          <section class="q-summary">
            <div class="q-card">
              <h3 class="q-section-title">Ghi chú thương mại</h3>
              <div style="font-size:10.5px;color:#475569;line-height:1.5">
                ${has(quotation.ghi_chu_thuong_mai)
                  ? multiLine(quotation.ghi_chu_thuong_mai)
                  : 'Giá đã bao gồm tư vấn kỹ thuật. Vận chuyển và lắp đặt có thể tách riêng theo phạm vi công trình.'}
              </div>
            </div>
            ${(() => {
              const tt = Number(quotation.tam_tinh) || 0;
              const plusSum = sumPlus(adjustments, tt);
              const tongCong = tt + plusSum;
              const ckPct = Number(quotation.chiet_khau_percent) || 0;
              const ckAmount = Math.round(tongCong * ckPct / 100);
              const giaSauCk = quotation.pre_tax != null ? quotation.pre_tax : (quotation.tong_cong - quotation.vat_amount);
              return `<div class="q-totals">
                <div class="row pre-tax"><span class="k">Tổng cộng</span><span class="v">${money(tongCong)}</span></div>
                ${ckAmount > 0 ? `<div class="row minus"><span class="k">− Chiết khấu (${num(ckPct, ckPct % 1 ? 1 : 0)}%)</span><span class="v">−${money(ckAmount)}</span></div>
                <div class="row pre-tax"><span class="k">Giá sau chiết khấu</span><span class="v">${money(giaSauCk)}</span></div>` : ''}
                <div class="row"><span class="k">VAT (${num(quotation.vat_percent)}%)</span><span class="v">${money(quotation.vat_amount)}</span></div>
                <div class="row grand"><span class="k">Thành tiền</span><span class="v">${money(quotation.tong_cong)}</span></div>
              </div>`;
            })()}
          </section>

          ${renderQuotationImages(quotationImages)}

          <section>
            <h3 class="q-section-title">Điều khoản đề xuất</h3>
            <div class="q-terms">
              <div class="term">
                <div class="k">Thanh toán</div>
                <div class="v ${has(quotation.thanh_toan) ? '' : 'empty'}">${has(quotation.thanh_toan) ? multiLine(quotation.thanh_toan) : '— chưa quy định —'}</div>
              </div>
              <div class="term">
                <div class="k">Tiến độ</div>
                <div class="v ${has(quotation.tien_do) ? '' : 'empty'}">${has(quotation.tien_do) ? multiLine(quotation.tien_do) : '— chưa quy định —'}</div>
              </div>
              <div class="term">
                <div class="k">Bảo hành</div>
                <div class="v ${has(quotation.bao_hanh) ? '' : 'empty'}">${has(quotation.bao_hanh) ? multiLine(quotation.bao_hanh) : '— chưa quy định —'}</div>
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
