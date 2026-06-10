/* zoom-region.mjs — crop a region from an existing PNG by loading it in a headless page.
   Usage: node _audit/zoom-region.mjs <png> <x> <y> <w> <h> <outPng> [scale] */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [,, png, x, y, w, h, out, scale='3'] = process.argv;
const b = await chromium.launch();
const dataUrl = 'data:image/png;base64,' + readFileSync(png).toString('base64');
const p = await b.newPage({ viewport:{ width: Math.ceil(+w*+scale)+4, height: Math.ceil(+h*+scale)+4 } });
await p.setContent(`<body style="margin:0;background:#fff"><img id="i" src="${dataUrl}" style="position:absolute;left:${-x*+scale}px;top:${-y*+scale}px;width:${'auto'};transform-origin:0 0;transform:scale(${scale})"></body>`);
await p.waitForTimeout(200);
await p.screenshot({ path: out, clip:{x:0,y:0,width:Math.ceil(+w*+scale),height:Math.ceil(+h*+scale)} });
await b.close();
console.log('wrote', out);
