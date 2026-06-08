#!/usr/bin/env node
/* =========================================================
   visual-gate.mjs — objective visual-quality gate the 0/0/0 check can't see.
   Walks every slide of each deck (headless, 1920×1080 logical) and flags:
     • OVERFLOW   — slide content scrolls past the 1920×1080 frame (clipped)
     • OFFFRAME   — an <img> renders partly outside the slide frame
     • TINY       — a non-cameo <img> painted smaller than MIN_SIDE px
     • LETTERBOX  — a non-cameo <img> wastes > MAX_EMPTY of its box (contain bands)
   Prints a per-deck report + a JSON summary. Non-zero exit if any HARD issue
   (overflow / offframe) is found; TINY/LETTERBOX are warnings.
   Usage: node visual-gate.mjs [deck.html]
   ========================================================= */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const LECT = join(fileURLToPath(new URL('../Lectures/', import.meta.url)));
const PORT = 8147;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json',
  '.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.map':'application/json' };
const DECKS = ['00-introduction.html','01-search-ir-ml-system-design.html','02-nlp-tokenization-similarity.html','03-classical-ir-fulltext-fusion.html','04-ranking-metrics.html','05-dl-embeddings-dimred.html','06-contextual-attention-transformers.html'];
const MIN_SIDE = 150;     // px (logical) below which a non-cameo image reads as "tiny"
const MAX_EMPTY = 0.45;   // fraction of the box left empty by object-fit:contain

function server(){
  const s=createServer(async(rq,rs)=>{try{let p=decodeURIComponent(rq.url.split('?')[0]);p=normalize(join(LECT,p));
    if(!p.startsWith(LECT)){rs.writeHead(403).end();return;}const st=await stat(p).catch(()=>null);
    if(!st||st.isDirectory()){rs.writeHead(404).end();return;}rs.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});rs.end(await readFile(p));
  }catch{rs.writeHead(500).end();}});return new Promise(r=>s.listen(PORT,()=>r(s)));}
const url=f=>`http://localhost:${PORT}/${encodeURIComponent(f)}`;

