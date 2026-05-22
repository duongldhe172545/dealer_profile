// =============================================================
// Logic Alpine cho trang sửa báo giá — v2 với sections + adjustments.
//
// State model:
//   form.sections = [{ _key, _id?, ten, items: [{ _key, ma_sp, ..., dien_tich (=khối lượng), _dien_tich_manual }] }]
//   form.adjustments = [{ _key, kind: 'plus'|'minus', label, amount }]
//
// _key: chuỗi unique để Alpine `x-for :key` giữ identity ổn định khi
//       thêm/xoá/sort, tránh re-render toàn bộ block.
// _dien_tich_manual: true nếu user gõ tay diện tích → không auto-overwrite
//                    khi rộng/cao thay đổi.
//
// Phụ thuộc global:
//   - API           (assets/js/api.js)
//   - Fmt           (assets/js/common.js)
//   - QuotationTemplate (assets/js/quotation-template.js)
// =============================================================

// Unique key generator cho Alpine
let _keyCounter = 0;
function uniqKey(prefix = 'k') {
  _keyCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_keyCounter}`;
}

function emptyItem() {
  return {
    _key: uniqKey('it'),
    product_id: null,
    ma_sp: '', ten_sp: '', nhom_sp: '', mo_ta: '',
    rong: null, cao: null,
    dien_tich: null,
    _dien_tich_manual: false,
    sl: 1, dvt: '',
    don_gia: 0, thanh_tien: 0,
  };
}

function emptySection(ten = '') {
  return {
    _key: uniqKey('sec'),
    _id: null,
    ten,
    items: [],
  };
}

function emptyAdjustment(kind = 'plus') {
  return {
    _key: uniqKey('adj'),
    kind,
    label: '',
    mode: 'fixed',     // 'fixed' = đồng; 'percent' = % theo tạm tính
    amount: 0,         // mode='fixed': đồng tự tính = so_bo×don_gia. mode='percent': % value
    so_bo: null,       // BS-style: số bộ
    don_vi: '',        // BS-style: đơn vị ('gói', 'lần'…)
    don_gia: 0,        // BS-style: đơn giá
  };
}

function emptyForm() {
  return {
    so_bao_gia: '',
    ngay_bao_gia: new Date().toISOString().slice(0, 10),
    customer_id: '',
    dia_chi_cong_trinh: '',
    ghi_chu_ho_so: '',
    ghi_chu_thuong_mai: 'Giá đã bao gồm tư vấn kỹ thuật. Vận chuyển và lắp đặt có thể tách riêng theo phạm vi công trình.',
    vat_percent: 8,
    chiet_khau_percent: 0,
    // Override thông tin đại lý + tiêu đề (mig 014): rỗng → dùng profile mặc định
    dealer_name_override: '',
    dealer_address_override: '',
    dealer_phone_override: '',
    dealer_email_override: '',
    quote_title: '',
    thanh_toan: 'Đặt cọc 40%\n50% khi giao hàng\n10% sau nghiệm thu',
    tien_do: '12 - 18 ngày làm việc tuỳ cấu hình',
    bao_hanh: 'Bảo hành 24 tháng theo chính sách của hãng và đại lý',
    status: 'draft',
    sections: [emptySection('')],
    adjustments: [],
  };
}

// ─── Helpers tính toán ─────────────────────────────────────────────────────
// Khối lượng tự động theo Đơn vị (chỉ áp khi user KHÔNG override tay):
//   'm²' / 'm2'  → rộng × cao × số_bộ / 1,000,000
//   'md' / 'm'   → cao × số_bộ / 1,000
//   'bộ' / 'bo'  → số_bộ
//   khác         → null (user nhập tay vào ô khối lượng)
function calcKhoiLuong(it) {
  const dvt = (it.dvt || '').toLowerCase().trim();
  const rong = Number(it.rong) || 0;
  const cao = Number(it.cao) || 0;
  const sl = Number(it.sl) || 0;
  if (dvt === 'm²' || dvt === 'm2') {
    if (rong > 0 && cao > 0 && sl > 0) {
      return Math.round(rong * cao * sl / 100) / 10000;  // 4 digits decimal
    }
    return null;
  }
  if (dvt === 'md' || dvt === 'm') {
    if (cao > 0 && sl > 0) return Math.round(cao * sl) / 1000;
    return null;
  }
  if (dvt === 'bộ' || dvt === 'bo') {
    return sl > 0 ? sl : null;
  }
  return null;
}

// Thành tiền 1 dòng:
//   - Có khối lượng (dien_tich đã = total): thanh_tien = khối_lượng × đơn_giá
//   - Không có khối lượng: thanh_tien = số_bộ × đơn_giá
function lineTotal(it) {
  const sl = Number(it.sl) || 0;
  const dg = Number(it.don_gia) || 0;
  const kl = Number(it.dien_tich) || 0;
  if (kl > 0) return Math.round(kl * dg);
  return Math.round(sl * dg);
}

function quoteForm() {
  return {
    loading: true, saving: false, savedFlash: false, error: '',
    editingId: null,
    // View-only mode: mở từ nút "Xem" trên list (URL có ?view=1)
    //   → ẩn cột form bên trái, chỉ hiện preview + nút PDF
    viewMode: false,
    // Dirty tracking — đồng nhất behavior save với profile
    dirty: false, lastSavedAt: null,
    _initializing: true, _autoSaveTimer: null,
    dealer: {}, profile: {}, images: {},
    customers: [], products: [],
    Fmt: window.Fmt,

    get productGroups() {
      const s = new Set();
      for (const p of this.products) if (p.nhom_sp) s.add(p.nhom_sp);
      return Array.from(s).sort();
    },
    productsByGroup(nhom) {
      if (!nhom) return this.products;
      return this.products.filter(p => (p.nhom_sp || '').trim() === nhom.trim());
    },

    form: emptyForm(),

    // Ảnh đính kèm báo giá
    quotationImages: [], qImgUploading: {},

    // UI state
    moveMenuOpen: null,        // _key của item đang mở menu chuyển nhóm
    removeSecOpen: null,       // sIdx đang mở modal xoá nhóm

    // Inline tạo KH mới
    newCustOpen: false, newCustSaving: false, newCustError: '',
    newCust: { ten_kh: '', nguoi_lien_he: '', phone: '', email: '', dia_chi: '' },

    // ─── Computed getters ────────────────────────────────────────────────
    get totalItemsCount() {
      return this.form.sections.reduce((n, s) => n + s.items.length, 0);
    },

    // Grouped mode = có ít nhất 1 section được đặt tên.
    // Flat mode (không nhóm) = chỉ có section orphan (ten='') hoặc trống.
    get isGroupedMode() {
      return this.form.sections.some(s => s.ten && s.ten.trim());
    },

    // Section orphan: ten='' — chứa dòng "không thuộc nhóm nào".
    // Section named: có ten — hiển thị header + subtotal + nút "+ Thêm dòng vào X".
    isNamedSection(sIdx) {
      const s = this.form.sections[sIdx];
      return !!(s && s.ten && s.ten.trim());
    },

    get plusAdjustments() {
      return this.form.adjustments.filter(a => a.kind === 'plus');
    },
    get minusAdjustments() {
      return this.form.adjustments.filter(a => a.kind === 'minus');
    },

    // Letter A/B/C... chỉ tính cho section được đặt tên. Orphan không có letter.
    sectionLetter(idx) {
      if (!this.isNamedSection(idx)) return '';
      let n = 0;
      for (let i = 0; i <= idx; i++) if (this.isNamedSection(i)) n++;
      // n=1 → A, n=2 → B...
      if (n <= 26) return String.fromCharCode(64 + n);
      const a = Math.floor((n - 1) / 26) - 1;
      const b = (n - 1) % 26;
      return String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
    },

    sectionSubtotal(sIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return 0;
      return sec.items.reduce((s, it) => s + (Number(it.thanh_tien) || 0), 0);
    },

    // Tổng số bộ của 1 nhóm (cho dòng "Tổng nhóm A" trong subtotal)
    sectionSubtotalSoBo(sIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return 0;
      return sec.items.reduce((s, it) => s + (Number(it.sl) || 0), 0);
    },

    autoArea(it) {
      const kl = calcKhoiLuong(it);
      return kl != null ? kl : '';
    },

    // Khối lượng bị khoá khi đơn vị có công thức (m² / md / bộ) — user không sửa được.
    // Đơn vị khác (kg / cái / gói…) → công thức null → cho phép nhập tay.
    isKhoiLuongLocked(it) {
      return calcKhoiLuong(it) != null;
    },

    // Số tiền 1 BS mode='fixed' = so_bo × don_gia (BS-style 4 fields), fallback amount.
    adjFixedAmount(a) {
      if (!a) return 0;
      const sb = Number(a.so_bo) || 0;
      const dg = Number(a.don_gia) || 0;
      if (dg > 0) return Math.round((sb || 1) * dg);
      return Number(a.amount) || 0;
    },

    // Effective amount của 1 adjustment (đồng) — Excel-style:
    //   fixed         → so_bo × don_gia (BS-style) hoặc fallback amount (BG cũ)
    //   plus percent  → tam_tinh × % / 100        (phụ phí % trên giá SP)
    //   minus percent → (tam_tinh + Σplus) × % / 100  (chiết khấu trên Tổng cộng)
    adjEffective(a) {
      if (!a) return 0;
      if (a.mode === 'percent') {
        const pct = Number(a.amount) || 0;
        const base = a.kind === 'minus'
          ? this._tamTinh() + this._plusSum()
          : this._tamTinh();
        return Math.round(base * pct / 100);
      }
      return this.adjFixedAmount(a);
    },
    _tamTinh() {
      return this.form.sections.reduce(
        (s, sec) => s + sec.items.reduce((ss, it) => ss + (Number(it.thanh_tien) || 0), 0),
        0
      );
    },
    _plusSum() {
      const tt = this._tamTinh();
      return this.form.adjustments
        .filter(a => a.kind === 'plus')
        .reduce((s, a) => {
          if (a.mode === 'percent') {
            const pct = Number(a.amount) || 0;
            return s + Math.round(tt * pct / 100);
          }
          return s + this.adjFixedAmount(a);
        }, 0);
    },

    get totals() {
      const tam_tinh = this._tamTinh();
      const plus_sum = this._plusSum();
      const tong_cong_truoc_ck = tam_tinh + plus_sum;
      const ck_pct = Number(this.form.chiet_khau_percent) || 0;
      const minus_sum = Math.round(tong_cong_truoc_ck * ck_pct / 100);
      const pre_tax = tong_cong_truoc_ck - minus_sum;
      const vat_amount = Math.round(pre_tax * (Number(this.form.vat_percent) || 0) / 100);
      const tong_cong = pre_tax + vat_amount;
      return { tam_tinh, plus_sum, minus_sum, tong_cong_truoc_ck, pre_tax, vat_amount, tong_cong };
    },

    // ─── Section actions ─────────────────────────────────────────────────
    addSection() {
      // Nhóm mới đặt tên rỗng — user gõ tên sau. Vì isNamedSection check trim,
      // section mới chưa có tên sẽ tạm coi là orphan; nhưng đặt sau orphan[0]
      // để khi gõ tên, letter A/B/C tính đúng.
      this.form.sections.push(emptySection(''));
    },
    // Cũ giữ lại cho backward compat (ai gọi cũng còn chạy)
    removeSection(sIdx) {
      this.openRemoveSection(sIdx);
    },
    openRemoveSection(sIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return;
      if (sIdx === 0 && !this.isNamedSection(0)) return;     // không xoá orphan bucket
      // Nhóm trống → xoá luôn không cần hỏi
      if (sec.items.length === 0) {
        this.form.sections.splice(sIdx, 1);
        return;
      }
      this.removeSecOpen = sIdx;
    },
    // Lựa chọn 1: xoá nhóm + xoá hết SP trong đó
    removeSectionWithItems(sIdx) {
      if (sIdx == null) return;
      this.form.sections.splice(sIdx, 1);
    },
    // Lựa chọn 2: chỉ xoá nhóm, đẩy SP về "Không thuộc nhóm" (orphan bucket)
    removeSectionKeepItems(sIdx) {
      if (sIdx == null) return;
      const sec = this.form.sections[sIdx];
      if (!sec) return;
      // Đảm bảo orphan bucket tồn tại ở idx 0 (ten='')
      if (!this.form.sections.length || this.isNamedSection(0)) {
        this.form.sections.unshift(emptySection(''));
        sIdx++;   // shifted
      }
      // Move items
      this.form.sections[0].items.push(...sec.items);
      // Xoá nhóm
      this.form.sections.splice(sIdx, 1);
    },

    // Di chuyển 1 dòng SP từ nhóm srcIdx sang nhóm dstIdx (hoặc 'orphan')
    moveItemTo(srcIdx, iIdx, dst) {
      const src = this.form.sections[srcIdx];
      if (!src || !src.items[iIdx]) return;
      // Đảm bảo orphan bucket tồn tại nếu dst='orphan'
      if (dst === 'orphan') {
        if (!this.form.sections.length || this.isNamedSection(0)) {
          this.form.sections.unshift(emptySection(''));
          srcIdx++;     // shifted
        }
        dst = 0;
      }
      if (typeof dst !== 'number') return;
      if (dst === srcIdx) return;
      const [it] = this.form.sections[srcIdx].items.splice(iIdx, 1);
      this.form.sections[dst].items.push(it);
    },

    // ─── Item actions ────────────────────────────────────────────────────
    addItem(sIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return;
      sec.items.push(emptyItem());
    },
    // Top-level "+ Thêm dòng" — tạo dòng không thuộc nhóm nào (orphan).
    // Đảm bảo section[0] là bucket orphan (ten='') rồi push item vào đó.
    addOrphanItem() {
      if (!this.form.sections.length || this.isNamedSection(0)) {
        this.form.sections.unshift(emptySection(''));
      }
      this.form.sections[0].items.push(emptyItem());
    },
    removeItem(sIdx, iIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return;
      sec.items.splice(iIdx, 1);
    },

    // Khi rộng / cao / số_bộ / đơn_vị đổi:
    //   - Đơn vị có công thức (m²/md/bộ) → ÉP cập nhật Khối lượng theo công thức.
    //   - Đơn vị khác → giữ nguyên Khối lượng (user tự nhập).
    onDimensionChange(sIdx, iIdx) {
      const it = this.form.sections[sIdx].items[iIdx];
      const kl = calcKhoiLuong(it);
      if (kl != null) it.dien_tich = kl;
      this.recalcItem(sIdx, iIdx);
    },

    // User gõ tay vào ô Khối lượng (chỉ chạy khi input KHÔNG locked — đơn vị "kg" / "cái" / …)
    onKhoiLuongInput(sIdx, iIdx, value) {
      const it = this.form.sections[sIdx].items[iIdx];
      const n = Number(value);
      it.dien_tich = (value === '' || value == null || !Number.isFinite(n) || n === 0) ? null : n;
      this.recalcItem(sIdx, iIdx);
    },

    // Autofill khi user chọn mã SP khớp catalog
    onMaSpChange(sIdx, iIdx) {
      const it = this.form.sections[sIdx].items[iIdx];
      if (!it.ma_sp) { it.product_id = null; return; }
      const p = this.products.find(x => x.ma_sp === it.ma_sp);
      if (!p) { it.product_id = null; return; }
      it.product_id = p.id;
      it.ten_sp     = p.ten_sp  || '';
      it.nhom_sp    = p.nhom_sp || '';
      it.mo_ta      = p.mo_ta   || '';
      it.dvt        = p.dvt_mac_dinh || it.dvt || '';
      it.don_gia    = p.don_gia_mac_dinh || 0;
      if (!it.sl) it.sl = 1;
      this.recalcItem(sIdx, iIdx);
    },

    onCustomerChange() {
      const c = this.customers.find(x => x.id == this.form.customer_id);
      if (c && !this.form.dia_chi_cong_trinh) this.form.dia_chi_cong_trinh = c.dia_chi || '';
    },

    recalcItem(sIdx, iIdx) {
      const it = this.form.sections[sIdx].items[iIdx];
      it.thanh_tien = lineTotal(it);
    },
    recalcAll() {
      for (const sec of this.form.sections) {
        for (const it of sec.items) it.thanh_tien = lineTotal(it);
      }
    },

    // ─── Adjustments ─────────────────────────────────────────────────────
    addAdjustment(kind) {
      this.form.adjustments.push(emptyAdjustment(kind));
    },
    removeAdjustment(key) {
      this.form.adjustments = this.form.adjustments.filter(a => a._key !== key);
    },
    // Đổi mode (đ ↔ %). Khi đổi → reset amount=0 vì semantic khác.
    toggleAdjMode(key, mode) {
      const a = this.form.adjustments.find(x => x._key === key);
      if (!a || a.mode === mode) return;
      a.mode = mode;
      a.amount = 0;
    },

    // ─── Lifecycle ───────────────────────────────────────────────────────
    async init() {
      const qs = new URLSearchParams(location.search);
      this.editingId = qs.get('id');
      this.viewMode  = qs.get('view') === '1';
      this._initializing = true;
      try {
        await Promise.all([this.loadProfile(), this.loadCustomers(), this.loadProducts()]);
        if (this.editingId) {
          await this.loadQuotation(this.editingId);
        } else {
          // Tạo mới: gợi ý số BG + snapshot thông tin đại lý từ hồ sơ vào override
          // (user thấy text luôn, sửa free; profile dealer KHÔNG bị đụng khi save BG).
          const ngay = this.form.ngay_bao_gia;
          const r = await API.get('/api/dealer/quotations/suggest-number?ngay_bao_gia=' + ngay);
          this.form.so_bao_gia = r.so_bao_gia;
          this.form.quote_title             = 'PHIẾU BÁO GIÁ';
          this.form.dealer_name_override    = this.dealer.ten_dai_ly || '';
          this.form.dealer_phone_override   = this.dealer.phone || '';
          this.form.dealer_email_override   = this.dealer.email || '';
          this.form.dealer_address_override = [this.dealer.address, this.dealer.district, this.dealer.province].filter(Boolean).join(', ');
        }
        this.recalcAll();
        this.$nextTick(() => {
          this.setupAutoFit();
          this.setupAutoSave();
          this._initializing = false;
          if (this.editingId) this.lastSavedAt = new Date();
          // Auto-export PDF khi mở từ nút "Tải" trên list (URL có ?print=1)
          if (new URLSearchParams(location.search).get('print') === '1' && this.editingId) {
            setTimeout(() => this.exportPDF(), 600);   // chờ preview render xong rồi mới capture
          }
          if (this.viewMode) document.body.classList.add('view-only');
        });
      } catch (e) { this.error = e.message; }
      finally { this.loading = false; }
    },

    setupAutoSave() {
      // View-only: KHÔNG hook auto-save, KHÔNG cảnh báo beforeunload
      if (this.viewMode) return;
      // Mỗi thay đổi vào form → đánh dấu dirty
      this.$watch('form', () => this.markDirty(), { deep: true });

      // Auto-save mỗi 3 phút nếu dirty + đã có editingId (BG đã pass validation lần đầu).
      // BG mới chưa save lần nào → KHÔNG auto-save (có thể thiếu field bắt buộc).
      if (this._autoSaveTimer) clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = setInterval(() => {
        if (this.dirty && !this.saving && this.editingId) this.save();
      }, 3 * 60 * 1000);

      // Cảnh báo khi đóng tab nếu còn dirty
      window.addEventListener('beforeunload', (e) => {
        if (this.dirty) { e.preventDefault(); e.returnValue = ''; }
      });
    },

    markDirty() {
      if (this._initializing) return;
      this.dirty = true;
      this.savedFlash = false;
    },

    statusText() {
      if (this.saving) return 'Đang lưu...';
      if (this.savedFlash) return '✓ Đã lưu';
      if (this.dirty) return '● Chưa lưu';
      return '';
    },
    statusClass() {
      if (this.saving) return 'text-slate-500';
      if (this.savedFlash) return 'text-green-600 font-semibold';
      if (this.dirty) return 'text-amber-600 font-semibold';
      return 'text-slate-400';
    },

    async loadProfile() {
      const r = await API.get('/api/dealer/profile');
      this.dealer = r.data.dealer || {};
      this.profile = r.data.profile || {};
      this.images = r.data.images || {};
    },
    async loadCustomers() {
      const r = await API.get('/api/dealer/customers');
      this.customers = r.data || [];
    },
    async loadProducts() {
      const r = await API.get('/api/dealer/products?active=1');
      this.products = r.data || [];
    },

    async loadQuotation(id) {
      const r = await API.get('/api/dealer/quotations/' + id);
      const q = r.data;

      // Group items by section_id → rebuild form.sections
      const itemsBySection = new Map();
      for (const it of (q.items || [])) {
        const sId = it.section_id;
        if (!itemsBySection.has(sId)) itemsBySection.set(sId, []);
        itemsBySection.get(sId).push(it);
      }

      const sections = (q.sections || []).map(s => ({
        _key: uniqKey('sec'),
        _id: s.id,
        ten: s.ten || '',
        items: (itemsBySection.get(s.id) || []).map(it => {
          const kl = it.dien_tich;
          const autoKl = calcKhoiLuong(it);
          // Manual nếu khối lượng tồn tại nhưng khác giá trị auto-tính (vượt sai số)
          const isManual = kl != null && (
            autoKl == null || Math.abs(kl - autoKl) > 0.01
          );
          return {
            _key: uniqKey('it'),
            product_id: it.product_id,
            ma_sp: it.ma_sp || '', ten_sp: it.ten_sp || '',
            nhom_sp: it.nhom_sp || '', mo_ta: it.mo_ta || '',
            rong: it.rong, cao: it.cao,
            dien_tich: kl,
            _dien_tich_manual: isManual,
            sl: it.sl, dvt: it.dvt || '',
            don_gia: it.don_gia || 0, thanh_tien: it.thanh_tien || 0,
          };
        }),
      }));

      // Items "orphan" (section_id null) — đẩy lên đầu, vào section ten='' (bucket "không thuộc nhóm")
      const orphan = itemsBySection.get(null) || [];
      if (orphan.length) {
        sections.unshift({
          _key: uniqKey('sec'), _id: null, ten: '',
          items: orphan.map(it => ({
            _key: uniqKey('it'),
            product_id: it.product_id,
            ma_sp: it.ma_sp || '', ten_sp: it.ten_sp || '',
            nhom_sp: it.nhom_sp || '', mo_ta: it.mo_ta || '',
            rong: it.rong, cao: it.cao,
            dien_tich: it.dien_tich,
            _dien_tich_manual: it.dien_tich != null,
            sl: it.sl, dvt: it.dvt || '',
            don_gia: it.don_gia || 0, thanh_tien: it.thanh_tien || 0,
          })),
        });
      }

      if (!sections.length) sections.push(emptySection(''));

      // BG cũ: section đầu tên 'Chưa phân nhóm' / 'Khác' → đổi về '' (orphan bucket)
      if (sections.length >= 1 && ['Chưa phân nhóm', 'Khác'].includes((sections[0].ten || '').trim())) {
        sections[0].ten = '';
      }

      const adjustments = (q.adjustments || []).map(a => {
        const mode = a.mode === 'percent' ? 'percent' : 'fixed';
        return {
          _key: uniqKey('adj'),
          kind: a.kind, label: a.label,
          mode,
          // mode='percent' → amount FE = value_percent từ server (vd 10)
          // mode='fixed'   → amount FE = amount từ server (đồng)
          amount: mode === 'percent' ? (Number(a.value_percent) || 0) : (Number(a.amount) || 0),
          so_bo:  a.so_bo != null ? Number(a.so_bo) : null,
          don_vi: a.don_vi || '',
          don_gia: a.don_gia != null ? Number(a.don_gia) : 0,
        };
      });

      // Backward compat: BG cũ có minus adjustment với mode=percent → coerce sang chiet_khau_percent
      let chiet_khau_percent = q.chiet_khau_percent != null ? Number(q.chiet_khau_percent) : 0;
      if (!chiet_khau_percent) {
        const legacyMinusPct = (q.adjustments || []).find(a => a.kind === 'minus' && a.mode === 'percent' && Number(a.value_percent) > 0);
        if (legacyMinusPct) chiet_khau_percent = Number(legacyMinusPct.value_percent) || 0;
      }
      const adjustmentsPlusOnly = adjustments.filter(a => a.kind === 'plus');

      // Override fields (mig 014): nếu DB có giá trị → dùng. Rỗng/null (BG cũ) → fallback dealer profile live.
      const ovr = (val, fb) => (val != null && val !== '') ? val : (fb || '');
      const dealerAddrFb = [this.dealer.address, this.dealer.district, this.dealer.province].filter(Boolean).join(', ');

      this.form = {
        so_bao_gia: q.so_bao_gia, ngay_bao_gia: q.ngay_bao_gia,
        customer_id: q.customer_id || '',
        dia_chi_cong_trinh: q.dia_chi_cong_trinh || '',
        ghi_chu_ho_so: q.ghi_chu_ho_so || '',
        ghi_chu_thuong_mai: q.ghi_chu_thuong_mai || '',
        vat_percent: q.vat_percent != null ? q.vat_percent : 0,
        chiet_khau_percent,
        thanh_toan: q.thanh_toan || '',
        tien_do: q.tien_do || '',
        bao_hanh: q.bao_hanh || '',
        quote_title:             ovr(q.quote_title, 'PHIẾU BÁO GIÁ'),
        dealer_name_override:    ovr(q.dealer_name_override,    this.dealer.ten_dai_ly),
        dealer_phone_override:   ovr(q.dealer_phone_override,   this.dealer.phone),
        dealer_email_override:   ovr(q.dealer_email_override,   this.dealer.email),
        dealer_address_override: ovr(q.dealer_address_override, dealerAddrFb),
        status: q.status,
        sections,
        adjustments: adjustmentsPlusOnly,
      };
      this.quotationImages = q.images || [];
    },

    // ─── Save ────────────────────────────────────────────────────────────
    async save() {
      this.error = '';
      // Validate: cần ít nhất 1 item ở 1 section nào đó
      if (this.totalItemsCount === 0) {
        this.error = 'Vui lòng thêm ít nhất 1 dòng sản phẩm trong 1 nhóm.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      // Validate item: cần SL + ĐVT + Đơn giá
      let badInfo = null;
      this.form.sections.forEach((sec, sIdx) => {
        sec.items.forEach((it, iIdx) => {
          if (badInfo) return;
          if (!it.dvt || !it.sl) {
            badInfo = `Nhóm ${this.sectionLetter(sIdx)} dòng ${iIdx + 1}: cần nhập SL + ĐVT.`;
          }
        });
      });
      if (badInfo) {
        this.error = badInfo;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Build payload — bỏ section rỗng (không có item), bỏ adjustment thiếu label hoặc amount=0
      const sections = this.form.sections
        .filter(s => s.items.length > 0)
        .map(s => ({
          ten: (s.ten || '').trim(),
          items: s.items.map(it => ({
            product_id: it.product_id,
            ma_sp: it.ma_sp, ten_sp: it.ten_sp, mo_ta: it.mo_ta,
            rong: it.rong, cao: it.cao, dien_tich: it.dien_tich,
            sl: it.sl, dvt: it.dvt, don_gia: it.don_gia,
            // nhom_sp: server tự set = section.ten (backward compat)
          })),
        }));
      const adjustments = this.form.adjustments
        .filter(a => {
          if (a.kind !== 'plus') return false;
          if (!a.label || !a.label.trim()) return false;
          if (a.mode === 'percent') return Number(a.amount) > 0;
          // fixed: hợp lệ nếu có amount > 0 hoặc có (số bộ + đơn giá)
          return this.adjFixedAmount(a) > 0;
        })
        .map(a => {
          const base = {
            kind: 'plus',
            label: a.label.trim(),
            mode: a.mode || 'fixed',
          };
          if (a.mode === 'percent') {
            base.amount = Number(a.amount);
          } else {
            base.so_bo = a.so_bo != null && a.so_bo !== '' ? Number(a.so_bo) : null;
            base.don_vi = a.don_vi || null;
            base.don_gia = Number(a.don_gia) || null;
            base.amount = this.adjFixedAmount(a);
          }
          return base;
        });

      const payload = {
        so_bao_gia: this.form.so_bao_gia,
        ngay_bao_gia: this.form.ngay_bao_gia,
        customer_id: this.form.customer_id,
        dia_chi_cong_trinh: this.form.dia_chi_cong_trinh,
        ghi_chu_ho_so: this.form.ghi_chu_ho_so,
        ghi_chu_thuong_mai: this.form.ghi_chu_thuong_mai,
        vat_percent: this.form.vat_percent,
        chiet_khau_percent: this.form.chiet_khau_percent,
        thanh_toan: this.form.thanh_toan,
        tien_do: this.form.tien_do,
        bao_hanh: this.form.bao_hanh,
        dealer_name_override:    this.form.dealer_name_override,
        dealer_address_override: this.form.dealer_address_override,
        dealer_phone_override:   this.form.dealer_phone_override,
        dealer_email_override:   this.form.dealer_email_override,
        quote_title:             this.form.quote_title,
        status: this.form.status,
        sections,
        adjustments,
      };

      this.saving = true;
      this._initializing = true;     // chặn watcher khi loadQuotation reload data
      try {
        let res;
        if (this.editingId) res = await API.put('/api/dealer/quotations/' + this.editingId, payload);
        else res = await API.post('/api/dealer/quotations', payload);
        const id = res.data.id;
        const wasNew = !this.editingId;
        this.editingId = id;
        // Update URL bar không reload page → state form giữ nguyên,
        // có thể tiếp tục upload ảnh / export PDF mà không mất gì.
        if (wasNew) {
          history.replaceState({}, '', '/dealer/quotation-edit.html?id=' + id);
        }
        await this.loadQuotation(id);
        this.lastSavedAt = new Date();
        this.savedFlash = true;
        setTimeout(() => { this.savedFlash = false; }, 5000);
      } catch (e) { this.error = e.message; window.scrollTo({ top: 0, behavior: 'smooth' }); }
      finally {
        this.saving = false;
        // Reset dirty + _initializing sau watcher đã chạy xong (200ms để chắc chắn)
        setTimeout(() => {
          this.dirty = false;
          this._initializing = false;
        }, 200);
      }
    },

    // Đảm bảo BG có id trước khi làm action cần id (upload ảnh, export PDF...).
    // Auto-save background nếu chưa có. Trả về true nếu sẵn sàng, false nếu fail.
    async _ensureSaved() {
      if (this.editingId) return true;
      await this.save();
      return !!this.editingId;
    },

    // ─── Preview ─────────────────────────────────────────────────────────
    renderPreview() {
      const t = this.totals;
      const customer = this.customers.find(c => c.id == this.form.customer_id) || null;
      // Truyền cả sections + adjustments v2 + items flat (legacy fallback)
      const flatItems = this.form.sections.flatMap(s => s.items);
      return window.QuotationTemplate.render({
        dealer: this.dealer, profile: this.profile, images: this.images,
        customer,
        quotation: {
          ...this.form,
          tam_tinh: t.tam_tinh,
          vat_amount: t.vat_amount,
          tong_cong: t.tong_cong,
          pre_tax: t.pre_tax,
        },
        sections: this.form.sections.map((s, sIdx) => ({
          letter: this.sectionLetter(sIdx),
          ten: s.ten,
          items: s.items,
          subtotal: this.sectionSubtotal(sIdx),
        })),
        adjustments: this.form.adjustments
          .filter(a => a.kind === 'plus' && a.label && a.label.trim() && this.adjEffective(a) > 0)
          .map(a => ({
            kind: 'plus', label: a.label, mode: a.mode,
            amount: a.amount,
            value_percent: a.mode === 'percent' ? a.amount : null,
            so_bo: a.so_bo, don_vi: a.don_vi, don_gia: a.don_gia,
          })),
        items: flatItems,
        quotationImages: this.quotationImages,
      });
    },

    // ─── Send email + Export PDF ─────────────────────────────────────────
    sendEmail() {
      this.error = '';
      const customer = this.customers.find(c => c.id == this.form.customer_id);
      if (!customer) { this.error = 'Chưa chọn khách hàng cho báo giá'; return; }
      if (!customer.email) {
        this.error = `Khách hàng "${customer.ten_kh}" chưa có email. Vào tab Khách hàng cập nhật rồi quay lại.`;
        return;
      }
      const so = this.form.so_bao_gia || '';
      const ngay = this.form.ngay_bao_gia ? Fmt.formatDate(this.form.ngay_bao_gia) : '';
      const tong = Fmt.formatMoney(this.totals.tong_cong);
      const dl = this.dealer.ten_dai_ly || 'Đại lý';
      const chu = this.dealer.chu_dai_ly || '';
      const phone = this.dealer.phone || '';
      const dlEmail = this.dealer.email || '';

      const subject = `Báo giá ${so} - ${dl}`;
      const body =
`Kính gửi Anh/Chị ${customer.nguoi_lien_he || customer.ten_kh},

