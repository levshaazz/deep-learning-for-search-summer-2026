#!/usr/bin/env node
/* shot.mjs — capture specific slides of a real deck in light + dark themes.
   Usage: node shot.mjs <deck.html> <slideNum[,slideNum...]> [outdir]
   e.g.   node shot.mjs 00-introduction.html 3,6,20 _audit/shots-art
   Saves <outdir>/<deck>-s<NN>-<theme>.png at 1920x1080. */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, normalize, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const LECT_DIR = join(fileURLToPath(new URL('../Lectures/', import.meta.url)));
const PORT = 8143;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json',
  '.woff2':'font/woff2','.woff':'font/woff','.svg':'image/svg+xml','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.map':'application/json' };

const deck = process.argv[2];
const slidesArg = (process.argv[3]||'').trim();              // "1,2,3" | "all"
const outdir = join(fileURLToPath(new URL('../', import.meta.url)), process.argv[4] || '_audit/shots-art');
const themeArg = (process.argv[5]||'both').toLowerCase();    // light | dark | both
const themes = themeArg === 'both' ? ['light','dark'] : [themeArg];
if (!deck || !slidesArg) { console.error('usage: node shot.mjs <deck.html> <n,n,..|all> [outdir] [light|dark|both]'); process.exit(2); }

function startServer(){
  const srv = createServer(async (req,res)=>{ try{
    let p=decodeURIComponent(req.url.split('?')[0]); p=normalize(join(LECT_DIR,p));
    if(!p.startsWith(LECT_DIR)){res.writeHead(403).end();return;}
    const s=await stat(p).catch(()=>null); if(!s||s.isDirectory()){res.writeHead(404).end();return;}
    res.writeHead(200,{'content-type':MIME[extname(p)]||'application/octet-stream'}); res.end(await readFile(p));
  }catch{res.writeHead(500).end();} });
  return new Promise(r=>srv.listen(PORT,()=>r(srv)));
}
const url=f=>`http://localhost:${PORT}/${encodeURIComponent(f)}`;

const srv = await startServer();
await mkdir(outdir,{recursive:true});
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1 });
const page = await ctx.newPage();
const cerr=[]; page.on('console',m=>{if(m.type()==='error')cerr.push(m.text().slice(0,120));});
await page.goto(url(deck),{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.Lecture&&window.Lecture.total>0,{timeout:20000});
// --no-chrome: hide the global auto-hiding nav toolbar so a screenshot is deterministic
// (it fades on idle and is mid-fade at capture time → false diffs). Per-slide step/quiz
// controls are slide CONTENT and stay visible. Used by golden.mjs regression baselines.
if (process.argv.includes('--no-chrome'))
  await page.addStyleTag({content:'.toolbar{visibility:hidden!important}'});
await page.waitForTimeout(1500);
const total = await page.evaluate(()=>window.Lecture.total);
const slides = slidesArg === 'all'
  ? Array.from({length: total}, (_,i)=>i+1)
  : slidesArg.split(',').map(s=>parseInt(s,10)).filter(Number.isFinite);
const base = basename(deck,'.html');
const isDark = () => page.evaluate(()=>{
  const m=getComputedStyle(document.querySelector('.slide.is-active')).backgroundColor.match(/\d+/g)||[255,255,255];
  return (+m[0]+ +m[1]+ +m[2])<200;
});
for (const theme of themes) {
  await page.evaluate(()=>document.activeElement?.blur());
  if ((theme==='dark') !== await isDark()) { await page.keyboard.press('d'); await page.waitForTimeout(350); }
  for (const n of slides) {
    await page.evaluate(i=>{ location.hash = '#/'+i; }, n); await page.waitForTimeout(500);
    const f=join(outdir,`${base}-s${String(n).padStart(2,'0')}-${theme}.png`);
    await page.screenshot({path:f});
  }
}
console.log('console errors:', cerr.length? cerr.join(' | ') : 'none');
console.log(`coverage: ${slides.length}/${total} slides × ${themes.length} theme(s) [${themes.join(',')}] → ${slides.length*themes.length} shots in ${outdir}`);
await browser.close(); srv.close();
