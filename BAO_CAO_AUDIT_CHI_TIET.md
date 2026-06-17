# 🔧 Báo cáo Audit — CHI TIẾT (đã verify lại bằng DB + code thật)

> Ngày: 2026-06-17 · Bản đã đính chính sau khi kiểm chứng thực tế.
> ⚠️ Một số finding ở bản đầu **đã bị rút/hạ cấp** vì kiểm tra kỹ thì không phải lỗi. Phần này ghi rõ để không hiểu nhầm.
> Xem bản tóm tắt: [BAO_CAO_AUDIT.md](BAO_CAO_AUDIT.md).

---

# ✅ ĐÃ FIX

## F1 — Đồng bộ 2 template báo giá, bỏ field "Tên công trình" chết
📍 `public/assets/js/quotation-template.js` (Mẫu 1 + Mẫu 2)

**Vấn đề cũ:**
- Mẫu 2: nhãn "Tên công trình" đọc field `ten_cong_trinh` **không tồn tại** → luôn "—"; nhãn "Địa chỉ" mơ hồ (thực ra là địa chỉ **công trình**); **thiếu địa chỉ khách hàng**.
- Mẫu 1: nhãn đúng nhưng chia cột lệch 5-3.

**Đã sửa:** cả 2 mẫu giờ giống hệt nhau — 8 field, chia đều **4-4**, nhãn rõ ràng:

| Cột trái | Nguồn | Cột phải | Nguồn |
|----------|-------|----------|-------|
| Khách hàng | `customer.ten_kh` | Email | `customer.email` |
| Mã KH | `customer.ma_kh` | Địa chỉ KH | `customer.dia_chi` |
| Người phụ trách | `customer.nguoi_lien_he` | Tên & địa chỉ công trình | `quotation.dia_chi_cong_trinh` |
| Điện thoại | `customer.phone` | Ghi chú hồ sơ | `quotation.ghi_chu_ho_so` |

- Bỏ hẳn field chết `ten_cong_trinh` (đã grep toàn dự án, không còn ref).
- Tách rõ "Địa chỉ KH" (của khách) ≠ "Tên & địa chỉ công trình" (của dự án).

---

# ❌ ĐÃ RÚT (kiểm tra lại — KHÔNG phải lỗi)

## R1 — "Cần thêm cột `doanh_thu_thuc`" → KHÔNG cần
**Lý do rút:** khi khách chốt giá khác giá báo (vd 250tr → 240tr), đại lý **chỉ cần sửa lại báo giá** (thêm dòng chiết khấu 10tr). Hệ thống cho sửa BG ở mọi trạng thái và tự tính lại `tong_cong`. Vậy `tong_cong` đã phản ánh đúng giá chốt thực — không cần cột riêng. Đây là thiết kế hợp lý, không phải thiếu sót.

## R2 — "Admin overview vs dashboard lệch nhau" → KHÔNG lệch
**Lý do rút:** kiểm tra `public/admin/index.html:155-159`, cả 5 ô (Tổng GT BG, Tổng GT đơn hàng, Lợi nhuận, Chi phí, Công nợ) đều lấy từ **cùng nguồn** `financial.*`, nhất quán với nhau. Không có 2 con số doanh thu mâu thuẫn như đã lo.

### Ghi chú: "Chi phí = 0" KHÔNG phải bug — là do dữ liệu
Query DB thực tế (2026-06-17):

| BG | Trạng thái | tong_cong | gia_von |
|----|-----------|-----------|---------|
| #1 | **Đã chốt** | 23.852.880 | **null (chưa nhập)** |
| #2 | Đã huỷ | — | 40.000.000 |
| #3 | Bản nháp | — | 120.000 |

Chi phí dashboard chỉ cộng giá vốn của **BG đã chốt**. BG đã chốt duy nhất chưa nhập giá vốn; giá vốn đã nhập lại nằm ở BG huỷ/nháp (đúng logic không tính). **Muốn Chi phí "nhảy số": nhập giá vốn vào đúng BG đã chốt.**

> 💡 Cải tiến tuỳ chọn (không bắt buộc): chỉ cho nhập ô giá vốn ở BG đã chốt, hoặc thêm chú thích "Giá vốn chỉ tính khi BG đã chốt" để tránh nhầm.

---

# ⚠️ HẠ CẤP (không phải bug người dùng gặp, chỉ là dọn code)

## H1 — Endpoint `setStatus` cũ không sync `order_status`
📍 `src/services/quotation.service.js:370-380`, route `src/routes/dealer.routes.js:53`

**Vì sao hạ cấp:** giao diện huỷ BG dùng endpoint `logical-status` (`quotations.html:324`) — endpoint này **có** tự xoá trạng thái sản xuất (test thực tế OK). Endpoint `/status` cũ **không được UI gọi tới**, chỉ là code thừa.
**Đề xuất:** xoá endpoint `/status` cũ + hàm liên quan cho sạch. Ưu tiên thấp, không ảnh hưởng người dùng.

