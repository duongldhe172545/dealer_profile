// Shell dùng chung cho các trang đại lý: header + nav.
(function (global) {
  const NAV = [
    { href: '/dealer/',                label: 'Trang chính' },
    { href: '/dealer/profile.html',    label: 'Hồ sơ' },
    { href: '/dealer/products.html',   label: 'Sản phẩm' },
    { href: '/dealer/customers.html',  label: 'Khách hàng' },
    { href: '/dealer/quotations.html', label: 'Báo giá' },
  ];

  function isActive(href, currentPath) {
    if (href === '/dealer/') return currentPath === '/dealer/' || currentPath === '/dealer/index.html';
    return currentPath.endsWith(href.split('/').pop());
  }

  function render(user) {
    const path = window.location.pathname;
    const navHtml = NAV.map(item => {
      const active = isActive(item.href, path);
      const classes = active
        ? 'px-3 py-1.5 rounded-lg bg-white/15 text-white font-semibold'
        : 'px-3 py-1.5 rounded-lg text-blue-100 hover:bg-white/10';
      return `<a href="${item.href}" class="${classes} text-sm">${item.label}</a>`;
    }).join('');

    return `
      <header class="bg-brand-900 text-white">
        <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <a href="/dealer/" class="text-xl font-bold">Đại Lý Số</a>
            <nav class="flex gap-1">${navHtml}</nav>
          </div>
          <div class="flex items-center gap-3">
            <a href="/account.html" class="text-sm text-blue-100 hover:text-white" title="Tài khoản của tôi">${user.full_name || user.username}</a>
            <button onclick="Auth.logout()"
              class="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">Đăng xuất</button>
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
      const el = document.getElementById('dealer-shell');
      if (el) el.innerHTML = render(user);
    }
  };
})(window);
