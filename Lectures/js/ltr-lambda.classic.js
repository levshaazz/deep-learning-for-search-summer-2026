/* AUTO-GENERATED offline classic bundle of widgets/ltr-lambda/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ltr-lambda/logic.js
  var mountLtrLambda = defineWidget({
    id: "ltr-lambda",
    rootClass: "ll-root",
    exportName: "mountLtrLambda",
    maxStep: 3,
    render({ host, data, labels, el }) {
      var _a, _b;
      const toy = data.toy || {};
      const dI = ((_a = toy.pair) == null ? void 0 : _a.docI) || {}, dJ = ((_b = toy.pair) == null ? void 0 : _b.docJ) || {};
      const diff = toy.scoreDiff || 0;
      const prob = toy.rankNetProb || 0;
      const grad = toy.gradient || 0;
      const nd = toy.ndcg || {};
      const lam = toy.lambda || 0;
      const num4 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(4);
      const num1 = (x) => typeof x !== "number" || !isFinite(x) ? "" : Number.isInteger(x) ? String(x) : x.toFixed(1);
      const W = 560, PAD = 16;
      const svg = el("svg", { viewBox: `0 0 ${W} 10`, class: "wgt-svg ll-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      layer("docs", 0);
      layer("prob", 1);
      layer("ndcg", 2);
      layer("lambda", 3);
      const defs = el("defs", {}, svg);
      const mk = (id, cls) => {
        const m = el("marker", { id, viewBox: "0 0 10 10", refX: 7, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" }, defs);
        el("path", { d: "M0 0 L10 5 L0 10 z", class: cls }, m);
      };
      mk("ll-up", "ll-arrow-up");
      mk("ll-dn", "ll-arrow-dn");
      add("docs", el("text", { x: PAD, y: 24, class: "ll-head" }, svg)).textContent = labels.head || "two documents, two model scores \u2014 which should rank higher?";
      const bx = PAD + 92, bw = 300;
      const maxS = Math.max(1e-3, dI.score || 0, dJ.score || 0) * 1.12;
      const rows = [
        { d: dI, y: 48, cls: "i", lbl: labels.docI || "doc\u1D62" },
        { d: dJ, y: 92, cls: "j", lbl: labels.docJ || "doc_j" }
      ];
      const barEnd = {};
      rows.forEach((r) => {
        add("docs", el("text", { x: PAD, y: r.y + 22, class: "ll-doclbl ll-doclbl-" + r.cls }, svg)).textContent = r.lbl;
        add("docs", el("rect", { x: bx, y: r.y, width: bw, height: 30, rx: 5, class: "ll-track" }, svg));
        const w = (r.d.score || 0) / maxS * bw;
        add("docs", el("rect", { x: bx, y: r.y, width: w, height: 30, rx: 5, class: "ll-bar ll-bar-" + r.cls }, svg));
        add("docs", el("text", { x: bx + w + 8, y: r.y + 21, class: "ll-sval" }, svg)).textContent = "s = " + num1(r.d.score);
        barEnd[r.cls] = { x: bx + w, y: r.y };
      });
      const py = 150;
      add("prob", el("text", { x: PAD, y: py, class: "ll-line" }, svg)).textContent = `RankNet:  P(i \u227B j) = \u03C3(s_i \u2212 s_j) = \u03C3(${num1(diff)}) = ${num4(prob)}`;
      const gx = PAD, gy = py + 14, gw = W - 2 * PAD, gh = 16;
      add("prob", el("rect", { x: gx, y: gy, width: gw, height: gh, rx: 8, class: "ll-gauge" }, svg));
      add("prob", el("rect", { x: gx, y: gy, width: gw * prob, height: gh, rx: 8, class: "ll-gaugefill" }, svg));
      add("prob", el("line", { x1: gx + gw * 0.5, y1: gy - 4, x2: gx + gw * 0.5, y2: gy + gh + 4, class: "ll-mid" }, svg));
      const ny = py + 64;
      add("ndcg", el("rect", { x: PAD, y: ny, width: W - 2 * PAD, height: 52, rx: 9, class: "ll-box" }, svg));
      add("ndcg", el("text", { x: PAD + 12, y: ny + 22, class: "ll-line" }, svg)).textContent = `order [j, i]: nDCG = ${num4(nd.current)} \u2192 swap [i, j]: nDCG = ${num4(nd.afterSwap)}`;
      add("ndcg", el("text", { x: PAD + 12, y: ny + 43, class: "ll-line2" }, svg)).textContent = `${labels.deltaLabel || "\u0394nDCG"} = ${num4(nd.afterSwap)} \u2212 ${num4(nd.current)} = ${num4(nd.deltaNdcg)}`;
      const ly = ny + 68;
      add("lambda", el("rect", { x: PAD, y: ly, width: W - 2 * PAD, height: 38, rx: 9, class: "ll-lambdabox" }, svg));
      add("lambda", el("text", { x: PAD + 12, y: ly + 25, class: "ll-lambdaline" }, svg)).textContent = `\u03BB = gradient \xB7 ${labels.deltaLabel || "\u0394nDCG"} = ${num4(grad)} \xB7 ${num4(nd.deltaNdcg)} = ${num4(lam)}`;
      const forceX = bx + bw + 40;
      if (barEnd.i) add("lambda", el("line", {
        x1: forceX,
        y1: barEnd.i.y + 28,
        x2: forceX,
        y2: barEnd.i.y - 6,
        class: "ll-force",
        "marker-end": "url(#ll-up)"
      }, svg));
      if (barEnd.j) add("lambda", el("line", {
        x1: forceX,
        y1: barEnd.j.y + 2,
        x2: forceX,
        y2: barEnd.j.y + 36,
        class: "ll-force",
        "marker-end": "url(#ll-dn)"
      }, svg));
      const H = frameHeightFor(ly + 38, 12);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
