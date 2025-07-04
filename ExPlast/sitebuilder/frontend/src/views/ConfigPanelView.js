export default class ConfigPanelView extends EventTarget {
  constructor() {
    super()
    this.cfgGrid = document.getElementById('cfgGrid')
    this.cfgBg = document.getElementById('cfgBg')
    this.cfgBgImage = document.getElementById('cfgBgImage')
  }

  readConfig() {
    return {
      grid: parseInt(this.cfgGrid?.value) || 20,
      bgColor: this.cfgBg?.value || '#ffffff',
      bgImage: this.cfgBgImage?.value || ''
    }
  }
}
