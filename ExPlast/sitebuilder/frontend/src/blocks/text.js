export function create() {
  const div = document.createElement('div')
  div.className = 'draggable block-text'
  div.contentEditable = 'true'
  div.textContent = 'Текст'
  return div
}
