/* AUTO-GENERATED offline classic bundle of widgets/agentic-loop/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/agentic-loop/logic.js
  var mountAgenticLoop = defineWidget({
    id: "agentic-loop",
    rootClass: "al-root",
    exportName: "mountAgenticLoop",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const d = data || {};
      const react = d.react || {};
      const steps = Array.isArray(react.steps) ? react.steps : [];
      const recallByStep = Array.isArray(react.recallByStep) ? react.recallByStep : [];
      const real = d.real || {};
      const selfRag = d.selfRag || {};
      const crag = d.crag || {};
      const W = 540, PAD = 16;
      const trunc = (s, n) => {
        const t = String(s == null ? "" : s);
        return t.length > n ? t.slice(0, n - 1) + "\u2026" : t;
      };
      const qTop = 30;
      const recTop = 46;
      const laneTop = 86;
      const laneH = 30, laneGap = 8;
      const laneStride = laneH + laneGap;
      const nLanes = 3;
      const lanesBottom = laneTop + nLanes * laneStride - laneGap;
      const labelW = 86;
      const boxX = PAD + labelW, boxW = W - PAD - boxX;
      const finishTop = lanesBottom + 22;
      const badgeTop = finishTop + 30;
      const chipsTop = badgeTop + 44;
      const chipRowH = 22;
      const chipsBottom = chipsTop + 18 + chipRowH + 14 + chipRowH;
      const H = frameHeightFor(chipsBottom + 4, 12);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg al-svg", role: "img", "aria-label": labels.alt || "" }, host);
      el("text", { x: PAD, y: qTop - 12, class: "al-qhead" }, svg).textContent = labels.qHead || "";
      el("text", { x: PAD, y: qTop + 4, class: "al-qtext" }, svg).textContent = trunc(react.question, 46);
      const recG = el("g", { class: "al-recall" }, svg);
      el("text", { x: W - PAD, y: recTop - 4, class: "al-reclbl", "text-anchor": "end" }, recG).textContent = labels.recallLabel || "";
      const recValEl = el("text", { x: W - PAD, y: recTop + 16, class: "al-recval", "text-anchor": "end" }, recG);
      const laneDefs = [
        { key: "thought", lblKey: "laneThought" },
        { key: "action", lblKey: "laneAction" },
        { key: "observation", lblKey: "laneObservation" }
      ];
      const laneEls = laneDefs.map((ln, i) => {
        const y = laneTop + i * laneStride;
        const g = el("g", { class: "al-lane al-lane-" + ln.key }, svg);
        el("text", { x: PAD, y: y + laneH / 2 + 4, class: "al-lanelbl" }, g).textContent = labels[ln.lblKey] || ln.key;
        el("rect", { x: boxX, y, width: boxW, height: laneH, rx: 5, class: "al-lanebox" }, g);
        const txt = el("text", { x: boxX + 9, y: y + laneH / 2 + 4, class: "al-lanetxt is-hidden" }, g);
        return { box: g, txt };
      });
      for (let i = 0; i < nLanes - 1; i++) {
        const y1 = laneTop + i * laneStride + laneH;
        el("line", { x1: boxX + 18, y1, x2: boxX + 18, y2: y1 + laneGap, class: "al-conn" }, svg);
      }
      const obsLaneY = laneTop + 2 * laneStride;
      const foundTick = el("text", { x: boxX + boxW - 12, y: obsLaneY + laneH / 2 + 5, class: "al-found is-hidden", "text-anchor": "end" }, svg);
      foundTick.textContent = "\u2713";
      const finishG = el("g", { class: "al-finish is-hidden" }, svg);
      el("text", { x: PAD, y: finishTop + 4, class: "al-finishlbl" }, finishG).textContent = labels.finishLabel || "";
      const ansChip = el("g", { class: "al-anschip" }, finishG);
      const ansX = PAD + labelW;
      el("rect", { x: ansX, y: finishTop - 13, width: W - PAD - ansX, height: 24, rx: 6, class: "al-ansbox" }, ansChip);
      el("text", { x: ansX + 10, y: finishTop + 4, class: "al-anstxt" }, ansChip).textContent = trunc(real.finalAnswer, 52);
      const badgeG = el("g", { class: "al-badge is-hidden" }, svg);
      el("rect", { x: PAD, y: badgeTop - 13, width: W - 2 * PAD, height: 24, rx: 6, class: "al-badgebox" }, badgeG);
      el("text", { x: PAD + 11, y: badgeTop + 4, class: "al-badgemark" }, badgeG).textContent = "\u2713";
      const badgeTxt = el("text", { x: PAD + 28, y: badgeTop + 4, class: "al-badgetxt" }, badgeG);
      const badgeTpl = labels.realBadge || "{model} solved in {steps} steps";
      badgeTxt.textContent = badgeTpl.replace("{model}", String(real._model || "")).replace("{steps}", String(real.steps == null ? "" : real.steps));
      const chipsG = el("g", { class: "al-chips is-hidden" }, svg);
      const reflect = Array.isArray(selfRag.reflectionTokens) ? selfRag.reflectionTokens : [];
      const grades = Array.isArray(crag.grades) ? crag.grades : [];
      function chipRow(parent, headerKey, items, y, chipClassFor) {
        el("text", { x: PAD, y, class: "al-chiphdr" }, parent).textContent = labels[headerKey] || "";
        let x = PAD;
        const rowY = y + 9;
        items.forEach((it) => {
          const cw = Math.max(40, 11 + String(it).length * 7.2);
          const g = el("g", { class: "al-chip " + (chipClassFor ? chipClassFor(it) : "") }, parent);
          el("rect", { x, y: rowY, width: cw, height: chipRowH - 4, rx: 5, class: "al-chipbox" }, g);
          el("text", { x: x + cw / 2, y: rowY + (chipRowH - 4) / 2 + 4, class: "al-chiptxt", "text-anchor": "middle" }, g).textContent = String(it);
          x += cw + 7;
        });
      }
      chipRow(chipsG, "selfRagHdr", reflect, chipsTop + 12, null);
      const gradeCls = (g) => "al-grade-" + String(g);
      chipRow(chipsG, "cragHdr", grades, chipsTop + 12 + chipRowH + 16, gradeCls);
      return function update(k) {
        const traceShown = Math.max(0, Math.min(k, steps.length));
        const cur = traceShown > 0 ? steps[traceShown - 1] : null;
        const laneVals = {
          thought: cur ? cur.thought : "",
          action: cur ? cur.action : "",
          observation: cur ? cur.observation : ""
        };
        laneEls.forEach((le, i) => {
          const v = laneVals[laneDefs[i].key];
          const show = k >= 1 && v != null && v !== "";
          le.txt.classList.toggle("is-hidden", !show);
          le.box.classList.toggle("is-active", show);
          if (show) le.txt.textContent = trunc(v, 56);
        });
        const recVal = traceShown > 0 ? Number(recallByStep[traceShown - 1] || 0) : 0;
        recValEl.textContent = String(recVal);
        recG.classList.toggle("is-solved", recVal >= 1);
        foundTick.classList.toggle("is-hidden", !(recVal >= 1));
        const solved = k >= 3;
        finishG.classList.toggle("is-hidden", !solved);
        badgeG.classList.toggle("is-hidden", !solved);
        chipsG.classList.toggle("is-hidden", k < 4);
      };
    }
  });
})();
