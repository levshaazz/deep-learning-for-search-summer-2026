#!/usr/bin/env node
/* =========================================================
   image-gate.mjs — AUDIT_V2 §3.1 palette gate (deterministic).
   For every generated illustration under Lectures/assets/img, checks that its
   SATURATED colour mass stays within the brand palette and that GREEN appears
   only on Serega-tagged images. Catches the color-drift class (Goodhart green-cap
   leak, orange alien, off-brand purples/reds) WITHOUT the VLM eyeballing it.

   Robust to anti-aliasing / JPEG mid-tones: we work in HSV and only count pixels
   with saturation ≥ SAT_MIN. AA blends (low saturation) are ignored; only strongly
   coloured, wrong-hue pixels are violations.

   Brand hues (deg): orange/ochre 10–95 · green 95–175 · blue 185–255.
   BANNED saturated hue: reds/magenta/purple (255–360 & 0–10) and the cyan gap (175–185).
   GREEN (95–175) is allowed ONLY on images whose gen_images job has_serega=True,
   and only in a small area (the tübetey); green on a non-Serega image = leak.

   Severity: OUTOFPALETTE (banned hue mass) = HARD; GREEN-LEAK (green on non-Serega) = HARD;
   GREEN-LARGE (green > GREEN_MAX of canvas, i.e. a green body not a cap) = HARD.
   Coverage (§4.1): inspects 100% of non-scratch PNGs; prints inspected/total.

   Usage:  node image-gate.mjs            (all images)
           node image-gate.mjs --selftest (run the known-bad fixture check, §2.4)
   ========================================================= */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('../', import.meta.url)));
const IMGDIR = join(ROOT, 'Lectures/assets/img');
const FIXDIR = join(ROOT, '_audit/fixtures');

const SAT_MIN = 0.30;     // only strongly-coloured pixels count (ignores AA mid-tones)
const BANNED_COV = 0.03;  // ≥3% saturated banned-hue mass → violation
const GREEN_LEAK = 0.02;  // ≥2% green on a non-Serega image → leak
const GREEN_MAX  = 0.18;  // >18% green on any image → a green BODY, not a cap

// §2.5 asset-weight budget
const WEIGHT_BUDGET = 30 * 1024 * 1024;   // total non-scratch PNG bytes
const FILE_CAP = 512 * 1024;              // per-image cap

// §3.4 OCR-no-text: catch BAKED-IN style watermarks / titles (the "Wait But Why" / "TOKENIZATION"
// signage class). Denylist of forbidden phrases ONLY — legit short hand-lettered labels are allowed,
// so this is high-precision (won't false-flag "embeddings"/"qu" labels). Needs tesseract.
let HAS_TESS = false;
try { execSync('tesseract --version', { stdio: 'ignore' }); HAS_TESS = true; } catch {}
const BANNED_TEXT = ['waitbutwhy', 'tobedeleted', 'loremipsum', 'placeholder', 'sampletext'];
function ocrBanned(file) {
  if (!HAS_TESS) return null;
  let t = '';
  try { t = execSync(`tesseract "${file}" - --psm 11`, { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }); }
  catch { return null; }
  const norm = t.toLowerCase().replace(/[^a-z]/g, '');
  return BANNED_TEXT.find(b => norm.includes(b)) || null;
}

// ---- has_serega map, parsed from the single source of truth (gen_images.py JOBS) ----
function seregaSet() {
  const py = readFileSync(join(ROOT, '_research/gen_images.py'), 'utf8');
  const set = new Set();
  const re = /\(\s*"(?:char|L0|L1|L2)"\s*,\s*"([^"]+\.png)"\s*,\s*"[^"]+"\s*,\s*(True|False)/g;
  let m; while ((m = re.exec(py))) if (m[2] === 'True') set.add(basename(m[1]));
  return set;
}

function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = 60 * (((g - b) / d) % 6);
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: mx ? d / mx : 0, v: mx };
}
const isGreen = (h) => h >= 95 && h < 175;
const isBrand = (h) => (h >= 10 && h < 95) || isGreen(h) || (h >= 185 && h < 255);

function histogram(file) {
  const out = execSync(
    `magick "${file}" -resize 120x120 -colors 48 -depth 8 -format "%c" histogram:info:-`,
    { encoding: 'utf8', maxBuffer: 1 << 24 });
  const rows = [];
  for (const line of out.split('\n')) {
    const m = line.match(/(\d+):\s*\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (m) rows.push({ n: +m[1], r: +m[2], g: +m[3], b: +m[4] });
  }
  return rows;
}

function analyze(file, isSerega) {
  const rows = histogram(file);
  const total = rows.reduce((a, x) => a + x.n, 0) || 1;
  let banned = 0, green = 0; const bannedHues = {};
  for (const { n, r, g, b } of rows) {
    const { h, s } = rgb2hsv(r, g, b);
    if (s < SAT_MIN) continue;             // AA / neutral — ignore
    const cov = n / total;
    if (isGreen(h)) green += cov;
    else if (!isBrand(h)) { banned += cov; const k = Math.round(h / 30) * 30; bannedHues[k] = (bannedHues[k] || 0) + cov; }
  }
  const issues = [];
  if (banned > BANNED_COV) {
    const top = Object.entries(bannedHues).sort((a, b) => b[1] - a[1])[0];
    issues.push(`OUTOFPALETTE ${(banned * 100).toFixed(1)}% saturated off-brand (peak hue≈${top[0]}°)`);
  }
  if (green > GREEN_LEAK && !isSerega)
    issues.push(`GREEN-LEAK ${(green * 100).toFixed(1)}% green on a non-Serega image (green is the tübetey, Serega-only)`);
  if (green > GREEN_MAX)
    issues.push(`GREEN-LARGE ${(green * 100).toFixed(1)}% green (a green body/fill, not just the cap)`);
  const baked = ocrBanned(file);
  if (baked) issues.push(`BAKEDTEXT OCR found forbidden baked-in text "${baked}" (no watermarks/style-names in art)`);
  return issues;
}

function walk(dir) {
  const res = [];
  for (const e of readdirSync(dir)) {
    if (e === '_contact' || e === '_orig' || e.startsWith('.')) continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) res.push(...walk(p));
    else if (e.toLowerCase().endsWith('.png')) res.push(p);
  }
  return res;
}