---

# 🟡 CÒN HIỆU LỰC — nên xử lý (đã verify, không bịa)

## V1 — schema.sql lệch ~13 cột so với migrations
📍 `src/db/schema.sql`

CLAUDE.md quy định schema.sql phải khớp state mới (làm reference). Hiện grep schema.sql ra **0 match** cho các cột đã thêm qua migration:

| Bảng | Cột thiếu trong schema.sql | Migration |
|------|-----------------------------|-----------|
| `quotations` | `chiet_khau_percent` | 013 |
| `quotations` | `dealer_name_override`, `dealer_address_override`, `dealer_phone_override`, `dealer_email_override`, `quote_title` | 014 |
| `quotations` | `order_status`, `ready_to_send`, `thanh_toan_thuc`, `gia_von` | 015 |
| `quotation_adjustments` | `so_bo`, `don_vi` | 011 |
| `dealer_profiles` | `brand_primary`, `brand_secondary` | 016 |

**Tác động:** không gây bug runtime (DB chạy bằng migration), nhưng đọc schema.sql sẽ hiểu sai cấu trúc.
**Cách fix:** cập nhật schema.sql cho khớp (mình có thể tự sinh lại từ DB hiện tại để khớp 100%).

## V2 — JWT verify không pin thuật toán
📍 `src/utils/jwt.js:8`

**Before:**
```js
function verify(token) {
  return jwt.verify(token, env.jwt.secret);
}
```
**After:**
```js
function verify(token) {
  return jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
}
```
Sửa 1 dòng, không ảnh hưởng token đang dùng. Best-practice phòng tấn công đổi `alg`.

## V3 — Mật khẩu admin mặc định công khai trong source
📍 `src/config/env.js:31`

```js
password: optional('ADMIN_PASSWORD', 'ChangeMe123!'),
```
Nếu deploy quên set `ADMIN_PASSWORD`, admin bị seed bằng mật khẩu công khai `ChangeMe123!`.

**After:**
```js
password: process.env.NODE_ENV === 'production'
  ? required('ADMIN_PASSWORD')                  // production: thiếu → fail-fast
  : optional('ADMIN_PASSWORD', 'ChangeMe123!'), // dev: cho default tiện chạy local
```
Chỉ ảnh hưởng lần seed đầu; deployment hiện tại admin đã tồn tại nên không tác động.

## V4 — `exportHtml` đọc trực tiếp file DB live (WAL)
📍 `src/controllers/admin-db.controller.js:50-152`

Mở connection thứ 2 trỏ thẳng file đang ghi → với WAL có thể đọc snapshot không đầy đủ. Chỉ admin gọi được (không phải lỗ hổng), nhưng dữ liệu export có thể lệch.
**Cách fix:** backup ra file tạm rồi đọc (như `downloadDb` đang làm), thay vì mở file live.

---

# 🗑️ FILE THỪA / DEAD CODE (đã verify)

### Xoá an toàn (rác untracked, không file nào tham chiếu)
```
template1hoso.jfif        # ảnh ref, đã port thành profile-templates.js
templatehoso1.html        # HTML scratch, đã port thành profile-templates.js
brief_example.docx        # brief mẫu tham khảo
```

### Dead code trong src/
- `src/utils/format.js` (34 dòng) — không import ở đâu trong backend (FE có bản riêng trong `common.js`). → xoá.
- `quotationsForExport(filter)` — param `filter` không dùng → `admin-stats.model.js:232`.

### Trùng lặp tài liệu — cân nhắc
- `PROJECT_BRIEF_DAI_LY_SO.docx` (giữ `.md`) · `Guideline_...v0.3.docx` + `docs/_guideline_text.txt` · `docs/PLAN_v4_*.md` (archive) · `DEPLOY_RAILWAY.md` (gộp vào README?).

---

# 🎯 Trạng thái

| Việc | Trạng thái |
|------|------------|
| Đồng bộ 2 template báo giá (F1) | ✅ Xong |
| Pin JWT algorithm (V2) | ✅ Xong |
| Enforce ADMIN_PASSWORD ở production (V3) | ✅ Xong |
| Sync schema.sql với migrations (V1) | ✅ Xong |
| Sửa exportHtml backup ra tmp + dọn sidecar (V4) | ✅ Xong |
| Gỡ endpoint `setStatus` cũ (H1) | ✅ Xong (route+controller+service+model) |
| Xoá `format.js` + param thừa + 3 file rác | ✅ Xong |
| (Tuỳ chọn) UX giá vốn: chỉ cho nhập ở BG đã chốt / thêm chú thích | ⏳ Chờ ý kiến |

**Test:** 39/39 checks pass (admin + dealer endpoints, financials round-trip, auth guard, setStatus→404, migrate up-to-date). Không commit, không push.

> Theo CLAUDE.md: chỉ sửa **local**, không `git push` tới khi bạn nói "push"/"deploy".
