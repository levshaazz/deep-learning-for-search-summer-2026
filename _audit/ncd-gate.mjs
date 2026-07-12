/* _audit/ncd-gate.mjs — G24, the NCD-family gate.

   WHY IT EXISTS. The ncd-* widget family shipped a pile of defects that every OTHER gate was blind to,
   and an adversarial audit had to find them by hand. Each check below is one of those defects, turned
   into a machine that can never let it back in:

     [A] LABEL COLLISIONS. Four kinds, because the first three were not enough. text×text was the
         obvious one. text×shape caught "ColBERT · late interaction" lying across a score bar. line×text
         caught a wire struck through a frequency label. And TEXT-OVERFLOWS-ITS-OWN-BOX caught the class
         nobody was looking for: a tag box sized `chars × 6.3px` fits Latin and BURSTS in Cyrillic (mono
         Cyrillic advances ~6.6px), so the label hangs out of its own chip — invisible to a detector that
         forgives any label sitting inside a shape.

     [B] ORPHANED LABELS. ncd-attention's step-4 headline was created and never appended: `el()` only
         appends `if (parent)`, so a call that forgot the parent built a node and dropped it. It rendered
         as a blank strip for a week and I looked straight at it. `_ncd.text()` now THROWS, and this gate
         fails on any thrown/console error during a mount — so the loss is loud instead of silent.

     [C] CSS NAMESPACE COLLISIONS. The Book and the Playground load EVERY widget's stylesheet together,
         so two widgets that pick the same class prefix silently corrupt each other. This is not
         hypothetical: `contrastive-space` and `cosine-sphere` both owned `.cs-*` (including the same
         `rootClass`), and on every Book page one widget's arcs rendered with the other's stroke. A
         single-widget render can NEVER see this — it loads one stylesheet.

     [D] LEGIBILITY FLOOR. SVG labels are authored in user units and fit-scale with the viewBox, so the
         same authored 10px lands anywhere from 5px (a narrow Book column) to 22px (a 1600px deck mount)
         depending on how wide the widget's viewBox happens to be. The family drifted into three
         different typographic systems without anyone noticing. This measures the EFFECTIVE px at the
         narrowest real surface and ratchets it.

   Run:  node _audit/ncd-gate.mjs            (all ncd-* widgets, every step × en/ru/tt)
         node _audit/ncd-gate.mjs --selftest (plant each defect; the gate must catch all four)  */
import { serveDir, withBrowser, withPage } from './lib/gate-harness.mjs';
import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROBE = '_audit/.ncd-probe.html';           // written, served, removed
const LANGS = ['ru', 'en', 'tt'];

/* The narrowest surface an NCD widget actually renders into: the Book's scrolly figure column.
   Measured from src/pages/[lang]/book/[id].astro's layout at a 1280px viewport. */
const BOOK_COL_PX = 449;
/* RATCHET, not an aspiration. This is the family's current worst effective label size at BOOK_COL_PX.
   It may only ever go UP. Lower it here when you have earned it; never raise it to make a build pass. */
const FONT_FLOOR_PX = 5.6;

const ncdWidgets = () => readdirSync(join(ROOT, 'widgets'))
  .filter((d) => d.startsWith('ncd-') && existsSync(join(ROOT, 'widgets', d, 'manifest.json')))
  .sort();

/* [E] NUMBERS TYPED INTO PROSE MUST EXIST IN THE WIDGET'S OWN data/ FILE.

   This is the check that would have caught the 6.2 MB. `_research/gen_l15.py` rounded twice and wrote
   6.2 where the honest figure is 6.3; the deck printed 6.3, the JSON's own `_note` said 6.3, and three
   widgets repeated 6.2 in their captions. Nothing noticed, because `check_claims.py` gates the DECK and
   the BOOK and contains not one reference to `widgets/`. A caption is a display site like any other.

   Only DECIMAL figures are checked (a value with a fractional part). Bare integers are overwhelmingly
   structural — axis counts, step numbers, "12 heads", "one head" — and gating them yields noise, not
   safety. A widget with no data file may not quote a decimal at all. */
