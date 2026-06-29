/* hnsw-graph/logic.js — L9 'climb-hnsw' beat: greedy search on a tiny navigable small-world graph.
   Six nodes in 2-D so every distance is hand-computable; greedy descent hops entry→…→NN, stopping at
   a local minimum. The MECHANISM (not a speedup — on 6 nodes greedy still evaluates most neighbours;
   the O(log N) win is asymptotic, made on climb-latency / the "10⁶ vectors" zoom).

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll — deck arrow keys and Book Scrollama
   both call setStep(k). Every coordinate/distance/recall comes from data/l9-hnsw.json (the facts-gated
   source, recomputed by provenance_l9); all human text from i18n `labels`. Built on _widget-base.js.

   Steps (maxStep = 3):
     0  → the graph (6 nodes + edges) + the query; entry node lit.                         s0
     1  → hop 1: from the entry, move to its closest neighbour (n0→n1, dist 2.55).          s1
     2  → hop 2: move again (n1→n2, dist 0.7071) — neighbours all farther → local min.      s2
     3  → n2 IS the brute-force NN (0.7071) → recall@1 = 1.0; the ef-knob trap note.         s3

   VARIANT (backward-compatible): the original `toy` path is the DEFAULT. A new slide may pass
   `labels.variant === 'toy2'` to select the 12-node, 2-LAYER climb on `data.toy2` (maxStep = 5):
     0  → both layers drawn (upper hub band L1 + base band L0) + the query; baseEntry b0 lit.   t0
     1  → base-ONLY greedy from b0 walks b0→b1→b2→b4 and TRAPS at the local min b4 (recall 0.0). t1
     2  → restart: enter at the upper hub b2 (the L1 entry).                                     t2
     3  → L1 hub hop b2→b7 (the long-range upper edge crosses the gap).                          t3
     4  → descend to base at b7, then the L0 hop b7→b9 (the true NN, 1.4142).                    t4
     5  → b9 is the brute-force NN → recall@1 = 1.0; the recall contrast (base-only 0.0 vs hub 1.0). t5
   When `variant !== 'toy2'` NOTHING below changes — the 6-node path renders byte-identically. */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor, makeProtagonist } from '../_plot-util.js';

export const mountHnswGraph = defineWidget({
  id: 'hnsw-graph',
  rootClass: 'hg-root',
  exportName: 'mountHnswGraph',
  maxStep: 5,                       // toy2 walks 0..5; the toy path clamps itself to 0..3 (back-compat)
  render(ctx) {
    if ((ctx.labels && ctx.labels.variant) === 'toy2') return renderToy2(ctx);
    return renderToy(ctx);
  },
});

