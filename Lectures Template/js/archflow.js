/* =========================================================
   ARCHFLOW — step-by-step reveal of a complex architecture.
   A VECTOR alternative to the "sequence of exported PNGs" pattern: the diagram
   is authored ONCE as positioned nodes; arrows are DECLARATIVE and routed by
   the engine between the real node anchors (no hand-drawn coordinates that can
   drift), elements reveal progressively, a focus ring tracks the active piece,
   and a side panel shows synced KaTeX + bilingual captions. Drives off the
   deck's normal stepper (data-max-step / slide:step / deep-link #/N/M).

   STANDARDIZED CONTRACT (v2):
     <section data-type="archflow" data-max-step="5">
       <div class="af-stage">
         <div class="af-canvas">
           <div class="af-node" id="af-x" data-role="input" data-from="1" data-focus="1"
                style="left:5%;top:50%">…</div>           (image node: data-role="image" + <img alt>)
           <div class="af-edge" data-from-node="af-x" data-to-node="af-k" data-from="2"
                data-from-anchor="right" data-to-anchor="left"></div>   (anchors optional → auto)
           <div class="af-focus"></div>
         </div>
         <div class="af-panel">
           <div class="af-note" data-step="1" data-label="inputs">…$$…$$… <span lang="ru">…</span><span lang="en">…</span></div>
         </div>
       </div>
     </section>

   Attributes:
     id              — required on every .af-node referenced by an edge.
     data-from="k"   — element hidden until currentStep ≥ k (cumulative reveal).
     data-focus="k"  — highlighted while currentStep == k; "a..b" for a range.
     .af-edge        — data-from-node / data-to-node reference node ids; the
                       engine draws the arrow between their anchors. data-from
                       reveals the arrow; data-{from,to}-anchor ∈ left|right|top|
                       bottom|auto pick the exit/entry side (default auto).
   The whole wire layer (SVG) is built by the engine — authors write no SVG.

   Introspection for tooling (preflight / headless auditor):
     slide.__archflow = { nodes, edges, notes, maxStep, route(), boxes(step) }
   ========================================================= */
