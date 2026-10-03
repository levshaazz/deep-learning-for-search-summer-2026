/* AUTO-GENERATED offline classic bundle of widgets/transformer-block/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/transformer-block/logic.js
  var mountTransformerBlock = defineWidget({
    id: "transformer-block",
    rootClass: "tb-root",
    exportName: "mountTransformerBlock",
    maxStep: 5,
    render({ host, labels, el }) {
      const W = 480;
      const COLX = 150;
      const COLW = 200;
      const CX = COLX + COLW / 2;
      const RES_X = COLX + COLW + 28;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg tb-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const defs = el("defs", {}, svg);
      const mk = el("marker", {
        id: "tb-arrow",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: "tb-arrhead" }, mk);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      let y = 14;
      const boxH = 40, gap = 30;
      const ys = {};
      function reserve(name, h = boxH) {
        ys[name] = { y, h };
        y += h + gap;
      }
      reserve("stack", 30);
      reserve("addnorm2");
      reserve("ffn");
      reserve("addnorm1");
      reserve("mha");
      reserve("input");
      const totalBottom = y - gap + 10;
      function box(name, key, cls, textKey, subKey) {
        const b = ys[key];
        const g = el("g", {}, svg);
        el("rect", { x: COLX, y: b.y, width: COLW, height: b.h, rx: 8, class: `tb-box ${cls}` }, g);
        const t = el("text", {
          x: CX,
          y: b.y + (subKey ? b.h / 2 - 2 : b.h / 2 + 4),
          class: "tb-box-lbl",
          "text-anchor": "middle"
        }, g);
        t.textContent = labels[textKey] || textKey;
        if (subKey) {
          const s = el("text", {
            x: CX,
            y: b.y + b.h / 2 + 13,
            class: "tb-box-sub",
            "text-anchor": "middle"
          }, g);
          s.textContent = labels[subKey] || "";
        }
        add(name, g);
        return b;
      }
      function flow(name, fromKey, toKey) {
        const f = ys[fromKey], t = ys[toKey];
        add(name, el("line", {
          x1: CX,
          y1: f.y,
          x2: CX,
          y2: t.y + t.h,
          class: "tb-flow",
          "marker-end": "url(#tb-arrow)"
        }, svg));
      }
      function residual(name, srcKey, dstKey) {
        const src = ys[srcKey], dst = ys[dstKey];
        const yStart = src.y + src.h / 2;
        const yEnd = dst.y + dst.h / 2;
        const d = `M ${COLX + COLW} ${yStart} H ${RES_X} V ${yEnd} H ${COLX + COLW}`;
        add(name, el("path", { d, class: "tb-resid", fill: "none", "marker-end": "url(#tb-arrow)" }, svg));
        add(name, el("text", { x: RES_X + 6, y: (yStart + yEnd) / 2, class: "tb-resid-lbl" }, svg)).textContent = labels.residual || "skip";
        add(name, el("text", {
          x: (COLX + COLW + RES_X) / 2,
          y: yEnd - 5,
          class: "tb-resid-add",
          "text-anchor": "middle"
        }, svg)).textContent = "\u2295";
      }
      layer("input", 0);
      box("input", "input", "tb-input", "inputLbl", "inputSub");
      layer("mha", 1);
      box("mha", "mha", "tb-attn", "mhaLbl", "mhaSub");
      flow("mha", "input", "mha");
      layer("an1", 2);
      box("an1", "addnorm1", "tb-norm", "addNormLbl", "addNormSub");
      flow("an1", "mha", "addnorm1");
      residual("an1", "input", "addnorm1");
      layer("ffn", 3);
      box("ffn", "ffn", "tb-ffn", "ffnLbl", "ffnSub");
      flow("ffn", "addnorm1", "ffn");
      layer("an2", 4);
      box("an2", "addnorm2", "tb-norm", "addNormLbl", "addNormSub");
      flow("an2", "ffn", "addnorm2");
      residual("an2", "addnorm1", "addnorm2");
      layer("stack", 5);
      const an2 = ys.addnorm2, st = ys.stack;
      add("stack", el("line", {
        x1: CX,
        y1: an2.y,
        x2: CX,
        y2: st.y + st.h,
        class: "tb-flow",
        "marker-end": "url(#tb-arrow)"
      }, svg));
      add("stack", el("rect", {
        x: COLX - 16,
        y: ys.addnorm2.y - 8,
        width: COLW + 32 + 60,
        height: ys.input.y + ys.input.h - ys.addnorm2.y + 16,
        rx: 12,
        class: "tb-stackband",
        fill: "none"
      }, svg));
      add("stack", el("text", {
        x: st.y != null ? CX : CX,
        y: st.y + st.h / 2 + 4,
        class: "tb-stack-lbl",
        "text-anchor": "middle"
      }, svg)).textContent = labels.stackLbl || "repeat this block \xD7N (e.g. N = 6, 12, 24)";
      const H = frameHeightFor(totalBottom, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
