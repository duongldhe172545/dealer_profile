const db = require('../config/database');
const dealerModel = require('../models/dealer.model');
const profileModel = require('../models/profile.model');
const uploadService = require('./upload.service');
const { badRequest, notFound } = require('../utils/http');
const { cleanString } = require('../utils/sanitize');

const TEMPLATES = ['t1', 't2', 't3'];
// Slot ảnh hồ sơ (mig 019). Nội dung tối đa 10: 1 đội ngũ + 5 công trình + 4 sản phẩm.
// + thương hiệu: logo, qr, 3 logo đối tác. (doi_ngu_2 cũ đã migrate -> cong_trinh_4)
const IMAGE_SLOTS = [
  'logo_dai_ly', 'qr_code',
  'doi_ngu_1',
  'cong_trinh_1', 'cong_trinh_2', 'cong_trinh_3', 'cong_trinh_4', 'cong_trinh_5',
  'san_pham_1', 'san_pham_2', 'san_pham_3', 'san_pham_4',
  'partner_logo_1', 'partner_logo_2', 'partner_logo_3',
];

// Trường đại lý tự sửa được (KHÔNG cho sửa dealer_code, status)
const DEALER_EDITABLE = [
  'ten_dai_ly', 'chu_dai_ly', 'phone', 'email',
  'address', 'district', 'province', 'coverage',
  'years_experience', 'team_size', 'projects_monthly', 'open_hours',
];

const clean = cleanString;  // không có default max — caller truyền explicit khi cần

function get(dealerId) {
  const dealer = dealerModel.findById(dealerId);
  if (!dealer) throw notFound('Không tìm thấy đại lý');
  const profile = profileModel.getProfile(dealerId);
  const images = profileModel.getImages(dealerId);

  return {
    dealer,
    profile: profile || { dealer_id: dealerId, selected_template: 't1' },
    images: Object.fromEntries(images.map(i => [i.slot, i.url])),
  };
}

function update(dealerId, body) {
  const dealer = dealerModel.findById(dealerId);
  if (!dealer) throw notFound('Không tìm thấy đại lý');

  const dealerInput = body.dealer || {};
  const profileInput = body.profile || {};

  const dealerUpdate = { dealer_code: dealer.dealer_code };
  for (const f of DEALER_EDITABLE) {
    dealerUpdate[f] = clean(dealerInput[f], 300);
  }
  if (!dealerUpdate.ten_dai_ly) throw badRequest('Vui lòng nhập tên đại lý');

  const profileUpdate = {};
  for (const f of profileModel.PROFILE_FIELDS) {
    if (f === 'selected_template') {
      const t = profileInput[f] || 't1';
      if (!TEMPLATES.includes(t)) throw badRequest('Mẫu hồ sơ không hợp lệ');
      profileUpdate[f] = t;
    } else {
      profileUpdate[f] = clean(profileInput[f], 2000);
    }
  }

  const tx = db.transaction(() => {
    dealerModel.update(dealerId, dealerUpdate);
    profileModel.upsertProfile(dealerId, profileUpdate);
  });
  tx();

  return get(dealerId);
}

async function uploadImage(dealerId, slot, fileBuffer) {
  if (!IMAGE_SLOTS.includes(slot)) throw badRequest('Vị trí ảnh không hợp lệ');
  if (!fileBuffer || fileBuffer.length === 0) throw badRequest('Vui lòng chọn ảnh');

  const result = await uploadService.uploadBuffer(fileBuffer, `daily-so/dealers/${dealerId}`);
  const oldPublicId = profileModel.upsertImage(dealerId, slot, {
    url: result.secure_url,
    publicId: result.public_id,
  });

  if (oldPublicId) uploadService.deleteByPublicId(oldPublicId).catch(() => {}); // fire-and-forget

  return { slot, url: result.secure_url };
}

async function deleteImage(dealerId, slot) {
  if (!IMAGE_SLOTS.includes(slot)) throw badRequest('Vị trí ảnh không hợp lệ');
  const publicId = profileModel.deleteImage(dealerId, slot);
  if (publicId) uploadService.deleteByPublicId(publicId).catch(() => {});
}

module.exports = { get, update, uploadImage, deleteImage, TEMPLATES, IMAGE_SLOTS };
