/* prose-extract.mjs — dump rendered prose (non-scrolly) from a book chapter for reading review.
   Usage: node _audit/prose-extract.mjs <chapter> <lang> */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs'); const BASE='/deep-learning-for-search-summer-2026'; const PORT=8590+Math.floor(Math.random()*100);
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp'};
function serve(){return createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.startsWith(BASE))p=p.slice(BASE.length);let f=join(DOCS,p);if(existsSync(f)&&statSync(f).isDirectory())f=join(f,'index.html');if(!existsSync(f)){r.statusCode=404;r.end('404');return;}r.setHeader('Content-Type',MIME[extname(f)]||'application/octet-stream');r.end(readFileSync(f));});}
const ch=process.argv[2]||'06', lang=process.argv[3]||'en';
const srv=serve(); await new Promise(r=>srv.listen(PORT,r));
const b=await chromium.launch(); const p=await b.newPage();
await p.goto(`http://localhost:${PORT}${BASE}/${lang}/book/${ch}/`,{waitUntil:'networkidle'});
await p.waitForTimeout(800);
const txt = await p.evaluate(()=>{
  // collect prose blocks but skip scrolly step paragraphs (those are widget captions)
  const blocks=[];
  document.querySelectorAll('main h1, main h2, main h3, main > .book > *, main .book p, main .book li, main .book blockquote').forEach(el=>{
    if(el.closest('.scrolly')) return;
    const t=el.innerText.trim(); if(t&&t.length>2) blocks.push((el.tagName)+': '+t);
  });
  return [...new Set(blocks)].join('\n\n');
});
console.log(txt);
await b.close(); srv.close();