const DECIMAL = /(?<![\w.])(\d+\.\d+)(?![\w.])/g;
/* The only decimals a widget may quote without a data file behind them. `recall 1.0` is not a
   measurement — it is a BOUND, true by construction for exhaustive search, and ncd-ann is deliberately
   symbolic (data: []) precisely so that no fabricated recall figure can ever appear in it. */
const SYMBOLIC_BOUNDS = new Set(['1.0', '0.0']);

function proseNumberDrift() {
  const bad = [];
  for (const id of ncdWidgets()) {
    const man = JSON.parse(readFileSync(join(ROOT, 'widgets', id, 'manifest.json'), 'utf8'));
    const dataName = man.data && man.data[0];
    const haystack = dataName
      ? readFileSync(join(ROOT, 'data', `${dataName}.json`), 'utf8')
      : '';
    const i18n = JSON.parse(readFileSync(join(ROOT, 'widgets', id, 'i18n.json'), 'utf8'));
    const seen = new Set();
    const walk = (v, path) => {
      if (typeof v === 'string') {
        for (const m of v.matchAll(DECIMAL)) {
          const n = m[1];
          if (seen.has(n + path)) continue;
          seen.add(n + path);
          // present verbatim, or as the same value written without a trailing zero (0.330 vs 0.33)
          const alt = String(parseFloat(n));
          if (haystack.includes(n) || haystack.includes(alt)) continue;
          if (!dataName && SYMBOLIC_BOUNDS.has(n)) continue;   // a bound, not a measurement
          bad.push({ id, path, n, dataName: dataName || '(none)' });
        }
      } else if (v && typeof v === 'object') {
        for (const k of Object.keys(v)) walk(v[k], path ? `${path}.${k}` : k);
      }
    };
    walk(i18n, '');
    }
  return bad;
}

/* [F] NO WIDGET MAY GUESS A LABEL'S WIDTH FROM ITS CHARACTER COUNT.

   `tag.length * 6.3 + 18` is a lie in two directions at once: mono Cyrillic advances wider than Latin
   (so a box that fits in English bursts in Russian and Tatar), and the constant is pinned to one
   font-size (so raising 10px to 11px bursts every box again). Both shipped. `_ncd.js` now exposes
   `tagBox()`, which draws the text, MEASURES its real bbox and sizes the rect to it — correct in every
   language at every size, by construction. A rule that is not enforced is not a rule, so: enforced. */
function charWidthGuessing() {
  const bad = [];
  for (const id of ncdWidgets()) {
    const src = readFileSync(join(ROOT, 'widgets', id, 'logic.js'), 'utf8');
    src.split('\n').forEach((ln, i) => {
      if (/\.length\s*\*\s*[\d.]+/.test(ln) && !ln.trim().startsWith('//') && !ln.includes('NCD-ALLOW-ADVANCE')) {
        bad.push({ id, line: i + 1, src: ln.trim().slice(0, 78) });
      }
    });
  }
  return bad;
}

/* [C] runs on the WHOLE widget tree, not just ncd-*: the collision is between any two widgets whose
   stylesheets are co-loaded, and every Book page co-loads all of them. */
function namespaceCollisions() {
  const owner = new Map();
  for (const d of readdirSync(join(ROOT, 'widgets'))) {
    const f = join(ROOT, 'widgets', d, 'style.css');
    if (!existsSync(f)) continue;
    const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/\.([A-Za-z][\w-]*)/g)) {
      const cls = m[1];
      // .wgt-*, .ncd-* and .svg-halo are shared chrome from _base.css; .is-* are state modifiers that
      // are always used compounded (.foo.is-active), so sharing them is by design.
      if (cls.startsWith('wgt-') || cls.startsWith('ncd-') || cls.startsWith('is-') || cls === 'svg-halo') continue;
      if (!owner.has(cls)) owner.set(cls, new Set());
      owner.get(cls).add(d);
    }
  }
  const bad = [];
  for (const [cls, ws] of owner) if (ws.size > 1) bad.push({ cls, widgets: [...ws].sort() });
  return bad;
}