function run(dir, serega) {
  const imgs = walk(dir);
  let hard = 0; const flagged = [];
  for (const f of imgs) {
    const base = basename(f);
    const issues = analyze(f, serega.has(base));
    if (issues.length) { flagged.push({ base, issues }); hard += issues.length; }
  }
  return { imgs, flagged, hard };
}

// ---- self-test (§2.4): a known-bad fixture must fire ----
if (process.argv.includes('--selftest')) {
  if (!existsSync(FIXDIR)) mkdirSync(FIXDIR, { recursive: true });
  // (a) off-brand purple/magenta → must trip OUTOFPALETTE
  const fPurple = join(FIXDIR, 'palette-bad-purple.png');
  execSync(`magick -size 400x225 xc:"#FBFAF6" -fill "#8A2BE2" -draw "rectangle 40,40 200,185" -fill "#D81B8C" -draw "rectangle 220,40 360,185" "${fPurple}"`);
  const iP = analyze(fPurple, false);
  const okP = iP.some(i => i.startsWith('OUTOFPALETTE'));
  // (b) green blob on a NON-Serega image → must trip GREEN-LEAK (the Goodhart-cap-leak class)
  const fGreen = join(FIXDIR, 'palette-bad-greenleak.png');
  execSync(`magick -size 400x225 xc:"#FBFAF6" -fill "#2F7D4F" -draw "rectangle 120,60 280,170" "${fGreen}"`);
  const iG = analyze(fGreen, false);   // isSerega=false
  const okG = iG.some(i => i.startsWith('GREEN-LEAK') || i.startsWith('GREEN-LARGE'));
  // (c) baked-in "Wait But Why" watermark → must trip BAKEDTEXT (skipped if tesseract absent)
  let okB = true;
  if (HAS_TESS) {
    const fText = join(FIXDIR, 'baked-text.png');
    execSync(`magick -size 600x200 xc:"#FBFAF6" -font "/System/Library/Fonts/Helvetica.ttc" -fill black -pointsize 64 -gravity center -annotate +0+0 "Wait But Why" "${fText}"`);
    const iB = analyze(fText, false);
    okB = iB.some(i => i.startsWith('BAKEDTEXT'));
    console.log(`[selftest] baked-text fixture →`, iB.join(' | ') || 'NO FLAG');
  } else {
    console.log('[selftest] baked-text fixture → SKIPPED (tesseract not installed)');
  }
  console.log(`[selftest] purple fixture →`, iP.join(' | ') || 'NO FLAG');
  console.log(`[selftest] green-leak fixture →`, iG.join(' | ') || 'NO FLAG');
  const ok = okP && okG && okB;
  console.log(ok ? '[selftest] PASS — OUTOFPALETTE + GREEN-LEAK + BAKEDTEXT all fire'
                 : '[selftest] FAIL — a detector is blind!');
  process.exit(ok ? 0 : 1);
}

const serega = seregaSet();
const { imgs, flagged, hard } = run(IMGDIR, serega);
console.log(`[image-gate] inspected ${imgs.length}/${imgs.length} PNGs (100% coverage) · Serega-tagged: ${serega.size} · OCR: ${HAS_TESS ? 'on' : 'off (no tesseract)'}`);
for (const { base, issues } of flagged)
  console.log(`  ✗ ${base}\n      - ${issues.join('\n      - ')}`);

// §2.5 asset-weight budget (WARN — perf, not correctness)
let totalBytes = 0; const heavy = [];
for (const f of imgs) { const sz = statSync(f).size; totalBytes += sz; if (sz > FILE_CAP) heavy.push(`${basename(f)} ${(sz/1024)|0}KB`); }
let warn = 0;
if (totalBytes > WEIGHT_BUDGET) { console.log(`  ! WEIGHT total ${(totalBytes/1048576).toFixed(1)}MB > budget ${(WEIGHT_BUDGET/1048576)|0}MB`); warn++; }
heavy.forEach(h => { console.log(`  ! HEAVY ${h} > cap ${(FILE_CAP/1024)|0}KB`); warn++; });
console.log(`[image-gate] total weight ${(totalBytes/1048576).toFixed(1)}MB (budget ${(WEIGHT_BUDGET/1048576)|0}MB)`);

console.log(`\n[image-gate] HARD(outofpalette/green-leak/green-large/bakedtext)=${hard}  WARN(weight)=${warn}`);
process.exit(hard > 0 ? 1 : 0);
