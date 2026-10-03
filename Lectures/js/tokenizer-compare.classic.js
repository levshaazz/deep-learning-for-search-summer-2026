/* AUTO-GENERATED offline classic bundle of widgets/tokenizer-compare/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/tokenizer-compare/logic.js
  var RANK_CLASS = { 1: "tc-row--best", 2: "tc-row--mid1", 3: "tc-row--mid2", 4: "tc-row--worst" };
  var mountTokenizerCompare = defineWidget({
    id: "tokenizer-compare",
    rootClass: "tc-root",
    exportName: "mountTokenizerCompare",
    maxStep: 5,
    render({ host, data, labels }) {
      const sample = data.sample || "";
      const sampleWords = data.sampleWords || sample.split(/\s+/).filter(Boolean);
      const toks = (data.tokenizers || []).slice().sort((a, b) => (a.rank || 99) - (b.rank || 99));
      const maxCount = toks.reduce((m, t) => Math.max(m, t.count || 0), 1);
      const panel = document.createElement("div");
      panel.className = "wgt-panel tc-panel";
      host.appendChild(panel);
      const input = document.createElement("div");
      input.className = "tc-region tc-input";
      const inputHead = document.createElement("div");
      inputHead.className = "tc-head";
      inputHead.textContent = labels.inputHead || "The same input, four cutters";
      input.appendChild(inputHead);
      const inputRow = document.createElement("div");
      inputRow.className = "tc-input-row";
      sampleWords.forEach((w) => {
        const chip = document.createElement("span");
        chip.className = "tc-tok tc-tok--word";
        chip.textContent = w;
        inputRow.appendChild(chip);
      });
      input.appendChild(inputRow);
      panel.appendChild(input);
      const grid = document.createElement("div");
      grid.className = "tc-grid";
      panel.appendChild(grid);
      const markerNote = (m) => m === "##" ? labels.markerHash || "" : m === "\u0120" ? labels.markerSpace || "" : "";
      const rows = toks.map((t) => {
        const row = document.createElement("div");
        row.className = "tc-row is-hidden";
        const rowHead = document.createElement("div");
        rowHead.className = "tc-row-head";
        const name = document.createElement("span");
        name.className = "tc-name";
        name.textContent = t.name;
        const fam = document.createElement("span");
        fam.className = "tc-fam";
        fam.textContent = t.family || "";
        const badge = document.createElement("span");
        badge.className = "tc-badge";
        badge.innerHTML = `<span class="tc-badge-n">${esc(t.count)}</span><span class="tc-badge-lab">${esc(labels.tokensLab || "tokens")}</span>`;
        rowHead.appendChild(name);
        rowHead.appendChild(fam);
        rowHead.appendChild(badge);
        row.appendChild(rowHead);
        const CHIP_CAP = 16;
        const allToks = t.tokens || [];
        const capped = allToks.length > CHIP_CAP;
        const shown = capped ? allToks.slice(0, CHIP_CAP) : allToks;
        const chips = document.createElement("div");
        chips.className = "tc-toks";
        shown.forEach((tok) => {
          const c = document.createElement("span");
          c.className = "tc-tok";
          if (t.marker === "##" && tok.startsWith("##")) {
            c.classList.add("tc-tok--cont");
            c.innerHTML = `<span class="tc-mark">##</span>${esc(tok.slice(2))}`;
          } else if (t.marker === "\u0120" && tok.startsWith("\u0120")) {
            c.classList.add("tc-tok--space");
            c.innerHTML = `<span class="tc-mark">\u2423</span>${esc(tok.slice(1)) || ""}`;
          } else {
            c.textContent = tok;
          }
          chips.appendChild(c);
        });
        if (capped) {
          const more = document.createElement("span");
          more.className = "tc-tok tc-tok--more";
          const n = allToks.length - CHIP_CAP;
          const tmpl = labels.moreChip || "\u2026 +{n} more";
          more.textContent = tmpl.replace("{n}", String(n));
          chips.appendChild(more);
        }
        row.appendChild(chips);
        const bar = document.createElement("div");
        bar.className = "tc-bar";
        const fill = document.createElement("span");
        fill.className = "tc-bar-fill";
        fill.style.width = Math.max(6, Math.round((t.count || 0) / maxCount * 100)) + "%";
        bar.appendChild(fill);
        const note = document.createElement("span");
        note.className = "tc-note";
        note.textContent = markerNote(t.marker);
        row.appendChild(bar);
        row.appendChild(note);
        grid.appendChild(row);
        return { row, rank: t.rank };
      });
      const verdict = document.createElement("div");
      verdict.className = "tc-verdict is-hidden";
      verdict.textContent = labels.verdict || "Fewer tokens = more efficient";
      panel.appendChild(verdict);
      return function update(k) {
        const revealed = Math.max(0, Math.min(rows.length, k));
        const ranked = k >= rows.length + 1;
        rows.forEach((r, i) => {
          const show = i < revealed;
          r.row.classList.toggle("is-hidden", !show);
          r.row.classList.toggle("is-new", show && i === revealed - 1 && !ranked);
          const rankCls = RANK_CLASS[r.rank];
          if (rankCls) r.row.classList.toggle(rankCls, ranked);
          r.row.classList.toggle("is-ranked", ranked);
        });
        verdict.classList.toggle("is-hidden", !ranked);
      };
    }
  });
})();
