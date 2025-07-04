import { addBlock } from './modules/blocks.js';
import { initDrag } from './modules/drag.js';
import { initToolbar } from './modules/toolbar.js';
import Builder from './modules/builder-class.js';

const builder = new Builder();
window.builder = builder;

function initAll() {
  initDrag(builder);
  initToolbar(builder);
  builder.init();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

window.addBlock = (type, x = 20, y = 20) => addBlock(builder, type, x, y);
export default builder;
