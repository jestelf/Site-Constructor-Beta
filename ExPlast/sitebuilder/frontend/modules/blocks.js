export function addResizeHandles(el) {
  if (!el) return;
  if (el.querySelector('.resize-handle')) return;
  for (const dir of ['nw', 'ne', 'sw', 'se']) {
    const d = document.createElement('div');
    d.className = 'resize-handle';
    d.dataset.dir = dir;
    el.appendChild(d);
  }
}

export function addBlock(builder, type, x = 20, y = 20) {
  let html = '';
  switch (type) {
    case 'text':
      html = '<div class="draggable block-text" contenteditable="true">Текст</div>';
      break;
    case 'image':
      html = '<div class="block-image draggable"><img src="https://via.placeholder.com/150" alt=""></div>';
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
