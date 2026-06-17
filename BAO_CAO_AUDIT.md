# 🔍 Báo cáo Audit toàn dự án — Đại Lý Số (bản tóm tắt)

> Ngày: 2026-06-17 · Đã verify lại bằng DB + code thật. Chi tiết từng mục: [BAO_CAO_AUDIT_CHI_TIET.md](BAO_CAO_AUDIT_CHI_TIET.md).

## Đánh giá tổng thể: **≈ 8/10**

Codebase trên mức trung bình rõ rệt: kiến trúc layered kỷ luật, multi-tenant kín (**không IDOR, không SQLi**), error/response nhất quán, frontend dùng chung tốt, comment chất lượng. Sau khi kiểm chứng kỹ, **phần lớn finding nghi ngờ ban đầu hoá ra không phải lỗi** — vấn đề còn lại chủ yếu là vệ sinh code + an toàn deploy.

---

## ✅ Đã fix
- **Đồng bộ 2 template báo giá**: bỏ field chết "Tên công trình", tách rõ "Địa chỉ KH" ≠ "Tên & địa chỉ công trình", cân lại layout 4-4 cho cả Mẫu 1 và Mẫu 2. *(chưa commit)*

## ❌ Đã rút (không phải lỗi)
- **`doanh_thu_thuc`**: không cần — sửa lại báo giá là phản ánh đúng giá chốt.
- **Admin overview vs dashboard**: không lệch, dùng chung nguồn `financial.*`.
- **"Chi phí = 0"**: không phải bug — BG đã chốt chưa nhập giá vốn (giá vốn đã nhập nằm ở BG huỷ/nháp nên không tính). Nhập giá vốn vào đúng BG đã chốt là số nhảy.

## ⚠️ Hạ cấp (không ảnh hưởng người dùng)
- **Endpoint `setStatus` cũ** không sync `order_status`, nhưng UI không gọi tới → chỉ là code thừa nên dọn. Huỷ BG trên giao diện vẫn chạy đúng (dùng `logical-status`).

---

## 🟡 Còn hiệu lực — nên xử lý (đã verify)

| # | Vấn đề | Vị trí | Mức |
|---|--------|--------|-----|
| V1 | schema.sql lệch ~13 cột so với migrations (reference sai) | `src/db/schema.sql` | Cao |
| V2 | JWT verify không pin algorithm | `src/utils/jwt.js:8` | Trung |
| V3 | Mật khẩu admin mặc định công khai nếu deploy quên set env | `src/config/env.js:31` | Trung |
| V4 | `exportHtml` đọc file DB live (WAL) → export có thể lệch | `admin-db.controller.js:50-152` | Thấp |

## 🗑️ File thừa / dead code (đã verify)
- Xoá an toàn: `template1hoso.jfif`, `templatehoso1.html`, `brief_example.docx`.
- Dead code: `src/utils/format.js` (không import ở đâu), param thừa `quotationsForExport(filter)`.
- Trùng lặp tài liệu: `PROJECT_BRIEF_*.docx` (giữ `.md`), `docs/_guideline_text.txt`, `DEPLOY_RAILWAY.md` (gộp README?).

---

## ✅ Điểm mạnh (giữ nguyên)
- Multi-tenant kín: mọi mutation by-id verify ownership trước → không IDOR; prepared statements → không SQLi.
- Layering kỷ luật; tiền lưu INTEGER; error/response nhất quán; không empty catch; không console.log sót.
- Frontend dùng chung tốt; migration runner versioned đàng hoàng.

---

## 🎯 Việc còn lại
1. **Quick wins** (rủi ro thấp, không cần quyết định): pin JWT (V2), enforce admin pw (V3), xoá file rác + `format.js`, sync `schema.sql` (V1).
2. **Dọn dẹp**: bỏ endpoint `setStatus` cũ, sửa `exportHtml` (V4), bỏ param thừa.
3. **(Tuỳ chọn) UX giá vốn**: chỉ cho nhập ở BG đã chốt / thêm chú thích.

> Theo CLAUDE.md: chỉ sửa **local**, không `git push` tới khi bạn nói "push"/"deploy".
