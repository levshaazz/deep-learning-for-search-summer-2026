/* AUTO-GENERATED offline classic bundle of widgets/ncd-multihead/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-multihead/logic.js
  var mountNcdMultihead = defineWidget({
    id: "ncd-multihead",
    rootClass: "ncdm-root",
    exportName: "mountNcdMultihead",
    maxStep: 2,
    render({ host, data, labels, el }) {
      const P = data && data.params || {};
      const MEM = data && data.memory || {};
      const d = P.d != null ? P.d : 768;
      const heads = MEM.heads != null ? MEM.heads : 12;
      const dHead = heads ? Math.round(d / heads) : d;
      const ifAdded = heads * d;
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const W = 880, H = 340;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdm-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "Multi-head attention as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "width & heads"));
      const xIn = 22, xBus = 72;
      const S0 = {
        rows: [104, 175, 246],
        yM: 175,
        xL: 140,
        wL: 56,
        xAttn: 392,
        wAttn: 200,
        xEnd: 628,
        xBar: 640,
        wBar: 216
      };
      const S1 = {
        rows: [104, 170, 262],
        yEl: 224,
        yM: 183,
        xHead: 248,
        wHead: 214,
        xSlice: 486,
        xHex: 600,
        xLo: 720,
        xOut: 845
      };
      const size = (p, x, y, s) => G.text(p, x, y, s, "ncdm-size");
      function setLedger(step) {
        const on = (k) => step > k ? "on" : step === k ? "new" : "off";
        const rows = [
          { k: `m \xB7 ${L("lgWidth", "model width")}`, v: String(d), state: "on" },
          { k: `h \xB7 ${L("lgHeads", "heads")}`, v: String(heads), state: "on" },
          { k: "d_head = m/h", v: String(dHead), state: on(0) },
          { k: L("lgPerHead", "per head"), v: `n\xD7${dHead}`, state: on(0) }
        ];
        if (step >= 1) rows.push({ k: `\xD7 h ${L("lgCopies", "copies")}`, v: `${heads} \xD7 (n\xD7${dHead})`, state: on(1) });
        if (step >= 2) {
          rows.push({ k: L("lgAfterCat", "after concat"), v: `n\xD7${d}`, state: "new", tone: "good" });
          rows.push({ k: "h \xB7 d_head", v: `${heads}\xB7${dHead} = ${d}`, state: "new", tone: "good" });
          rows.push({ k: L("lgIfAdded", "if heads ADDED width"), v: `h\xB7m = ${ifAdded}`, state: "new", tone: "cost" });
        }
        const notes = [
          L("lgN0", `A head does not get its own m. It gets m/h = ${dHead} \u2014 one twelfth of the width.`),
          L("lgN1", `h heads are not h models: the SAME ${d} dims, cut into ${heads} strips of ${dHead}.`),
          L("lgN2", `Concat is the inverse of the split: ${heads}\xB7${dHead} = ${d} = m. Nothing was added \u2014 the width was folded, then unfolded.`)
        ];
        lg.set(rows, notes[Math.min(step, 2)]);
      }
      let main = null, prev = -1;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const fresh = (k) => k > prev && k <= step ? "ncd-fx" : "";
        setLedger(step);
        if (step === 0) {
          const g = el("g", { class: fresh(0) }, main);
          const { rows: rows2, yM: yM2, xL, wL, xAttn, wAttn, xEnd, xBar, wBar } = S0;
          el("rect", { class: "ncdm-back", x: 104, y: 70, width: 500, height: 218, rx: 12 }, g);
          G.text(g, 112, 64, L("lblOneHead", "one head"), "ncdm-back-txt", "start");
          G.tagBox(
            g,
            430,
            48,
            `d_head = m/h = ${d}/${heads} = ${dHead}`,
            "ncdm-callout",
            "ncdm-callout-txt",
            13,
            7
          ).setAttribute("rx", 7);
          G.text(g, xIn - 4, yM2 - 14, L("lblIn", "x  (n\xD7m)"), "ncdm-axis ncdm-axis-in", "start");
          G.wire(g, "ncdm-w ncdm-w-in", xIn, yM2, xBus, yM2);
          G.wire(g, "ncdm-w ncdm-w-in", xBus, rows2[0], xBus, rows2[2]);
          ["Lq", "Lk", "Lv"].forEach((nm, i) => {
            const y = rows2[i];
            G.wire(g, "ncdm-w ncdm-w-in", xBus, y, xL - wL / 2, y);
            G.chippedL(g, xL, y, nm, "ncdm-L", "ncdm-L-txt", wL, 44);
            G.wire(g, "ncdm-w ncdm-w-attn", xL + wL / 2, y, 252, y);
            size(g, 210, y - 9, `${nm[1].toUpperCase()} \xB7 n\xD7${dHead}`);
            el("path", {
              class: "ncdm-w ncdm-w-attn",
              d: `M252,${y} C274,${y} 272,${yM2} ${xAttn - wAttn / 2},${yM2}`
            }, g);
          });
          G.box(
            g,
            xAttn,
            yM2,
            wAttn,
            64,
            L("lblAttn", "attention"),
            "softmax(QK\u1D40/\u221Ad\u2096)\xB7V",
            "ncdm-attn",
            "ncdm-attn-txt",
            "ncdm-sub"
          );
          G.wire(g, "ncdm-w ncdm-w-slice", xAttn + wAttn / 2, yM2, xEnd, yM2, { arrow: true });
          G.text(g, 540, 163, L("lblHeadOut", "head output"), "ncdm-axis ncdm-axis-slice");
          size(g, 540, 196, `n\xD7${dHead}`);
          const cw = wBar / heads, yBar = yM2 - 13;
          for (let i = 0; i < heads; i++) {
            el("rect", {
              class: "ncdm-strip" + (i === 0 ? " is-mine" : ""),
              x: xBar + i * cw,
              y: yBar,
              width: cw,
              height: 26
            }, g);
          }
          size(g, xBar + wBar / 2, yBar - 12, `m = ${d} = ${heads} \xD7 ${dHead}`);
          G.text(
            g,
            xBar + wBar / 2,
            yBar + 42,
            L("lblOneOf", `one head = 1 strip of ${heads}`),
            "ncdm-axis ncdm-axis-slice"
          );
          G.legend(g, W / 2, H - 8, L("legMap", "wire = axis \xB7 \u25AD = learned projection \xB7 box = operation"), "ncdm-legend", W - 40);
          prev = step;
          return;
        }
        const { rows, yEl, yM, xHead, wHead, xSlice, xHex, xLo, xOut } = S1;
        const gH = el("g", { class: fresh(1) }, main);
        G.region(
          gH,
          106,
          64,
          404,
          232,
          `h = ${heads} \u2014 ${L("tagHeads", "the same circuit, copied")}`,
          "ncdm-region",
          "ncdm-region-tag",
          "ncdm-region-txt"
        );
        G.text(gH, xIn - 4, yM - 14, L("lblIn", "x  (n\xD7m)"), "ncdm-axis ncdm-axis-in", "start");
        G.wire(gH, "ncdm-w ncdm-w-in", xIn, yM, xBus, yM);
        G.wire(gH, "ncdm-w ncdm-w-in", xBus, rows[0], xBus, rows[2]);
        const headNo = [1, 2, heads];
        rows.forEach((y, i) => {
          G.wire(gH, "ncdm-w ncdm-w-in", xBus, y, xHead - wHead / 2, y);
          G.box(
            gH,
            xHead,
            y,
            wHead,
            48,
            `${L("lblHead", "head")} ${headNo[i]}`,
            "Lq Lk Lv \xB7 \u03C3",
            "ncdm-attn",
            "ncdm-attn-txt",
            "ncdm-sub"
          );
          G.wire(gH, "ncdm-w ncdm-w-slice", xHead + wHead / 2, y, xSlice, y, { arrow: step === 1 });
          size(gH, 420, y - 10, `n\xD7${dHead}`);
        });
        G.text(gH, xHead, yEl, "\u22EE", "ncdm-dots");
        G.text(gH, xHead + 70, yEl + 3, `\xD7 h = ${heads}`, "ncdm-dots-lbl");
        G.text(gH, 420, yEl, "\u22EE", "ncdm-dots");
        if (step === 1) G.text(gH, 690, yM - 4, L("askBack", "h slices \u2014 now put the axis back"), "ncdm-hook");
        if (step >= 2) {
          const gC = el("g", { class: fresh(2) }, main);
          rows.forEach((y) => {
            el("path", {
              class: "ncdm-w ncdm-w-slice",
              d: `M${xSlice},${y} C${xSlice + 34},${y} ${xHex - 78},${yM} ${xHex - 45},${yM}`
            }, gC);
          });
          el("path", {
            class: "ncdm-w ncdm-w-ghost",
            d: `M445,${yEl} C505,${yEl} ${xHex - 80},${yM + 3} ${xHex - 45},${yM}`
          }, gC);
          G.hexagon(gC, xHex, yM, L("lblConcat", "concat"), "ncdm-hex", "ncdm-hex-txt", 52, 32);
          G.tagBox(
            gC,
            xHex,
            yM + 57,
            `${heads} \xD7 ${dHead} = ${d} = m`,
            "ncdm-eq",
            "ncdm-eq-txt",
            12,
            7
          ).setAttribute("rx", 7);
          G.wire(gC, "ncdm-w ncdm-w-cat", xHex + 45, yM, xLo - 28, yM);
          size(gC, 668, yM - 12, `n\xD7${d}`);
          G.chippedL(gC, xLo, yM, "Lo", "ncdm-L", "ncdm-L-txt", 56, 44);
          size(gC, xLo, yM - 35, "m \u2192 m");
          G.wire(gC, "ncdm-w ncdm-w-out", xLo + 28, yM, xOut, yM, { arrow: true });
          G.text(gC, 800, yM - 12, `${L("lblOut", "out")} \xB7 n\xD7m`, "ncdm-axis ncdm-axis-out");
        }
        G.text(main, W / 2, H - 8, step >= 2 ? L("legCat", "\u2B21 = concat: a reindex, not a computation \xB7 \u25AD = learned projection \xB7 dashed = the head axis h") : L("legHeads", "each head box is the circuit above, copied \u2014 same recipe, its own weights"), "ncdm-legend");
        prev = step;
      };
    }
  });
})();
