/* query-tree/logic.js — L10 'query-understanding' beat: two ways to RESHAPE a query before retrieval.

   PART A — DECOMPOSITION FAN-OUT. A multi-part question asks two things at once ("Does the heart pump
   faster during exercise, AND what controls that rate?"). Binary answer-containment shows why a single
   retrieval fails: each sub-answer sits in its OWN chunk (recallSub = [1,1]), but no single chunk holds
   BOTH facts (recallJoint = 0). Split the question into 2 sub-questions, retrieve each separately, and
   both facts come back. One question → two branches → two hits.

   PART B — STEP-BACK LADDER. Instead of fanning out, abstract UP: take a too-specific question, restate
   it as a generic one, retrieve the underlying PRINCIPLE, then answer the specific. A 3-rung ladder:
   specific → generic → principle (Zheng et al. 2023, arXiv:2310.06117).

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. Every fact (the question, the two
   sub-questions, recallSub/recallJoint, the three step-back rungs) comes from data/l10-decomp.json
   (facts-gated); all human text from i18n `labels`. Built on _widget-base.js + _layout.js (stack()).

   Steps (maxStep = 4):
     0  → the multi-part question (the root node).                                            s0
     1  → fan out: root → 2 sub-questions (two branches drawn).                               s1
     2  → each sub-question retrieves its own chunk: recallSub=[1,1] ✓✓; recallJoint=0 ✗.     s2
     3  → switch to the step-back ladder: the SPECIFIC question (bottom rung).                s3
     4  → abstract → GENERIC question → retrieve the PRINCIPLE (top rung) → answer specific.  s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';
import { stack } from '../_layout.js';

// wrap a string into ≤maxChars lines (greedy by word) so long questions fit a node box
function wrapLines(s, maxChars) {
  const words = String(s || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

export const mountQueryTree = defineWidget({
  id: 'query-tree',
  rootClass: 'qt-root',
  exportName: 'mountQueryTree',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const question = data.question || '';
    const subs = data.subQuestions || [];
    const recallSub = data.recallSub || [];
    const recallJoint = (data.recallJoint != null) ? data.recallJoint : 0;
    const sb = data.stepBack || {};

    const W = 560, PAD = 22;
    const fanTop = 36;                          // PART A vertical band
    const rootY = fanTop, rootH = 50;
    const subY = rootY + rootH + 64;            // sub-question row
    const subH = 58, chunkY = subY + subH + 40, chunkH = 28;
    const fanBottom = chunkY + chunkH + 34;     // where the recall verdict sits

    const ladderTop = fanBottom + 44;           // PART B step-back ladder
    const rungH = 46, rungGap = 30;
    const rungY = (i) => ladderTop + 28 + i * (rungH + rungGap);
    const nRungs = 3;
    const ladderBottom = rungY(nRungs - 1) + rungH + 6;

    const H = frameHeightFor(ladderBottom + 14, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg qt-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // helper: a rounded node box with centered, wrapped text
    function nodeBox(name, box, text, cls, maxChars) {
      add(name, el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 8, class: cls }, svg));
      const lines = wrapLines(text, maxChars || 46);
      const lh = 13, startY = box.y + box.h / 2 - ((lines.length - 1) * lh) / 2 + 4;
      lines.forEach((ln, i) => {
        add(name, el('text', { x: box.x + box.w / 2, y: startY + i * lh, class: 'qt-nodetext', 'text-anchor': 'middle' }, svg))
          .textContent = ln;
      });
    }

    // ── PART A: decomposition fan-out ──────────────────────────────────────────
    layer('a-section', 0);
    add('a-section', el('text', { x: PAD, y: 20, class: 'qt-sectlbl' }, svg))
      .textContent = labels.fanTitle || 'A · Decomposition fan-out';

    // root node (the multi-part question) — step 0
    layer('a-root', 0);
    const rootBox = { x: PAD + 90, y: rootY, w: W - 2 * PAD - 180, h: rootH };
    nodeBox('a-root', rootBox, question, 'qt-node qt-root-node', 60);

    // two sub-question branches — step 1
    layer('a-branch', 1);
    const subBoxes = stack({ x: PAD, y: subY, w: W - 2 * PAD, h: subH }, subs.length || 2, { gap: 28 });
    const chunkBoxes = stack({ x: PAD, y: chunkY, w: W - 2 * PAD, h: chunkH }, subs.length || 2, { gap: 28 });
    subs.forEach((sq, i) => {
      const sb2 = subBoxes[i];
      // edge: root → sub-question
      add('a-branch', el('line', {
        x1: rootBox.x + rootBox.w / 2, y1: rootBox.y + rootBox.h,
        x2: sb2.x + sb2.w / 2, y2: sb2.y, class: 'qt-edge'
      }, svg));
      nodeBox('a-branch', sb2, (labels.subPrefix || 'sub') + (i + 1) + ': ' + sq, 'qt-node qt-sub-node', 32);
    });

    // ── PART A step 2: each sub retrieves its own chunk → recallSub; joint fails ──
    layer('a-retrieve', 2);
    subs.forEach((_, i) => {
      const sb2 = subBoxes[i], cb = chunkBoxes[i];
      const hit = recallSub[i] ? 1 : 0;
      add('a-retrieve', el('line', { x1: sb2.x + sb2.w / 2, y1: sb2.y + sb2.h, x2: cb.x + cb.w / 2, y2: cb.y, class: 'qt-edge' }, svg));
      add('a-retrieve', el('rect', { x: cb.x, y: cb.y, width: cb.w, height: cb.h, rx: 6, class: 'qt-chunk ' + (hit ? 'is-hit' : 'is-miss') }, svg));
      add('a-retrieve', el('text', { x: cb.x + cb.w / 2, y: cb.y + cb.h / 2 + 4, class: 'qt-chunklbl', 'text-anchor': 'middle' }, svg))
        .textContent = `${labels.chunk || 'chunk'} ${hit ? '✓' : '✗'} · recall=${hit}`;
    });
    add('a-retrieve', el('text', { x: W / 2, y: fanBottom, class: 'qt-verdict', 'text-anchor': 'middle' }, svg))
      .textContent = `${labels.recallSub || 'recall per sub'} = [${recallSub.join(', ')}] ✓✓ · `
        + `${labels.recallJoint || 'recall on one joint retrieval'} = ${recallJoint} ✗`;

    // ── PART B: step-back ladder ────────────────────────────────────────────────
    layer('b-section', 3);
    add('b-section', el('line', { x1: PAD, y1: ladderTop, x2: W - PAD, y2: ladderTop, class: 'qt-divider' }, svg));
    add('b-section', el('text', { x: PAD, y: ladderTop + 18, class: 'qt-sectlbl' }, svg))
      .textContent = labels.stepBackTitle || 'B · Step-back ladder';

    // rungs bottom→top: specific (rung 2, drawn at step 3) → generic → principle (rungs 1,0 at step 4)
    const rungData = [
      { text: sb.principleRetrieved || sb.generic || '', tag: labels.principle || 'principle', cls: 'qt-rung is-principle', from: 4 },
      { text: sb.generic || '', tag: labels.generic || 'generic', cls: 'qt-rung is-generic', from: 4 },
      { text: sb.specific || '', tag: labels.specific || 'specific', cls: 'qt-rung is-specific', from: 3 },
    ];
    rungData.forEach((r, i) => {
      const name = 'b-rung' + i;
      layer(name, r.from);
      const box = { x: PAD + 70, y: rungY(i), w: W - 2 * PAD - 70, h: rungH };
      add(name, el('text', { x: PAD, y: rungY(i) + rungH / 2 + 4, class: 'qt-rungtag' }, svg)).textContent = r.tag;
      nodeBox(name, box, r.text, r.cls, 58);
      // upward arrow from the rung below (abstraction direction): drawn at step 4
      if (i < nRungs - 1) {
        const up = 'b-arrow' + i;
        layer(up, 4);
        const cx = box.x + box.w / 2;
        add(up, el('line', { x1: cx, y1: rungY(i + 1), x2: cx, y2: rungY(i) + rungH, class: 'qt-uparrow' }, svg));
        add(up, el('path', { d: `M${cx} ${rungY(i) + rungH} l-5 9 l10 0 z`, class: 'qt-uparrowhead' }, svg));
      }
    });

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
      }
    };
  },
});