${dl} xin gửi báo giá số ${so} ngày ${ngay} cho công trình của Quý khách.

Tổng giá trị: ${tong}
${this.form.dia_chi_cong_trinh ? 'Địa chỉ công trình: ' + this.form.dia_chi_cong_trinh : ''}

Vui lòng xem file báo giá đính kèm. Mọi thắc mắc xin liên hệ:
${chu ? '👤 ' + chu : ''}
📞 ${phone}
✉ ${dlEmail}

Trân trọng,
${chu || dl}`;

      const href = `mailto:${encodeURIComponent(customer.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
    },

    async exportPDF() {
      // BG mới chưa save → auto-save trước (export PDF cần số BG đã sinh)
      if (!this.editingId) {
        const ok = await this._ensureSaved();
        if (!ok) return;
      }
      if (!this.form.so_bao_gia) { this.error = 'Không có số báo giá'; return; }
      this.error = '';
      const root = document.querySelector('.q-print-root');
      root.innerHTML = this.renderPreview();
      root.style.display = 'block';
      try {
        await this._waitForImages(root);
        if (document.fonts && document.fonts.ready) await document.fonts.ready;

        const page = root.querySelector('.q-page');
        const heightPx = page.scrollHeight;
        const heightMm = Math.ceil(heightPx / 96 * 25.4) + 5;

        let styleEl = document.getElementById('print-page-size');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'print-page-size';
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = `@media print { @page { size: 210mm ${heightMm}mm; margin: 0; } }`;

        await new Promise(r => setTimeout(r, 200));
        const originalTitle = document.title;
        const fileSlug = (this.form.so_bao_gia || 'BG').toLowerCase().replace(/[^a-z0-9-]/g, '-');
        document.title = `bao-gia-${fileSlug}`;

        window.print();

        setTimeout(() => {
          document.title = originalTitle;
          root.style.display = 'none';
          root.innerHTML = '';
          styleEl && styleEl.remove();
        }, 1000);
      } catch (e) {
        console.error(e);
        this.error = 'Lỗi in: ' + e.message;
        root.style.display = 'none';
        root.innerHTML = '';
      }
    },

    _waitForImages(container) {
      const imgs = Array.from(container.querySelectorAll('img'));
      if (!imgs.length) return Promise.resolve();
      return Promise.all(imgs.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(r => {
          img.addEventListener('load', r, { once: true });
          img.addEventListener('error', r, { once: true });
          setTimeout(r, 3000);
        });
      }));
    },

    setupAutoFit() {
      const stage = document.querySelector('.q-preview-stage');
      if (!stage) return;
      const frame = stage.closest('.q-preview-shell');
      if (!frame) return;
      const recalc = () => {
        const w = frame.clientWidth - 8;
        const s = Math.min(1.5, Math.max(0.3, w / 794));
        document.documentElement.style.setProperty('--pv-scale', s.toFixed(3));
      };
      recalc();
      new ResizeObserver(recalc).observe(frame);
    },

    // ─── Inline tạo KH mới ───────────────────────────────────────────────
    openNewCustomer() {
      this.newCust = { ten_kh: '', nguoi_lien_he: '', phone: '', email: '', dia_chi: '' };
      this.newCustError = '';
      this.newCustOpen = true;
    },
    async submitNewCustomer() {
      this.newCustError = '';
      if (!this.newCust.ten_kh || !this.newCust.ten_kh.trim()) {
        this.newCustError = 'Vui lòng nhập tên khách hàng'; return;
      }
      this.newCustSaving = true;
      try {
        const r = await API.post('/api/dealer/customers', this.newCust);
        await this.loadCustomers();
        this.form.customer_id = r.data.id;
        if (!this.form.dia_chi_cong_trinh && r.data.dia_chi) this.form.dia_chi_cong_trinh = r.data.dia_chi;
        this.newCustOpen = false;
      } catch (e) { this.newCustError = e.message; }
      finally { this.newCustSaving = false; }
    },

    // ─── Ảnh đính kèm báo giá (không đổi vs cũ) ──────────────────────────
    getQImg(slot) { return this.quotationImages.find(i => i.slot === slot); },

    async pickQuotationImage(slot) {
      // BG mới chưa save → auto-save draft để có id rồi mở picker
      if (!this.editingId) {
        const ok = await this._ensureSaved();
        if (!ok) return;
      }
      ImagePicker.open({
        onPickFromLibrary: async (image) => {
          this.qImgUploading[slot] = true;
          try {
            const r = await API.post(`/api/dealer/quotations/${this.editingId}/images/${slot}/from-library`, { image_id: image.id });
            const existing = this.quotationImages.find(i => i.slot === slot);
            if (existing) Object.assign(existing, { url: r.data.url, public_id: r.data.public_id });
            else this.quotationImages.push({ slot, url: r.data.url, public_id: r.data.public_id, caption: null });
          } catch (err) { alert(err.message); }
          finally { this.qImgUploading[slot] = false; }
        },
        onPickUploaded: async (file) => {
          this.qImgUploading[slot] = true;
          try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`/api/dealer/quotations/${this.editingId}/images/${slot}`, {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + API.getToken() },
              body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Tải ảnh thất bại');
            const existing = this.quotationImages.find(i => i.slot === slot);
            if (existing) Object.assign(existing, { url: data.data.url, public_id: data.data.public_id });
            else this.quotationImages.push({ slot, url: data.data.url, public_id: data.data.public_id, caption: null });
          } catch (err) { alert(err.message); }
          finally { this.qImgUploading[slot] = false; }
        },
      });
    },

    async saveCaption(slot, value) {
      const img = this.getQImg(slot);
      if (!img) return;
      const newCaption = (value || '').trim();
      if ((img.caption || '') === newCaption) return;
      try {
        await API.patch(`/api/dealer/quotations/${this.editingId}/images/${slot}`, { caption: newCaption });
        this.quotationImages = this.quotationImages.map(i =>
          i.slot === slot ? { ...i, caption: newCaption || null } : i
        );
      } catch (e) { alert('Không lưu được chú thích: ' + e.message); }
    },

    async deleteQuotationImage(slot) {
      if (!confirm('Xoá ảnh này?')) return;
      this.qImgUploading[slot] = true;
      try {
        await API.delete(`/api/dealer/quotations/${this.editingId}/images/${slot}`);
        this.quotationImages = this.quotationImages.filter(i => i.slot !== slot);
      } catch (e) { alert(e.message); }
      finally { this.qImgUploading[slot] = false; }
    },

    _compressImage(file, maxDim, quality) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > maxDim || h > maxDim) {
            const r = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * r); h = Math.round(h * r);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(blob => {
            URL.revokeObjectURL(url);
            if (!blob) return canvas.toBlob(b => resolve(new File([b], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', quality);
            const ext = blob.type === 'image/webp' ? '.webp' : '.jpg';
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ext), { type: blob.type }));
          }, 'image/webp', quality);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh')); };
        img.src = url;
      });
    },

    statusLabel(s) {
      return ({ draft: 'Bản nháp', sent: 'Đã gửi', confirmed: 'Đã xác nhận', cancelled: 'Đã huỷ' })[s] || s;
    },

    // Auto-grow textarea theo content (gọi từ @input + x-init).
    autoGrow(el) {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    },
  };
}
