/* AUTO-GENERATED offline classic bundle of widgets/positional-enc/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/positional-enc/logic.js
  var mountPositionalEnc = defineWidget({
    id: "positional-enc",
    rootClass: "pe-root",
    exportName: "mountPositionalEnc",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const grid = data.grid || [];
      const nPos = data.nPos != null ? data.nPos : grid.length;
      const d = data.d != null ? data.d : grid[0] ? grid[0].length : 0;
      const formula = data.formula || "PE(pos,2i)=sin(pos/10000^{2i/d}); PE(pos,2i+1)=cos(...)";
      const W = 480;
      const PAD_L = 56;
      const PAD_T = 74;
      const PAD_R = 18;
      const CELL = (W - PAD_L - PAD_R) / d;
      const gridTop = PAD_T;
      const gridLeft = PAD_L;
      const gridBottom = gridTop + nPos * CELL;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg pe-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      function colorFor(v) {
        const t = Math.max(-1, Math.min(1, v));
        if (t >= 0) return `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(t * 90 + 6)}%, var(--bg-card, #fff))`;
        return `color-mix(in srgb, var(--warm, #E8743B) ${Math.round(-t * 90 + 6)}%, var(--bg-card, #fff))`;
      }
      layer("canvas", 0);
      const ftxt = add("canvas", el("text", {
        x: W / 2,
        y: 18,
        class: "pe-formula",
        "text-anchor": "middle"
      }, svg));
      ftxt.textContent = labels.formulaLabel || formula;
      const dimCap = add("canvas", el("text", {
        x: gridLeft + d * CELL / 2,
        y: 48,
        class: "pe-axcap",
        "text-anchor": "middle"
      }, svg));
      dimCap.textContent = labels.dimAxis || "dimension i  (even = sin \xB7 odd = cos) \u2192";
      const posCap = add("canvas", el("text", {
        x: gridLeft - 6,
        y: gridTop - 18,
        class: "pe-axcap",
        "text-anchor": "end"
      }, svg));
      posCap.textContent = labels.posAxis || "pos \u2193";
      for (let c = 0; c < d; c++) {
        const t = add("canvas", el("text", {
          x: gridLeft + c * CELL + CELL / 2,
          y: gridTop - 6,
          class: "pe-collbl",
          "text-anchor": "middle"
        }, svg));
        t.textContent = String(c);
      }
      const rowLayers = [];
      const cellByRC = [];
      for (let r = 0; r < nPos; r++) {
        rowLayers[r] = { nodes: [] };
        cellByRC[r] = [];
        const rl = el("text", {
          x: gridLeft - 10,
          y: gridTop + r * CELL + CELL / 2 + 4,
          class: "pe-rowlbl",
          "text-anchor": "end"
        }, svg);
        rl.textContent = String(r);
        rowLayers[r].nodes.push(rl);
        for (let c = 0; c < d; c++) {
          const v = grid[r][c];
          const rect = el("rect", {
            x: gridLeft + c * CELL,
            y: gridTop + r * CELL,
            width: CELL,
            height: CELL,
            class: "pe-cell"
          }, svg);
          rect.setAttribute("fill", colorFor(v));
          const tt = el("title", {}, rect);
          tt.textContent = `pos ${r}, dim ${c} = ${fmt(v, 3)}`;
          rowLayers[r].nodes.push(rect);
          cellByRC[r][c] = rect;
        }
      }
      add("canvas", el("rect", {
        x: gridLeft,
        y: gridTop,
        width: d * CELL,
        height: nPos * CELL,
        class: "pe-frame",
        fill: "none"
      }, svg));
      layer("legend", 0);
      const legY = gridBottom + 22;
      const legW = 160, legX = PAD_L;
      const stops = 16;
      for (let i = 0; i < stops; i++) {
        const v = -1 + 2 * i / (stops - 1);
        add("legend", el("rect", {
          x: legX + i * legW / stops,
          y: legY,
          width: legW / stops + 0.6,
          height: 10,
          class: "pe-legcell",
          fill: colorFor(v)
        }, svg));
      }
      add("legend", el("text", { x: legX, y: legY + 24, class: "pe-leglbl" }, svg)).textContent = "\u22121";
      add("legend", el("text", {
        x: legX + legW / 2,
        y: legY + 24,
        class: "pe-leglbl",
        "text-anchor": "middle"
      }, svg)).textContent = "0";
      add("legend", el("text", {
        x: legX + legW,
        y: legY + 24,
        class: "pe-leglbl",
        "text-anchor": "end"
      }, svg)).textContent = "+1";
      layer("note", 3);
      const noteY = legY + 38;
      const NOTE_FS = 13;
      const NOTE_PAD = 12;
      const innerW = W - PAD_L - 16 - NOTE_PAD * 2;
      const CPL = Math.max(8, Math.floor(innerW / (NOTE_FS * 0.62)));
      const wrap = (str) => {
        const out = [];
        let line = "";
        for (const word of String(str).split(/[ \t\r\n]+/).filter(Boolean)) {
          if (!line) {
            line = word;
          } else if ((line + " " + word).length <= CPL) {
            line += " " + word;
          } else {
            out.push(line);
            line = word;
          }
        }
        if (line) out.push(line);
        return out.length ? out : [""];
      };
      const LH = 17;
      const lines1 = wrap(labels.takeaway || "low dims wiggle fast (local), high dims drift slow (global).");
      const lines2 = wrap(labels.takeaway2 || "fixed by formula \u2014 not learned. always in [\u22121, 1].");
      const boxH = NOTE_PAD + (lines1.length + lines2.length) * LH + 4;
      add("note", el("rect", {
        x: PAD_L,
        y: noteY,
        width: W - PAD_L - 16,
        height: boxH,
        rx: 8,
        class: "pe-notebox"
      }, svg));
      let ty = noteY + 18;
      for (const line of lines1) {
        add("note", el("text", { x: PAD_L + NOTE_PAD, y: ty, class: "pe-note" }, svg)).textContent = line;
        ty += LH;
      }
      for (const line of lines2) {
        add("note", el("text", { x: PAD_L + NOTE_PAD, y: ty, class: "pe-note pe-note-2" }, svg)).textContent = line;
        ty += LH;
      }
      const H = frameHeightFor(noteY + boxH, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const node of layers.canvas.nodes) node.classList.toggle("is-hidden", false);
        for (const node of layers.legend.nodes) node.classList.toggle("is-hidden", false);
        rowLayers.forEach((rl, r) => {
          const on = k >= 1 ? true : r === 0;
          for (const node of rl.nodes) node.classList.toggle("is-faded", !on);
        });
        const showCols = k >= 2;
        for (let r = 0; r < nPos; r++)
          for (let c = 0; c < d; c++)
            cellByRC[r][c].classList.toggle("pe-col-on", showCols);
        for (const node of layers.note.nodes) node.classList.toggle("is-hidden", k < 3);
      };
    }
  });
})();