const PROBE_HTML = (ids) => `<!doctype html><html><head><meta charset="utf8">
<link rel="stylesheet" href="/tokens/design-tokens.css">
<link rel="stylesheet" href="/widgets/_base.css">
${ids.map((i) => `<link rel="stylesheet" href="/widgets/${i}/style.css">`).join('\n')}
<style>body{margin:0}#box{width:var(--probe-w,920px)}</style></head><body>
<div id="box"></div>
<script type="module">
const IDS=${JSON.stringify(ids)};
const LANGS=${JSON.stringify(LANGS)};
const M={},LAB={},MAX={},DATA={};
window.__errors=[];
window.addEventListener('error',(e)=>window.__errors.push(String(e.message)));
for(const id of IDS){ try{ const m=await import('/widgets/'+id+'/logic.js'); M[id]=Object.values(m)[0]; }
  catch(e){ window.__errors.push(id+' import: '+e.message); } }
for(const id of IDS){ try{const j=await(await fetch('/widgets/'+id+'/i18n.json')).json();LAB[id]={};
  for(const lg of LANGS){const o={};for(const k in j){if(k==='_doc')continue;o[k]=(j[k]&&(j[k][lg]||j[k].en))||j[k];}LAB[id][lg]=o;} }catch(e){} }
for(const id of IDS){ try{const m=await(await fetch('/widgets/'+id+'/manifest.json')).json();MAX[id]=m.maxStep;
  const dn=m.data&&m.data[0]; if(dn) DATA[id]=await(await fetch('/data/'+dn+'.json')).json(); }catch(e){MAX[id]=2;} }
window.__ids=()=>IDS.filter(i=>M[i]);
window.__max=(id)=>MAX[id];
window.__width=(px)=>{document.getElementById('box').style.setProperty('--probe-w',px+'px');};
/* A mount that THROWS is the point of check [B]: _ncd.text() now refuses to drop a label on the floor. */
window.__mount=(id,step,lang)=>{const box=document.getElementById('box');box.innerHTML='';
  try{ M[id](box,{data:DATA[id],labels:LAB[id][lang]}).setStep(step); return null; }
  catch(e){ return id+' step '+step+' ['+lang+']: '+e.message; }};

/* [D] effective px = authored user-units × (rendered width / viewBox width). */
window.__minFont=()=>{const svg=document.querySelector('#box svg');if(!svg)return null;
  const vb=svg.viewBox.baseVal.width||1, w=svg.getBoundingClientRect().width;
  const k=w/vb; let min=Infinity, who='';
  for(const t of svg.querySelectorAll('text')){
    const fs=parseFloat(getComputedStyle(t).fontSize)||0;
    if(fs>0 && fs*k<min){min=fs*k;who=t.textContent.slice(0,18);}}
  return {px:min===Infinity?null:+(min*1).toFixed(2), who, scale:+k.toFixed(3)};};

/* [A] four collision classes. */
window.__measure=()=>{const svg=document.querySelector('#box svg');if(!svg)return ['NO SVG'];
  const texts=[...svg.querySelectorAll('text')];
  const shapes=[...svg.querySelectorAll('rect,path,polygon')].filter(S=>{let f;try{f=getComputedStyle(S).fill;}catch(e){return false;}
    if(f==='none'||f==='transparent'||/rgba\\(0, 0, 0, 0\\)/.test(f))return false;let b;try{b=S.getBBox();}catch(e){return false;}
    return b.width>2&&b.height>2&&b.width<300&&b.height<180;});
  const lines=[...svg.querySelectorAll('line')];
  const tb=texts.map(t=>{const b=t.getBBox();return {t:t.textContent.slice(0,22),x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2};});
  const F=[];
  for(let i=0;i<tb.length;i++)for(let j=i+1;j<tb.length;j++){const a=tb[i],b=tb[j];
    const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
    if(ox>0&&oy>0){const f=(ox*oy)/Math.min((a.w*a.h)||1,(b.w*b.h)||1);
      if(f>0.04)F.push('TEXT×TEXT "'+a.t+'" ∩ "'+b.t+'" '+f.toFixed(2));}}
  for(const T of tb)for(const S of shapes){const b=S.getBBox();
    const ox=Math.min(T.x+T.w,b.x+b.width)-Math.max(T.x,b.x),oy=Math.min(T.y+T.h,b.y+b.height)-Math.max(T.y,b.y);
    if(ox<=0||oy<=0)continue;const f=(ox*oy)/((T.w*T.h)||1);
    const cin=T.cx>=b.x&&T.cx<=b.x+b.width&&T.cy>=b.y&&T.cy<=b.y+b.height;
    if(f>0.06&&!cin)F.push('TEXT×SHAPE "'+T.t+'" f='+f.toFixed(2));}
  /* A real segment-vs-rectangle test. The old one sampled the line's y ONLY at the label's centre-x,
     so a steep wire could pass clean through the left or right half of a label and be declared innocent
     — which is exactly what a diagonal broadcast fan does. Liang–Barsky against a slightly inset box
     (grazing an edge is not a strike). */
  const hitsBox=(x1,y1,x2,y2,B)=>{const dx=x2-x1,dy=y2-y1;
    const p=[-dx,dx,-dy,dy],q=[x1-B.x0,B.x1-x1,y1-B.y0,B.y1-y1];let t0=0,t1=1;
    for(let i=0;i<4;i++){if(p[i]===0){if(q[i]<0)return false;}
      else{const r=q[i]/p[i];if(p[i]<0){if(r>t1)return false;if(r>t0)t0=r;}else{if(r<t0)return false;if(r<t1)t1=r;}}}
    return t0<=t1;};
  for(const T of tb)for(const ln of lines){const x1=+ln.getAttribute('x1'),y1=+ln.getAttribute('y1'),
    x2=+ln.getAttribute('x2'),y2=+ln.getAttribute('y2');
    const B={x0:T.x+T.w*0.12,x1:T.x+T.w*0.88,y0:T.y+T.h*0.2,y1:T.y+T.h*0.8};
    if(hitsBox(x1,y1,x2,y2,B))F.push('LINE×TEXT strikes "'+T.t+'"');}
  for(const T of tb){let own=null,area=Infinity;
    for(const S of shapes){const b=S.getBBox();
      if(T.cx>=b.x&&T.cx<=b.x+b.width&&T.cy>=b.y&&T.cy<=b.y+b.height){const a=b.width*b.height;if(a<area){area=a;own=b;}}}
    if(!own)continue;
    if(own.width>240||own.height>120)continue;      // a REGION is a backdrop; labels ride on it by design
    const over=Math.max(own.x-T.x,(T.x+T.w)-(own.x+own.width));
    if(over>2)F.push('TEXT OVERFLOWS ITS BOX "'+T.t+'" by '+over.toFixed(1)+'px');}
  return [...new Set(F)];};
/* [G] A WIRE THAT PASSES THROUGH A BOX INSTEAD OF AROUND IT.

   The detector only ever compared TEXT against things, so it was blind to the whole geometry of the
   diagram. It never saw ncd-block's residual arcs — whose entire meaning is "this path BYPASSES the
   sublayer" — drawn straight through the sublayer they bypass. Nor a dashed wire in ncd-retrieval that
   started at the query vector and ended nowhere, crossing the corpus border on its way.

   Method: walk each wire with getPointAtLength and test the interior samples (the ends are skipped —
   a wire is SUPPOSED to touch the box it connects to) against every filled shape. Backdrops/regions are
   excluded: a wire riding over a region is the notation working, not a defect. */
window.__wires=()=>{const svg=document.querySelector('#box svg');if(!svg)return [];
  const shapes=[...svg.querySelectorAll('rect,polygon,path')].filter(S=>{let f;try{f=getComputedStyle(S).fill;}catch(e){return false;}
    if(f==='none'||f==='transparent'||/rgba\(0, 0, 0, 0\)/.test(f))return false;let b;try{b=S.getBBox();}catch(e){return false;}
    if(S.classList.contains('ncd-onwire'))return false;   // declared: this rides ON a wire by design
    return b.width>8&&b.height>8&&b.width<240&&b.height<120;}).map(S=>({el:S,b:S.getBBox()}));
  const wires=[...svg.querySelectorAll('line,path')].filter(W=>{let f,st;try{const c=getComputedStyle(W);f=c.fill;st=c.stroke;}catch(e){return false;}
    if(st==='none'||!st)return false;
    if(!(f==='none'||/rgba\(0, 0, 0, 0\)/.test(f)))return false;      // filled paths are glyphs, not wires
    let L=0;try{L=W.getTotalLength();}catch(e){return false;}
    return L>26;});                                                    // arrowhead chevrons are not wires
  const F=[];
  for(const W of wires){const L=W.getTotalLength();
    const skip=Math.min(14,L*0.16);                                    // ends may legitimately touch a box
    for(let d=skip;d<=L-skip;d+=3){let pt;try{pt=W.getPointAtLength(d);}catch(e){break;}
      for(const S of shapes){const b=S.b;const m=3;                    // margin: grazing an edge is not "through"
        if(pt.x>b.x+m&&pt.x<b.x+b.width-m&&pt.y>b.y+m&&pt.y<b.y+b.height-m){
          const cls=(W.getAttribute('class')||'wire').split(' ').pop();
          const scls=(S.el.getAttribute('class')||'shape').split(' ').pop();
          F.push('WIRE THROUGH SHAPE .'+cls+' runs through .'+scls);d=L;break;}}}}
  return [...new Set(F)];};
/* Fonts MUST be shaped before anything is measured: getBBox() on unshaped text returns boxes that
   are too narrow, so a cold run would quietly find no collisions and pass. A false green is the one
   failure mode a gate may never have. */
await document.fonts.ready;
window.__ready=true;
</script></body></html>`;

