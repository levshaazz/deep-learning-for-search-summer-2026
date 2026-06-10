import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8134;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.jpg':'image/jpeg' };
const srv = createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.startsWith(BASE))p=p.slice(BASE.length);let f=join(DOCS,p);if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');if(!existsSync(f)){res.statusCode=404;res.end('404');return;}res.setHeader('Content-Type',MIME[extname(f)]||'application/octet-stream');res.end(readFileSync(f));});
await new Promise(r=>srv.listen(PORT,r));
const outdir = join(ROOT,'_internal/l56_reaudit2/book-wide'); mkdirSync(outdir,{recursive:true});
const W = 1600;
const b=await chromium.launch();
// shoot at wide width: skipgram step3, block-geo step2, attn-geo step3, layernorm step0
const targets = [
  {ch:'05', beat:'climb-word2vec-net', step:'3'},
  {ch:'06', beat:'climb-attention-geo', step:'3'},
  {ch:'06', beat:'climb-block-geo', step:'2'},
  {ch:'06', beat:'climb-layernorm', step:'0'},
];
for(const t of targets){
  const page=await b.newPage({viewport:{width:W,height:1000},deviceScaleFactor:1.5});
  await page.goto(`http://localhost:${PORT}${BASE}/en/book/${t.ch}/`,{waitUntil:'networkidle'});
  await page.waitForTimeout(800);
  const els = await page.$$(`[data-beat="${t.beat}"] [data-step="${t.step}"], .scrolly [data-step]`);
  // find correct step marker for the beat
  const handle = await page.evaluateHandle(({beat,step})=>{
    const sc=[...document.querySelectorAll('.scrolly')].find(s=>(s.querySelector('.scrolly-graphic')?.getAttribute('data-beat'))===beat || s.querySelector(`[data-beat="${beat}"]`));
    if(!sc) return null;
    const marks=[...sc.querySelectorAll('[data-step]')];
    return marks.find(m=>m.getAttribute('data-step')===step)||marks[marks.length-1];
  },{beat:t.beat,step:t.step});
  const el = handle.asElement();
  if(el){ await el.evaluate(n=>n.scrollIntoView({block:'center'})); await page.waitForTimeout(800);
    const g=await el.evaluateHandle(n=>n.closest('.scrolly').querySelector('.scrolly-graphic'));
    const gEl=g.asElement();
    const fn=join(outdir,`w${W}-${t.ch}-${t.beat}-step${t.step}.png`);
    if(gEl){const box=await gEl.boundingBox(); if(box&&box.height>20) await gEl.screenshot({path:fn}); else await page.screenshot({path:fn});}
    console.log('shot',fn);
  } else console.log('NOT FOUND', t.beat);
  await page.close();
}
await b.close();srv.close();
