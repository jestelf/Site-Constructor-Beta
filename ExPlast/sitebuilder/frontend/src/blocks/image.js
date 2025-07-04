export function create() {
  const div = document.createElement('div')
  div.className = 'block-image draggable'
  const img = document.createElement('img')
  img.src = 'https://via.placeholder.com/150'
  img.alt = ''
  div.append(img)
  return div
}
