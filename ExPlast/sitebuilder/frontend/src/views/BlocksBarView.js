export default class BlocksBarView extends EventTarget {
  constructor() {
    super()
    this.el = document.getElementById('blocksBar')
    this.el?.addEventListener('dragstart', e => {
      const item = e.target.closest('.block-item')
      if (item) {
        this.dispatchEvent(new CustomEvent('dragStart', { detail: item.dataset.type }))
      }
    })
  }
}
