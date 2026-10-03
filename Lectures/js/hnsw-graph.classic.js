/* AUTO-GENERATED offline classic bundle of widgets/hnsw-graph/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function makeProtagonist(svg, opts = {}) {
    const SVGNS2 = "http://www.w3.org/2000/svg";
    const haloClass = opts.haloClass || "wgt-halo";
    const focusClass = opts.focusClass || "is-protagonist";
    const mutedClass = opts.mutedClass || "is-muted";
    const defR = typeof opts.haloR === "number" ? opts.haloR : 11;
    const halo = document.createElementNS(SVGNS2, "circle");
    halo.setAttribute("class", haloClass);
    halo.setAttribute("fill", "none");
    if (opts.haloStroke) halo.setAttribute("stroke", opts.haloStroke);
    halo.style.opacity = "0";
    svg.appendChild(halo);
    let muted = [];
    function unmuteAll() {
      for (const e of muted) e && e.classList && e.classList.remove(mutedClass);
      muted = [];
    }
    return {
      halo,
      focus(star, rest = [], pos = {}) {
        unmuteAll();
        for (const e of rest) {
          if (!e || e === star || !e.classList) continue;
          e.classList.add(mutedClass);
          muted.push(e);
        }
        if (star && star.classList) star.classList.add(focusClass);
        if (pos && pos.cx != null && isFinite(pos.cx)) {
          halo.setAttribute("cx", pos.cx);
          halo.setAttribute("cy", pos.cy);
          halo.setAttribute("r", typeof pos.r === "number" ? pos.r : defR);
          halo.style.opacity = "1";
        } else {
          halo.style.opacity = "0";
        }
      },
      clear() {
        unmuteAll();
        halo.style.opacity = "0";
      }
    };
  }

  // widgets/hnsw-graph/logic.js
  var mountHnswGraph = defineWidget({
    id: "hnsw-graph",
    rootClass: "hg-root",
    exportName: "mountHnswGraph",
    maxStep: 5,
    // toy2 walks 0..5; the toy path clamps itself to 0..3 (back-compat)
    render(ctx) {
      if ((ctx.labels && ctx.labels.variant) === "toy2") return renderToy2(ctx);
      return renderToy(ctx);
    }
  });
  function renderToy({ host, data, labels, el }) {
    const toy = data.toy || data;
    const nodes = toy.coords && toy.coords.nodes || [];
    const names = toy.labels || nodes.map((_, i) => "n" + i);
    const edges = toy.edges || [];
    const q = toy.query || [0, 0];
    const greedy = toy.greedy || {};
    const path = greedy.pathIdx || [];
    const bf = toy.bruteForce || {};
    const hopTable = toy.hopTable || [];
    const trap = toy.trap || {};
    const dShow = (idx, d) => idx === bf.nnIdx ? Number(d).toFixed(4) : Number(d).toFixed(2);
    const W = 480, PAD_L = 18, PAD_T = 30;
    const plotW = W - 2 * PAD_L, plotH = 250;
    const xs = nodes.map((n) => n[0]).concat(q[0]);
    const ys = nodes.map((n) => n[1]).concat(q[1]);
    const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.12);
    const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
    const box = { x: PAD_L, y: PAD_T, w: plotW, h: plotH };
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;
    const panelTop = PAD_T + plotH + 14, panelRow = 22;
    const H = frameHeightFor(panelTop + 4 * panelRow, 12);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg hg-svg", role: "img", "aria-label": labels.alt || "" }, host);
    const layers = {};
    const layer = (name, from) => layers[name] = { from, nodes: [] };
    const add = (name, n) => {
      layers[name].nodes.push(n);
      return n;
    };
    const edgeEl = {};
    edges.forEach(([i, j]) => {
      const ln = el("line", { x1: sx(nodes[i][0]), y1: sy(nodes[i][1]), x2: sx(nodes[j][0]), y2: sy(nodes[j][1]), class: "hg-edge" }, svg);
      edgeEl[i + "-" + j] = ln;
      edgeEl[j + "-" + i] = ln;
    });
    const qx = sx(q[0]), qy = sy(q[1]);
    el("path", { d: `M${qx} ${qy - 9} L${qx + 9} ${qy} L${qx} ${qy + 9} L${qx - 9} ${qy} Z`, class: "hg-query" }, svg);
    el("text", { x: qx + 12, y: qy + 4, class: "hg-qlbl" }, svg).textContent = labels.query || "query";
    const nodeEl = nodes.map((n, i) => {
      const g = el("g", { class: "hg-node", "data-i": i }, svg);
      el("circle", { cx: sx(n[0]), cy: sy(n[1]), r: 13, class: "hg-dot" }, g);
      el("text", { x: sx(n[0]), y: sy(n[1]) + 4, class: "hg-nlbl", "text-anchor": "middle" }, g).textContent = names[i];
      return g;
    });
    const proto = makeProtagonist(svg, { haloClass: "hg-halo", haloR: 18 });
    const readHead = el("text", { x: PAD_L, y: panelTop, class: "hg-readhead" }, svg);
    const readLines = [0, 1, 2].map((r) => el("text", { x: PAD_L, y: panelTop + (r + 1) * panelRow, class: "hg-readline" }, svg));
    const setRead = (head, lines) => {
      readHead.textContent = head || "";
      readLines.forEach((ln, i) => {
        ln.textContent = lines[i] || "";
      });
    };
    function litTo(h) {
      const upto = path.slice(0, h + 1);
      nodeEl.forEach((g, i) => {
        g.classList.toggle("is-visited", upto.includes(i));
        g.classList.toggle("is-nn", h >= path.length - 1 && i === bf.nnIdx);
      });
      Object.values(edgeEl).forEach((ln) => ln.classList.remove("is-path"));
      for (let s = 0; s < h && s < path.length - 1; s++) {
        const key = path[s] + "-" + path[s + 1];
        if (edgeEl[key]) edgeEl[key].classList.add("is-path");
      }
      const cur = upto[upto.length - 1];
      if (cur != null) proto.focus(nodeEl[cur], [], { cx: sx(nodes[cur][0]), cy: sy(nodes[cur][1]), r: 18 });
    }
    return function update(k0) {
      const k = Math.min(k0, 3);
      litTo(Math.min(k, path.length - 1));
      if (k <= 0) {
        litTo(0);
        const hop = hopTable[0];
        setRead(
          labels.readStart || "greedy search \u2014 start at the entry node",
          hop ? [`${hop.at}: ${labels.dist || "dist"} ${dShow(hop.atIdx, hop.atDist)}`] : []
        );
      } else if (k === 1) {
        const hop = hopTable[0];
        const lines = hop ? hop.neighbors.map((nb) => `${hop.at}\u2192${nb.id}: ${dShow(nb.idx, nb.dist)}${nb.id === hop.moveTo ? "  \u25C0 " + (labels.move || "move") : ""}`) : [];
        setRead(`${labels.hop || "hop"} 1 \u2014 ${hopTable[0] ? hopTable[0].at + "\u2192" + hopTable[0].moveTo : ""}`, lines);
      } else if (k === 2) {
        const hop = hopTable[1];
        const lines = hop ? hop.neighbors.map((nb) => `${hop.at}\u2192${nb.id}: ${dShow(nb.idx, nb.dist)}${nb.id === hop.moveTo ? "  \u25C0 " + (labels.move || "move") : ""}`) : [];
        if (hop && !hop.moveTo) lines.push(labels.localMin || "all neighbours farther \u2192 local minimum, stop");
        setRead(`${labels.hop || "hop"} 2 \u2014 ${labels.atNN || "arrive at the nearest node"}`, lines);
      } else {
        const ef = `ef=1 \u2192 recall@1 ${trap.ef1 ? trap.ef1.recall : 0};  ef=3 \u2192 recall@1 ${trap.ef3 ? trap.ef3.recall : 1}`;
        setRead(
          `${greedy.path ? greedy.path.join("\u2192") : ""} \xB7 ${labels.hops || "hops"} ${greedy.hops} \xB7 recall@1 = ${greedy.recall}`,
          [
            `${bf.nn} ${labels.isNN || "is the true nearest neighbour"} (${labels.dist || "dist"} ${Number(bf.dist).toFixed(4)})`,
            labels.efKnob || "the ef knob \u2014 a wider candidate list escapes a local-min trap:",
            ef
          ]
        );
      }
    };
  }
  function renderToy2({ host, data, labels, el }) {
    const toy = data.toy2 || {};
    const nodes = toy.coords && toy.coords.nodes || [];
    const names = toy.labels || nodes.map((_, i) => "b" + i);
    const layersDef = toy.layers || [];
    const q = toy.query || [0, 0];
    const greedy = toy.greedy || {};
    const baseOnly = toy.baseOnly || {};
    const hopTable = toy.hopTable || {};
    const bf = toy.bruteForce || {};
    const idxOf = (name) => names.indexOf(name);
    const L1 = layersDef.find((l) => l.layer === 1) || { members: [], edges: [] };
    const L0 = layersDef.find((l) => l.layer === 0) || { members: nodes.map((_, i) => i), edges: [] };
    const W = 520, PAD_L = 22, PAD_T = 26;
    const plotW = W - 2 * PAD_L;
    const bandH = 120, bandGap = 30;
    const l1Top = PAD_T, l0Top = PAD_T + bandH + bandGap;
    const xs = nodes.map((n) => n[0]).concat(q[0]);
    const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.08);
    const sx = (vx) => PAD_L + (vx - dx.min) / dx.span * plotW;
    const ysBase = nodes.map((n) => n[1]);
    const dyB = padDomain(Math.min(...ysBase), Math.max(...ysBase), 0.16);
    const syBase = (vy) => l0Top + bandH - (vy - dyB.min) / dyB.span * bandH;
    const syHub = (vy) => {
      if (vy == null) return l1Top + bandH * 0.5;
      const frac = (vy - dyB.min) / dyB.span;
      return l1Top + bandH * (0.7 - frac * 0.4);
    };
    const panelTop = l0Top + bandH + 26, panelRow = 20;
    const H = frameHeightFor(panelTop + 4 * panelRow, 12);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg hg-svg", role: "img", "aria-label": labels.alt || "" }, host);
    el("rect", { x: PAD_L - 12, y: l1Top - 8, width: plotW + 24, height: bandH + 16, rx: 8, class: "hg-band hg-band-l1" }, svg);
    el("rect", { x: PAD_L - 12, y: l0Top - 8, width: plotW + 24, height: bandH + 16, rx: 8, class: "hg-band hg-band-l0" }, svg);
    el("text", { x: PAD_L - 8, y: l1Top + 6, class: "hg-bandlbl" }, svg).textContent = labels.layerHub || "layer 1 \u2014 hubs";
    el("text", { x: PAD_L - 8, y: l0Top + 6, class: "hg-bandlbl" }, svg).textContent = labels.layerBase || "layer 0 \u2014 base";
    const qx = sx(q[0]), qy = syBase(q[1]);
    el("path", { d: `M${qx} ${qy - 9} L${qx + 9} ${qy} L${qx} ${qy + 9} L${qx - 9} ${qy} Z`, class: "hg-query" }, svg);
    el("text", { x: qx + 12, y: qy + 4, class: "hg-qlbl" }, svg).textContent = labels.query || "query";
    const baseEdgeEl = {};
    (L0.edges || []).forEach(([i, j]) => {
      const ln = el("line", { x1: sx(nodes[i][0]), y1: syBase(nodes[i][1]), x2: sx(nodes[j][0]), y2: syBase(nodes[j][1]), class: "hg-edge" }, svg);
      baseEdgeEl[i + "-" + j] = ln;
      baseEdgeEl[j + "-" + i] = ln;
    });
    const hubEdgeEl = {};
    (L1.edges || []).forEach(([i, j]) => {
      const ln = el("line", { x1: sx(nodes[i][0]), y1: syHub(nodes[i][1]), x2: sx(nodes[j][0]), y2: syHub(nodes[j][1]), class: "hg-edge hg-edge-hub" }, svg);
      hubEdgeEl[i + "-" + j] = ln;
      hubEdgeEl[j + "-" + i] = ln;
    });
    const baseScreen = nodes.map((n) => ({ x: sx(n[0]), y: syBase(n[1]) }));
    (L1.members || []).forEach((i) => {
      const hx = sx(nodes[i][0]), hy = syHub(nodes[i][1]);
      const tx = sx(nodes[i][0]), ty = syBase(nodes[i][1]);
      const blocked = baseScreen.some((p, j) => j !== i && Math.abs(p.x - hx) < 16 && p.y > hy + 4 && p.y < ty - 4);
      if (!blocked) {
        el("line", { x1: hx, y1: hy, x2: tx, y2: ty, class: "hg-descend" }, svg);
      } else {
        const dir = hx < plotW * 0.5 + PAD_L ? 1 : -1;
        let lane = hx + dir * 24;
        for (let g = 0; g < 8; g++) {
          const clear = baseScreen.every((p) => Math.abs(p.x - lane) > 18);
          if (clear) break;
          lane += dir * 14;
        }
        const yMid = hy + 18;
        el("path", { d: `M${hx} ${hy} V${yMid} H${lane} V${ty} H${tx}`, class: "hg-descend" }, svg);
      }
    });
    const baseNodeEl = nodes.map((n, i) => {
      const g = el("g", { class: "hg-node", "data-i": i }, svg);
      el("circle", { cx: sx(n[0]), cy: syBase(n[1]), r: 10, class: "hg-dot" }, g);
      el("text", { x: sx(n[0]), y: syBase(n[1]) + 4, class: "hg-nlbl", "text-anchor": "middle" }, g).textContent = names[i];
      return g;
    });
    const hubNodeEl = {};
    (L1.members || []).forEach((i) => {
      const g = el("g", { class: "hg-node hg-hub", "data-i": i }, svg);
      el("circle", { cx: sx(nodes[i][0]), cy: syHub(nodes[i][1]), r: 10, class: "hg-dot" }, g);
      el("text", { x: sx(nodes[i][0]), y: syHub(nodes[i][1]) + 4, class: "hg-nlbl", "text-anchor": "middle" }, g).textContent = names[i];
      hubNodeEl[i] = g;
    });
    const protoBase = makeProtagonist(svg, { haloClass: "hg-halo", haloR: 17 });
    const protoHub = makeProtagonist(svg, { haloClass: "hg-halo", haloR: 17 });
    const readHead = el("text", { x: PAD_L, y: panelTop, class: "hg-readhead" }, svg);
    const readLines = [0, 1, 2].map((r) => el("text", { x: PAD_L, y: panelTop + (r + 1) * panelRow, class: "hg-readline" }, svg));
    const setRead = (head, lines) => {
      readHead.textContent = head || "";
      readLines.forEach((ln, i) => {
        ln.textContent = lines && lines[i] || "";
      });
    };
    const dShow = (d) => Number(d).toFixed(d === Math.round(d) ? 1 : 4);
    function clearAll() {
      baseNodeEl.forEach((g) => g.classList.remove("is-visited", "is-nn", "is-trapped", "is-entry"));
      Object.values(hubNodeEl).forEach((g) => g.classList.remove("is-visited", "is-nn", "is-entry"));
      Object.values(baseEdgeEl).forEach((ln) => ln.classList.remove("is-path", "is-trap"));
      Object.values(hubEdgeEl).forEach((ln) => ln.classList.remove("is-path"));
      protoBase.clear();
      protoHub.clear();
    }
    function litBasePath(pathNames, edgeCls) {
      const idxs = pathNames.map(idxOf);
      idxs.forEach((i) => {
        if (baseNodeEl[i]) baseNodeEl[i].classList.add("is-visited");
      });
      for (let s = 0; s < idxs.length - 1; s++) {
        const key = idxs[s] + "-" + idxs[s + 1];
        if (baseEdgeEl[key]) baseEdgeEl[key].classList.add(edgeCls);
      }
    }
    function litHubPath(pathNames) {
      const idxs = pathNames.map(idxOf);
      idxs.forEach((i) => {
        if (hubNodeEl[i]) hubNodeEl[i].classList.add("is-visited");
      });
      for (let s = 0; s < idxs.length - 1; s++) {
        const key = idxs[s] + "-" + idxs[s + 1];
        if (hubEdgeEl[key]) hubEdgeEl[key].classList.add("is-path");
      }
    }
    const focusBase = (name) => {
      const i = idxOf(name);
      if (i >= 0) protoBase.focus(baseNodeEl[i], [], { cx: sx(nodes[i][0]), cy: syBase(nodes[i][1]), r: 17 });
    };
    const focusHub = (name) => {
      const i = idxOf(name);
      if (hubNodeEl[i]) protoHub.focus(hubNodeEl[i], [], { cx: sx(nodes[i][0]), cy: syHub(nodes[i][1]), r: 17 });
    };
    const hopLines = (hop) => hop && hop.neighbors ? hop.neighbors.map((nb) => `${hop.at}\u2192${nb.id}: ${dShow(nb.dist)}${nb.id === hop.moveTo ? "  \u25C0 " + (labels.move || "move") : ""}`) : [];
    return function update(k) {
      clearAll();
      if (k <= 0) {
        const e = idxOf(toy.baseEntry || "b0");
        if (baseNodeEl[e]) baseNodeEl[e].classList.add("is-entry");
        focusBase(toy.baseEntry || "b0");
        setRead(
          labels.readStartBase || "two layers: an upper hub band + the base band. Base-only greedy starts at the base entry.",
          [
            `${labels.baseEntry || "base entry"}: ${toy.baseEntry || "b0"}`,
            `${labels.entryHubLbl || "hub entry"}: ${toy.entryHub || "b2"}`
          ]
        );
      } else if (k === 1) {
        litBasePath(baseOnly.path || [], "is-trap");
        const tr = idxOf(baseOnly.trappedAt || (baseOnly.path || []).slice(-1)[0]);
        if (baseNodeEl[tr]) baseNodeEl[tr].classList.add("is-trapped");
        focusBase(baseOnly.trappedAt || "b4");
        const last = (hopTable.baseOnly || []).slice(-1)[0];
        setRead(
          `${labels.baseOnly || "base-only greedy"}: ${(baseOnly.path || []).join("\u2192")}`,
          [
            labels.trapped || "no base edge crosses the gap \u2192 trapped at a local minimum",
            `${labels.trappedAt || "trapped at"} ${baseOnly.trappedAt || "b4"} \xB7 ${labels.recall || "recall@1"} = ${baseOnly.recall}`,
            ...hopLines(last).slice(0, 1)
          ]
        );
      } else if (k === 2) {
        const he = idxOf(toy.entryHub || "b2");
        if (hubNodeEl[he]) hubNodeEl[he].classList.add("is-entry");
        focusHub(toy.entryHub || "b2");
        const h0 = (hopTable.L1 || [])[0];
        setRead(
          `${labels.restart || "restart at the upper hub"}: ${toy.entryHub || "b2"}`,
          [
            labels.hubWhy || "the hub layer has long-range edges the base layer lacks",
            h0 ? `${h0.at}: ${labels.dist || "dist"} ${dShow(h0.atDist)}` : ""
          ]
        );
      } else if (k === 3) {
        litHubPath(greedy.pathL1 || []);
        const dest = (greedy.pathL1 || []).slice(-1)[0];
        focusHub(dest);
        const h0 = (hopTable.L1 || [])[0];
        setRead(
          `${labels.hubHop || "layer-1 hub hop"} \u2014 ${(greedy.pathL1 || []).join("\u2192")}`,
          hopLines(h0).concat([labels.crossGap || "the long-range edge crosses the gap to the right cluster"])
        );
      } else if (k === 4) {
        litHubPath(greedy.pathL1 || []);
        litBasePath(greedy.pathL0 || [], "is-path");
        const dest = (greedy.pathL0 || []).slice(-1)[0];
        focusBase(dest);
        const h0 = (hopTable.L0 || [])[0];
        setRead(
          `${labels.descend || "descend to base, then the layer-0 hop"} \u2014 ${(greedy.pathL0 || []).join("\u2192")}`,
          hopLines(h0)
        );
      } else {
        litHubPath(greedy.pathL1 || []);
        litBasePath(greedy.pathL0 || [], "is-path");
        const nnIdx = idxOf(bf.nn);
        if (baseNodeEl[nnIdx]) {
          baseNodeEl[nnIdx].classList.add("is-nn");
        }
        focusBase(bf.nn);
        setRead(
          `${(greedy.pathL1 || []).concat((greedy.pathL0 || []).slice(1)).join("\u2192")} \xB7 ${labels.hops || "hops"} ${greedy.hopsTotal} \xB7 recall@1 = ${greedy.recall}`,
          [
            `${bf.nn} ${labels.isNN || "is the true nearest neighbour"} (${labels.dist || "dist"} ${Number(bf.dist).toFixed(4)})`,
            labels.contrast || "recall contrast:",
            `${labels.baseOnly || "base-only"} recall@1 = ${baseOnly.recall}  vs  ${labels.hubEntry || "hub-entry"} recall@1 = ${greedy.recall}`
          ]
        );
      }
    };
  }
})();
