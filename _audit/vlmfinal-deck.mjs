/* vlmfinal-deck.mjs — capture target deck slides at EVERY step, both themes.
   Usage: node vlmfinal-deck.mjs  (targets hardcoded below) */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const LECT = join(fileURLToPath(new URL('../Lectures/', import.meta.url)));
const OUT  = join(fileURLToPath(new URL('../', import.meta.url)), '_internal/l56_vlm_final/deck');
const PORT = 8151;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.map':'application/json' };

const TARGETS = [
  { deck:'05-dl-embeddings-dimred.html',                 slide:17, max:4 },
  { deck:'05-dl-embeddings-dimred.html',                 slide:36, max:4 },
  { deck:'05-dl-embeddings-dimred.html',                 slide:47, max:4 },
  { deck:'06-contextual-attention-transformers.html',    slide:19, max:3 },
  { deck:'06-contextual-attention-transformers.html',    slide:26, max:4 },
  { deck:'06-contextual-attention-transformers.html',    slide:37, max:6 },
  { deck:'06-contextual-attention-transformers.html',    slide:38, max:3 },
];

const srv = createServer(async (req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);p=normalize(join(LECT,p));if(!p.startsWith(LECT)){res.writeHead(403).end();return;}const s=await stat(p).catch(()=>null);if(!s||s.isDirectory()){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(await readFile(p));}catch{res.writeHead(500).end();}});
await new Promise(r=>srv.listen(PORT,()=>r()));
await mkdir(OUT,{recursive:true});
const url=f=>`http://localhost:${PORT}/${encodeURIComponent(f)}`;
const browser = await chromium.launch();

// group targets by deck so we load each deck once per theme
const byDeck = {};
for (const t of TARGETS){ (byDeck[t.deck] ??= []).push(t); }

for (const theme of ['light','dark']){
  for (const deck of Object.keys(byDeck)){
    const ctx = await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
    const page = await ctx.newPage();
    const cerr=[]; page.on('console',m=>{if(m.type()==='error')cerr.push(m.text().slice(0,120));});
    await page.addInitScript((t)=>{ try{localStorage.setItem('lecture.template.prefs.v1',JSON.stringify({theme:t,lang:'en'}));}catch{} document.documentElement.setAttribute('data-theme',t); }, theme);
    await page.goto(url(deck),{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.Lecture&&window.Lecture.total>0,{timeout:20000});
    await page.addStyleTag({content:'.toolbar{visibility:hidden!important}'});
    await page.waitForTimeout(900);
    const base = basename(deck,'.html').slice(0,2); // "05"/"06"
    for (const t of byDeck[deck]){
      await page.evaluate(i=>{location.hash='#/'+i;}, t.slide);
      await page.waitForTimeout(700);
      // ensure at step 0
      await page.evaluate(()=>{const s=document.querySelector('.slide.is-active'); if(s&&window.Lecture&&window.Lecture.gotoStep) window.Lecture.gotoStep(0);});
      for (let s=0; s<=t.max; s++){
        if (s>0){ await page.keyboard.press('ArrowRight'); }
        await page.waitForTimeout(650);
        const cur = await page.evaluate(()=>{const c=document.querySelector('.slide.is-active');return {label:c?.dataset.screenLabel,step:c?.dataset.currentStep,max:c?.dataset.maxStep};});
        const f = join(OUT, `${base}-s${String(t.slide).padStart(2,'0')}-step${s}-${theme}.png`);
        await page.screenshot({path:f});
        process.stdout.write(`${base} s${t.slide} step${s} ${theme} (dom step=${cur.step}/${cur.max})  `);
      }
      console.log('');
    }
    if (cerr.length) console.log(`  [${deck} ${theme}] console errors:`, cerr.slice(0,4).join(' | '));
    await ctx.close();
  }
}
await browser.close(); srv.close();
console.log('DONE deck shots →', OUT);