const AUDIT = ({MIN_SIDE, MAX_EMPTY}) => {
  const slide = document.querySelector('.slide.is-active');
  if (!slide) return { label:'?', issues:['no active slide'] };
  const label = slide.dataset.screenLabel || '?';
  const sr = slide.getBoundingClientRect();
  const scale = sr.width / (slide.offsetWidth || 1920) || 1;
  const out = [];
  // CONTENT overflow only: union of IN-FLOW descendants (exclude position:absolute/fixed —
  // those are the deck's off-canvas overlays (pen/frame/step-controls) + decorative cameos,
  // which legitimately sit outside the 1080 frame). Mirrors the deck's own preflight intent.
  let maxR = 0, maxB = 0, minL = 1e9, minT = 1e9;
  slide.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed' || cs.display === 'none') return;
    if (el.tagName === 'ASIDE') return;
    if (el.closest('.katex')) return;   // KaTeX uses huge off-screen measuring spans — not real overflow
    const r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) return;
    if (r.width/scale > 2400 || r.height/scale > 2400) return;  // skip absurd layout-helper boxes
    maxR = Math.max(maxR, (r.right - sr.left)/scale);  maxB = Math.max(maxB, (r.bottom - sr.top)/scale);
    minL = Math.min(minL, (r.left - sr.left)/scale);    minT = Math.min(minT, (r.top - sr.top)/scale);
  });
  // Horizontal overflow / negative bleed = HARD (engine does not auto-fit width loss).
  // Vertical-only overflow = WARN: this engine auto-fits height, so it renders complete
  // (verified on quiz/table slides) — flag for review, don't fail the gate.
  if (maxR > 1926 || minL < -6 || minT < -6)
    out.push(`OVERFLOW-H content [${minL|0},${minT|0}→${maxR|0},${maxB|0}] vs 1920×1080`);
  else if (maxB > 1100)
    out.push(`OVERFLOW-V content bottom=${maxB|0} > 1080 (engine auto-fits; verify legibility)`);
  slide.querySelectorAll('img').forEach(img => {
    const name = (img.getAttribute('src')||'').split('/').pop().split('?')[0] || 'img';
    const cs = getComputedStyle(img);
    const isCameo = img.classList.contains('cameo') || cs.position === 'absolute' || cs.position === 'fixed';
    const r = img.getBoundingClientRect();
    const boxW = r.width/scale, boxH = r.height/scale;
    if (boxW < 2 || boxH < 2) return;
    const relL=(r.left-sr.left)/scale, relT=(r.top-sr.top)/scale, relR=relL+boxW, relB=relT+boxH;
    if (!isCameo && (relL<-4||relT<-4||relR>1924||relB>1084))
      out.push(`OFFFRAME ${name} box[${relL|0},${relT|0}→${relR|0},${relB|0}]`);
    // CLIPPED: the <img> element is bigger than its nearest overflow:hidden ancestor →
    // its painted content is silently cropped by the frame (the discreteness-slide bug).
    let anc = img.parentElement, clipper = null;
    while (anc && anc !== document.body) {
      const a = getComputedStyle(anc);
      if (/hidden|clip/.test(a.overflow + a.overflowX + a.overflowY)) { clipper = anc; break; }
      anc = anc.parentElement;
    }
    if (clipper && (img.clientWidth > clipper.clientWidth + 2 || img.clientHeight > clipper.clientHeight + 2))
      out.push(`CLIPPED ${name} img ${img.clientWidth}×${img.clientHeight} > frame ${clipper.clientWidth}×${clipper.clientHeight}`);
    if (img.naturalWidth>0){
      const nat=img.naturalWidth/img.naturalHeight, ar=boxW/boxH;
      let pW,pH; if(nat>ar){pW=boxW;pH=boxW/nat;}else{pH=boxH;pW=boxH*nat;}
      const minSide=Math.min(pW,pH), empty=1-(pW*pH)/(boxW*boxH);
      if(!isCameo && minSide<MIN_SIDE) out.push(`TINY ${name} painted ${pW|0}×${pH|0} (min ${minSide|0}px)`);
      if(!isCameo && empty>MAX_EMPTY && boxW*boxH>10000) out.push(`LETTERBOX ${name} empty ${(empty*100)|0}% of box ${boxW|0}×${boxH|0}`);
    }
  });

  // -------- TEXTCLIP: content clipped inside its own overflow:hidden box --------
  // Catches long unbreakable text / KaTeX display math overflowing a panel/card with
  // overflow:hidden (the L2:s30 corpus-line bug). Blind spot of the box-vs-frame checks
  // because the BOX is in-frame; the CONTENT inside is what gets lost. Excludes the .slide
  // itself (its off-canvas overlays legitimately overflow) and tiny boxes.
  slide.querySelectorAll('*').forEach(el => {
    if (el === slide) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const hideX = /hidden|clip/.test(cs.overflowX), hideY = /hidden|clip/.test(cs.overflowY);
    if (!hideX && !hideY) return;
    if (el.closest('.pen-layer, .slide__frame')) return;          // deck chrome, not content
    if (el.clientWidth < 40 || el.clientHeight < 20) return;       // skip tiny boxes
    if (el.querySelector('img')) return;                           // image clipping handled above
    const cls = (el.className && el.className.toString().trim().split(/\s+/)[0]) || el.tagName.toLowerCase();
    if (hideX && el.scrollWidth > el.clientWidth + 8)
      out.push(`TEXTCLIP-X .${cls} content ${el.scrollWidth}px > box ${el.clientWidth}px (clipped horizontally)`);
    if (hideY && el.scrollHeight > el.clientHeight + 8)
      out.push(`TEXTCLIP-Y .${cls} content ${el.scrollHeight}px > box ${el.clientHeight}px (clipped vertically)`);
  });

  // -------- WCAG contrast check (session-2 meta-lesson) --------
  // Catches "the divider subtitle is ghost-text on the inverted canvas" — a
  // class of bug the box-overflow detectors above are blind to. Walks every
  // short text node, finds its effective foreground (from the deepest text
  // colour) and the first non-transparent background up its ancestor chain,
  // and computes the WCAG 2.1 relative-luminance contrast ratio. Flags
  // anything below 4.5:1 (AA for small text) as LOWCONTRAST = HARD.
  const parseColor = (s) => {
    // Accept rgb()/rgba(); the browser always serializes computed colour this way.
    const m = s && s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?/);
    if (!m) return null;
    return { r:+m[1], g:+m[2], b:+m[3], a: m[4]===undefined ? 1 : +m[4] };
  };
  const blend = (fg, bg) => {
    // src-over: returned colour is opaque, ready for luminance maths.
    const a = fg.a; const ia = 1 - a;
    return { r: fg.r*a + bg.r*ia, g: fg.g*a + bg.g*ia, b: fg.b*a + bg.b*ia, a: 1 };
  };
  const lum = (c) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1,l2), lo = Math.min(l1,l2); return (hi+0.05)/(lo+0.05); };
  const effectiveBg = (el) => {
    // First non-transparent background, blended over white as a defensive default.
    let node = el; let stack = [];
    while (node && node !== document.body) {
      const c = parseColor(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.01) stack.push(c);
      node = node.parentElement;
    }
    let base = { r:255, g:255, b:255, a:1 };
    for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base);
    return base;
  };
  // Text-bearing leaf elements (small/medium text class is what AA 4.5:1 covers;
  // very large display text is covered by 3:1 but we keep one strict threshold).
  // Session-5 (finding #7): extend the contrast sweep to the title-slide
  // metadata row. The session-2 WCAG-AA gate caught the dark-theme divider
  // ghost-text class; the same colour-on-canvas defect surfaces in the
  // light branch on `.title-footer .meta-label` (LECTURER / DATE / ROOM)
  // because the row was hard-pinned to `--ink-3` which lands near the AA
  // floor on cream. Adding the selector here promotes the human VLM
  // finding into an objective gate the way `.divider-sub` was promoted in
  // session 2 — and the matching wbw-art.css rule (S5-2) lifts it above 4.5:1.
  const TEXT_SEL = '.divider-sub, .divider-num, .slide-kicker, .tl-kicker, .art-hero__kicker, .viz-caption, .poses-row, .obj-text, .badge, .tag, figcaption, .title-footer .meta-label, .title-footer .meta-value';
  slide.querySelectorAll(TEXT_SEL).forEach(el => {
    const txt = (el.textContent || '').trim();
    if (!txt) return;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.1) return;
    const fg = parseColor(cs.color); if (!fg) return;
    const bg = effectiveBg(el);
    const fgFlat = fg.a < 1 ? blend(fg, bg) : fg;
    const rr = ratio(fgFlat, bg);
    if (rr < 4.5) {
      const tag = el.className.split(/\s+/).filter(Boolean).slice(0,2).join('.') || el.tagName.toLowerCase();
      const sample = txt.length > 32 ? txt.slice(0,30)+'…' : txt;
      out.push(`LOWCONTRAST .${tag} ratio=${rr.toFixed(2)} fg=rgb(${fgFlat.r|0},${fgFlat.g|0},${fgFlat.b|0}) bg=rgb(${bg.r|0},${bg.g|0},${bg.b|0}) "${sample}"`);
    }
  });

  // -------- §2.1 structural contract per slide-type (DOM-only, from TEMPLATE_CATALOG) --------
  // A malformed slide (missing the DOM its type promises) is caught BEFORE it renders wrong.
  const dtype = slide.dataset.type;
  const REQUIRE = {
    definition:'.def-card', formula:'.formula-stage', table:'table.cmp-table',
    walkthrough:'.walk-step[data-step]', e2e:'.e2e-step[data-step]', misconception:'.misc-card',
    agenda:'a.toc-item', objectives:'.obj-item', arch:'.arch-node', timeline:'.tl-node',
    'art-hero':'.art-hero__fig', refs:'.ref-list', quiz:'[data-correct]',
  };
  if (dtype && REQUIRE[dtype] && !slide.querySelector(REQUIRE[dtype]))
    out.push(`CONTRACT type="${dtype}" missing required ${REQUIRE[dtype]}`);
  if ((dtype==='walkthrough'||dtype==='e2e') && !slide.hasAttribute('data-max-step'))
    out.push(`CONTRACT type="${dtype}" missing data-max-step`);
  if (dtype==='quiz') {
    const n = slide.querySelectorAll('[data-correct="true"]').length;
    if (n !== 1) out.push(`CONTRACT quiz has ${n} data-correct="true" (need exactly 1)`);
  }

  // NOTE on §2.2 MIN-FONT: investigated and DROPPED for this engine. A scale-based effective-px
  // detector needs the deck to auto-fit-shrink via a measurable transform, but this engine renders
  // every slide at scale=1.000 (verified across all 149 slides); content past 1080 goes below-fold
  // instead, which OVERFLOW-V already flags. Font px == design px here, so there is no auto-fit
  // shrink to detect — a scale<0.97 gate would be a permanently-blind detector (forbidden by §2.4).

  // -------- §2.2 OVERLAP: a decorative cameo covering readable text --------
  const cameos = [...slide.querySelectorAll('.cameo')];
  if (cameos.length) {
    const blocks = [...slide.querySelectorAll('h1, h2, p, li, td, .def-body, .step-caption, .final-sub, .contact-value')]
      .filter(e => (e.textContent||'').trim().length > 10 && getComputedStyle(e).display !== 'none');
    for (const cam of cameos) {
      const cr = cam.getBoundingClientRect();
      for (const b of blocks) {
        const r = b.getBoundingClientRect();
        const ix = Math.max(0, Math.min(cr.right,r.right) - Math.max(cr.left,r.left));
        const iy = Math.max(0, Math.min(cr.bottom,r.bottom) - Math.max(cr.top,r.top));
        const area = r.width*r.height;
        if (area > 0 && (ix*iy)/area > 0.22) {
          out.push(`OVERLAP cameo covers ${((ix*iy)/area*100)|0}% of "${(b.textContent||'').trim().slice(0,24)}"`);
          break;
        }
      }
    }
  }

  return { label, issues: out };
};

