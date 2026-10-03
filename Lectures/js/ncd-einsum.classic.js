/* AUTO-GENERATED offline classic bundle of widgets/ncd-einsum/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-einsum/logic.js
  var mountNcdEinsum = defineWidget({
    id: "ncd-einsum",
    rootClass: "ncde-root",
    exportName: "mountNcdEinsum",
    maxStep: 3,
    render({ host, labels, el }) {
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const W = 820, H = 344;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncde-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "The same contraction written as a circuit, an einsum and a formula")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "the index"));
      const T = (p, x, y, s, cls, a) => G.text(p, x, y, s, cls, a || "middle");
      const R = (p, cls, x, y, w, h, rx) => el("rect", { class: cls, x, y, width: w, height: h, rx: rx || 6 }, p);
      function mono(p, x0, y, str, baseCls, hotCls, hot) {
        [...str].forEach((ch, i) => {
          const isHot = hot && hot.has(ch);
          if (isHot) R(p, "ncde-hot-bg", x0 + i * 10 - 5, y - 13, 10, 18, 3);
          T(p, x0 + i * 10, y, ch, isHot ? hotCls : baseCls);
        });
        return x0 + str.length * 10;
      }
      function paneLbl(p, x, y, s) {
        T(p, x, y, s, "ncde-pane-lbl", "start");
      }
      const STEPS = [
        { hot: /* @__PURE__ */ new Set(["d"]), ein: "einsum('nd,md->nm', Q, K)", f1: "S", f2: " = \u03A3", f3: "d", f4: "  Q", f5: "nd", f6: " \xB7 K", f7: "md" },
        { hot: /* @__PURE__ */ new Set(["n", "m"]), ein: "einsum('nd,md->nm', Q, K)", f1: "S", f2: " = \u03A3", f3: "d", f4: "  Q", f5: "nd", f6: " \xB7 K", f7: "md" },
        { hot: /* @__PURE__ */ new Set(["m"]), ein: "A = softmax(S, dim='m')", f1: "A", f2: " = softmax", f3: "m", f4: "(S)", f5: "", f6: "", f7: "" },
        { hot: /* @__PURE__ */ new Set(["m"]), ein: "einsum('nm,md->nd', A, V)", f1: "Y", f2: " = \u03A3", f3: "m", f4: "  A", f5: "nm", f6: " \xB7 V", f7: "md" }
      ];
      const LEDGERS = [
        {
          rows: [
            { k: L("lgIn", "inputs"), v: "nd , md" },
            { k: L("lgOut", "output"), v: "nm" },
            { k: L("lgSurvives", "repeated, survives"), v: "\u2014" },
            { k: L("lgDies", "repeated, vanishes"), v: "d", tone: "good" },
            { k: L("lgTherefore", "therefore"), v: "\u2323  " + L("lgCup", "a cup"), tone: "good" }
          ],
          note: L("lgN0", "Read the string, not the picture: d is on the LEFT of the arrow twice and on the RIGHT not at all. That is the entire definition of a contraction. The cup in the diagram and the \u03A3 in the formula are two more ways of writing exactly that.")
        },
        {
          rows: [
            { k: L("lgIn", "inputs"), v: "nd , md" },
            { k: L("lgOut", "output"), v: "nm" },
            { k: L("lgSurvives", "repeated, survives"), v: "\u2014" },
            { k: L("lgFree", "free, survives"), v: "n , m", tone: "good" },
            { k: L("lgShape", "so the shape is"), v: "n\xD7m" }
          ],
          note: L("lgN1", "The letters that DO appear on the right are the wires that leave the circuit \u2014 and, read in order, they are literally the output shape. n\xD7m. The subscript string is not a mnemonic for the shape; it is the shape.")
        },
        {
          rows: [
            { k: L("lgIn", "input"), v: "nm" },
            { k: L("lgOut", "output"), v: "nm" },
            { k: L("lgNormOver", "normalised across"), v: "m" },
            { k: L("lgContracted", "contracted"), v: L("lgNothing", "nothing") },
            { k: L("lgTherefore", "therefore"), v: L("lgNoCup", "no cup"), tone: "cost" }
          ],
          note: L("lgN2", "softmax is the odd one out: it works ACROSS m but does not consume it \u2014 nm goes in, nm comes out. No letter vanishes, so there is no cup. That is why the triangle is a different glyph: it re-weights an axis instead of eating it.")
        },
        {
          rows: [
            { k: L("lgIn", "inputs"), v: "nm , md" },
            { k: L("lgOut", "output"), v: "nd" },
            { k: L("lgDies", "repeated, vanishes"), v: "m", tone: "good" },
            { k: L("lgTherefore", "therefore"), v: "\u2323  " + L("lgCup", "a cup"), tone: "good" },
            { k: L("lgShape", "so the shape is"), v: "n\xD7d" }
          ],
          note: L("lgN3", "The second contraction, and the same rule: m is repeated on the left, missing on the right, so it dies at a cup. Attention is two contractions with a softmax wedged between them \u2014 and you can prove that from the subscript strings alone, without looking at a single picture.")
        }
      ];
      let main = null;
      return (step) => {
        if (main) main.remove();
        main = el("g", { class: "ncd-fx" }, svg);
        const g = main, s = Math.max(0, Math.min(3, step)), S = STEPS[s], hot = S.hot;
        const LG = LEDGERS[s];
        lg.set(LG.rows.map((r) => ({ ...r, state: "on" })), LG.note);
        const lit = (ch) => hot.has(ch) ? "ncde-idx-hot" : "ncde-idx";
        paneLbl(g, 20, 26, L("paneDiagram", "the circuit"));
        const yA = 62, yB = 116, yM = 89;
        if (s <= 1) {
          G.chippedL(g, 96, yA, "Q", "ncde-L", "ncde-L-txt", 40, 34);
          G.chippedL(g, 96, yB, "K", "ncde-L", "ncde-L-txt", 40, 34);
          G.wire(g, "ncde-w ncde-w-d", 118, yA, 268, yA);
          G.wire(g, "ncde-w ncde-w-d", 118, yB, 268, yB);
          T(g, 168, yA - 10, "n", lit("n"));
          T(g, 196, yA - 10, "d", lit("d"));
          T(g, 168, yB + 20, "m", lit("m"));
          T(g, 196, yB + 20, "d", lit("d"));
          el("path", { class: "ncde-w ncde-w-d", d: `M${268},${yA} Q${292},${yM} ${268},${yB}`, fill: "none" }, g);
          G.cup(g, 296, yM, hot.has("d") ? "ncde-op-hot" : "ncde-op", "ncde-op-dot");
          if (hot.has("d")) T(g, 296, yM + 44, L("cupEats", "the cup eats d"), "ncde-cup-lbl");
          G.wire(g, "ncde-w ncde-w-out", 312, yM, 396, yM, { arrow: true });
          R(g, "ncde-chip", 400, yM - 15, 76, 30, 6);
          T(g, 424, yM + 5, "S :", "ncde-chipv");
          T(g, 452, yM + 5, "n", lit("n"));
          T(g, 468, yM + 5, "m", lit("m"));
        } else if (s === 2) {
          R(g, "ncde-chip", 96, yM - 15, 76, 30, 6);
          T(g, 120, yM + 5, "S :", "ncde-chipv");
          T(g, 148, yM + 5, "n", lit("n"));
          T(g, 164, yM + 5, "m", lit("m"));
          G.wire(g, "ncde-w ncde-w-attn", 176, yM, 250, yM);
          G.tri(g, 274, yM, "ncde-sm", "ncde-sm-txt");
          T(g, 274, yM + 34, L("acrossM", "across m \u2014 not eaten"), "ncde-cup-lbl");
          G.wire(g, "ncde-w ncde-w-attn", 294, yM, 396, yM, { arrow: true });
          R(g, "ncde-chip", 400, yM - 15, 76, 30, 6);
          T(g, 424, yM + 5, "A :", "ncde-chipv");
          T(g, 452, yM + 5, "n", lit("n"));
          T(g, 468, yM + 5, "m", lit("m"));
        } else {
          R(g, "ncde-chip", 76, yA - 15, 76, 30, 6);
          T(g, 100, yA + 5, "A :", "ncde-chipv");
          T(g, 128, yA + 5, "n", lit("n"));
          T(g, 144, yA + 5, "m", lit("m"));
          R(g, "ncde-chip", 76, yB - 15, 76, 30, 6);
          T(g, 100, yB + 5, "V :", "ncde-chipv");
          T(g, 128, yB + 5, "m", lit("m"));
          T(g, 144, yB + 5, "d", lit("d"));
          G.wire(g, "ncde-w ncde-w-attn", 156, yA, 268, yA);
          G.wire(g, "ncde-w ncde-w-d", 156, yB, 268, yB);
          el("path", { class: "ncde-w ncde-w-d", d: `M${268},${yA} Q${292},${yM} ${268},${yB}`, fill: "none" }, g);
          G.cup(g, 296, yM, "ncde-op-hot", "ncde-op-dot");
          T(g, 296, yM + 44, L("cupEatsM", "the cup eats m"), "ncde-cup-lbl");
          G.wire(g, "ncde-w ncde-w-out", 312, yM, 396, yM, { arrow: true });
          R(g, "ncde-chip", 400, yM - 15, 76, 30, 6);
          T(g, 424, yM + 5, "Y :", "ncde-chipv");
          T(g, 452, yM + 5, "n", lit("n"));
          T(g, 468, yM + 5, "d", lit("d"));
        }
        paneLbl(g, 20, 182, L("paneEinsum", "the einsum"));
        R(g, "ncde-code", 20, 194, W - 40, 44, 8);
        mono(g, 40, 222, S.ein, "ncde-code-txt", "ncde-code-hot", hot);
        paneLbl(g, 20, 264, L("paneFormula", "the formula"));
        R(g, "ncde-formula", 20, 276, W - 40, 44, 8);
        let x = 44;
        x = mono(g, x, 304, S.f1, "ncde-f-txt", "ncde-f-hot", hot);
        x = mono(g, x, 304, S.f2, "ncde-f-txt", "ncde-f-hot", /* @__PURE__ */ new Set());
        x = mono(g, x, 304, S.f3, "ncde-f-txt", "ncde-f-hot", hot);
        x = mono(g, x, 304, S.f4, "ncde-f-txt", "ncde-f-hot", /* @__PURE__ */ new Set());
        x = mono(g, x, 304, S.f5, "ncde-f-txt", "ncde-f-hot", hot);
        x = mono(g, x, 304, S.f6, "ncde-f-txt", "ncde-f-hot", /* @__PURE__ */ new Set());
        x = mono(g, x, 304, S.f7, "ncde-f-txt", "ncde-f-hot", hot);
        T(g, W - 30, 304, L("same", "the same statement"), "ncde-same", "end");
      };
    }
  });
})();