// ── ORIGINAL 6-node single-layer greedy path (DEFAULT — unchanged; byte-identical render) ──
function renderToy({ host, data, labels, el }) {
    const toy = data.toy || data;
    const nodes = (toy.coords && toy.coords.nodes) || [];
    const names = toy.labels || nodes.map((_, i) => 'n' + i);
    const edges = toy.edges || [];
    const q = toy.query || [0, 0];
    const greedy = toy.greedy || {};
    const path = greedy.pathIdx || [];
    const bf = toy.bruteForce || {};
    const hopTable = toy.hopTable || [];
    const trap = toy.trap || {};

    // the NN's distance is shown at 4 dp (0.7071), every other distance at 2 dp (2.55, 1.58) — matches
    // the facts-gate's displayed-number contract (the ≥2-dp values 0.7071/1.58/2.55 are [C]-gated).
    const dShow = (idx, d) => (idx === bf.nnIdx ? Number(d).toFixed(4) : Number(d).toFixed(2));

    // ── frame geometry (SVG scales to 100% width via CSS) ──
    const W = 480, PAD_L = 18, PAD_T = 30;
    const plotW = W - 2 * PAD_L, plotH = 250;
    const xs = nodes.map((n) => n[0]).concat(q[0]);
    const ys = nodes.map((n) => n[1]).concat(q[1]);
    const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.12);
    const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
    const box = { x: PAD_L, y: PAD_T, w: plotW, h: plotH };
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;

    // the read-out panel below the plot (hop list / NN result)
    const panelTop = PAD_T + plotH + 14, panelRow = 22;
    const H = frameHeightFor(panelTop + 4 * panelRow, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg hg-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // ── edges (drawn first, under the nodes) ──
    const edgeEl = {};
    edges.forEach(([i, j]) => {
      const ln = el('line', { x1: sx(nodes[i][0]), y1: sy(nodes[i][1]), x2: sx(nodes[j][0]), y2: sy(nodes[j][1]), class: 'hg-edge' }, svg);
      edgeEl[i + '-' + j] = ln; edgeEl[j + '-' + i] = ln;
    });

    // ── query marker (a diamond) ──
    const qx = sx(q[0]), qy = sy(q[1]);
    el('path', { d: `M${qx} ${qy - 9} L${qx + 9} ${qy} L${qx} ${qy + 9} L${qx - 9} ${qy} Z`, class: 'hg-query' }, svg);
    el('text', { x: qx + 12, y: qy + 4, class: 'hg-qlbl' }, svg).textContent = labels.query || 'query';

    // ── nodes (circle + name) ──
    const nodeEl = nodes.map((n, i) => {
      const g = el('g', { class: 'hg-node', 'data-i': i }, svg);
      el('circle', { cx: sx(n[0]), cy: sy(n[1]), r: 13, class: 'hg-dot' }, g);
      el('text', { x: sx(n[0]), y: sy(n[1]) + 4, class: 'hg-nlbl', 'text-anchor': 'middle' }, g).textContent = names[i];
      return g;
    });

    // halo that follows the "current" node of the greedy walk
    const proto = makeProtagonist(svg, { haloClass: 'hg-halo', haloR: 18 });

    // ── read-out panel text (one line, replaced per step) ──
    const readHead = el('text', { x: PAD_L, y: panelTop, class: 'hg-readhead' }, svg);
    const readLines = [0, 1, 2].map((r) => el('text', { x: PAD_L, y: panelTop + (r + 1) * panelRow, class: 'hg-readline' }, svg));
    const setRead = (head, lines) => {
      readHead.textContent = head || '';
      readLines.forEach((ln, i) => { ln.textContent = lines[i] || ''; });
    };

    // helper: light the path up to hop h (h hops taken), and the traversed edges
    function litTo(h) {
      const upto = path.slice(0, h + 1);
      nodeEl.forEach((g, i) => {
        g.classList.toggle('is-visited', upto.includes(i));
        g.classList.toggle('is-nn', h >= path.length - 1 && i === bf.nnIdx);
      });
      // edges between consecutive path nodes up to h
      Object.values(edgeEl).forEach((ln) => ln.classList.remove('is-path'));
      for (let s = 0; s < h && s < path.length - 1; s++) {
        const key = path[s] + '-' + path[s + 1];
        if (edgeEl[key]) edgeEl[key].classList.add('is-path');
      }
      const cur = upto[upto.length - 1];
      if (cur != null) proto.focus(nodeEl[cur], [], { cx: sx(nodes[cur][0]), cy: sy(nodes[cur][1]), r: 18 });
    }

    return function update(k0) {
      const k = Math.min(k0, 3);               // toy path has only 4 steps; clamp the shared maxStep=5
      litTo(Math.min(k, path.length - 1));
      if (k <= 0) {
        litTo(0);
        const hop = hopTable[0];
        setRead(labels.readStart || 'greedy search — start at the entry node',
          hop ? [`${hop.at}: ${labels.dist || 'dist'} ${dShow(hop.atIdx, hop.atDist)}`] : []);
      } else if (k === 1) {
        const hop = hopTable[0];
        const lines = hop ? hop.neighbors.map((nb) => `${hop.at}→${nb.id}: ${dShow(nb.idx, nb.dist)}${nb.id === hop.moveTo ? '  ◀ ' + (labels.move || 'move') : ''}`) : [];
        setRead(`${labels.hop || 'hop'} 1 — ${hopTable[0] ? hopTable[0].at + '→' + hopTable[0].moveTo : ''}`, lines);
      } else if (k === 2) {
        const hop = hopTable[1];
        const lines = hop ? hop.neighbors.map((nb) => `${hop.at}→${nb.id}: ${dShow(nb.idx, nb.dist)}${nb.id === hop.moveTo ? '  ◀ ' + (labels.move || 'move') : ''}`) : [];
        if (hop && !hop.moveTo) lines.push(labels.localMin || 'all neighbours farther → local minimum, stop');
        setRead(`${labels.hop || 'hop'} 2 — ${labels.atNN || 'arrive at the nearest node'}`, lines);
      } else {
        const ef = `ef=1 → recall@1 ${trap.ef1 ? trap.ef1.recall : 0};  ef=3 → recall@1 ${trap.ef3 ? trap.ef3.recall : 1}`;
        setRead(`${greedy.path ? greedy.path.join('→') : ''} · ${labels.hops || 'hops'} ${greedy.hops} · recall@1 = ${greedy.recall}`,
          [`${bf.nn} ${labels.isNN || 'is the true nearest neighbour'} (${labels.dist || 'dist'} ${Number(bf.dist).toFixed(4)})`,
           labels.efKnob || 'the ef knob — a wider candidate list escapes a local-min trap:',
           ef]);
      }
    };
}

