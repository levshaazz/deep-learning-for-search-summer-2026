/* AUTO-GENERATED offline classic bundle of widgets/impostor-denoise/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/impostor-denoise/logic.js
  var mountImpostorDenoise = defineWidget({
    id: "impostor-denoise",
    rootClass: "imd-root",
    exportName: "mountImpostorDenoise",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const sp = data && data.spine || {};
      const pos = sp.positive || { cosQ: 0.82 };
      const lineup = sp.lineup || [];
      const recall = data && data.recallAt10 || {};
      const f2 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(2);
      const n4 = lineup.find((n) => n.id === "n4") || { cosPos: 0.31, cosQ: 0.75 };
      const n5 = lineup.find((n) => n.id === "n5") || { cosPos: 0.8, cosQ: 0.79 };
      const posPos = 1;
      const W = 600, PAD = 24;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg imd-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      const axL = PAD + 12, axR = W - PAD - 12, axY = 92;
      const cx = (c) => axL + (axR - axL) * Math.max(0, Math.min(1, c));
      layer("axis", 0);
      add("axis", el("text", { x: PAD, y: 28, class: "imd-head" }, svg)).textContent = labels.axisHead || "the second axis: cos(\xB7, d\u207A) \u2014 collateral danger";
      add("axis", el("rect", { x: cx(0.62), y: axY - 30, width: axR - cx(0.62), height: 60, rx: 6, class: "imd-danger" }, svg));
      add("axis", el("text", { x: (cx(0.62) + axR) / 2, y: axY - 48, class: "imd-zonelbl", "text-anchor": "middle" }, svg)).textContent = labels.dangerLabel || "d\u207A's neighbourhood (danger)";
      add("axis", el("line", { x1: axL, y1: axY, x2: axR, y2: axY, class: "imd-axisline" }, svg));
      add("axis", el("text", { x: axL, y: axY + 24, class: "imd-tick", "text-anchor": "middle" }, svg)).textContent = "0";
      add("axis", el("text", { x: axR, y: axY + 24, class: "imd-tick", "text-anchor": "middle" }, svg)).textContent = "1";
      const marker = (c, lbl, cls, up) => {
        const x = cx(c), y = axY;
        add("axis", el("circle", { cx: x, cy: y, r: 6, class: "imd-dot " + cls }, svg));
        const edge = c >= 0.95;
        add("axis", el("text", {
          x: edge ? x - 8 : x,
          y: up ? y - 12 : y + 18,
          class: "imd-mklbl " + cls,
          "text-anchor": edge ? "end" : "middle"
        }, svg)).textContent = lbl + " " + f2(c);
        return x;
      };
      marker(posPos, "d\u207A", "imd-pos", true);
      marker(n4.cosPos, "n\u2084", "imd-safe", false);
      const n5x = marker(n5.cosPos, "n\u2085", "imd-false", true);
      layer("drag", 1);
      add("drag", el("text", { x: n5x, y: axY - 28, class: "imd-pushlbl", "text-anchor": "middle" }, svg)).textContent = "\u27F5 push n\u2085";
      const dragArrow = add("drag", el("path", {
        d: `M ${cx(posPos)} ${axY - 6} q -20 -16 -40 -2`,
        class: "imd-drag",
        fill: "none",
        "marker-end": ""
      }, svg));
      dragArrow.setAttribute("stroke-dasharray", "4 3");
      layer("why", 2);
      add("why", el("circle", { cx: n5x, cy: axY, r: 11, class: "imd-emph", fill: "none" }, svg));
      add("why", el("text", { x: (cx(n4.cosPos) + n5x) / 2, y: axY + 30, class: "imd-why", "text-anchor": "middle" }, svg)).textContent = labels.whyLabel || "n\u2084 \u2248 n\u2085 on hardness";
      layer("filter", 3);
      add("filter", el("line", { x1: n5x - 12, y1: axY - 12, x2: n5x + 12, y2: axY + 12, class: "imd-strike" }, svg));
      add("filter", el("line", { x1: n5x - 12, y1: axY + 12, x2: n5x + 12, y2: axY - 12, class: "imd-strike" }, svg));
      add("filter", el("text", { x: n5x, y: axY + 36, class: "imd-filterlbl", "text-anchor": "middle" }, svg)).textContent = labels.filteredLabel || "cross-encoder filters n\u2085";
      const rows = [
        { key: "inbatch", from: 0, cls: "imd-bar" },
        { key: "undenoised", from: 1, cls: "imd-bar-drop" },
        { key: "denoised", from: 3, cls: "imd-bar-win" }
      ];
      const chL = PAD + 150, chTop = axY + 64, rowH = 30, barMax = W - PAD - chL - 56;
      const ibase = recall.inbatch && recall.inbatch.mean || 0;
      layer("recallhead", 0);
      add("recallhead", el("text", { x: PAD, y: chTop - 14, class: "imd-head" }, svg)).textContent = labels.recallHead || "recall@10 (measured, 20 seeds)";
      rows.forEach((r, i) => {
        layer("r" + i, r.from);
        const m = recall[r.key] && recall[r.key].mean || 0;
        const y = chTop + i * rowH;
        add("r" + i, el("text", { x: PAD, y: y + 4, class: "imd-rowlbl" }, svg)).textContent = labels["lbl_" + r.key] || r.key;
        add("r" + i, el("rect", { x: chL, y: y - 9, width: barMax, height: 19, rx: 4, class: "imd-barbg" }, svg));
        add("r" + i, el("rect", { x: chL, y: y - 9, width: Math.max(2, barMax * m), height: 19, rx: 4, class: r.cls }, svg));
        add("r" + i, el("text", { x: chL + barMax * m + 6, y: y + 5, class: "imd-barval" }, svg)).textContent = f2(m);
      });
      layer("ref", 0);
      add("ref", el("line", {
        x1: chL + barMax * ibase,
        y1: chTop - 16,
        x2: chL + barMax * ibase,
        y2: chTop + rows.length * rowH - 12,
        class: "imd-refline"
      }, svg));
      const H = frameHeightFor(chTop + rows.length * rowH + 4, 8);
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