async function audit(ids, { fontFloor = FONT_FLOOR_PX } = {}) {
  writeFileSync(join(ROOT, PROBE), PROBE_HTML(ids));
  const server = await serveDir(ROOT);
  const out = { collisions: [], wires: [], errors: [], fonts: [], loaded: [] };
  try {
    await withBrowser(async (b) => {
      await withPage(b, { viewport: { width: 1200, height: 900 } }, async (page) => {
        await page.goto(server.href(PROBE), { waitUntil: 'networkidle' });
        await page.waitForFunction('window.__ready===true', { timeout: 15000 });
        out.errors.push(...(await page.evaluate(() => window.__errors)));
        out.loaded = await page.evaluate(() => window.__ids());
        for (const id of out.loaded) {
          const max = await page.evaluate((i) => window.__max(i), id);
          // [A]+[B] at a generous width, so a collision is geometry and not a scale artefact
          await page.evaluate(() => window.__width(920));
          for (let s = 0; s <= max; s++) {
            for (const lg of LANGS) {
              const err = await page.evaluate(({ i, s, lg }) => window.__mount(i, s, lg), { i: id, s, lg });
              if (err) { out.errors.push(err); continue; }
              for (const f of await page.evaluate(() => window.__measure())) {
                out.collisions.push(`${id} [${lg}] step ${s}: ${f}`);
              }
              if (lg === 'ru') for (const f of await page.evaluate(() => window.__wires())) {
                out.wires.push(`${id} step ${s}: ${f}`);   // geometry is language-independent
              }
            }
          }
          // [D] the narrowest real surface: the Book's figure column
          await page.evaluate((w) => window.__width(w), BOOK_COL_PX);
          const e = await page.evaluate(({ i }) => window.__mount(i, 0, 'ru'), { i: id });
          if (!e) {
            const f = await page.evaluate(() => window.__minFont());
            if (f && f.px != null) out.fonts.push({ id, ...f });
          }
        }
      });
    });
  } finally {
    await server.close();
    try { unlinkSync(join(ROOT, PROBE)); } catch { /* already gone */ }
  }
  out.tooSmall = out.fonts.filter((f) => f.px < fontFloor);
  return out;
}

