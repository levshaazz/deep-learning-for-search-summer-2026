/* AUTO-GENERATED offline classic bundle of widgets/rag-control-flow/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/rag-control-flow/logic.js
  var mountRagControlFlow = defineWidget({
    id: "rag-control-flow",
    rootClass: "rcf-root",
    exportName: "mountRagControlFlow",
    maxStep: 4,
    render({ host, data, labels, el }) {
      data = data || {};
      const crag = data.crag || {};
      const selfRag = data.selfRag || {};
      const grades = crag.grades || ["correct", "ambiguous", "wrong"];
      const thr = crag.thresholds || {};
      const acts = crag.actions || {};
      const tokens = selfRag.reflectionTokens || ["Retrieve", "IsRel", "IsSup", "IsUse"];
      const W = 540;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg rcf-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const defs = el("defs", {}, svg);
      const mk = el("marker", {
        id: "rcf-ar",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: "rcf-arhead" }, mk);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
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
      function box(name, x, y, w, h, txt, cls) {
        const g = el("g", { class: "rcf-node" }, svg);
        add(name, g);
        el("rect", { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 8, class: "rcf-box " + (cls || "") }, g);
        el("text", { x, y: y + 4, class: "rcf-boxtxt", "text-anchor": "middle" }, g).textContent = txt;
        return { x, y, w, h, g };
      }
      function boxWrap(name, x, y, w, h, txt, cls, maxChars) {
        const g = el("g", { class: "rcf-node" }, svg);
        add(name, g);
        el("rect", { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 8, class: "rcf-box " + (cls || "") }, g);
        const lines = wrapLines(txt, maxChars || 24);
        const lh = 13, startY = y - (lines.length - 1) * lh / 2 + 4;
        lines.forEach((ln, i) => {
          el("text", { x, y: startY + i * lh, class: "rcf-boxtxt", "text-anchor": "middle" }, g).textContent = ln;
        });
        return { x, y, w, h, g };
      }
      function diamond(name, x, y, w, h, txt, cls) {
        const g = el("g", { class: "rcf-node" }, svg);
        add(name, g);
        el("path", {
          d: `M${x} ${y - h / 2} L${x + w / 2} ${y} L${x} ${y + h / 2} L${x - w / 2} ${y} Z`,
          class: "rcf-diamond " + (cls || "")
        }, g);
        el("text", { x, y: y + 4, class: "rcf-diatxt", "text-anchor": "middle" }, g).textContent = txt;
        return { x, y, w, h, g };
      }
      function arrow(name, x1, y1, x2, y2, lbl, lblcls) {
        add(name, el("line", { x1, y1, x2, y2, class: "rcf-arrow", "marker-end": "url(#rcf-ar)" }, svg));
        if (lbl) {
          add(name, el("text", {
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2 - 4,
            class: "rcf-edgelbl " + (lblcls || ""),
            "text-anchor": "middle"
          }, svg)).textContent = lbl;
        }
      }
      const bot = (n) => n.y + n.h / 2;
      const top = (n) => n.y - n.h / 2;
      layer("s0", 0);
      add("s0", el("text", { x: 14, y: 18, class: "rcf-secttl" }, svg)).textContent = labels.cragTitle || "CRAG \xB7 grade the retrieval, then act";
      const nRetrieve = box("s0", W / 2, 46, 130, 30, labels.retrieve || "retrieve", "rcf-accent");
      const nGrade = diamond("s0", W / 2, 110, 150, 56, labels.grade || "grade each doc", "rcf-judge");
      arrow("s0", nRetrieve.x, bot(nRetrieve), nGrade.x, top(nGrade));
      layer("branches", 1);
      const colX = [W * 0.18, W * 0.5, W * 0.82];
      const branchY = 188;
      const gradeCls = { correct: "rcf-good", ambiguous: "rcf-warm", wrong: "rcf-bad" };
      const gradeNodes = grades.map((g, i) => {
        const n = box("branches", colX[i], branchY, 150, 34, g, gradeCls[g] || "");
        const lblcls = g === "correct" ? "rcf-edge-good" : g === "wrong" ? "rcf-edge-bad" : "rcf-edge-warm";
        arrow("branches", nGrade.x, bot(nGrade), n.x, top(n));
        const tg = thr[g] ? `${labels[g] || g} ${thr[g]}` : labels[g] || g;
        add("branches", el("text", {
          x: n.x,
          y: top(n) - 9,
          class: "rcf-edgelbl " + lblcls,
          "text-anchor": "middle"
        }, svg)).textContent = tg;
        return n;
      });
      layer("actions", 2);
      const actY = 262, actH = 56;
      grades.forEach((g, i) => {
        const a = acts[g] || "";
        const n = boxWrap("actions", colX[i], actY, 162, actH, a, gradeCls[g] || "", 24);
        arrow("actions", gradeNodes[i].x, bot(gradeNodes[i]), n.x, top(n));
      });
      const srTtlY = actY + actH / 2 + 30;
      layer("selfrag", 3);
      add("selfrag", el("text", { x: 14, y: srTtlY, class: "rcf-secttl" }, svg)).textContent = labels.selfRagTitle || "self-RAG \xB7 reflection-token gates";
      const diaY = srTtlY + 46;
      const diaInset = 70;
      const diaXs = tokens.map((_, i) => diaInset + i * ((W - 2 * diaInset) / Math.max(1, tokens.length - 1)));
      const tokGate = selfRag.gates || {};
      const diaNodes = [];
      tokens.forEach((t, i) => {
        const lname = i < tokens.length - 1 ? "selfrag" : "finish";
        if (i === tokens.length - 1) layer("finish", 4);
        const lbl = t.replace(/^Is/, "Is\xB7");
        const n = diamond(lname, diaXs[i], diaY, 96, 50, lbl, "rcf-judge");
        diaNodes.push(n);
        if (i > 0) {
          const prev = diaNodes[i - 1];
          arrow(lname, prev.x + prev.w / 2, prev.y, n.x - n.w / 2, n.y, labels.pass || "pass");
        }
      });
      const ansY = diaY + 70;
      const nAnswer = box("finish", W / 2, ansY, 200, 34, labels.answer || "grounded answer", "rcf-good");
      arrow("finish", diaNodes[diaNodes.length - 1].x, bot(diaNodes[diaNodes.length - 1]), nAnswer.x, top(nAnswer));
      const H = frameHeightFor(ansY + 24, 14);
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
