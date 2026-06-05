const db = require('../config/database');

class BaseModel {
  constructor(tableName, fields, options = {}) {
    this.db = db;
    this.tableName = tableName;
    this.fields = fields;
    this.tenantScoped = options.tenantScoped !== false; // Mặc định true
  }

  findById(dealerIdOrId, id = null) {
    if (this.tenantScoped) {
      return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE dealer_id = ? AND id = ?`).get(dealerIdOrId, id);
    }
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(dealerIdOrId);
  }

  create(dealerIdOrData, data = null) {
    if (this.tenantScoped) {
      const cols = ['dealer_id', ...this.fields].join(', ');
      const placeholders = ['@dealer_id', ...this.fields.map(f => `@${f}`)].join(', ');
      const payload = { dealer_id: dealerIdOrData, ...Object.fromEntries(this.fields.map(f => [f, data[f] ?? null])) };
      const info = this.db.prepare(`INSERT INTO ${this.tableName} (${cols}) VALUES (${placeholders})`).run(payload);
      return info.lastInsertRowid;
    } else {
      const cols = this.fields.join(', ');
      const placeholders = this.fields.map(f => `@${f}`).join(', ');
      const payload = Object.fromEntries(this.fields.map(f => [f, dealerIdOrData[f] ?? null]));
      const info = this.db.prepare(`INSERT INTO ${this.tableName} (${cols}) VALUES (${placeholders})`).run(payload);
      return info.lastInsertRowid;
    }
  }

  update(dealerIdOrId, idOrData, data = null) {
    const sets = this.fields.map(f => `${f} = @${f}`).join(', ');
    if (this.tenantScoped) {
      const payload = { dealer_id: dealerIdOrId, id: idOrData, ...Object.fromEntries(this.fields.map(f => [f, data[f] ?? null])) };
      this.db.prepare(`UPDATE ${this.tableName} SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE dealer_id = @dealer_id AND id = @id`).run(payload);
    } else {
      const payload = { id: dealerIdOrId, ...Object.fromEntries(this.fields.map(f => [f, idOrData[f] ?? null])) };
      this.db.prepare(`UPDATE ${this.tableName} SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run(payload);
    }
  }

  remove(dealerIdOrId, id = null) {
    if (this.tenantScoped) {
      const info = this.db.prepare(`DELETE FROM ${this.tableName} WHERE dealer_id = ? AND id = ?`).run(dealerIdOrId, id);
      return info.changes > 0;
    } else {
      const info = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(dealerIdOrId);
      return info.changes > 0;
    }
  }
}

module.exports = BaseModel;
