// Fetch wrapper: tự gắn JWT, parse JSON, throw error với message tiếng Việt.
// 401 (token hết hạn / không hợp lệ) → tự clear session + redirect về trang login,
// KHÔNG hiện alert — UX êm hơn, user chỉ thấy back về login.
(function (global) {
  const TOKEN_KEY = 'dls_token';
  const USER_KEY  = 'dls_user';
  let redirected = false;   // chặn nhiều request 401 cùng lúc kích nhiều redirect

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function handleUnauthorized() {
    if (redirected) return;
    redirected = true;
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch (_) {}
    // Đang ở /login (path '/') thì không redirect lặp.
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.location.replace('/?expired=1');
    }
  }

  async function request(method, path, body) {
    const headers = { 'Accept': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      // 401: token hết hạn / không hợp lệ → silent redirect, error vẫn throw để caller
      // không tiếp tục flow (nhưng caller không cần alert vì user đã bị redirect).
      if (res.status === 401) handleUnauthorized();
      const err = new Error((data && data.error) || `Lỗi ${res.status}`);
      err.status = res.status;
      err.silent = res.status === 401;   // hint cho caller skip alert
      err.details = data && data.details;
      throw err;
    }
    return data;
  }

  global.API = {
    get: (p) => request('GET', p),
    post: (p, body) => request('POST', p, body || {}),
    put: (p, body) => request('PUT', p, body || {}),
    patch: (p, body) => request('PATCH', p, body || {}),
    delete: (p) => request('DELETE', p),
    getToken, setToken, clearToken,
  };
})(window);
