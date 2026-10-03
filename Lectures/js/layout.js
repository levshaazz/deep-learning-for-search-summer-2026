/* AUTO-GENERATED classic global of widgets/_layout.js — do not edit. Rebuild: node scripts/build-deck-layout.mjs */
var DeckLayout = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // widgets/_layout.js
  var layout_exports = {};
  __export(layout_exports, {
    grid: () => grid,
    makeScale: () => makeScale,
    placeLabels: () => placeLabels,
    stack: () => stack
  });
  function makeScale(values, rect, opts = {}) {
    const axis = opts.axis === "y" ? "y" : "x";
    const pad = typeof opts.pad === "number" ? opts.pad : 0.08;
    const arr = (values || []).filter((v) => Number.isFinite(v));
    let dmin = arr.length ? Math.min(...arr) : 0;
    let dmax = arr.length ? Math.max(...arr) : 1;
    let span = dmax - dmin;
    if (!(span > 0)) span = Math.abs(dmin) || 1;
    const p = span * pad;
    const lo = dmin - p, hi = dmax + p, dspan = hi - lo || 1;
    const to = (v) => axis === "x" ? rect.x + (v - lo) / dspan * rect.w : rect.y + rect.h - (v - lo) / dspan * rect.h;
    const invert = (px) => axis === "x" ? lo + (px - rect.x) / rect.w * dspan : lo + (rect.y + rect.h - px) / rect.h * dspan;
    const ticks = (n = 5) => {
      if (n < 2) return [dmin];
      return Array.from({ length: n }, (_, i) => dmin + i * (dmax - dmin) / (n - 1));
    };
    return { to, invert, ticks, domain: { min: lo, max: hi, span: dspan } };
  }
  function stack(rect, items, opts = {}) {
    const dir = opts.dir === "col" || opts.dir === "column" || opts.dir === "vertical" ? "col" : "row";
    const gap = typeof opts.gap === "number" ? opts.gap : 12;
    const n = Array.isArray(items) ? items.length : items;
    if (!n || n < 1) return [];
    const weights = Array.isArray(items) ? items.map((it) => typeof it === "number" ? it : it && it.size || 1) : Array(n).fill(1);
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const along = (dir === "row" ? rect.w : rect.h) - gap * (n - 1);
    const out = [];
    let cursor = dir === "row" ? rect.x : rect.y;
    for (let i = 0; i < n; i++) {
      const seg = along * weights[i] / total;
      out.push(dir === "row" ? { x: cursor, y: rect.y, w: seg, h: rect.h } : { x: rect.x, y: cursor, w: rect.w, h: seg });
      cursor += seg + gap;
    }
    return out;
  }
  function grid(rect, n, opts = {}) {
    if (!n || n < 1) return [];
    const gap = typeof opts.gap === "number" ? opts.gap : 12;
    const cols = Math.max(1, opts.cols || Math.ceil(Math.sqrt(n)));
    const rows = Math.ceil(n / cols);
    const cw = (rect.w - gap * (cols - 1)) / cols;
    const ch = (rect.h - gap * (rows - 1)) / rows;
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      out.push({ x: rect.x + c * (cw + gap), y: rect.y + r * (ch + gap), w: cw, h: ch });
    }
    return out;
  }
  function placeLabels(anchors, rect, opts = {}) {
    const minGap = typeof opts.minGap === "number" ? opts.minGap : 17;
    const iters = typeof opts.iters === "number" ? opts.iters : 160;
    const charW = typeof opts.charW === "number" ? opts.charW : 8;
    const dx = typeof opts.dx === "number" ? opts.dx : 11;
    const pad = typeof opts.pad === "number" ? opts.pad : 4;
    const topPad = typeof opts.topPad === "number" ? opts.topPad : 12;
    const L = (anchors || []).map((a) => {
      const right = a.side === "right" || a.side == null && a.x <= rect.x + rect.w * 0.6;
      const w = String(a.text == null ? "" : a.text).split("").reduce(
        (sum, ch) => sum + (/[А-Яа-яЁё]/.test(ch) ? charW * 1.25 : charW),
        0
      );
      return { x: a.x, y: a.y, text: a.text, w, right, lx: a.x + (right ? dx : -dx), ly: a.y + 4 };
    });
    for (let it = 0; it < iters; it++) {
      for (let i = 0; i < L.length; i++) {
        for (let j = i + 1; j < L.length; j++) {
          const a = L[i], b = L[j];
          const aLeft = a.right ? a.lx : a.lx - a.w;
          const bLeft = b.right ? b.lx : b.lx - b.w;
          if (Math.abs(aLeft - bLeft) > Math.max(a.w, b.w)) continue;
          const oy = minGap - Math.abs(a.ly - b.ly);
          if (oy > 0) {
            const d = a.ly <= b.ly ? -1 : 1;
            a.ly += d * (oy / 2 + 0.4);
            b.ly -= d * (oy / 2 + 0.4);
          }
        }
      }
    }
    for (const p of L) p.ly = Math.max(rect.y + topPad, Math.min(rect.y + rect.h - pad, p.ly));
    return L.map((p) => ({
      x: p.lx,
      y: p.ly,
      anchorX: p.x,
      anchorY: p.y,
      right: p.right,
      text: p.text,
      w: p.w,
      textAnchor: p.right ? "start" : "end"
    }));
  }
  return __toCommonJS(layout_exports);
})();
