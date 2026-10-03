/* AUTO-GENERATED offline classic bundle of widgets/layernorm-viz/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function clampSegmentToRect(x1, y1, x2, y2, rect) {
    const xmin = rect.x, ymin = rect.y, xmax = rect.x + rect.w, ymax = rect.y + rect.h;
    const dx = x2 - x1, dy = y2 - y1;
    let t0 = 0, t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return null;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return null;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return null;
          if (t < t1) t1 = t;
        }
      }
    }
    return {
      x1: x1 + t0 * dx,
      y1: y1 + t0 * dy,
      x2: x1 + t1 * dx,
      y2: y1 + t1 * dy
    };
  }
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/layernorm-viz/logic.js
  var mountLayernormViz = defineWidget({
    id: "layernorm-viz",
    rootClass: "ln-root",
    exportName: "mountLayernormViz",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const x = data.x || [];
      const centred = data.centred || [];
      const normed = data.normed || [];
      const out = data.out || [];
      const gamma = data.gamma || [];
      const beta = data.beta || [];
      const dim = data.dim != null ? data.dim : x.length;
      const mean = data.mean, vAr = data.var, std = data.std;
      const normedMean = data.normedMean, normedVar = data.normedVar;
      const series = [x, centred, normed, out];
      const baseVal = [mean, 0, 0, 0];
      const outMean = out.length ? out.reduce((a, b) => a + b, 0) / out.length : 0;
      const outVar = out.length ? out.reduce((a, b) => a + (b - outMean) * (b - outMean), 0) / out.length : 0;
      const meanReadout = [mean, 0, normedMean, outMean];
      const varReadout = [vAr, vAr, normedVar, outVar];
      const num = (v, d = 2) => typeof v !== "number" ? "" : Number.isInteger(v) ? String(v) : fmt(v, d);
      const PAD = 16, RPAD = 64;
      const barTop = 30, barH = 188;
      const barBase = barTop + barH;
      const panelW = 286;
      const gutter = 46;
      const bx0 = PAD + gutter;
      const slotW = (panelW - gutter) / dim;
      const barW = slotW * 0.62;
      const maxRaw = Math.max(...x, 1);
      const S = Math.max(2, ...centred.map(Math.abs), ...normed.map(Math.abs), ...out.map(Math.abs));
      const yRaw = (v) => barBase - v / maxRaw * barH;
      const ySym = (v) => barBase - barH / 2 - v / S * (barH / 2 - 6);
      const yFor = (v, step) => step === 0 ? yRaw(v) : ySym(v);
      const circR = 64;
      const cBox = { x: PAD + panelW + 8, y: barTop, w: 150, h: barH };
      const W = cBox.x + cBox.w + RPAD;
      const cx = cBox.x + cBox.w / 2, cy = cBox.y + cBox.h / 2 - 4;
      const sphereRect = { x: cBox.x, y: cBox.y, w: cBox.w, h: cBox.h };
      const di = normed.reduce((bi, v, i) => v > normed[bi] ? i : bi, 0);
      const dk = normed.reduce((bi, v, i) => v < normed[bi] ? i : bi, 0);
      const rawVec = [x[di] - mean, x[dk] - mean];
      const normVec = [normed[di], normed[dk]];
      const unit = (v) => {
        const m = Math.hypot(v[0], v[1]) || 1;
        return [v[0] / m, v[1] / m];
      };
      const rawU = unit(rawVec), normU = unit(normVec);
      const rawLen = circR * 1.42, normLen = circR;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg ln-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const txt = (x0, y0, s, attrs = {}) => {
        const t = el("text", { x: x0, y: y0, ...attrs }, svg);
        t.textContent = s;
        return t;
      };
      layer("frame", 0);
      add("frame", txt(
        PAD,
        barTop - 12,
        labels.rawHead || "feature vector x",
        { font: "700 12px var(--font-mono, monospace)", fill: "var(--ink-2, #3D434E)" }
      ));
      add("frame", el("line", {
        x1: bx0 - 8,
        y1: barBase,
        x2: PAD + panelW - 8,
        y2: barBase,
        fill: "none",
        stroke: "var(--rule-strong, #B8B19E)",
        "stroke-width": 1.25
      }, svg));
      const baseLine = el("line", {
        x1: bx0 - 8,
        y1: yRaw(mean),
        x2: PAD + panelW - 8,
        y2: yRaw(mean),
        fill: "none",
        stroke: "var(--warm, #E8743B)",
        "stroke-width": 1.5,
        "stroke-dasharray": "5 3"
      }, svg);
      const baseLbl = txt(PAD, yRaw(mean) - 4, "", {
        font: "700 10px var(--font-mono, monospace)",
        fill: "var(--warm-ink, #B4521F)",
        "text-anchor": "start"
      });
      add("frame", baseLine);
      add("frame", baseLbl);
      const bars = [];
      for (let i = 0; i < dim; i++) {
        const bxi = bx0 + i * slotW + (slotW - barW) / 2;
        const r = el("rect", {
          x: bxi,
          width: barW,
          rx: 2,
          fill: "var(--accent, #2A6FDB)",
          stroke: "var(--accent-ink, #1B4FA0)",
          "stroke-width": 0.75
        }, svg);
        add("frame", r);
        bars.push({ r, bxi });
      }
      const opY = barBase + 18;
      const barCx = PAD + gutter + (panelW - gutter) / 2;
      const opLbl = txt(barCx, opY, "", {
        font: "700 11px var(--font-mono, monospace)",
        fill: "var(--accent-ink, #1B4FA0)",
        "text-anchor": "middle"
      });
      add("frame", opLbl);
      const roY = barBase + 38;
      const roLine1 = txt(PAD, roY, "", {
        font: "700 11px var(--font-mono, monospace)",
        fill: "var(--ink-2, #3D434E)"
      });
      const roLine2 = txt(PAD, roY + 16, "", {
        font: "700 11px var(--font-mono, monospace)",
        fill: "var(--warm-ink, #B4521F)"
      });
      add("frame", roLine1);
      add("frame", roLine2);
      layer("sphere", 2);
      add("sphere", txt(
        cx,
        barTop - 12,
        labels.sphereHead || "the vector on the unit circle",
        {
          font: "700 11px var(--font-mono, monospace)",
          fill: "var(--ink-2, #3D434E)",
          "text-anchor": "middle"
        }
      ));
      add("sphere", el("circle", {
        cx,
        cy,
        r: circR,
        fill: "none",
        stroke: "var(--rule-strong, #B8B19E)",
        "stroke-width": 1.5
      }, svg));
      add("sphere", el("line", {
        x1: cx - circR - 6,
        y1: cy,
        x2: cx + circR + 6,
        y2: cy,
        fill: "none",
        stroke: "var(--rule-strong, #B8B19E)",
        "stroke-width": 1
      }, svg));
      add("sphere", el("line", {
        x1: cx,
        y1: cy - circR - 6,
        x2: cx,
        y2: cy + circR + 6,
        fill: "none",
        stroke: "var(--rule-strong, #B8B19E)",
        "stroke-width": 1
      }, svg));
      add("sphere", el("circle", { cx, cy, r: 2.5, fill: "var(--ink-3, #6B7280)" }, svg));
      const defs = el("defs", {}, svg);
      const mk = (id, fill) => {
        const m = el("marker", {
          id,
          viewBox: "0 0 10 10",
          refX: "8",
          refY: "5",
          markerWidth: "6",
          markerHeight: "6",
          orient: "auto-start-reverse"
        }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 z", fill }, m);
      };
      mk("ln-raw", "var(--ink-4, #9CA3AF)");
      mk("ln-norm", "var(--accent, #2A6FDB)");
      const tipLabel = (lyr, tx0, ty0, s, fill) => {
        const farRight = tx0 + 40 > W - 6;
        add(lyr, txt(
          farRight ? tx0 - 4 : tx0 + 4,
          ty0,
          s,
          {
            font: "700 10px var(--font-mono, monospace)",
            fill,
            "text-anchor": farRight ? "end" : "start"
          }
        ));
      };
      layer("arrowRaw", 2);
      {
        const ex = cx + rawU[0] * rawLen, ey = cy - rawU[1] * rawLen;
        const seg = clampSegmentToRect(cx, cy, ex, ey, sphereRect) || { x1: cx, y1: cy, x2: ex, y2: ey };
        add("arrowRaw", el("line", {
          x1: seg.x1,
          y1: seg.y1,
          x2: seg.x2,
          y2: seg.y2,
          fill: "none",
          stroke: "var(--ink-4, #9CA3AF)",
          "stroke-width": 2,
          "stroke-dasharray": "4 3",
          "marker-end": "url(#ln-raw)"
        }, svg));
      }
      layer("arrowNorm", 2);
      {
        const ex = cx + normU[0] * normLen, ey = cy - normU[1] * normLen;
        const seg = clampSegmentToRect(cx, cy, ex, ey, sphereRect) || { x1: cx, y1: cy, x2: ex, y2: ey };
        add("arrowNorm", el("line", {
          x1: seg.x1,
          y1: seg.y1,
          x2: seg.x2,
          y2: seg.y2,
          fill: "none",
          stroke: "var(--accent, #2A6FDB)",
          "stroke-width": 2.5,
          "marker-end": "url(#ln-norm)"
        }, svg));
        add("arrowNorm", el("circle", {
          cx: cx + normU[0] * circR,
          cy: cy - normU[1] * circR,
          r: 4,
          fill: "var(--accent, #2A6FDB)"
        }, svg));
        tipLabel(
          "arrowNorm",
          cx + normU[0] * normLen,
          cy - normU[1] * normLen + 12,
          labels.normedTag || "normed",
          "var(--accent-ink, #1B4FA0)"
        );
      }
      const H = frameHeightFor(Math.max(roY + 16, cBox.y + cBox.h) + 8, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const stageKey = ["stageRaw", "stageCentred", "stageNormed", "stageOut"];
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const node of L.nodes) node.classList.toggle("is-hidden", !on);
        }
        const vals = series[k] || [];
        const ref = k === 0 ? barBase : ySym(0);
        vals.forEach((v, i) => {
          const yv = yFor(v, k);
          const top = Math.min(yv, ref), hgt = Math.max(2, Math.abs(yv - ref));
          bars[i].r.setAttribute("y", top);
          bars[i].r.setAttribute("height", hgt);
          bars[i].r.setAttribute("fill", v < 0 ? "var(--warm, #E8743B)" : "var(--accent, #2A6FDB)");
          bars[i].r.setAttribute("stroke", v < 0 ? "var(--warm-ink, #B4521F)" : "var(--accent-ink, #1B4FA0)");
        });
        const bY = k === 0 ? yRaw(mean) : ySym(0);
        baseLine.setAttribute("y1", bY);
        baseLine.setAttribute("y2", bY);
        baseLbl.setAttribute("y", bY - 4);
        baseLbl.textContent = "\u03BC = " + num(baseVal[k], 2);
        opLbl.textContent = labels[stageKey[k]] || "";
        roLine1.textContent = (labels.meanLbl || "mean \u03BC") + " = " + num(meanReadout[k], 2) + "   \xB7   " + (labels.varLbl || "var \u03C3\xB2") + " = " + num(varReadout[k], 2);
        roLine2.textContent = k === 0 ? (labels.stdLbl || "std") + " = " + num(std, 4) : k === 2 ? "\u2713 " + (labels.normedTag || "normed") : k === 3 ? labels.affineNote || "\u03C3\xB2 \u2260 1 after \u03B3,\u03B2 (rescaled)" : "";
      };
    }
  });
})();
