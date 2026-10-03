/* AUTO-GENERATED offline classic bundle of widgets/ivf-cells/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function padDomain(min, max, frac = 0.08) {
    let span = max - min;
    if (!(span > 0)) span = Math.abs(min) || 1;
    const p = span * frac;
    return { min: min - p, max: max + p, span: max - min + 2 * p };
  }
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/ivf-cells/logic.js
  var CELL_CLS = ["iv-c0", "iv-c1", "iv-c2"];
  var CELL_CLS5 = ["iv-c0", "iv-c1", "iv-c2", "iv-c3", "iv-c4"];
  var mountIvfCells = defineWidget({
    id: "ivf-cells",
    rootClass: "iv-root",
    exportName: "mountIvfCells",
    maxStep: 6,
    // toy2 walks 0..6; the toy path clamps itself to 0..3 (back-compat)
    render(ctx) {
      if ((ctx.labels && ctx.labels.variant) === "toy2") return renderToy2(ctx);
      return renderToy(ctx);
    }
  });
  function renderToy({ host, data, labels, el }) {
    const toy = data.toy || data;
    const pts = toy.points || [];
    const assign = toy.assign || [];
    const cents = toy.centroids || [];
    const q = toy.query || [0, 0];
    const trueNN = toy.trueNN || [];
    const rank = toy.cellRankByDist || cents.map((_, i) => i);
    const probe = toy.probe || {};
    const W = 480, PAD = 22, plotH = 270, topPad = 44;
    const xs = pts.map((p) => p[0]).concat(cents.map((c) => c[0]), q[0]);
    const ys = pts.map((p) => p[1]).concat(cents.map((c) => c[1]), q[1]);
    const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.14);
    const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
    const box = { x: PAD, y: topPad, w: W - 2 * PAD, h: plotH };
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;
    const readTop = box.y + box.h + 18;
    const H = frameHeightFor(readTop + 22, 12);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg iv-svg", role: "img", "aria-label": labels.alt || "" }, host);
    const cellRegion = cents.map((c, ci) => {
      const members = pts.filter((_, i) => assign[i] === ci).concat([c]);
      const mx = members.reduce((a, p) => a + sx(p[0]), 0) / members.length;
      const my = members.reduce((a, p) => a + sy(p[1]), 0) / members.length;
      const r = Math.max(28, ...members.map((p) => Math.hypot(sx(p[0]) - mx, sy(p[1]) - my))) + 16;
      return el("circle", { cx: mx, cy: my, r, class: "iv-cell " + CELL_CLS[ci] }, svg);
    });
    const ptEl = pts.map((p, i) => {
      const g = el("g", { class: "iv-pt " + CELL_CLS[assign[i]] }, svg);
      if (trueNN.includes(i)) el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 11, class: "iv-nnring" }, g);
      el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 6, class: "iv-dot" }, g);
      return g;
    });
    cents.forEach((c, ci) => {
      const cx = sx(c[0]), cy = sy(c[1]);
      el("path", { d: `M${cx} ${cy - 9} L${cx + 9} ${cy} L${cx} ${cy + 9} L${cx - 9} ${cy} Z`, class: "iv-cent " + CELL_CLS[ci] }, svg);
      el("text", { x: cx, y: cy - 13, class: "iv-clbl", "text-anchor": "middle" }, svg).textContent = "c" + ci;
    });
    const qx = sx(q[0]), qy = sy(q[1]);
    const qEl = el("g", { class: "iv-queryg is-hidden" }, svg);
    el("path", { d: `M${qx} ${qy - 9} L${qx + 9} ${qy} L${qx} ${qy + 9} L${qx - 9} ${qy} Z`, class: "iv-query" }, qEl);
    el("text", { x: qx + 13, y: qy + 4, class: "iv-qlbl" }, qEl).textContent = labels.query || "query";
    const readHead = el("text", { x: PAD, y: readTop, class: "iv-readhead" }, svg);
    function applyProbe(nprobe) {
      const cells = probe[String(nprobe)] && probe[String(nprobe)].cells || rank.slice(0, nprobe);
      cellRegion.forEach((c, ci) => c.classList.toggle("is-probed", cells.includes(ci)));
      cellRegion.forEach((c, ci) => c.classList.toggle("is-dim", !cells.includes(ci)));
      ptEl.forEach((g, i) => {
        const inProbed = cells.includes(assign[i]);
        g.classList.toggle("is-dim", !inProbed);
        if (trueNN.includes(i)) {
          g.classList.toggle("is-found", inProbed);
          g.classList.toggle("is-missed", !inProbed);
        }
      });
      const rec = probe[String(nprobe)] ? probe[String(nprobe)].recall : 0;
      const found = probe[String(nprobe)] ? probe[String(nprobe)].found.length : 0;
      readHead.textContent = `nprobe = ${nprobe} \xB7 ${labels.probed || "probe cells"} {${cells.map((c) => "c" + c).join(", ")}} \xB7 ${labels.found || "found"} ${found}/${trueNN.length} \xB7 recall@${toy.k || 3} = ${rec}`;
    }
    function clearProbe(msg) {
      cellRegion.forEach((c) => c.classList.remove("is-probed", "is-dim"));
      ptEl.forEach((g) => g.classList.remove("is-dim", "is-found", "is-missed"));
      readHead.textContent = msg || "";
    }
    return function update(k0) {
      const k = Math.min(k0, 3);
      qEl.classList.toggle("is-hidden", k < 1);
      if (k <= 0) clearProbe(labels.readPoints || "9 vectors, assigned to the nearest of 3 centroids (cells)");
      else if (k === 1) clearProbe(`${labels.qLands || "the query lands in its cell"}: c${toy.queryCell != null ? toy.queryCell : 0}`);
      else applyProbe(Math.min(k - 1, 2));
    };
  }
  function renderToy2({ host, data, labels, el }) {
    const toy = data.toy2 || {};
    const pts = toy.points || [];
    const assign = toy.assign || [];
    const cents = toy.centroids || [];
    const q = toy.query || [0, 0];
    const trueNN = toy.trueNN || [];
    const rank = toy.cellRankByDist || cents.map((_, i) => i);
    const sweep = toy.sweep || [];
    const k = toy.k || 5;
    const cls = (ci) => CELL_CLS5[ci % CELL_CLS5.length];
    const W = 480, PAD = 22, plotH = 280, topPad = 44;
    const xs = pts.map((p) => p[0]).concat(cents.map((c) => c[0]), q[0]);
    const ys = pts.map((p) => p[1]).concat(cents.map((c) => c[1]), q[1]);
    const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.14);
    const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
    const box = { x: PAD, y: topPad, w: W - 2 * PAD, h: plotH };
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;
    const readTop = box.y + box.h + 18, readRow = 18;
    const H = frameHeightFor(readTop + 2 * readRow, 12);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg iv-svg", role: "img", "aria-label": labels.alt || "" }, host);
    const centScr = cents.map((c) => ({ x: sx(c[0]), y: sy(c[1]) }));
    const cellRegion = cents.map((c, ci) => {
      let nearest = Infinity;
      centScr.forEach((o, oi) => {
        if (oi === ci) return;
        nearest = Math.min(nearest, Math.hypot(centScr[ci].x - o.x, centScr[ci].y - o.y));
      });
      const r = Math.min(72, Math.max(22, (isFinite(nearest) ? nearest : 80) * 0.5));
      return el("circle", { cx: centScr[ci].x, cy: centScr[ci].y, r, class: "iv-cell " + cls(ci) }, svg);
    });
    const ptEl = pts.map((p, i) => {
      const g = el("g", { class: "iv-pt " + cls(assign[i]) }, svg);
      if (trueNN.includes(i)) el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 10, class: "iv-nnring" }, g);
      el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 5.5, class: "iv-dot" }, g);
      return g;
    });
    cents.forEach((c, ci) => {
      const cx = sx(c[0]), cy = sy(c[1]);
      el("path", { d: `M${cx} ${cy - 8} L${cx + 8} ${cy} L${cx} ${cy + 8} L${cx - 8} ${cy} Z`, class: "iv-cent " + cls(ci) }, svg);
      const nearQ = Math.abs(cx - sx(q[0])) < 22 && Math.abs(cy - sy(q[1])) < 22;
      el("text", {
        x: nearQ ? cx - 13 : cx,
        y: nearQ ? cy + 20 : cy - 12,
        class: "iv-clbl",
        "text-anchor": nearQ ? "end" : "middle"
      }, svg).textContent = "c" + ci;
    });
    const qx = sx(q[0]), qy = sy(q[1]);
    const qEl = el("g", { class: "iv-queryg is-hidden" }, svg);
    el("path", { d: `M${qx} ${qy - 9} L${qx + 9} ${qy} L${qx} ${qy + 9} L${qx - 9} ${qy} Z`, class: "iv-query" }, qEl);
    el("text", { x: qx + 13, y: qy + 4, class: "iv-qlbl" }, qEl).textContent = labels.query || "query";
    const readHead = el("text", { x: PAD, y: readTop, class: "iv-readhead" }, svg);
    const readSub = el("text", { x: PAD, y: readTop + readRow, class: "iv-readhead" }, svg);
    function applyStep(s, prev) {
      const cells = s.cellsProbed || rank.slice(0, s.nprobe);
      const found = s.found || [];
      cellRegion.forEach((c, ci) => {
        c.classList.toggle("is-probed", cells.includes(ci));
        c.classList.toggle("is-dim", !cells.includes(ci));
      });
      ptEl.forEach((g, i) => {
        const inProbed = cells.includes(assign[i]);
        g.classList.toggle("is-dim", !inProbed);
        if (trueNN.includes(i)) {
          g.classList.toggle("is-found", found.includes(i));
          g.classList.toggle("is-missed", !found.includes(i));
        }
      });
      const noGain = prev && s.recall === prev.recall && s.pointsScanned > prev.pointsScanned;
      const prevCells = prev && (prev.cellsProbed || rank.slice(0, prev.nprobe)) || [];
      cellRegion.forEach((c, ci) => {
        c.classList.toggle("is-wasted", noGain && cells.includes(ci) && !prevCells.includes(ci));
      });
      readHead.textContent = `nprobe = ${s.nprobe} \xB7 ${labels.probed || "probe cells"} {${cells.map((c) => "c" + c).join(", ")}}`;
      readSub.textContent = `${labels.scanned || "points scanned"} ${s.pointsScanned} \xB7 ${labels.found || "found"} ${found.length}/${trueNN.length} \xB7 recall@${k} = ${s.recall}`;
    }
    function clearProbe(head, sub) {
      cellRegion.forEach((c) => c.classList.remove("is-probed", "is-dim", "is-wasted"));
      ptEl.forEach((g) => g.classList.remove("is-dim", "is-found", "is-missed"));
      readHead.textContent = head || "";
      readSub.textContent = sub || "";
    }
    return function update(kk) {
      qEl.classList.toggle("is-hidden", kk < 1);
      if (kk <= 0) {
        clearProbe(labels.readPoints5 || `${pts.length} vectors, assigned to the nearest of ${cents.length} centroids (cells)`, "");
      } else if (kk === 1) {
        clearProbe(
          `${labels.qLands || "the query lands in its cell"}: c${toy.queryCell != null ? toy.queryCell : 0}`,
          `${labels.trueNNlbl || "true nearest neighbours"} (k=${k}): ${trueNN.length} ${labels.ringed || "ringed"}`
        );
      } else {
        const idx = Math.min(kk - 2, sweep.length - 1);
        if (sweep[idx]) applyStep(sweep[idx], idx > 0 ? sweep[idx - 1] : null);
      }
    };
  }
})();
