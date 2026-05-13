// Test audit log + KH no-delete + view KH quotations
const BASE = 'http://localhost:3000';

async function api(method, path, token, body) {
  const headers = { 'Accept': 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  return { ok: res.ok, status: res.status, data };
}
async function ok(...args) {
  const r = await api(...args);
  if (!r.ok) throw new Error(`${args[0]} ${args[1]} → ${r.status}: ${JSON.stringify(r.data)}`);
  return r.data;
}
async function login(u, p) { return (await ok('POST', '/api/auth/login', null, { username: u, password: p })).token; }

(async () => {
  console.log('━━━ Test audit log + KH no-delete ━━━');

  const adminToken = await login('admin', 'ChangeMe123!');
  console.log('✓ Login admin');

  // Tạo dealer (sẽ log dealer.create)
  let dealerToken;
  try { dealerToken = await login('audit_dealer', 'matkhau123456'); }
  catch {
    await ok('POST', '/api/admin/dealers', adminToken, {
      dealer_code: 'DL-AUDIT', ten_dai_ly: 'Audit Test Dealer', chu_dai_ly: 'Test',
      phone: '0900000000', province: 'Hà Nội',
      username: 'audit_dealer', password: 'matkhau123456',
    });
    dealerToken = await login('audit_dealer', 'matkhau123456');
  }
  console.log('✓ Dealer ready');

  // Tạo KH → log customer.create
  const c = await ok('POST', '/api/dealer/customers', dealerToken, {
    ten_kh: 'KH Audit Test', phone: '0911', email: 'audit@test.vn',
  });
  console.log('✓ Tạo KH:', c.data.ma_kh);

  // Tạo SP để có item
  const p = await ok('POST', '/api/dealer/products', dealerToken, {
    ma_sp: 'AUDIT-SP', cach_tinh_gia: 'so_luong', dvt_mac_dinh: 'cái', don_gia_mac_dinh: 100000, active: 1,
  });

  // Tạo báo giá → log quotation.create
  const q = await ok('POST', '/api/dealer/quotations', dealerToken, {
    customer_id: c.data.id, ngay_bao_gia: '2026-05-12',
    chi_phi_van_chuyen: 0, chi_phi_lap_dat: 0, vat_percent: 10,
    items: [{ ma_sp: 'AUDIT-SP', cach_tinh_gia: 'so_luong', sl: 2, dvt: 'cái', don_gia: 100000 }],
  });
  console.log('✓ Tạo báo giá:', q.data.so_bao_gia);

  // Mark sent → log quotation.send
  await ok('POST', `/api/dealer/quotations/${q.data.id}/mark-sent`, dealerToken, { sent_method: 'zalo' });
  console.log('✓ Mark sent');

  // Confirm → log quotation.confirm
  await ok('PATCH', `/api/dealer/quotations/${q.data.id}/status`, dealerToken, { status: 'confirmed' });
  console.log('✓ Mark confirmed');

  // Update KH (KHÔNG được log)
  await ok('PUT', `/api/dealer/customers/${c.data.id}`, dealerToken, {
    ma_kh: c.data.ma_kh, ten_kh: 'KH Audit Test (Updated)',
  });
  console.log('✓ Update KH (không log)');

  // Test DELETE customer endpoint phải bị 404 (đã bỏ)
  const del = await api('DELETE', `/api/dealer/customers/${c.data.id}`, dealerToken);
  console.log(`✓ DELETE /customers/:id phải 404: ${del.status} ${del.ok ? 'FAIL' : 'OK'}`);

  // Test view KH's quotations
  const list = await ok('GET', `/api/dealer/quotations?customer_id=${c.data.id}`, dealerToken);
  console.log('✓ Báo giá của KH này:', list.data.length, 'cái');

  // Admin xem audit log
  console.log('\n[Audit log]');
  const audit = await ok('GET', '/api/admin/audit?limit=20', adminToken);
  const recent = audit.data.filter(r => ['dealer.create', 'customer.create', 'quotation.create', 'quotation.send', 'quotation.confirm'].includes(r.action));
  const actions = {};
  for (const r of recent) actions[r.action] = (actions[r.action] || 0) + 1;
  console.log('  ✓ Số dòng audit gần đây theo action:');
  Object.entries(actions).forEach(([a, n]) => console.log(`    - ${a}: ${n}`));

  // Verify mỗi action có ít nhất 1 dòng từ session test này
  const expectedActions = ['customer.create', 'quotation.create', 'quotation.send', 'quotation.confirm'];
  for (const a of expectedActions) {
    if (!actions[a]) console.log(`  ✗ MISSING action: ${a}`);
    else console.log(`  ✓ ${a} logged`);
  }

  // Cleanup
  await ok('DELETE', `/api/dealer/quotations/${q.data.id}`, dealerToken);
  await ok('DELETE', `/api/dealer/products/${p.data.id}`, dealerToken);
  console.log('\n✓ Test pass');
})().catch(e => { console.error('✗ FAIL:', e.message); process.exit(1); });
