#!/usr/bin/env node
/* =========================================================
   crossdeck-gate.mjs — AUDIT_V2 §4.3 cross-deck consistency.
   All three decks share ONE stylesheet, so the signature element of a given slide-type (a
   definition's .def-term, a table header, the divider number, a kicker, …) MUST compute to the
   same font/colour everywhere. Any divergence = a deck-local override (inline style or bespoke
   class) — the standardization anti-pattern this catches. "Same role → same look", gated.

   Severity: DIVERGE = WARN (a deck-specific override may be deliberate, but it should be visible).
   Usage:  node crossdeck-gate.mjs            (check)
           node crossdeck-gate.mjs --selftest (inject an override into one deck → must DIVERGE)
   ========================================================= */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, writeFile, rm, copyFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const LECT = join(fileURLToPath(new URL('../Lectures/', import.meta.url)));
const PORT = 8149;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json',
  '.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.map':'application/json' };
const DECKS = ['00-introduction.html','01-search-ir-ml-system-design.html','02-nlp-tokenization-similarity.html'];

// Signature element per role + the computed props that must match across decks.
// Selectors are SCOPED BY SLIDE-TYPE so we compare the element in the SAME context across decks
// (comparing the first match in document order is unsound — e.g. L0's only .def-term is an instructor
// name-card, and L0's first .obj-check is a non-objectives checklist; both differ legitimately).
const CHECKS = [
  ['.slide[data-type="definition"] .def-term', ['fontFamily','fontSize','color']],
  ['.slide[data-type="definition"] .def-tag',  ['fontFamily','color']],
  ['.slide[data-type="objectives"] .obj-check',['color','fontFamily']],
  ['.slide[data-type="table"] .cmp-table th',  ['fontFamily','backgroundColor','color']],
  ['.slide[data-type="misconception"] .misc-label', ['fontFamily','color']],
  ['.slide[data-type="divider"] .divider-num', ['fontFamily','color']],
  ['.slide-header h2',                         ['fontFamily']],
  ['.slide-kicker',                            ['fontFamily','color','letterSpacing']],
];

function srv(){
  const s=createServer(async(rq,rs)=>{try{let p=decodeURIComponent(rq.url.split('?')[0]);p=normalize(join(LECT,p));
    if(!p.startsWith(LECT)){rs.writeHead(403).end();return;}const st=await stat(p).catch(()=>null);
    if(!st||st.isDirectory()){rs.writeHead(404).end();return;}rs.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});rs.end(await readFile(p));
  }catch{rs.writeHead(500).end();}});return new Promise(r=>s.listen(PORT,()=>r(s)));}
const url=f=>`http://localhost:${PORT}/${encodeURIComponent(f)}`;

async function styles(page, deck){
  await page.goto(url(deck),{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.Lecture&&window.Lecture.total>0,{timeout:20000});
  return page.evaluate((checks)=>{
    const out={};
    for(const [sel,props] of checks){
      const el=document.querySelector(sel);
      if(!el) continue;
      const cs=getComputedStyle(el);
      out[sel]={}; for(const p of props) out[sel][p]=cs[p];
    }
    return out;
  }, CHECKS);
}

async function collect(){
  const server=await srv();
  const browser=await chromium.launch();
  const page=await (await browser.newContext({viewport:{width:1920,height:1080}})).newPage();
  const per={};
  for(const d of DECKS) per[d]=await styles(page, d);
  await browser.close(); server.close();
  return per;
}

function compare(per){
  const issues=[];
  for(const [sel,props] of CHECKS){
    const have=DECKS.filter(d=>per[d][sel]);
    if(have.length<2) continue;                       // can't diverge if <2 decks have it
    for(const prop of props){
      const vals=have.map(d=>per[d][sel][prop]);
      if(new Set(vals).size>1){
        const detail=have.map((d,i)=>`${d.slice(0,2)}=${vals[i]}`).join(' | ');
        issues.push(`DIVERGE ${sel} {${prop}} differs across decks: ${detail}`);
      }
    }
  }
  return issues;
}

if(process.argv.includes('--selftest')){
  // inject an inline override into L2's first .def-term, confirm DIVERGE fires, then restore.
  const f=join(LECT,'02-nlp-tokenization-similarity.html'); const bak=f+'.cdbak';
  await copyFile(f,bak);
  let html=await readFile(f,'utf8');
  const inj=html.replace('class="def-term"','class="def-term" style="color:#ff00ff;font-size:99px"',1);
  await writeFile(f,inj);
  let issues=[];
  try{ issues=compare(await collect()); }
  finally{ await copyFile(bak,f); await rm(bak,{force:true}); }
  const ok=issues.some(i=>i.startsWith('DIVERGE') && i.includes('.def-term'));
  console.log('[selftest]', issues.find(i=>i.includes('.def-term'))||'NO FLAG');
  console.log(ok?'[selftest] PASS — cross-deck override flagged':'[selftest] FAIL — divergence missed!');
  process.exit(ok?0:1);
}

const issues=compare(await collect());
console.log(`[crossdeck-gate] compared ${CHECKS.length} signature elements across ${DECKS.length} decks`);
issues.forEach(i=>console.log(`  ! ${i}`));
if(!issues.length) console.log('  ✓ same-type elements compute identically across decks');
console.log(`\n[crossdeck-gate] WARN(diverge)=${issues.length}`);
process.exit(0);   // consistency is a WARN/review-gate, never blocks
