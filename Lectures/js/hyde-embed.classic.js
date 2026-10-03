/* AUTO-GENERATED offline classic bundle of widgets/hyde-embed/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/hyde-embed/logic.js
  var mountHydeEmbed = defineWidget({
    id: "hyde-embed",
    rootClass: "hyde-root",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const jump = data && data.cosineJump || { gold: [0.22, 0.63], trap: [0.45, 0.16] };
      const gRaw = jump.gold[0], gHyde = jump.gold[1];
      const tRaw = jump.trap[0], tHyde = jump.trap[1];
      const f2 = (x2) => x2.toFixed(2);
      const W = 560, H = 300, AX0 = 78, AX1 = 512, AXW = AX1 - AX0;
      const rawY = 112, hydeY = 214;
      const x = (c) => AX0 + Math.max(0, Math.min(1, c)) * AXW;
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "hyde-svg wgt-svg",
        role: labels.role || "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const txt = (name, ax, ay, cls, anchor, s) => {
        const t = add(name, el("text", { x: ax, y: ay, class: cls, "text-anchor": anchor || "middle" }, svg));
        t.textContent = s;
        return t;
      };
      function axis(name, rowY, withEnds) {
        add(name, el("line", { x1: AX0, y1: rowY, x2: AX1, y2: rowY, class: "hyde-axis" }, svg));
        for (const c of [0, 0.5, 1]) {
          add(name, el("line", { x1: x(c), y1: rowY - 5, x2: x(c), y2: rowY + 5, class: "hyde-tick" }, svg));
        }
        if (withEnds) {
          txt(name, AX0, rowY + 22, "hyde-end", "start", labels.farLabel || "0 \xB7 far");
          txt(name, AX1, rowY + 22, "hyde-end", "end", labels.nearLabel || "1 \xB7 identical");
        }
      }
      function marker(name, c, rowY, cls, label, above) {
        add(name, el("circle", { cx: x(c), cy: rowY, r: 6, class: "hyde-dot " + cls }, svg));
        const ly = above ? rowY - 12 : rowY + 26;
        txt(name, x(c), ly, "hyde-mlbl " + cls, "middle", `${label} \xB7 ${f2(c)}`);
      }
      layer("title", 0);
      txt("title", W / 2, 26, "hyde-title", "middle", labels.axisLabel || "cosine to the query");
      layer("rawAxis", 0);
      axis("rawAxis", rawY, true);
      txt("rawAxis", AX0, rawY - 26, "hyde-row", "start", labels.rawRow || "raw query");
      layer("rawMark", 1);
      marker("rawMark", gRaw, rawY, "hyde-gold", labels.goldLabel || "gold", true);
      marker("rawMark", tRaw, rawY, "hyde-trap", labels.trapLabel || "trap", false);
      layer("hydeAxis", 2);
      axis("hydeAxis", hydeY, false);
      txt("hydeAxis", AX0, hydeY - 26, "hyde-row", "start", labels.hydeRow || "HyDE pseudo-doc");
      layer("draft", 2);
      txt("draft", W / 2, H - 10, "hyde-note", "middle", labels.draftNote || "");
      layer("hydeMark", 3);
      marker("hydeMark", gHyde, hydeY, "hyde-gold", labels.goldLabel || "gold", true);
      marker("hydeMark", tHyde, hydeY, "hyde-trap", labels.trapLabel || "trap", false);
      layer("jump", 3);
      const defs = el("defs", {}, svg);
      const mk = el("marker", {
        id: "hyde-arrow",
        class: "hyde-mk",
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 7,
        markerHeight: 7,
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z" }, mk);
      for (const [c0, c1, cls] of [[gRaw, gHyde, "hyde-gold"], [tRaw, tHyde, "hyde-trap"]]) {
        add("jump", el("line", {
          x1: x(c0),
          y1: rawY + 8,
          x2: x(c1),
          y2: hydeY - 8,
          class: "hyde-jump " + cls,
          "marker-end": "url(#hyde-arrow)"
        }, svg));
      }
      const jn = (labels.jumpNote || "gold {a} \u2192 {b}").replace("{a}", f2(gRaw)).replace("{b}", f2(gHyde));
      txt("jump", W / 2, (rawY + hydeY) / 2 + 4, "hyde-jumpnote", "middle", jn);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