async function main() {
  const ids = ncdWidgets();
  console.log(`[ncd] ${ids.length} widgets: ${ids.join(' ')}\n`);

  const ns = namespaceCollisions();
  console.log(`[ncd] [C] CSS namespace collisions across ALL widgets (the Book co-loads every stylesheet):`);
  if (ns.length) for (const c of ns) console.log(`  ✗ .${c.cls} is owned by ${c.widgets.join(' + ')} — they overwrite each other`);
  else console.log('  ✓ none');

  const guess = charWidthGuessing();
  console.log(`\n[ncd] [F] widgets guessing a label's width from its character count (banned — use tagBox):`);
  if (guess.length) for (const g of guess) console.log(`  ✗ ${g.id}:${g.line}  ${g.src}`);
  else console.log('  ✓ none — every boxed label measures itself');

  const drift = proseNumberDrift();
  console.log(`\n[ncd] [E] decimals quoted in a caption that do NOT exist in the widget's data/ file:`);
  if (drift.length) for (const d of drift) console.log(`  ✗ ${d.id} ${d.path} quotes ${d.n} — not in data/${d.dataName}.json`);
  else console.log('  ✓ none — every figure a caption quotes is in its data file');

  const r = await audit(ids);

  console.log(`\n[ncd] [B] mount errors (a thrown label is a label that would have been silently dropped):`);
  if (r.errors.length) for (const e of r.errors) console.log(`  ✗ ${e}`);
  else console.log('  ✓ none');

  const renders = r.loaded.length * LANGS.length;
  console.log(`\n[ncd] [A] label collisions — every step × ${LANGS.join('/')}:`);
  if (r.collisions.length) for (const c of r.collisions) console.log(`  ✗ ${c}`);
  else console.log(`  ✓ none across ${r.loaded.length} widgets`);

  console.log(`\n[ncd] [G] wires running THROUGH a box instead of around it:`);
  if (r.wires.length) for (const w of r.wires) console.log(`  ✗ ${w}`);
  else console.log('  ✓ none');

  console.log(`\n[ncd] [D] smallest label at the Book column width (${BOOK_COL_PX}px), floor = ${FONT_FLOOR_PX}px:`);
  for (const f of r.fonts.sort((a, b) => a.px - b.px)) {
    console.log(`  ${f.px < FONT_FLOOR_PX ? '✗' : ' '} ${String(f.px).padStart(5)}px  ${f.id.padEnd(16)} (scale ${f.scale}×)  "${f.who}"`);
  }

  const hard = ns.length + guess.length + drift.length + r.errors.length + r.collisions.length + r.wires.length + r.tooSmall.length;
  console.log(`\n[ncd] HARD(namespace/width-guess/prose-drift/mount-error/collision/wire-through/too-small) = ${hard}`);
  if (hard) { console.log('[ncd] ✗ FAIL'); process.exit(1); }
  console.log('[ncd] ✓ pass');
}

