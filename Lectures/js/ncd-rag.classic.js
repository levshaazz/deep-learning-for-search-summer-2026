/* AUTO-GENERATED offline classic bundle of widgets/ncd-rag/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-rag/logic.js
  var mountNcdRag = defineWidget({
    id: "ncd-rag",
    rootClass: "ncdrag-root",
    exportName: "mountNcdRag",
    maxStep: 2,
    render({ host, labels, el }) {
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const W = 820, H = 288, yM = 150;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdrag-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "The RAG loop as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "the funnel"));
      const RGN = { x: 16, y: 70, w: 140, h: 176 };
      const DOCS = [{ y: 92, k: "d1" }, { y: 126, k: "d2" }, { y: 160, k: "d3" }, { y: 216, k: "dN" }];
      const xDoc = 60, xBus = 166;
      const xQ = 250, yQ = 40;
      const xRet = 250, xHexK = 372, xRr = 504, xHexk = 624, xGen = 736;
      const kAxis = L("lgAxis", "broadcast axis"), kKept = L("lgKept", "docs kept"), kWork = L("lgWork", "work / query"), kOrder = L("lgOrder", "ordering"), kCtx = L("lgCtx", "what the LLM sees"), kOut = L("lgOut", "answers");
      const LEDGER = [
        {
          rows: [
            { k: kAxis, v: "N", state: "new" },
            { k: kKept, v: "K \u226A N", state: "new", tone: "good" },
            { k: kWork, v: L("lgWorkBi", "N \xD7 one dot"), state: "new" },
            { k: kOrder, v: L("lgOrderRough", "roughly right"), state: "new", tone: "cost" }
          ],
          note: L("lgN0", "The corpus is not a box the arrow comes out of \u2014 it is the AXIS the query is broadcast over, so it is drawn as a region ENCLOSING the N document wires. The first hexagon is the slice that ends it: N \u2192 K.")
        },
        {
          rows: [
            { k: kAxis, v: "N", state: "on" },
            { k: kKept, v: "k \u226A K", state: "new", tone: "good" },
            { k: kWork, v: L("lgWorkCross", "+ K \xD7 a full BERT"), state: "new", tone: "cost" },
            { k: kOrder, v: L("lgOrderSharp", "sharp"), state: "new", tone: "good" }
          ],
          note: L("lgN1", "A second hexagon, a second slice: K \u2192 k. You can afford the expensive reader only because the first slice already threw away everything but K \u2014 the cascade is two hexagons, and nothing else.")
        },
        {
          rows: [
            { k: kAxis, v: "N", state: "on" },
            { k: kKept, v: "k", state: "on", tone: "good" },
            { k: kCtx, v: L("lgCtxV", "k docs + the query"), state: "new" },
            { k: kOut, v: "1", state: "new", tone: "good" }
          ],
          note: L("lgN2", "The query enters TWICE \u2014 that dashed arc is the whole of RAG. The model is not asked what it knows; it is asked what these k documents say, and the same query that fetched them is what it is asked about.")
        }
      ];
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const s = Math.max(0, Math.min(2, step));
        const fresh = (k) => k > prev && k <= s ? "ncd-fx" : "";
        const LG = LEDGER[s];
        lg.set(LG.rows, LG.note);
        const gC = el("g", { class: fresh(0) }, main);
        el("rect", { class: "ncdrag-region", x: RGN.x, y: RGN.y, width: RGN.w, height: RGN.h, rx: 14 }, gC);
        G.tagBox(
          gC,
          RGN.x + 19,
          RGN.y - 12,
          L("tagCorpus", "N \xB7 the corpus"),
          "ncdrag-rtag",
          "ncdrag-rtag-txt",
          9,
          5,
          "start"
        ).setAttribute("rx", 6);
        DOCS.forEach((d) => {
          G.pentagon(gC, xDoc, d.y, d.k, "ncdrag-doc", "ncdrag-doc-txt");
          G.wire(gC, "ncdrag-w ncdrag-w-N", xDoc + 17, d.y, xBus, d.y);
        });
        G.text(gC, xDoc, 192, "\u22EE", "ncdrag-dots");
        G.wire(gC, "ncdrag-w ncdrag-w-N", xBus, DOCS[0].y, xBus, DOCS[3].y);
        G.wire(gC, "ncdrag-w ncdrag-w-N", xBus, yM, xRet - 68, yM, { arrow: true });
        const gQ = el("g", { class: fresh(0) }, main);
        el("rect", { class: "ncdrag-q", x: xQ - 50, y: yQ - 15, width: 100, height: 30, rx: 8 }, gQ);
        G.text(gQ, xQ, yQ + 5, L("lblQuery", "query"), "ncdrag-q-txt");
        G.wire(gQ, "ncdrag-w ncdrag-w-q", xQ, yQ + 15, xQ, yM - 22, { arrow: false });
        el("path", {
          class: "ncdrag-w ncdrag-w-q",
          fill: "none",
          style: "stroke-linejoin:round",
          d: `M${xQ - 4},${yM - 30} L${xQ},${yM - 22} L${xQ + 4},${yM - 30}`
        }, gQ);
        const gR = el("g", { class: fresh(0) }, main);
        G.box(
          gR,
          xRet,
          yM,
          136,
          44,
          L("lblRetrieve", "retrieve"),
          L("lblRetrieveSub", "bi-encoder"),
          "ncdrag-retrieve",
          "ncdrag-retrieve-txt",
          "ncdrag-sub"
        );
        G.wire(gR, "ncdrag-w ncdrag-w-flow", xRet + 68, yM, xHexK - 36, yM, { arrow: true });
        G.hexagon(gR, xHexK, yM, L("lblTopK", "top-K"), "ncdrag-hex", "ncdrag-hex-txt", 32, 20);
        G.text(gR, xHexK, 186, "N \u2192 K", "ncdrag-axis");
        G.wire(gR, "ncdrag-w ncdrag-w-flow", xHexK + 32, yM, xRr - 66, yM, { arrow: true });
        G.text(gR, 421, 138, "K", "ncdrag-axis");
        if (s >= 1) {
          const gRr = el("g", { class: fresh(1) }, main);
          G.box(
            gRr,
            xRr,
            yM,
            124,
            44,
            L("lblRerank", "rerank"),
            L("lblRerankSub", "cross-encoder"),
            "ncdrag-rerank",
            "ncdrag-rerank-txt",
            "ncdrag-sub"
          );
          G.wire(gRr, "ncdrag-w ncdrag-w-flow", xRr + 62, yM, xHexk - 34, yM, { arrow: true });
          G.hexagon(gRr, xHexk, yM, L("lblTopk", "top-k"), "ncdrag-hex", "ncdrag-hex-txt", 30, 19);
          G.text(gRr, xHexk, 186, "K \u2192 k", "ncdrag-axis");
        }
        if (s >= 2) {
          const gG = el("g", { class: fresh(2) }, main);
          G.wire(gG, "ncdrag-w ncdrag-w-flow", xHexk + 30, yM, xGen - 50, yM, { arrow: true });
          G.text(gG, 670, 138, "k", "ncdrag-axis");
          el("path", {
            class: "ncdrag-w ncdrag-w-qarc",
            fill: "none",
            d: `M${xQ + 50},${yQ} C${xQ + 180},${yQ - 26} ${xGen - 90},${yQ - 26} ${xGen},${yM - 30}`
          }, gG);
          el("circle", { cx: xQ + 50, cy: yQ, r: 3, class: "ncdrag-qdot" }, gG);
          el("path", {
            class: "ncdrag-w ncdrag-w-qarc",
            fill: "none",
            style: "stroke-linejoin:round",
            d: `M${xGen - 4},${yM - 30} L${xGen},${yM - 22} L${xGen + 4},${yM - 30}`
          }, gG);
          G.box(
            gG,
            xGen,
            yM,
            96,
            44,
            L("lblGenerate", "generate"),
            L("lblGenerateSub", "LLM"),
            "ncdrag-generate",
            "ncdrag-generate-txt",
            "ncdrag-sub"
          );
          G.wire(gG, "ncdrag-w ncdrag-w-out", xGen, yM + 22, xGen, yM + 54);
          el("path", {
            class: "ncdrag-w ncdrag-w-out",
            fill: "none",
            style: "stroke-linejoin:round",
            d: `M${xGen - 4},${yM + 46} L${xGen},${yM + 54} L${xGen + 4},${yM + 46}`
          }, gG);
          el("rect", { class: "ncdrag-answer", x: xGen - 46, y: yM + 58, width: 92, height: 30, rx: 8 }, gG);
          G.text(gG, xGen, yM + 78, L("lblAnswer", "answer"), "ncdrag-answer-txt");
        }
        G.legend(main, W / 2, H - 6, L(
          "legMap",
          "region = the corpus axis N \xB7 hexagon = a slice (top-k) \xB7 the query enters TWICE"
        ), "ncdrag-legend", W - 40);
        prev = s;
      };
    }
  });
})();
