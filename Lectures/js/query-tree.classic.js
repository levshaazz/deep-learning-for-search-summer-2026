/* AUTO-GENERATED offline classic bundle of widgets/query-tree/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
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

  // widgets/query-tree/logic.js
  function wrapLines(s, maxChars) {
    const words = String(s || "").split(/\s+/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      if (!cur) {
        cur = w;
        continue;
      }
      if ((cur + " " + w).length <= maxChars) cur += " " + w;
      else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
  var mountQueryTree = defineWidget({
    id: "query-tree",
    rootClass: "qt-root",
    exportName: "mountQueryTree",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const question = data.question || "";
      const subs = data.subQuestions || [];
      const recallSub = data.recallSub || [];
      const recallJoint = data.recallJoint != null ? data.recallJoint : 0;
      const sb = data.stepBack || {};
      const W = 560, PAD = 22;
      const fanTop = 36;
      const rootY = fanTop, rootH = 50;
      const subY = rootY + rootH + 64;
      const subH = 58, chunkY = subY + subH + 40, chunkH = 28;
      const fanBottom = chunkY + chunkH + 34;
      const ladderTop = fanBottom + 44;
      const rungH = 46, rungGap = 30;
      const rungY = (i) => ladderTop + 28 + i * (rungH + rungGap);
      const nRungs = 3;
      const ladderBottom = rungY(nRungs - 1) + rungH + 6;
      const H = frameHeightFor(ladderBottom + 14, 12);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg qt-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      function nodeBox(name, box, text, cls, maxChars) {
        add(name, el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: 8, class: cls }, svg));
        const lines = wrapLines(text, maxChars || 46);
        const lh = 13, startY = box.y + box.h / 2 - (lines.length - 1) * lh / 2 + 4;
        lines.forEach((ln, i) => {
          add(name, el("text", { x: box.x + box.w / 2, y: startY + i * lh, class: "qt-nodetext", "text-anchor": "middle" }, svg)).textContent = ln;
        });
      }
      layer("a-section", 0);
      add("a-section", el("text", { x: PAD, y: 20, class: "qt-sectlbl" }, svg)).textContent = labels.fanTitle || "A \xB7 Decomposition fan-out";
      layer("a-root", 0);
      const rootBox = { x: PAD + 90, y: rootY, w: W - 2 * PAD - 180, h: rootH };
      nodeBox("a-root", rootBox, question, "qt-node qt-root-node", 60);
      layer("a-branch", 1);
      const subBoxes = stack({ x: PAD, y: subY, w: W - 2 * PAD, h: subH }, subs.length || 2, { gap: 28 });
      const chunkBoxes = stack({ x: PAD, y: chunkY, w: W - 2 * PAD, h: chunkH }, subs.length || 2, { gap: 28 });
      subs.forEach((sq, i) => {
        const sb2 = subBoxes[i];
        add("a-branch", el("line", {
          x1: rootBox.x + rootBox.w / 2,
          y1: rootBox.y + rootBox.h,
          x2: sb2.x + sb2.w / 2,
          y2: sb2.y,
          class: "qt-edge"
        }, svg));
        nodeBox("a-branch", sb2, (labels.subPrefix || "sub") + (i + 1) + ": " + sq, "qt-node qt-sub-node", 32);
      });
      layer("a-retrieve", 2);
      subs.forEach((_, i) => {
        const sb2 = subBoxes[i], cb = chunkBoxes[i];
        const hit = recallSub[i] ? 1 : 0;
        add("a-retrieve", el("line", { x1: sb2.x + sb2.w / 2, y1: sb2.y + sb2.h, x2: cb.x + cb.w / 2, y2: cb.y, class: "qt-edge" }, svg));
        add("a-retrieve", el("rect", { x: cb.x, y: cb.y, width: cb.w, height: cb.h, rx: 6, class: "qt-chunk " + (hit ? "is-hit" : "is-miss") }, svg));
        add("a-retrieve", el("text", { x: cb.x + cb.w / 2, y: cb.y + cb.h / 2 + 4, class: "qt-chunklbl", "text-anchor": "middle" }, svg)).textContent = `${labels.chunk || "chunk"} ${hit ? "\u2713" : "\u2717"} \xB7 recall=${hit}`;
      });
      add("a-retrieve", el("text", { x: W / 2, y: fanBottom, class: "qt-verdict", "text-anchor": "middle" }, svg)).textContent = `${labels.recallSub || "recall per sub"} = [${recallSub.join(", ")}] \u2713\u2713 \xB7 ${labels.recallJoint || "recall on one joint retrieval"} = ${recallJoint} \u2717`;
      layer("b-section", 3);
      add("b-section", el("line", { x1: PAD, y1: ladderTop, x2: W - PAD, y2: ladderTop, class: "qt-divider" }, svg));
      add("b-section", el("text", { x: PAD, y: ladderTop + 18, class: "qt-sectlbl" }, svg)).textContent = labels.stepBackTitle || "B \xB7 Step-back ladder";
      const rungData = [
        { text: sb.principleRetrieved || sb.generic || "", tag: labels.principle || "principle", cls: "qt-rung is-principle", from: 4 },
        { text: sb.generic || "", tag: labels.generic || "generic", cls: "qt-rung is-generic", from: 4 },
        { text: sb.specific || "", tag: labels.specific || "specific", cls: "qt-rung is-specific", from: 3 }
      ];
      rungData.forEach((r, i) => {
        const name = "b-rung" + i;
        layer(name, r.from);
        const box = { x: PAD + 70, y: rungY(i), w: W - 2 * PAD - 70, h: rungH };
        add(name, el("text", { x: PAD, y: rungY(i) + rungH / 2 + 4, class: "qt-rungtag" }, svg)).textContent = r.tag;
        nodeBox(name, box, r.text, r.cls, 58);
        if (i < nRungs - 1) {
          const up = "b-arrow" + i;
          layer(up, 4);
          const cx = box.x + box.w / 2;
          add(up, el("line", { x1: cx, y1: rungY(i + 1), x2: cx, y2: rungY(i) + rungH, class: "qt-uparrow" }, svg));
          add(up, el("path", { d: `M${cx} ${rungY(i) + rungH} l-5 9 l10 0 z`, class: "qt-uparrowhead" }, svg));
        }
      });
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
