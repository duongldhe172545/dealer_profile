const BASE='http://localhost:3000';
async function req(m,p,b,t){const o={method:m,headers:{'Content-Type':'application/json; charset=utf-8'}};if(t)o.headers.Authorization='Bearer '+t;if(b)o.body=JSON.stringify(b);const r=await fetch(BASE+p,o);const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(`${m} ${p} → ${r.status}: ${JSON.stringify(d)}`);return d;}
(async()=>{
  const a=await req('POST','/api/auth/login',{username:'admin',password:'ChangeMe123!'});
  const code='DL-V2'+Date.now(), u='u'+Date.now();
  const d=await req('POST','/api/admin/dealers',{dealer_code:code,ten_dai_ly:'DL V2',username:u,password:'matkhau123'},a.token);
  const dt=(await req('POST','/api/auth/login',{username:u,password:'matkhau123'})).token;
  const kh=(await req('POST','/api/dealer/customers',{ten_kh:'KH'},dt)).data;
  const q=await req('POST','/api/dealer/quotations',{customer_id:kh.id,ngay_bao_gia:'2026-05-13',items:[
    {mo_ta:'Cửa nhôm', cach_tinh_gia:'kich_thuoc', rong:1800, cao:2400, sl:2,  dvt:'bộ', don_gia:12500000},
    {mo_ta:'Kính',     cach_tinh_gia:'dien_tich',  dien_tich:12.5,             dvt:'m²', don_gia:200000},
    {mo_ta:'Motor',    cach_tinh_gia:'so_luong',   sl:3,                       dvt:'cái',don_gia:5500000},
  ]},dt);
  const cases=[
    {m:'Cửa nhôm (kích thước, 02 bộ × 12.5M)',    expect:25000000},
    {m:'Kính (12.5m² × 200k)',                    expect:2500000},
    {m:'Motor (3 × 5.5M)',                        expect:16500000},
  ];
  q.data.items.forEach((it,i)=>{
    const ok=it.thanh_tien===cases[i].expect;
    console.log(`${ok?'✓':'✗'} ${cases[i].m}: got=${it.thanh_tien.toLocaleString('vi-VN')}, expect=${cases[i].expect.toLocaleString('vi-VN')}`);
    if(!ok)process.exit(1);
  });
  console.log(`Tạm tính: ${q.data.tam_tinh.toLocaleString('vi-VN')} đ (expect 44.000.000)`);
  await req('PATCH','/api/admin/dealers/'+d.data.id+'/status',{status:'inactive'},a.token);
  console.log('✓ All pass');
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
