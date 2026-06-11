#!/usr/bin/env node
/* =========================================================
   slide-viz-gate.mjs — the visual-SEMANTICS gate the box/contrast gates are BLIND to.

   The existing gates (visual-gate, responsive-gate, scroll-step-gate) all pass HARD=0
   on the L5/L6 stepped figures while those figures visibly suffer three defect CLASSES:

     (1) STEP-PROGRESSION   — "everything appears at step 0" instead of a real
                              progressive reveal, OR a later step that adds NOTHING
                              new (a dead step). The box/contrast gates only ever look
                              at ONE static frame, so they cannot see a missing reveal.
     (2) OVERLAP / OOB      — two DISTINCT text labels printed on top of each other, or
                              an element whose box spills OUTSIDE the SVG/frame viewBox.
                              visual-gate checks <img> vs the 1920×1080 SLIDE frame but is
                              blind to overlap/overflow INSIDE an SVG figure. This now also
                              covers TEXT-OVER-TEXT OVERPRINT across BOTH namespaces (SVG
                              <text> ∪ HTML overlay) via a smaller-box-coverage metric — the
                              case IoU was blind to (a wide title sitting on a narrow column
                              header: s30 / glove-cooccur). [DETECTOR B]
     (3) COLOR-COLLISION    — two semantically-distinct shapes painted in near-identical
                              colours (so the viewer cannot tell the categories apart),
                              too few distinct hues for the number of categories, or a
                              fill that is near-black / near-background (the "void").
     (4) DOUBLE-PAINT       — a SATURATED, ≥2px stroke applied to an SVG <text> (e.g. the
                              global `[data-arch-step].is-arch-current{stroke:accent;
                              stroke-width:4}` rule strokes the glyphs and GARBLES them:
                              hit s38 LayerNorm AND s31 GloVe). The LEGIT near-white / near-bg
                              halo (paint-order:stroke, -webkit-text-stroke) stays silent.
                              [DETECTOR A]

   It reuses the rendering harness of the sibling gates:
     • DECK slides  — same chromium + Lectures/ static server + theme toggle + #/N hash
                      navigation + ArrowRight stepping as visual-gate / reaudit2-deck-step.
     • BOOK widgets — same docs/ static server (GH-Pages base) as responsive-gate, then
                      drives each widget through window.__figs[beat].setStep(k) (the page's
                      own headless verification hook) — far more reliable than scroll sync.

   Per TARGET, at EVERY step, in BOTH themes, it captures the set of VISIBLE meaningful
   elements (+ a per-element "salience signature": box + fill/stroke + highlight class)
   and runs the three detectors. Output: a per-target defect inventory with measured
   values (step-0 coverage %, overlap IoU, colour ΔE).

   Usage:
     node _audit/slide-viz-gate.mjs              # scan the L5/L6 targets, print inventory
     node _audit/slide-viz-gate.mjs --selftest   # 3 planted fixtures must each fire
     node _audit/slide-viz-gate.mjs --json out.json   # also dump machine-readable report

   EXIT: a CONTRACT HARD defect (off-token / off-contract literal) ALWAYS fails the process
   (the decks are token-clean, so the contract is a real build gate now). The rendered
   detectors stay LENIENT by default (--strict makes their HARD findings fail too).
   ========================================================= */
import { chromium } from 'playwright';
import { HARDENED, serveDir } from './lib/gate-harness.mjs';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './lib/paths.mjs';

const ROOT = REPO_ROOT;
const LECT = join(ROOT, 'Lectures');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
// Free-port static servers (gate-harness serveDir → no hardcoded-port collision); set in main().
let dsrv = null, bsrv = null;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
  '.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.map':'application/json' };

// ───────────────────────── thresholds (tuned for few false positives) ─────────────────────────
const TH = {
  OPACITY_MIN: 0.2,           // an element below this computed opacity reads as not-shown. A
                              //   reveal-PENDING placeholder painted at ~0.16 (positional-enc fades
                              //   its not-yet-revealed grid rows to opacity:0.16 at step 0, then to
                              //   1.0 at step 1) is unreadable over a busy heatmap and must NOT count
                              //   as a shown mark — otherwise the count is flat 103→103 and the genuine
                              //   step-1 fade-in reveal is misread as a DEAD step. A genuine de-emphasis
                              //   (a 0.5-opacity dimmed-but-present element) stays well above this and is
                              //   still counted as shown.
  STEP0_COVER: 0.85,          // step-0 shows ≥85% of the final element count → "everything at once"
  DEAD_STEP_DELTA: 0.001,     // a later step whose salience signature is unchanged → dead step
  IOU_OVERLAP: 0.45,          // text-label IoU above this → significant overlap
  CENTER_PX: 6,               // OR label centres within this many px → stacked
  OOB_PAD: 1.5,               // px an element may poke past the viewBox before it's OOB
  DELTA_E_MIN: 9,             // CIE76 ΔE below this between DISTINGUISHABLE shapes → colour collision
  RGB_MIN: 24,                // simple RGB euclidean distance fallback threshold
  COLLIDE_SAT_MIN: 0.20,      // a colour-COLLISION is only a category-confusion defect when at least
                              //   one of the two colliding fills is CHROMATIC (HSV sat ≥ this). Two
                              //   near-neutral panel TINTS (e.g. attention-e2e .ae-cell rgb(235,231,218)
                              //   sat≈.07 vs .ae-headbox rgb(251,230,216) sat≈.14, or transformer-block
                              //   .tb-box backing tints) are CHROME backings told apart by their content
                              //   + borders, not by a saturated category hue — reusing a near-bg cream is
                              //   not "two distinct data categories painted the same". A REAL collision
                              //   (the A3 fixture: two saturated blues rgb(70,130,180)/rgb(72,132,182),
                              //   sat≈.61) is far above this floor and STILL fires.
  VOID_LUM: 0.045,            // fill relative-luminance below this (and not on dark bg) → near-black void
  MIN_BOX: 9,                 // px: ignore boxes smaller than this on a side (tick marks, hairlines)
  // ── trust-the-gate refinements (kill the confirmed false-positive classes) ──
  MAX_FRAME_MULT: 3,          // FP#1: a box wider/taller than this × the frame viewBox is a KaTeX
                              //       off-screen MEASURING span (width ~thousands of px), not real
                              //       content — skip it for OOB exactly as visual-gate does. A real
                              //       label a few px past the edge stays well under 3× and is STILL caught.
  MOVE_PX: 4,                 // FP#3: an element whose box centre OR size shifts by ≥ this many px
                              //       between consecutive steps counts as MOVED (in-place transform:
                              //       LayerNorm bars rescaling, t-SNE dots migrating, PCA cloud rotating).
  MOVE_FRAC: 0.10,            // FP#3: if ≥ this fraction of carried-over elements MOVED since the prior
                              //       step, the step made PROGRESS even though no new element appeared.
  // ── DETECTOR A — double-painted / garbled SVG <text> (colored stroke on glyphs) ──
  PAINT_STROKE_W: 2,          // a stroke ≥ this px wide ON A <text> is thick enough to double-paint
                              //   glyphs (the planted bug is stroke-width:4). Below this a hairline
                              //   stroke can't garble, so we don't bother.
  HALO_DELTA_E: 26,           // ΔE(stroke→white) OR ΔE(stroke→slide-bg) BELOW this ⇒ a near-white /
                              //   near-background HALO outline (the LEGIT s36 / glove-map technique)
                              //   → NEVER flagged, regardless of width. A saturated accent stroke
                              //   (#2a6fdb is ΔE≈42 to white) sits well ABOVE this and DOES fire.
  PAINT_SAT_MIN: 0.20,        // the stroke must also be CHROMATIC (HSV saturation ≥ this) to count as
                              //   a "colored" double-paint. A grey/black thick stroke is not the
                              //   accent-garble signature and is excluded (kept as a weaker WARN path
                              //   only if it is also dark — see below).
  // ── DETECTOR B — text-over-text OVERPRINT (covers the IoU-blind "small text inside big box") ──
  OVERPRINT_COVER: 0.50,      // if ≥ this fraction of the SMALLER text box is covered by the other
                              //   text box AND the strings differ ⇒ overprint (this is what IoU
                              //   MISSED: a wide title sitting on a narrow column header has low IoU
                              //   because the union is dominated by the title, but the header is
                              //   ≥50% buried → caught by the smaller-box-coverage metric).
  OVERPRINT_MIN_AREA: 80,     // px²: ignore overprint between two truly tiny glyph boxes (noise).
};

// ───────────────────────── targets ─────────────────────────
// Deck targets are addressed by 1-based slide index (== the screen-label number in these decks).
const DECK_TARGETS = [
  { deck: '05-dl-embeddings-dimred.html', slide: 17, name: 'L5 s17 skip-gram archflow' },
  { deck: '05-dl-embeddings-dimred.html', slide: 30, name: 'L5 s30 GloVe co-occurrence' }, // title-over-header / header-over-subtitle (Detector B)
  { deck: '05-dl-embeddings-dimred.html', slide: 31, name: 'L5 s31 GloVe objective' },     // arch-step <text> double-paint (Detector A)
  { deck: '05-dl-embeddings-dimred.html', slide: 36, name: 'L5 s36 PCA-as-rotation' },
  { deck: '05-dl-embeddings-dimred.html', slide: 47, name: 'L5 s47 cross-domain' },
  { deck: '06-contextual-attention-transformers.html', slide: 19, name: 'L6 s19 attention-pull' },
  { deck: '06-contextual-attention-transformers.html', slide: 37, name: 'L6 s37 block archflow' },
  { deck: '06-contextual-attention-transformers.html', slide: 38, name: 'L6 s38 LayerNorm' },
  // the earlier-modified stepped slides forced "full at step 0":
  { deck: '06-contextual-attention-transformers.html', slide: 26, name: 'L6 s26 multi-head walkthrough' },
  { deck: '06-contextual-attention-transformers.html', slide: 36, name: 'L6 s36 feed-forward (def)' },
];
// Book widgets: beat id in the built chapter → friendly name. Driven via window.__figs[beat].setStep
// (the same hook + mount path the existing targets use — load the built chapter, drive setStep(k),
// capture each step). The list now covers EVERY scrolly (non-prose) widget that mounts in the L5/L6
// book chapters, so the double-paint / overprint / step-progression detectors run on ALL of them and
// the contrastive-space class of bug (a colored stroke double-painting SVG <text>) can't recur
// unnoticed in any book widget. Beats verified against the built docs/{en}/book/{05,06}/ payloads.
const BOOK_TARGETS = [
  // ── chapter 05 ──
  { chapter: '05', beat: 'climb-word2vec-net', widget: 'skipgram-net' },
  { chapter: '05', beat: 'climb-analogy', widget: 'embedding-space' },
  { chapter: '05', beat: 'climb-glove', widget: 'glove-cooccur' },
  { chapter: '05', beat: 'aside-domains-viz', widget: 'embedding-domains' },
  { chapter: '05', beat: 'climb-pca', widget: 'dimred-projection' },
  { chapter: '05', beat: 'climb-pca-rotate', widget: 'pca-rotate' },
  { chapter: '05', beat: 'climb-tsne-steps', widget: 'tsne-steps' },
  { chapter: '05', beat: 'climb-tsne-migrate', widget: 'tsne-migrate' },
  // ── chapter 06 ──
  { chapter: '06', beat: 'climb-attention', widget: 'attention-e2e' },
  { chapter: '06', beat: 'climb-attention-geo', widget: 'attention-geometry' },
  { chapter: '06', beat: 'climb-positional', widget: 'positional-enc' },
  { chapter: '06', beat: 'climb-block', widget: 'transformer-block' },
  { chapter: '06', beat: 'climb-block-geo', widget: 'block-geometry' },
  { chapter: '06', beat: 'climb-layernorm', widget: 'layernorm-viz' },
  { chapter: '06', beat: 'depth-residual-viz', widget: 'residual-stream' },
  // climb-contrastive (contrastive-space) — the beat whose colored-stroke label double-paint
  // slipped through because it was NOT in this list. Now targeted so DETECTOR A guards it.
  { chapter: '06', beat: 'climb-contrastive', widget: 'contrastive-space' },
];

// ───────────────────────── static servers ─────────────────────────
// Static servers are the shared gate-harness serveDir() (free port, path-traversal guard,
// MIME, dir→index.html, and base-prefix stripping — exactly what the two inline servers did).
const deckUrl = (f) => dsrv.href(f);
const bookUrl = (ch, lang = 'en') => bsrv.href(`${lang}/book/${ch}/`);

