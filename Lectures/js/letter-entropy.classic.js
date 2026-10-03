/* AUTO-GENERATED offline classic bundle of widgets/letter-entropy/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/letter-entropy/logic.js
  var mountLetterEntropy = defineWidget({
    id: "letter-entropy",
    rootClass: "le-root",
    exportName: "mountLetterEntropy",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const D = data || {};
      const lf = D.letterFreq || {};
      const en = lf.en26 || {};
      const ru = lf.ru33 || {};
      const fn = D.fn || D.bench && D.bench.fn || {};
      const hb = D.humanBounds || D.bench && D.bench.humanBounds || {};
      const arr = (a) => Array.isArray(a) ? a : [];
      const enBars = arr(en.bars), ruBars = arr(ru.bars);
      const enTop = arr(en.top).slice(0, 8), ruTop = arr(ru.top).slice(0, 8);
      const letterOf = (t) => Array.isArray(t) ? String(t[0] || "") : String(t && (t.letter || t.l) || "");
      const DEC = labels.dec || ".";
      const num = (x, d) => typeof x === "number" && isFinite(x) ? x.toFixed(d).replace(".", DEC) : "\u2014";
      const pct = (x, d) => typeof x === "number" && isFinite(x) ? (x * 100).toFixed(d).replace(".", DEC) + " %" : "\u2014";
      const L = (k, fb) => labels[k] || fb;
      const W = 600, PAD = 18;
      const X0 = PAD, X1 = 396;
      const DIV = 414;
      const TX = 452, TW = 30;
      const RX1 = 448, RX2 = 496, LX = 502;
      const YTOP = 72, BASE = 262;
      const BITS_MAX = 5.1;
      const SPAN = BASE - YTOP;
      const yBits = (b) => BASE - Math.max(0, Math.min(BITS_MAX, b)) / BITS_MAX * SPAN;
      let pTop = 0;
      for (const p of enBars) if (typeof p === "number" && p > pTop) pTop = p;
      for (const p of ruBars) if (typeof p === "number" && p > pTop) pTop = p;
      const pScale = (pTop > 0 ? pTop : 1) * 1.08;
      const yProb = (p) => BASE - Math.max(0, p) / pScale * SPAN;
      const UNIFORM_FRAC = 0.5, UNIFORM_N = 27;
      const SYMBOL_N = typeof en.alphabet === "number" ? en.alphabet + 1 : UNIFORM_N;
      const NBAR = Math.max(UNIFORM_N, enBars.length, ruBars.length, 1);
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg le-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const txt = (x, y, cls, anchor) => {
        const a = { x, y, class: cls };
        if (anchor) a["text-anchor"] = anchor;
        return el("text", a, svg);
      };
      txt(PAD, 20, "le-head").textContent = L("head", "reshape the letters \u2014 watch the floor");
      const panelHead = txt(PAD, 40, "le-sub");
      el("line", { x1: DIV, y1: 52, x2: DIV, y2: BASE, class: "le-div" }, svg);
      el("line", { x1: X0, y1: BASE, x2: X1, y2: BASE, class: "le-axis" }, svg);
      const thermoHead = txt(TX - 28, 52, "le-sub");
      const grid = [];
      for (let b = 1; b <= 5; b++) {
        grid.push(el("line", { x1: X0, y1: yBits(b), x2: TX - 8, y2: yBits(b), class: "le-grid" }, svg));
      }
      const bars = [];
      for (let i = 0; i < NBAR; i++) {
        bars.push(el("rect", { x: X0, y: BASE - 2, width: 4, height: 2, rx: 1.5, class: "le-bar" }, svg));
      }
      const letters = [];
      for (let i = 0; i < 8; i++) letters.push(txt(X0, BASE + 13, "le-letter", "middle"));
      const stair = [];
      const COLW = (X1 - X0) / 5;
      const colC = (i) => X0 + COLW * (i + 0.5);
      const treads = [], risers = [], stairVal = [];
      for (let i = 0; i < 4; i++) {
        treads.push(el("line", { x1: X0 + COLW * i + 4, y1: BASE, x2: X0 + COLW * (i + 1) - 4, y2: BASE, class: "le-tread" }, svg));
        stair.push(treads[i]);
      }
      for (let i = 0; i < 4; i++) {
        risers.push(el("line", { x1: X0 + COLW * (i + 1), y1: BASE, x2: X0 + COLW * (i + 1), y2: BASE, class: "le-riser" }, svg));
        stair.push(risers[i]);
      }
      const band = el("rect", { x: X0 + COLW * 4 + 4, y: BASE, width: COLW - 8, height: 2, rx: 3, class: "le-band" }, svg);
      stair.push(band);
      for (let i = 0; i < 5; i++) {
        const t = txt(colC(i), BASE, "le-stairval", "middle");
        stairVal.push(t);
        stair.push(t);
      }
      const STAIR_TICKS = ["F\u2080", "F\u2081", "F\u2082", "F\u2083", "F\u2081\u2080\u2080"];
      for (let i = 0; i < 5; i++) {
        const t = txt(colC(i), BASE + 13, "le-letter", "middle");
        t.textContent = STAIR_TICKS[i];
        stair.push(t);
      }
      el("rect", { x: TX, y: YTOP, width: TW, height: SPAN, rx: 6, class: "le-track" }, svg);
      const merc = el("rect", { x: TX, y: BASE, width: TW, height: 0, class: "le-merc" }, svg);
      for (let b = 0; b <= 5; b++) {
        el("line", { x1: TX - 6, y1: yBits(b), x2: TX, y2: yBits(b), class: "le-tick" }, svg);
        txt(TX - 8, yBits(b) + 4, "le-ticklbl", "end").textContent = String(b);
      }
      const ceilRule = el("line", { x1: RX1, y1: YTOP, x2: RX2, y2: YTOP, class: "le-ceil" }, svg);
      const ceilLbl = txt(LX, YTOP, "le-ceillbl");
      const markRule = el("line", { x1: RX1, y1: YTOP, x2: RX2, y2: YTOP, class: "le-mark" }, svg);
      const markLbl = txt(LX, YTOP, "le-marklbl");
      const hRule = el("line", { x1: RX1, y1: BASE, x2: RX2, y2: BASE, class: "le-hrule" }, svg);
      const hLbl = txt(LX, BASE, "le-hlbl");
      const noteA = txt(PAD, BASE + 34, "le-note");
      const noteB = txt(PAD, BASE + 70, "le-numnote");
      const NOTE_MAXW = W - 2 * PAD;
      const setNote = (t) => {
        noteA.textContent = "";
        const words = String(t || "").split(/\s+/).filter(Boolean);
        if (!words.length) return;
        const line = (s, dy) => {
          const ts = el("tspan", { x: PAD, dy }, noteA);
          ts.textContent = s;
          return ts;
        };
        const probe = line(words.join(" "), 0);
        const wide = (() => {
          try {
            return probe.getComputedTextLength() > NOTE_MAXW;
          } catch (e) {
            return false;
          }
        })();
        if (!wide) return;
        let cut = words.length >> 1;
        for (let i = cut; i < words.length; i++) {
          if (/[—;:,]$/.test(words[i - 1])) {
            cut = i;
            break;
          }
        }
        probe.textContent = words.slice(0, cut).join(" ");
        line(words.slice(cut).join(" "), 16);
      };
      const H = frameHeightFor(BASE + 70 + 4, 10);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const HSYM = L("hSym", "H"), CSYM = L("ceilSym", "H\u2080");
      function cfg(k) {
        if (k === 1) {
          return {
            bars: enBars,
            top: enTop,
            warm: 8,
            h: en.H,
            hSym: HSYM,
            hDig: 4,
            ceil: en.uniformH,
            ceilSym: CSYM,
            ceilDig: 4,
            unitKey: "thermoLetter",
            unitN: en.alphabet,
            note: L("n1", ""),
            numB: L("redLbl", "R = 1 \u2212 H/H\u2080") + " = " + pct(en.redundancy, 1)
          };
        }
        if (k === 2) {
          return {
            bars: enBars,
            top: enTop,
            warm: 8,
            h: fn.F2_27,
            hSym: "F\u2082",
            hDig: 2,
            ceil: fn.F0_27,
            ceilSym: "F\u2080",
            ceilDig: 2,
            mark: fn.F1_27,
            markSym: "F\u2081",
            unitKey: "thermo",
            unitN: SYMBOL_N,
            note: L("n2", ""),
            numB: "F\u2082 = " + num(fn.F2_27, 2) + " (27) \xB7 " + num(fn.F2_26, 2) + " (26)"
          };
        }
        if (k === 3) {
          return {
            bars: ruBars,
            top: ruTop,
            warm: 8,
            h: ru.H,
            hSym: HSYM,
            hDig: 4,
            ceil: ru.uniformH,
            ceilSym: CSYM,
            ceilDig: 4,
            unitKey: "thermoLetter",
            unitN: ru.alphabet,
            note: L("n3", ""),
            numB: L("redLbl", "R = 1 \u2212 H/H\u2080") + ": EN " + pct(en.redundancy, 1) + " \xB7 RU " + pct(ru.redundancy, 1)
          };
        }
        if (k === 4) {
          return {
            stair: true,
            h: fn.F3_27,
            hSym: "F\u2083",
            hDig: 2,
            ceil: fn.F0_27,
            ceilSym: "F\u2080",
            ceilDig: 2,
            unitKey: "thermo",
            unitN: SYMBOL_N,
            note: L("n4", ""),
            numB: "26: F\u2080 " + num(fn.F0_26, 2) + " \xB7 F\u2081 " + num(fn.F1_26, 2) + " \xB7 F\u2082 " + num(fn.F2_26, 2) + " \xB7 F\u2083 " + num(fn.F3_26, 2)
          };
        }
        return {
          uniform: true,
          h: fn.F0_27,
          hSym: "F\u2080",
          hDig: 2,
          unitKey: "thermo",
          unitN: SYMBOL_N,
          note: L("n0", ""),
          numB: ""
        };
      }
      return function update(k) {
        const c = cfg(k);
        panelHead.textContent = L("p" + k, "");
        thermoHead.textContent = L(c.unitKey || "thermo", "bits / symbol") + (typeof c.unitN === "number" ? " \xB7 " + c.unitN : "");
        const showBars = !c.stair;
        const n = c.uniform ? UNIFORM_N : c.bars ? c.bars.length : 0;
        const slot = n > 0 ? (X1 - X0) / n : 0;
        const bw = Math.max(2, slot * 0.82);
        for (let i = 0; i < bars.length; i++) {
          const on = showBars && i < n;
          bars[i].classList.toggle("is-hidden", !on);
          if (!on) continue;
          const y = c.uniform ? BASE - UNIFORM_FRAC * SPAN : yProb(c.bars[i]);
          bars[i].setAttribute("x", X0 + i * slot + (slot - bw) / 2);
          bars[i].setAttribute("width", bw);
          bars[i].setAttribute("y", y);
          bars[i].setAttribute("height", Math.max(2, BASE - y));
          bars[i].classList.toggle("is-top", !c.uniform && i < (c.warm || 0));
        }
        const tops = c.top || [];
        for (let i = 0; i < letters.length; i++) {
          const on = showBars && i < tops.length && slot > 0;
          letters[i].classList.toggle("is-hidden", !on);
          if (!on) continue;
          letters[i].setAttribute("x", X0 + i * slot + slot / 2);
          letters[i].textContent = letterOf(tops[i]);
        }
        for (const g of grid) g.classList.toggle("is-hidden", !c.stair);
        for (const s of stair) s.classList.toggle("is-hidden", !c.stair);
        if (c.stair) {
          const F = [fn.F0_27, fn.F1_27, fn.F2_27, fn.F3_27];
          for (let i = 0; i < 4; i++) {
            const y = yBits(F[i]);
            treads[i].setAttribute("y1", y);
            treads[i].setAttribute("y2", y);
            stairVal[i].setAttribute("y", y - 5);
            stairVal[i].textContent = num(F[i], 2);
          }
          const yHi = yBits(hb.at100Upper), yLo = yBits(hb.at100Lower);
          band.setAttribute("y", yHi);
          band.setAttribute("height", Math.max(3, yLo - yHi));
          stairVal[4].setAttribute("y", yHi - 5);
          stairVal[4].textContent = num(hb.at100Lower, 1) + "\u2013" + num(hb.at100Upper, 1);
          for (let i = 0; i < 4; i++) {
            const yA = yBits(F[i]);
            const yB = i < 3 ? yBits(F[i + 1]) : yHi;
            risers[i].setAttribute("y1", yA);
            risers[i].setAttribute("y2", yB);
          }
        }
        const yH = yBits(c.h);
        merc.setAttribute("y", yH);
        merc.setAttribute("height", Math.max(0, BASE - yH));
        hRule.setAttribute("y1", yH);
        hRule.setAttribute("y2", yH);
        hLbl.setAttribute("y", yH + 12);
        hLbl.textContent = c.hSym + " = " + num(c.h, c.hDig || 2);
        const hasCeil = typeof c.ceil === "number";
        ceilRule.classList.toggle("is-hidden", !hasCeil);
        ceilLbl.classList.toggle("is-hidden", !hasCeil);
        if (hasCeil) {
          const yC = yBits(c.ceil);
          ceilRule.setAttribute("y1", yC);
          ceilRule.setAttribute("y2", yC);
          ceilLbl.setAttribute("y", yC - 3);
          ceilLbl.textContent = c.ceilSym + " = " + num(c.ceil, c.ceilDig || 2);
        }
        const hasMark = typeof c.mark === "number";
        markRule.classList.toggle("is-hidden", !hasMark);
        markLbl.classList.toggle("is-hidden", !hasMark);
        if (hasMark) {
          const yM = yBits(c.mark);
          markRule.setAttribute("y1", yM);
          markRule.setAttribute("y2", yM);
          markLbl.setAttribute("y", yM + 12);
          markLbl.textContent = c.markSym + " = " + num(c.mark, 2);
        }
        setNote(c.note);
        noteB.textContent = c.numB || "";
      };
    }
  });
})();
