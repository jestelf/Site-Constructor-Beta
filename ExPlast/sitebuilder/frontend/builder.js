import HistoryService from './src/services/historyService.js'
import AutosaveService from './src/services/autosaveService.js'
import DragDropService from './src/services/dragDropService.js'
import GridService from './src/services/gridService.js'
import PreviewService from './src/services/previewService.js'
import { apiService } from './src/services/apiService.js'
import ProjectStore from './src/model/projectStore.js'
import SelectionStore from './src/model/selectionStore.js'
import { create as createBlock } from './src/blocks/index.js'
import BlocksBarView from './src/views/BlocksBarView.js'
import TopBarView from './src/views/TopBarView.js'
import LayersPanelView from './src/views/LayersPanelView.js'
import PropsPanelView from './src/views/PropsPanelView.js'
import ConfigPanelView from './src/views/ConfigPanelView.js'

class Builder extends EventTarget {
  constructor() {
    super()
    this.canvas = null
    this.layerId = 0
    this.project = new ProjectStore()
    this.selection = new SelectionStore()
    this.history = new HistoryService(this)
    this.autosave = new AutosaveService('builderAutosave')
    this.dragDrop = new DragDropService(this)
    this.grid = new GridService(this)
    this.preview = new PreviewService(this)
    this.api = apiService
    this.blocksView = new BlocksBarView()
    this.topBar = new TopBarView()
    this.layersView = new LayersPanelView()
    this.propsView = new PropsPanelView()
    this.configView = new ConfigPanelView()
  }

  init() {
    this.canvas = document.getElementById('canvas')
    this.dragDrop.init()
    this.grid.observe()
    this.autosave.start(this)
    this.bindEvents()
    const html = this.autosave.load()
    if (html && this.canvas) {
      this.canvas.innerHTML = html
      this.history.recalcLayerId()
    }
  }

  bindEvents() {
    this.blocksView.addEventListener('dragStart', e => {
      this.dragBlockType = e.detail
    })
    this.addEventListener('blockDrop', e => {
      this.addBlock(e.detail.type, e.detail.x, e.detail.y)
    })
    this.topBar.addEventListener('togglePreview', () => this.preview.toggle())
    this.topBar.addEventListener('toggleGrid', () => this.grid.toggle())
    this.canvas.addEventListener('click', e => this.selectElement(e.target.closest('.draggable')))
    document.addEventListener('keydown', e => this.handleHotkeys(e))
  }

  handleHotkeys(e) {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      this.history.undo()
    } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault()
      this.history.redo()
    }
  }

  selectElement(el) {
    this.selection.clear()
    if (el) {
      el.classList.add('selected')
      this.selection.set([el])
      this.propsView.show(el)
    }
    this.updateLayers()
  }

  updateLayers() {
    const items = [...this.canvas.querySelectorAll('.draggable')]
    this.layersView.render(items)
  }

  addBlock(type, x, y) {
    const el = createBlock(type)
    if (!el || !this.canvas) return
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    el.dataset.layerId = ++this.layerId
    this.canvas.append(el)
    this.history.push()
    this.updateLayers()
  }
}

const builder = new Builder()
window.builder = builder

function initAll() {
  builder.init()
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initAll)
} else {
  initAll()
}

export default builder
