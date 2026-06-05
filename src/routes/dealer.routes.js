const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../services/upload.service');
const profileController = require('../controllers/profile.controller');
const productController = require('../controllers/product.controller');
const customerController = require('../controllers/customer.controller');
const quotationController = require('../controllers/quotation.controller');
const imageController = require('../controllers/image-library.controller');
const dealerStatsController = require('../controllers/dealer-stats.controller');

const router = express.Router();

router.use(requireAuth, requireRole('dealer'));

// Dashboard tổng quan của đại lý
router.get('/dashboard/v4', dealerStatsController.dashboardV4);   // mig 015 — 5 sections + filter

// Hồ sơ
router.get('/profile', profileController.getMine);
router.put('/profile', profileController.updateMine);
router.post('/profile/images/:slot', upload.single('file'), profileController.uploadImage);
router.delete('/profile/images/:slot', profileController.deleteImage);

// Kho ảnh (xem ảnh shared của admin + ảnh riêng của đại lý)
router.get('/images', imageController.dealerList);
router.post('/images', upload.single('file'), imageController.dealerUpload);
router.put('/images/:id', imageController.updateMeta);
router.delete('/images/:id', imageController.remove);

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
router.get('/quotations/export.xlsx', quotationController.exportXlsx);  // mig 015 — xuất Excel
router.get('/quotations', quotationController.list);
router.post('/quotations', quotationController.create);
router.get('/quotations/:id', quotationController.getOne);
router.put('/quotations/:id', quotationController.update);
router.delete('/quotations/:id', quotationController.remove);
router.post('/quotations/:id/mark-sent', quotationController.markSent);
router.patch('/quotations/:id/status', quotationController.setStatus);
// mig 015: 5 logical status (Nháp/Chưa gửi/Đã gửi/Đã chốt/Đã trượt) + order status + tài chính
router.patch('/quotations/:id/logical-status', quotationController.setLogicalStatus);
router.patch('/quotations/:id/order-status',   quotationController.setOrderStatus);
router.patch('/quotations/:id/financials',     quotationController.setFinancials);
router.post('/quotations/:id/images/:slot', upload.single('file'), quotationController.uploadImage);
router.post('/quotations/:id/images/:slot/from-library', quotationController.setImageFromLibrary);
router.delete('/quotations/:id/images/:slot', quotationController.deleteImage);
router.patch('/quotations/:id/images/:slot', quotationController.updateImageCaption);

module.exports = router;
