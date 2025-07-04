import { builder } from './builder.js';

let dragItem = null, dx = 0, dy = 0, moved = false;
let dragItems = [], dragOffsets = [];
let resizeItem = null, resizeDir = '', rx = 0, ry = 0, rw = 0, rh = 0, rl = 0, rt = 0;

// перетаскивание и изменение размера
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

export function addBlock(type, x = 20, y = 20) {
  let html = '';
  switch (type) {
    case 'text':
      html = '<div class="draggable block-text" contenteditable="true">Текст</div>';
      break;
    case 'image':
      html = '<div class="block-image draggable"><img src="https://via.placeholder.com/150"></div>';
      break;
    case 'header':
      html = '<h1 class="draggable block-header" contenteditable="true">Заголовок</h1>';
      break;
    case 'button':
      html = '<a class="draggable block-button" href="#">Кнопка</a>';
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

export function addResizeHandles(el) {
  if (!el) return;
  if (el.querySelector('.resize-handle')) return;
  for (const dir of ['nw','ne','sw','se']) {
    const d = document.createElement('div');
    d.className = 'resize-handle';
    d.dataset.dir = dir;
    el.appendChild(d);
  }
}

window.addBlock = addBlock;
window.addResizeHandles = addResizeHandles;
builder.setupDraggables();
