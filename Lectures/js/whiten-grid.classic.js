/* AUTO-GENERATED offline classic bundle of widgets/whiten-grid/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/whiten-grid/logic.js
  var mountWhitenGrid = defineWidget({
    id: "whiten-grid",
    rootClass: "wg-root",
    exportName: "mountWhitenGrid",
    maxStep: 5,
    render({ host, data, labels, el }) {
      const T = data && data.whitenToy || {};
      const stages = T.stages || {};
      const raw = (stages.raw || {}).points || [];
      const cen = (stages.centered || {}).points || [];
      const wht = (stages.whitened || {}).points || [];
      const U = T.U || [[1, 0], [0, 1]];
      const SIG = T.sigma || [[0, 0], [0, 0]];
      const LAM = T.eigenvalues || [1, 1];
      const f4 = (x) => typeof x === "number" && isFinite(x) ? x.toFixed(4) : "\u2014";
      const f2 = (x) => typeof x === "number" && isFinite(x) ? x.toFixed(2) : "\u2014";
      const rot = cen.map((p) => [p[0] * U[0][0] + p[1] * U[0][1], p[0] * U[1][0] + p[1] * U[1][1]]);
      const STAGE = [raw, cen, cen, rot, wht, wht];
      const SHOW_EIG = [false, false, true, true, false, false];
      const COS_OF = [stages.raw, stages.centered, stages.centered, stages.centered, stages.centered, stages.whitened];
      const W = 700, H = 340;
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg wg-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const box = { x: 30, y: 34, w: 300, h: 272 };
      el("text", { x: box.x + box.w / 2, y: box.y - 14, class: "wg-head", "text-anchor": "middle" }, svg).textContent = labels.map || "four cities on the map";
      const GRID_N = 4;
      const gridH = [], gridV = [];
      for (let i = -GRID_N; i <= GRID_N; i += 1) {
        gridH.push(el("path", { d: "", class: "wg-grid" }, svg));
        gridV.push(el("path", { d: "", class: "wg-grid" }, svg));
      }
      const axX = el("line", { x1: 0, y1: 0, x2: 0, y2: 0, class: "wg-axis" }, svg);
      const axY = el("line", { x1: 0, y1: 0, x2: 0, y2: 0, class: "wg-axis" }, svg);
      const eig1 = el("line", { x1: 0, y1: 0, x2: 0, y2: 0, class: "wg-eig" }, svg);
      const eig2 = el("line", { x1: 0, y1: 0, x2: 0, y2: 0, class: "wg-eig" }, svg);
      const rays = [0, 1].map(() => el("line", { x1: 0, y1: 0, x2: 0, y2: 0, class: "wg-ray" }, svg));
      const cities = raw.map((_, i) => el("circle", {
        cx: 0,
        cy: 0,
        r: i < 2 ? 7 : 6,
        class: "wg-city" + (i < 2 ? " is-stranger" : "")
      }, svg));
      const cityLbls = raw.map((_, i) => {
        const t = el("text", { x: 0, y: 0, class: "wg-citylbl" }, svg);
        t.textContent = String.fromCharCode(65 + i);
        return t;
      });
      const rx = 380;
      el("text", { x: rx, y: box.y - 14, class: "wg-head" }, svg).textContent = labels.cosines || "all six pairwise cosines";
      const pairs = ((stages.raw || {}).cosines || {}).pairs || [];
      const rowLbl = pairs.map((p, i) => {
        const t = el("text", { x: rx, y: box.y + 16 + i * 22, class: "wg-lbl" }, svg);
        t.textContent = `${String.fromCharCode(65 + p[0])}\xB7${String.fromCharCode(65 + p[1])}`;
        return t;
      });
      const rowVal = pairs.map((_, i) => el("text", { x: rx + 52, y: box.y + 16 + i * 22, class: "wg-val" }, svg));
      const meanLbl = el("text", { x: rx, y: box.y + 22 + pairs.length * 22 + 8, class: "wg-mean" }, svg);
      const matLines = [0, 1, 2].map((i) => el("text", { x: rx, y: box.y + 22 + pairs.length * 22 + 38 + i * 20, class: "wg-mat" }, svg));
      if (!rowLbl.length) meanLbl.textContent = "";
      return function update(k) {
        const step = Math.max(0, Math.min(5, k));
        const pts = STAGE[step] || [];
        let lo = -1.6, hi = 1.6;
        pts.forEach((p) => {
          lo = Math.min(lo, p[0], p[1]);
          hi = Math.max(hi, p[0], p[1]);
        });
        const pad = (hi - lo) * 0.12 + 0.4;
        lo -= pad;
        hi += pad;
        const side = Math.min(box.w, box.h);
        const ox = box.x + (box.w - side) / 2, oy = box.y + (box.h - side) / 2;
        const sx = (v) => ox + (v - lo) / (hi - lo) * side;
        const sy = (v) => oy + side - (v - lo) / (hi - lo) * side;
        const zx = sx(0), zy = sy(0);
        const want = Math.max(1e-3, (hi - lo) / 8);
        const P = Math.max([0.25, 0.5, 1, 2, 5, 10, 20].find((v) => v >= want) || 20, (hi - lo) / 8);
        const iMin = Math.ceil(lo / P - 1e-9);
        for (let j = 0; j < gridH.length; j += 1) {
          const v = (iMin + j) * P;
          if (v > hi + 1e-9) {
            gridH[j].setAttribute("d", "");
            gridV[j].setAttribute("d", "");
            continue;
          }
          gridH[j].setAttribute("d", `M ${ox} ${sy(v).toFixed(1)} L ${(ox + side).toFixed(1)} ${sy(v).toFixed(1)}`);
          gridV[j].setAttribute("d", `M ${sx(v).toFixed(1)} ${oy} L ${sx(v).toFixed(1)} ${(oy + side).toFixed(1)}`);
        }
        axX.setAttribute("x1", ox);
        axX.setAttribute("y1", zy);
        axX.setAttribute("x2", ox + side);
        axX.setAttribute("y2", zy);
        axY.setAttribute("x1", zx);
        axY.setAttribute("y1", oy);
        axY.setAttribute("x2", zx);
        axY.setAttribute("y2", oy + side);
        const showEig = SHOW_EIG[step];
        const R = side * 0.44;
        [[eig1, U[0]], [eig2, U[1]]].forEach(([ln, u]) => {
          ln.setAttribute("x1", (zx - R * u[0]).toFixed(1));
          ln.setAttribute("y1", (zy + R * u[1]).toFixed(1));
          ln.setAttribute("x2", (zx + R * u[0]).toFixed(1));
          ln.setAttribute("y2", (zy - R * u[1]).toFixed(1));
          ln.setAttribute("opacity", showEig ? "1" : "0");
        });
        pts.forEach((p, i) => {
          cities[i].setAttribute("cx", sx(p[0]).toFixed(1));
          cities[i].setAttribute("cy", sy(p[1]).toFixed(1));
          cityLbls[i].setAttribute("x", (sx(p[0]) + 10).toFixed(1));
          cityLbls[i].setAttribute("y", (sy(p[1]) + 4).toFixed(1));
        });
        [0, 1].forEach((i) => {
          const p = pts[i] || [0, 0];
          rays[i].setAttribute("x1", zx);
          rays[i].setAttribute("y1", zy);
          rays[i].setAttribute("x2", sx(p[0]).toFixed(1));
          rays[i].setAttribute("y2", sy(p[1]).toFixed(1));
        });
        const ct = (COS_OF[step] || {}).cosines || {};
        const vals = ct.cos || [];
        rowVal.forEach((t, i) => {
          const v = vals[i];
          t.textContent = f4(v);
          t.setAttribute("class", "wg-val" + (i === 0 ? Math.abs(v) < 1e-9 ? " is-cool" : " is-hot" : ""));
        });
        meanLbl.textContent = `${labels.mean || "mean"} = ${f4(ct.mean)}`;
        if (step === 2 || step === 3) {
          matLines[0].textContent = `\u03A3 = [[${f2(SIG[0][0])}, ${f2(SIG[0][1])}], [${f2(SIG[1][0])}, ${f2(SIG[1][1])}]]`;
          matLines[1].textContent = `\u03BB\u2081 = ${f2(LAM[0])}   \u03BB\u2082 = ${f2(LAM[1])}   \u03BA = ${f2(T.conditionNumber)}`;
          matLines[2].textContent = labels.offdiag || "the off-diagonal is the leftover shear";
        } else if (step >= 4) {
          matLines[0].textContent = "W = U \u039B^(\u22121/2)";
          matLines[1].textContent = `1/\u221A\u03BB = ${f4((T.scale || [])[0])}, ${f4((T.scale || [])[1])}`;
          matLines[2].textContent = labels.square || "the diamond is now a square";
        } else {
          matLines.forEach((t) => {
            t.textContent = "";
          });
        }
      };
    }
  });
})();
