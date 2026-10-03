/* AUTO-GENERATED offline classic bundle of widgets/chunk-size-law/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/chunk-size-law/logic.js
  var W = 900;
  var DOC = { x: 30, y: 104, w: 408, h: 32 };
  var TOKPX = 1.5;
  var REF_TOK = 100;
  var PLOT = { x: 520, y: 78, w: 350, h: 208 };
  var mountChunkSizeLaw = defineWidget({
    id: "chunk-size-law",
    rootClass: "csl-root",
    exportName: "mountChunkSizeLaw",
    maxStep: 6,
    render({ host, data, labels, el }) {
      const G = data && data.gapLaw || {};
      const g = typeof G.gapTokens === "number" ? G.gapTokens : 40;
      const sizes = G.sizes || [32, 64, 128, 256, 512];
      const frac = G.orphanFraction || sizes.map((s) => Math.min(1, g / s));
      const anch = G.anchors || { sentence: 1.9, fixed256: 1.8, semantic: 1.4 };
      const dec = () => {
        const l = (typeof document !== "undefined" && document.documentElement && (document.documentElement.dataset.lang || document.documentElement.lang || "en")).slice(0, 2);
        return l === "ru" || l === "tt" ? "," : ".";
      };
      const pct = (x) => (Math.round(x * 1e3) / 10).toFixed(1).replace(".", dec()) + " %";
      const sig = (x) => (x > 0 ? "+" : "\u2212") + Math.abs(x).toFixed(1).replace(".", dec());
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg csl-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      layer("doc", 0);
      add("doc", el("text", { x: DOC.x, y: 26, class: "csl-head" }, svg)).textContent = labels.docHead || "a 272-token window of the document";
      add("doc", el("rect", { x: DOC.x, y: DOC.y, width: DOC.w, height: DOC.h, rx: 4, class: "csl-doc" }, svg));
      const refX = DOC.x + REF_TOK * TOKPX, menX = DOC.x + (REF_TOK + g) * TOKPX;
      add("doc", el("circle", { cx: refX, cy: DOC.y + DOC.h / 2, r: 6, class: "csl-ref" }, svg));
      add("doc", el("circle", { cx: menX, cy: DOC.y + DOC.h / 2, r: 6, class: "csl-men" }, svg));
      add("doc", el("line", { x1: refX, y1: DOC.y - 12, x2: menX, y2: DOC.y - 12, class: "csl-gapline" }, svg));
      add("doc", el("text", { x: (refX + menX) / 2, y: DOC.y - 18, class: "csl-gaplbl", "text-anchor": "middle" }, svg)).textContent = "g = " + g;
      add("doc", el("text", { x: refX - 6, y: DOC.y + DOC.h + 18, class: "csl-ptlbl is-ref", "text-anchor": "end" }, svg)).textContent = labels.refTag || "Berlin";
      add("doc", el("text", { x: menX + 6, y: DOC.y + DOC.h + 18, class: "csl-ptlbl is-men", "text-anchor": "start" }, svg)).textContent = labels.menTag || "\xABIts \u2026\xBB";
      const gridG = el("g", { class: "csl-grid" }, svg);
      const verdict = el("text", { x: DOC.x, y: DOC.y + DOC.h + 58, class: "csl-verdict" }, svg);
      const readout = el("text", { x: DOC.x, y: DOC.y + DOC.h + 84, class: "csl-readout" }, svg);
      layer("plot", 0);
      const N = sizes.length + 1;
      const cx = (i) => PLOT.x + (i + 0.5) * (PLOT.w / N);
      const cy = (v) => PLOT.y + PLOT.h - v * PLOT.h;
      add("plot", el("text", { x: PLOT.x, y: 26, class: "csl-head" }, svg)).textContent = labels.plotHead || "orphaned fraction = min(1, g/s)";
      add("plot", el("rect", { x: PLOT.x, y: PLOT.y, width: PLOT.w, height: PLOT.h, rx: 5, class: "csl-plotbg" }, svg));
      add("plot", el("line", { x1: PLOT.x, y1: PLOT.y + PLOT.h, x2: PLOT.x + PLOT.w, y2: PLOT.y + PLOT.h, class: "csl-axis" }, svg));
      add("plot", el("line", { x1: PLOT.x, y1: PLOT.y, x2: PLOT.x, y2: PLOT.y + PLOT.h, class: "csl-axis" }, svg));
      for (const t of [0, 0.5, 1]) {
        add("plot", el("line", { x1: PLOT.x, y1: cy(t), x2: PLOT.x + PLOT.w, y2: cy(t), class: "csl-grid-h" }, svg));
        add("plot", el("text", { x: PLOT.x - 6, y: cy(t) + 4, class: "csl-tick", "text-anchor": "end" }, svg)).textContent = Math.round(t * 100) + "%";
      }
      const labelsX = sizes.map(String).concat([labels.noCut || "no cut"]);
      labelsX.forEach((s, i) => {
        add("plot", el("text", { x: cx(i), y: PLOT.y + PLOT.h + 18, class: "csl-tick", "text-anchor": "middle" }, svg)).textContent = s;
      });
      add("plot", el("text", { x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h + 36, class: "csl-axislbl", "text-anchor": "middle" }, svg)).textContent = labels.axisS || "chunk size s (tokens)";
      const path = el("path", { d: "", class: "csl-curve" }, svg);
      const dots = [], dotLbls = [];
      const allFrac = frac.concat([0]);
      for (let i = 0; i < N; i++) {
        const d = el("circle", { cx: cx(i), cy: cy(allFrac[i]), r: 5, class: "csl-dot is-hidden" }, svg);
        const t = el("text", { x: cx(i), y: cy(allFrac[i]) - 11, class: "csl-dotlbl is-hidden", "text-anchor": "middle" }, svg);
        t.textContent = pct(allFrac[i]);
        dots.push(d);
        dotLbls.push(t);
      }
      layer("anchors", 6);
      const AY = Math.max(DOC.y + DOC.h + 116, PLOT.y + PLOT.h + 62);
      add("anchors", el("text", { x: DOC.x, y: AY, class: "csl-head" }, svg)).textContent = labels.anchorHead || "the law predicts an ORDER \u2014 the reported \u0394 nDCG@10 obeys it";
      const rows = [
        [labels.aSentence || "sentence (smallest)", anch.sentence],
        [labels.aFixed || "fixed-256 (middle)", anch.fixed256],
        [labels.aSemantic || "semantic (largest)", anch.semantic]
      ];
      const barX = DOC.x + 320, barU = 72;
      rows.forEach((r, i) => {
        const y = AY + 24 + i * 24;
        add("anchors", el("text", { x: DOC.x, y, class: "csl-arow" }, svg)).textContent = r[0];
        add("anchors", el("rect", { x: barX, y: y - 11, width: Math.max(3, r[1] * barU), height: 14, rx: 3, class: "csl-abar" }, svg));
        add("anchors", el("text", { x: barX + r[1] * barU + 8, y, class: "csl-aval" }, svg)).textContent = sig(r[1]);
      });
      const cyY = AY + 24 + rows.length * 24 + 12;
      add("anchors", el("text", { x: DOC.x, y: cyY, class: "csl-counter" }, svg)).textContent = labels.counter || "Needle-8192: the neighbours carry no referent \u2014 \u0394 is NEGATIVE.";
      add("anchors", el("text", { x: DOC.x, y: cyY + 20, class: "csl-counter2" }, svg)).textContent = labels.counter2 || "The law predicts a gain only when the neighbour is relevant.";
      const H = frameHeightFor(cyY + 30, 12);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      function drawGrid(s) {
        gridG.innerHTML = "";
        if (!s) return;
        for (let t = s; t * TOKPX < DOC.w; t += s) {
          const x = DOC.x + t * TOKPX;
          const cut = t > REF_TOK && t <= REF_TOK + g;
          const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
          ln.setAttribute("x1", x);
          ln.setAttribute("y1", DOC.y - 4);
          ln.setAttribute("x2", x);
          ln.setAttribute("y2", DOC.y + DOC.h + 4);
          ln.setAttribute("class", "csl-seam" + (cut ? " is-cut" : ""));
          gridG.appendChild(ln);
        }
      }
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        const idx = k - 1;
        const s = idx >= 0 && idx < sizes.length ? sizes[idx] : 0;
        drawGrid(s);
        const shown = Math.max(0, Math.min(N, k));
        dots.forEach((d, i) => {
          const isCur = i === idx || idx === sizes.length && i === N - 1;
          d.classList.toggle("is-hidden", i >= shown);
          dotLbls[i].classList.toggle("is-hidden", i >= shown || !isCur);
          d.classList.toggle("is-current", isCur);
        });
        path.setAttribute("d", shown < 2 ? "" : allFrac.slice(0, shown).map((v, i) => (i ? "L" : "M") + cx(i) + " " + cy(v)).join(" "));
        if (k === 0) {
          verdict.textContent = labels.setup || "a referent named once, then only pronouns \u2014 g tokens back";
          readout.textContent = "";
        } else if (idx < sizes.length) {
          verdict.textContent = (labels.sizeTag || "chunk size s =") + " " + s;
          readout.textContent = (labels.orphanTag || "orphaned:") + " " + pct(allFrac[idx]) + "  =  min(1, " + g + "/" + s + ")";
        } else {
          verdict.textContent = labels.noCutTag || "no cut at all \u2014 nothing is orphaned";
          readout.textContent = labels.noCutNote || "\u2026and length collapse is back: the answer is averaged away";
        }
        host.dataset.phase = k >= 6 ? "payoff" : "sweep";
      };
    }
  });
})();
