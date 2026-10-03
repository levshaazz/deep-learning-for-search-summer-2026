/* AUTO-GENERATED offline classic bundle of widgets/ndcg-multiquery/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ndcg-multiquery/logic.js
  var f4 = (x) => (Math.round(x * 1e4) / 1e4).toString();
  var f2 = (x) => (Math.round(x * 100) / 100).toString();
  var mountNdcgMultiquery = defineWidget({
    id: "ndcg-multiquery",
    rootClass: "mq-root",
    exportName: "mountNdcgMultiquery",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const W = 480;
      const queries = [
        { key: "q1", title: labels.q1Title || "Query 1", d: data.q1 },
        { key: "q2", title: labels.q2Title || "Query 2", d: data.q2 }
      ];
      queries.forEach((q) => {
        const rels = q.d.rels;
        let seen = 0;
        const hits = [];
        rels.forEach((r, i) => {
          if (r) {
            seen += 1;
            hits.push({ rank: i + 1, hitNo: seen, precision: seen / (i + 1) });
          }
        });
        q.rels = rels;
        q.hits = hits;
        q.firstRank = hits.length ? hits[0].rank : Infinity;
        q.rr = q.d.rr;
        q.ap = q.d.ap;
      });
      const mrr = data.mrr;
      const map = data.map;
      const svg = el("svg", { class: "wgt-svg mq-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const nCells = Math.max(...queries.map((q) => q.rels.length));
      const strip = { x: 16, w: W - 32 };
      const cell = Math.min(40, (strip.w - 92) / nCells);
      const gutter = 88;
      const rowGap = 96;
      const rowY0 = 44;
      const rowRefs = queries.map((q, qi) => {
        const y = rowY0 + qi * rowGap;
        const g = el("g", { class: "mq-row", "data-q": q.key }, svg);
        el("text", { x: strip.x, y: y + cell / 2 + 4, class: "mq-qtitle" }, g).textContent = q.title;
        const cells = q.rels.map((r, i) => {
          const cx = strip.x + gutter + i * cell;
          const cg = el("g", { class: "mq-cell", "data-rank": i + 1 }, g);
          el("rect", {
            x: cx,
            y,
            width: cell - 4,
            height: cell - 4,
            class: "mq-cellbg" + (r ? " is-rel" : ""),
            rx: 5
          }, cg);
          el("text", {
            x: cx + (cell - 4) / 2,
            y: y + (cell - 4) / 2 + 4,
            class: "mq-mark " + (r ? "is-rel" : "is-nonrel"),
            "text-anchor": "middle"
          }, cg).textContent = r ? "\u2713" : "\xB7";
          return { cg, rank: i + 1, rel: r };
        });
        q.rels.forEach((r, i) => {
          const cx = strip.x + gutter + i * cell + (cell - 4) / 2;
          el("text", { x: cx, y: y + cell + 8, class: "mq-rank", "text-anchor": "middle" }, g).textContent = i + 1;
        });
        const ry = y + cell + 24;
        const rrTxt = el("text", { x: strip.x + gutter, y: ry, class: "mq-rr is-hidden" }, g);
        rrTxt.textContent = `RR = 1/${q.firstRank} = ${f4(q.rr)}`;
        const apLong = q.hits.length > 4;
        const apTxt = el("text", {
          x: strip.x + gutter,
          y: ry + 18,
          class: "mq-ap" + (apLong ? " mq-ap-sm" : "") + " is-hidden"
        }, g);
        apTxt.textContent = q.hits.length > 1 ? `AP = (${q.hits.map((h) => f2(h.precision)).join(" + ")}) / ${q.hits.length} = ${f4(q.ap)}` : `AP = ${f4(q.ap)}`;
        return { q, g, cells, rrTxt, apTxt, ry };
      });
      const lastRy = rowRefs[rowRefs.length - 1].ry + 18;
      const panelY = lastRy + 34;
      const px = strip.x;
      const mrrLayer = [];
      const mapLayer = [];
      const addMrr = (n) => {
        mrrLayer.push(n);
        return n;
      };
      const addMap = (n) => {
        mapLayer.push(n);
        return n;
      };
      addMrr(el("line", {
        x1: px,
        y1: panelY - 18,
        x2: px + strip.w - 8,
        y2: panelY - 18,
        class: "mq-divider"
      }, svg));
      addMrr(el("text", { x: px, y: panelY, class: "mq-avg-h mq-mrr-h" }, svg)).textContent = `MRR = (${f4(queries[0].rr)} + ${f4(queries[1].rr)}) / 2 = ${f4(mrr)}`;
      addMap(el("text", { x: px, y: panelY + 26, class: "mq-avg-h mq-map-h" }, svg)).textContent = `MAP = (${f4(queries[0].ap)} + ${f4(queries[1].ap)}) / 2 = ${f4(map)}`;
      addMap(el("text", { x: px, y: panelY + 50, class: "mq-lesson" }, svg)).textContent = labels.lesson || "Neither matches a single query \u2014 that is the point of a mean.";
      const H = frameHeightFor(panelY + 50);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        rowRefs.forEach((row) => {
          row.cells.forEach((c) => {
            const isFirst = c.rank === row.q.firstRank;
            c.cg.classList.toggle("is-first", k >= 1 && c.rel && isFirst);
            c.cg.classList.toggle("is-hit", k >= 2 && c.rel);
          });
          row.rrTxt.classList.toggle("is-hidden", k < 1);
          row.apTxt.classList.toggle("is-hidden", k < 2);
        });
        for (const node of mrrLayer) node.classList.toggle("is-hidden", k < 3);
        for (const node of mapLayer) node.classList.toggle("is-hidden", k < 4);
      };
    }
  });
})();
