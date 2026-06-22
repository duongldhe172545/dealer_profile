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
            <!-- Photo (1 ảnh đội ngũ) -->
            <div style="flex:1.3;display:flex;gap:10px">
              ${photoCard(iT1, 1, tCap1, '100%')}
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ FOOTER 2-COL ═══════ -->
      <section style="padding:18px 22px 24px;background:${C2}08;border-top:1px solid ${C2}1a">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">

          <!-- Col 1: Năng lực nổi bật (nền dùng C2) -->
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
      .t2-feat{flex:1;background:#fef7f3;border:1px solid #f7ac87;border-radius:${s(16)}px;padding:${s(5)}px ${s(6)}px;display:flex;align-items:center;justify-content:center;gap:${s(6)}px}
      .t2-feat svg{width:${s(12)}px;height:${s(12)}px;flex-shrink:0}
      .t2-feattxt{font-size:${s(10)}px;font-weight:600;color:${C1};text-align:center;line-height:1.2}
      .t2-gal4{display:flex;gap:${s(8)}px;height:${s(86)}px}
      .t2-gal4 .t2-photo{flex:1}
      .t2-brow{display:flex;gap:${s(8)}px;padding:0 ${s(16)}px ${s(12)}px;min-height:${s(112)}px}
      .t2-nlcard{flex:1;background:#fef7f3;border:1px solid rgba(247,172,135,.5);border-radius:${s(8)}px;padding:${s(10)}px ${s(13)}px;display:flex;flex-direction:column;gap:${s(8)}px}
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
      .t2-qbox{background:#fef7f3;border:1px solid rgba(247,172,135,.5);border-radius:${s(8)}px;padding:${s(10)}px ${s(13)}px;flex:1;display:flex;align-items:center}
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

  // ── Public API ──
  global.ProfileTemplates = {
    renderers: { t1: template1, t2: template2 },
    labels: { t1: 'Mẫu 1', t2: 'Mẫu 2' },
    render(key, data) {
      return (this.renderers[key] || this.renderers.t1)(data);
    },
  };
})(window);