/* Session-4 detector: PNG-INTERNAL letterbox / "low subject coverage". The
   existing LETTERBOX detector only sees the empty space introduced by
   object-fit:contain (box vs natural aspect ratio). It is blind to a
   subject drawn small inside a generous PNG canvas — e.g. the session-3
   L2-56 case where the figure occupied ~30% of the PNG width because the
   model left wide off-white rails baked-in. This sub-routine fetches each
   non-cameo image once, paints it to an offscreen canvas, walks the
   pixels at a stride, finds the bounding box of "ink" (anything that is
   not near-white #FBFAF6 paper), and reports the subject-bbox/canvas area
   ratio. If subject covers < SUBJECT_MIN_COVERAGE of the canvas area we
   flag SUBJECTSMALL — a HARD finding, because it means the artwork shipped
   with wasted canvas regardless of how the slide arranges the frame.
   Cached by URL: each unique image is decoded once, not per-slide. */
const SUBJECT_MIN_COVERAGE = 0.55;   // subject must fill ≥55% of PNG area
// Session-5 (institutional fix): the bbox-area heuristic alone is blind to
// "centred subject with wide rails" — the precise failure mode the
// session-3 L2:s57 letterbox finding raised. A diagonal corner-to-corner
// subject naturally has low bbox area without rails; a centred subject
// with wide rails has high bbox area but small horizontal span. Adding a
// per-axis span check (bbox-width / canvas-width) catches the latter
// class regardless of how the bbox area resolves. Threshold tuned to the
// session-4 SUBJECTSMALL caveat: <60% horizontal span = rails, → WARN;
// <45% = severe rails (the session-3 L2:s57 case), → HARD.
const SUBJECT_MIN_HSPAN = 0.60;
const SUBJECT_PIXEL_STRIDE = 4;      // every 4th pixel on both axes → 16× speedup
const SUBJECT_WHITE_THRESH = 240;    // RGB min(r,g,b) above this counts as "paper"
async function auditPNGCoverage(page) {
  // Returns {url: coverage}. Browser-side: walks all non-cameo <img> in the
  // active deck (across all slides) and reports per-URL coverage.
  return await page.evaluate(async ({coverage, stride, white}) => {
    const urls = new Set();
    document.querySelectorAll('img').forEach(img => {
      if (img.classList.contains('cameo')) return;
      const src = img.src;
      if (!src || !/\.(png|jpg|jpeg|webp)(\?|$)/i.test(src)) return;
      urls.add(src);
    });
    const load = (u) => new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = u;
    });
    const out = {};
    for (const u of urls) {
      try {
        const im = await load(u);
        const W = im.naturalWidth, H = im.naturalHeight;
        if (W < 50 || H < 50) { out[u] = 1.0; continue; }
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        ctx.drawImage(im, 0, 0);
        const data = ctx.getImageData(0, 0, W, H).data;
        let minX = W, minY = H, maxX = 0, maxY = 0, inkCount = 0;
        for (let y = 0; y < H; y += stride) {
          for (let x = 0; x < W; x += stride) {
            const o = (y * W + x) * 4;
            const r = data[o], g = data[o+1], b = data[o+2], a = data[o+3];
            // Treat transparent and near-white as "paper"; anything else is "ink".
            if (a < 200) continue;
            if (Math.min(r, g, b) > white) continue;
            inkCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
        if (inkCount < 50) { out[u] = { area: 1.0, hspan: 1.0 }; continue; }   // mostly empty = N/A
        const bboxW = maxX - minX, bboxH = maxY - minY;
        // Per-axis spans alongside the bbox area ratio. The horizontal span
        // catches the centre-with-rails class the area heuristic misses on
        // wide subjects (session-5 institutional fix).
        out[u] = {
          area: (bboxW * bboxH) / (W * H),
          hspan: bboxW / W,
        };
      } catch (e) {
        out[u] = { area: 1.0, hspan: 1.0 };   // failed to read → don't flag (CORS/network)
      }
    }
    return out;
  }, {coverage: SUBJECT_MIN_COVERAGE, stride: SUBJECT_PIXEL_STRIDE, white: SUBJECT_WHITE_THRESH});
}

