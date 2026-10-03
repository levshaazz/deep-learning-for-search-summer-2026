/* AUTO-GENERATED offline classic bundle of widgets/cosine-sphere/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/cosine-sphere/logic.js
  var _uid = 0;
  var mountCosineSphere = defineWidget({
    id: "cosine-sphere",
    rootClass: "cs-root",
    bareRoot: true,
    scaffold: false,
    maxStep: 4,
    render({ host, data, labels, el, pairId }) {
      const pair = data.pairs.find((p) => p.id === (pairId || data.primary)) || data.pairs[0];
      const VB = data.coordSpace || { w: 520, h: 360 };
      const W = 520, H = 360;
      const O = { x: 80, y: 280 };
      const len = (a) => Math.hypot(a[0], a[1]);
      const maxLen = Math.max(len(pair.u), len(pair.v), 1);
      const unit = 200 / maxLen;
      const P = (vec) => ({ x: O.x + vec[0] * unit, y: O.y - vec[1] * unit });
      const norm = (a) => {
        const l = len(a) || 1;
        return [a[0] / l, a[1] / l];
      };
      const uid = "cs" + ++_uid;
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "cs-svg",
        role: labels.role || "img",
        "aria-label": labels.alt || ""
      }, host);
      const defs = el("defs", {}, svg);
      for (const [cls, id] of [["cs-mk-u", uid + "-u"], ["cs-mk-v", uid + "-v"]]) {
        const mk = el("marker", {
          id,
          class: cls,
          viewBox: "0 0 10 10",
          refX: 8,
          refY: 5,
          markerWidth: 7,
          markerHeight: 7,
          orient: "auto-start-reverse"
        }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 z" }, mk);
      }
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      layer("axes", 0);
      add("axes", el("line", { x1: 30, y1: O.y, x2: W - 20, y2: O.y, class: "cs-axis" }, svg));
      add("axes", el("line", { x1: O.x, y1: H - 20, x2: O.x, y2: 30, class: "cs-axis" }, svg));
      layer("unit", 3);
      add("unit", el("circle", { cx: O.x, cy: O.y, r: unit, class: "cs-unit" }, svg));
      const tu = P(pair.u), tv = P(pair.v);
      layer("vectors", 0);
      add("vectors", el("line", {
        x1: O.x,
        y1: O.y,
        x2: tu.x,
        y2: tu.y,
        class: "cs-vec cs-vec-u",
        "marker-end": `url(#${uid}-u)`
      }, svg));
      add("vectors", el("line", {
        x1: O.x,
        y1: O.y,
        x2: tv.x,
        y2: tv.y,
        class: "cs-vec cs-vec-v",
        "marker-end": `url(#${uid}-v)`
      }, svg));
      const tipLbl = (vec, tip, cls, txt) => {
        const d = norm(vec);
        const off = 16;
        add("vectors", el("text", {
          x: tip.x + d[0] * off,
          y: tip.y - d[1] * off + 5,
          class: "cs-lbl " + cls,
          "text-anchor": "middle"
        }, svg)).textContent = txt;
      };
      tipLbl(pair.u, tu, "cs-lbl-u", "u");
      tipLbl(pair.v, tv, "cs-lbl-v", "v");
      layer("euclid", 1);
      add("euclid", el("line", { x1: tu.x, y1: tu.y, x2: tv.x, y2: tv.y, class: "cs-euclid" }, svg));
      const em = { x: (tu.x + tv.x) / 2, y: (tu.y + tv.y) / 2 };
      const segx = tv.x - tu.x, segy = tv.y - tu.y;
      const segLen = Math.hypot(segx, segy) || 1;
      let nx = -segy / segLen, ny = segx / segLen;
      if ((em.x - O.x) * nx + (em.y - O.y) * ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      const NOFF = 14;
      let elx = em.x + nx * NOFF, ely = em.y + ny * NOFF + 4;
      elx = Math.max(38, Math.min(W - 8, elx));
      const eLbl = add("euclid", el("text", {
        x: elx,
        y: ely,
        class: "cs-tag cs-tag-euclid",
        "text-anchor": "middle"
      }, svg));
      eLbl.textContent = `\u2016u\u2212v\u2016 = ${pair.euclidExact || ""} \u2248 ${pair.euclid.toFixed(2)}`;
      layer("angle", 2);
      if (Math.abs(pair.angleDeg) > 1) {
        const a0 = Math.atan2(pair.u[1], pair.u[0]), a1 = Math.atan2(pair.v[1], pair.v[0]);
        const r = unit * 0.6, large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
        const sweep = a1 > a0 ? 0 : 1;
        add("angle", el("path", {
          class: "cs-arc",
          d: `M ${O.x + r * Math.cos(a0)} ${O.y - r * Math.sin(a0)} A ${r} ${r} 0 ${large} ${sweep} ${O.x + r * Math.cos(a1)} ${O.y - r * Math.sin(a1)}`
        }, svg));
      }
      const aTag = add("angle", el("text", { x: 12, y: 24, class: "cs-tag cs-tag-angle" }, svg));
      aTag.textContent = `${labels.angleLabel || "\u03B8"} = ${pair.angleDeg}\xB0   ${labels.cosLabel || "cos"} = ${pair.cos}`;
      const nu = P(norm(pair.u)), nv = P(norm(pair.v));
      add("unit", el("circle", { cx: nu.x, cy: nu.y, r: 5, class: "cs-dot cs-dot-u" }, svg));
      add("unit", el("circle", { cx: nv.x, cy: nv.y, r: 5, class: "cs-dot cs-dot-v" }, svg));
      const cap = document.createElement("div");
      cap.className = "cs-caption";
      host.appendChild(cap);
      const counter = document.createElement("div");
      counter.className = "cs-counter";
      host.appendChild(counter);
      const MAX = 4;
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        cap.textContent = labels["s" + k] || "";
        counter.textContent = `${k} / ${MAX}`;
      };
    }
  });
})();
