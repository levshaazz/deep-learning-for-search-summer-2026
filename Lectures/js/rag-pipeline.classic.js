/* AUTO-GENERATED offline classic bundle of widgets/rag-pipeline/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/rag-pipeline/logic.js
  var flatSeq = 0;
  var mountRagPipeline = defineWidget({
    id: "rag-pipeline",
    rootClass: "rag-root",
    exportName: "mountRagPipeline",
    maxStep: 3,
    render({ host, data, labels, el }) {
      data = data || {};
      if (Array.isArray(data.stages) && data.stages.length) {
        const seq2 = data.stages, N2 = seq2.length;
        const focus = labels.focusStage || null;
        const mode = labels.mode || "normal";
        const poison = /* @__PURE__ */ new Set(["retrieve", "stuff", "generate"]);
        const W2 = 760, PAD2 = 20, GAP2 = 14, ROWY2 = 72, BOXH2 = 66;
        const boxW2 = (W2 - 2 * PAD2 - (N2 - 1) * GAP2) / N2;
        const boxX2 = (i) => PAD2 + i * (boxW2 + GAP2);
        const cxF = (i) => boxX2(i) + boxW2 / 2;
        const mid = "rag-ar-l10-" + flatSeq++;
        const svg2 = el("svg", { viewBox: `0 0 ${W2} 10`, class: "wgt-svg rag-svg", role: "img", "aria-label": labels.alt || "" }, host);
        const defs2 = el("defs", {}, svg2);
        const mk = el("marker", { id: mid, viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }, defs2);
        el("path", { d: "M0,0 L10,5 L0,10 z", class: "rag-arhead" }, mk);
        const bandEl = el("text", { x: W2 / 2, y: 38, class: "rag-band rag-band-on", "text-anchor": "middle" }, svg2);
        bandEl.textContent = labels.flowLabel || "retrieve \u2192 augment \u2192 generate";
        const stageEls = [], arrowEls = [];
        for (let i = 0; i < N2; i++) {
          const id = seq2[i];
          let bcls = "rag-box rag-stage";
          if (mode === "all-green") bcls += " rag-ok";
          else if (mode === "poisoned" && poison.has(id)) bcls += " rag-bad";
          if (focus) bcls += id === focus ? " rag-focus" : " rag-faint";
          const cell = el("g", { class: "rag-stagecell" }, svg2);
          el("rect", { x: boxX2(i), y: ROWY2, width: boxW2, height: BOXH2, rx: 9, class: bcls }, cell);
          el("text", {
            x: cxF(i),
            y: ROWY2 + BOXH2 / 2 + 5,
            "text-anchor": "middle",
            class: "rag-boxtxt rag-boxtxt-stage" + (focus && id !== focus ? " rag-faint" : "")
          }, cell).textContent = labels[id] || id;
          stageEls.push(cell);
          if (i > 0) {
            const pa = mode === "poisoned" && poison.has(id) && poison.has(seq2[i - 1]) ? " rag-bad-arrow" : "";
            arrowEls.push(el("line", {
              x1: boxX2(i) - GAP2 + 1,
              y1: ROWY2 + BOXH2 / 2,
              x2: boxX2(i) - 2,
              y2: ROWY2 + BOXH2 / 2,
              class: "rag-arrow" + pa,
              "marker-end": `url(#${mid})`
            }, svg2));
          }
        }
        svg2.setAttribute("viewBox", `0 0 ${W2} ${frameHeightFor(ROWY2 + BOXH2 + 28, 8)}`);
        if (focus || mode !== "normal") return function update() {
        };
        const MAXK = 3;
        return function update(k) {
          const kk = k | 0;
          const shown = Math.min(N2, Math.max(1, Math.ceil((kk + 1) / (MAXK + 1) * N2)));
          stageEls.forEach((g, i) => g.classList.toggle("is-hidden", i >= shown));
          arrowEls.forEach((a, i) => a.classList.toggle("is-hidden", i + 1 >= shown));
          bandEl.classList.toggle("is-hidden", kk < MAXK);
        };
      }
      const offline = (data.offline || []).map((s) => s.id);
      const online = (data.online || []).map((s) => s.id);
      const seq = offline.concat(online);
      const nOff = offline.length;
      const N = seq.length;
      const txt = (id) => labels[id] || id;
      const roleOf = (id) => ({ retrieve: "scout", rerank: "judge", generate: "llm", index: "index" })[id] || "stage";
      const W = 760, PAD = 20, GAP = 12, ROWY = 104, BOXH = 66;
      const boxW = (W - 2 * PAD - (N - 1) * GAP) / N;
      const boxX = (i) => PAD + i * (boxW + GAP);
      const cx = (i) => boxX(i) + boxW / 2;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg rag-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const defs = el("defs", {}, svg);
      const m = el("marker", {
        id: "rag-ar",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: "rag-arhead" }, m);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const INNER = boxW - 8;
      function drawBox(name, i) {
        const id = seq[i], x = boxX(i);
        add(name, el("rect", {
          x,
          y: ROWY,
          width: boxW,
          height: BOXH,
          rx: 9,
          class: "rag-box rag-" + roleOf(id)
        }, svg));
        const label = txt(id);
        const attrs = {
          x: cx(i),
          y: ROWY + BOXH / 2 + 5,
          class: "rag-boxtxt rag-boxtxt-" + roleOf(id),
          "text-anchor": "middle"
        };
        if (label.length * 7 > INNER) {
          attrs.textLength = INNER;
          attrs.lengthAdjust = "spacingAndGlyphs";
        }
        add(name, el("text", attrs, svg)).textContent = label;
      }
      function arrowBetween(name, i) {
        add(name, el("line", {
          x1: boxX(i) - GAP + 1,
          y1: ROWY + BOXH / 2,
          x2: boxX(i) - 2,
          y2: ROWY + BOXH / 2,
          class: "rag-arrow",
          "marker-end": "url(#rag-ar)"
        }, svg));
      }
      layer("offline", 0);
      add("offline", el("text", {
        x: cx(0) + (cx(nOff - 1) - cx(0)) / 2,
        y: 40,
        class: "rag-band rag-band-off",
        "text-anchor": "middle"
      }, svg)).textContent = labels.bandOffline || "OFFLINE \xB7 build-time (once)";
      for (let i = 0; i < nOff; i++) {
        drawBox("offline", i);
        if (i > 0) arrowBetween("offline", i);
      }
      layer("online", 1);
      const divX = boxX(nOff) - GAP / 2;
      add("online", el("line", { x1: divX, y1: 30, x2: divX, y2: ROWY + BOXH + 14, class: "rag-div" }, svg));
      add("online", el("text", {
        x: cx(nOff) + (cx(N - 1) - cx(nOff)) / 2,
        y: 40,
        class: "rag-band rag-band-on",
        "text-anchor": "middle"
      }, svg)).textContent = labels.bandOnline || "ONLINE \xB7 query-time (per request)";
      for (let i = nOff; i < N; i++) {
        drawBox("online", i);
        if (i > nOff) arrowBetween("online", i);
      }
      add("online", el("line", {
        x1: boxX(nOff - 1) + boxW,
        y1: ROWY + BOXH / 2,
        x2: boxX(nOff) - 2,
        y2: ROWY + BOXH / 2,
        class: "rag-arrow rag-arrow-bridge",
        "marker-end": "url(#rag-ar)"
      }, svg));
      const qx = cx(nOff), qw = Math.min(96, boxW + 12);
      add("online", el("rect", { x: qx - qw / 2, y: 56, width: qw, height: 26, rx: 13, class: "rag-query" }, svg));
      add("online", el("text", { x: qx, y: 73, class: "rag-querytxt", "text-anchor": "middle" }, svg)).textContent = labels.query || "query";
      add("online", el("line", { x1: qx, y1: 82, x2: qx, y2: ROWY - 2, class: "rag-arrow", "marker-end": "url(#rag-ar)" }, svg));
      layer("cascade", 2);
      const ri = seq.indexOf("retrieve"), ki = seq.indexOf("rerank");
      if (ri >= 0 && ki >= 0) {
        const x0 = boxX(Math.min(ri, ki)) - 4, x1 = boxX(Math.max(ri, ki)) + boxW + 4;
        add("cascade", el("rect", {
          x: x0,
          y: ROWY - 5,
          width: x1 - x0,
          height: BOXH + 10,
          rx: 11,
          class: "rag-ring",
          fill: "none"
        }, svg));
        add("cascade", el("text", {
          x: (x0 + x1) / 2,
          y: ROWY + BOXH + 26,
          class: "rag-tag rag-tag-cascade",
          "text-anchor": "middle"
        }, svg)).textContent = labels.cascadeTag || "the neural cascade";
      }
      layer("rag", 3);
      const gi = seq.indexOf("generate");
      if (gi >= 0) {
        add("rag", el("rect", {
          x: boxX(gi) - 4,
          y: ROWY - 5,
          width: boxW + 8,
          height: BOXH + 10,
          rx: 11,
          class: "rag-ring rag-ring-gen",
          fill: "none"
        }, svg));
        add("rag", el("text", { x: W - PAD, y: ROWY + BOXH + 26, class: "rag-tag rag-tag-answer", "text-anchor": "end" }, svg)).textContent = labels.answerTag || "\u2192 grounded + cited";
      }
      const H = frameHeightFor(ROWY + BOXH + 36, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
