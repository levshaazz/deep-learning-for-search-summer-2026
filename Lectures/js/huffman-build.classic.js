/* AUTO-GENERATED offline classic bundle of widgets/huffman-build/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/huffman-build/logic.js
  var mountHuffmanBuild = defineWidget({
    id: "huffman-build",
    rootClass: "hb-root",
    exportName: "mountHuffmanBuild",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const num = (v, d) => typeof v === "number" && isFinite(v) ? v : d;
      const obj = (v) => v && typeof v === "object" ? v : {};
      const nd = obj(obj(obj(data).huffman).nonDyadic);
      const probs = Object.keys(obj(nd.probs)).length ? nd.probs : { E: 0.35, T: 0.25, A: 0.2, O: 0.12, I: 0.08 };
      const merges = Array.isArray(nd.merges) ? nd.merges.filter((m) => m && Array.isArray(m.left) && Array.isArray(m.right)) : [];
      const codeLen = obj(nd.codeLen);
      const idealLen = obj(nd.idealLen);
      const H = num(nd.H, 2.1531);
      const LBAR = num(nd.avgCodeLen, 2.2);
      const EXCESS = num(nd.excess, 0.0469);
      const EXCESS_PCT = num(nd.excessPct, 2.2);
      const dy = obj(obj(data).source4);
      const dyH = num(dy.H, 1.75);
      const dyL = num(dy.avgCodeLen, 1.75);
      const dyCode = obj(dy.code);
      const lang = (typeof document !== "undefined" && document.documentElement ? document.documentElement.dataset.lang || document.documentElement.lang || "en" : "en").slice(0, 2);
      const DEC = lang === "en" ? "." : ",";
      const fx = (v, d) => typeof v === "number" && isFinite(v) ? v.toFixed(d).replace(".", DEC) : "\u2014";
      const p2 = (v) => fx(v, 2);
      const b4 = (v) => fx(v, 4);
      const UNIT = labels.unitBits || "bits";
      const key = (syms) => syms.slice().sort().join("");
      let cur = Object.keys(probs).map((s) => ({ syms: [s], p: num(probs[s], 0), leaf: true, sym: s })).sort((a, b) => a.p - b.p);
      const states = [cur.slice()];
      const internals = [];
      for (const m of merges) {
        const L = cur.find((n) => key(n.syms) === key(m.left));
        const R = cur.find((n) => key(n.syms) === key(m.right));
        if (!L || !R) break;
        const parent = {
          syms: L.syms.concat(R.syms),
          p: num(m.pParent, num(m.pLeft, 0) + num(m.pRight, 0)),
          leaf: false,
          left: L,
          right: R
        };
        L.side = "left";
        R.side = "right";
        internals.push(parent);
        cur = cur.filter((n) => n !== L && n !== R);
        cur.push(parent);
        cur = cur.slice().sort((a, b) => a.p - b.p);
        states.push(cur.slice());
      }
      const root = internals.length ? internals[internals.length - 1] : null;
      const leafOrder = [];
      (function walk(n, d) {
        if (!n) return;
        n.depth = d;
        if (n.leaf) {
          leafOrder.push(n);
          return;
        }
        walk(n.left, d + 1);
        walk(n.right, d + 1);
      })(root, 0);
      if (!leafOrder.length) {
        states[0].forEach((n) => {
          n.depth = 0;
          leafOrder.push(n);
        });
      }
      const maxDepth = leafOrder.reduce((m, n) => Math.max(m, n.depth || 0), 0);
      const code = {};
      (function bits(n, s) {
        if (!n) return;
        if (n.leaf) {
          code[n.sym] = s || "0";
          return;
        }
        bits(n.left, s + "0");
        bits(n.right, s + "1");
      })(root, "");
      const si = (i) => states[Math.min(i, states.length - 1)] || [];
      const mi = (i) => i >= 0 && i < merges.length ? merges[i] : null;
      const QSPEC = [
        { st: si(0), m: null },
        { st: si(0), m: mi(0) },
        { st: si(1), m: mi(1) },
        { st: si(3), m: mi(3) },
        { st: si(4), m: null }
      ];
      const runSum = [0];
      merges.forEach((m, i) => {
        runSum[i + 1] = runSum[i] + num(m.pParent, 0);
      });
      const sumOK = merges.length >= 4 && Math.abs(runSum[merges.length] - LBAR) < 5e-4;
      const lbarAt = (k) => k <= 0 ? 0 : k >= 3 ? LBAR : sumOK ? runSum[Math.min(k, runSum.length - 1)] : 0;
      const W = 600;
      const LX = 14, QW = 136, QTOP = 52, QH = 22, QGAP = 4;
      const CHIPX = 170, CHIPW = 62;
      const RX = 250;
      const NW = 44, NH = 20;
      const SLOT0 = 274, SLOT1 = 546;
      const nLeaf = Math.max(1, leafOrder.length);
      const slotX = (i) => nLeaf > 1 ? SLOT0 + i * ((SLOT1 - SLOT0) / (nLeaf - 1)) : (SLOT0 + SLOT1) / 2;
      const LEVEL0 = 94, LEVELH = maxDepth > 0 ? Math.min(46, 138 / maxDepth) : 46;
      const levelY = (d) => LEVEL0 + d * LEVELH;
      const rowTop = (i) => QTOP + i * (QH + QGAP);
      const rowMid = (i) => rowTop(i) + QH / 2;
      const BX = 48, BMAX = 400;
      const SCALE = Math.max(H, LBAR, 1e-3) * 1.18;
      const wOf = (v) => Math.max(1, BMAX * Math.min(1, Math.max(0, v) / SCALE));
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg hb-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      const txt = (x, y, cls, s, anchor) => {
        const t = el("text", { x, y, class: cls }, svg);
        if (anchor) t.setAttribute("text-anchor", anchor);
        t.textContent = s == null ? "" : String(s);
        return t;
      };
      layer("head", 0);
      add("head", txt(LX, 18, "hb-title", labels.head || "build the Huffman tree"));
      add("head", txt(LX, 42, "hb-head", labels.queueHead || "queue (ascending)"));
      add("head", txt(RX, 42, "hb-head", labels.treeHead || "the tree"));
      const QROWS = 5;
      const qrow = [];
      for (let i = 0; i < QROWS; i++) {
        layer("q" + i, 0);
        const box = add("q" + i, el("rect", { x: LX, y: rowTop(i), width: QW, height: QH, rx: 5, class: "hb-qrow" }, svg));
        const sym = add("q" + i, txt(LX + 8, rowMid(i) + 4, "hb-qsym", ""));
        const pv = add("q" + i, txt(LX + QW - 8, rowMid(i) + 4, "hb-qp", "", "end"));
        qrow.push({ box, sym, pv });
      }
      layer("brace", 1);
      const braceMid = (rowMid(0) + rowMid(1)) / 2;
      add("brace", el("path", {
        d: `M ${LX + QW + 4} ${rowMid(0)} H ${LX + QW + 12} V ${braceMid} H ${CHIPX - 4} M ${LX + QW + 4} ${rowMid(1)} H ${LX + QW + 12} V ${braceMid}`,
        class: "hb-brace",
        fill: "none"
      }, svg));
      add("brace", el("rect", { x: CHIPX, y: braceMid - QH / 2, width: CHIPW, height: QH, rx: 5, class: "hb-chip" }, svg));
      const chipVal = add("brace", txt(CHIPX + CHIPW / 2, braceMid + 4, "hb-chipval", "", "middle"));
      layer("tbl", 4);
      add("tbl", txt(LX, 196, "hb-head", labels.tableHead || "ideal vs paid length"));
      const CS = LX + 6, CP = 60, CI = 110, CL = 165;
      add("tbl", txt(CS, 214, "hb-th", labels.colSym || "sym"));
      add("tbl", txt(CP, 214, "hb-th", labels.colP || "p"));
      add("tbl", txt(CI, 214, "hb-th", labels.colIdeal || "\u2212log\u2082 p"));
      add("tbl", txt(CL, 214, "hb-th", labels.colLen || "len"));
      Object.keys(probs).forEach((s, i) => {
        const y = 230 + i * 16;
        add("tbl", txt(CS, y, "hb-td hb-td-sym", s));
        add("tbl", txt(CP, y, "hb-td", p2(num(probs[s], 0))));
        add("tbl", txt(CI, y, "hb-td hb-ideal", b4(num(idealLen[s], NaN))));
        add("tbl", txt(CL, y, "hb-td hb-paid", num(codeLen[s], NaN)));
      });
      const nodeBox = (n, cx, cy, cls) => {
        const g = [];
        g.push(el("rect", { x: cx - NW / 2, y: cy - NH / 2, width: NW, height: NH, rx: 5, class: cls }, svg));
        const t = el("text", { x: cx, y: cy + 4, class: "hb-nsym" }, svg);
        t.setAttribute("text-anchor", "middle");
        t.textContent = n.leaf ? n.sym : n.syms.join("");
        g.push(t);
        return g;
      };
      leafOrder.forEach((n, i) => {
        n.cx = slotX(i);
        n.cy = levelY(n.depth || 0);
      });
      for (const n of internals) {
        n.cx = ((n.left && n.left.cx) + (n.right && n.right.cx)) / 2;
        n.cy = levelY(n.depth || 0);
      }
      const parentStep = (n) => {
        const i = internals.findIndex((p) => p.left === n || p.right === n);
        return i < 0 ? 0 : Math.min(i + 1, 3);
      };
      layer("leaves", 0);
      const leafG = [];
      const FLOOR = levelY(maxDepth);
      leafOrder.forEach((n) => {
        const g = el("g", { class: "hb-leafg" }, svg);
        add("leaves", g);
        el("rect", { x: n.cx - NW / 2, y: n.cy - NH / 2, width: NW, height: NH, rx: 5, class: "hb-node hb-leaf" }, g);
        const t = el("text", { x: n.cx, y: n.cy + 4, class: "hb-nsym" }, g);
        t.setAttribute("text-anchor", "middle");
        t.textContent = n.sym;
        const pt = el("text", { x: n.cx, y: n.cy + NH / 2 + 12, class: "hb-np" }, g);
        pt.setAttribute("text-anchor", "middle");
        pt.textContent = p2(n.p);
        leafG.push({ g, dy: FLOOR - n.cy, at: parentStep(n) });
      });
      const newNodes = [];
      internals.forEach((n, i) => {
        const at = Math.min(i + 1, 3);
        const name = "in" + i;
        layer(name, at);
        const els = nodeBox(n, n.cx, n.cy, "hb-node hb-inner");
        els.forEach((e) => add(name, e));
        const isRight = n.side === "right";
        const anchor = n === root ? "middle" : isRight ? "start" : "end";
        const px = n === root ? n.cx : isRight ? n.cx + 8 : n.cx - 8;
        add(name, txt(px, n.cy - NH / 2 - 6, "hb-np", p2(n.p), anchor));
        [[n.left, "0", -1], [n.right, "1", 1]].forEach(([c, bit, dir]) => {
          if (!c) return;
          add(name, el("line", { x1: n.cx, y1: n.cy + NH / 2, x2: c.cx, y2: c.cy - NH / 2, class: "hb-edge" }, svg));
          const mx = (n.cx + c.cx) / 2, my = (n.cy + c.cy) / 2;
          add(name, txt(mx + dir * 6, my + 4, "hb-bit", bit, dir < 0 ? "end" : "start"));
        });
        newNodes.push({ els: layers[name].nodes, at });
      });
      layer("code", 3);
      add("code", txt(RX, 272, "hb-head", labels.codeHead || "read the codewords off the edges"));
      add("code", txt(
        RX,
        290,
        "hb-code",
        Object.keys(probs).map((s) => s + " " + (code[s] || "?")).join("  \xB7  ")
      ));
      layer("rule1", 0);
      add("rule1", el("line", { x1: LX, y1: 302, x2: W - LX, y2: 302, class: "hb-rule" }, svg));
      layer("barH", 0);
      add("barH", txt(LX, 323, "hb-barlbl", "H"));
      add("barH", el("rect", { x: BX, y: 310, width: BMAX, height: 18, rx: 4, class: "hb-barbg" }, svg));
      add("barH", el("rect", { x: BX, y: 310, width: wOf(H), height: 18, rx: 4, class: "hb-barH" }, svg));
      add("barH", txt(BX + wOf(H) + 8, 323, "hb-barval hb-valH", b4(H) + " " + UNIT));
      layer("barL", 1);
      add("barL", txt(LX, 349, "hb-barlbl", "L\u0304"));
      add("barL", el("rect", { x: BX, y: 336, width: BMAX, height: 18, rx: 4, class: "hb-barbg" }, svg));
      const barL = add("barL", el("rect", { x: BX, y: 336, width: 1, height: 18, rx: 4, class: "hb-barL" }, svg));
      const valL = add("barL", txt(BX + 8, 349, "hb-barval hb-valL", ""));
      layer("gap", 3);
      const gapT = add("gap", txt(LX, 370, "hb-gap", ""));
      layer("dyad", 4);
      add("dyad", el("line", { x1: LX, y1: 382, x2: W - LX, y2: 382, class: "hb-rule" }, svg));
      add("dyad", txt(LX, 398, "hb-head", labels.dyadHead || "a dyadic source: L\u0304 = H exactly"));
      add("dyad", txt(LX, 414, "hb-barlbl", "H"));
      add("dyad", el("rect", { x: BX, y: 404, width: BMAX, height: 14, rx: 3, class: "hb-barbg" }, svg));
      add("dyad", el("rect", { x: BX, y: 404, width: wOf(dyH), height: 14, rx: 3, class: "hb-barH" }, svg));
      add("dyad", txt(BX + wOf(dyH) + 8, 414, "hb-barval hb-valH", b4(dyH) + " " + UNIT));
      add("dyad", txt(LX, 434, "hb-barlbl", "L\u0304"));
      add("dyad", el("rect", { x: BX, y: 424, width: BMAX, height: 14, rx: 3, class: "hb-barbg" }, svg));
      add("dyad", el("rect", { x: BX, y: 424, width: wOf(dyL), height: 14, rx: 3, class: "hb-barL" }, svg));
      add("dyad", txt(BX + wOf(dyL) + 8, 434, "hb-barval hb-valL", b4(dyL) + " " + UNIT));
      add("dyad", txt(
        LX,
        458,
        "hb-gap hb-gap-zero",
        (labels.gapLabel || "L\u0304 \u2212 H") + " = " + b4(Math.max(0, dyL - dyH)) + " " + UNIT
      ));
      add("dyad", txt(
        RX,
        458,
        "hb-code",
        Object.keys(dyCode).map((s) => s + " " + dyCode[s]).join(" \xB7 ")
      ));
      const H_SVG = frameHeightFor(462, 12);
      svg.setAttribute("viewBox", `0 0 ${W} ${H_SVG}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        for (const nn of newNodes) {
          for (const e of nn.els) e.classList.toggle("is-new", k === nn.at);
        }
        for (const L of leafG) L.g.setAttribute("transform", k >= L.at ? "translate(0,0)" : `translate(0,${L.dy})`);
        const spec = QSPEC[Math.max(0, Math.min(QSPEC.length - 1, k))] || QSPEC[0];
        const st = spec.st || [];
        const hot = spec.m ? [key(spec.m.left), key(spec.m.right)] : [];
        for (let i = 0; i < QROWS; i++) {
          const n = st[i], r = qrow[i];
          const show = !!n;
          r.box.classList.toggle("is-hidden", !show);
          r.sym.classList.toggle("is-hidden", !show);
          r.pv.classList.toggle("is-hidden", !show);
          if (!show) continue;
          const warm = hot.indexOf(key(n.syms)) >= 0;
          r.box.classList.toggle("is-merge", warm);
          r.sym.classList.toggle("is-merge", warm);
          r.pv.classList.toggle("is-merge", warm);
          r.sym.textContent = n.leaf ? n.sym : n.syms.join("");
          r.pv.textContent = p2(n.p);
        }
        const braceOn = !!spec.m;
        for (const node of layers.brace.nodes) node.classList.toggle("is-hidden", !braceOn);
        if (braceOn) chipVal.textContent = p2(num(spec.m.pParent, 0));
        const lv = lbarAt(k);
        barL.setAttribute("width", String(Math.max(1, wOf(lv))));
        valL.setAttribute("x", String(BX + wOf(lv) + 8));
        valL.textContent = k >= 3 ? b4(LBAR) + " " + UNIT : lv > 0 ? (labels.partialLabel || "\u03A3 p(parent) so far") + " = " + p2(lv) : "";
        if (k >= 3) {
          gapT.textContent = (labels.gapLabel || "L\u0304 \u2212 H") + " = " + b4(EXCESS) + " " + UNIT + "  (+" + fx(EXCESS_PCT, 1) + " %)";
        }
      };
    }
  });
})();
