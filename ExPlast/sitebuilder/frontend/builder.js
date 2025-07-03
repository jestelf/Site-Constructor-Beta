// Простые обработчики перетаскивания элементов
let dragItem = null, dx = 0, dy = 0, moved = false;

let dragItems = [], dragOffsets = [];

let dragBlockType = null;
let resizeItem = null, resizeDir = '', rx = 0, ry = 0, rw = 0, rh = 0, rl = 0, rt = 0;
let selectedItem = null;
const anchorRight = document.getElementById('anchorRight');
const anchorBottom = document.getElementById('anchorBottom');
const AUTO_SAVE_KEY = 'builderAutosave';
const AUTO_SAVE_INTERVAL = 10000;

const LANG_KEY = 'uiLang';
const i18n = {
  ru: {
    create:'Создать', load:'Загрузить', import:'Импорт', save:'Сохранить',
    export:'Экспорт', settings:'Настройки', preview:'Предпросмотр', grid:'Сетка',
    themeTip:'Сменить тему', helpTip:'Ctrl+Z — отмена, Ctrl+Y — повтор, Ctrl+C — копировать, Ctrl+V — вставить, Ctrl+A — выделить все, Ctrl+D — дублировать, Ctrl+S — сохранить, Delete — удалить',
    newPageTitle:'Новая страница', deletePageTitle:'Удалить страницу', blocks:'Блоки',
    blockText:'Текст', blockImage:'Картинка', blockHeader:'Заголовок', blockButton:'Кнопка',
    layers:'Слои', layerUpTitle:'Вверх', layerDownTitle:'Вниз', layerToggleTitle:'Показать/скрыть',
    inlineColorTitle:'Цвет текста', anchorRightTitle:'К правому краю', anchorBottomTitle:'К нижнему краю',
    props:'Свойства', saved:'Сохранено', noProject:'Нет проекта', exportError:'Ошибка экспорта',
    unknownFormat:'Неизвестный формат', importError:'Ошибка импорта', alreadyExists:'Уже есть',
    lastPage:'Последняя страница', restoreConfirm:'Обнаружена сохранённая копия. Восстановить?',
    projectNamePrompt:'Название проекта', projectDefaultName:'Сайт', projectIdPrompt:'ID проекта',
    newPagePrompt:'Имя новой страницы (без .html):',
    deleteConfirm:'Удалить',
    cfgNameLabel:'Название:', cfgBgLabel:'Цвет фона:', cfgBgImageLabel:'Фоновое изображение:', cfgGridLabel:'Шаг сетки:',
    widthLabel:'Ширина:', heightLabel:'Высота:', fontSizeLabel:'Размер шрифта:', textColorLabel:'Цвет текста:',
    alignLabel:'Выравнивание:', familyLabel:'Семейство шрифта:', styleLabel:'Начертание:', fontBoldTitle:'Жирный', fontItalicTitle:'Курсив',
    fillColorLabel:'Цвет заливки:', borderWidthLabel:'Толщина рамки:', borderColorLabel:'Цвет рамки:', radiusLabel:'Радиус:',
    shadowLabel:'Тень:', imgUrlLabel:'URL изображения:', altTextLabel:'Alt текст:', linkLabel:'Ссылка:', openNewTabLabel:'Открывать в новой вкладке',
    alignLeft:'Слева', alignCenter:'Центр', alignRight:'Справа', alignJustify:'По ширине', familyDefault:'По умолчанию'
  },
  en: {
    create:'Create', load:'Load', import:'Import', save:'Save',
    export:'Export', settings:'Settings', preview:'Preview', grid:'Grid',
    themeTip:'Toggle theme', helpTip:'Ctrl+Z — undo, Ctrl+Y — redo, Ctrl+C — copy, Ctrl+V — paste, Ctrl+A — select all, Ctrl+D — duplicate, Ctrl+S — save, Delete — remove',
    newPageTitle:'New page', deletePageTitle:'Delete page', blocks:'Blocks',
    blockText:'Text', blockImage:'Image', blockHeader:'Header', blockButton:'Button',
    layers:'Layers', layerUpTitle:'Up', layerDownTitle:'Down', layerToggleTitle:'Show/hide',
    inlineColorTitle:'Text color', anchorRightTitle:'Anchor right', anchorBottomTitle:'Anchor bottom',
    props:'Properties', saved:'Saved', noProject:'No project', exportError:'Export error',
    unknownFormat:'Unknown format', importError:'Import error', alreadyExists:'Already exists',
    lastPage:'Last page', restoreConfirm:'Found autosave. Restore?',
    projectNamePrompt:'Project name', projectDefaultName:'Site', projectIdPrompt:'Project ID',
    newPagePrompt:'New page name (without .html):',
    deleteConfirm:'Delete',
    cfgNameLabel:'Name:', cfgBgLabel:'Background color:', cfgBgImageLabel:'Background image:', cfgGridLabel:'Grid step:',
    widthLabel:'Width:', heightLabel:'Height:', fontSizeLabel:'Font size:', textColorLabel:'Text color:',
    alignLabel:'Alignment:', familyLabel:'Font family:', styleLabel:'Style:', fontBoldTitle:'Bold', fontItalicTitle:'Italic',
    fillColorLabel:'Fill color:', borderWidthLabel:'Border width:', borderColorLabel:'Border color:', radiusLabel:'Radius:',
    shadowLabel:'Shadow:', imgUrlLabel:'Image URL:', altTextLabel:'Alt text:', linkLabel:'Link:', openNewTabLabel:'Open in new tab',
    alignLeft:'Left', alignCenter:'Center', alignRight:'Right', alignJustify:'Justify', familyDefault:'Default'
  }
};

