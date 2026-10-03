/* AUTO-GENERATED offline classic bundle of widgets/ncd-chain/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function shapeTable(obj) {
    const t = Object.freeze({ ...obj });
    return new Proxy(t, {
      get(target, k) {
        if (typeof k === "symbol" || k in target) return target[k];
        throw new Error(`shapeTable: no axis named "${String(k)}" \u2014 declared: ${Object.keys(target).join(", ")}`);
      }
    });
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

  // widgets/ncd-chain/logic.js
  var W = 880;
  var H = 380;
  var Y_MID = 128;
  var CW = 48;
  var CH = 22;
  var GX = 3;
  var GY = 3;
  var WX = 88;
  var WY = 256;
  var WW = 704;
  var mw = (cols) => cols * CW + (cols - 1) * GX;
  var mh = (rows) => rows * CH + (rows - 1) * GY;
  var mountNcdChain = defineWidget({
    id: "ncd-chain",
    rootClass: "ncdch-root",
    exportName: "mountNcdChain",
    maxStep: 9,
    render({ host, data, labels, el }) {
      const D = data || {};
      const Q = D.query || {};
      const vocab = D.vocab || [];
      const words = Q.words || [];
      const ids = Q.ids || [];
      const docs = D.docs || [];
      const rank = D.rank || [0, 1];
      const dim = D.d != null ? D.d : 4;
      const dk = D.dk != null ? D.dk : 4;
      const sqrtDk = D.sqrtDk != null ? D.sqrtDk : 2;
      const n = words.length || 3;
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const F = G.fmt3;
      const T = (v) => v < 0 ? `(${F(v)})` : F(v);
      const sumM = (Q.rowSum || []).map((v) => [v]);
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdch-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "One sentence carried from token id to document rank")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "the shape as it flows"));
      const text = (x, y, s, cls, anchor, p) => G.text(p, x, y, s, cls, anchor || "middle");
      const line = (cls, x1, y1, x2, y2, p, arrow) => G.wire(p, "ncdch-w " + cls, x1, y1, x2, y2, arrow ? { arrow: 1 } : {});
      const path = (cls, dd, p) => el("path", { class: "ncdch-w " + cls, d: dd }, p);
      const cup = (cx, cy, p) => G.cup(p, cx, cy, "ncdch-op", "ncdch-op-dot");
      const tri = (cx, cy, p) => G.tri(p, cx, cy, "ncdch-sm", "ncdch-sm-txt");
      const hex = (cx, cy, lab, p) => G.hexagon(p, cx, cy, lab, "ncdch-hex", "ncdch-hex-txt", 34, 20);
      const chip = (cx, cy, w, val, cls, vcls, p) => G.chips(p, [cx], cy, [val], "ncdch-chip " + cls, "ncdch-chipv " + vcls, w, (v) => String(v));
      function opBox(cx, cy, w, h, lab, sub, p) {
        el("rect", { class: "ncdch-box", x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 6 }, p);
        text(cx, cy + (sub ? -2 : 5), lab, "ncdch-box-lbl", "middle", p);
        if (sub) text(cx, cy + 13, sub, "ncdch-box-sub", "middle", p);
      }
      function matrix(x, y, M, opt, p) {
        const g = el("g", {}, p);
        const o = opt || {};
        if (o.title) text(x, y - 9, o.shape ? `${o.title}  ${o.shape}` : o.title, "ncdch-mt " + (o.tcls || ""), "start", g);
        M.forEach((row, r) => row.forEach((v, c) => {
          const cx = x + c * (CW + GX), cy = y + r * (CH + GY);
          const t = o.hi ? o.hi(r, c) : null;
          const off = o.off && o.off(r, c);
          el("rect", {
            class: `ncdch-cell ${off ? "ncdch-c-off" : o.cls || "ncdch-c-neu"}${t ? " ncdch-hl ncdch-hl-" + t : ""}`,
            x: cx,
            y: cy,
            width: CW,
            height: CH,
            rx: 4
          }, g);
          text(
            cx + CW / 2,
            cy + CH / 2 + 4,
            F(v),
            `ncdch-v ${off ? "ncdch-v-off" : o.vcls || ""}${t ? " ncdch-hv-" + t : ""}`,
            "middle",
            g
          );
        }));
        if (o.rowLabels) M.forEach((_, r) => text(x - 8, y + r * (CH + GY) + CH / 2 + 4, o.rowLabels[r], "ncdch-rl", "end", g));
        if (o.rowLabelsR) M.forEach((_, r) => text(x + mw(M[0].length) + 8, y + r * (CH + GY) + CH / 2 + 4, o.rowLabelsR[r], "ncdch-rl", "start", g));
        return g;
      }
      const XMLNS = "http://www.w3.org/XML/1998/namespace";
      function worked(head, eqs, note, p) {
        const g = el("g", {}, p);
        const h = 30 + 21 * eqs.length + (note ? 20 : 0);
        el("rect", { class: "ncdch-work", x: WX, y: WY, width: WW, height: h, rx: 8 }, g);
        let y = WY + 20;
        text(WX + 14, y, head, "ncdch-work-head", "start", g);
        eqs.forEach((e) => {
          y += 21;
          text(WX + 14, y, e, "ncdch-eq", "start", g).setAttributeNS(XMLNS, "xml:space", "preserve");
        });
        if (note) {
          y += 20;
          text(WX + 14, y, note, "ncdch-work-note", "start", g);
        }
        return g;
      }
      const shapes = () => shapeTable({
        ids: `${n} ${L("uTokens", "tokens")}`,
        emb: `${n}\xD7${dim}`,
        x: `${n}\xD7${dim}`,
        qkv: `${n}\xD7${dim}`,
        scores: `${n}\xD7${n}`,
        scaled: `${n}\xD7${n}`,
        weights: `${n}\xD7${n}`,
        ctx: `${n}\xD7${dim}`,
        pooled: `${dim}`,
        rank: `1 ${L("uRank", "rank")}`
      });
      const LKEY = ["ids", "emb", "x", "qkv", "scores", "scaled", "weights", "ctx", "pooled", "rank"];
      const LFB = ["ids", "E[ids]", "+ PE", "\xB7 Wq / Wk / Wv", "Q\xB7K\u1D40", "\xF7 \u221Ad\u2096", "softmax", "\xB7 V", "mean-pool", "q\xB7d\u1D62 \u2192 rank"];
      function setLedger(step, SH) {
        lg.setTitle(L("lgTitle", "the shape as it flows"));
        lg.set(LKEY.map((k, i) => ({
          k: L("lgK" + i, LFB[i]),
          v: SH[k],
          state: step > i ? "on" : step === i ? "new" : "off",
          tone: i === 8 ? "good" : void 0
          // mean-pool: the contraction that kills the axis n
        })), L("lgN" + step, ""));
      }
      let main = null;
      return (step) => {
        if (main) main.remove();
        main = el("g", {}, svg);
        const SH = shapes();
        setLedger(step, SH);
        const g = el("g", { class: "ncd-fx" }, main);
        for (let i = 0; i <= 9; i++) {
          el("rect", {
            class: "ncdch-tick" + (i === step ? " is-now" : i < step ? " is-done" : ""),
            x: 20 + i * 20,
            y: 14,
            width: 14,
            height: 9,
            rx: 2
          }, main);
        }
        text(238, 24, `${step} \xB7 ${L("op" + step, "")}`, "ncdch-op-head", "start", main);
        text(W - 14, 24, `\xAB${words.join(" ")}\xBB`, "ncdch-sent", "end", main);
        text(W / 2, H - 8, L("legMap", "one sentence \xB7 every number survives the arrow"), "ncdch-stage", "middle", main);
        if (step === 0) {
          const vx = 160, vy = Y_MID - mh(vocab.length) / 2;
          text(vx, vy - 9, L("lblVocab", "vocabulary"), "ncdch-mt ncdch-mt-tok", "start", g);
          vocab.forEach((w, i) => {
            const y = vy + i * (CH + GY), used = ids.indexOf(i) >= 0;
            el("rect", { class: "ncdch-cell " + (used ? "ncdch-c-tok" : "ncdch-c-off"), x: vx, y, width: 34, height: CH, rx: 4 }, g);
            text(vx + 17, y + 15, String(i), "ncdch-v " + (used ? "ncdch-v-tok" : "ncdch-v-off"), "middle", g);
            el("rect", { class: "ncdch-cell " + (used ? "ncdch-c-tok" : "ncdch-c-off"), x: vx + 37, y, width: 76, height: CH, rx: 4 }, g);
            text(vx + 75, y + 15, w, "ncdch-v " + (used ? "ncdch-v-tok" : "ncdch-v-off"), "middle", g);
          });
          hex(400, Y_MID, "ids", g);
          const qx = 540, qy = Y_MID - mh(n) / 2;
          text(qx, qy - 9, `${L("lblQuery", "the query")}  ${SH.ids}`, "ncdch-mt ncdch-mt-tok", "start", g);
          words.forEach((w, i) => {
            const y = qy + i * (CH + GY);
            el("rect", { class: "ncdch-cell ncdch-c-tok", x: qx, y, width: 76, height: CH, rx: 4 }, g);
            text(qx + 38, y + 15, w, "ncdch-v ncdch-v-tok", "middle", g);
            el("rect", { class: "ncdch-cell ncdch-c-tok ncdch-hl ncdch-hl-a", x: qx + 79, y, width: 34, height: CH, rx: 4 }, g);
            text(qx + 96, y + 15, String(ids[i]), "ncdch-v ncdch-hv-a", "middle", g);
            path("ncdch-w-tok", `M${vx + 113},${vy + ids[i] * (CH + GY) + 11} C${vx + 160},${vy + ids[i] * (CH + GY) + 11} ${330},${Y_MID} ${366},${Y_MID}`, g);
            path("ncdch-w-tok", `M${434},${Y_MID} C${470},${Y_MID} ${500},${y + 11} ${qx - 6},${y + 11}`, g);
          });
          worked(
            L("w0", "a lookup is not a computation"),
            [words.map((w, i) => `${w} \u2192 ${ids[i]}`).join("      ")],
            L("n0", "The row index is an address, not a meaning. Nothing is multiplied here."),
            g
          );
        }
        if (step === 1) {
          const ex = 154, ey = Y_MID - mh(vocab.length) / 2;
          matrix(ex, ey, D.E || [], {
            title: "E",
            shape: `${vocab.length}\xD7${dim}`,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok",
            rowLabels: vocab,
            off: (r) => ids.indexOf(r) < 0
          }, g);
          hex(440, Y_MID, "E[ids]", g);
          const bx = 525, by = Y_MID - mh(n) / 2;
          matrix(bx, by, Q.emb || [], {
            title: "emb",
            shape: SH.emb,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok",
            rowLabelsR: words,
            hi: (r) => r === 1 ? "a" : null
          }, g);
          ids.forEach((id, i) => {
            path("ncdch-w-tok", `M${ex + mw(dim) + 4},${ey + id * (CH + GY) + 11} C${ex + 240},${ey + id * (CH + GY) + 11} ${370},${Y_MID} ${406},${Y_MID}`, g);
            path("ncdch-w-tok", `M${474},${Y_MID} C${500},${Y_MID} ${500},${by + i * (CH + GY) + 11} ${bx - 6},${by + i * (CH + GY) + 11}`, g);
          });
          worked(
            L("w1", "the row IS the embedding \u2014 copied, not computed"),
            [`E[${ids[1]}] \xAB${words[1]}\xBB = (${(D.E[ids[1]] || []).map(F).join(", ")})   \u2192   emb[1] = (${(Q.emb[1] || []).map(F).join(", ")})`],
            L("n1", "A lookup moves a row; it does not change it. The address carries no meaning of its own."),
            g
          );
        }
        if (step === 2) {
          const y = Y_MID - mh(n) / 2;
          matrix(70, y, Q.emb || [], {
            title: "emb",
            shape: SH.emb,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok",
            rowLabels: words,
            hi: (r, c) => r === 1 && c === 1 ? "w" : null
          }, g);
          line("ncdch-w-tok", 271 + 4, Y_MID, 292 - 6, Y_MID, g);
          opBox(309, Y_MID, 34, 34, "+", null, g);
          line("ncdch-w-tok", 326 + 6, Y_MID, 345 - 4, Y_MID, g);
          matrix(345, y, Q.pe || [], {
            title: "PE",
            shape: `${n}\xD7${dim}`,
            cls: "ncdch-c-neu",
            hi: (r, c) => r === 1 && c === 1 ? "w" : null
          }, g);
          line("ncdch-w-tok", 546 + 4, Y_MID, 567 - 6, Y_MID, g);
          opBox(584, Y_MID, 34, 34, "=", null, g);
          line("ncdch-w-tok", 601 + 6, Y_MID, 620 - 4, Y_MID, g, true);
          matrix(620, y, Q.x || [], {
            title: "x",
            shape: SH.x,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok",
            hi: (r, c) => r === 1 && c === 1 ? "w" : null
          }, g);
          worked(
            L("w2", "one element, one addition"),
            [`x[1][1] = emb[1][1] + PE[1][1] = ${F(Q.emb[1][1])} + ${F(Q.pe[1][1])} = ${F(Q.x[1][1])}`],
            L("n2", "Position is ADDED into the vector, not concatenated beside it: the shape does not grow."),
            g
          );
        }
        if (step === 3) {
          const y = Y_MID - mh(n) / 2;
          const R3 = 2, C3 = 1;
          matrix(70, y, Q.x || [], {
            title: "x",
            shape: SH.x,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok",
            rowLabels: words,
            hi: (r) => r === R3 ? "w" : null
          }, g);
          line("ncdch-w-tok", 275, Y_MID, 286, Y_MID, g);
          opBox(309, Y_MID, 34, 34, "\xB7", null, g);
          line("ncdch-w-d", 332, Y_MID, 341, Y_MID, g);
          matrix(345, Y_MID - mh(dim) / 2, D.Wq || [], {
            title: "Wq",
            shape: `${dim}\xD7${dim}`,
            tcls: "ncdch-mt-proj",
            cls: "ncdch-c-proj",
            vcls: "ncdch-v-proj",
            hi: (r, c) => c === C3 ? "w" : null
          }, g);
          line("ncdch-w-d", 550, Y_MID, 561, Y_MID, g);
          opBox(584, Y_MID, 34, 34, "=", null, g);
          line("ncdch-w-tok", 607, Y_MID, 616, Y_MID, g, true);
          matrix(620, y, Q.Q || [], {
            title: "Q",
            shape: SH.qkv,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok",
            hi: (r, c) => r === R3 && c === C3 ? "g" : null
          }, g);
          worked(
            L("w3", "ugly weights, clean result: one dot product = one element of Q"),
            [`Q[${R3}][${C3}] = ${(Q.x[R3] || []).map((v, j) => `${T(v)}\xB7${T(D.Wq[j][C3])}`).join(" + ")} = ${F(Q.Q[R3][C3])}`],
            L("n3", "K = x\xB7Wk and V = x\xB7Wv come from the SAME x \u2014 three views of one input."),
            g
          );
        }
        if (step === 4) {
          matrix(167, 56, Q.Q || [], {
            title: "Q",
            shape: SH.qkv,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok",
            rowLabels: words,
            hi: (r) => r === 0 ? "w" : null
          }, g);
          matrix(167, 156, Q.K || [], {
            title: "K",
            shape: SH.qkv,
            tcls: "ncdch-mt-proj",
            cls: "ncdch-c-proj",
            vcls: "ncdch-v-proj",
            rowLabels: words,
            hi: (r) => r === 0 ? "w" : null
          }, g);
          path("ncdch-w-tok", `M${372},${92} C${420},${92} ${449},${110} ${449},${130}`, g);
          path("ncdch-w-d", `M${372},${192} C${420},${192} ${449},${172} ${449},${154}`, g);
          cup(463, 142, g);
          text(463, 116, "Q\xB7K\u1D40", "ncdch-glyph-lbl", "middle", g);
          line("ncdch-w-attn", 480, 142, 557, 142, g, true);
          matrix(563, 106, Q.scores || [], {
            title: L("lblScores", "scores"),
            shape: SH.scores,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-attn",
            vcls: "ncdch-v-attn",
            hi: (r, c) => r === 0 && c === 0 ? "g" : null
          }, g);
          text(463, 208, L("lblDdies", "the axis d dies here"), "ncdch-size", "middle", g);
          worked(
            L("w4", "the multiply\u2013accumulate: a whole row and a whole column collapse into ONE number"),
            [
              `Q[0] = (${(Q.Q[0] || []).map(F).join(", ")})      K[0] = (${(Q.K[0] || []).map(F).join(", ")})`,
              `Q[0]\xB7K[0] = ${(Q.Q[0] || []).map((v, j) => `${F(v)}\xB7${F(Q.K[0][j])}`).join(" + ")} = ${F(Q.scores[0][0])} = ${L("lblScores", "scores")}[0][0]`
            ],
            L("n4", "Multiply term by term, then add. Every cell of the score matrix is one of these \u2014 that is what a cup MEANS."),
            g
          );
        }
        if (step === 5) {
          const y = Y_MID - mh(n) / 2;
          matrix(205, y, Q.scores || [], {
            title: L("lblScores", "scores"),
            shape: SH.scores,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-attn",
            vcls: "ncdch-v-attn",
            hi: (r, c) => r === 0 && c === 0 ? "w" : null
          }, g);
          line("ncdch-w-attn", 359, Y_MID, 406, Y_MID, g);
          opBox(440, Y_MID, 62, 44, "\xF7\u221Ad\u2096", `\u221A${dk} = ${F(sqrtDk)}`, g);
          line("ncdch-w-attn", 474, Y_MID, 521, Y_MID, g, true);
          matrix(525, y, Q.scaled || [], {
            title: L("lblScaled", "scaled"),
            shape: SH.scaled,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-attn",
            vcls: "ncdch-v-attn",
            hi: (r, c) => r === 0 && c === 0 ? "g" : null
          }, g);
          worked(
            L("w5", "one element, divided"),
            [`${L("lblScaled", "scaled")}[0][0] = ${L("lblScores", "scores")}[0][0] \xF7 \u221Ad\u2096 = ${F(Q.scores[0][0])} \xF7 ${F(sqrtDk)} = ${F(Q.scaled[0][0])}`],
            L("n5", "Every cell is divided by the same \u221Ad\u2096. A divide changes no shape at all \u2014 only the size of the numbers."),
            g
          );
        }
        if (step === 6) {
          const y = Y_MID - mh(n) / 2;
          matrix(80, y, Q.scaled || [], {
            title: L("lblScaled", "scaled"),
            shape: SH.scaled,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-attn",
            vcls: "ncdch-v-attn",
            hi: (r, c) => r === 0 && c === 0 ? "w" : null
          }, g);
          line("ncdch-w-attn", 234, Y_MID, 246, Y_MID, g);
          tri(265, Y_MID, g);
          line("ncdch-w-attn", 285, Y_MID, 304, Y_MID, g);
          matrix(310, y, Q.exp || [], {
            title: "exp",
            shape: SH.weights,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-attn",
            vcls: "ncdch-v-attn",
            hi: (r, c) => r === 0 && c === 0 ? "w" : null
          }, g);
          matrix(470, y, sumM, {
            title: "\u03A3",
            shape: `${n}`,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-neu",
            hi: (r) => r === 0 ? "w" : null
          }, g);
          line("ncdch-w-attn", 522, Y_MID, 539, Y_MID, g);
          opBox(560, Y_MID, 34, 34, "\xF7", null, g);
          line("ncdch-w-attn", 581, Y_MID, 596, Y_MID, g, true);
          matrix(600, y, Q.weights || [], {
            title: L("lblWeights", "attention"),
            shape: SH.weights,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-attn",
            vcls: "ncdch-v-attn",
            hi: (r, c) => r === 0 && c === 0 ? "g" : null
          }, g);
          worked(
            L("w6", "inside the triangle"),
            [
              `\u03A3[0] = ${(Q.exp[0] || []).map(F).join(" + ")} = ${F(Q.rowSum[0])}`,
              `${L("lblWeights", "attention")}[0][0] = exp[0][0] \xF7 \u03A3[0] = ${F(Q.exp[0][0])} \xF7 ${F(Q.rowSum[0])} = ${F(Q.weights[0][0])}`
            ],
            L("n6", "exp is taken on (scaled \u2212 row max); the shift cancels in the ratio. The shape is unchanged."),
            g
          );
        }
        if (step === 7) {
          const R7 = 2;
          matrix(167, 56, Q.weights || [], {
            title: L("lblWeights", "attention"),
            shape: SH.weights,
            tcls: "ncdch-mt-attn",
            cls: "ncdch-c-attn",
            vcls: "ncdch-v-attn",
            rowLabels: words,
            hi: (r) => r === R7 ? "w" : null
          }, g);
          matrix(167, 156, Q.V || [], {
            title: "V",
            shape: SH.qkv,
            tcls: "ncdch-mt-proj",
            cls: "ncdch-c-proj",
            vcls: "ncdch-v-proj",
            rowLabels: words,
            hi: (r, c) => c === 0 ? "c" : null
          }, g);
          path("ncdch-w-attn", `M${321},${92} C${400},${92} ${449},${110} ${449},${130}`, g);
          path("ncdch-w-d", `M${372},${192} C${420},${192} ${449},${172} ${449},${154}`, g);
          cup(463, 142, g);
          text(463, 116, "\xB7 V", "ncdch-glyph-lbl", "middle", g);
          line("ncdch-w-out", 480, 142, 557, 142, g, true);
          matrix(563, 106, Q.ctx || [], {
            title: "ctx",
            shape: SH.ctx,
            tcls: "ncdch-mt-out",
            cls: "ncdch-c-out",
            vcls: "ncdch-v-out",
            hi: (r, c) => r === R7 && c === 0 ? "g" : null
          }, g);
          text(463, 208, L("lblKdies", "the key axis dies here"), "ncdch-size", "middle", g);
          worked(
            L("w7", "one output element = a weighted sum down one column of V"),
            [`ctx[${R7}][0] = ${(Q.weights[R7] || []).map((w, i) => `${F(w)}\xB7${T(Q.V[i][0])}`).join(" + ")} = ${F(Q.ctx[R7][0])}`],
            L("n7", "Every output row is now a MIX of all the V rows \u2014 that is what the second cup buys you."),
            g
          );
        }
        if (step === 8) {
          const y = Y_MID - mh(n) / 2;
          matrix(150, y, Q.ctx || [], {
            title: "ctx",
            shape: SH.ctx,
            tcls: "ncdch-mt-out",
            cls: "ncdch-c-out",
            vcls: "ncdch-v-out",
            rowLabels: words,
            hi: (r, c) => c === 0 ? "w" : null
          }, g);
          (Q.ctx || []).forEach((_, r) => {
            const yy = y + r * (CH + GY) + 11;
            path("ncdch-w-out", `M${355},${yy} C${390},${yy} ${390},${Y_MID} ${415},${Y_MID}`, g);
          });
          opBox(460, Y_MID, 76, 44, "\u03A3/n", `n = ${n} \u2192 1`, g);
          line("ncdch-w-out", 498, Y_MID, 556, Y_MID, g, true);
          matrix(560, Y_MID - CH / 2, [Q.pooled || []], {
            title: L("lblPooled", "pooled"),
            shape: SH.pooled,
            tcls: "ncdch-mt-out",
            cls: "ncdch-c-out",
            vcls: "ncdch-v-out",
            hi: (r, c) => c === 0 ? "g" : null
          }, g);
          text(460, 196, L("lblNdies", "the axis n dies here"), "ncdch-size ncdch-size-hot", "middle", g);
          worked(
            L("w8", "the axis n dies here \u2014 and that is what makes a passage indexable"),
            [`${L("lblPooled", "pooled")}[0] = ( ${(Q.ctx || []).map((r) => F(r[0])).join(" + ")} ) \xF7 ${n} = ${F(Q.pooled[0])}`],
            L("n8", "Every token vector collapses into ONE point. A passage is now a single address in the index."),
            g
          );
        }
        if (step === 9) {
          matrix(60, 60, [Q.pooled || []], {
            title: `q \xAB${words.join(" ")}\xBB  ${SH.pooled}`,
            tcls: "ncdch-mt-tok",
            cls: "ncdch-c-tok",
            vcls: "ncdch-v-tok"
          }, g);
          el("rect", { class: "ncdch-region", x: 44, y: 96, width: 256, height: 126, rx: 12 }, g);
          text(52, 111, L("tagIndex", "the same encoder, run offline"), "ncdch-size ncdch-size-idx", "start", g);
          docs.forEach((doc, i) => {
            const gy = 138 + i * 48;
            matrix(60, gy, [doc.pooled || []], {
              title: `d${i + 1} \xAB${(doc.words || []).join(" ")}\xBB  ${SH.pooled}`,
              tcls: "ncdch-mt-idx",
              cls: "ncdch-c-idx",
              vcls: "ncdch-v-idx"
            }, g);
            line("ncdch-w-idx", 265, gy + 11, 364, gy + 11, g);
            cup(378, gy + 23, g);
            const win = rank[0] === i;
            line(win ? "ncdch-w-out" : "ncdch-w-idx", 393, gy + 29, 408, gy + 29, g);
            chip(
              450,
              gy + 29,
              76,
              F(doc.score),
              win ? "ncdch-chip-win" : "ncdch-chip-lose",
              win ? "ncdch-chipv-win" : "ncdch-chipv-lose",
              g
            );
            chip(
              556,
              gy + 29,
              68,
              F(doc.cos),
              win ? "ncdch-chip-win" : "ncdch-chip-lose",
              win ? "ncdch-chipv-win" : "ncdch-chipv-lose",
              g
            );
            chip(
              646,
              gy + 29,
              44,
              "#" + (rank.indexOf(i) + 1),
              win ? "ncdch-chip-win" : "ncdch-chip-lose",
              win ? "ncdch-chipv-win" : "ncdch-chipv-lose",
              g
            );
          });
          line("ncdch-w-tok", 265, 71, 392, 71, g);
          line("ncdch-w-tok", 392, 71, 392, 197, g);
          text(450, 130, "q\xB7d", "ncdch-glyph-lbl", "middle", g);
          text(556, 130, "cos", "ncdch-glyph-lbl", "middle", g);
          const d0 = docs[rank[0]] || {}, d1 = docs[rank[1]] || {};
          worked(
            L("w9", "one encoder, two ways to score it"),
            [
              `q\xB7d${rank[0] + 1} = ${(Q.pooled || []).map((v, j) => `${T(v)}\xB7${T(d0.pooled[j])}`).join(" + ")} \u2248 ${F(d0.score)}`,
              `q\xB7d${rank[1] + 1} = ${F(d1.score)}      cos d${rank[0] + 1} = ${F(d0.cos)}  ${L("uVs", "vs")}  cos d${rank[1] + 1} = ${F(d1.cos)}`
            ],
            L("n9", "Same order both ways \u2014 but a thin gap: nobody trained this encoder. Widening it IS contrastive learning."),
            g
          );
        }
      };
    }
  });
})();
