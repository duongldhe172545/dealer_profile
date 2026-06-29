// Hồ sơ đại lý – render template (Mẫu 1/2/3). Whitelabel theo brand colors.
// Preview/PDF tự co theo kích thước gốc của từng mẫu (xem profile.html setupAutoFit/printProfile).
//
// ════════════════════════ LUẬT MÀU (đọc trước khi sửa template) ════════════════════════
// Mỗi template chỉ có 2 màu do đại lý chọn: C1 = brand_primary, C2 = brand_secondary.
//   • C1 (chính)  → ĐIỂM NHẤN: title bar, tiêu đề mục, icon, nút/chip, viền+đầu QR,
//                   tag trên ảnh, số liệu nhấn, gạch chân.
//   • C2 (phụ)    → MẢNG NỀN LỚN thương hiệu: header tối, thanh liên hệ, sidebar, pill.
//   • NEUTRAL CỐ ĐỊNH (xám) → KHÔNG bao giờ nhuộm theo brand: nền trang, card trắng/xám,
//                   ô ảnh placeholder, chữ body. Dùng thang xám trung tính.
//   • NỀN PANEL NHẠT cần tô (ô năng lực, card KPI, ô quote, chip ưu điểm, viền đối tác)
//                   → SINH TẠI CHỖ từ brand bằng brandTint(C1, ratio). TUYỆT ĐỐI không
//                   hardcode 1 màu xanh/cam cụ thể (đó là lý do đổi màu bị "lố").
//   Quy ước ratio dùng trong file: tintBg≈.06 (nền panel), tintLine≈.16 (kẻ trong panel),
//   tintEdge≈.34 (viền thấy rõ). Tất cả là hex đặc → render đồng nhất PDF/web.
// ═══════════════════════════════════════════════════════════════════════════════════════
(function (global) {
  // ── Helpers màu dùng chung cho mọi template + cho picker (profile.html) ──
  function _hx2rgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || ''));
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }
  // Trộn màu brand lên nền trắng theo tỉ lệ (0..1) → hex đặc. ratio nhỏ = nhạt.
  function brandTint(hex, ratio) {
    const c = _hx2rgb(hex);
    if (!c) return '#ffffff';
    const f = (n) => Math.round(255 * (1 - ratio) + n * ratio).toString(16).padStart(2, '0');
    return `#${f(c.r)}${f(c.g)}${f(c.b)}`;
  }
  function _lum(c) {
    const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  // Tỉ lệ tương phản WCAG giữa 2 hex (1 = giống hệt, 21 = đen/trắng).
  function contrastRatio(a, b) {
    const x = _hx2rgb(a), y = _hx2rgb(b);
    if (!x || !y) return 1;
    const l1 = _lum(x), l2 = _lum(y);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  // ════════════════════════════════════════════════════════════════════
  // Mẫu 1 (THE ANH WINDOWS Style) — FULL: 5 công trình + 4 sản phẩm + 1 đội ngũ
  // Thiết kế theo Template_ho_so_1/ho_so_1.html. Khổ gốc 1190px (gần vuông).
  // ════════════════════════════════════════════════════════════════════
  function template1({ dealer = {}, profile = {}, images = {} }) {
    const esc = (v = '') => String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const lines = (v = '') => String(v).split(/\n+/).map(x => x.trim()).filter(Boolean);

    const C1 = profile.brand_primary   || '#1a9d44';  // xanh lá accent
    const C2 = profile.brand_secondary || '#1c1c1c';  // tối (sidebar/bar)
    const tintBg = brandTint(C1, 0.06), tintEdge = brandTint(C1, 0.30);  // panel nhạt theo brand

    // ── Data ──
    const name  = dealer.ten_dai_ly  || 'Tên Đại Lý';
    const tag   = profile.tagline    || 'Thông điệp định vị (tagline)';
    const rep   = dealer.chu_dai_ly  || '—';
    const phone = dealer.phone       || '0900 000 000';
    const addr  = dealer.address     || 'Địa chỉ đại lý';
    const exp   = dealer.years_experience || '—';
    const team  = dealer.team_size        || '—';
    const proj  = dealer.projects_monthly || '—';
    const advs = [
      profile.usp_highlight1 || 'Ưu điểm 1',
      profile.usp_highlight2 || 'Ưu điểm 2',
      profile.usp_highlight3 || 'Ưu điểm 3',
    ];
    const kpis = [
      { v: profile.metric1_value || 'KPI 1', l: profile.metric1_label || 'Chú thích' },
      { v: profile.metric2_value || 'KPI 2', l: profile.metric2_label || 'Chú thích' },
      { v: profile.metric3_value || 'KPI 3', l: profile.metric3_label || 'Chú thích' },
    ];
    const nangluc = lines(profile.usp_text || 'Năng lực nổi bật 1\nNăng lực nổi bật 2\nNăng lực nổi bật 3\nNăng lực nổi bật 4').slice(0, 5);
    const quote = profile.customer_quote || 'Nhận xét / phản hồi của khách hàng…';
    const ctCap = i => profile['project_caption' + i] || ('Công trình ' + i);
    const spCap = i => profile['product_caption' + i] || ('Sản phẩm ' + i);

    // ── Icons (stroke set qua CSS) ──
    const ICON = {
      build: '<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      box: '<svg viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
      team: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      chat: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
      brief: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    };
    const camIcon = '<svg viewBox="0 0 24 24" class="t1-camico"><rect x="2" y="5" width="20" height="15" rx="2"/><circle cx="8" cy="11" r="2.4"/><path d="M2 17l6-5 5 4 3.5-3 5.5 4.5"/></svg>';

    // ── Helpers ──
    const logo = images.logo_dai_ly
      ? `<img src="${esc(images.logo_dai_ly)}" alt="Logo" class="t1-logo-img">`
      : `<div class="t1-logo-fb">${esc(name.substring(0, 3).toUpperCase())}</div>`;

    const qr = images.qr_code
      ? `<img src="${esc(images.qr_code)}" alt="QR">`
      : `<svg viewBox="0 0 25 25" shape-rendering="crispEdges"><rect width="25" height="25" fill="#fff"/><g fill="#1c1c1c"><rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/><rect x="18" y="0" width="7" height="7"/><rect x="19" y="1" width="5" height="5" fill="#fff"/><rect x="20" y="2" width="3" height="3"/><rect x="0" y="18" width="7" height="7"/><rect x="1" y="19" width="5" height="5" fill="#fff"/><rect x="2" y="20" width="3" height="3"/><rect x="10" y="10" width="2" height="2"/><rect x="14" y="12" width="2" height="2"/><rect x="11" y="15" width="2" height="2"/><rect x="16" y="17" width="2" height="2"/><rect x="19" y="11" width="2" height="2"/><rect x="9" y="3" width="1" height="1"/><rect x="13" y="5" width="1" height="1"/></g></svg>`;

    const cell = (src, cap) =>
      `<div class="t1-cell"><div class="t1-photo${src ? '' : ' ph'}"${src ? ` style="background-image:url('${esc(src)}')"` : ''}>${src ? '' : camIcon}</div><div class="t1-cap">${esc(cap)}</div></div>`;

    const pLogo = (src) => src
      ? `<div class="t1-plogo"><img src="${esc(src)}" alt=""></div>`
      : `<div class="t1-plogo"><svg class="t1-plogo-ic" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M3 17l5-4 4 3 3-2 6 5"/></svg></div>`;

    const css = `
      .t1-root{font-family:'Be Vietnam Pro',system-ui,sans-serif;width:1190px;background:#fff;color:#1d1d1d;position:relative;display:grid;grid-template-columns:234px 1fr;grid-template-rows:234px 1fr;overflow:hidden}
      .t1-root *{box-sizing:border-box;margin:0;padding:0}
      .t1-logobox{grid-column:1;grid-row:1;display:flex;align-items:center;justify-content:center;border-right:1px solid #e6e6e6;border-bottom:1px solid #e6e6e6;padding:18px}
      .t1-logo-img{max-width:178px;max-height:178px;object-fit:contain}
      .t1-logo-fb{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:56px;color:${C1};letter-spacing:-1px}
      .t1-header{grid-column:2;grid-row:1;position:relative;overflow:hidden;color:#fff;background:repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 1px,transparent 1px 64px),linear-gradient(115deg,${C2} 0%,${C2}cc 45%,${C2}80 100%)}
      .t1-htxt{position:relative;z-index:2;padding:34px 38px}
      .t1-h1{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:54px;line-height:1;letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px}
      .t1-sub{font-family:'Roboto Condensed',sans-serif;font-weight:500;font-size:23px;letter-spacing:1.5px;color:#e7e9e6;text-transform:uppercase}
      .t1-btns{margin-top:20px;display:flex;gap:12px;flex-wrap:wrap}
      .t1-btn{background:${C1};color:#fff;font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:15px;letter-spacing:1px;padding:9px 16px;border-radius:4px;text-transform:uppercase}
      .t1-tri{position:absolute;right:0;bottom:0;width:160px;height:120px;z-index:1;background:${C1};clip-path:polygon(100% 0,100% 100%,18% 100%)}
      .t1-sidebar{grid-column:1;grid-row:2;background:${C2};color:#fff;padding:22px 22px 26px;display:flex;flex-direction:column}
      .t1-slabel{font-size:11px;letter-spacing:1.5px;color:#8c8c8c;text-transform:uppercase;font-weight:600}
      .t1-sval{font-size:18px;font-weight:600;margin-top:3px;word-break:break-word}
      .t1-sval.sm{font-size:15px;line-height:1.35;font-weight:500}
      .t1-sblock{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.12)}
      .t1-sblock:first-of-type{padding-top:0}
      .t1-stat{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.12)}
      .t1-num{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:22px;line-height:1}
      .t1-cap2{font-size:11px;letter-spacing:.8px;color:#8c8c8c;text-transform:uppercase;font-weight:600;margin-top:4px}
      .t1-icosq{width:30px;height:30px;background:${C1};border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .t1-icosq svg{width:17px;height:17px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
      .t1-sphoto{margin:18px 0;height:118px;border-radius:5px;background:#3a3f42 center/cover no-repeat;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .t1-sphoto.ph{background:linear-gradient(135deg,#34393b,#4b5052 45%,#2c3032 70%,#3d4244)}
      .t1-camico{width:30px;height:30px;stroke:rgba(255,255,255,.5);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
      .t1-kpi{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.12)}
      .t1-kt{font-size:15px;font-weight:700}
      .t1-kc{font-size:11px;letter-spacing:1px;color:#8c8c8c;text-transform:uppercase;font-weight:600;margin-top:3px}
      .t1-check{width:26px;height:26px;border-radius:50%;background:${C1};display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .t1-check svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
      .t1-qr{margin-top:auto;background:${C2};border:2px solid ${C1};border-radius:8px;overflow:hidden}
      .t1-qrh{background:${C1};font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:18px;letter-spacing:1px;text-transform:uppercase;color:#fff;text-align:center;padding:9px 10px}
      .t1-qrbody{padding:14px;text-align:center}
      .t1-qrbox{background:#fff;width:124px;height:124px;margin:0 auto;border-radius:5px;padding:9px}
      .t1-qrbox img{display:block;width:100%;height:100%;object-fit:cover;border-radius:2px}
      .t1-qrbox svg{display:block;width:100%;height:100%}
      .t1-qrf{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:16px;letter-spacing:1px;text-transform:uppercase;margin-top:10px;color:#fff;text-align:center}
      .t1-main{grid-column:2;grid-row:2;background:#fff;padding:24px 30px 34px;position:relative;display:flex;flex-direction:column}
      .t1-bar{background:${C2};border-radius:8px;height:46px;display:flex;align-items:center;justify-content:space-between;padding:0 16px 0 20px;color:#fff}
      .t1-bar h2{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:20px;letter-spacing:1px;text-transform:uppercase}
      .t1-mt{margin-top:24px}
      .t1-bar-sm{height:42px}
      .t1-bar-sm h2{font-size:18px}
      .t1-cell{display:flex;flex-direction:column}
      .t1-photo{border-radius:5px;background:#dfe3e5 center/cover no-repeat;position:relative;overflow:hidden;flex:1;min-height:84px}
      .t1-photo.ph{background:linear-gradient(160deg,#dfe7ea,#f4f7f8 45%,#d3dadd 75%,#b3bbc0);display:flex;align-items:center;justify-content:center}
      .t1-photo.ph .t1-camico{stroke:rgba(0,0,0,.26);width:34px;height:34px}
      .t1-cap{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:15px;letter-spacing:.6px;text-transform:uppercase;text-align:center;padding-top:9px;color:#1d1d1d}
      .t1-projects{display:flex;gap:14px;height:344px;margin-top:14px}
      .t1-proj-left{flex:1.32;display:flex}
      .t1-proj-left .t1-cell{flex:1}
      .t1-proj-right{flex:2;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:14px}
      .t1-products{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:14px}
      .t1-products .t1-photo{height:170px;flex:none}
      .t1-bottom{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:18px}
      .t1-box{background:${tintBg};border:1px solid ${tintEdge};border-radius:8px;padding:18px 20px;margin-top:8px}
      .t1-li{display:flex;align-items:center;gap:11px;padding:6px 0;font-size:15px;font-weight:500;color:#2a2a2a}
      .t1-li svg{width:18px;height:18px;stroke:${C1};fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
      .t1-quote{font-style:italic;font-weight:600;color:${C1};font-size:18px;line-height:1.5;min-height:96px;display:flex;align-items:center}
      .t1-partners{display:flex;align-items:center;gap:16px;margin-top:auto;padding-top:24px}
      .t1-pill{background:${C2};color:#fff;border-radius:8px;height:84px;display:flex;align-items:center;padding:0 26px;font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:22px;letter-spacing:1px;text-transform:uppercase;flex-shrink:0}
      .t1-logos{flex:1;display:flex;gap:14px;position:relative;z-index:2}
      .t1-plogo{flex:1;background:#fff;border:1px solid #d8dde4;border-radius:8px;height:84px;display:flex;align-items:center;justify-content:center;padding:10px;overflow:hidden}
      .t1-plogo img{max-width:100%;max-height:100%;object-fit:contain}
      .t1-plogo-ic{width:38px;height:38px;stroke:#c2c8cf;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
      .t1-corner{position:absolute;right:0;bottom:0;width:140px;height:104px;z-index:1;background:${C1};clip-path:polygon(100% 0,100% 100%,16% 100%)}
    `;

    return `<div class="profile-page t1-root"><style>${css}</style>
      <div class="t1-logobox">${logo}</div>

      <div class="t1-header">
        <div class="t1-htxt">
          <h1 class="t1-h1">${esc(name)}</h1>
          <div class="t1-sub">${esc(tag)}</div>
          <div class="t1-btns">${advs.map(a => `<span class="t1-btn">${esc(a)}</span>`).join('')}</div>
        </div>
        <div class="t1-tri"></div>
      </div>

      <aside class="t1-sidebar">
        <div class="t1-sblock"><div class="t1-slabel">Người đại diện</div><div class="t1-sval">${esc(rep)}</div></div>
        <div class="t1-sblock"><div class="t1-slabel">Hotline</div><div class="t1-sval">${esc(phone)}</div></div>
        <div class="t1-sblock"><div class="t1-slabel">Địa chỉ</div><div class="t1-sval sm">${esc(addr)}</div></div>
        <div class="t1-stat"><div><div class="t1-num">${esc(exp)}</div><div class="t1-cap2">Năm kinh nghiệm</div></div><div class="t1-icosq">${ICON.brief}</div></div>
        <div class="t1-stat"><div><div class="t1-num">${esc(team)}</div><div class="t1-cap2">Quy mô đội ngũ</div></div><div class="t1-icosq">${ICON.team}</div></div>
        <div class="t1-stat"><div><div class="t1-num">${esc(proj)}</div><div class="t1-cap2">Dự án / tháng</div></div><div class="t1-icosq">${ICON.build}</div></div>
        <div class="t1-sphoto${images.doi_ngu_1 ? '' : ' ph'}"${images.doi_ngu_1 ? ` style="background-image:url('${esc(images.doi_ngu_1)}')"` : ''}>${images.doi_ngu_1 ? '' : camIcon}</div>
        ${kpis.map(k => `<div class="t1-kpi"><div><div class="t1-kt">${esc(k.v)}</div><div class="t1-kc">${esc(k.l)}</div></div><div class="t1-check">${ICON.check}</div></div>`).join('')}
        <div class="t1-qr">
          <div class="t1-qrh">QR Liên hệ</div>
          <div class="t1-qrbody">
            <div class="t1-qrbox">${qr}</div>
            <div class="t1-qrf">Tư vấn nhanh 24/7</div>
          </div>
        </div>
      </aside>

      <main class="t1-main">
        <div class="t1-bar"><h2>Công trình thực tế</h2><div class="t1-icosq">${ICON.build}</div></div>
        <div class="t1-projects">
          <div class="t1-proj-left">${cell(images.cong_trinh_1, ctCap(1))}</div>
          <div class="t1-proj-right">
            ${cell(images.cong_trinh_2, ctCap(2))}
            ${cell(images.cong_trinh_3, ctCap(3))}
            ${cell(images.cong_trinh_4, ctCap(4))}
            ${cell(images.cong_trinh_5, ctCap(5))}
          </div>
        </div>

        <div class="t1-bar t1-mt"><h2>Sản phẩm, dịch vụ</h2><div class="t1-icosq">${ICON.box}</div></div>
        <div class="t1-products">
          ${cell(images.san_pham_1, spCap(1))}
          ${cell(images.san_pham_2, spCap(2))}
          ${cell(images.san_pham_3, spCap(3))}
          ${cell(images.san_pham_4, spCap(4))}
        </div>

        <div class="t1-bottom">
          <div class="t1-col">
            <div class="t1-bar t1-bar-sm"><h2>Năng lực đội ngũ</h2><div class="t1-icosq">${ICON.team}</div></div>
            <div class="t1-box">${nangluc.map(n => `<div class="t1-li">${ICON.check} ${esc(n)}</div>`).join('')}</div>
          </div>
          <div class="t1-col">
            <div class="t1-bar t1-bar-sm"><h2>Khách hàng chia sẻ</h2><div class="t1-icosq">${ICON.chat}</div></div>
            <div class="t1-box"><div class="t1-quote">"${esc(quote)}"</div></div>
          </div>
        </div>

        <div class="t1-partners">
          <div class="t1-pill">Đối tác tin cậy</div>
          <div class="t1-logos">${pLogo(images.partner_logo_1)}${pLogo(images.partner_logo_2)}${pLogo(images.partner_logo_3)}</div>
        </div>

        <div class="t1-corner"></div>
      </main>
    </div>`;
  }

  // ════════════════════════════════════════════════════════════════════
  // Hồ sơ đại lý – Mẫu 2 (TNT 579 Style) — bản FULL: 5 công trình + 4 sản phẩm + 1 đội ngũ
  // Thiết kế theo Template_ho_so_2/template-2.html. Font Montserrat. Whitelabel theo brand colors.
  // Author ở khổ 794px (A4 @96dpi) để khớp preview/PDF (PAGE_W=794).
  // ════════════════════════════════════════════════════════════════════
  function template2({ dealer = {}, profile = {}, images = {} }) {
    const esc = (v = '') => String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const lines = (v = '') => String(v).split(/\n+/).map(x => x.trim()).filter(Boolean);
    const K = 794 / 595, s = n => +(n * K).toFixed(1);   // scale dim 595→794

    const C1 = profile.brand_primary   || '#f1611b';  // accent (cam)
    const C2 = profile.brand_secondary || '#252627';  // chữ đậm
    const tintBg = brandTint(C1, 0.07), tintEdge = brandTint(C1, 0.40);  // panel nhạt theo brand

    // ── Data ──
    const code  = dealer.dealer_code || '';
    const name  = dealer.ten_dai_ly  || 'Tên Đại Lý';
    const tag   = profile.tagline    || 'Thông điệp định vị (tagline)';
    const phone = dealer.phone       || '0900 000 000';
    const email = dealer.email       || 'email@dealer.vn';
    const addr  = dealer.address     || 'Địa chỉ đại lý';
    const exp   = dealer.years_experience || '—';
    const team  = dealer.team_size        || '—';
    const proj  = dealer.projects_monthly || '—';

    const kpis = [
      { v: profile.metric1_value || 'KPI 1', l: profile.metric1_label || 'CHÚ THÍCH' },
      { v: profile.metric2_value || 'KPI 2', l: profile.metric2_label || 'CHÚ THÍCH' },
      { v: profile.metric3_value || 'KPI 3', l: profile.metric3_label || 'CHÚ THÍCH' },
    ];
    const advs = [
      profile.usp_highlight1 || 'Ưu điểm nổi bật 1',
      profile.usp_highlight2 || 'Ưu điểm nổi bật 2',
      profile.usp_highlight3 || 'Ưu điểm nổi bật 3',
    ];
    const nangluc = lines(profile.usp_text || 'Năng lực nổi bật 1\nNăng lực nổi bật 2\nNăng lực nổi bật 3\nNăng lực nổi bật 4').slice(0, 4);
    const quote = profile.customer_quote || 'Nhận xét / phản hồi của khách hàng…';

    const ctCap = i => profile['project_caption' + i] || ('Công trình ' + i);
    const spCap = i => profile['product_caption' + i] || ('Sản phẩm ' + i);
    const teamCap = profile.team_caption_doi_ngu_1 || 'Ảnh đội ngũ';

    // ── Icons ──
    const camIcon = `<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="1.5"><rect x="2" y="5" width="24" height="18" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M2 19l6-5 5 4 4-3 9 7"/></svg>`;
    const checkIc = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 6l3 3 5-5"/></svg>`;
    const starIc  = `<svg viewBox="0 0 12 12" fill="none" stroke="${C1}" stroke-width="1.5"><path d="M6 1l1.2 2.5L10 4l-2 2 .5 2.8L6 7.5 3.5 8.8 4 6 2 4l2.8-.5z"/></svg>`;

    // ── Helpers ──
    const logo = images.logo_dai_ly
      ? `<img src="${esc(images.logo_dai_ly)}" alt="Logo">`
      : `<div style="text-align:center;font-weight:800;color:${C1};line-height:1.1">
           <div style="font-size:${s(26)}px">${esc(name.substring(0, 3).toUpperCase())}</div>
           ${code ? `<div style="font-size:${s(11)}px">${esc(code.replace(/^ĐL-/, ''))}</div>` : ''}
         </div>`;

    const qr = images.qr_code
      ? `<img src="${esc(images.qr_code)}" alt="QR">`
      : `<svg viewBox="0 0 40 40" fill="none" style="width:${s(40)}px;height:${s(40)}px;opacity:.3"><rect x="2" y="2" width="14" height="14" rx="1" stroke="#252627" stroke-width="2"/><rect x="5" y="5" width="8" height="8" fill="#252627"/><rect x="24" y="2" width="14" height="14" rx="1" stroke="#252627" stroke-width="2"/><rect x="27" y="5" width="8" height="8" fill="#252627"/><rect x="2" y="24" width="14" height="14" rx="1" stroke="#252627" stroke-width="2"/><rect x="5" y="27" width="8" height="8" fill="#252627"/><rect x="24" y="24" width="4" height="4" fill="#252627"/><rect x="32" y="24" width="4" height="4" fill="#252627"/><rect x="24" y="32" width="4" height="4" fill="#252627"/><rect x="32" y="32" width="4" height="4" fill="#252627"/></svg>`;

    const photo = (src, num, cap, cls = '') => `
      <div class="t2-photo ${cls}">
        ${src ? `<img class="t2-img" src="${esc(src)}" alt="${esc(cap)}">` : `<div class="t2-ph">${camIcon}</div>`}
        <div class="t2-ov"><span class="t2-loc">${esc(cap)}</span></div>
      </div>`;

    const pLogo = (src) => `<div class="t2-plogo">${src ? `<img src="${esc(src)}" alt="">` : `<div class="t2-plogo-ph"></div>`}</div>`;

    const css = `
      .t2-root{font-family:'Montserrat','Be Vietnam Pro',system-ui,sans-serif;width:${s(595)}px;min-height:${s(842)}px;background:#f4f5f6;color:${C2};position:relative}
      .t2-root *{box-sizing:border-box;margin:0;padding:0}
      .t2-header{height:${s(152)}px;background:#fff;display:flex;padding:${s(16)}px;border-bottom:1px solid #d6d9dc}
      .t2-namecard{display:flex;gap:${s(12)}px;flex:1;min-width:0}
      .t2-logo{width:${s(120)}px;min-width:${s(120)}px;height:${s(120)}px;background:#fff;border:1px solid #eef0f2;border-radius:${s(8)}px;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .t2-logo img{width:100%;height:100%;object-fit:contain}
      .t2-info{flex:1;min-width:0;display:flex;flex-direction:column}
      .t2-name{font-size:${s(22)}px;font-weight:700;color:${C2};line-height:1.1}
      .t2-tag{font-size:${s(12)}px;font-weight:600;color:${C1};margin-top:${s(7)}px}
      .t2-divider{height:1px;background:#b9bdc1;margin:${s(8)}px 0}
      .t2-contacts{display:flex;flex-direction:column;gap:${s(4)}px}
      .t2-citem{display:flex;align-items:flex-start;gap:${s(8)}px;font-size:${s(11)}px;font-weight:500;color:${C2};line-height:1.25}
      .t2-citem svg{width:${s(12)}px;height:${s(12)}px;flex-shrink:0;color:#8e9499;margin-top:${s(1)}px}
      .t2-qr{width:${s(66)}px;min-width:${s(66)}px;border:1px solid #d1d5dc;border-radius:${s(6)}px;overflow:hidden;display:flex;flex-direction:column;margin-left:${s(12)}px}
      .t2-qrlabel{background:#5a5a5a;padding:${s(4)}px ${s(6)}px;font-size:${s(8)}px;font-weight:700;color:#fff}
      .t2-qrinner{flex:1;padding:${s(4)}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${s(4)}px}
      .t2-qrimg{width:${s(56)}px;height:${s(56)}px;background:#fff;border-radius:${s(4)}px;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .t2-qrimg img{width:100%;height:100%;object-fit:contain}
      .t2-qrcap{font-size:${s(8)}px;font-weight:700;color:${C1};text-align:center;line-height:1.2}
      .t2-kpibar{height:${s(32)}px;background:#fff;display:flex;border-top:1px solid #d6d9dc;border-bottom:1px solid #d6d9dc}
      .t2-kpicell{flex:1;display:flex;align-items:center;justify-content:space-between;padding:0 ${s(12)}px;border-right:1px solid #d6d9dc}
      .t2-kpicell:last-child{border-right:none}
      .t2-kpilabel{font-size:${s(9)}px;font-weight:700;color:#8e9499;text-transform:uppercase}
      .t2-kpival{font-size:${s(12)}px;font-weight:700;color:${C1}}
      .t2-sechdr{display:flex;align-items:center;gap:${s(8)}px;padding:${s(12)}px ${s(16)}px ${s(8)}px}
      .t2-secicon{width:${s(20)}px;height:${s(20)}px;flex-shrink:0;color:${C1}}
      .t2-sectitle{font-size:${s(12)}px;font-weight:700;color:${C2};text-transform:uppercase;white-space:nowrap}
      .t2-secdiv{flex:1;height:1px;background:#b9bdc1}
      .t2-pad{padding:0 ${s(16)}px ${s(12)}px}
      .t2-gal5{display:flex;gap:${s(8)}px;height:${s(246)}px}
      .t2-photo{border-radius:${s(8)}px;overflow:hidden;position:relative;background:#d1d5dc;border:1px solid #d6d9dc}
      .t2-large{width:${s(277.5)}px;min-width:${s(277.5)}px}
      .t2-grid{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:${s(8)}px}
      .t2-img{width:100%;height:100%;object-fit:cover;display:block}
      .t2-ph{width:100%;height:100%;background:linear-gradient(135deg,#d1d5dc,#b0b8c1);display:flex;align-items:center;justify-content:center}
      .t2-ph svg{width:${s(28)}px;height:${s(28)}px;opacity:.4}
      .t2-ov{position:absolute;left:0;right:0;bottom:0;min-height:${s(40)}px;background:linear-gradient(to bottom,transparent,rgba(28,18,8,.85) 70%);display:flex;align-items:flex-end;justify-content:space-between;gap:${s(6)}px;padding:${s(6)}px ${s(10)}px}
      .t2-loc{font-size:${s(10)}px;font-weight:700;color:#fff;line-height:1.2}
      .t2-large .t2-loc{font-size:${s(14)}px}
      .t2-feats{display:flex;gap:${s(8)}px;margin-top:${s(6)}px}
      .t2-feat{flex:1;background:${tintBg};border:1px solid ${tintEdge};border-radius:${s(16)}px;padding:${s(5)}px ${s(6)}px;display:flex;align-items:center;justify-content:center;gap:${s(6)}px}
      .t2-feat svg{width:${s(12)}px;height:${s(12)}px;flex-shrink:0}
      .t2-feattxt{font-size:${s(10)}px;font-weight:600;color:${C1};text-align:center;line-height:1.2}
      .t2-gal4{display:flex;gap:${s(8)}px;height:${s(86)}px}
      .t2-gal4 .t2-photo{flex:1}
      .t2-brow{display:flex;gap:${s(8)}px;padding:0 ${s(16)}px ${s(12)}px;min-height:${s(112)}px}
      .t2-nlcard{flex:1;background:${tintBg};border:1px solid ${tintEdge};border-radius:${s(8)}px;padding:${s(10)}px ${s(13)}px;display:flex;flex-direction:column;gap:${s(8)}px}
      .t2-nlhdr{display:flex;align-items:center;gap:${s(6)}px}
      .t2-nlicon{width:${s(16)}px;height:${s(16)}px;background:${C1};border-radius:${s(4)}px;flex-shrink:0}
      .t2-nltitle{font-size:${s(12)}px;font-weight:700;color:${C1};text-transform:uppercase}
      .t2-nldiv{flex:1;height:1px;background:#5a5a5a;opacity:.3}
      .t2-nllist{display:flex;flex-direction:column;gap:${s(4)}px}
      .t2-nlitem{display:flex;align-items:center;gap:${s(6)}px;font-size:${s(10)}px;font-weight:700;color:#53575a;line-height:1.2}
      .t2-nlitem svg{width:${s(12)}px;height:${s(12)}px;flex-shrink:0;color:${C1}}
      .t2-anhcard{width:${s(277.5)}px;min-width:${s(277.5)}px;background:#fff;border:1px solid #d6d9dc;border-radius:${s(8)}px;overflow:hidden;display:flex}
      .t2-anhleft{width:${s(138.75)}px;min-width:${s(138.75)}px;position:relative;background:#d1d5dc}
      .t2-statsright{flex:1;display:flex;flex-direction:column}
      .t2-srow{flex:1;display:flex;align-items:center;gap:${s(8)}px;padding:0 ${s(10)}px;border-bottom:1px solid #f0f1f2}
      .t2-srow:last-child{border-bottom:none}
      .t2-srow svg{width:${s(16)}px;height:${s(16)}px;flex-shrink:0;color:#8e9499}
      .t2-sval{font-size:${s(12)}px;font-weight:700;color:${C1}}
      .t2-slbl{font-size:${s(8)}px;font-weight:700;color:#767676;text-transform:uppercase;line-height:1.2}
      .t2-bsec{display:flex;gap:${s(8)}px;padding:0 ${s(16)}px ${s(16)}px;min-height:${s(101)}px}
      .t2-qblock{flex:1;display:flex;flex-direction:column;gap:${s(6)}px}
      .t2-bhead{font-size:${s(12)}px;font-weight:700;color:${C2}}
      .t2-qbox{background:${tintBg};border:1px solid ${tintEdge};border-radius:${s(8)}px;padding:${s(10)}px ${s(13)}px;flex:1;display:flex;align-items:center}
      .t2-qtext{font-size:${s(10)}px;font-weight:600;font-style:italic;color:${C1};line-height:1.35}
      .t2-pblock{width:${s(164)}px;min-width:${s(164)}px;display:flex;flex-direction:column;gap:${s(6)}px}
      .t2-plogos{display:flex;gap:${s(4)}px;flex:1}
      .t2-plogo{flex:1;background:#fff;border:1px solid #d6d9dc;border-radius:${s(4)}px;display:flex;align-items:center;justify-content:center;padding:${s(8)}px ${s(4)}px;overflow:hidden}
      .t2-plogo img{max-width:100%;max-height:100%;object-fit:contain}
      .t2-plogo-ph{width:${s(32)}px;height:${s(20)}px;background:#e5e7eb;border-radius:${s(2)}px}
    `;

    return `<div class="profile-page t2-root"><style>${css}</style>

      <!-- HEADER -->
      <div class="t2-header">
        <div class="t2-namecard">
          <div class="t2-logo">${logo}</div>
          <div class="t2-info">
            <div class="t2-name">${esc(name)}</div>
            <div class="t2-tag">${esc(tag)}</div>
            <div class="t2-divider"></div>
            <div class="t2-contacts">
              <div class="t2-citem"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 2.5h2l1 2.5-1.5 1a7 7 0 003.5 3.5l1-1.5 2.5 1v2c0 .3-.2.5-.5.5A9 9 0 012 3c0-.3.2-.5.5-.5z"/></svg> ${esc(phone)}</div>
              <div class="t2-citem"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="2.5" width="9" height="7" rx="1"/><path d="M2 3l4 3 4-3"/></svg> ${esc(email)}</div>
              <div class="t2-citem"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 1C4.3 1 3 2.3 3 4c0 2 3 7 3 7s3-5 3-7c0-1.7-1.3-3-3-3z"/><circle cx="6" cy="4" r="1"/></svg> <span>${esc(addr)}</span></div>
            </div>
          </div>
        </div>
        <div class="t2-qr">
          <div class="t2-qrlabel">QR Liên hệ</div>
          <div class="t2-qrinner">
            <div class="t2-qrimg">${qr}</div>
            <div class="t2-qrcap">Tư vấn nhanh 24/7</div>
          </div>
        </div>
      </div>

      <!-- KPI BAR -->
      <div class="t2-kpibar">
        ${kpis.map(k => `<div class="t2-kpicell"><span class="t2-kpilabel">${esc(k.l)}</span><span class="t2-kpival">${esc(k.v)}</span></div>`).join('')}
      </div>

      <!-- CÔNG TRÌNH TIÊU BIỂU -->
      <div class="t2-sechdr">
        <svg class="t2-secicon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 10L10 3l7 7v7H3v-7z"/><rect x="7" y="13" width="6" height="7"/></svg>
        <span class="t2-sectitle">Công trình tiêu biểu</span>
        <div class="t2-secdiv"></div>
      </div>
      <div class="t2-pad">
        <div class="t2-gal5">
          ${photo(images.cong_trinh_1, 1, ctCap(1), 't2-large')}
          <div class="t2-grid">
            ${photo(images.cong_trinh_2, 2, ctCap(2))}
            ${photo(images.cong_trinh_3, 3, ctCap(3))}
            ${photo(images.cong_trinh_4, 4, ctCap(4))}
            ${photo(images.cong_trinh_5, 5, ctCap(5))}
          </div>
        </div>
        <div class="t2-feats">
          ${advs.map(a => `<div class="t2-feat">${starIc}<span class="t2-feattxt">${esc(a)}</span></div>`).join('')}
        </div>
      </div>

      <!-- SẢN PHẨM CHÍNH -->
      <div class="t2-sechdr" style="padding-top:${s(4)}px">
        <svg class="t2-secicon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2h8l2 4H4L6 2z"/><path d="M3 6h14v12H3z"/><path d="M8 10h4"/></svg>
        <span class="t2-sectitle">Sản phẩm chính</span>
        <div class="t2-secdiv"></div>
      </div>
      <div class="t2-pad">
        <div class="t2-gal4">
          ${photo(images.san_pham_1, 1, spCap(1))}
          ${photo(images.san_pham_2, 2, spCap(2))}
          ${photo(images.san_pham_3, 3, spCap(3))}
          ${photo(images.san_pham_4, 4, spCap(4))}
        </div>
      </div>

      <!-- ĐỘI NGŨ KỸ THUẬT -->
      <div class="t2-sechdr">
        <svg class="t2-secicon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="6" r="2.5"/><circle cx="13" cy="6" r="2.5"/><path d="M2 16c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M13 11c1.4 0 2.5 1.1 2.5 2.5V16"/></svg>
        <span class="t2-sectitle">Đội ngũ kỹ thuật</span>
        <div class="t2-secdiv"></div>
      </div>

      <!-- NĂNG LỰC + ẢNH ĐỘI NGŨ/STATS -->
      <div class="t2-brow">
        <div class="t2-nlcard">
          <div class="t2-nlhdr"><div class="t2-nlicon"></div><span class="t2-nltitle">Năng lực nổi bật</span><div class="t2-nldiv"></div></div>
          <div class="t2-nllist">
            ${nangluc.map(n => `<div class="t2-nlitem">${checkIc} ${esc(n)}</div>`).join('')}
          </div>
        </div>
        <div class="t2-anhcard">
          <div class="t2-anhleft">
            ${images.doi_ngu_1 ? `<img class="t2-img" src="${esc(images.doi_ngu_1)}" alt="${esc(teamCap)}">` : `<div class="t2-ph">${camIcon}</div>`}
            <div class="t2-ov"><span class="t2-loc">${esc(teamCap)}</span></div>
          </div>
          <div class="t2-statsright">
            <div class="t2-srow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M5 7h6M5 10h4"/></svg><div><div class="t2-sval">${esc(exp)}</div><div class="t2-slbl">Năm kinh nghiệm</div></div></div>
            <div class="t2-srow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="5" r="2"/><circle cx="11" cy="5" r="2"/><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M11 9c1.4 0 2.5 1.1 2.5 2.5V13"/></svg><div><div class="t2-sval">${esc(team)}</div><div class="t2-slbl">Quy mô đội ngũ</div></div></div>
            <div class="t2-srow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h10v10H3z"/><path d="M3 6h10M6 3v10"/></svg><div><div class="t2-sval">${esc(proj)}</div><div class="t2-slbl">Dự án / tháng</div></div></div>
          </div>
        </div>
      </div>

      <!-- KHÁCH HÀNG / ĐỐI TÁC -->
      <div class="t2-bsec">
        <div class="t2-qblock">
          <div class="t2-bhead">Khách hàng chia sẻ</div>
          <div class="t2-qbox"><p class="t2-qtext">"${esc(quote)}"</p></div>
        </div>
        <div class="t2-pblock">
          <div class="t2-bhead">Đối tác tin cậy</div>
          <div class="t2-plogos">
            ${pLogo(images.partner_logo_1)}${pLogo(images.partner_logo_2)}${pLogo(images.partner_logo_3)}
          </div>
        </div>
      </div>

    </div>`;
  }

  // ════════════════════════════════════════════════════════════════════
  // Mẫu 3 (TRƯỜNG THỊNH Style) — FULL: 5 công trình + 4 sản phẩm + 1 đội ngũ
  // Thiết kế theo Template_ho_so_3/template_ho_so_3.html. Khổ gốc 1180px.
  // Header tối + logo, thanh contact, body 2 cột. Whitelabel theo brand colors.
  // ════════════════════════════════════════════════════════════════════
  function template3({ dealer = {}, profile = {}, images = {} }) {
    const esc = (v = '') => String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const lines = (v = '') => String(v).split(/\n+/).map(x => x.trim()).filter(Boolean);

    const C1 = profile.brand_primary   || '#1d54ac';  // xanh dương accent
    const C2 = profile.brand_secondary || '#16356b';  // navy tối
    const tintBg = brandTint(C1, 0.06), tintLine = brandTint(C1, 0.16), tintEdge = brandTint(C1, 0.34);  // panel nhạt theo brand

    // ── Data ──
    const name  = dealer.ten_dai_ly  || 'Tên Đại Lý';
    const tag   = profile.tagline    || 'Thông điệp định vị (tagline)';
    const rep   = dealer.chu_dai_ly  || '—';
    const phone = dealer.phone       || '0900 000 000';
    const addr  = dealer.address     || 'Địa chỉ đại lý';
    const exp   = dealer.years_experience || '—';
    const team  = dealer.team_size        || '—';
    const proj  = dealer.projects_monthly || '—';
    const advs = [
      profile.usp_highlight1 || 'Ưu điểm 1',
      profile.usp_highlight2 || 'Ưu điểm 2',
      profile.usp_highlight3 || 'Ưu điểm 3',
    ];
    const kpis = [
      { v: profile.metric1_value || 'KPI 1', l: profile.metric1_label || 'Chú thích' },
      { v: profile.metric2_value || 'KPI 2', l: profile.metric2_label || 'Chú thích' },
      { v: profile.metric3_value || 'KPI 3', l: profile.metric3_label || 'Chú thích' },
    ];
    const nangluc = lines(profile.usp_text || 'Năng lực nổi bật 1\nNăng lực nổi bật 2\nNăng lực nổi bật 3\nNăng lực nổi bật 4').slice(0, 4);
    const quote = profile.customer_quote || 'Nhận xét / phản hồi của khách hàng…';
    const ctCap = i => profile['project_caption' + i] || ('Công trình ' + i);
    const spCap = i => profile['product_caption' + i] || ('Sản phẩm ' + i);

    const ICON = {
      brief: '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      team: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      build: '<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
      kcheck: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    };
    const camIcon = '<svg class="t3-cam" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="9" cy="12" r="2.4"/><path d="M3 16l5-4 4 3 3-2 6 5"/></svg>';

    const logo = images.logo_dai_ly
      ? `<img src="${esc(images.logo_dai_ly)}" alt="Logo">`
      : `<div class="t3-logo-fb">${esc(name.substring(0, 3).toUpperCase())}</div>`;

    const qr = images.qr_code
      ? `<img src="${esc(images.qr_code)}" alt="QR">`
      : `<svg viewBox="0 0 25 25" shape-rendering="crispEdges"><rect width="25" height="25" fill="#fff"/><g fill="${C1}"><rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/><rect x="18" y="0" width="7" height="7"/><rect x="19" y="1" width="5" height="5" fill="#fff"/><rect x="20" y="2" width="3" height="3"/><rect x="0" y="18" width="7" height="7"/><rect x="1" y="19" width="5" height="5" fill="#fff"/><rect x="2" y="20" width="3" height="3"/><rect x="10" y="10" width="2" height="2"/><rect x="14" y="12" width="2" height="2"/><rect x="11" y="15" width="2" height="2"/><rect x="16" y="17" width="2" height="2"/><rect x="19" y="11" width="2" height="2"/><rect x="9" y="3" width="1" height="1"/><rect x="13" y="5" width="1" height="1"/></g></svg>`;

    const photo = (src, cap) =>
      `<div class="t3-ph${src ? '' : ' t3-ph-e'}"${src ? ` style="background-image:url('${esc(src)}')"` : ''}>${src ? '' : camIcon}<span class="t3-tag">${esc(cap)}</span></div>`;

    const pLogo = (src) => src
      ? `<div class="t3-adg"><img src="${esc(src)}" alt=""></div>`
      : `<div class="t3-adg"><svg class="t3-adg-ic" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M3 17l5-4 4 3 3-2 6 5"/></svg></div>`;

    const css = `
      .t3-root{font-family:'Be Vietnam Pro',system-ui,sans-serif;width:1180px;background:#e7e9ed;color:#222;position:relative;overflow:hidden}
      .t3-root *{box-sizing:border-box;margin:0;padding:0}
      .t3-top{position:relative;height:340px;color:#fff;overflow:hidden;background:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,transparent 1px 74px),repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 1px,transparent 1px 55px),linear-gradient(115deg,${C2} 0%,${C2}d9 52%,${C2}a6 100%)}
      .t3-logo-tail{position:absolute;left:262px;top:30px;width:150px;height:212px;background:${C1};z-index:3;clip-path:polygon(0 0,100% 0,52% 100%,0 100%);opacity:.95}
      .t3-logo-wrap{position:absolute;left:32px;top:30px;z-index:5}
      .t3-logo{width:250px;height:250px;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .t3-logo img{max-width:250px;max-height:250px;object-fit:contain}
      .t3-logo-fb{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:64px;color:${C1}}
      .t3-topcenter{position:absolute;left:470px;top:58px;right:236px;z-index:6}
      .t3-h1{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:56px;line-height:.96;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;text-shadow:0 3px 14px rgba(0,0,0,.45)}
      .t3-slogan{font-family:'Roboto Condensed',sans-serif;font-weight:500;font-size:25px;letter-spacing:2px;color:#eaf0f8;text-transform:uppercase;text-shadow:0 2px 10px rgba(0,0,0,.4)}
      .t3-adbtns{margin-top:22px;display:flex;gap:14px;flex-wrap:wrap}
      .t3-adbtn{border:2px solid rgba(255,255,255,.7);background:rgba(255,255,255,.08);color:#fff;font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:17px;letter-spacing:1px;padding:9px 20px;border-radius:8px;text-transform:uppercase}
      .t3-qr{position:absolute;right:32px;top:116px;width:196px;background:#fff;border-radius:12px;overflow:hidden;z-index:20;box-shadow:0 12px 30px rgba(0,0,0,.35)}
      .t3-qh{background:${C1};color:#fff;text-align:center;font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:18px;letter-spacing:1px;padding:8px;text-transform:uppercase}
      .t3-qb{padding:14px 14px 10px;display:flex;justify-content:center}
      .t3-qbox{width:166px;height:166px;border-radius:4px;overflow:hidden}
      .t3-qbox img{width:100%;height:100%;object-fit:cover;display:block}
      .t3-qbox svg{width:100%;height:100%;display:block}
      .t3-qf{color:${C2};text-align:center;font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:18px;letter-spacing:1px;padding:0 0 12px;text-transform:uppercase}
      .t3-contact{background:${C2};color:#fff;display:flex;align-items:center;padding:18px 34px;position:relative;z-index:4}
      .t3-ci{padding-right:46px}
      .t3-ci .l{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:15px;letter-spacing:2px;color:rgba(255,255,255,.62);text-transform:uppercase;margin-bottom:3px}
      .t3-ci .v{font-weight:700;font-size:21px}
      .t3-ci.addr{flex:1}
      .t3-ci.addr .v{font-weight:600;font-size:20px}
      .t3-ci.owner{padding-right:230px}
      .t3-body{padding:24px;display:grid;grid-template-columns:1.72fr 1fr;gap:22px;align-items:start}
      .t3-col{display:flex;flex-direction:column;gap:22px}
      .t3-card{border-radius:18px;padding:22px}
      .t3-card.white{background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.06)}
      .t3-card.gray{background:linear-gradient(135deg,#888d95,#71767e)}
      .t3-ttl{display:flex;align-items:center;gap:16px;margin-bottom:20px}
      .t3-ttl h2{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:28px;letter-spacing:2px;text-transform:uppercase;white-space:nowrap}
      .t3-ttl .ln{flex:1;height:2px;background:currentColor;opacity:.4}
      .t3-card.white .t3-ttl{color:${C2}}
      .t3-card.gray .t3-ttl{color:#fff}
      .t3-ph{position:relative;border-radius:12px;overflow:hidden;background:#dfe3e8 center/cover no-repeat}
      .t3-ph.t3-ph-e{display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#e3e7ec,#cfd5db)}
      .t3-cam{width:42px;height:42px;stroke:#aab2bb;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
      .t3-tag{position:absolute;left:14px;bottom:14px;z-index:2;background:linear-gradient(135deg,${C1},${C2});color:#fff;font-weight:700;font-size:16px;padding:7px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.3)}
      .t3-proj-r1{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
      .t3-proj-r1 .t3-ph{height:250px}
      .t3-proj-r2{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
      .t3-proj-r2 .t3-ph{height:360px}
      .t3-nltop{display:grid;grid-template-columns:0.85fr 1.15fr;gap:18px;margin-bottom:18px}
      .t3-nlphoto{border-radius:12px;min-height:222px;position:relative;overflow:hidden;background:#33383c center/cover no-repeat;display:flex;align-items:center;justify-content:center}
      .t3-checks{background:${tintBg};border-radius:12px;padding:18px 22px;display:flex;flex-direction:column;justify-content:center;gap:14px}
      .t3-li{display:flex;align-items:center;gap:12px;font-weight:700;font-size:18px;color:${C1}}
      .t3-li svg{width:20px;height:20px;stroke:${C1};fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
      .t3-stats{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid rgba(255,255,255,.28);color:#fff}
      .t3-stat{display:flex;align-items:center;gap:12px;padding:18px 16px 4px;border-right:1px solid rgba(255,255,255,.22)}
      .t3-stat:last-child{border-right:0}
      .t3-stat .lab{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:15px;line-height:1.1;letter-spacing:1px;text-transform:uppercase;color:#eef0f3}
      .t3-stat .num{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:32px;margin-left:auto;line-height:1;color:#fff}
      .t3-stat svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.85;flex-shrink:0}
      .t3-share{display:flex;align-items:center;gap:24px;padding:6px 10px}
      .t3-share .lab{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:22px;letter-spacing:1px;color:#5b6068;text-transform:uppercase;line-height:1.15;white-space:nowrap}
      .t3-share .dv{width:2px;align-self:stretch;background:#c4c8cf}
      .t3-share .q{font-style:italic;font-weight:700;font-size:20px;color:${C1};line-height:1.5}
      .t3-kpicard{background:${tintBg};border-radius:18px;padding:8px 24px;box-shadow:0 6px 18px rgba(0,0,0,.06)}
      .t3-kpi{display:flex;align-items:center;justify-content:space-between;padding:22px 0;border-bottom:1px solid ${tintLine}}
      .t3-kpi:last-child{border-bottom:0}
      .t3-kpi .ck{font-family:'Roboto Condensed',sans-serif;font-weight:500;font-size:18px;letter-spacing:1px;color:#7a808a;text-transform:uppercase}
      .t3-kpi .rt{display:flex;align-items:center;gap:12px}
      .t3-kpi .kn{font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:26px;color:${C1};letter-spacing:1px}
      .t3-kpi svg{width:28px;height:28px;stroke:${C1};fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
      .t3-prods{display:flex;flex-direction:column;gap:16px}
      .t3-prods .t3-ph{height:152px}
      .t3-adgs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
      .t3-adg{background:#fff;border:1.5px solid ${tintEdge};border-radius:8px;height:74px;display:flex;align-items:center;justify-content:center;padding:8px;overflow:hidden}
      .t3-adg img{max-width:100%;max-height:100%;object-fit:contain}
      .t3-adg-ic{width:30px;height:30px;stroke:#c2c8cf;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
    `;

    return `<div class="profile-page t3-root"><style>${css}</style>

      <div class="t3-top">
        <div class="t3-logo-tail"></div>
        <div class="t3-logo-wrap"><div class="t3-logo">${logo}</div></div>
        <div class="t3-topcenter">
          <h1 class="t3-h1">${esc(name)}</h1>
          <div class="t3-slogan">${esc(tag)}</div>
          <div class="t3-adbtns">${advs.map(a => `<span class="t3-adbtn">${esc(a)}</span>`).join('')}</div>
        </div>
      </div>

      <div class="t3-qr">
        <div class="t3-qh">QR Liên hệ</div>
        <div class="t3-qb"><div class="t3-qbox">${qr}</div></div>
        <div class="t3-qf">Tư vấn 24/7</div>
      </div>

      <div class="t3-contact">
        <div class="t3-ci"><div class="l">Hotline</div><div class="v">${esc(phone)}</div></div>
        <div class="t3-ci addr"><div class="l">Địa chỉ</div><div class="v">${esc(addr)}</div></div>
        <div class="t3-ci owner"><div class="l">Chủ đại lý</div><div class="v">${esc(rep)}</div></div>
      </div>

      <div class="t3-body">
        <div class="t3-col">
          <div class="t3-card white">
            <div class="t3-ttl"><span class="ln"></span><h2>Công trình thực tế</h2><span class="ln"></span></div>
            <div class="t3-proj-r1">
              ${photo(images.cong_trinh_1, ctCap(1))}
              ${photo(images.cong_trinh_2, ctCap(2))}
            </div>
            <div class="t3-proj-r2">
              ${photo(images.cong_trinh_3, ctCap(3))}
              ${photo(images.cong_trinh_4, ctCap(4))}
              ${photo(images.cong_trinh_5, ctCap(5))}
            </div>
          </div>

          <div class="t3-card gray">
            <div class="t3-ttl"><span class="ln"></span><h2>Năng lực đội ngũ</h2><span class="ln"></span></div>
            <div class="t3-nltop">
              <div class="t3-nlphoto" ${images.doi_ngu_1 ? `style="background-image:url('${esc(images.doi_ngu_1)}')"` : ''}>${images.doi_ngu_1 ? '' : camIcon}</div>
              <div class="t3-checks">
                ${nangluc.map(n => `<div class="t3-li">${ICON.check} ${esc(n)}</div>`).join('')}
              </div>
            </div>
            <div class="t3-stats">
              <div class="t3-stat"><span class="lab">Năm kinh nghiệm</span><span class="num">${esc(exp)}</span>${ICON.brief}</div>
              <div class="t3-stat"><span class="lab">Quy mô đội ngũ</span><span class="num">${esc(team)}</span>${ICON.team}</div>
              <div class="t3-stat"><span class="lab">Dự án / tháng</span><span class="num">${esc(proj)}</span>${ICON.build}</div>
            </div>
          </div>

          <div class="t3-share">
            <div class="lab">Khách hàng<br>chia sẻ</div>
            <div class="dv"></div>
            <div class="q">"${esc(quote)}"</div>
          </div>
        </div>

        <div class="t3-col">
          <div class="t3-kpicard">
            ${kpis.map(k => `<div class="t3-kpi"><span class="ck">${esc(k.l)}</span><span class="rt"><span class="kn">${esc(k.v)}</span>${ICON.kcheck}</span></div>`).join('')}
          </div>

          <div class="t3-card gray">
            <div class="t3-ttl"><span class="ln"></span><h2>Sản phẩm</h2><span class="ln"></span></div>
            <div class="t3-prods">
              ${photo(images.san_pham_1, spCap(1))}
              ${photo(images.san_pham_2, spCap(2))}
              ${photo(images.san_pham_3, spCap(3))}
              ${photo(images.san_pham_4, spCap(4))}
            </div>
          </div>

          <div class="t3-card gray">
            <div class="t3-ttl"><span class="ln"></span><h2>Đối tác</h2><span class="ln"></span></div>
            <div class="t3-adgs">
              ${pLogo(images.partner_logo_1)}${pLogo(images.partner_logo_2)}${pLogo(images.partner_logo_3)}
            </div>
          </div>
        </div>
      </div>

    </div>`;
  }

  // ── Public API ──
  global.ProfileTemplates = {
    renderers: { t1: template1, t2: template2, t3: template3 },
    labels: { t1: 'Mẫu 1', t2: 'Mẫu 2', t3: 'Mẫu 3' },
    render(key, data) {
      return (this.renderers[key] || this.renderers.t1)(data);
    },
    brandTint, contrastRatio,   // dùng lại ở picker (profile.html)
  };
})(window);
