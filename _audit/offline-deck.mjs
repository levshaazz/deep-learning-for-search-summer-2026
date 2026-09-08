#!/usr/bin/env node
/* offline-deck.mjs — H1 guarantee for a SHIPPED lecture deck: load
   Lectures/<file> over file:// (no server), abort every non-file:// request, and
   assert 0 pageerrors + 0 non-local requests while stepping through slides.

   Usage: node _audit/offline-deck.mjs 00-introduction.html
   Exit 0 iff the deck is fully self-contained offline.                          */
import { chromium } from 'playwright';
import { HARDENED } from './lib/gate-harness.mjs';   // --disable-dev-shm-usage etc. (CI OOM guard)
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const file = process.argv[2];
if (!file) { console.error('usage: offline-deck.mjs <deck-file.html>'); process.exit(2); }
const deckPath = join(fileURLToPath(new URL('../Lectures/', import.meta.url)), file);
const url = pathToFileURL(deckPath).href;

const nonLocal = [], errs = [];
const browser = await chromium.launch(HARDENED);
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.route('**/*', (route) => {
  const u = route.request().url();
  if (u.startsWith('file://') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  nonLocal.push(u.slice(0, 90));
  return route.abort();
});
const page = await ctx.newPage();
page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await page.goto(url, { waitUntil: 'load' }).catch(() => {});
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 15000 }).catch(() => {});
await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120); }
const total = await page.evaluate(() => (window.Lecture ? window.Lecture.total : 0));
await browser.close();

console.log(`[offline-deck] ${file}  slides=${total}  pageerrors=${errs.length}  nonLocalRequests=${nonLocal.length}`);
if (errs.length) console.log('  pageerrors:', errs.slice(0, 5));
if (nonLocal.length) console.log('  non-local:', nonLocal.slice(0, 8));
process.exit(errs.length === 0 && nonLocal.length === 0 && total > 0 ? 0 : 1);
