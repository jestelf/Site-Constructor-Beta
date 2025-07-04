import { builder, bar, pick } from './builder.js';

const anchorRight = document.getElementById('anchorRight');
const anchorBottom = document.getElementById('anchorBottom');

if (pick) {
  pick.oninput = e => {
    if (builder.selected) {
      builder.selected.style.color = e.target.value;
      builder.selected.dataset.color = e.target.value;
    }
    document.execCommand('foreColor', false, e.target.value);
    builder.saveState();
  };
}

bar?.addEventListener('mousedown', e => e.stopPropagation());

document.addEventListener('click', e => {
  if (!builder.canvas || bar.contains(e.target)) return;
  const el = e.target.closest('.draggable');
  if (el && builder.canvas.contains(el)) {
    bar.classList.add('open');
    if (anchorRight) anchorRight.checked = !!el.dataset.anchorRight;
    if (anchorBottom) anchorBottom.checked = !!el.dataset.anchorBottom;
  } else {
    bar.classList.remove('open');
  }
});

function toggleAnchor(type) {
  if (!builder.selected) return;
  const p = builder.selected.parentElement.getBoundingClientRect();
  const r = builder.selected.getBoundingClientRect();
  if (type === 'Right') {
    if (anchorRight.checked) {
      builder.selected.style.right = ((p.right - r.right) / p.width * 100) + '%';
      builder.selected.style.left = '';
      builder.selected.dataset.anchorRight = '1';
    } else {
      builder.selected.style.left = ((r.left - p.left) / p.width * 100) + '%';
      builder.selected.style.right = '';
      delete builder.selected.dataset.anchorRight;
    }
  } else {
    if (anchorBottom.checked) {
      builder.selected.style.bottom = ((p.bottom - r.bottom) / p.height * 100) + '%';
      builder.selected.style.top = '';
      builder.selected.dataset.anchorBottom = '1';
    } else {
      builder.selected.style.top = ((r.top - p.top) / p.height * 100) + '%';
      builder.selected.style.bottom = '';
      delete builder.selected.dataset.anchorBottom;
    }
  }
  builder.saveState();
}

anchorRight?.addEventListener('change', () => toggleAnchor('Right'));
anchorBottom?.addEventListener('change', () => toggleAnchor('Bottom'));

builder.changeProps = function() {
  if (!this.selected) return;
  if (this.propW) {
    const w = parseInt(this.propW.value) || 0;
    if (w) {
      this.selected.style.width = w + 'px';
      this.selected.dataset.w = w;
    }
  }
  if (this.propH) {
    const h = parseInt(this.propH.value) || 0;
    if (h) {
      this.selected.style.height = h + 'px';
      this.selected.dataset.h = h;
    }
  }
  if (this.propFont) {
    const fs = parseInt(this.propFont.value) || 0;
    if (fs) {
      this.selected.style.fontSize = fs + 'px';
      this.selected.dataset.fs = fs;
    }
  }
  if (this.propColor) {
    const c = this.propColor.value;
    this.selected.style.color = c;
    this.selected.dataset.color = c;
  }
  if (this.propAlign) {
    const al = this.propAlign.value;
    this.selected.style.textAlign = al;
    this.selected.dataset.textAlign = al;
  }
  if (this.propFamily) {
    const ff = this.propFamily.value;
    this.selected.style.fontFamily = ff || '';
    this.selected.dataset.fontFamily = ff;
  }
  if (this.propBold) {
    const w = this.propBold.checked ? 'bold' : 'normal';
    this.selected.style.fontWeight = w;
    this.selected.dataset.fontWeight = w;
  }
  if (this.propItalic) {
    const st = this.propItalic.checked ? 'italic' : 'normal';
    this.selected.style.fontStyle = st;
    this.selected.dataset.fontStyle = st;
  }
  if (this.propBg) {
    const bg = this.propBg.value;
    this.selected.style.backgroundColor = bg;
    this.selected.dataset.bg = bg;
  }
  if (this.propBorderWidth) {
    const bw = parseInt(this.propBorderWidth.value) || 0;
    this.selected.style.borderWidth = bw + 'px';
    this.selected.style.borderStyle = bw ? 'solid' : 'none';
    this.selected.dataset.borderWidth = bw;
  }
  if (this.propBorderColor) {
    const bc = this.propBorderColor.value;
    this.selected.style.borderColor = bc;
    if (parseInt(this.propBorderWidth?.value || 0) > 0) this.selected.style.borderStyle = 'solid';
    this.selected.dataset.borderColor = bc;
  }
  if (this.propRadius) {
    const br = parseInt(this.propRadius.value) || 0;
    this.selected.style.borderRadius = br + 'px';
    this.selected.dataset.radius = br;
  }
  if (this.propShadow) {
    const sh = this.propShadow.checked ? 'var(--shadow)' : 'none';
    this.selected.style.boxShadow = sh;
    this.selected.dataset.shadow = sh;
  }
  if (this.selected.classList.contains('block-image')) {
    const img = this.selected.querySelector('img');
    if (img) {
      if (this.propSrc) {
        const src = this.propSrc.value.trim();
        if (src) img.src = src;
        this.selected.dataset.src = src;
      }
      if (this.propAlt) {
        const alt = this.propAlt.value;
        img.alt = alt;
        this.selected.dataset.alt = alt;
      }
    }
  }
  if (this.selected.classList.contains('block-button') || this.selected.tagName.toLowerCase() === 'a') {
    if (this.propHref) {
      const href = this.propHref.value.trim() || '#';
      this.selected.setAttribute('href', href);
      this.selected.dataset.href = href;
    }
    if (this.propTarget) {
      if (this.propTarget.checked) {
        this.selected.setAttribute('target', '_blank');
        this.selected.dataset.target = '_blank';
      } else {
        this.selected.removeAttribute('target');
        delete this.selected.dataset.target;
      }
    }
  }
  this.saveState();
};
