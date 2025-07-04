export default class SelectionStore {
  constructor() {
    this.items = []
  }

  set(items) {
    this.items = [...items]
  }

  clear() {
    this.items = []
  }

  first() {
    return this.items[0] || null
  }

  includes(el) {
    return this.items.includes(el)
  }
}
