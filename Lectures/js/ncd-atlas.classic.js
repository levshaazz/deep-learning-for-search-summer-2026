/* AUTO-GENERATED offline classic bundle of widgets/ncd-atlas/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-atlas/logic.js
  var mountNcdAtlas = defineWidget({
    id: "ncd-atlas",
    rootClass: "ncdat-root",
    exportName: "mountNcdAtlas",
    maxStep: 2,
    render({ host, labels, el }) {
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const W = 820, H = 300;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdat-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "An atlas of the whole pipeline as one neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "the shape, end to end"));
      const T = (p, x, y, s, cls, a) => G.text(p, x, y, s, cls, a || "middle");
      const R = (p, cls, x, y, w, h, rx) => el("rect", { class: cls, x, y, width: w, height: h, rx: rx || 6 }, p);
      const chip = (p, cx, cy, w, s, cls, txtCls) => {
        R(p, cls, cx - w / 2, cy - 15, w, 30, 7);
        T(p, cx, cy + 5, s, txtCls);
      };
      const yTop = 76, yBot = 224, yLink = 142;
      function setLedger(step) {
        const on = (k) => step > k ? "on" : step === k ? "new" : "off";
        const rows = [
          { k: L("rText", "text"), v: L("vTok", "n tokens"), state: on(0) },
          { k: L("rEmb", "after E"), v: "n\xD7m", state: on(0) },
          { k: L("rBlocks", "after \xD7L blocks"), v: "n\xD7m", state: on(0) },
          { k: L("rPool", "after pooling"), v: "m", state: on(0), tone: "good" }
        ];
        if (step >= 1) rows.push({ k: L("rIndex", "the index"), v: "N\xD7m", state: on(1) });
        if (step >= 2) {
          rows.push({ k: L("rRetrieve", "after retrieve"), v: "K", state: "new" });
          rows.push({ k: L("rRerank", "after rerank"), v: "k", state: "new" });
          rows.push({ k: L("rAnswer", "the answer"), v: "1", state: "new", tone: "good" });
        }
        const notes = [
          L("lgN0", "Pooling is where the axis n DIES: n tokens collapse into one vector of m. That single contraction is what turns a passage into a point you can index."),
          L("lgN1", "The index is not a second machine. It is the SAME encoder, run over N documents ahead of time. Search works for exactly one reason: the encoder can be applied offline."),
          L("lgN2", "Everything after the index is narrowing: N \u2192 K \u2192 k \u2192 one answer. Every arrow in that chain costs money \u2014 which is the whole reason the cascade exists.")
        ];
        lg.set(rows, notes[Math.min(step, 2)]);
      }
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const g = main;
        const fresh = (k) => k > prev && k <= step ? "ncd-fx" : "";
        setLedger(step);
        const gA = el("g", { class: fresh(0) }, g);
        T(gA, 20, yTop - 34, L("rowEnc", "encode \u2014 a passage becomes a point"), "ncdat-rowlbl", "start");
        chip(gA, 52, yTop, 68, L("cText", "text"), "ncdat-chip-in", "ncdat-chipv-in");
        G.wire(gA, "ncdat-w ncdat-w-in", 86, yTop, 118, yTop, { arrow: true });
        G.box(gA, 162, yTop, 76, 44, "E", "V\u2192\u211D\u1D50", "ncdat-box-emb", "ncdat-box-txt", "ncdat-sub");
        G.wire(gA, "ncdat-w ncdat-w-in", 200, yTop, 232, yTop, { arrow: true });
        G.box(gA, 274, yTop, 76, 44, "+ PE", "sin/cos", "ncdat-box-pe", "ncdat-box-txt", "ncdat-sub");
        G.wire(gA, "ncdat-w ncdat-w-in", 312, yTop, 344, yTop, { arrow: true });
        G.box(gA, 414, yTop, 124, 44, L("cBlocks", "\xD7 L blocks"), L("cAttn", "attention"), "ncdat-box-blk", "ncdat-box-txt", "ncdat-sub");
        G.wire(gA, "ncdat-w ncdat-w-in", 476, yTop, 508, yTop, { arrow: true });
        G.box(gA, 552, yTop, 76, 44, L("cPool", "pool"), "n \u2192 1", "ncdat-box-pool", "ncdat-box-txt", "ncdat-sub");
        G.wire(gA, "ncdat-w ncdat-w-out", 590, yTop, 622, yTop, { arrow: true });
        chip(gA, 682, yTop, 106, L("cVec", "vector  m"), "ncdat-chip-out", "ncdat-chipv-out");
        if (step >= 1) {
          const gB = el("g", { class: fresh(1) }, g);
          el("path", {
            class: "ncdat-w ncdat-w-off",
            fill: "none",
            d: `M${682},${yTop + 15} V${yLink} H${52} V${yBot - 16}`
          }, gB);
          el("path", {
            class: "ncdat-w ncdat-w-off",
            fill: "none",
            d: `M${46},${yBot - 24} L${52},${yBot - 14} L${58},${yBot - 24}`
          }, gB);
          G.tagBox(
            gB,
            400,
            yLink + 3,
            L("offline", "\xD7 N documents, offline \u2014 this IS the index"),
            "ncdat-offtag ncd-onwire",
            "ncdat-offtag-txt",
            10,
            6
          );
        }
        if (step >= 2) {
          const gC = el("g", { class: fresh(2) }, g);
          T(gC, W - 20, yBot - 52, L("rowSearch", "search \u2014 N narrows to one"), "ncdat-rowlbl", "end");
          chip(gC, 52, yBot, 84, "N\xD7m", "ncdat-chip-idx", "ncdat-chipv-idx");
          G.wire(gC, "ncdat-w ncdat-w-N", 94, yBot, 126, yBot, { arrow: true });
          G.box(gC, 178, yBot, 92, 44, L("cRetr", "retrieve"), "bi-enc", "ncdat-box-retr", "ncdat-box-txt", "ncdat-sub");
          G.wire(gC, "ncdat-w ncdat-w-N", 224, yBot, 256, yBot, { arrow: true });
          chip(gC, 288, yBot, 44, "K", "ncdat-chip-mid", "ncdat-chipv-mid");
          G.wire(gC, "ncdat-w ncdat-w-N", 310, yBot, 342, yBot, { arrow: true });
          G.box(gC, 394, yBot, 92, 44, L("cRerank", "rerank"), "cross-enc", "ncdat-box-rr", "ncdat-box-txt", "ncdat-sub");
          G.wire(gC, "ncdat-w ncdat-w-N", 440, yBot, 472, yBot, { arrow: true });
          chip(gC, 504, yBot, 44, "k", "ncdat-chip-mid", "ncdat-chipv-mid");
          G.wire(gC, "ncdat-w ncdat-w-N", 526, yBot, 558, yBot, { arrow: true });
          G.box(gC, 610, yBot, 92, 44, L("cGen", "generate"), "LLM", "ncdat-box-gen", "ncdat-box-txt", "ncdat-sub");
          G.wire(gC, "ncdat-w ncdat-w-out", 656, yBot, 688, yBot, { arrow: true });
          chip(gC, 748, yBot, 76, L("cAns", "answer"), "ncdat-chip-out", "ncdat-chipv-out");
          el("path", { class: "ncdat-w ncdat-w-q", fill: "none", d: `M${178},${yBot - 46} V${yBot - 22}` }, gC);
          el("path", {
            class: "ncdat-w ncdat-w-q",
            fill: "none",
            d: `M${172},${yBot - 30} L${178},${yBot - 20} L${184},${yBot - 30}`
          }, gC);
          G.tagBox(
            gC,
            178,
            yBot - 54,
            L("queryHere", "the query \u2014 same E, online"),
            "ncdat-qtag",
            "ncdat-qtag-txt",
            10,
            6
          );
        }
        T(
          g,
          W / 2,
          H - 8,
          L("legMap", "pooling kills n \xB7 the index is the encoder run offline \xB7 everything after it narrows"),
          "ncdat-legend"
        );
        prev = step;
      };
    }
  });
})();
