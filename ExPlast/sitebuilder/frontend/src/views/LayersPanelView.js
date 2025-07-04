export default class LayersPanelView extends EventTarget {
  constructor() {
    super()
    this.list = document.getElementById('layersList')
  }

  render(items) {
    if (!this.list) return
    this.list.innerHTML = ''
    for (const el of items) {
      const li = document.createElement('li')
      li.textContent = el.tagName + '#' + (el.dataset.layerId || '')
      this.list.append(li)
    }
  }
}
