const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau' },
});

router.post('/login', loginLimiter, controller.login);
router.get('/me', requireAuth, controller.me);
router.put('/me', requireAuth, controller.updateProfile);
router.post('/change-password', requireAuth, controller.changePassword);

module.exports = router;
