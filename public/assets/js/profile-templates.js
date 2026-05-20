// 5 mẫu hồ sơ đại lý. Mỗi mẫu render 1 trang A4 đầy đủ — KHÔNG ẩn section khi trống,
// luôn hiện placeholder lịch sự để đại lý thấy chỗ cần điền.
// CSS đi kèm: /assets/css/profile.css
(function (global) {
  // Helpers chung lấy từ window.AppHelpers (load _helpers.js trước).
  // Fail loud nếu thiếu — đỡ phải debug lý do template render rỗng.
  if (!global.AppHelpers) {
    throw new Error('profile-templates.js cần _helpers.js load trước (window.AppHelpers).');
  }
  const { esc, escMulti, lines, multiLine, has } = global.AppHelpers;

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

    const projects   = has(d.projects_monthly) ? d.projects_monthly : '— chưa cập nhật —';

    // Partners (5 logo + tagline auto fallback)
    const partnerSlots = ['partner_logo_1','partner_logo_2','partner_logo_3','partner_logo_4','partner_logo_5'];
    const partnerLogos = partnerSlots.map(k => imgs[k]).filter(has);
    const partnersTitle = has(p.partners_title)
      ? p.partners_title
      : `${d.ten_dai_ly || 'Đại lý'} là đối tác chiến lược uy tín của nhiều thương hiệu lớn`;

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

    // Team captions từ data, fallback nhãn mặc định
    const tcDoiNgu1 = has(p.team_caption_doi_ngu_1) ? p.team_caption_doi_ngu_1 : 'Ảnh đội ngũ 1';
    const tcKhoXuong = has(p.team_caption_kho_xuong) ? p.team_caption_kho_xuong : 'Ảnh kho / xưởng';
    const tcDoiNgu2 = has(p.team_caption_doi_ngu_2) ? p.team_caption_doi_ngu_2 : 'Ảnh đội ngũ 2';

    const projItem = (url, cap, idx) => `
      <div class="t1-proj">
        <div class="t1-proj-img">${url ? `<img src="${esc(url)}" alt="">` : `${SVG.image}`}</div>
        <div class="t1-proj-cap">${has(cap) ? escMulti(cap) : esc('Công trình ' + idx)}</div>
      </div>`;

    const teamItem = (url, cap) => `
      <div class="t1-team-item">
        <div class="t1-team-img">${url ? `<img src="${esc(url)}" alt="">` : `${SVG.image}`}</div>
        <div class="t1-team-cap">${escMulti(cap)}</div>
      </div>`;

    return `
      <section class="profile-page tpl-1 tpl-1-v2">
        <div class="t1-grid">

          <!-- ============ CỘT TRÁI ============ -->
          <div class="t1-col-left">

            <div class="t1-hdr">
              <div class="t1-hdr-logo ${has(imgs.logo_dai_ly) ? 'has-img' : ''}">
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
                ${teamItem(imgs.doi_ngu_1, tcDoiNgu1)}
                ${teamItem(imgs.doi_ngu_2, tcDoiNgu2)}
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
                  <div class="t1-base-line"><span class="t1-base-ic">⏰</span><span>Giờ mở cửa: ${esc(hours)}</span></div>
                </div>
                <div class="t1-base-img-wrap">
                  <div class="t1-base-img">${has(imgs.kho_xuong) ? `<img src="${esc(imgs.kho_xuong)}" alt="">` : `${SVG.image}`}</div>
                  <div class="t1-base-img-cap">${escMulti(tcKhoXuong)}</div>
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

        <!-- ============ ĐỐI TÁC CHIẾN LƯỢC ============ -->
        <div class="t1-partners">
          <div class="t1-partners-title">${esc(partnersTitle)}</div>
          <div class="t1-partners-grid">
            ${partnerLogos.length
              ? partnerLogos.map(u => `<div class="t1-partner"><img src="${esc(u)}" alt="Logo đối tác"></div>`).join('')
              : Array.from({length: 5}).map(() => `<div class="t1-partner empty"><span>LOGO ĐỐI TÁC</span></div>`).join('')
            }
          </div>
        </div>
      </section>`;
  }

  // ============================================================
  // Helper: chuẩn bị data dùng chung cho T2/T3/T4 (giảm trùng lặp)
  // ============================================================
  function prepareData({ dealer, profile, images }) {
    const d = dealer || {};
    const p = profile || {};
    const imgs = images || {};
    const fallback = '— chưa cập nhật —';
    const titleRaw = d.ten_dai_ly || 'Tên đại lý';
    // Partners: 5 slot logo + 1 tagline (auto fallback nếu trống)
    const partnerSlots = ['partner_logo_1','partner_logo_2','partner_logo_3','partner_logo_4','partner_logo_5'];
    const partnerLogos = partnerSlots.map(k => imgs[k]).filter(has);
    const partnersTitle = has(p.partners_title)
      ? p.partners_title
      : `${titleRaw} là đối tác chiến lược uy tín của nhiều thương hiệu lớn`;
    return {
      d, p, imgs,
      title: titleRaw.toUpperCase(),
      titleRaw,
      tagline: has(p.tagline) ? p.tagline : '— Thông điệp định vị —',
      dealerCode: d.dealer_code || '',
      addrFull: [d.address, d.district, d.province].filter(has).join(', ') || fallback,
      coverage: has(d.coverage) ? d.coverage : fallback,
      hours: has(d.open_hours) ? d.open_hours : fallback,
      projects: has(d.projects_monthly) ? d.projects_monthly : '—',
      partnerLogos,
      partnersTitle,
      ownerName: has(d.chu_dai_ly) ? d.chu_dai_ly : '—',
      ownerPhone: has(d.phone) ? d.phone : '—',
      ownerEmail: has(d.email) ? d.email : '—',
      exp: has(d.years_experience) ? d.years_experience : '—',
      team: has(d.team_size) ? d.team_size + ' người' : '—',
      b1: has(p.badge1) ? p.badge1 : 'Đại lý đã xác thực',
      b2: has(p.badge2) ? p.badge2 : 'Khảo sát 24/7',
      b3: has(p.badge3) ? p.badge3 : 'Có kho/xưởng thực tế',
      m1v: has(p.metric1_value) ? p.metric1_value : '—',
      m1l: has(p.metric1_label) ? p.metric1_label : 'Dự án / tháng',
      m2v: has(p.metric2_value) ? p.metric2_value : '—',
      m2l: has(p.metric2_label) ? p.metric2_label : 'Phản hồi hỗ trợ',
      m3v: has(p.metric3_value) ? p.metric3_value : '—',
      m3l: has(p.metric3_label) ? p.metric3_label : 'Đánh giá khách',
      hl1: has(p.usp_highlight1) ? p.usp_highlight1 : 'Ưu điểm 1 — nhập ở tab Điểm nhấn',
      hl2: has(p.usp_highlight2) ? p.usp_highlight2 : 'Ưu điểm 2 — nhập ở tab Điểm nhấn',
      hl3: has(p.usp_highlight3) ? p.usp_highlight3 : 'Ưu điểm 3 — nhập ở tab Điểm nhấn',
      uspLines:     lines(p.usp_text).length        ? lines(p.usp_text)        : ['Năng lực 1 — nhập ở tab Mô tả', 'Năng lực 2', 'Năng lực 3'],
      serviceLines: lines(p.services_text).length    ? lines(p.services_text)    : ['Sản phẩm/dịch vụ 1 — nhập ở tab Mô tả'],
      commitLines:  lines(p.commitments_text).length ? lines(p.commitments_text) : ['Cam kết 1 — nhập ở tab Mô tả'],
      quote: has(p.customer_quote) ? p.customer_quote : 'Phản hồi tích cực của khách hàng sẽ hiện ở đây.',
      cta: has(p.cta_text) ? p.cta_text : 'Quét mã QR để xem thêm công trình thực tế và thông tin liên hệ.',
      pc1: has(p.project_caption1) ? p.project_caption1 : 'Công trình 1',
      pc2: has(p.project_caption2) ? p.project_caption2 : 'Công trình 2',
      pc3: has(p.project_caption3) ? p.project_caption3 : 'Công trình 3',
      tcDoiNgu1: has(p.team_caption_doi_ngu_1) ? p.team_caption_doi_ngu_1 : 'Đội ngũ thi công',
      tcKhoXuong: has(p.team_caption_kho_xuong) ? p.team_caption_kho_xuong : 'Kho / xưởng',
      tcDoiNgu2: has(p.team_caption_doi_ngu_2) ? p.team_caption_doi_ngu_2 : 'Hoạt động đội ngũ',
    };
  }

  // imgBox helper riêng cho T2-T4 (placeholder dashed nhẹ)
  function pImg(url, label) {
    return url
      ? `<img src="${esc(url)}" alt="${esc(label)}">`
      : `<div class="ph-empty">${SVG.image}<span>${esc(label)}</span></div>`;
  }

  // ============================================================
  // MẪU 2 — Tech Modern (cyan + lime + dark ink)
  // Layout theo template2.html (do AI image-to-code sinh ra, đã chỉnh để
  // multi-brand: bỏ Austdoor logo và DEALER CODE khỏi header visible).
  // Structure: header 2-col → badges → contact-bar cyan → main-grid 2-col
  // (Hero+InfoTable | Owner+KPI+Highlights) → 3-col lists → testimonial
  // → bottom-grid 2-col (Team+QR | Projects) → partners → footer.
  // ============================================================
  function template2(data) {
    const x = prepareData(data);
    // Corner brackets (4 góc cyan thin) — gắn vào với class .t2-cb-set
    const cb = `<span class="cb tl"></span><span class="cb tr"></span><span class="cb bl"></span><span class="cb br"></span>`;
    // Icons (line stroke, inherit color via currentColor)
    const ic = {
      shield:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
      warehouse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-9h6v9"/></svg>`,
      clock:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
      phone:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9 .3 1.8 .6 2.6a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9 .3 1.7 .5 2.6 .6a2 2 0 0 1 1.7 2z"/></svg>`,
      mail:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>`,
      pin:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>`,
      user:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>`,
      camera:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>`,
      chart:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>`,
      bolt:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>`,
      star:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5"/></svg>`,
      stopwatch: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 13V9M10 2h4M19 5l-2 2"/></svg>`,
      clipChk:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 13l2 2 4-4"/></svg>`,
      check:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>`,
      box:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/></svg>`,
      heart:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
      quote:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h4v4H7zm0 4c0 3 1 5 4 5v2c-4 0-6-3-6-7zm10-4h4v4h-4zm0 4c0 3 1 5 4 5v2c-4 0-6-3-6-7z"/></svg>`,
      qr:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14h1M14 20h1M17 20h1M20 17h1M20 20h1"/></svg>`,
    };

    // Section header bar (dark band với English subtitle)
    const secH = (vi, en) =>
      `<div class="t2-sec-h"><span class="vi">${esc(vi)}</span><span class="en">// ${esc(en)}</span></div>`;

    // Image placeholder (dark gradient + camera icon)
    const phImg = (l1, l2 = '') => `
      <div class="t2-img-ph">
        <div class="t2-cam">${ic.camera}</div>
        ${l1 ? `<div class="t2-ph-l1">${esc(l1)}</div>` : ''}
        ${l2 ? `<div class="t2-ph-l2">${esc(l2)}</div>` : ''}
        ${cb}
      </div>`;
    const imgOr = (url, l1, l2) =>
      has(url) ? `<img src="${esc(url)}" alt="${esc(l1 || '')}">${cb}` : phImg(l1, l2);

    return `
      <section class="profile-page tpl-2-v2">

        <!-- ============ HEADER (2-col) ============ -->
        <header class="t2-hdr">
          <div class="t2-hdr-title">
            <h1 class="t2-h1">${esc(x.titleRaw)}</h1>
            <div class="t2-subtitle">
              <span class="t2-slash">//</span>
              <span>${esc(x.tagline)}</span>
            </div>
            <div class="t2-badges">
              <div class="t2-badge"><span class="t2-bi">${ic.shield}</span>${esc(x.b1)}</div>
              <div class="t2-badge"><span class="t2-bi">${ic.warehouse}</span>${esc(x.b2)}</div>
              <div class="t2-badge"><span class="t2-bi">${ic.clock}</span>${esc(x.b3)}</div>
            </div>
          </div>

          <div class="t2-hdr-logo ${has(x.imgs.logo_dai_ly) ? 'has-img' : ''}">
            ${has(x.imgs.logo_dai_ly)
              ? `<img src="${esc(x.imgs.logo_dai_ly)}" alt="Logo đại lý">`
              : `<div class="t2-logo-ph">
                   <div class="t2-logo-t">LOGO ĐẠI LÝ</div>
                   <div class="t2-logo-s">( PLACEHOLDER )</div>
                 </div>
                 ${cb}`}
          </div>
        </header>

        <!-- ============ CONTACT BAR (cyan band) ============ -->
        <div class="t2-contact">
          <span class="t2-c-it">${ic.phone}${esc(x.ownerPhone)}</span>
          <span class="t2-div"></span>
          <span class="t2-c-it">${ic.mail}${esc(x.ownerEmail)}</span>
          <span class="t2-div"></span>
          <span class="t2-c-it">${ic.pin}${esc(x.addrFull)}</span>
        </div>

        <!-- ============ MAIN GRID (2-col) ============ -->
        <div class="t2-main">

          <!-- LEFT: Hero + Info table -->
          <div>
            <div class="t2-hero">${imgOr(x.imgs.hero, 'ẢNH HERO', '( BÌA ĐẠI LÝ )')}</div>

            ${secH('THÔNG TIN ĐẠI LÝ', 'PROFILE DATA')}
            <div class="t2-info-wrap">
              <table class="t2-info">
                <tr><td class="lb"><span class="dot"></span>Tên đại lý</td><td>${esc(x.titleRaw)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Chủ đại lý</td><td>${esc(x.ownerName)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Điện thoại</td><td>${esc(x.ownerPhone)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Email</td><td>${esc(x.ownerEmail)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Địa chỉ</td><td>${esc(x.addrFull)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Khu vực phủ</td><td>${esc(x.coverage)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Giờ mở cửa</td><td>${esc(x.hours)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Kinh nghiệm</td><td>${esc(x.exp)} năm</td></tr>
                <tr><td class="lb"><span class="dot"></span>Quy mô đội</td><td>${esc(x.team)}</td></tr>
                <tr><td class="lb"><span class="dot"></span>Dự án / tháng</td><td>${esc(x.projects)}</td></tr>
              </table>
            </div>
          </div>

          <!-- RIGHT: Owner card + stat cards + highlights -->
          <div>
            <div class="t2-owner">
              <div class="t2-owner-lr">
                <span class="cy">CHỦ ĐẠI LÝ</span>
                <span class="cy">// OWNER</span>
              </div>
              <div class="t2-owner-row">
                <div class="t2-owner-ava">
                  ${has(x.imgs.avatar_chu)
                    ? `<img src="${esc(x.imgs.avatar_chu)}" alt="">`
                    : `<span class="t2-ava-ic">${ic.user}</span>`}
                </div>
                <div class="t2-owner-n">${esc(x.ownerName)}</div>
              </div>
              <div class="t2-owner-pill">CHỦ ĐẠI LÝ / OWNER DEALER</div>
              <div class="t2-owner-ph">${ic.phone}${esc(x.ownerPhone)}</div>
            </div>

            <div class="t2-stat-grid">
              <div class="t2-stat">
                <div class="t2-stat-row">
                  <div class="t2-stat-n">${esc(x.m1v)}</div>
                  <span class="t2-stat-ic">${ic.chart}</span>
                </div>
                <div class="t2-stat-d">${esc(x.m1l)}</div>
              </div>
              <div class="t2-stat">
                <div class="t2-stat-row">
                  <div class="t2-stat-n">${esc(x.m2v)}</div>
                  <span class="t2-stat-ic">${ic.bolt}</span>
                </div>
                <div class="t2-stat-d">${esc(x.m2l)}</div>
              </div>
              <div class="t2-stat">
                <div class="t2-stat-row">
                  <div class="t2-stat-n">${esc(x.m3v)}</div>
                  <span class="t2-stat-ic">${ic.star}</span>
                </div>
                <div class="t2-stat-d">${esc(x.m3l)}</div>
              </div>
            </div>

            ${secH('ĐIỂM NỔI BẬT', 'HIGHLIGHTS')}
            <div class="t2-hl-body">
              <div class="t2-hl">
                <span class="t2-hl-num">01</span>
                <span class="t2-hl-ic">${ic.stopwatch}</span>
                <div class="t2-hl-t">${esc(x.hl1)}</div>
              </div>
              <div class="t2-hl">
                <span class="t2-hl-num">02</span>
                <span class="t2-hl-ic">${ic.clipChk}</span>
                <div class="t2-hl-t">${esc(x.hl2)}</div>
              </div>
              <div class="t2-hl">
                <span class="t2-hl-num">03</span>
                <span class="t2-hl-ic">${ic.shield}</span>
                <div class="t2-hl-t">${esc(x.hl3)}</div>
              </div>
            </div>

            <!-- QR row — move lên đây để lấp khoảng trống dưới ĐIỂM NỔI BẬT -->
            <div class="t2-qr-row">
              <div class="t2-qr-l">
                <div class="t2-qr-t">QUÉT MÃ QR</div>
                <div class="t2-qr-s">// SCAN ME</div>
              </div>
              <div class="t2-qr-box">
                ${has(x.imgs.qr_code)
                  ? `<img src="${esc(x.imgs.qr_code)}" alt="QR">`
                  : `<div class="t2-qr-i">${ic.qr}<span>QR CODE</span></div>`}
              </div>
              <div class="t2-qr-d"><span class="t2-arr">»»»</span>${esc(x.cta)}</div>
            </div>
          </div>
        </div>

        <!-- ============ 3-COL LISTS ============ -->
        <div class="t2-three">
          <div class="t2-col">
            <div class="t2-col-h"><span>NĂNG LỰC NỔI BẬT</span><span class="en">// STRENGTHS</span></div>
            ${x.uspLines.slice(0, 6).map(s => `<div class="t2-chk-it"><span class="t2-cic">${ic.check}</span>${esc(s)}</div>`).join('')}
          </div>
          <div class="t2-col">
            <div class="t2-col-h"><span>SẢN PHẨM &amp; DỊCH VỤ</span><span class="en">// PRODUCTS</span></div>
            ${x.serviceLines.slice(0, 6).map(s => `<div class="t2-chk-it"><span class="t2-cic">${ic.box}</span>${esc(s)}</div>`).join('')}
          </div>
          <div class="t2-col">
            <div class="t2-col-h"><span>CAM KẾT CHĂM SÓC KH</span><span class="en">// CUSTOMER CARE</span></div>
            ${x.commitLines.slice(0, 5).map(s => `<div class="t2-chk-it"><span class="t2-cic">${ic.heart}</span>${esc(s)}</div>`).join('')}
          </div>
        </div>

        <!-- ============ TESTIMONIAL ============ -->
        <div class="t2-test">
          <div class="t2-test-ava">${ic.heart}</div>
          <div class="t2-test-lb">KHÁCH HÀNG<br>NÓI VỀ CHÚNG TÔI</div>
          <div class="t2-test-q">"${esc(x.quote)}"</div>
          <div class="t2-test-qm">${ic.quote}</div>
        </div>

        <!-- ============ BOTTOM GRID (2-col) ============ -->
        <div class="t2-bottom">

          <!-- LEFT: Đội ngũ & cơ sở -->
          <div>
            ${secH('ĐỘI NGŨ & CƠ SỞ', 'TEAM & FACILITIES')}
            <div class="t2-img-grid">
              <div class="t2-team-cell">
                <div class="t2-team-it">${imgOr(x.imgs.doi_ngu_1, 'ẢNH ĐỘI NGŨ 1', '( TEAM )')}</div>
                <div class="t2-team-cap">${escMulti(x.tcDoiNgu1)}</div>
              </div>
              <div class="t2-team-cell">
                <div class="t2-team-it">${imgOr(x.imgs.kho_xuong, 'KHO / XƯỞNG', '( WORKSHOP )')}</div>
                <div class="t2-team-cap">${escMulti(x.tcKhoXuong)}</div>
              </div>
              <div class="t2-team-cell">
                <div class="t2-team-it">${imgOr(x.imgs.doi_ngu_2, 'ẢNH ĐỘI NGŨ 2', '( TEAM )')}</div>
                <div class="t2-team-cap">${escMulti(x.tcDoiNgu2)}</div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Công trình -->
          <div>
            ${secH('CÔNG TRÌNH THỰC TẾ', 'REAL PROJECTS')}
            <div class="t2-img-grid">
              <div class="t2-prj-it">
                <div class="t2-prj-img">${imgOr(x.imgs.cong_trinh_1)}</div>
                <div class="t2-prj-cap">${escMulti(x.pc1)}</div>
              </div>
              <div class="t2-prj-it">
                <div class="t2-prj-img">${imgOr(x.imgs.cong_trinh_2)}</div>
                <div class="t2-prj-cap">${escMulti(x.pc2)}</div>
              </div>
              <div class="t2-prj-it">
                <div class="t2-prj-img">${imgOr(x.imgs.cong_trinh_3)}</div>
                <div class="t2-prj-cap">${escMulti(x.pc3)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ ĐỐI TÁC CHIẾN LƯỢC (cuối trang) ============ -->
        <div class="t2-partners">
          <div class="t2-partners-title">${esc(x.partnersTitle)}</div>
          <div class="t2-partners-grid">
            ${x.partnerLogos.length
              ? x.partnerLogos.map(u => `<div class="t2-partner"><img src="${esc(u)}" alt="Logo đối tác"></div>`).join('')
              : Array.from({length: 5}).map(() => `<div class="t2-partner empty"><span>LOGO ĐỐI TÁC</span></div>`).join('')
            }
          </div>
        </div>
      </section>`;
  }

  // ============================================================
  // MẪU 3 — Newspaper Bulletin (cream + wine, DM Serif Display + Crimson Text)
  // Theo docs/design/template3.png:
  //  - Masthead 2-col: cột trái stack (nameplate huge + hero + caption)
  //    | cột phải side-rail (logo đại lý 1:1 + 3 ribbon đỏ wine clip-path)
  //  - Subtitle italic serif (tagline) viền dưới ink
  //  - 4-col main grid: LÝ LỊCH | NGƯỜI ĐẠI DIỆN | SỐ LIỆU | TIÊU ĐIỂM
  //  - 3 mini-cols (NĂNG LỰC, SẢN PHẨM&DV, CAM KẾT) + QUOTE box
  //  - PHÓNG SỰ HÌNH ẢNH (6 ảnh 3×2 = 3 team + 3 project) + ĐỐI TÁC sidebar
  //    Đối tác: up bao nhiêu logo hiện bấy nhiêu (flex wrap, không khung trống)
  //  - Footer: QR + cta italic | contact info (phone/email/address 2 hàng)
  // ============================================================
  function template3(data) {
    const x = prepareData(data);
    // Tabler-style line icons (inline SVG)
    const ic = {
      check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>`,
      clock:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></svg>`,
      home:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>`,
      phone:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></svg>`,
      mail:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>`,
      pin:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z"/><circle cx="12" cy="9" r="3"/></svg>`,
      user:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>`,
      photo:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>`,
    };

    // Hero image / avatar / partner thumbs
    const heroBox = has(x.imgs.hero)
      ? `<img src="${esc(x.imgs.hero)}" alt="Ảnh bìa đại lý">`
      : `<div class="t3-hero-ph"><span class="t3-ph-ic">${ic.photo}</span></div>`;

    const avatarBox = has(x.imgs.avatar_chu)
      ? `<img src="${esc(x.imgs.avatar_chu)}" alt="Ảnh chủ đại lý">`
      : `<span class="t3-ava-ic">${ic.user}</span>`;

    const logoBox = has(x.imgs.logo_dai_ly)
      ? `<img src="${esc(x.imgs.logo_dai_ly)}" alt="Logo đại lý">`
      : `<span class="t3-logo-txt">LOGO<br>ĐẠI LÝ<small>(1:1)</small></span>`;

    // 1 ô ảnh trong "PHÓNG SỰ HÌNH ẢNH" — ảnh 4:3 + caption
    const photoCell = (url, label) => `
      <div class="t3-pcell">
        <div class="t3-pimg">${has(url)
          ? `<img src="${esc(url)}" alt="${esc(label)}">`
          : `<span class="t3-ph-ic">${ic.photo}</span>`}</div>
        <div class="t3-pcap">
          <span class="t3-pcap-lbl">${escMulti(label)}</span>
        </div>
      </div>`;

    // Đối tác: up bao nhiêu logo hiện bấy nhiêu (không render khung trống)
    const partnerGridHtml = x.partnerLogos.length
      ? `<div class="t3-pt-grid">${x.partnerLogos.map(u =>
          `<div class="t3-pt-logo has-img"><img src="${esc(u)}" alt="Logo đối tác"></div>`
        ).join('')}</div>`
      : '';

    return `
      <section class="profile-page tpl-3-v2">

        <!-- ============ MASTHEAD: left stack (title + hero) | side-rail (logo + 3 ribbon) ============ -->
        <div class="t3-masthead">
          <div class="t3-mast-left">
            <h1 class="t3-nameplate">${esc(x.titleRaw)}</h1>
            <div class="t3-hero-img">${heroBox}</div>
          </div>
          <aside class="t3-side-rail">
            <div class="t3-rail-logo ${has(x.imgs.logo_dai_ly) ? 'has-img' : ''}">${logoBox}</div>
            <div class="t3-ribbon">${ic.check}<span>${esc(x.b1)}</span></div>
            <div class="t3-ribbon">${ic.clock}<span>${esc(x.b2)}</span></div>
            <div class="t3-ribbon">${ic.home}<span>${esc(x.b3)}</span></div>
          </aside>
        </div>

        <!-- ============ SUBTITLE italic serif (tagline) ============ -->
        <div class="t3-subtitle">${escMulti(x.tagline)}</div>

        <!-- ============ 4-COL MAIN GRID ============ -->
        <div class="t3-main-grid">

          <!-- COL 1: LÝ LỊCH ĐẠI LÝ (info table) -->
          <div class="t3-col">
            <div class="t3-col-title">LÝ LỊCH ĐẠI LÝ</div>
            <table class="t3-info">
              <tr><td class="t3-lbl">Tên đại lý:</td><td class="t3-val">${esc(x.titleRaw)}</td></tr>
              <tr><td class="t3-lbl">Chủ đại lý:</td><td class="t3-val">${esc(x.ownerName)}</td></tr>
              <tr><td class="t3-lbl">Điện thoại:</td><td class="t3-val">${esc(x.ownerPhone)}</td></tr>
              <tr><td class="t3-lbl">Email:</td><td class="t3-val">${esc(x.ownerEmail)}</td></tr>
              <tr><td class="t3-lbl">Địa chỉ:</td><td class="t3-val">${esc(x.addrFull)}</td></tr>
              <tr><td class="t3-lbl">Khu vực:</td><td class="t3-val">${esc(x.coverage)}</td></tr>
              <tr><td class="t3-lbl">Giờ làm việc:</td><td class="t3-val">${escMulti(x.hours)}</td></tr>
              <tr><td class="t3-lbl">Kinh nghiệm:</td><td class="t3-val">${esc(x.exp)} năm</td></tr>
              <tr><td class="t3-lbl">Quy mô:</td><td class="t3-val">${esc(x.team)}</td></tr>
              <tr><td class="t3-lbl">Dự án/tháng:</td><td class="t3-val">${esc(x.projects)} công trình</td></tr>
            </table>
          </div>

          <!-- COL 2: NGƯỜI ĐẠI DIỆN -->
          <div class="t3-col t3-col-rep">
            <div class="t3-col-title">NGƯỜI ĐẠI DIỆN</div>
            <div class="t3-rep-photo">${avatarBox}</div>
            <div class="t3-rep-name">${esc(x.ownerName)}</div>
            <div class="t3-rep-role">Chủ đại lý</div>
            <div class="t3-rep-phone">${ic.phone}<span>${esc(x.ownerPhone)}</span></div>
          </div>

          <!-- COL 3: SỐ LIỆU NỔI BẬT (3 stat box) -->
          <div class="t3-col">
            <div class="t3-col-title">SỐ LIỆU NỔI BẬT</div>
            <div class="t3-stat-stack">
              <div class="t3-stat-box">
                <div class="t3-stat-num">${esc(x.m1v)}</div>
                <div class="t3-stat-lbl">${escMulti(x.m1l)}</div>
              </div>
              <div class="t3-stat-box">
                <div class="t3-stat-num">${esc(x.m2v)}</div>
                <div class="t3-stat-lbl">${escMulti(x.m2l)}</div>
              </div>
              <div class="t3-stat-box">
                <div class="t3-stat-num">${esc(x.m3v)}</div>
                <div class="t3-stat-lbl">${escMulti(x.m3l)}</div>
              </div>
            </div>
          </div>

          <!-- COL 4: TIÊU ĐIỂM (3 highlight rows) -->
          <div class="t3-col">
            <div class="t3-col-title">TIÊU ĐIỂM</div>
            <div class="t3-hl-list">
              <div class="t3-hl-row">
                <span class="t3-hl-num">01</span>
                <span class="t3-hl-text">${escMulti(x.hl1)}</span>
              </div>
              <div class="t3-hl-row">
                <span class="t3-hl-num">02</span>
                <span class="t3-hl-text">${escMulti(x.hl2)}</span>
              </div>
              <div class="t3-hl-row">
                <span class="t3-hl-num">03</span>
                <span class="t3-hl-text">${escMulti(x.hl3)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ 3 MINI-COLS + QUOTE ============ -->
        <div class="t3-three-grid">
          <div class="t3-mini-col">
            <div class="t3-mc-title">NĂNG LỰC</div>
            <ul>${x.uspLines.map(li => `<li>${escMulti(li)}</li>`).join('')}</ul>
          </div>
          <div class="t3-mini-col">
            <div class="t3-mc-title">SẢN PHẨM &amp; DỊCH VỤ</div>
            <ul>${x.serviceLines.map(li => `<li>${escMulti(li)}</li>`).join('')}</ul>
          </div>
          <div class="t3-mini-col">
            <div class="t3-mc-title">CAM KẾT</div>
            <ul>${x.commitLines.map(li => `<li>${escMulti(li)}</li>`).join('')}</ul>
          </div>
          <div class="t3-quote-box">
            <div class="t3-qmark">"</div>
            <div class="t3-qtext">${escMulti(x.quote)}</div>
            <div class="t3-qsrc">— <span class="t3-qname">Khách hàng</span></div>
          </div>
        </div>

        <!-- ============ PHÓNG SỰ HÌNH ẢNH + ĐỐI TÁC SIDEBAR ============ -->
        <div class="t3-section-title">PHÓNG SỰ HÌNH ẢNH</div>
        <div class="t3-photo-wrap">
          <div class="t3-photo-grid">
            ${photoCell(x.imgs.doi_ngu_1, x.tcDoiNgu1)}
            ${photoCell(x.imgs.kho_xuong, x.tcKhoXuong)}
            ${photoCell(x.imgs.doi_ngu_2, x.tcDoiNgu2)}
            ${photoCell(x.imgs.cong_trinh_1, x.pc1)}
            ${photoCell(x.imgs.cong_trinh_2, x.pc2)}
            ${photoCell(x.imgs.cong_trinh_3, x.pc3)}
          </div>
          <aside class="t3-partners-card">
            <div class="t3-pt-title">ĐỐI TÁC</div>
            <div class="t3-pt-desc">${escMulti(x.partnersTitle)}</div>
            ${partnerGridHtml}
          </aside>
        </div>

        <!-- ============ FOOTER: QR (box + cta italic) | CONTACT (phone/email/addr) ============ -->
        <footer class="t3-footer">
          <div class="t3-fqr">
            ${has(x.imgs.qr_code)
              ? `<img src="${esc(x.imgs.qr_code)}" alt="QR">`
              : `<div class="t3-fqr-ph"></div>`}
          </div>
          <div class="t3-fqr-text">${escMulti(x.cta)} <span class="t3-arrow">►</span></div>
          <div class="t3-fcontact">
            <div class="t3-fc-row">
              <span class="t3-fc-it">${ic.phone}${esc(x.ownerPhone)}</span>
              <span class="t3-fc-sep">|</span>
              <span class="t3-fc-it">${ic.mail}${esc(x.ownerEmail)}</span>
            </div>
            <div class="t3-fc-row t3-fc-row-addr">
              <span class="t3-fc-it">${ic.pin}${esc(x.addrFull)}</span>
            </div>
            <div class="t3-fc-work">Làm việc: ${escMulti(x.hours)}</div>
          </div>
        </footer>
      </section>`;
  }

  // ============================================================
  // MẪU 4 — Compact Pamphlet (white + red accent, multi-section)
  // ============================================================
  function template4(data) {
    const x = prepareData(data);
    return `
      <section class="profile-page tpl-4-v2">
        <header class="t4-hdr">
          <div class="t4-hdr-logo ${has(x.imgs.logo_dai_ly) ? 'has-img' : ''}">${has(x.imgs.logo_dai_ly) ? `<img src="${esc(x.imgs.logo_dai_ly)}">` : `<div class="t4-no-logo">LOGO</div>`}</div>
          <div class="t4-hdr-mid">
            <div class="t4-hdr-eyebrow">SỐ ĐL CODE · TEMPLATE 4</div>
            <h1>${esc(x.titleRaw)}</h1>
            <p>${esc(x.tagline)}</p>
            <div class="t4-banner-buttons">
              <span>KHẢO SÁT 24/7</span>
              <span>BÁO GIÁ CHÍNH XÁC TRONG 24H</span>
            </div>
          </div>
          <div class="t4-hdr-right">
            <div class="t4-code">${esc(x.dealerCode || '—')}</div>
          </div>
        </header>

        <div class="t4-row-products">
          <div class="t4-sec-h-red">SẢN PHẨM CHÍNH</div>
          <ul class="t4-prod-list">
            ${x.serviceLines.slice(0, 6).map(s => `<li>${esc(s)}</li>`).join('')}
          </ul>
        </div>

        <div class="t4-row1">
          <div class="t4-tieubieu">
            <div class="t4-sec-h">TIÊU BIỂU</div>
            <div class="t4-thumbs">
              <div class="t4-thumb">${pImg(x.imgs.cong_trinh_1, x.pc1)}<span>${escMulti(x.pc1)}</span></div>
              <div class="t4-thumb">${pImg(x.imgs.cong_trinh_2, x.pc2)}<span>${escMulti(x.pc2)}</span></div>
              <div class="t4-thumb">${pImg(x.imgs.cong_trinh_3, x.pc3)}<span>${escMulti(x.pc3)}</span></div>
            </div>
          </div>
        </div>

        <div class="t4-kpi-strip">
          <div class="t4-kpi"><b>${esc(x.m1v)}</b><span>${esc(x.m1l)}</span></div>
          <div class="t4-kpi"><b>${esc(x.m2v)}</b><span>${esc(x.m2l)}</span></div>
          <div class="t4-kpi"><b>${esc(x.exp)} năm</b><span>Kinh nghiệm</span></div>
          <div class="t4-kpi"><b>${esc(x.team)}</b><span>Đội ngũ</span></div>
          <div class="t4-kpi"><b>${esc(x.projects)}</b><span>Dự án / tháng</span></div>
          <div class="t4-kpi"><b>${esc(x.m3v)}</b><span>${esc(x.m3l)}</span></div>
        </div>

        <div class="t4-row2">
          <div class="t4-card t4-commit">
            <div class="t4-sec-h-red">CAM KẾT RÕ RÀNG</div>
            <ul>${x.commitLines.slice(0, 5).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
          <div class="t4-card t4-nangluc">
            <div class="t4-sec-h-red">NĂNG LỰC VƯỢT TRỘI</div>
            <ul>${x.uspLines.slice(0, 5).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
        </div>

        <div class="t4-row3">
          <div class="t4-block">
            <div class="t4-sec-h">VỀ CƠ SỞ</div>
            <div class="t4-co-info">
              <div>📍 ${esc(x.addrFull)}</div>
              <div>🏘 Khu vực ${esc(x.coverage)}</div>
              <div>🕐 Mở cửa ${esc(x.hours)}</div>
              <div>📅 ${esc(x.exp)} năm kinh nghiệm</div>
            </div>
            <div class="t4-co-img">${pImg(x.imgs.kho_xuong, 'Kho/xưởng')}</div>
          </div>
          <div class="t4-block">
            <div class="t4-sec-h">VỀ ĐỘI NGŨ</div>
            <div class="t4-team-imgs">
              <div class="t4-team-it">${pImg(x.imgs.doi_ngu_1, 'Đội ngũ 1')}<span>${escMulti(x.tcDoiNgu1)}</span></div>
              <div class="t4-team-it">${pImg(x.imgs.doi_ngu_2, 'Đội ngũ 2')}<span>${escMulti(x.tcDoiNgu2)}</span></div>
            </div>
          </div>
        </div>

        <div class="t4-row-bottom">
          <div class="t4-owner-card">
            <div class="t4-owner-avatar">${has(x.imgs.avatar_chu) ? `<img src="${esc(x.imgs.avatar_chu)}">` : SVG.user}</div>
            <div class="t4-owner-info">
              <div class="t4-owner-n">${esc(x.ownerName)}</div>
              <div>📞 ${esc(x.ownerPhone)}</div>
              <div>✉ ${esc(x.ownerEmail)}</div>
            </div>
          </div>
          <div class="t4-qr-card">
            <div class="t4-qr">${has(x.imgs.qr_code) ? `<img src="${esc(x.imgs.qr_code)}">` : `<span>QR</span>`}</div>
            <div class="t4-qr-text">QUÉT QR ĐỂ XEM THÊM<br>${esc(x.cta)}</div>
          </div>
        </div>

        <!-- Đối tác chiến lược -->
        <div class="t4-partners">
          <div class="t4-partners-title">${esc(x.partnersTitle)}</div>
          <div class="t4-partners-grid">
            ${x.partnerLogos.length
              ? x.partnerLogos.map(u => `<div class="t4-partner"><img src="${esc(u)}" alt="Logo đối tác"></div>`).join('')
              : Array.from({length: 5}).map(() => `<div class="t4-partner empty"><span>LOGO ĐỐI TÁC</span></div>`).join('')
            }
          </div>
        </div>
      </section>`;
  }

  // T5 vẫn clone T1 (đợi designer)
  function template5(data) { return template1(data); }

  global.ProfileTemplates = {
    renderers: { t1: template1, t2: template2, t3: template3, t4: template4, t5: template5 },
    labels: {
      t1: 'Cổ điển (navy + xanh)',
      t2: 'Tech Modern (cyan + lime)',
      t3: 'Bản tin (cream + wine)',
      t4: 'Compact (white + red)',
      t5: 'Cao cấp (đang đợi)',
    },
    render(key, data) {
      const fn = this.renderers[key] || this.renderers.t1;
      return fn(data);
    },
  };
})(window);
