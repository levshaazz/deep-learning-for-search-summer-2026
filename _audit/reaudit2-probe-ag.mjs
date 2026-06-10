import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8133;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.jpg':'image/jpeg' };
const srv = createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.startsWith(BASE))p=p.slice(BASE.length);let f=join(DOCS,p);if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');if(!existsSync(f)){res.statusCode=404;res.end('404');return;}res.setHeader('Content-Type',MIME[extname(f)]||'application/octet-stream');res.end(readFileSync(f));});
await new Promise(r=>srv.listen(PORT,r));
const b=await chromium.launch();const page=await b.newPage({viewport:{width:1280,height:900}});
await page.goto(`http://localhost:${PORT}${BASE}/en/book/06/`,{waitUntil:'networkidle'});
await page.waitForTimeout(800);
// scroll attention-geo into view
const el = await page.$('[data-beat="climb-attention-geo"] [data-step]');
if(el) await el.evaluate(n=>n.scrollIntoView({block:'center'}));
await page.waitForTimeout(800);
const info = await page.evaluate(()=>{
  const sc=[...document.querySelectorAll('.scrolly')].find(s=>s.querySelector('[data-beat="climb-attention-geo"]')||(s.querySelector('.scrolly-graphic')?.getAttribute('data-beat'))==='climb-attention-geo');
  const g=sc?.querySelector('.scrolly-graphic');
  const svg=g?.querySelector('svg');
  if(!svg) return {err:'no svg', gHTML:(g?.innerHTML||'').slice(0,200)};
  const out={svgClass:svg.getAttribute('class'),childCount:svg.children.length,samples:[]};
  [...svg.querySelectorAll('rect,circle,line,path')].slice(0,8).forEach(e=>{
    const cs=getComputedStyle(e);
    out.samples.push({tag:e.tagName,cls:e.getAttribute('class'),fill:cs.fill,stroke:cs.stroke});
  });
  return out;
});
console.log(JSON.stringify(info,null,1));
await b.close();srv.close();
