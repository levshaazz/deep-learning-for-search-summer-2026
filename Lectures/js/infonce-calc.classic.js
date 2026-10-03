/* AUTO-GENERATED offline classic bundle of widgets/infonce-calc/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/infonce-calc/logic.js
  var mountInfonceCalc = defineWidget({
    id: "infonce-calc",
    rootClass: "inc-root",
    exportName: "mountInfonceCalc",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const sp = data && data.spine || {};
      const pos = sp.positive || { label: "positive", cosQ: 0.82 };
      const lineup = sp.lineup || [];
      const inf = sp.infonce || [];
      const logN = sp.logNBound || [];
      const f2 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(2);
      const rows = [
        { id: "dPlus", label: pos.label, cosQ: pos.cosQ, pos: true },
        ...lineup.map((n) => ({ id: n.id, label: n.label, cosQ: n.cosQ, pos: false, isFalse: n.isFalse }))
      ];
      const byTau = (t) => inf.find((r) => r.tau === t) || inf[0] || { softmax: [], pPos: 0, loss: 0, tau: t };
      const SOFT = byTau(0.2), MID = byTau(0.1), SHARP = byTau(0.05);
      const W = 600, PAD = 20, LBL = 168, rowH = 34, top = 64;
      const barX = PAD + LBL, barMax = W - PAD - barX - 56;
      const rowCy = (i) => top + i * rowH + rowH / 2;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg inc-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      layer("head", 0);
      add("head", el("text", { x: PAD, y: 24, class: "inc-head" }, svg)).textContent = labels.head || "q scored against d\u207A and the negatives";
      add("head", el("text", { x: barX, y: 50, class: "inc-sub" }, svg)).textContent = labels.simHead || "cos(q, \xB7)";
      const bars = [], vals = [], simbars = [];
      rows.forEach((r, i) => {
        layer("row" + i, 0);
        const cls = r.pos ? "inc-pos" : r.isFalse ? "inc-false" : "inc-neg";
        add("row" + i, el("text", { x: PAD, y: rowCy(i) + 4, class: "inc-rowlbl " + cls }, svg)).textContent = (r.pos ? "d\u207A " : r.id + " ") + r.label + (r.isFalse ? " \u26A0" : "");
        add("row" + i, el("rect", { x: barX, y: rowCy(i) - 11, width: barMax, height: 22, rx: 5, class: "inc-barbg" }, svg));
        const sb = add("row" + i, el("rect", { x: barX, y: rowCy(i) - 11, width: Math.max(2, barMax * r.cosQ), height: 22, rx: 5, class: "inc-simbar " + cls }, svg));
        simbars.push(sb);
        const b = add("row" + i, el("rect", { x: barX, y: rowCy(i) - 11, width: 0, height: 22, rx: 5, class: "inc-bar " + cls }, svg));
        b.classList.add("is-hidden");
        bars.push(b);
        vals.push(add("row" + i, el("text", { x: barX + barMax + 8, y: rowCy(i) + 5, class: "inc-val " + cls }, svg)));
        vals[i].textContent = f2(r.cosQ);
      });
      layer("loss", 1);
      const lossY = top + rows.length * rowH + 24;
      const lossT = add("loss", el("text", { x: PAD, y: lossY, class: "inc-loss" }, svg));
      layer("ceil", 4);
      const cy = lossY + 30;
      add("ceil", el("text", { x: PAD, y: cy, class: "inc-sub" }, svg)).textContent = labels.ceilHead || "more negatives N raise the ceiling log N (the bound saturates there)";
      const cN = logN.slice(0, 6), maxLog = cN.length ? cN[cN.length - 1].logN_nats : 1;
      const cBarMax = W - PAD * 2 - 150;
      cN.forEach((r, i) => {
        const y = cy + 16 + i * 20;
        add("ceil", el("text", { x: PAD, y: y + 10, class: "inc-ceillbl" }, svg)).textContent = "N=" + r.N;
        add("ceil", el("rect", { x: PAD + 64, y, width: Math.max(2, cBarMax * (r.logN_nats / maxLog)), height: 13, rx: 3, class: "inc-ceilbar" }, svg));
        add("ceil", el("text", { x: PAD + 64 + cBarMax * (r.logN_nats / maxLog) + 6, y: y + 10, class: "inc-ceilval" }, svg)).textContent = "log N = " + r.logN_nats.toFixed(2);
      });
      const H = frameHeightFor(cy + 16 + cN.length * 20 + 8, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        const showSoftmax = k >= 1;
        const R = k >= 3 ? SHARP : k >= 2 ? MID : SOFT;
        rows.forEach((r, i) => {
          simbars[i].classList.toggle("is-hidden", showSoftmax);
          bars[i].classList.toggle("is-hidden", !showSoftmax);
          if (showSoftmax) {
            const p = R.softmax && R.softmax[i] || 0;
            bars[i].setAttribute("width", Math.max(2, barMax * p));
            vals[i].textContent = f2(p);
          } else {
            vals[i].textContent = f2(r.cosQ);
          }
        });
        if (showSoftmax) {
          lossT.textContent = (labels.lossLine || "L = \u2212log P\u207A") + " = " + R.loss.toFixed(2) + "   (P\u207A = " + R.pPos.toFixed(2) + ",  \u03C4 = " + R.tau + ")";
        }
      };
    }
  });
})();
