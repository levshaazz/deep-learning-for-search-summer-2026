/* AUTO-GENERATED offline classic bundle of widgets/ncd-debug/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-debug/logic.js
  var mountNcdDebug = defineWidget({
    id: "ncd-debug",
    rootClass: "ncdd-root",
    exportName: "mountNcdDebug",
    maxStep: 2,
    render({ host, data, labels, el }) {
      const A = data && data.attention || {};
      const P = data && data.params || {};
      const MEM = data && data.memory || {};
      const dk = A.dk != null ? A.dk : 4;
      const n = 3;
      const d = P.d != null ? P.d : 768;
      const h = MEM.heads != null ? MEM.heads : 12;
      const dHead = Math.round(d / h);
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const W = 820, H = 320;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdd-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "Three broken neural circuit diagrams")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "the bug"));
      const T = (p, x, y, s, cls, a) => G.text(p, x, y, s, cls, a || "middle");
      const R = (p, cls, x, y, w, hh, rx) => el("rect", { class: cls, x, y, width: w, height: hh, rx: rx || 5 }, p);
      const chip = (p, cx, cy, w, s, cls, txtCls) => {
        R(p, cls, cx - w / 2, cy - 13, w, 26, 6);
        T(p, cx, cy + 4, s, txtCls);
      };
      function cross(p, cx, cy) {
        el("circle", { class: "ncdd-x", cx, cy, r: 13 }, p);
        T(p, cx, cy + 5, "\u2717", "ncdd-x-txt");
      }
      function header(p, s) {
        G.tagBox(p, W / 2, 31, s, "ncdd-hdr", "ncdd-hdr-txt", 13, 6).setAttribute("rx", 7);
      }
      function fixband(p, s) {
        G.tagBox(p, W / 2, H - 40, s, "ncdd-fix", "ncdd-fix-txt", 17, 8).setAttribute("rx", 8);
      }
      const LEDGERS = [
        {
          rows: [
            { k: "Q", v: `${n}\xD7${dk}` },
            { k: "K", v: `${n}\xD7${dk}` },
            { k: L("lgWant", "must contract"), v: `d = ${dk}` },
            { k: L("lgGot", "axes that met"), v: `${dk} \u2717 ${n}`, tone: "cost" },
            { k: L("lgFix", "fix"), v: `K\u1D40 (${dk}\xD7${n})`, tone: "good" }
          ],
          note: L("lgN0", "A cup can only contract two axes that MATCH. Here d=4 meets n=3, so there is nothing to contract \u2014 the wires do not join. In the formula QK\u1D40 the transpose is one character and easy to lose; on the diagram the circuit simply comes apart.")
        },
        {
          rows: [
            { k: L("lgShapeIn", "shape in"), v: "n\xD7n" },
            { k: L("lgShapeOut", "shape out"), v: "n\xD7n" },
            { k: L("lgNormOver", "normalised over"), v: L("lgQueries", "queries \u2717"), tone: "cost" },
            { k: L("lgShouldBe", "should be"), v: L("lgKeys", "keys \u2713"), tone: "good" },
            { k: L("lgTypeCheck", "a shape check says"), v: "OK", tone: "cost" }
          ],
          note: L("lgN1", "This is the dangerous one. n\xD7n goes in and n\xD7n comes out, so every shape assertion in your stack passes and nothing crashes \u2014 the model just learns nonsense. NCD draws the triangle ACROSS the axis it normalises, so a triangle turned the wrong way is visible even when the shape is not.")
        },
        {
          rows: [
            { k: L("lgPerHead", "per head"), v: `n\xD7${dHead}` },
            { k: `${L("lgAfter", "after")} h=${h}`, v: `h\xD7n\xD7${dHead}`, tone: "cost" },
            { k: L("lgNextWants", "next block wants"), v: `n\xD7${d}` },
            { k: L("lgFix", "fix"), v: "concat + L_O", tone: "good" }
          ],
          note: L("lgN2", "The head axis was never put back. Blocks compose end to end only because every sublayer preserves the n\xD7m shape \u2014 leave h dangling and the next block will not fit. Concat is not glue for convenience; it is the operation that returns the axis you split.")
        }
      ];
      let main = null;
      return (step) => {
        if (main) main.remove();
        main = el("g", { class: "ncd-fx" }, svg);
        const g = main, s = Math.max(0, Math.min(2, step));
        const LG = LEDGERS[s];
        lg.set(LG.rows.map((r) => ({ ...r, state: "on" })), LG.note);
        if (s === 0) {
          header(g, L("h0", "bug 1 \u2014 K is not transposed"));
          const yQ = 108, yK = 186, yS = (yQ + yK) / 2, xL = 118, xCup = 348;
          T(g, 26, yQ - 22, "x", "ncdd-axis-in", "start");
          [["Q", yQ], ["K", yK]].forEach(([nm, y]) => {
            G.wire(g, "ncdd-w ncdd-w-in", 26, y, xL - 25, y);
            G.chippedL(g, xL, y, nm, "ncdd-L", "ncdd-L-txt");
            G.wire(g, "ncdd-w ncdd-w-d", xL + 24, y, xCup - 62, y);
            T(g, (xL + xCup) / 2 - 16, y - 12, `${nm} : ${n}\xD7${dk}`, "ncdd-size");
          });
          chip(g, xCup - 42, yQ, 28, String(dk), "ncdd-chip-bad", "ncdd-chipv");
          chip(g, xCup - 42, yK, 28, String(n), "ncdd-chip-bad", "ncdd-chipv");
          el("path", { class: "ncdd-w ncdd-w-d", d: `M${xCup - 28},${yQ} Q${xCup - 6},${yS} ${xCup - 28},${yK}`, fill: "none" }, g);
          G.cup(g, xCup, yS, "ncdd-op-bad", "ncdd-op-dot-bad");
          cross(g, xCup, yS);
          chip(g, xCup + 96, yS, 118, `${dk} \u2260 ${n}`, "ncdd-chip-bad", "ncdd-chipv-bad");
          R(g, "ncdd-void", xCup + 186, yS - 18, 176, 36, 8);
          T(g, xCup + 274, yS + 5, L("noContract", "no contraction"), "ncdd-void-txt");
          fixband(g, L("fix0", `fix: K\u1D40 is ${dk}\xD7${n} \u2192 (${n}\xD7${dk})\xB7(${dk}\xD7${n}) = ${n}\xD7${n} \u2713`));
        }
        if (s === 1) {
          let panel = function(gx, bad) {
            const xv = gx - 34, cyT = (gy + gyBot) / 2;
            T(
              g,
              gx + 52,
              56,
              bad ? L("badHdr", "\u2717 over queries") : L("okHdr", "\u2713 over keys"),
              bad ? "ncdd-bad-hdr" : "ncdd-ok-hdr"
            );
            if (bad) {
              G.wire(g, "ncdd-w ncdd-w-ax", gx, yKey, gx + 104, yKey, { arrow: true });
            } else {
              G.wire(g, "ncdd-w ncdd-w-ax", gx, yKey, gx + 34, yKey);
              G.wire(g, "ncdd-w ncdd-w-ax", gx + 70, yKey, gx + 104, yKey, { arrow: true });
            }
            T(g, gx + 112, yKey + 4, L("axKeys", "m \xB7 keys"), "ncdd-axlbl", "start");
            if (bad) {
              G.wire(g, "ncdd-w ncdd-w-ax", xv, gy, xv, cyT - 18);
              G.wire(g, "ncdd-w ncdd-w-ax", xv, cyT + 18, xv, gyBot);
            } else {
              G.wire(g, "ncdd-w ncdd-w-ax", xv, gy, xv, gyBot);
            }
            arrowDown(xv, gyBot, "ncdd-w-ax");
            T(g, xv, 96, L("axQueries", "n \xB7 queries"), "ncdd-axlbl");
            for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
              R(g, "ncdd-cell ncd-onwire", gx + j * CW, gy + i * CH, CW - 4, CH - 4, 3);
            if (bad) {
              for (let j = 0; j < 3; j++) {
                G.wire(g, "ncdd-w ncdd-guide-bad", colC(gx, j), gy - 6, colC(gx, j), gyBot + 12, { dash: "4 3" });
                arrowDown(colC(gx, j), gyBot + 12, "ncdd-guide-bad");
                chip(g, colC(gx, j), 234, 34, "\u03A3=1", "ncdd-chip-bad", "ncdd-chipv-bad");
              }
              G.tri(g, xv, cyT, "ncdd-tri-bad", "ncdd-tri-txt-bad", 90);
            } else {
              for (let i = 0; i < 3; i++) {
                G.wire(g, "ncdd-w ncdd-guide-ok", gx - 6, rowC(i), gx + 112, rowC(i), { dash: "4 3" });
                el("path", {
                  class: "ncdd-w ncdd-guide-ok",
                  fill: "none",
                  style: "stroke-linejoin:round",
                  d: `M${gx + 104},${rowC(i) - 4} L${gx + 112},${rowC(i)} L${gx + 104},${rowC(i) + 4}`
                }, g);
                chip(g, gx + 134, rowC(i), 34, "\u03A3=1", "ncdd-chip-ok", "ncdd-chipv-ok");
              }
              G.tri(g, gx + 52, yKey, "ncdd-tri-ok", "ncdd-tri-txt-ok", 0);
            }
          };
          header(g, L("h1", "bug 2 \u2014 softmax over the wrong axis"));
          const CW = 36, CH = 34, gy = 106, gyBot = gy + 2 * CH + 30;
          const yKey = 84;
          const colC = (gx, j) => gx + j * CW + 16, rowC = (i) => gy + i * CH + 15;
          const arrowDown = (x, y, cls) => el("path", {
            class: "ncdd-w " + cls,
            fill: "none",
            d: `M${x - 4},${y - 8} L${x},${y} L${x + 4},${y - 8}`,
            style: "stroke-linejoin:round"
          }, g);
          panel(128, true);
          panel(528, false);
          T(g, W / 2, 142, "n\xD7n", "ncdd-size");
          T(g, W / 2, 164, L("vs", "vs"), "ncdd-vs");
          T(g, W / 2, 188, "n\xD7n", "ncdd-size");
          fixband(g, L("fix1", "same wires, same n\xD7n shape \u2014 only the triangle turned. No shape check can see it."));
        }
        if (s === 2) {
          header(g, L("h2", "bug 3 \u2014 the heads were never merged"));
          const y = 138;
          const rx0 = 78, ry0 = y - 46, rw = 250;
          R(g, "ncdd-region", rx0, ry0, rw, 96, 14);
          G.tagBox(
            g,
            rx0 + 23,
            ry0 - 10,
            L("tagHeads", `broadcast: h=${h} heads`),
            "ncdd-rtag",
            "ncdd-rtag-txt",
            9,
            5,
            "start"
          ).setAttribute("rx", 6);
          T(g, 22, y - 22, "x", "ncdd-axis-in", "start");
          G.wire(g, "ncdd-w ncdd-w-in", 22, y, 138, y);
          G.box(g, 208, y, 128, 46, L("lblAttn", "attention"), `n\xD7${dHead}`, "ncdd-attn", "ncdd-attn-txt", "ncdd-size");
          G.wire(g, "ncdd-w ncdd-w-bad", 328, y, 372, y);
          chip(g, 436, y, 118, `h\xD7n\xD7${dHead}`, "ncdd-chip-bad", "ncdd-chipv-bad");
          cross(g, 524, y);
          R(g, "ncdd-void", 566, y - 24, 190, 48, 8);
          T(g, 661, y - 4, L("nextBlock", "the next block"), "ncdd-void-txt");
          T(g, 661, y + 14, `${L("wants", "wants")} n\xD7${d}`, "ncdd-void-sub");
          const fy = 236;
          T(g, 22, fy - 20, L("fixLbl", "fix"), "ncdd-ok-hdr", "start");
          G.wire(g, "ncdd-w ncdd-w-ok", 78, fy, 244, fy);
          G.hexagon(g, 288, fy, L("concat", "concat"), "ncdd-hex", "ncdd-hex-txt", 44, 19);
          G.wire(g, "ncdd-w ncdd-w-ok", 332, fy, 386, fy);
          G.chippedL(g, 414, fy, "O", "ncdd-L-ok", "ncdd-L-txt-ok");
          G.wire(g, "ncdd-w ncdd-w-ok", 438, fy, 500, fy, { arrow: true });
          chip(g, 566, fy, 110, `n\xD7${d}`, "ncdd-chip-ok", "ncdd-chipv-ok");
          T(g, 660, fy + 5, "\u2713", "ncdd-check", "start");
        }
        T(
          g,
          W / 2,
          H - 8,
          L("legMap", "a cup joins two EQUAL axes \xB7 the triangle points across the axis it normalises"),
          "ncdd-legend"
        );
      };
    }
  });
})();
