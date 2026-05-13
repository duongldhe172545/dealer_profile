// E2E test: Phase 3 (Sản phẩm) + Phase 4 (KH) + Phase 5 (Báo giá)
// Cần: 1 dealer account đã có (vd minhtam/matkhau123). Nếu chưa có sẽ tự tạo qua admin.
const BASE = 'http://localhost:3000';

async function api(method, path, token, body) {
  const headers = { 'Accept': 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function login(username, password) {
  const r = await api('POST', '/api/auth/login', null, { username, password });
  return r.token;
}

async function ensureDealer() {
  const adminToken = await login('admin', 'ChangeMe123!');
  try {
    return await login('e2e_dealer', 'matkhau123456');
  } catch {
    const dealerName = 'Đại Lý E2E Test';
    await api('POST', '/api/admin/dealers', adminToken, {
      dealer_code: 'DL-E2E', ten_dai_ly: dealerName, chu_dai_ly: 'Nguyễn E2E',
      phone: '0900000000', email: 'e2e@test.vn', mst: '0123456789',
      province: 'Hà Nội', district: 'Hai Bà Trưng', address: 'Số 1 đường E2E',
      username: 'e2e_dealer', password: 'matkhau123456',
    });
    return await login('e2e_dealer', 'matkhau123456');
  }
}

(async () => {
  console.log('━━━ E2E test Phase 3-4-5 ━━━');
  const token = await ensureDealer();
  console.log('✓ Login dealer OK');

  // === PHASE 3: SẢN PHẨM ===
  console.log('\n[Phase 3] Sản phẩm');
  // Tạo 3 SP với 3 cách tính giá khác nhau
  const p1 = await api('POST', '/api/dealer/products', token, {
    ma_sp: 'NA-X01', nhom_sp: 'Cửa nhôm', mo_ta: 'Cửa nhôm Xingfa kính hộp',
    cach_tinh_gia: 'kich_thuoc', dvt_mac_dinh: 'bộ', don_gia_mac_dinh: 3500000, active: 1,
  });
  console.log('  ✓ SP1 (kích thước):', p1.data.ma_sp);
  const p2 = await api('POST', '/api/dealer/products', token, {
    ma_sp: 'MOTOR-01', nhom_sp: 'Phụ kiện', mo_ta: 'Motor cuốn cửa',
    cach_tinh_gia: 'so_luong', dvt_mac_dinh: 'cái', don_gia_mac_dinh: 5500000, active: 1,
  });
  console.log('  ✓ SP2 (số lượng):', p2.data.ma_sp);
  const p3 = await api('POST', '/api/dealer/products', token, {
    ma_sp: 'TON-01', nhom_sp: 'Vật tư', mo_ta: 'Tôn lạnh dày 4mm',
    cach_tinh_gia: 'can', dvt_mac_dinh: 'kg', don_gia_mac_dinh: 25000, active: 1,
  });
  console.log('  ✓ SP3 (cân):', p3.data.ma_sp);

  const products = await api('GET', '/api/dealer/products', token);
  console.log('  ✓ List products:', products.data.length, '· groups:', products.groups);

  // === PHASE 4: KHÁCH HÀNG ===
  console.log('\n[Phase 4] Khách hàng');
  const suggest = await api('GET', '/api/dealer/customers/suggest-code', token);
  console.log('  ✓ Gợi ý mã KH:', suggest.ma_kh);

  const c1 = await api('POST', '/api/dealer/customers', token, {
    ten_kh: 'Công ty CP XYZ', nguoi_lien_he: 'Trần Thị B',
    phone: '0988888888', email: 'b@xyz.vn', dia_chi: 'KĐT Nam An Khánh, Hoài Đức, Hà Nội',
  });
  console.log('  ✓ KH1:', c1.data.ma_kh, '·', c1.data.ten_kh);

  const c2 = await api('POST', '/api/dealer/customers', token, {
    ma_kh: 'KH-CUSTOM', ten_kh: 'Khách Lẻ Số 2', phone: '0911111111',
  });
  console.log('  ✓ KH2 (mã custom):', c2.data.ma_kh);

  const customers = await api('GET', '/api/dealer/customers', token);
  console.log('  ✓ List customers:', customers.data.length);

  // === PHASE 5: BÁO GIÁ ===
  console.log('\n[Phase 5] Báo giá');
  const sn = await api('GET', '/api/dealer/quotations/suggest-number', token);
  console.log('  ✓ Gợi ý số BG:', sn.so_bao_gia);

  const q1 = await api('POST', '/api/dealer/quotations', token, {
    customer_id: c1.data.id,
    ngay_bao_gia: '2026-05-12',
    dia_chi_cong_trinh: 'Tầng 5, Toà X, KĐT Nam An Khánh',
    ghi_chu_ho_so: 'Báo giá theo hồ sơ concept ban đầu.',
    chi_phi_van_chuyen: 3000000,
    chi_phi_lap_dat: 5000000,
    vat_percent: 10,
    thanh_toan: 'Đặt cọc 40% · 50% khi giao · 10% nghiệm thu',
    tien_do: '12-18 ngày',
    bao_hanh: '24 tháng',
    items: [
      // Line 1: kích thước 1800×2400 mm, 2 bộ, 3.5M/m² → 1.8×2.4×2×3.5M
      { ma_sp: 'NA-X01', nhom_sp: 'Cửa nhôm', mo_ta: 'Cửa nhôm Xingfa kính hộp Low-E',
        cach_tinh_gia: 'kich_thuoc', rong: 1800, cao: 2400, sl: 2,
        dvt: 'bộ', don_gia: 3500000, product_id: p1.data.id },
      // Line 2: 3 motor
      { ma_sp: 'MOTOR-01', mo_ta: 'Motor Austmatic cao cấp',
        cach_tinh_gia: 'so_luong', sl: 3, dvt: 'cái', don_gia: 5500000,
        product_id: p2.data.id },
      // Line 3: 50kg tôn @ 25k
      { ma_sp: 'TON-01', mo_ta: 'Tôn lạnh dày 4mm',
        cach_tinh_gia: 'can', can_nang: 50, sl: 1, dvt: 'kg', don_gia: 25000,
        product_id: p3.data.id },
    ],
  });
  console.log('  ✓ Tạo báo giá:', q1.data.so_bao_gia);
  console.log('    - Items:', q1.data.items.length);
  console.log('    - Tạm tính:', q1.data.tam_tinh.toLocaleString('vi-VN'), 'đ');
  console.log('    - VAT amount:', q1.data.vat_amount.toLocaleString('vi-VN'), 'đ');
  console.log('    - Tổng cộng:', q1.data.tong_cong.toLocaleString('vi-VN'), 'đ');
  console.log('    - Item 1 (kích thước) thành tiền:', q1.data.items[0].thanh_tien.toLocaleString('vi-VN'),
              '(expected ~30,240,000 = 1.8×2.4×2×3.5M)');
  console.log('    - Item 2 (số lượng) thành tiền:', q1.data.items[1].thanh_tien.toLocaleString('vi-VN'),
              '(expected 16,500,000 = 3×5.5M)');
  console.log('    - Item 3 (cân) thành tiền:', q1.data.items[2].thanh_tien.toLocaleString('vi-VN'),
              '(expected 1,250,000 = 50×25k)');

  // Đánh dấu đã gửi
  const sent = await api('POST', `/api/dealer/quotations/${q1.data.id}/mark-sent`, token, {
    sent_method: 'zalo', sent_note: 'Gửi qua Zalo lúc 14:30',
  });
  console.log('  ✓ Đánh dấu đã gửi · status:', sent.data.status, '· method:', sent.data.sent_method);

  // Update báo giá đã gửi → phải bị từ chối
  try {
    await api('PUT', `/api/dealer/quotations/${q1.data.id}`, token, { items: [] });
    console.log('  ✗ FAIL: lẽ ra không cho sửa báo giá đã gửi');
  } catch (e) {
    console.log('  ✓ Đã chặn sửa báo giá đã gửi:', e.message.slice(0, 80));
  }

  // Clone
  const cloned = await api('POST', `/api/dealer/quotations/${q1.data.id}/clone`, token, {});
  console.log('  ✓ Clone báo giá → mã mới:', cloned.data.so_bao_gia, '· status:', cloned.data.status);

  // List
  const list = await api('GET', '/api/dealer/quotations', token);
  console.log('  ✓ List báo giá:', list.data.length, 'cái');

  // Cleanup: xoá báo giá test
  await api('DELETE', `/api/dealer/quotations/${q1.data.id}`, token);
  await api('DELETE', `/api/dealer/quotations/${cloned.data.id}`, token);
  // Xoá KH (chỉ KH chưa có báo giá còn lại)
  await api('DELETE', `/api/dealer/customers/${c2.data.id}`, token);
  await api('DELETE', `/api/dealer/customers/${c1.data.id}`, token);
  // Xoá SP
  await api('DELETE', `/api/dealer/products/${p1.data.id}`, token);
  await api('DELETE', `/api/dealer/products/${p2.data.id}`, token);
  await api('DELETE', `/api/dealer/products/${p3.data.id}`, token);
  console.log('  ✓ Dọn data test');

  // Test RBAC: admin không được vào dealer route
  const adminToken = await login('admin', 'ChangeMe123!');
  try {
    await api('GET', '/api/dealer/products', adminToken);
    console.log('  ✗ FAIL: admin lẽ ra không gọi được /api/dealer/*');
  } catch (e) {
    console.log('  ✓ RBAC OK: admin bị chặn /api/dealer:', e.message.slice(0, 60));
  }

  console.log('\n✓ Tất cả test pass');
})().catch(e => {
  console.error('\n✗ FAIL:', e.message);
  process.exit(1);
});
