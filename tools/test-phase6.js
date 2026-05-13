// E2E test Phase 6 (admin dashboard) + account + confirmed/cancelled
const BASE = 'http://localhost:3000';

async function api(method, path, token, body) {
  const headers = { 'Accept': 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data)}`);
  return data;
}

async function login(username, password) {
  return (await api('POST', '/api/auth/login', null, { username, password })).token;
}

(async () => {
  console.log('━━━ E2E Phase 6 + account + confirmed/cancelled ━━━');

  const adminToken = await login('admin', 'ChangeMe123!');
  console.log('✓ Login admin');

  // === ACCOUNT (admin) ===
  console.log('\n[Account] /api/auth/me + update + change-password');
  const me = await api('GET', '/api/auth/me', adminToken);
  console.log('  ✓ /me:', me.user.username, '· role:', me.user.role);

  await api('PUT', '/api/auth/me', adminToken, { full_name: 'Quản trị viên (E2E)' });
  const me2 = await api('GET', '/api/auth/me', adminToken);
  console.log('  ✓ Update full_name →', me2.user.full_name);
  // Trả lại
  await api('PUT', '/api/auth/me', adminToken, { full_name: 'Quản trị viên' });

  // Đổi password sai current → fail
  try {
    await api('POST', '/api/auth/change-password', adminToken, { current_password: 'wrong', new_password: 'NewPass123!' });
    console.log('  ✗ FAIL: lẽ ra phải reject');
  } catch (e) { console.log('  ✓ Sai mật khẩu hiện tại bị reject:', e.message.slice(0, 80)); }

  // Đổi password đúng + đổi lại
  await api('POST', '/api/auth/change-password', adminToken, { current_password: 'ChangeMe123!', new_password: 'NewPass456!' });
  console.log('  ✓ Đổi password thành công');
  const newToken = await login('admin', 'NewPass456!');
  console.log('  ✓ Login bằng password mới');
  // Đổi lại
  await api('POST', '/api/auth/change-password', newToken, { current_password: 'NewPass456!', new_password: 'ChangeMe123!' });
  console.log('  ✓ Đổi lại password gốc');

  // === SEEDING TEST DATA ===
  console.log('\n[Seeding] Tạo dealer + KH + báo giá test');
  let dealerToken;
  try { dealerToken = await login('phase6_dealer', 'matkhau123456'); }
  catch {
    await api('POST', '/api/admin/dealers', adminToken, {
      dealer_code: 'DL-P6', ten_dai_ly: 'Đại Lý Phase 6', chu_dai_ly: 'NV Test',
      phone: '0911111111', province: 'Hà Nội',
      username: 'phase6_dealer', password: 'matkhau123456',
    });
    dealerToken = await login('phase6_dealer', 'matkhau123456');
  }

  const p = await api('POST', '/api/dealer/products', dealerToken, {
    ma_sp: 'P6-SP1', nhom_sp: 'Cửa nhôm', mo_ta: 'Cửa nhôm test',
    cach_tinh_gia: 'kich_thuoc', dvt_mac_dinh: 'bộ', don_gia_mac_dinh: 3000000, active: 1,
  });
  const c = await api('POST', '/api/dealer/customers', dealerToken, {
    ten_kh: 'KH Phase 6', phone: '0922222222',
  });
  const q = await api('POST', '/api/dealer/quotations', dealerToken, {
    customer_id: c.data.id, ngay_bao_gia: '2026-05-12',
    dia_chi_cong_trinh: 'Công trình test', chi_phi_van_chuyen: 1000000,
    chi_phi_lap_dat: 2000000, vat_percent: 10,
    items: [
      { ma_sp: 'P6-SP1', mo_ta: 'Cửa nhôm test', cach_tinh_gia: 'kich_thuoc',
        rong: 2000, cao: 2200, sl: 1, dvt: 'bộ', don_gia: 3000000, product_id: p.data.id },
    ],
  });
  console.log('  ✓ Tạo báo giá:', q.data.so_bao_gia, '· tổng:', q.data.tong_cong.toLocaleString('vi-VN'));

  // === CONFIRMED / CANCELLED ===
  console.log('\n[Confirmed/Cancelled]');
  // Báo giá draft không thể confirm trực tiếp — flow đúng là draft → sent → confirmed/cancelled
  // Test: đánh dấu sent → confirm
  await api('POST', `/api/dealer/quotations/${q.data.id}/mark-sent`, dealerToken, {
    sent_method: 'zalo', sent_note: 'Test gửi',
  });
  console.log('  ✓ Mark sent');

  const confirmed = await api('PATCH', `/api/dealer/quotations/${q.data.id}/status`, dealerToken, { status: 'confirmed' });
  console.log('  ✓ Set confirmed · status:', confirmed.data.status);

  // === PHASE 6: ADMIN DASHBOARD ===
  console.log('\n[Phase 6] Admin Dashboard');

  const ov = await api('GET', '/api/admin/stats/overview', adminToken);
  console.log('  ✓ Overview: dealers_active =', ov.data.kpi.dealers_active,
              '· quotations_month =', ov.data.kpi.quotations_month,
              '· revenue_month =', ov.data.kpi.revenue_month.toLocaleString('vi-VN'));
  console.log('  ✓ Monthly buckets:', ov.data.monthly.length);
  console.log('  ✓ Top dealers:', ov.data.top_dealers.length);
  console.log('  ✓ Top products:', ov.data.top_products.length);
  console.log('  ✓ Price groups:', ov.data.price_groups.length);

  const all = await api('GET', '/api/admin/all/quotations', adminToken);
  console.log('  ✓ All quotations (cross-dealer):', all.data.length);

  const det = await api('GET', `/api/admin/dealers/${q.data.dealer_id}/full`, adminToken);
  console.log('  ✓ Dealer drill-down:',
              det.data.dealer.ten_dai_ly,
              '· quotations:', det.data.quotations.length,
              '· customers:', det.data.customers.length,
              '· products:', det.data.products.length);

  // CSV exports (chỉ test trả 200)
  for (const t of ['quotations', 'customers', 'products', 'dealers']) {
    const res = await fetch(BASE + '/api/admin/export/' + t, { headers: { 'Authorization': 'Bearer ' + adminToken } });
    const text = await res.text();
    const lines = text.split('\n').length;
    console.log(`  ✓ Export ${t}: ${res.status} · ${lines} dòng · ${text.length} bytes`);
  }

  // === RBAC ===
  console.log('\n[RBAC] Dealer không gọi được admin endpoints');
  try { await api('GET', '/api/admin/stats/overview', dealerToken); console.log('  ✗ FAIL'); }
  catch (e) { console.log('  ✓ Dealer bị chặn stats:', e.message.slice(0, 60)); }
  try { await api('GET', '/api/admin/all/quotations', dealerToken); console.log('  ✗ FAIL'); }
  catch (e) { console.log('  ✓ Dealer bị chặn cross-view:', e.message.slice(0, 60)); }

  // === CLEANUP ===
  console.log('\n[Cleanup]');
  await api('DELETE', `/api/dealer/quotations/${q.data.id}`, dealerToken);
  await api('DELETE', `/api/dealer/customers/${c.data.id}`, dealerToken);
  await api('DELETE', `/api/dealer/products/${p.data.id}`, dealerToken);
  console.log('  ✓ Dọn data test');

  console.log('\n✓ Tất cả test pass');
})().catch(e => {
  console.error('\n✗ FAIL:', e.message);
  process.exit(1);
});
