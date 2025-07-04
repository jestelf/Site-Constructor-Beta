export function create() {
  const h1 = document.createElement('h1')
  h1.className = 'draggable block-header'
  h1.contentEditable = 'true'
  h1.textContent = 'Заголовок'
  return h1
}
