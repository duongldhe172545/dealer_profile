// 5 mẫu hồ sơ đại lý. Mỗi mẫu render 1 trang A4 đầy đủ — KHÔNG ẩn section khi trống,
// luôn hiện placeholder lịch sự để đại lý thấy chỗ cần điền.
// CSS đi kèm: /assets/css/profile.css
(function (global) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const lines = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const has = v => v != null && String(v).trim() !== '';

  // ============================================================
  // SVG icons (line-art, stroke-based)
  // ============================================================
  const SVG = {
    shield:    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    building:  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h2M9 13h2M9 17h2M13 9h2M13 13h2M13 17h2"/></svg>`,
    support:   `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    chart:     `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M7 14l4-4 4 4 5-5"/></svg>`,
    clock:     `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    star:      `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5"/></svg>`,
    clipboard: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 12h6M9 16h4"/></svg>`,
    docCheck:  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10l4 4v14H5z"/><path d="M9 13l2 2 4-4"/></svg>`,
    shieldChk: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
    box:       `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>`,
    heart:     `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
    user:      `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>`,
    phone:     `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></svg>`,
    mail:      `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>`,
    image:     `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>`,
    warehouse: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-9h6v9"/></svg>`,
    team:      `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 21c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2"/><path d="M21 19c0-2-2-4-4-4"/></svg>`,
    qr:        `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14h1v1M14 20h1v1M17 20h1v1M20 17h1v1M20 20h1v1"/></svg>`,
  };

  // ============================================================
  // Helpers
  // ============================================================

  function imgBox(url, fallback) {
    return url
      ? `<img src="${esc(url)}" alt="${esc(fallback)}">`
      : `${SVG.image}<span class="label">${esc(fallback)}</span>`;
  }

  function brandChip(url, fallbackText, icon = SVG.shield) {
    if (url) {
      return `<div class="brand-chip has-img"><img src="${esc(url)}" alt="${esc(fallbackText)}"></div>`;
    }
    return `<div class="brand-chip">
      ${icon}
      <span class="chip-text">${esc(fallbackText)}</span>
    </div>`;
  }

  function badgesBlock(p, icons = [SVG.shield, SVG.building, SVG.support]) {
    const items = [p.badge1, p.badge2, p.badge3];
    const visible = items.filter(has);
    if (!visible.length) return '';
    return `<div class="badge-row">${visible.map((b, i) => `
      <span class="badge">${icons[i] || ''}${esc(b)}</span>
    `).join('')}</div>`;
  }

  function contactStrip(d) {
    return `<div class="contact-strip">
      <div>${SVG.phone}<span>${has(d.phone) ? esc(d.phone) : '—'}</span></div>
      <div>${SVG.mail}<span>${has(d.email) ? esc(d.email) : '—'}</span></div>
      <div>${SVG.clock}<span>${has(d.open_hours) ? esc(d.open_hours) : '—'}</span></div>
    </div>`;
  }

  function infoTable(d) {
    const addr = [d.address, d.district, d.province].filter(has).join(', ');
    const scale = [
      has(d.team_size) && d.team_size + ' người',
      has(d.projects_monthly) && d.projects_monthly + ' dự án/tháng',
      has(d.years_experience) && d.years_experience + ' năm',
    ].filter(Boolean).join(' · ');
    const rows = [
      ['Mã đại lý',  d.dealer_code],
      ['Tên đại lý', d.ten_dai_ly],
      ['Chủ đại lý', d.chu_dai_ly],
      ['Điện thoại', d.phone],
      ['Email',      d.email],
      ['MST',        d.mst],
      ['Địa chỉ',    addr],
      ['Khu vực',    d.coverage],
      ['Giờ mở cửa', d.open_hours],
      ['Quy mô',     scale],
    ];
    return `<table class="info-table">${rows.map(([k, v]) =>
      `<tr><th>${esc(k)}</th><td class="${has(v) ? '' : 'empty'}">${has(v) ? esc(v) : '—'}</td></tr>`
    ).join('')}</table>`;
  }

  function avatarCard(d, images) {
    const hasAvatar = has(images.avatar_chu);
    const contactRow = (icon, value, fallback) => {
      const empty = !has(value);
      return `<div class="contact-line ${empty ? 'empty' : ''}">${icon}<span>${esc(empty ? fallback : value)}</span></div>`;
    };
    // Dùng <img> thay background-image để in PDF ổn định hơn (background-image
    // hay bị browser bỏ qua khi print hoặc load chậm)
    const avatarInner = hasAvatar
      ? `<img src="${esc(images.avatar_chu)}" alt="Ảnh chủ đại lý" loading="eager" crossorigin="anonymous">`
      : SVG.user;
    return `<div class="card avatar-card">
      <div class="avatar-circle ${hasAvatar ? 'has-img' : ''}">${avatarInner}</div>
      <div class="name">${esc(d.chu_dai_ly || '—')}</div>
      <div class="role">Chủ đại lý / người đại diện</div>
      <div class="avatar-contacts">
        ${contactRow(SVG.phone, d.phone, '— chưa cập nhật —')}
        ${contactRow(SVG.mail,  d.email, '— chưa cập nhật —')}
        ${contactRow(SVG.star,  has(d.years_experience) ? d.years_experience + ' năm kinh nghiệm' : '', '— chưa cập nhật —')}
      </div>
    </div>`;
  }

  function kpiCard(value, label, icon) {
    const empty = !has(value) && !has(label);
    return `<div class="mini-card kpi">
      <div class="ic-top">${icon}</div>
      <div class="value">${empty ? '—' : esc(value || '0')}</div>
      <div class="label">${empty ? 'chưa nhập' : esc(label || '')}</div>
    </div>`;
  }

  function kpiRow(p) {
    return `<div class="stats-row">
      ${kpiCard(p.metric1_value, p.metric1_label, SVG.chart)}
      ${kpiCard(p.metric2_value, p.metric2_label, SVG.clock)}
      ${kpiCard(p.metric3_value, p.metric3_label, SVG.star)}
    </div>`;
  }

  function highlightCard(num, text, icon) {
    return `<div class="mini-card hl">
      <div class="num">${num}</div>
      <div class="ic-top">${icon}</div>
      <div class="text">${has(text) ? esc(text) : '<span style="color:#94a3b8;font-style:italic;font-weight:500">Chưa nhập</span>'}</div>
    </div>`;
  }

  function highlightRow(p) {
    return `<div class="stats-row">
      ${highlightCard(1, p.usp_highlight1, SVG.clipboard)}
      ${highlightCard(2, p.usp_highlight2, SVG.docCheck)}
      ${highlightCard(3, p.usp_highlight3, SVG.shieldChk)}
    </div>`;
  }

  function uspListCard(title, text, icon, placeholderText, max = 8) {
    const arr = lines(text).slice(0, max);
    const body = arr.length
      ? `<ul class="usp-list">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`
      : `<ul class="usp-list">
          <li class="empty">${esc(placeholderText)}</li>
          <li class="empty">Nhập ở tab "Mô tả & năng lực"</li>
          <li class="empty">Mỗi dòng là một ý</li>
        </ul>`;
    return `<section class="card">
      <h3 class="card-title"><span class="ic-circle">${icon}</span>${esc(title)}</h3>
      ${body}
    </section>`;
  }

  function infoCard(d) {
    return `<section class="card">
      <h3 class="card-title"><span class="ic-circle">${SVG.building}</span>Thông tin đại lý</h3>
      ${infoTable(d)}
    </section>`;
  }

  function teamGallery(images) {
    const items = [
      { url: images.kho_xuong, hd: 'Kho / xưởng',  icon: SVG.warehouse },
      { url: images.doi_ngu_1, hd: 'Ảnh đội ngũ 1', icon: SVG.team },
      { url: images.doi_ngu_2, hd: 'Ảnh đội ngũ 2', icon: SVG.team },
    ];
    return items.map(it => `
      <div class="gallery-item">
        <div class="gallery-thumb ${has(it.url) ? 'has-img' : ''}" ${has(it.url) ? `style="background-image:url('${esc(it.url)}')"` : ''}>
          ${has(it.url) ? '' : `${it.icon}<span class="label">${esc(it.hd.toUpperCase())}</span>`}
        </div>
      </div>
    `).join('');
  }

  function qrCard(images, cta) {
    const hasQr = has(images.qr_code);
    return `<div class="gallery-item qr-card">
      <div class="qr-box ${hasQr ? 'has-img' : ''}" ${hasQr ? `style="background-image:url('${esc(images.qr_code)}')"` : ''}>
        ${hasQr ? '' : `${SVG.qr}<span class="label">QR CODE</span>`}
      </div>
      <div class="qr-cta">${esc(cta || 'Quét mã QR để xem thêm hình ảnh công trình và liên hệ tư vấn miễn phí.')}</div>
    </div>`;
  }

  function projectGallery(p, images) {
    const items = [
      { url: images.cong_trinh_1, cap: p.project_caption1, hd: 'Công trình 1' },
      { url: images.cong_trinh_2, cap: p.project_caption2, hd: 'Công trình 2' },
      { url: images.cong_trinh_3, cap: p.project_caption3, hd: 'Công trình 3' },
    ];
    return items.map(it => `
      <div class="gallery-item">
        <div class="gallery-thumb ${has(it.url) ? 'has-img' : ''}" ${has(it.url) ? `style="background-image:url('${esc(it.url)}')"` : ''}>
          ${has(it.url) ? '' : `${SVG.image}<span class="label">${esc(it.hd.toUpperCase())}</span>`}
        </div>
        <div class="cap">${esc(it.cap || '— chưa mô tả —')}</div>
      </div>
    `).join('');
  }

  function footerStrip(d) {
    return `<footer class="ftr-deluxe">
      <div class="ftr-left">
        <span>${esc(d.ten_dai_ly || 'Đại lý')}</span>
        ${has(d.dealer_code) ? `<span class="ftr-sep">·</span><span>${esc(d.dealer_code)}</span>` : ''}
        ${has(d.phone) ? `<span class="ftr-sep">·</span><span>${esc(d.phone)}</span>` : ''}
      </div>
      <div class="ftr-right">
        ${has(d.email) ? `<span>${esc(d.email)}</span>` : ''}
      </div>
    </footer>`;
  }

  // ============================================================
  // MẪU 1 — Layout 2 cột (theo template1.png của UI designer)
  // Bỏ logo Austdoor (chỉ logo đại lý). Card-based, navy header + soft blue body.
  // ============================================================
  function template1({ dealer, profile, images }) {
    const d = dealer || {};
    const p = profile || {};
    const imgs = images || {};

    const bullet = (txt, fb) => {
      const arr = lines(txt);
      if (arr.length) return arr;
      return fb;
    };
    const placeholderHints = {
      usp: ['Nhập ở tab "Mô tả & năng lực" — mỗi dòng một ý'],
      services: ['Nhập sản phẩm & dịch vụ ở tab "Mô tả & năng lực"'],
      commit: ['Nhập cam kết chăm sóc KH ở tab "Mô tả & năng lực"'],
    };

    const addrFull = [d.address, d.district, d.province].filter(has).join(', ') || '— chưa cập nhật —';
    const coverage = has(d.coverage) ? d.coverage : '— chưa cập nhật —';
    const hours    = has(d.open_hours) ? d.open_hours : '— chưa cập nhật —';

    const mst        = has(d.mst) ? d.mst : '— chưa cập nhật —';
    const projects   = has(d.projects_monthly) ? d.projects_monthly : '— chưa cập nhật —';

    const ownerName  = has(d.chu_dai_ly) ? d.chu_dai_ly : '— chưa cập nhật —';
    const ownerPhone = has(d.phone) ? d.phone : '— chưa cập nhật —';
    const ownerEmail = has(d.email) ? d.email : '— chưa cập nhật —';
    const exp        = has(d.years_experience) ? d.years_experience + (d.years_experience.toString().includes('năm') ? '' : ' năm') : '— —';
    const team       = has(d.team_size) ? d.team_size + ' người' : '— —';

    const hl1 = has(p.usp_highlight1) ? p.usp_highlight1 : 'Ưu điểm 1 — nhập ở tab "Điểm nhấn & KPI"';
    const hl2 = has(p.usp_highlight2) ? p.usp_highlight2 : 'Ưu điểm 2 — nhập ở tab "Điểm nhấn & KPI"';
    const hl3 = has(p.usp_highlight3) ? p.usp_highlight3 : 'Ưu điểm 3 — nhập ở tab "Điểm nhấn & KPI"';

    const m1v = has(p.metric1_value) ? p.metric1_value : '—';
    const m1l = has(p.metric1_label) ? p.metric1_label : 'Dự án / tháng';
    const m2v = has(p.metric2_value) ? p.metric2_value : '—';
    const m2l = has(p.metric2_label) ? p.metric2_label : 'Khảo sát nhanh';
    const m3v = has(p.metric3_value) ? p.metric3_value : '—';
    const m3l = has(p.metric3_label) ? p.metric3_label : 'Khách hài lòng';

    const b1 = has(p.badge1) ? p.badge1 : 'Đại lý đã xác thực';
    const b2 = has(p.badge2) ? p.badge2 : 'Khảo sát 24/7';
    const b3 = has(p.badge3) ? p.badge3 : 'Có kho/xưởng thực tế';

    const projItem = (url, cap, idx) => `
      <div class="t1-proj">
        <div class="t1-proj-img">${url ? `<img src="${esc(url)}" alt="">` : `${SVG.image}`}</div>
        <div class="t1-proj-cap">${esc(cap || ('Công trình ' + idx))}</div>
      </div>`;

    const teamItem = (url, cap) => `
      <div class="t1-team-item">
        <div class="t1-team-img">${url ? `<img src="${esc(url)}" alt="">` : `${SVG.image}`}</div>
        <div class="t1-team-cap">${esc(cap)}</div>
      </div>`;

    return `
      <section class="profile-page tpl-1 tpl-1-v2">
        <div class="t1-grid">

          <!-- ============ CỘT TRÁI ============ -->
          <div class="t1-col-left">

            <div class="t1-hdr">
              <div class="t1-hdr-logo">
                ${has(imgs.logo_dai_ly)
                  ? `<img src="${esc(imgs.logo_dai_ly)}" alt="Logo đại lý">`
                  : `<div class="t1-no-logo">LOGO<br>ĐẠI LÝ</div>`}
              </div>
              <h1 class="t1-title">${esc((d.ten_dai_ly || 'TÊN ĐẠI LÝ').toUpperCase())}</h1>
              <p class="t1-tagline">${esc(has(p.tagline) ? p.tagline : '— Thông điệp định vị —')}</p>
              <div class="t1-badges">
                <span class="t1-badge">${esc(b1)}</span>
                <span class="t1-badge">${esc(b2)}</span>
                <span class="t1-badge">${esc(b3)}</span>
              </div>
            </div>

            <!-- Hero ảnh banner -->
            <div class="t1-hero">
              ${has(imgs.hero)
                ? `<img src="${esc(imgs.hero)}" alt="Ảnh bìa">`
                : `<div class="t1-hero-empty">${SVG.image}<span class="t1-hero-label">ẢNH BÌA / HERO COVER</span></div>`}
            </div>

            <div class="t1-card t1-kpi-card">
              <div class="t1-card-hd">
                <span class="t1-card-title">Chỉ số năng lực</span>
                <span class="t1-card-ic">${SVG.chart}</span>
              </div>
              <div class="t1-kpi-row">
                <div class="t1-kpi"><div class="t1-kpi-label">${esc(m1l)}</div><div class="t1-kpi-value">${esc(m1v)}</div></div>
                <div class="t1-kpi"><div class="t1-kpi-label">${esc(m2l)}</div><div class="t1-kpi-value">${esc(m2v)}</div></div>
                <div class="t1-kpi"><div class="t1-kpi-label">${esc(m3l)}</div><div class="t1-kpi-value">${esc(m3v)}</div></div>
              </div>
              <ul class="t1-bullets">
                ${bullet(p.usp_text, placeholderHints.usp).slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('')}
              </ul>
            </div>

            <!-- 3 ưu điểm số (usp_highlight1-3) -->
            <div class="t1-hl-grid">
              <div class="t1-hl"><div class="t1-hl-num">1</div><div class="t1-hl-text">${esc(hl1)}</div></div>
              <div class="t1-hl"><div class="t1-hl-num">2</div><div class="t1-hl-text">${esc(hl2)}</div></div>
              <div class="t1-hl"><div class="t1-hl-num">3</div><div class="t1-hl-text">${esc(hl3)}</div></div>
            </div>

            <div class="t1-card">
              <div class="t1-card-hd">
                <span class="t1-card-title">Công trình thực tế</span>
                <span class="t1-card-ic">${SVG.warehouse}</span>
              </div>
              <div class="t1-proj-grid">
                ${projItem(imgs.cong_trinh_1, p.project_caption1, 1)}
                ${projItem(imgs.cong_trinh_2, p.project_caption2, 2)}
                ${projItem(imgs.cong_trinh_3, p.project_caption3, 3)}
              </div>
              <div class="t1-quote">
                <span class="t1-quote-text">"${esc(has(p.customer_quote) ? p.customer_quote : 'Phản hồi tích cực của khách hàng sẽ được trích dẫn ở đây.')}"</span>
                <span class="t1-quote-by">— Khách hàng chia sẻ</span>
              </div>
            </div>

          </div>

          <!-- ============ CỘT PHẢI ============ -->
          <div class="t1-col-right">

            <div class="t1-card">
              <div class="t1-card-hd">
                <span class="t1-card-title">Sản phẩm, dịch vụ</span>
                <span class="t1-card-ic">${SVG.box}</span>
              </div>
              <ul class="t1-bullets t1-bullets-dot">
                ${bullet(p.services_text, placeholderHints.services).slice(0, 6).map(x => `<li>${esc(x)}</li>`).join('')}
              </ul>
            </div>

            <div class="t1-card">
              <div class="t1-card-hd">
                <span class="t1-card-title">Cam kết chăm sóc</span>
                <span class="t1-card-ic">${SVG.heart}</span>
              </div>
              <ul class="t1-bullets t1-bullets-dot">
                ${bullet(p.commitments_text, placeholderHints.commit).slice(0, 5).map(x => `<li>${esc(x)}</li>`).join('')}
              </ul>
            </div>

            <div class="t1-card">
              <div class="t1-card-hd">
                <span class="t1-card-title">Người đại diện</span>
                <span class="t1-card-ic">${SVG.user}</span>
              </div>
              <div class="t1-owner">
                <div class="t1-owner-info">
                  <div class="t1-owner-name">${esc(ownerName)}</div>
                  <div class="t1-owner-line"><span class="t1-base-ic">${SVG.phone}</span><span>${esc(ownerPhone)}</span></div>
                  <div class="t1-owner-line"><span class="t1-base-ic">${SVG.mail}</span><span>${esc(ownerEmail)}</span></div>
                  <div class="t1-owner-line"><span class="t1-base-ic">📍</span><span>${esc(addrFull)}</span></div>
                </div>
                <div class="t1-owner-avatar">
                  ${has(imgs.avatar_chu) ? `<img src="${esc(imgs.avatar_chu)}" alt="">` : SVG.user}
                </div>
              </div>
              <div class="t1-owner-kpis">
                <div class="t1-okpi"><span class="t1-okpi-l">Kinh nghiệm</span><span class="t1-okpi-v">${esc(exp)}</span></div>
                <div class="t1-okpi"><span class="t1-okpi-l">Quy mô đội ngũ</span><span class="t1-okpi-v">${esc(team)}</span></div>
                <div class="t1-okpi"><span class="t1-okpi-l">Dự án / tháng</span><span class="t1-okpi-v">${esc(projects)}</span></div>
                <div class="t1-okpi"><span class="t1-okpi-l">Giờ mở cửa</span><span class="t1-okpi-v">${esc(hours)}</span></div>
              </div>
            </div>

            <div class="t1-card">
              <div class="t1-card-hd">
                <span class="t1-card-title">Về đội ngũ</span>
                <span class="t1-card-ic">${SVG.team}</span>
              </div>
              <div class="t1-team-grid">
                ${teamItem(imgs.doi_ngu_1, 'Ảnh đội ngũ 1')}
                ${teamItem(imgs.doi_ngu_2, 'Ảnh đội ngũ 2')}
              </div>
            </div>

            <!-- Cơ sở đại lý (move sang phải cho cân) -->
            <div class="t1-card t1-base">
              <div class="t1-card-hd">
                <span class="t1-card-title">Cơ sở đại lý</span>
                <span class="t1-card-ic">${SVG.warehouse}</span>
              </div>
              <div class="t1-base-row">
                <div class="t1-base-info">
                  <div class="t1-base-line"><span class="t1-base-ic">🏘</span><span>Khu vực ${esc(coverage)}</span></div>
                  <div class="t1-base-line"><span class="t1-base-ic">📋</span><span>MST: ${esc(mst)}</span></div>
                </div>
                <div class="t1-base-img-wrap">
                  <div class="t1-base-img">${has(imgs.kho_xuong) ? `<img src="${esc(imgs.kho_xuong)}" alt="">` : `${SVG.image}`}</div>
                  <div class="t1-base-img-cap">Ảnh kho / xưởng</div>
                </div>
              </div>
            </div>

            <div class="t1-card t1-qr-card">
              <div class="t1-card-hd">
                <span class="t1-card-title" style="color:#fff">QR thông tin</span>
              </div>
              <div class="t1-qr-row">
                <p class="t1-qr-text">${esc(has(p.cta_text) ? p.cta_text : 'Hình ảnh công trình thực tế, hồ sơ đại lý, bảng báo giá mẫu và thông tin liên hệ tư vấn.')}</p>
                <div class="t1-qr-box">${has(imgs.qr_code) ? `<img src="${esc(imgs.qr_code)}" alt="">` : `<div class="t1-qr-ph">QR</div>`}</div>
              </div>
            </div>

          </div>
        </div>
      </section>`;
  }

  // ============================================================
  // MẪU 2-5 — Tạm thời clone template1 để giữ chức năng, sẽ redesign sau khi user OK T1
  // ============================================================
  function template2(data) { return template1(data); }
  function template3(data) { return template1(data); }
  function template4(data) { return template1(data); }
  function template5(data) { return template1(data); }

  global.ProfileTemplates = {
    renderers: { t1: template1, t2: template2, t3: template3, t4: template4, t5: template5 },
    labels:    { t1: 'Cổ điển (navy + gold)', t2: 'Hiện đại', t3: 'Tối giản', t4: 'Nổi bật', t5: 'Cao cấp' },
    render(key, data) {
      const fn = this.renderers[key] || this.renderers.t1;
      return fn(data);
    },
  };
})(window);
