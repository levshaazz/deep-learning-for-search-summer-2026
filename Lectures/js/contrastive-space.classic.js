/* AUTO-GENERATED offline classic bundle of widgets/contrastive-space/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/contrastive-space/logic.js
  var mountContrastiveSpace = defineWidget({
    id: "contrastive-space",
    rootClass: "ctrs-root",
    exportName: "mountContrastiveSpace",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const anchor = data.anchor || "cat";
      const tau = data.tau != null ? data.tau : 0.1;
      const margin = data.margin != null ? data.margin : 0.2;
      const simsP = data.sims && data.sims.positives || {};
      const simsN = data.sims && data.sims.negatives || {};
      const info = data.infoNCE || {};
      const trip = data.triplet || {};
      const cos = (c) => typeof c !== "number" ? "" : String(+c.toFixed(3)).replace(/^0\./, ".").replace(/^-0\./, "-.");
      const num4 = (c) => typeof c !== "number" ? "" : String(+c.toFixed(4));
      const items = [
        ...Object.entries(simsP).map(([word, c]) => ({ word, cos: c, kind: "pos" })),
        ...Object.entries(simsN).map(([word, c]) => ({ word, cos: c, kind: "neg" }))
      ].sort((a, b) => b.cos - a.cos);
      const posItem = info.positive || (items.find((i) => i.kind === "pos") || {}).word;
      const W = 480;
      const PAD = 16;
      const scTop = 22, scH = 250;
      const cx0 = W / 2, cy0 = scTop + scH / 2;
      const Rmax = Math.min(W / 2 - PAD, scH / 2) - 22;
      const Rmin = 46;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg ctrs-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const posItems = items.filter((it) => it.kind === "pos");
      const negItems = items.filter((it) => it.kind === "neg");
      const fanAngle = (idx, n, a0, a1) => n <= 1 ? (a0 + a1) / 2 : a0 + idx / (n - 1) * (a1 - a0);
      const angOf = (it) => {
        if (it.kind === "pos") {
          const i2 = posItems.indexOf(it);
          return fanAngle(i2, posItems.length, -Math.PI + 0.35, -0.35);
        }
        const i = negItems.indexOf(it);
        return fanAngle(i, negItems.length, 0.35, Math.PI - 0.35);
      };
      const rOrig = (it) => Rmin + (1 - Math.max(0, Math.min(1, it.cos))) * (Rmax - Rmin);
      const rTrained = (it) => {
        if (it.kind === "pos") {
          const i2 = posItems.indexOf(it), n2 = Math.max(1, posItems.length);
          return Rmin + 6 + i2 * 22;
        }
        const i = negItems.indexOf(it), n = Math.max(1, negItems.length);
        return Rmax - 4 - i * 4;
      };
      const CHARW = 6.3, LBL_H = 14, GAP = 5, DOT_R = 6;
      const lblText = (w) => String(w);
      const legW = 120, legH = 34, legX = W - PAD - legW, legY = scTop;
      const legBox = { x: legX, y: legY, w: legW, h: legH, cx: legX + legW / 2, cy: legY + legH / 2 };
      const placeAt = (it, r) => {
        const ang = angOf(it);
        return {
          ...it,
          px: cx0 + r * Math.cos(ang),
          py: cy0 + r * Math.sin(ang),
          ux: Math.cos(ang),
          uy: Math.sin(ang),
          cls: it.kind === "pos" ? "ctrs-pos" : "ctrs-neg"
        };
      };
      const segClosest = (px, py, x1, y1, x2, y2) => {
        const dx = x2 - x1, dy = y2 - y1;
        const L2 = dx * dx + dy * dy || 1;
        let t = ((px - x1) * dx + (py - y1) * dy) / L2;
        t = Math.max(0, Math.min(1, t));
        return { qx: x1 + t * dx, qy: y1 + t * dy };
      };
      const relaxLabels = (placedSet, arrowSet) => {
        const seeds = [];
        seeds.push({
          word: anchor,
          ref: { dx: cx0, dy: cy0 },
          ux: 0,
          uy: 1,
          off: 24,
          cls: "ctrs-anchor-lbl svg-halo",
          isAnchor: true
        });
        placedSet.forEach((p) => {
          let sux = p.ux, suy = p.uy, off;
          if (p.kind === "neg") {
            const rot = (p.uy <= 0 ? -1 : 1) * 0.9;
            const c = Math.cos(rot), s = Math.sin(rot);
            sux = p.ux * c - p.uy * s;
            suy = p.ux * s + p.uy * c;
            off = 34;
          } else {
            off = 30;
          }
          seeds.push({
            word: p.word,
            ref: { dx: p.px, dy: p.py },
            ux: sux,
            uy: suy,
            off,
            cls: `ctrs-pt-lbl svg-halo ${p.cls}`,
            isAnchor: false
          });
        });
        const lab = seeds.map((s) => ({
          w: Math.max(18, lblText(s.word).length * CHARW + 6),
          h: LBL_H,
          cx: s.ref.dx + s.ux * s.off,
          cy: s.ref.dy + s.uy * s.off,
          ...s
        }));
        const allDots = [{ dx: cx0, dy: cy0, r: 8 }, ...placedSet.map((p) => ({ dx: p.px, dy: p.py, r: DOT_R }))];
        const ARR_PAD = 8;
        for (let iter = 0; iter < 360; iter++) {
          for (let i = 0; i < lab.length; i++) {
            for (let j = i + 1; j < lab.length; j++) {
              const a = lab[i], b = lab[j];
              const ox = (a.w + b.w) / 2 + GAP - Math.abs(a.cx - b.cx);
              const oy = (a.h + b.h) / 2 + GAP - Math.abs(a.cy - b.cy);
              if (ox > 0 && oy > 0) {
                if (oy <= ox) {
                  const push = oy / 2 + 0.4, dir = a.cy <= b.cy ? -1 : 1;
                  a.cy += dir * push;
                  b.cy -= dir * push;
                } else {
                  const push = ox / 2 + 0.4, dir = a.cx <= b.cx ? -1 : 1;
                  a.cx += dir * push;
                  b.cx -= dir * push;
                }
              }
            }
          }
          for (const a of lab) {
            for (const d of allDots) {
              const ox = a.w / 2 + d.r + GAP - Math.abs(a.cx - d.dx);
              const oy = a.h / 2 + d.r + GAP - Math.abs(a.cy - d.dy);
              if (ox > 0 && oy > 0) {
                if (oy <= ox) a.cy += (a.cy <= d.dy ? -1 : 1) * (oy + 0.4);
                else a.cx += (a.cx <= d.dx ? -1 : 1) * (ox + 0.4);
              }
            }
            {
              const ox = a.w / 2 + legBox.w / 2 + GAP - Math.abs(a.cx - legBox.cx);
              const oy = a.h / 2 + legBox.h / 2 + GAP - Math.abs(a.cy - legBox.cy);
              if (ox > 0 && oy > 0) {
                if (oy <= ox) a.cy += (a.cy <= legBox.cy ? -1 : 1) * (oy + 0.4);
                else a.cx += (a.cx <= legBox.cx ? -1 : 1) * (ox + 0.4);
              }
            }
            for (const ar of arrowSet) {
              const { qx, qy } = segClosest(a.cx, a.cy, ar.sx, ar.sy, ar.ex, ar.ey);
              const ox = a.w / 2 + ARR_PAD + GAP - Math.abs(a.cx - qx);
              const oy = a.h / 2 + ARR_PAD + GAP - Math.abs(a.cy - qy);
              if (ox > 0 && oy > 0) {
                if (oy <= ox) a.cy += (a.cy <= qy ? -1 : 1) * (oy + 0.4);
                else a.cx += (a.cx <= qx ? -1 : 1) * (ox + 0.4);
              }
            }
          }
          for (const a of lab) {
            const tx = a.ref.dx + a.ux * a.off, ty = a.ref.dy + a.uy * a.off;
            a.cx += (tx - a.cx) * 0.01;
            a.cy += (ty - a.cy) * 0.01;
          }
        }
        lab.forEach((a) => {
          a.cx = Math.max(PAD + a.w / 2 + 2, Math.min(W - PAD - a.w / 2 - 2, a.cx));
          a.cy = Math.max(scTop + a.h / 2 + 2, Math.min(scTop + scH - a.h / 2 - 2, a.cy));
        });
        return lab;
      };
      const drawScatter = (layerName, placedSet, arrowSet) => {
        placedSet.forEach((p) => {
          const g = el("g", {}, svg);
          el("line", { x1: cx0, y1: cy0, x2: p.px, y2: p.py, class: `ctrs-ray ${p.cls}` }, g);
          el("circle", { cx: p.px, cy: p.py, r: 6, class: `ctrs-pt ${p.cls}` }, g);
          add(layerName, g);
        });
        add(layerName, el("circle", { cx: cx0, cy: cy0, r: 8, class: "ctrs-anchor" }, svg));
        const lab = relaxLabels(placedSet, arrowSet);
        lab.forEach((a) => {
          const onLeft = a.cx >= a.ref.dx;
          const tx = onLeft ? a.cx - a.w / 2 + 3 : a.cx + a.w / 2 - 3;
          const ty = a.cy + 4;
          add(layerName, el("line", {
            x1: a.ref.dx,
            y1: a.ref.dy,
            x2: tx,
            y2: a.cy,
            class: "ctrs-leader",
            fill: "none"
          }, svg));
          add(layerName, el("text", { x: tx, y: ty, class: a.cls, "text-anchor": onLeft ? "start" : "end" }, svg)).textContent = a.word;
        });
      };
      layer("scatter", 0);
      [Rmin, Rmax].forEach((r) => add("scatter", el(
        "circle",
        { cx: cx0, cy: cy0, r, class: "ctrs-arc", fill: "none" },
        svg
      )));
      const placed = items.map((it) => placeAt(it, rOrig(it)));
      layer("forces", 2);
      const ARRLEN = 20;
      const arrows = placed.map((p) => {
        const pull = p.kind === "pos";
        const sx = pull ? p.px - p.ux * 6 : p.px + p.ux * 6;
        const sy = pull ? p.py - p.uy * 6 : p.py + p.uy * 6;
        const ex = pull ? sx - p.ux * ARRLEN : sx + p.ux * ARRLEN;
        const ey = pull ? sy - p.uy * ARRLEN : sy + p.uy * ARRLEN;
        const cls = pull ? "ctrs-arr ctrs-arr-pull" : "ctrs-arr ctrs-arr-push";
        add("forces", el("line", {
          x1: sx,
          y1: sy,
          x2: ex,
          y2: ey,
          class: cls,
          "marker-end": pull ? "url(#ctrs-pull)" : "url(#ctrs-push)"
        }, svg));
        return { sx, sy, ex, ey };
      });
      drawScatter("scatter", placed, arrows);
      layer("trained", 3);
      [Rmin, Rmax].forEach((r) => add("trained", el(
        "circle",
        { cx: cx0, cy: cy0, r, class: "ctrs-arc", fill: "none" },
        svg
      )));
      const placedTrained = items.map((it) => placeAt(it, rTrained(it)));
      drawScatter("trained", placedTrained, []);
      layer("legend", 0);
      add("legend", el("rect", {
        x: legX,
        y: legY,
        width: legW,
        height: legH,
        rx: 6,
        class: "ctrs-legbox"
      }, svg));
      add("legend", el("circle", { cx: legX + 12, cy: legY + 11, r: 5, class: "ctrs-pt ctrs-pos" }, svg));
      add("legend", el("text", { x: legX + 22, y: legY + 15, class: "ctrs-leglbl" }, svg)).textContent = labels.posLeg || "positive";
      add("legend", el("circle", { cx: legX + 12, cy: legY + 26, r: 5, class: "ctrs-pt ctrs-neg" }, svg));
      add("legend", el("text", { x: legX + 22, y: legY + 30, class: "ctrs-leglbl" }, svg)).textContent = labels.negLeg || "negative";
      const defs = el("defs", {}, svg);
      [["ctrs-pull", "ctrs-arrhead-pull"], ["ctrs-push", "ctrs-arrhead-push"]].forEach(([id, cls]) => {
        const m = el("marker", {
          id,
          viewBox: "0 0 10 10",
          refX: "8",
          refY: "5",
          markerWidth: "6",
          markerHeight: "6",
          orient: "auto-start-reverse"
        }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 z", class: cls }, m);
      });
      layer("bars", 1);
      const barsTop = scTop + scH + 24;
      const barRow = 24, barH = 14;
      const barX = PAD + 86;
      const barMaxW = W - barX - 60;
      add("bars", el("text", { x: PAD, y: barsTop - 8, class: "ctrs-barshead" }, svg)).textContent = labels.barsHead || "cosine to \u201C" + anchor + "\u201D \u2014 Sir Cosine\u2019s ruler";
      items.forEach((it, i) => {
        const cy = barsTop + i * barRow;
        const g = el("g", {}, svg);
        el("text", {
          x: barX - 10,
          y: cy + barH - 2,
          class: `ctrs-pairlbl ctrs-${it.kind}`,
          "text-anchor": "end"
        }, g).textContent = it.word;
        el("rect", { x: barX, y: cy, width: barMaxW, height: barH, rx: 3, class: "ctrs-bartrack" }, g);
        const frac = Math.max(0, Math.min(1, it.cos));
        el("rect", {
          x: barX,
          y: cy,
          width: Math.max(2, frac * barMaxW),
          height: barH,
          rx: 3,
          class: `ctrs-barfill ctrs-bar-${it.kind}`
        }, g);
        el("text", { x: barX + barMaxW + 8, y: cy + barH - 2, class: "ctrs-barval" }, g).textContent = cos(it.cos);
        add("bars", g);
      });
      const barsBottom = barsTop + items.length * barRow;
      layer("loss", 4);
      const lossTop = barsBottom + 14;
      add("loss", el("rect", {
        x: PAD,
        y: lossTop,
        width: W - 2 * PAD,
        height: 78,
        rx: 8,
        class: "ctrs-lossbox"
      }, svg));
      add("loss", el("text", { x: PAD + 12, y: lossTop + 20, class: "ctrs-loss-head" }, svg)).textContent = labels.infoHead || "InfoNCE  (softmax over cosines, \u03C4 = " + tau + ")";
      add("loss", el("text", { x: PAD + 12, y: lossTop + 38, class: "ctrs-loss-line" }, svg)).textContent = (labels.infoLine || "P(positive \u201C{p}\u201D) = {pp}   \u2192   loss = {loss}").replace("{p}", posItem || "").replace("{pp}", num4(info.pPositive)).replace("{loss}", num4(info.loss));
      add("loss", el("text", { x: PAD + 12, y: lossTop + 58, class: "ctrs-loss-head2" }, svg)).textContent = labels.tripHead || "triplet  (margin = " + margin + ", hardest neg)";
      add("loss", el("text", { x: PAD + 12, y: lossTop + 72, class: "ctrs-loss-line2" }, svg)).textContent = (labels.tripLine || "max(0, margin \u2212 (cos\u207A \u2212 cos\u207B)) = {loss}  \u2014 already satisfied").replace("{loss}", num4(trip.loss));
      const H = frameHeightFor(lossTop + 78, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        const shown = {
          scatter: k >= 0 && k < 3,
          // original layout: steps 0,1,2; gone once trained
          forces: k === 2,
          // arrows live only on the original positions, at the force step
          trained: k >= 3,
          // trained layout: the dots have landed
          bars: k >= 1,
          legend: true,
          loss: k >= 4
        };
        for (const name in layers) {
          const on = name in shown ? shown[name] : k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        svg.classList.toggle("ctrs-trained", k >= 3);
      };
    }
  });
})();