/* =========================================================================
   capture(root): the IN-PAGE scene-capture, shared by deck slides and widgets.
   Returns, for the elements inside `root`:
     • frame: the SVG/figure viewBox box (logical px) used for OOB checks
     • labels[]: text-bearing elements that are VISIBLE — {key, box, text}
     • shapes[]: semantic shapes (rect/circle/ellipse/path/line/polygon/bar/dot/
                 node) that are VISIBLE — {key, box, fill, stroke, role}
     • signature: a stable hash-ish string of the visible salience state (visible
                  keys + each element's highlight/focus class + rounded box). Two
                  steps with an identical signature ⇒ a dead step.
     • count: number of visible MEANINGFUL elements (labels + shapes)
   It is injected as a plain function (page.evaluate) so it runs in the browser and
   can read getComputedStyle / getBoundingClientRect.
   ========================================================================= */
const CAPTURE = (rootSel, opt) => {
  const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
  if (!root) return { ok: false, reason: 'no root ' + rootSel };
  const OP = opt.OPACITY_MIN, MINBOX = opt.MIN_BOX;

  // effective opacity = product of computed opacities up the chain to root.
  const effOpacity = (el) => {
    let o = 1, n = el;
    while (n && n !== root.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return 0;
      const oo = parseFloat(cs.opacity); if (!isNaN(oo)) o *= oo;
      // explicit "hidden via step engine / widget layer" markers:
      if (n.classList && (n.classList.contains('is-hidden') || n.classList.contains('is-step-hidden'))) return 0;
      n = n.parentElement;
    }
    return o;
  };
  // a compact highlight-state token for an element (focus/selected/active/highlight rings).
  const HILITE = ['is-focus','is-current','is-shown','is-on','is-active','is-rowhi','is-sel',
    'sg-wcell-sel','sg-bar-top','sg-bar-runner','af-focus','is-hi','is-lit','is-highlight'];
  const hiTok = (el) => {
    const c = el.classList ? [...el.classList] : [];
    return HILITE.filter(h => c.includes(h)).join('') || '';
  };

  // pick a stable identifying key for an element (id, else tag+class+text-prefix).
  const keyOf = (el, i) => {
    const id = el.id ? '#' + el.id : '';
    const cls = (el.getAttribute && (el.getAttribute('class') || '')).trim().split(/\s+/).filter(Boolean)
      .filter(c => !/^is-|^af-focus$|wgt-fade/.test(c)).slice(0, 2).join('.');
    const tx = (el.textContent || '').trim().slice(0, 10);
    return `${el.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}${tx ? ':' + tx : ''}#${i}`;
  };

  const rootBox = root.getBoundingClientRect();
  // frame = the inner figure <svg> viewBox if present (preferred for OOB), else root box.
  // CRITICAL: skip <svg>s that are KaTeX inline-math GLYPHS — those are tiny (e.g. 40×24) and, if
  // chosen as the frame, would (a) make the OOB viewBox meaningless and (b) shrink the oversize
  // ceiling so far that legitimate large HTML cards get dropped. Prefer the LARGEST non-KaTeX svg,
  // which is the actual figure canvas.
  let frame = { x: rootBox.left, y: rootBox.top, w: rootBox.width, h: rootBox.height, src: 'root' };
  let pickSvg = null, pickArea = 0;
  if (root.matches('svg') && !(root.closest && root.closest('.katex'))) {
    const b = root.getBoundingClientRect(); pickSvg = root; pickArea = b.width * b.height;
  } else {
    root.querySelectorAll('svg').forEach(sv => {
      if (sv.closest && sv.closest('.katex')) return;             // skip inline-math glyph svgs
      const b = sv.getBoundingClientRect(); const a = b.width * b.height;
      if (a > pickArea) { pickArea = a; pickSvg = sv; }
    });
  }
  if (pickSvg) { const b = pickSvg.getBoundingClientRect(); frame = { x: b.left, y: b.top, w: b.width, h: b.height, src: 'svg' }; }

  const rel = (b) => ({ x: b.left - frame.x, y: b.top - frame.y, w: b.width, h: b.height,
    cx: b.left - frame.x + b.width / 2, cy: b.top - frame.y + b.height / 2 });

  // FP#1 — KaTeX off-screen MEASURING spans are NOT real content: KaTeX lays out math by
  // painting <span>/<svg><path> elements into an absolutely-positioned, off-screen helper whose
  // boxes are thousands of px wide (e.g. path#0 [2,2 9033×23]). visual-gate skips these two ways
  // (`el.closest('.katex')` + an "absurd >2400px layout-helper box" guard); we mirror BOTH so a
  // measuring span is never mistaken for an out-of-bounds label. A *real* OOB — a genuine label a
  // few px past the edge — is far below MAX_FRAME_MULT× the frame and is STILL flagged.
  // The oversize ceiling is taken against the LARGER of the figure frame and the whole root box, so
  // a small frame (e.g. a compact inner SVG) can never shrink the bound below legitimate HTML cards
  // that fill the slide — only genuine off-screen measuring boxes (thousands of px) ever exceed it.
  const refW = Math.max(frame.w || 1, rootBox.width || 1), refH = Math.max(frame.h || 1, rootBox.height || 1);
  const MAXW = refW * opt.MAX_FRAME_MULT, MAXH = refH * opt.MAX_FRAME_MULT;
  const isKatexArtifact = (el, b) => {
    if (el.closest && el.closest('.katex')) return true;          // inside KaTeX render tree
    if (b.width > MAXW || b.height > MAXH) return true;            // absurd off-screen measuring box
    if (b.width > 2400 || b.height > 2400) return true;            // hard ceiling (matches visual-gate)
    return false;
  };

  // ── text labels: SVG <text>/<tspan> + HTML text leaves carrying real glyphs ──
  const labels = [];
  const textSel = 'text, tspan, .af-cell, .sg-vocab, .sg-colhead, .ln-label, .rs-label, ' +
    '.attg-label, .blk-label, .pca-label, .tsne-label, .ed-label, foreignObject div, .arch-name';
  root.querySelectorAll(textSel).forEach((el, i) => {
    const txt = (el.textContent || '').trim();
    if (!txt) return;
    if (el.querySelector && el.querySelector('text, tspan')) return;   // container, not a leaf label
    if (effOpacity(el) < OP) return;
    const b = el.getBoundingClientRect();
    if (b.width < MINBOX && b.height < MINBOX) return;
    if (isKatexArtifact(el, b)) return;                                // FP#1: skip measuring spans
    // DETECTOR A — capture the paint of THIS text glyph so the Node side can tell a legitimate
    // white/bg halo (paint-order:stroke + near-white stroke = GOOD outline) apart from the bug
    // where the global rule `svg [data-arch-step].is-arch-current{stroke:accent;stroke-width:4}`
    // strokes the glyphs with a saturated 4px accent and DOUBLE-PAINTS them (garble). We read the
    // text's OWN computed style: SVG `stroke`/`stroke-width`/`paint-order`, plus CSS
    // `-webkit-text-stroke` (the s36 PC-label / glove-map halo technique uses that, not SVG stroke).
    const isSvgText = el.namespaceURI === 'http://www.w3.org/2000/svg' &&
      (el.tagName.toLowerCase() === 'text' || el.tagName.toLowerCase() === 'tspan');
    let strokePaint = '', strokeW = 0, paintOrder = '', textStrokePaint = '', textStrokeW = 0, fillPaint = '';
    if (isSvgText) {
      const cs = getComputedStyle(el);
      strokePaint = cs.stroke && cs.stroke !== 'none' ? cs.stroke : '';
      strokeW = parseFloat(cs.strokeWidth) || 0;
      paintOrder = (cs.paintOrder || '').trim();
      fillPaint = cs.fill || '';
      // CSS text outline (the GOOD halo path: `-webkit-text-stroke: 3px #fff`).
      textStrokePaint = (cs.webkitTextStrokeColor || cs.WebkitTextStrokeColor || '').trim();
      textStrokeW = parseFloat(cs.webkitTextStrokeWidth || cs.WebkitTextStrokeWidth || '0') || 0;
    }
    labels.push({ key: keyOf(el, i), text: txt.slice(0, 24), ...rel(b), hi: hiTok(el),
      isSvgText, strokePaint, strokeW, paintOrder, textStrokePaint, textStrokeW, fillPaint,
      rot: (el.getAttribute && /rotate/i.test(el.getAttribute('transform') || '')) || false });
  });

  // ── semantic shapes: SVG primitives + HTML "tile/cell/bar/dot/node" boxes ──
  const shapes = [];
  const shapeSel = 'rect, circle, ellipse, path, line, polygon, polyline, ' +
    '.af-node, .af-cell, .sg-onehot, .sg-wcell, .sg-hcell, .sg-bartrack, .sg-barfill, ' +
    '.dot, .bar, .node, .edge, .ln-bar, .rs-cell, .pca-dot, .tsne-dot, .ed-dot';
  root.querySelectorAll(shapeSel).forEach((el, i) => {
    if (effOpacity(el) < OP) return;
    const b = el.getBoundingClientRect();
    if (b.width < MINBOX && b.height < MINBOX) return;
    if (isKatexArtifact(el, b)) return;                                // FP#1: skip KaTeX <path> measuring shapes
    const cs = getComputedStyle(el);
    // Only SVG-namespaced elements have a MEANINGFUL `fill`/`stroke`. For HTML tiles
    // (div/span, e.g. .af-node/.af-cell) getComputedStyle().fill returns the inherited
    // SVG-text default rgb(0,0,0), which is NOT what the tile paints — its real colour is
    // backgroundColor / borderColor. Reading `fill` there produced a flood of bogus
    // black-on-black collisions/voids. Branch on the namespace to read the right prop.
    const isSVG = el.namespaceURI === 'http://www.w3.org/2000/svg';
    let fill, stroke;
    if (isSVG) {
      fill = cs.fill && cs.fill !== 'none' ? cs.fill : cs.backgroundColor;
      stroke = cs.stroke && cs.stroke !== 'none' ? cs.stroke : '';
    } else {
      fill = cs.backgroundColor;     // HTML tile colour
      stroke = cs.borderTopColor;
    }
    const role = el.getAttribute && (el.getAttribute('data-role') || el.getAttribute('data-cat') || '');
    shapes.push({ key: keyOf(el, i), tag: el.tagName.toLowerCase(), role, fill, stroke,
      ...rel(b), hi: hiTok(el) });
  });

  // ── FP#2 — stepped HTML BLOCK nodes (DOM-box walkthroughs) ──
  // Some stepped figures carry ~no SVG geometry: the progression is a sequence of HTML cards
  // (.walk-step / .arch-box DIVs, each [data-step]/[data-from]) that the deck's step engine
  // reveals by toggling .is-step-hidden. To the SVG-only capture these were invisible (count
  // 0→0→1), so the gate misread a perfectly-good step-by-step reveal as "dead steps". Capture
  // those revealed block containers as `domNodes` so progression can be measured over THEM,
  // exactly as it is over SVG shapes. (effOpacity already returns 0 for .is-step-hidden /
  // display:none, so only the steps actually shown at the current step are counted.)
  const domNodes = [];
  const stepSel = '.walk-step, .arch-box, [data-arch-step], [data-from], [data-step]';
  const seenDom = new Set();
  root.querySelectorAll(stepSel).forEach((el, i) => {
    if (el.namespaceURI === 'http://www.w3.org/2000/svg') return;     // SVG [data-step] handled above
    if (seenDom.has(el)) return; seenDom.add(el);
    // skip a stepped wrapper that merely CONTAINS another stepped node (count the leaf cards, not
    // their flow container) — avoids double-counting .walk-flow→.walk-step nesting.
    if (el.querySelector && el.querySelector(stepSel)) return;
    if (effOpacity(el) < OP) return;
    const b = el.getBoundingClientRect();
    if (b.width < MINBOX && b.height < MINBOX) return;
    if (isKatexArtifact(el, b)) return;
    domNodes.push({ key: keyOf(el, i), ...rel(b), hi: hiTok(el) });
  });

  // visible meaningful count + a salience signature (sorted visible keys + hi-state + coarse box).
  const sigParts = [...labels, ...shapes, ...domNodes]
    .map(e => `${e.key}|${e.hi}|${Math.round(e.x / 6)},${Math.round(e.y / 6)},${Math.round(e.w / 6)},${Math.round(e.h / 6)}`)
    .sort();
  // geometry index: per-element key → centre+size, so the step detector can tell whether an
  // element that PERSISTS across two steps MOVED / RESCALED in place (FP#3 — positional progress).
  const geom = {};
  for (const e of [...labels, ...shapes, ...domNodes]) {
    geom[e.key] = { cx: e.x + e.w / 2, cy: e.y + e.h / 2, w: e.w, h: e.h };
  }
  return {
    ok: true,
    frame: { w: frame.w, h: frame.h, src: frame.src },
    labels, shapes, domNodes,
    // count = every meaningful element shown at this step (SVG labels+shapes PLUS revealed HTML
    // step-cards). Folding domNodes in means a DOM-box walkthrough now reads as a real reveal.
    count: labels.length + shapes.length + domNodes.length,
    svgCount: labels.length + shapes.length,   // SVG-only, for "is this an HTML-driven figure?" check
    domCount: domNodes.length,
    geom,                                      // key → {cx,cy,w,h}, for step-to-step movement (FP#3)
    signature: sigParts.join('§'),
  };
};

