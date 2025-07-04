let AutosaveService
beforeAll(async () => {
  AutosaveService = (await import('../ExPlast/sitebuilder/frontend/src/services/autosaveService.js')).default
})

describe('AutosaveService', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.innerHTML = '<div id="c"></div>'
  })
  test('save/load', () => {
    const builder = { canvas: document.getElementById('c') }
    builder.canvas.innerHTML = '<p>1</p>'
    const s = new AutosaveService('k', 100)
    s.start(builder)
    s.save()
    expect(localStorage.getItem('k')).toContain('<p>1</p>')
    builder.canvas.innerHTML = ''
    const html = s.load()
    expect(html).toContain('<p>1</p>')
  })
})
