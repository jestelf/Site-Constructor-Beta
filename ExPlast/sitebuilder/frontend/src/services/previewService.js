export default class PreviewService {
  constructor(builder) {
    this.builder = builder
    this.previewWindow = null
    this.mode = false
  }

  buildHTML() {
    const clone = this.builder.canvas.cloneNode(true)
    clone.querySelectorAll('.resize-handle').forEach(e => e.remove())
    clone.querySelector('#gridCanvas')?.remove()
    return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><link rel="stylesheet" href="style.css"></head><body>${clone.innerHTML}</body></html>`
  }

  open() {
    const html = this.buildHTML()
    this.previewWindow = window.open('', '', 'width=800,height=600,resizable=yes,scrollbars=yes')
    if (this.previewWindow) {
      this.previewWindow.document.write(html)
      this.previewWindow.document.close()
    }
    this.mode = true
  }

  close() {
    if (this.previewWindow) this.previewWindow.close()
    this.previewWindow = null
    this.mode = false
  }

  toggle() {
    if (this.mode) this.close()
    else this.open()
  }
}
