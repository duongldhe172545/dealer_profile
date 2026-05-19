// =============================================================
// Logic Alpine cho trang sửa báo giá — v2 với sections + adjustments.
//
// State model:
//   form.sections = [{ _key, _id?, ten, items: [{ _key, ma_sp, ..., dien_tich, _dien_tich_manual }] }]
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
    icon_preset: null, icon_url: null, icon_public_id: null,
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
    amount: 0,         // mode='fixed': đồng. mode='percent': % value (vd 5.5)
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
    thanh_toan: 'Đặt cọc 40% · 50% khi giao hàng · 10% sau nghiệm thu',
    tien_do: '12 - 18 ngày làm việc tuỳ cấu hình',
    bao_hanh: 'Bảo hành 24 tháng theo chính sách của hãng và đại lý',
    status: 'draft',
    sections: [emptySection('')],
    adjustments: [],
  };
}

// ─── Helpers tính toán ─────────────────────────────────────────────────────
// Diện tích auto từ rộng × cao (mm × mm → m²)
function calcArea(rong, cao) {
  if (!rong || !cao) return null;
  return Math.round(Number(rong) * Number(cao) / 100) / 10000;  // làm tròn 4 chữ số
}

// Thành tiền 1 dòng: có DT → DT × SL × giá; không có DT → SL × giá
function lineTotal(it) {
  const sl = Number(it.sl) || 0;
  const dg = Number(it.don_gia) || 0;
  const dt = Number(it.dien_tich) || 0;
  if (dt > 0) return Math.round(dt * sl * dg);
  return Math.round(sl * dg);
}

