// Shell dùng chung cho các trang admin: header + nav + footer.
// Inject vào element có id="admin-shell". User đã được Auth.guard('admin') trước đó.
(function (global) {
  const NAV = [
    { href: '/admin/',                 label: 'Tổng quan' },
    { href: '/admin/dealers.html',     label: 'Đại lý' },
    { href: '/admin/quotations.html',  label: 'Tất cả báo giá' },
    { href: '/admin/audit.html',       label: 'Audit log' },
  ];

  function isActive(href, currentPath) {
    if (href === '/admin/') return currentPath === '/admin/' || currentPath === '/admin/index.html';
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
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div class="flex flex-wrap items-center gap-3 sm:gap-6 flex-1 min-w-0">
            <a href="/admin/" class="text-lg sm:text-xl font-bold whitespace-nowrap">Đại Lý Số</a>
            <nav class="flex flex-wrap gap-1 overflow-x-auto">${navHtml}</nav>
          </div>
          <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <a href="/account.html" class="text-xs sm:text-sm text-blue-100 hover:text-white truncate max-w-[100px] sm:max-w-none" title="Tài khoản của tôi">${user.full_name || user.username}</a>
            <button onclick="Auth.logout()"
              class="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap">Đăng xuất</button>
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

  global.AdminShell = {
    mount(user) {
      injectFont();
      const el = document.getElementById('admin-shell');
      if (el) el.innerHTML = render(user);
    }
  };
})(window);
