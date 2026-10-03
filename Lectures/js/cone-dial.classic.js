/* AUTO-GENERATED offline classic bundle of widgets/cone-dial/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/cone-dial/logic.js
  var mountConeDial = defineWidget({
    id: "cone-dial",
    rootClass: "cd-root",
    exportName: "mountConeDial",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const D = data && data.anisotropyDial || {};
      const grid = D.snrGrid || [0];
      const dims = D.dims || [];
      const dim = D.canonicalDim != null ? D.canonicalDim : dims[dims.length - 1] || 0;
      const cells = D.cells || [];
      const at = (snr, dd) => cells.find((c) => c.snr === snr && c.dim === dd) || {};
      const ptsFor = (snr, key) => {
        const row = (D.points || []).find((r) => r && r.snr === snr);
        return row && row[key] || [];
      };
      const f2 = (x) => typeof x === "number" && isFinite(x) ? x.toFixed(2) : "\u2014";
      const f4 = (x) => typeof x === "number" && isFinite(x) ? x.toFixed(4) : "\u2014";
      const SNR_ISO = grid[0];
      const SNR_SOFT = grid.reduce((b, s) => Math.abs(s - 1.2247) < Math.abs(b - 1.2247) ? s : b, grid[0]);
      const SNR_HARD = grid.reduce((b, s) => Math.abs(s - 9.9499) < Math.abs(b - 9.9499) ? s : b, grid[0]);
      const SNR_MID = grid.reduce((b, s) => Math.abs(s - 3) < Math.abs(b - 3) ? s : b, grid[0]);
      const PLAN = [
        { snr: SNR_ISO, centered: false, sweep: false },
        { snr: SNR_SOFT, centered: false, sweep: false },
        { snr: SNR_HARD, centered: false, sweep: false },
        { snr: SNR_MID, centered: false, sweep: true },
        { snr: SNR_MID, centered: true, sweep: false }
      ];
      const W = 660, H = 372;
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg cd-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const box = { x: 24, y: 34, w: 290, h: 228 };
      el("text", { x: box.x + box.w / 2, y: box.y - 14, class: "cd-lbl-strong", "text-anchor": "middle" }, svg).textContent = labels.cloud || "the cloud (d = 2, for the eye)";
      const wedge = el("path", { d: "", class: "cd-wedge" }, svg);
      const axX = el("line", { x1: box.x, y1: box.y, x2: box.x, y2: box.y, class: "cd-axis" }, svg);
      const axY = el("line", { x1: box.x, y1: box.y, x2: box.x, y2: box.y, class: "cd-axis" }, svg);
      const originLbl = el("text", { x: box.x, y: box.y, class: "cd-lbl" }, svg);
      originLbl.textContent = "0";
      const dots = [];
      for (let i = 0; i < 80; i += 1) dots.push(el("circle", { cx: box.x, cy: box.y, r: 3, class: "cd-dot" }, svg));
      const gx = 476, gy = 196, GR = 104;
      el("path", { d: `M ${gx} ${gy - GR} A ${GR} ${GR} 0 0 1 ${gx + GR} ${gy}`, class: "cd-arc" }, svg);
      el("line", { x1: gx, y1: gy, x2: gx, y2: gy - GR - 8, class: "cd-needle-ref" }, svg);
      el("text", { x: gx, y: gy - GR - 14, class: "cd-lbl", "text-anchor": "middle" }, svg).textContent = "90\xB0";
      el("text", { x: gx + GR + 14, y: gy + 4, class: "cd-lbl", "text-anchor": "middle" }, svg).textContent = "0\xB0";
      el("text", { x: gx, y: gy + 26, class: "cd-lbl", "text-anchor": "middle" }, svg).textContent = labels.gauge || "mean angle, random pair";
      el("text", { x: gx, y: gy + 42, class: "cd-lbl", "text-anchor": "middle" }, svg).textContent = `d = ${dim}`;
      const needle = el("line", { x1: gx, y1: gy, x2: gx, y2: gy - GR, class: "cd-needle" }, svg);
      const cosLbl = el("text", { x: gx - 16, y: gy - 26, class: "cd-cos", "text-anchor": "end" }, svg);
      const angLbl = el("text", { x: gx - 16, y: gy - 4, class: "cd-ang", "text-anchor": "end" }, svg);
      const tx0 = box.x, tx1 = box.x + box.w, ty = 306;
      const smax = grid[grid.length - 1] || 1;
      const tpos = (s) => tx0 + s / smax * (tx1 - tx0);
      el("line", { x1: tx0, y1: ty, x2: tx1, y2: ty, class: "cd-track" }, svg);
      const trackOn = el("line", { x1: tx0, y1: ty, x2: tx0, y2: ty, class: "cd-track-on" }, svg);
      const knob = el("circle", { cx: tx0, cy: ty, r: 8, class: "cd-knob" }, svg);
      el("text", { x: tx0, y: ty + 24, class: "cd-lbl" }, svg).textContent = "c/\u03C3 = 0";
      el("text", { x: tx1, y: ty + 24, class: "cd-lbl", "text-anchor": "end" }, svg).textContent = `c/\u03C3 = ${f2(smax)}`;
      const snrLbl = el("text", { x: (tx0 + tx1) / 2, y: ty - 14, class: "cd-snr", "text-anchor": "middle" }, svg);
      const SWX = 352, SWY = 262;
      const dimRows = dims.map((dd, i) => el("text", { x: SWX, y: SWY + i * 20, class: "cd-dimrow is-off" }, svg));
      const formula = el("text", { x: SWX, y: SWY + dims.length * 20 + 12, class: "cd-formula" }, svg);
      return function update(k) {
        const plan = PLAN[Math.max(0, Math.min(PLAN.length - 1, k))];
        const cell = at(plan.snr, dim);
        const pts = ptsFor(plan.snr, plan.centered ? "centered" : "raw");
        let lo = -3.2, hi = 3.2;
        pts.forEach((p) => {
          lo = Math.min(lo, p[0], p[1]);
          hi = Math.max(hi, p[0], p[1]);
        });
        lo -= 1;
        hi += 1;
        const side = Math.min(box.w, box.h);
        const ox = box.x + (box.w - side) / 2, oy = box.y + (box.h - side) / 2;
        const sx2 = (v) => ox + (v - lo) / (hi - lo) * side;
        const sy2 = (v) => oy + side - (v - lo) / (hi - lo) * side;
        const zx = sx2(0), zy = sy2(0);
        axX.setAttribute("x1", ox);
        axX.setAttribute("y1", zy);
        axX.setAttribute("x2", ox + side);
        axX.setAttribute("y2", zy);
        axY.setAttribute("x1", zx);
        axY.setAttribute("y1", oy);
        axY.setAttribute("x2", zx);
        axY.setAttribute("y2", oy + side);
        originLbl.setAttribute("x", zx - 9);
        originLbl.setAttribute("y", zy + 13);
        dots.forEach((c, i) => {
          const p = pts[i] || [0, 0];
          c.setAttribute("cx", sx2(p[0]).toFixed(1));
          c.setAttribute("cy", sy2(p[1]).toFixed(1));
        });
        const angs = pts.map((p) => Math.atan2(p[1], p[0])).sort((a2, b) => a2 - b);
        let span = Infinity, from = 0;
        if (angs.length > 1) {
          let gap = -1, gi = 0;
          for (let i = 0; i < angs.length; i += 1) {
            const nxt = i === angs.length - 1 ? angs[0] + 2 * Math.PI : angs[i + 1];
            if (nxt - angs[i] > gap) {
              gap = nxt - angs[i];
              gi = i;
            }
          }
          from = angs[(gi + 1) % angs.length];
          span = 2 * Math.PI - gap;
        }
        if (span <= 2.6) {
          const R2 = side * 0.7, to = from + span;
          wedge.setAttribute("d", `M ${zx} ${zy} L ${(zx + R2 * Math.cos(from)).toFixed(1)} ${(zy - R2 * Math.sin(from)).toFixed(1)} A ${R2.toFixed(1)} ${R2.toFixed(1)} 0 0 0 ${(zx + R2 * Math.cos(to)).toFixed(1)} ${(zy - R2 * Math.sin(to)).toFixed(1)} Z`);
        } else {
          wedge.setAttribute("d", "");
        }
        const cosv = plan.centered ? cell.centeredCos : cell.meanPairCos;
        const angv = plan.centered ? Math.acos(Math.max(-1, Math.min(1, cosv || 0))) * 180 / Math.PI : cell.angleDeg;
        const a = (angv || 0) * Math.PI / 180;
        needle.setAttribute("x2", (gx + GR * Math.cos(a)).toFixed(1));
        needle.setAttribute("y2", (gy - GR * Math.sin(a)).toFixed(1));
        cosLbl.textContent = `cos = ${f2(cosv)}`;
        angLbl.textContent = `${(angv || 0).toFixed(1)}\xB0`;
        const sx = tpos(plan.snr);
        trackOn.setAttribute("x2", sx.toFixed(1));
        knob.setAttribute("cx", sx.toFixed(1));
        snrLbl.textContent = plan.centered ? `c/\u03C3 = ${f2(plan.snr)} \u2212 \u03BC` : `c/\u03C3 = ${f2(plan.snr)}   \xB7   d = ${dim}`;
        dimRows.forEach((t, i) => {
          const dd = dims[i];
          const c2 = at(plan.snr, dd);
          t.textContent = plan.sweep ? `d = ${String(dd).padStart(3, " ")}   cos = ${f4(c2.meanPairCos)}` : "";
          t.setAttribute("class", "cd-dimrow");
        });
        formula.textContent = plan.sweep ? labels.invariant || "E[cos] = c\xB2/(c\xB2+\u03C3\xB2) \u2014 no d" : "";
      };
    }
  });
})();
