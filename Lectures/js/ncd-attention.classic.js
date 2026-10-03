/* AUTO-GENERATED offline classic bundle of widgets/ncd-attention/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function shapeTable(obj) {
    const t = Object.freeze({ ...obj });
    return new Proxy(t, {
      get(target, k) {
        if (typeof k === "symbol" || k in target) return target[k];
        throw new Error(`shapeTable: no axis named "${String(k)}" \u2014 declared: ${Object.keys(target).join(", ")}`);
      }
    });
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

  // widgets/ncd-attention/logic.js
  var SH = shapeTable({
    x: "n\xD7m",
    // the token wire: n tokens × the model width
    qkv: "n\xD7d",
    // Q, K, V after the learned projections (d = the head dim)
    scores: "n\xD7n",
    // BORN at the cup. This is the axis the whole memory bill is about.
    ctx: "n\xD7d"
    // the key axis dies at the second cup
  });
  var mountNcdAttention = defineWidget({
    id: "ncd-attention",
    rootClass: "ncda-root",
    exportName: "mountNcdAttention",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const A = data && data.attention || {};
      const SC = data && data.sqrtScale || {};
      const MEM = data && data.memory || {};
      const scores = A.scores || [1, 0, 3];
      const weights = A.weights || [0.114, 0.042, 0.844];
      const output = A.output || [0.958, 0.886];
      const values = A.values || [[1, 0], [0, 1], [1, 1]];
      const dk = A.dk != null ? A.dk : 4;
      const sqrtDk = A.sqrtDk != null ? A.sqrtDk : 2;
      const cfDot = SC.dot != null ? SC.dot : 6;
      const cfScaled = SC.scaledScore != null ? SC.scaledScore : 3;
      const cfHot = SC.unscaled || [2e-3, 2e-3, 0.995];
      const cfSoft = SC.scaled || [0.045, 0.045, 0.909];
      const heads = MEM.heads != null ? MEM.heads : 12;
      const nList = MEM.n || [512, 4096, 32768];
      const memList = [MEM.mb512x12, MEM.mb4kx12, MEM.gb32kx12];
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const F = G.fmt3;
      const W = 820, H = 292;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncda-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "Attention as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "axes & cost"));
      const line = (cls, x1, y1, x2, y2, p) => G.wire(p, "ncda-w " + cls, x1, y1, x2, y2);
      const path = (cls, d, p) => el("path", { class: "ncda-w " + cls, d }, p);
      const text = (x, y, s, cls, anchor, p) => G.text(p, x, y, s, cls, anchor || "middle");
      function chippedL(cx, cy, lab, p) {
        const w = 46, h = 40, c = 10, x = cx - w / 2, y = cy - h / 2;
        el("path", { class: "ncda-L", d: `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z` }, p);
        text(cx - 3, cy + 5, "L", "ncda-L-txt", "middle", p);
        text(cx + 9, cy + 8, lab, "ncda-size", "middle", p);
      }
      function cup(cx, cy, p) {
        el("path", { class: "ncda-op", d: `M${cx - 15},${cy - 13} Q${cx},${cy + 18} ${cx + 15},${cy - 13}` }, p);
        el("circle", { class: "ncda-op-dot", cx, cy: cy + 6, r: 2.6 }, p);
      }
      function tri(cx, cy, p) {
        el("path", { class: "ncda-sm", d: `M${cx - 18},${cy - 19} L${cx + 18},${cy} L${cx - 18},${cy + 19} Z` }, p);
        text(cx - 5, cy + 5, "\u03C3", "ncda-sm-txt", "middle", p);
      }
      function chips(centers, y, vals, chipCls, w, p, fmt2) {
        centers.forEach((cx, i) => {
          el("rect", { class: "ncda-chip " + chipCls, x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 5 }, p);
          text(cx, y + 4, (fmt2 || F)(vals[i]), "ncda-chipv", "middle", p);
        });
      }
      function weave(cls, dotCls, tagCls, tagTxtCls, x1, x2, y, bow, tag, p) {
        const mx = (x1 + x2) / 2;
        path(cls, `M${x1},${y} C${x1 + 30},${y - bow} ${mx - 60},${y - bow} ${mx},${y - bow} C${mx + 60},${y - bow} ${x2 - 30},${y - bow} ${x2},${y}`, p);
        el("circle", { cx: x1, cy: y, r: 3, class: dotCls }, p);
        G.tagBox(
          p,
          mx,
          y - bow + 3,
          tag,
          "ncda-tag-box " + tagCls + " ncd-onwire",
          "ncda-tag-txt " + tagTxtCls,
          8,
          4
        );
      }
      const rows = stack({ x: 62, y: 78, w: 46, h: 168 }, 3, { dir: "col", gap: 18 });
      const yQ = rows[0].y + rows[0].h / 2, yK = rows[1].y + rows[1].h / 2, yV = rows[2].y + rows[2].h / 2;
      const xTok = 20, xL = 85, xQK = 246, xScale = 296, yS = (yQ + yK) / 2;
      const scC = [346, 382, 418], xSM = 460, wtC = [514, 566, 618], xSig = 678, ctxC = [730, 782];
      const ySig = (yS + yV) / 2;
      const uMB = L("uMB", "MB"), uGB = L("uGB", "GB");
      const memRow = (i) => ({
        k: `n=${nList[i]}`,
        v: `${memList[i]}${i === 2 ? " " + uGB : " " + uMB}`,
        state: "new",
        tone: i === 2 ? "cost" : void 0
      });
      function setLedger(step) {
        const on = (upto) => step > upto ? "on" : step === upto ? "new" : "off";
        if (step === 4) {
          lg.set([
            { k: "q\xB7k", v: String(cfDot), state: "on" },
            { k: `\xF7\u221Ad\u2096 (=${sqrtDk})`, v: String(cfScaled), state: "on", tone: "good" },
            { k: L("lgNoScale", "no \xF7\u221Ad\u2096"), v: F(cfHot[2]), state: "new", tone: "cost" },
            { k: L("lgWithScale", "with \xF7\u221Ad\u2096"), v: F(cfSoft[2]), state: "new", tone: "good" }
          ], L("lgN4", "Without the scale, softmax saturates: 0.995 is all but one-hot, so the gradient dies."));
          return;
        }
        const rowsL = [
          { k: "x", v: SH.x, state: on(0) },
          { k: "Q, K, V", v: SH.qkv, state: on(0) },
          { k: "Q\xB7K\u1D40 \xF7\u221Ad\u2096", v: SH.scores, state: on(0), tone: "cost" },
          { k: "softmax", v: SH.scores, state: step >= 1 ? on(1) : "off" },
          { k: "ctx = A\xB7V", v: SH.ctx, state: step >= 2 ? on(2) : "off", tone: "good" }
        ];
        if (step >= 3) {
          rowsL.push({ k: `\xD7 h (=${heads})`, v: `h \xB7 ${SH.scores}`, state: "new" });
          for (let i = 0; i < 3; i++) rowsL.push(memRow(i));
        }
        const notes = [
          L("lgN0", "The cup contracts d \u2014 and in doing so BIRTHS an n\xD7n axis. That axis is the quadratic cost."),
          L("lgN1", "softmax does not change the shape: n\xD7n in, n\xD7n out."),
          L("lgN2", "The sum over keys contracts n\xD7n back down to n\xD7d. The big axis lived and died right here."),
          L("lgN3", "The weave multiplies that n\xD7n axis by h. This is the memory bill, not a metaphor.")
        ];
        lg.set(rowsL, notes[Math.min(step, 3)]);
      }
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const fresh = (k) => k > prev && k <= step ? "ncd-fx" : "";
        setLedger(step);
        if (step === 4) {
          const g = el("g", { class: "ncd-fx" }, main);
          const yT = 104, yB = 214, xDot = 66, xLbl = 174, sC = [252, 292, 332], xSg = 378, wC = [446, 512, 578], xVer = 704;
          text(W / 2, 34, L("cfHead", "the same dot product q\xB7k = " + cfDot + ", two fates"), "ncda-cf-head", "middle", g);
          el("rect", { class: "ncda-chip ncda-chip-sc", x: xDot - 26, y: 151 - 15, width: 52, height: 30, rx: 6 }, g);
          text(xDot, 151 + 5, String(cfDot), "ncda-chipv", "middle", g);
          path("ncda-w-d", `M${xDot + 26},${151} C${xDot + 60},${151} ${xLbl - 70},${yT} ${xLbl - 50},${yT}`, g);
          path("ncda-w-d", `M${xDot + 26},${151} C${xDot + 60},${151} ${xLbl - 70},${yB} ${xLbl - 50},${yB}`, g);
          [[yT, L("cfNo", "no \xF7\u221Ad\u2096"), cfDot, cfHot, "bad"], [yB, L("cfYes", "\xF7\u221Ad\u2096 = " + sqrtDk), cfScaled, cfSoft, "ok"]].forEach(([y, lab, sVal, wVals, kind]) => {
            const boxCls = kind === "bad" ? "ncda-cf-bad" : "ncda-cf-ok";
            el("rect", { class: "ncda-cf-lbl " + boxCls, x: xLbl - 50, y: y - 15, width: 100, height: 30, rx: 7 }, g);
            text(xLbl, y + 5, lab, "ncda-cf-lbl-txt", "middle", g);
            line("ncda-w-attn", xLbl + 50, y, sC[0] - 20, y, g);
            chips(sC, y, [0, 0, sVal], "ncda-chip-sc", 26, g);
            line("ncda-w-attn", sC[2] + 16, y, xSg - 20, y, g);
            tri(xSg, y, g);
            line("ncda-w-attn", xSg + 20, y, wC[0] - 28, y, g);
            chips(wC, y, wVals, kind === "bad" ? "ncda-chip-bad" : "ncda-chip-good", 54, g);
            el("rect", { class: "ncda-cf-ver " + boxCls, x: xVer - 96, y: y - 14, width: 192, height: 28, rx: 7 }, g);
            text(xVer, y + 5, kind === "bad" ? L("cfVerBad", "one-hot \u2192 gradient \u2248 0") : L("cfVerOk", "soft \u2192 gradient lives"), "ncda-cf-ver-txt", "middle", g);
          });
          text(
            W / 2,
            H - 6,
            L("legCf", "delete one box and the circuit still runs \u2014 it just stops learning"),
            "ncda-stage",
            "middle",
            main
          );
          prev = step;
          return;
        }
        if (step >= 2) {
          const gb = el("g", { class: fresh(2) }, main);
          el("rect", {
            class: "ncda-block",
            x: xQK - 40,
            y: yQ - 26,
            width: xSig + 26 - (xQK - 40),
            height: yV + 26 - (yQ - 26),
            rx: 12
          }, gb);
          text(xQK - 34, yQ - 30, L("blockCore", "one head"), "ncda-block-txt", "start", gb);
        }
        const gA = el("g", { class: fresh(0) }, main);
        text(xTok - 4, yQ - 34, L("lblIn", "tokens"), "ncda-axis ncda-axis-in", "start", gA);
        [["Q", yQ], ["K", yK], ["V", yV]].forEach(([nm, y]) => {
          line("ncda-w-in", xTok, y, xL - 25, y, gA);
          text(xTok, y - 8, "x", "ncda-axis ncda-axis-in", "start", gA);
          chippedL(xL, y, nm, gA);
          text(xL, y - 26, "L" + nm.toLowerCase(), "ncda-size", "middle", gA);
        });
        const gQK = el("g", { class: fresh(0) }, main);
        line("ncda-w-d", xL + 24, yQ, xQK - 18, yQ, gQK);
        line("ncda-w-d", xL + 24, yK, xQK - 18, yK, gQK);
        text((xL + xQK) / 2, yQ - 8, "q", "ncda-axis ncda-axis-d", "middle", gQK);
        text((xL + xQK) / 2 - 14, yK + 17, "k", "ncda-axis ncda-axis-d", "middle", gQK);
        text((xL + xQK) / 2 + 14, yK + 17, SH.qkv, "ncda-size", "middle", gQK);
        path("ncda-w-d", `M${xQK - 18},${yQ} Q${xQK - 1},${yS} ${xQK - 18},${yK}`, gQK);
        cup(xQK, yS, gQK);
        text(xQK, yS - 22, "Q\xB7K\u1D40", "ncda-size", "middle", gQK);
        line("ncda-w-attn", xQK + 15, yS, xScale - 23, yS, gQK);
        el("rect", { class: "ncda-scale", x: xScale - 23, y: yS - 20, width: 46, height: 40, rx: 6 }, gQK);
        text(xScale, yS - 2, "\xF7\u221Ad\u2096", "ncda-scale-txt", "middle", gQK);
        text(xScale, yS + 12, `\u221A${dk} = ${sqrtDk}`, "ncda-size", "middle", gQK);
        line("ncda-w-attn", xScale + 23, yS, scC[0] - 15, yS, gQK);
        chips(scC, yS, scores, "ncda-chip-sc", 26, gQK);
        text(scC[1], yS - 21, L("lblScores", "scores"), "ncda-axis ncda-axis-attn", "middle", gQK);
        text(scC[1], yS + 21, SH.scores, "ncda-size", "middle", gQK);
        if (step >= 1) {
          const gSM = el("g", { class: fresh(1) }, main);
          line("ncda-w-attn", scC[2] + 16, yS, xSM - 20, yS, gSM);
          tri(xSM, yS, gSM);
          text(xSM, yS + 34, L("lblSoftmax", "softmax over keys"), "ncda-size", "middle", gSM);
          line("ncda-w-attn", xSM + 20, yS, wtC[0] - 22, yS, gSM);
          chips(wtC, yS, weights, "ncda-chip-attn", 44, gSM);
          text(wtC[1], yS - 21, L("lblWeights", "attention"), "ncda-axis ncda-axis-attn", "middle", gSM);
          text(wtC[1], yS + 21, "\u03A3=1", "ncda-size", "middle", gSM);
          if (step === 1) {
            const ex = scores.map((s) => Math.exp(s));
            const sum = ex.reduce((a, b) => a + b, 0);
            const eC = [400, 482, 564], yE = 216;
            el("rect", { class: "ncda-work", x: 300, y: yE - 40, width: 420, height: 66, rx: 8 }, gSM);
            text(312, yE - 23, L("workHead", "inside the triangle:"), "ncda-work-head", "start", gSM);
            text(330, yE + 5, "exp", "ncda-size", "middle", gSM);
            chips(eC, yE, ex, "ncda-chip-attn", 66, gSM, (v) => v.toFixed(3));
            text(664, yE + 5, "\u03A3 = " + sum.toFixed(3), "ncda-work-sum", "middle", gSM);
            text(510, yE + 38, L("workDiv", "each \xF7 \u03A3 \u2192 the weights above"), "ncda-size", "middle", gSM);
          }
        }
        if (step >= 2) {
          const gD = el("g", { class: fresh(2) }, main);
          const vGx = 300, vCell = 30, vRowH = 20;
          line("ncda-w-d", xL + 24, yV, vGx - 8, yV, gD);
          text(220, yV - 14, "v   " + SH.qkv, "ncda-axis ncda-axis-d", "middle", gD);
          values.forEach((row, r) => row.forEach((v, c) => {
            const x = vGx + c * vCell, y = yV - vRowH + r * vRowH;
            el("rect", { class: "ncda-chip ncda-chip-v", x, y: y - 9, width: vCell - 3, height: vRowH - 3, rx: 3 }, gD);
            text(x + (vCell - 3) / 2, y + 4, String(v), "ncda-vcell", "middle", gD);
          }));
          line("ncda-w-d", vGx + 2 * vCell + 4, yV, xSig - 4, yV, gD);
          path("ncda-w-attn", `M${wtC[2] + 22},${yS} Q${xSig},${(yS + ySig) / 2} ${xSig - 2},${ySig}`, gD);
          path("ncda-w-d", `M${xSig - 4},${yV} Q${xSig + 4},${(ySig + yV) / 2} ${xSig - 2},${ySig + 12}`, gD);
          cup(xSig, ySig + 6, gD);
          text(xSig + 2, ySig - 16, L("sumKeys", "\u03A3 keys"), "ncda-size", "middle", gD);
          line("ncda-w-out", xSig + 15, ySig + 6, ctxC[0] - 23, ySig + 6, gD);
          chips(ctxC, ySig + 6, output, "ncda-chip-out", 44, gD);
          text((ctxC[0] + ctxC[1]) / 2, ySig - 16, L("lblOut", "context"), "ncda-axis ncda-axis-out", "middle", gD);
          text((ctxC[0] + ctxC[1]) / 2, ySig + 27, SH.ctx, "ncda-size", "middle", gD);
          line("ncda-w-out", ctxC[1] + 23, ySig + 6, W - 6, ySig + 6, gD);
        }
        if (step >= 3) {
          const gE = el("g", { class: fresh(3) }, main);
          weave(
            "ncda-w-h",
            "ncda-dot-h",
            "ncda-tag-h",
            "ncda-tag-txt-h",
            xL + 10,
            806,
            58,
            22,
            L("tagHead", "broadcast: h heads"),
            gE
          );
          weave(
            "ncda-w-b",
            "ncda-dot-b",
            "ncda-tag-b",
            "ncda-tag-txt-b",
            14,
            812,
            34,
            20,
            L("tagBatch", "broadcast: b batch"),
            gE
          );
        }
        text(
          W / 2,
          H - 6,
          L("legMap", "wire = axis \xB7 box = operation \xB7 woven wire = broadcast"),
          "ncda-stage",
          "middle",
          main
        );
        prev = step;
      };
    }
  });
})();
