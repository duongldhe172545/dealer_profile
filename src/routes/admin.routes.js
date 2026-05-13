const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const dealerController = require('../controllers/dealer.controller');
const statsController = require('../controllers/admin-stats.controller');

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
router.get('/stats/overview', statsController.overview);
router.get('/all/quotations', statsController.quotations);
router.get('/all/customers', statsController.customers);
router.get('/all/products', statsController.products);
router.get('/dealers/:id/full', statsController.dealerDetail);
router.get('/export/:type', statsController.exportCSV);

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
