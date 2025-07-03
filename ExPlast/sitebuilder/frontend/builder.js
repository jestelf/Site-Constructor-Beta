// Простые обработчики перетаскивания элементов
let dragItem = null, dx = 0, dy = 0, moved = false;
let resizeItem = null, resizeDir = '', rx = 0, ry = 0, rw = 0, rh = 0, rl = 0, rt = 0;
let selectedItem = null;
const anchorRight = document.getElementById('anchorRight');
const anchorBottom = document.getElementById('anchorBottom');

document.addEventListener('mousedown', e => {
  const handle = e.target.closest('.resize-handle');
  if (handle) {
    resizeItem = handle.parentElement;
    resizeItem.classList.add('resizing');
    resizeDir = handle.dataset.dir || '';
    const p = resizeItem.parentElement.getBoundingClientRect();
    const r = resizeItem.getBoundingClientRect();
    rx = e.clientX;
    ry = e.clientY;
    rw = r.width; rh = r.height;
    rl = r.left - p.left; rt = r.top - p.top;
    e.preventDefault();
    return;
  }
  const el = e.target.closest('.draggable');
  if (!el) return;
  const r = el.getBoundingClientRect();
  dx = e.clientX - r.left;
  dy = e.clientY - r.top;
  dragItem = el;
  dragItem.classList.add('dragging');
  moved = false;
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (resizeItem) {
    const p = resizeItem.parentElement.getBoundingClientRect();
    let dx = e.clientX - rx;
    let dy = e.clientY - ry;
    let w = rw, h = rh, l = rl, t = rt;
    if (resizeDir.includes('e')) w = rw + dx;
    if (resizeDir.includes('s')) h = rh + dy;
    if (resizeDir.includes('w')) { w = rw - dx; l = rl + dx; }
    if (resizeDir.includes('n')) { h = rh - dy; t = rt + dy; }
    w = Math.max(20, w); h = Math.max(20, h);
    if (resizeItem.dataset.anchorRight) {
      resizeItem.style.right = ((p.width - l - w) / p.width * 100) + '%';
      resizeItem.style.left = '';
    } else {
      resizeItem.style.left = (l / p.width * 100) + '%';
    }
    if (resizeItem.dataset.anchorBottom) {
      resizeItem.style.bottom = ((p.height - t - h) / p.height * 100) + '%';
      resizeItem.style.top = '';
    } else {
      resizeItem.style.top = (t / p.height * 100) + '%';
    }
    resizeItem.style.width = w + 'px';
    resizeItem.style.height = h + 'px';
    resizeItem.dataset.w = w;
    resizeItem.dataset.h = h;
    return;
  }

  if (!dragItem) return;
  moved = true;
  const p = dragItem.parentElement.getBoundingClientRect();
  let l = e.clientX - p.left - dx;
  let t = e.clientY - p.top - dy;
  l = Math.max(0, Math.min(l, p.width - dragItem.offsetWidth));
  t = Math.max(0, Math.min(t, p.height - dragItem.offsetHeight));
  if (dragItem.dataset.anchorRight) {
    dragItem.style.right = ((p.width - l - dragItem.offsetWidth) / p.width * 100) + '%';
  } else {
    dragItem.style.left = (l / p.width * 100) + '%';
  }
  if (dragItem.dataset.anchorBottom) {
    dragItem.style.bottom = ((p.height - t - dragItem.offsetHeight) / p.height * 100) + '%';
  } else {
    dragItem.style.top  = (t / p.height * 100) + '%';
  }
});

document.addEventListener('mouseup', () => {
  if (resizeItem) {
    resizeItem.classList.remove('resizing');
    builder.saveState();
    resizeItem = null;
    return;
  }
  if (dragItem && moved) builder.saveState();
  if (dragItem) dragItem.classList.remove('dragging');
  dragItem = null;
});

// Создание блоков
function addBlock(type) {
  let html = '';
  switch (type) {
    case 'text':
      html = '<div class="draggable block-text" contenteditable="true" style="left:20px;top:20px;">Текст</div>';
      break;
    case 'image':
      html = '<div class="block-image draggable" style="left:20px;top:20px;"><img src="https://via.placeholder.com/150"></div>';
      break;
    case 'header':
      html = '<h1 class="draggable block-text" contenteditable="true" style="left:20px;top:20px;">Заголовок</h1>';
      break;
    case 'button':
      html = '<a class="draggable block-button" href="#" style="left:20px;top:20px;">Кнопка</a>';
      break;
  }
  if (html && builder.canvas) {
    builder.canvas.insertAdjacentHTML('beforeend', html);
    const el = builder.canvas.lastElementChild;
    el.dataset.layerId = ++builder.layerId;
    addResizeHandles(el);
    builder.updateLayers();
    builder.saveState();
  }
}
window.addBlock = addBlock;

function addResizeHandles(el) {
  if (!el) return;
  if (el.querySelector('.resize-handle')) return;
  for (const dir of ['nw','ne','sw','se']) {
    const d = document.createElement('div');
    d.className = 'resize-handle';
    d.dataset.dir = dir;
    el.appendChild(d);
  }
}

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

