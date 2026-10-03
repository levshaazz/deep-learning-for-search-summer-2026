/* AUTO-GENERATED offline classic bundle of widgets/ru-paradigm/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ru-paradigm/logic.js
  var mountRuParadigm = defineWidget({
    id: "ru-paradigm",
    rootClass: "rp-root",
    exportName: "mountRuParadigm",
    maxStep: 5,
    render({ host, data, labels }) {
      const pw = data && data.paradigmWidget || {};
      const POS = [
        { key: "noun", name: labels.posNoun, d: pw.noun || {} },
        { key: "verb", name: labels.posVerb, d: pw.verb || {} },
        { key: "adj", name: labels.posAdj, d: pw.adjective || {} }
      ].filter((p) => p.d && (p.d.forms || p.d.cells));
      const tmpl = (s, vals) => String(s || "").replace(/\{(\w+)\}/g, (_, k) => vals[k] != null ? vals[k] : "");
      const uniq = (list) => {
        const seen = /* @__PURE__ */ new Set(), out = [];
        for (const w of list) if (!seen.has(w)) {
          seen.add(w);
          out.push(w);
        }
        return out;
      };
      const probeOf = (forms) => forms.reduce((a, b) => b.length > a.length ? b : a, forms[0] || "");
      const posIndex = () => {
        const want = host.dataset.pos;
        const i = POS.findIndex((p) => p.key === want);
        return i >= 0 ? i : 0;
      };
      const panel = document.createElement("div");
      panel.className = "wgt-panel rp-panel";
      host.appendChild(panel);
      const segRow = document.createElement("div");
      segRow.className = "rp-seg";
      const segHint = document.createElement("span");
      segHint.className = "rp-seg-hint";
      segHint.textContent = labels.posHint || "";
      segRow.appendChild(segHint);
      const segBtns = POS.map((p, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "rp-seg-b";
        b.textContent = p.name || p.key;
        b.addEventListener("click", () => {
          host.dataset.pos = p.key;
          build();
          apply(Number(host.dataset.step) || 0);
        });
        segRow.appendChild(b);
        return b;
      });
      panel.appendChild(segRow);
      const cols = document.createElement("div");
      cols.className = "rp-cols";
      panel.appendChild(cols);
      const left = document.createElement("div");
      left.className = "rp-col rp-left";
      cols.appendChild(left);
      const right = document.createElement("div");
      right.className = "rp-col rp-right";
      cols.appendChild(right);
      const lemmaCard = document.createElement("div");
      lemmaCard.className = "rp-lemma";
      left.appendChild(lemmaCard);
      const formsBox = document.createElement("div");
      formsBox.className = "rp-forms";
      left.appendChild(formsBox);
      const idxTag = document.createElement("div");
      idxTag.className = "rp-tag";
      idxTag.textContent = labels.indexTag || "";
      right.appendChild(idxTag);
      const counter = document.createElement("div");
      counter.className = "rp-count";
      right.appendChild(counter);
      const postBox = document.createElement("div");
      postBox.className = "rp-post";
      right.appendChild(postBox);
      const qRow = document.createElement("div");
      qRow.className = "rp-q";
      right.appendChild(qRow);
      const recallRow = document.createElement("div");
      recallRow.className = "rp-recall";
      right.appendChild(recallRow);
      let cur = null;
      function build() {
        const p = POS[posIndex()];
        segBtns.forEach((b, i) => {
          b.classList.toggle("is-on", i === posIndex());
          b.setAttribute("aria-pressed", i === posIndex() ? "true" : "false");
        });
        const forms = p.d.forms || (p.d.cells || []).map((c) => c[2]);
        const distinct = uniq(forms);
        const nTerms = typeof p.d.distinct === "number" ? p.d.distinct : distinct.length;
        const probe = probeOf(distinct);
        lemmaCard.innerHTML = "";
        const lt = document.createElement("span");
        lt.className = "rp-lemma-tag";
        lt.textContent = labels.lemmaTag || "";
        const lw = document.createElement("span");
        lw.className = "rp-lemma-w";
        lw.textContent = p.d.lemma || "";
        const lm = document.createElement("span");
        lm.className = "rp-lemma-meta";
        lm.textContent = p.d.slots ? tmpl(labels.slotsTmpl, { slots: p.d.slots, distinct: nTerms }) : tmpl(labels.formsTmpl, { n: forms.length, distinct: nTerms });
        lemmaCard.appendChild(lt);
        lemmaCard.appendChild(lw);
        lemmaCard.appendChild(lm);
        formsBox.innerHTML = "";
        const cellNodes = [];
        if (p.d.cells && p.d.cells.length) {
          const cases = uniq(p.d.cells.map((c) => c[0]));
          const nums = uniq(p.d.cells.map((c) => c[1]));
          const grid = document.createElement("div");
          grid.className = "rp-grid";
          grid.style.gridTemplateColumns = `minmax(0, 1.1fr) repeat(${nums.length}, minmax(0, 1fr))`;
          const head = document.createElement("span");
          head.className = "rp-gcell rp-gcell--head";
          head.textContent = labels.caseTag || "";
          grid.appendChild(head);
          nums.forEach((n) => {
            const h = document.createElement("span");
            h.className = "rp-gcell rp-gcell--head";
            h.textContent = n === "sg" ? labels.numSg || n : labels.numPl || n;
            grid.appendChild(h);
          });
          const seen = /* @__PURE__ */ new Set();
          cases.forEach((cs) => {
            const rc = document.createElement("span");
            rc.className = "rp-gcell rp-gcell--case";
            rc.textContent = cs;
            grid.appendChild(rc);
            nums.forEach((n) => {
              const cell = (p.d.cells.find((c) => c[0] === cs && c[1] === n) || [, , ""])[2];
              const node = document.createElement("span");
              node.className = "rp-gcell rp-gcell--form";
              const w = document.createElement("span");
              w.className = "rp-gform";
              w.textContent = cell;
              node.appendChild(w);
              const dup = seen.has(cell);
              if (dup) {
                node.classList.add("is-dup");
                const d = document.createElement("span");
                d.className = "rp-dup";
                d.textContent = labels.dupTag || "";
                node.appendChild(d);
              }
              seen.add(cell);
              grid.appendChild(node);
              cellNodes.push({ node, form: cell, dup });
            });
          });
          formsBox.appendChild(grid);
        } else {
          const list = document.createElement("div");
          list.className = "rp-list";
          forms.forEach((f) => {
            const node = document.createElement("span");
            node.className = "rp-gcell rp-gcell--form rp-listform";
            const w = document.createElement("span");
            w.className = "rp-gform";
            w.textContent = f;
            node.appendChild(w);
            list.appendChild(node);
            cellNodes.push({ node, form: f, dup: false });
          });
          formsBox.appendChild(list);
        }
        postBox.innerHTML = "";
        const postNodes = distinct.map((f) => {
          const chip = document.createElement("span");
          chip.className = "rp-plist";
          const t = document.createElement("span");
          t.className = "rp-pterm";
          t.textContent = f;
          const d = document.createElement("span");
          d.className = "rp-pdf";
          d.textContent = "df=1";
          chip.appendChild(t);
          chip.appendChild(d);
          postBox.appendChild(chip);
          return chip;
        });
        const lemmaChip = document.createElement("span");
        lemmaChip.className = "rp-plist rp-plist--lemma";
        const lct = document.createElement("span");
        lct.className = "rp-pterm";
        lct.textContent = p.d.lemma || "";
        const lcd = document.createElement("span");
        lcd.className = "rp-pdf";
        lcd.textContent = "df=" + nTerms;
        lemmaChip.appendChild(lct);
        lemmaChip.appendChild(lcd);
        postBox.appendChild(lemmaChip);
        const empty = document.createElement("span");
        empty.className = "rp-empty";
        empty.textContent = labels.emptyIndex || "";
        postBox.appendChild(empty);
        qRow.innerHTML = "";
        const qt = document.createElement("span");
        qt.className = "rp-qtag";
        qt.textContent = labels.queryTag || "";
        const qw = document.createElement("span");
        qw.className = "rp-qw";
        qw.textContent = probe;
        qRow.appendChild(qt);
        qRow.appendChild(qw);
        cur = { forms, distinct, nTerms, probe, cellNodes, postNodes, lemmaChip, empty };
      }
      function apply(k) {
        const c = cur;
        const folded = k >= 4;
        const asked = k >= 3;
        formsBox.classList.toggle("is-hidden", k < 1);
        lemmaCard.classList.toggle("is-lit", k >= 1);
        c.cellNodes.forEach((cell) => {
          cell.node.classList.toggle("is-on", k >= 1 && !cell.dup);
          cell.node.classList.toggle("is-hit", asked && cell.form === c.probe);
        });
        c.empty.classList.toggle("is-hidden", k >= 2);
        c.postNodes.forEach((chip) => {
          chip.classList.toggle("is-hidden", k < 2 || folded);
          chip.classList.toggle("is-hit", asked && !folded && chip.querySelector(".rp-pterm").textContent === c.probe);
          chip.classList.toggle("is-dim", asked && !folded && chip.querySelector(".rp-pterm").textContent !== c.probe);
        });
        c.lemmaChip.classList.toggle("is-hidden", !folded);
        c.lemmaChip.classList.toggle("is-hit", k >= 5);
        counter.classList.toggle("is-hidden", k < 2);
        counter.textContent = tmpl(labels.termsTmpl, { n: folded ? 1 : c.nTerms });
        counter.classList.toggle("is-good", folded);
        qRow.classList.toggle("is-hidden", !asked);
        recallRow.classList.toggle("is-hidden", !asked);
        const hit = k >= 5 ? c.nTerms : 1;
        recallRow.textContent = tmpl(labels.recallTmpl, { hit, all: c.nTerms });
        recallRow.classList.toggle("is-good", k >= 5);
        recallRow.classList.toggle("is-bad", asked && k < 5);
      }
      build();
      return function update(k) {
        apply(k);
      };
    }
  });
})();
