// Verify: m²/mét/kg KHÔNG nhân SL, chỉ kich_thuoc + so_luong dùng SL
const BASE = 'http://localhost:3000';
async function req(m, p, body, t) {
  const opt = { method: m, headers: { 'Content-Type': 'application/json; charset=utf-8' } };
  if (t) opt.headers.Authorization = 'Bearer ' + t;
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(BASE + p, opt);
  const d = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${m} ${p} → ${r.status}: ${JSON.stringify(d)}`);
  return d;
}
(async () => {
  const a = await req('POST', '/api/auth/login', { username: 'admin', password: 'ChangeMe123!' });
  const code = 'DL-PRICE' + Date.now();
  const u = 'pri' + Date.now();
  const d = await req('POST', '/api/admin/dealers', { dealer_code: code, ten_dai_ly: 'DL test', username: u, password: 'matkhau123' }, a.token);
  const dt = (await req('POST', '/api/auth/login', { username: u, password: 'matkhau123' })).token;
  const kh = (await req('POST', '/api/dealer/customers', { ten_kh: 'KH' }, dt)).data;

  const cases = [
    { name: 'm² (KHÔNG nhân SL)',     it: { mo_ta: 'panel', cach_tinh_gia: 'dien_tich', dien_tich: 12.5, sl: 99, dvt: 'm²', don_gia: 200000 }, expect: 12.5 * 200000 },
    { name: 'mét dài (KHÔNG nhân SL)', it: { mo_ta: 'ray',    cach_tinh_gia: 'dai',      dai: 8,           sl: 99, dvt: 'mét', don_gia: 100000 }, expect: 8 * 100000 },
    { name: 'kg (KHÔNG nhân SL)',      it: { mo_ta: 'tôn',    cach_tinh_gia: 'can',      can_nang: 50,     sl: 99, dvt: 'kg',  don_gia: 25000 },  expect: 50 * 25000 },
    { name: 'SL × ĐG',                 it: { mo_ta: 'motor',  cach_tinh_gia: 'so_luong', sl: 3,                    dvt: 'cái', don_gia: 5500000 }, expect: 3 * 5500000 },
    { name: 'KT (R × C × SL × ĐG)',    it: { mo_ta: 'cửa',    cach_tinh_gia: 'kich_thuoc', rong: 1800, cao: 2400, sl: 2, dvt: 'bộ', don_gia: 3500000 }, expect: 1.8 * 2.4 * 2 * 3500000 },
  ];
  for (const c of cases) {
    const q = await req('POST', '/api/dealer/quotations', { customer_id: kh.id, ngay_bao_gia: '2026-05-13', items: [c.it] }, dt);
    const got = q.data.items[0].thanh_tien;
    const ok = got === Math.round(c.expect);
    console.log(`${ok ? '✓' : '✗'} ${c.name}: got=${got.toLocaleString('vi-VN')}, expected=${Math.round(c.expect).toLocaleString('vi-VN')}`);
    if (!ok) process.exit(1);
  }
  console.log('\nDọn data...');
  await req('PATCH', '/api/admin/dealers/' + d.data.id + '/status', { status: 'inactive' }, a.token);
  console.log('\n✓ All pricing tests pass');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
