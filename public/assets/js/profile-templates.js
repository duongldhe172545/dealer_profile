// Hồ sơ đại lý – Mẫu 1 (Orange Edition)
// Thiết kế khớp ảnh tham chiếu template1hoso.jfif
// Font: Be Vietnam Pro (hỗ trợ tiếng Việt đầy đủ)
(function (global) {
  function template1({ dealer = {}, profile = {}, images = {} }) {
    const esc = (v = '') => String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const lines = (v = '') => String(v).split(/\n+/).map(x => x.trim()).filter(Boolean);

    // ── Colors (tất cả dựa trên 2 màu chủ đạo) ──
    const C1 = profile.brand_primary   || '#e57a2b';  // cam chủ đạo
    const C2 = profile.brand_secondary || '#333333';   // tối phụ

    // Màu phái sinh từ C2 (không hardcode)
    const C2light = C2 + 'cc';   // C2 mờ hơn cho viền, separator

    // ── Data ──
    const code  = dealer.dealer_code || 'ĐL-001';
    const name  = dealer.ten_dai_ly  || 'Tên Đại Lý';
    const tag   = profile.tagline    || 'Thông điệp định vị (tagline)';
    const phone = dealer.phone       || '0908 123 456';
    const email = dealer.email       || 'phat.ng@phatdat.vn';
    const addr  = dealer.address     || '123 Lý Thường Kiệt, Q. Hai Bà Trưng, Hà Nội';
    const exp   = dealer.years_experience || '8+';
    const team  = dealer.team_size        || '12';
    const proj  = dealer.projects_monthly || '35+';

    const adv1 = profile.usp_highlight1 || 'ƯU ĐIỂM 1';
    const adv2 = profile.usp_highlight2 || 'ƯU ĐIỂM 2';
    const adv3 = profile.usp_highlight3 || 'ƯU ĐIỂM 3';

    const kpi1V = profile.metric1_value || 'KPI 1', kpi1L = profile.metric1_label || 'CHÚ THÍCH';
    const kpi2V = profile.metric2_value || 'KPI 2', kpi2L = profile.metric2_label || 'CHÚ THÍCH';
    const kpi3V = profile.metric3_value || 'KPI 3', kpi3L = profile.metric3_label || 'CHÚ THÍCH';

    const services = lines(profile.services_text || 'Dòng sản phẩm nổi bật 1\nDòng sản phẩm nổi bật 2\nDòng sản phẩm nổi bật 3\nDịch vụ nổi bật 1\nDịch vụ nổi bật 2\nDịch vụ nổi bật 3').slice(0, 6);
    const usps  = lines(profile.usp_text || 'Năng lực nổi bật 1\nNăng lực nổi bật 2\nNăng lực nổi bật 3\nNăng lực nổi bật 4').slice(0, 4);
    const quote = profile.customer_quote || 'Tôi chọn vì thấy năng lực thật, ảnh thật, công trình thật và cách tư vấn rất rõ ràng.';

    // images
    const iLogo = images.logo_dai_ly || '', iQR = images.qr_code || '',
          iP1 = images.cong_trinh_1 || '', iP2 = images.cong_trinh_2 || '', iP3 = images.cong_trinh_3 || '',
          iT1 = images.doi_ngu_1 || '', iT2 = images.doi_ngu_2 || '',
          iPL1 = images.partner_logo_1 || '', iPL2 = images.partner_logo_2 || '', iPL3 = images.partner_logo_3 || '';
    const pCap1 = profile.project_caption1 || 'CÔNG TRÌNH 1',
          pCap2 = profile.project_caption2 || 'CÔNG TRÌNH 2',
          pCap3 = profile.project_caption3 || 'CÔNG TRÌNH 3';
    const tCap1 = profile.team_caption_doi_ngu_1 || 'ẢNH ĐỘI NGŨ 1',
          tCap2 = profile.team_caption_doi_ngu_2 || 'ẢNH ĐỘI NGŨ 2';

    // ── SVG Icons ──
    const ic = {
      phone: `<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      email: `<svg style="width:16px;height:16px;flex-shrink:0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      pin: `<svg style="width:16px;height:16px;flex-shrink:0;margin-top:2px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      camera: `<svg style="width:20px;height:20px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      team: `<svg style="width:20px;height:20px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      box: `<svg style="width:20px;height:20px;color:${C1}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      boxS: `<svg style="width:16px;height:16px;flex-shrink:0;margin-top:2px;color:${C1}" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      check: `<svg style="width:16px;height:16px;flex-shrink:0;margin-top:2px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    };

    // ── Helpers ──
    const logo = iLogo
      ? `<img src="${esc(iLogo)}" alt="Logo" style="width:100%;height:100%;object-fit:contain;display:block"/>`
      : `<div style="text-align:center;font-weight:800;line-height:1.15;color:#fff">
           <div style="font-size:32px;letter-spacing:-0.05em">${esc(name.substring(0, 3).toUpperCase())}</div>
           <div style="font-size:14px;font-weight:700;opacity:.85">— ${esc(code.replace(/^ĐL-/, ''))} —</div>
           <div style="font-size:7px;opacity:.6;letter-spacing:0.08em;margin-top:2px">KIẾN TẠO KHÔNG GIAN MỚI</div>
         </div>`;

    const qr = iQR
      ? `<img src="${esc(iQR)}" alt="QR" style="width:100%;height:100%;object-fit:contain;display:block"/>`
      : `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
           <svg style="width:36px;height:36px;color:${C2};opacity:.3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.75 6.75h.75v.75h-.75zM6.75 16.5h.75v.75h-.75zM16.5 6.75h.75v.75h-.75zM13.5 13.5h.75v.75h-.75zM13.5 19.5h.75v.75h-.75zM19.5 13.5h.75v.75h-.75zM19.5 19.5h.75v.75h-.75zM16.5 16.5h.75v.75h-.75z" stroke-linecap="round" stroke-linejoin="round"/></svg>
           <div style="font-size:8px;font-weight:600;color:${C2};opacity:.4;text-align:center;line-height:1.2">QR CODE</div>
         </div>`;

    // Photo card with gradient overlay + number
    const photoCard = (src, n, cap, h) => src
      ? `<div style="position:relative;border-radius:10px;overflow:hidden;height:${h}">
           <img src="${esc(src)}" alt="${esc(cap)}" style="width:100%;height:100%;object-fit:cover;display:block"/>
           <div style="position:absolute;bottom:0;left:0;right:0;padding:10px 12px;background:linear-gradient(to top,rgba(0,0,0,.75) 0%,transparent 100%)">
             <div style="color:${C1};font-weight:700;font-size:18px;line-height:1">${n}</div>
             <div style="color:#fff;font-size:12px;font-weight:600;text-transform:uppercase;margin-top:2px">${esc(cap)}</div>
           </div>
         </div>`
      : `<div style="border-radius:10px;height:${h};background:${C2};opacity:.08;border:2px dashed ${C2};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
           <div style="color:${C1};font-weight:700;font-size:18px;opacity:1">${n}</div>
           <div style="color:${C2};font-size:11px;font-weight:600;text-transform:uppercase;opacity:1">${esc(cap)}</div>
         </div>`;

    // Partner logo cell (dùng rgba cho nền, không dùng opacity trên parent)
    const pLogo = (src) => src
      ? `<div style="background:${C2}10;height:48px;flex:1;display:flex;align-items:center;justify-content:center;padding:4px;border-radius:6px"><img src="${esc(src)}" style="max-height:100%;max-width:100%;object-fit:contain" alt=""/></div>`
      : `<div style="background:${C2}10;height:48px;flex:1;display:flex;align-items:center;justify-content:center;padding:4px;border-radius:6px">
           <div style="text-align:center;font-weight:800;line-height:1;transform:scale(.75);color:${C2}">
             <div style="font-size:20px;letter-spacing:-0.05em">${esc(name.substring(0, 3).toUpperCase())}</div>
             <div style="color:${C1};font-size:10px">— ${esc(code.replace(/^ĐL-/, ''))} —</div>
           </div>
         </div>`;

    // ════════════════════════════════════════════════════════════════════
    return `
    <div class="profile-page" style="font-family:'Be Vietnam Pro','Inter',system-ui,sans-serif;padding:0">

      <!-- ═══════ HEADER ═══════ -->
      <header style="background:${C1};padding:22px 22px 20px;color:#fff;position:relative">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
          <!-- Logo + Info -->
          <div style="display:flex;align-items:center;gap:20px;flex:1;min-width:0">
            <!-- LOGO -->
            <div style="width:150px;height:150px;flex-shrink:0;display:flex;align-items:center;justify-content:center">
              ${logo}
            </div>
            <div style="min-width:0">
              <div style="font-size:11px;font-weight:600;opacity:.75;margin-bottom:3px">${esc(code)}</div>
              <div style="font-size:28px;font-weight:800;line-height:1.15;margin-bottom:5px">${esc(name)}</div>
              <div style="font-size:14px;font-style:italic;opacity:.88;margin-bottom:14px">${esc(tag)}</div>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:12px">
                <div style="display:flex;align-items:center;gap:8px">${ic.phone} ${esc(phone)}</div>
                <div style="display:flex;align-items:center;gap:8px">${ic.email} ${esc(email)}</div>
                <div style="display:flex;align-items:flex-start;gap:8px">${ic.pin} <span style="line-height:1.35">${esc(addr)}</span></div>
              </div>
            </div>
          </div>
          <!-- QR Code -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex-shrink:0">
            <div style="width:110px;height:110px;display:flex;align-items:center;justify-content:center;overflow:hidden">
              ${qr}
            </div>
            <div style="font-size:10px;font-weight:600;opacity:.8;text-align:center;line-height:1.35;max-width:120px">Quét QR để xem thêm chi tiết</div>
          </div>
        </div>
      </header>

      <!-- ═══════ ADVANTAGES (nền đen = C2) ═══════ -->
      <section style="padding:16px 22px;background:${C2}">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
          ${[adv1, adv2, adv3].map(a => `
            <div style="background:#fff;border-radius:8px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,.08)">
              <span style="font-size:13px;font-weight:600;color:${C2}">${esc(a)}</span>
              ${ic.box}
            </div>
          `).join('')}
        </div>
      </section>

      <!-- ═══════ PROJECTS ═══════ -->
      <section style="padding:18px 22px 20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="background:${C1};width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff">${ic.camera}</div>
          <div style="font-size:17px;font-weight:800;color:${C2};text-transform:uppercase;letter-spacing:.02em">CÔNG TRÌNH THỰC TẾ</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${photoCard(iP1, 1, pCap1, '200px')}
          ${photoCard(iP2, 2, pCap2, '200px')}
          ${photoCard(iP3, 3, pCap3, '200px')}
        </div>
      </section>

      <!-- ═══════ KPIs ═══════ -->
      <section style="border-top:1px solid ${C2}22;border-bottom:1px solid ${C2}22;background:${C2}08;display:flex">
        <div style="flex:1;padding:14px 14px 14px 24px;border-right:1px solid ${C2}22">
          <div style="color:${C1};font-weight:700;font-size:18px;line-height:1.2">${esc(kpi1V)}</div>
          <div style="font-size:11px;color:${C2};opacity:.55;text-transform:uppercase;font-weight:500;margin-top:2px">${esc(kpi1L)}</div>
        </div>
        <div style="flex:1;padding:14px 14px 14px 24px;border-right:1px solid ${C2}22">
          <div style="color:${C1};font-weight:700;font-size:18px;line-height:1.2">${esc(kpi2V)}</div>
          <div style="font-size:11px;color:${C2};opacity:.55;text-transform:uppercase;font-weight:500;margin-top:2px">${esc(kpi2L)}</div>
        </div>
        <div style="flex:1;padding:14px 14px 14px 24px">
          <div style="color:${C1};font-weight:700;font-size:18px;line-height:1.2">${esc(kpi3V)}</div>
          <div style="font-size:11px;color:${C2};opacity:.55;text-transform:uppercase;font-weight:500;margin-top:2px">${esc(kpi3L)}</div>
        </div>
      </section>

      <!-- ═══════ TEAM ═══════ -->
      <section style="padding:18px 22px 20px">
        <div style="border:1px solid ${C2}1a;border-radius:12px;overflow:hidden;background:#fff">
          <div style="display:flex;align-items:center;gap:10px;padding:14px 16px">
            <div style="background:${C1};width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff">${ic.team}</div>
            <div style="font-size:17px;font-weight:800;color:${C2};text-transform:uppercase;letter-spacing:.02em">ĐỘI NGŨ KỸ THUẬT</div>
          </div>
          <div style="display:flex;gap:14px;padding:0 16px 16px">
            <!-- Stats -->
            <div style="flex:1;display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;align-items:center;gap:12px;border:1px solid ${C2}1a;border-radius:8px;padding:12px 14px;background:#fff">
                <span style="color:${C1};font-weight:700;font-size:17px;min-width:36px;text-align:center">${esc(exp)}</span>
                <span style="font-size:13px;font-weight:600;color:${C2};text-transform:uppercase">NĂM KINH NGHIỆM</span>
              </div>
              <div style="display:flex;align-items:center;gap:12px;border:1px solid ${C2}1a;border-radius:8px;padding:12px 14px;background:#fff">
                <span style="color:${C1};font-weight:700;font-size:17px;min-width:36px;text-align:center">${esc(team)}</span>
                <span style="font-size:13px;font-weight:600;color:${C2};text-transform:uppercase">QUY MÔ ĐỘI NGŨ</span>
              </div>
              <div style="display:flex;align-items:center;gap:12px;border:1px solid ${C2}1a;border-radius:8px;padding:12px 14px;background:#fff">
                <span style="color:${C1};font-weight:700;font-size:17px;min-width:36px;text-align:center">${esc(proj)}</span>
                <span style="font-size:13px;font-weight:600;color:${C2};text-transform:uppercase">DỰ ÁN / THÁNG</span>
              </div>
            </div>
            <!-- Photos -->
            <div style="flex:1.3;display:flex;gap:10px">
              ${photoCard(iT1, 1, tCap1, '100%')}
              ${photoCard(iT2, 2, tCap2, '100%')}
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ FOOTER 3-COL ═══════ -->
      <section style="padding:18px 22px 24px;background:${C2}08;border-top:1px solid ${C2}1a">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">

          <!-- Col 1: Sản phẩm, Dịch vụ -->
          <div style="background:#fff;border:1px solid ${C2}1a;border-radius:12px;padding:16px 18px">
            <div style="font-size:14px;font-weight:800;color:${C2};text-transform:uppercase;margin-bottom:14px">SẢN PHẨM, DỊCH VỤ</div>
            <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;color:${C2}">
              ${services.map(s => `<div style="display:flex;align-items:flex-start;gap:8px">${ic.boxS} <span style="line-height:1.35">${esc(s)}</span></div>`).join('')}
            </div>
          </div>

          <!-- Col 2: Năng lực nổi bật (nền dùng C2) -->
          <div style="background:${C2};border-radius:12px;padding:16px 18px;color:#fff;opacity:.85">
            <div style="font-size:14px;font-weight:800;text-transform:uppercase;margin-bottom:14px;opacity:1">NĂNG LỰC NỔI BẬT</div>
            <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;opacity:1">
              ${usps.map(s => `<div style="display:flex;align-items:flex-start;gap:8px">${ic.check} <span style="line-height:1.35">${esc(s)}</span></div>`).join('')}
            </div>
          </div>

          <!-- Col 3: Khách hàng + Đối tác -->
          <div style="display:flex;flex-direction:column;gap:14px">
            <div style="background:${C1};border-radius:12px;padding:16px 18px;color:#fff;flex:1">
              <div style="font-size:14px;font-weight:800;text-transform:uppercase;margin-bottom:10px">KHÁCH HÀNG CHIA SẺ</div>
              <div style="font-size:13px;font-style:italic;line-height:1.55">"${esc(quote)}"</div>
            </div>
            <div style="background:#fff;border:1px solid ${C2}1a;border-radius:12px;padding:14px 16px">
              <div style="font-size:13px;font-weight:800;color:${C2};text-transform:uppercase;margin-bottom:10px">ĐỐI TÁC TIN CẬY</div>
              <div style="display:flex;gap:8px">
                ${pLogo(iPL1)}${pLogo(iPL2)}${pLogo(iPL3)}
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>`;
  }

  // ── Public API ──
  global.ProfileTemplates = {
    renderers: { t1: template1 },
    labels: { t1: 'Mẫu 1' },
    render(key, data) {
      return (this.renderers[key] || this.renderers.t1)(data);
    },
  };
})(window);
