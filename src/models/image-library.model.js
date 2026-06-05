const BaseModel = require('./base.model');

const FIELDS = ['dealer_id', 'name', 'url', 'public_id', 'category'];

class ImageLibraryModel extends BaseModel {
  constructor() {
    super('image_library', FIELDS, { tenantScoped: false });
  }

  listAll({ category } = {}) {
    const where = [];
    const params = {};
    if (category) { where.push('category = @category'); params.category = category; }
    const sql = `SELECT i.id, i.dealer_id, i.name, i.url, i.public_id, i.category, i.created_at,
                        d.ten_dai_ly AS dealer_name
                 FROM image_library i
                 LEFT JOIN dealers d ON d.id = i.dealer_id
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY i.dealer_id NULLS FIRST, i.created_at DESC`;
    return this.db.prepare(sql).all(params);
  }

  listForDealer(dealerId, { category } = {}) {
    const where = ['(i.dealer_id IS NULL OR i.dealer_id = @dealer_id)'];
    const params = { dealer_id: dealerId };
    if (category) { where.push('i.category = @category'); params.category = category; }
    const sql = `SELECT i.id, i.dealer_id, i.name, i.url, i.public_id, i.category, i.created_at
                 FROM image_library i
                 WHERE ${where.join(' AND ')}
                 ORDER BY i.dealer_id NULLS FIRST, i.created_at DESC`;
    return this.db.prepare(sql).all(params);
  }
}

const imageLibraryModel = new ImageLibraryModel();
module.exports = {
  FIELDS,
  listAll: imageLibraryModel.listAll.bind(imageLibraryModel),
  listForDealer: imageLibraryModel.listForDealer.bind(imageLibraryModel),
  findById: imageLibraryModel.findById.bind(imageLibraryModel),
  create: imageLibraryModel.create.bind(imageLibraryModel),
  update: imageLibraryModel.update.bind(imageLibraryModel),
  remove: imageLibraryModel.remove.bind(imageLibraryModel),
};
