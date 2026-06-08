/* embedding-domains/logic.js — L5 'aside-embeddings-everywhere' beat: the SAME recipe —
   thing → tokens → vectors → one shared space — across four modalities (text/image/audio/protein),
   all four landing as colour-coded clusters in one shared 2-D plane.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrows) and the BOOK driver
   (Scrollama) both call setStep(k). Every domain name, 'thing' description, token label and point
   coordinate comes straight from data/l5-domains.json (toy illustrative coords — no facts-gate
   number is printed); all human prose comes from i18n keys in `labels`.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold,
   setStep clamp, window.mountEmbeddingDomains registration); render() only draws the figure layers.

   Steps (maxStep = 3):
     0  → four 'things' (sentence/image/waveform/protein) around an empty shared plane.  caption s0
     1  → each thing fans out into its four token labels.                                caption s1
     2  → embed: each token becomes a dot at its points[i] in the shared space.          caption s2
     3  → the shared space made explicit: axes frame + legend (the CLIP basis).          caption s3 */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor } from '../_plot-util.js';

// domain id → theme-token colour + the corner the cluster sits in (for label/token placement).
const DOMAIN = {
  text:    { color: 'var(--accent, #2A6FDB)',  labelKey: 'dmText',    corner: 'tl' },
  image:   { color: 'var(--c-violet, #7D5BA6)', labelKey: 'dmImage',   corner: 'tr' },
  audio:   { color: 'var(--c-amber, #E0A82E)',  labelKey: 'dmAudio',   corner: 'bl' },
  protein: { color: 'var(--c-green, #3A8A5C)',  labelKey: 'dmProtein', corner: 'br' },
};

