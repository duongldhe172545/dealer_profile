# Đại Lý Số

Web app cho đại lý ngành cửa: làm hồ sơ giới thiệu năng lực + tạo báo giá gửi khách hàng. Admin có dashboard tổng quan toàn bộ data.

## Tech stack
- Backend: Node.js + Express + SQLite
- Frontend: HTML + Tailwind CSS + Alpine.js (CDN, không build step)
- Auth: JWT, username + password
- Image: Cloudinary
- Deploy: Railway

## Yêu cầu
- Node.js 18+
- Account Cloudinary (free tier)

## Setup local

```bash
# 1. Cài dependencies
npm install

# 2. Copy file env
cp .env.example .env
# Sửa .env: thêm CLOUDINARY_* và đổi JWT_SECRET, ADMIN_PASSWORD

# 3. Khởi tạo database + admin mặc định
npm run db:migrate

# 4. Chạy server
npm run dev
```

Server chạy ở `http://localhost:3000`. Login với `admin` + mật khẩu trong `.env`.

## Cấu trúc thư mục

```
.
├── src/
│   ├── config/         Cấu hình (env, DB, Cloudinary)
│   ├── db/             Schema SQL + migration scripts
│   ├── middleware/     Auth, role guard, error handler
│   ├── routes/         HTTP route definitions
│   ├── controllers/    Nhận request, gọi service, trả response
│   ├── services/       Business logic
│   ├── models/         Data access layer (truy vấn DB)
│   ├── utils/          Helpers (password, jwt, format VN)
│   └── server.js       Entry point
├── public/
│   ├── admin/          UI cho admin
│   ├── dealer/         UI cho đại lý
│   └── assets/         CSS, JS dùng chung
├── data/               SQLite file + uploads tạm (gitignored)
└── docs/               Tài liệu nghiệp vụ
```

## Tài liệu

- [HIEU_NGHIEP_VU.md](HIEU_NGHIEP_VU.md) — Nghiệp vụ + luồng người dùng
- [KE_HOACH.md](KE_HOACH.md) — Stack, schema DB, roadmap

## Quyền

- **Admin** (1 tài khoản, tạo lúc migrate): quản lý đại lý, xem toàn bộ data
- **Đại lý**: tự quản lý hồ sơ, sản phẩm, khách hàng, báo giá của mình. Không thấy data đại lý khác.

## Deploy Railway

1. Push code lên GitHub
2. Vào https://railway.app → New Project → Deploy from GitHub repo → chọn repo này
3. Railway tự detect Node.js, dùng `railway.json` để build + start
4. Vào tab **Variables** thêm các env (theo `.env.example`):
   ```
   PORT=                  # Railway tự inject, không cần set
   NODE_ENV=production
   JWT_SECRET=<random 64 ký tự>
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<mật khẩu mạnh>
   DB_PATH=/data/app.db
   ```
5. **Volume** (bắt buộc, để SQLite không mất khi redeploy): tab **Settings** → **Volumes** → Add Volume → mount path `/data`. App sẽ lưu `app.db` ở đó.
6. Build & deploy → `npm start` chạy migrate + server. Database tự tạo + admin tự seed nếu chưa có.
7. Tab **Settings** → **Networking** → **Generate domain** để có URL public (vd `your-app.up.railway.app`).

Healthcheck: `GET /api/healthcheck` (Railway tự ping mỗi vài giây).
