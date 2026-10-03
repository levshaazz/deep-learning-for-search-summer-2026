/* AUTO-GENERATED offline classic bundle of widgets/raptor-tree/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_layout.js
  function stack(rect, items, opts = {}) {
    const dir = opts.dir === "col" || opts.dir === "column" || opts.dir === "vertical" ? "col" : "row";
    const gap = typeof opts.gap === "number" ? opts.gap : 12;
    const n = Array.isArray(items) ? items.length : items;
    if (!n || n < 1) return [];
    const weights = Array.isArray(items) ? items.map((it) => typeof it === "number" ? it : it && it.size || 1) : Array(n).fill(1);
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    const along = (dir === "row" ? rect.w : rect.h) - gap * (n - 1);
    const out = [];
    let cursor = dir === "row" ? rect.x : rect.y;
    for (let i = 0; i < n; i++) {
      const seg = along * weights[i] / total;
      out.push(dir === "row" ? { x: cursor, y: rect.y, w: seg, h: rect.h } : { x: rect.x, y: cursor, w: rect.w, h: seg });
      cursor += seg + gap;
    }
    return out;
  }

  // widgets/raptor-tree/logic.js
  var mountRaptorTree = defineWidget({
    id: "raptor-tree",
    rootClass: "rp-root",
    exportName: "mountRaptorTree",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const tree = data.tree || {};
      const levels = (tree.levels || []).map((lv) => lv && typeof lv.n === "number" ? lv.n : 0);
      const depth = tree.depth || levels.length;
      const nLevels = levels.length;
      const W = 560, PAD = 26;
      const topPad = 30;
      const levelGap = 92, nodeH = 30, nodeMaxW = 64;
      const levelY = (li) => topPad + 24 + (nLevels - 1 - li) * levelGap;
      const readTop = levelY(0) + nodeH + 34;
      const H = frameHeightFor(readTop + 22, 12);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg rp-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      layer("hdr", 0);
      add("hdr", el("text", { x: PAD, y: 20, class: "rp-sectlbl" }, svg)).textContent = (labels.title || "Recursive summary tree") + " \xB7 " + (labels.depth || "depth") + " = " + depth;
      const levelBoxes = levels.map((n, li) => {
        const w = Math.min(nodeMaxW, (W - 2 * PAD - 16 * (n - 1)) / Math.max(1, n));
        const span = n * w + 16 * (n - 1);
        const rect = { x: (W - span) / 2, y: levelY(li), w: span, h: nodeH };
        return stack(rect, n, { gap: 16 });
      });
      const levelCls = (li) => li === 0 ? "rp-leaf" : li === nLevels - 1 ? "rp-root-node" : "rp-summary";
      const levelTag = (li) => li === 0 ? labels.leaf || "leaf" : li === nLevels - 1 ? labels.root || "root" : labels.summary || "summary";
      function fanInEdges(name, fromStep, lowerLi, upperLi) {
        layer(name, fromStep);
        const lower = levelBoxes[lowerLi], upper = levelBoxes[upperLi];
        const per = Math.ceil(lower.length / Math.max(1, upper.length));
        lower.forEach((lb, i) => {
          const parent = upper[Math.min(upper.length - 1, Math.floor(i / per))];
          add(name, el("line", {
            x1: lb.x + lb.w / 2,
            y1: lb.y,
            x2: parent.x + parent.w / 2,
            y2: parent.y + parent.h,
            class: "rp-edge"
          }, svg));
        });
        add(name, el("text", { x: W - PAD, y: (lower[0].y + upper[0].y + upper[0].h) / 2, class: "rp-fanin", "text-anchor": "end" }, svg)).textContent = `${lower.length} \u2192 ${upper.length} (${labels.fanin || "fan-in"})`;
      }
      const nodeEls = levelBoxes.map((boxes, li) => {
        const name = "lvl" + li;
        layer(name, li);
        add(name, el("text", { x: 4, y: levelY(li) - 6, class: "rp-leveltag", "text-anchor": "start" }, svg)).textContent = levelTag(li);
        return boxes.map((b, i) => {
          const g = el("g", { class: "rp-nodeg" }, svg);
          add(name, g);
          el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 6, class: "rp-node " + levelCls(li) }, g);
          el("text", { x: b.x + b.w / 2, y: b.y + nodeH / 2 + 4, class: "rp-nodelbl", "text-anchor": "middle" }, g).textContent = i + 1;
          return g;
        });
      });
      for (let li = 0; li + 1 < nLevels; li++) fanInEdges("edge" + li, li + 1, li, li + 1);
      const rootBox = levelBoxes[nLevels - 1] && levelBoxes[nLevels - 1][0];
      const leafBox = levelBoxes[0] && levelBoxes[0][Math.floor((levels[0] - 1) / 2)];
      layer("q-broad", 3);
      if (rootBox) {
        const qx = rootBox.x + rootBox.w / 2;
        add("q-broad", el("text", { x: qx, y: rootBox.y - 14, class: "rp-querylbl is-broad", "text-anchor": "middle" }, svg)).textContent = labels.broadQuery || "broad query \u2192 overview";
        add("q-broad", el("path", { d: `M${qx} ${rootBox.y - 10} l-5 -8 l10 0 z`, class: "rp-qarrow is-broad" }, svg));
      }
      layer("q-detail", 4);
      if (leafBox) {
        const qx = leafBox.x + leafBox.w / 2;
        add("q-detail", el("text", { x: qx, y: leafBox.y + nodeH + 24, class: "rp-querylbl is-detail", "text-anchor": "middle" }, svg)).textContent = labels.detailQuery || "detail query \u2192 leaf";
        add("q-detail", el("path", { d: `M${qx} ${leafBox.y + nodeH + 10} l-5 8 l10 0 z`, class: "rp-qarrow is-detail" }, svg));
      }
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
        }
        const rootLi = nLevels - 1;
        nodeEls.forEach((els, li) => els.forEach((g) => {
          g.classList.toggle("is-target", k >= 3 && li === rootLi || k >= 4 && li === 0);
        }));
      };
    }
  });
})();
