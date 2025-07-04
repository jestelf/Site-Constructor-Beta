import { addBlock } from './modules/blocks.js';
import { initDrag } from './modules/drag.js';
import { initToolbar } from './modules/toolbar.js';
import Builder from './modules/builder-class.js';

const builder = new Builder();
window.builder = builder;

// Инициализируем модули только после полной загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
  initDrag(builder);
  initToolbar(builder);
  builder.init();
});

window.addBlock = (type, x = 20, y = 20) => addBlock(builder, type, x, y);
export default builder;
