/* AUTO-GENERATED offline classic bundle of widgets/glove-cooccur/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/glove-cooccur/logic.js
  var mountGloveCooccur = defineWidget({
    id: "glove-cooccur",
    rootClass: "gv-root",
    exportName: "mountGloveCooccur",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const vocab = data.vocab || [];
      const corpus = data.corpus || [];
      const X = data.X || [];
      const F = data.F || [];
      const cells = data.cells || [];
      const fCurve = data.fCurve || [];
      const worked = data.worked || [];
      const mapData = data.map || { points: [] };
      const loss = data.loss || {};
      const xMax = data.xMax || 10;
      const n = vocab.length;
      const num = (x, d = 2) => typeof x !== "number" ? "" : Number.isInteger(x) ? String(x) : fmt(x, d);
      const Wd = 900;
      const PAD = 18;
      const P0_Y = 14;
      const P1_Y = 384;
      const P2_Y = 600;
      const P3_Y = 824;
      const P4_Y = 1114;
      const P4_H = 150;
      const H = frameHeightFor(P4_Y + P4_H, 16);
      const svg = el("svg", {
        viewBox: `0 0 ${Wd} ${H}`,
        class: "wgt-svg gv-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const text = (name, x, y, cls, anchor, str) => {
        const t = el("text", { x, y, class: cls, "text-anchor": anchor || "start" }, svg);
        t.textContent = str;
        return add(name, t);
      };
      const panelHead = (name, x, y, head, sub) => {
        text(name, x, y, "gv-head", "start", head || "");
        if (sub) text(name, x, y + 15, "gv-subhead", "start", sub);
      };
      layer("corpus", 0);
      panelHead("corpus", PAD, P0_Y + 12, labels.corpusHead || "mini-corpus + sliding window");
      const corpusTop = P0_Y + 42;
      const lineH = 18;
      const maxLines = Math.min(corpus.length, 8);
      corpus.slice(0, maxLines).forEach((line, i) => {
        const t = text("corpus", PAD, corpusTop + i * lineH, "gv-corpus", "start", line);
        if (i === 0) {
          const wpx = Math.min(120, line.split(" ").slice(0, 2).join(" ").length * 7 + 10);
          const r = el("rect", {
            x: PAD - 4,
            y: corpusTop + i * lineH - 12,
            width: wpx,
            height: 16,
            rx: 4,
            class: "gv-window"
          }, svg);
          svg.insertBefore(r, t);
          add("corpus", r);
        }
      });
      layer("matrix", 0);
      const mX = 360, mY = P0_Y + 12;
      panelHead("matrix", mX, mY, labels.matrixHead || "co-occurrence matrix X");
      const gridLeft = mX + 60;
      const csz = Math.min(18, Math.floor((Wd - PAD - gridLeft) / n));
      const gridTop = mY + 56;
      const gridBottom = gridTop + n * csz;
      const maxX = Math.max(1e-6, ...X.flat());
      vocab.forEach((w, i) => {
        text("matrix", gridLeft - 4, gridTop + i * csz + csz - 2, "gv-mlabel", "end", w.slice(0, 7));
        const cxh = gridLeft + i * csz + csz / 2;
        const ct = el("text", {
          x: cxh,
          y: gridTop - 6,
          class: "gv-mlabel gv-mcol",
          "text-anchor": "start",
          transform: `rotate(-60 ${cxh} ${gridTop - 6})`
        }, svg);
        ct.textContent = w.slice(0, 7);
        add("matrix", ct);
      });
      if (labels.matrixSub)
        text("matrix", mX, gridBottom + 16, "gv-subhead", "start", labels.matrixSub);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const v = X[i][j];
          const rect = el("rect", {
            x: gridLeft + j * csz,
            y: gridTop + i * csz,
            width: csz - 1,
            height: csz - 1,
            rx: 1.5,
            class: "gv-xcell",
            "data-role": "xcount"
          }, svg);
          const mag = v > 0 ? Math.min(1, v / maxX) : 0;
          rect.setAttribute("fill", v > 0 ? `color-mix(in srgb, var(--accent) ${Math.round(15 + mag * 75)}%, var(--bg-card))` : "var(--bg-inset)");
          add("matrix", rect);
        }
      }
      layer("curve", 1);
      panelHead("curve", PAD, P1_Y + 12, labels.curveHead || "weighting f(x)", labels.curveSub);
      const cAxX = PAD + 36, cAxY0 = P1_Y + 44, cAxH = 130, cAxW = 360;
      const cAxY1 = cAxY0 + cAxH;
      const xs = fCurve.map((p) => p.x);
      const xd = padDomain(0, Math.max(...xs), 0.02);
      const sx = (x) => cAxX + (x - xd.min) / xd.span * cAxW;
      const sy = (f) => cAxY1 - f * cAxH;
      add("curve", el("line", { x1: cAxX, y1: cAxY1, x2: cAxX + cAxW, y2: cAxY1, class: "gv-axis" }, svg));
      add("curve", el("line", { x1: cAxX, y1: cAxY0, x2: cAxX, y2: cAxY1, class: "gv-axis" }, svg));
      text("curve", cAxX - 6, cAxY0 + 4, "gv-tick", "end", "1");
      text("curve", cAxX - 6, cAxY1 + 4, "gv-tick", "end", "0");
      text("curve", cAxX - 22, (cAxY0 + cAxY1) / 2, "gv-axlabel", "middle", "f");
      text("curve", cAxX + cAxW, cAxY1 + 16, "gv-axlabel", "end", "x");
      add("curve", el("line", { x1: cAxX, y1: cAxY0, x2: cAxX + cAxW, y2: cAxY0, class: "gv-caplevel" }, svg));
      text("curve", cAxX + cAxW - 4, cAxY0 - 4, "gv-caplabel", "end", labels.capLabel || "capped at 1");
      const xmaxPx = sx(xMax);
      add("curve", el("line", { x1: xmaxPx, y1: cAxY0, x2: xmaxPx, y2: cAxY1, class: "gv-xmax" }, svg));
      text("curve", xmaxPx, cAxY1 + 16, "gv-tick", "middle", labels.xMaxTick || "x_max");
      const pts = fCurve.map((p) => `${sx(p.x).toFixed(1)},${sy(p.f).toFixed(1)}`).join(" ");
      add("curve", el("polyline", { points: pts, class: "gv-fcurve", fill: "none" }, svg));
      const seen = /* @__PURE__ */ new Set();
      cells.forEach((c) => {
        const key = `${c.x.toFixed(3)}`;
        if (seen.has(key)) return;
        seen.add(key);
        add("curve", el("circle", {
          cx: sx(c.x),
          cy: sy(c.f),
          r: 2.6,
          class: "gv-fdot",
          "data-role": "fvalue"
        }, svg));
      });
      layer("obj", 2);
      panelHead("obj", PAD, P2_Y + 12, labels.objHead || "objective \xB7 worked pair");
      const we = worked.find((w) => w.i === "king" && w.j === "queen") || worked[0] || {};
      const eqY = P2_Y + 52;
      const eqX = PAD + 4;
      text("obj", eqX, eqY, "gv-eqword", "start", `${we.i || ""} \xB7 ${we.j || ""}`);
      text(
        "obj",
        eqX,
        eqY + 24,
        "gv-eq",
        "start",
        `w\xB7w\u0303 (${num(we.dot, 3)}) + b (${num(we.bi, 3)}) + b\u0303 (${num(we.bj, 3)})  =  ${num(we.model, 3)}`
      );
      text(
        "obj",
        eqX,
        eqY + 48,
        "gv-eq",
        "start",
        `\u2248  log X  =  log(${num(we.X, 3)})  =  ${num(we.logX, 3)}`
      );
      const chips = [
        { lab: labels.xCell || "X", val: num(we.X, 3), role: "xcount", cls: "gv-chip-x" },
        { lab: labels.logLabel || "log X", val: num(we.logX, 3), role: "logx", cls: "gv-chip-log" },
        { lab: labels.fLabel || "f(X)", val: num(we.f, 3), role: "fvalue", cls: "gv-chip-f" },
        { lab: labels.modelLabel || "model", val: num(we.model, 3), role: "model", cls: "gv-chip-m" },
        { lab: labels.errLabel || "weighted error", val: num(we.weightedErr, 5), role: "werr", cls: "gv-chip-e" }
      ];
      const chW = 162, chH = 44, chGap = 12, chY = eqY + 78;
      chips.forEach((c, i) => {
        const cx = eqX + i * (chW + chGap);
        const g = el("g", {}, svg);
        el("rect", {
          x: cx,
          y: chY,
          width: chW,
          height: chH,
          rx: 6,
          class: `gv-chip ${c.cls}`,
          "data-role": c.role
        }, g);
        el("text", { x: cx + 10, y: chY + 17, class: "gv-chiplab" }, g).textContent = c.lab;
        el("text", { x: cx + 10, y: chY + 36, class: "gv-chipval" }, g).textContent = c.val;
        add("obj", g);
      });
      layer("map", 3);
      panelHead("map", PAD, P3_Y + 12, labels.mapHead || "factorise X \u2192 the map", labels.mapSub);
      const mapPts = mapData.points || [];
      const pX = PAD + 30, pY0 = P3_Y + 44, pW = 470, pH = 220;
      const pY1 = pY0 + pH;
      const exs = mapPts.map((p) => p.x), eys = mapPts.map((p) => p.y);
      const dx = padDomain(Math.min(...exs), Math.max(...exs), 0.12);
      const dy = padDomain(Math.min(...eys), Math.max(...eys), 0.12);
      const psx = (x) => pX + (x - dx.min) / dx.span * pW;
      const psy = (y) => pY1 - (y - dy.min) / dy.span * pH;
      add("map", el("rect", {
        x: pX,
        y: pY0,
        width: pW,
        height: pH,
        rx: 6,
        class: "gv-mapframe",
        fill: "none"
      }, svg));
      const ROYAL = /* @__PURE__ */ new Set(["king", "queen", "kingdom", "rules", "throne", "prince"]);
      const PEOPLE = /* @__PURE__ */ new Set(["man", "woman"]);
      const ANIMAL = /* @__PURE__ */ new Set(["cat", "dog", "chases"]);
      const catOf = (w) => ROYAL.has(w) ? "royal" : PEOPLE.has(w) ? "people" : ANIMAL.has(w) ? "animal" : "structure";
      const dots = mapPts.map((p) => ({ w: p.w, dx: psx(p.x), dy: psy(p.y), cat: catOf(p.w) }));
      const DOT_MIN = 2 * 5 + 1.5;
      for (let iter = 0; iter < 80; iter++) {
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const a = dots[i], b = dots[j];
            let vx = b.dx - a.dx, vy = b.dy - a.dy;
            let dist = Math.hypot(vx, vy);
            if (dist < DOT_MIN) {
              if (dist < 1e-3) {
                vx = i - j || 1;
                vy = (i + j) % 2 ? 1 : -1;
                dist = Math.hypot(vx, vy);
              }
              const push = (DOT_MIN - dist) / 2 + 0.3;
              vx /= dist;
              vy /= dist;
              a.dx -= vx * push;
              a.dy -= vy * push;
              b.dx += vx * push;
              b.dy += vy * push;
            }
          }
        }
      }
      dots.forEach((d) => {
        d.dx = Math.max(pX + 5, Math.min(pX + pW - 5, d.dx));
        d.dy = Math.max(pY0 + 5, Math.min(pY1 - 5, d.dy));
      });
      const DOT_R = 5;
      const LBL_H = 12, GAP = 4, CHARW = 5;
      const lblText = (w) => w.slice(0, 8);
      const cenX = dots.reduce((s, d) => s + d.dx, 0) / (dots.length || 1);
      const cenY = dots.reduce((s, d) => s + d.dy, 0) / (dots.length || 1);
      const GOLDEN = 2.399963;
      const lab = dots.map((d, idx) => {
        const w = Math.max(16, lblText(d.w).length * CHARW + 4);
        let ax = d.dx - cenX, ay = d.dy - cenY;
        const r = Math.hypot(ax, ay);
        if (r < 22) {
          const ang = idx * GOLDEN;
          ax = Math.cos(ang);
          ay = Math.sin(ang);
        } else {
          ax /= r;
          ay /= r;
        }
        const off = 20;
        return { w, h: LBL_H, cx: d.dx + ax * off, cy: d.dy + ay * off, ref: d };
      });
      for (let iter = 0; iter < 320; iter++) {
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
          for (const d of dots) {
            const ox = a.w / 2 + DOT_R + GAP - Math.abs(a.cx - d.dx);
            const oy = a.h / 2 + DOT_R + GAP - Math.abs(a.cy - d.dy);
            if (ox > 0 && oy > 0) {
              if (oy <= ox) a.cy += (a.cy <= d.dy ? -1 : 1) * (oy + 0.4);
              else a.cx += (a.cx <= d.dx ? -1 : 1) * (ox + 0.4);
            }
          }
        }
        for (let i = 0; i < lab.length; i++) {
          const a = lab[i], d = dots[i];
          a.cx += (d.dx - a.cx) * 8e-3;
          a.cy += (d.dy - a.cy) * 8e-3;
        }
      }
      lab.forEach((a) => {
        a.cx = Math.max(pX + a.w / 2 + 2, Math.min(pX + pW - a.w / 2 - 2, a.cx));
        a.cy = Math.max(pY0 + a.h / 2 + 2, Math.min(pY1 - a.h / 2 - 2, a.cy));
      });
      dots.forEach((d, i) => {
        const a = lab[i];
        const g = el("g", {}, svg);
        el("circle", {
          cx: d.dx,
          cy: d.dy,
          r: DOT_R,
          class: `gv-mapdot gv-cat-${d.cat}`,
          "data-role": `cat-${d.cat}`
        }, g);
        const onLeft = a.cx >= d.dx;
        const tx = onLeft ? a.cx - a.w / 2 + 2 : a.cx + a.w / 2 - 2;
        const ty = a.cy + 3.2;
        el("line", { x1: d.dx, y1: d.dy, x2: tx, y2: a.cy, class: "gv-leader", fill: "none" }, g);
        el("text", { x: tx, y: ty, class: "gv-maplabel svg-halo", "text-anchor": onLeft ? "start" : "end" }, g).textContent = lblText(d.w);
        add("map", g);
      });
      const lx = pX + pW + 40, lyTop = pY0 + 16;
      const lbBefore = typeof loss.before === "number" ? loss.before : 0;
      const lbAfter = typeof loss.after === "number" ? loss.after : 0;
      const lbMax = Math.max(1e-6, lbBefore);
      const lossBarW = Wd - PAD - lx;
      text("map", lx, lyTop, "gv-losslab", "start", labels.lossBefore || "loss before");
      add("map", el("rect", {
        x: lx,
        y: lyTop + 8,
        width: lossBarW,
        height: 16,
        rx: 3,
        class: "gv-lossbar gv-loss-before",
        "data-role": "loss-before"
      }, svg));
      text("map", lx, lyTop + 20, "gv-lossval", "start", num(lbBefore, 2));
      text("map", lx, lyTop + 56, "gv-losslab", "start", labels.lossAfter || "loss after");
      const afterW = Math.max(3, lbAfter / lbMax * lossBarW);
      add("map", el("rect", {
        x: lx,
        y: lyTop + 64,
        width: afterW,
        height: 16,
        rx: 3,
        class: "gv-lossbar gv-loss-after",
        "data-role": "loss-after"
      }, svg));
      text("map", lx, lyTop + 76, "gv-lossval", "start", num(lbAfter, 4));
      layer("coin", 4);
      panelHead("coin", PAD, P4_Y + 12, labels.coinHead || "two faces of one coin");
      const boxY = P4_Y + 32, boxH = 64, boxW = 360;
      add("coin", el("rect", {
        x: PAD,
        y: boxY,
        width: boxW,
        height: boxH,
        rx: 8,
        class: "gv-coinbox gv-coin-count",
        "data-role": "count-route"
      }, svg));
      text("coin", PAD + 14, boxY + 26, "gv-coinword", "start", "GloVe");
      text("coin", PAD + 14, boxY + 48, "gv-coinsub", "start", labels.coinCount || "count-based");
      const rbx = Wd - PAD - boxW;
      add("coin", el("rect", {
        x: rbx,
        y: boxY,
        width: boxW,
        height: boxH,
        rx: 8,
        class: "gv-coinbox gv-coin-pred",
        "data-role": "pred-route"
      }, svg));
      text("coin", rbx + 14, boxY + 26, "gv-coinword", "start", "word2vec");
      text("coin", rbx + 14, boxY + 48, "gv-coinsub", "start", labels.coinPred || "predictive");
      const midY = boxY + boxH / 2;
      add("coin", el("line", {
        x1: PAD + boxW,
        y1: midY,
        x2: rbx,
        y2: midY,
        class: "gv-coinlink",
        "marker-end": "url(#gv-ah)",
        "marker-start": "url(#gv-ah)"
      }, svg));
      text("coin", Wd / 2, boxY + boxH + 26, "gv-pmi", "middle", labels.coinPmi || "shifted PMI");
      const defs = el("defs", {}, svg);
      const m = el("marker", {
        id: "gv-ah",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: "gv-arrhead" }, m);
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const node of L.nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
