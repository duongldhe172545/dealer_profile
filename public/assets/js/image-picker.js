// =============================================================
// ImagePicker — modal chọn ảnh cho slot báo giá.
// 2 tab: "Từ kho" (admin shared + dealer's) | "Tải lên mới" (upload trực tiếp + lưu vào kho dealer)
//
// API:
//   ImagePicker.open({
//     onPickFromLibrary: (image) => {},  // image: { id, name, url, public_id, dealer_id }
//     onPickUploaded:    (file)  => {},  // file: File object (đã nén nếu cần)
//   })
//
//   ImagePicker.preload()  → pre-fetch library
// =============================================================
(function (global) {
  if (!global.AppHelpers) throw new Error('image-picker.js cần _helpers.js load trước');
  const { esc } = global.AppHelpers;

  let libraryCache = null;
  let libraryPromise = null;

  function fetchLibrary(force = false) {
    if (!force && libraryPromise) return libraryPromise;
    libraryPromise = (async () => {
      try {
        const r = await API.get('/api/dealer/images');
        libraryCache = r.data || [];
      } catch (e) {
        console.warn('[ImagePicker] load library failed:', e.message);
        libraryCache = [];
      }
      return libraryCache;
    })();
    return libraryPromise;
  }

  let modalEl = null;
  let onPickFromLibrary = null;
  let onPickUploaded = null;

  function ensureModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'image-picker-modal';
    modalEl.style.cssText = 'position:fixed;inset:0;display:none;align-items:flex-start;justify-content:center;background:rgba(0,0,0,0.5);z-index:9999;padding:24px';
    modalEl.innerHTML = `
      <div style="background:#fff;border-radius:16px;box-shadow:0 24px 48px rgba(0,0,0,0.25);width:100%;max-width:760px;max-height:calc(100vh - 48px);display:flex;flex-direction:column;overflow:hidden">
        <div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0">Chọn ảnh</h3>
          <button data-ip-close style="background:none;border:0;font-size:24px;line-height:1;color:#64748b;cursor:pointer">&times;</button>
        </div>
        <div style="display:flex;border-bottom:1px solid #e2e8f0;padding:0 18px">
          <button data-ip-tab="library" style="padding:10px 14px;border:0;background:none;font-size:13px;font-weight:600;cursor:pointer">Từ kho</button>
          <button data-ip-tab="upload" style="padding:10px 14px;border:0;background:none;font-size:13px;font-weight:600;cursor:pointer">Tải lên mới</button>
        </div>

        <!-- Tab Library -->
        <div data-ip-pane="library" style="display:none;flex:1;flex-direction:column;min-height:0">
          <div style="padding:12px 18px;border-bottom:1px solid #e2e8f0;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input data-ip-search type="text"
                   style="flex:1;min-width:160px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;outline:none">
            <select data-ip-category style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;outline:none">
              <option value="">Tất cả nhóm</option>
            </select>
            <select data-ip-owner style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;outline:none">
              <option value="">Tất cả</option>
              <option value="admin">Kho chung</option>
              <option value="dealer">Kho của tôi</option>
            </select>
          </div>
          <div data-ip-grid style="flex:1;overflow-y:auto;padding:12px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;min-height:200px">
            <div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:24px">Đang tải...</div>
          </div>
        </div>

        <!-- Tab Upload -->
        <div data-ip-pane="upload" style="display:none;flex:1;flex-direction:column;padding:24px 18px;min-height:0;overflow-y:auto">
          <div data-ip-dropzone style="border:2px dashed #cbd5e1;border-radius:12px;padding:36px 16px;text-align:center;cursor:pointer;transition:all 0.15s;background:#fafafa">
            <div style="font-size:32px;color:#94a3b8;margin-bottom:8px">📁</div>
            <div style="font-size:14px;font-weight:600;color:#334155;margin-bottom:4px">Nhấn để chọn ảnh / kéo thả vào đây</div>
            <div style="font-size:11px;color:#94a3b8">JPG / PNG / WebP, tối đa 5MB · sẽ tự nén nếu &gt; 200KB</div>
            <input data-ip-file type="file" accept="image/jpeg,image/png,image/webp" style="display:none">
          </div>
          <div data-ip-upload-status style="margin-top:12px;font-size:12px;color:#475569;text-align:center"></div>
        </div>

        <div style="padding:12px 18px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;align-items:center;gap:8px">
          <button data-ip-close style="background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Huỷ</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', e => {
      e.stopPropagation();
      if (e.target.dataset.ipClose !== undefined || e.target === modalEl) { close(); return; }
      const tabBtn = e.target.closest('[data-ip-tab]');
      if (tabBtn) { setTab(tabBtn.dataset.ipTab); return; }
      const dropzone = e.target.closest('[data-ip-dropzone]');
      if (dropzone) { modalEl.querySelector('[data-ip-file]').click(); return; }
      const cell = e.target.closest('[data-ip-id]');
      if (cell) {
        const id = Number(cell.dataset.ipId);
        const img = (libraryCache || []).find(x => x.id === id);
        if (img && typeof onPickFromLibrary === 'function') onPickFromLibrary(img);
        close();
      }
    }, true);

    modalEl.querySelector('[data-ip-search]').addEventListener('input', renderGrid);
    modalEl.querySelector('[data-ip-category]').addEventListener('change', renderGrid);
    modalEl.querySelector('[data-ip-owner]').addEventListener('change', renderGrid);
    modalEl.querySelector('[data-ip-file]').addEventListener('change', handleFileSelected);

    const dz = modalEl.querySelector('[data-ip-dropzone]');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.style.background = '#eff6ff'; dz.style.borderColor = '#0a6fd6'; });
    dz.addEventListener('dragleave', () => { dz.style.background = '#fafafa'; dz.style.borderColor = '#cbd5e1'; });
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
    modalEl.querySelectorAll('[data-ip-tab]').forEach(t => {
      const active = t.dataset.ipTab === name;
      t.style.color = active ? '#0a6fd6' : '#475569';
      t.style.borderBottom = active ? '2px solid #0a6fd6' : 'none';
    });
    modalEl.querySelectorAll('[data-ip-pane]').forEach(p => {
      p.style.display = p.dataset.ipPane === name ? 'flex' : 'none';
    });
  }

  function compressImage(file, maxDim = 1600, quality = 0.85) {
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
    e.target.value = '';
    if (file) await processUpload(file);
  }

  async function processUpload(file) {
    if (!file) return;
    const status = modalEl.querySelector('[data-ip-upload-status]');
    status.style.color = '#475569';
    status.textContent = 'Đang xử lý...';
    try {
      let toUpload = file;
      if (file.type.startsWith('image/') && file.size > 200 * 1024) {
        status.textContent = `Nén ảnh (${(file.size/1024).toFixed(0)} KB → ...)`;
        toUpload = await compressImage(file, 1600, 0.85);
      }
      status.style.color = '#16a34a';
      status.textContent = `✓ Sẵn sàng (${(toUpload.size/1024).toFixed(0)} KB)`;
      if (typeof onPickUploaded === 'function') onPickUploaded(toUpload);
      close();
    } catch (err) {
      status.style.color = '#b91c1c';
      status.textContent = 'Lỗi: ' + err.message;
    }
  }

  function renderGrid() {
    if (!modalEl || !libraryCache) return;
    const search = modalEl.querySelector('[data-ip-search]').value.trim().toLowerCase();
    const cat = modalEl.querySelector('[data-ip-category]').value;
    const owner = modalEl.querySelector('[data-ip-owner]').value;
    const grid = modalEl.querySelector('[data-ip-grid]');

    let filtered = libraryCache;
    if (cat) filtered = filtered.filter(i => i.category === cat);
    if (owner === 'admin')  filtered = filtered.filter(i => i.dealer_id == null);
    if (owner === 'dealer') filtered = filtered.filter(i => i.dealer_id != null);
    if (search) filtered = filtered.filter(i => (i.name || '').toLowerCase().includes(search));

    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:24px;font-style:italic">Không có ảnh phù hợp. Chuyển tab "Tải lên mới" để thêm ảnh.</div>`;
      return;
    }
    grid.innerHTML = filtered.map(i => {
      const badge = i.dealer_id == null
        ? '<span style="background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">CHUNG</span>'
        : '<span style="background:#dbeafe;color:#1e40af;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700">KHO TÔI</span>';
      return `
        <button type="button" data-ip-id="${i.id}"
                style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px;cursor:pointer;display:flex;flex-direction:column;gap:4px;transition:all 0.15s;text-align:left"
                onmouseover="this.style.borderColor='#0a6fd6';this.style.boxShadow='0 2px 8px rgba(10,111,214,0.15)'"
                onmouseout="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">
          <div style="aspect-ratio:1;background:#f1f5f9;border-radius:4px;overflow:hidden">
            <img src="${esc(i.url)}" alt="${esc(i.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">
          </div>
          <div style="font-size:11px;font-weight:600;color:#1e293b;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(i.name)}">${esc(i.name)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
            ${badge}
            <span style="font-size:9px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.category || '')}</span>
          </div>
        </button>`;
    }).join('');
  }

  function populateCategories() {
    if (!modalEl || !libraryCache) return;
    const sel = modalEl.querySelector('[data-ip-category]');
    const cats = Array.from(new Set(libraryCache.map(i => i.category).filter(Boolean))).sort();
    sel.innerHTML = `<option value="">Tất cả nhóm</option>` + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  }

  function close() {
    if (modalEl) modalEl.style.display = 'none';
    onPickFromLibrary = null;
    onPickUploaded = null;
  }

  async function open({ onPickFromLibrary: fnLib, onPickUploaded: fnUp } = {}) {
    onPickFromLibrary = fnLib || null;
    onPickUploaded = fnUp || null;
    ensureModal();
    modalEl.style.display = 'flex';
    // Thiết lập placeholder/search reset
    modalEl.querySelector('[data-ip-search]').value = '';
    modalEl.querySelector('[data-ip-search]').setAttribute('placeholder', 'Tìm theo tên...');
    modalEl.querySelector('[data-ip-owner]').value = '';
    modalEl.querySelector('[data-ip-category]').value = '';
    const status = modalEl.querySelector('[data-ip-upload-status]');
    if (status) { status.textContent = ''; status.style.color = '#475569'; }
    setTab('library');
    if (!libraryCache) {
      modalEl.querySelector('[data-ip-grid]').innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:24px">Đang tải kho ảnh...</div>`;
      await fetchLibrary();
    }
    populateCategories();
    renderGrid();
  }

  global.ImagePicker = {
    open,
    preload: () => fetchLibrary(),
    refresh: () => fetchLibrary(true),
    getLibrary: () => libraryCache || [],
  };
})(window);
