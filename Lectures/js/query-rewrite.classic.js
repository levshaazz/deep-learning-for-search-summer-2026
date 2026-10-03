/* AUTO-GENERATED offline classic bundle of widgets/query-rewrite/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/query-rewrite/logic.js
  var mountQueryRewrite = defineWidget({
    id: "query-rewrite",
    rootClass: "qr-root",
    exportName: "mountQueryRewrite",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const original = data.original || {}, hyde = data.hyde || {}, mq = data.multiQuery || {};
      const trueDoc = data.trueDocId;
      const W = 480, padL = 18, listTop = 86, rowH = 20, rowGap = 3, CUT = 5;
      const N = (original.rankedList || []).length || 10;
      const colW = 250;
      const rowY = (i) => listTop + i * (rowH + rowGap);
      const cutY = rowY(CUT) - rowGap / 2;
      const mqTop = rowY(N) + 26;
      const H = frameHeightFor(mqTop + 64, 12);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg qr-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const readHead = el("text", { x: padL, y: 26, class: "qr-readhead" }, svg);
      const readSub = el("text", { x: padL, y: 48, class: "qr-readsub" }, svg);
      el("text", { x: padL, y: 70, class: "qr-collbl" }, svg).textContent = labels.ranked || "retrieved, ranked";
      const cutLine = el("line", { x1: padL, y1: cutY, x2: padL + colW, y2: cutY, class: "qr-cut" }, svg);
      el("text", { x: padL + colW + 6, y: cutY + 4, class: "qr-cutlbl" }, svg).textContent = labels.cut || "top-5 cut";
      const cardX = padL + colW + 30, cardW = W - cardX - padL;
      const hydeCard = el("g", { class: "qr-card is-hidden" }, svg);
      el("rect", { x: cardX, y: listTop, width: cardW, height: 92, rx: 8, class: "qr-cardbox" }, hydeCard);
      el("text", { x: cardX + 10, y: listTop + 20, class: "qr-cardttl" }, hydeCard).textContent = labels.hydeTitle || "HyDE";
      const cardLines = [labels.hydeL1 || "write a hypothetical", labels.hydeL2 || "answer, then embed", labels.hydeL3 || "THAT vector"];
      cardLines.forEach((t, i) => el("text", { x: cardX + 10, y: listTop + 42 + i * 16, class: "qr-cardtxt" }, hydeCard).textContent = t);
      const mqG = el("g", { class: "qr-mq is-hidden" }, svg);
      el("text", { x: padL, y: mqTop, class: "qr-mqhead" }, mqG).textContent = labels.mqHead || "multi-query \xB7 a separate 5-relevant gold-set";
      function goldRow(y, foundN, label, recall) {
        const g = el("g", {}, mqG);
        el("text", { x: padL, y: y + 12, class: "qr-mqlbl" }, g).textContent = label;
        const dotX0 = padL + 150;
        for (let i = 0; i < 5; i++) {
          el("circle", { cx: dotX0 + i * 22, cy: y + 8, r: 7, class: "qr-gold " + (i < foundN ? "is-found" : "is-miss") }, g);
        }
        el("text", { x: dotX0 + 5 * 22 + 8, y: y + 12, class: "qr-mqrecall" }, g).textContent = `recall@5 = ${recall}`;
      }
      goldRow(mqTop + 12, (mq.foundSingle || []).length, labels.mqSingle || "single query", mq.recallAt5Single);
      goldRow(mqTop + 38, (mq.foundUnion || []).length, labels.mqUnion || "union of 3 paraphrases", mq.recallAt5Union);
      const listG = el("g", {}, svg);
      function drawList(variant) {
        while (listG.firstChild) listG.removeChild(listG.firstChild);
        const v = variant === "hyde" ? hyde : original;
        (v.rankedList || []).forEach((id, i) => {
          const rank = i + 1, y = rowY(i), isTrue = id === trueDoc, inTop = rank <= CUT;
          const state = isTrue ? inTop ? " is-true is-in" : " is-true is-out" : "";
          el("rect", { x: padL, y, width: colW, height: rowH, rx: 4, class: "qr-rowbox" + state }, listG);
          el("text", { x: padL + 8, y: y + 14, class: "qr-rank" + state }, listG).textContent = rank;
          el("text", { x: padL + 34, y: y + 14, class: "qr-id" + state }, listG).textContent = isTrue ? "\u2605 " + id : id;
        });
      }
      return function update(k) {
        const variant = k >= 2 ? "hyde" : "original";
        drawList(variant);
        const v = variant === "hyde" ? hyde : original;
        readHead.textContent = (variant === "hyde" ? labels.hydeLbl || "HyDE query" : labels.origLbl || "original query") + ` \xB7 "${data.query || ""}"`;
        readSub.textContent = `${labels.trueDoc || "true doc"}: ${labels.rank || "rank"} ${v.trueRank} \xB7 recall@5 = ${v.recallAt5} \xB7 RR = ${v.rr}`;
        hydeCard.classList.toggle("is-hidden", k < 1);
        mqG.classList.toggle("is-hidden", k < 3);
      };
    }
  });
})();
