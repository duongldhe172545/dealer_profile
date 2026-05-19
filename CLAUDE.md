# CLAUDE.md

Hướng dẫn cho AI khi làm việc với dự án này.

## Stack
- Node.js 20 + Express + SQLite (better-sqlite3, WAL mode)
- Frontend: Tailwind CDN + Alpine.js (không build step)
- Auth: JWT + bcrypt
- Image: Cloudinary
- Deploy: Railway Nixpacks + persistent volume `/data`

## Database & Migration — QUY TẮC CỨNG

**KHÔNG đổi schema bằng cách sửa `schema.sql` rồi mong nó áp dụng.** `schema.sql` chỉ dùng làm reference. Mọi thay đổi schema thực tế = 1 file mới trong `src/db/migrations/`.

Khi user yêu cầu add/sửa/xoá column hoặc table:

1. Tạo file mới `src/db/migrations/NNN_description.{sql|js}` (NNN = số tiếp theo, 3 chữ số).
2. Cột mới phải `NULL` hoặc có `DEFAULT`. **Không bao giờ `NOT NULL` không default.**
3. KHÔNG sửa migration cũ đã có version số.
4. Drop/rename cột: dùng pattern "expand → contract" (xem [docs/MIGRATION.md](docs/MIGRATION.md)).
5. Cập nhật `schema.sql` để khớp với state mới (chỉ để reference, không runtime impact).
6. Test local: `npm run db:migrate` xem có chạy không.

Runner ở `src/db/migrate.js` tự động:
- Tạo bảng `schema_migrations` track version.
- Chạy mỗi migration đúng 1 lần trong transaction.
- Fail giữa chừng → rollback + dừng.

## Backup
- Auto pre-deploy + daily setInterval (24h) trong [src/server.js](src/server.js).
- File backup: `<dbDir>/backups/app-<ISO>.db`. Retention 30 ngày.
- Manual: `npm run db:backup`.

## Files quan trọng
- `src/db/migrate.js` — runner
- `src/db/migrations/` — versioned migration files
- `src/db/schema.sql` — current state reference (KHÔNG là source-of-truth runtime)
- `scripts/backup-db.js` — backup tool
- `docs/MIGRATION.md` — hướng dẫn chi tiết

## Quy ước code khác trong dự án
- `db.prepare(sql).run(args)` cho write; `.get()` / `.all()` cho read.
- Đừng dùng SQLite-specific functions (vd `RANDOM()`, `STRFTIME` đặc thù) trừ khi thật cần.
- Money lưu INTEGER (đơn vị đồng), không dùng REAL.
- Multi-tenant: mọi query phải filter theo `dealer_id` ngoại trừ admin endpoints.

## Khi user nói "đừng push git"
- Mặc định: KHÔNG `git push` cho đến khi user explicit nói "push" hoặc "deploy".
- Edit code thoải mái nhưng dừng ở local commit hoặc chỉ Edit chưa commit.
