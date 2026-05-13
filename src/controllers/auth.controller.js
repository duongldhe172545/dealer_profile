const authService = require('../services/auth.service');
const { badRequest } = require('../utils/http');

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) throw badRequest('Vui lòng nhập tên đăng nhập và mật khẩu');

    const result = await authService.login(String(username).trim(), String(password));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function me(req, res, next) {
  try { res.json({ user: authService.me(req.user.id) }); }
  catch (err) { next(err); }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body || {};
    await authService.changePassword(req.user.id, current_password, new_password);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

function updateProfile(req, res, next) {
  try { res.json({ user: authService.updateProfile(req.user.id, req.body || {}) }); }
  catch (err) { next(err); }
}

module.exports = { login, me, changePassword, updateProfile };
