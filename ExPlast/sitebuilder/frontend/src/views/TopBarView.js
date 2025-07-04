export default class TopBarView extends EventTarget {
  constructor() {
    super()
    const map = {
      btnPreview: 'togglePreview',
      btnGrid: 'toggleGrid'
    }
    for (const [id, name] of Object.entries(map)) {
      document.getElementById(id)?.addEventListener('click', () => {
        this.dispatchEvent(new Event(name))
      })
    }
  }
}
