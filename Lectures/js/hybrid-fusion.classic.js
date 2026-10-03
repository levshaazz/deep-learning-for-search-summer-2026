/* AUTO-GENERATED offline classic bundle of widgets/hybrid-fusion/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/hybrid-fusion/logic.js
  var mountHybridFusion = defineWidget({
    id: "hybrid-fusion",
    rootClass: "hf-root",
    exportName: "mountHybridFusion",
    maxStep: 3,
    render({ host, data, labels, el }) {
      var _a, _b;
      const k = data.k;
      const sparse = ((_a = data.sparse) == null ? void 0 : _a.order) || [];
      const dense = ((_b = data.dense) == null ? void 0 : _b.order) || [];
      const fused = data.fused || [];
      const order = fused.map((d) => d.id);
      const byId = Object.fromEntries(fused.map((d) => [d.id, d]));
      const top = fused[0] || null;
      const fmtScore = (n) => typeof n === "number" ? n.toFixed(4) : "";
      const W = 640, PAD = 16, COLGAP = 18;
      const colW = (W - 2 * PAD - 2 * COLGAP) / 3;
      const colX = [PAD, PAD + colW + COLGAP, PAD + 2 * (colW + COLGAP)];
      const headY = 30, headH = 38, chipY0 = 84, chipH = 54, chipStep = 62;
      const svg = el("svg", { viewBox: `0 0 ${W} 10`, class: "wgt-svg hf-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      layer("inputs", 0);
      layer("votes", 1);
      layer("fused", 2);
      layer("crown", 3);
      const chipY = (i) => chipY0 + i * chipStep;
      function column(lname, x, role, headKey, ids, withScore) {
        add(lname, el("rect", { x, y: headY, width: colW, height: headH, rx: 8, class: "hf-head hf-head-" + role }, svg));
        add(lname, el("text", { x: x + colW / 2, y: headY + 25, class: "hf-headtxt", "text-anchor": "middle" }, svg)).textContent = labels[headKey] || role;
        const chips = {};
        ids.forEach((id, i) => {
          const cy = chipY(i);
          const rect = add(lname, el("rect", { x, y: cy, width: colW, height: chipH, rx: 7, class: "hf-chip hf-chip-" + role }, svg));
          add(lname, el("text", { x: x + 14, y: cy + 22, class: "hf-docid" }, svg)).textContent = esc(id);
          if (withScore) {
            add("fused", el("text", { x: x + colW - 14, y: cy + 22, class: "hf-score", "text-anchor": "end" }, svg)).textContent = byId[id] ? fmtScore(byId[id].score) : "";
          } else {
            add(lname, el("text", { x: x + colW - 14, y: cy + 22, class: "hf-rank", "text-anchor": "end" }, svg)).textContent = "#" + (i + 1);
            add("votes", el("text", { x: x + 14, y: cy + 44, class: "hf-vote" }, svg)).textContent = `1/(${k}+${i + 1})`;
          }
          chips[id] = { rect, i };
        });
        return chips;
      }
      const sChips = column("inputs", colX[0], "sparse", "headSparse", sparse, false);
      const dChips = column("inputs", colX[1], "dense", "headDense", dense, false);
      const fChips = column("fused", colX[2], "fused", "headFused", order, true);
      const sparseTop = sparse[0];
      if (sparseTop && fChips[sparseTop]) {
        add("crown", el("text", { x: colX[2] + 14, y: chipY(fChips[sparseTop].i) + 44, class: "hf-falls" }, svg)).textContent = labels.fallsLabel || "sparse #1 \u2193";
      }
      const bottomY = chipY(Math.max(sparse.length, order.length) - 1) + chipH;
      const H = frameHeightFor(bottomY, 14);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(step) {
        for (const name in layers) {
          const on = step >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        const litWinIn = step >= 1 && top;
        [sChips, dChips].forEach((cc) => Object.entries(cc).forEach(([id, c]) => c.rect.classList.toggle("is-lit", !!litWinIn && id === top.id)));
        Object.entries(fChips).forEach(([id, c]) => {
          c.rect.classList.toggle("is-lit", step >= 3 && top && id === top.id);
          c.rect.classList.toggle("is-fallen", step >= 3 && id === sparseTop);
        });
      };
    }
  });
})();