/* ── NEW: 12-node, 2-LAYER climb (toy2). Two visually distinct bands — an upper hub layer (L1) and the
   base layer (L0). The base-only greedy from baseEntry b0 TRAPS at a local minimum (no base edge crosses
   the gap to the right-hand cluster); restarting from the upper hub b2 lets one long-range L1 hop cross
   the gap, then a base-layer descent lands on the true NN b9. Recall contrast: base-only 0.0 vs hub 1.0.
   All geometry/distances/recall come from data.toy2 (l9-hnsw.json); all human text from labels.        */
function renderToy2({ host, data, labels, el }) {
  const toy = data.toy2 || {};
  const nodes = (toy.coords && toy.coords.nodes) || [];
  const names = toy.labels || nodes.map((_, i) => 'b' + i);
  const layersDef = toy.layers || [];
  const q = toy.query || [0, 0];
  const greedy = toy.greedy || {};
  const baseOnly = toy.baseOnly || {};
  const hopTable = toy.hopTable || {};
  const bf = toy.bruteForce || {};
  const idxOf = (name) => names.indexOf(name);

  // L1 = the upper hub layer (drawn as a higher band); L0 = the base layer (lower band). Each layer
  // gets its own member set + its own edge set from data; we render nodes TWICE (once per band) so the
  // two-layer structure is literal — an upper hub node is a ghost copy of its base node, joined by a
  // dashed "descend" connector. This makes "enter the hub, hop, then descend to base" visible.
  const L1 = layersDef.find((l) => l.layer === 1) || { members: [], edges: [] };
  const L0 = layersDef.find((l) => l.layer === 0) || { members: nodes.map((_, i) => i), edges: [] };

  // ── frame geometry: two horizontal bands. The data x-range is shared (so hub nodes sit above their
  //    base twins); each band gets its own y sub-range. ──
  const W = 520, PAD_L = 22, PAD_T = 26;        // widened from 480 → 520: the right cluster (b6..b11)
  const plotW = W - 2 * PAD_L;                  // packs 6 nodes; the extra width spreads them apart
  const bandH = 120, bandGap = 30;             // L1 band on top, L0 band below
  const l1Top = PAD_T, l0Top = PAD_T + bandH + bandGap;
  const xs = nodes.map((n) => n[0]).concat(q[0]);
  const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.08);
  const sx = (vx) => PAD_L + (vx - dx.min) / dx.span * plotW;
  // y within a band: spread base nodes by their data-y; hubs sit mid-band (few of them).
  const ysBase = nodes.map((n) => n[1]);
  const dyB = padDomain(Math.min(...ysBase), Math.max(...ysBase), 0.16);
  const syBase = (vy) => l0Top + bandH - (vy - dyB.min) / dyB.span * bandH;
  // hubs get a small vertical spread inside the upper band (their base-y mapped into a COMPRESSED
  // sub-range, 0.30..0.70 of the band) so the layer reads as a sparse graph occupying its band,
  // not a single rail. With only b2,b7 the spread is ~16px over the full width → the L1 edge b2-b7
  // stays horizontal-ish, as intended.
  const syHub = (vy) => {
    if (vy == null) return l1Top + bandH * 0.5;        // fallback: band centre
    const frac = (vy - dyB.min) / dyB.span;            // 0..1 within the shared y-domain
    return l1Top + bandH * (0.70 - frac * 0.40);       // higher data-y → higher in the band
  };

  const panelTop = l0Top + bandH + 26, panelRow = 20;
  const H = frameHeightFor(panelTop + 4 * panelRow, 12);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg hg-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

  // ── band backdrops + labels (so the two layers read as distinct levels) ──
  el('rect', { x: PAD_L - 12, y: l1Top - 8, width: plotW + 24, height: bandH + 16, rx: 8, class: 'hg-band hg-band-l1' }, svg);
  el('rect', { x: PAD_L - 12, y: l0Top - 8, width: plotW + 24, height: bandH + 16, rx: 8, class: 'hg-band hg-band-l0' }, svg);
  el('text', { x: PAD_L - 8, y: l1Top + 6, class: 'hg-bandlbl' }, svg).textContent = labels.layerHub || 'layer 1 — hubs';
  el('text', { x: PAD_L - 8, y: l0Top + 6, class: 'hg-bandlbl' }, svg).textContent = labels.layerBase || 'layer 0 — base';

  // ── query diamond (in the base band, at its data position) ──
  const qx = sx(q[0]), qy = syBase(q[1]);
  el('path', { d: `M${qx} ${qy - 9} L${qx + 9} ${qy} L${qx} ${qy + 9} L${qx - 9} ${qy} Z`, class: 'hg-query' }, svg);
  el('text', { x: qx + 12, y: qy + 4, class: 'hg-qlbl' }, svg).textContent = labels.query || 'query';

  // ── base-layer edges ──
  const baseEdgeEl = {};
  (L0.edges || []).forEach(([i, j]) => {
    const ln = el('line', { x1: sx(nodes[i][0]), y1: syBase(nodes[i][1]), x2: sx(nodes[j][0]), y2: syBase(nodes[j][1]), class: 'hg-edge' }, svg);
    baseEdgeEl[i + '-' + j] = ln; baseEdgeEl[j + '-' + i] = ln;
  });
  // ── hub-layer (L1) edges (long-range) ──
  const hubEdgeEl = {};
  (L1.edges || []).forEach(([i, j]) => {
    const ln = el('line', { x1: sx(nodes[i][0]), y1: syHub(nodes[i][1]), x2: sx(nodes[j][0]), y2: syHub(nodes[j][1]), class: 'hg-edge hg-edge-hub' }, svg);
    hubEdgeEl[i + '-' + j] = ln; hubEdgeEl[j + '-' + i] = ln;
  });
  // ── descend connectors: dashed L-elbow from each hub node down to its base twin. A STRAIGHT drop at
  //    the node's own x can pierce an intervening base node that shares that x (e.g. b2's column also
  //    holds b4) — so when the vertical corridor is blocked we jog the long vertical segment sideways
  //    to a clear x, then jog back into the base twin. The elbow stays in the empty mid-gap so it never
  //    re-enters a node circle. ──
  const baseScreen = nodes.map((n) => ({ x: sx(n[0]), y: syBase(n[1]) }));
  (L1.members || []).forEach((i) => {
    const hx = sx(nodes[i][0]), hy = syHub(nodes[i][1]);
    const tx = sx(nodes[i][0]), ty = syBase(nodes[i][1]);
    // is any OTHER base node inside the straight corridor (x within ±16, y strictly between hub & twin)?
    const blocked = baseScreen.some((p, j) => j !== i && Math.abs(p.x - hx) < 16 && p.y > hy + 4 && p.y < ty - 4);
    if (!blocked) {
      el('line', { x1: hx, y1: hy, x2: tx, y2: ty, class: 'hg-descend' }, svg);
    } else {
      // jog the long vertical segment to a clear lane: pick the side with more empty room, then a
      // single x that no base node sits near (scan outward from the column in the chosen direction).
      const dir = hx < plotW * 0.5 + PAD_L ? 1 : -1;   // jog toward the page interior / the big mid-gap
      let lane = hx + dir * 24;
      for (let g = 0; g < 8; g++) {
        const clear = baseScreen.every((p) => Math.abs(p.x - lane) > 18);
        if (clear) break;
        lane += dir * 14;
      }
      const yMid = hy + 18;                       // drop a little below the hub, then jog across
      el('path', { d: `M${hx} ${hy} V${yMid} H${lane} V${ty} H${tx}`, class: 'hg-descend' }, svg);
    }
  });

  // ── base nodes (every node) ──
  const baseNodeEl = nodes.map((n, i) => {
    const g = el('g', { class: 'hg-node', 'data-i': i }, svg);
    el('circle', { cx: sx(n[0]), cy: syBase(n[1]), r: 10, class: 'hg-dot' }, g);
    el('text', { x: sx(n[0]), y: syBase(n[1]) + 4, class: 'hg-nlbl', 'text-anchor': 'middle' }, g).textContent = names[i];
    return g;
  });
  // ── hub nodes (only L1 members; ghost copies in the upper band) ──
  const hubNodeEl = {};
  (L1.members || []).forEach((i) => {
    const g = el('g', { class: 'hg-node hg-hub', 'data-i': i }, svg);
    el('circle', { cx: sx(nodes[i][0]), cy: syHub(nodes[i][1]), r: 10, class: 'hg-dot' }, g);
    el('text', { x: sx(nodes[i][0]), y: syHub(nodes[i][1]) + 4, class: 'hg-nlbl', 'text-anchor': 'middle' }, g).textContent = names[i];
    hubNodeEl[i] = g;
  });

  const protoBase = makeProtagonist(svg, { haloClass: 'hg-halo', haloR: 17 });
  const protoHub = makeProtagonist(svg, { haloClass: 'hg-halo', haloR: 17 });

  // read-out panel
  const readHead = el('text', { x: PAD_L, y: panelTop, class: 'hg-readhead' }, svg);
  const readLines = [0, 1, 2].map((r) => el('text', { x: PAD_L, y: panelTop + (r + 1) * panelRow, class: 'hg-readline' }, svg));
  const setRead = (head, lines) => {
    readHead.textContent = head || '';
    readLines.forEach((ln, i) => { ln.textContent = (lines && lines[i]) || ''; });
  };

  const dShow = (d) => Number(d).toFixed(d === Math.round(d) ? 1 : 4);

  // visual reset helpers ──────────────────────────────────────────────
  function clearAll() {
    baseNodeEl.forEach((g) => g.classList.remove('is-visited', 'is-nn', 'is-trapped', 'is-entry'));
    Object.values(hubNodeEl).forEach((g) => g.classList.remove('is-visited', 'is-nn', 'is-entry'));
    Object.values(baseEdgeEl).forEach((ln) => ln.classList.remove('is-path', 'is-trap'));
    Object.values(hubEdgeEl).forEach((ln) => ln.classList.remove('is-path'));
    protoBase.clear(); protoHub.clear();
  }
  // light a path of node-NAMES across base edges (cls: 'is-path' | 'is-trap')
  function litBasePath(pathNames, edgeCls) {
    const idxs = pathNames.map(idxOf);
    idxs.forEach((i) => { if (baseNodeEl[i]) baseNodeEl[i].classList.add('is-visited'); });
    for (let s = 0; s < idxs.length - 1; s++) {
      const key = idxs[s] + '-' + idxs[s + 1];
      if (baseEdgeEl[key]) baseEdgeEl[key].classList.add(edgeCls);
    }
  }
  function litHubPath(pathNames) {
    const idxs = pathNames.map(idxOf);
    idxs.forEach((i) => { if (hubNodeEl[i]) hubNodeEl[i].classList.add('is-visited'); });
    for (let s = 0; s < idxs.length - 1; s++) {
      const key = idxs[s] + '-' + idxs[s + 1];
      if (hubEdgeEl[key]) hubEdgeEl[key].classList.add('is-path');
    }
  }
  const focusBase = (name) => { const i = idxOf(name); if (i >= 0) protoBase.focus(baseNodeEl[i], [], { cx: sx(nodes[i][0]), cy: syBase(nodes[i][1]), r: 17 }); };
  const focusHub = (name) => { const i = idxOf(name); if (hubNodeEl[i]) protoHub.focus(hubNodeEl[i], [], { cx: sx(nodes[i][0]), cy: syHub(nodes[i][1]), r: 17 }); };

  // format a hop's neighbour list, marking the chosen move
  const hopLines = (hop) => (hop && hop.neighbors ? hop.neighbors.map((nb) =>
    `${hop.at}→${nb.id}: ${dShow(nb.dist)}${nb.id === hop.moveTo ? '  ◀ ' + (labels.move || 'move') : ''}`) : []);

  return function update(k) {
    clearAll();
    if (k <= 0) {
      // both layers + the base entry lit
      const e = idxOf(toy.baseEntry || 'b0');
      if (baseNodeEl[e]) baseNodeEl[e].classList.add('is-entry');
      focusBase(toy.baseEntry || 'b0');
      setRead(labels.readStartBase || 'two layers: an upper hub band + the base band. Base-only greedy starts at the base entry.',
        [`${labels.baseEntry || 'base entry'}: ${toy.baseEntry || 'b0'}`,
         `${labels.entryHubLbl || 'hub entry'}: ${toy.entryHub || 'b2'}`]);
    } else if (k === 1) {
      // base-only greedy traps at a local min
      litBasePath(baseOnly.path || [], 'is-trap');
      const tr = idxOf(baseOnly.trappedAt || (baseOnly.path || []).slice(-1)[0]);
      if (baseNodeEl[tr]) baseNodeEl[tr].classList.add('is-trapped');
      focusBase(baseOnly.trappedAt || 'b4');
      const last = (hopTable.baseOnly || []).slice(-1)[0];
      setRead(`${labels.baseOnly || 'base-only greedy'}: ${(baseOnly.path || []).join('→')}`,
        [labels.trapped || 'no base edge crosses the gap → trapped at a local minimum',
         `${labels.trappedAt || 'trapped at'} ${baseOnly.trappedAt || 'b4'} · ${labels.recall || 'recall@1'} = ${baseOnly.recall}`,
         ...hopLines(last).slice(0, 1)]);
    } else if (k === 2) {
      // restart from the upper hub
      const he = idxOf(toy.entryHub || 'b2');
      if (hubNodeEl[he]) hubNodeEl[he].classList.add('is-entry');
      focusHub(toy.entryHub || 'b2');
      const h0 = (hopTable.L1 || [])[0];
      setRead(`${labels.restart || 'restart at the upper hub'}: ${toy.entryHub || 'b2'}`,
        [labels.hubWhy || 'the hub layer has long-range edges the base layer lacks',
         h0 ? `${h0.at}: ${labels.dist || 'dist'} ${dShow(h0.atDist)}` : '']);
    } else if (k === 3) {
      // L1 hub hop
      litHubPath(greedy.pathL1 || []);
      const dest = (greedy.pathL1 || []).slice(-1)[0];
      focusHub(dest);
      const h0 = (hopTable.L1 || [])[0];
      setRead(`${labels.hubHop || 'layer-1 hub hop'} — ${(greedy.pathL1 || []).join('→')}`,
        hopLines(h0).concat([labels.crossGap || 'the long-range edge crosses the gap to the right cluster']));
    } else if (k === 4) {
      // descend to base + the L0 hop to the NN
      litHubPath(greedy.pathL1 || []);
      litBasePath(greedy.pathL0 || [], 'is-path');
      const dest = (greedy.pathL0 || []).slice(-1)[0];
      focusBase(dest);
      const h0 = (hopTable.L0 || [])[0];
      setRead(`${labels.descend || 'descend to base, then the layer-0 hop'} — ${(greedy.pathL0 || []).join('→')}`,
        hopLines(h0));
    } else {
      // land on the true NN; recall contrast
      litHubPath(greedy.pathL1 || []);
      litBasePath(greedy.pathL0 || [], 'is-path');
      const nnIdx = idxOf(bf.nn);
      if (baseNodeEl[nnIdx]) { baseNodeEl[nnIdx].classList.add('is-nn'); }
      focusBase(bf.nn);
      setRead(`${(greedy.pathL1 || []).concat((greedy.pathL0 || []).slice(1)).join('→')} · ${labels.hops || 'hops'} ${greedy.hopsTotal} · recall@1 = ${greedy.recall}`,
        [`${bf.nn} ${labels.isNN || 'is the true nearest neighbour'} (${labels.dist || 'dist'} ${Number(bf.dist).toFixed(4)})`,
         labels.contrast || 'recall contrast:',
         `${labels.baseOnly || 'base-only'} recall@1 = ${baseOnly.recall}  vs  ${labels.hubEntry || 'hub-entry'} recall@1 = ${greedy.recall}`]);
    }
  };
}
