// Shell dùng chung cho các trang đại lý: header + nav.
// Layout: 1 dòng trên desktop (logo · nav · user/logout), mobile thì stack 2 dòng gọn.
(function (global) {
  const NAV = [
    { href: '/dealer/',                label: 'Trang chính', icon: '🏠' },
    { href: '/dealer/profile.html',    label: 'Hồ sơ',       icon: '🏢' },
    { href: '/dealer/products.html',   label: 'Sản phẩm',    icon: '📦' },
    { href: '/dealer/customers.html',  label: 'Khách hàng',  icon: '👥' },
    { href: '/dealer/quotations.html', label: 'Báo giá',     icon: '📄' },
    { href: '/dealer/images.html',     label: 'Kho ảnh',     icon: '🖼' },
  ];

  function isActive(href, currentPath) {
    if (href === '/dealer/') return currentPath === '/dealer/' || currentPath === '/dealer/index.html';
    return currentPath.endsWith(href.split('/').pop());
  }

  function injectStyles() {
    if (document.getElementById('dealer-shell-style')) return;
    const style = document.createElement('style');
    style.id = 'dealer-shell-style';
    style.textContent = `
      .dls-shell { background: #fff; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 40; }
      .dls-bar   { max-width: 1480px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; gap: 12px; height: 56px; }
      .dls-logo  { display: flex; align-items: center; gap: 8px; text-decoration: none; color: #0b1f3a; font-weight: 800; font-size: 16px; white-space: nowrap; letter-spacing: -0.01em; }
      .dls-logo-icon { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, #0a6fd6 0%, #063f7a 100%); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; box-shadow: 0 2px 6px rgba(10,111,214,0.25); }
      .dls-nav   { display: flex; gap: 2px; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
      .dls-nav::-webkit-scrollbar { height: 3px; }
      .dls-nav::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      .dls-link  { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13.5px; font-weight: 600; color: #475569; text-decoration: none; border-radius: 8px; white-space: nowrap; transition: all .15s; position: relative; }
      .dls-link:hover { background: #f1f5f9; color: #0b1f3a; }
      .dls-link.active { color: #0858b3; background: #eff6ff; }
      .dls-link.active::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px; background: #0a6fd6; border-radius: 2px; }
      .dls-link-ico { font-size: 14px; line-height: 1; }
      .dls-user  { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
      .dls-user-name { font-size: 13px; color: #475569; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-decoration: none; font-weight: 600; padding: 6px 10px; border-radius: 8px; }
      .dls-user-name:hover { background: #f1f5f9; color: #0b1f3a; }
      .dls-logout { font-size: 13px; font-weight: 600; color: #ef4444; background: transparent; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all .15s; white-space: nowrap; }
      .dls-logout:hover { background: #fef2f2; color: #b91c1c; border-color: #ef4444; }

      @media (max-width: 768px) {
        .dls-bar { height: auto; padding: 8px 12px; flex-wrap: wrap; gap: 8px; }
        .dls-logo { font-size: 15px; }
        .dls-nav { order: 3; flex-basis: 100%; padding-top: 6px; border-top: 1px solid #f1f5f9; margin-top: 2px; gap: 0; }
        .dls-link { padding: 6px 10px; font-size: 12.5px; }
        .dls-link-ico { font-size: 13px; }
        .dls-user { margin-left: auto; gap: 4px; }
        .dls-user-name { max-width: 100px; font-size: 12px; padding: 4px 8px; }
        .dls-logout { font-size: 12px; padding: 4px 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  function render(user) {
    const path = window.location.pathname;
    const navHtml = NAV.map(item => {
      const active = isActive(item.href, path);
      return `<a href="${item.href}" class="dls-link${active ? ' active' : ''}"><span class="dls-link-ico">${item.icon}</span><span>${item.label}</span></a>`;
    }).join('');

    return `
      <header class="dls-shell">
        <div class="dls-bar">
          <a href="/dealer/" class="dls-logo">
            <span class="dls-logo-icon">Đ</span>
            <span>Đại Lý Số</span>
          </a>
          <nav class="dls-nav">${navHtml}</nav>
          <div class="dls-user">
            <a href="/account.html" class="dls-user-name" title="Tài khoản của tôi">${user.full_name || user.username}</a>
            <button onclick="Auth.logout()" class="dls-logout">Đăng xuất</button>
          </div>
        </div>
      </header>
    `;
  }

  function injectFont() {
    if (document.getElementById('font-bvp')) return;
    const link = document.createElement('link');
    link.id = 'font-bvp';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
    if (!document.getElementById('font-bvp-style')) {
      const style = document.createElement('style');
      style.id = 'font-bvp-style';
      style.textContent = `body { font-family: 'Be Vietnam Pro', Inter, system-ui, sans-serif; }`;
      document.head.appendChild(style);
    }
  }

  global.DealerShell = {
    mount(user) {
      injectFont();
      injectStyles();
      const el = document.getElementById('dealer-shell');
      if (el) el.innerHTML = render(user);
    }
  };
})(window);
