# Tôi hiểu gì về 2 template

## 1. Hai template làm gì khác nhau

| | **Hồ sơ đại lý** | **Báo giá** |
|---|---|---|
| Mục đích | Giới thiệu năng lực đại lý — như "CV" của đại lý | Chứng từ giao dịch cho 1 công trình cụ thể |
| Đối tượng | Tất cả khách tiềm năng | 1 khách cụ thể (đã có dự án) |
| Tần suất | 1 đại lý → 1 hồ sơ, ít đổi | 1 đại lý → N báo giá, mỗi báo giá khác nhau |
| Nội dung | Tagline, năng lực, ảnh kho/xưởng/đội ngũ/công trình, KPI, QR | Line items sản phẩm, kích thước, đơn giá, VAT, điều khoản TT |
| Vòng đời | "Tài sản" của đại lý, dùng lâu dài | Tạm thời, sau khi chốt hợp đồng thì lưu archive |

→ Hai loại tài liệu hoàn toàn khác mục đích, **không phải biến thể của nhau**.

---

## 2. Data fields của từng template

### Dùng chung (về đại lý)
Cả 2 file đều cần: tên đại lý, mã đại lý, địa chỉ, hotline, email, người phụ trách, MST, logo đại lý.

### Riêng hồ sơ đại lý (file HTML 53KB)
- **Marketing copy**: tagline, USP list, services list, commitments list, customer quote, CTA
- **3 badges** + **3 USP highlights** + **3 KPI metrics** (với labels)
- **~10 ảnh**: hero, kho/xưởng, đội ngũ 1-2, chủ đại lý, QR, 3 ảnh công trình
- **5 layout** để đại lý chọn (t1-t5)
- Có URL param `?zaloName=&zaloPhone=` → autofill từ Zalo

### Riêng báo giá (template PDF)
- **Khách hàng**: tên cty KH, mã KH, người liên hệ, SĐT KH, địa chỉ công trình, ghi chú hồ sơ
- **Số báo giá** (vd `BG-2026-001`) + **ngày báo giá**
- **Bảng line items**: STT, nhóm SP, mã SP, mô tả, rộng × cao, SL, ĐVT, đơn giá, thành tiền
- **Tổng kết**: tạm tính, vận chuyển, lắp đặt, VAT, tổng cộng
- **Điều khoản**: thanh toán, tiến độ, bảo hành
- **Khu chữ ký**: KH · KD/tư vấn · Đại diện đại lý
- **5 ảnh placeholder** (chắc ảnh sản phẩm cho cấu hình tham khảo)

---

## 3. Luồng nghiệp vụ ĐÚNG (user xác nhận 2026-05-11)

```
   ┌─────────────────────────────────┐
   │  Đại lý / thợ nhắn với Linh MKT │
   └─────────────┬───────────────────┘
                 │
                 ▼  (Linh "gạ gẫm" mời vào Zalo)
   ┌─────────────────────────────────┐
   │  Vào nhóm Zalo của admin (ông)  │
   └─────────────┬───────────────────┘
                 │
                 ▼  (ông trực tiếp hướng dẫn)
   ┌─────────────────────────────────┐
   │  Admin tạo tài khoản đại lý     │  ← thủ công, gán dealer_id
   │  (admin = user, dealer = ĐL)    │
   └─────────────┬───────────────────┘
                 │
                 ▼
   ┌─────────────────────────────────┐
   │  Đại lý login → tự dùng tool    │
   │   ├─ Sửa hồ sơ → "Lưu hồ sơ"    │ → vào DB (text/data thôi)
   │   │                "Xuất PDF"    │ → ra file, KHÔNG lưu file
   │   └─ Tạo báo giá → "Lưu báo giá"│ → vào DB
   │                    "Xuất PDF"    │ → ra file, KHÔNG lưu file
   └─────────────────────────────────┘
```

**Linh MKT TÁCH RỜI hoàn toàn với 2 tool này.** Linh chỉ làm 1 việc: gạ vào Zalo. Linh không thu thông tin để fill vào hồ sơ/báo giá. Phần data của hồ sơ + báo giá hoàn toàn do đại lý tự nhập sau khi có account.

---

## 4. Quyền & vai trò

| Vai trò | Quyền |
|---|---|
| **Admin** (1 người = ông) | Tạo/sửa/xoá tài khoản đại lý, gán dealer_id, xem tất cả data |
| **Dealer** (mỗi đại lý 1 account) | Login → CRUD hồ sơ của mình, CRUD báo giá của mình, CRUD catalog sản phẩm của mình |

Đại lý chỉ thấy data của chính nó. Multi-tenant theo `dealer_id`.

---

## 5. Cách lưu trữ (user xác nhận)

- **KHÔNG lưu file PDF** vào DB/server (nặng máy).
- **Chỉ lưu DATA** dưới dạng bảng:
  - Nút "Lưu hồ sơ" / "Lưu báo giá" → INSERT/UPDATE vào DB
  - Nút "Xuất PDF" → render PDF ngay tại browser, đại lý tải về máy của họ — server không động vào file
- Lúc nào cần in lại → load data từ DB → render lại PDF từ template.

---

## 6. Sản phẩm (products)

- **Mỗi đại lý có catalog riêng** (đại lý tự thêm sản phẩm của mình vào: mã SP, nhóm SP, mô tả, ĐVT, đơn giá mặc định...)
- Trong báo giá: đại lý chọn từ catalog của mình + có thể override đơn giá theo từng báo giá

---

## 7. Mục tiêu cụ thể

Làm **cả 2 tool** (hồ sơ + báo giá), full BE + FE + DB + deploy.

---

## 8. Ràng buộc về người dùng

- **Đại lý là người Việt chân chất**, không hiểu tiếng Anh → UI 100% tiếng Việt, format số/ngày kiểu VN.
- **Thợ không có account riêng** → dùng nhờ account của đại lý (đại lý share password). Không cần build RBAC chi tiết.
- **Mục đích "ẩn" của admin**: thu thập market data từ usage của đại lý. Admin có view toàn cảnh data của tất cả đại lý — báo giá nào, KH nào, sản phẩm nào, giá thị trường. Đây là tính năng CHÍNH về business value, dù về UX thì đại lý là user chính.