(function () {
  'use strict';
  if (window.__lec_archflow) return;
  window.__lec_archflow = 1;

  const VB_W = 1000, VB_H = 600;   // wire-layer viewBox (canvas aspect is 1000/600)
  const NS = 'http://www.w3.org/2000/svg';

  function parseRange(s) {
    if (s == null) return null;
    const m = String(s).match(/^(\d+)(?:\.\.(\d+))?$/);
    if (!m) return null;
    const a = parseInt(m[1], 10);
    const b = m[2] != null ? parseInt(m[2], 10) : a;
    return [Math.min(a, b), Math.max(a, b)];
  }

  /* Layout offset of `el` relative to `root` (UNSCALED — immune to the auto-fit
     transform). Because tiles are centered via translate(-50%,-50%), the summed
     offsetLeft/Top is the element CENTER; w/h are the box size. */
  function centerOf(el, root) {
    let x = 0, y = 0, n = el;
    while (n && n !== root && n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { cx: x, cy: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  /* Visual bounding box (top-left + size) in layout px, accounting for centering. */
  function boxOf(el, root) {
    const c = centerOf(el, root);
    return { x: c.cx - c.w / 2, y: c.cy - c.h / 2, w: c.w, h: c.h };
  }

  /* Orthogonal (Manhattan) elbow between two anchor points (each {x,y,nx,ny}
     in viewBox units). HVH / VHV / L-shape depending on the anchor normals;
     routes through the channel between the nodes (clean on a grid layout). */
  function orthoPath(pa, pb) {
    const aH = pa.nx !== 0, bH = pb.nx !== 0;
    const pts = [{ x: pa.x, y: pa.y }];
    if (aH && bH) { const mx = (pa.x + pb.x) / 2; pts.push({ x: mx, y: pa.y }, { x: mx, y: pb.y }); }
    else if (!aH && !bH) { const my = (pa.y + pb.y) / 2; pts.push({ x: pa.x, y: my }, { x: pb.x, y: my }); }
    else if (aH && !bH) { pts.push({ x: pb.x, y: pa.y }); }
    else { pts.push({ x: pa.x, y: pb.y }); }
    pts.push({ x: pb.x, y: pb.y });
    const clean = pts.filter((p, i) => i === 0 || Math.abs(p.x - pts[i - 1].x) > 0.5 || Math.abs(p.y - pts[i - 1].y) > 0.5);
    return roundedOrtho(clean, 12);
  }
  function roundedOrtho(pts, r) {
    const f = (n) => n.toFixed(1);
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${f(pts[0].x)},${f(pts[0].y)} L${f(pts[1].x)},${f(pts[1].y)}`;
    let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], prev = pts[i - 1], next = pts[i + 1];
      const l1 = Math.hypot(p.x - prev.x, p.y - prev.y) || 1, l2 = Math.hypot(next.x - p.x, next.y - p.y) || 1;
      const rr = Math.min(r, l1 / 2, l2 / 2);
      const c1 = { x: p.x + (prev.x - p.x) / l1 * rr, y: p.y + (prev.y - p.y) / l1 * rr };
      const c2 = { x: p.x + (next.x - p.x) / l2 * rr, y: p.y + (next.y - p.y) / l2 * rr };
      d += ` L${f(c1.x)},${f(c1.y)} Q${f(p.x)},${f(p.y)} ${f(c2.x)},${f(c2.y)}`;
    }
    const last = pts[pts.length - 1];
    d += ` L${f(last.x)},${f(last.y)}`;
    return d;
  }

  function initArchflow(slide) {
    if (slide.dataset.archflowBound) return;
    slide.dataset.archflowBound = '1';

    const canvas = slide.querySelector('.af-canvas');
    const panel = slide.querySelector('.af-panel');
    if (!canvas) return;
    let ring = canvas.querySelector('.af-focus');
    if (!ring) { ring = document.createElement('div'); ring.className = 'af-focus'; canvas.appendChild(ring); }

    const nodes = [...canvas.querySelectorAll('.af-node')];
    const edgeEls = [...canvas.querySelectorAll('.af-edge')];
    /* Everything that reveals on a step: nodes AND labels (NOT edges — their
       SVG paths reveal separately). */
    const revealEls = [...canvas.querySelectorAll('[data-from]')].filter(el => !el.classList.contains('af-edge'));
    const focusEls = [...canvas.querySelectorAll('[data-focus]')];
    const notes = panel ? [...panel.querySelectorAll('.af-note')] : [];
    const byId = (id) => canvas.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));

    /* Auto-legend: fill <div class="af-legend" data-auto> with one swatch per
       role present (canonical order) + sync/async line samples from the edges.
       A C4 best practice: a key on every blueprint, generated, never stale. */
    const ROLE_ORDER = ['source', 'pipeline', 'store', 'serving', 'external', 'monitor',
      'input', 'query', 'key', 'value', 'score', 'weight', 'output', 'image'];
    const autoLegend = slide.querySelector('.af-legend[data-auto]');
    if (autoLegend && !autoLegend.dataset.afFilled) {
      autoLegend.dataset.afFilled = '1';
      const present = [...new Set(nodes.map(n => n.dataset.role).filter(Boolean))]
        .sort((a, b) => (ROLE_ORDER.indexOf(a) + 1 || 99) - (ROLE_ORDER.indexOf(b) + 1 || 99));
      let html = present.map(r => `<div class="af-leg"><span class="af-swatch" data-role="${r}"></span> ${r}</div>`).join('');
      if (edgeEls.length) html += '<div class="af-leg"><span class="af-line"></span> sync</div>';
      if (edgeEls.some(e => e.dataset.kind === 'async')) html += '<div class="af-leg"><span class="af-line af-wire-async"></span> async</div>';
      autoLegend.innerHTML = html;
    }

    /* ---- wire layer (built by the engine; authors write no SVG) ---- */
    let svg = canvas.querySelector('svg.af-wires');
    if (!svg) {
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'af-wires');
      canvas.insertBefore(svg, canvas.firstChild);
    }
    svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    if (!svg.querySelector('#af-ah')) {
      const defs = document.createElementNS(NS, 'defs');
      defs.innerHTML = '<marker id="af-ah" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto">' +
        '<path d="M0,0 L9,4.5 L0,9 z"></path></marker>';
      svg.appendChild(defs);
    }
    edgeEls.forEach((e) => {
      if (e._afPath) return;
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('marker-end', 'url(#af-ah)');
      if (e.dataset.from != null) p.dataset.from = e.dataset.from;
      /* Tag the path with its endpoints so tooling can verify connections. */
      if (e.dataset.fromNode) p.dataset.fromNode = e.dataset.fromNode;
      if (e.dataset.toNode) p.dataset.toNode = e.dataset.toNode;
      /* Edge KIND: sync (default, solid) | async (dashed) | control (dashed,
         muted). Drives a CSS class on the path. */
      if (e.dataset.kind) p.classList.add('af-wire-' + e.dataset.kind);
      e._afPath = p;
      svg.appendChild(p);
      /* Edge LABEL — an HTML div (NOT SVG text: the wire layer is stretched via
         preserveAspectRatio=none, which would distort text). Positioned at the
         path midpoint in route(). */
      if (e.dataset.label) {
        const lab = document.createElement('div');
        lab.className = 'af-edge-label';
        if (e.dataset.kind) lab.classList.add('af-edge-label-' + e.dataset.kind);
        lab.innerHTML = e.dataset.label;
        e._afLabel = lab;
        canvas.appendChild(lab);
      }
    });

    function anchor(box, side, other) {
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      if (side === 'auto' || !side) {
        const dx = (other.x + other.w / 2) - cx, dy = (other.y + other.h / 2) - cy;
        side = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
      }
      switch (side) {
        case 'left':   return { x: box.x, y: cy, nx: -1, ny: 0 };
        case 'right':  return { x: box.x + box.w, y: cy, nx: 1, ny: 0 };
        case 'top':    return { x: cx, y: box.y, nx: 0, ny: -1 };
        default:       return { x: cx, y: box.y + box.h, nx: 0, ny: 1 };
      }
    }

    /* Opt-in auto-layout: with data-layout="grid" on the canvas, nodes that
       declare data-lane + data-col (+ optional data-row) are placed on an even
       grid INSIDE their lane's vertical band — no manual %, even spacing, so
       overlaps can't sneak in when labels/fonts change. Nodes WITHOUT data-lane
       keep their explicit left/top (e.g. a bridge node). Columns are spread
       across the full canvas width; rows within the lane's height. */
    function applyGridLayout() {
      if (canvas.dataset.layout !== 'grid') return;
      const lanes = {};
      canvas.querySelectorAll('.af-lane[data-lane]').forEach(l => {
        lanes[l.dataset.lane] = { top: parseFloat(l.style.top) || 0, height: parseFloat(l.style.height) || 100 };
      });
      const laneNodes = nodes.filter(n => n.dataset.lane);
      if (!laneNodes.length) return;
      const ncols = Math.max(1, ...laneNodes.map(n => parseInt(n.dataset.col, 10) || 1));
      const rows = {};
      laneNodes.forEach(n => { const k = n.dataset.lane; rows[k] = Math.max(rows[k] || 1, parseInt(n.dataset.row, 10) || 1); });
      laneNodes.forEach(n => {
        const ln = lanes[n.dataset.lane] || { top: 0, height: 100 };
        const col = parseInt(n.dataset.col, 10) || 1, row = parseInt(n.dataset.row, 10) || 1;
        n.style.left = ((col - 0.5) / ncols * 100) + '%';
        n.style.top = (ln.top + (row - 0.5) / (rows[n.dataset.lane] || 1) * ln.height) + '%';
      });
    }

    /* A node's box in viewBox units. */
    function boxVB(el, cw, ch) {
      const b = boxOf(el, canvas);
      return { left: b.x / cw * VB_W, right: (b.x + b.w) / cw * VB_W, top: b.y / ch * VB_H,
        bottom: (b.y + b.h) / ch * VB_H, cx: (b.x + b.w / 2) / cw * VB_W, cy: (b.y + b.h / 2) / ch * VB_H };
    }
    /* Bounding box of ALL nodes (viewBox units) — the perimeter that "around"
       edges route outside of. Stable across steps. */
    function clusterBBoxVB(cw, ch) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => { const b = boxVB(n, cw, ch);
        minX = Math.min(minX, b.left); minY = Math.min(minY, b.top);
        maxX = Math.max(maxX, b.right); maxY = Math.max(maxY, b.bottom); });
      return { minX, minY, maxX, maxY };
    }

    /* Recompute every edge path from the live node positions. Pixel→viewBox
       so it's exact under any auto-fit scale. */
    function route() {
      applyGridLayout();
      const cw = canvas.offsetWidth || 1, ch = canvas.offsetHeight || 1;
      const toVB = (x, y) => [x / cw * VB_W, y / ch * VB_H];
      const cluster = clusterBBoxVB(cw, ch);
      const routing = canvas.dataset.routing || 'curved';
      const isOrtho = routing === 'orthogonal' || routing === 'ortho';
      const BACK = VB_W * 0.45;   // leftward span to AUTO-detect a back-edge
      const TRACK = 32;           // perimeter-track separation (viewBox units)

      /* PRE-PASS: resolve each edge's mode and (for "around" edges) its nested
         perimeter track. Explicit data-route wins. Otherwise, in orthogonal
         mode, an edge whose target sits well UPSTREAM (far to the left of the
         source) is AUTO-detected as a back-edge → routed "around". Edges sharing
         a channel (top/bottom) get sequential tracks so parallel loops nest. */
      const chanCount = { top: 0, bottom: 0 };
      edgeEls.forEach((e) => {
        const a = byId(e.dataset.fromNode), b = byId(e.dataset.toNode);
        if (!a || !b) { e._afMode = null; return; }
        const sb = boxVB(a, cw, ch), tb = boxVB(b, cw, ch);
        let mode = e.dataset.route;
        if (!mode) mode = isOrtho ? (tb.cx < sb.cx - BACK ? 'around' : 'orthogonal') : routing;
        e._afMode = mode;
        if (mode === 'around') {
          e._afTop = e.dataset.around === 'top';
          e._afTrack = chanCount[e._afTop ? 'top' : 'bottom']++;
        }
      });

      edgeEls.forEach((e) => {
        const a = byId(e.dataset.fromNode), b = byId(e.dataset.toNode);
        if (!a || !b || !e._afPath) { if (e._afPath) e._afPath.removeAttribute('d'); return; }
        const ba = boxOf(a, canvas), bb = boxOf(b, canvas);
        const pa = anchor(ba, e.dataset.fromAnchor, bb);
        const pb = anchor(bb, e.dataset.toAnchor, ba);
        const [ax, ay] = toVB(pa.x, pa.y), [bx, by] = toVB(pb.x, pb.y);
        const mode = e._afMode || 'curved';
        if (mode === 'around') {
          /* GENERAL back-edge solution: route along the node-cluster PERIMETER
             (a margin channel beyond every node) — never crosses nodes/forward
             edges. Coords derived from the live cluster bbox → no manual tuning.
             Parallel around-edges nest on successive tracks (channel depth +
             entry/exit offsets), so they don't overlap each other either. */
          const sb = boxVB(a, cw, ch), tb = boxVB(b, cw, ch);
          const GAP = 40, off = (e._afTrack || 0) * TRACK, top = e._afTop;
          const chY = top ? Math.max(12, cluster.minY - GAP - off) : Math.min(VB_H - 12, cluster.maxY + GAP + off);
          const left = tb.cx <= sb.cx;
          const sideX = left ? Math.max(14, cluster.minX - GAP - off) : Math.min(VB_W - 14, cluster.maxX + GAP + off);
          const sX = Math.max(sb.left + 8, Math.min(sb.right - 8, sb.cx + (e._afTrack || 0) * 14));
          const tY = Math.max(tb.top + 8, Math.min(tb.bottom - 8, tb.cy + (e._afTrack || 0) * 14));
          const sY = top ? sb.top : sb.bottom;
          const tEdgeX = left ? tb.left : tb.right;
          e._afPath.setAttribute('d', roundedOrtho([
            { x: sX, y: sY }, { x: sX, y: chY }, { x: sideX, y: chY },
            { x: sideX, y: tY }, { x: tEdgeX, y: tY },
          ], 14));
        } else if (mode === 'orthogonal' || mode === 'ortho') {
          e._afPath.setAttribute('d', orthoPath(
            { x: ax, y: ay, nx: pa.nx, ny: pa.ny }, { x: bx, y: by, nx: pb.nx, ny: pb.ny }));
        } else {
          const dist = Math.hypot(bx - ax, by - ay);
          const ext = Math.max(40, Math.min(200, dist * 0.4));
          const c1x = ax + pa.nx * ext, c1y = ay + pa.ny * ext;
          const c2x = bx + pb.nx * ext, c2y = by + pb.ny * ext;
          e._afPath.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`);
        }
        /* Place the edge label near the path midpoint, OFFSET perpendicular to
           the line (so it sits beside the wire, not on top of it / the nodes
           it passes). HTML px, not viewBox (the wire layer is stretched). */
        if (e._afLabel) {
          const tot = e._afPath.getTotalLength ? e._afPath.getTotalLength() : 0;
          let mx, my;
          if (tot) {
            const m = e._afPath.getPointAtLength(tot / 2);
            const a1 = e._afPath.getPointAtLength(Math.max(0, tot / 2 - 4));
            const a2 = e._afPath.getPointAtLength(Math.min(tot, tot / 2 + 4));
            const tdx = a2.x - a1.x, tdy = a2.y - a1.y, tl = Math.hypot(tdx, tdy) || 1;
            let nxv = -tdy / tl, nyv = tdx / tl;          // unit normal
            if (nyv > 0) { nxv = -nxv; nyv = -nyv; }       // bias the label upward
            const OFF = 20;                                 // viewBox units
            mx = m.x + nxv * OFF; my = m.y + nyv * OFF;
          } else { mx = (ax + bx) / 2; my = (ay + by) / 2; }
          e._afLabel.style.left = (mx / VB_W * cw) + 'px';
          e._afLabel.style.top = (my / VB_H * ch) + 'px';
        }
      });
    }

    /* Derive max-step if unset. */
    if (!slide.hasAttribute('data-max-step')) {
      let max = 0;
      revealEls.concat(edgeEls).forEach(el => { max = Math.max(max, parseInt(el.dataset.from, 10) || 0); });
      focusEls.forEach(el => { const r = parseRange(el.dataset.focus); if (r) max = Math.max(max, r[1]); });
      notes.forEach(n => { max = Math.max(max, parseInt(n.dataset.step, 10) || 0); });
      slide.dataset.maxStep = String(max);
    }
    if (!slide.dataset.currentStep) slide.dataset.currentStep = '0';
    const stepName = slide.querySelector('[data-af-stage-name]');

    function positionRing(foci) {
      if (!foci.length) { ring.classList.remove('is-on'); return; }
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      foci.forEach(el => {
        const b = boxOf(el, canvas);
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h);
      });
      const pad = 10;
      ring.style.left = (x0 - pad) + 'px'; ring.style.top = (y0 - pad) + 'px';
      ring.style.width = (x1 - x0 + pad * 2) + 'px'; ring.style.height = (y1 - y0 + pad * 2) + 'px';
      ring.classList.add('is-on');
    }

    function paint() {
      let step = parseInt(slide.dataset.currentStep || '0', 10);
      if (!Number.isFinite(step)) step = 0;
      revealEls.forEach(el => el.classList.toggle('is-shown', step >= (parseInt(el.dataset.from, 10) || 0)));
      edgeEls.forEach(e => {
        const on = step >= (parseInt(e.dataset.from, 10) || 0);
        if (e._afPath) e._afPath.classList.toggle('is-shown', on);
        if (e._afLabel) e._afLabel.classList.toggle('is-shown', on);
      });
      const foci = [];
      focusEls.forEach(el => {
        const r = parseRange(el.dataset.focus);
        const on = !!r && step >= r[0] && step <= r[1];
        el.classList.toggle('is-focus', on);
        if (on) foci.push(el);
      });
      requestAnimationFrame(() => positionRing(foci));
      notes.forEach(n => n.classList.toggle('is-current', (parseInt(n.dataset.step, 10) || 0) === step));
      if (stepName) {
        const a = notes.find(n => (parseInt(n.dataset.step, 10) || 0) === step);
        stepName.textContent = (a && a.dataset.label) || ('step ' + step);
      }
    }

    function relayout() { route(); paint(); }

    slide.addEventListener('slide:step', paint);
    slide.addEventListener('slide:enter', relayout);
    document.addEventListener('katex:done', () => { relayout(); });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => route()).observe(canvas);
    window.addEventListener('resize', route);

    /* Introspection surface for preflight.js + the headless auditor. */
    slide.__archflow = {
      get maxStep() { return parseInt(slide.dataset.maxStep, 10) || 0; },
      nodes, edgeEls, notes, route, paint,
      parseRange,
      box: (el) => boxOf(el, canvas),
      canvasSize: () => ({ w: canvas.offsetWidth, h: canvas.offsetHeight }),
    };

    route(); paint();
    /* a couple of deferred re-routes for late layout (fonts/KaTeX). */
    requestAnimationFrame(relayout);
    setTimeout(relayout, 400);
  }

  document.addEventListener('deck:ready', () => {
    document.querySelectorAll('.slide[data-type="archflow"]').forEach(initArchflow);
  });
})();