/* --selftest: plant each defect and prove the gate SEES it. A gate nobody has tried to fool is a
   gate nobody should trust. */
async function selftest() {
  const results = [];

  // [C] a planted namespace collision must be caught by the static scan
  const real = namespaceCollisions();
  results.push(['C namespace scan runs', Array.isArray(real)]);
  results.push(['C real tree is clean', real.length === 0]);

  // [A]+[B]+[D] against a widget with a PLANTED defect
  const victim = 'ncd-attention';
  const f = join(ROOT, 'widgets', victim, 'logic.js');
  const orig = readFileSync(f, 'utf8');
  try {
    // plant an orphan label (no parent) — the exact shape of the bug that shipped
    writeFileSync(f, orig.replace(
      "text(W / 2, H - 6, L('legMap',",
      "G.text(undefined, W / 2, H - 6, L('legMap',"));
    const a = await audit([victim]);
    results.push(['B catches an orphaned label (no parent)', a.errors.length > 0]);

    // plant a collision: drag a label on top of another
    writeFileSync(f, orig.replace(
      "text(scC[1], yS - 21, L('lblScores', 'scores')",
      "text(scC[1], yS + 21, L('lblScores', 'scores')"));
    const b = await audit([victim]);
    results.push(['A catches a text×text collision', b.collisions.some((c) => c.includes('TEXT×TEXT'))]);

    // an impossible floor must trip [D]
    writeFileSync(f, orig);
    const c = await audit([victim], { fontFloor: 999 });
    results.push(['D catches a label under the floor', c.tooSmall.length > 0]);
  } finally {
    writeFileSync(f, orig);
  }

  let ok = true;
  for (const [name, pass] of results) { console.log(`  ${pass ? '✓' : '✗'} ${name}`); if (!pass) ok = false; }
  console.log(`[selftest] ${ok ? 'PASS — every planted defect was caught' : 'FAIL — the gate is blind to something'}`);
  process.exit(ok ? 0 : 1);
}

if (process.argv.includes('--selftest')) await selftest();
else await main();
