/* ncd-embedding/logic.js — the embedding layer E: V→ℝᵐ in the neural-circuit-diagram lens.
   A token selects its row from the learned V×m vocabulary table (a one-hot × matrix product); over a
   sequence the same lookup is broadcast over the token axis n. Structural (illustrative cells, no
   grounded numbers). Step 0 = single lookup · 1 = it's a one-hot selection · 2 = broadcast over n.
   DRIVER-AGNOSTIC, ON-BRAND (tokens + semantic contract), COLLISION-FREE (detector-verified).

   WHY WORDS IS SHUFFLED. It used to read ['the','cat','dog','sat','run'] — a semantically sorted table
   with "cat" sitting directly above "dog" — while the caption claimed "nearby meanings end up as nearby
   ROWS". Both were false, and worse, they propped each other up: the row index is a TOKEN ID handed out
   by the vocabulary in BPE-merge order, so it carries no semantic structure at all, and nothing
   downstream (the dot product in ncd-attention, MaxSim in ncd-retrieval, the graph walk in ncd-ann)
   ever touches index proximity. What ends up close is the POINT in ℝᵐ, never the row. The order below
   is deliberately arbitrary — cat is NOT adjacent to dog — so the figure stops arguing with its caption. */
import { defineWidget } from '../_widget-base.js';
import { glyphs } from '../_ncd.js';
import { stack } from '../_layout.js';

export const mountNcdEmbedding = defineWidget({
  id: 'ncd-embedding',
  rootClass: 'ncdemb-root',
  exportName: 'mountNcdEmbedding',
  maxStep: 2,
  render({ host, labels, el }) {
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const W = 760, H = 300;
    const svg = el('svg', { class: 'ncdemb-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'Embeddings as a neural circuit diagram') }, host);

    // arbitrary order = a real vocabulary's order. "cat" is row 1; "dog" is row 3, nowhere near it.
    const WORDS = ['run', 'cat', 'the', 'dog', 'sat'];
    //  step 0/1 → the single token “cat” (row 1) · step 2 → the sequence “the cat sat” (rows 2, 1, 4)
    const SEL = { 0: [1], 1: [1], 2: [1, 2, 4] };            // rows highlighted per step
    const rows = stack({ x: 150, y: 66, w: 300, h: 196 }, 5, { dir: 'col', gap: 8 });
    const cy = (i) => rows[i].y + rows[i].h / 2;
    const midY = (cy(0) + cy(4)) / 2;
    const cellX = 214, cellStep = 28, cellW = 26, cols = 6, cellEnd = cellX + (cols - 1) * cellStep + cellW;
    const outX = 476;
    const drawCells = (g, x, y, sel) => { for (let j = 0; j < cols; j++)
      el('rect', { class: sel ? 'ncdemb-cell-sel' : 'ncdemb-cell', x: x + j * cellStep, y: y - 9, width: cellW, height: 18, rx: 2 }, g); };

    let main = null;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const g = main, sel = SEL[step], seq = step === 2;

      // the learned vocabulary matrix E
      G.text(g, (cellX + cellEnd) / 2, cy(0) - 26, L('lblTable', 'E · vocabulary V × m'), 'ncdemb-title');
      WORDS.forEach((w, i) => {
        const on = sel.includes(i);
        if (on) el('rect', { class: 'ncdemb-row-sel', x: 148, y: cy(i) - 15, width: (cellEnd + 6) - 148, height: 30, rx: 6 }, g);
        G.text(g, 200, cy(i) + 4, w, 'ncdemb-word' + (on ? ' ncdemb-word-sel' : ''), 'end');
        drawCells(g, cellX, cy(i), on);
      });

      // input (left)
      if (!seq) {
        const ty = cy(1);
        el('rect', { class: 'ncdemb-tok', x: 40, y: ty - 16, width: 68, height: 32, rx: 8 }, g);
        G.text(g, 74, ty + 5, '“cat”', 'ncdemb-tok-txt');
        G.wire(g, 'ncdemb-w ncdemb-w-sel', 108, ty, 146, ty, { arrow: true });
        G.text(g, 74, ty - 24, L('lblToken', 'token'), 'ncdemb-legend');
        if (step === 1) G.text(g, 74, ty + 30, L('lblSel', 'one-hot × E = row'), 'ncdemb-anno');
      } else {
        el('rect', { class: 'ncdemb-tok', x: 30, y: midY - 18, width: 88, height: 36, rx: 8 }, g);
        G.text(g, 74, midY + 5, L('lblSeq', 'n tokens'), 'ncdemb-tok-txt');
        /* broadcast weave over the lookup. The tag MEASURES its own text (G.tagBox) — the old chars ×
           6.2px guess burst in Cyrillic — and it rides ON the woven wire by design (the tag names the
           wire it sits on), so it declares `ncd-onwire` for the wire-through-shape check. */
        const tag = L('tagSeq', 'broadcast over n tokens');
        el('path', { class: 'ncdemb-weave', d: `M120,${cy(0) - 30} C200,${cy(0) - 44} ${cellEnd - 40},${cy(0) - 44} ${cellEnd + 24},${cy(0) - 30}` }, g);
        // −45, not −41: a MEASURED box is a couple of px taller than the old guessed 18px one, and at −41
        // its lower edge dipped into the "E · vocabulary V × m" title underneath. The weave's apex is at
        // cy(0)−40.5, so the tag still sits squarely ON the wire it names.
        const mx = (120 + cellEnd + 24) / 2;
        G.tagBox(g, mx, cy(0) - 45, tag, 'ncdemb-tag ncd-onwire', 'ncdemb-tag-txt', 8, 4);
        sel.forEach((i) => G.wire(g, 'ncdemb-w', 118, cy(i), 146, cy(i), {}));
      }

      // output (right): the selected row(s) as m-vectors → an n×m matrix for a sequence
      sel.forEach((i) => {
        G.wire(g, 'ncdemb-w ncdemb-w-sel', cellEnd + 4, cy(i), outX - 6, cy(i), { arrow: true });
        drawCells(g, outX, cy(i), true);
      });
      const oy = cy(Math.min(...sel));   // sit the shape label over the TOPMOST output row, whatever it is
      G.text(g, outX + (cellEnd - cellX) / 2, oy - 20, seq ? L('lblMat', 'n × m') : L('lblVec', '∈ ℝᵐ'), 'ncdemb-vec-lbl');

      G.text(g, W / 2, H - 6, L('legMap', 'token → select its row → m-vector'), 'ncdemb-legend');
    };
  },
});
