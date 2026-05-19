// Thêm 4 cột mới vào dealer_profiles (đã có trong baseline schema mới,
// nhưng prod DB cũ có thể chưa có — migration này guard để idempotent).
module.exports = {
  description: 'Add partners_title + 3 team captions to dealer_profiles',
  up: (db) => {
    const cols = db.prepare(`PRAGMA table_info(dealer_profiles)`).all();
    if (!cols.length) return; // bảng chưa tồn tại (DB hoàn toàn fresh) — 001 đã tạo rồi
    const names = new Set(cols.map(c => c.name));
    const newCols = [
      'partners_title',
      'team_caption_doi_ngu_1',
      'team_caption_kho_xuong',
      'team_caption_doi_ngu_2',
    ];
    for (const c of newCols) {
      if (!names.has(c)) db.exec(`ALTER TABLE dealer_profiles ADD COLUMN ${c} TEXT`);
    }
  }
};
