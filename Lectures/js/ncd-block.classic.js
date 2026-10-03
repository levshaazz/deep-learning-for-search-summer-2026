/* AUTO-GENERATED offline classic bundle of widgets/ncd-block/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-block/logic.js
  var mountNcdBlock = defineWidget({
    id: "ncd-block",
    rootClass: "ncdb-root",
    exportName: "mountNcdBlock",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const P = data && data.params || {};
      const d = P.d != null ? P.d : 768;
      const attnCoef = P.attnCoef != null ? P.attnCoef : 4;
      const ffnCoef = P.ffnCoef != null ? P.ffnCoef : 8;
      const blockCoef = P.blockCoef != null ? P.blockCoef : 12;
      const blocks = P.blocks != null ? P.blocks : 12;
      const perBlockM = P.perBlockM != null ? P.perBlockM : 7.08;
      const tokenEmb = P.tokenEmb != null ? P.tokenEmb : 23440896;
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const M = (x) => (x / 1e6).toFixed(2) + "M";
      const attnP = attnCoef * d * d, ffnP = ffnCoef * d * d;
      const stackP = blockCoef * d * d * blocks;
      const totalP = stackP + tokenEmb;
      const W = 800, H = 250, yM = 150;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdb-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "A transformer block as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "parameters"));
      const xIn = 22, xTap1 = 86, xAttn = 184, xAdd1 = 286, xLN1 = 338;
      const xTap2 = 384, xFFN = 500, xAdd2 = 618, xLN2 = 670, xOut = 780;
      function plus(g, cx, cy = yM) {
        el("circle", { class: "ncdb-plus", cx, cy, r: 13 }, g);
        G.text(g, cx, cy + 5, "+", "ncdb-plus-txt");
      }
      function ln(g, cx) {
        el("circle", { class: "ncdb-ln", cx, cy: yM, r: 15 }, g);
        G.text(g, cx, yM + 4, L("lblLN", "LN"), "ncdb-ln-txt");
      }
      function residual(g, x1, x2) {
        const top = yM - 54;
        el("path", { class: "ncdb-w ncdb-w-res", d: `M${x1},${yM} C${x1},${top} ${x2},${top} ${x2},${yM - 13}` }, g);
        el("circle", { cx: x1, cy: yM, r: 3, fill: "var(--accent, #2A6FDB)" }, g);
        G.text(g, (x1 + x2) / 2, top - 4, L("lblRes", "residual"), "ncdb-lbl");
      }
      function setLedger(step) {
        if (step === 3) {
          lg.set([
            { k: L("lgPath", "identity path"), v: L("lgGone", "gone"), state: "new", tone: "cost" },
            { k: L("lgDepth", "sublayers to cross"), v: String(blocks * 2), state: "new", tone: "cost" }
          ], L("lgN3", "With no residual the ONLY path from x to the output runs THROUGH every sublayer. The gradient has nothing to hold on to."));
          return;
        }
        const on = (k) => step > k ? "on" : step === k ? "new" : "off";
        const rows = [
          { k: "d", v: String(d), state: "on" },
          { k: `attention ${attnCoef}d\xB2`, v: M(attnP), state: on(0) },
          { k: `FFN ${ffnCoef}d\xB2`, v: M(ffnP), state: step >= 1 ? on(1) : "off", tone: "cost" }
        ];
        if (step >= 2) {
          rows.push({ k: `${L("lgBlock", "block")} ${blockCoef}d\xB2`, v: perBlockM + "M", state: "new" });
          rows.push({ k: `\xD7 ${blocks} ${L("lgBlocks", "blocks")}`, v: M(stackP), state: "new" });
          rows.push({ k: "+ " + L("lgEmb", "embeddings"), v: M(tokenEmb), state: "new" });
          rows.push({ k: L("lgTotal", "total"), v: "\u2248 " + M(totalP), state: "new", tone: "good" });
        }
        const notes = [
          L("lgN0", "The shape never changes: n\xD7m in, n\xD7m out. A sublayer refines; it does not reshape."),
          L("lgN1", "The surprise: the FFN is 8d\xB2 \u2014 TWICE attention. Two thirds of the block is not attention at all."),
          L("lgN2", "This tally counts what the diagram draws: 12 blocks of 12d\xB2 plus the token embeddings. The quoted \u201C110M\u201D also pays for positions, segments, every bias, the LayerNorm gains and the pooler \u2014 the caption does that arithmetic.")
        ];
        lg.set(rows, notes[Math.min(step, 2)]);
      }
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const g = main;
        const fresh = (k) => k > prev && k <= step ? "ncd-fx" : "";
        setLedger(step);
        if (step === 3) {
          const gc = el("g", { class: "ncd-fx" }, main);
          G.text(gc, W / 2, 26, L("cfHead", "the same circuit \u2014 one wire apart"), "ncdb-cf-head");
          [
            { y: 88, keep: true, lab: L("cfWith", "with residual"), cls: "ncdb-cf-ok" },
            { y: 196, keep: false, lab: L("cfWithout", "no residual"), cls: "ncdb-cf-bad" }
          ].forEach(({ y, keep, lab, cls }) => {
            const xX = 130, b1 = 214, xAdd12 = 296, b2 = 384, xAdd22 = 466, xO = 512;
            G.tagBox(gc, 68, y + 4, lab, "ncdb-cf-lbl " + cls, "ncdb-cf-lbl-txt", 12, 8);
            G.wire(gc, "ncdb-w ncdb-w-main", xX, y, b1 - 56, y);
            G.box(gc, b1, y, 112, 40, L("lblAttn", "self-attention"), null, "ncdb-attn", "ncdb-attn-txt", "ncdb-sub");
            G.wire(gc, "ncdb-w ncdb-w-main", b1 + 56, y, keep ? xAdd12 - 12 : b2 - 56, y);
            if (keep) {
              plus(gc, xAdd12, y);
              G.wire(gc, "ncdb-w ncdb-w-main", xAdd12 + 12, y, b2 - 56, y);
            }
            G.box(gc, b2, y, 112, 40, L("lblFFN", "FFN"), null, "ncdb-ffn", "ncdb-ffn-txt", "ncdb-sub");
            G.wire(gc, "ncdb-w ncdb-w-main", b2 + 56, y, keep ? xAdd22 - 12 : xO, y, { arrow: !keep });
            if (keep) {
              plus(gc, xAdd22, y);
              G.wire(gc, "ncdb-w ncdb-w-main", xAdd22 + 12, y, xO, y, { arrow: true });
              [[144, xAdd12], [318, xAdd22]].forEach(([a, b]) => {
                el("path", {
                  class: "ncdb-w ncdb-w-res",
                  fill: "none",
                  d: `M${a},${y} C${a},${y + 52} ${b},${y + 52} ${b},${y + 12}`
                }, gc);
                el("circle", { cx: a, cy: y, r: 3, fill: "var(--accent, #2A6FDB)" }, gc);
              });
            }
            const gy = y - 38;
            if (keep) {
              G.wire(gc, "ncdb-w ncdb-grad-ok", xO, gy, xX - 4, gy);
              el("path", {
                class: "ncdb-w ncdb-grad-ok",
                fill: "none",
                d: `M${xX + 4},${gy - 4} L${xX - 4},${gy} L${xX + 4},${gy + 4}`
              }, gc);
            } else {
              [[xO, b2, 1], [b2, b1, 0.45], [b1, xX - 4, 0.15]].forEach(([a, b, o]) => {
                G.wire(gc, "ncdb-w ncdb-grad-bad", a, gy, b, gy).setAttribute("opacity", String(o));
              });
            }
            G.tagBox(
              gc,
              640,
              gy + 4,
              keep ? L("cfGradOk", "\u2207 reaches x intact") : L("cfGradBad", "\u2207 \u2248 0 by the time it lands"),
              "ncdb-cf-grad " + cls,
              "ncdb-cf-grad-txt",
              12,
              8
            );
          });
          G.text(gc, W / 2, H - 6, L("legCf", "every shape still lines up \u2014 it just never learns"), "ncdb-legend");
          prev = step;
          return;
        }
        const hasFFN = step >= 1;
        const endX = hasFFN ? xLN2 : xLN1;
        const gA = el("g", { class: fresh(0) }, g);
        G.text(gA, xIn, yM - 30, L("lblIn", "x  (n\xD7m)"), "ncdb-axis", "start");
        G.wire(gA, "ncdb-w ncdb-w-main", xIn, yM, xAttn - 58, yM);
        residual(gA, xTap1, xAdd1);
        G.box(gA, xAttn, yM, 116, 46, L("lblAttn", "self-attention"), "n\xD7m", "ncdb-attn", "ncdb-attn-txt", "ncdb-sub");
        G.wire(gA, "ncdb-w ncdb-w-main", xAttn + 58, yM, xAdd1 - 13, yM, { arrow: true });
        plus(gA, xAdd1);
        G.wire(gA, "ncdb-w ncdb-w-main", xAdd1 + 13, yM, xLN1 - 15, yM);
        ln(gA, xLN1);
        if (hasFFN) {
          const gB = el("g", { class: fresh(1) }, g);
          G.wire(gB, "ncdb-w ncdb-w-main", xLN1 + 15, yM, xFFN - 62, yM);
          residual(gB, xTap2, xAdd2);
          el("circle", { cx: xTap2, cy: yM, r: 3, fill: "var(--accent, #2A6FDB)" }, gB);
          G.box(gB, xFFN, yM, 118, 46, L("lblFFN", "FFN"), L("lblFFNsub", "m \u2192 4m \u2192 m"), "ncdb-ffn", "ncdb-ffn-txt", "ncdb-sub");
          G.wire(gB, "ncdb-w ncdb-w-main", xFFN + 59, yM, xAdd2 - 13, yM, { arrow: true });
          plus(gB, xAdd2);
          G.wire(gB, "ncdb-w ncdb-w-main", xAdd2 + 13, yM, xLN2 - 15, yM);
          ln(gB, xLN2);
        }
        const gO = el("g", { class: fresh(hasFFN ? 1 : 0) }, g);
        G.wire(gO, "ncdb-w ncdb-w-main", endX + 15, yM, xOut, yM, { arrow: true });
        G.text(gO, xOut - 2, yM - 26, L("lblOut", "out"), "ncdb-axis", "end");
        if (step >= 2) {
          const gC = el("g", { class: fresh(2) }, g);
          const tag = L("tagHead", "broadcast: h heads");
          el("path", { class: "ncdb-weave", d: `M${xTap1 + 8},${yM + 40} C${xAttn - 60},${yM + 62} ${xAttn + 60},${yM + 62} ${xAdd1 + 8},${yM + 40}` }, gC);
          G.tagBox(gC, xAttn, yM + 67, tag, "ncdb-tag ncd-onwire", "ncdb-tag-txt");
          G.tagBox(gC, xOut - 76, 35, L("tagStack", "\xD7 L blocks \u2192 the model"), "ncdb-stack", "ncdb-stack-txt");
        }
        G.legend(g, W / 2, H - 6, L("legMap", "wire = token vectors \xB7 \u2295 = residual add \xB7 \u25CE = LayerNorm"), "ncdb-legend", W - 40);
        prev = step;
      };
    }
  });
})();
