/* AUTO-GENERATED offline classic bundle of widgets/ncd-ann/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_ncd.js
  function glyphs(el) {
    const text = (parent, x, y, s, cls, anchor = "middle") => {
      if (!parent) throw new Error(`_ncd.text("${s}"): no parent \u2014 the label would be created and dropped`);
      const t = el("text", { x, y, class: cls || "", "text-anchor": anchor }, parent);
      t.textContent = s;
      return t;
    };
    const wire = (parent, cls, x1, y1, x2, y2, opt = {}) => {
      const a = { class: opt.dash ? cls : cls + " ncd-wire", x1, y1, x2, y2 };
      if (!opt.dash) a.pathLength = 1;
      const p = el("line", a, parent);
      if (opt.dash) p.setAttribute("stroke-dasharray", opt.dash);
      if (opt.arrow) el("path", {
        class: cls,
        d: `M${x2 - 8},${y2 - 4} L${x2},${y2} L${x2 - 8},${y2 + 4}`,
        fill: "none",
        style: "stroke-linejoin:round"
      }, parent);
      return p;
    };
    const path = (parent, cls, d) => el("path", { class: cls, d }, parent);
    function chippedL(parent, cx, cy, label, boxCls, txtCls, w = 46, h = 40) {
      const c = 10, x = cx - w / 2, y = cy - h / 2;
      el("path", { class: boxCls, d: `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z` }, parent);
      text(parent, cx, cy + 4, label, txtCls);
    }
    function cup(parent, cx, cy, opCls, dotCls) {
      el("path", { class: opCls, d: `M${cx - 14},${cy - 12} Q${cx},${cy + 16} ${cx + 14},${cy - 12}` }, parent);
      el("circle", { class: dotCls, cx, cy: cy + 6, r: 2.4 }, parent);
    }
    function tri(parent, cx, cy, triCls, txtCls, rot = 0) {
      const a = rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const P = ([x, y]) => `${cx + x * c - y * s},${cy + x * s + y * c}`;
      el("path", { class: triCls, d: `M${P([-18, -19])} L${P([18, 0])} L${P([-18, 19])} Z` }, parent);
      const tx = -5 * c - 1 * s, ty = -5 * s + 1 * c;
      text(parent, cx + tx, cy + ty + 4, "\u03C3", txtCls);
    }
    function hexagon(parent, cx, cy, label, hexCls, txtCls, r = 24, ry = 18) {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + i * Math.PI / 3;
        pts.push(`${cx + r * Math.cos(a)},${cy + ry * Math.sin(a)}`);
      }
      el("polygon", { class: hexCls, points: pts.join(" ") }, parent);
      if (label) text(parent, cx, cy + 4, label, txtCls);
    }
    function pentagon(parent, cx, cy, label, elCls, txtCls, w = 34, h = 30) {
      el("path", { class: elCls, d: `M${cx - w / 2},${cy} L${cx - w / 6},${cy - h / 2} H${cx + w / 2} V${cy + h / 2} H${cx - w / 6} Z` }, parent);
      if (label) text(parent, cx + 5, cy + 4, label, txtCls);
    }
    function box(parent, cx, cy, w, h, label, sub, boxCls, txtCls, sizeCls) {
      el("rect", { class: boxCls, x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 6 }, parent);
      text(parent, cx, cy + (sub ? -6 : 4), label, txtCls);
      if (sub) text(parent, cx, cy + 13, sub, sizeCls);
    }
    function tagBox(parent, cx, cy, s, boxCls, txtCls, padX = 9, padY = 5, anchor = "middle") {
      const t = text(parent, cx, cy, s, txtCls, anchor);
      const b = t.getBBox();
      if (String(s).trim() && b.width === 0) {
        throw new Error(`_ncd.tagBox("${s}"): measured a 0-width box \u2014 the figure is being drawn inside a hidden subtree, where getBBox() lies. Every measured box would collapse onto the origin.`);
      }
      const r = el("rect", {
        class: boxCls,
        x: b.x - padX,
        y: b.y - padY,
        width: b.width + padX * 2,
        height: b.height + padY * 2,
        rx: 5
      }, parent);
      parent.insertBefore(r, t);
      return r;
    }
    function chips(parent, centers, y, vals, chipCls, valCls, w, fmt2) {
      centers.forEach((cx, i) => {
        el("rect", { class: chipCls, x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 5 }, parent);
        text(parent, cx, y + 4, fmt2 ? fmt2(vals[i]) : String(vals[i]), valCls);
      });
    }
    function weave(parent, wCls, tagCls, txtCls, x1, x2, y, bow, tag) {
      const mx = (x1 + x2) / 2;
      path(parent, wCls, `M${x1},${y} C${x1 + 30},${y - bow} ${mx - 60},${y - bow} ${mx},${y - bow} C${mx + 60},${y - bow} ${x2 - 30},${y - bow} ${x2},${y}`);
      el("circle", { cx: x1, cy: y, r: 3, class: wCls, style: "stroke:none" }, parent);
      tagBox(parent, mx, y - bow + 3, tag, tagCls, txtCls, 8, 4);
    }
    function region(parent, x, y, w, h, tag, regionCls, tagCls, txtCls) {
      el("rect", { class: regionCls, x, y, width: w, height: h, rx: 14 }, parent);
      tagBox(parent, x + 24, y - 6, tag, tagCls, txtCls, 9, 4, "start");
    }
    function legend(parent, cx, y, s, cls, maxW, lh = 15) {
      const items = String(s).split(" \xB7 ");
      const probe = text(parent, -9999, -9999, "", cls);
      const fits = (str) => {
        probe.textContent = str;
        return probe.getBBox().width <= maxW;
      };
      const lines = [];
      let cur = "";
      for (const it of items) {
        const next = cur ? `${cur} \xB7 ${it}` : it;
        if (cur && !fits(next)) {
          lines.push(cur);
          cur = it;
        } else cur = next;
      }
      if (cur) lines.push(cur);
      probe.remove();
      const y0 = y - (lines.length - 1) * lh;
      lines.forEach((ln, i) => text(parent, cx, y0 + i * lh, ln, cls));
      return lines.length;
    }
    const fmt3 = (x) => typeof x !== "number" ? "" : Number.isInteger(x) ? String(x) : x.toFixed(3);
    return { text, wire, path, chippedL, cup, tri, hexagon, pentagon, box, chips, weave, region, tagBox, legend, fmt3 };
  }
  function stage(host) {
    const w = document.createElement("div");
    w.className = "ncd-stagewrap";
    const d = document.createElement("div");
    d.className = "ncd-stage";
    w.appendChild(d);
    host.appendChild(w);
    return d;
  }
  function ledger(parent, title) {
    const a = document.createElement("aside");
    a.className = "ncd-lg";
    const h = document.createElement("div");
    h.className = "ncd-lg-h";
    h.textContent = title || "";
    a.appendChild(h);
    const body = document.createElement("div");
    body.className = "ncd-lg-b";
    a.appendChild(body);
    const note = document.createElement("p");
    note.className = "ncd-lg-note";
    a.appendChild(note);
    parent.appendChild(a);
    return {
      root: a,
      setTitle(t) {
        h.textContent = t || "";
      },
      set(rows, noteText) {
        body.textContent = "";
        (rows || []).forEach((r) => {
          const row = document.createElement("div");
          row.className = "ncd-lg-row" + (r.state === "new" ? " is-new" : r.state === "off" ? "" : " is-on") + (r.tone === "cost" ? " is-cost" : r.tone === "good" ? " is-good" : "");
          const k = document.createElement("span");
          k.className = "ncd-lg-k";
          k.textContent = r.k;
          const v = document.createElement("span");
          v.className = "ncd-lg-v";
          v.textContent = r.v;
          row.appendChild(k);
          row.appendChild(v);
          body.appendChild(row);
        });
        note.textContent = noteText || "";
      }
    };
  }

  // widgets/ncd-ann/logic.js
  var mountNcdAnn = defineWidget({
    id: "ncd-ann",
    rootClass: "ncdann-root",
    exportName: "mountNcdAnn",
    maxStep: 2,
    render({ host, labels, el }) {
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const W = 860, H = 430;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdann-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "Exact vs approximate nearest-neighbour search as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "cost & recall"));
      const NODES = [
        { x: 252, y: 168 },
        { x: 334, y: 152 },
        { x: 392, y: 254 },
        { x: 470, y: 160 },
        { x: 545, y: 250 },
        { x: 540, y: 145 },
        { x: 740, y: 130 },
        { x: 805, y: 220 },
        { x: 745, y: 300 },
        { x: 655, y: 205 }
      ];
      const EDGES = [
        [0, 1],
        [1, 2],
        [2, 3],
        [0, 2],
        // the cluster the walk moves through
        [2, 4],
        [3, 5],
        // the walk's frontier: d5 and d6 — scored, not expanded
        [4, 9],
        [5, 9],
        // the ONLY two ways into d10 — and both start on the frontier
        [5, 6],
        [6, 7],
        [7, 8],
        [8, 9]
      ];
      const WALK = [0, 1, 2, 3];
      const CAND = new Set(WALK);
      WALK.forEach((v) => EDGES.forEach(([i, j]) => {
        if (i === v) CAND.add(j);
        else if (j === v) CAND.add(i);
      }));
      const FRONTIER = [...CAND].filter((i) => !WALK.includes(i));
      const GOLD = /* @__PURE__ */ new Set([3, 9]);
      const MISS = 9;
      const HOP_SIDE = [1, -1, 1];
      const RGN_N = { x: 200, y: 86, w: 630, h: 266 };
      const RGN_C = { x: 200, y: 114, w: 385, h: 216 };
      const R = 22;
      const trim = (a, b, r) => {
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        return { x1: a.x + ux * r, y1: a.y + uy * r, x2: b.x - ux * r, y2: b.y - uy * r, ux, uy };
      };
      function hopBadge(g, i) {
        const a = NODES[WALK[i]], b = NODES[WALK[i + 1]];
        const t = trim(a, b, 0);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, s = HOP_SIDE[i] * 17;
        const cx = mx + -t.uy * s, cy = my + t.ux * s;
        el("circle", { class: "ncdann-hop", cx, cy, r: 9 }, g);
        G.text(g, cx, cy + 3.5, String(i + 1), "ncdann-hop-txt");
      }
      const HOPS = L("lgHops", "hops"), DEG = L("lgDeg", "degree");
      const CxDEG = "\u2248 " + HOPS + " \xB7 " + DEG;
      const kAxis = L("lgAxis", "broadcast axis"), kCups = L("lgCups", "contractions (cups)");
      const kCand = L("lgCands", "scored set |C|");
      const kWork = L("lgWork", "work / query"), kRec = L("lgRecall", "recall");
      const LEDGER = [
        {
          rows: [
            { k: kAxis, v: "N", state: "new" },
            { k: kCand, v: "= N", state: "new" },
            { k: kCups, v: "N", state: "new" },
            { k: kWork, v: "N \xB7 d", state: "new", tone: "cost" },
            { k: kRec, v: "1.0", state: "new", tone: "good" }
          ],
          note: L("lgN0", "Exact search is the special case C = N: you broadcast over the whole corpus, so you pay for the whole corpus \u2014 N contractions, N\xB7d multiplications. In exchange you get the only thing exact search can promise: recall 1.0, by construction.")
        },
        {
          rows: [
            { k: kAxis, v: "C \u226A N", state: "new", tone: "good" },
            { k: kCand, v: CxDEG, state: "new", tone: "good" },
            { k: kCups, v: "|C|", state: "new", tone: "good" },
            { k: kWork, v: "\u2248 |C| \xB7 d", state: "new", tone: "good" },
            { k: kRec, v: "?", state: "new" }
          ],
          note: L("lgN1", "The circuit is unchanged; only the axis shrank. C is not the walk \u2014 it is the walk PLUS every neighbour of a walked node, because to choose the next hop you must score them all. So |C| \u2248 hops \xB7 degree, still \u226A N, and the bill follows |C|, not the corpus. What recall survives is now an open question, not a guarantee.")
        },
        {
          rows: [
            { k: kAxis, v: "C \u226A N", state: "on", tone: "good" },
            { k: kCand, v: CxDEG, state: "on" },
            { k: kCups, v: "|C|", state: "on" },
            { k: kWork, v: "\u2248 |C| \xB7 d", state: "on", tone: "good" },
            { k: kRec, v: "< 1.0", state: "new", tone: "cost" }
          ],
          note: L("lgN2", "A true neighbour that no expanded node can see is a neighbour you never scored. That is what recall < 1 means \u2014 and it is not a bug, it is the deal: you traded a guarantee for a budget.")
        }
      ];
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const s = Math.max(0, Math.min(2, step));
        const fresh = (k) => k > prev && k <= s ? "ncd-fx" : "";
        const LG = LEDGER[s];
        lg.set(LG.rows, LG.note);
        const approx = s >= 1;
        const gQ = el("g", { class: fresh(0) }, main);
        G.text(gQ, 22, 18, L("lblQuery", "query"), "ncdann-qlbl", "start");
        el("rect", { class: "ncdann-qchip", x: 22, y: 26, width: 168, height: 30, rx: 8 }, gQ);
        G.text(gQ, 106, 46, "\u201C" + L("query", "neural search") + "\u201D", "ncdann-qchip-txt");
        G.wire(gQ, "ncdann-w ncdann-w-q", 106, 56, 106, 217);
        G.wire(gQ, "ncdann-w ncdann-w-q", 106, 217, 232, 217, { arrow: true });
        G.text(gQ, 118, 130, "q \xB7 d", "ncdann-axis", "start");
        const gR = el("g", { class: fresh(0) }, main);
        G.region(
          gR,
          RGN_N.x,
          RGN_N.y,
          RGN_N.w,
          RGN_N.h,
          approx ? L("tagNghost", "N \xB7 the corpus (unchanged)") : L("tagN", "N \xB7 broadcast over EVERY document"),
          approx ? "ncdann-region-ghost" : "ncdann-region",
          approx ? "ncdann-tag-ghost" : "ncdann-tag",
          approx ? "ncdann-tag-ghost-txt" : "ncdann-tag-txt"
        );
        if (approx) {
          const gC = el("g", { class: fresh(1) }, main);
          G.region(
            gC,
            RGN_C.x,
            RGN_C.y,
            RGN_C.w,
            RGN_C.h,
            L("tagC", "C \xB7 scored: walk + neighbours"),
            "ncdann-region",
            "ncdann-tag",
            "ncdann-tag-txt"
          );
        }
        const gE = el("g", { class: fresh(0) }, main);
        EDGES.forEach(([i, j]) => {
          const t = trim(NODES[i], NODES[j], R);
          G.wire(gE, "ncdann-edge", t.x1, t.y1, t.x2, t.y2);
        });
        if (approx) {
          const gW = el("g", { class: fresh(1) }, main);
          for (let i = 0; i < WALK.length - 1; i++) {
            const t = trim(NODES[WALK[i]], NODES[WALK[i + 1]], 24);
            G.wire(gW, "ncdann-walk", t.x1, t.y1, t.x2, t.y2, { arrow: true });
          }
          for (let i = 0; i < WALK.length - 1; i++) hopBadge(gW, i);
          G.text(gW, NODES[0].x, NODES[0].y - 26, L("lblEntry", "entry point"), "ncdann-entry");
          const fx = (NODES[FRONTIER[0]].x + NODES[FRONTIER[1]].x) / 2 - 5;
          G.text(gW, fx, 196, L("lblScored", "scored,"), "ncdann-frontier");
          G.text(gW, fx, 210, L("lblNotExp", "not expanded"), "ncdann-frontier");
        }
        const gD = el("g", { class: fresh(0) }, main);
        const gFaint = el("g", { class: "ncdann-faint" }, gD);
        NODES.forEach((n, i) => {
          const scored = !approx || CAND.has(i);
          const missed = s === 2 && i === MISS;
          const g = scored || missed ? gD : gFaint;
          const cls = missed ? "ncdann-node ncdann-node-miss" : GOLD.has(i) ? "ncdann-node ncdann-node-gold" : "ncdann-node";
          G.pentagon(g, n.x, n.y, "d" + (i + 1), cls, missed ? "ncdann-node-txt-miss" : "ncdann-node-txt");
          if (scored) G.cup(g, n.x, n.y + 30, "ncdann-cup", "ncdann-cup-dot");
        });
        if (approx) {
          const gU = el("g", { class: fresh(1) }, main);
          G.text(gU, 700, 340, L("lblUnscored", "N \u2212 C never scored"), "ncdann-unscored");
        }
        if (s === 2) {
          const gM = el("g", { class: fresh(2) }, main);
          FRONTIER.forEach((f) => {
            if (!EDGES.some(([i, j]) => i === f && j === MISS || j === f && i === MISS)) return;
            const t = trim(NODES[f], NODES[MISS], R);
            G.wire(gM, "ncdann-edge-miss", t.x1, t.y1, t.x2, t.y2, { dash: "5 4" });
          });
          G.text(gM, NODES[MISS].x, 272, L("lblMiss", "never scored"), "ncdann-miss");
          G.text(gM, NODES[MISS].x, 290, L("lblRecall", "recall < 1.0"), "ncdann-miss");
        }
        G.text(main, 515, 374, approx ? L("costAnn", "cost:  \u2248 |C| \xB7 d") : L("costExact", "cost:  N \xB7 d"), "ncdann-cost");
        G.legend(
          main,
          W / 2,
          H - 10,
          L(
            "legMap",
            "pentagon = a document vector \xB7 \u2323 = one contraction q\xB7d\u1D62 \xB7 dashed = the broadcast axis \xB7 orange = the graph walk"
          ),
          "ncdann-legend",
          W - 40
        );
        prev = s;
      };
    }
  });
})();
