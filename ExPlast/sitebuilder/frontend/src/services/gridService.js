export default class GridService {
  constructor(builder) {
    this.builder = builder
    this.visible = false
    this.canvasObserver = null
  }

  draw() {
    const canvas = this.builder.canvas
    if (!canvas) return
    const step = this.builder.project.config.grid
    const c = canvas.querySelector('#gridCanvas')
    const ctx = c?.getContext('2d')
    if (!ctx) return
    c.width = canvas.clientWidth
    c.height = canvas.clientHeight
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#ddd'
    for (let x = 0; x < c.width; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, c.height)
      ctx.stroke()
    }
    for (let y = 0; y < c.height; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(c.width, y)
      ctx.stroke()
    }
  }

  toggle() {
    this.visible = !this.visible
    const c = this.builder.canvas?.querySelector('#gridCanvas')
    if (c) {
      c.style.display = this.visible ? 'block' : 'none'
      if (this.visible) this.draw()
    }
  }

  observe() {
    if (!this.builder.canvas) return
    this.canvasObserver?.disconnect()
    this.canvasObserver = new ResizeObserver(() => this.draw())
    this.canvasObserver.observe(this.builder.canvas)
  }
}