function quoteForm() {
  return {
    loading: true, saving: false, savedFlash: false, error: '',
    editingId: null,
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

    // Inline tạo KH mới
    newCustOpen: false, newCustSaving: false, newCustError: '',
    newCust: { ten_kh: '', nguoi_lien_he: '', phone: '', email: '', dia_chi: '' },

    // ─── Computed getters ────────────────────────────────────────────────
    get totalItemsCount() {
      return this.form.sections.reduce((n, s) => n + s.items.length, 0);
    },

    // Grouped mode = có >1 section HOẶC bất kỳ section nào có tên.
    // Flat mode = 1 section duy nhất, ten='' → ẩn section header + subtotal.
    get isGroupedMode() {
      if (this.form.sections.length > 1) return true;
      return this.form.sections.some(s => s.ten && s.ten.trim());
    },

    get plusAdjustments() {
      return this.form.adjustments.filter(a => a.kind === 'plus');
    },
    get minusAdjustments() {
      return this.form.adjustments.filter(a => a.kind === 'minus');
    },

    sectionLetter(idx) {
      if (idx < 26) return String.fromCharCode(65 + idx);     // A..Z
      // Quá Z thì AA, AB...
      const a = Math.floor(idx / 26) - 1;
      const b = idx % 26;
      return String.fromCharCode(65 + a) + String.fromCharCode(65 + b);
    },

    sectionSubtotal(sIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return 0;
      return sec.items.reduce((s, it) => s + (Number(it.thanh_tien) || 0), 0);
    },

    autoArea(it) {
      const a = calcArea(it.rong, it.cao);
      return a > 0 ? a : '';
    },

    // Effective amount của 1 adjustment (đồng):
    //   fixed   → amount như đã nhập
    //   percent → tam_tinh × % / 100 (làm tròn)
    adjEffective(a) {
      if (!a) return 0;
      if (a.mode === 'percent') {
        const pct = Number(a.amount) || 0;
        return Math.round(this._tamTinh() * pct / 100);
      }
      return Number(a.amount) || 0;
    },
    _tamTinh() {
      return this.form.sections.reduce(
        (s, sec) => s + sec.items.reduce((ss, it) => ss + (Number(it.thanh_tien) || 0), 0),
        0
      );
    },

    get totals() {
      const tam_tinh = this._tamTinh();
      let plus_sum = 0, minus_sum = 0;
      for (const a of this.form.adjustments) {
        const eff = this.adjEffective(a);
        if (a.kind === 'plus') plus_sum += eff;
        else if (a.kind === 'minus') minus_sum += eff;
      }
      const pre_tax = tam_tinh + plus_sum - minus_sum;
      const vat_amount = Math.round(pre_tax * (Number(this.form.vat_percent) || 0) / 100);
      const tong_cong = pre_tax + vat_amount;
      return { tam_tinh, plus_sum, minus_sum, pre_tax, vat_amount, tong_cong };
    },

    // ─── Section actions ─────────────────────────────────────────────────
    addSection() {
      this.form.sections.push(emptySection(''));
    },
    removeSection(sIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return;
      if (sec.items.length > 0 && !confirm(`Nhóm "${sec.ten || this.sectionLetter(sIdx)}" có ${sec.items.length} dòng. Xoá luôn không?`)) return;
      this.form.sections.splice(sIdx, 1);
    },
    moveSection(sIdx, dir) {
      const newIdx = sIdx + dir;
      if (newIdx < 0 || newIdx >= this.form.sections.length) return;
      const arr = this.form.sections;
      [arr[sIdx], arr[newIdx]] = [arr[newIdx], arr[sIdx]];
    },

    // ─── Item actions ────────────────────────────────────────────────────
    addItem(sIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return;
      sec.items.push(emptyItem());
    },
    // Top-level "+ Thêm dòng" — luôn add vào section cuối (nếu chưa có section, tạo 1)
    addItemToLastSection() {
      if (!this.form.sections.length) this.form.sections.push(emptySection(''));
      const last = this.form.sections.length - 1;
      this.form.sections[last].items.push(emptyItem());
    },
    removeItem(sIdx, iIdx) {
      const sec = this.form.sections[sIdx];
      if (!sec) return;
      sec.items.splice(iIdx, 1);
    },

    // Khi rộng hoặc cao đổi → auto-set diện tích (trừ khi user đã gõ tay)
    onDimensionChange(sIdx, iIdx) {
      const it = this.form.sections[sIdx].items[iIdx];
      if (!it._dien_tich_manual) {
        const a = calcArea(it.rong, it.cao);
        it.dien_tich = a > 0 ? a : null;
      }
      this.recalcItem(sIdx, iIdx);
    },

    // Khi user gõ trực tiếp ô diện tích
    //   - Empty/0 → reset về auto mode (auto-calc lại nếu có rộng×cao)
    //   - Có giá trị → mark manual, dùng giá trị đó
    onDienTichInput(sIdx, iIdx, value) {
      const it = this.form.sections[sIdx].items[iIdx];
      const n = Number(value);
      if (value === '' || value == null || !Number.isFinite(n) || n === 0) {
        it._dien_tich_manual = false;
        const a = calcArea(it.rong, it.cao);
        it.dien_tich = a > 0 ? a : null;
      } else {
        it._dien_tich_manual = true;
        it.dien_tich = n;
      }
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
      // Icon snapshot từ catalog (đại lý có thể đổi per-item sau)
      it.icon_preset    = p.icon_preset || null;
      it.icon_url       = p.icon_url || null;
      it.icon_public_id = p.icon_public_id || null;
      if (!it.sl) it.sl = 1;
      this.recalcItem(sIdx, iIdx);
    },

    // Resolve SVG icon cho item — preset từ library hoặc img URL
    resolveItemIconSvg(it) {
      if (it && it.icon_url) return `<img src="${it.icon_url}" alt="" style="max-width:100%;max-height:100%;object-fit:contain">`;
      if (it && it.icon_preset && window.IconPicker) {
        const svg = IconPicker.getSvgByKey(it.icon_preset);
        if (svg) return svg;
      }
      return '<span style="color:#cbd5e1;font-size:14px">＋</span>';
    },
    pickItemIcon(sIdx, iIdx) {
      const it = this.form.sections[sIdx].items[iIdx];
      if (!it) return;
      IconPicker.open(
        { icon_preset: it.icon_preset, icon_url: it.icon_url },
        (val) => {
          if (val) {
            it.icon_preset    = val.icon_preset || null;
            it.icon_url       = val.icon_url || null;
            it.icon_public_id = val.icon_public_id || null;
          } else {
            it.icon_preset = null; it.icon_url = null; it.icon_public_id = null;
          }
        }
      );
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
      this.editingId = new URLSearchParams(location.search).get('id');
      this._initializing = true;
      try {
        // Preload icon library (cho resolveItemIconSvg + picker)
        window.IconPicker && IconPicker.preload();
        await Promise.all([this.loadProfile(), this.loadCustomers(), this.loadProducts()]);
        if (this.editingId) {
          await this.loadQuotation(this.editingId);
        } else {
          // tạo mới: gợi ý số BG
          const ngay = this.form.ngay_bao_gia;
          const r = await API.get('/api/dealer/quotations/suggest-number?ngay_bao_gia=' + ngay);
          this.form.so_bao_gia = r.so_bao_gia;
        }
        this.recalcAll();
        this.$nextTick(() => {
          this.setupAutoFit();
          this.setupAutoSave();
          this._initializing = false;
          // Sau load: nếu đang edit BG cũ → đồng bộ với server.
          // BG mới → user phải save tay lần đầu để có id.
          if (this.editingId) this.lastSavedAt = new Date();
        });
      } catch (e) { this.error = e.message; }
      finally { this.loading = false; }
    },

    setupAutoSave() {
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
          const dt = it.dien_tich;
          const autoDt = calcArea(it.rong, it.cao);
          // Manual nếu dien_tich tồn tại nhưng KHÁC giá trị auto
          //   hoặc khi không có rộng×cao mà vẫn có dien_tich
          const isManual = dt != null && (
            !it.rong || !it.cao ||
            (autoDt != null && Math.abs(dt - autoDt) > 0.01)
          );
          return {
            _key: uniqKey('it'),
            product_id: it.product_id,
            ma_sp: it.ma_sp || '', ten_sp: it.ten_sp || '',
            nhom_sp: it.nhom_sp || '', mo_ta: it.mo_ta || '',
            rong: it.rong, cao: it.cao,
            dien_tich: dt,
            _dien_tich_manual: isManual,
            icon_preset: it.icon_preset || null,
            icon_url: it.icon_url || null,
            icon_public_id: it.icon_public_id || null,
            sl: it.sl, dvt: it.dvt || '',
            don_gia: it.don_gia || 0, thanh_tien: it.thanh_tien || 0,
          };
        }),
      }));

      // Items "orphan" (section_id null) — push vào 1 section "Khác" cuối
      const orphan = itemsBySection.get(null) || [];
      if (orphan.length) {
        sections.push({
          _key: uniqKey('sec'), _id: null, ten: 'Khác',
          items: orphan.map(it => ({
            _key: uniqKey('it'),
            product_id: it.product_id,
            ma_sp: it.ma_sp || '', ten_sp: it.ten_sp || '',
            nhom_sp: it.nhom_sp || '', mo_ta: it.mo_ta || '',
            rong: it.rong, cao: it.cao,
            dien_tich: it.dien_tich,
            _dien_tich_manual: it.dien_tich != null,
            icon_preset: it.icon_preset || null,
            icon_url: it.icon_url || null,
            icon_public_id: it.icon_public_id || null,
            sl: it.sl, dvt: it.dvt || '',
            don_gia: it.don_gia || 0, thanh_tien: it.thanh_tien || 0,
          })),
        });
      }

      if (!sections.length) sections.push(emptySection(''));

      // Báo giá cũ migrate có 1 section default "Chưa phân nhóm" → đổi về '' cho flat mode
      if (sections.length === 1 && (sections[0].ten || '').trim() === 'Chưa phân nhóm') {
        sections[0].ten = '';
      }

      const adjustments = (q.adjustments || []).map(a => {
        const mode = a.mode === 'percent' ? 'percent' : 'fixed';
        return {
          _key: uniqKey('adj'),
          kind: a.kind, label: a.label,
          mode,
          // mode='percent' → amount FE = value_percent từ server (vd 5.5)
          // mode='fixed'   → amount FE = amount từ server (đồng)
          amount: mode === 'percent' ? (Number(a.value_percent) || 0) : (Number(a.amount) || 0),
        };
      });

      this.form = {
        so_bao_gia: q.so_bao_gia, ngay_bao_gia: q.ngay_bao_gia,
        customer_id: q.customer_id || '',
        dia_chi_cong_trinh: q.dia_chi_cong_trinh || '',
        ghi_chu_ho_so: q.ghi_chu_ho_so || '',
        ghi_chu_thuong_mai: q.ghi_chu_thuong_mai || '',
        vat_percent: q.vat_percent != null ? q.vat_percent : 0,
        thanh_toan: q.thanh_toan || '',
        tien_do: q.tien_do || '',
        bao_hanh: q.bao_hanh || '',
        status: q.status,
        sections,
        adjustments,
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
            icon_preset: it.icon_preset || null,
            icon_url: it.icon_url || null,
            icon_public_id: it.icon_public_id || null,
            // nhom_sp: server tự set = section.ten (backward compat)
          })),
        }));
      const adjustments = this.form.adjustments
        .filter(a => a.label && a.label.trim() && Number(a.amount) > 0)
        .map(a => ({
          kind: a.kind,
          label: a.label.trim(),
          mode: a.mode || 'fixed',
          amount: Number(a.amount),  // server hiểu theo mode: fixed=đồng, percent=% value
        }));

      const payload = {
        so_bao_gia: this.form.so_bao_gia,
        ngay_bao_gia: this.form.ngay_bao_gia,
        customer_id: this.form.customer_id,
        dia_chi_cong_trinh: this.form.dia_chi_cong_trinh,
        ghi_chu_ho_so: this.form.ghi_chu_ho_so,
        ghi_chu_thuong_mai: this.form.ghi_chu_thuong_mai,
        vat_percent: this.form.vat_percent,
        thanh_toan: this.form.thanh_toan,
        tien_do: this.form.tien_do,
        bao_hanh: this.form.bao_hanh,
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
        adjustments: this.form.adjustments.filter(a => a.label && Number(a.amount) > 0),
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
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.style.display = 'none';
      input.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) { input.remove(); return; }
        this.qImgUploading[slot] = true;
        try {
          let toUpload = file;
          if (file.type.startsWith('image/') && file.size > 200 * 1024) {
            toUpload = await this._compressImage(file, 1600, 0.82);
          }
          const fd = new FormData();
          fd.append('file', toUpload);
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
        } catch (err) {
          alert(err.message);
        } finally {
          this.qImgUploading[slot] = false;
          input.remove();
        }
      };
      document.body.appendChild(input);
      input.click();
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
