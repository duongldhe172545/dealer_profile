// Cho phép sửa thông tin đại lý + tiêu đề trên TỪNG báo giá (override profile mặc định).
//   - dealer_name_override, dealer_address_override, dealer_phone_override, dealer_email_override
//   - quote_title (default 'PHIẾU BÁO GIÁ')
//
// Semantic: nếu field NULL/rỗng → render template fallback dealer profile (live).
// Nếu có giá trị → render giá trị này (snapshot/override).
module.exports = {
  description: 'quotations: dealer info override + quote_title',
  up: (db) => {
    const cols = new Set(db.prepare(`PRAGMA table_info(quotations)`).all().map(c => c.name));
    const addIfMissing = (name, type) => {
      if (!cols.has(name)) db.exec(`ALTER TABLE quotations ADD COLUMN ${name} ${type}`);
    };
    addIfMissing('dealer_name_override',    'TEXT');
    addIfMissing('dealer_address_override', 'TEXT');
    addIfMissing('dealer_phone_override',   'TEXT');
    addIfMissing('dealer_email_override',   'TEXT');
    addIfMissing('quote_title',             'TEXT');
  },
};
