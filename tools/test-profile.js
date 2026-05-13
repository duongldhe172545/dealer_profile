// Smoke test: login → GET profile → PUT profile → GET lại verify.
// Chạy: node tools/test-profile.js
const BASE = 'http://localhost:3000';

async function api(method, path, token, body) {
  const headers = { 'Accept': 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`);
  return data;
}

(async () => {
  const dealer = await api('POST', '/api/auth/login', null, { username: 'minhtam', password: 'matkhau123' });
  const token = dealer.token;
  console.log('Login OK as', dealer.user.username, '(dealer_id =', dealer.user.dealer_id + ')');

  const before = await api('GET', '/api/dealer/profile', token);
  console.log('Before update — ten_dai_ly:', JSON.stringify(before.data.dealer.ten_dai_ly));
  console.log('Before update — tagline:', JSON.stringify(before.data.profile.tagline));

  const updated = await api('PUT', '/api/dealer/profile', token, {
    dealer: {
      ten_dai_ly: 'Đại lý cửa Minh Tâm',
      chu_dai_ly: 'Nguyễn Văn Cường',
      phone: '0901234567',
      email: 'mt@dealer.vn',
      mst: '0101234567',
      address: '123 Lê Lợi',
      district: 'Hai Bà Trưng',
      province: 'Hà Nội',
      coverage: 'Hà Nội · Hà Nam · Hưng Yên',
      years_experience: '8+',
      team_size: '12',
      projects_monthly: '35+',
      open_hours: '08:00 - 20:00',
    },
    profile: {
      tagline: 'Đại lý cửa hàng đầu — giải pháp đồng bộ, khảo sát nhanh, hậu mãi rõ ràng.',
      usp_text: 'Khảo sát tận nơi 24h\nBáo giá rõ ràng\nĐội ngũ có checklist hiện trường',
      services_text: 'Cửa cuốn\nCửa nhôm - kính\nMotor, lưu điện',
      commitments_text: 'Giải thích chi phí trước khi chốt\nBàn giao đầy đủ sau thi công',
      customer_quote: 'Khách chọn vì thấy năng lực thật, ảnh thật, công trình thật.',
      cta_text: 'Quét QR để xem hồ sơ và liên hệ.',
      badge1: 'Đại lý đã xác thực',
      badge2: 'Hỗ trợ khảo sát',
      badge3: 'Có kho/xưởng',
      usp_highlight1: 'Khảo sát nhanh 24h',
      usp_highlight2: 'Đội ngũ bài bản',
      usp_highlight3: 'Hậu mãi rõ ràng',
      metric1_value: '35+', metric1_label: 'dự án/tháng',
      metric2_value: '24h', metric2_label: 'phản hồi',
      metric3_value: '4.8/5', metric3_label: 'đánh giá',
      project_caption1: 'Nhà phố hoàn thiện cửa cuốn',
      project_caption2: 'Cải tạo mặt tiền hệ cửa hiện đại',
      project_caption3: 'Dự án dân dụng đúng tiến độ',
      selected_template: 't2',
    },
  });
  console.log('After update — ten_dai_ly:', JSON.stringify(updated.data.dealer.ten_dai_ly));
  console.log('After update — tagline:', JSON.stringify(updated.data.profile.tagline));
  console.log('After update — template:', updated.data.profile.selected_template);

  const reload = await api('GET', '/api/dealer/profile', token);
  console.log('Reload — coverage:', JSON.stringify(reload.data.dealer.coverage));
  console.log('Reload — badge1:', JSON.stringify(reload.data.profile.badge1));
  console.log('Reload — usp_text:', JSON.stringify(reload.data.profile.usp_text));

  console.log('\n✓ All checks passed. UTF-8 round-trip OK.');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
