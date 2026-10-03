/* AUTO-GENERATED offline classic bundle of widgets/query-rewriter/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/query-rewriter/logic.js
  var TECHS = ["raw", "rm3", "hyde"];
  var mountQueryRewriter = defineWidget({
    id: "query-rewriter",
    rootClass: "qrw-root",
    maxStep: 3,
    render({ host, data, labels, esc: esc2, fmt: fmt2 }) {
      host.classList.add("wgt-panel");
      const T = data.techniques || {};
      const gold = data.goldDocId, trap = data.trapDocId;
      const corpus = data.corpus || {};
      const name = { raw: labels.techRaw || "raw", rm3: labels.techRm3 || "RM3", hyde: labels.techHyde || "HyDE" };
      const head = document.createElement("div");
      head.className = "qrw-head";
      host.appendChild(head);
      const body = document.createElement("div");
      body.className = "qrw-body";
      host.appendChild(body);
      const listCol = document.createElement("div");
      listCol.className = "qrw-list";
      body.appendChild(listCol);
      const detail = document.createElement("div");
      detail.className = "qrw-detail";
      body.appendChild(detail);
      const compare = document.createElement("div");
      compare.className = "qrw-compare is-hidden";
      host.appendChild(compare);
      const gloss = (id) => (corpus[id] || []).slice(0, 2).join(", ");
      function renderTech(t) {
        const info = T[t] || {};
        head.innerHTML = "";
        const tag = document.createElement("span");
        tag.className = "qrw-tech";
        tag.textContent = name[t];
        head.appendChild(tag);
        const metrics = document.createElement("span");
        metrics.className = "qrw-metrics";
        metrics.innerHTML = `${esc2(labels.rankWord || "gold rank")} <b>${info.goldRank}</b> \xB7 ${esc2(labels.rrWord || "RR")} <b>${fmt2(info.rr, 2)}</b> \xB7 <span class="qrw-cost">${info.llmCalls} ${esc2(labels.callsWord || "LLM calls")}</span>`;
        head.appendChild(metrics);
        listCol.innerHTML = "";
        (info.rankedList || []).forEach((id, i) => {
          const row = document.createElement("div");
          row.className = "qrw-row";
          if (id === gold) row.classList.add("is-gold");
          if (id === trap) row.classList.add("is-trap");
          let tagHtml = "";
          if (id === gold) tagHtml = `<span class="qrw-tag qrw-tag-gold">${esc2(labels.goldTag || "gold")}</span>`;
          else if (id === trap) tagHtml = `<span class="qrw-tag qrw-tag-trap">${esc2(labels.trapTag || "trap")}</span>`;
          row.innerHTML = `<span class="qrw-rank">${i + 1}</span><span class="qrw-doc">${esc2(id)}</span><span class="qrw-gloss">${esc2(gloss(id))}</span>${tagHtml}`;
          listCol.appendChild(row);
        });
        let dlabel = labels.queryWord || "query", dtext = data.query || "";
        if (t === "rm3") {
          dlabel = labels.addedWord || "RM3 added terms";
          dtext = (info.addedTerms || []).join(", ");
        } else if (t === "hyde") {
          dlabel = labels.pseudoWord || "HyDE hypothetical answer";
          dtext = info.hypotheticalDoc || "";
        }
        detail.innerHTML = `<div class="qrw-dlabel">${esc2(dlabel)}</div><div class="qrw-dtext">${esc2(dtext)}</div>`;
      }
      function renderCompare() {
        compare.innerHTML = `<div class="qrw-ctitle">${esc2(labels.compareTitle || "RR vs cost")}</div>`;
        TECHS.forEach((t) => {
          const info = T[t] || {};
          const rr = info.rr || 0, calls = info.llmCalls || 0;
          const row = document.createElement("div");
          row.className = "qrw-bar-row";
          row.innerHTML = `<span class="qrw-blabel">${esc2(name[t])}</span><span class="qrw-bar"><span class="qrw-bar-fill${t === "hyde" ? " is-best" : ""}" style="width:${Math.round(rr * 100)}%"></span></span><span class="qrw-bval">${esc2(labels.rrWord || "RR")} ${fmt2(rr, 2)} \xB7 ${"\u2726".repeat(calls) || "\u2014"}</span>`;
          compare.appendChild(row);
        });
      }
      return function update(k) {
        const compareOn = k >= 3;
        head.classList.toggle("is-hidden", compareOn);
        body.classList.toggle("is-hidden", compareOn);
        compare.classList.toggle("is-hidden", !compareOn);
        if (compareOn) renderCompare();
        else renderTech(TECHS[Math.max(0, Math.min(2, k))]);
      };
    }
  });
})();
