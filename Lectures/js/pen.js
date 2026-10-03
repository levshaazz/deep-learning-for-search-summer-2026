/* =========================================================
   PEN TOOL — draw annotations over active slide
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_pen) return;
  window.__lec_pen = 1;

  const COLORS = ['#D7522C', '#2A6FDB', '#3A8A5C', '#E0A82E', '#14181F'];
  const STROKES = [3, 6, 10];
  let active = false;
  let layer = null;
  let svg = null;
  let path = null;
  let pts = [];
  let color = COLORS[0];
  let stroke = STROKES[1];
  let drawing = false;

  function ensureLayer() {
    if (!active) return null;
    const slide = document.querySelector('.slide.is-active');
    if (!slide) return null;
    let l = slide.querySelector(':scope > .pen-layer');
    if (!l) {
      l = document.createElement('div');
      l.className = 'pen-layer is-active';
      l.innerHTML = '<svg viewBox="0 0 1920 1080" preserveAspectRatio="none"></svg>';
      slide.appendChild(l);
    } else {
      l.classList.add('is-active');
    }
    layer = l;
    svg = l.querySelector('svg');
    return l;
  }

  function clearLayer(slide) {
    const target = slide || document.querySelector('.slide.is-active');
    if (!target) return;
    const l = target.querySelector(':scope > .pen-layer');
    if (l) l.remove();
  }

  function deactivate() {
    document.querySelectorAll('.pen-layer').forEach((l) => l.classList.remove('is-active'));
    if (palette) palette.classList.remove('is-visible');
  }

  function getSvgPoint(e) {
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1920;
    const y = ((e.clientY - rect.top) / rect.height) * 1080;
    return { x, y };
  }

  function pointsToPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p = points[i], prev = points[i - 1];
      const mx = (prev.x + p.x) / 2, my = (prev.y + p.y) / 2;
      d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  function onDown(e) {
    if (!active || !layer || !layer.classList.contains('is-active')) return;
    if (e.button !== 0) return;
    e.preventDefault();
    drawing = true;
    pts = [getSvgPoint(e)];
    path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', stroke);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('opacity', '0.9');
    svg.appendChild(path);
  }
  function onMove(e) {
    if (!drawing) return;
    pts.push(getSvgPoint(e));
    path.setAttribute('d', pointsToPath(pts));
  }
  function onUp() {
    drawing = false;
    path = null;
    pts = [];
  }

  /* Palette UI */
  let palette = null;
  function ensurePalette() {
    if (palette) return palette;
    palette = document.createElement('div');
    palette.className = 'pen-palette';
    palette.innerHTML = `
      ${COLORS.map(c => `<button data-color="${c}" style="background:${c}"></button>`).join('')}
      <span class="sep"></span>
      ${STROKES.map(s => `<button data-stroke="${s}" class="stroke-btn">${s}px</button>`).join('')}
      <span class="sep"></span>
      <button data-act="undo">↶</button>
      <button data-act="clear">Clear</button>
      <button data-act="close">×</button>
    `;
    document.body.appendChild(palette);
    palette.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.color) { color = t.dataset.color; paintPalette(); return; }
      if (t.dataset.stroke) { stroke = parseInt(t.dataset.stroke, 10); paintPalette(); return; }
      if (t.dataset.act === 'undo') {
        const last = svg && svg.querySelector('path:last-of-type');
        if (last) last.remove();
      }
      if (t.dataset.act === 'clear') {
        const slide = document.querySelector('.slide.is-active');
        clearLayer(slide);
        active = true;
        ensureLayer();
      }
      if (t.dataset.act === 'close') toggle(false);
    });
    paintPalette();
    return palette;
  }
  function paintPalette() {
    if (!palette) return;
    palette.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('is-on', b.dataset.color === color));
    palette.querySelectorAll('[data-stroke]').forEach(b => b.classList.toggle('is-on', parseInt(b.dataset.stroke, 10) === stroke));
  }

  function toggle(force) {
    const want = force === undefined ? !active : !!force;
    active = want;
    const tbBtn = document.querySelector('.toolbar [data-act="pen"]');
    if (tbBtn) tbBtn.classList.toggle('is-on', active);

    if (active) {
      ensureLayer();
      ensurePalette();
      palette.classList.add('is-visible');
      document.addEventListener('pointerdown', onDown, true);
      document.addEventListener('pointermove', onMove, true);
      document.addEventListener('pointerup', onUp, true);
    } else {
      deactivate();
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', onUp, true);
    }
  }

  // Inject palette CSS once
  const styles = document.createElement('style');
  styles.textContent = `
    .pen-palette {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      align-items: center;
      gap: 6px;
      padding: 8px;
      background: rgba(20,24,31,0.94);
      backdrop-filter: blur(12px);
      border-radius: 999px;
      box-shadow: 0 12px 32px rgba(0,0,0,.4);
      z-index: 250;
      font-family: var(--font-sans);
    }
    .pen-palette.is-visible { display: flex; }
    .pen-palette button {
      width: 32px; height: 32px;
      border-radius: 999px;
      border: 2px solid transparent;
      cursor: pointer;
      color: white;
      background: transparent;
      font-size: 14px;
      font-weight: 600;
      display: grid; place-items: center;
      padding: 0;
    }
    .pen-palette button.is-on { border-color: white; transform: scale(1.1); }
    .pen-palette .stroke-btn { background: rgba(255,255,255,0.08); width: auto; min-width: 44px; padding: 0 10px; font-family: var(--font-mono); font-size: 12px; }
    .pen-palette [data-act] { background: rgba(255,255,255,0.08); width: auto; padding: 0 14px; font-size: 14px; }
    .pen-palette [data-act]:hover { background: rgba(255,255,255,0.16); }
    .pen-palette .sep { width: 1px; height: 20px; background: rgba(255,255,255,0.2); }
  `;
  document.head.appendChild(styles);

  // When slide changes, re-arm layer on new active slide (preserves prior annotations on other slides)
  document.addEventListener('deck:ready', () => {
    if (window.Lecture && window.Lecture.onChange) {
      window.Lecture.onChange(() => {
        if (active) {
          // Disable old slide pen layer, enable new one
          document.querySelectorAll('.pen-layer').forEach((l) => l.classList.remove('is-active'));
          ensureLayer();
        }
      });
    }
  });

  window.Pen = { toggle, clear: () => clearLayer() };
})();
