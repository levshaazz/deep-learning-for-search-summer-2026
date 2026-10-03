/* AUTO-GENERATED offline classic bundle of widgets/ncd-causal/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-causal/logic.js
  var mountNcdCausal = defineWidget({
    id: "ncd-causal",
    rootClass: "ncdc-root",
    exportName: "mountNcdCausal",
    maxStep: 2,
    render({ host, data, labels, el }) {
      const C = data && data.causal || {};
      const MEM = data && data.memory || {};
      const scores = C.scores || [0, 2, 3];
      const noMask = C.noMask || [0.035, 0.259, 0.705];
      const masked = C.masked || [0.119, 0.881];
      const heads = MEM.heads != null ? MEM.heads : 12;
      const nList = MEM.n || [512, 4096, 32768];
      const memList = [MEM.mb512x12, MEM.mb4kx12, MEM.gb32kx12];
      const L = (k, fb) => labels && labels[k] || fb;
      const T = (k, fb, v) => String(L(k, fb)).replace("{v}", v);
      const G = glyphs(el);
      const F = G.fmt3;
      const W = 820, H = 260;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdc-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "The causal mask as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "the leak & the bill"));
      const yQ = 98, yK = 158, yS = 128;
      const xTok = 22, xQK = 118;
      const scC = [176, 212, 248], xMask = 316, infC = [396, 438, 482];
      const xSM = 546, wtC = [618, 682, 746];
      const KEY = ["t\u2081", "t\u2082", "t\u2083"];
      const wire = (p, cls, x1, y1, x2, y2) => G.wire(p, "ncdc-w " + cls, x1, y1, x2, y2);
      const txt = (p, x, y, s, cls, anchor) => G.text(p, x, y, s, cls, anchor || "middle");
      function chip(p, cx, y, w, val, boxCls, txtCls) {
        el("rect", { class: "ncdc-chip " + boxCls, x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 5 }, p);
        txt(p, cx, y + 4, val, "ncdc-chipv " + (txtCls || ""));
      }
      function badge(p, cx, cy, s, boxCls, txtCls) {
        const gg = el("g", {}, p);
        const r = G.tagBox(gg, cx, cy + 4, s, "ncdc-badge " + boxCls, txtCls, 11, 8);
        r.setAttribute("rx", 7);
        const x = +r.getAttribute("x"), w = +r.getAttribute("width");
        const dx = Math.min(0, W - 10 - (x + w));
        if (dx) {
          r.setAttribute("x", x + dx);
          const t = gg.querySelector("text");
          t.setAttribute("x", +t.getAttribute("x") + dx);
        }
      }
      const uMB = L("uMB", "MB"), uGB = L("uGB", "GB");
      function setLedger(step) {
        if (step === 2) {
          const rows2 = [
            { k: L("lgLeak", "w(t\u2083) with no mask"), v: F(noMask[2]), state: "on", tone: "cost" },
            { k: L("lgFixed", "w(t\u2083) with the mask"), v: "0", state: "on", tone: "good" },
            { k: L("lgKept", "kept (j \u2264 i)"), v: L("lgHalf", "\u2248 half"), state: "new" },
            { k: L("lgPaid", "allocated"), v: "n \xD7 n", state: "new" }
          ];
          for (let i = 0; i < 3; i++) {
            rows2.push({ k: `n=${nList[i]} \xB7 h=${heads}`, v: `${memList[i]} ${i === 2 ? uGB : uMB}`, state: "new" });
          }
          lg.set(rows2, L("lgN2", "The mask throws away half the matrix \u2014 and the allocation keeps all of it. O(n\xB2) is paid in full."));
          return;
        }
        const rows = [
          { k: L("lgScores", "scores q\xB7k\u2C7C"), v: scores.join(", "), state: step === 0 ? "new" : "on" }
        ];
        if (step === 0) {
          rows.push({ k: "w(t\u2081)", v: F(noMask[0]), state: "new" });
          rows.push({ k: "w(t\u2082)", v: F(noMask[1]), state: "new" });
          rows.push({ k: `w(t\u2083) \u2014 ${L("lgFuture", "the future")}`, v: F(noMask[2]), state: "new", tone: "cost" });
          lg.set(rows, T("lgN0", "No hexagon, no mask: {v} of the attention lands on t\u2083 \u2014 the token the model is supposed to be predicting. It is reading the answer.", F(noMask[2])));
          return;
        }
        rows.push({ k: L("lgMask", "mask: j \u2264 i"), v: L("lgHex", "hexagon"), state: "new" });
        rows.push({ k: `w(t\u2083) \u2014 ${L("lgForbidden", "forbidden")}`, v: "0", state: "new", tone: "good" });
        rows.push({ k: "w(t\u2081)", v: F(masked[0]), state: "new", tone: "good" });
        rows.push({ k: "w(t\u2082)", v: F(masked[1]), state: "new", tone: "good" });
        lg.set(rows, L("lgN1", "The disallowed score goes to \u2212\u221E, so exp(\u2212\u221E) = 0: the future gets exactly zero weight and softmax renormalises over the past."));
      }
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const fresh = (k) => k > prev && k <= step ? "ncd-fx" : "";
        setLedger(step);
        if (step === 2) {
          const g = el("g", { class: "ncd-fx" }, main);
          txt(g, W / 2, 22, L("hd2", "the same mask, seen as the whole n\xD7n matrix"), "ncdc-head");
          const x0 = 150, y0 = 56, cs = 46;
          txt(g, x0 + 1.5 * cs, 32, L("gridKeys", "keys  j \u2192"), "ncdc-tag");
          txt(g, x0 - 12, y0 - 10, L("gridQueries", "queries i"), "ncdc-tag", "end");
          KEY.forEach((k, j) => txt(g, x0 + j * cs + cs / 2, y0 - 10, k, "ncdc-key"));
          for (let i = 0; i < 3; i++) {
            txt(g, x0 - 12, y0 + i * cs + cs / 2 + 5, KEY[i], "ncdc-key", "end");
            for (let j = 0; j < 3; j++) {
              const cx = x0 + j * cs + cs / 2, cy = y0 + i * cs + cs / 2;
              const allowed = j <= i;
              const isLeak = i === 1 && j === 2;
              const cls = allowed ? "ncdc-cell-ok" : isLeak ? "ncdc-cell-leak" : "ncdc-cell-no";
              el("rect", { class: cls, x: x0 + j * cs, y: y0 + i * cs, width: cs, height: cs }, g);
              const v = allowed ? i === 1 ? String(scores[j]) : "\xB7" : "\u2212\u221E";
              const vc = allowed ? i === 1 ? "ncdc-cell-txt" : "ncdc-cell-dot" : "ncdc-cell-txt-no";
              txt(g, cx, cy + 5, v, vc);
            }
          }
          el("rect", { class: "ncdc-rowhi", x: x0 - 4, y: y0 + cs - 4, width: 3 * cs + 8, height: cs + 8, rx: 6 }, g);
          txt(g, x0 + 1.5 * cs, y0 + 3 * cs + 20, L("gridRow", "row t\u2082 \u2014 the row we just computed"), "ncdc-lbl");
          txt(
            g,
            x0 + 1.5 * cs,
            y0 + 3 * cs + 38,
            T("gridLeak", "the red cell is where {v} of the attention went", F(noMask[2])),
            "ncdc-red-txt"
          );
          const xP = 396, chipX = 700;
          txt(g, xP, y0, T("memHead", "memory for the FULL n\xD7n (h={v})", heads), "ncdc-head", "start");
          [92, 126, 160].forEach((y, i) => {
            txt(g, xP + 4, y + 4, `n = ${nList[i]}`, "ncdc-lbl", "start");
            chip(g, chipX, y, 104, `${memList[i]} ${i === 2 ? uGB : uMB}`, "ncdc-mem-chip", "ncdc-mem-txt");
          });
          txt(g, xP, 194, L("memKept", "used: j \u2264 i \u2014 about half of it"), "ncdc-good-txt", "start");
          txt(g, xP, 216, L("memPaid", "allocated: every cell, all n\xB2"), "ncdc-vio-txt", "start");
          txt(g, W / 2, H - 6, L("legGrid", "the mask changes what softmax SEES \u2014 not what memory ALLOCATES"), "ncdc-legend");
          prev = step;
          return;
        }
        const masked1 = step >= 1;
        const gA = el("g", { class: fresh(0) }, main);
        txt(gA, xTok, yQ - 12, L("lblQ", "q  at t\u2082"), "ncdc-axis", "start");
        wire(gA, "ncdc-w-in", xTok, yQ, xQK - 18, yQ);
        wire(gA, "ncdc-w-in", xTok, yK, xQK - 18, yK);
        txt(gA, xTok, yK + 22, L("lblK", "K  t\u2081 t\u2082 t\u2083"), "ncdc-axis", "start");
        el("path", { class: "ncdc-w ncdc-w-in", d: `M${xQK - 18},${yQ} Q${xQK - 1},${yS} ${xQK - 18},${yK}` }, gA);
        G.cup(gA, xQK, yS, "ncdc-op", "ncdc-op-dot");
        txt(gA, xQK, yS - 24, "q\xB7K\u1D40", "ncdc-size");
        wire(gA, "ncdc-w-attn", xQK + 15, yS, scC[0] - 20, yS);
        scC.forEach((cx, j) => {
          chip(gA, cx, yS, 30, String(scores[j]), "ncdc-chip-sc");
          const hot = !masked1 && j === 2;
          txt(gA, cx, yS - 20, KEY[j], "ncdc-key" + (hot ? " ncdc-key-leak" : masked1 && j === 2 ? " ncdc-key-off" : ""));
        });
        if (!masked1) txt(gA, scC[2], yS - 38, L("lblFuture", "the future"), "ncdc-red-txt");
        if (!masked1) {
          const gG = el("g", { class: fresh(0) }, main);
          wire(gG, "ncdc-w-attn", scC[2] + 15, yS, xSM - 18, yS);
          G.hexagon(gG, xMask, yS, "", "ncdc-hex-ghost", "", 26, 20);
          txt(gG, xMask, yS + 36, L("noMaskTag", "no mask \u2014 nothing is removed"), "ncdc-lbl");
        } else {
          const gM = el("g", { class: fresh(1) }, main);
          wire(gM, "ncdc-w-attn", scC[2] + 15, yS, xMask - 26, yS);
          G.hexagon(gM, xMask, yS, L("lblMask", "mask"), "ncdc-hex", "ncdc-hex-txt", 26, 20);
          txt(gM, xMask, yS - 32, L("maskCond", "keep j \u2264 i"), "ncdc-lbl");
          wire(gM, "ncdc-w-attn", xMask + 26, yS, infC[0] - 22, yS);
          infC.forEach((cx, j) => {
            const off = j === 2;
            chip(
              gM,
              cx,
              yS,
              38,
              off ? "\u2212\u221E" : String(scores[j]),
              off ? "ncdc-chip-inf" : "ncdc-chip-sc",
              off ? "ncdc-chipv-off" : ""
            );
          });
          txt(gM, infC[1], yS - 20, L("lblMasked", "masked scores"), "ncdc-lbl");
          wire(gM, "ncdc-w-attn", infC[2] + 19, yS, xSM - 18, yS);
        }
        const gC = el("g", { class: fresh(masked1 ? 1 : 0) }, main);
        G.tri(gC, xSM, yS, "ncdc-sm", "ncdc-sm-txt");
        txt(gC, xSM, yS + 32, L("lblSoftmax", "softmax"), "ncdc-size");
        wire(gC, "ncdc-w-attn", xSM + 18, yS, wtC[0] - 28, yS);
        wtC.forEach((cx, j) => {
          let val, boxCls, txtCls;
          if (!masked1) {
            val = F(noMask[j]);
            boxCls = j === 2 ? "ncdc-chip-leak" : "ncdc-chip-w";
            txtCls = j === 2 ? "ncdc-chipv-leak" : "";
          } else if (j === 2) {
            val = "0";
            boxCls = "ncdc-chip-off";
            txtCls = "ncdc-chipv-off";
          } else {
            val = F(masked[j]);
            boxCls = "ncdc-chip-good";
            txtCls = "ncdc-chipv-good";
          }
          chip(gC, cx, yS, 56, val, boxCls, txtCls);
          txt(
            gC,
            cx,
            yS + 22,
            KEY[j],
            "ncdc-key" + (!masked1 && j === 2 ? " ncdc-key-leak" : masked1 && j === 2 ? " ncdc-key-off" : "")
          );
        });
        txt(gC, wtC[1], yS - 20, L("lblWeights", "attention weights"), "ncdc-lbl");
        txt(main, W / 2, 22, masked1 ? L("hd1", "insert the hexagon \u2014 the future goes to \u2212\u221E") : L("hd0", "no mask \u2014 the query can see the answer"), "ncdc-head");
        if (!masked1) {
          badge(
            gC,
            660,
            yS + 52,
            T("leakTag", "{v} of the attention lands on the FUTURE token t\u2083", F(noMask[2])),
            "ncdc-badge-bad",
            "ncdc-badge-txt"
          );
        } else {
          badge(
            gC,
            660,
            yS + 52,
            L("okTag", "the future gets 0 \u2014 the model can only look back"),
            "ncdc-badge-ok",
            "ncdc-badge-txt"
          );
        }
        txt(main, W / 2, H - 6, L("legMap", "wire = axis \xB7 hexagon = reindex/mask \xB7 triangle = softmax"), "ncdc-legend");
        prev = step;
      };
    }
  });
})();
