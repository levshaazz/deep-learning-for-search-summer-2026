/* AUTO-GENERATED offline classic bundle of widgets/late-pool-lab/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/late-pool-lab/logic.js
  var W = 620;
  var TOK_Y = 74;
  var TOK_H = 46;
  var TOK_W = 120;
  var TOK_GAP = 14;
  var TOK_X0 = 34;
  function fitText(node, maxW) {
    try {
      const w = node.getComputedTextLength();
      if (w > maxW && w > 0) {
        const fs = parseFloat(getComputedStyle(node).fontSize) || 14;
        node.style.fontSize = Math.max(10, Math.floor(fs * maxW / w * 10) / 10) + "px";
      }
    } catch (e) {
    }
  }
  var PLANE = { x: 86, y: 208, w: 216, h: 216 };
  var UNIT = PLANE.h / 2.5;
  var mountLatePoolLab = defineWidget({
    id: "late-pool-lab",
    rootClass: "lpl-root",
    exportName: "mountLatePoolLab",
    maxStep: 5,
    render({ host, data, labels, el }) {
      const P = data && data.pool || {};
      const tokens = P.tokens || ["Berlin", "is", "Its", "residents"];
      const values = P.values || [[4, 0], [0, 0], [0, 0], [0, 4]];
      const bnd = typeof P.boundary === "number" ? P.boundary : 2;
      const q = P.query || [1, 0];
      const vNaive = P.naiveChunkVec || [0, 2];
      const vLate = P.lateChunkVec || [1, 1];
      const cosNaive = typeof P.naiveCos === "number" ? P.naiveCos : 0;
      const cosLate = typeof P.lateCos === "number" ? P.lateCos : 0.7071;
      const n = tokens.length;
      const tx = (i) => TOK_X0 + i * (TOK_W + TOK_GAP);
      const tcx = (i) => tx(i) + TOK_W / 2;
      const pair = (v) => "(" + fmtN(v[0]) + ", " + fmtN(v[1]) + ")";
      function fmtN(x) {
        return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100);
      }
      const dec = () => {
        const l = (typeof document !== "undefined" && document.documentElement && (document.documentElement.dataset.lang || document.documentElement.lang || "en")).slice(0, 2);
        return l === "ru" || l === "tt" ? "," : ".";
      };
      const cos4 = (x) => x.toFixed(4).replace(".", dec());
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg lpl-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      layer("doc", 0);
      add("doc", el("text", { x: TOK_X0, y: 26, class: "lpl-head" }, svg)).textContent = labels.docHead || "one document, one boundary";
      const tokVals = [];
      for (let i = 0; i < n; i++) {
        const isB = i >= bnd;
        const cls = "lpl-tok " + (isB ? "is-chunkb" : "is-chunka") + (values[i][0] === 0 && values[i][1] === 0 ? " is-empty" : "");
        add("doc", el("rect", { x: tx(i), y: TOK_Y, width: TOK_W, height: TOK_H, rx: 7, class: cls }, svg));
        add("doc", el("text", { x: tcx(i), y: TOK_Y + 21, class: "lpl-toklbl", "text-anchor": "middle" }, svg)).textContent = tokens[i];
        tokVals.push(add("doc", el("text", { x: tcx(i), y: TOK_Y + 38, class: "lpl-tokval", "text-anchor": "middle" }, svg)));
        tokVals[i].textContent = pair(values[i]);
      }
      const brk = (i0, i1, key, fallback) => {
        const x0 = tx(i0), x1 = tx(i1) + TOK_W, y = TOK_Y + TOK_H + 12;
        add("doc", el("path", { d: `M${x0} ${y - 6} L${x0} ${y} L${x1} ${y} L${x1} ${y - 6}`, class: "lpl-brk" }, svg));
        add("doc", el("text", { x: (x0 + x1) / 2, y: y + 16, class: "lpl-brklbl", "text-anchor": "middle" }, svg)).textContent = labels[key] || fallback;
      };
      brk(0, bnd - 1, "chunkA", "chunk A");
      brk(bnd, n - 1, "chunkB", "chunk B");
      layer("ctx", 3);
      const ctxNote = add("ctx", el("text", {
        x: (tx(bnd) + tx(n - 1) + TOK_W) / 2,
        y: TOK_Y + TOK_H + 50,
        class: "lpl-ctxnote",
        "text-anchor": "middle"
      }, svg));
      const wallX = tx(bnd) - TOK_GAP / 2;
      layer("wall", 0);
      add("wall", el("line", { x1: wallX, y1: TOK_Y - 30, x2: wallX, y2: TOK_Y + TOK_H + 6, class: "lpl-wall" }, svg));
      add("wall", el("text", { x: wallX + 8, y: TOK_Y - 20, class: "lpl-walllbl", "text-anchor": "start" }, svg)).textContent = labels.wall || "the wall";
      const arcs = [];
      for (let i = bnd; i < n; i++) {
        const from = tcx(i), to = tcx(0), top = TOK_Y - 22 - (i - bnd) * 12;
        const blocked = `M${from} ${TOK_Y - 4} Q${(from + wallX) / 2} ${top} ${wallX + 6} ${top + 6}`;
        const open = `M${from} ${TOK_Y - 4} Q${(from + to) / 2} ${top} ${to} ${TOK_Y - 4}`;
        layer("arc" + i, 0);
        arcs.push(add("arc" + i, el("path", { d: blocked, class: "lpl-arc" }, svg)));
        arcs[arcs.length - 1].__blocked = blocked;
        arcs[arcs.length - 1].__open = open;
      }
      const ox = PLANE.x, oy = PLANE.y + PLANE.h;
      const px = (v) => [ox + v[0] * UNIT, oy - v[1] * UNIT];
      layer("plane", 0);
      add("plane", el("rect", { x: PLANE.x, y: PLANE.y, width: PLANE.w, height: PLANE.h, rx: 6, class: "lpl-plane" }, svg));
      add("plane", el("line", { x1: ox, y1: oy, x2: ox + PLANE.w, y2: oy, class: "lpl-axis" }, svg));
      add("plane", el("line", { x1: ox, y1: oy, x2: ox, y2: PLANE.y, class: "lpl-axis" }, svg));
      add("plane", el("text", { x: ox + PLANE.w, y: oy + 18, class: "lpl-axislbl", "text-anchor": "end" }, svg)).textContent = labels.axisX || "Berlin-ness";
      const ayx = ox - 12, ayy = PLANE.y + PLANE.h / 2;
      add("plane", el("text", {
        x: ayx,
        y: ayy,
        class: "lpl-axislbl",
        "text-anchor": "middle",
        transform: `rotate(-90 ${ayx} ${ayy})`
      }, svg)).textContent = labels.axisY || "population";
      const qEnd = [ox + PLANE.w - 6, oy];
      add("plane", el("line", { x1: ox, y1: oy, x2: qEnd[0], y2: qEnd[1], class: "lpl-qray" }, svg));
      add("plane", el("text", { x: qEnd[0], y: oy - 8, class: "lpl-qlbl", "text-anchor": "end" }, svg)).textContent = (labels.query || "query q") + " = (" + q[0] + ", " + q[1] + ")";
      const [nx, ny] = px(vNaive), [lx, ly] = px(vLate);
      layer("vecNaive", 1);
      add("vecNaive", el("line", { x1: ox, y1: oy, x2: nx, y2: ny, class: "lpl-vec is-naive" }, svg));
      add("vecNaive", el("circle", { cx: nx, cy: ny, r: 5, class: "lpl-dot is-naive" }, svg));
      add("vecNaive", el("text", { x: nx + 10, y: ny - 6, class: "lpl-veclbl is-naive" }, svg)).textContent = (labels.naiveTag || "naive") + " " + pair(vNaive);
      layer("vecLate", 4);
      add("vecLate", el("line", { x1: ox, y1: oy, x2: lx, y2: ly, class: "lpl-vec is-late" }, svg));
      add("vecLate", el("circle", { cx: lx, cy: ly, r: 5, class: "lpl-dot is-late" }, svg));
      add("vecLate", el("text", { x: lx + 10, y: ly + 16, class: "lpl-veclbl is-late" }, svg)).textContent = (labels.lateTag || "late") + " " + pair(vLate);
      layer("turn", 5);
      add("turn", el("path", {
        d: `M${nx} ${ny} Q${(nx + lx) / 2 + 26} ${(ny + ly) / 2 - 18} ${lx} ${ly}`,
        class: "lpl-turn"
      }, svg));
      const LX = PLANE.x + PLANE.w + 34;
      const rowY = (i) => PLANE.y + 22 + i * 30;
      layer("ledger", 1);
      add("ledger", el("text", { x: LX, y: PLANE.y - 4, class: "lpl-leghead" }, svg)).textContent = labels.ledgerHead || "cos(q, chunk B)";
      const rN = add("ledger", el("text", { x: LX, y: rowY(0), class: "lpl-legrow is-naive" }, svg));
      rN.textContent = (labels.naiveTag || "naive") + ":  " + cos4(cosNaive);
      const rL = add("ledger", el("text", { x: LX, y: rowY(1), class: "lpl-legrow is-late" }, svg));
      const note = add("ledger", el("text", { x: LX, y: rowY(2) + 6, class: "lpl-legnote" }, svg));
      const note2 = add("ledger", el("text", { x: LX, y: rowY(2) + 24, class: "lpl-legnote" }, svg));
      const H = frameHeightFor(oy + 30, 10);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        const walled = k < 2;
        for (const node of layers.wall.nodes) node.classList.toggle("is-hidden", !walled);
        arcs.forEach((a) => {
          a.setAttribute("d", walled ? a.__blocked : a.__open);
          a.classList.toggle("is-blocked", walled);
          a.classList.toggle("is-hidden", k < 1);
        });
        for (const node of layers.vecLate.nodes) node.classList.toggle("is-hidden", k < 4);
        rL.classList.toggle("is-hidden", k < 4);
        rL.textContent = (labels.lateTag || "late") + ":  " + cos4(cosLate);
        note.classList.toggle("is-hidden", k < 5);
        note2.classList.toggle("is-hidden", k < 5);
        note.textContent = labels.legNote || "same boundary, same model";
        note2.textContent = labels.legNote2 || "only the moment of pooling moved";
        fitText(note, W - 8 - LX);
        fitText(note2, W - 8 - LX);
        const ctxOn = k >= 3;
        for (let i = bnd; i < n; i++) {
          tokVals[i].textContent = ctxOn ? pair(vLate) : pair(values[i]);
          tokVals[i].classList.toggle("is-context", ctxOn);
        }
        ctxNote.textContent = labels.ctxNote || "each token of B now averages all four \u2192 \u03D1";
        host.dataset.phase = k >= 3 ? "late" : k >= 1 ? "naive" : "setup";
      };
    }
  });
})();
