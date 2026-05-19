# Hướng dẫn Migration & Backup

Tài liệu ngắn cho **dev / AI** khi đổi schema DB hoặc cần restore data.

## Quy tắc bất di bất dịch

1. **KHÔNG sửa migration đã chạy production.** Tạo file mới với số thứ tự tiếp theo.
2. **Cột mới luôn `NULL` được hoặc có `DEFAULT`.** KHÔNG bao giờ `NOT NULL` không default — sẽ vỡ tất cả row cũ.
3. **Không drop / rename cột tuỳ tiện.** Đọc mục "Quy trình an toàn" bên dưới.
4. **Tất cả thay đổi schema = 1 file `.sql` hoặc `.js` mới ở `src/db/migrations/`** — không trực tiếp sửa schema.sql để áp dụng.

## Add 1 cột mới (case thường gặp nhất)

1. Tìm số migration mới nhất ở `src/db/migrations/` (vd: `004_*.js`)
2. Tạo file mới: `005_add_chiet_khau.sql`
   ```sql
   ALTER TABLE quotation_items ADD COLUMN chiet_khau REAL DEFAULT 0;
   ```
3. Test local: `npm run db:migrate` → thấy `✓ Applied 005_add_chiet_khau.sql`
4. Commit + push → Railway tự chạy migration trên deploy
5. Cập nhật `schema.sql` (chỉ để reference cho dev đọc — không ảnh hưởng runtime)

## Thêm bảng mới

```sql
-- src/db/migrations/006_create_promotions.sql
CREATE TABLE IF NOT EXISTS promotions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  dealer_id   INTEGER NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  ten         TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_promotions_dealer ON promotions(dealer_id);
```

## Migration có logic phức tạp → dùng `.js`

```javascript
// src/db/migrations/007_split_full_name.js
module.exports = {
  description: 'Tách dealers.full_name thành first_name + last_name',
  up: (db) => {
    db.exec(`ALTER TABLE dealers ADD COLUMN first_name TEXT`);
    db.exec(`ALTER TABLE dealers ADD COLUMN last_name TEXT`);
    const rows = db.prepare('SELECT id, ten_dai_ly FROM dealers').all();
    const upd = db.prepare('UPDATE dealers SET first_name=?, last_name=? WHERE id=?');
    for (const r of rows) {
      const parts = (r.ten_dai_ly || '').trim().split(/\s+/);
      upd.run(parts[0] || '', parts.slice(1).join(' '), r.id);
    }
  }
};
```

Tự động chạy trong transaction → fail giữa chừng rollback, không mất data.

## Quy trình an toàn khi đổi/xoá cột

SQLite không hỗ trợ trực tiếp DROP COLUMN với CHECK constraint, hoặc rename column cũ. Đi theo "expand → contract":

### Đổi tên cột `old_name` → `new_name`
1. **Migration X**: ADD cột `new_name`, copy data từ `old_name` sang `new_name`.
2. Deploy → code đọc/ghi cả 2 cột (đảm bảo backward compat).
3. Đợi 1-2 tuần chạy ổn → confirm không có bug.
4. **Migration X+1**: Code chỉ đọc/ghi `new_name`. DROP cột `old_name` (rebuild table).
5. Có backup trước khi deploy migration X+1.

### Xoá cột
1. **Migration X**: Đánh dấu cột deprecated trong code, không đọc/ghi nữa.
2. Deploy, đợi 1-2 tuần.
3. **Migration X+1**: `ALTER TABLE x DROP COLUMN y` (SQLite >=3.35).
4. Có backup trước.

## Backup

### Tự động
- **Pre-deploy**: `npm start` chạy `scripts/backup-db.js` trước khi migrate. Mỗi deploy = 1 snapshot.
- **Daily**: server.js có `setInterval` 24h backup.
- **Retention**: giữ 30 ngày, tự xoá file cũ. Đổi qua env `BACKUP_RETENTION_DAYS`.
- **Vị trí**: `<dbDir>/backups/app-<ISO>.db`. Trên Railway: `/data/backups/`.

### Manual
```bash
npm run db:backup
```

## Restore từ backup

Khi DB hỏng / migration sai:

1. Stop server: Railway → Deployment → Stop (hoặc `pkill node` local).
2. List backups:
   ```bash
   ls -lh /data/backups/   # production
   ls -lh data/backups/    # local
   ```
3. Chọn file backup cần restore (vd: `app-2026-05-17T02-00-15.db`).
4. Đè lên DB chính:
   ```bash
   cp data/backups/app-2026-05-17T02-00-15.db data/app.db
   ```
   Trên Railway dùng terminal của volume: `cp /data/backups/<file> /data/app.db`.
5. Start lại server.
6. Verify: login dealer test, xem báo giá / hồ sơ có còn không.

## Cách hệ thống đảm bảo "1 đêm bảo trì"

- **Migration chạy trong transaction** → fail thì rollback, không để DB ở trạng thái nửa vời.
- **Pre-deploy backup** → có sự cố vẫn restore < 5 phút.
- **WAL mode** → đọc song song khi ghi, không khoá user khi migrate cột mới (`ADD COLUMN` instant).
- **`ALTER TABLE ADD COLUMN` SQLite = O(1)** — không rewrite row, chạy < 1 giây trên DB 100MB.
- **Rebuild table** (vd: đổi CHECK constraint) chạy O(n) — với 10k báo giá ≈ vài giây.
- **Idempotent**: migration đã chạy không re-run → restart container không sợ trùng lặp.

Maintenance window thực tế: deploy + migrate < 1 phút cho pilot 10 dealers, < 5 phút khi lên vài nghìn dealers.

## Khi nào KHÔNG được tự ý migrate

- **Drop hoặc rename bảng có data quan trọng**: phải có approve + backup tay trước.
- **Đổi PRIMARY KEY** của bảng có FK trỏ tới: phải lên kế hoạch nhiều bước.
- **Migrate sang Postgres**: kế hoạch riêng, không thuộc phạm vi runner này.

## Cấu trúc file

```
src/db/
  schema.sql                              ← chỉ để reference (current state)
  migrate.js                              ← runner
  migrations/
    001_baseline_schema.sql               ← copy của schema.sql initial
    002_drop_dealers_mst.js
    003_add_profile_extra_cols.js
    004_expand_dealer_images_slots.js
    005_xxx.sql                           ← migration tiếp theo, mày tự thêm
scripts/
  backup-db.js                            ← hot backup
docs/
  MIGRATION.md                            ← file này
```
