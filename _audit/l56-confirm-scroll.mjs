#!/usr/bin/env node
/* l56-confirm-scroll.mjs — INDEPENDENT confirm pass for L5/L6 Book chapters.
   Drives each scrolly widget by SCROLLING the matching .scroll-step paragraph into the
   Scrollama trigger zone (offset 0.6) so the driver re-asserts the real step — avoiding the
   stale-setStep trap. Screenshots the sticky .scrolly-graphic per (beat,step), across
   en/ru × desktop(1320)/mobile(390) × light/dark. Also probes overflow / KaTeX / raw markdown.
   Usage: node _audit/l56-confirm-scroll.mjs <chapter 05|06> <lang en|ru> <theme light|dark> <vp desktop|mobile>
*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8311 + Math.floor(Math.random() * 200);
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.jpeg':'image/jpeg','.jpg':'image/jpeg','.woff2':'font/woff2','.webp':'image/webp' };

const chapter = process.argv[2] || '06';
const lang  = process.argv[3] || 'en';
const theme = process.argv[4] || 'light';
const vp    = process.argv[5] || 'desktop';
const W = vp === 'mobile' ? 390 : 1320;
const H = vp === 'mobile' ? 780 : 900;
const outdir = join(ROOT, '_internal/l56_book_confirm/shots', `l${chapter}-${lang}-${theme}-${vp}`);

function serve(){ return createServer((req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p.startsWith(BASE))p=p.slice(BASE.length); let file=join(DOCS,p); if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html'); if(!existsSync(file)){res.statusCode=404;res.end('404');return;} res.setHeader('Content-Type',MIME[extname(file)]||'application/octet-stream'); res.end(readFileSync(file)); }); }

const srv = serve();
await new Promise(r=>srv.listen(PORT,r));
mkdirSync(outdir,{recursive:true});
const b = await chromium.launch();
const page = await b.newPage({ viewport:{width:W,height:H}, deviceScaleFactor: vp==='mobile'?2:1.5 });
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const consoleErrs=[]; page.on('console',m=>{ if(m.type()==='error') consoleErrs.push(m.text().slice(0,160)); });
await page.addInitScript((t)=>{ try{localStorage.setItem('dls.theme',t);}catch{} document.documentElement.dataset.theme=t; }, theme);
await page.goto(`http://localhost:${PORT}${BASE}/${lang}/book/${chapter}/`,{waitUntil:'networkidle'});
await page.evaluate((t)=>{ document.documentElement.dataset.theme=t; }, theme);
await page.waitForTimeout(1200);

// probe page-level issues
const probe = await page.evaluate(()=>{
  const main = document.querySelector('main') || document.body;
  const txt = main.innerText;
  const rawStars = (txt.match(/\*\*[^*\n]{1,50}\*\*/g)||[]).slice(0,8);
  const rawDollar = (txt.match(/(?<!\\)\$[^$\n]{1,40}\$/g)||[]).slice(0,8);
  const rawBackslash = (txt.match(/\\\(|\\\)|\\\[|\\\]/g)||[]).length;
  const kErr = [...document.querySelectorAll('.katex-error')].map(e=>e.textContent.slice(0,50)).slice(0,8);
  const kCount = document.querySelectorAll('.katex').length;
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  let widest=0,widestSel='';
  for(const el of main.querySelectorAll('*')){ const r=el.getBoundingClientRect(); if(r.width>widest){widest=r.width;widestSel=(el.className||el.tagName)+'';} }
  return { rawStars, rawDollar, rawBackslash, kErr, kCount, overflow, widest:Math.round(widest), widestSel:widestSel.slice(0,50) };
});

// enumerate scroll-steps in DOM order
const steps = await page.$$eval('.scroll-step', els => els.map((el,i)=>({
  idx:i, beat: el.dataset.beat, step: Number(el.dataset.step),
  label: (el.innerText||'').slice(0,60)
})));

// map beat -> widget id
const beatWidget = await page.evaluate(()=>{
  const out={};
  document.querySelectorAll('.scrolly').forEach(sc=>{
    const beat = sc.dataset.beat;
    const g = sc.querySelector('.scrolly-graphic [data-widget]') || sc.querySelector('.scrolly-graphic');
    out[beat] = (g && g.dataset && g.dataset.widget) || beat;
  });
  return out;
});

let shots=0;
const stepReports=[];
for (const s of steps){
  // scroll this step paragraph so its top sits ~52% down the viewport (inside the 0.6 trigger band)
  await page.evaluate(({idx})=>{
    const el = document.querySelectorAll('.scroll-step')[idx];
    const r = el.getBoundingClientRect();
    const target = window.innerHeight * 0.52;
    window.scrollBy({ top: r.top - target, behavior: 'instant' });
  }, {idx:s.idx});
  await page.waitForTimeout(650);
  // read back the step the widget actually believes it is on
  const actual = await page.evaluate((beat)=>{ const f=window.__figs&&window.__figs[beat]; return f? (f.currentStep ?? f._step ?? null):null; }, s.beat);
  // screenshot the sticky graphic for this beat
  const gH = await page.evaluateHandle((beat)=>{
    const sc=[...document.querySelectorAll('.scrolly')].find(x=>x.dataset.beat===beat);
    return sc? sc.querySelector('.scrolly-graphic'):null;
  }, s.beat);
  const gEl = gH.asElement();
  const wid = (beatWidget[s.beat]||s.beat).replace(/[^a-z0-9-]/gi,'_');
  const fname = join(outdir, `${wid}__${s.beat}__step${s.step}.png`);
  try{
    if(gEl){ const box=await gEl.boundingBox();
      if(box && box.height>20){ await gEl.screenshot({path:fname}); shots++; }
      else { await page.screenshot({path:fname}); shots++; }
    } else { await page.screenshot({path:fname}); shots++; }
  }catch(e){ console.log('FAIL',fname,String(e).slice(0,80)); }
  // overflow within graphic
  const ov = await page.evaluate((beat)=>{
    const sc=[...document.querySelectorAll('.scrolly')].find(x=>x.dataset.beat===beat);
    const g=sc&&sc.querySelector('.scrolly-graphic'); if(!g) return null;
    const r=g.getBoundingClientRect(); let over=0;
    g.querySelectorAll('*').forEach(el=>{ const eb=el.getBoundingClientRect(); if(eb.right>r.right+1.5||eb.left<r.left-1.5) over++; });
    return { gW:Math.round(r.width), gH:Math.round(r.height), over };
  }, s.beat);
  stepReports.push({ ...s, declaredWidget:beatWidget[s.beat], actualStep:actual, ...ov });
}

const report = { chapter, lang, theme, vp, W, probe, errs, consoleErrs, beatWidget, stepReports, shots };
writeFileSync(join(outdir,'_report.json'), JSON.stringify(report,null,2));
console.log(`=== L${chapter} ${lang}/${theme}/${vp} (${W}px) ===`);
console.log('PROBE:', JSON.stringify(probe));
console.log('pageerrors:', errs.length?errs.slice(0,5).join(' | '):'none');
console.log('consoleerrors:', consoleErrs.length?consoleErrs.slice(0,5).join(' | '):'none');
console.log('steps:', stepReports.map(s=>`${s.beat}#${s.step}${s.actualStep!=null&&s.actualStep!==s.step?`(GOT ${s.actualStep})`:''}${s.over?`[ov ${s.over}]`:''}`).join(' '));
console.log(`SHOTS ${shots} -> ${outdir}`);
await b.close(); srv.close();
