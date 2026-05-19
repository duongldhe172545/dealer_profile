const path = require('path');
const express = require('express');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const dealerRoutes = require('./routes/dealer.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const app = express();

// Railway/Vercel/Render đều dùng reverse proxy phía trước → set X-Forwarded-For.
// Phải bật trust proxy để Express đọc đúng IP client (cần cho express-rate-limit).
// "1" = tin 1 lớp proxy trước app (Railway proxy). Production = 1, local = 0.
app.set('trust proxy', env.nodeEnv === 'production' ? 1 : false);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Static frontend (dev: chặn cache để code mới luôn được nạp)
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders: (res, filePath) => {
    if (env.nodeEnv !== 'production') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

// API routes
app.get('/api/healthcheck', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dealer', dealerRoutes);

// 404 cho API routes
app.use('/api', notFoundHandler);

// Error handler — luôn đặt cuối
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Đại Lý Số đang chạy ở http://localhost:${env.port}`);
});

// Daily auto-backup DB — chạy 24h/lần khi server đang up.
// Pre-deploy backup đã được lo bởi `npm start` (scripts/backup-db.js).
// Mục này phòng case server chạy nhiều ngày không deploy → vẫn có backup ngày.
const runBackup = require('../scripts/backup-db');
const DAY_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  console.log('[auto-backup] Bắt đầu backup định kỳ...');
  runBackup().catch(err => console.error('[auto-backup] FAIL:', err.message));
}, DAY_MS);
