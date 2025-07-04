export default class PropsPanelView extends EventTarget {
  constructor() {
    super()
    this.w = document.getElementById('propWidth')
    this.h = document.getElementById('propHeight')
  }

  show(el) {
    if (!this.w || !this.h || !el) return
    this.w.value = parseInt(el.dataset.w || el.offsetWidth)
    this.h.value = parseInt(el.dataset.h || el.offsetHeight)
  }
}
