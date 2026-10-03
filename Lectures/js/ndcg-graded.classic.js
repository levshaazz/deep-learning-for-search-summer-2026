/* AUTO-GENERATED offline classic bundle of widgets/ndcg-graded/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ndcg-graded/logic.js
  var f4 = (x) => (Math.round(x * 1e4) / 1e4).toFixed(4);
  var dsc = (x) => (Math.round(x * 1e4) / 1e4).toString();
  var mountNdcgGraded = defineWidget({
    id: "ndcg-graded",
    rootClass: "ndg-root",
    exportName: "mountNdcgGraded",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const W = 480;
      const ranked = data.ranked;
      const disc = {};
      data.perPosition.forEach((p) => disc[p.rank] = p.discount);
      const gainFns = {
        binary: (g) => g > 0 ? 1 : 0,
        linear: (g) => g,
        exp: (g) => Math.pow(2, g) - 1
      };
      const grades = ranked.map((r) => r.grade);
      const idealGrades = [...grades].sort((a, b) => b - a);
      const variant = (fn) => {
        let dcg = 0, idcg = 0;
        ranked.forEach((r, i) => {
          dcg += fn(r.grade) * disc[i + 1];
        });
        idealGrades.forEach((g, i) => {
          idcg += fn(g) * disc[i + 1];
        });
        return { dcg, idcg, ndcg: dcg / idcg };
      };
      const V = {
        binary: variant(gainFns.binary),
        linear: { dcg: data.linear.dcg, idcg: data.linear.idcg, ndcg: data.linear.ndcg },
        exp: { dcg: data.exponential.dcg, idcg: data.exponential.idcg, ndcg: data.exponential.ndcg }
      };
      const recLin = variant(gainFns.linear), recExp = variant(gainFns.exp);
      if (Math.abs(recLin.ndcg - V.linear.ndcg) > 5e-4 || Math.abs(recExp.ndcg - V.exp.ndcg) > 5e-4) {
        console.warn("[ndcg-graded] recomputed graded nDCG drifts from published data \u2014 check l4-graded.json");
      }
      const svg = el("svg", { class: "wgt-svg ndg-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const list = { x: 16, y: 52, rowH: 30, w: W - 32 };
      const col = { rank: list.x + 12, grade: list.x + 70, gain: list.x + 150, disc: list.x + 250 };
      el("text", { x: col.rank, y: list.y - 14, class: "ndg-th", "text-anchor": "middle" }, svg).textContent = labels.rankCol || "rank";
      el("text", { x: col.grade, y: list.y - 14, class: "ndg-th", "text-anchor": "middle" }, svg).textContent = labels.gradeCol || "grade";
      const gainHdr = el("text", { x: col.gain, y: list.y - 14, class: "ndg-th ndg-th-gain", "text-anchor": "middle" }, svg);
      gainHdr.textContent = labels.gainCol || "gain";
      el("text", { x: col.disc, y: list.y - 14, class: "ndg-th", "text-anchor": "middle" }, svg).textContent = labels.discCol || "discount";
      const rows = ranked.map((r, i) => {
        const y0 = list.y + i * list.rowH;
        const yc = y0 + list.rowH / 2;
        const g = el("g", { class: "ndg-row", "data-rank": r.rank }, svg);
        el("rect", {
          x: list.x,
          y: y0,
          width: list.w,
          height: list.rowH - 4,
          class: "ndg-rowbg" + (r.grade > 0 ? " is-rel" : ""),
          rx: 5
        }, g);
        el("text", { x: col.rank, y: yc + 4, class: "ndg-rank", "text-anchor": "middle" }, g).textContent = r.rank;
        el("text", { x: col.grade, y: yc + 4, class: "ndg-grade g" + r.grade, "text-anchor": "middle" }, g).textContent = r.grade;
        const gainTxt = el("text", { x: col.gain, y: yc + 4, class: "ndg-gain", "text-anchor": "middle" }, g);
        el("text", { x: col.disc, y: yc + 4, class: "ndg-disc", "text-anchor": "middle" }, g).textContent = dsc(disc[r.rank]);
        return { r, g, gainTxt, yc };
      });
      const panelY = list.y + ranked.length * list.rowH + 26;
      const px = list.x;
      const tag = el("text", { x: px, y: panelY, class: "ndg-tag" }, svg);
      const dcgTerms = el("text", { x: px, y: panelY + 22, class: "ndg-dcg-terms" }, svg);
      const dcgLine = el("text", { x: px, y: panelY + 42, class: "ndg-dcg" }, svg);
      const ndcgLine = el("text", { x: px, y: panelY + 64, class: "ndg-ndcg" }, svg);
      const board = { x: px, y: panelY + 74, rowH: 20 };
      const boardRows = [
        { key: "binary", tag: labels.binaryTag || "binary gain", v: V.binary },
        { key: "linear", tag: labels.linearTag || "linear gain  (g)", v: V.linear },
        { key: "exp", tag: labels.expTag || "exponential gain  (2^g \u2212 1)", v: V.exp }
      ].map((b, i) => {
        const y = board.y + i * board.rowH + 12;
        const g = el("g", { class: "ndg-board-row is-hidden", "data-key": b.key }, svg);
        el("text", { x: board.x, y, class: "ndg-board-tag" }, g).textContent = b.tag;
        el("text", { x: board.x + W - 64, y, class: "ndg-board-val", "text-anchor": "end" }, g).textContent = "nDCG = " + f4(b.v.ndcg);
        return { ...b, g, y };
      });
      const verdict = el("text", { x: px, y: board.y + 3 * board.rowH + 26, class: "ndg-verdict is-hidden" }, svg);
      verdict.textContent = labels.verdict || "Same ranking, three scores \u2014 state which gain you used.";
      const H = frameHeightFor(board.y + 3 * board.rowH + 26);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const stepVariant = { 1: "binary", 2: "linear", 3: "exp" };
      const stepGainFn = { 1: gainFns.binary, 2: gainFns.linear, 3: gainFns.exp };
      const stepTag = {
        1: labels.binaryTag || "binary gain",
        2: labels.linearTag || "linear gain  (g)",
        3: labels.expTag || "exponential gain  (2^g \u2212 1)"
      };
      return function update(k) {
        const key = stepVariant[k];
        const fn = stepGainFn[k];
        rows.forEach(({ r, gainTxt, g }) => {
          gainTxt.textContent = fn ? String(fn(r.grade)) : "";
          g.classList.toggle("is-strong", k >= 1 && r.grade >= 3);
        });
        gainHdr.classList.toggle("is-active", k >= 1);
        const v = key ? V[key] : null;
        tag.textContent = k >= 1 ? stepTag[k] : "";
        tag.classList.toggle("is-hidden", k < 1);
        tag.setAttribute("data-key", key || "");
        dcgTerms.textContent = fn ? ranked.filter((r) => fn(r.grade) > 0).map((r) => `${dsc(fn(r.grade))}\xB7${dsc(disc[r.rank])}`).join(" + ") + ` = ${f4(v.dcg)}` : "";
        dcgTerms.classList.toggle("is-hidden", k < 1);
        dcgLine.textContent = v ? `${labels.dcgLabel || "DCG"} = ${f4(v.dcg)}    ${labels.idcgLabel || "IDCG"} = ${f4(v.idcg)}` : "";
        dcgLine.classList.toggle("is-hidden", k < 1);
        ndcgLine.textContent = v ? `${labels.ndcgLabel || "nDCG"} = ${f4(v.ndcg)}` : "";
        ndcgLine.classList.toggle("is-hidden", k < 1);
        ndcgLine.setAttribute("data-key", key || "");
        boardRows.forEach((b, i) => {
          const reached = k >= i + 1;
          b.g.classList.toggle("is-hidden", !reached);
          b.g.classList.toggle("is-current", key === b.key);
        });
        verdict.classList.toggle("is-hidden", k < 3);
      };
    }
  });
})();
