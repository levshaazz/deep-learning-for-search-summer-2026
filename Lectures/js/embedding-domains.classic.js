/* AUTO-GENERATED offline classic bundle of widgets/embedding-domains/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/embedding-domains/logic.js
  var DOMAIN = {
    text: { color: "var(--accent, #2A6FDB)", labelKey: "dmText", corner: "tl" },
    image: { color: "var(--c-violet, #7D5BA6)", labelKey: "dmImage", corner: "tr" },
    audio: { color: "var(--c-amber, #E0A82E)", labelKey: "dmAudio", corner: "bl" },
    protein: { color: "var(--c-green, #3A8A5C)", labelKey: "dmProtein", corner: "br" }
  };
  var mountEmbeddingDomains = defineWidget({
    id: "embedding-domains",
    rootClass: "ed-root",
    exportName: "mountEmbeddingDomains",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const domains = data.domains || [];
      const W = 480;
      const PAD_L = 14, PAD_T = 30;
      const plotH = 300;
      const box = { x: PAD_L, y: PAD_T, w: W - 2 * PAD_L, h: plotH };
      const allX = [], allY = [];
      domains.forEach((dm) => (dm.points || []).forEach(([x, y]) => {
        allX.push(x);
        allY.push(y);
      }));
      const dx = padDomain(Math.min(...allX), Math.max(...allX), 0.22);
      const dy = padDomain(Math.min(...allY), Math.max(...allY), 0.22);
      const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
      const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;
      const legTop = PAD_T + plotH + 18;
      const legRow = 18;
      const legRows = Math.ceil(domains.length / 2);
      const H = frameHeightFor(legTop + legRows * legRow, 12);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg ed-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const frameRect = el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "ed-frame" }, svg);
      layer("axes", 2);
      add("axes", el("line", { x1: box.x, y1: sy(0), x2: box.x + box.w, y2: sy(0), class: "ed-axis" }, svg));
      add("axes", el("line", { x1: sx(0), y1: box.y, x2: sx(0), y2: box.y + box.h, class: "ed-axis" }, svg));
      const planeTtl = el("text", {
        x: box.x + box.w / 2,
        y: box.y - 10,
        class: "ed-title",
        "text-anchor": "middle"
      }, svg);
      planeTtl.textContent = labels.planeTitle || "one shared embedding space";
      function centroid(dm) {
        const pts = dm.points || [];
        const cx = pts.reduce((a, [x]) => a + sx(x), 0) / pts.length;
        const cy = pts.reduce((a, [, y]) => a + sy(y), 0) / pts.length;
        return { cx, cy };
      }
      domains.forEach((dm) => {
        const meta = DOMAIN[dm.id] || { color: "var(--ink-3, #6B7280)", corner: "tl" };
        const { cx, cy } = centroid(dm);
        const dmName = labels[meta.labelKey] || dm.id;
        const nTok = (dm.tokens || []).length;
        const blockH = 41 + Math.max(0, nTok - 1) * 13;
        const tx = meta.corner[1] === "l" ? box.x + 8 : box.x + box.w - 8;
        const anchor = meta.corner[1] === "l" ? "start" : "end";
        const ty = meta.corner[0] === "t" ? box.y + 16 : box.y + box.h - 8 - blockH;
        layer("thing-" + dm.id, 0);
        add("thing-" + dm.id, el("text", {
          x: tx,
          y: ty,
          class: "ed-dmname",
          "text-anchor": anchor,
          fill: meta.color
        }, svg)).textContent = dmName;
        add("thing-" + dm.id, el("text", {
          x: tx,
          y: ty + 13,
          class: "ed-thing",
          "text-anchor": anchor
        }, svg)).textContent = dm.thing || "";
        layer("tokens-" + dm.id, 1);
        add("tokens-" + dm.id, el("text", {
          x: tx,
          y: ty + 27,
          class: "ed-tokentag",
          "text-anchor": anchor
        }, svg)).textContent = (dm.token ? dm.token + " " : "") + (labels.tokensTag || "\u2192 tokens");
        (dm.tokens || []).forEach((tk, i) => {
          add("tokens-" + dm.id, el("text", {
            x: tx,
            y: ty + 41 + i * 13,
            class: "ed-token",
            "text-anchor": anchor
          }, svg)).textContent = tk;
        });
        layer("dots-" + dm.id, 2);
        (dm.points || []).forEach(([x, y], i) => {
          const dotX = sx(x), dotY = sy(y);
          add("dots-" + dm.id, el("circle", {
            cx: dotX,
            cy: dotY,
            r: 5,
            class: "ed-dot",
            fill: meta.color,
            stroke: "var(--bg-card, #fff)",
            "stroke-width": 1
          }, svg));
          if (i === 0) {
            const towardCx = meta.corner[1] === "l" ? 34 : -34;
            const towardCy = meta.corner[0] === "t" ? 26 : -22;
            const exX = Math.max(box.x + 26, Math.min(box.x + box.w - 26, dotX + towardCx));
            const exY = Math.max(box.y + 14, Math.min(box.y + box.h - 8, dotY + towardCy));
            add("dots-" + dm.id, el("text", {
              x: exX,
              y: exY,
              class: "ed-embedtag",
              "text-anchor": "middle",
              fill: meta.color
            }, svg)).textContent = labels.embedTag || "\u2192 embed";
          }
        });
      });
      layer("legend", 3);
      domains.forEach((dm, i) => {
        const meta = DOMAIN[dm.id] || { color: "var(--ink-3, #6B7280)" };
        const col = i % 2, row = Math.floor(i / 2);
        const lx = box.x + 8 + col * (box.w / 2);
        const ly = legTop + row * legRow;
        const g = el("g", {}, svg);
        el("rect", { x: lx, y: ly - 8, width: 10, height: 10, rx: 2, fill: meta.color }, g);
        el("text", { x: lx + 16, y: ly, class: "ed-leglbl" }, g).textContent = (labels[meta.labelKey] || dm.id) + " \xB7 " + (dm.token || "");
        add("legend", g);
      });
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const node of L.nodes) node.classList.toggle("is-hidden", !on);
        }
        planeTtl.classList.toggle("is-hidden", k < 3);
        frameRect.classList.toggle("ed-frame-strong", k >= 3);
      };
    }
  });
})();
