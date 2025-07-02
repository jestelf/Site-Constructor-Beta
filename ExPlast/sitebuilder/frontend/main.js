// Вспомогательный запрос к API
async function api(method, path, body) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw await r.text();
  return method === 'GET' ? r.json() : r.json();
}

// Создать новый проект
async function createProject(name) {
  return api('POST', '/projects/', { name, data: {} });
}

// Загрузить проект
async function loadProject(id) {
  return api('GET', `/projects/${id}`);
}

// Сохранить весь проект
async function saveAll(id, data) {
  return api('PUT', `/projects/${id}`, data);
}

// Экспортировать проект
async function exportProject(id) {
  const r = await fetch(`/projects/${id}/export`);
  if (!r.ok) throw await r.text();
  return r.blob();
}

// Мини-панель форматирования
const bar = document.getElementById('inlineToolbar');
const pick = document.getElementById('colorPick');

if (pick) {
  pick.oninput = e => document.execCommand('foreColor', false, e.target.value);
}

bar?.addEventListener('mousedown', e => e.stopPropagation());
