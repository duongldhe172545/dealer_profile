const userModel = require('../models/user.model');
const password = require('../utils/password');
const jwt = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/http');

async function login(username, plainPassword) {
  const user = userModel.findByUsername(username);
  if (!user) throw unauthorized('Tên đăng nhập hoặc mật khẩu không đúng');

  const ok = await password.verify(plainPassword, user.password_hash);
  if (!ok) throw unauthorized('Tên đăng nhập hoặc mật khẩu không đúng');

  if (user.status !== 'active') throw forbidden('Tài khoản đã bị vô hiệu hoá');

  userModel.updateLastLogin(user.id);

  const token = jwt.sign({
    id: user.id,
    username: user.username,
    role: user.role,
    dealer_id: user.dealer_id,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      dealer_id: user.dealer_id,
    },
  };
}

async function changePassword(userId, currentPassword, newPassword) {
  const { badRequest, unauthorized } = require('../utils/http');
  const user = userModel.findById(userId);
  if (!user) throw unauthorized();
  if (!currentPassword || !newPassword) throw badRequest('Vui lòng nhập đủ mật khẩu');
  if (String(newPassword).length < 8) throw badRequest('Mật khẩu mới phải có ít nhất 8 ký tự');
  const ok = await password.verify(currentPassword, user.password_hash);
  if (!ok) throw badRequest('Mật khẩu hiện tại không đúng');
  const newHash = await password.hash(String(newPassword));
  userModel.updatePassword(userId, newHash);
}

function updateProfile(userId, body) {
  const { badRequest } = require('../utils/http');
  const fullName = body && body.full_name != null ? String(body.full_name).trim() : null;
  if (fullName && fullName.length > 100) throw badRequest('Tên hiển thị quá dài (tối đa 100 ký tự)');
  userModel.updateFullName(userId, fullName || null);
  const user = userModel.findById(userId);
  return {
    id: user.id, username: user.username, full_name: user.full_name,
    role: user.role, dealer_id: user.dealer_id, last_login_at: user.last_login_at,
    created_at: user.created_at,
  };
}

function me(userId) {
  const user = userModel.findById(userId);
  if (!user) return null;
  return {
    id: user.id, username: user.username, full_name: user.full_name,
    role: user.role, dealer_id: user.dealer_id, status: user.status,
    last_login_at: user.last_login_at, created_at: user.created_at,
  };
}

module.exports = { login, changePassword, updateProfile, me };