// Мини-панель форматирования
const bar = document.getElementById('inlineToolbar');
const pick = document.getElementById('colorPick');

if (pick) {
  pick.oninput = e => document.execCommand('foreColor', false, e.target.value);
}

bar?.addEventListener('mousedown', e => e.stopPropagation());

document.addEventListener('click', e => {
  if (!builder.canvas || bar.contains(e.target)) return;
  const el = e.target.closest('.draggable');
  if (el && builder.canvas.contains(el)) {
    selectedItem = el;
    bar.classList.add('open');
    if (anchorRight) anchorRight.checked = !!el.dataset.anchorRight;
    if (anchorBottom) anchorBottom.checked = !!el.dataset.anchorBottom;
  } else {
    selectedItem = null;
    bar.classList.remove('open');
  }
});

function toggleAnchor(type) {
  if (!selectedItem) return;
  const p = selectedItem.parentElement.getBoundingClientRect();
  const r = selectedItem.getBoundingClientRect();
  if (type === 'Right') {
    if (anchorRight.checked) {
      selectedItem.style.right = ((p.right - r.right) / p.width * 100) + '%';
      selectedItem.style.left = '';
      selectedItem.dataset.anchorRight = '1';
    } else {
      selectedItem.style.left = ((r.left - p.left) / p.width * 100) + '%';
      selectedItem.style.right = '';
      delete selectedItem.dataset.anchorRight;
    }
  } else {
    if (anchorBottom.checked) {
      selectedItem.style.bottom = ((p.bottom - r.bottom) / p.height * 100) + '%';
      selectedItem.style.top = '';
      selectedItem.dataset.anchorBottom = '1';
    } else {
      selectedItem.style.top = ((r.top - p.top) / p.height * 100) + '%';
      selectedItem.style.bottom = '';
      delete selectedItem.dataset.anchorBottom;
    }
  }
  builder.saveState();
}

anchorRight?.addEventListener('change', () => toggleAnchor('Right'));
anchorBottom?.addEventListener('change', () => toggleAnchor('Bottom'));

class Builder {
  constructor() {
    this.project = {
      id: null,
      name: '',
      pages: { index: { html: '' } },
      config: { bgColor: '#fafafa', grid: 20, bgImage: '' }
    };
    this.pages = ['index'];
    this.current = 'index';
    this.selected = null;
    this.layerId = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.clipboard = null;
    this.theme = 'light';
  }

  setupDraggables() {
    if (!this.canvas) return;
    for (const el of this.canvas.querySelectorAll('.draggable')) {
      addResizeHandles(el);
    }
  }

