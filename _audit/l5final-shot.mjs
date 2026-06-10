/* l5final-shot.mjs — finalize-readiness audit shots of the L5 Book chapter.
   Renders /en/book/05 and /ru/book/05 at desktop(1320) + mobile(390), light + dark,
   steps every scrolly widget via window.__figs[beat].setStep(k), screenshots each step.
   Also captures full-page strips + records pageerrors + KaTeX/raw-markdown probes.
   Usage: node _audit/l5final-shot.mjs <lang en|ru> <theme light|dark> <vp desktop|mobile> */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8231;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.jpeg':'image/jpeg','.jpg':'image/jpeg','.woff2':'font/woff2','.webp':'image/webp' };

const lang  = process.argv[2] || 'en';
const theme = process.argv[3] || 'light';
const vp    = process.argv[4] || 'desktop';
const W = vp === 'mobile' ? 390 : 1320;
const H = vp === 'mobile' ? 780 : 900;
const outdir = join(ROOT, '_internal/l56_book_final', `l5-${lang}-${theme}-${vp}`);

function serve(){ return createServer((req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p.startsWith(BASE))p=p.slice(BASE.length); let file=join(DOCS,p); if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html'); if(!existsSync(file)){res.statusCode=404;res.end('404');return;} res.setHeader('Content-Type',MIME[extname(file)]||'application/octet-stream'); res.end(readFileSync(file)); }); }

const srv = serve();
await new Promise(r=>srv.listen(PORT,r));
mkdirSync(outdir,{recursive:true});
const b = await chromium.launch();
const page = await b.newPage({ viewport:{width:W,height:H}, deviceScaleFactor: vp==='mobile'?2:1.5 });
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const consoleErrs=[]; page.on('console',m=>{ if(m.type()==='error') consoleErrs.push(m.text().slice(0,160)); });
await page.addInitScript((t)=>{ try{localStorage.setItem('dls.theme',t);}catch{} document.documentElement.dataset.theme=t; }, theme);
await page.goto(`http://localhost:${PORT}${BASE}/${lang}/book/05/`,{waitUntil:'networkidle'});
await page.waitForTimeout(1100);

// enumerate figs
const figs = await page.evaluate(()=>{
  const out=[]; const f=window.__figs||{};
  for (const beat of Object.keys(f)){ const w=f[beat]; out.push({beat, max:(w&&w.maxStep)??0, widget:(w&&w.widget)||''}); }
  return out;
});

// probe: raw markdown / unrendered math / overflow
const probe = await page.evaluate(()=>{
  const main = document.querySelector('main') || document.body;
  const txt = main.innerText;
  const rawStars = (txt.match(/\*\*/g)||[]).length;
  const rawDollar = (txt.match(/\$\$|(?<!\\)\$/g)||[]).length;
  const rawBackslashParen = (txt.match(/\\\(|\\\)|\\\[/g)||[]).length;
  // KaTeX error spans
  const kErr = document.querySelectorAll('.katex-error').length;
  const kCount = document.querySelectorAll('.katex').length;
  // horizontal overflow
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  let widest=0,widestSel='';
  for(const el of main.querySelectorAll('*')){ const w=el.getBoundingClientRect().width; if(w>widest){widest=w;widestSel=(el.className||el.tagName)+'';} }
  return { rawStars, rawDollar, rawBackslashParen, kErr, kCount, overflow, widest:Math.round(widest), widestSel:widestSel.slice(0,50) };
});

let shots=0;
const stepReports=[];
for (const {beat,max,widget} of figs){
  for (let k=0;k<=max;k++){
    const info = await page.evaluate(({beat,k})=>{
      const w=window.__figs[beat]; if(!w) return null;
      const root=w.root; if(root) root.scrollIntoView({block:'center',behavior:'instant'});
      try{ w.setStep(k); }catch(e){ return {err:String(e).slice(0,120)}; }
      // measure overflow within the widget root
      const r = root.getBoundingClientRect();
      const svg = root.querySelector('svg');
      const sb = svg? svg.getBoundingClientRect(): null;
      // collect text nodes that overflow root horizontally
      let overRight=0;
      root.querySelectorAll('*').forEach(el=>{ const b=el.getBoundingClientRect(); if(b.right > r.right+1.5) overRight++; });
      return { rootW:Math.round(r.width), rootH:Math.round(r.height), svgW:sb?Math.round(sb.width):0, svgH:sb?Math.round(sb.height):0, overRight };
    },{beat,k});
    if(!info){ break; }
    await page.waitForTimeout(420);
    const handle = await page.evaluateHandle((beat)=>window.__figs[beat].root,beat);
    const el = handle.asElement();
    const tag = (widget||beat).replace(/[^a-z0-9-]/gi,'_');
    const fname = join(outdir, `${tag}__${beat}__step${k}.png`);
    try{
      const box = await el.boundingBox();
      if(box && box.height>20) await el.screenshot({path:fname});
      else await page.screenshot({path:fname});
      shots++;
    }catch(e){ console.log('FAIL',fname,String(e).slice(0,80)); }
    stepReports.push({beat,widget,step:k,...info});
  }
}

const report = { lang, theme, vp, W, figs, probe, errs, consoleErrs, stepReports, shots };
writeFileSync(join(outdir,'_report.json'), JSON.stringify(report,null,2));
console.log(`=== ${lang}/${theme}/${vp} (${W}px) ===`);
console.log('FIGS:', figs.map(f=>`${f.beat}[${f.max}]`).join(' '));
console.log('PROBE:', JSON.stringify(probe));
console.log('pageerrors:', errs.length?errs.slice(0,5).join(' | '):'none');
console.log('consoleerrors:', consoleErrs.length?consoleErrs.slice(0,5).join(' | '):'none');
console.log('overflow steps:', stepReports.filter(s=>s.overRight>0).map(s=>`${s.beat}#${s.step}(${s.overRight})`).join(' ')||'none');
console.log(`SHOTS ${shots} -> ${outdir}`);
await b.close(); srv.close();
