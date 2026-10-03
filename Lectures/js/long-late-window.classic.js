/* AUTO-GENERATED offline classic bundle of widgets/long-late-window/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/long-late-window/logic.js
  var W = 620;
  var BAR = { x: 30, y: 118, w: 560, h: 34 };
  var MARK_LBL_Y = 177;
  var ROW_Y = 206;
  var ROW_H = 22;
  var ROW_GAP = 8;
  var REF_TOK = 300;
  var ANS_TOK = 14e3;
  var mountLongLateWindow = defineWidget({
    id: "long-late-window",
    rootClass: "llw-root",
    exportName: "mountLongLateWindow",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const L = data && data.longLate || {};
      const docT = L.docTokens || 2e4;
      const lMax = L.lMax || 8192;
      const om = L.omega || 512;
      const stride = L.stride || lMax - om;
      const nMacro = L.macroChunks || Math.ceil((docT - om) / stride);
      const starts = L.starts || Array.from({ length: nMacro }, (_, i) => i * stride);
      const encoded = L.tokensEncoded || 0;
      const overhead = L.overheadTokens || 0;
      const sx = (t) => BAR.x + t / docT * BAR.w;
      const thou = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\xA0");
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg llw-svg",
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
      add("doc", el("text", { x: BAR.x, y: 26, class: "llw-head" }, svg)).textContent = (labels.docHead || "the document, to scale") + " \u2014 " + thou(docT) + " " + (labels.tokens || "tokens");
      add("doc", el("rect", { x: BAR.x, y: BAR.y, width: BAR.w, height: BAR.h, rx: 5, class: "llw-doc" }, svg));
      const tail = add("doc", el("rect", {
        x: sx(lMax),
        y: BAR.y,
        width: BAR.w - (sx(lMax) - BAR.x),
        height: BAR.h,
        rx: 5,
        class: "llw-tail is-hidden"
      }, svg));
      add("doc", el("rect", {
        x: BAR.x,
        y: BAR.y - 6,
        width: sx(lMax) - BAR.x,
        height: BAR.h + 12,
        rx: 6,
        class: "llw-window"
      }, svg));
      add("doc", el("text", { x: sx(lMax) - 4, y: BAR.y - 10, class: "llw-winlbl", "text-anchor": "end" }, svg)).textContent = (labels.window || "model window") + " = " + thou(lMax);
      const mark = (t, key, fallback, cls) => {
        const frac = t / docT;
        const anchor = frac < 0.15 ? "start" : frac > 0.85 ? "end" : "middle";
        add("doc", el("line", { x1: sx(t), y1: BAR.y - 2, x2: sx(t), y2: BAR.y + BAR.h + 2, class: "llw-mark " + cls }, svg));
        add("doc", el("text", { x: sx(t), y: MARK_LBL_Y, class: "llw-marklbl " + cls, "text-anchor": anchor }, svg)).textContent = labels[key] || fallback;
      };
      mark(REF_TOK, "refTag", "the referent", "is-ref");
      mark(ANS_TOK, "ansTag", "the answer-chunk", "is-ans");
      const arc = add("doc", el("path", {
        d: `M${sx(ANS_TOK)} ${BAR.y - 30} Q${(sx(ANS_TOK) + sx(REF_TOK)) / 2} ${BAR.y - 82} ${sx(REF_TOK)} ${BAR.y - 30}`,
        class: "llw-arc"
      }, svg));
      const brokenArc = add("doc", el("text", {
        x: (sx(ANS_TOK) + sx(REF_TOK)) / 2,
        y: BAR.y - 66,
        class: "llw-broken",
        "text-anchor": "middle"
      }, svg));
      brokenArc.textContent = "\u2715";
      const rowsG = el("g", { class: "llw-rows" }, svg);
      const rowsHead = el("text", { x: BAR.x, y: ROW_Y - 12, class: "llw-head" }, svg);
      const LY = ROW_Y + 3 * (ROW_H + ROW_GAP) + 24;
      const strat = el("text", { x: BAR.x, y: LY, class: "llw-strat" }, svg);
      const stratSub = el("text", { x: BAR.x, y: LY + 18, class: "llw-stratsub" }, svg);
      const bill1 = el("text", { x: BAR.x, y: LY + 40, class: "llw-bill" }, svg);
      const bill2 = el("text", { x: BAR.x, y: LY + 62, class: "llw-bill2" }, svg);
      const caveat = el("text", { x: BAR.x, y: LY + 88, class: "llw-caveat" }, svg);
      caveat.textContent = labels.caveat || "l_max and \u03C9 are our example values \u2014 the paper publishes none\u2026";
      const caveat2 = el("text", { x: BAR.x, y: LY + 106, class: "llw-caveat" }, svg);
      caveat2.textContent = labels.caveat2 || "\u2026and the repository ships two different defaults.";
      const H = frameHeightFor(LY + 112, 10);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const SVGNS2 = "http://www.w3.org/2000/svg";
      function box(x, w, y, cls) {
        const r = document.createElementNS(SVGNS2, "rect");
        r.setAttribute("x", x);
        r.setAttribute("y", y);
        r.setAttribute("width", Math.max(2, w));
        r.setAttribute("height", ROW_H);
        r.setAttribute("rx", 4);
        r.setAttribute("class", cls);
        rowsG.appendChild(r);
        return r;
      }
      function tag(x, y, text, cls) {
        const t = document.createElementNS(SVGNS2, "text");
        t.setAttribute("x", x);
        t.setAttribute("y", y + ROW_H - 7);
        t.setAttribute("class", cls);
        t.textContent = text;
        rowsG.appendChild(t);
        return t;
      }
      function drawRows(k) {
        rowsG.innerHTML = "";
        if (k === 0) {
          rowsHead.textContent = "";
          return;
        }
        if (k === 1) {
          rowsHead.textContent = labels.rowsTruncate || "what actually gets indexed";
          box(BAR.x, sx(lMax) - BAR.x, ROW_Y, "llw-mc");
          tag(BAR.x + 6, ROW_Y, "0 \u2013 " + thou(lMax), "llw-mclbl");
          box(sx(lMax), BAR.w - (sx(lMax) - BAR.x), ROW_Y, "llw-lost");
          tag(sx(lMax) + 6, ROW_Y, labels.lost || "never indexed", "llw-lostlbl");
          return;
        }
        const st = k === 2 ? Array.from({ length: Math.ceil(docT / lMax) }, (_, i) => i * lMax) : starts;
        rowsHead.textContent = k === 2 ? labels.rowsNaive || "macro-chunks, no overlap" : labels.rowsLate || "macro-chunks with an \u03C9-token overlap";
        st.forEach((s, i) => {
          const y = ROW_Y + i * (ROW_H + ROW_GAP);
          const end = Math.min(docT, s + lMax);
          box(sx(s), sx(end) - sx(s), y, "llw-mc");
          const rangeTxt = thou(s) + " \u2013 " + thou(end);
          const rangeTag = tag(sx(s) + 6, y, rangeTxt, "llw-mclbl");
          if (sx(s) + 6 + rangeTxt.length * 8.6 > BAR.x + BAR.w) {
            rangeTag.setAttribute("x", sx(end) - 6);
            rangeTag.setAttribute("text-anchor", "end");
          }
          if (k >= 3 && i > 0) {
            const ov = box(sx(s), sx(s + om) - sx(s), y, "llw-ov" + (k >= 4 ? " is-dropped" : ""));
            ov.setAttribute("rx", 2);
          }
        });
      }
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        tail.classList.toggle("is-hidden", k !== 1);
        arc.classList.toggle("is-hidden", k === 1);
        arc.classList.toggle("is-cut", k === 2);
        brokenArc.classList.toggle("is-hidden", k !== 2);
        drawRows(k);
        stratSub.textContent = "";
        if (k === 0) {
          strat.textContent = labels.s0strat || "a document four times longer than the window";
          bill1.textContent = thou(docT) + " " + (labels.tokens || "tokens") + "  \xB7  " + (labels.window || "model window") + " " + thou(lMax);
          bill2.textContent = "";
        } else if (k === 1) {
          strat.textContent = labels.s1strat || "strategy 1 \u2014 truncate";
          bill1.textContent = (labels.covered || "covered:") + " " + thou(lMax) + " / " + thou(docT);
          bill2.textContent = labels.s1note || "the answer-chunk at 14 000 is never indexed at all";
        } else if (k === 2) {
          strat.textContent = labels.s2strat || "strategy 2 \u2014 cut naively (\u03C9 = 0)";
          stratSub.textContent = "\u03C9 = 0  \xB7  stride = " + thou(lMax);
          bill1.textContent = (labels.encoded || "tokens encoded:") + " " + thou(docT) + "  \xB7  " + (labels.overheadTag || "overhead:") + " 0";
          bill2.textContent = labels.s2note || "but the seam severs the dependency all over again";
        } else if (k === 3) {
          strat.textContent = labels.s3strat || "strategy 3 \u2014 long late chunking";
          stratSub.textContent = "\u03C9 = " + om + "  \xB7  stride = " + thou(lMax) + " \u2212 " + om + " = " + thou(stride);
          bill1.textContent = nMacro + " " + (labels.macro || "macro-chunks") + "  \xB7  " + (labels.starts || "starts:") + " " + starts.map(thou).join(" \xB7 ");
          bill2.textContent = labels.s3note || "the token at the seam reads across it \u2014 the arc holds";
        } else {
          strat.textContent = labels.s4strat || "line 14 \u2014 discard the overlap embeddings";
          bill1.textContent = (labels.encoded || "tokens encoded:") + " " + thou(encoded) + "  \xB7  " + (labels.overheadTag || "overhead:") + " " + thou(overhead) + " = (" + nMacro + " \u2212 1) \xD7 " + om;
          bill2.textContent = labels.s4note || "every token is indexed exactly once; the tax is \u03C9 per seam";
        }
        host.dataset.phase = k >= 3 ? "longlate" : "naive";
      };
    }
  });
})();