// ───────────────────────── colour maths (Node side) ─────────────────────────
function parseRGB(s) {
  if (!s) return null;
  const m = s.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?/i);
  if (!m) return null;
  const a = m[4] === undefined ? 1 : +m[4];
  return { r: +m[1], g: +m[2], b: +m[3], a };
}
function relLum(c) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}
function rgb2lab(c) {
  let r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const g2 = v => v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  r = g2(r); g = g2(g); b = g2(b);
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  x = f(x); y = f(y); z = f(z);
  return { L: 116 * y - 16, a: 500 * (x - y), bb: 200 * (y - z) };
}
function deltaE(c1, c2) {           // CIE76 ΔE
  const l1 = rgb2lab(c1), l2 = rgb2lab(c2);
  return Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.bb - l2.bb);
}
function rgbDist(c1, c2) { return Math.hypot(c1.r - c2.r, c1.g - c2.g, c1.b - c2.b); }
function hsvSat(c) {                  // HSV saturation: 0 = grey/white/black, →1 = vivid hue
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
  return mx <= 0 ? 0 : (mx - mn) / mx;
}
function quantHue(c) {               // coarse hue bucket for "distinct hue count"
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 0.06) return 'gray';       // achromatic
  let h = 0;
  if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  h = Math.round(h * 60); if (h < 0) h += 360;
  return String(Math.round(h / 30) * 30 % 360);   // 12 buckets
}

// IoU of two boxes.
function iou(a, b) {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy; if (inter <= 0) return 0;
  return inter / (a.w * a.h + b.w * b.h - inter);
}

function hexRGB(h) {                  // "#rgb" | "#rrggbb" → {r,g,b,a:1}
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);   // drop alpha channel
  if (h.length !== 6) return null;
  const n = parseInt(h, 16); if (isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
}
function anyColor(s) { return hexRGB(s) || parseRGB(s); }   // hex OR rgb()/rgba()

/* =========================================================================
   SEMANTIC COLOR CONTRACT — static source scan (NEW sub-check).
   ─────────────────────────────────────────────────────────────────────────
   The rendered detectors above read the PAINTED rgb of a shape; they cannot tell
   "this should have been a contract TOKEN" from "this is the right colour by luck".
   That distinction lives in the SOURCE. So this scanner reads the contract's single
   source of truth (tokens/design-tokens.css :root) and the figure source (L5/L6 deck
   HTML inline SVG fills/strokes + every widget style.css / logic.js) and flags:

     (A) OFF-TOKEN   — a RAW hex / rgb() literal on a semantic fill:/stroke:/fill=/
                       stroke= that is NOT inside a var(--…) and whose colour IS a
                       contract hue (ΔE < OFF_TOKEN_NEAR to a token). Right colour,
                       wrong mechanism: it won't theme (light/dark) and silently
                       drifts. HARD.
     (B) OFF-CONTRACT— a RAW literal whose hue is NOT near ANY approved contract hue
                       (ΔE ≥ OFF_TOKEN_NEAR to the nearest token). A rogue shade: e.g.
                       a SECOND red (#C0392B) that also means "negative" — breaks
                       "one colour = one meaning". HARD + the precise file:line so a
                       fix can token-swap it.

   EXEMPT (never flagged): values inside var(--…, #fallback) (the themeable pattern —
   the hex is just the fallback); pure white/black (#fff/#000 — chip text, halos);
   achromatic greys that resolve to an ink/rule structure token; colours used
   only in box-shadow / text-shadow / gradient stops (decoration, matched by context).

   Severity is HARD: the L5/L6 decks were token-cleaned (every semantic fill/stroke now
   paints with a contract token — see the GloVe/t-SNE legend+clusters, the O(n²) cost
   curve, the [CLS] vector box, and the bundler-thumbnail var(--…,#fallback) swaps), so
   BOTH sub-checks now fail the build. A re-introduced raw literal (off-token OR
   off-contract) breaks the green build instead of silently warning.
   ========================================================================= */
const CONTRACT_TH = {
  OFF_TOKEN_NEAR: 10,   // ΔE below this to a contract token ⇒ "off-token" (right hue, raw literal).
                        //   At/above ⇒ "off-contract rogue hue". Calibrated on the live decks:
                        //   exact-token literals land ΔE 0–6 (#2A6FDB, #6B7280, #5B6472), rogue
                        //   shades land ΔE 12–30 (#C0392B, #7C5CD6, #1E9BD9, #2E9E5B, #D98A1E).
  ACHROMATIC_SAT: 0.12, // a literal this un-saturated is grey/near-bg structure (chrome), not a
                        //   semantic CATEGORY hue. If it's also ΔE-near an --ink*/--rule* token it
                        //   is on-contract structure; we only WARN-off-contract on CHROMATIC rogues.
};
// Load the contract palette straight from the token file's :root (single source of truth) so the
// gate can never drift from the documented contract. Returns [{name, c:{r,g,b}}] for chromatic +
// achromatic structure tokens (the approved hues listed in the contract comment).
function loadContractTokens(rootDir) {
  const css = readFileSync(join(rootDir, 'tokens', 'design-tokens.css'), 'utf8');
  // first :root block only (the light theme — the canonical values the source hex literals target).
  const root = (css.match(/:root\s*\{([\s\S]*?)\}/) || [, ''])[1];
  const tokens = [];
  const re = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g; let m;
  while ((m = re.exec(root))) {
    const name = m[1], c = hexRGB(m[2]); if (!c) continue;
    // contract surface: accent/warm/c-* chromatic roles + ink*/rule* structure. Skip bg/soft tints
    // and shadow/motion — a SHAPE fill should match a role hue or a structure token, not a -soft wash.
    if (/^(accent|warm|c-[a-z]+|ink|ink-\d|rule|rule-strong)(-ink)?$/.test(name) && !/-soft$/.test(name)) {
      tokens.push({ name: '--' + name, c });
    }
  }
  return tokens;
}
// nearest contract token to an arbitrary colour, by CIE76 ΔE.
function nearestToken(c, tokens) {
  let best = null, bd = Infinity;
  for (const t of tokens) { const e = deltaE(c, t.c); if (e < bd) { bd = e; best = t; } }
  return { token: best, dE: bd };
}

