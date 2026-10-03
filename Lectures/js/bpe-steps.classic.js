/* AUTO-GENERATED offline classic bundle of widgets/bpe-steps/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/bpe-steps/logic.js
  var mountBpeSteps = defineWidget({
    id: "bpe-steps",
    rootClass: "bps-root",
    exportName: "mountBpeSteps",
    maxStep: 9,
    render({ host, data, labels }) {
      const steps = data.steps || [];
      const eow = data.eow || "</w>";
      const panel = document.createElement("div");
      panel.className = "wgt-panel bps-panel";
      host.appendChild(panel);
      const corpus = document.createElement("div");
      corpus.className = "bps-region bps-corpus";
      const corpusHead = document.createElement("div");
      corpusHead.className = "bps-head";
      corpusHead.textContent = labels.corpusHead || "Corpus \u2014 current tokens";
      corpus.appendChild(corpusHead);
      const corpusBody = document.createElement("div");
      corpusBody.className = "bps-corpus-body";
      corpus.appendChild(corpusBody);
      panel.appendChild(corpus);
      const tally = document.createElement("div");
      tally.className = "bps-region bps-tally";
      const tallyHead = document.createElement("div");
      tallyHead.className = "bps-head";
      tallyHead.textContent = labels.tallyHead || "Count adjacent pairs";
      tally.appendChild(tallyHead);
      const tallyBody = document.createElement("div");
      tallyBody.className = "bps-tally-body";
      tally.appendChild(tallyBody);
      panel.appendChild(tally);
      const merge = document.createElement("div");
      merge.className = "bps-region bps-merge";
      const mergeHead = document.createElement("div");
      mergeHead.className = "bps-head";
      mergeHead.textContent = labels.mergeHead || "Merge the winner";
      merge.appendChild(mergeHead);
      const mergeBody = document.createElement("div");
      mergeBody.className = "bps-merge-body";
      merge.appendChild(mergeBody);
      panel.appendChild(merge);
      const chip = (text, kind) => {
        const c = document.createElement("span");
        c.className = "bps-tok" + (kind ? " bps-tok--" + kind : "");
        c.textContent = text;
        if (text === eow) c.classList.add("bps-tok--eow");
        return c;
      };
      function drawCorpus(st, before) {
        corpusBody.innerHTML = "";
        const rows = before ? st.tokensBefore || st.tokensAfter || [] : st.tokensAfter || st.tokensBefore || [];
        const winnerJoined = before ? null : st.winner ? st.winner.joined : null;
        rows.forEach((entry) => {
          const row = document.createElement("div");
          row.className = "bps-word-row";
          const lab = document.createElement("span");
          lab.className = "bps-word-lab";
          lab.innerHTML = `<span class="bps-word">${esc(entry.word)}</span><span class="bps-freq">${esc(labels.freqMark || "\xD7")}${esc(entry.freq)}</span>`;
          row.appendChild(lab);
          const toks = document.createElement("span");
          toks.className = "bps-toks";
          (entry.tokens || []).forEach((t) => {
            toks.appendChild(chip(t, t === winnerJoined ? "merged" : ""));
          });
          row.appendChild(toks);
          corpusBody.appendChild(row);
        });
      }
      function drawTally(st, showWinner) {
        tallyBody.innerHTML = "";
        const tieSet = new Set(st.tie || []);
        (st.tally || []).forEach((p) => {
          const isWin = showWinner && p.isWinner;
          const r = document.createElement("div");
          r.className = "bps-pair-row" + (isWin ? " is-winner" : "");
          const isTie = showWinner && tieSet.has(p.joined) && !p.isWinner;
          if (isTie) r.classList.add("is-tie");
          const pairCell = document.createElement("span");
          pairCell.className = "bps-pair";
          pairCell.innerHTML = `<span class="bps-tok bps-tok--mini">${esc(p.left)}</span><span class="bps-op">\xB7</span><span class="bps-tok bps-tok--mini">${esc(p.right)}</span>`;
          r.appendChild(pairCell);
          const bar = document.createElement("span");
          bar.className = "bps-bar";
          const fill = document.createElement("span");
          fill.className = "bps-bar-fill";
          const top = st.tally && st.tally[0] && st.tally[0].count || p.count || 1;
          fill.style.width = Math.max(6, Math.round(p.count / top * 100)) + "%";
          bar.appendChild(fill);
          r.appendChild(bar);
          const cnt = document.createElement("span");
          cnt.className = "bps-count";
          cnt.textContent = String(p.count);
          r.appendChild(cnt);
          const tag = document.createElement("span");
          tag.className = "bps-tag";
          if (isWin) {
            const winnerTied = tieSet.has(p.joined);
            tag.textContent = winnerTied ? labels.winnerTieTag || "max\xB7tie-break" : labels.winnerTag || "max";
            tag.classList.add("bps-tag--win");
          } else if (isTie) {
            tag.textContent = labels.tieTag || "tie";
            tag.classList.add("bps-tag--tie");
          }
          r.appendChild(tag);
          tallyBody.appendChild(r);
        });
      }
      function encodeUnseen(word, merges) {
        let toks = word.split("").concat([eow]);
        merges.forEach((m) => {
          for (let i = 0; i < toks.length - 1; ) {
            if (toks[i] === m.left && toks[i + 1] === m.right) toks.splice(i, 2, m.joined);
            else i += 1;
          }
        });
        return toks;
      }
      function drawMerge(st) {
        mergeBody.innerHTML = "";
        const w = st.winner;
        if (!w) return;
        const rule = document.createElement("div");
        rule.className = "bps-rule";
        rule.innerHTML = `<span class="bps-rule-lab">${esc(labels.mergeRule || "rule")}</span><span class="bps-tok">${esc(w.left)}</span><span class="bps-op">+</span><span class="bps-tok">${esc(w.right)}</span><span class="bps-op bps-arrow">\u2192</span><span class="bps-tok bps-tok--merged">${esc(w.joined)}</span>`;
        mergeBody.appendChild(rule);
        const bd = w.breakdown || [];
        if (bd.length) {
          const work = document.createElement("div");
          work.className = "bps-work";
          const terms = bd.map((b) => `<span class="bps-term"><span class="bps-word">${esc(b.word)}</span><span class="bps-freq">${esc(labels.freqMark || "\xD7")}${esc(b.freq)}</span></span>`).join('<span class="bps-op">+</span>');
          work.innerHTML = `<span class="bps-op">=</span>${terms}<span class="bps-op">=</span><span class="bps-sum">${esc(w.count)}</span>`;
          mergeBody.appendChild(work);
        }
      }
      return function update(k) {
        const mergeIdx = Math.min(steps.length - 1, Math.floor(k / 2));
        const isMergePhase = k % 2 === 1;
        const st = steps[mergeIdx] || steps[steps.length - 1];
        if (!st) return;
        drawCorpus(st, !isMergePhase);
        drawTally(st, isMergePhase);
        if (isMergePhase) {
          drawMerge(st);
          if (k === 9 && (data.merges || []).length) {
            const word = data.unseenWord || "lowest";
            const pieces = encodeUnseen(word, data.merges);
            const row = document.createElement("div");
            row.className = "bps-unseen";
            row.innerHTML = `<span class="bps-rule-lab">${esc(labels.unseenLab || "unseen word")}</span><span class="bps-word">${esc(word)}</span><span class="bps-op bps-arrow">\u2192</span>` + pieces.map((t) => `<span class="bps-tok bps-tok--merged">${esc(t)}</span>`).join("") + `<span class="bps-unseen-note">${esc(labels.noUnk || "no [UNK]")}</span>`;
            mergeBody.appendChild(row);
          }
        } else {
          mergeBody.innerHTML = "";
          const hint = document.createElement("div");
          hint.className = "bps-merge-hint";
          hint.textContent = labels.countHint || "Pick the max next \u2192";
          mergeBody.appendChild(hint);
        }
      };
    }
  });
})();
