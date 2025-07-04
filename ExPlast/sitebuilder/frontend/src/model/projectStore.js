export default class ProjectStore {
  constructor() {
    this.id = null
    this.name = ''
    this.pages = { index: { html: '' } }
    this.config = { bgColor: '#ffffff', grid: 20, bgImage: '' }
    this.current = 'index'
  }

  createPage(id) {
    if (this.pages[id]) return
    this.pages[id] = { html: '' }
  }

  deletePage(id) {
    if (id === 'index') return
    delete this.pages[id]
    if (this.current === id) this.current = 'index'
  }

  setCurrent(id) {
    if (this.pages[id]) this.current = id
  }

  getCurrentHtml() {
    return this.pages[this.current].html
  }

  setCurrentHtml(html) {
    this.pages[this.current].html = html
  }
}
