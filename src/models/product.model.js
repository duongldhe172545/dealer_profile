const BaseModel = require('./base.model');

const FIELDS = ['ma_sp', 'ten_sp', 'nhom_sp', 'mo_ta', 'dvt_mac_dinh', 'cach_tinh_gia', 'don_gia_mac_dinh', 'active'];

class ProductModel extends BaseModel {
  constructor() {
    super('products', FIELDS, { tenantScoped: true });
  }

  list(dealerId, { search, nhom_sp, active } = {}) {
    const where = ['dealer_id = @dealer_id'];
    const params = { dealer_id: dealerId };
    if (search) {
      where.push('(ma_sp LIKE @kw OR mo_ta LIKE @kw OR nhom_sp LIKE @kw)');
      params.kw = `%${search}%`;
    }
    if (nhom_sp) { where.push('nhom_sp = @nhom_sp'); params.nhom_sp = nhom_sp; }
    if (active === 1 || active === 0) { where.push('active = @active'); params.active = active; }
    return this.db.prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY nhom_sp, ma_sp`).all(params);
  }

  listActive(dealerId) {
    return this.db.prepare(`SELECT id, ma_sp, ten_sp, nhom_sp, mo_ta, dvt_mac_dinh, cach_tinh_gia, don_gia_mac_dinh
      FROM products WHERE dealer_id = ? AND active = 1 ORDER BY nhom_sp, ma_sp`).all(dealerId);
  }

  findByCode(dealerId, ma_sp) {
    return this.db.prepare('SELECT id FROM products WHERE dealer_id = ? AND ma_sp = ?').get(dealerId, ma_sp);
  }

  distinctGroups(dealerId) {
    return this.db.prepare("SELECT DISTINCT nhom_sp FROM products WHERE dealer_id = ? AND nhom_sp IS NOT NULL AND nhom_sp <> '' ORDER BY nhom_sp").all(dealerId).map(r => r.nhom_sp);
  }
}

const productModel = new ProductModel();
module.exports = {
  FIELDS,
  list: productModel.list.bind(productModel),
  listActive: productModel.listActive.bind(productModel),
  findById: productModel.findById.bind(productModel),
  findByCode: productModel.findByCode.bind(productModel),
  distinctGroups: productModel.distinctGroups.bind(productModel),
  create: productModel.create.bind(productModel),
  update: productModel.update.bind(productModel),
  remove: productModel.remove.bind(productModel),
};