function t(key){
  const lang = localStorage.getItem(LANG_KEY) || 'ru';
  return (i18n[lang] && i18n[lang][key]) || i18n.ru[key] || key;
}

function applyLang(lang){
  localStorage.setItem(LANG_KEY, lang);
  const dict = i18n[lang] || i18n.ru;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    if(dict[el.dataset.i18n]) el.textContent = dict[el.dataset.i18n];
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{
    if(dict[el.dataset.i18nTitle]) el.title = dict[el.dataset.i18nTitle];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    if(dict[el.dataset.i18nPlaceholder]) el.placeholder = dict[el.dataset.i18nPlaceholder];
  });
}

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
  if (!builder.selectedItems.includes(el)) {
    builder.selectElement(el);
  }
  const items = builder.selectedItems.length ? builder.selectedItems : [el];
  dragItems = items;
  dragOffsets = [];
  for (const it of items) {
    const r = it.getBoundingClientRect();
    dragOffsets.push({ el: it, dx: e.clientX - r.left, dy: e.clientY - r.top });
    it.classList.add('dragging');
  }
  dragItem = el;
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
    const step = builder?.project?.config?.grid || 0;
    if (step > 0) {
      w = Math.round(w / step) * step;
      h = Math.round(h / step) * step;
      l = Math.round(l / step) * step;
      t = Math.round(t / step) * step;
    }
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
    resizeItem.dataset.x = l;
    resizeItem.dataset.y = t;
    builder.checkGuides(resizeItem);
    return;
  }

  if (!dragItem) return;
  moved = true;
  const step = builder?.project?.config?.grid || 0;
  for (let i = 0; i < dragOffsets.length; i++) {
    const info = dragOffsets[i];
    const p = info.el.parentElement.getBoundingClientRect();
    let l = e.clientX - p.left - info.dx;
    let t = e.clientY - p.top - info.dy;
    if (step > 0) {
      l = Math.round(l / step) * step;
      t = Math.round(t / step) * step;
    }
    l = Math.max(0, Math.min(l, p.width - info.el.offsetWidth));
    t = Math.max(0, Math.min(t, p.height - info.el.offsetHeight));
    if (info.el.dataset.anchorRight) {
      info.el.style.right = ((p.width - l - info.el.offsetWidth) / p.width * 100) + '%';
    } else {
      info.el.style.left = (l / p.width * 100) + '%';
    }
    if (info.el.dataset.anchorBottom) {
      info.el.style.bottom = ((p.height - t - info.el.offsetHeight) / p.height * 100) + '%';
    } else {
      info.el.style.top  = (t / p.height * 100) + '%';
    }
    info.el.dataset.x = l;
    info.el.dataset.y = t;
  }
  builder.updateGroupBox();
  builder.checkGuides(dragItem);
});

