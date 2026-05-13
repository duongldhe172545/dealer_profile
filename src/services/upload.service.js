const multer = require('multer');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const { badRequest } = require('../utils/http');

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// Multer instance dùng memory storage (file sẽ chuyển thẳng sang Cloudinary, không lưu disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP'));
    } else {
      cb(null, true);
    }
  },
});

async function uploadBuffer(buffer, folder) {
  if (!isConfigured) {
    throw badRequest('Cloudinary chưa được cấu hình. Vui lòng liên hệ quản trị viên');
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // KHÔNG transform lúc upload — để Cloudinary CDN tự transform khi serve.
        // Khi FE render ảnh có thể thêm params w_1920,q_auto,f_auto vào URL nếu muốn.
      },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

async function deleteByPublicId(publicId) {
  if (!isConfigured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Cloudinary delete failed:', publicId, err.message);
  }
}

module.exports = { upload, uploadBuffer, deleteByPublicId };
