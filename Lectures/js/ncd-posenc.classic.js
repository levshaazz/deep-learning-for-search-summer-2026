/* AUTO-GENERATED offline classic bundle of widgets/ncd-posenc/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
(() => {
  // widgets/_widget-base.js
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  }
  function fmt(n, digits = 6) {
    if (typeof n !== "number" || !isFinite(n)) return "";
    return Number.isInteger(n) ? String(n) : n.toFixed(digits);
  }
  function mountName(id) {
    return "mount" + String(id).split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  }
  function defineWidget({
    id,
    maxStep,
    render,
    rootClass,
    exportName,
    fade = true,
    bareRoot = false,
    scaffold = true
  }) {
    const MAX = maxStep;
    const cls = rootClass || `${id}-root`;
    function mount(host, { data, labels = {}, ...rest } = {}) {
      if (bareRoot) {
        host.classList.add(cls);
      } else {
        host.classList.add("wgt-root", cls);
        if (fade) host.classList.add("wgt-fade");
      }
      host.innerHTML = "";
      const base = { ...labels };
      const active = labels;
      const i18nAll = rest && rest.i18nAll && typeof rest.i18nAll === "object" ? rest.i18nAll : null;
      const ctx = { host, data, labels: active, el: svgEl, svg: svgEl, esc, fmt, maxStep: MAX, ...rest };
      let cap = null, counter = null;
      if (scaffold) {
        cap = document.createElement("div");
        cap.className = "wgt-caption";
        counter = document.createElement("div");
        counter.className = "wgt-counter";
      }
      const rendered = () => host.getClientRects().length > 0;
      let dirty = false;
      let update = null;
      function paint() {
        if (!rendered()) {
          dirty = true;
          return;
        }
        dirty = false;
        host.innerHTML = "";
        update = render(ctx);
        if (active.alt && !host.querySelector('[role="img"]')) {
          host.setAttribute("role", "img");
          host.setAttribute("aria-label", active.alt);
        }
        if (scaffold) {
          host.appendChild(cap);
          host.appendChild(counter);
        }
      }
      paint();
      let step = -1;
      function setStep(k) {
        k = Math.max(0, Math.min(MAX, k | 0));
        let same = k === step;
        step = k;
        host.dataset.step = String(k);
        if (dirty) {
          paint();
          same = false;
        }
        if (typeof update === "function" && !same) update(k);
        if (scaffold) {
          cap.textContent = active["s" + k] || "";
          counter.textContent = `${k} / ${MAX}`;
        }
      }
      setStep(0);
      if (typeof document !== "undefined" && document.fonts && document.fonts.status !== "loaded") {
        document.fonts.ready.then(() => {
          const at = step;
          paint();
          step = -1;
          setStep(at);
          lockCaptionHeight();
        });
      }
      function lockCaptionHeight() {
        if (!scaffold || !cap || cap.offsetParent === null) return;
        const langs = i18nAll ? Object.values(i18nAll) : [active];
        const prevText = cap.textContent, prevMin = cap.style.minHeight;
        cap.style.minHeight = "0px";
        let max = 0;
        for (const L of langs) for (let k = 0; k <= MAX; k++) {
          cap.textContent = L && L["s" + k] || "";
          const h = cap.getBoundingClientRect().height;
          if (h > max) max = h;
        }
        cap.textContent = prevText;
        cap.style.minHeight = max > 0 ? Math.ceil(max) + "px" : prevMin;
      }
      lockCaptionHeight();
      let obs = null;
      if (typeof MutationObserver === "function" && typeof document !== "undefined" && document.documentElement) {
        const rootEl = document.documentElement;
        const pickLang = () => (rootEl.dataset.lang || rootEl.lang || "en").slice(0, 2);
        let curLang = pickLang();
        obs = new MutationObserver(() => {
          const lang = pickLang();
          if (lang === curLang) return;
          curLang = lang;
          if (i18nAll && i18nAll[lang]) {
            for (const k of Object.keys(active)) delete active[k];
            Object.assign(active, base, i18nAll[lang]);
            const at = step;
            paint();
            step = -1;
            setStep(at);
          }
          lockCaptionHeight();
        });
        obs.observe(rootEl, { attributes: true, attributeFilter: ["data-lang", "lang"] });
      }
      return {
        setStep,
        get step() {
          return step;
        },
        get maxStep() {
          return MAX;
        },
        root: host,
        relock: lockCaptionHeight,
        destroy() {
          if (obs) obs.disconnect();
        }
      };
    }
    if (typeof window !== "undefined") window[exportName || mountName(id)] = mount;
    return mount;
  }

  // widgets/_ncd.js
  function glyphs(el) {
    const text = (parent, x, y, s, cls, anchor = "middle") => {
      if (!parent) throw new Error(`_ncd.text("${s}"): no parent \u2014 the label would be created and dropped`);
      const t = el("text", { x, y, class: cls || "", "text-anchor": anchor }, parent);
      t.textContent = s;
      return t;
    };
    const wire = (parent, cls, x1, y1, x2, y2, opt = {}) => {
      const a = { class: opt.dash ? cls : cls + " ncd-wire", x1, y1, x2, y2 };
      if (!opt.dash) a.pathLength = 1;
      const p = el("line", a, parent);
      if (opt.dash) p.setAttribute("stroke-dasharray", opt.dash);
      if (opt.arrow) el("path", {
        class: cls,
        d: `M${x2 - 8},${y2 - 4} L${x2},${y2} L${x2 - 8},${y2 + 4}`,
        fill: "none",
        style: "stroke-linejoin:round"
      }, parent);
      return p;
    };
    const path = (parent, cls, d) => el("path", { class: cls, d }, parent);
    function chippedL(parent, cx, cy, label, boxCls, txtCls, w = 46, h = 40) {
      const c = 10, x = cx - w / 2, y = cy - h / 2;
      el("path", { class: boxCls, d: `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z` }, parent);
      text(parent, cx, cy + 4, label, txtCls);
    }
    function cup(parent, cx, cy, opCls, dotCls) {
      el("path", { class: opCls, d: `M${cx - 14},${cy - 12} Q${cx},${cy + 16} ${cx + 14},${cy - 12}` }, parent);
      el("circle", { class: dotCls, cx, cy: cy + 6, r: 2.4 }, parent);
    }
    function tri(parent, cx, cy, triCls, txtCls, rot = 0) {
      const a = rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const P = ([x, y]) => `${cx + x * c - y * s},${cy + x * s + y * c}`;
      el("path", { class: triCls, d: `M${P([-18, -19])} L${P([18, 0])} L${P([-18, 19])} Z` }, parent);
      const tx = -5 * c - 1 * s, ty = -5 * s + 1 * c;
      text(parent, cx + tx, cy + ty + 4, "\u03C3", txtCls);
    }
    function hexagon(parent, cx, cy, label, hexCls, txtCls, r = 24, ry = 18) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        pts.push(`${cx + r * Math.cos(a)},${cy + ry * Math.sin(a)}`);
      }
      el("polygon", { class: hexCls, points: pts.join(" ") }, parent);
      if (label) text(parent, cx, cy + 4, label, txtCls);
    }
    function pentagon(parent, cx, cy, label, elCls, txtCls, w = 34, h = 30) {
      el("path", { class: elCls, d: `M${cx - w / 2},${cy} L${cx - w / 6},${cy - h / 2} H${cx + w / 2} V${cy + h / 2} H${cx - w / 6} Z` }, parent);
      if (label) text(parent, cx + 5, cy + 4, label, txtCls);
    }
    function box(parent, cx, cy, w, h, label, sub, boxCls, txtCls, sizeCls) {
      el("rect", { class: boxCls, x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 6 }, parent);
      text(parent, cx, cy + (sub ? -6 : 4), label, txtCls);
      if (sub) text(parent, cx, cy + 13, sub, sizeCls);
    }
    function tagBox(parent, cx, cy, s, boxCls, txtCls, padX = 9, padY = 5, anchor = "middle") {
      const t = text(parent, cx, cy, s, txtCls, anchor);
      const b = t.getBBox();
      if (String(s).trim() && b.width === 0) {
        throw new Error(`_ncd.tagBox("${s}"): measured a 0-width box \u2014 the figure is being drawn inside a hidden subtree, where getBBox() lies. Every measured box would collapse onto the origin.`);
      }
      const r = el("rect", {
        class: boxCls,
        x: b.x - padX,
        y: b.y - padY,
        width: b.width + padX * 2,
        height: b.height + padY * 2,
        rx: 5
      }, parent);
      parent.insertBefore(r, t);
      return r;
    }
    function chips(parent, centers, y, vals, chipCls, valCls, w, fmt2) {
      centers.forEach((cx, i) => {
        el("rect", { class: chipCls, x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 5 }, parent);
        text(parent, cx, y + 4, fmt2 ? fmt2(vals[i]) : String(vals[i]), valCls);
      });
    }
    function weave(parent, wCls, tagCls, txtCls, x1, x2, y, bow, tag) {
      const mx = (x1 + x2) / 2;
      path(parent, wCls, `M${x1},${y} C${x1 + 30},${y - bow} ${mx - 60},${y - bow} ${mx},${y - bow} C${mx + 60},${y - bow} ${x2 - 30},${y - bow} ${x2},${y}`);
      el("circle", { cx: x1, cy: y, r: 3, class: wCls, style: "stroke:none" }, parent);
      tagBox(parent, mx, y - bow + 3, tag, tagCls, txtCls, 8, 4);
    }
    function region(parent, x, y, w, h, tag, regionCls, tagCls, txtCls) {
      el("rect", { class: regionCls, x, y, width: w, height: h, rx: 14 }, parent);
      tagBox(parent, x + 24, y - 6, tag, tagCls, txtCls, 9, 4, "start");
    }
    function legend(parent, cx, y, s, cls, maxW, lh = 15) {
      const items = String(s).split(" \xB7 ");
      const probe = text(parent, -9999, -9999, "", cls);
      const fits = (str) => {
        probe.textContent = str;
        return probe.getBBox().width <= maxW;
      };
      const lines = [];
      let cur = "";
      for (const it of items) {
        const next = cur ? `${cur} \xB7 ${it}` : it;
        if (cur && !fits(next)) {
          lines.push(cur);
          cur = it;
        } else cur = next;
      }
      if (cur) lines.push(cur);
      probe.remove();
      const y0 = y - (lines.length - 1) * lh;
      lines.forEach((ln, i) => text(parent, cx, y0 + i * lh, ln, cls));
      return lines.length;
    }
    const fmt3 = (x) => typeof x !== "number" ? "" : Number.isInteger(x) ? String(x) : x.toFixed(3);
    return { text, wire, path, chippedL, cup, tri, hexagon, pentagon, box, chips, weave, region, tagBox, legend, fmt3 };
  }

  // widgets/_layout.js
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

  // widgets/ncd-posenc/logic.js
  var mountNcdPosenc = defineWidget({
    id: "ncd-posenc",
    rootClass: "ncdpe-root",
    exportName: "mountNcdPosenc",
    maxStep: 2,
    render({ host, data, labels, el }) {
      const L = (k, fb) => labels && labels[k] || fb;
      const P = data && data.posEnc || { freqs: [1, 0.01], pos0: [0, 1, 0, 1], pos1: [0.841, 0.54, 0.01, 1] };
      const G = glyphs(el);
      const W = 720, H = 288;
      const svg = el("svg", {
        class: "ncdpe-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "Positional encoding as a neural circuit diagram")
      }, host);
      const DIMS = [{ op: "sin", f: 0 }, { op: "cos", f: 0 }, { op: "sin", f: 1 }, { op: "cos", f: 1 }];
      const rows = stack({ x: 40, y: 58, w: 640, h: 196 }, 4, { dir: "col", gap: 10 });
      const midY = (rows[0].y + rows[0].h / 2 + rows[3].y + rows[3].h / 2) / 2;
      const xPos = 84, xDim = 176, xOp = 250, xFreq = 300, xChip = 432, xBrace = 466;
      let main = null;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const g = main;
        const posNum = step === 0 ? 0 : 1;
        const vals = step === 0 ? P.pos0 : P.pos1;
        el("rect", { class: "ncdpe-pos", x: xPos - 44, y: midY - 20, width: 88, height: 40, rx: 8 }, g);
        G.text(g, xPos, midY - 4, L("lblPos", "position"), "ncdpe-pos-lbl");
        G.text(g, xPos, midY + 15, "pos = " + posNum, "ncdpe-pos-txt");
        G.text(g, xOp, rows[0].y - 4, "sin / cos", "ncdpe-hdr");
        G.text(g, xChip, rows[0].y - 4, L("lblPE", "PE(pos)"), "ncdpe-hdr");
        DIMS.forEach((dm, i) => {
          const cy = rows[i].y + rows[i].h / 2;
          const isFast = dm.f === 0, hot = step === 2 && isFast, cold = step === 2 && !isFast;
          el("path", { class: "ncdpe-fan", d: `M${xPos + 44},${midY} C${xPos + 90},${midY} ${xOp - 80},${cy} ${xOp - 38},${cy}` }, g);
          G.text(g, xDim, cy + 4, L("lblDim", "dim") + " " + i, "ncdpe-dim");
          const opCls = hot ? "ncdpe-op-hot" : cold ? "ncdpe-op-cold" : "ncdpe-op";
          el("rect", { class: opCls, x: xOp - 34, y: cy - 15, width: 68, height: 30, rx: 6 }, g);
          G.text(g, xOp, cy + 4, dm.op + " \xB7" + P.freqs[dm.f], "ncdpe-op-txt");
          G.wire(g, "ncdpe-w ncdpe-w-d", xOp + 34, cy, xChip - 30, cy, { arrow: true });
          el("rect", { class: hot ? "ncdpe-chip ncdpe-chip-hot" : "ncdpe-chip", x: xChip - 28, y: cy - 12, width: 56, height: 24, rx: 5 }, g);
          G.text(g, xChip, cy + 4, G.fmt3(vals[i]), "ncdpe-chipv");
        });
        const y0 = rows[0].y + rows[0].h / 2 - 14, y1 = rows[3].y + rows[3].h / 2 + 14;
        el("path", { class: "ncdpe-brace", d: `M${xBrace},${y0} q6,0 6,8 V${(y0 + y1) / 2 - 6} q0,6 6,6 q-6,0 -6,6 V${y1 - 8} q0,8 -6,8` }, g);
        G.text(g, xBrace + 22, (y0 + y1) / 2 + 4, "= PE", "ncdpe-pe", "start");
        if (step === 2) {
          G.text(g, xBrace + 70, rows[0].y + rows[0].h / 2 + 4, "\u2195 " + L("fast", "fast"), "ncdpe-anno ncdpe-anno-fast", "start");
          G.text(g, xBrace + 70, rows[2].y + rows[2].h / 2 + 4, "\xB7 " + L("slow", "slow"), "ncdpe-anno ncdpe-anno-slow", "start");
        }
        G.text(g, W / 2, H - 6, L("legMap", "position broadcasts over the dimension axis"), "ncdpe-legend");
      };
    }
  });
})();
