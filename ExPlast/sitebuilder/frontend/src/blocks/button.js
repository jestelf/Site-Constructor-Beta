export function create() {
  const a = document.createElement('a')
  a.className = 'draggable block-button'
  a.href = '#'
  a.textContent = 'Кнопка'
  return a
}
