# Deploy Đại Lý Số lên Railway

Hướng dẫn deploy lần đầu từ A-Z, đã test khớp với codebase hiện tại. Thời gian ước tính: **15-20 phút** nếu đã có sẵn account Cloudinary + GitHub repo.

---

## 0. Yêu cầu trước khi bắt đầu

| Item | Cách lấy | Bắt buộc |
|---|---|---|
| Account Railway | https://railway.app (đăng nhập bằng GitHub) | ✅ |
| Account Cloudinary (free tier 25GB) | https://cloudinary.com/users/register/free | ✅ |
| GitHub repo chứa code này | đã có: `duongldhe172545/dealer_profile` | ✅ |
| Thẻ thanh toán (gắn vào Railway) | Railway free $5/tháng đủ dùng nhưng cần thẻ verify | ⚠️ Có lúc bắt buộc |

> **Lưu ý chi phí**: Railway tính theo RAM-hour. App này (~50MB RAM idle) tốn khoảng **$2-4/tháng** với 24/7 uptime. Free trial $5 credits là đủ ~1 tháng test.

---

## 1. Pre-deploy checks (làm ở máy local)

### 1.1. Verify code đã commit + push

```bash
git status                          # phải sạch
git log -1 --oneline                # check commit gần nhất
git push origin main                # đẩy lên GitHub
```

### 1.2. Verify `.env` KHÔNG bị commit

```bash
git ls-files | grep -E "\.env$"     # phải trả rỗng
cat .gitignore | grep ".env"        # phải thấy ".env" trong list
```

Nếu `.env` lỡ commit thì:
```bash
git rm --cached .env
git commit -m "remove .env from tracking"
git push
```
→ Sau đó **đổi tất cả secret** (Cloudinary key, JWT) vì đã bị expose trên GitHub.

### 1.3. Lấy Cloudinary credentials

1. Vào https://console.cloudinary.com → Dashboard
2. Copy 3 giá trị (sẽ paste vào Railway):
   - `Cloud name`
   - `API Key`
   - `API Secret`

### 1.4. Sinh JWT_SECRET production

Chạy lệnh này để có chuỗi random 64 hex:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copy kết quả lưu lại, sẽ paste ở bước 4.

---

## 2. Tạo project Railway

1. Vào https://railway.app/new
2. Chọn **Deploy from GitHub repo**
3. Authorize Railway truy cập GitHub (lần đầu)
4. Chọn repo `dealer_profile` → **Deploy Now**
5. Railway sẽ:
   - Auto-detect là Node.js project (đọc `package.json`)
   - Đọc `railway.json` để biết build = NIXPACKS, start = `npm start`, healthcheck = `/api/healthcheck`
   - Bắt đầu build (mất ~2-3 phút lần đầu)

> ⚠️ Build LẦN ĐẦU sẽ **FAIL** vì thiếu env vars. Đừng hoảng — các bước tiếp theo sẽ fix.

---

## 3. Thêm Volume (BẮT BUỘC — không có thì mất DB khi redeploy)

Railway dùng container ephemeral — disk reset mỗi lần deploy. SQLite file phải nằm trên Volume persistent.

1. Trong project Railway → click vào **service** vừa tạo
2. Tab **Settings** → scroll xuống section **Volumes**
3. Click **+ New Volume**
4. Cấu hình:
   - **Mount path**: `/data`
   - **Size**: 1 GB (đủ rộng — SQLite app này thường < 100MB)
5. Click **Create**

Sau bước này, container có folder `/data` persistent giữa các deploy.

---

## 4. Set Environment Variables

1. Cùng service đó → tab **Variables**
2. Click **+ New Variable** cho từng biến dưới đây:

### Bắt buộc

