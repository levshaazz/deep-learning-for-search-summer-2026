/* reaudit2-deck-step.mjs — capture a deck slide at a given STEP, both themes.
   Usage: node reaudit2-deck-step.mjs <deck.html> <slide> <step> <outdir> */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
const LECT = join(fileURLToPath(new URL('../Lectures/', import.meta.url)));
const PORT = 8144;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.map':'application/json' };
const deck = process.argv[2], slide = +process.argv[3], step = +process.argv[4];
const outdir = join(fileURLToPath(new URL('../', import.meta.url)), process.argv[5] || '_internal/l56_reaudit2/deck-steps');
const srv = createServer(async (req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);p=normalize(join(LECT,p));if(!p.startsWith(LECT)){res.writeHead(403).end();return;}const s=await stat(p).catch(()=>null);if(!s||s.isDirectory()){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'});res.end(await readFile(p));}catch{res.writeHead(500).end();}});
await new Promise(r=>srv.listen(PORT,()=>r()));
await mkdir(outdir,{recursive:true});
const url=f=>`http://localhost:${PORT}/${encodeURIComponent(f)}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});
const page = await ctx.newPage();
const cerr=[]; page.on('console',m=>{if(m.type()==='error')cerr.push(m.text().slice(0,120));});
await page.goto(url(deck),{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.Lecture&&window.Lecture.total>0,{timeout:20000});
await page.addStyleTag({content:'.toolbar{visibility:hidden!important}'});
await page.waitForTimeout(1200);
const isDark = ()=>page.evaluate(()=>{const m=getComputedStyle(document.querySelector('.slide.is-active')).backgroundColor.match(/\d+/g)||[255,255,255];return (+m[0]+ +m[1]+ +m[2])<200;});
const base = basename(deck,'.html');
for(const theme of ['light','dark']){
  await page.evaluate(()=>document.activeElement?.blur());
  if((theme==='dark')!==await isDark()){await page.keyboard.press('d');await page.waitForTimeout(350);}
  await page.evaluate(i=>{location.hash='#/'+i;}, slide);
  await page.waitForTimeout(600);
  // advance steps
  for(let s=0;s<step;s++){ await page.keyboard.press('ArrowRight'); await page.waitForTimeout(450); }
  const cur = await page.evaluate(()=>{const c=document.querySelector('.slide.is-active');return {label:c?.dataset.screenLabel,step:c?.dataset.currentStep,max:c?.dataset.maxStep};});
  const f=join(outdir,`${base}-s${String(slide).padStart(2,'0')}-step${step}-${theme}.png`);
  await page.screenshot({path:f});
  console.log(theme, JSON.stringify(cur), '→', basename(f));
}
console.log('console errors:', cerr.length?cerr.join(' | '):'none');
await browser.close(); srv.close();
