export default class AutosaveService {
  constructor(key, interval = 10000) {
    this.key = key
    this.interval = interval
    this.timer = null
    this.builder = null
  }

  start(builder) {
    this.builder = builder
    this.stop()
    this.timer = setInterval(() => this.save(), this.interval)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  save() {
    if (!this.builder.canvas) return
    localStorage.setItem(this.key, this.builder.canvas.innerHTML)
  }

  load() {
    return localStorage.getItem(this.key)
  }
}
