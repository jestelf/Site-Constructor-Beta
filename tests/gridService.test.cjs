let GridService
let ProjectStore
beforeAll(async () => {
  GridService = (await import('../ExPlast/sitebuilder/frontend/src/services/gridService.js')).default
  ProjectStore = (await import('../ExPlast/sitebuilder/frontend/src/model/projectStore.js')).default
})

describe('GridService', () => {
  let builder, service
  beforeEach(() => {
    document.body.innerHTML = '<div id="c" style="width:100px;height:100px"><canvas id="gridCanvas"></canvas></div>'
    builder = { canvas: document.getElementById('c'), project: new ProjectStore() }
    service = new GridService(builder)
  })
  test('draw sets canvas size', () => {
    service.draw()
    const c = builder.canvas.querySelector('#gridCanvas')
    expect(c.width).toBeGreaterThan(0)
    expect(c.height).toBeGreaterThan(0)
  })
})
