/* AUTO-GENERATED offline classic bundle of widgets/clip-matrix/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
      const i18nAll = rest && rest.i18nAll && typeof rest.i18nAll === "object" ? rest.i18nAll : null;
      const active = { ...labels };
      const localeKeys = /* @__PURE__ */ new Set();
      if (i18nAll) for (const map of Object.values(i18nAll)) {
        if (map && typeof map === "object") for (const key of Object.keys(map)) localeKeys.add(key);
      }
      const configKeys = /* @__PURE__ */ new Set(["role", "variant", "series"]);
      const base = Object.fromEntries(Object.entries(labels).filter(([key]) => !localeKeys.has(key) || configKeys.has(key)));
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
      const originalHostRole = host.getAttribute("role");
      const originalHostAlt = host.getAttribute("aria-label");
      let ownsHostAlt = false;
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
          ownsHostAlt = true;
        } else if (ownsHostAlt) {
          for (const [key, value] of [["role", originalHostRole], ["aria-label", originalHostAlt]]) {
            if (value === null) host.removeAttribute(key);
            else host.setAttribute(key, value);
          }
          ownsHostAlt = false;
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
          if (i18nAll) {
            for (const k of Object.keys(active)) delete active[k];
            Object.assign(active, i18nAll.en || {}, i18nAll[lang] || {}, base);
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

  // widgets/clip-matrix/logic.js
  var mountClipMatrix = defineWidget({
    id: "clip-matrix",
    rootClass: "clm-root",
    exportName: "mountClipMatrix",
    maxStep: 5,
    render({ host, data, labels, el }) {
      const d = data || {};
      const concepts = d.concepts && d.concepts.length ? d.concepts : ["cat", "dog", "car"];
      const M = d.cosineMatrix && d.cosineMatrix.length ? d.cosineMatrix : concepts.map(() => concepts.map(() => 0));
      const n = concepts.length;
      const W = 540, PAD = 16;
      const headY = 24;
      const colLblY = 64;
      const gridTop = 78;
      const CELL = 96, GAP = 8, STEP = CELL + GAP;
      const rowLblW = 96;
      const gridW = n * STEP - GAP;
      const gridLeft = Math.round((W - (rowLblW + gridW)) / 2) + rowLblW;
      const gridBottom = gridTop + n * STEP - GAP;
      const barsTop = gridBottom + 52;
      const barRow = 30, barX = gridLeft, barW = gridW, barLabelX = PAD;
      const barsBottom = barsTop + 2 * barRow + 6;
      const badgeY = barsBottom + 26;
      const H = frameHeightFor(badgeY + 30, 14);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg clm-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const heat = (x) => {
        const v = Math.max(0, Math.min(1, Number(x) || 0));
        return `color-mix(in srgb, var(--c-green, #3A8A5C) ${Math.round((0.08 + 0.82 * v) * 100)}%, var(--bg-card, #fff))`;
      };
      el("text", { x: PAD, y: headY, class: "clm-head" }, svg).textContent = labels.head || "one shared space \xB7 cosine(image i, caption j)";
      el("text", { x: gridLeft + gridW / 2, y: 46, class: "clm-axiscap clm-textcap", "text-anchor": "middle" }, svg).textContent = labels.textAxis || "caption (text) j \u2192";
      el("text", {
        x: PAD,
        y: gridTop + gridW / 2,
        class: "clm-axiscap clm-imgcap",
        "text-anchor": "middle",
        transform: `rotate(-90 ${PAD} ${gridTop + gridW / 2})`
      }, svg).textContent = labels.imgAxis || "\u2193 image i";
      concepts.forEach((cpt, j) => {
        el("text", { x: gridLeft + j * STEP + CELL / 2, y: colLblY, class: "clm-collbl", "text-anchor": "middle" }, svg).textContent = cpt;
      });
      const cells = [];
      for (let i = 0; i < n; i++) {
        const cy = gridTop + i * STEP;
        el("text", { x: gridLeft - 12, y: cy + CELL / 2 + 5, class: "clm-rowlbl", "text-anchor": "end" }, svg).textContent = concepts[i];
        for (let j = 0; j < n; j++) {
          const cx = gridLeft + j * STEP;
          const v = Number(M[i] && M[i][j] || 0);
          const isDiag = i === j;
          const rect = el("rect", { x: cx, y: cy, width: CELL, height: CELL, rx: 8, class: "clm-cell" }, svg);
          const valText = el("text", {
            x: cx + CELL / 2,
            y: cy + CELL / 2 + 6,
            class: "clm-cellval",
            "text-anchor": "middle"
          }, svg);
          valText.textContent = typeof v === "number" && isFinite(v) ? v.toFixed(4) : "";
          cells.push({ rect, valText, v, isDiag, i, j });
        }
      }
      const exRow = 0;
      let exArgmax = 0;
      for (let j = 1; j < n; j++) {
        if (Number(M[exRow] && M[exRow][j] || 0) > Number(M[exRow] && M[exRow][exArgmax] || 0)) exArgmax = j;
      }
      const matched = Math.max(0, Math.min(1, Number(d.matchedMeanCos) || 0));
      const mismatched = Math.max(0, Math.min(1, Number(d.mismatchedMeanCos) || 0));
      const gapG = el("g", { class: "clm-bars is-hidden" }, svg);
      const mkBar = (y, val, lblKey, dflt, hi) => {
        el("text", { x: barLabelX, y: y - 7, class: "clm-barlbl" }, gapG).textContent = labels[lblKey] || dflt;
        el("rect", { x: barX, y, width: barW, height: 16, rx: 4, class: "clm-track" }, gapG);
        el("rect", {
          x: barX,
          y,
          width: Math.max(2, Math.round(barW * val)),
          height: 16,
          rx: 4,
          class: "clm-fill" + (hi ? " is-hi" : " is-lo")
        }, gapG);
        el("text", { x: barX + barW, y: y - 4, class: "clm-barval", "text-anchor": "end" }, gapG).textContent = (Number(hi ? d.matchedMeanCos : d.mismatchedMeanCos) || 0).toFixed(4);
      };
      mkBar(barsTop, matched, "matched", "matching pairs (diagonal)", true);
      mkBar(barsTop + barRow, mismatched, "mismatched", "everything else (off-diagonal)", false);
      el("text", { x: barX + barW / 2, y: barsBottom + 0, class: "clm-gap", "text-anchor": "middle" }, gapG).textContent = `${labels.gapLbl || "contrastive gap"} = ${(Number(d.contrastiveGap) || 0).toFixed(4)}`;
      const rowPickG = el("g", { class: "clm-rowpick is-hidden" }, svg);
      el("text", { x: PAD, y: gridBottom + 22, class: "clm-rowpicktxt" }, rowPickG).textContent = `${labels.rowPick || "scan one row \u2192 pick its brightest cell (argmax)"}: ${concepts[exRow]} \u2192 ${concepts[exArgmax]}`;
      const tallyG = el("g", { class: "clm-tally is-hidden" }, svg);
      el("text", { x: PAD, y: gridBottom + 22, class: "clm-tallytxt" }, tallyG).textContent = `${labels.tally || "top match on the diagonal"}: ${Number(d.diagonalCorrect) || 0} / ${n}`;
      const real = d.real || {};
      const badgeG = el("g", { class: "clm-badge is-hidden" }, svg);
      el("rect", { x: PAD, y: badgeY - 18, width: W - 2 * PAD, height: 40, rx: 9, class: "clm-badgebox" }, badgeG);
      const acc = Number(real.top1Accuracy) || 0;
      el("text", { x: PAD + 14, y: badgeY + 8, class: "clm-badgetxt" }, badgeG).textContent = `${labels.real || "real llava:7b \xB7 image\u2192caption forced choice"}: ${Number(real.top1Correct) || 0}/${Number(real.n) || 0} = ${acc.toFixed(2)}`;
      return function update(k) {
        cells.forEach((c) => {
          c.rect.setAttribute("fill", k >= 1 ? heat(c.v) : "var(--bg-inset, #EBE7DA)");
          c.valText.classList.toggle("is-shown", k >= 1);
          const lit = k >= 3 && c.isDiag || k === 2 && c.i === exRow && c.j === exArgmax;
          c.rect.classList.toggle("is-diag", lit);
          c.valText.classList.toggle("is-diag", lit);
          c.rect.classList.toggle("is-rowloser", k === 2 && c.i === exRow && c.j !== exArgmax);
          c.valText.classList.toggle("is-rowloser", k === 2 && c.i === exRow && c.j !== exArgmax);
        });
        rowPickG.classList.toggle("is-hidden", !(k === 2));
        tallyG.classList.toggle("is-hidden", !(k >= 3));
        gapG.classList.toggle("is-hidden", !(k >= 4));
        badgeG.classList.toggle("is-hidden", !(k >= 5));
      };
    }
  });
})();
