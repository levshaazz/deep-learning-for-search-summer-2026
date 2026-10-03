/* AUTO-GENERATED offline classic bundle of widgets/rrf-fusion/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/rrf-fusion/logic.js
  var mountRrfFusion = defineWidget({
    id: "rrf-fusion",
    rootClass: "rrf-root",
    maxStep: 4,
    render({ host, data, labels }) {
      var _a, _b, _c, _d;
      const k = data.k;
      const bm25 = ((_a = data.lists) == null ? void 0 : _a.bm25) || [];
      const cosine = ((_b = data.lists) == null ? void 0 : _b.cosine) || [];
      const order = data.order || [];
      const fused = data.fused || [];
      const top = fused[0] || null;
      const grid = document.createElement("div");
      grid.className = "rrf-grid";
      host.appendChild(grid);
      function buildColumn(role, headKey, ids, kind, rankKey) {
        const col = document.createElement("div");
        col.className = "rrf-col";
        col.dataset.role = role;
        col.dataset.kind = kind;
        const head = document.createElement("div");
        head.className = "rrf-head";
        head.textContent = labels[headKey] || role;
        col.appendChild(head);
        const list = document.createElement("div");
        list.className = "rrf-list";
        col.appendChild(list);
        const chips = ids.map((id, i) => {
          const rank = i + 1;
          const chip = document.createElement("div");
          chip.className = "rrf-chip";
          chip.dataset.id = id;
          chip.dataset.rank = String(rank);
          chip.innerHTML = `<span class="rrf-rank">${rank}</span><span class="rrf-docid">${esc(id)}</span><span class="rrf-recip"></span>`;
          list.appendChild(chip);
          return chip;
        });
        grid.appendChild(col);
        return { col, list, chips };
      }
      const colA = buildColumn("bm25", "headBm25", bm25, "input");
      const colB = buildColumn("cosine", "headCosine", cosine, "input");
      const colF = buildColumn("fused", "headFused", order, "fused");
      const byId = Object.fromEntries(fused.map((d) => [d.id, d]));
      const rows = order.map((id) => byId[id]).filter(Boolean);
      function tieGroup(list) {
        const groups = /* @__PURE__ */ new Map();
        list.forEach((d) => {
          const key = d.rrf.toFixed(6);
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(d.id);
        });
        for (const ids of groups.values()) if (ids.length >= 2) return new Set(ids);
        return /* @__PURE__ */ new Set();
      }
      function upsetPair(list) {
        for (let i = 1; i < list.length; i++) {
          const win = list[i - 1], lose = list[i];
          if (ties.has(win.id) && ties.has(lose.id)) continue;
          const loserBeatsOnOne = lose.rankBm25 < win.rankBm25 || lose.rankCosine < win.rankCosine;
          if (loserBeatsOnOne) return { winner: win.id, loser: lose.id };
        }
        return null;
      }
      const ties = tieGroup(rows);
      const upset = upsetPair(rows);
      const table = document.createElement("div");
      table.className = "rrf-table is-hidden";
      table.setAttribute("role", "table");
      const thead = document.createElement("div");
      thead.className = "rrf-trow rrf-thead";
      thead.setAttribute("role", "row");
      thead.innerHTML = `<span class="rrf-th rrf-th-doc">${esc(labels.tblDoc || "Doc")}</span><span class="rrf-th rrf-th-rk" data-role="bm25">${esc(labels.headBm25 || "A")}</span><span class="rrf-th rrf-th-rk" data-role="cosine">${esc(labels.headCosine || "B")}</span><span class="rrf-th rrf-th-rrf">${esc(labels.tblRrf || "RRF")}</span>`;
      table.appendChild(thead);
      const fmt6 = (n) => typeof n === "number" ? n.toFixed(6) : "";
      rows.forEach((d) => {
        const row = document.createElement("div");
        row.className = "rrf-trow";
        row.setAttribute("role", "row");
        row.dataset.id = d.id;
        if (ties.has(d.id)) row.classList.add("is-tie");
        if (upset && d.id === upset.winner) row.classList.add("is-upset-win");
        if (upset && d.id === upset.loser) row.classList.add("is-upset-lose");
        row.innerHTML = `<span class="rrf-td rrf-td-doc">${esc(d.id)}</span><span class="rrf-td rrf-td-rk" data-role="bm25">${d.rankBm25}</span><span class="rrf-td rrf-td-rk" data-role="cosine">${d.rankCosine}</span><span class="rrf-td rrf-td-rrf">${fmt6(d.rrf)}</span>`;
        table.appendChild(row);
      });
      const note = document.createElement("div");
      note.className = "rrf-note";
      const tieNote = document.createElement("div");
      tieNote.className = "rrf-note-line is-tie";
      if (ties.size >= 2) {
        const ids = [...ties];
        const a = byId[ids[0]], b = byId[ids[1]];
        const tpl = labels.tieNote || "{a} and {b} TIE at {score}: {a} = 1/({k}+{ar1})+1/({k}+{ar2}), {b} = 1/({k}+{br1})+1/({k}+{br2}) \u2014 same sum, ranks just swapped.";
        tieNote.textContent = tpl.replace("{a}", a.id).replace("{a}", a.id).replace("{b}", b.id).replace("{b}", b.id).replace("{score}", fmt6(a.rrf)).replaceAll("{k}", String(k)).replace("{ar1}", String(a.rankBm25)).replace("{ar2}", String(a.rankCosine)).replace("{br1}", String(b.rankBm25)).replace("{br2}", String(b.rankCosine));
        note.appendChild(tieNote);
      }
      if (upset) {
        const w = byId[upset.winner], l = byId[upset.loser];
        const lBest = Math.min(l.rankBm25, l.rankCosine);
        const upsetLine = document.createElement("div");
        upsetLine.className = "rrf-note-line is-upset";
        const tpl = labels.upsetNote || "{loser} ranked {lbest} by one ranker, yet {winner} \u2014 only ({wr1},{wr2}) \u2014 outscores it ({ws} > {ls}): middling by both beats high by one.";
        upsetLine.textContent = tpl.replace("{loser}", l.id).replace("{lbest}", String(lBest)).replace("{winner}", w.id).replace("{wr1}", String(w.rankBm25)).replace("{wr2}", String(w.rankCosine)).replace("{ws}", fmt6(w.rrf)).replace("{ls}", fmt6(l.rrf));
        note.appendChild(upsetLine);
      }
      const score = document.createElement("div");
      score.className = "rrf-score is-hidden";
      if (top) {
        const fmt2 = (n) => typeof n === "number" ? n.toFixed(6) : "";
        score.innerHTML = `<span class="rrf-docid">${esc(top.id)}</span><span class="rrf-sum"><span class="rrf-term">${fmt2((_c = top.contributions) == null ? void 0 : _c.bm25)}</span><span class="rrf-op">+</span><span class="rrf-term">${fmt2((_d = top.contributions) == null ? void 0 : _d.cosine)}</span><span class="rrf-op">=</span><span class="rrf-total">${fmt2(top.rrf)}</span></span>`;
      }
      colF.col.appendChild(score);
      host.appendChild(table);
      if (note.childElementCount) {
        note.classList.add("is-hidden");
        host.appendChild(note);
      }
      function chipOf(set, id) {
        return set.chips.find((c) => c.dataset.id === id) || null;
      }
      return function update(s) {
        colF.col.classList.toggle("is-hidden", s < 2);
        score.classList.toggle("is-hidden", s < 2);
        table.classList.toggle("is-hidden", s < 4);
        note.classList.toggle("is-hidden", s < 4);
        [colA, colB, colF].forEach((set) => {
          set.chips.forEach((c) => {
            c.classList.remove("is-pick", "is-top");
            c.querySelector(".rrf-recip").textContent = "";
          });
        });
        if (s >= 1 && top) {
          const a = chipOf(colA, top.id);
          const b = chipOf(colB, top.id);
          if (a) {
            a.classList.add("is-pick");
            a.querySelector(".rrf-recip").textContent = reciprocalText(k, top.rankBm25);
          }
          if (b) {
            b.classList.add("is-pick");
            b.querySelector(".rrf-recip").textContent = reciprocalText(k, top.rankCosine);
          }
        }
        if (s >= 3 && top) {
          const f = chipOf(colF, top.id);
          if (f) {
            f.classList.add("is-top");
            const pos = colF.chips.indexOf(f) + 1;
            f.querySelector(".rrf-recip").textContent = `#${top.rankBm25} \xB7 #${top.rankCosine} \u2192 #${pos}`;
          }
        }
      };
    }
  });
  function reciprocalText(k, rank) {
    return `1/(${k}+${rank})`;
  }
})();
