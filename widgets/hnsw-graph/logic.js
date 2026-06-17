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
     3  → n2 IS the brute-force NN (0.7071) → recall@1 = 1.0; the ef-knob trap note.         s3 */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor, makeProtagonist } from '../_plot-util.js';

export const mountHnswGraph = defineWidget({
  id: 'hnsw-graph',
  rootClass: 'hg-root',
  exportName: 'mountHnswGraph',
  maxStep: 3,
  render({ host, data, labels, el }) {
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

    return function update(k) {
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
  },
});