  init() {
    this.canvas      = document.getElementById('canvas');
    this.btnCreate   = document.getElementById('btnCreate');
    this.btnLoad     = document.getElementById('btnLoad');
    this.btnSave     = document.getElementById('btnSave');
    this.btnExport   = document.getElementById('btnExport');
    this.btnConfig   = document.getElementById('btnConfig');
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
    this.gridOverlay = document.getElementById('gridOverlay');
    this.propW       = document.getElementById('propWidth');
    this.propH       = document.getElementById('propHeight');
    this.propFont    = document.getElementById('propFont');
    this.propBg      = document.getElementById('propBg');
    this.btnTheme    = document.getElementById('btnTheme');

    this.theme = localStorage.getItem('theme') || 'light';
    this.applyTheme(this.theme);

    if (this.propW)   this.propW.oninput   = () => this.changeProps();
    if (this.propH)   this.propH.oninput   = () => this.changeProps();
    if (this.propFont) this.propFont.oninput = () => this.changeProps();
    if (this.propBg)  this.propBg.oninput  = () => this.changeProps();
    if (this.cfgGrid) this.cfgGrid.oninput = () => {
      this.project.config.grid = parseInt(this.cfgGrid.value) || 0;
      this.applyConfig();
    };

    this.btnCreate.onclick  = () => this.createProject();
    this.btnLoad.onclick    = () => this.loadProject();
    this.btnSave.onclick    = () => this.saveProject();
    this.btnExport.onclick  = () => this.exportProject();
    this.btnConfig.onclick  = () => this.toggleConfig();
    if (this.btnTheme) this.btnTheme.onclick = () => this.toggleTheme();
    this.pageSelect.onchange = () => this.switchPage(this.pageSelect.value);
    this.pageAdd.onclick    = () => this.addPage();
    this.pageDel.onclick    = () => this.deletePage();
    this.layerUp.onclick    = () => this.moveLayer(1);
    this.layerDown.onclick  = () => this.moveLayer(-1);
    this.layerToggle.onclick= () => this.toggleLayer();

    this.canvas.addEventListener('click', e => {
      const el = e.target.closest('.draggable');
      if (el) {
        this.selectElement(el);
      } else {
        this.selectElement(null);
      }
    });

    this.updateSelect();
    this.switchPage('index');
    this.setupDraggables();
    this.applyConfig();
    this.saveState();

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
      } else if (e.key === 'Delete' && this.selected) {
        this.selected.remove();
        this.selected = null;
        if (bar) bar.classList.remove('open');
        this.updateLayers();
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
      if (el === this.selected) li.classList.add('selected');
      li.onclick = () => { this.selectElement(el); this.updateLayers(); };
      this.layersList.appendChild(li);
    }
  }

  async createProject() {
    const name = prompt('Название проекта', 'Сайт');
    if (!name) return;
    this.project = {
      id: null,
      name,
      pages: { index: { html: '' } },
      config: { bgColor: '#fafafa', grid: 20, bgImage: '' }
    };
    this.pages = ['index'];
    this.updateSelect();
    this.switchPage('index');
    this.setupDraggables();
    this.applyConfig();
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
        config: pr.data.config || { bgColor: '#fafafa', grid: 20, bgImage: '' }
      };
      if (this.project.config.bgImage === undefined) this.project.config.bgImage = '';
      this.pages = Object.keys(this.project.pages);
      this.updateSelect();
      this.switchPage(this.pages[0]);
      this.applyConfig();
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
  }

  applyConfig() {
    if (!this.project.config) {
      this.project.config = { bgColor: '#fafafa', grid: 20, bgImage: '' };
    }
    if (this.canvas) {
      this.canvas.style.background = this.project.config.bgColor || '#fafafa';
      if (this.project.config.bgImage) {
        this.canvas.style.backgroundImage = `url('${this.project.config.bgImage}')`;
      } else {
        this.canvas.style.backgroundImage = '';
      }
      if (this.gridOverlay) {
        const step = parseInt(this.project.config.grid) || 0;
        if (step > 0) {
          this.gridOverlay.style.backgroundSize = `${step}px ${step}px`;
          this.gridOverlay.style.display = '';
        } else {
          this.gridOverlay.style.display = 'none';
        }
      }
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

  changeProps() {
    if (!this.selected) return;
    if (this.propW) {
      const w = parseInt(this.propW.value) || 0;
      if (w) {
        this.selected.style.width = w + 'px';
        this.selected.dataset.w = w;
      }
    }
    if (this.propH) {
      const h = parseInt(this.propH.value) || 0;
      if (h) {
        this.selected.style.height = h + 'px';
        this.selected.dataset.h = h;
      }
    }
    if (this.propFont) {
      const fs = parseInt(this.propFont.value) || 0;
      if (fs) {
        this.selected.style.fontSize = fs + 'px';
        this.selected.dataset.fs = fs;
      }
    }
    if (this.propBg) {
      const bg = this.propBg.value;
      this.selected.style.backgroundColor = bg;
      this.selected.dataset.bg = bg;
    }
    this.saveState();
  }

  saveState() {
    if (!this.canvas) return;
    this.undoStack.push(this.canvas.innerHTML);
    this.redoStack.length = 0;
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
    addResizeHandles(clone);
    this.selectElement(clone);
    this.updateLayers();
    this.saveState();
  }

  selectElement(el) {
    if (this.selected) this.selected.classList.remove('selected');
    this.selected = el;
    if (!el) {
      bar?.classList.remove('open');
      if (this.propW) this.propW.value = '';
      if (this.propH) this.propH.value = '';
      if (this.propFont) this.propFont.value = '';
      if (this.propBg) this.propBg.value = '#ffffff';
      this.updateLayers();
      return;
    }
    el.classList.add('selected');
    const r = el.getBoundingClientRect();
    if (bar) {
      let left = r.right + 5;
      if (left + bar.offsetWidth > window.innerWidth) {
        left = r.left - bar.offsetWidth - 5;
      }
      let top = r.top;
      if (top < 0) top = 0;
      bar.style.left = left + 'px';
      bar.style.top  = top + 'px';
      bar.classList.add('open');
    }
    if (pick) {
      const rgb = getComputedStyle(el).color;
      const nums = rgb.match(/\d+/g);
      let hex = '#000000';
      if (nums) {
        hex = '#' + nums.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join('');
      }
      pick.value = el.dataset.color || hex;
    }
    const right = document.getElementById('anchorRight');
    const bottom = document.getElementById('anchorBottom');
    if (right) right.checked = el.dataset.anchorRight === '1';
    if (bottom) bottom.checked = el.dataset.anchorBottom === '1';

    const cs = getComputedStyle(el);
    if (this.propW) this.propW.value = parseInt(el.dataset.w || cs.width);
    if (this.propH) this.propH.value = parseInt(el.dataset.h || cs.height);
    if (this.propFont) this.propFont.value = parseInt(el.dataset.fs || cs.fontSize);
    if (this.propBg) {
      let bgHex = '#ffffff';
      const bg = el.dataset.bg || cs.backgroundColor;
      const nums = (bg || '').match(/\d+/g);
      if (nums) {
        bgHex = '#' + nums.slice(0,3).map(x => (+x).toString(16).padStart(2,'0')).join('');
      }
      this.propBg.value = bgHex;
    }
    this.updateLayers();
  }
}

const builder = new Builder();
window.builder = builder;
