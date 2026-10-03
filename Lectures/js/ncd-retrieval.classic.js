/* AUTO-GENERATED offline classic bundle of widgets/ncd-retrieval/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ncd-retrieval/logic.js
  var mountNcdRetrieval = defineWidget({
    id: "ncd-retrieval",
    rootClass: "ncdr-root",
    exportName: "mountNcdRetrieval",
    maxStep: 2,
    render({ host, data, labels, el }) {
      const L = (k, fb) => labels && labels[k] || fb;
      const G = glyphs(el);
      const MM = data && data.msmarco || {};
      const bm25 = MM.BM25 != null ? MM.BM25 : 0.187;
      const ance = MM.denseANCE != null ? MM.denseANCE : 0.33;
      const colb = MM.ColBERT != null ? MM.ColBERT : 0.36;
      const W = 820, H = 366;
      const wrap = stage(host);
      const svg = el("svg", {
        class: "ncdr-svg",
        viewBox: `0 0 ${W} ${H}`,
        role: "img",
        "aria-label": L("alt", "Retrieval as a neural circuit diagram")
      }, wrap);
      const lg = ledger(wrap, L("lgTitle", "cost & quality"));
      const DOCS = ["doc1", "doc2", "doc3", "doc4"];
      const SCORES = { 0: [0.72, 0.15, 0.42, 0.6], 1: [0.94, 0.08, 0.34, 0.82], 2: [0.87, 0.13, 0.38, 0.74] };
      const TOPK = 2;
      const line = (cls, x1, y1, x2, y2, p) => el("line", { class: "ncdr-w " + cls, x1, y1, x2, y2 }, p);
      const text = (x, y, s, cls, anchor = "middle", p) => {
        const t = el("text", { x, y, class: cls, "text-anchor": anchor }, p);
        t.textContent = s;
        return t;
      };
      const rect = (cls, x, y, w, h, rx, p) => el("rect", { class: cls, x, y, width: w, height: h, rx }, p);
      function enc(cx, cy, w, h, p) {
        const c = 10, x = cx - w / 2, y = cy - h / 2;
        el("path", { class: "ncdr-enc", d: `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z` }, p);
        text(cx, cy + 4, "L enc", "ncdr-enc-txt", "middle", p);
      }
      function cup(cx, cy, p) {
        el("path", { class: "ncdr-op", d: `M${cx - 11},${cy - 9} Q${cx},${cy + 13} ${cx + 11},${cy - 9}` }, p);
        el("circle", { class: "ncdr-op-dot", cx, cy: cy + 5, r: 2.2 }, p);
      }
      function vec(x, y, cls, p, n = 6) {
        for (let i = 0; i < n; i++) rect(cls, x + i * 8, y, 6, 12, 1, p);
      }
      function vecGrid(x, y, cls, p, rows = 3, cols = 6) {
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rect(cls, x + c * 8, y + r * 7, 6, 5, 1, p);
      }
      function scoreBar(x, cy, w, frac, top, p) {
        rect("ncdr-track", x, cy - 8, w, 16, 4, p);
        rect(top ? "ncdr-fill-top" : "ncdr-fill", x + 1.5, cy - 6.5, Math.max(2, (w - 3) * frac), 13, 3, p);
        if (top) text(x + w + 16, cy + 4, "\u2713", "ncdr-check", "middle", p);
      }
      const YES = L("lgYes", "yes"), NO = L("lgNo", "no"), MRR = L("lgMrr", "MRR@10 \xB7 MS MARCO");
      const kEnc = L("lgEnc", "encoder passes / query"), kPre = L("lgPre", "corpus precomputable");
      const kPer = L("lgPer", "work per document");
      const LEDGER = [
        {
          rows: [
            { k: kEnc, v: "1", tone: "good" },
            { k: kPre, v: YES, tone: "good" },
            { k: kPer, v: L("lgPerBi", "q\xB7d\u1D62  (d mults)") },
            { k: MRR, v: String(ance) },
            { k: "BM25", v: String(bm25) }
          ],
          note: L("lgN0", "One encoder pass, on the query. The document vectors were computed offline, so nothing in the corpus is touched at query time \u2014 this is why a bi-encoder scales to billions.")
        },
        {
          rows: [
            { k: kEnc, v: "N", tone: "cost" },
            { k: kPre, v: NO, tone: "cost" },
            { k: kPer, v: L("lgPerCross", "a full BERT pass"), tone: "cost" }
          ],
          note: L("lgN1", "Count the encoder boxes: there are N. The encoder reads query and document TOGETHER, so there is nothing to precompute. Best quality \u2014 and on a million-document corpus, a million BERT passes per query. That is why it only ever runs as a reranker.")
        },
        {
          rows: [
            { k: kEnc, v: "1", tone: "good" },
            { k: kPre, v: L("lgPreTok", "yes, per token"), tone: "good" },
            { k: kPer, v: "MaxSim  (nq\xD7nd)" },
            { k: MRR, v: String(colb), tone: "good" },
            { k: "BM25", v: String(bm25) }
          ],
          note: L("lgN2", "One pass on the query, like the bi-encoder \u2014 but the contraction is LATE: MaxSim compares token to token. You pay in storage (a vector per document token) and you get 0.36, above ANCE in the cited MS MARCO comparison.")
        }
      ];
      let main = null;
      return (step) => {
        if (main) main.remove();
        main = el("g", { class: "ncd-fx" }, svg);
        const LG = LEDGER[Math.max(0, Math.min(2, step))];
        lg.set(LG.rows.map((r) => ({ ...r, state: "on" })), LG.note);
        const g = main, S = SCORES[Math.max(0, Math.min(2, step))];
        const sorted = [...S].sort((a, b) => b - a);
        const cutoff = sorted[TOPK - 1];
        const isCross = step === 1;
        text(24, 26, L("lblQuery", "query"), "ncdr-qlbl", "start", g);
        rect("ncdr-qchip", 24, 30, 226, 28, 8, g);
        text(137, 48, "\u201C" + L("query", "neural nets for search") + "\u201D", "ncdr-qchip-txt", "middle", g);
        const opX = 344;
        const rowsY = stack({ x: 44, y: 98, w: 732, h: 212 }, 4, { dir: "col", gap: 8 }).map((r) => r.y + r.h / 2);
        if (!isCross) {
          line("ncdr-w-q", 250, 44, 292, 44, g);
          enc(318, 44, 52, 30, g);
          if (step === 2) vecGrid(360, 30, "ncdr-vec-q", g);
          else vec(360, 38, "ncdr-vec-q", g);
        } else {
          line("ncdr-w-q", 250, 44, 404, 44, g);
          text(432, 47, L("noPre", "nothing to pre-compute"), "ncdr-nopre", "start", g);
        }
        const qfX = step === 0 ? opX + 14 : opX + 33;
        const qfDy = step === 0 ? 12 : 8;
        rowsY.forEach((cy) => line("ncdr-w-qf", 412, 50, qfX, cy - qfDy, g));
        rect("ncdr-Nregion", 30, 76, 760, 244, 14, g);
        const tag = L("lblCorpus", "N \xB7 corpus (4 docs)");
        G.tagBox(g, 54, 79, tag, "ncdr-Ntag", "ncdr-Ntag-txt", 9, 5, "start");
        text(538, 92, L("lblScore", "score"), "ncdr-scorelbl", "middle", g);
        text(690, 92, L("lblTopk", "top-k"), "ncdr-scorelbl", "middle", g);
        const rows = stack({ x: 44, y: 98, w: 732, h: 212 }, 4, { dir: "col", gap: 8 });
        DOCS.forEach((key, i) => {
          const cy = rows[i].y + rows[i].h / 2, sc = S[i], top = sc >= cutoff - 1e-9;
          rect(top ? "ncdr-card ncdr-card-hot" : "ncdr-card", 44, cy - 22, 224, 44, 8, g);
          text(54, cy - 6, "d" + (i + 1), "ncdr-doc-id", "start", g);
          text(78, cy - 5, L(key, key), "ncdr-doc-txt", "start", g);
          if (isCross) {
            text(78, cy + 13, "q \u2295 d" + (i + 1), "ncdr-pre", "start", g);
            rect("ncdr-void", 156, cy + 2, 46, 14, 3, g);
          } else {
            text(78, cy + 14, L("lblPre", "pre-encoded"), "ncdr-pre", "start", g);
            if (step === 2) vecGrid(156, cy + 1, "ncdr-vec", g);
            else vec(156, cy + 3, "ncdr-vec", g);
          }
          line("ncdr-w-q", 270, cy, opX - 36, cy, g);
          if (step === 0) {
            cup(opX, cy, g);
            text(opX - 44, cy - 16, L("opBi", "q\xB7d\u1D62"), "ncdr-mbox-txt", "middle", g);
          } else if (step === 1) {
            enc(opX, cy, 66, 34, g);
          } else {
            rect("ncdr-mbox", opX - 33, cy - 15, 66, 30, 6, g);
            text(opX, cy + 4, L("opCol", "MaxSim"), "ncdr-mbox-txt", "middle", g);
          }
          line("ncdr-w-N", opX + 36, cy, 430, cy, g);
          scoreBar(438, cy, 232, sc, top, g);
        });
        const rtag = [L("tagBi", ""), L("tagCross", ""), L("tagCol", "")][step];
        text(784, 306, rtag, "ncdr-Ntag-txt", "end", g);
        const cost = [L("costBi", ""), L("costCross", ""), L("costCol", "")][step];
        text(opX, 340, cost, "ncdr-cost", "middle", g);
        text(W / 2, 358, L("legMap", "document \xB7 operation per document \xB7 score \xB7 top-k"), "ncdr-legend", "middle", g);
      };
    }
  });
})();