| Variable | Giá trị | Ghi chú |
|---|---|---|
| `NODE_ENV` | `production` | Bật cache HTTP, tắt debug |
| `JWT_SECRET` | _(chuỗi 64 hex sinh ở bước 1.4)_ | **Đổi giá trị khác hẳn với local** |
| `DB_PATH` | `/data/app.db` | Phải khớp Volume mount path |
| `CLOUDINARY_CLOUD_NAME` | _(từ dashboard Cloudinary)_ | |
| `CLOUDINARY_API_KEY` | _(từ dashboard Cloudinary)_ | |
| `CLOUDINARY_API_SECRET` | _(từ dashboard Cloudinary)_ | |
| `ADMIN_USERNAME` | `admin` | Tài khoản admin auto-seed lần đầu |
| `ADMIN_PASSWORD` | _(mật khẩu mạnh, ≥12 ký tự)_ | **CHỈ DÙNG LẦN ĐẦU** — sau đó đổi qua UI |

### Tuỳ chọn (có default tốt rồi)

| Variable | Giá trị | Ghi chú |
|---|---|---|
| `JWT_EXPIRES_IN` | `7d` | Token JWT sống 7 ngày |
| `BCRYPT_ROUNDS` | `12` | Production nên dùng 12 (chậm hơn nhưng an toàn hơn) |

### KHÔNG cần set

- `PORT` — Railway tự inject biến này, app đọc qua `process.env.PORT`.

> **Tip**: Railway cho phép paste nguyên block KEY=value. Click nút **Raw Editor** trên góc phải tab Variables → paste:
> ```env
> NODE_ENV=production
> JWT_SECRET=<your-64-hex>
> DB_PATH=/data/app.db
> CLOUDINARY_CLOUD_NAME=<your-cloud>
> CLOUDINARY_API_KEY=<your-key>
> CLOUDINARY_API_SECRET=<your-secret>
> ADMIN_USERNAME=admin
> ADMIN_PASSWORD=<your-strong-pw>
> BCRYPT_ROUNDS=12
> ```

---

## 5. Redeploy

Sau khi thêm xong env vars, Railway tự động **redeploy**. Nếu không, click **Deployments** → menu 3 chấm → **Redeploy**.

Theo dõi log realtime ở tab **Deployments** → click vào deployment đang chạy → **View Logs**.

Log thành công sẽ thấy:
```
Migrating database...
  ✓ Schema applied
  ✓ Admin already exists, skip seeding   (hoặc: ✓ Created admin: admin)
Done.
Đại Lý Số đang chạy ở http://localhost:<PORT>
```

> **Lần đầu deploy**: log sẽ thấy `✓ Created admin: admin` — đó là khi admin user được seed từ env vars.

---

## 6. Generate public domain

1. Tab **Settings** → section **Networking**
2. Click **Generate Domain**
3. Railway tạo URL kiểu `your-app-production-abcd.up.railway.app`
4. Mở URL → thấy trang login Đại Lý Số → **deploy thành công**

---

## 7. Lần đầu login + đổi mật khẩu admin

1. Mở domain Railway vừa tạo
2. Login với:
   - Username: `admin`
   - Password: _(giá trị ADMIN_PASSWORD đã set ở bước 4)_
3. Vào trang **Tài khoản của tôi** (góc trên phải header) → đổi mật khẩu ngay
4. Sau khi đổi password, **xóa biến `ADMIN_PASSWORD` khỏi Railway Variables** (để tránh leak nếu lộ env). Code đã có check `seedAdmin()` skip nếu admin tồn tại → không cần env này nữa.

---

## 8. (Tùy chọn) Custom domain

Nếu có domain riêng (vd `dailyso.vn`):

1. Settings → Networking → **Custom Domain**
2. Nhập domain → Railway show CNAME target (vd `your-app.up.railway.app`)
3. Vào DNS provider (Cloudflare/Namecheap/...) thêm record:
   ```
   Type: CNAME
   Name: @  (hoặc subdomain)
   Value: your-app.up.railway.app
   Proxy: DNS only (không bật Cloudflare proxy ở giai đoạn này)
   ```
4. Chờ DNS propagate (5-30 phút). Railway tự cấp SSL Let's Encrypt.

---

## 9. Maintenance

### Redeploy khi push code mới

Railway auto-deploy mỗi lần `git push` vào branch `main`. Không cần thao tác gì.

### Xem log realtime

Service → **Deployments** → deployment hiện tại → **View Logs** (filter theo level: error/warn/info).

### Backup database

SQLite file nằm ở `/data/app.db` trong Volume. Để backup:

