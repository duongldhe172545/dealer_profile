const dealerModel = require('../models/dealer.model');
const userModel = require('../models/user.model');
const password = require('../utils/password');
const audit = require('../utils/audit');
const { badRequest, notFound, conflict } = require('../utils/http');

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/i;
const CODE_RE = /^[A-Z0-9-]{3,30}$/i;

function requireText(value, label, max = 200) {
  const v = (value == null ? '' : String(value)).trim();
  if (!v) throw badRequest(`Vui lòng nhập ${label}`);
  if (v.length > max) throw badRequest(`${label} quá dài (tối đa ${max} ký tự)`);
  return v;
}

function optionalText(value, max = 200) {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (v.length > max) throw badRequest(`Giá trị quá dài (tối đa ${max} ký tự)`);
  return v;
}

function normalizeDealerInput(body) {
  return {
    dealer_code:      requireText(body.dealer_code, 'mã đại lý', 30).toUpperCase(),
    ten_dai_ly:       requireText(body.ten_dai_ly, 'tên đại lý'),
    chu_dai_ly:       optionalText(body.chu_dai_ly),
    phone:            optionalText(body.phone, 30),
    email:            optionalText(body.email, 100),
    mst:              optionalText(body.mst, 30),
    address:          optionalText(body.address, 300),
    district:         optionalText(body.district),
    province:         optionalText(body.province),
    coverage:         optionalText(body.coverage, 500),
    years_experience: optionalText(body.years_experience, 30),
    team_size:        optionalText(body.team_size, 30),
    projects_monthly: optionalText(body.projects_monthly, 30),
    open_hours:       optionalText(body.open_hours, 50),
  };
}

function list(filter) {
  return dealerModel.listWithStats(filter);
}

function getById(id) {
  const d = dealerModel.findById(id);
  if (!d) throw notFound('Không tìm thấy đại lý');
  return d;
}

async function create(body, ctx) {
  const dealer = normalizeDealerInput(body);
  if (!CODE_RE.test(dealer.dealer_code)) {
    throw badRequest('Mã đại lý chỉ chứa chữ, số, dấu gạch ngang (3-30 ký tự)');
  }
  if (dealerModel.findByCode(dealer.dealer_code)) {
    throw conflict('Mã đại lý đã tồn tại');
  }

  const username = requireText(body.username, 'tên đăng nhập', 30).toLowerCase();
  if (!USERNAME_RE.test(username)) {
    throw badRequest('Tên đăng nhập chỉ chứa chữ, số, dấu chấm, gạch dưới, gạch ngang (3-30 ký tự)');
  }
  if (userModel.findByUsername(username)) {
    throw conflict('Tên đăng nhập đã được sử dụng');
  }

  const plainPassword = String(body.password || '');
  if (plainPassword.length < 8) throw badRequest('Mật khẩu phải có ít nhất 8 ký tự');

  const passwordHash = await password.hash(plainPassword);

  const dealerId = dealerModel.createWithUser({
    dealer,
    username,
    passwordHash,
    fullName: dealer.chu_dai_ly,
  });

  audit.log(ctx, 'dealer.create', 'dealer', dealerId, {
    dealer_code: dealer.dealer_code,
    ten_dai_ly: dealer.ten_dai_ly,
    username,
  });

  return dealerModel.findById(dealerId);
}

function update(id, body) {
  getById(id); // throw 404 nếu không tồn tại
  const dealer = normalizeDealerInput(body);
  if (!CODE_RE.test(dealer.dealer_code)) {
    throw badRequest('Mã đại lý chỉ chứa chữ, số, dấu gạch ngang (3-30 ký tự)');
  }
  const existing = dealerModel.findByCode(dealer.dealer_code);
  if (existing && existing.id !== id) throw conflict('Mã đại lý đã tồn tại');

  dealerModel.update(id, dealer);
  return dealerModel.findById(id);
}

function setStatus(id, status) {
  if (!['active', 'inactive'].includes(status)) throw badRequest('Trạng thái không hợp lệ');
  getById(id);
  dealerModel.setStatus(id, status);
  return dealerModel.findById(id);
}

async function resetPassword(id, newPassword) {
  getById(id);
  if (!newPassword || String(newPassword).length < 8) {
    throw badRequest('Mật khẩu mới phải có ít nhất 8 ký tự');
  }
  const hash = await password.hash(String(newPassword));
  const ok = dealerModel.resetPassword(id, hash);
  if (!ok) throw notFound('Đại lý chưa có tài khoản đăng nhập');
}

module.exports = { list, getById, create, update, setStatus, resetPassword };
