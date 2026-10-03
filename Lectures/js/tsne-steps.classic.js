/* AUTO-GENERATED offline classic bundle of widgets/tsne-steps/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function padDomain(min, max, frac = 0.08) {
    let span = max - min;
    if (!(span > 0)) span = Math.abs(min) || 1;
    const p = span * frac;
    return { min: min - p, max: max + p, span: max - min + 2 * p };
  }
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

  // widgets/tsne-steps/logic.js
  var GROUP_COLOR = {
    animal: "var(--accent, #2A6FDB)",
    royalty: "var(--c-violet, #7D5BA6)"
  };
  var P_COLOR = "var(--accent, #2A6FDB)";
  var Q_COLOR = "var(--warm-ink, #B4521F)";
  var mountTsneSteps = defineWidget({
    id: "tsne-steps",
    rootClass: "tss-root",
    exportName: "mountTsneSteps",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const words = data.words || [];
      const groups = data.groups || [];
      const ai = data.anchorIndex || 0;
      const n = words.length;
      const cond = data.conditional || {};
      const pRow = cond.pRow || [];
      const qRow = data.lowD && data.lowD.anchorRow || [];
      const Y = data.lowD && data.lowD.Y || [];
      const grad = data.gradient && data.gradient.all || [];
      const colorOf = (i) => GROUP_COLOR[groups[i]] || "var(--ink-3, #6B7280)";
      const W = 480;
      const PAD_T = 34;
      const plotH = 300;
      const GAP = 20;
      const box = { x: 14, y: PAD_T, w: W - 28, h: plotH };
      const barBox = { x: box.x, y: box.y, w: 220, h: box.h };
      const sctBox = {
        x: barBox.x + barBox.w + GAP,
        y: box.y,
        // right: low-D scatter
        w: box.x + box.w - (barBox.x + barBox.w + GAP),
        h: box.h
      };
      const bandY = box.y + box.h + 12;
      const bandH = 44;
      const H = frameHeightFor(bandY + bandH + 8, 8);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg tss-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const ttl = el("text", { x: box.x, y: box.y - 12, class: "tss-title" }, svg);
      const sub = el("text", { x: box.x + box.w, y: box.y - 12, class: "tss-sub", "text-anchor": "end" }, svg);
      layer("barpanel", 0, 3);
      add("barpanel", el("text", { x: barBox.x, y: barBox.y + 12, class: "tss-panellbl" }, svg)).textContent = (labels.affinityFrom || "affinity from") + ' "' + words[ai] + '"';
      const rows = [];
      for (let j = 0; j < n; j++) if (j !== ai) rows.push(j);
      const rowH = (barBox.h - 26) / rows.length;
      const barX = barBox.x + 64;
      const barMaxW = barBox.x + barBox.w - barX - 30;
      const pMax = Math.max(...pRow, ...qRow, 1e-6);
      layer("pbars", 0, 3);
      layer("qbars", 2, 3);
      const pBarEls = {}, qBarEls = {}, pValEls = {};
      rows.forEach((j, r) => {
        const cy2 = barBox.y + 20 + r * rowH;
        add("pbars", el("text", {
          x: barBox.x,
          y: cy2 + rowH * 0.62,
          class: "tss-wordlbl",
          fill: colorOf(j)
        }, svg)).textContent = words[j];
        const pw = pRow[j] / pMax * barMaxW;
        pBarEls[j] = add("pbars", el("rect", {
          x: barX,
          y: cy2 + rowH * 0.16,
          width: Math.max(1, pw),
          height: rowH * 0.34,
          rx: 2,
          class: "tss-pbar",
          fill: P_COLOR
        }, svg));
        pValEls[j] = add("pbars", el("text", {
          x: barX + barMaxW + 4,
          y: cy2 + rowH * 0.46,
          class: "tss-pval"
        }, svg));
        pValEls[j].textContent = pRow[j].toFixed(3);
        const qw = qRow[j] / pMax * barMaxW;
        qBarEls[j] = add("qbars", el("rect", {
          x: barX,
          y: cy2 + rowH * 0.52,
          width: Math.max(1, qw),
          height: rowH * 0.3,
          rx: 2,
          class: "tss-qbar",
          fill: Q_COLOR
        }, svg));
      });
      layer("perp", 0, 0);
      const perpLbl = add("perp", el("text", {
        x: barBox.x,
        y: barBox.y + barBox.h - 4,
        class: "tss-perp"
      }, svg));
      if (typeof cond.perplexity === "number" && typeof cond.sigma === "number")
        perpLbl.textContent = "\u03C3=" + cond.sigma.toFixed(2) + " \xB7 " + (labels.perplexityLbl || "perplexity") + "=" + cond.perplexity.toFixed(0) + " \u2248 " + (labels.effNeighbours || "eff. neighbours");
      layer("pqlegend", 2, 3);
      const legG = add("pqlegend", el("g", {}, svg));
      el("rect", { x: barBox.x, y: barBox.y + barBox.h - 12, width: 9, height: 9, rx: 2, fill: P_COLOR }, legG);
      el("text", { x: barBox.x + 13, y: barBox.y + barBox.h - 4, class: "tss-leglbl" }, legG).textContent = "p (high-D)";
      el("rect", { x: barBox.x + 92, y: barBox.y + barBox.h - 12, width: 9, height: 9, rx: 2, fill: Q_COLOR }, legG);
      el("text", { x: barBox.x + 105, y: barBox.y + barBox.h - 4, class: "tss-leglbl" }, legG).textContent = "q (low-D)";
      layer("sctpanel", 1);
      add("sctpanel", el("rect", {
        x: sctBox.x,
        y: sctBox.y,
        width: sctBox.w,
        height: sctBox.h,
        class: "tss-frame"
      }, svg));
      add("sctpanel", el("text", {
        x: sctBox.x + sctBox.w / 2,
        y: sctBox.y - 2,
        class: "tss-panellbl",
        "text-anchor": "middle"
      }, svg)).textContent = labels.lowDLayout || "low-D layout";
      const xs = Y.map((p) => p[0]), ys = Y.map((p) => p[1]);
      const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.16);
      const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
      const side = Math.min(sctBox.w, sctBox.h) - 8;
      const ox = sctBox.x + (sctBox.w - side) / 2, oy = sctBox.y + (sctBox.h - side) / 2;
      const sx = (vx) => ox + (vx - dx.min) / dx.span * side;
      const sy = (vy) => oy + side - (vy - dy.min) / dy.span * side;
      layer("ttail", 1, 1);
      const insW = side * 0.92, insH = 52, insX = ox + (side - insW) / 2, insY = oy + side - insH - 4;
      add("ttail", el("rect", { x: insX, y: insY, width: insW, height: insH, class: "tss-inset" }, svg));
      const tcurve = (d) => 1 / (1 + d * d);
      const gcurve = (d) => Math.exp(-d * d);
      const DMAX = 3.2;
      const cxAt = (d) => insX + d / DMAX * insW;
      const cyAt = (v) => insY + insH - v * (insH - 6) - 3;
      const pathOf = (fn) => {
        let dStr = "";
        for (let s = 0; s <= 40; s++) {
          const d = s / 40 * DMAX;
          dStr += (s === 0 ? "M" : "L") + cxAt(d).toFixed(1) + " " + cyAt(fn(d)).toFixed(1) + " ";
        }
        return dStr.trim();
      };
      add("ttail", el("path", { d: pathOf(gcurve), class: "tss-gauss", fill: "none" }, svg));
      add("ttail", el("path", { d: pathOf(tcurve), class: "tss-tstud", fill: "none", stroke: Q_COLOR }, svg));
      add("ttail", el("text", {
        x: insX + insW - 3,
        y: insY + 11,
        class: "tss-curvelbl",
        fill: Q_COLOR,
        "text-anchor": "end"
      }, svg)).textContent = "Student-t";
      add("ttail", el("text", {
        x: insX + insW - 3,
        y: insY + insH - 4,
        class: "tss-curvelbl",
        "text-anchor": "end"
      }, svg)).textContent = labels.heavyTail || "heavy tail";
      layer("dots", 1);
      const dots = [];
      Y.forEach((p, i) => {
        dots.push(add("dots", el("circle", {
          cx: sx(p[0]),
          cy: sy(p[1]),
          r: i === ai ? 6 : 4.5,
          class: i === ai ? "tss-dot tss-anchor" : "tss-dot",
          fill: colorOf(i),
          stroke: "var(--bg-card, #fff)",
          "stroke-width": 1
        }, svg)));
      });
      add("dots", el("circle", {
        cx: sx(Y[ai][0]),
        cy: sy(Y[ai][1]),
        r: 10,
        class: "tss-halo",
        fill: "none",
        stroke: colorOf(ai)
      }, svg));
      layer("forces", 3, 3);
      const gmax = Math.max(1e-9, ...grad.map((g) => Math.hypot(g[0], g[1])));
      const ARROW = side * 0.2;
      const arrows = [];
      Y.forEach((p, i) => {
        const g = grad[i] || [0, 0];
        const gm = Math.hypot(g[0], g[1]) || 1e-9;
        const len = gm / gmax * ARROW;
        const ux = -g[0] / gm * len, uy = g[1] / gm * len;
        const x1 = sx(p[0]), y1 = sy(p[1]);
        const x2 = x1 + ux, y2 = y1 + uy;
        const seg = clampSegmentToRect(x1, y1, x2, y2, sctBox) || { x1, y1, x2, y2 };
        const g2 = el("g", {}, svg);
        el("line", {
          x1: seg.x1,
          y1: seg.y1,
          x2: seg.x2,
          y2: seg.y2,
          class: "tss-force",
          "marker-end": "url(#tss-arrowhead)"
        }, g2);
        arrows.push(add("forces", g2));
      });
      const defs = el("defs", {}, svg);
      const mk = el("marker", {
        id: "tss-arrowhead",
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 6,
        markerHeight: 6,
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0 0 L10 5 L0 10 z", class: "tss-arrowfill" }, mk);
      layer("gradmath", 3, 3);
      add("gradmath", el("text", {
        x: box.x + box.w / 2,
        y: bandY + 14,
        class: "tss-gradformula",
        "text-anchor": "middle"
      }, svg)).textContent = labels.gradFormula || "\u2202C/\u2202y\u1D62 = 4 \u03A3\u2C7C (p_ij\u2212q_ij)(y\u1D62\u2212y\u2C7C)(1+\u2016y\u1D62\u2212y\u2C7C\u2016\xB2)\u207B\xB9";
      const keyY = bandY + 36;
      add("gradmath", el("rect", {
        x: box.x + 20,
        y: keyY - 8,
        width: 9,
        height: 9,
        rx: 2,
        class: "tss-keyswatch tss-key-attract"
      }, svg));
      add("gradmath", el("text", { x: box.x + 33, y: keyY, class: "tss-keylbl" }, svg)).textContent = labels.attractLbl || "p > q \u2192 pull together (attract)";
      add("gradmath", el("rect", {
        x: box.x + box.w / 2 + 20,
        y: keyY - 8,
        width: 9,
        height: 9,
        rx: 2,
        class: "tss-keyswatch tss-key-repel"
      }, svg));
      add("gradmath", el("text", { x: box.x + box.w / 2 + 33, y: keyY, class: "tss-keylbl" }, svg)).textContent = labels.repelLbl || "p < q \u2192 push apart (repel)";
      layer("klhead", 2, 2);
      const klHead = add("klhead", el("text", {
        x: sctBox.x + sctBox.w / 2,
        y: sctBox.y + sctBox.h - 6,
        class: "tss-klhead",
        "text-anchor": "middle"
      }, svg));
      if (typeof data.kl === "number")
        klHead.textContent = "KL(P\u2016Q) = " + data.kl.toFixed(4);
      layer("caveat", 4, 4);
      const cavX = barBox.x, cavTop = barBox.y + 24;
      add("caveat", el("text", { x: cavX, y: barBox.y + 12, class: "tss-panellbl" }, svg)).textContent = labels.caveatHead || "read a t-SNE map with care";
      const cavLines = [labels.caveatPerp, labels.caveatGaps, labels.caveatTrust].filter(Boolean);
      const wrapW = barBox.w + GAP + 4;
      const approxCharW = 6.1;
      const maxChars = Math.max(8, Math.floor(wrapW / approxCharW));
      let cy = cavTop;
      cavLines.forEach((line) => {
        const words2 = line.split(" ");
        let cur = "";
        const rows2 = [];
        for (const w of words2) {
          const trial = cur ? cur + " " + w : w;
          if (trial.length > maxChars && cur) {
            rows2.push(cur);
            cur = w;
          } else cur = trial;
        }
        if (cur) rows2.push(cur);
        rows2.forEach((r, ri) => {
          if (ri === 0) add("caveat", el("circle", {
            cx: cavX + 3,
            cy: cy - 3,
            r: 2,
            class: "tss-cavdot"
          }, svg));
          add("caveat", el("text", { x: cavX + 12, y: cy, class: "tss-cavline" }, svg)).textContent = r;
          cy += 15;
        });
        cy += 5;
      });
      const caveat = add("caveat", el("text", {
        x: sctBox.x + sctBox.w / 2,
        y: sctBox.y + sctBox.h - 6,
        class: "tss-caveat",
        "text-anchor": "middle"
      }, svg));
      caveat.textContent = labels.tsneCaveat || "perplexity changes the picture";
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const node of L.nodes) node.classList.toggle("is-hidden", !on);
        }
        if (k === 0) {
          ttl.textContent = labels.t0 || "Gaussian affinity";
          sub.textContent = labels.subHighD || "high-D";
        } else if (k === 1) {
          ttl.textContent = labels.t1 || "Student-t affinity";
          sub.textContent = labels.subLowD || "low-D";
        } else if (k === 2) {
          ttl.textContent = labels.t2 || "match P to Q";
          sub.textContent = labels.subKL || "minimise KL";
        } else if (k === 3) {
          ttl.textContent = labels.t3 || "gradient = forces";
          sub.textContent = labels.subForce || "points move";
        } else {
          ttl.textContent = labels.t4 || "read with care";
          sub.textContent = labels.subCaveat || "P7";
        }
      };
    }
  });
})();
