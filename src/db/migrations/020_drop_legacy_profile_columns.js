// Xoá 9 cột "treo" trong dealer_profiles — không còn ô nhập trên form,
// không template nào render. Dọn cho schema gọn.
//   services_text, commitments_text, cta_text, badge1, badge2, badge3,
//   partners_title, team_caption_kho_xuong, team_caption_doi_ngu_2
//
// An toàn: caption đội ngũ 2 đã được mig 019 dời sang project_caption4.
// SQLite >= 3.35 hỗ trợ ALTER TABLE DROP COLUMN (better-sqlite3 v11 OK).
// Idempotent: chỉ drop cột nào còn tồn tại.
module.exports = {
  description: 'dealer_profiles: drop 9 legacy/orphan columns',
  up: (db) => {
    const cols = new Set(
      db.prepare('PRAGMA table_info(dealer_profiles)').all().map(c => c.name)
    );
    const drop = [
      'services_text', 'commitments_text', 'cta_text',
      'badge1', 'badge2', 'badge3',
      'partners_title', 'team_caption_kho_xuong', 'team_caption_doi_ngu_2',
    ];
    for (const c of drop) {
      if (cols.has(c)) db.exec(`ALTER TABLE dealer_profiles DROP COLUMN ${c}`);
    }
  },
};
