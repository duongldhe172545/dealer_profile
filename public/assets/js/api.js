// Fetch wrapper: tự gắn JWT, parse JSON, throw error với message tiếng Việt.
(function (global) {
  const TOKEN_KEY = 'dls_token';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

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
      const err = new Error((data && data.error) || `Lỗi ${res.status}`);
      err.status = res.status;
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
