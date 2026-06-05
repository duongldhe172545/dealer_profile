const BaseModel = require('./base.model');

const FIELDS = ['ma_kh', 'ten_kh', 'nguoi_lien_he', 'phone', 'email', 'dia_chi', 'ghi_chu'];

class CustomerModel extends BaseModel {
  constructor() {
    super('customers', FIELDS, { tenantScoped: true });
  }

  list(dealerId, { search } = {}) {
    const where = ['dealer_id = @dealer_id'];
    const params = { dealer_id: dealerId };
    if (search) {
      where.push('(ten_kh LIKE @kw OR ma_kh LIKE @kw OR phone LIKE @kw OR nguoi_lien_he LIKE @kw)');
      params.kw = `%${search}%`;
    }
    return this.db.prepare(`
      SELECT c.*,
             (SELECT COUNT(*) FROM quotations q WHERE q.customer_id = c.id) AS quotations_count
      FROM customers c
      WHERE ${where.join(' AND ')}
      ORDER BY c.created_at DESC
    `).all(params);
  }

  findByCode(dealerId, ma_kh) {
    return this.db.prepare('SELECT id FROM customers WHERE dealer_id = ? AND ma_kh = ?').get(dealerId, ma_kh);
  }

  // Auto-gen mã KH: KH-0001, KH-0002... theo dealer
  nextCode(dealerId) {
    const row = this.db.prepare(`
      SELECT ma_kh FROM customers
      WHERE dealer_id = ? AND ma_kh LIKE 'KH-%'
      ORDER BY id DESC LIMIT 1
    `).get(dealerId);
    let n = 1;
    if (row && row.ma_kh) {
      const m = row.ma_kh.match(/KH-(\d+)/);
      if (m) n = parseInt(m[1], 10) + 1;
    }
    return 'KH-' + String(n).padStart(4, '0');
  }
}

const customerModel = new CustomerModel();
module.exports = {
  FIELDS,
  list: customerModel.list.bind(customerModel),
  findById: customerModel.findById.bind(customerModel),
  findByCode: customerModel.findByCode.bind(customerModel),
  nextCode: customerModel.nextCode.bind(customerModel),
  create: customerModel.create.bind(customerModel),
  update: customerModel.update.bind(customerModel),
  remove: customerModel.remove.bind(customerModel),
};
