/* AUTO-GENERATED offline classic bundle of widgets/ncd-kvcache/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
      const i18nAll = rest && rest.i18nAll && typeof rest.i18nAll === "object" ? rest.i18nAll : null;
      const active = { ...labels };
      const localeKeys = /* @__PURE__ */ new Set();
      if (i18nAll) for (const map of Object.values(i18nAll)) {
        if (map && typeof map === "object") for (const key of Object.keys(map)) localeKeys.add(key);
      }
      const configKeys = /* @__PURE__ */ new Set(["role", "variant", "series"]);
      const base = Object.fromEntries(Object.entries(labels).filter(([key]) => !localeKeys.has(key) || configKeys.has(key)));
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
      const originalHostRole = host.getAttribute("role");
      const originalHostAlt = host.getAttribute("aria-label");
      let ownsHostAlt = false;
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
          ownsHostAlt = true;
        } else if (ownsHostAlt) {
          for (const [key, value] of [["role", originalHostRole], ["aria-label", originalHostAlt]]) {
            if (value === null) host.removeAttribute(key);
            else host.setAttribute(key, value);
          }
          ownsHostAlt = false;
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
        if (!rendered()) {
          dirty = true;
          return;
        }
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
          if (i18nAll) {
            for (const k of Object.keys(active)) delete active[k];
            Object.assign(active, i18nAll.en || {}, i18nAll[lang] || {}, base);
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
  function stage(host) {
    const w = document.createElement("div");
    w.className = "ncd-stagewrap";
    const d = document.createElement("div");
    d.className = "ncd-stage";
    w.appendChild(d);
    host.appendChild(w);
    return d;
  }
  function ledger(parent, title) {
    const a = document.createElement("aside");
    a.className = "ncd-lg";
    const h = document.createElement("div");
    h.className = "ncd-lg-h";
    h.textContent = title || "";
    a.appendChild(h);
    const body = document.createElement("div");
    body.className = "ncd-lg-b";
    a.appendChild(body);
    const note = document.createElement("p");
    note.className = "ncd-lg-note";
    a.appendChild(note);
    parent.appendChild(a);
    return {
      root: a,
      setTitle(t) {
        h.textContent = t || "";
      },
      set(rows, noteText) {
        body.textContent = "";
        (rows || []).forEach((r) => {
          const row = document.createElement("div");
          row.className = "ncd-lg-row" + (r.state === "new" ? " is-new" : r.state === "off" ? "" : " is-on") + (r.tone === "cost" ? " is-cost" : r.tone === "good" ? " is-good" : "");
          const k = document.createElement("span");
          k.className = "ncd-lg-k";
          k.textContent = r.k;
          const v = document.createElement("span");
          v.className = "ncd-lg-v";
          v.textContent = r.v;
          row.appendChild(k);
          row.appendChild(v);
          body.appendChild(row);
        });
        note.textContent = noteText || "";
      }
    };
  }

  // widgets/ncd-kvcache/logic.js
  var mountNcdKvcache = defineWidget({
    id: "ncd-kvcache",
    rootClass: "ncdk-root",
    exportName: "mountNcdKvcache",
    maxStep: 2,
    render({ host, data, labels, el }) {
      const MEM = data && data.memory || {};
      const heads = MEM.heads != null ? MEM.heads : 12;
      const nList = MEM.n || [512, 4096, 32768];
      const attnSize = [
        MEM.mb512x12 != null ? MEM.mb512x12 : 6.3,
        // fallbacks MIRROR data.memory.* — never a second source
        MEM.mb4kx12 != null ? MEM.mb4kx12 : 403,
        MEM.gb32kx12 != null ? MEM.gb32kx12 : 25.8
      ];
      const L = (k, fb) => labels && labels[k] || fb;
      const uMB = L("uMB", "MB"), uGB = L("uGB", "GB");
      const G = glyphs(el);
      const W = 880, H = 360;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdk-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "Autoregressive decoding with a KV cache as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle0", "prefill: the bill"));
      const Y_IN = 140, X_IN = 30, X_BUS = 130;
      const BX = 190, BW = 46, BH = 40, B_R = BX + BW / 2, SUB_DY = 32;
      const Y_Q = 40;
      const KY0 = 126, KY1 = 168, VY0 = 250, VY1 = 292;
      const XS = 340, WS = 120, XS_R = XS + WS, RH = 13;
      const KT = [94, 111, 128, 145], K_NEW = 162;
      const VT = [218, 235, 252, 269], V_NEW = 286;
      const RX = 326, RY = 66, RW = 174, RH_R = 246;
      const AX = 660, AY = 160, AW = 124, AH = 60;
      const A_L = AX - AW / 2, A_R = AX + AW / 2;
      const rc = (top) => top + RH / 2;
      const wire = (p, cls, x1, y1, x2, y2, opt) => G.wire(p, "ncdk-w " + cls, x1, y1, x2, y2, opt || {});
      const curve = (p, cls, d) => el("path", { class: "ncdk-w " + cls, d }, p);
      const arrowR = (p, cls, x, y) => el("path", { class: "ncdk-w " + cls, d: `M${x - 8},${y - 4} L${x},${y} L${x - 8},${y + 4}`, fill: "none" }, p);
      const arrowD = (p, cls, x, y) => el("path", { class: "ncdk-w " + cls, d: `M${x - 4},${y - 8} L${x},${y} L${x + 4},${y - 8}`, fill: "none" }, p);
      const rows = (p, tops, cls) => tops.forEach((t) => el("rect", { class: cls, x: XS, y: t, width: WS, height: RH, rx: 3 }, p));
      const tag = (p, cx, cy, s) => G.tagBox(p, cx, cy + 4, s, "ncdk-tag", "ncdk-tag-txt", 8, 5);
      const memRow = (i) => ({
        k: `n\xD7n \xB7 ${heads}h \xB7 n=${nList[i]}`,
        v: `${attnSize[i]} ${i === 2 ? uGB : uMB}`,
        state: "new",
        tone: i === 2 ? "cost" : void 0
      });
      function setLedger(step) {
        if (step === 0) {
          lg.setTitle(L("lgTitle0", "prefill: the bill"));
          lg.set([
            { k: L("lgTok", "new tokens this step"), v: "n", state: "new" },
            { k: L("lgComp", "K,V rows computed"), v: "n", state: "new" },
            { k: L("lgScores", "scores this step"), v: "n\xD7n", state: "new" },
            memRow(0),
            memRow(1),
            memRow(2)
          ], L("lgN0", "Prefill is the step that really does build the n\xD7n matrix \u2014 in fp16, across 12 heads, 25.8 GB of it at n=32768. And every K and V row it makes is KEPT."));
          return;
        }
        if (step === 1) {
          lg.setTitle(L("lgTitle1", "one decode step"));
          lg.set([
            { k: L("lgTok", "new tokens this step"), v: "1", state: "new" },
            { k: L("lgComp", "K,V rows computed"), v: "1", state: "new", tone: "good" },
            { k: L("lgRead", "K,V rows read"), v: "n", state: "new" },
            { k: L("lgScores", "scores this step"), v: "1\xD7(n+1)", state: "new", tone: "good" },
            { k: L("lgAxis", "sequence axis"), v: "n \u2192 n+1", state: "new" }
          ], L("lgN1", "One token in, one K row and one V row out \u2014 the other n rows are read, not recomputed. And the query is ONE row, so the scores are one row too: 1\xD7(n+1). No n\xD7n matrix is built here."));
          return;
        }
        lg.setTitle(L("lgTitle2", "the trade"));
        lg.set([
          { k: L("lgComp", "K,V rows computed"), v: "1", state: "on", tone: "good" },
          { k: L("lgRecomp", "no cache: rows/step"), v: "n+1", state: "new", tone: "cost" },
          { k: L("lgCache", "cache / layer / head"), v: "2\xB7n\xD7d", state: "new" },
          { k: L("lgScores", "scores this step"), v: "1\xD7(n+1)", state: "on", tone: "good" },
          { k: L("lgWork", "scores over n steps"), v: "n(n+1)/2", state: "new" }
        ], L("lgN2", "What the cache buys is compute; what it costs is memory. It holds K AND V \u2014 2\xB7n\xB7d per layer per head \u2014 and grows linearly with every token, forever: while you decode, THAT is the expensive axis. One step's scores are only 1\xD7(n+1); they go quadratic only summed over the whole generation \u2014 n(n+1)/2."));
      }
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const fresh = (k) => k > prev && k <= step ? "ncd-fx" : "";
        setLedger(step);
        if (step === 2) {
          const gc = el("g", { class: "ncd-fx" }, main);
          G.text(gc, W / 2, 28, L("cfHead", "one more token \u2014 with the cache, and without it"), "ncdk-head");
          const CB = 245, CB_L = CB - 28, CB_R = CB + 28;
          const CS = 315, CS_W = 120, CT = 470;
          el("rect", { class: "ncdk-chip-ok", x: 24, y: 86, width: 100, height: 28, rx: 7 }, gc);
          G.text(gc, 74, 104, L("cfWith", "with cache"), "ncdk-chip-txt");
          [68, 85, 102, 119].forEach((t) => el("rect", { class: "ncdk-row ncdk-row-dim", x: CS, y: t, width: CS_W, height: RH, rx: 3 }, gc));
          el("rect", { class: "ncdk-row-new", x: CS, y: 136, width: CS_W, height: RH, rx: 3 }, gc);
          G.chippedL(gc, CB, 142, "L_K,L_V", "ncdk-box", "ncdk-btxt-s", 56, 32);
          G.text(gc, CB, 170, "1\xD7d", "ncdk-sub");
          wire(gc, "ncdk-w-new ncdk-w-thin", CB_R, 142, CS - 4, rc(136));
          G.text(gc, CT, 96, L("cfA1", "1 new row of K and V computed"), "ncdk-good-txt", "start");
          G.text(gc, CT, 116, L("cfA2", "n rows read straight from the cache"), "ncdk-good-txt", "start");
          el("rect", { class: "ncdk-chip-bad", x: 24, y: 248, width: 100, height: 28, rx: 7 }, gc);
          G.text(gc, 74, 266, L("cfWithout", "no cache"), "ncdk-chip-txt");
          G.text(gc, CB, 214, "L_K,L_V \xD7 (n+1)", "ncdk-cost-lbl");
          [224, 241, 258, 275, 292].forEach((t) => {
            el("rect", { class: "ncdk-cost-box", x: CB_L, y: t, width: 56, height: RH, rx: 3 }, gc);
            el("rect", { class: "ncdk-row-cost", x: CS, y: t, width: CS_W, height: RH, rx: 3 }, gc);
            wire(gc, "ncdk-w-cost", CB_R, rc(t), CS - 4, rc(t));
          });
          G.text(gc, CT, 256, L("cfB1", "all n+1 rows of K and V recomputed"), "ncdk-bad-txt", "start");
          G.text(gc, CT, 276, L("cfB2", "the whole prefill, on every single token"), "ncdk-bad-txt", "start");
          G.text(gc, W / 2, 322, L("cfLine1", "the cache holds K and V \u2014 2\xB7n\xD7d per layer per head, growing every step: the EXPENSIVE axis"), "ncdk-punch-v");
          G.text(gc, W / 2, 342, L("cfLine2", "a step's scores are just 1\xD7(n+1) \u2014 kilobytes: the CHEAP axis (quadratic only summed over the run)"), "ncdk-punch-i");
          prev = step;
          return;
        }
        const dec = step === 1;
        const kBoxY = dec ? KY1 : KY0, vBoxY = dec ? VY1 : VY0;
        const shape = dec ? "(n+1)\xD7d" : "n\xD7d";
        const g0 = el("g", { class: fresh(0) }, main);
        G.text(
          g0,
          X_IN,
          124,
          dec ? L("lblIn1", "1 new token") : L("lblIn0", "prompt \xB7 n"),
          dec ? "ncdk-in ncdk-in-new" : "ncdk-in",
          "start"
        );
        G.text(g0, X_IN + 4, 160, dec ? "1\xD7d" : "n\xD7d", "ncdk-sub", "start");
        wire(g0, "ncdk-w-tok", X_IN, Y_IN, X_BUS, Y_IN);
        (dec ? [92] : [38, 56, 74, 92]).forEach((x) => el("rect", {
          class: (dec ? "ncdk-bead-new" : "ncdk-bead") + " ncd-onwire",
          x,
          y: Y_IN - 7,
          width: 14,
          height: 14,
          rx: 3
        }, g0));
        wire(g0, "ncdk-w-bus", X_BUS, Y_Q, X_BUS, vBoxY);
        [Y_Q, kBoxY, vBoxY].forEach((y) => {
          el("circle", { cx: X_BUS, cy: y, r: 3, fill: "var(--accent, #2A6FDB)" }, g0);
          wire(g0, "ncdk-w-bus ncdk-w-thin", X_BUS, y, BX - BW / 2, y);
        });
        G.chippedL(g0, BX, Y_Q, "L_Q", "ncdk-box", "ncdk-btxt", BW, BH);
        G.text(g0, BX, Y_Q + SUB_DY, dec ? "1\xD7d" : "n\xD7d", "ncdk-sub");
        wire(g0, dec ? "ncdk-w-new" : "ncdk-w-tok", B_R, Y_Q, AX - 20, Y_Q);
        wire(g0, dec ? "ncdk-w-new" : "ncdk-w-tok", AX - 20, Y_Q, AX - 20, AY - AH / 2);
        arrowD(g0, dec ? "ncdk-w-new" : "ncdk-w-tok", AX - 20, AY - AH / 2);
        const gCache = el("g", { class: fresh(0) }, main);
        G.region(gCache, RX, RY, RW, RH_R, L("tagCache", "KV cache"), "ncdk-region", "ncdk-tag", "ncdk-tag-txt");
        rows(gCache, KT, "ncdk-row" + (dec ? " ncdk-row-dim" : ""));
        rows(gCache, VT, "ncdk-row" + (dec ? " ncdk-row-dim" : ""));
        G.text(gCache, XS + WS / 2, 88, "K   " + shape, "ncdk-axis");
        G.text(gCache, XS + WS / 2, 212, "V   " + shape, "ncdk-axis");
        G.text(gCache, RX + RW / 2, 328, L("lblCacheTot", "K + V  \u2192  2\xB7n\xD7d / layer / head"), "ncdk-axis");
        const gK = el("g", { class: fresh(0) }, main);
        G.chippedL(gK, BX, kBoxY, "L_K", "ncdk-box", "ncdk-btxt", BW, BH);
        G.text(gK, BX, kBoxY + SUB_DY, dec ? "1\xD7d" : "n\xD7d", "ncdk-sub");
        G.chippedL(gK, BX, vBoxY, "L_V", "ncdk-box", "ncdk-btxt", BW, BH);
        G.text(gK, BX, vBoxY + SUB_DY, dec ? "1\xD7d" : "n\xD7d", "ncdk-sub");
        if (!dec) {
          KT.forEach((t) => wire(gK, "ncdk-w-tok ncdk-w-thin", B_R, KY0, XS - 4, rc(t)));
          VT.forEach((t) => wire(gK, "ncdk-w-tok ncdk-w-thin", B_R, VY0, XS - 4, rc(t)));
        } else {
          const gN = el("g", { class: fresh(1) }, main);
          el("rect", { class: "ncdk-row-new", x: XS, y: K_NEW, width: WS, height: RH, rx: 3 }, gN);
          el("rect", { class: "ncdk-row-new", x: XS, y: V_NEW, width: WS, height: RH, rx: 3 }, gN);
          wire(gN, "ncdk-w-new ncdk-w-thin", B_R, KY1, XS - 4, rc(K_NEW));
          wire(gN, "ncdk-w-new ncdk-w-thin", B_R, VY1, XS - 4, rc(V_NEW));
          G.text(gN, XS_R + 14, rc(K_NEW) + 4, "+1", "ncdk-plus1", "start");
          G.text(gN, XS_R + 14, rc(V_NEW) + 4, "+1", "ncdk-plus1", "start");
          G.text(gN, 276, 126, L("lblNoBox", "not recomputed"), "ncdk-nobox");
          G.text(gN, 276, 250, L("lblNoBox", "not recomputed"), "ncdk-nobox");
          tag(gN, 540, 116, L("tagRead", "read"));
          tag(gN, 540, 264, L("tagRead", "read"));
        }
        const gA = el("g", { class: fresh(0) }, main);
        curve(gA, "ncdk-w-read", `M${XS_R},${KY0} C520,${KY0} 545,138 ${A_L},150`);
        curve(gA, "ncdk-w-read", `M${XS_R},${VY0} C520,${VY0} 545,196 ${A_L},172`);
        arrowR(gA, "ncdk-w-read", A_L, 150);
        arrowR(gA, "ncdk-w-read", A_L, 172);
        G.box(
          gA,
          AX,
          AY,
          AW,
          AH,
          L("lblAttn", "attention"),
          dec ? L("subAttn1", "over n+1 keys") : L("subAttn0", "over n keys"),
          "ncdk-op",
          "ncdk-op-txt",
          "ncdk-sub"
        );
        G.text(
          gA,
          AX,
          AY + AH / 2 + 26,
          dec ? L("shpScores1", "scores  1\xD7(n+1)") : L("shpScores0", "scores  n\xD7n"),
          dec ? "ncdk-scores ncdk-scores-new" : "ncdk-scores"
        );
        wire(gA, "ncdk-w-out", AX + AW / 2, AY, 840, AY, { arrow: true });
        G.text(gA, 840, AY - 14, L("lblOut", "next token"), "ncdk-out-txt", "end");
        G.legend(main, W / 2, 352, L("legMap", "violet = cached K,V (read) \xB7 warm = computed this step \xB7 the n axis grows by 1"), "ncdk-legend", W - 40);
        prev = step;
      };
    }
  });
})();
