/* AUTO-GENERATED offline classic bundle of widgets/mining-comparator/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/mining-comparator/logic.js
  var ORDER = ["random", "inbatch", "bm25", "undenoised", "denoised"];
  var mountMiningComparator = defineWidget({
    id: "mining-comparator",
    rootClass: "mcp-root",
    exportName: "mountMiningComparator",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const sp = data && data.spine || {};
      const pos = sp.positive || { cosQ: 0.82 };
      const lineup = sp.lineup || [];
      const mined = sp.minedByStrategy || {};
      const recall = data && data.recallAt10 || {};
      const f2 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(2);
      const stratLabel = (s) => labels["strat_" + s] || s;
      const W = 600, PAD = 20;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg mcp-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      layer("chips", 0);
      add("chips", el("text", { x: PAD, y: 22, class: "mcp-head" }, svg)).textContent = labels.poolHead || "the candidate pool (d\u207A must stay on top)";
      const chips = [
        { id: "d\u207A", cosQ: pos.cosQ, pos: true },
        ...lineup.map((n) => ({ id: n.id, cosQ: n.cosQ, isFalse: n.isFalse }))
      ];
      const cW = 84, cGap = 6, cTop = 34, cH = 44;
      const rings = {};
      chips.forEach((c, i) => {
        const x = PAD + i * (cW + cGap);
        const cls = c.pos ? "mcp-pos" : c.isFalse ? "mcp-false" : "mcp-neg";
        const ring = add("chips", el("rect", {
          x: x - 3,
          y: cTop - 3,
          width: cW + 6,
          height: cH + 6,
          rx: 8,
          class: "mcp-ring",
          fill: "none"
        }, svg));
        ring.classList.add("is-hidden");
        rings[c.id] = ring;
        add("chips", el("rect", { x, y: cTop, width: cW, height: cH, rx: 6, class: "mcp-chip " + cls }, svg));
        add("chips", el("text", { x: x + cW / 2, y: cTop + 19, class: "mcp-chiplbl " + cls, "text-anchor": "middle" }, svg)).textContent = c.pos ? "d\u207A" : c.id + (c.isFalse ? " \u26A0" : "");
        add("chips", el("text", { x: x + cW / 2, y: cTop + 36, class: "mcp-chipcos", "text-anchor": "middle" }, svg)).textContent = f2(c.cosQ);
      });
      const chTop = cTop + cH + 46, chH = 150, baseY = chTop + chH;
      const chLeft = PAD + 34, slot = (W - PAD - chLeft) / ORDER.length, barW = slot * 0.6;
      layer("axis", 0);
      add("axis", el("text", { x: PAD, y: chTop - 12, class: "mcp-head" }, svg)).textContent = labels.recallHead || "recall@10 (measured on the toy, 20 seeds)";
      add("axis", el("line", { x1: chLeft, y1: chTop, x2: chLeft, y2: baseY, class: "mcp-axisline" }, svg));
      add("axis", el("line", { x1: chLeft, y1: baseY, x2: W - PAD, y2: baseY, class: "mcp-axisline" }, svg));
      const ibase = recall.inbatch && recall.inbatch.mean || 0;
      const refY = baseY - chH * ibase;
      add("axis", el("line", { x1: chLeft, y1: refY, x2: W - PAD, y2: refY, class: "mcp-refline" }, svg));
      add("axis", el("text", { x: W - PAD, y: refY - 5, class: "mcp-reflbl", "text-anchor": "end" }, svg)).textContent = (labels.refLabel || "in-batch baseline") + " " + f2(ibase);
      const barNodes = ORDER.map((s, i) => {
        layer("bar" + i, 0);
        const m = recall[s] && recall[s].mean || 0;
        const x = chLeft + i * slot + (slot - barW) / 2;
        const h = chH * m;
        const cls = s === "undenoised" ? "mcp-bar-drop" : s === "denoised" ? "mcp-bar-win" : "mcp-bar";
        const bar = add("bar" + i, el("rect", { x, y: baseY - h, width: barW, height: h, rx: 4, class: cls }, svg));
        add("bar" + i, el("text", { x: x + barW / 2, y: baseY - h - 6, class: "mcp-barval", "text-anchor": "middle" }, svg)).textContent = f2(m);
        add("bar" + i, el("text", { x: x + barW / 2, y: baseY + 15, class: "mcp-barlbl", "text-anchor": "middle" }, svg)).textContent = stratLabel(s);
        return bar;
      });
      const H = frameHeightFor(baseY + 24, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (let i = 0; i < ORDER.length; i++) {
          const on = i <= k;
          for (const node of layers["bar" + i].nodes) node.classList.toggle("is-hidden", !on);
          barNodes[i].classList.toggle("mcp-current", i === k);
        }
        const picked = new Set(mined[ORDER[k]] || []);
        for (const id in rings) rings[id].classList.toggle("is-hidden", !picked.has(id));
      };
    }
  });
})();
