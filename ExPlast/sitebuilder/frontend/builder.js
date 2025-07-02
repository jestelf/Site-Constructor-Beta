// Простые обработчики перетаскивания элементов
let dragItem = null, dx = 0, dy = 0;

document.addEventListener('mousedown', e => {
  const el = e.target.closest('.draggable');
  if (!el) return;
  const r = el.getBoundingClientRect();
  dx = e.clientX - r.left;
  dy = e.clientY - r.top;
  dragItem = el;
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!dragItem) return;
  const p = dragItem.parentElement.getBoundingClientRect();
  let l = e.clientX - p.left - dx;
  let t = e.clientY - p.top - dy;
  l = Math.max(0, Math.min(l, p.width - dragItem.offsetWidth));
  t = Math.max(0, Math.min(t, p.height - dragItem.offsetHeight));
  dragItem.style.left = (l / p.width * 100) + '%';
  dragItem.style.top  = (t / p.height * 100) + '%';
});

document.addEventListener('mouseup', () => { dragItem = null; });

// Создание блоков
function addBlock(type) {
  let html = '';
  switch (type) {
    case 'text':
      html = '<div class="draggable" contenteditable="true" style="left:20px;top:20px;">Текст</div>';
      break;
    case 'image':
      html = '<img class="draggable" style="left:20px;top:20px;" src="https://via.placeholder.com/150">';
      break;
    case 'header':
      html = '<h1 class="draggable" contenteditable="true" style="left:20px;top:20px;">Заголовок</h1>';
      break;
    case 'button':
      html = '<a class="draggable" contenteditable="true" href="#" style="left:20px;top:20px;display:inline-block;padding:4px 8px;background:#4b86c2;color:#fff;border-radius:4px;">Кнопка</a>';
      break;
  }
  if (html && builder.canvas) builder.canvas.insertAdjacentHTML('beforeend', html);
}
window.addBlock = addBlock;

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

class Builder {
  constructor() {
    this.project = { id: null, name: '', pages: { index: { html: '' } } };
    this.pages = ['index'];
    this.current = 'index';
    this.selected = null;
  }

  init() {
    this.canvas      = document.getElementById('canvas');
    this.btnCreate   = document.getElementById('btnCreate');
    this.btnLoad     = document.getElementById('btnLoad');
    this.btnSave     = document.getElementById('btnSave');
    this.btnExport   = document.getElementById('btnExport');
    this.pageSelect  = document.getElementById('pageSelect');
    this.pageAdd     = document.getElementById('pageAdd');
    this.pageDel     = document.getElementById('pageDel');

    this.btnCreate.onclick  = () => this.createProject();
    this.btnLoad.onclick    = () => this.loadProject();
    this.btnSave.onclick    = () => this.saveProject();
    this.btnExport.onclick  = () => this.exportProject();
    this.pageSelect.onchange = () => this.switchPage(this.pageSelect.value);
    this.pageAdd.onclick    = () => this.addPage();
    this.pageDel.onclick    = () => this.deletePage();

    this.updateSelect();
    this.switchPage('index');

    document.addEventListener('keydown', e => {
      if (e.key === 'Delete' && this.selected) {
        this.selected.remove();
        this.selected = null;
        if (bar) bar.hidden = true;
      }
    });
  }

  updateSelect() {
    this.pageSelect.innerHTML = '';
    for (const id of this.pages) {
      const o = document.createElement('option');
      o.value = id;
      o.textContent = id;
      this.pageSelect.appendChild(o);
    }
  }

  async createProject() {
    const name = prompt('Название проекта', 'Сайт');
    if (!name) return;
    this.project = { id: null, name, pages: { index: { html: '' } } };
    this.pages = ['index'];
    this.updateSelect();
    this.switchPage('index');
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
      };
      this.pages = Object.keys(this.project.pages);
      this.updateSelect();
      this.switchPage(this.pages[0]);
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
        data: { pages: this.project.pages },
      });
      this.project.id = res.id;
    } else {
      await api('PUT', `/projects/${this.project.id}`, {
        name: this.project.name,
        data: { pages: this.project.pages },
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
    this.canvas.innerHTML = this.project.pages[id].html;
  }
}

const builder = new Builder();
window.builder = builder;