**Cách 1 — Download qua Railway CLI** (recommend):
```bash
npm install -g @railway/cli
railway login
railway link               # chọn project + service
railway run cat /data/app.db > backup-$(date +%Y%m%d).db
```

**Cách 2 — Tạo endpoint backup admin-only** (cần code thêm — chưa làm).

Nên backup hàng tuần. Lưu vào Google Drive/local.

### Khi đổi schema DB

Code đã có migration idempotent trong [src/db/migrate.js](src/db/migrate.js). Mỗi `npm start` đều chạy `migrate.js` trước → schema mới tự apply mà không mất data cũ.

### Tăng RAM/CPU (nếu cần scale)

Settings → **Resources** → tăng plan. App này nhẹ, default plan đủ dùng.

---

## 10. Troubleshooting

### Deploy fail: `Missing required env var: JWT_SECRET`

→ Quên set `JWT_SECRET` ở Variables. Quay lại bước 4.

### Deploy thành công nhưng 502 / `Application failed to respond`

Nguyên nhân thường gặp:
- **App không listen đúng port**: phải dùng `process.env.PORT`, không hardcode 3000. Code đã đúng (đọc `env.port`).
- **Healthcheck timeout**: tăng `healthcheckTimeout` trong [railway.json](railway.json) nếu migrate DB lâu.
- **Build OK nhưng crash khi run**: xem log Deployments → tìm dòng "Error:".

### `Error: SQLITE_CANTOPEN: unable to open database file`

→ Volume chưa mount đúng. Verify:
- Volume mount path = `/data` (ở bước 3)
- Env `DB_PATH=/data/app.db` (ở bước 4)
- Folder `/data` writable: Railway tự cấp permission khi mount Volume.

Test bằng Railway shell:
```bash
railway run ls -la /data
```

### `better-sqlite3` build fail

Hiếm gặp. Nếu xảy ra, thêm file `nixpacks.toml` vào root:
```toml
[phases.setup]
nixPkgs = ["python3", "gcc", "gnumake"]
```
Commit + push → Railway rebuild.

### Mất DB sau redeploy

→ Chắc chắn quên mount Volume. Quay lại bước 3. Data cũ KHÔNG khôi phục được — phải tạo lại từ đầu (hoặc restore từ backup).

### Login admin không được sau deploy lần đầu

- Check log có dòng `✓ Created admin: admin` không. Nếu có, dùng đúng `ADMIN_USERNAME` + `ADMIN_PASSWORD` đã set ở Variables.
- Nếu `ADMIN_PASSWORD` chứa ký tự đặc biệt (`!`, `$`, ...) → Railway có thể parse khác. Dùng password chỉ chữ + số lần đầu, đổi qua UI sau.

### Cloudinary upload fail: `Invalid signature`

→ Sai 1 trong 3 biến `CLOUDINARY_*`. Verify lại dashboard.cloudinary.com. API Secret hay bị copy thiếu ký tự cuối.

---

## 11. Checklist tóm tắt

Trước khi báo "đã deploy xong":

- [ ] Code push lên GitHub, `.env` không tracking
- [ ] Railway project created, service running (status xanh)
- [ ] Volume mounted tại `/data` (≥ 1GB)
- [ ] 8 env vars bắt buộc đã set
- [ ] Healthcheck pass (`/api/healthcheck` trả 200)
- [ ] Mở domain public, thấy trang login
- [ ] Login admin OK, đổi password
- [ ] Xóa biến `ADMIN_PASSWORD` khỏi Variables
- [ ] Tạo 1 dealer test, login dealer, upload ảnh, xem hồ sơ render OK
- [ ] Setup backup DB định kỳ (cron local hoặc manual)

---

## Liên hệ / debug nhanh

Stack: Node 18+ · Express 4 · SQLite (better-sqlite3) · JWT · Cloudinary · Railway NIXPACKS.

File quan trọng:
- [package.json](package.json) — `start` script chạy migrate trước
- [railway.json](railway.json) — Railway build config
- [src/server.js](src/server.js) — Express entry point
- [src/db/migrate.js](src/db/migrate.js) — idempotent migration, chạy mỗi deploy
- [src/config/env.js](src/config/env.js) — list env vars (chuẩn để biết cần set gì)
