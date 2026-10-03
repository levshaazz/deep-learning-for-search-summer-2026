/* AUTO-GENERATED offline classic bundle of widgets/inverted-index/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/inverted-index/logic.js
  var mountInvertedIndex = defineWidget({
    id: "inverted-index",
    rootClass: "ix-root",
    maxStep: 3,
    render({ host, data, labels }) {
      const docs = data.docs || [];
      const query = data.query || [];
      const t1 = query[0];
      const t2 = query[1];
      const terms = data.terms || {};
      const post1 = terms[t1] && terms[t1].postings || [];
      const post2 = terms[t2] && terms[t2].postings || [];
      const set1 = new Set(post1);
      const set2 = new Set(post2);
      const intersection = data.andMerge && data.andMerge.intersection || [];
      const hit = new Set(intersection);
      const grid = document.createElement("div");
      grid.className = "wgt-panel ix-grid";
      host.appendChild(grid);
      const cards = docs.map((d) => {
        const card = document.createElement("div");
        card.className = "ix-card";
        card.dataset.id = d.id;
        card.innerHTML = `<span class="ix-card-id">${esc(d.id)}</span><span class="ix-card-snip">${esc(d.snippet || "")}</span>`;
        const marks = document.createElement("span");
        marks.className = "ix-marks";
        const m1 = document.createElement("span");
        m1.className = "ix-mark ix-mark-1 is-hidden";
        const m2 = document.createElement("span");
        m2.className = "ix-mark ix-mark-2 is-hidden";
        marks.appendChild(m1);
        marks.appendChild(m2);
        card.appendChild(marks);
        grid.appendChild(card);
        return { card, m1, m2, id: d.id };
      });
      const postings = document.createElement("div");
      postings.className = "wgt-panel ix-postings";
      host.appendChild(postings);
      const row1 = postingsRow(t1, post1, terms[t1] && terms[t1].df, "ix-prow-1");
      const row2 = postingsRow(t2, post2, terms[t2] && terms[t2].df, "ix-prow-2");
      row1.classList.add("is-hidden");
      row2.classList.add("is-hidden");
      postings.appendChild(row1);
      postings.appendChild(row2);
      const merge = document.createElement("div");
      merge.className = "ix-merge is-hidden";
      const op = `${esc(t1)} ${labels.andOp || "AND"} ${esc(t2)}`;
      const ids = intersection.length ? intersection.map((id) => esc(id)).join(", ") : labels.empty || "\u2205";
      merge.innerHTML = `<span class="ix-merge-op">${op}</span><span class="ix-merge-arrow">\u2192</span><span class="ix-merge-set">[ ${ids} ]</span>`;
      postings.appendChild(merge);
      return function update(k) {
        row1.classList.toggle("is-hidden", k < 1);
        row2.classList.toggle("is-hidden", k < 2);
        merge.classList.toggle("is-hidden", k < 3);
        cards.forEach((c) => {
          const in1 = set1.has(c.id);
          const in2 = set2.has(c.id);
          c.m1.classList.toggle("is-hidden", !(k >= 1 && in1));
          c.m2.classList.toggle("is-hidden", !(k >= 2 && in2));
          const won = hit.has(c.id);
          c.card.classList.toggle("is-hit", k >= 3 && won);
          c.card.classList.toggle("is-dim", k >= 3 && !won);
          c.card.classList.toggle(
            "is-marked",
            k < 3 && (k >= 1 && in1 || k >= 2 && in2)
          );
        });
      };
    }
  });
  function postingsRow(term, postings, df, cls) {
    const row = document.createElement("div");
    row.className = `ix-prow ${cls}`;
    const dfTxt = df == null ? postings.length : df;
    const list = postings.map((id) => `<span class="ix-pid">${esc(id)}</span>`).join("");
    row.innerHTML = `<span class="ix-term">${esc(term)}</span><span class="ix-df">df=${esc(dfTxt)}</span><span class="ix-arrow">\u2192</span><span class="ix-plist">${list}</span>`;
    return row;
  }
})();
