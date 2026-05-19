// =============================================================
// IconPicker — component dùng chung cho products.html + quotation-edit.
// Mở modal cho user chọn 1 icon từ thư viện (preset).
//
// API:
//   IconPicker.open(currentValue, onPick)
//     currentValue: { icon_preset, icon_url, icon_public_id } | null
//     onPick(newValue): callback khi user chọn xong
//                       newValue: { icon_preset, icon_url, icon_public_id } | null (clear)
//
//   IconPicker.preload()      → pre-fetch library, gọi 1 lần khi app khởi động
//   IconPicker.getLibrary()   → array icons hiện trong cache
//   IconPicker.getSvgByKey(k) → SVG content theo key, null nếu không có
//
// Đợt 2 sẽ thêm tab "Upload" (Cloudinary). Hiện tab Upload disabled với note.
// =============================================================
(function (global) {
  if (!global.AppHelpers) {
    throw new Error('icon-picker.js cần _helpers.js load trước');
  }
  const { esc } = global.AppHelpers;

  let libraryCache = null;
  let libraryPromise = null;

  function fetchLibrary(force = false) {
    if (!force && libraryPromise) return libraryPromise;
    libraryPromise = (async () => {
      try {
        const r = await API.get('/api/dealer/icons');
        libraryCache = r.data || [];
      } catch (e) {
        console.warn('[IconPicker] load library failed:', e.message);
        libraryCache = [];
      }
      return libraryCache;
    })();
    return libraryPromise;
  }

  function getSvgByKey(key) {
    if (!key || !libraryCache) return null;
    const ic = libraryCache.find(x => x.icon_key === key);
    return ic ? ic.svg_content : null;
  }

  // ─── Modal ───────────────────────────────────────────────────────────
  let modalEl = null;
  let currentOnPick = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'icon-picker-modal';
    modalEl.style.cssText = 'position:fixed;inset:0;display:none;align-items:flex-start;justify-content:center;background:rgba(0,0,0,0.5);z-index:9999;padding:24px';
    modalEl.innerHTML = `
      <div style="background:#fff;border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.25);width:100%;max-width:640px;max-height:calc(100vh - 48px);display:flex;flex-direction:column;overflow:hidden">
        <div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0">Chọn ảnh minh hoạ sản phẩm</h3>
          <button data-icon-picker-close style="background:none;border:0;font-size:24px;line-height:1;color:#64748b;cursor:pointer">&times;</button>
        </div>
        <div style="display:flex;border-bottom:1px solid #e2e8f0;padding:0 18px">
          <button data-icon-picker-tab="library" style="padding:10px 14px;border:0;background:none;font-size:13px;font-weight:600;cursor:pointer">Thư viện</button>
          <button data-icon-picker-tab="upload" style="padding:10px 14px;border:0;background:none;font-size:13px;font-weight:600;cursor:pointer">Tải ảnh riêng</button>
        </div>

        <!-- Tab Library -->
        <div data-icon-picker-pane="library" style="display:none;flex:1;display:flex;flex-direction:column;min-height:0">
          <div style="padding:12px 18px;border-bottom:1px solid #e2e8f0;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input data-icon-picker-search type="text" placeholder="Tìm ảnh MH..."
                   style="flex:1;min-width:160px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;outline:none">
            <select data-icon-picker-category style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;outline:none">
              <option value="">Tất cả nhóm</option>
            </select>
          </div>
          <div data-icon-picker-grid style="flex:1;overflow-y:auto;padding:12px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:10px">
            <div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:24px">Đang tải...</div>
          </div>
        </div>

        <!-- Tab Upload -->
        <div data-icon-picker-pane="upload" style="display:none;flex:1;flex-direction:column;padding:24px 18px;min-height:0;overflow-y:auto">
          <div data-icon-picker-dropzone style="border:2px dashed #cbd5e1;border-radius:12px;padding:36px 16px;text-align:center;cursor:pointer;transition:all 0.15s;background:#fafafa">
            <div style="font-size:32px;color:#94a3b8;margin-bottom:8px">📁</div>
            <div style="font-size:14px;font-weight:600;color:#334155;margin-bottom:4px">Nhấn để chọn ảnh / kéo thả vào đây</div>
            <div style="font-size:11px;color:#94a3b8">JPG / PNG / WebP, tối đa 5MB · sẽ tự nén nếu &gt; 200KB</div>
            <input data-icon-picker-file type="file" accept="image/jpeg,image/png,image/webp" style="display:none">
          </div>
          <div data-icon-picker-upload-status style="margin-top:12px;font-size:12px;color:#475569;text-align:center"></div>
        </div>
        <div style="padding:12px 18px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:8px">
          <button data-icon-picker-clear style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Xoá ảnh MH</button>
          <button data-icon-picker-close style="background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Huỷ</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    // Event delegation. stopPropagation để Alpine @click.outside trên modal
    // bên dưới (vd products modal) KHÔNG bị trigger khi user click trong picker.
    modalEl.addEventListener('click', e => {
      e.stopPropagation();
      if (e.target.dataset.iconPickerClose !== undefined || e.target === modalEl) {
        close();
        return;
      }
      if (e.target.dataset.iconPickerClear !== undefined) {
        finishPick(null);
        return;
      }
      // Tab switch
      const tabBtn = e.target.closest('[data-icon-picker-tab]');
      if (tabBtn) {
        setTab(tabBtn.dataset.iconPickerTab);
        return;
      }
      // Click dropzone → mở file picker
      const dropzone = e.target.closest('[data-icon-picker-dropzone]');
      if (dropzone) {
        modalEl.querySelector('[data-icon-picker-file]').click();
        return;
      }
      // Click icon trong library
      const cell = e.target.closest('[data-icon-key]');
      if (cell) {
        const key = cell.dataset.iconKey;
        finishPick({ icon_preset: key, icon_url: null, icon_public_id: null });
      }
    }, true);  // capture phase: fire trước Alpine listener trên document
    modalEl.querySelector('[data-icon-picker-search]').addEventListener('input', renderGrid);
    modalEl.querySelector('[data-icon-picker-category]').addEventListener('change', renderGrid);
    modalEl.querySelector('[data-icon-picker-file]').addEventListener('change', handleFileSelected);
    // Drag & drop trên dropzone
    const dz = modalEl.querySelector('[data-icon-picker-dropzone]');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.background = '#eff6ff'; dz.style.borderColor = '#0a6fd6'; });
    dz.addEventListener('dragleave', e => { dz.style.background = '#fafafa'; dz.style.borderColor = '#cbd5e1'; });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.style.background = '#fafafa'; dz.style.borderColor = '#cbd5e1';
      const file = e.dataTransfer.files[0];
      if (file) processUpload(file);
    });
    return modalEl;
  }

  function setTab(name) {
    if (!modalEl) return;
    const tabs = modalEl.querySelectorAll('[data-icon-picker-tab]');
    tabs.forEach(t => {
      const active = t.dataset.iconPickerTab === name;
      t.style.color = active ? '#0a6fd6' : '#475569';
      t.style.borderBottom = active ? '2px solid #0a6fd6' : 'none';
    });
    const panes = modalEl.querySelectorAll('[data-icon-picker-pane]');
    panes.forEach(p => {
      p.style.display = p.dataset.iconPickerPane === name ? 'flex' : 'none';
    });
  }

  // Compress raster image trước khi upload (skip nếu < 200KB).
  // Render xuống canvas, output WebP/JPEG <= maxDim.
  function compressImage(file, maxDim = 800, quality = 0.85) {
    if (file.size <= 200 * 1024) return Promise.resolve(file);
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
          if (!blob) {
            // Fallback JPEG nếu WebP fail
            canvas.toBlob(b => resolve(new File([b], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', quality);
          } else {
            const ext = blob.type === 'image/webp' ? '.webp' : '.jpg';
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ext), { type: blob.type }));
          }
        }, 'image/webp', quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh')); };
      img.src = url;
    });
  }

  async function handleFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';   // reset để user có thể chọn lại file cùng tên
    if (file) await processUpload(file);
  }

  async function processUpload(file) {
    if (!file) return;
    const status = modalEl.querySelector('[data-icon-picker-upload-status]');
    status.style.color = '#475569';
    status.textContent = 'Đang xử lý...';
    try {
      let toUpload = file;
      if (file.type.startsWith('image/') && file.size > 200 * 1024) {
        status.textContent = `Nén ảnh (${(file.size/1024).toFixed(0)} KB → ...)`;
        toUpload = await compressImage(file, 800, 0.85);
      }
      status.textContent = `Đang tải lên (${(toUpload.size/1024).toFixed(0)} KB)...`;
      const fd = new FormData();
      fd.append('file', toUpload);
      const res = await fetch('/api/dealer/icon-upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + API.getToken() },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Tải lên thất bại');
      status.style.color = '#16a34a';
      status.textContent = '✓ Tải lên xong';
      // Trả về với icon_preset=null, icon_url/icon_public_id từ Cloudinary
      finishPick({
        icon_preset: null,
        icon_url: json.data.url,
        icon_public_id: json.data.public_id,
      });
    } catch (err) {
      status.style.color = '#b91c1c';
      status.textContent = 'Lỗi: ' + err.message;
    }
  }

  function renderGrid() {
    if (!modalEl || !libraryCache) return;
    const search = modalEl.querySelector('[data-icon-picker-search]').value.trim().toLowerCase();
    const cat = modalEl.querySelector('[data-icon-picker-category]').value;
    const grid = modalEl.querySelector('[data-icon-picker-grid]');

    let filtered = libraryCache;
    if (cat) filtered = filtered.filter(ic => ic.category === cat);
    if (search) {
      filtered = filtered.filter(ic =>
        (ic.label || '').toLowerCase().includes(search) ||
        (ic.icon_key || '').toLowerCase().includes(search)
      );
    }

    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:24px;font-style:italic">Không có ảnh phù hợp.</div>`;
      return;
    }
    grid.innerHTML = filtered.map(ic => `
      <button type="button" data-icon-key="${esc(ic.icon_key)}"
              style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:all 0.15s"
              onmouseover="this.style.borderColor='#0a6fd6';this.style.boxShadow='0 2px 8px rgba(10,111,214,0.15)'"
              onmouseout="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">
        <span style="width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;color:#1e293b">${ic.svg_content}</span>
        <span style="font-size:10px;color:#475569;text-align:center;line-height:1.2;font-weight:600">${esc(ic.label)}</span>
      </button>
    `).join('');
  }

  function populateCategories() {
    if (!modalEl || !libraryCache) return;
    const sel = modalEl.querySelector('[data-icon-picker-category]');
    const cats = Array.from(new Set(libraryCache.map(ic => ic.category).filter(Boolean))).sort();
    sel.innerHTML = `<option value="">Tất cả nhóm</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }

  function finishPick(value) {
    if (typeof currentOnPick === 'function') currentOnPick(value);
    close();
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
    currentOnPick = null;
  }

  async function open(currentValue, onPick) {
    currentOnPick = onPick;
    ensureModal();
    modalEl.style.display = 'flex';
    setTab('library');                            // default vào tab thư viện
    // Reset upload status
    const status = modalEl.querySelector('[data-icon-picker-upload-status]');
    if (status) { status.textContent = ''; status.style.color = '#475569'; }
    if (!libraryCache) {
      modalEl.querySelector('[data-icon-picker-grid]').innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:24px">Đang tải thư viện...</div>`;
      await fetchLibrary();
    }
    populateCategories();
    renderGrid();
  }

  global.IconPicker = {
    open,
    preload: () => fetchLibrary(),
    refresh: () => fetchLibrary(true),
    getLibrary: () => libraryCache || [],
    getSvgByKey,
  };
})(window);
