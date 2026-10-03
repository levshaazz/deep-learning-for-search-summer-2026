/* AUTO-GENERATED offline classic bundle of widgets/colbert-maxsim/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/colbert-maxsim/logic.js
  var mountColbertMaxsim = defineWidget({
    id: "colbert-maxsim",
    rootClass: "cm-root",
    exportName: "mountColbertMaxsim",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const toy = data.toy || {};
      const qTokens = toy.qTokens || [];
      const doc = toy.docRel || {};
      const dTokens = doc.dTokens || [];
      const sim = doc.sim || [];
      const rowMax = doc.rowMax || [];
      const maxSim = typeof doc.maxSim === "number" ? doc.maxSim : 0;
      const num2 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(2);
      const W = 620, PAD = 16;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg cm-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const heat = (x) => `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(Math.max(0.05, x) * 100)}%, var(--bg-card, #fff))`;
      const LBL = 84, CELL = 74, CGAP = 9, STEP = CELL + CGAP;
      const gx = PAD + LBL, gy = 56;
      layer("tokens", 0);
      add("tokens", el("text", { x: PAD, y: 22, class: "cm-head" }, svg)).textContent = labels.head || "every query token vs every document token \u2014 cosine in each cell";
      add("tokens", el("text", { x: PAD, y: gy - 10, class: "cm-axislbl cm-q", "text-anchor": "start" }, svg)).textContent = labels.qLabel || "query \u2193";
      dTokens.forEach((t, c) => {
        add("tokens", el("text", {
          x: gx + c * STEP + CELL / 2,
          y: gy - 10,
          class: "cm-collbl",
          "text-anchor": "middle"
        }, svg)).textContent = t;
      });
      const cells = [];
      qTokens.forEach((qt, r) => {
        const cy = gy + r * STEP;
        add("tokens", el("text", { x: gx - 12, y: cy + CELL / 2 + 5, class: "cm-rowlbl", "text-anchor": "end" }, svg)).textContent = qt;
        const isMaxCol = rowMax.length > r ? (sim[r] || []).indexOf(rowMax[r]) : -1;
        (sim[r] || []).forEach((v, c) => {
          const cx = gx + c * STEP;
          const rect = el("rect", { x: cx, y: cy, width: CELL, height: CELL, rx: 6, class: "cm-cell" }, svg);
          const valText = el("text", {
            x: cx + CELL / 2,
            y: cy + CELL / 2 + 6,
            class: "cm-cellval",
            "text-anchor": "middle"
          }, svg);
          valText.textContent = num2(v);
          cells.push({ rect, valText, v, r, c, isMax: c === isMaxCol });
        });
      });
      const rmx = gx + dTokens.length * STEP + 6;
      layer("rowmax", 3);
      add("rowmax", el("text", {
        x: rmx + CELL / 2,
        y: gy - 10,
        class: "cm-collbl cm-maxlbl",
        "text-anchor": "middle"
      }, svg)).textContent = labels.maxLabel || "max";
      qTokens.forEach((_, r) => {
        const cy = gy + r * STEP;
        add("rowmax", el("rect", { x: rmx, y: cy, width: CELL, height: CELL, rx: 6, class: "cm-maxcell" }, svg));
        add("rowmax", el("text", {
          x: rmx + CELL / 2,
          y: cy + CELL / 2 + 6,
          class: "cm-maxval",
          "text-anchor": "middle"
        }, svg)).textContent = num2(rowMax[r]);
      });
      const sumY = gy + qTokens.length * STEP + 16;
      add("rowmax", el("rect", { x: PAD, y: sumY, width: W - 2 * PAD, height: 48, rx: 9, class: "cm-sumbox" }, svg));
      add("rowmax", el("text", { x: PAD + 14, y: sumY + 31, class: "cm-sumline" }, svg)).textContent = `${labels.scoreLabel || "MaxSim"} = ${rowMax.map(num2).join(" + ")} = ${num2(maxSim)}`;
      const H = frameHeightFor(sumY + 48, 12);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        cells.forEach((c) => {
          c.rect.setAttribute("fill", k >= 1 ? heat(c.v) : "var(--bg-inset, #EBE7DA)");
          c.valText.classList.toggle("is-hidden", k < 1);
          c.rect.classList.toggle("is-lit", k >= 2 && c.isMax);
          c.valText.classList.toggle("is-lit", k >= 2 && c.isMax);
          if (k >= 1) c.valText.setAttribute("fill", c.v >= 0.55 ? "#fff" : "var(--ink, #14181F)");
        });
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
