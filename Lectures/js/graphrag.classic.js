/* AUTO-GENERATED offline classic bundle of widgets/graphrag/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/graphrag/logic.js
  var mountGraphrag = defineWidget({
    id: "graphrag",
    rootClass: "gr-root",
    exportName: "mountGraphrag",
    maxStep: 5,
    render({ host, data, labels, el }) {
      const d = data || {};
      const docs = d.docs || [];
      const triples = d.triples || [];
      const path = d.path || [];
      const answerNode = d.answerNode || "";
      const singleHopDoc = d.singleHopDoc || "";
      const real = d.real || {};
      const W = 560;
      const POS = {
        "Acme Corp": { x: 120, y: 250, w: 130, h: 38 },
        "Dana Reyes": { x: 300, y: 330, w: 130, h: 38 },
        "computer science": { x: 130, y: 408, w: 156, h: 38 },
        "MIT": { x: 462, y: 330, w: 96, h: 38 },
        "Portland": { x: 462, y: 250, w: 116, h: 38 },
        "Cambridge": { x: 462, y: 408, w: 116, h: 38 }
      };
      const anchor = (n, tx, ty) => {
        const dx = tx - n.x, dy = ty - n.y;
        if (dx === 0 && dy === 0) return { x: n.x, y: n.y };
        const sx = n.w / 2 / Math.max(1e-6, Math.abs(dx));
        const sy = n.h / 2 / Math.max(1e-6, Math.abs(dy));
        const s = Math.min(sx, sy);
        return { x: n.x + dx * s, y: n.y + dy * s };
      };
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg gr-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const defs = el("defs", {}, svg);
      [["gr-ar", "gr-arhead"], ["gr-ar-win", "gr-arhead-win"]].forEach(([id, cls]) => {
        const mk = el("marker", {
          id,
          viewBox: "0 0 10 10",
          refX: "8.5",
          refY: "5",
          markerWidth: "7",
          markerHeight: "7",
          orient: "auto-start-reverse"
        }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 z", class: cls }, mk);
      });
      el("text", { x: 16, y: 22, class: "gr-qhead" }, svg).textContent = labels.questionHead || "question";
      const qWrap = el("text", { x: 16, y: 41, class: "gr-qtext" }, svg);
      const qstr = d.question || "";
      qWrap.textContent = qstr.length > 70 ? qstr.slice(0, 67) + "\u2026" : qstr;
      const hopsTag = el("text", { x: W - 16, y: 41, class: "gr-hopstag", "text-anchor": "end" }, svg);
      hopsTag.textContent = `${labels.hopsLabel || "hops needed"}: ${d.hops != null ? d.hops : ""}`;
      const docTop = 58, docH = 56, docGap = 12, docW = (W - 32 - 2 * docGap) / 3;
      el("text", { x: 16, y: docTop - 4, class: "gr-sectlbl" }, svg).textContent = labels.docsHead || "retrieved documents";
      const docEls = {};
      docs.forEach((doc, i) => {
        const x = 16 + i * (docW + docGap);
        const g = el("g", { class: "gr-doc" }, svg);
        el("rect", { x, y: docTop, width: docW, height: docH, rx: 6, class: "gr-doc-box" }, g);
        el("text", { x: x + 8, y: docTop + 16, class: "gr-doc-id" }, g).textContent = String(doc.id || "").toUpperCase();
        const words = String(doc.text || "").split(/\s+/).filter(Boolean);
        const lines = ["", ""];
        const cap = 20;
        let li = 0;
        for (let wi = 0; wi < words.length; wi++) {
          const w = words[wi];
          const cand = lines[li] ? lines[li] + " " + w : w;
          if (cand.length <= cap) {
            lines[li] = cand;
            continue;
          }
          if (li === 0) {
            li = 1;
            lines[1] = w.length <= cap ? w : w.slice(0, cap - 1) + "\u2026";
            continue;
          }
          lines[1] = lines[1].length <= cap - 1 ? lines[1] + "\u2026" : lines[1].slice(0, cap - 1) + "\u2026";
          break;
        }
        el("text", { x: x + 8, y: docTop + 32, class: "gr-doc-txt" }, g).textContent = lines[0];
        el("text", { x: x + 8, y: docTop + 46, class: "gr-doc-txt" }, g).textContent = lines[1];
        const tag = el("text", { x: x + docW - 8, y: docTop + 16, class: "gr-doc-tag", "text-anchor": "end" }, g);
        docEls[doc.id] = { g, tag };
      });
      const graphTop = docTop + docH + 14;
      el("text", { x: 16, y: graphTop + 6, class: "gr-sectlbl" }, svg).textContent = labels.graphHead || "entity graph";
      const edgeEls = triples.map((t) => {
        const [subj, rel, obj] = t;
        const ns = POS[subj], no = POS[obj];
        const g = el("g", { class: "gr-edge" }, svg);
        let a = { x: 0, y: 0 }, b = { x: 0, y: 0 };
        if (ns && no) {
          a = anchor(ns, no.x, no.y);
          b = anchor(no, ns.x, ns.y);
          el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "gr-edge-line", "marker-end": "url(#gr-ar)" }, g);
        }
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const ex = b.x - a.x, ey = b.y - a.y;
        const len = Math.max(1e-6, Math.hypot(ex, ey));
        const off = len < 90 ? 9 + (90 - len) * 0.6 : 9;
        const text = String(rel || "").replace(/_/g, " ");
        return { g, subj, rel, obj, text, lx: mx - ey / len * off, ly: my + ex / len * off };
      });
      const GMINGAP = 18, GCHARW = 6.5;
      for (let it = 0; it < 80; it++) {
        for (let i = 0; i < edgeEls.length; i++) for (let j = i + 1; j < edgeEls.length; j++) {
          const A = edgeEls[i], B = edgeEls[j];
          const sumHalfW = (A.text.length + B.text.length) * GCHARW / 2 + 3;
          if (Math.abs(A.lx - B.lx) > sumHalfW) continue;
          const oy = GMINGAP - Math.abs(A.ly - B.ly);
          if (oy > 0) {
            const d2 = A.ly <= B.ly ? -1 : 1;
            A.ly += d2 * (oy / 2 + 0.3);
            B.ly -= d2 * (oy / 2 + 0.3);
          }
        }
      }
      edgeEls.forEach((e) => {
        el("text", { x: e.lx, y: e.ly + 3, class: "gr-edge-lbl", "text-anchor": "middle" }, e.g).textContent = e.text;
      });
      const nodeEls = {};
      Object.keys(POS).forEach((name) => {
        const n = POS[name];
        const g = el("g", { class: "gr-node" + (name === answerNode ? " is-answer" : "") }, svg);
        el("rect", { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h, rx: 8, class: "gr-node-box" }, g);
        el("text", { x: n.x, y: n.y + 4, class: "gr-node-txt", "text-anchor": "middle" }, g).textContent = name;
        nodeEls[name] = g;
      });
      const recallY = POS["computer science"].y + 44;
      const recSingle = el("g", { class: "gr-recall is-hidden" }, svg);
      el("text", { x: 16, y: recallY, class: "gr-rec-bad" }, recSingle).textContent = "\u2717";
      el("text", { x: 34, y: recallY, class: "gr-rec-bad-txt" }, recSingle).textContent = `${labels.recallSingle || "single-hop recall"}: ${d.recallSingleHop != null ? d.recallSingleHop : ""}`;
      const recMulti = el("g", { class: "gr-recall is-hidden" }, svg);
      el("text", { x: 16, y: recallY + 20, class: "gr-rec-ok" }, recMulti).textContent = "\u2713";
      el("text", { x: 34, y: recallY + 20, class: "gr-rec-ok-txt" }, recMulti).textContent = `${labels.recallMulti || "multi-hop recall"}: ${d.recallMultiHop != null ? d.recallMultiHop : ""}`;
      const badgeY = recallY + 38;
      const badge = el("g", { class: "gr-badge is-hidden" }, svg);
      el("rect", { x: 16, y: badgeY, width: W - 32, height: 48, rx: 8, class: "gr-badge-box" }, badge);
      el("text", { x: 28, y: badgeY + 19, class: "gr-badge-ttl" }, badge).textContent = `${labels.realHead || "real run"} \xB7 ${real._model || ""}`;
      el("text", { x: 28, y: badgeY + 38, class: "gr-badge-txt" }, badge).textContent = `${labels.realExtracted || "extracted"} ${real.nTriplesExtracted != null ? real.nTriplesExtracted : ""} ${labels.realTriples || "triples"} \u2192 ${labels.realTraversed || "traversed to"} \u201C${real.derivedAnswer || ""}\u201D`;
      el("text", { x: W - 28, y: badgeY + 19, class: "gr-badge-note", "text-anchor": "end" }, badge).textContent = labels.communityNote || "GraphRAG also pre-summarises graph communities";
      const H = frameHeightFor(badgeY + 48, 14);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const onPath = (e) => path.some((p) => p[0] === e.subj && p[1] === e.rel && p[2] === e.obj);
      const pathNodes = /* @__PURE__ */ new Set();
      path.forEach((p) => {
        pathNodes.add(p[0]);
        pathNodes.add(p[2]);
      });
      return function update(k) {
        const single = k >= 1;
        Object.keys(docEls).forEach((id) => {
          const isPicked = id === singleHopDoc;
          docEls[id].g.classList.toggle("is-picked-bad", single && isPicked);
          docEls[id].g.classList.toggle("is-dim", single && !isPicked);
          docEls[id].tag.textContent = single && isPicked ? "\u2717 " + (labels.noField || "no field") : "";
        });
        recSingle.classList.toggle("is-hidden", k < 1);
        const graphOn = k >= 2;
        svg.classList.toggle("gr-graph-on", graphOn);
        edgeEls.forEach((e) => {
          const shown = onPath(e) ? k >= 2 : k >= 3;
          e.g.classList.toggle("is-hidden", !shown);
        });
        Object.keys(nodeEls).forEach((name) => {
          const shown = pathNodes.has(name) ? k >= 2 : k >= 3;
          nodeEls[name].classList.toggle("is-hidden", !shown);
        });
        const traversed = k >= 4;
        edgeEls.forEach((e) => e.g.classList.toggle("is-win", traversed && onPath(e)));
        Object.keys(nodeEls).forEach((name) => {
          nodeEls[name].classList.toggle("is-on-path", traversed && pathNodes.has(name));
          nodeEls[name].classList.toggle("is-answer-lit", traversed && name === answerNode);
        });
        recMulti.classList.toggle("is-hidden", k < 4);
        badge.classList.toggle("is-hidden", k < 5);
      };
    }
  });
})();
