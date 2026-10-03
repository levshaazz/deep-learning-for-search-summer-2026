/* AUTO-GENERATED offline classic bundle of widgets/embedding-space/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function padDomain(min, max, frac = 0.08) {
    let span = max - min;
    if (!(span > 0)) span = Math.abs(min) || 1;
    const p = span * frac;
    return { min: min - p, max: max + p, span: max - min + 2 * p };
  }
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/embedding-space/logic.js
  var mountEmbeddingSpace = defineWidget({
    id: "embedding-space",
    rootClass: "es-root",
    exportName: "mountEmbeddingSpace",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const analogy = data.analogy || {};
      const top = analogy.top || [];
      const pairs = data.pairs || [];
      const answer = top[0] || { word: analogy.expected || "queen", cos: analogy.answerCos };
      const cos = (c) => typeof c !== "number" ? "" : String(+c.toFixed(4)).replace(/^0/, "").replace(/^-0/, "-");
      const LAY = {
        man: { x: 0.18, y: 0.2 },
        woman: { x: 0.82, y: 0.2 },
        king: { x: 0.18, y: 0.8 },
        queen: { x: 0.82, y: 0.8 }
      };
      const move = {
        x: LAY.king.x - LAY.man.x + LAY.woman.x,
        y: LAY.king.y - LAY.man.y + LAY.woman.y
      };
      const W = 480;
      const PAD_L = 16, PAD_T = 30;
      const plotH = 250;
      const RANK_W = 150;
      const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - RANK_W - 16, h: plotH };
      const rankColX = box.x + box.w + 18;
      const dx = padDomain(0, 1, 0.16), dy = padDomain(0, 1, 0.16);
      const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
      const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;
      const barsTop = PAD_T + plotH + 46;
      const barRow = 30;
      const barH = 16;
      const barX = 150;
      const barMaxW = W - barX - 56;
      const barsBottom = barsTop + pairs.length * barRow;
      const H = frameHeightFor(barsBottom, 14);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg es-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "es-frame" }, svg);
      const ttl = el("text", { x: box.x, y: box.y - 10, class: "es-title" }, svg);
      ttl.textContent = labels.mapTitle || "meaning map (2-D sketch)";
      const yax = el("text", { x: box.x + 6, y: box.y + 14, class: "es-axlbl" }, svg);
      yax.textContent = labels.axRoyalty || "royal \u2191";
      const xax = el("text", { x: box.x + box.w, y: box.y + box.h + 16, class: "es-axlbl", "text-anchor": "end" }, svg);
      xax.textContent = labels.axGender || "gender \u2192";
      function wordPoint(name, cls, key) {
        const p = LAY[name];
        const g = el("g", {}, svg);
        el("circle", { cx: sx(p.x), cy: sy(p.y), r: 6, class: `es-dot ${cls}` }, g);
        const t = el("text", { x: sx(p.x), y: sy(p.y) - 15, class: `es-word svg-halo ${cls}`, "text-anchor": "middle" }, g);
        t.textContent = name;
        return add(key, g);
      }
      layer("words", 0);
      wordPoint("man", "es-c-base", "words");
      wordPoint("woman", "es-c-base", "words");
      wordPoint("king", "es-c-king", "words");
      layer("arith", 1);
      const poly = add("arith", el("polyline", {
        points: [LAY.king, LAY.man, LAY.woman, move].map((p) => `${sx(p.x)},${sy(p.y)}`).join(" "),
        class: "es-paral"
      }, svg));
      const mg = el("g", {}, svg);
      el("path", { d: starPath(sx(move.x), sy(move.y), 8), class: "es-star" }, mg);
      const mlbl = el("text", { x: sx(move.x), y: sy(move.y) + 22, class: "es-movelbl", "text-anchor": "middle" }, mg);
      mlbl.textContent = labels.moveLabel || "king \u2212 man + woman";
      add("arith", mg);
      layer("answer", 2);
      const qg = el("g", {}, svg);
      el("circle", { cx: sx(LAY.queen.x), cy: sy(LAY.queen.y), r: 7, class: "es-dot es-c-queen" }, qg);
      const qt = el("text", { x: sx(LAY.queen.x), y: sy(LAY.queen.y) - 16, class: "es-word svg-halo es-c-queen", "text-anchor": "middle" }, qg);
      qt.textContent = answer.word;
      add("answer", qg);
      const rankG = el("g", {}, svg);
      const rx = rankColX, ry0 = box.y + 14;
      const rhead = el("text", { x: rx, y: ry0, class: "es-rankhead" }, rankG);
      rhead.textContent = labels.nearest || "nearest words";
      top.slice(0, 6).forEach((t, i) => {
        const ry = ry0 + 22 + i * 18;
        const isAns = i === 0;
        const r = el("text", { x: rx, y: ry, class: `es-rank${isAns ? " es-rank-top" : ""}` }, rankG);
        r.textContent = `${i + 1}. ${t.word}`;
        const c = el("text", { x: W - 8, y: ry, class: `es-rankcos${isAns ? " es-rank-top" : ""}`, "text-anchor": "end" }, rankG);
        c.textContent = cos(t.cos);
      });
      add("answer", rankG);
      layer("bars", 3);
      const bhead = el("text", { x: PAD_L, y: PAD_T + plotH + 28, class: "es-barshead" }, svg);
      bhead.textContent = labels.pairsTitle || "pairwise cosine \u2014 near means related";
      add("bars", bhead);
      pairs.forEach((p, i) => {
        const cy = barsTop + i * barRow;
        const g = el("g", {}, svg);
        const lab = el("text", { x: barX - 10, y: cy + barH - 3, class: "es-pairlbl", "text-anchor": "end" }, g);
        lab.textContent = `${p.a} \xB7 ${p.b}`;
        const frac = Math.max(0, Math.min(1, p.cos));
        el("rect", { x: barX, y: cy, width: barMaxW, height: barH, rx: 3, class: "es-bartrack" }, g);
        const hi = p.cos >= 0.7;
        el("rect", {
          x: barX,
          y: cy,
          width: Math.max(1, frac * barMaxW),
          height: barH,
          rx: 3,
          class: `es-barfill ${hi ? "es-bar-hi" : "es-bar-lo"}`
        }, g);
        const val = el("text", { x: barX + barMaxW + 8, y: cy + barH - 3, class: "es-barval" }, g);
        val.textContent = cos(p.cos);
        add("bars", g);
      });
      function starPath(cx, cy, r) {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const ang = -Math.PI / 2 + i * Math.PI / 5;
          const rad = i % 2 === 0 ? r : r * 0.42;
          pts.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
        }
        return "M" + pts.join("L") + "Z";
      }
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
        }
        mlbl.classList.toggle("is-hidden", k >= 2);
      };
    }
  });
})();
