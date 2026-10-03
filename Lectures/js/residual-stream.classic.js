/* AUTO-GENERATED offline classic bundle of widgets/residual-stream/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/residual-stream/logic.js
  var mountResidualStream = defineWidget({
    id: "residual-stream",
    rootClass: "rs-root",
    exportName: "mountResidualStream",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const stages = data.stages || [];
      const dim = data.dim != null ? data.dim : stages[0] && stages[0].vec.length || 6;
      const n = stages.length;
      const num = (v, d = 2) => typeof v !== "number" ? "" : Number.isInteger(v) ? String(v) : fmt(v, d);
      const SIDE = 50;
      const PAD = 16;
      const TOPROOM = 58;
      const laneY = TOPROOM + 36;
      const x0 = PAD + SIDE;
      const W = 540;
      const xEnd = W - PAD - SIDE;
      const slot = (xEnd - x0) / (n - 1);
      const cellW = 16, cellH = 11, cellGap = 1.5;
      const glyphH = dim * (cellH + cellGap) - cellGap;
      const cellFill = (v, maxAbs) => {
        const o = Math.max(0.18, Math.min(1, Math.abs(v) / (maxAbs || 1)));
        const base = v < 0 ? "var(--warm, #E8743B)" : "var(--accent, #2A6FDB)";
        return `color-mix(in srgb, ${base} ${Math.round(o * 100)}%, var(--bg-card, #fff))`;
      };
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg rs-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const txt = (xx, yy, s, attrs = {}) => {
        const t = el("text", { x: xx, y: yy, ...attrs }, svg);
        t.textContent = s;
        return t;
      };
      const defs = el("defs", {}, svg);
      const mk = (id, fill) => {
        const m = el("marker", {
          id,
          viewBox: "0 0 10 10",
          refX: "8",
          refY: "5",
          markerWidth: "6.5",
          markerHeight: "6.5",
          orient: "auto-start-reverse"
        }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 z", fill }, m);
      };
      mk("rs-flow", "var(--ink-3, #6B7280)");
      mk("rs-add", "var(--c-green, #3A8A5C)");
      layer("lane", 0);
      add("lane", txt(
        xEnd + SIDE - 2,
        20,
        labels.highwayLbl || "residual highway",
        {
          font: "700 11px var(--font-mono, monospace)",
          fill: "var(--accent-ink, #1B4FA0)",
          "text-anchor": "end"
        }
      ));
      add("lane", el("line", {
        x1: PAD,
        y1: laneY,
        x2: xEnd + 4,
        y2: laneY,
        fill: "none",
        stroke: "var(--accent, #2A6FDB)",
        "stroke-width": 3,
        opacity: 0.35,
        "marker-end": "url(#rs-flow)"
      }, svg));
      function glyph(parentLayer, vec, cx, opts = {}) {
        const faint = opts.faint;
        const maxAbs = Math.max(...vec.map(Math.abs), 1);
        const gx = cx - cellW / 2, gy0 = laneY - glyphH / 2;
        const g = el("g", opts.faint ? { opacity: 0.28 } : {}, svg);
        vec.forEach((v, i) => {
          const cy = gy0 + i * (cellH + cellGap);
          el("rect", {
            x: gx,
            y: cy,
            width: cellW,
            height: cellH,
            rx: 1.5,
            fill: "none",
            stroke: "var(--rule, #ddd)",
            "stroke-width": 0.5
          }, g);
          const fw = faint ? cellW : Math.max(2, Math.abs(v) / maxAbs * cellW);
          const cell = el("rect", {
            x: gx,
            y: cy,
            width: fw,
            height: cellH,
            rx: 1.5,
            fill: faint ? "var(--ink-4, #9CA3AF)" : v < 0 ? "var(--warm, #E8743B)" : "var(--accent, #2A6FDB)",
            stroke: "none"
          }, g);
          if (!faint) el("title", {}, cell).textContent = "dim " + i + " = " + num(v, 2);
        });
        add(parentLayer, g);
        return g;
      }
      stages.forEach((st, k) => {
        const cx = x0 + k * slot;
        layer("stage" + k, k);
        add("stage" + k, txt(
          cx,
          laneY + glyphH / 2 + 16,
          st.label || "",
          {
            font: "700 9.5px var(--font-mono, monospace)",
            fill: "var(--ink-2, #3D434E)",
            "text-anchor": "middle"
          }
        ));
        glyph("stage" + k, st.vec, cx);
        const normLane = k % 2 === 0 ? laneY - glyphH / 2 - 16 : laneY - glyphH / 2 - 4;
        add("stage" + k, txt(
          cx,
          normLane,
          (labels.normLbl || "\u2016x\u2016") + " = " + num(st.norm, 2),
          {
            font: "700 9px var(--font-mono, monospace)",
            fill: st.label && /LayerNorm/i.test(st.label) ? "var(--c-green-ink, #1F6B40)" : "var(--warm-ink, #B4521F)",
            "text-anchor": "middle"
          }
        ));
        if (st.delta) {
          const prev = stages[k - 1];
          if (prev) glyph("stage" + k, prev.vec, cx - 4, { faint: true });
          const mergeX = cx - cellW / 2 - 11;
          const glyphTop = laneY - glyphH / 2;
          const dcw = 8, dch = 4, dgap = 0.8;
          const dgH = dim * (dch + dgap) - dgap;
          const dgLabelY = 16;
          const dgy0 = dgLabelY + 5;
          const bx = mergeX - slot * 0.42;
          const dgx = bx - dcw / 2;
          const path = `M ${bx} ${dgy0 + dgH + 2} C ${bx} ${glyphTop - 10}, ${mergeX} ${glyphTop - 8}, ${mergeX} ${laneY - 8}`;
          const branch = el("path", {
            d: path,
            fill: "none",
            stroke: "var(--c-green, #3A8A5C)",
            "stroke-width": 1.5,
            "stroke-dasharray": "4 3",
            "marker-end": "url(#rs-add)"
          }, svg);
          add("stage" + k, branch);
          const dMaxAbs = Math.max(...st.delta.map(Math.abs), 1);
          const dGlyph = el("g", {}, svg);
          st.delta.forEach((v, i) => {
            el("rect", {
              x: dgx,
              y: dgy0 + i * (dch + dgap),
              width: dcw,
              height: dch,
              rx: 1,
              fill: cellFill(v, dMaxAbs),
              stroke: "var(--rule, #ddd)",
              "stroke-width": 0.4
            }, dGlyph);
          });
          add("stage" + k, dGlyph);
          add("stage" + k, txt(
            bx,
            dgLabelY,
            labels.deltaLbl || "sublayer(x)",
            {
              font: "700 8px var(--font-mono, monospace)",
              fill: "var(--c-green-ink, #1F6B40)",
              "text-anchor": "middle"
            }
          ));
          add("stage" + k, el("circle", {
            cx: mergeX,
            cy: laneY,
            r: 7,
            fill: "var(--bg-card, #fff)",
            stroke: "var(--c-green, #3A8A5C)",
            "stroke-width": 1.5
          }, svg));
          add("stage" + k, txt(
            mergeX,
            laneY + 3.5,
            labels.addLbl || "+",
            {
              font: "700 11px var(--font-mono, monospace)",
              fill: "var(--c-green-ink, #1F6B40)",
              "text-anchor": "middle"
            }
          ));
          const skipFrom = x0 + (k - 1) * slot + cellW / 2 + 2;
          const skipY = laneY + glyphH / 2 + 26;
          const skipRect = { x: PAD, y: laneY, w: W - 2 * PAD, h: glyphH / 2 + 40 };
          const seg = clampSegmentToRect(skipFrom, skipY, mergeX, skipY, skipRect) || { x1: skipFrom, y1: skipY, x2: mergeX, y2: skipY };
          const skip = el(
            "path",
            {
              d: `M ${seg.x1} ${laneY} C ${seg.x1} ${seg.y1}, ${seg.x2} ${seg.y1}, ${seg.x2} ${laneY}`,
              fill: "none",
              stroke: "var(--accent, #2A6FDB)",
              "stroke-width": 1.5,
              opacity: 0.5,
              "stroke-dasharray": "2 3"
            },
            svg
          );
          add("stage" + k, skip);
          add("stage" + k, txt(
            (skipFrom + mergeX) / 2,
            skipY + 12,
            labels.skipLbl || "skip: x passes through",
            {
              font: "600 8px var(--font-mono, monospace)",
              fill: "var(--accent-ink, #1B4FA0)",
              "text-anchor": "middle"
            }
          ));
        }
      });
      const deepest = laneY + glyphH / 2 + 26 + 18;
      const H = frameHeightFor(deepest, 12);
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
