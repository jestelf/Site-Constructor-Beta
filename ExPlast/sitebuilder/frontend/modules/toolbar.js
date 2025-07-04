export function initToolbar(builder) {
  builder.bar = document.getElementById('inlineToolbar');
  builder.pick = document.getElementById('colorPick');
  builder.anchorRight = document.getElementById('anchorRight');
  builder.anchorBottom = document.getElementById('anchorBottom');

  if (builder.pick) {
    builder.pick.oninput = e => {
      if (builder.selected) {
        builder.selected.style.color = e.target.value;
        builder.selected.dataset.color = e.target.value;
      }
      document.execCommand('foreColor', false, e.target.value);
      builder.saveState();
    };
  }

  builder.bar?.addEventListener('mousedown', e => e.stopPropagation());

  document.addEventListener('click', e => {
    if (!builder.canvas || builder.bar.contains(e.target)) return;
    const el = e.target.closest('.draggable');
    if (el && builder.canvas.contains(el)) {
      builder.selectedItem = el;
      builder.bar.classList.add('open');
      if (builder.anchorRight) builder.anchorRight.checked = !!el.dataset.anchorRight;
      if (builder.anchorBottom) builder.anchorBottom.checked = !!el.dataset.anchorBottom;
    } else {
      builder.selectedItem = null;
      builder.bar.classList.remove('open');
    }
  });

  function toggleAnchor(type) {
    if (!builder.selectedItem) return;
    const p = builder.selectedItem.parentElement.getBoundingClientRect();
    const r = builder.selectedItem.getBoundingClientRect();
    if (type === 'Right') {
      if (builder.anchorRight.checked) {
        builder.selectedItem.style.right = ((p.right - r.right) / p.width * 100) + '%';
        builder.selectedItem.style.left = '';
        builder.selectedItem.dataset.anchorRight = '1';
      } else {
        builder.selectedItem.style.left = ((r.left - p.left) / p.width * 100) + '%';
        builder.selectedItem.style.right = '';
        delete builder.selectedItem.dataset.anchorRight;
      }
    } else {
      if (builder.anchorBottom.checked) {
        builder.selectedItem.style.bottom = ((p.bottom - r.bottom) / p.height * 100) + '%';
        builder.selectedItem.style.top = '';
        builder.selectedItem.dataset.anchorBottom = '1';
      } else {
        builder.selectedItem.style.top = ((r.top - p.top) / p.height * 100) + '%';
        builder.selectedItem.style.bottom = '';
        delete builder.selectedItem.dataset.anchorBottom;
      }
    }
    builder.saveState();
  }

  builder.anchorRight?.addEventListener('change', () => toggleAnchor('Right'));
  builder.anchorBottom?.addEventListener('change', () => toggleAnchor('Bottom'));
}
