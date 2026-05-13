const customerModel = require('../models/customer.model');
const audit = require('../utils/audit');
const { badRequest, notFound, conflict } = require('../utils/http');

function clean(value, max = 300) {
  if (value == null) return null;
  const v = String(value).trim();
  if (!v) return null;
  if (v.length > max) throw badRequest(`Giá trị quá dài (tối đa ${max} ký tự)`);
  return v;
}

function normalize(body, { autoGenCode, dealerId }) {
  const ten_kh = clean(body.ten_kh, 200);
  if (!ten_kh) throw badRequest('Vui lòng nhập tên khách hàng');

  let ma_kh = clean(body.ma_kh, 30);
  if (!ma_kh && autoGenCode) ma_kh = customerModel.nextCode(dealerId);

  return {
    ma_kh,
    ten_kh,
    nguoi_lien_he: clean(body.nguoi_lien_he, 100),
    phone: clean(body.phone, 30),
    email: clean(body.email, 100),
    dia_chi: clean(body.dia_chi, 300),
    ghi_chu: clean(body.ghi_chu, 500),
  };
}

function list(dealerId, filter) {
  return customerModel.list(dealerId, filter);
}

function getById(dealerId, id) {
  const c = customerModel.findById(dealerId, id);
  if (!c) throw notFound('Không tìm thấy khách hàng');
  return c;
}

function create(dealerId, body, ctx) {
  const data = normalize(body, { autoGenCode: true, dealerId });
  if (customerModel.findByCode(dealerId, data.ma_kh)) {
    throw conflict('Mã khách hàng đã tồn tại');
  }
  const id = customerModel.create(dealerId, data);
  audit.log(ctx, 'customer.create', 'customer', id, {
    ma_kh: data.ma_kh, ten_kh: data.ten_kh,
  });
  return customerModel.findById(dealerId, id);
}

function update(dealerId, id, body) {
  getById(dealerId, id);
  const data = normalize(body, { autoGenCode: false, dealerId });
  if (!data.ma_kh) throw badRequest('Vui lòng nhập mã khách hàng');
  const existing = customerModel.findByCode(dealerId, data.ma_kh);
  if (existing && existing.id !== id) throw conflict('Mã khách hàng đã tồn tại');
  customerModel.update(dealerId, id, data);
  return customerModel.findById(dealerId, id);
}

function suggestCode(dealerId) {
  return { ma_kh: customerModel.nextCode(dealerId) };
}

module.exports = { list, getById, create, update, suggestCode };
