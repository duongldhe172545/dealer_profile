const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../services/upload.service');
const profileController = require('../controllers/profile.controller');
const productController = require('../controllers/product.controller');
const customerController = require('../controllers/customer.controller');
const quotationController = require('../controllers/quotation.controller');
const iconController = require('../controllers/icon-library.controller');
const iconUploadController = require('../controllers/icon-upload.controller');
const dealerStatsController = require('../controllers/dealer-stats.controller');

const router = express.Router();

router.use(requireAuth, requireRole('dealer'));

// Dashboard tổng quan của đại lý
router.get('/dashboard', dealerStatsController.dashboard);

// Hồ sơ
router.get('/profile', profileController.getMine);
router.put('/profile', profileController.updateMine);
router.post('/profile/images/:slot', upload.single('file'), profileController.uploadImage);
router.delete('/profile/images/:slot', profileController.deleteImage);

// Icon library (read-only cho dealer)
router.get('/icons', iconController.list);

// Upload ảnh riêng làm icon (Cloudinary) cho catalog SP / per-item override BG
router.post('/icon-upload', upload.single('file'), iconUploadController.upload);
router.delete('/icon-upload', iconUploadController.remove);

// Sản phẩm
router.get('/products', productController.list);
router.post('/products', productController.create);
router.get('/products/:id', productController.getOne);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.remove);

// Khách hàng (KHÔNG cho xoá — KH có giá trị lịch sử, chỉ sửa)
router.get('/customers/suggest-code', customerController.suggestCode);
router.get('/customers', customerController.list);
router.post('/customers', customerController.create);
router.get('/customers/:id', customerController.getOne);
router.put('/customers/:id', customerController.update);

// Báo giá
router.get('/quotations/suggest-number', quotationController.suggestNumber);
router.get('/quotations', quotationController.list);
router.post('/quotations', quotationController.create);
router.get('/quotations/:id', quotationController.getOne);
router.put('/quotations/:id', quotationController.update);
router.delete('/quotations/:id', quotationController.remove);
router.post('/quotations/:id/mark-sent', quotationController.markSent);
router.patch('/quotations/:id/status', quotationController.setStatus);
router.post('/quotations/:id/clone', quotationController.clone);
router.post('/quotations/:id/images/:slot', upload.single('file'), quotationController.uploadImage);
router.delete('/quotations/:id/images/:slot', quotationController.deleteImage);
router.patch('/quotations/:id/images/:slot', quotationController.updateImageCaption);

module.exports = router;
