/* AUTO-GENERATED offline classic bundle of widgets/llm-judge/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/llm-judge/logic.js
  var mountLlmJudge = defineWidget({
    id: "llm-judge",
    rootClass: "lj-root",
    exportName: "mountLlmJudge",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const d = data || {};
      const rubric = d.rubric && d.rubric.criteria || [];
      const sMin = d.rubric && d.rubric.scaleMin || 1;
      const sMax = d.rubric && d.rubric.scaleMax || 5;
      const answers = d.answers || [];
      const A = answers[0] || { id: "A", scores: [], mean: 0 };
      const B = answers[1] || { id: "B", scores: [], mean: 0 };
      const pairWinner = d.pairwiseWinner || "A";
      const gh = d.goodhart || {};
      const ghHonest = gh.honest || {};
      const ghLen = gh.lengthBiased || {};
      const real = d.real || {};
      const critLabel = (name) => labels["crit_" + name] || name;
      const W = 540, PAD = 16, RIGHT = W - PAD;
      const p1Top = 22;
      const tblHeadY = p1Top + 18;
      const critColW = 96;
      const tblX0 = PAD + 92;
      const rowH = 30;
      const row1Y = tblHeadY + 26;
      const row2Y = row1Y + rowH;
      const p1Bot = row2Y + 20;
      const p2Top = p1Bot + 16;
      const p2HeadY = p2Top + 4;
      const barX = PAD + 120, barW = 250;
      const meanRow = 32;
      const meanA_Y = p2HeadY + 22;
      const meanB_Y = meanA_Y + meanRow;
      const p2Bot = meanB_Y + 16;
      const p3Top = p2Bot + 16;
      const p3HeadY = p3Top + 4;
      const verdictY = p3HeadY + 22;
      const ghTop = verdictY + 22;
      const ghColW = (W - 2 * PAD - 24) / 2;
      const ghColX = [PAD, PAD + ghColW + 24];
      const ghHeadY = ghTop + 14;
      const ghBarTop = ghHeadY + 30;
      const ghValGutter = 52;
      const ghBarW = ghColW - ghValGutter;
      const ghBarX = (col) => ghColX[col];
      const ghLblDY = -14;
      const ghRowH = 38;
      const ghBot = ghBarTop + 2 * ghRowH + 22;
      const p3Bot = ghBot + 4;
      const p4Top = p3Bot + 16;
      const p4HeadY = p4Top + 4;
      const realBarX = PAD + 216, realBarW = 200;
      const realRow = 30;
      const real0Y = p4HeadY + 24;
      const real1Y = real0Y + realRow;
      const real2Y = real1Y + realRow;
      const p4Bot = real2Y + 16;
      const H = frameHeightFor(p4Bot, 12);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg lj-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const clampScore = (v) => Math.max(0, Math.min(1, (Number(v) - sMin) / (sMax - sMin || 1)));
      const g1 = el("g", { class: "lj-panel lj-rubric" }, svg);
      el("text", { x: PAD, y: p1Top, class: "lj-head" }, g1).textContent = labels.rubricHead || "rubric";
      rubric.forEach((name, j) => {
        const cx = tblX0 + j * critColW + critColW / 2;
        el("text", { x: cx, y: tblHeadY, class: "lj-crit", "text-anchor": "middle" }, g1).textContent = critLabel(name);
      });
      const chipRow = (ans, y, ansLbl) => {
        el("text", { x: PAD, y: y + 4, class: "lj-rowlbl" }, g1).textContent = (labels.answer || "answer") + " " + (ans.id || "");
        (ans.scores || []).forEach((sc, j) => {
          const cx = tblX0 + j * critColW + critColW / 2;
          el("rect", { x: cx - 16, y: y - 12, width: 32, height: 24, rx: 5, class: "lj-chip" }, g1);
          el("text", { x: cx, y: y + 5, class: "lj-chipval", "text-anchor": "middle" }, g1).textContent = String(sc);
        });
      };
      chipRow(A, row1Y, "A");
      chipRow(B, row2Y, "B");
      el("text", { x: RIGHT, y: tblHeadY, class: "lj-scalenote", "text-anchor": "end" }, g1).textContent = (labels.scaleNote || "scale") + " " + sMin + "\u2013" + sMax;
      const g2 = el("g", { class: "lj-panel lj-pointwise is-hidden" }, svg);
      el("text", { x: PAD, y: p2HeadY, class: "lj-head" }, g2).textContent = labels.pointwiseHead || "pointwise mean";
      const meanBar = (ans, y, isWinner) => {
        el("text", { x: PAD, y: y + 4, class: "lj-rowlbl" }, g2).textContent = (labels.answer || "answer") + " " + (ans.id || "");
        el("rect", { x: barX, y: y - 9, width: barW, height: 16, rx: 4, class: "lj-track" }, g2);
        const w = Math.round(barW * clampScore(ans.mean));
        el("rect", {
          x: barX,
          y: y - 9,
          width: w,
          height: 16,
          rx: 4,
          class: "lj-fill" + (isWinner ? " is-win" : "")
        }, g2);
        el("text", { x: barX + barW + 10, y: y + 4, class: "lj-val", "text-anchor": "start" }, g2).textContent = (Number(ans.mean) || 0).toFixed(4);
      };
      const aWins = pairWinner === (A.id || "A");
      meanBar(A, meanA_Y, aWins);
      meanBar(B, meanB_Y, !aWins);
      const g3v = el("g", { class: "lj-panel lj-verdict is-hidden" }, svg);
      el("text", { x: PAD, y: p3HeadY, class: "lj-head" }, g3v).textContent = labels.pairwiseHead || "pairwise verdict";
      el("text", { x: PAD, y: verdictY, class: "lj-verdicttxt" }, g3v).textContent = (labels.winsPrefix || "winner:") + " " + (labels.answer || "answer") + " " + pairWinner;
      el("text", { x: PAD + 200, y: verdictY, class: "lj-tick" }, g3v).textContent = "\u2713";
      const g3g = el("g", { class: "lj-panel lj-goodhart is-hidden" }, svg);
      const ghCol = (col, judge, headLbl, isFlip) => {
        const x = ghColX[col];
        el("text", { x, y: ghHeadY, class: "lj-ghhead" }, g3g).textContent = headLbl;
        const rows = [
          {
            lbl: labels.goodAns || "honest",
            val: judge.good,
            win: judge.winner === "A",
            cls: "is-good"
          },
          {
            lbl: labels.gamedAns || "verbose",
            val: judge.gamed,
            win: judge.winner === "C",
            cls: "is-gamed"
          }
        ];
        rows.forEach((r, i) => {
          const y = ghBarTop + i * ghRowH;
          el("text", { x, y: y + ghLblDY, class: "lj-ghlbl" }, g3g).textContent = r.lbl;
          el("rect", {
            x: ghBarX(col),
            y: y - 8,
            width: ghBarW,
            height: 14,
            rx: 3,
            class: "lj-track"
          }, g3g);
          const w = Math.round(ghBarW * clampScore(r.val));
          el("rect", {
            x: ghBarX(col),
            y: y - 8,
            width: w,
            height: 14,
            rx: 3,
            class: "lj-fill " + r.cls + (r.win ? " is-win" : "")
          }, g3g);
          el("text", { x: ghBarX(col) + ghBarW + 6, y: y + 4, class: "lj-ghval", "text-anchor": "start" }, g3g).textContent = (Number(r.val) || 0).toFixed(4);
        });
        const wy = ghBarTop + 2 * ghRowH + 12;
        el("text", { x, y: wy, class: "lj-ghwin" + (isFlip ? " is-flip" : "") }, g3g).textContent = (labels.winsPrefix || "winner:") + " " + (judge.winner || "");
      };
      ghCol(0, ghHonest, labels.honestJudge || "honest judge", false);
      ghCol(1, ghLen, labels.lengthJudge || "length-biased judge", true);
      const g4 = el("g", { class: "lj-panel lj-real is-hidden" }, svg);
      el("text", { x: PAD, y: p4HeadY, class: "lj-head" }, g4).textContent = labels.realHead || "measured judge behaviour";
      const realBars = [
        { lbl: labels.rAccuracy || "accuracy (clear)", val: real.accuracyClear, warn: false },
        { lbl: labels.rPosition || "follows slot (tie)", val: real.positionFollowRateTie, warn: false },
        { lbl: labels.rVerbosity || "prefers longer", val: real.verbosityPreferenceRate, warn: true }
      ];
      [real0Y, real1Y, real2Y].forEach((y, i) => {
        const r = realBars[i];
        el("text", { x: PAD, y: y + 4, class: "lj-rowlbl" }, g4).textContent = r.lbl;
        el("rect", { x: realBarX, y: y - 8, width: realBarW, height: 14, rx: 3, class: "lj-track" }, g4);
        const v = Math.max(0, Math.min(1, Number(r.val) || 0));
        el("rect", {
          x: realBarX,
          y: y - 8,
          width: Math.round(realBarW * v),
          height: 14,
          rx: 3,
          class: "lj-fill" + (r.warn ? " is-warn" : "")
        }, g4);
        el("text", { x: realBarX + realBarW + 10, y: y + 4, class: "lj-val", "text-anchor": "start" }, g4).textContent = (Number(r.val) || 0).toFixed(4);
      });
      return function update(k) {
        const s = Math.max(0, Math.min(k, 5));
        g2.classList.toggle("is-hidden", s < 1);
        g3v.classList.toggle("is-hidden", s < 2);
        g3g.classList.toggle("is-hidden", s < 3);
        g4.classList.toggle("is-hidden", s < 4);
      };
    }
  });
})();
