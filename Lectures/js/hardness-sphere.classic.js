/* AUTO-GENERATED offline classic bundle of widgets/hardness-sphere/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/hardness-sphere/logic.js
  var mountHardnessSphere = defineWidget({
    id: "hardness-sphere",
    rootClass: "hsp-root",
    exportName: "mountHardnessSphere",
    maxStep: 5,
    render({ host, data, labels, el }) {
      const sp = data && data.spine || {};
      const pos = sp.positive || { cosQ: 0.82 };
      const lineup = sp.lineup || [];
      const bz = sp.boltzmann || [];
      const f2 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(2);
      const byTau = (t) => bz.find((r) => r.tau === t) || bz[0] || { weights: [], tau: t };
      const SOFT = byTau(0.2), MID = byTau(0.1), SHARP = byTau(0.05);
      const W = 600, PAD = 20;
      const ox = PAD + 26, oy = 248, R = 196;
      const ang = (c) => Math.acos(Math.max(-1, Math.min(1, c)));
      const px = (c, rr) => ox + (rr == null ? R : rr) * Math.cos(ang(c));
      const py = (c, rr) => oy - (rr == null ? R : rr) * Math.sin(ang(c));
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg hsp-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      layer("bands", 1);
      const wedge = (c0, c1, cls) => {
        const a0 = ang(c0), a1 = ang(c1);
        const large = 0;
        const d = `M ${ox} ${oy} L ${(ox + R * Math.cos(a0)).toFixed(1)} ${(oy - R * Math.sin(a0)).toFixed(1)} A ${R} ${R} 0 ${large} 1 ${(ox + R * Math.cos(a1)).toFixed(1)} ${(oy - R * Math.sin(a1)).toFixed(1)} Z`;
        return add("bands", el("path", { d, class: "hsp-wedge " + cls }, svg));
      };
      wedge(0, 0.4, "hsp-easy");
      wedge(0.4, 0.55, "hsp-semi");
      wedge(0.55, 1, "hsp-hard");
      layer("arc", 0);
      add("arc", el("path", { d: `M ${ox + R} ${oy} A ${R} ${R} 0 0 0 ${px(0)} ${py(0)}`, class: "hsp-arc", fill: "none" }, svg));
      add("arc", el("line", { x1: ox, y1: oy, x2: ox + R + 14, y2: oy, class: "hsp-axis" }, svg));
      add("arc", el("text", { x: ox + R + 18, y: oy + 4, class: "hsp-axislbl" }, svg)).textContent = "q";
      const items = [
        { id: "d\u207A", cosQ: pos.cosQ, pos: true },
        ...lineup.map((n) => ({ id: n.id, label: n.label, cosQ: n.cosQ, band: n.band, isFalse: n.isFalse }))
      ];
      const legX = ox + R + 70, legTop = 40, legRowH = 30, legBarMax = W - PAD - (legX + 112);
      const dots = [], falseMarks = [], bars = [], wvals = [];
      items.forEach((it, i) => {
        const cls = it.pos ? "hsp-pos" : it.isFalse ? "hsp-false" : "hsp-neg";
        layer("pt" + i, 0);
        add("pt" + i, el("line", { x1: ox, y1: oy, x2: px(it.cosQ), y2: py(it.cosQ), class: "hsp-ray " + cls }, svg));
        add("pt" + i, el("circle", { cx: px(it.cosQ), cy: py(it.cosQ), r: it.pos ? 7 : 6, class: "hsp-dot " + cls }, svg));
        const lblR = it.cosQ >= 0.66 ? R + 16 + (it.cosQ - 0.66) * 380 : R + 14;
        add("pt" + i, el("text", {
          x: px(it.cosQ, lblR),
          y: py(it.cosQ, lblR) + 4,
          class: "hsp-dotlbl " + cls,
          "text-anchor": "middle"
        }, svg)).textContent = it.id;
        if (it.isFalse) {
          layer("false", 2);
          falseMarks.push(add("false", el("circle", { cx: px(it.cosQ), cy: py(it.cosQ), r: 11, class: "hsp-falsering", fill: "none" }, svg)));
        }
        const ly = legTop + i * legRowH;
        add("pt" + i, el("circle", { cx: legX, cy: ly, r: 5, class: "hsp-dot " + cls }, svg));
        add("pt" + i, el("text", { x: legX + 12, y: ly + 4, class: "hsp-leglbl " + cls }, svg)).textContent = it.pos ? "d\u207A" : it.id + (it.isFalse ? " \u26A0" : "");
        if (!it.pos) {
          layer("wt" + i, 3);
          add("wt" + i, el("rect", { x: legX + 56, y: ly - 8, width: legBarMax, height: 15, rx: 3, class: "hsp-barbg" }, svg));
          const b = add("wt" + i, el("rect", { x: legX + 56, y: ly - 8, width: 2, height: 15, rx: 3, class: "hsp-bar " + cls }, svg));
          bars[i] = b;
          wvals[i] = add("wt" + i, el("text", { x: legX + 56 + legBarMax + 5, y: ly + 4, class: "hsp-wval " + cls }, svg));
        }
      });
      add("arc", el("text", { x: legX, y: legTop - 16, class: "hsp-leghead" }, svg)).textContent = labels.weightHead || "gradient weight \u221D softmax(sim/\u03C4)";
      const H = frameHeightFor(oy + 30, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        if (k >= 3) {
          const Wt = k >= 5 ? SHARP : k >= 4 ? MID : SOFT;
          lineup.forEach((n, j) => {
            const i = j + 1;
            const w = Wt.weights && Wt.weights[j] || 0;
            if (bars[i]) bars[i].setAttribute("width", Math.max(2, (W - PAD - (ox + R + 70 + 112)) * w));
            if (wvals[i]) wvals[i].textContent = f2(w);
          });
        }
      };
    }
  });
})();
