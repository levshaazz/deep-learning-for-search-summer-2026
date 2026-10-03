/* AUTO-GENERATED offline classic bundle of widgets/recall-curve/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function padDomain(min, max, frac = 0.08) {
    let span = max - min;
    if (!(span > 0)) span = Math.abs(min) || 1;
    const p = span * frac;
    return { min: min - p, max: max + p, span: max - min + 2 * p };
  }
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/recall-curve/logic.js
  var SERIES = {
    ef: {
      sweep: (d) => d.efSweep && d.efSweep.sweep || [],
      knob: "ef",
      recall: "recallAt1",
      cost: "candidatesEvaluated",
      knobLabelKey: "efKnob",
      costLabelKey: "efCost"
    },
    nprobe: {
      sweep: (d) => d.toy2 && d.toy2.sweep || [],
      knob: "nprobe",
      recall: "recall",
      cost: "pointsScanned",
      knobLabelKey: "nprobeKnob",
      costLabelKey: "nprobeCost"
    }
  };
  function pickSeries(data, labels) {
    const want = labels && labels.series;
    if (want && SERIES[want]) return { name: want, cfg: SERIES[want] };
    if (data.efSweep && data.efSweep.sweep) return { name: "ef", cfg: SERIES.ef };
    if (data.toy2 && data.toy2.sweep) return { name: "nprobe", cfg: SERIES.nprobe };
    return { name: "ef", cfg: SERIES.ef };
  }
  var mountRecallCurve = defineWidget({
    id: "recall-curve",
    rootClass: "rc-root",
    exportName: "mountRecallCurve",
    maxStep: 4,
    // a generic ceiling; the widget clamps to (#points − 1) live
    render({ host, data, labels, el }) {
      const { name, cfg } = pickSeries(data, labels);
      const sweep = cfg.sweep(data);
      const N = sweep.length;
      const knobs = sweep.map((p) => Number(p[cfg.knob]));
      const recalls = sweep.map((p) => Number(p[cfg.recall]));
      const costs = sweep.map((p) => Number(p[cfg.cost]));
      const logAxis = name === "ef";
      const xpos = (v) => logAxis ? Math.log2(v) : v;
      const W = 480, PAD_L = 46, PAD_R = 18, PAD_T = 30;
      const plotW = W - PAD_L - PAD_R, plotH = 230;
      const xvals = knobs.map(xpos);
      const dx = padDomain(Math.min(...xvals), Math.max(...xvals), 0.08);
      const dy = padDomain(0, 1, 0.1);
      const box = { x: PAD_L, y: PAD_T, w: plotW, h: plotH };
      const sx = (vx) => box.x + (xpos(vx) - dx.min) / dx.span * box.w;
      const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;
      const captionTop = PAD_T + plotH + 58;
      const H = frameHeightFor(captionTop + 14, 10);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg rc-svg", role: "img", "aria-label": labels.alt || "" }, host);
      el("line", { x1: box.x, y1: box.y, x2: box.x, y2: box.y + box.h, class: "rc-axis" }, svg);
      el("line", { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: "rc-axis" }, svg);
      [0, 0.5, 1].forEach((t) => {
        const y = sy(t);
        el("line", { x1: box.x, y1: y, x2: box.x + box.w, y2: y, class: "rc-grid" }, svg);
        el("text", { x: box.x - 8, y: y + 4, class: "rc-ytick", "text-anchor": "end" }, svg).textContent = t.toFixed(1);
      });
      el("text", { x: 4, y: box.y - 12, class: "rc-axlbl", "text-anchor": "start" }, svg).textContent = labels.yaxis || "recall";
      knobs.forEach((kv, i) => {
        el("text", { x: sx(kv), y: box.y + box.h + 18, class: "rc-xtick", "text-anchor": "middle" }, svg).textContent = String(kv);
      });
      const knobName = labels[cfg.knobLabelKey] || cfg.knob;
      el("text", { x: box.x + box.w, y: box.y + box.h + 36, class: "rc-axlbl", "text-anchor": "end" }, svg).textContent = `${knobName} \u2192`;
      const stepped = name === "ef";
      const line = el("polyline", { points: "", class: "rc-line", fill: "none" }, svg);
      const ptEls = sweep.map((p, i) => {
        const cx = sx(knobs[i]), cy = sy(recalls[i]);
        const g = el("g", { class: "rc-pt is-hidden" }, svg);
        el("circle", { cx, cy, r: 6, class: "rc-dot" + (recalls[i] >= 1 ? " is-perfect" : "") }, g);
        if (i === 0 || recalls[i] !== recalls[i - 1]) {
          el("text", { x: cx, y: cy - 11, class: "rc-rlbl", "text-anchor": "middle" }, g).textContent = recalls[i].toFixed(recalls[i] === Math.round(recalls[i]) ? 1 : 4);
        }
        el("text", { x: cx, y: cy + 20, class: "rc-clbl", "text-anchor": "middle" }, g).textContent = `${costs[i]}`;
        return g;
      });
      const costName = labels[cfg.costLabelKey] || cfg.cost;
      el("text", { x: box.x, y: captionTop, class: "rc-costkey", "text-anchor": "start" }, svg).textContent = `${labels.costPrefix || "small number under each point ="} ${costName}`;
      const lastStep = Math.max(0, N - 1);
      return function update(k) {
        const upto = Math.min(k, lastStep);
        ptEls.forEach((g, i) => g.classList.toggle("is-hidden", i > upto));
        const verts = [];
        for (let i = 0; i <= upto; i++) {
          if (stepped && i > 0) verts.push(`${sx(knobs[i])},${sy(recalls[i - 1])}`);
          verts.push(`${sx(knobs[i])},${sy(recalls[i])}`);
        }
        line.setAttribute("points", verts.join(" "));
      };
    }
  });
})();
