let HistoryService
let SelectionStore
beforeAll(async () => {
  HistoryService = (await import('../ExPlast/sitebuilder/frontend/src/services/historyService.js')).default
  SelectionStore = (await import('../ExPlast/sitebuilder/frontend/src/model/selectionStore.js')).default
})

describe('HistoryService', () => {
  let builder, service
  beforeEach(() => {
    document.body.innerHTML = '<div id="c"></div>'
    builder = { canvas: document.getElementById('c'), layerId: 0, selection: new SelectionStore() }
    service = new HistoryService(builder)
  })
  test('push/undo/redo', () => {
    builder.canvas.innerHTML = '<div></div>'
    service.push()
    builder.canvas.innerHTML = '<span></span>'
    service.undo()
    expect(builder.canvas.innerHTML).toContain('div')
    service.redo()
    expect(builder.canvas.innerHTML).toContain('span')
  })
})
