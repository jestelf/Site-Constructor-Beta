export default class HistoryService {
  constructor(builder) {
    this.builder = builder
    this.undoStack = []
    this.redoStack = []
  }

  push() {
    if (!this.builder.canvas) return
    this.undoStack.push(this.builder.canvas.innerHTML)
    this.redoStack = []
    this.recalcLayerId()
  }

  undo() {
    if (!this.undoStack.length || !this.builder.canvas) return
    this.redoStack.push(this.builder.canvas.innerHTML)
    const state = this.undoStack.pop()
    this.builder.canvas.innerHTML = state
    this.recalcLayerId()
    this.builder.selection.clear()
  }

  redo() {
    if (!this.redoStack.length || !this.builder.canvas) return
    this.undoStack.push(this.builder.canvas.innerHTML)
    const state = this.redoStack.pop()
    this.builder.canvas.innerHTML = state
    this.recalcLayerId()
    this.builder.selection.clear()
  }

  recalcLayerId() {
    const els = [...this.builder.canvas.querySelectorAll('[data-layer-id]')]
    const maxId = Math.max(0, ...els.map(e => parseInt(e.dataset.layerId || 0)))
    this.builder.layerId = maxId
  }
}
