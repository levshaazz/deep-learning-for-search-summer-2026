/* AUTO-GENERATED offline classic bundle of widgets/hub-toll/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/hub-toll/logic.js
  var mountHubToll = defineWidget({
    id: "hub-toll",
    rootClass: "ht-root",
    exportName: "mountHubToll",
    maxStep: 5,
    render({ host, data, labels, el }) {
      const BASE = (data && data.phase) === "cure" ? 3 : 0;
      const T = data && data.hubToll || {};
      const byDim = T.byDim || {};
      const edges = T.histEdges || [0, 1, 3, 6, 10, 15, 21, 40];
      const flip = T.flipExample || {};
      const f4 = (x) => typeof x === "number" && isFinite(x) ? x.toFixed(4) : "\u2014";
      const f2 = (x) => typeof x === "number" && isFinite(x) ? x.toFixed(2) : "\u2014";
      const PLAN = [
        { dim: 2, rule: "raw", focus: false },
        { dim: 20, rule: "raw", focus: false },
        { dim: 20, rule: "raw", focus: false, nameHub: true },
        { dim: 20, rule: "raw", focus: true },
        { dim: 20, rule: "csls", focus: true },
        { dim: 20, rule: "csls", focus: false }
      ];
      const entry = (dim) => byDim["d" + dim] || {};
      const W = 660, H = 400;
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg ht-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const box = { x: 24, y: 32, w: 296, h: 244 };
      el("text", { x: box.x + box.w / 2, y: box.y - 12, class: "ht-head", "text-anchor": "middle" }, svg).textContent = labels.cloud || "the cloud \xB7 circle size = N_k";
      const links = [0, 1].map(() => el("line", { x1: 0, y1: 0, x2: 0, y2: 0, class: "ht-link", opacity: 0 }, svg));
      const N = (entry(20).points || []).length || 120;
      const dots = [];
      for (let i = 0; i < N; i += 1) dots.push(el("circle", { cx: box.x, cy: box.y, r: 2, class: "ht-pt" }, svg));
      const hb = { x: 380, y: 44, w: 250, h: 150 };
      el("text", { x: hb.x, y: hb.y - 14, class: "ht-head" }, svg).textContent = labels.hist || "how many points sit on N_k lists";
      el("line", { x1: hb.x, y1: hb.y + hb.h, x2: hb.x + hb.w, y2: hb.y + hb.h, class: "ht-axis" }, svg);
      const nb = edges.length - 1;
      const bw = hb.w / nb - 3;
      const bars = [];
      for (let i = 0; i < nb; i += 1) {
        bars.push(el("rect", { x: hb.x + i * (hb.w / nb) + 1.5, width: bw, y: hb.y + hb.h, height: 0, class: "ht-bar" }, svg));
        el("text", {
          x: hb.x + i * (hb.w / nb) + bw / 2 + 1.5,
          y: hb.y + hb.h + 14,
          class: "ht-lbl",
          "text-anchor": "middle"
        }, svg).textContent = i === nb - 1 ? `${edges[i]}+` : `${edges[i]}\u2013${edges[i + 1] - 1}`;
      }
      const statX = [hb.x, hb.x + 92, hb.x + 178];
      const statLbls = [labels.skew || "skew N_k", labels.maxNk || "max N_k", labels.anti || "anti-hubs"];
      const stats = statX.map((x, i) => {
        el("text", { x, y: hb.y + hb.h + 42, class: "ht-statlbl" }, svg).textContent = statLbls[i];
        return el("text", { x, y: hb.y + hb.h + 62, class: "ht-stat" }, svg);
      });
      const ruleLbl = el("text", { x: hb.x, y: hb.y + hb.h + 92, class: "ht-rule" }, svg);
      const dimLbl = el("text", { x: box.x, y: box.y + box.h + 22, class: "ht-head" }, svg);
      const corrLbl = el("text", { x: box.x, y: box.y + box.h + 42, class: "ht-lbl" }, svg);
      const flipLines = [0, 1, 2, 3].map((i) => el("text", { x: box.x, y: box.y + box.h + 42 + i * 19, class: "ht-flip" }, svg));
      return function update(k) {
        const p = PLAN[Math.max(0, Math.min(PLAN.length - 1, BASE + k))];
        const e = entry(p.dim);
        const side = e[p.rule] || {};
        const pts = e.points || [];
        const nk = (p.rule === "csls" ? e.nkCsls : e.nkRaw) || [];
        let lo = 0, hi = 0;
        pts.forEach((q) => {
          lo = Math.min(lo, q[0], q[1]);
          hi = Math.max(hi, q[0], q[1]);
        });
        const pad = (hi - lo) * 0.08 + 0.2;
        lo -= pad;
        hi += pad;
        const sq = Math.min(box.w, box.h);
        const ox = box.x + (box.w - sq) / 2, oy = box.y + (box.h - sq) / 2;
        const sx = (v) => ox + (v - lo) / (hi - lo) * sq;
        const sy = (v) => oy + sq - (v - lo) / (hi - lo) * sq;
        const maxNk = Math.max(1, ...nk.length ? nk : [1]);
        dots.forEach((c, i) => {
          const q = pts[i] || [0, 0];
          const v = nk[i] || 0;
          c.setAttribute("cx", sx(q[0]).toFixed(1));
          c.setAttribute("cy", sy(q[1]).toFixed(1));
          c.setAttribute("r", (2.2 + 7 * Math.sqrt(v / maxNk)).toFixed(2));
          let cls = "ht-pt";
          if (v === 0) cls += " is-anti";
          if (i === e.hubId && (p.nameHub || p.focus || v >= maxNk)) cls += " is-hub";
          if (p.focus && i === flip.alt) cls += " is-alt";
          if (p.focus && i === flip.query) cls += " is-query";
          c.setAttribute("class", cls);
        });
        const showFlip = !!p.focus && pts.length > 0;
        [[flip.hub, 0], [flip.alt, 1]].forEach(([target, i]) => {
          const ln = links[i];
          if (!showFlip || target == null) {
            ln.setAttribute("opacity", 0);
            return;
          }
          const a = pts[flip.query] || [0, 0], b = pts[target] || [0, 0];
          ln.setAttribute("x1", sx(a[0]).toFixed(1));
          ln.setAttribute("y1", sy(a[1]).toFixed(1));
          ln.setAttribute("x2", sx(b[0]).toFixed(1));
          ln.setAttribute("y2", sy(b[1]).toFixed(1));
          ln.setAttribute("opacity", 1);
          const hubWins = p.rule === "raw";
          const win = i === 0 === hubWins;
          ln.setAttribute("class", "ht-link " + (win ? "is-win" : "is-lose"));
        });
        const hist = side.hist || [];
        const hmax = Math.max(1, ...hist.length ? hist : [1]);
        bars.forEach((b, i) => {
          const h = (hist[i] || 0) / hmax * hb.h;
          b.setAttribute("y", (hb.y + hb.h - h).toFixed(1));
          b.setAttribute("height", h.toFixed(1));
        });
        const vals = [
          f4(side.skew),
          String(side.maxNk == null ? "\u2014" : side.maxNk),
          `${side.antiHubPct == null ? "\u2014" : side.antiHubPct}%`
        ];
        stats.forEach((t, i) => {
          t.textContent = vals[i];
          t.setAttribute("class", "ht-stat" + (p.rule === "csls" ? " is-good" : p.dim >= 20 ? " is-bad" : ""));
        });
        ruleLbl.textContent = p.rule === "csls" ? labels.ruleCsls || "rule: CSLS = 2\xB7d \u2212 r\u0304(q) \u2212 r\u0304(y)" : labels.ruleRaw || "rule: raw kNN by distance";
        dimLbl.textContent = `d = ${p.dim} \xB7 n = ${T.n || 120} \xB7 k = ${T.k || 5} \xB7 K = ${T.K || 10}`;
        if (showFlip) {
          corrLbl.textContent = "";
          const wins = p.rule === "raw" ? labels.hubWins : labels.altWins;
          flipLines[0].textContent = `q=#${flip.query}: d(q,#${flip.hub}) = ${f4(flip.dHub)} \xB7 d(q,#${flip.alt}) = ${f4(flip.dAlt)}`;
          flipLines[1].textContent = `r\u0304(#${flip.hub}) = ${f4(flip.rHub)} \xB7 r\u0304(#${flip.alt}) = ${f4(flip.rAlt)}`;
          flipLines[2].textContent = p.rule === "csls" ? `CSLS = ${f4(flip.cslsHub)} vs ${f4(flip.cslsAlt)}` : "";
          flipLines[3].textContent = wins || "";
          flipLines[3].setAttribute("class", "ht-flip" + (p.rule === "csls" ? " is-win" : ""));
        } else {
          flipLines.forEach((t) => {
            t.textContent = "";
          });
          corrLbl.textContent = p.nameHub ? `${labels.corr || "corr(N_k, closeness to centroid)"} = ${f2(side.corrToCentroid)}` : "";
        }
      };
    }
  });
})();
