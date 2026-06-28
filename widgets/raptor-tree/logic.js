/* raptor-tree/logic.js — L10 'frontier' beat: RAPTOR's recursive abstractive tree. Cluster + summarize
   leaf chunks into higher nodes, recurse to a single root. The committed toy shape is 8 leaf chunks →
   3 cluster summaries → 1 root (depth 3). The payoff: retrieval can pull from ANY level — a high node
   answers a broad/zoomed-out question, a leaf answers a zoomed-in detail — so one index serves both.
   Sarthi et al. 2024 (ICLR, arXiv:2401.18059).

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. Every count (the level sizes 8/3/1,
   the depth, the fan-in) comes from data/l10-raptor.json (facts-gated); all human text from i18n
   `labels`. Built on _widget-base.js + _layout.js (stack() lays each level's nodes in a row). The tree
   is built BOTTOM-UP (leaves first), so setStep grows it the way RAPTOR actually constructs it.

   Steps (maxStep = 4):
     0  → level 0: the 8 leaf chunks.                                                         s0
     1  → cluster + summarize → level 1: 3 mid summaries (fan-in 8 → 3), edges drawn.          s1
     2  → recurse → level 2: 1 root summary (fan-in 3 → 1).                                    s2
     3  → a BROAD query lands at the ROOT (overview level).                                    s3
     4  → a DETAIL query lands at a LEAF (any level is retrievable).                           s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';
import { stack } from '../_layout.js';

export const mountRaptorTree = defineWidget({
  id: 'raptor-tree',
  rootClass: 'rp-root',
  exportName: 'mountRaptorTree',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const tree = data.tree || {};
    const levels = (tree.levels || []).map((lv) => (lv && typeof lv.n === 'number') ? lv.n : 0);
    const depth = tree.depth || levels.length;
    const nLevels = levels.length;                 // [8, 3, 1] → 3 levels, leaf=0 .. root=top

    const W = 560, PAD = 26;
    const topPad = 30;                              // room for the section label
    const levelGap = 92, nodeH = 30, nodeMaxW = 64;
    // level index 0 = LEAVES (bottom); the root is the LAST level (top). Draw root at top of SVG.
    const levelY = (li) => topPad + 24 + (nLevels - 1 - li) * levelGap;
    const readTop = levelY(0) + nodeH + 34;
    const H = frameHeightFor(readTop + 22, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg rp-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // section label
    layer('hdr', 0);
    add('hdr', el('text', { x: PAD, y: 20, class: 'rp-sectlbl' }, svg))
      .textContent = (labels.title || 'Recursive summary tree') + ' · ' + (labels.depth || 'depth') + ' = ' + depth;

    // ── lay every level's node boxes (so edges can target real coordinates) ──
    const levelBoxes = levels.map((n, li) => {
      const w = Math.min(nodeMaxW, (W - 2 * PAD - 16 * (n - 1)) / Math.max(1, n));
      const span = n * w + 16 * (n - 1);
      const rect = { x: (W - span) / 2, y: levelY(li), w: span, h: nodeH };
      return stack(rect, n, { gap: 16 });
    });

    // node classes per level: leaves neutral, mid = accent (summary), root = warm (overview)
    const levelCls = (li) => li === 0 ? 'rp-leaf' : (li === nLevels - 1 ? 'rp-root-node' : 'rp-summary');
    const levelTag = (li) => li === 0 ? (labels.leaf || 'leaf') : (li === nLevels - 1 ? (labels.root || 'root') : (labels.summary || 'summary'));

    // ── edges: each higher node fans IN from a contiguous slice of the level below ──
    // (toy clustering: split the lower level's nodes evenly across this level's nodes)
    function fanInEdges(name, fromStep, lowerLi, upperLi) {
      layer(name, fromStep);
      const lower = levelBoxes[lowerLi], upper = levelBoxes[upperLi];
      const per = Math.ceil(lower.length / Math.max(1, upper.length));
      lower.forEach((lb, i) => {
        const parent = upper[Math.min(upper.length - 1, Math.floor(i / per))];
        add(name, el('line', {
          x1: lb.x + lb.w / 2, y1: lb.y,
          x2: parent.x + parent.w / 2, y2: parent.y + parent.h, class: 'rp-edge'
        }, svg));
      });
      // fan-in count caption between the two levels
      add(name, el('text', { x: W - PAD, y: (lower[0].y + upper[0].y + upper[0].h) / 2, class: 'rp-fanin', 'text-anchor': 'end' }, svg))
        .textContent = `${lower.length} → ${upper.length} (${labels.fanin || 'fan-in'})`;
    }

    // ── draw level nodes; level li appears at step li (built bottom-up) ──
    const nodeEls = levelBoxes.map((boxes, li) => {
      const name = 'lvl' + li;
      layer(name, li);
      // level tag sits ABOVE its node row (start-anchored, x=4) rather than on the row centre —
      // so it never shares the node band: the n=8 leaf row left edge (≈x26) no longer collides
      // with a wide localized tag ('summary' / RU 'лист') that previously sat at the same y.
      add(name, el('text', { x: 4, y: levelY(li) - 6, class: 'rp-leveltag', 'text-anchor': 'start' }, svg))
        .textContent = levelTag(li);
      return boxes.map((b, i) => {
        const g = el('g', { class: 'rp-nodeg' }, svg);
        add(name, g);
        el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 6, class: 'rp-node ' + levelCls(li) }, g);
        el('text', { x: b.x + b.w / 2, y: b.y + nodeH / 2 + 4, class: 'rp-nodelbl', 'text-anchor': 'middle' }, g).textContent = (i + 1);
        return g;
      });
    });

    // fan-in edge layers (level li → li+1) appear when the UPPER level appears (step li+1)
    for (let li = 0; li + 1 < nLevels; li++) fanInEdges('edge' + li, li + 1, li, li + 1);

    // ── query markers: a BROAD query → root (step 3); a DETAIL query → a leaf (step 4) ──
    const rootBox = levelBoxes[nLevels - 1] && levelBoxes[nLevels - 1][0];
    const leafBox = levelBoxes[0] && levelBoxes[0][Math.floor((levels[0] - 1) / 2)]; // a middle leaf

    layer('q-broad', 3);
    if (rootBox) {
      const qx = rootBox.x + rootBox.w / 2;
      add('q-broad', el('text', { x: qx, y: rootBox.y - 14, class: 'rp-querylbl is-broad', 'text-anchor': 'middle' }, svg))
        .textContent = labels.broadQuery || 'broad query → overview';
      add('q-broad', el('path', { d: `M${qx} ${rootBox.y - 10} l-5 -8 l10 0 z`, class: 'rp-qarrow is-broad' }, svg));
    }
    layer('q-detail', 4);
    if (leafBox) {
      const qx = leafBox.x + leafBox.w / 2;
      add('q-detail', el('text', { x: qx, y: leafBox.y + nodeH + 24, class: 'rp-querylbl is-detail', 'text-anchor': 'middle' }, svg))
        .textContent = labels.detailQuery || 'detail query → leaf';
      add('q-detail', el('path', { d: `M${qx} ${leafBox.y + nodeH + 10} l-5 8 l10 0 z`, class: 'rp-qarrow is-detail' }, svg));
    }

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
      }
      // highlight the level a query targets
      const rootLi = nLevels - 1;
      nodeEls.forEach((els, li) => els.forEach((g) => {
        g.classList.toggle('is-target', (k >= 3 && li === rootLi) || (k >= 4 && li === 0));
      }));
    };
  },
});
