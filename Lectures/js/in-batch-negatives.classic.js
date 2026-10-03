/* AUTO-GENERATED offline classic bundle of widgets/in-batch-negatives/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/in-batch-negatives/logic.js
  var mountInBatchNegatives = defineWidget({
    id: "in-batch-negatives",
    rootClass: "ibn-root",
    exportName: "mountInBatchNegatives",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const toy = data.toy || {};
      const Q = toy.queries || [];
      const D = toy.docs || [];
      const sims = toy.sims || [];
      const soft = toy.softmax || [];
      const B = Q.length;
      const tau = typeof toy.tau === "number" ? toy.tau : 0.2;
      const f2 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(2);
      const W = 600, PAD = 18;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg ibn-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const heat = (x) => `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(Math.max(0.05, x) * 86)}%, var(--bg-card, #fff))`;
      const heatPos = (x) => `color-mix(in srgb, var(--warm, #E8743B) ${Math.round(Math.max(0.25, x) * 92)}%, var(--bg-card, #fff))`;
      const ROWLBL = 138, CELL = 54, CGAP = 6, STEP = CELL + CGAP;
      const LBL_MAXCH = 18;
      const clampLbl = (s) => s.length > LBL_MAXCH ? s.slice(0, LBL_MAXCH - 1) + "\u2026" : s;
      const gx = PAD + ROWLBL, gyTop = 30, gy = gyTop + 30;
      const gridW = B * CELL + (B - 1) * CGAP;
      const gridH = B * CELL + (B - 1) * CGAP;
      const panelX = gx + gridW + 24;
      const panelW = W - PAD - panelX;
      const colCx = (j) => gx + j * STEP + CELL / 2;
      const rowCy = (i) => gy + i * STEP + CELL / 2;
      layer("head", 0);
      add("head", el("text", { x: PAD, y: 18, class: "ibn-head" }, svg)).textContent = labels.gridHead || "one batch: query \xD7 document similarities";
      D.forEach((_, j) => add("head", el("text", { x: colCx(j), y: gy - 9, class: "ibn-collbl", "text-anchor": "middle" }, svg)).textContent = "d" + j);
      Q.forEach((q, i) => add("head", el("text", { x: gx - 12, y: rowCy(i) + 4, class: "ibn-rowlbl", "text-anchor": "end" }, svg)).textContent = clampLbl("q" + i + "  " + q));
      layer("diag", 0);
      for (let i = 0; i < B; i++) {
        const x = gx + i * STEP, y = gy + i * STEP;
        const r = el("rect", { x, y, width: CELL, height: CELL, rx: 5, class: "ibn-cell ibn-pos" }, svg);
        r.setAttribute("fill", heatPos(sims[i] && sims[i][i] || 0.8));
        add("diag", r);
      }
      layer("off", 1);
      for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) {
        if (i === j) continue;
        const x = gx + j * STEP, y = gy + i * STEP;
        const r = el("rect", { x, y, width: CELL, height: CELL, rx: 5, class: "ibn-cell ibn-neg" }, svg);
        r.setAttribute("fill", heat(sims[i] && sims[i][j] || 0));
        add("off", r);
      }
      layer("vals", 1);
      for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) {
        const v = sims[i] && sims[i][j];
        if (typeof v !== "number") continue;
        const t = el("text", { x: colCx(j), y: rowCy(i) + 5, class: "ibn-cellval", "text-anchor": "middle" }, svg);
        t.textContent = f2(v);
        t.setAttribute("fill", i === j || v >= 0.5 ? "#fff" : "var(--ink, #14181F)");
        add("vals", t);
      }
      layer("mark", 2);
      for (let i = 0; i < B; i++) {
        add("mark", el("rect", {
          x: gx + i * STEP - 2,
          y: gy + i * STEP - 2,
          width: CELL + 4,
          height: CELL + 4,
          rx: 7,
          class: "ibn-ring",
          fill: "none"
        }, svg));
      }
      const legY = gy + gridH + 20, legRow = 20;
      add("mark", el("rect", { x: PAD, y: legY - 11, width: 14, height: 14, rx: 3, class: "ibn-cell ibn-pos" }, svg)).setAttribute("fill", "var(--warm, #E8743B)");
      add("mark", el("text", { x: PAD + 20, y: legY, class: "ibn-legtxt" }, svg)).textContent = labels.posLabel || "diagonal = the positive (q_i, d_i)";
      add("mark", el("rect", { x: PAD, y: legY - 11 + legRow, width: 14, height: 14, rx: 3, class: "ibn-cell ibn-neg" }, svg)).setAttribute("fill", "var(--accent-soft, #DCE8F8)");
      add("mark", el("text", { x: PAD + 20, y: legY + legRow, class: "ibn-legtxt" }, svg)).textContent = labels.negLabel || "off-diagonal = in-batch negatives (free)";
      layer("nce", 3);
      add("nce", el("text", { x: panelX, y: gy - 9, class: "ibn-panelhead" }, svg)).textContent = labels.softHead || "softmax(sim / \u03C4)";
      const barMax = panelW - 52;
      for (let i = 0; i < B; i++) {
        const p = soft[i] && soft[i][i] || 0;
        const y = gy + i * STEP + CELL / 2;
        add("nce", el("rect", { x: panelX, y: y - 11, width: barMax, height: 22, rx: 5, class: "ibn-barbg" }, svg));
        add("nce", el("rect", { x: panelX, y: y - 11, width: Math.max(2, barMax * p), height: 22, rx: 5, class: "ibn-bar" }, svg));
        add("nce", el("text", { x: panelX + barMax + 6, y: y + 5, class: "ibn-barval", "text-anchor": "start" }, svg)).textContent = f2(p);
      }
      add("nce", el("text", { x: panelX, y: gy + gridH + 6, class: "ibn-loss" }, svg)).textContent = (labels.lossLine || "L = \u2212\u03A3 log P\u207A") + "   (\u03C4 = " + tau + ")";
      const H = frameHeightFor(gy + gridH + 44, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        svg.classList.toggle("ibn-marked", k >= 2);
      };
    }
  });
})();