// Pull raw colour literals off semantic paint sites in one source string, skipping var(--…) usages,
// comments, and decoration (shadows/gradients). Returns [{line, prop, raw, ctx}].
function extractPaintLiterals(src, kind /* 'html' | 'css' */) {
  const out = [];
  const lines = src.split('\n');
  // a colour literal is "semantic" when it sits on a fill/stroke (SVG) or color/background/fill/stroke
  // (CSS) — NOT on box-shadow/text-shadow/filter/gradient (decoration). We test the surrounding text.
  const DECOR = /(box-shadow|text-shadow|drop-shadow|filter\s*:|gradient|outline\s*:)/i;
  // HTML: attributes  fill="#.."  stroke="#.."  (also style="fill:#..").
  // CSS : declarations fill: #..  stroke: #..  color: #..  background[-color]: #..
  const ATTR = kind === 'html'
    ? /\b(fill|stroke|stop-color)\s*=\s*"([^"]*)"/gi
    : /\b(fill|stroke|color|background(?:-color)?|stop-color)\s*:\s*([^;}{]+)/gi;
  lines.forEach((ln, i) => {
    if (DECOR.test(ln)) return;                        // a whole decoration line — skip
    let m;
    const rx = new RegExp(ATTR.source, ATTR.flags);
    while ((m = rx.exec(ln))) {
      const prop = m[1].toLowerCase(), val = m[2].trim();
      if (!val) continue;
      if (/^(none|transparent|currentcolor|inherit|url\(|var\()/i.test(val)) continue; // tokened/empty
      // strip out any var(--…, fallback) — the hex inside is a legit fallback, not a raw literal.
      const stripped = val.replace(/var\([^)]*\)/g, ' ');
      // a literal hex or rgb()/rgba() left over after removing var()s is a RAW semantic literal.
      const lit = (stripped.match(/#[0-9a-fA-F]{3,8}\b/) || stripped.match(/rgba?\([^)]*\)/i) || [])[0];
      if (!lit) continue;
      out.push({ line: i + 1, prop, raw: lit, ctx: ln.trim().slice(0, 90) });
    }
  });
  return out;
}

// Files the contract scan covers: EVERY deck HTML (inline SVG figures) + EVERY widget's
// style.css and logic.js (the figure paint). Returns a list of {rel, kind, abs}.
// The deck set is AUTO-DISCOVERED (glob Lectures/NN-*.html) rather than the old hardcoded
// L5/L6 pair, so the off-token / off-contract literal contract is enforced across ALL 7 decks
// (L0–L4 were token-cleaned to match — their title/logo bundler-thumbnail fills now paint with
// var(--accent|--ink|--ink-3|--bg|--accent-soft, #fallback)). Adding L7 needs ZERO edit here.
function contractScanFiles(rootDir) {
  const files = [];
  const lectDir = join(rootDir, 'Lectures');
  if (existsSync(lectDir)) {
    for (const f of readdirSync(lectDir).filter(n => /^[0-9][0-9]-.*\.html$/.test(n)).sort()) {
      const abs = join(lectDir, f);
      if (existsSync(abs)) files.push({ rel: 'Lectures/' + f, kind: 'html', abs });
    }
  }
  const wdir = join(rootDir, 'widgets');
  if (existsSync(wdir)) {
    for (const name of readdirSync(wdir)) {
      const d = join(wdir, name);
      try { if (!statSync(d).isDirectory()) continue; } catch { continue; }
      for (const f of ['style.css', 'logic.js']) {
        const abs = join(d, f);
        if (existsSync(abs)) files.push({ rel: `widgets/${name}/${f}`, kind: f.endsWith('.css') ? 'css' : 'js', abs });
      }
    }
  }
  return files;
}

// Run the contract scan over one source string. Pure (testable in selftest). `tokens` from
// loadContractTokens. Returns defect objects {cat:'CONTRACT', sub:'OFF-TOKEN'|'OFF-CONTRACT', ...}.
function scanContractSource(src, kind, rel, tokens, th) {
  const out = [];
  const lits = extractPaintLiterals(src, kind === 'css' || kind === 'js' ? 'css' : 'html');
  for (const L of lits) {
    const c = anyColor(L.raw); if (!c) continue;
    if (c.a !== undefined && c.a < 0.12) continue;        // a wash/overlay alpha, not a solid paint
    // pure white / pure black are universal chip-text / halo / void-fill — never a contract violation.
    const lum = relLum(c), sat = hsvSat(c);
    if ((c.r > 245 && c.g > 245 && c.b > 245) || (c.r < 12 && c.g < 12 && c.b < 12)) continue;
    const { token, dE } = nearestToken(c, tokens);
    if (!token) continue;
    if (dE < th.OFF_TOKEN_NEAR) {
      // right colour, raw literal: it equals a contract token but won't theme. HARD (decks are clean).
      out.push({ cat: 'CONTRACT', sub: 'OFF-TOKEN', sev: 'HARD', step: 0,
        msg: `off-token literal ${rel}:${L.line} — ${L.prop} ${L.raw} == ${token.name} (ΔE=${dE.toFixed(1)}); paint with var(${token.name}) so it themes & stays on-contract  ‹${L.ctx}›` });
    } else {
      // achromatic-but-far greys: structure that drifted from --ink*/--rule* — off-token, use a structure token.
      if (sat < th.ACHROMATIC_SAT) {
        out.push({ cat: 'CONTRACT', sub: 'OFF-TOKEN', sev: 'HARD', step: 0,
          msg: `off-token grey ${rel}:${L.line} — ${L.prop} ${L.raw} (lum=${lum.toFixed(2)}) nearest structure ${token.name} ΔE=${dE.toFixed(1)}; use the --ink*/--rule* token  ‹${L.ctx}›` });
      } else {
        // CHROMATIC rogue: a hue that is NOT any approved contract colour ⇒ "one colour = one meaning"
        // broken (a second red/violet/green/cyan). HARD with the precise site for a token-swap fix.
        out.push({ cat: 'CONTRACT', sub: 'OFF-CONTRACT', sev: 'HARD', step: 0,
          msg: `OFF-CONTRACT hue ${rel}:${L.line} — ${L.prop} ${L.raw} (sat=${sat.toFixed(2)}) is ΔE=${dE.toFixed(1)} from its nearest contract hue ${token.name}: a rogue shade, not on the approved palette. Swap to ${token.name} (or its categorical equivalent) so the role reads without a legend.  ‹${L.ctx}›` });
      }
    }
  }
  return out;
}

// The whole contract scan (all files) — returns {defects[], byFile{}, tokens[]}.
function runContractScan(rootDir) {
  const tokens = loadContractTokens(rootDir);
  const files = contractScanFiles(rootDir);
  const defects = [], byFile = {};
  for (const f of files) {
    let src; try { src = readFileSync(f.abs, 'utf8'); } catch { continue; }
    const d = scanContractSource(src, f.kind, f.rel, tokens, CONTRACT_TH);
    if (d.length) byFile[f.rel] = d;
    defects.push(...d);
  }
  return { defects, byFile, tokens, fileCount: files.length };
}

/* =========================================================================
   DETECTORS — pure functions over the per-step capture array `steps`
   (steps[k] = capture for step k). Each returns an array of defect strings.
   ========================================================================= */
// FP#3 — quantify in-place TRANSFORMATION between two consecutive captures: of the elements that
// PERSIST across both steps (matched by stable key in the geometry index), what fraction MOVED or
// RESCALED by ≥ MOVE_PX? A high fraction means the step told its story by relocating/resizing
// existing marks (LayerNorm bars recentering→rescaling, t-SNE dots migrating, PCA cloud rotating)
// rather than by adding new ones — that is legitimate progressive storytelling, NOT "all at once".
function movedFraction(prev, cur, ctx) {
  const PG = prev.geom || {}, CG = cur.geom || {};
  const shared = Object.keys(CG).filter(k => PG[k]);
  if (!shared.length) return { frac: 0, moved: 0, shared: 0 };
  let moved = 0;
  for (const k of shared) {
    const a = PG[k], b = CG[k];
    const dCentre = Math.hypot(a.cx - b.cx, a.cy - b.cy);
    const dSize = Math.abs(a.w - b.w) + Math.abs(a.h - b.h);
    if (dCentre >= ctx.TH.MOVE_PX || dSize >= ctx.TH.MOVE_PX) moved++;
  }
  return { frac: moved / shared.length, moved, shared: shared.length };
}

function detectStepProgression(steps, ctx) {
  const out = [];
  const counts = steps.map(s => s.count);
  const finalCount = counts[counts.length - 1] || 0;
  if (steps.length < 2) { out.push({ cat: 'STEP-PROG', sev: 'WARN', step: 0,
    msg: `single-step target (no progression to check) — count=${finalCount}` }); return out; }
  if (finalCount === 0) return out;

  // per-step-pair: did anything NEW appear, did the signature change, did marks MOVE in place?
  const pair = [];
  for (let k = 1; k < steps.length; k++) {
    const prev = steps[k - 1], cur = steps[k];
    const grew = cur.count > prev.count + 0.5;
    const sigChanged = cur.signature !== prev.signature;
    const mv = movedFraction(prev, cur, ctx);
    pair.push({ k, grew, sigChanged, mv });
  }
  // a step "made progress" if it revealed new marks OR moved/rescaled a meaningful fraction of the
  // existing ones. ("everything at once" is only a defect when NO step ever does either.)
  const stepProgressed = p => p.grew || p.mv.frac >= ctx.TH.MOVE_FRAC;
  const anyProgress = pair.some(stepProgressed);

  // (a) everything-at-step-0: step 0 already shows ≥ STEP0_COVER of final count.
  // FP#3 guard — this is a DEFECT only when the figure ALSO never moves: step 0 dumps ~all marks
  // AND every later step is static (nothing appears AND nothing migrates/rescales). A figure whose
  // marks are all present at step 0 but then TRANSFORM in place each step is fine — `anyProgress`
  // is true, so we stay silent. The original "dump everything at step 0 and freeze" defect
  // (L5 s17 / L6 s37 archflow regressions) has anyProgress === false and STILL fires HARD.
  const cover0 = counts[0] / finalCount;
  if (cover0 >= ctx.TH.STEP0_COVER && !anyProgress) {
    out.push({ cat: 'STEP-PROG', sev: 'HARD', step: 0,
      msg: `step-0 coverage ${(cover0 * 100).toFixed(0)}% (${counts[0]}/${finalCount} elements present at step 0) AND every later step is static — nothing appears and nothing moves/rescales across all ${steps.length - 1} transitions ⇒ "everything at once", no real reveal` });
  }

  // (b) dead step: a later step that adds NO new element, AND whose salience signature is unchanged,
  // AND in which nothing moved/rescaled in place. The movement guard means an in-place transform
  // step (which leaves count flat but shifts marks) is NOT a dead step (FP#3). A step that reveals
  // a new HTML walk-card grows `count` via domNodes now, so a DOM-box walkthrough is no longer a
  // string of dead steps (FP#2).
  for (const p of pair) {
    const moved = p.mv.frac >= ctx.TH.MOVE_FRAC;
    if (!p.grew && !p.sigChanged && !moved) {
      const prev = steps[p.k - 1], cur = steps[p.k];
      out.push({ cat: 'STEP-PROG', sev: 'HARD', step: p.k,
        msg: `dead step ${p.k}: identical to step ${p.k - 1} (count ${prev.count}→${cur.count}, salience signature unchanged, ${p.mv.moved}/${p.mv.shared} marks moved — nothing revealed or moved)` });
    }
  }
  return out;
}

function detectOverlapOOB(steps, ctx) {
  const out = [];
  steps.forEach((s, k) => {
    if (!s.ok) return;
    // ── OOB: any label/shape box poking outside the frame viewBox ──
    const pad = ctx.TH.OOB_PAD, FW = s.frame.w, FH = s.frame.h;
    const all = [...s.labels.map(l => ({ ...l, kind: 'label', id: l.text || l.key })),
                 ...s.shapes.map(sh => ({ ...sh, kind: 'shape', id: sh.key }))];
    for (const e of all) {
      if (e.w < ctx.TH.MIN_BOX && e.h < ctx.TH.MIN_BOX) continue;
      const over = [];
      if (e.x < -pad) over.push(`left ${e.x.toFixed(0)}`);
      if (e.y < -pad) over.push(`top ${e.y.toFixed(0)}`);
      if (e.x + e.w > FW + pad) over.push(`right +${(e.x + e.w - FW).toFixed(0)}`);
      if (e.y + e.h > FH + pad) over.push(`bottom +${(e.y + e.h - FH).toFixed(0)}`);
      if (over.length) out.push({ cat: 'OOB', sev: 'HARD', step: k,
        msg: `${e.kind} "${String(e.id).slice(0, 22)}" box [${e.x.toFixed(0)},${e.y.toFixed(0)} ${e.w.toFixed(0)}×${e.h.toFixed(0)}] exits ${s.frame.src} frame ${FW.toFixed(0)}×${FH.toFixed(0)} (${over.join(', ')})` });
    }
    // ── OVERLAP / OVERPRINT: text-over-text across BOTH namespaces (DETECTOR B) ──
    // s.labels already folds SVG <text>/<tspan> AND HTML overlay text (foreignObject div, .*-label,
    // .af-cell, …) into ONE relative-to-frame coordinate space, so an HTML panel-TITLE and an SVG
    // column-HEADER are directly comparable here — that cross-namespace pairing is exactly what the
    // s30 title-over-header case needs. This is TEXT-vs-TEXT only (shapes are the COLOR detector's
    // job), and same-string pairs (a label's own shadow/halo duplicate, repeated axis ticks) are
    // skipped, so a halo never self-reports.
    const L = s.labels.filter(l => l.w >= ctx.TH.MIN_BOX && l.h >= ctx.TH.MIN_BOX && l.text);
    for (let i = 0; i < L.length; i++) {
      for (let j = i + 1; j < L.length; j++) {
        const a = L[i], b = L[j];
        if (a.text === b.text) continue;                   // same string (shadow halo / axis ticks) — skip
        // one string fully containing the other (e.g. "king" vs "the king has…") is usually a halo
        // duplicate or a substring leaf inside its own container — not an overprint of two messages.
        const sa = a.text.replace(/\s+/g, ''), sb = b.text.replace(/\s+/g, '');
        if (sa && sb && (sa.includes(sb) || sb.includes(sa))) continue;
        // BOTH-ROTATED suppression: getBoundingClientRect returns the AXIS-ALIGNED box, which for a
        // rotated <text> is far larger than the leaning glyph ink. Two ADJACENT diagonal column
        // headers (same rotate(), same band — the s30 / glove-cooccur header row) therefore have
        // overlapping AABBs even though the leaning glyphs are cleanly separated and legible. That is
        // exactly the "rotated-label minor touching that's still legible" case we must NOT flag. The
        // GENUINE s30 defect was a HORIZONTAL title crossing the rotated band (one rotated, one not),
        // which still fires because this guard requires BOTH to be rotated.
        if (a.rot && b.rot) continue;
        const ov = iou(a, b);
        const dc = Math.hypot(a.cx - b.cx, a.cy - b.cy);
        // intersection + smaller-box coverage — the metric IoU MISSED. A wide title sitting on a
        // narrow rotated header has LOW IoU (the union is dominated by the wide title), yet the
        // header is mostly buried: inter / min(area) is high. That fraction is what flags it.
        const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
        const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        const inter = ix * iy;
        const areaA = a.w * a.h, areaB = b.w * b.h, minArea = Math.min(areaA, areaB);
        const coverSmaller = minArea > 0 ? inter / minArea : 0;
        if (ov >= ctx.TH.IOU_OVERLAP) {
          out.push({ cat: 'OVERLAP', sev: 'HARD', step: k,
            msg: `labels "${a.text}" × "${b.text}" overlap IoU=${ov.toFixed(2)} (≥${ctx.TH.IOU_OVERLAP}) — printed on top of each other` });
        } else if (dc <= ctx.TH.CENTER_PX && ov > 0.05) {
          out.push({ cat: 'OVERLAP', sev: 'HARD', step: k,
            msg: `labels "${a.text}" × "${b.text}" centres ${dc.toFixed(1)}px apart (≤${ctx.TH.CENTER_PX}px) — stacked` });
        } else if (inter >= ctx.TH.OVERPRINT_MIN_AREA && coverSmaller >= ctx.TH.OVERPRINT_COVER) {
          // OVERPRINT: ≥50% of the smaller text box is buried under a different-string text box.
          // Severity scales with how buried it is — a near-total cover harms legibility (HARD);
          // a borderline (50–65%) graze on a rotated label that may still be legible is WARN.
          const sev = coverSmaller >= 0.65 ? 'HARD' : 'WARN';
          out.push({ cat: 'OVERLAP', sev, step: k,
            msg: `text overprint: "${a.text}" × "${b.text}" — ${(coverSmaller * 100).toFixed(0)}% of the smaller box buried (IoU=${ov.toFixed(2)} <${ctx.TH.IOU_OVERLAP}, so IoU alone missed it; inter=${inter.toFixed(0)}px²) — two different strings printed over each other` });
        }
      }
    }
  });
  // de-dupe identical messages across steps (report first step only)
  return dedupeFirstStep(out);
}

function detectColor(steps, ctx) {
  const out = [];
  // Evaluate on the RICHEST step (max shape count) so categories are all present.
  let best = steps[0], bestN = -1;
  for (const s of steps) { if (s.ok && s.shapes.length > bestN) { bestN = s.shapes.length; best = s; } }
  if (!best || !best.ok) return out;

  // collect distinguishable filled shapes (skip track/background/grid/none fills + hairlines).
  // "structural"/decoration shapes legitimately reuse a category colour (a LEGEND chip is meant
  // to match its dots; a frame/track/axis is chrome) — they must NOT count as a colliding category.
  // A BAR-FILL (.*-barfill, .*-pbar, .*-bar) is a SECOND, redundant encoding of a category that the
  // figure ALSO shows as a dot/point/cell — a positive cosine BAR is meant to be the same green as
  // the positive DOT (embedding-space .es-barfill ↔ .es-dot, tsne-steps .tss-pbar ↔ .tss-dot,
  // contrastive-space .cs-barfill ↔ .cs-pt). Matching the category hue across the two encodings is
  // BY DESIGN (same idea as a legend chip matching its dots, already exempt). So a bar-fill never
  // counts as its own colliding category. (A genuine two-DISTINCT-category same-colour bug still
  // fires: it would surface on the dots/cells themselves, which are NOT exempted.)
  const isStructural = (sh) => /track|grid|axis|frame|bg|background|legend|chip|swatch|guide|callbox|callout|halo|ring|tooltip|barfill|pbar|[-_]bar\b/i.test(sh.key);
  const filled = best.shapes
    .map(sh => ({ ...sh, c: parseRGB(sh.fill) }))
    .filter(sh => sh.c && sh.c.a > 0.15 && !(sh.w < ctx.TH.MIN_BOX && sh.h < ctx.TH.MIN_BOX) && !isStructural(sh));

  // background luminance (root/frame) for the void/near-bg checks.
  const bg = best.bg || { r: 255, g: 255, b: 255, a: 1 };
  const bgLum = relLum(bg);

  // ── (a) void / near-background fills ──
  for (const sh of filled) {
    // <line>/<polyline> paint via STROKE, not fill; their computed fill is the meaningless SVG
    // default rgb(0,0,0) — skip them here so a visible stroked rule isn't flagged as a void.
    if (sh.tag === 'line' || sh.tag === 'polyline') continue;
    const lum = relLum(sh.c);
    const dE_bg = deltaE(sh.c, bg);
    const nearBlack = lum < ctx.TH.VOID_LUM && bgLum > 0.2;   // black-on-light: a void hole
    const nearBg = dE_bg < ctx.TH.DELTA_E_MIN;                 // shape ≈ background ⇒ invisible
    if (nearBlack) out.push({ cat: 'COLOR', sev: 'WARN', step: 0,
      msg: `near-black fill on light canvas: ${sh.tag}.${shortKey(sh.key)} rgb(${sh.c.r | 0},${sh.c.g | 0},${sh.c.b | 0}) lum=${lum.toFixed(3)} (void; <${ctx.TH.VOID_LUM})` });
    else if (nearBg) out.push({ cat: 'COLOR', sev: 'WARN', step: 0,
      msg: `fill ≈ background: ${sh.tag}.${shortKey(sh.key)} rgb(${sh.c.r | 0},${sh.c.g | 0},${sh.c.b | 0}) ΔE_bg=${dE_bg.toFixed(1)} (<${ctx.TH.DELTA_E_MIN}) — element invisible against canvas` });
  }

  // ── (b) colour collision between DISTINCT shapes (different key/role, similar colour) ──
  // group by a "category" = role || class-stem so we only flag pairs MEANT to differ.
  // A category is only counted if it is SEMANTICALLY NAMED: it carries a data-role, or a class
  // beyond the bare tag name. A bare <rect>/<circle>/<path> with no class is a generic shape
  // (a backing panel, a connector, a same-colour highlight of a data point) and reusing a
  // category colour there is NOT a defect — so we don't treat it as its own category.
  const catOf = (sh) => (sh.role || shortKey(sh.key)).replace(/[#:].*$/, '');
  const isNamed = (sh) => !!sh.role || /\.[a-z]/i.test(shortKey(sh.key));   // has a class beyond the tag
  const reps = [];                                 // one representative colour per category
  const seenCat = new Map();
  for (const sh of filled) {
    if (!isNamed(sh)) continue;                    // skip anonymous generic shapes
    // <line>/<polyline> paint via STROKE, not fill — their computed `fill` is the meaningless SVG
    // default rgb(0,0,0). The void branch already skips them; the COLLISION branch must too, else a
    // pair of stroked rays/arrows (contrastive-space .cs-ray.cs-pos / .cs-arr.*) reads as a black-on-
    // black fill collision when both actually render in distinct STROKE colours (green vs red).
    if (sh.tag === 'line' || sh.tag === 'polyline') continue;
    const cat = catOf(sh);
    if (!seenCat.has(cat)) { seenCat.set(cat, { c: sh.c, named: isNamed(sh) }); reps.push({ cat, c: sh.c, sh }); }
  }
  for (let i = 0; i < reps.length; i++) {
    for (let j = i + 1; j < reps.length; j++) {
      const a = reps[i], b = reps[j];
      const dE = deltaE(a.c, b.c), rd = rgbDist(a.c, b.c);
      // a category-confusion defect requires at least one of the two near-identical fills to be a
      // CHROMATIC category hue (HSV sat ≥ COLLIDE_SAT_MIN). Two near-neutral panel/cell TINTS
      // (attention-e2e .ae-cell ≈ .ae-headbox, transformer-block .tb-box.* — all sat < .15, near-bg
      // cream/pale tints that are chrome backings, told apart by content + borders) are NOT two data
      // categories painted the same hue. The A3 fixture's saturated blues (sat≈.61) clear this floor.
      const satMax = Math.max(hsvSat(a.c), hsvSat(b.c));
      if (dE < ctx.TH.DELTA_E_MIN && rd < ctx.TH.RGB_MIN && satMax >= ctx.TH.COLLIDE_SAT_MIN) {
        out.push({ cat: 'COLOR', sev: 'HARD', step: 0,
          msg: `colour collision: "${a.cat}" rgb(${a.c.r|0},${a.c.g|0},${a.c.b|0}) ≈ "${b.cat}" rgb(${b.c.r|0},${b.c.g|0},${b.c.b|0}) ΔE=${dE.toFixed(1)} (<${ctx.TH.DELTA_E_MIN}), RGBdist=${rd.toFixed(0)} — distinct categories, indistinguishable colour` });
      }
    }
  }

  // ── (c) too few distinct hues for the number of categories ──
  const cats = [...seenCat.keys()];
  if (cats.length >= 4) {
    const hues = new Set(reps.map(r => quantHue(r.c)));
    if (hues.size < Math.ceil(cats.length / 2)) {
      out.push({ cat: 'COLOR', sev: 'WARN', step: 0,
        msg: `low hue diversity: ${cats.length} categories but only ${hues.size} distinct hue bucket(s) {${[...hues].join(',')}} — categories not colour-separable` });
    }
  }
  return out;
}

/* =========================================================================
   DETECTOR A — DOUBLE-PAINT / GARBLED SVG <text> (colored stroke on glyphs).
   ─────────────────────────────────────────────────────────────────────────
   THE BUG (exact, reproduced): the global slides.css rule
       svg [data-arch-step].is-arch-current { stroke: var(--accent); stroke-width: 4; ... }
   is meant to RING a diagram SHAPE at the current step. When the stepped element is a
   <text> (LayerNorm s38, GloVe s31), it instead paints a 4px SATURATED accent stroke ON the
   glyphs — SVG strokes text by default OVER the fill — doubling/outlining every character into
   a garbled blob. The deck fix neutralises it (`svg text { stroke:none }`); this detector fires
   if that fix is ever missing again.

   FIRE when an SVG <text>/<tspan> has:   stroke ≠ none/transparent
                                       AND stroke-width ≥ PAINT_STROKE_W (≈2px)
                                       AND the stroke is a SATURATED/colored paint
                                           (NOT a near-white and NOT a near-background halo).

   STAY SILENT on the LEGIT halo (s36 PC labels, glove map labels): a small NEAR-WHITE or
   NEAR-BACKGROUND stroke used as an outline. Two independent silencers, either suffices:
     (1) the stroke colour is within HALO_DELTA_E of WHITE *or* of the slide BG  → it's a halo,
         never flagged, ANY width (a fat white outline is still a white outline);
     (2) paint-order puts the stroke UNDER the fill (`paint-order: stroke …`) AND the stroke is
         light (not near-black) → the classic behind-the-glyph halo, never flagged.
   We also require the stroke to be CHROMATIC (HSV sat ≥ PAINT_SAT_MIN): a grey thick stroke is
   not the accent-garble signature. NOTE: the CSS `-webkit-text-stroke` halo (s36 uses
   `-webkit-text-stroke:3px #fff`) is NOT the SVG `stroke` property at all, so it never even
   enters this check — captured separately and ignored here.
   ========================================================================= */
function detectDoublePaint(steps, ctx) {
  const out = [];
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };
  steps.forEach((s, k) => {
    if (!s.ok) return;
    const bg = s.bgParsed || s.bg || WHITE;
    for (const t of s.labels) {
      if (!t.isSvgText) continue;                       // HTML overlay text has no meaningful stroke
      const sc = parseRGB(t.strokePaint);
      if (!sc || sc.a <= 0.05) continue;                // stroke:none / transparent → fine
      if ((t.strokeW || 0) < ctx.TH.PAINT_STROKE_W) continue;   // hairline stroke can't garble glyphs
      const dE_white = deltaE(sc, WHITE);
      const dE_bg = deltaE(sc, bg);
      // silencer (1): near-white OR near-background → it's a halo outline, never a defect.
      if (dE_white < ctx.TH.HALO_DELTA_E || dE_bg < ctx.TH.HALO_DELTA_E) continue;
      const sat = hsvSat(sc), lum = relLum(sc);
      // silencer (2): paint-order draws stroke UNDER the fill AND the stroke is light (not dark) →
      //   a behind-the-glyph halo; the glyph fill still reads cleanly on top.
      const strokeUnderFill = /^stroke\b/.test(t.paintOrder || '') && lum > 0.5;
      if (strokeUnderFill) continue;
      // must be a CHROMATIC paint to be the accent-garble signature (grey/black thick stroke is not it).
      if (sat < ctx.TH.PAINT_SAT_MIN) continue;
      out.push({ cat: 'DOUBLE-PAINT', sev: 'HARD', step: k,
        msg: `garbled text "${String(t.text).slice(0, 20)}": SVG <text> stroked with a saturated ${(t.strokeW).toFixed(1)}px paint rgb(${sc.r|0},${sc.g|0},${sc.b|0}) (sat=${sat.toFixed(2)}, ΔE→white=${dE_white.toFixed(0)}, ΔE→bg=${dE_bg.toFixed(0)}, paint-order="${t.paintOrder||'normal'}") — a colored stroke doubles/outlines the glyphs (the global \`[data-arch-step].is-arch-current{stroke:accent;stroke-width:4}\` rule painting <text>)` });
    }
  });
  return dedupeFirstStep(out);
}

function shortKey(k) { return String(k).replace(/#\d+$/, '').replace(/:.*$/, '').slice(0, 22); }
function dedupeFirstStep(arr) {
  const seen = new Map();
  for (const d of arr) { const sig = d.cat + '|' + d.msg.replace(/step \d+/, 'step ?'); if (!seen.has(sig)) seen.set(sig, d); }
  return [...seen.values()];
}

/* =========================================================================
   DECK driver: navigate to slide N, both themes, step 0..maxStep, capture.
   ========================================================================= */
async function runDeck(browser, target, TH) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const result = { name: target.name, kind: 'deck', themes: {} };
  try {
    await page.goto(deckUrl(target.deck), { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 20000 });
    await page.addStyleTag({ content: '.toolbar{visibility:hidden!important}' });
    await page.waitForTimeout(700);
    const isDark = () => page.evaluate(() => {
      const m = getComputedStyle(document.querySelector('.slide.is-active')).backgroundColor.match(/\d+/g) || [255, 255, 255];
      return (+m[0] + +m[1] + +m[2]) < 200;
    });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      if ((theme === 'dark') !== await isDark()) { await page.keyboard.press('d'); await page.waitForTimeout(300); }
      await page.evaluate(i => { location.hash = '#/' + i; }, target.slide);
      await page.waitForTimeout(500);
      const meta = await page.evaluate(() => {
        const c = document.querySelector('.slide.is-active');
        return { label: c && c.dataset.screenLabel, max: parseInt(c && c.dataset.maxStep || '0', 10) || 0,
          type: c && c.dataset.type };
      });
      const maxStep = meta.max;
      const steps = [];
      for (let k = 0; k <= maxStep; k++) {
        if (k > 0) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(360); }
        const cap = await page.evaluate(({ opt }) => {
          const fn = window.__VIZCAP;  // injected below
          return fn('.slide.is-active', opt);
        }, { opt: TH });
        // sample background colour for void/near-bg checks
        cap.bg = await page.evaluate(() => {
          const c = getComputedStyle(document.querySelector('.slide.is-active')).backgroundColor.match(/[\d.]+/g) || [255, 255, 255];
          return { r: +c[0], g: +c[1], b: +c[2], a: c[3] === undefined ? 1 : +c[3] };
        });
        steps.push(cap);
      }
      result.themes[theme] = { meta, maxStep, steps,
        defects: analyze(steps, { TH }, meta.type) };
    }
  } catch (e) {
    result.error = String(e).slice(0, 200);
  } finally { await ctx.close(); }
  return result;
}

/* =========================================================================
   BOOK driver: load built chapter, drive widget via window.__figs[beat].setStep.
   ========================================================================= */
async function runBook(browser, target, TH) {
  const result = { name: `${target.widget} (book ${target.chapter}·${target.beat})`, kind: 'book', themes: {} };
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    try {
      await page.addInitScript((t) => {
        try { localStorage.setItem('lecture.template.prefs.v1', JSON.stringify({ theme: t, lang: 'en' })); } catch {}
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
      await page.goto(bookUrl(target.chapter), { waitUntil: 'networkidle' });
      // wait for the page script to mount widgets onto window.__figs
      await page.waitForFunction((beat) => window.__figs && window.__figs[beat] &&
        typeof window.__figs[beat].setStep === 'function', target.beat, { timeout: 15000 })
        .catch(() => {});
      const has = await page.evaluate((beat) => !!(window.__figs && window.__figs[beat]), target.beat);
      if (!has) { result.themes[theme] = { error: `widget beat "${target.beat}" not mounted (window.__figs miss)` }; await ctx.close(); continue; }
      const maxStep = await page.evaluate((beat) => window.__figs[beat].maxStep, target.beat);
      // scroll the figure into view so it has a real laid-out box
      await page.evaluate((beat) => {
        const host = document.getElementById('fig-' + beat);
        if (host) host.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, target.beat);
      await page.waitForTimeout(250);
      const steps = [];
      for (let k = 0; k <= maxStep; k++) {
        await page.evaluate(({ beat, kk }) => window.__figs[beat].setStep(kk), { beat: target.beat, kk: k });
        await page.waitForTimeout(220);
        const cap = await page.evaluate(({ beat, opt }) => {
          const host = document.getElementById('fig-' + beat);
          return window.__VIZCAP(host, opt);
        }, { beat: target.beat, opt: TH });
        cap.bg = await page.evaluate((beat) => {
          const host = document.getElementById('fig-' + beat);
          let n = host, c = null;
          while (n) { const bgc = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
            if (bgc && (+bgc[3] === undefined || +bgc[3] > 0.1) && !(+bgc[0] === 0 && +bgc[1] === 0 && +bgc[2] === 0 && bgc[3] === '0')) {
              if (!(bgc[3] !== undefined && +bgc[3] < 0.05)) { c = { r: +bgc[0], g: +bgc[1], b: +bgc[2], a: bgc[3] === undefined ? 1 : +bgc[3] }; if (c.a > 0.1) break; }
            }
            n = n.parentElement; }
          return c || { r: 255, g: 255, b: 255, a: 1 };
        }, target.beat);
        steps.push(cap);
      }
      result.themes[theme] = { maxStep, steps, defects: analyze(steps, { TH }, 'widget') };
    } catch (e) {
      result.themes[theme] = { error: String(e).slice(0, 200) };
    } finally { await ctx.close(); }
  }
  return result;
}

// run all detectors over a step array.
function analyze(steps, ctx, type) {
  if (!steps.length || !steps[0].ok) return [{ cat: 'CAPTURE', sev: 'WARN', step: 0, msg: 'no capture' }];
  // attach bg to each step's capture so the colour + double-paint detectors can read it.
  for (const s of steps) if (s.bg) s.bgParsed = s.bg;
  const colorSteps = steps.map(s => ({ ...s, bg: s.bgParsed || s.bg }));
  return [
    ...detectStepProgression(steps, ctx),
    ...detectOverlapOOB(steps, ctx),       // includes DETECTOR B (text overprint)
    ...detectColor(colorSteps, ctx),
    ...detectDoublePaint(steps, ctx),      // DETECTOR A (colored stroke on <text> = garble)
  ];
}

/* =========================================================================
   SELFTEST — proves the gate in BOTH directions:
     A) TRUE-DEFECT fixtures — every real defect class MUST still fire (detection
        power preserved): all-static-everything-at-step-0, real label overlap,
        real ΔE<9 colour collision, and a real SMALL out-of-bounds label.
     B) FALSE-POSITIVE fixtures — the three confirmed cry-wolf cases MUST stay
        SILENT after the refinement: a KaTeX-style ~9000px measuring span (FP#1),
        a DOM-box step-by-step reveal (FP#2), and an in-place TRANSFORMATION where
        marks move/rescale each step (FP#3).
   ========================================================================= */
async function selftest(browser) {
  let ok = true;
  const page = await (await browser.newContext({ viewport: { width: 900, height: 700 } })).newPage();

  // helper: render the given HTML, step it `stepCount` times via stepFn(k), capture each step.
  async function capStage(html, stepCount, stepFn) {
    await page.setContent(`<div id="stage" style="position:relative;width:600px;height:400px;background:#fff;overflow:visible">${html}</div>`);
    const steps = [];
    for (let k = 0; k < stepCount; k++) {
      await page.evaluate(({ kk, body }) => { (new Function('k', body))(kk); }, { kk: k, body: stepFn });
      const cap = await page.evaluate(({ opt }) => window.__VIZCAP('#stage', opt), { opt: TH });
      cap.bg = { r: 255, g: 255, b: 255, a: 1 };
      steps.push(cap);
    }
    return steps;
  }
  const pass = (label, fired, want, detail) => {
    const good = fired === want;
    ok = ok && good;
    const verdict = want ? (fired ? 'FIRE' : 'NO FLAG (BLIND)') : (fired ? 'FIRE (FALSE POSITIVE)' : 'silent');
    console.log(`${good ? ' ok ' : 'FAIL'} ${label}: ${verdict}${detail ? ' — ' + detail : ''}`);
  };

  console.log('── A) TRUE-DEFECT fixtures (must FIRE) ──');

  // A1) ALL-AT-STEP-0 + FROZEN: 6 rects all visible from step 0, nothing toggles/moves per step.
  //     This is the original s17/s37 "dump everything and freeze" defect — must STILL be HARD.
  const fxAll = `<svg width="600" height="300" viewBox="0 0 600 300">
    ${[0,1,2,3,4,5].map(i => `<rect class="dot" x="${20+i*90}" y="40" width="60" height="60" fill="rgb(${40+i*30},90,200)"/>`).join('')}
  </svg>`;
  const dAll = detectStepProgression(await capStage(fxAll, 4, 'void 0'), { TH });
  const firedAll = dAll.some(d => /step-0 coverage|dead step/i.test(d.msg));
  pass('A1 step-progression (all-static@0)', firedAll, true, firedAll && (dAll.find(d=>/coverage|dead/i.test(d.msg))||{}).msg);

  // A2) OVERLAPPING LABELS: two distinct <text> printed at the same coordinate.
  const fxOver = `<svg width="600" height="300" viewBox="0 0 600 300">
    <text x="300" y="150" font-size="20" fill="#000">ALPHA</text>
    <text x="300" y="150" font-size="20" fill="#333">BETALONG</text>
    <rect class="dot" x="20" y="20" width="40" height="40" fill="#2A6FDB"/>
  </svg>`;
  const dOver = detectOverlapOOB(await capStage(fxOver, 2, 'void 0'), { TH });
  pass('A2 overlap (stacked labels)', dOver.some(d => d.cat === 'OVERLAP'), true, (dOver.find(d=>d.cat==='OVERLAP')||{}).msg);

  // A3) COLOUR COLLISION: two DISTINCT categories (different data-role) with near-identical fill.
  const fxColor = `<svg width="600" height="300" viewBox="0 0 600 300">
    <rect class="catA" data-role="positive" x="40" y="40" width="80" height="80" fill="rgb(70,130,180)"/>
    <rect class="catB" data-role="negative" x="200" y="40" width="80" height="80" fill="rgb(72,132,182)"/>
    <rect class="catC" data-role="neutral"  x="360" y="40" width="80" height="80" fill="rgb(220,80,40)"/>
  </svg>`;
  const dColor = detectColor((await capStage(fxColor, 2, 'void 0')).map(s => ({ ...s, bg: { r:255,g:255,b:255,a:1 } })), { TH });
  pass('A3 colour-collision (ΔE<9)', dColor.some(d => /colour collision/i.test(d.msg)), true, (dColor.find(d=>/collision/i.test(d.msg))||{}).msg);

  // A4) REAL SMALL OOB: a label whose box pokes a handful of px past the SVG viewBox right edge.
  //     viewBox width 300; label sits at x≈292 so it overruns by a small amount — must STILL fire,
  //     i.e. the KaTeX exclusion (which only drops >3× / >2400px boxes) does NOT mask real OOB.
  const fxOOB = `<svg width="300" height="120" viewBox="0 0 300 120" style="overflow:visible">
    <rect class="bg" x="0" y="0" width="300" height="120" fill="#fff"/>
    <text x="292" y="60" font-size="18" fill="#000">labelXYZ</text>
  </svg>`;
  const dOOB = detectOverlapOOB(await capStage(fxOOB, 2, 'void 0'), { TH });
  pass('A4 small-OOB (label past edge)', dOOB.some(d => d.cat === 'OOB'), true, (dOOB.find(d=>d.cat==='OOB')||{}).msg);

  console.log('── B) FALSE-POSITIVE fixtures (must stay SILENT) ──');

  // B1) FP#1 — KaTeX off-screen MEASURING span: a tiny visible glyph SVG (40×24) containing a
  //     <path> whose box is ~9000px wide, wrapped in a `.katex` ancestor exactly like KaTeX emits.
  //     The OOB detector must NOT flag that path (it is excluded both by `.katex` and by >3×frame).
  const fxKatex = `<span class="katex"><svg width="40" height="24" viewBox="0 0 40 24" style="overflow:visible">
    <rect class="glyph" x="2" y="2" width="36" height="20" fill="#222"/>
    <path d="M2 2 H9035 V25 H2 Z" fill="#111"/>
  </svg></span>`;
  const dKatex = detectOverlapOOB(await capStage(fxKatex, 2, 'void 0'), { TH });
  pass('B1 KaTeX 9000px measuring span', dKatex.some(d => d.cat === 'OOB'), false,
    `captured shapes (non-KaTeX)=${(await capStage(fxKatex, 1, 'void 0'))[0].shapes.length}`);

  // B2) FP#2 — DOM-BOX walkthrough: 5 HTML cards ([data-step]), each .is-step-hidden until its step.
  //     Almost no SVG geometry. The step engine reveals one more card per step → the gate must read
  //     a real 1→2→3→4→5 reveal (via domNodes) and find NO dead steps.
  const fxDomReveal = `<style>.walk-step.is-step-hidden{display:none}</style>
    <div class="walk-flow">
      ${[0,1,2,3,4].map(i => `<div class="walk-step is-step-hidden" data-step="${i}" style="height:40px">card ${i}</div>`).join('')}
    </div>`;
  const stepFnReveal = `const cards=document.querySelectorAll('.walk-step');cards.forEach((c,i)=>c.classList.toggle('is-step-hidden', i>k));`;
  const stepsDom = await capStage(fxDomReveal, 5, stepFnReveal);
  const dDom = detectStepProgression(stepsDom, { TH });
  pass('B2 DOM-box step reveal', dDom.some(d => d.sev === 'HARD'), false,
    `domNode count/step: ${stepsDom.map(s => s.count).join('→')}`);

  // B3) FP#3 — IN-PLACE TRANSFORMATION: 8 bars present from step 0 (coverage 100%) but RESCALING
  //     in place every step (heights driven by k) — LayerNorm/t-SNE/PCA-style positional reveal.
  //     coverage≥85% would have fired the old count-only check; the movement guard keeps it silent.
  const fxTransform = `<svg width="600" height="300" viewBox="0 0 600 300">
    ${[0,1,2,3,4,5,6,7].map(i => `<rect class="ln-bar" data-i="${i}" x="${20+i*70}" y="40" width="40" height="40" fill="#3A7"/>`).join('')}
  </svg>`;
  const stepFnTransform = `document.querySelectorAll('.ln-bar').forEach((r,i)=>{const h=40+((i+1)*(k+1)*7)%180;r.setAttribute('height',String(h));r.setAttribute('y',String(40+(k*9)));});`;
  const stepsTr = await capStage(fxTransform, 4, stepFnTransform);
  const dTr = detectStepProgression(stepsTr, { TH });
  pass('B3 in-place transform (move/rescale)', dTr.some(d => d.sev === 'HARD'), false,
    `coverage0=${((stepsTr[0].count/stepsTr[stepsTr.length-1].count)*100).toFixed(0)}%, count/step: ${stepsTr.map(s=>s.count).join('→')}`);

  console.log('── C) DETECTOR A — double-paint (colored stroke on SVG <text>) ──');

  // C1 (A FIRES): a stepped <text> with stroke:#2a6fdb; stroke-width:4 — the exact accent
  //     double-paint the global `[data-arch-step].is-arch-current{stroke:accent;stroke-width:4}`
  //     rule produces on text. Saturated, ΔE≈42 to white, 4px → must be HARD.
  const fxGarble = `<svg width="600" height="200" viewBox="0 0 600 200">
    <text x="60" y="110" font-size="40" fill="#0b1020" stroke="#2a6fdb" stroke-width="4">normed x</text>
  </svg>`;
  const dGarble = detectDoublePaint(await capStage(fxGarble, 1, 'void 0'), { TH });
  pass('C1 accent-stroke garble (#2a6fdb 4px)', dGarble.some(d => d.cat === 'DOUBLE-PAINT' && d.sev === 'HARD'), true,
    (dGarble.find(d=>d.cat==='DOUBLE-PAINT')||{}).msg);

  // C2 (A SILENT): the LEGIT halo — a 3px NEAR-WHITE stroke with paint-order:stroke (stroke drawn
  //     UNDER the fill, the s36 PC-label / glove-map technique). ΔE(white→white)=0 < HALO_DELTA_E
  //     AND paint-order puts stroke below fill → never flagged, regardless of the 3px width.
  const fxHalo = `<svg width="600" height="200" viewBox="0 0 600 200">
    <text x="60" y="110" font-size="40" fill="#0b1020" stroke="#ffffff" stroke-width="3" style="paint-order:stroke fill">PC&#8321;</text>
  </svg>`;
  const dHalo = detectDoublePaint(await capStage(fxHalo, 1, 'void 0'), { TH });
  pass('C2 near-white halo (paint-order:stroke)', dHalo.some(d => d.cat === 'DOUBLE-PAINT'), false,
    `stroke captured = ${(await capStage(fxHalo,1,'void 0'))[0].labels.find(l=>l.isSvgText)?.strokePaint || '(none)'} @ paint-order="${(await capStage(fxHalo,1,'void 0'))[0].labels.find(l=>l.isSvgText)?.paintOrder}"`);

  // C3 (A FIRES — the CONTRASTIVE-SPACE bug class): a neighbour LABEL stroked with a saturated
  //     category colour (c-green #3A8A5C / c-red #D7522C) at 2.5px and NO paint-order halo — the exact
  //     state the bare `.cs-pos{stroke:c-green}` / `.cs-neg{stroke:c-red}` cascade produced on every
  //     `.cs-pt-lbl` (overriding the bg-card halo). Saturated + 2.5px (≥PAINT_STROKE_W) + far from
  //     white/bg → must be HARD. This is the planted twin of the bug that slipped through because
  //     contrastive-space was not a gate target. (Both pos green and neg red are exercised.)
  const fxCsBug = `<svg width="600" height="200" viewBox="0 0 600 200">
    <text x="60" y="80" font-size="22" fill="#1F6B40" stroke="#3A8A5C" stroke-width="2.5">dog</text>
    <text x="60" y="140" font-size="22" fill="#D7522C" stroke="#D7522C" stroke-width="2.5">france</text>
  </svg>`;
  const dCsBug = detectDoublePaint(await capStage(fxCsBug, 1, 'void 0'), { TH });
  pass('C3 contrastive label saturated-stroke (c-green/c-red 2.5px, no halo)',
    dCsBug.some(d => d.cat === 'DOUBLE-PAINT' && d.sev === 'HARD'), true,
    (dCsBug.find(d=>d.cat==='DOUBLE-PAINT')||{}).msg);

  // C4 (A SILENT — the FIXED contrastive label): the category colour is carried by FILL only, the
  //     stroke is the bg-card HALO with paint-order:stroke (light outline UNDER the glyph). Light bg
  //     (white) → ΔE→white = 0 < HALO_DELTA_E AND paint-order:stroke + light stroke → both silencers
  //     hold. Dark bg uses a near-black-but-LOW-SAT halo (#1A1F2B, sat≈0.40 but ΔE→that-bg ≈ 0 since
  //     we pass it as the step bg) — exercised in the second fixture below.
  const fxCsFix = `<svg width="600" height="200" viewBox="0 0 600 200">
    <text x="60" y="80" font-size="22" fill="#1F6B40" stroke="#ffffff" stroke-width="2.5" style="paint-order:stroke fill">dog</text>
    <text x="60" y="140" font-size="22" fill="#D7522C" stroke="#ffffff" stroke-width="2.5" style="paint-order:stroke fill">france</text>
  </svg>`;
  const dCsFix = detectDoublePaint(await capStage(fxCsFix, 1, 'void 0'), { TH });
  pass('C4 fixed contrastive label (bg-card halo, paint-order:stroke, colour in fill)',
    dCsFix.some(d => d.cat === 'DOUBLE-PAINT'), false,
    `stroke=${(await capStage(fxCsFix,1,'void 0'))[0].labels.find(l=>l.isSvgText)?.strokePaint} fill=${(await capStage(fxCsFix,1,'void 0'))[0].labels.find(l=>l.isSvgText)?.fillPaint} @ paint-order="${(await capStage(fxCsFix,1,'void 0'))[0].labels.find(l=>l.isSvgText)?.paintOrder}"`);

  console.log('── D) DETECTOR B — text-over-text overprint (IoU-blind cases) ──');

  // D1 (B FIRES): a WIDE title sitting on a NARROW column header — DIFFERENT strings, same band.
  //     This is the s30 shape: IoU is LOW (the wide title dominates the union) so the old IoU≥0.45
  //     test was blind; the smaller-box-coverage metric buries the header ≥65% → HARD. (The title is
  //     deliberately given as an HTML overlay div to also exercise the HTML-text-over-SVG-text pair.)
  const fxOverprint = `<div style="position:relative">
    <svg width="600" height="200" viewBox="0 0 600 200" style="position:absolute;inset:0">
      <text x="120" y="40" font-size="13" transform="rotate(-50 120 40)">queen</text>
    </svg>
    <div class="blk-label" style="position:absolute;left:20px;top:20px;width:420px;font-size:23px">co-occurrence matrix X · how often i sits near j</div>
  </div>`;
  const dOverprint = detectOverlapOOB(await capStage(fxOverprint, 1, 'void 0'), { TH });
  pass('D1 title-over-header overprint (HTML×SVG)', dOverprint.some(d => d.cat === 'OVERLAP'), true,
    (dOverprint.find(d=>d.cat==='OVERLAP')||{}).msg);

  // D2 (B SILENT — text over its OWN background rect): the overprint check is TEXT-vs-TEXT only,
  //     so a label sitting inside its own background chip/rect must NOT fire here (that is the
  //     COLOR detector's job). Single <text> + a backing <rect>, no second text → silent.
  const fxTextOnRect = `<svg width="600" height="200" viewBox="0 0 600 200">
    <rect x="40" y="60" width="220" height="60" rx="6" fill="#e8eefc"/>
    <text x="60" y="100" font-size="28" fill="#0b1020">on the sphere</text>
  </svg>`;
  const dTextOnRect = detectOverlapOOB(await capStage(fxTextOnRect, 1, 'void 0'), { TH });
  pass('D2 text-over-own-rect (not text-vs-text)', dTextOnRect.some(d => d.cat === 'OVERLAP'), false,
    `labels=${(await capStage(fxTextOnRect,1,'void 0'))[0].labels.length}`);

  // D3 (B SILENT — halo/duplicate for shadow): the SAME string painted twice at the same spot to
  //     fake a drop-shadow/outline. Same-string pairs are skipped → never an overprint.
  const fxShadow = `<svg width="600" height="200" viewBox="0 0 600 200">
    <text x="60" y="100" font-size="32" fill="#fff" stroke="#fff" stroke-width="3">on the sphere</text>
    <text x="60" y="100" font-size="32" fill="#0b1020">on the sphere</text>
  </svg>`;
  const dShadow = detectOverlapOOB(await capStage(fxShadow, 1, 'void 0'), { TH });
  pass('D3 shadow duplicate (same string)', dShadow.some(d => d.cat === 'OVERLAP'), false,
    `label pairs share string "on the sphere"`);

  console.log('── E) SEMANTIC COLOR CONTRACT — static off-token / off-contract scan ──');
  // Load the REAL contract palette from tokens/design-tokens.css (the source of truth the scan uses).
  const ctk = loadContractTokens(ROOT);
  const tokenNames = ctk.map(t => t.name);
  pass('E0 contract palette loaded from token file', tokenNames.includes('--accent') && tokenNames.includes('--c-red')
    && tokenNames.includes('--c-green') && tokenNames.length >= 10, true, `${ctk.length} tokens: ${tokenNames.slice(0, 6).join(', ')}…`);

  // E1 (FIRES — OFF-CONTRACT): a semantic SVG fill with a ROGUE red (#C0392B) — a SECOND "negative"
  //     hue not on the approved palette (ΔE≈12 to --c-red). This is the exact live-deck violation
  //     (the O(n²) attention-cost curve). MUST fire as CONTRACT/OFF-CONTRACT.
  const fxRogue = `<svg viewBox="0 0 100 50"><path d="M0 0 H100" fill="none" stroke="#C0392B" stroke-width="5"/></svg>`;
  const dRogue = scanContractSource(fxRogue, 'html', 'fixture/rogue.html', ctk, CONTRACT_TH);
  pass('E1 off-contract rogue hue (semantic stroke #C0392B)',
    dRogue.some(d => d.cat === 'CONTRACT' && d.sub === 'OFF-CONTRACT'), true,
    (dRogue.find(d => d.sub === 'OFF-CONTRACT') || {}).msg);

  // E2 (FIRES — OFF-TOKEN): the RIGHT colour (#2A6FDB == --accent) but hardcoded, not var(--accent).
  //     Right hue, wrong mechanism (won't theme) → CONTRACT/OFF-TOKEN.
  const fxOffTok = `<svg viewBox="0 0 100 50"><circle cx="20" cy="20" r="8" fill="#2A6FDB"/></svg>`;
  const dOffTok = scanContractSource(fxOffTok, 'html', 'fixture/offtoken.html', ctk, CONTRACT_TH);
  pass('E2 off-token literal (semantic fill #2A6FDB == --accent)',
    dOffTok.some(d => d.cat === 'CONTRACT' && d.sub === 'OFF-TOKEN'), true,
    (dOffTok.find(d => d.sub === 'OFF-TOKEN') || {}).msg);

  // E3 (SILENT — the COMPLIANT pattern): paint via var(--token, #fallback). The hex is only the
  //     themeable fallback inside var() — NOT a raw literal. Plus #fff chip text. Must stay clean.
  const fxClean = `.cs-pos { fill: var(--c-green, #3A8A5C); } .cs-neg { stroke: var(--c-red, #D7522C); }
    .chip-txt { fill: #fff; } .ax { stroke: var(--rule-strong, #B8B19E); }`;
  const dClean = scanContractSource(fxClean, 'css', 'fixture/clean.css', ctk, CONTRACT_TH);
  pass('E3 compliant var(--token,#fallback) + #fff chip', dClean.length > 0, false,
    `defects=${dClean.length} (var() fallbacks + white chip text must NOT count)`);

  // E4 (SILENT — decoration exempt): a raw rgba() inside box-shadow/text-shadow is decoration, not a
  //     semantic paint — must not be flagged.
  const fxDecor = `.pr-node { text-shadow: 0 1px 2px rgba(0,0,0,.35); box-shadow: 0 8px 24px rgba(16,24,40,.08); }`;
  const dDecor = scanContractSource(fxDecor, 'css', 'fixture/decor.css', ctk, CONTRACT_TH);
  pass('E4 shadow rgba() is decoration (not semantic paint)', dDecor.length > 0, false,
    `defects=${dDecor.length}`);

  console.log('\n[selftest]', ok
    ? 'PASS — all TRUE-defect fixtures fire AND all FALSE-positive fixtures stay silent'
    : 'FAIL — a detector is BLIND to a real defect or fires on a false positive');
  return ok ? 0 : 1;
}

// ───────────────────────── report rendering ─────────────────────────
function printResult(r) {
  let hard = 0, warn = 0;
  const lines = [];
  lines.push(`\n=== ${r.name} [${r.kind}] ===`);
  if (r.error) { lines.push(`  !! render error: ${r.error}`); return { hard, warn, text: lines.join('\n') }; }
  for (const theme of ['light', 'dark']) {
    const t = r.themes[theme];
    if (!t) continue;
    if (t.error) { lines.push(`  [${theme}] !! ${t.error}`); continue; }
    const ms = t.maxStep != null ? `maxStep=${t.maxStep}` : '';
    const label = t.meta ? `${t.meta.label} · type=${t.meta.type}` : '';
    const counts = t.steps.map(s => s.ok ? s.count : 'x').join('→');
    lines.push(`  [${theme}] ${label} ${ms}  visible-count/step: ${counts}`);
    const defects = t.defects || [];
    if (!defects.length) { lines.push(`      · clean`); continue; }
    for (const d of defects) {
      if (d.sev === 'HARD') hard++; else warn++;
      lines.push(`      ${d.sev === 'HARD' ? '✗' : '⚠'} [${d.cat} s${d.step} ${d.sev}] ${d.msg}`);
    }
  }
  return { hard, warn, text: lines.join('\n') };
}

// ───────────────────────── main ─────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const browser = await chromium.launch(HARDENED);
  // inject the CAPTURE fn into every page as window.__VIZCAP (defined as a string-built fn).
  const injectCapture = `window.__VIZCAP = ${CAPTURE.toString()};`;

  if (argv.includes('--selftest')) {
    // expose TH + capture for the selftest page evaluations.
    const ctx = await browser.newContext();
    await ctx.addInitScript(injectCapture);
    await ctx.addInitScript(`window.__TH = ${JSON.stringify(TH)};`);
    // override the selftest's page to come from this context
    const origNewContext = browser.newContext.bind(browser);
    browser.newContext = async (...a) => { const c = await origNewContext(...a); await c.addInitScript(injectCapture); return c; };
    const code = await selftest(browser);
    await browser.close();
    process.exit(code);
  }

  // pre-inject CAPTURE into all future contexts.
  const origNewContext = browser.newContext.bind(browser);
  browser.newContext = async (...a) => { const c = await origNewContext(...a); await c.addInitScript(injectCapture); return c; };

  dsrv = await serveDir(LECT);
  const bookBuilt = existsSync(join(DOCS, 'en', 'book', '05', 'index.html'));
  if (bookBuilt) bsrv = await serveDir(DOCS, { base: BASE });

  console.log('slide-viz-gate — scanning L5/L6 stepped targets (deck slides + book widgets), both themes.');
  console.log(`thresholds: step0-cover≥${TH.STEP0_COVER}, IoU≥${TH.IOU_OVERLAP}, ΔE<${TH.DELTA_E_MIN}, void-lum<${TH.VOID_LUM}\n`);

  const results = [];
  let totalHard = 0, totalWarn = 0;
  const out = [];

  for (const tg of DECK_TARGETS) {
    process.stderr.write(`· deck ${tg.name}\n`);
    const r = await runDeck(browser, tg, TH);
    results.push(r);
    const p = printResult(r); totalHard += p.hard; totalWarn += p.warn; out.push(p.text);
    console.log(p.text);
  }
  if (bookBuilt) {
    for (const tg of BOOK_TARGETS) {
      process.stderr.write(`· book ${tg.widget}\n`);
      const r = await runBook(browser, tg, TH);
      results.push(r);
      const p = printResult(r); totalHard += p.hard; totalWarn += p.warn; out.push(p.text);
      console.log(p.text);
    }
  } else {
    console.log('\n(!) docs/ not built — BOOK widget targets SKIPPED. Run `npm run build` then re-run.');
    out.push('\n(!) docs/ not built — BOOK widget targets SKIPPED.');
  }

  // ── SEMANTIC COLOR CONTRACT — static source scan (off-token / off-contract literals) ──
  // Runs once over the L5/L6 deck HTML + every widget style.css/logic.js. Independent of the
  // rendered detectors (it reads the SOURCE, not the painted pixel) — see runContractScan().
  // CONTRACT is now a HARD gate: the L5/L6 decks were token-cleaned (every semantic fill/stroke
  // paints with a contract token, no rogue hues), so BOTH sub-checks fail the build. OFF-TOKEN (a
  // raw hex that EQUALS a token → won't theme) and OFF-CONTRACT (a rogue off-palette hue) are each
  // HARD — no WARN-only cap, no CONTRACT_HARD env gate. A future drift re-introducing either kind of
  // literal now breaks the build instead of silently warning.
  const contract = runContractScan(ROOT);
  const cLines = [];
  cLines.push(`\n=== SEMANTIC COLOR CONTRACT scan (${contract.fileCount} source files; palette = tokens/design-tokens.css :root, ${contract.tokens.length} tokens) ===`);
  let cHard = 0, cWarn = 0;
  if (!contract.defects.length) {
    cLines.push('  · clean — every semantic fill/stroke uses a contract token, no rogue hues');
  } else {
    const offTok = contract.defects.filter(d => d.sub === 'OFF-TOKEN');
    const offCon = contract.defects.filter(d => d.sub === 'OFF-CONTRACT');
    cLines.push(`  off-token literals: ${offTok.length}  ·  off-contract rogue hues: ${offCon.length}`);
    for (const d of contract.defects) {
      // HARD for both OFF-TOKEN and OFF-CONTRACT — the decks are clean, so any contract literal fails.
      const sev = 'HARD';
      if (sev === 'HARD') cHard++; else cWarn++;
      cLines.push(`      ${sev === 'HARD' ? '✗' : '⚠'} [CONTRACT/${d.sub} ${sev}] ${d.msg}`);
    }
  }
  const contractText = cLines.join('\n');
  console.log(contractText);
  out.push(contractText);
  totalHard += cHard; totalWarn += cWarn;

  // worst-target ranking
  const ranked = results.map(r => {
    let h = 0, w = 0;
    for (const th of Object.values(r.themes || {})) for (const d of (th.defects || [])) (d.sev === 'HARD' ? h++ : w++);
    return { name: r.name, kind: r.kind, h, w };
  }).sort((a, b) => (b.h - a.h) || (b.w - a.w));

  const summary = [];
  summary.push(`\n──────── SUMMARY ────────`);
  summary.push(`targets scanned: ${results.length}  ·  HARD defects: ${totalHard}  ·  WARN: ${totalWarn}`);
  summary.push(`worst targets (by HARD, then WARN):`);
  for (const r of ranked.slice(0, 8)) summary.push(`   ${r.h ? '✗' : (r.w ? '⚠' : '·')} ${r.name} — HARD=${r.h} WARN=${r.w}`);
  const summaryText = summary.join('\n');
  console.log(summaryText);
  out.push(summaryText);

  // write the inventory markdown
  const mdDir = join(ROOT, '_internal', 'l56_viz_defects');
  await mkdir(mdDir, { recursive: true });
  const md = buildMarkdown(results, ranked, { totalHard, totalWarn });
  await writeFile(join(mdDir, 'AUTODETECT.md'), md);
  console.log(`\n[slide-viz-gate] wrote inventory → _internal/l56_viz_defects/AUTODETECT.md`);

  const jsonIdx = argv.indexOf('--json');
  if (jsonIdx >= 0 && argv[jsonIdx + 1]) await writeFile(argv[jsonIdx + 1], JSON.stringify(results, null, 2));

  await browser.close(); await dsrv.close(); if (bsrv) await bsrv.close();
  console.log(`\n[slide-viz-gate] HARD(stepprog/overlap/overprint/oob/colorcollision/double-paint/contract)=${totalHard}  WARN(color/void/lowhue/borderline-overprint/contract)=${totalWarn}`);
  console.log(`[slide-viz-gate] color-contract: OFF-TOKEN+OFF-CONTRACT literals found = ${contract.defects.length} (HARD=${cHard} WARN=${cWarn}) [HARD — both sub-checks fail the build; decks are token-clean]`);
  // The CONTRACT sub-check is now a HARD build gate: a contract HARD defect (off-token / off-contract
  // literal) ALWAYS fails the process — independent of --strict — so a future colour drift breaks the
  // build instead of warning. The rendered detectors (step-prog / overlap / colour / double-paint)
  // keep their --strict leniency, exactly as before.
  const strict = argv.includes('--strict');
  process.exit((cHard > 0 || (strict && totalHard > 0)) ? 1 : 0);
}

function buildMarkdown(results, ranked, tot) {
  const L = [];
  L.push('# Auto-detected L5/L6 visual-semantics defect inventory');
  L.push('');
  L.push('_Generated by `_audit/slide-viz-gate.mjs` — the gate that catches the defect classes the existing gates (visual-gate / responsive-gate / scroll-step-gate) pass HARD=0 on._');
  L.push('');
  L.push(`Run: ${new Date().toISOString()}`);
  L.push('');
  L.push('## Detectors & thresholds');
  L.push('| detector | measures | threshold |');
  L.push('|---|---|---|');
  L.push(`| STEP-PROGRESSION | visible meaningful elements per step; step-0 coverage % of final; dead steps | step-0 ≥ ${TH.STEP0_COVER*100}% ⇒ HARD; unchanged later step ⇒ HARD |`);
  L.push(`| OVERLAP / OOB | distinct text-label IoU & centre distance; element box vs SVG viewBox | IoU ≥ ${TH.IOU_OVERLAP} or centres ≤ ${TH.CENTER_PX}px ⇒ HARD; box exits frame ⇒ HARD |`);
  L.push(`| OVERPRINT (text-over-text, both namespaces) | smaller-box coverage between two DIFFERENT-string text nodes (SVG \`<text>\` ∪ HTML overlay); both-rotated AABB pairs suppressed | ≥ ${TH.OVERPRINT_COVER*100}% of smaller box buried ⇒ WARN, ≥ 65% ⇒ HARD (catches the IoU-blind title-over-header) |`);
  L.push(`| DOUBLE-PAINT (garbled \`<text>\`) | SVG \`<text>\` stroke colour + width + paint-order vs white/bg | saturated stroke ≥ ${TH.PAINT_STROKE_W}px, ΔE→white & ΔE→bg ≥ ${TH.HALO_DELTA_E}, sat ≥ ${TH.PAINT_SAT_MIN} ⇒ HARD; near-white/near-bg or paint-order-under-fill halo ⇒ silent |`);
  L.push(`| COLOR-COLLISION | CIE76 ΔE between distinct categories; ΔE to background; hue-bucket diversity | ΔE < ${TH.DELTA_E_MIN} & RGBdist < ${TH.RGB_MIN} ⇒ HARD; near-bg / void / low-hue ⇒ WARN |`);
  L.push('');
  L.push(`## Summary — HARD=${tot.totalHard}, WARN=${tot.totalWarn}`);
  L.push('');
  L.push('Worst targets (by HARD then WARN):');
  L.push('');
  for (const r of ranked) L.push(`- ${r.h ? '**✗**' : (r.w ? '⚠' : '·')} \`${r.name}\` — HARD=${r.h} WARN=${r.w}`);
  L.push('');
  L.push('## Per-target detail');
  for (const r of results) {
    L.push('');
    L.push(`### ${r.name} _(${r.kind})_`);
    if (r.error) { L.push(`- render error: ${r.error}`); continue; }
    for (const theme of ['light', 'dark']) {
      const t = r.themes[theme]; if (!t) continue;
      if (t.error) { L.push(`- **[${theme}]** error: ${t.error}`); continue; }
      const counts = (t.steps || []).map(s => s.ok ? s.count : 'x').join('→');
      const meta = t.meta ? ` · ${t.meta.label} · type=${t.meta.type}` : '';
      L.push(`- **[${theme}]** maxStep=${t.maxStep}${meta} · visible-count/step: \`${counts}\``);
      const defects = t.defects || [];
      if (!defects.length) { L.push(`  - clean`); continue; }
      for (const d of defects) L.push(`  - ${d.sev === 'HARD' ? '✗' : '⚠'} **${d.cat}** · step ${d.step} · ${d.sev} — ${d.msg}`);
    }
  }
  L.push('');
  return L.join('\n');
}

main();