document.addEventListener('mouseup', () => {
  if (resizeItem) {
    resizeItem.classList.remove('resizing');
    builder.saveState();
    resizeItem = null;
    builder.hideGuides();
    return;
  }
  if (dragItems.length && moved) builder.saveState();
  for (const info of dragOffsets) {
    info.el.classList.remove('dragging');
  }
  dragItem = null;
  dragItems = [];
  dragOffsets = [];
  builder.updateGroupBox();
  builder.hideGuides();
});

// Создание блоков
function addBlock(type, x = 20, y = 20) {
  let html = '';
  switch (type) {
    case 'text':
      html = `<div class="draggable block-text" contenteditable="true">${t('blockText')}</div>`;
      break;
    case 'image':
      html = '<div class="block-image draggable"><img src="https://via.placeholder.com/150"></div>';
      break;
    case 'header':
      html = `<h1 class="draggable block-header" contenteditable="true">${t('blockHeader')}</h1>`;
      break;
    case 'button':
      html = `<a class="draggable block-button" href="#">${t('blockButton')}</a>`;
      break;
  }
  if (html && builder.canvas) {
    builder.canvas.insertAdjacentHTML('beforeend', html);
    const el = builder.canvas.lastElementChild;
    const step = builder.project?.config?.grid || 0;
    if (step > 0) {
      x = Math.round(x / step) * step;
      y = Math.round(y / step) * step;
    }
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.dataset.layerId = ++builder.layerId;
    el.dataset.x = x;
    el.dataset.y = y;
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
  pick.oninput = e => {
    if (builder.selected) {
      builder.selected.style.color = e.target.value;
      builder.selected.dataset.color = e.target.value;
    }
    document.execCommand('foreColor', false, e.target.value);
    builder.saveState();
  };
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
      addResizeHandles(el);
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
    this.langSelect  = document.getElementById('langSelect');
    this.toggleGrid  = document.getElementById('toggleGrid');
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
    if(this.langSelect){
      const lang = localStorage.getItem(LANG_KEY) || 'ru';
      this.langSelect.value = lang;
      applyLang(lang);
      this.langSelect.onchange = () => applyLang(this.langSelect.value);
    }

    let restored = false;
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (confirm(t('restoreConfirm'))) {
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
        addBlock(dragBlockType, x, y);
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
    const name = prompt(t('projectNamePrompt'), t('projectDefaultName'));
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
    const id = parseInt(prompt(t('projectIdPrompt'), this.project.id || '1'));
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
      } catch { alert(t('noProject')); }
      this.startAutosave();
      } catch { alert('Нет проекта'); }
  }

  async saveProject() {
    if (!this.project.name) {
      if (silent) {
        this.project.name = t('projectDefaultName');
      } else {
        this.project.name = prompt(t('projectNamePrompt'), t('projectDefaultName')) || t('projectDefaultName');
      }
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
    alert(t('saved'));
    this.stopAutosave();
    this.startAutosave();
    alert('Сохранено');
  }

  async exportProject() {
    if (!this.project.id) { alert(t('noProject')); return; }
    try {
      const blob = await (await fetch(`/projects/${this.project.id}/export`)).blob();
      const u = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: u, download: 'site.zip' }).click();
      URL.revokeObjectURL(u);
    } catch { alert(t('exportError')); }
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
        alert(t('unknownFormat'));
        return;
      }
      if (!this.project.config) this.project.config = { bgColor: '#fafafa', grid: 20, bgImage: '' };
      this.pages = Object.keys(this.project.pages);
      this.updateSelect();
      this.switchPage(this.pages[0]);
      this.applyConfig();
      this.setupDraggables();
    } catch {
      alert(t('importError'));
    } finally {
      this.fileImport.value = '';
      this.startAutosave();
    }
  }

  addPage() {
    const id = prompt(t('newPagePrompt'), 'about');
    if (!id || this.project.pages[id]) { alert(t('alreadyExists')); return; }
    this.project.pages[id] = { html: '' };
    this.pages.push(id);
    const o = document.createElement('option');
    o.value = id;
    o.textContent = id;
    this.pageSelect.appendChild(o);
    this.switchPage(id);
  }

  deletePage() {
    if (this.pages.length <= 1) { alert(t('lastPage')); return; }
    const id = this.pageSelect.value;
    if (!confirm(`${t('deleteConfirm')} ${id}?`)) return;
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
    if (this.propColor) {
      const c = this.propColor.value;
      this.selected.style.color = c;
      this.selected.dataset.color = c;
    }
    if (this.propAlign) {
      const al = this.propAlign.value;
      this.selected.style.textAlign = al;
      this.selected.dataset.textAlign = al;
    }
    if (this.propFamily) {
      const ff = this.propFamily.value;
      this.selected.style.fontFamily = ff || '';
      this.selected.dataset.fontFamily = ff;
    }
    if (this.propBold) {
      const w = this.propBold.checked ? 'bold' : 'normal';
      this.selected.style.fontWeight = w;
      this.selected.dataset.fontWeight = w;
    }
    if (this.propItalic) {
      const st = this.propItalic.checked ? 'italic' : 'normal';
      this.selected.style.fontStyle = st;
      this.selected.dataset.fontStyle = st;
    }
    if (this.propBg) {
      const bg = this.propBg.value;
      this.selected.style.backgroundColor = bg;
      this.selected.dataset.bg = bg;
    }
    if (this.propBorderWidth) {
      const bw = parseInt(this.propBorderWidth.value) || 0;
      this.selected.style.borderWidth = bw + 'px';
      this.selected.style.borderStyle = bw ? 'solid' : 'none';
      this.selected.dataset.borderWidth = bw;
    }
    if (this.propBorderColor) {
      const bc = this.propBorderColor.value;
      this.selected.style.borderColor = bc;
      if (parseInt(this.propBorderWidth?.value || 0) > 0) this.selected.style.borderStyle = 'solid';
      this.selected.dataset.borderColor = bc;
    }
    if (this.propRadius) {
      const br = parseInt(this.propRadius.value) || 0;
      this.selected.style.borderRadius = br + 'px';
      this.selected.dataset.radius = br;
    }
    if (this.propShadow) {
      const sh = this.propShadow.checked ? 'var(--shadow)' : 'none';
      this.selected.style.boxShadow = sh;
      this.selected.dataset.shadow = sh;
    }
    if (this.selected.classList.contains('block-image')) {
      const img = this.selected.querySelector('img');
      if (img) {
        if (this.propSrc) {
          const src = this.propSrc.value.trim();
          if (src) img.src = src;
          this.selected.dataset.src = src;
        }
        if (this.propAlt) {
          const alt = this.propAlt.value;
          img.alt = alt;
          this.selected.dataset.alt = alt;
        }
      }
    }
    if (this.selected.classList.contains('block-button') || this.selected.tagName.toLowerCase() === 'a') {
      if (this.propHref) {
        const href = this.propHref.value.trim() || '#';
        this.selected.setAttribute('href', href);
        this.selected.dataset.href = href;
      }
      if (this.propTarget) {
        if (this.propTarget.checked) {
          this.selected.setAttribute('target', '_blank');
          this.selected.dataset.target = '_blank';
        } else {
          this.selected.removeAttribute('target');
          delete this.selected.dataset.target;
        }
      }
    }
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
    addResizeHandles(clone);
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
    selectedItem = this.selected;
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