export const mountEmbeddingDomains = defineWidget({
  id: 'embedding-domains',
  rootClass: 'ed-root',
  exportName: 'mountEmbeddingDomains',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const domains = data.domains || [];

    // ── frame geometry: one square plane (the shared space), responsive width ──
    const W = 480;
    const PAD_L = 14, PAD_T = 30;
    const plotH = 300;
    const box = { x: PAD_L, y: PAD_T, w: W - 2 * PAD_L, h: plotH };

    // pad the coord domain across ALL points so clusters + their labels stay in-frame.
    const allX = [], allY = [];
    domains.forEach((dm) => (dm.points || []).forEach(([x, y]) => { allX.push(x); allY.push(y); }));
    const dx = padDomain(Math.min(...allX), Math.max(...allX), 0.22);
    const dy = padDomain(Math.min(...allY), Math.max(...allY), 0.22);
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;   // data +y → top

    // legend sits below the plane; size the box to fit it.
    const legTop = PAD_T + plotH + 18;
    const legRow = 18;
    const legRows = Math.ceil(domains.length / 2);
    const H = frameHeightFor(legTop + legRows * legRow, 12);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg ed-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // the plane frame (faint at s0–s2, emphasised + titled at s3)
    const frameRect = el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'ed-frame' }, svg);
    // centre cross-hairs (the shared axes), shown from s2 onward
    layer('axes', 2);
    add('axes', el('line', { x1: box.x, y1: (sy(0)), x2: box.x + box.w, y2: sy(0), class: 'ed-axis' }, svg));
    add('axes', el('line', { x1: sx(0), y1: box.y, x2: sx(0), y2: box.y + box.h, class: 'ed-axis' }, svg));
    const planeTtl = el('text', { x: box.x + box.w / 2, y: box.y - 10, class: 'ed-title',
      'text-anchor': 'middle' }, svg);
    planeTtl.textContent = labels.planeTitle || 'one shared embedding space';

    // per-domain cluster centroid in screen space (for placing the domain label + token list).
    function centroid(dm) {
      const pts = dm.points || [];
      const cx = pts.reduce((a, [x]) => a + sx(x), 0) / pts.length;
      const cy = pts.reduce((a, [, y]) => a + sy(y), 0) / pts.length;
      return { cx, cy };
    }

    domains.forEach((dm) => {
      const meta = DOMAIN[dm.id] || { color: 'var(--ink-3, #6B7280)', corner: 'tl' };
      const { cx, cy } = centroid(dm);
      const dmName = labels[meta.labelKey] || dm.id;

      // anchor for the domain's text block: pushed toward its corner, clear of the dots.
      // The block stacks 4 rows DOWN from `ty`: name (ty), thing (ty+13), tokentag (ty+27),
      // then nTok token rows at ty+41 + i*13. For BOTTOM corners we solve `ty` so the LAST token
      // row lands just inside the bottom edge (box.y+box.h-8) — the old formula overshot by ~4px
      // and the last token ("frame t=3" / "G") was clipped by the frame.
      const nTok = (dm.tokens || []).length;
      const blockH = 41 + Math.max(0, nTok - 1) * 13;     // ty → last token-row baseline
      const tx = meta.corner[1] === 'l' ? box.x + 8 : box.x + box.w - 8;
      const anchor = meta.corner[1] === 'l' ? 'start' : 'end';
      const ty = meta.corner[0] === 't' ? box.y + 16 : box.y + box.h - 8 - blockH;

      // ── STEP 0: the 'thing' label (one per domain) ────────────────────────
      layer('thing-' + dm.id, 0);
      add('thing-' + dm.id, el('text', { x: tx, y: ty, class: 'ed-dmname',
        'text-anchor': anchor, fill: meta.color }, svg)).textContent = dmName;
      add('thing-' + dm.id, el('text', { x: tx, y: ty + 13, class: 'ed-thing',
        'text-anchor': anchor }, svg)).textContent = dm.thing || '';

      // ── STEP 1: the token labels fan out under the 'thing' ────────────────
      layer('tokens-' + dm.id, 1);
      add('tokens-' + dm.id, el('text', { x: tx, y: ty + 27, class: 'ed-tokentag',
        'text-anchor': anchor }, svg)).textContent =
        (dm.token ? dm.token + ' ' : '') + (labels.tokensTag || '→ tokens');
      (dm.tokens || []).forEach((tk, i) => {
        add('tokens-' + dm.id, el('text', { x: tx, y: ty + 41 + i * 13, class: 'ed-token',
          'text-anchor': anchor }, svg)).textContent = tk;
      });

      // ── STEP 2: the dots land in the shared plane (one per token) ─────────
      layer('dots-' + dm.id, 2);
      (dm.points || []).forEach(([x, y], i) => {
        const dotX = sx(x), dotY = sy(y);
        add('dots-' + dm.id, el('circle', { cx: dotX, cy: dotY, r: 5, class: 'ed-dot',
          fill: meta.color, stroke: 'var(--bg-card, #fff)', 'stroke-width': 1 }, svg));
        // a faint "embed" tag near the first dot. It is nudged toward the PLANE CENTRE (away from the
        // corner where the token labels stack) so it no longer collides with the patch/token labels,
        // and clamped so its own box stays inside the plane.
        if (i === 0) {
          // place the tag well TOWARD THE PLANE CENTRE (away from the corner text block) and clamp it
          // inside the plane, so it clears the "thing"/token labels stacked in this domain's corner.
          const towardCx = meta.corner[1] === 'l' ? 34 : -34;     // left-corner → push right, etc.
          const towardCy = meta.corner[0] === 't' ? 26 : -22;     // top-corner → push down, etc.
          const exX = Math.max(box.x + 26, Math.min(box.x + box.w - 26, dotX + towardCx));
          const exY = Math.max(box.y + 14, Math.min(box.y + box.h - 8, dotY + towardCy));
          add('dots-' + dm.id, el('text', { x: exX, y: exY, class: 'ed-embedtag',
            'text-anchor': 'middle', fill: meta.color }, svg))
            .textContent = labels.embedTag || '→ embed';
        }
      });
    });

    // ── STEP 3: the legend (colour chip + domain name) below the plane ────────
    layer('legend', 3);
    domains.forEach((dm, i) => {
      const meta = DOMAIN[dm.id] || { color: 'var(--ink-3, #6B7280)' };
      const col = i % 2, row = Math.floor(i / 2);
      const lx = box.x + 8 + col * (box.w / 2);
      const ly = legTop + row * legRow;
      const g = el('g', {}, svg);
      el('rect', { x: lx, y: ly - 8, width: 10, height: 10, rx: 2, fill: meta.color }, g);
      el('text', { x: lx + 16, y: ly, class: 'ed-leglbl' }, g).textContent =
        (labels[meta.labelKey] || dm.id) + ' · ' + (dm.token || '');
      add('legend', g);
    });

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const node of L.nodes) node.classList.toggle('is-hidden', !on);
      }
      // the plane title + frame emphasis only at the final "shared space" beat.
      planeTtl.classList.toggle('is-hidden', k < 3);
      frameRect.classList.toggle('ed-frame-strong', k >= 3);
    };
  },
});
