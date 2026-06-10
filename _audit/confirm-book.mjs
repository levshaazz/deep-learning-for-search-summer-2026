/* confirm-book.mjs — screenshot the 4 target L5/L6 book widgets at every step, both themes.
   Usage: node confirm-book.mjs <05|06> <light|dark> */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 9131;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.jpeg':'image/jpeg','.jpg':'image/jpeg','.woff2':'font/woff2','.webp':'image/webp' };

const chapter = process.argv[2] || '05';
const theme   = process.argv[3] || 'light';
const lang = 'en';
const TARGET_BEATS = ['climb-attention','climb-layernorm','depth-residual-viz','climb-word2vec-net'];
const outdir = join(ROOT, '_internal/l56_vlm_confirm', `book-${chapter}-${theme}`);

function serve(){ return createServer((req,res)=>{ let p=decodeURIComponent(req.url.split('?')[0]); if(p.startsWith(BASE))p=p.slice(BASE.length); let file=join(DOCS,p); if(existsSync(file)&&statSync(file).isDirectory())file=join(file,'index.html'); if(!existsSync(file)){res.statusCode=404;res.end('404');return;} res.setHeader('Content-Type',MIME[extname(file)]||'application/octet-stream'); res.end(readFileSync(file)); }); }

const srv = serve();
await new Promise(r=>srv.listen(PORT,r));
mkdirSync(outdir,{recursive:true});
const b = await chromium.launch();
const page = await b.newPage({ viewport:{width:1280,height:920}, deviceScaleFactor:2 });
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await page.addInitScript((t)=>{ try{localStorage.setItem('dls.theme',t);}catch{} document.documentElement.dataset.theme=t; }, theme);
await page.goto(`http://localhost:${PORT}${BASE}/${lang}/book/${chapter}/`,{waitUntil:'networkidle'});
await page.waitForTimeout(1000);

const figs = await page.evaluate(()=>{
  const out=[]; const f=window.__figs||{};
  for (const beat of Object.keys(f)){ const w=f[beat]; out.push({beat, max:(w&&w.maxStep)??0}); }
  return out;
});
console.log('FIGS:', JSON.stringify(figs));

let shots=0;
for (const {beat,max} of figs){
  if(!TARGET_BEATS.includes(beat)) continue;
  for (let k=0;k<=max;k++){
    const ok = await page.evaluate(({beat,k})=>{
      const w=window.__figs[beat]; if(!w) return false;
      const root=w.root; if(root) root.scrollIntoView({block:'center',behavior:'instant'});
      w.setStep(k); return true;
    },{beat,k});
    if(!ok){ console.log('  no fig for',beat); break; }
    await page.waitForTimeout(500);
    const handle = await page.evaluateHandle((beat)=>window.__figs[beat].root,beat);
    const el = handle.asElement();
    const tag = beat.replace(/[^a-z0-9-]/gi,'_');
    const fname = join(outdir, `${chapter}-${tag}-step${k}.png`);
    try{
      const box = await el.boundingBox();
      if(box && box.height>20) await el.screenshot({path:fname});
      else await page.screenshot({path:fname});
      shots++;
    }catch(e){ console.log('FAIL',fname,String(e).slice(0,80)); }
  }
}
console.log(`SHOTS ${shots} (${theme}) ->`, outdir);
console.log('page errors:', errs.length?errs.slice(0,4).join(' | '):'none');
await b.close(); srv.close();
