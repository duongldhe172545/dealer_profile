// Shell dùng chung cho các trang admin: header + nav + footer.
// Inject vào element có id="admin-shell". User đã được Auth.guard('admin') trước đó.
(function (global) {
  const NAV = [
    { href: '/admin/',                 label: 'Tổng quan' },
    { href: '/admin/dealers.html',     label: 'Đại lý' },
    { href: '/admin/quotations.html',  label: 'Tất cả báo giá' },
    { href: '/admin/customers.html',   label: 'Khách hàng' },
    { href: '/admin/products.html',    label: 'Sản phẩm' },
    { href: '/admin/images.html',      label: 'Kho ảnh' },
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
        <div class="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
          <div class="flex items-center justify-between gap-2">
            <a href="/admin/" class="text-base sm:text-xl font-bold whitespace-nowrap">Đại Lý Số <span class="text-xs font-normal opacity-70">· Admin</span></a>
            <div class="flex items-center gap-2">
              <a href="/account.html" class="text-xs sm:text-sm text-blue-100 hover:text-white truncate max-w-[120px] sm:max-w-none" title="Tài khoản của tôi">${user.full_name || user.username}</a>
              <button onclick="Auth.logout()"
                class="text-xs sm:text-sm bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg whitespace-nowrap">Đăng xuất</button>
            </div>
          </div>
          <nav class="flex gap-1 overflow-x-auto mt-2 -mx-1 px-1 pb-1" style="scrollbar-width:thin">${navHtml}</nav>
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
