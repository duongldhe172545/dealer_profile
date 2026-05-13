// Template render báo giá A4. Nhận data { dealer, profile, images, customer, quotation, items }
// và trả về HTML string của 1 trang A4.
(function (global) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const has = v => v != null && String(v).trim() !== '';
  const money = v => (Number(v) || 0).toLocaleString('vi-VN') + ' đ';
  const num = (v, d = 0) => (Number(v) || 0).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
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

  function renderItemsTable(items) {
    const head = `
      <thead>
        <tr>
          <th style="width:28px">STT</th>
          <th style="width:80px">Nhóm SP</th>
          <th style="width:80px">Mã SP</th>
          <th>Mô tả sản phẩm / cấu hình</th>
          <th style="width:56px" class="center">Rộng (mm)</th>
          <th style="width:56px" class="center">Dài (mm)</th>
          <th style="width:36px" class="center">SL</th>
          <th style="width:40px" class="center">ĐVT</th>
          <th style="width:84px" class="num">Đơn giá</th>
          <th style="width:96px" class="num">Thành tiền</th>
        </tr>
      </thead>`;

    if (!items || !items.length) {
      return `<table class="q-items">${head}
        <tbody><tr><td colspan="10" style="text-align:center;padding:20px;color:#94a3b8;font-style:italic">Chưa có sản phẩm</td></tr></tbody>
      </table>`;
    }

    return `<table class="q-items">${head}
      <tbody>
        ${items.map((it, i) => `
          <tr>
            <td class="center">${i + 1}</td>
            <td>${esc(it.nhom_sp || '—')}</td>
            <td class="ma">${esc(it.ma_sp || '—')}</td>
            <td class="desc">${esc(it.mo_ta || '— chưa nhập mô tả —')}</td>
            <td class="center">${has(it.rong) ? num(it.rong) : '—'}</td>
            <td class="center">${has(it.cao)  ? num(it.cao)  : '—'}</td>
            <td class="center">${num(it.sl, 0)}</td>
            <td class="center">${esc(it.dvt || '')}</td>
            <td class="num">${money(it.don_gia)}</td>
            <td class="num total">${money(it.thanh_tien)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
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

  function render({ dealer = {}, profile = {}, images = {}, customer, quotation = {}, items = [], quotationImages = [] }) {
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
            ${renderItemsTable(items)}
          </section>

          <section class="q-summary">
            <div class="q-card">
              <h3 class="q-section-title">Ghi chú thương mại</h3>
              <p style="font-size:10.5px;color:#475569;line-height:1.5">
                ${esc(quotation.ghi_chu_thuong_mai || 'Giá đã bao gồm tư vấn kỹ thuật. Vận chuyển và lắp đặt có thể tách riêng theo phạm vi công trình.')}
              </p>
            </div>
            <div class="q-totals">
              <div class="row"><span class="k">Tạm tính</span><span class="v">${money(quotation.tam_tinh)}</span></div>
              <div class="row"><span class="k">Chi phí vận chuyển</span><span class="v">${money(quotation.chi_phi_van_chuyen)}</span></div>
              <div class="row"><span class="k">Chi phí lắp đặt</span><span class="v">${money(quotation.chi_phi_lap_dat)}</span></div>
              <div class="row"><span class="k">VAT (${num(quotation.vat_percent)}%)</span><span class="v">${money(quotation.vat_amount)}</span></div>
              <div class="row grand"><span class="k">Tổng cộng</span><span class="v">${money(quotation.tong_cong)}</span></div>
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