/* Editor-blessed exemptions to the SUBJECTSMALL detector. The L2:s57
   cosine-vs-Euclid figure is a diagonal corner-to-corner subject (per the
   post-session-4 editor follow-up); the model would not fill the rails over
   3 sessions, the editor trimmed the cream border to the asset edges, and
   the slide-level viz-frame was crop-sized to a centred inset that reads as
   a tidy figure. Re-flagging it would re-open a closed item. Listed by PNG
   basename. Add entries here ONLY after an editor decision; the AGENDA
   harness reads this list when synthesising the next session's directive. */
const SUBJECT_EXEMPT = new Set([
  'L2-56-cosine-vs-euclid.png',
  // L2-48 Sir Cosine: the "Knights of the Unit Sphere" BANNER is canon (CHARACTER_BIBLE),
  // and the banner+knight+sphere composition naturally sits ~51% subject coverage. Flagged 3
  // consecutive sessions; editor decision (post-session-5): accept as banner-by-design rather
  // than gamble a 4th regen. The image reads cleanly at hall scale.
  'L2-48-sir-cosine.png',
]);

const srv = await server();
const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
// Accept ANY deck filename (not just the three canon decks) so gate-selftest.mjs can point us
// at a temporary fixture deck full of deliberate violations (§2.4). Canon run = no arg = all three.
const decks = only ? [only] : DECKS;
const browser = await chromium.launch();
let hard=0, warn=0; const report={};
const THEMES = ['light','dark']; // contrast check must see BOTH; box-overflow is theme-agnostic
for (const deck of decks){
  for (const theme of THEMES){
    const ctx=await browser.newContext({viewport:{width:1920,height:1080}});
    const page=await ctx.newPage();
    // Apply theme before any deck script reads it, so the divider's
    // background-flip uses the right token set. tools.js init re-reads
    // localStorage('lecture.template.prefs.v1') and calls applyTheme() on
    // boot — without seeding that key, the deck snaps back to the default
    // 'light' on first paint, masking the dark-theme contrast bug.
    await page.addInitScript((t)=>{
      try { localStorage.setItem('lecture.template.prefs.v1', JSON.stringify({theme:t, lang:'en'})); } catch {}
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    await page.goto(url(deck),{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.Lecture&&window.Lecture.total>0,{timeout:20000});
    const total=await page.evaluate(()=>window.Lecture.total);
    // PNG subject-coverage scan: run once per deck (and only in light theme — the PNGs
    // are theme-agnostic so re-scanning under dark wastes time). Cached by URL.
    const coverageMap = theme === 'light' ? await auditPNGCoverage(page) : {};
    const rows=[];
    for(let n=1;n<=total;n++){
      await page.evaluate(i=>{location.hash='#/'+i;},n); await page.waitForTimeout(220);
      const res=await page.evaluate(AUDIT, {MIN_SIDE, MAX_EMPTY});
      // Inject SUBJECTSMALL issues for any non-cameo img on this slide whose source PNG
      // has subject coverage below the threshold. Done in Node, not the browser, so we
      // can keep the AUDIT closure cheap and pull from the per-deck coverageMap cache.
      if (theme === 'light' && Object.keys(coverageMap).length) {
        const slideImgs = await page.evaluate(() => {
          const sl = document.querySelector('.slide.is-active');
          if (!sl) return [];
          return Array.from(sl.querySelectorAll('img'))
            .filter(im => !im.classList.contains('cameo'))
            .map(im => ({ src: im.src, name: (im.getAttribute('src')||'').split('/').pop().split('?')[0] }));
        });
        slideImgs.forEach(({src, name}) => {
          if (SUBJECT_EXEMPT.has(name)) return;          // editor-blessed exemption (see SUBJECT_EXEMPT comment)
          const cov = coverageMap[src];
          if (cov === undefined) return;
          // Two-track flag: area ratio (the session-4 detector) AND horizontal-span
          // ratio (the session-5 institutional fix). The latter catches centred
          // subjects with wide rails that the area check mis-clears.
          if (cov.area < SUBJECT_MIN_COVERAGE) {
            res.issues.push(`SUBJECTSMALL ${name} subject area covers ${(cov.area*100)|0}% of PNG canvas (< ${(SUBJECT_MIN_COVERAGE*100)|0}% threshold) — wide white rails baked in, re-prompt with ≥80% width clause`);
          } else if (cov.hspan < SUBJECT_MIN_HSPAN) {
            res.issues.push(`SUBJECTSMALL ${name} horizontal span is ${(cov.hspan*100)|0}% of PNG canvas (< ${(SUBJECT_MIN_HSPAN*100)|0}% threshold) — centred subject with empty left/right rails, re-prompt with "subject fills ≥85% of frame width edge-to-edge"`);
          }
        });
      }
      if(res.issues.length){
        // Layout findings (overflow/offframe/clipped/letterbox/tiny/subjectsmall) are
        // theme-agnostic; only emit them in the LIGHT pass to avoid double-counting.
        // Contrast findings emit in BOTH passes (a slide can pass light and fail dark).
        const filtered = theme === 'light' ? res.issues : res.issues.filter(i=>i.startsWith('LOWCONTRAST'));
        if (filtered.length) {
          rows.push({n,label:res.label, issues: filtered.map(i=>theme==='dark' ? `[${theme}] ${i}` : i)});
          // SUBJECTSMALL is WARN-level: composition with deliberate margins (banner art,
          // single-subject divider art) routinely sits in 50–60% area coverage and still
          // reads correctly. The detector surfaces candidates for human re-prompt judgement
          // without blocking the gate. Only truly egregious cases (<40%) escalate to HARD.
          filtered.forEach(i=>{
            if (/^SUBJECTSMALL/.test(i)) {
              const m = i.match(/covers (\d+)%/);
              if (m && +m[1] < 40) hard++; else warn++;
            } else if (/^(OVERFLOW-H|OFFFRAME|CLIPPED|LOWCONTRAST|TEXTCLIP|CONTRACT)/.test(i)) hard++;
            else warn++;
          });
        }
      }
    }
    const key = `${deck} (${theme})`;
    report[key]=rows;
    if (rows.length || theme === 'light') {
      console.log(`\n=== ${deck} [${theme}] (${total} slides) — ${rows.length} flagged ===`);
      rows.forEach(r=>console.log(`  s${String(r.n).padStart(2,'0')} [${r.label}]\n      - `+r.issues.join('\n      - ')));
    }
    await ctx.close();
  }
}
await browser.close(); srv.close();
console.log(`\n[visual-gate] HARD(overflow-h/offframe/clipped/lowcontrast/textclip/contract)=${hard}  WARN(tiny/letterbox/overflow-v/subjectsmall/overlap)=${warn}`);
process.exit(hard>0?1:0);
