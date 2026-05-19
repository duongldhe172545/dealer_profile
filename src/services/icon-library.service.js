const iconModel = require('../models/icon-library.model');
const { badRequest, notFound, conflict } = require('../utils/http');
const { cleanString } = require('../utils/sanitize');

const KEY_RE = /^[a-z0-9][a-z0-9-]{1,79}$/;       // slug kebab-case

function clean(v, max) { return cleanString(v, max); }

function normalize(body) {
  const icon_key = clean(body.icon_key, 80);
  if (!icon_key) throw badRequest('Vui lòng nhập key icon');
  if (!KEY_RE.test(icon_key)) {
    throw badRequest('Key chỉ chứa chữ thường, số và dấu gạch — vd "cua-nhom-1-canh"');
  }
  const label = clean(body.label, 100);
  if (!label) throw badRequest('Vui lòng nhập tên hiển thị');
  const svg_content = clean(body.svg_content, 50000);
  if (!svg_content) throw badRequest('Vui lòng dán SVG content');
  if (!/^<svg\b/i.test(svg_content.trim())) {
    throw badRequest('SVG content phải bắt đầu bằng <svg>');
  }
  const category = clean(body.category, 50);
  const sort_order = Number.isFinite(Number(body.sort_order)) ? Math.round(Number(body.sort_order)) : 0;
  return { icon_key, label, svg_content, category, sort_order };
}

function list(filter) {
  return iconModel.list(filter);
}

function categories() {
  return iconModel.categories();
}

function getById(id) {
  const r = iconModel.findById(id);
  if (!r) throw notFound('Không tìm thấy icon');
  return r;
}

function getByKey(icon_key) {
  return iconModel.findByKey(icon_key);
}

function create(body) {
  const data = normalize(body);
  const dup = iconModel.findByKey(data.icon_key);
  if (dup) throw conflict('Key icon đã tồn tại');
  const id = iconModel.create(data);
  return iconModel.findById(id);
}

function update(id, body) {
  const existing = getById(id);
  const data = normalize(body);
  if (data.icon_key !== existing.icon_key) {
    const dup = iconModel.findByKey(data.icon_key);
    if (dup) throw conflict('Key icon đã tồn tại');
  }
  iconModel.update(id, data);
  return iconModel.findById(id);
}

function remove(id) {
  getById(id);
  iconModel.remove(id);
}

module.exports = { list, categories, getById, getByKey, create, update, remove };
