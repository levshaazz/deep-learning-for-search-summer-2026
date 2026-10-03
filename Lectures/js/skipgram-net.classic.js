/* AUTO-GENERATED offline classic bundle of widgets/skipgram-net/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function clampSegmentToRect(x1, y1, x2, y2, rect) {
    const xmin = rect.x, ymin = rect.y, xmax = rect.x + rect.w, ymax = rect.y + rect.h;
    const dx = x2 - x1, dy = y2 - y1;
    let t0 = 0, t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return null;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return null;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return null;
          if (t < t1) t1 = t;
        }
      }
    }
    return {
      x1: x1 + t0 * dx,
      y1: y1 + t0 * dy,
      x2: x1 + t1 * dx,
      y2: y1 + t1 * dy
    };
  }
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/skipgram-net/logic.js
  var mountSkipgramNet = defineWidget({
    id: "skipgram-net",
    rootClass: "sg-root",
    exportName: "mountSkipgramNet",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const vocab = data.vocab || [];
      const oneHot = data.oneHot || [];
      const W = data.W || [];
      const hidden = data.hidden || [];
      const logits = data.logits || [];
      const probs = data.probs || [];
      const ranking = data.ranking || [];
      const centreIndex = data.centreIndex || 0;
      const d = data.d || (W[0] ? W[0].length : 4);
      const topContext = data.topContext || ranking[0] && ranking[0].word || "";
      const runnerUp = ranking[1] && ranking[1].word || "";
      const n = vocab.length;
      const num = (x) => typeof x !== "number" ? "" : Number.isInteger(x) ? String(x) : fmt(x, 3);
      const prob = (x) => typeof x !== "number" ? "" : x.toFixed(3);
      const Wd = 880;
      const PAD = 16;
      const ROW = 32;
      const headBand = 36;
      const topY = 78;
      const cell = 22;
      const wCell = 44;
      const gap = 6;
      const colGap = 56;
      const vocabW = 60;
      const vocabX = PAD;
      const oneHotX = vocabX + vocabW;
      const wX = oneHotX + cell + colGap;
      const wW = d * (wCell + gap) - gap;
      const hiddenX = wX + wW + colGap;
      const hiddenW = wCell;
      const barX = hiddenX + hiddenW + colGap;
      const barMaxW = Wd - PAD - barX - 200;
      const H = frameHeightFor(topY + n * ROW + 10, 14);
      const plotRect = { x: 0, y: 0, w: Wd, h: H };
      const svg = el("svg", {
        viewBox: `0 0 ${Wd} ${H}`,
        class: "wgt-svg sg-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const rowY = (i) => topY + i * ROW;
      const headTop = topY - headBand;
      const wrapHead = (text) => {
        const words = String(text || "").trim().split(/\s+/);
        if (words.length <= 1) return [text || ""];
        const full = words.join(" ");
        let best = 1, bestDiff = Infinity;
        for (let i = 1; i < words.length; i++) {
          const left = words.slice(0, i).join(" ").length;
          const right = words.slice(i).join(" ").length;
          const diff = Math.abs(left - right);
          if (diff < bestDiff) {
            bestDiff = diff;
            best = i;
          }
        }
        if (full.length <= 18) return [full];
        return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
      };
      const colHead = (name, cx, text) => {
        const g = el("g", {}, svg);
        const lines = wrapHead(text);
        lines.forEach((ln, i) => {
          const t = el("text", {
            x: cx,
            y: headTop + i * 14,
            class: `sg-colhead${i > 0 ? " sg-colhead-2" : ""}`,
            "text-anchor": "middle"
          }, g);
          t.textContent = ln;
        });
        return add(name, g);
      };
      const cellFill = (v) => {
        const mag = Math.min(1, Math.abs(v));
        const tok = v >= 0 ? "var(--accent, #2A6FDB)" : "var(--c-red, #D7522C)";
        return `color-mix(in srgb, ${tok} ${Math.round(18 + mag * 70)}%, var(--bg-card, #fff))`;
      };
      layer("vocab", 0);
      vocab.forEach((w, i) => {
        const isCentre = i === centreIndex;
        const t = add("vocab", el("text", {
          x: vocabX,
          y: rowY(i) + cell / 2 + 4,
          class: `sg-vocab${isCentre ? " sg-vocab-centre" : ""}`
        }, svg));
        t.textContent = w;
      });
      layer("onehot", 0);
      colHead("onehot", oneHotX + cell / 2, labels.inHead || "input \xB7 one-hot");
      oneHot.forEach((bit, i) => {
        const on = bit === 1;
        const g = el("g", {}, svg);
        el("rect", {
          x: oneHotX,
          y: rowY(i),
          width: cell,
          height: cell,
          rx: 3,
          class: `sg-onehot${on ? " sg-onehot-on" : ""}`
        }, g);
        el("text", {
          x: oneHotX + cell / 2,
          y: rowY(i) + cell / 2 + 4,
          class: `sg-onehot-v${on ? " sg-onehot-v-on" : ""}`,
          "text-anchor": "middle"
        }, g).textContent = String(bit);
        add("onehot", g);
      });
      layer("matrix", 1);
      colHead("matrix", wX + wW / 2, labels.wHead || "W \xB7 embedding matrix = lookup table");
      const wCells = [];
      W.forEach((row, i) => {
        const isSel = i === centreIndex;
        row.forEach((v, c) => {
          const cx = wX + c * (wCell + gap);
          const cy = rowY(i);
          const rect = el("rect", {
            x: cx,
            y: cy,
            width: wCell,
            height: cell,
            rx: 3,
            class: `sg-wcell${isSel ? " sg-wcell-sel" : ""}`
          }, svg);
          rect.setAttribute("fill", cellFill(v));
          add("matrix", rect);
          add("matrix", el("text", {
            x: cx + wCell / 2,
            y: cy + cell / 2 + 3.5,
            class: "sg-wval",
            "text-anchor": "middle"
          }, svg)).textContent = num(v);
        });
      });
      add("matrix", el("rect", {
        x: wX - 2,
        y: rowY(centreIndex) - 2,
        width: wW + 4,
        height: cell + 4,
        rx: 4,
        class: "sg-rowring",
        fill: "none"
      }, svg));
      {
        const ax1 = oneHotX + cell + 2, ay = rowY(centreIndex) + cell / 2;
        const ax2 = wX - 4;
        const seg = clampSegmentToRect(ax1, ay, ax2, ay, plotRect) || { x1: ax1, y1: ay, x2: ax2, y2: ay };
        add("matrix", el("line", {
          x1: seg.x1,
          y1: seg.y1,
          x2: seg.x2,
          y2: seg.y2,
          class: "sg-arrow",
          "marker-end": "url(#sg-ah)"
        }, svg));
        add("matrix", el("text", {
          x: (ax1 + ax2) / 2,
          y: ay - 10,
          class: "sg-tag",
          "text-anchor": "middle"
        }, svg)).textContent = labels.lookupTag || "select row";
      }
      layer("hidden", 1, 1);
      colHead("hidden", hiddenX + hiddenW / 2, labels.hiddenHead || "hidden = the looked-up row");
      const hidMidY = rowY((n - 1) / 2) + cell / 2;
      const hidTop0 = hidMidY - hidden.length / 2 * (cell + gap) + gap / 2;
      hidden.forEach((v, c) => {
        const cy = hidTop0 + c * (cell + gap);
        const rect = el("rect", { x: hiddenX, y: cy, width: hiddenW, height: cell, rx: 3, class: "sg-hcell" }, svg);
        rect.setAttribute("fill", cellFill(v));
        add("hidden", rect);
        add("hidden", el("text", {
          x: hiddenX + hiddenW / 2,
          y: cy + cell / 2 + 3.5,
          class: "sg-wval",
          "text-anchor": "middle"
        }, svg)).textContent = num(v);
      });
      function barColumn(name, from, to, vals, fmtFn, opts = {}) {
        layer(name, from, to);
        const headKey = opts.headKey, headFallback = opts.headFallback;
        colHead(name, barX + barMaxW / 2, labels[headKey] || headFallback);
        const maxMag = Math.max(1e-6, ...vals.map((v) => Math.abs(v)));
        const zeroX = opts.signed ? barX + barMaxW * (vals.some((v) => v < 0) ? 0.32 : 0) : barX;
        vals.forEach((v, i) => {
          const cy = rowY(i) + 3;
          const bh = cell - 6;
          const g = el("g", {}, svg);
          el("rect", { x: barX, y: cy, width: barMaxW, height: bh, rx: 3, class: "sg-bartrack" }, g);
          let bx, bw, fillCls;
          if (opts.signed) {
            const w = Math.abs(v) / maxMag * (v >= 0 ? barMaxW - (zeroX - barX) : zeroX - barX);
            bx = v >= 0 ? zeroX : zeroX - w;
            bw = Math.max(1.5, w);
            fillCls = v >= 0 ? "sg-barfill sg-bar-pos" : "sg-barfill sg-bar-neg";
          } else {
            bx = barX;
            bw = Math.max(1.5, v / maxMag * barMaxW);
            const isTop = opts.topWord && vocab[i] === opts.topWord;
            const isRunner = opts.runnerWord && vocab[i] === opts.runnerWord;
            fillCls = `sg-barfill ${isTop ? "sg-bar-top" : isRunner ? "sg-bar-runner" : "sg-bar-lo"}`;
          }
          el("rect", { x: bx, y: cy, width: bw, height: bh, rx: 3, class: fillCls }, g);
          el("text", { x: barX + barMaxW + 6, y: cy + bh - 2.5, class: "sg-barval" }, g).textContent = fmtFn(v);
          add(name, g);
        });
        return { zeroX };
      }
      barColumn(
        "logits",
        2,
        2,
        logits,
        num,
        { signed: true, headKey: "logitsHead", headFallback: "logits \xB7 score per vocab word" }
      );
      barColumn(
        "probs",
        3,
        3,
        probs,
        prob,
        {
          headKey: "probsHead",
          headFallback: "softmax \xB7 context distribution (\u03A3 = 1)",
          topWord: topContext,
          runnerWord: runnerUp
        }
      );
      const TAG_X = barX + barMaxW + 56;
      layer("toptag", 3, 3);
      const tagFor = (word, tagKey, tagFallback, cls) => {
        const idx = vocab.indexOf(word);
        if (idx < 0) return;
        const cy = rowY(idx) + cell / 2 + 3;
        add("toptag", el("text", { x: TAG_X, y: cy, class: `sg-toptag ${cls}` }, svg)).textContent = (labels[tagKey] || tagFallback) + " \xB7 " + word;
      };
      tagFor(topContext, "topTag", "top context", "sg-toptag-top");
      tagFor(runnerUp, "runnerTag", "runner-up", "sg-toptag-runner");
      const defs = el("defs", {}, svg);
      const m = el("marker", {
        id: "sg-ah",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: "sg-arrhead" }, m);
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const node of L.nodes) node.classList.toggle("is-hidden", !on);
        }
        svg.classList.toggle("sg-lookup", k >= 1);
      };
    }
  });
})();
