const path = require('path');
const express = require('express');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const dealerRoutes = require('./routes/dealer.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const app = express();

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
