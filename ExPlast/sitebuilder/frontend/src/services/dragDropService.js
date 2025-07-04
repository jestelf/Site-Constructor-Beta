export default class DragDropService {
  constructor(builder) {
    this.builder = builder
  }

  init() {
    document.addEventListener('dragstart', e => {
      const item = e.target.closest('.block-item')
      if (item) {
        e.dataTransfer.setData('text/plain', item.dataset.type)
      }
    })

    this.builder.canvas?.addEventListener('dragover', e => {
      e.preventDefault()
    })

    this.builder.canvas?.addEventListener('drop', e => {
      e.preventDefault()
      const type = e.dataTransfer.getData('text/plain')
      this.builder.dispatchEvent(
        new CustomEvent('blockDrop', { detail: { type, x: e.offsetX, y: e.offsetY } })
      )
    })
  }
}
