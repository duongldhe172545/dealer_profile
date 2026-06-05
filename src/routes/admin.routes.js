const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../services/upload.service');
const dealerController = require('../controllers/dealer.controller');
const statsController = require('../controllers/admin-stats.controller');
const imageController = require('../controllers/image-library.controller');
const adminDbController = require('../controllers/admin-db.controller');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// Quản lý đại lý
router.get('/dealers', dealerController.list);
router.post('/dealers', dealerController.create);
router.get('/dealers/:id', dealerController.getOne);
router.put('/dealers/:id', dealerController.update);
router.patch('/dealers/:id/status', dealerController.setStatus);
router.post('/dealers/:id/reset-password', dealerController.resetPassword);

// Stats / Cross-dealer views
router.get('/stats/dashboard', statsController.dashboard);
router.get('/all/quotations', statsController.quotations);
router.get('/all/customers', statsController.customers);
router.get('/all/products', statsController.products);
router.get('/dealers/:id/full', statsController.dealerDetail);
router.get('/dealers/:id/dashboard', statsController.dealerDashboard);
router.get('/export/:type', statsController.exportCSV);

// Tải backup DB (cho admin — Railway free tier không có Backup tab)
router.get('/db-download', adminDbController.downloadDb);          // file .db sqlite
router.get('/db-export-html', adminDbController.exportHtml);       // file .html xem trong browser

// Kho ảnh (admin xem tất cả + upload shared)
router.get('/images', imageController.adminList);
router.post('/images', upload.single('file'), imageController.adminUpload);
router.put('/images/:id', imageController.updateMeta);
router.delete('/images/:id', imageController.remove);

// Audit log
const auditModel = require('../models/audit.model');
router.get('/audit', (req, res, next) => {
  try {
    const data = auditModel.list({
      action: req.query.action, user_id: req.query.user_id,
      dealer_id: req.query.dealer_id, from: req.query.from, to: req.query.to,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ data });
  } catch (err) { next(err); }
});

module.exports = router;
