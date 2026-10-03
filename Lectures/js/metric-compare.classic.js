/* AUTO-GENERATED offline classic bundle of widgets/metric-compare/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/metric-compare/logic.js
  var mountMetricCompare = defineWidget({
    id: "metric-compare",
    rootClass: "mc-root",
    exportName: "mountMetricCompare",
    maxStep: 4,
    render({ host, data, labels }) {
      const pair = data.pair || {};
      const rank = data.ranking || {};
      const cands = rank.candidates || {};
      const top1 = rank.top1 || {};
      const candIds = Object.keys(cands);
      const vec = (arr) => "[" + (arr || []).join(", ") + "]";
      const panel = document.createElement("div");
      panel.className = "wgt-panel mc-panel";
      host.appendChild(panel);
      const pairBox = document.createElement("div");
      pairBox.className = "mc-pair";
      pairBox.innerHTML = `<div class="mc-pair-head">${esc(labels.pairHead || "one vector pair")}</div><div class="mc-vrow"><span class="mc-vname mc-a">a</span><span class="mc-vval">${esc(vec(pair.a))}</span><span class="mc-norm">\u2016a\u2016 = ${esc(pair.aNorm)}</span></div><div class="mc-vrow"><span class="mc-vname mc-b">b</span><span class="mc-vval">${esc(vec(pair.b))}</span><span class="mc-norm">\u2016b\u2016 = ${esc(pair.bNorm)}</span></div>`;
      panel.appendChild(pairBox);
      const metrics = document.createElement("div");
      metrics.className = "mc-metrics";
      panel.appendChild(metrics);
      function metricRow(cls, from, name, formula, value, note) {
        const r = document.createElement("div");
        r.className = `mc-metric ${cls} is-hidden`;
        r.dataset.from = String(from);
        r.innerHTML = `<span class="mc-mname">${esc(name)}</span><span class="mc-mform">${esc(formula)}</span><span class="mc-mval">${esc(value)}</span>` + (note ? `<span class="mc-mnote">${esc(note)}</span>` : "");
        metrics.appendChild(r);
        return r;
      }
      const rowL2 = metricRow("mc-l2", 1, labels.l2 || "L2 distance", "\u2016a \u2212 b\u2016", pair.l2, labels.l2note || "smaller = nearer");
      const rowCos = metricRow(
        "mc-cos",
        2,
        labels.cosine || "cosine similarity",
        "a\xB7b / (\u2016a\u2016\u2016b\u2016)",
        pair.cosine,
        `${labels.cosNote || "unit-vector dot ="} ${pair.normalizedDot}`
      );
      const rowDot = metricRow(
        "mc-dot",
        3,
        labels.dot || "inner product",
        "a \xB7 b",
        pair.dot,
        labels.dotNote || "grows with magnitude"
      );
      const metricRows = [rowL2, rowCos, rowDot];
      const rankBox = document.createElement("div");
      rankBox.className = "mc-rank is-hidden";
      let html = `<div class="mc-rank-head">${esc(labels.rankHead || "one query, three candidates \u2014 the metrics disagree")}</div><div class="mc-rank-q">${esc(labels.query || "query")} q = ${esc(vec(rank.query))}</div><table class="mc-rank-table"><tr class="mc-rank-colhdr"><th>${esc(labels.cand || "candidate")}</th><th class="mc-col-l2">${esc(labels.l2short || "L2")}</th><th class="mc-col-cos">${esc(labels.cosShort || "cosine")}</th><th class="mc-col-dot">${esc(labels.dotShort || "a\xB7b")}</th></tr>`;
      candIds.forEach((id) => {
        const c = cands[id];
        html += `<tr class="mc-rank-row" data-id="${esc(id)}"><td class="mc-cand"><b>${esc(id)}</b> ${esc(vec(c.vector))}</td><td class="mc-cell mc-cell-l2${top1.l2 === id ? " is-top1" : ""}">${esc(c.l2)}</td><td class="mc-cell mc-cell-cos${top1.cosine === id ? " is-top1" : ""}">${esc(c.cosine)}</td><td class="mc-cell mc-cell-dot${top1.innerProduct === id ? " is-top1" : ""}">${esc(c.dot)}</td></tr>`;
      });
      html += `</table><div class="mc-verdict"><span class="mc-v-l2">${esc(labels.l2short || "L2")} \u2192 <b>${esc(top1.l2)}</b></span><span class="mc-v-cos">${esc(labels.cosShort || "cosine")} \u2192 <b>${esc(top1.cosine)}</b></span><span class="mc-v-dot">${esc(labels.dotShort || "a\xB7b")} \u2192 <b>${esc(top1.innerProduct)}</b></span></div><div class="mc-lesson">${esc(labels.lesson || "three metrics, three different winners \u2014 the metric choice changes the answer")}</div>`;
      rankBox.innerHTML = html;
      panel.appendChild(rankBox);
      return function update(k) {
        metricRows.forEach((r) => r.classList.toggle("is-hidden", k < Number(r.dataset.from)));
        metricRows.forEach((r) => r.classList.toggle("is-fresh", k === Number(r.dataset.from)));
        rankBox.classList.toggle("is-hidden", k < 4);
        pairBox.classList.toggle("is-faded", k >= 4);
        metrics.classList.toggle("is-faded", k >= 4);
      };
    }
  });
})();
