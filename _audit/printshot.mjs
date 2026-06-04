import { chromium } from 'playwright';
const BASE='http://localhost:8099/Lecture%20Template.html';
const S=decodeURIComponent(new URL('./shots-fixed/',import.meta.url).pathname);
const b=await chromium.launch();const c=await b.newContext({viewport:{width:1920,height:1080}});const p=await c.newPage();
await p.goto(BASE,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.Lecture&&window.Lecture.total>0);await p.waitForTimeout(1500);
await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
const tag=process.argv[2]||'before';
for(const [type,name] of [['walkthrough','wt'],['e2e','e2e']]){
  const el=await p.$(`.slide[data-type="${type}"]`);
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({path:S+`print-${name}-${tag}.png`});
}
await b.close();console.log('shot',tag);
