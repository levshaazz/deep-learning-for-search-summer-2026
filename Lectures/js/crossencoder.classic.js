/* AUTO-GENERATED offline classic bundle of widgets/crossencoder/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/crossencoder/logic.js
  var mountCrossencoder = defineWidget({
    id: "crossencoder",
    rootClass: "ce-root",
    exportName: "mountCrossencoder",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const toy = data.toy || {};
      const qTokens = toy.qTokens || [];
      const dTokens = toy.dTokens || [];
      const attn = toy.attnQxD || [];
      const clsRel = toy.clsRel || [];
      const w = toy.w || [];
      const b = typeof toy.b === "number" ? toy.b : 0;
      const logitRel = typeof toy.logitRel === "number" ? toy.logitRel : 0;
      const scoreRel = typeof toy.scoreRel === "number" ? toy.scoreRel : 0;
      const clsNeg = toy.clsNeg || [];
      const hasNeg = clsNeg.length > 0;
      const logitNeg = typeof toy.logitNeg === "number" ? toy.logitNeg : 0;
      const scoreNeg = typeof toy.scoreNeg === "number" ? toy.scoreNeg : 0;
      const CLS = labels.clsLabel || "[CLS]";
      const SEP = labels.sepLabel || "[SEP]";
      const num = (x) => typeof x !== "number" ? "" : Number.isInteger(x) ? String(x) : fmt(x, 3);
      const num3 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(3);
      const arr = (a) => "[" + a.map(num).join(", ") + "]";
      const W = 620, PAD = 16;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg ce-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const heat = (x) => `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(Math.max(0.06, x) * 100)}%, var(--bg-card, #fff))`;
      layer("joint", 0);
      add("joint", el("text", { x: PAD, y: 16, class: "ce-head" }, svg)).textContent = labels.jointHead || "joint input \u2014 query and document read together";
      const seq = [{ t: CLS, role: "cls" }].concat(qTokens.map((t) => ({ t, role: "q" }))).concat([{ t: SEP, role: "sep" }]).concat(dTokens.map((t) => ({ t, role: "d" }))).concat([{ t: SEP, role: "sep" }]);
      const nChips = seq.length;
      const gap = 4, rowY = 28, chipH = 28;
      const chipW = (W - 2 * PAD - (nChips - 1) * gap) / nChips;
      const chipCx = [];
      const chipInner = chipW - 6;
      seq.forEach((s, i) => {
        const x = PAD + i * (chipW + gap);
        chipCx.push(x + chipW / 2);
        add("joint", el("rect", {
          x,
          y: rowY,
          width: chipW,
          height: chipH,
          rx: 6,
          class: `ce-tok ce-tok-${s.role}`
        }, svg));
        const tAttrs = {
          x: x + chipW / 2,
          y: rowY + 19,
          class: `ce-tok-txt ce-tok-txt-${s.role}`,
          "text-anchor": "middle"
        };
        if (String(s.t).length * 6.5 > chipInner) {
          tAttrs.textLength = chipInner;
          tAttrs.lengthAdjust = "spacingAndGlyphs";
        }
        add("joint", el("text", tAttrs, svg)).textContent = s.t;
      });
      const qIdx = qTokens.map((_, i) => 1 + i);
      const dIdx = dTokens.map((_, i) => 1 + qTokens.length + 1 + i);
      layer("cross", 1);
      const arcTop = rowY + chipH;
      const nQ = qTokens.length || 1;
      const LANE0 = 16, LANE_H = Math.max(14, Math.min(20, (66 - LANE0) / nQ));
      qTokens.forEach((_, i) => {
        const row = attn[i] || [];
        let best = 0;
        row.forEach((v, j) => {
          if (v > (row[best] || 0)) best = j;
        });
        const lane = arcTop + LANE0 + i * LANE_H;
        dTokens.forEach((_2, j) => {
          const wv = row[j] || 0;
          const isMax = j === best;
          const x1 = chipCx[qIdx[i]], x2 = chipCx[dIdx[j]];
          const dip = lane + wv * 12;
          add("cross", el("path", {
            d: `M ${x1.toFixed(1)} ${arcTop} Q ${((x1 + x2) / 2).toFixed(1)} ${dip.toFixed(1)} ${x2.toFixed(1)} ${arcTop}`,
            class: "ce-link" + (isMax ? " ce-link-max" : ""),
            fill: "none",
            "stroke-width": (isMax ? 3 : 1).toFixed(2),
            opacity: (isMax ? 0.95 : 0.16).toFixed(2)
          }, svg));
        });
      });
      layer("heat", 2);
      const hmTop = arcTop + 78;
      add("heat", el("text", { x: PAD, y: hmTop - 8, class: "ce-head" }, svg)).textContent = labels.heatHead || "cross-attention \u2014 each query token over the doc tokens (rows sum to 1)";
      const LBL = 58, CELL = 42, CGAP = 8, STEP = CELL + CGAP;
      const gx = PAD + LBL, gy = hmTop + 16;
      dTokens.forEach((t, c) => {
        add("heat", el("text", {
          x: gx + c * STEP + CELL / 2,
          y: gy - 6,
          class: "ce-collbl",
          "text-anchor": "middle"
        }, svg)).textContent = t;
      });
      attn.forEach((row, r) => {
        const cy = gy + r * STEP;
        add("heat", el("text", { x: gx - 10, y: cy + CELL / 2 + 5, class: "ce-rowlbl", "text-anchor": "end" }, svg)).textContent = qTokens[r] || "";
        row.forEach((v, c) => {
          const cx = gx + c * STEP;
          const rect = el("rect", { x: cx, y: cy, width: CELL, height: CELL, rx: 4, class: "ce-cell" }, svg);
          rect.setAttribute("fill", heat(v));
          add("heat", rect);
          const t = el("text", {
            x: cx + CELL / 2,
            y: cy + CELL / 2 + 5,
            class: "ce-cellval",
            "text-anchor": "middle"
          }, svg);
          t.textContent = num3(v);
          t.setAttribute("fill", v >= 0.5 ? "#fff" : "var(--ink, #14181F)");
          add("heat", t);
        });
      });
      const hmBottom = gy + attn.length * STEP;
      layer("head", 3);
      const hT = hmBottom + 12;
      add("head", el("rect", { x: PAD, y: hT, width: W - 2 * PAD, height: 74, rx: 9, class: "ce-callbox" }, svg));
      add("head", el("text", { x: PAD + 14, y: hT + 24, class: "ce-headline" }, svg)).textContent = "[CLS] = " + arr(clsRel) + " \xB7 w = " + arr(w) + " \xB7 b = " + num(b);
      add("head", el("text", { x: PAD + 14, y: hT + 49, class: "ce-headline2" }, svg)).textContent = "w\xB7[CLS] + b = " + num(logitRel) + "   \u2192   " + (labels.scoreLabel || "\u03C3(logit)") + " = " + num3(scoreRel);
      add("head", el("text", { x: PAD + 14, y: hT + 67, class: "ce-headnote" }, svg)).textContent = labels.headNote || "one logit per (q, d) pair \u2014 uncacheable";
      let bottomY = hT + 74;
      if (hasNeg) {
        layer("disc", 4);
        const dT = hT + 74 + 12;
        add("disc", el("text", { x: PAD, y: dT - 2, class: "ce-head" }, svg)).textContent = labels.discHead || "the Judge discriminates \u2014 same head, a distractor pair";
        const boxY = dT + 8;
        add("disc", el("rect", { x: PAD, y: boxY, width: W - 2 * PAD, height: 56, rx: 9, class: "ce-callbox" }, svg));
        add("disc", el("text", { x: PAD + 14, y: boxY + 23, class: "ce-headline" }, svg)).textContent = "[CLS] = " + arr(clsNeg) + " \xB7 w\xB7[CLS] + b = " + num(logitNeg);
        add("disc", el("text", { x: PAD + 14, y: boxY + 46, class: "ce-headline2 ce-headline2-neg" }, svg)).textContent = (labels.scoreLabel || "\u03C3(logit)") + " = " + num3(scoreNeg) + "   " + (labels.discGap || "\u226A " + num3(scoreRel) + " (the relevant pair)");
        bottomY = boxY + 56;
      }
      const H = frameHeightFor(bottomY, 10);
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
