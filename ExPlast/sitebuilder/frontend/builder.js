export let dragBlockType = null;
export const AUTO_SAVE_KEY = 'builderAutosave';
export const AUTO_SAVE_INTERVAL = 10000;
export const bar = document.getElementById('inlineToolbar');
export const pick = document.getElementById('colorPick');

// API helper
async function api(method, path, body) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw await r.text();
  return r.json();
}


class Builder {
  constructor() {
    this.project = {
      id: null,
      name: '',
      pages: { index: { html: '' } },
      config: { bgColor: '#ffffff', grid: 20, bgImage: '' }
    };
    this.pages = ['index'];
    this.current = 'index';
    this.selectedItems = [];
    this.selected = null;
    this.layerId = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.clipboard = null;
    this.theme = 'light';
    this.groupBox = null;
    this.previewWindow = null;
    this.previewMode = false;
    this.guideH = null;
    this.guideV = null;
    this.autosaveTimer = null;
    this.gridVisible = false;
    this.canvasObserver = null;
  }

  setupDraggables() {
    if (!this.canvas) return;
    for (const el of this.canvas.querySelectorAll('.draggable')) {
      if (window.addResizeHandles) {
        window.addResizeHandles(el);
      }
    }
  }

  init() {
    this.canvas      = document.getElementById('canvas');
    if (this.canvas) {
      this.canvasObserver?.disconnect();
      this.canvasObserver = new ResizeObserver(() => this.drawGrid());
      this.canvasObserver.observe(this.canvas);
    }
    this.btnCreate   = document.getElementById('btnCreate');
    this.btnLoad     = document.getElementById('btnLoad');
    this.btnImport   = document.getElementById('btnImport');
    this.fileImport  = document.getElementById('fileImport');
    this.btnSave     = document.getElementById('btnSave');
    this.btnExport   = document.getElementById('btnExport');
    this.btnConfig   = document.getElementById('btnConfig');
    this.btnPreview  = document.getElementById('btnPreview');
    this.pageSelect  = document.getElementById('pageSelect');
    this.pageAdd     = document.getElementById('pageAdd');
    this.pageDel     = document.getElementById('pageDel');
    this.layersList  = document.getElementById('layersList');
    this.layerUp     = document.getElementById('layerUp');
    this.layerDown   = document.getElementById('layerDown');
    this.layerToggle = document.getElementById('layerToggle');
    this.configPanel = document.getElementById('configPanel');
    this.cfgName     = document.getElementById('cfgName');
    this.cfgBg       = document.getElementById('cfgBg');
    this.cfgBgImage  = document.getElementById('cfgBgImage');
    this.cfgGrid     = document.getElementById('cfgGrid');
    this.gridCanvas  = document.getElementById('gridCanvas');
    this.guideH      = document.getElementById('guideH');
    this.guideV      = document.getElementById('guideV');
    if (this.canvas) {
      this.groupBox = document.createElement('div');
      this.groupBox.id = 'groupSelectBox';
      this.canvas.appendChild(this.groupBox);
    }
    this.propW       = document.getElementById('propWidth');
    this.propH       = document.getElementById('propHeight');
    this.propFont    = document.getElementById('propFont');
    this.propColor   = document.getElementById('propColor');
    this.propAlign   = document.getElementById('propAlign');
    this.propFamily  = document.getElementById('propFamily');
    this.propBold    = document.getElementById('propBold');
    this.propItalic  = document.getElementById('propItalic');
    this.propBg      = document.getElementById('propBg');
    this.propBorderWidth = document.getElementById('propBorderWidth');
    this.propBorderColor = document.getElementById('propBorderColor');
    this.propRadius  = document.getElementById('propRadius');
    this.propShadow  = document.getElementById('propShadow');
    this.propSrc     = document.getElementById('propSrc');
    this.propAlt     = document.getElementById('propAlt');
    this.propSrcRow  = document.getElementById('propSrcRow');
    this.propAltRow  = document.getElementById('propAltRow');
    this.propHref    = document.getElementById('propHref');
    this.propTarget  = document.getElementById('propTarget');
    this.propHrefRow = document.getElementById('propHrefRow');
    this.propTargetRow = document.getElementById('propTargetRow');
    this.btnTheme    = document.getElementById('btnTheme');
    this.btnGrid     = document.getElementById('btnGrid');

    this.theme = localStorage.getItem('theme') || 'light';
    this.applyTheme(this.theme);

    let restored = false;
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (confirm('Обнаружена сохранённая копия. Восстановить?')) {
          this.project = data.project || this.project;
          if (!this.project.config) this.project.config = { bgColor: '#fafafa', grid: 20, bgImage: '' };
          this.pages = Object.keys(this.project.pages);
          restored = true;
          this.updateSelect();
          this.switchPage(data.current || this.pages[0]);
          this.applyConfig();
          this.setupDraggables();
        } else {
          localStorage.removeItem(AUTO_SAVE_KEY);
        }
      } catch {}
    }

    if (this.propW)   this.propW.oninput   = () => this.changeProps();
    if (this.propH)   this.propH.oninput   = () => this.changeProps();
    if (this.propFont) this.propFont.oninput = () => this.changeProps();
    if (this.propColor) this.propColor.oninput = () => this.changeProps();
    if (this.propAlign) this.propAlign.onchange = () => this.changeProps();
    if (this.propFamily) this.propFamily.onchange = () => this.changeProps();
    if (this.propBold) this.propBold.onchange = () => this.changeProps();
    if (this.propItalic) this.propItalic.onchange = () => this.changeProps();
    if (this.propBg)  this.propBg.oninput  = () => this.changeProps();
    if (this.propBorderWidth) this.propBorderWidth.oninput = () => this.changeProps();
    if (this.propBorderColor) this.propBorderColor.oninput = () => this.changeProps();
    if (this.propRadius) this.propRadius.oninput = () => this.changeProps();
    if (this.propShadow) this.propShadow.onchange = () => this.changeProps();
    if (this.propSrc) this.propSrc.oninput = () => this.changeProps();
    if (this.propAlt) this.propAlt.oninput = () => this.changeProps();
    if (this.propHref) this.propHref.oninput = () => this.changeProps();
    if (this.propTarget) this.propTarget.onchange = () => this.changeProps();
    if (this.cfgGrid) this.cfgGrid.oninput = () => {
      this.project.config.grid = parseInt(this.cfgGrid.value) || 0;
      this.applyConfig();
    };

    this.btnCreate.onclick  = () => this.createProject();
    this.btnLoad.onclick    = () => this.loadProject();
    if (this.btnImport) this.btnImport.onclick = () => this.fileImport?.click();
    if (this.fileImport) this.fileImport.onchange = () => this.importProject();
    this.btnSave.onclick    = () => this.saveProject();
    this.btnExport.onclick  = () => this.exportProject();
    this.btnConfig.onclick  = () => this.toggleConfig();
    if (this.btnPreview) this.btnPreview.onclick = () => this.togglePreview();
    if (this.btnTheme) this.btnTheme.onclick = () => this.toggleTheme();
    if (this.btnGrid) {
      this.btnGrid.onclick = () => this.toggleGrid();
      this.btnGrid.classList.toggle('active', this.gridVisible);
    }
    window.addEventListener('resize', () => this.drawGrid());
    this.pageSelect.onchange = () => this.switchPage(this.pageSelect.value);
    this.pageAdd.onclick    = () => this.addPage();
    this.pageDel.onclick    = () => this.deletePage();
    this.layerUp.onclick    = () => this.moveLayer(1);
    this.layerDown.onclick  = () => this.moveLayer(-1);
    this.layerToggle.onclick= () => this.toggleLayer();

    this.blocksBar = document.getElementById('blocksBar');
    if (this.blocksBar) {
      for (const item of this.blocksBar.querySelectorAll('.block-item')) {
        item.addEventListener('dragstart', () => {
          dragBlockType = item.dataset.type;
        });
      }
    }

    if (this.canvas) {
      this.canvas.addEventListener('dragover', e => {
        if (dragBlockType) e.preventDefault();
      });
      this.canvas.addEventListener('drop', e => {
        if (!dragBlockType) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        window.addBlock(dragBlockType, x, y);
        dragBlockType = null;
      });
    }

    this.canvas.addEventListener('click', e => {
      const el = e.target.closest('.draggable');
      if (el) {
        this.selectElement(el, e.shiftKey);
      } else if (!e.shiftKey) {
        this.selectElement(null);
      }
    });

    if (!restored) {
      this.updateSelect();
      this.switchPage('index');
      this.setupDraggables();
      this.applyConfig();
    }
    this.saveState();
    this.startAutosave();

    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (this.selected) {
          e.preventDefault();
          this.copyElement();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'v') {
        if (this.clipboard) {
          e.preventDefault();
          this.pasteElement();
        }
      } else if (e.key === 'Delete' && this.selectedItems.length) {
        for (const it of this.selectedItems) it.remove();
        this.selectedItems = [];
        this.selected = null;
        if (bar) bar.classList.remove('open');
        this.updateLayers();
        this.updateGroupBox();
        this.saveState();
      }
    });
  }

  updateSelect() {
    this.pageSelect.innerHTML = '';
    for (const id of this.pages) {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = id;
      if (id === this.current) {
        o.classList.add('active');
        o.selected = true;
      }
      this.pageSelect.appendChild(o);
    }
  }

  updateLayers() {
    if (!this.layersList) return;
    this.layersList.innerHTML = '';
    const els = Array.from(this.canvas.querySelectorAll('.draggable'));
    els.sort((a, b) => (parseInt(b.style.zIndex || '0') - parseInt(a.style.zIndex || '0')));
    for (const el of els) {
      if (!el.dataset.layerId) el.dataset.layerId = ++this.layerId;
      const li = document.createElement('li');
      li.textContent = el.tagName.toLowerCase() + ' ' + el.dataset.layerId;
      li.dataset.id = el.dataset.layerId;
      if (this.selectedItems.includes(el)) li.classList.add('selected');
      li.onclick = () => { this.selectElement(el); this.updateLayers(); };
      this.layersList.appendChild(li);
    }
  }

  updateGroupBox() {
    if (!this.groupBox) return;
    if (this.selectedItems.length <= 1) {
      this.groupBox.style.display = 'none';
      return;
    }
    const p = this.canvas.getBoundingClientRect();
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const el of this.selectedItems) {
      const r = el.getBoundingClientRect();
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    }
    this.groupBox.style.display = 'block';
    this.groupBox.style.left = (left - p.left) + 'px';
    this.groupBox.style.top = (top - p.top) + 'px';
    this.groupBox.style.width = (right - left) + 'px';
    this.groupBox.style.height = (bottom - top) + 'px';
  }

  checkGuides(el) {
    if (!this.guideH || !this.guideV || !this.canvas || !el) return;
    const r = el.getBoundingClientRect();
    const p = this.canvas.getBoundingClientRect();
    const cx = p.left + p.width / 2;
    const cy = p.top + p.height / 2;
    let gx = null, gy = null;
    for (const other of this.canvas.querySelectorAll('.draggable')) {
      if (other === el) continue;
      const or = other.getBoundingClientRect();
      const ox = [or.left, or.right, or.left + or.width / 2];
      const oy = [or.top, or.bottom, or.top + or.height / 2];
      const rx = [r.left, r.right, r.left + r.width / 2];
      const ry = [r.top, r.bottom, r.top + r.height / 2];
      if (gx === null) {
        for (const x of rx) if (ox.some(v => Math.abs(v - x) < 1)) { gx = x - p.left; break; }
      }
      if (gy === null) {
        for (const y of ry) if (oy.some(v => Math.abs(v - y) < 1)) { gy = y - p.top; break; }
      }
      if (gx !== null && gy !== null) break;
    }
    if (gx === null) {
      for (const x of [r.left, r.right, r.left + r.width / 2]) {
        if (Math.abs(cx - x) < 1) { gx = x - p.left; break; }
      }
    }
    if (gy === null) {
      for (const y of [r.top, r.bottom, r.top + r.height / 2]) {
        if (Math.abs(cy - y) < 1) { gy = y - p.top; break; }
      }
    }
    if (gx !== null) {
      this.guideV.style.left = gx + 'px';
      this.guideV.style.display = 'block';
    } else {
      this.guideV.style.display = 'none';
    }
    if (gy !== null) {
      this.guideH.style.top = gy + 'px';
      this.guideH.style.display = 'block';
    } else {
      this.guideH.style.display = 'none';
    }
  }

  hideGuides() {
    if (this.guideH) this.guideH.style.display = 'none';
    if (this.guideV) this.guideV.style.display = 'none';
  }

  async createProject() {
    const name = prompt('Название проекта', 'Сайт');
    if (!name) return;
    this.project = {
      id: null,
      name,
      pages: { index: { html: '' } },
      config: { bgColor: '#ffffff', grid: 20, bgImage: '' }
    };
    this.pages = ['index'];
    this.updateSelect();
    this.switchPage('index');
    this.setupDraggables();
    this.applyConfig();
    this.startAutosave();
  }

  async loadProject() {
    const id = parseInt(prompt('ID проекта', this.project.id || '1'));
    if (!id) return;
    try {
      const pr = await api('GET', `/projects/${id}`);
      this.project = {
        id: pr.id,
        name: pr.name,
        pages: pr.data.pages || { index: { html: '' } },
        config: pr.data.config || { bgColor: '#ffffff', grid: 20, bgImage: '' }
      };
      if (this.project.config.bgImage === undefined) this.project.config.bgImage = '';
      this.pages = Object.keys(this.project.pages);
      this.updateSelect();
      this.switchPage(this.pages[0]);
      this.applyConfig();
      this.startAutosave();
      } catch { alert('Нет проекта'); }
  }

  async saveProject() {
    if (!this.project.name) {
      this.project.name = prompt('Название проекта', 'Сайт') || 'Site';
    }
    this.project.pages[this.current].html = this.canvas.innerHTML;
    if (!this.project.id) {
      const res = await api('POST', '/projects/', {
        name: this.project.name,
        data: { pages: this.project.pages, config: this.project.config },
      });
      this.project.id = res.id;
    } else {
      await api('PUT', `/projects/${this.project.id}`, {
        name: this.project.name,
        data: { pages: this.project.pages, config: this.project.config },
      });
    }
    localStorage.removeItem(AUTO_SAVE_KEY);
    this.stopAutosave();
    this.startAutosave();
    alert('Сохранено');
  }

  async exportProject() {
    if (!this.project.id) { alert('Нет проекта'); return; }
    try {
      const blob = await (await fetch(`/projects/${this.project.id}/export`)).blob();
      const u = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: u, download: 'site.zip' }).click();
      URL.revokeObjectURL(u);
    } catch { alert('Ошибка экспорта'); }
  }

  async importProject() {
    const file = this.fileImport?.files?.[0];
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const data = JSON.parse(await file.text());
        this.project = data.project || data;
      } else if (file.name.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const pages = {};
        for (const name of Object.keys(zip.files)) {
          if (name.toLowerCase().endsWith('.html')) {
            const html = await zip.files[name].async('text');
            pages[name.replace(/\.html$/i, '')] = { html };
          }
        }
        this.project = { id: null, name: file.name.replace(/\.zip$/i, ''), pages, config: { bgColor: '#fafafa', grid: 20, bgImage: '' } };
      } else {
        alert('Неизвестный формат');
        return;
      }
      if (!this.project.config) this.project.config = { bgColor: '#fafafa', grid: 20, bgImage: '' };
      this.pages = Object.keys(this.project.pages);
      this.updateSelect();
      this.switchPage(this.pages[0]);
      this.applyConfig();
      this.setupDraggables();
    } catch {
      alert('Ошибка импорта');
    } finally {
      this.fileImport.value = '';
      this.startAutosave();
    }
  }

  addPage() {
    const id = prompt('Имя новой страницы (без .html):', 'about');
    if (!id || this.project.pages[id]) { alert('Уже есть'); return; }
    this.project.pages[id] = { html: '' };
    this.pages.push(id);
    const o = document.createElement('option');
    o.value = id;
    o.textContent = id;
    this.pageSelect.appendChild(o);
    this.switchPage(id);
  }

  deletePage() {
    if (this.pages.length <= 1) { alert('Последняя страница'); return; }
    const id = this.pageSelect.value;
    if (!confirm(`Удалить ${id}?`)) return;
    delete this.project.pages[id];
    const idx = this.pages.indexOf(id);
    if (idx >= 0) {
      this.pages.splice(idx, 1);
      this.pageSelect.remove(idx);
    }
    const next = this.pages[idx] || this.pages[idx - 1];
    this.switchPage(next);
  }

  switchPage(id) {
    if (this.current) {
      this.project.pages[this.current].html = this.canvas.innerHTML;
    }
    this.current = id;
    this.pageSelect.value = id;
    for (const opt of this.pageSelect.options) {
      if (opt.value === id) opt.classList.add('active');
      else opt.classList.remove('active');
    }
    this.canvas.innerHTML = this.project.pages[id].html;
    this.layerId = 0;
    for (const el of this.canvas.querySelectorAll('.draggable')) {
      const lid = parseInt(el.dataset.layerId);
      if (lid) {
        this.layerId = Math.max(this.layerId, lid);
      } else {
        el.dataset.layerId = ++this.layerId;
      }
    }
    this.setupDraggables();
    this.updateLayers();
    this.saveState();
    this.drawGrid();
  }

  applyConfig() {
    if (!this.project.config) {
      this.project.config = { bgColor: '#ffffff', grid: 20, bgImage: '' };
    }
    if (this.canvas) {
      this.canvas.style.background = this.project.config.bgColor || '#ffffff';
      const step = this.project.config.grid || 20;        // 20-px по умолчанию
      this.canvas.style.setProperty('--grid-step', step + 'px');
      if (this.project.config.bgImage) {
        this.canvas.style.backgroundImage = `url('${this.project.config.bgImage}')`;
      } else {
        this.canvas.style.backgroundImage = '';
      }
      this.drawGrid();
    }
  }

  applyTheme(theme) {
    this.theme = theme;
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    root.classList.add('theme-' + theme);
    if (this.btnTheme) this.btnTheme.textContent = theme === 'dark' ? '☀' : '🌙';
    localStorage.setItem('theme', theme);
  }

  toggleTheme() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  }

 /* ───────────────────────── drawGrid ───────────────────────── */
  drawGrid() {
    if (!this.gridCanvas || !this.canvas) return;

    const step = parseInt(this.project.config.grid) || 0;
    const { width: w, height: h } = this.canvas.getBoundingClientRect();
    if (!w || !h) return;             // прорисуем, когда размеры будут ненулевые


    /* 1. Синхронизируем реальные и CSS-размеры <canvas>,
          иначе браузер будет масштабировать изображение,
          и сетка займёт лишь часть холста. */
    this.gridCanvas.width  = w;
    this.gridCanvas.height = h;
    this.gridCanvas.style.width  = w + 'px';
    this.gridCanvas.style.height = h + 'px';

    const ctx = this.gridCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    /* 2. При скрытой сетке просто прячем canvas */
    if (!this.gridVisible || step <= 0) {
      this.gridCanvas.style.display = 'none';
      return;
    }
    this.gridCanvas.style.display = '';

    /* 3. Отрисовываем сетку во всю площадь холста */
    ctx.strokeStyle = getComputedStyle(this.gridCanvas)
                        .getPropertyValue('--grid-color').trim();
    ctx.lineWidth   = 1;

    for (let x = 0.5; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0.5; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
  toggleGrid() {
    this.gridVisible = !this.gridVisible;

    if (this.gridVisible) {
      this.canvas.classList.add('show-grid');
    } else {
      this.canvas.classList.remove('show-grid');
    }

    /* визуальное состояние кнопки */
    if (this.btnGrid)
        this.btnGrid.classList.toggle('active', this.gridVisible);
  }


  async toggleConfig() {
    if (this.configPanel.classList.contains('open')) {
      this.project.name = this.cfgName.value;
      this.project.config.bgColor = this.cfgBg.value;
      this.project.config.bgImage = this.cfgBgImage.value.trim();
      this.project.config.grid = parseInt(this.cfgGrid.value) || 0;
      this.applyConfig();
      this.configPanel.classList.remove('open');
      await this.saveProject();
    } else {
      this.cfgName.value = this.project.name;
      this.cfgBg.value = this.project.config.bgColor;
      this.cfgBgImage.value = this.project.config.bgImage || '';
      this.cfgGrid.value = this.project.config.grid;
      this.configPanel.classList.add('open');
    }
  }

  moveLayer(delta) {
    if (!this.selected) return;
    const z = parseInt(this.selected.style.zIndex || '0') + delta;
    this.selected.style.zIndex = z;
    this.updateLayers();
    this.saveState();
  }

  toggleLayer() {
    if (!this.selected) return;
    this.selected.hidden = !this.selected.hidden;
    const icon = this.layerToggle.querySelector('i');
    if (icon) icon.className = this.selected.hidden ? 'fa fa-eye-slash' : 'fa fa-eye';
    this.updateLayers();
    this.saveState();
  }


  saveState() {
    if (!this.canvas) return;
    this.undoStack.push(this.canvas.innerHTML);
    this.redoStack.length = 0;
    this.autosave();
  }

  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this.canvas.innerHTML);
    const state = this.undoStack.pop();
    this.canvas.innerHTML = state;
    this.layerId = 0;
    for (const el of this.canvas.querySelectorAll('.draggable')) {
      const lid = parseInt(el.dataset.layerId);
      if (lid) {
        this.layerId = Math.max(this.layerId, lid);
      } else {
        el.dataset.layerId = ++this.layerId;
      }
    }
    this.setupDraggables();
    this.selectElement(null);
    this.updateLayers();
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this.canvas.innerHTML);
    const state = this.redoStack.pop();
    this.canvas.innerHTML = state;
    this.layerId = 0;
    for (const el of this.canvas.querySelectorAll('.draggable')) {
      const lid = parseInt(el.dataset.layerId);
      if (lid) {
        this.layerId = Math.max(this.layerId, lid);
      } else {
        el.dataset.layerId = ++this.layerId;
      }
    }
    this.setupDraggables();
    this.selectElement(null);
    this.updateLayers();
  }

  copyElement() {
    if (this.selected) {
      this.clipboard = this.selected;
    }
  }

  pasteElement() {
    if (!this.clipboard || !this.canvas) return;
    const cs = getComputedStyle(this.clipboard);
    const dx = 20, dy = 20;
    const clone = this.clipboard.cloneNode(true);
    clone.classList.remove('selected');
    clone.dataset.layerId = ++this.layerId;
    clone.style.right = '';
    clone.style.bottom = '';
    delete clone.dataset.anchorRight;
    delete clone.dataset.anchorBottom;
    const left = parseFloat(cs.left) || 0;
    const top = parseFloat(cs.top) || 0;
    clone.style.left = (left + dx) + 'px';
    clone.style.top  = (top + dy) + 'px';
    this.canvas.appendChild(clone);
    window.addResizeHandles(clone);
    this.selectElement(clone);
    this.updateLayers();
    this.saveState();
  }

  autosave() {
    if (!this.canvas) return;
    this.project.pages[this.current].html = this.canvas.innerHTML;
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
      project: this.project,
      current: this.current,
    }));
  }

  startAutosave() {
    clearInterval(this.autosaveTimer);
    this.autosaveTimer = setInterval(() => this.autosave(), AUTO_SAVE_INTERVAL);
  }

  stopAutosave() {
    clearInterval(this.autosaveTimer);
  }

  togglePreview() {
    if (this.previewMode) {
      document.querySelectorAll('.toolbar').forEach(el => {
        if (el.dataset.wasOpen === '1') el.classList.add('open');
        el.dataset.wasOpen = '';
      });
      if (this.configPanel) {
        if (this.configPanel.dataset.wasOpen === '1') this.configPanel.classList.add('open');
        this.configPanel.dataset.wasOpen = '';
      }
      if (this.gridOverlay) {
        const prev = this.gridOverlay.dataset.prevDisplay;
        this.gridOverlay.style.display = prev || '';
        this.gridOverlay.dataset.prevDisplay = '';
      }
      if (this.previewWindow && !this.previewWindow.closed) this.previewWindow.close();
      this.previewWindow = null;
      this.previewMode = false;
      return;
    }

    document.querySelectorAll('.toolbar').forEach(el => {
      el.dataset.wasOpen = el.classList.contains('open') ? '1' : '0';
      el.classList.remove('open');
    });
    if (this.configPanel) {
      this.configPanel.dataset.wasOpen = this.configPanel.classList.contains('open') ? '1' : '0';
      this.configPanel.classList.remove('open');
    }
    if (this.gridOverlay) {
      this.gridOverlay.dataset.prevDisplay = this.gridOverlay.style.display;
      this.gridOverlay.style.display = 'none';
    }

    const html = this.buildPreviewHTML();
    this.previewWindow = window.open('', '', 'width=800,height=600,resizable=yes,scrollbars=yes');
    if (this.previewWindow) {
      this.previewWindow.document.write(html);
      this.previewWindow.document.close();
      this.previewWindow.onbeforeunload = () => {
        this.previewWindow = null;
        if (this.previewMode) this.togglePreview();
      };
    }
    this.previewMode = true;
  }

  buildPreviewHTML() {
    if (!this.canvas) return '';
    const clone = this.canvas.cloneNode(true);
    clone.querySelector('#gridOverlay')?.remove();
    clone.querySelector('#groupSelectBox')?.remove();
    clone.querySelectorAll('.resize-handle').forEach(e => e.remove());
    clone.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
    const cls = document.documentElement.className;
    return `<!DOCTYPE html><html lang="ru" class="${cls}"><head><meta charset="UTF-8"><link rel="stylesheet" href="style.css"></head><body>${clone.innerHTML}</body></html>`;
  }

  selectElement(el, append = false) {
    if (!append) {
      for (const it of this.selectedItems) it.classList.remove('selected');
      this.selectedItems = [];
    }
    if (el && append && this.selectedItems.includes(el)) {
      el.classList.remove('selected');
      this.selectedItems = this.selectedItems.filter(i => i !== el);
    } else if (el) {
      el.classList.add('selected');
      this.selectedItems.push(el);
    }

    this.selected = this.selectedItems[0] || null;
    this.updateGroupBox();

    if (!this.selected) {
      bar?.classList.remove('open');
      if (this.propW) this.propW.value = '';
      if (this.propH) this.propH.value = '';
      if (this.propFont) this.propFont.value = '';
      if (this.propColor) this.propColor.value = '#000000';
      if (this.propAlign) this.propAlign.value = 'left';
      if (this.propFamily) this.propFamily.value = '';
      if (this.propBold) this.propBold.checked = false;
      if (this.propItalic) this.propItalic.checked = false;
      if (this.propBg) this.propBg.value = '#ffffff';
      if (this.propBorderWidth) this.propBorderWidth.value = '';
      if (this.propBorderColor) this.propBorderColor.value = '#000000';
      if (this.propRadius) this.propRadius.value = '';
      if (this.propShadow) this.propShadow.checked = false;
      if (this.propSrc) this.propSrc.value = '';
      if (this.propAlt) this.propAlt.value = '';
      if (this.propSrcRow) this.propSrcRow.style.display = 'none';
      if (this.propAltRow) this.propAltRow.style.display = 'none';
      if (this.propHref) this.propHref.value = '';
      if (this.propTarget) this.propTarget.checked = false;
      if (this.propHrefRow) this.propHrefRow.style.display = 'none';
      if (this.propTargetRow) this.propTargetRow.style.display = 'none';
      this.updateLayers();
      this.updateGroupBox();
      return;
    }
    const se = this.selected;
    se.classList.add('selected');
    const r = se.getBoundingClientRect();
    if (bar) {
      let left = r.right + 5;
      if (left + bar.offsetWidth > window.innerWidth) {
        left = r.left - bar.offsetWidth - 5;
      }
      let top = r.top;
      if (top < 0) top = 0;

      if (top + bar.offsetHeight > window.innerHeight) {
        top = window.innerHeight - bar.offsetHeight;
        if (top < 0) top = 0;
      }

      bar.style.left = left + 'px';
      bar.style.top  = top + 'px';
      bar.style.right = 'auto';
      bar.classList.add('open');
    }
    if (pick) {
      const rgb = getComputedStyle(el).color;
      const nums = rgb.match(/\d+/g);
      let hex = '#000000';
      if (nums) {
        hex = '#' + nums.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join('');
      }
      pick.value = se.dataset.color || hex;
    }
    const right = document.getElementById('anchorRight');
    const bottom = document.getElementById('anchorBottom');
    if (right) right.checked = se.dataset.anchorRight === '1';
    if (bottom) bottom.checked = se.dataset.anchorBottom === '1';

    const cs = getComputedStyle(se);
    if (this.propW) this.propW.value = parseInt(se.dataset.w || cs.width);
    if (this.propH) this.propH.value = parseInt(se.dataset.h || cs.height);
    if (this.propFont) this.propFont.value = parseInt(se.dataset.fs || cs.fontSize);
    if (this.propColor) {
      let colHex = '#000000';
      const c = se.dataset.color || cs.color;
      const nums = (c || '').match(/\d+/g);
      if (nums) colHex = '#' + nums.slice(0,3).map(x => (+x).toString(16).padStart(2,'0')).join('');
      this.propColor.value = colHex;
    }
    if (this.propAlign) this.propAlign.value = se.dataset.textAlign || cs.textAlign;
    if (this.propFamily) this.propFamily.value = se.dataset.fontFamily || cs.fontFamily.replace(/"/g, '');
    if (this.propBold) this.propBold.checked = (se.dataset.fontWeight || cs.fontWeight) === 'bold' || parseInt(se.dataset.fontWeight || cs.fontWeight) >= 700;
    if (this.propItalic) this.propItalic.checked = (se.dataset.fontStyle || cs.fontStyle) === 'italic';
    if (this.propBg) {
      let bgHex = '#ffffff';
      const bg = se.dataset.bg || cs.backgroundColor;
      const nums = (bg || '').match(/\d+/g);
      if (nums) {
        bgHex = '#' + nums.slice(0,3).map(x => (+x).toString(16).padStart(2,'0')).join('');
      }
      this.propBg.value = bgHex;
    }
    if (this.propBorderWidth) this.propBorderWidth.value = parseInt(se.dataset.borderWidth || cs.borderWidth);
    if (this.propBorderColor) {
      let bcHex = '#000000';
      const bc = se.dataset.borderColor || cs.borderColor;
      const nums = (bc || '').match(/\d+/g);
      if (nums) bcHex = '#' + nums.slice(0,3).map(x => (+x).toString(16).padStart(2,'0')).join('');
      this.propBorderColor.value = bcHex;
    }
    if (this.propRadius) this.propRadius.value = parseInt(se.dataset.radius || cs.borderRadius);
    if (this.propShadow) this.propShadow.checked = (se.dataset.shadow || cs.boxShadow) !== 'none';
    if (se.classList.contains('block-image')) {
      const img = se.querySelector('img');
      if (this.propSrcRow) this.propSrcRow.style.display = '';
      if (this.propAltRow) this.propAltRow.style.display = '';
      if (this.propSrc) this.propSrc.value = se.dataset.src || img?.src || '';
      if (this.propAlt) this.propAlt.value = se.dataset.alt || img?.alt || '';
    } else {
      if (this.propSrcRow) this.propSrcRow.style.display = 'none';
      if (this.propAltRow) this.propAltRow.style.display = 'none';
      if (this.propSrc) this.propSrc.value = '';
      if (this.propAlt) this.propAlt.value = '';
    }
    if (se.classList.contains('block-button') || se.tagName.toLowerCase() === 'a') {
      if (this.propHrefRow) this.propHrefRow.style.display = '';
      if (this.propTargetRow) this.propTargetRow.style.display = '';
      if (this.propHref) this.propHref.value = se.dataset.href || se.getAttribute('href') || '';
      if (this.propTarget) this.propTarget.checked = (se.dataset.target || se.getAttribute('target')) === '_blank';
    } else {
      if (this.propHrefRow) this.propHrefRow.style.display = 'none';
      if (this.propTargetRow) this.propTargetRow.style.display = 'none';
      if (this.propHref) this.propHref.value = '';
      if (this.propTarget) this.propTarget.checked = false;
    }
    this.updateLayers();
    this.updateGroupBox();
  }
}

const builder = new Builder();
window.builder = builder;
builder.init();
export { builder };
