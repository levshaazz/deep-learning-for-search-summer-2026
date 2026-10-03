/* AUTO-GENERATED offline classic bundle of widgets/bpe-merge-ledger/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/bpe-merge-ledger/logic.js
  var N_SHOWN = 6;
  var mountBpeMergeLedger = defineWidget({
    id: "bpe-merge-ledger",
    rootClass: "bpe-root",
    // Имя ОБЯЗАНО быть mount+PascalCase(id): deck-adapter ищет ровно window[mountName(id)].
    // Стояло 'mountBpeLedger' (без Merge) — виджет регистрировался под одним именем, а адаптер
    // искал под другим, и слайд 27a деки 02 ехал ПУСТЫМ. Ни один гейт этого не видел до G13.
    exportName: "mountBpeMergeLedger",
    maxStep: 5,
    render({ host, data, labels }) {
      const merges = (data.firstMerges || []).slice(0, N_SHOWN);
      const panel = document.createElement("div");
      panel.className = "wgt-panel bpe-panel";
      host.appendChild(panel);
      const head = document.createElement("div");
      head.className = "bpe-head";
      head.textContent = labels.head || "First learned merges (by frequency)";
      panel.appendChild(head);
      const rows = merges.map((m) => {
        const row = document.createElement("div");
        row.className = "bpe-row is-hidden";
        row.innerHTML = `<span class="bpe-rank">${String(m.rank).padStart(2, "0")}</span><span class="bpe-tok">${esc(m.left)}</span><span class="bpe-op">+</span><span class="bpe-tok">${esc(m.right)}</span><span class="bpe-op">\u2192</span><span class="bpe-tok bpe-joined">${esc(m.joined)}</span>`;
        panel.appendChild(row);
        return row;
      });
      return function update(k) {
        rows.forEach((r, i) => {
          r.classList.toggle("is-hidden", i > k);
          r.classList.toggle("is-new", i === k);
        });
      };
    }
  });
})();
