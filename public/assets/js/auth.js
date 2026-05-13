// Quản lý phiên đăng nhập phía client: lưu user info, redirect theo role, guard trang.
(function (global) {
  const USER_KEY = 'dls_user';

  function setSession(token, user) {
    API.setToken(token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function clearSession() {
    API.clearToken();
    localStorage.removeItem(USER_KEY);
  }

  function homePathFor(user) {
    return user && user.role === 'admin' ? '/admin/' : '/dealer/';
  }

  // Gọi ở đầu trang admin/dealer để chặn truy cập khi chưa đăng nhập / sai role.
  function guard(requiredRole) {
    const user = getUser();
    if (!user || !API.getToken()) {
      window.location.replace('/');
      return null;
    }
    if (requiredRole && user.role !== requiredRole) {
      window.location.replace(homePathFor(user));
      return null;
    }
    return user;
  }

  function logout() {
    clearSession();
    window.location.replace('/');
  }

  global.Auth = { setSession, getUser, clearSession, homePathFor, guard, logout };
})(window);
