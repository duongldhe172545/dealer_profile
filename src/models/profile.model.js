const db = require('../config/database');

const PROFILE_FIELDS = [
  'tagline', 'usp_text', 'services_text', 'commitments_text',
  'customer_quote', 'cta_text',
  'badge1', 'badge2', 'badge3',
  'usp_highlight1', 'usp_highlight2', 'usp_highlight3',
  'metric1_value', 'metric1_label',
  'metric2_value', 'metric2_label',
  'metric3_value', 'metric3_label',
  'project_caption1', 'project_caption2', 'project_caption3',
  'team_caption_doi_ngu_1', 'team_caption_kho_xuong', 'team_caption_doi_ngu_2',
  'partners_title',
  'selected_template',
];

function getProfile(dealerId) {
  return db.prepare(`SELECT * FROM dealer_profiles WHERE dealer_id = ?`).get(dealerId);
}

function getImages(dealerId) {
  return db.prepare(`SELECT slot, url FROM dealer_images WHERE dealer_id = ?`).all(dealerId);
}

// Upsert: nếu slot đã có ảnh -> update + trả về public_id cũ (để controller xoá Cloudinary).
function upsertImage(dealerId, slot, { url, publicId }) {
  const existing = db.prepare('SELECT id, public_id FROM dealer_images WHERE dealer_id = ? AND slot = ?').get(dealerId, slot);
  if (existing) {
    db.prepare('UPDATE dealer_images SET url = ?, public_id = ?, uploaded_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(url, publicId, existing.id);
    return existing.public_id;
  }
  db.prepare('INSERT INTO dealer_images (dealer_id, slot, url, public_id) VALUES (?, ?, ?, ?)')
    .run(dealerId, slot, url, publicId);
  return null;
}

function deleteImage(dealerId, slot) {
  const existing = db.prepare('SELECT public_id FROM dealer_images WHERE dealer_id = ? AND slot = ?').get(dealerId, slot);
  if (!existing) return null;
  db.prepare('DELETE FROM dealer_images WHERE dealer_id = ? AND slot = ?').run(dealerId, slot);
  return existing.public_id;
}

function upsertProfile(dealerId, data) {
  const existing = getProfile(dealerId);
  const payload = { dealer_id: dealerId, ...Object.fromEntries(PROFILE_FIELDS.map(f => [f, data[f] ?? null])) };

  if (existing) {
    const sets = PROFILE_FIELDS.map(f => `${f} = @${f}`).join(', ');
    db.prepare(`UPDATE dealer_profiles SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE dealer_id = @dealer_id`).run(payload);
  } else {
    const cols = ['dealer_id', ...PROFILE_FIELDS].join(', ');
    const placeholders = ['@dealer_id', ...PROFILE_FIELDS.map(f => `@${f}`)].join(', ');
    db.prepare(`INSERT INTO dealer_profiles (${cols}) VALUES (${placeholders})`).run(payload);
  }
}

module.exports = { PROFILE_FIELDS, getProfile, getImages, upsertProfile, upsertImage, deleteImage };
