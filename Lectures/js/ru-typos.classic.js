/* AUTO-GENERATED offline classic bundle of widgets/ru-typos/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/ru-typos/logic.js
  var KEY_ROWS = ["`qwertyuiop[]", "asdfghjkl;'", "zxcvbnm,./"];
  var mountRuTypos = defineWidget({
    id: "ru-typos",
    rootClass: "rt-root",
    exportName: "mountRuTypos",
    maxStep: 5,
    render({ host, data, labels, el }) {
      const layout = data && data.layout || {};
      const yo = data && data.yoLadder || {};
      const hg = data && data.homoglyphs || {};
      const map = layout.map || {};
      const yoKey = layout.yoKey || {};
      const ladder = yo.ladder || {};
      const docs = yo.docs || {};
      const docIds = Object.keys(docs);
      const demo = hg.demo || {};
      const lower = hg.lower || {};
      const unconfuse = {};
      for (const cyr of Object.keys(lower)) unconfuse[lower[cyr]] = cyr;
      const tmpl = (s, vals) => String(s || "").replace(/\{(\w+)\}/g, (_, k) => vals[k] != null ? vals[k] : "");
      const decMark = () => {
        const l = (typeof document !== "undefined" && document.documentElement ? document.documentElement.dataset.lang || document.documentElement.lang || "en" : "en").slice(0, 2);
        return l === "ru" || l === "tt" ? "," : ".";
      };
      const rec = (v) => typeof v === "number" && isFinite(v) ? v.toFixed(3).replace(".", decMark()) : "\u2014";
      const probes = layout.probes || [];
      const probe = probes.reduce(
        (a, b) => (b.typed || "").length > (a.typed || "").length ? b : a,
        probes[0] || { typed: "", fixed: "" }
      );
      const oneArmRow = (yo.rows || []).find((r) => r.id === "index-only") || {};
      const foldYo = (s) => String(s).replace(/ё/g, "\u0435");
      const foldCon = (s) => String(s).split("").map((ch) => unconfuse[ch] || ch).join("");
      const applyFolds = (s, useYo, useCon) => {
        let out = String(s);
        if (useYo) out = foldYo(out);
        if (useCon) out = foldCon(out);
        return out;
      };
      const toks = (s) => String(s).split(/\s+/).filter(Boolean);
      const oneArm = () => host.dataset.onearm === "on";
      function scene(k) {
        const yoOn = k >= 3;
        const conOn = k >= 5;
        const armed = oneArm() && k === 3;
        if (k >= 4) {
          return {
            q: demo.fake || "",
            corpus: [{ id: "d1", text: demo.real || "" }],
            yoOn,
            conOn,
            qYo: yoOn,
            qCon: conOn,
            armed,
            homo: true
          };
        }
        const q = armed ? oneArmRow.query || "" : k === 0 ? probe.typed : k === 1 ? probe.fixed : toks(probe.fixed)[0] || "";
        return {
          q,
          corpus: docIds.map((id) => ({ id, text: docs[id] })),
          yoOn,
          conOn,
          qYo: yoOn && !armed,
          qCon: conOn,
          armed,
          homo: false
        };
      }
      function hits(sc) {
        const qt = toks(applyFolds(sc.q, sc.qYo, sc.qCon));
        if (!qt.length) return [];
        return sc.corpus.filter((d) => {
          const dt = toks(applyFolds(d.text, sc.yoOn, sc.conOn));
          return qt.every((t) => dt.indexOf(t) >= 0);
        }).map((d) => d.id);
      }
      const panel = document.createElement("div");
      panel.className = "wgt-panel rt-panel";
      host.appendChild(panel);
      const mkTag = (parent, text) => {
        const t = document.createElement("div");
        t.className = "rt-tag";
        t.textContent = text || "";
        parent.appendChild(t);
        return t;
      };
      mkTag(panel, labels.kbTag);
      const kb = document.createElement("div");
      kb.className = "rt-kb";
      panel.appendChild(kb);
      const keyNodes = {};
      KEY_ROWS.forEach((rowStr) => {
        const row = document.createElement("div");
        row.className = "rt-kbrow";
        rowStr.split("").forEach((ch) => {
          if (!map[ch]) return;
          const key = document.createElement("span");
          key.className = "rt-key";
          if (ch === (yoKey.key || "`")) key.classList.add("is-yokey");
          const en = document.createElement("span");
          en.className = "rt-key-en";
          en.textContent = ch;
          const ru = document.createElement("span");
          ru.className = "rt-key-ru";
          ru.textContent = map[ch];
          key.appendChild(en);
          key.appendChild(ru);
          row.appendChild(key);
          keyNodes[ch] = key;
        });
        kb.appendChild(row);
      });
      const fixRow = document.createElement("div");
      fixRow.className = "rt-fixes";
      panel.appendChild(fixRow);
      const FIXES = [
        { key: "layout", from: 1, name: labels.fixLayout },
        { key: "yo", from: 3, name: labels.fixYo },
        { key: "con", from: 5, name: labels.fixConfus }
      ];
      const fixNodes = FIXES.map((f) => {
        const b = document.createElement("span");
        b.className = "rt-fix rt-fix--" + f.key;
        b.textContent = f.name || f.key;
        fixRow.appendChild(b);
        return b;
      });
      const qTag = mkTag(panel, labels.queryTag);
      const qLine = document.createElement("div");
      qLine.className = "rt-qline";
      panel.appendChild(qLine);
      const note = document.createElement("div");
      note.className = "rt-note";
      panel.appendChild(note);
      const cpBox = document.createElement("div");
      cpBox.className = "rt-cp is-hidden";
      panel.appendChild(cpBox);
      const cTag = mkTag(panel, labels.corpusTag);
      const corpusBox = document.createElement("div");
      corpusBox.className = "rt-corpus";
      panel.appendChild(corpusBox);
      const found = document.createElement("div");
      found.className = "rt-found";
      panel.appendChild(found);
      const recallLine = document.createElement("div");
      recallLine.className = "rt-recall is-hidden";
      panel.appendChild(recallLine);
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "rt-toggle is-hidden";
      toggle.textContent = labels.oneArm || "";
      toggle.addEventListener("click", () => {
        host.dataset.onearm = oneArm() ? "off" : "on";
        apply(Number(host.dataset.step) || 0);
      });
      panel.appendChild(toggle);
      const ladBox = document.createElement("div");
      ladBox.className = "rt-ladder is-hidden";
      host.appendChild(ladBox);
      mkTag(ladBox, labels.ladderTag);
      const RUNGS = [
        { key: "raw", name: labels.ladderRaw, v: ladder.raw },
        { key: "both", name: labels.ladderBoth, v: ladder.yoBoth },
        { key: "stem", name: labels.ladderStem, v: ladder.yoPlusStem },
        { key: "one", name: labels.ladderOne, v: ladder.yoIndexOnly }
      ];
      const LW = 520, LROW = 32, LPAD = 12, LAB = 200, BAR0 = 206, BARW = 230;
      const LH = LPAD * 2 + LROW * RUNGS.length;
      const svg = el("svg", { viewBox: `0 0 ${LW} ${LH}`, class: "wgt-svg rt-svg" }, ladBox);
      const vmax = RUNGS.reduce((m, r) => Math.max(m, typeof r.v === "number" ? r.v : 0), 0) || 1;
      const rungNodes = RUNGS.map((r, i) => {
        const y = LPAD + i * LROW;
        const g = el("g", { class: "rt-rung rt-rung--" + r.key }, svg);
        el("text", { x: 8, y: y + 16, class: "rt-rung-lab" }, g).textContent = r.name || r.key;
        el("rect", { x: BAR0, y: y + 3, width: BARW, height: 17, rx: 5, class: "rt-rung-track" }, g);
        const w = Math.max(0, Math.round((typeof r.v === "number" ? r.v : 0) / vmax * BARW));
        el("rect", { x: BAR0, y: y + 3, width: w, height: 17, rx: 5, class: "rt-rung-bar" }, g);
        el("text", { x: BAR0 + w + 8, y: y + 16, class: "rt-rung-val" }, g).textContent = rec(r.v);
        return g;
      });
      const rule = document.createElement("div");
      rule.className = "rt-rule";
      rule.textContent = labels.ruleLine || "";
      ladBox.appendChild(rule);
      function paintQuery(k, sc) {
        qLine.innerHTML = "";
        qTag.textContent = (k === 0 ? labels.typedTag : labels.queryTag) || "";
        const shown = sc.q;
        shown.split("").forEach((ch) => {
          const c = document.createElement("span");
          c.className = "rt-ch";
          if (ch === " ") c.classList.add("is-space");
          c.textContent = ch === " " ? "\u2423" : ch;
          qLine.appendChild(c);
        });
        if (sc.homo) {
          const rcp = demo.realCodepoints || [], fcp = demo.fakeCodepoints || [];
          [].forEach.call(qLine.children, (c, i) => {
            if (rcp[i] && fcp[i] && rcp[i] !== fcp[i]) c.classList.add("is-latin");
          });
        }
        if (k === 1) {
          const arrow = document.createElement("span");
          arrow.className = "rt-qsrc";
          arrow.textContent = probe.typed + " \u2192";
          qLine.insertBefore(arrow, qLine.firstChild);
        }
      }
      function paintKeys(k, sc) {
        const live = k >= 1 && !sc.homo;
        const used = new Set(live ? probe.typed.split("") : []);
        Object.keys(keyNodes).forEach((ch) => {
          keyNodes[ch].classList.toggle("is-lit", used.has(ch));
          keyNodes[ch].classList.toggle("is-warn", live && ch === (yoKey.key || "`"));
        });
      }
      function paintNote(k, sc) {
        note.className = "rt-note";
        if (sc.armed) {
          note.classList.add("is-bad");
          note.textContent = labels.oneArmWarn || "";
          return;
        }
        if (k === 1) {
          note.classList.add("is-warn");
          note.textContent = tmpl(labels.yoLostTmpl, { key: yoKey.key, letter: yoKey.letter });
          return;
        }
        if (k === 2) {
          note.classList.add("is-bad");
          note.textContent = labels.yoPlaque || "";
          return;
        }
        if (k === 4) {
          note.classList.add("is-bad");
          note.textContent = tmpl(labels.homoNote, { n: demo.swapped });
          return;
        }
        if (k === 5) {
          note.classList.add("is-good");
          note.textContent = labels.homoFixed || "";
          return;
        }
        if (k === 3) {
          note.classList.add("is-good");
          note.textContent = labels.yoFixed || "";
          return;
        }
        note.textContent = labels.startNote || "";
      }
      function paintCodepoints(sc) {
        cpBox.classList.toggle("is-hidden", !sc.homo);
        if (!sc.homo) return;
        cpBox.innerHTML = "";
        const rcp = demo.realCodepoints || [], fcp = demo.fakeCodepoints || [];
        const rows = [
          { tag: labels.cpReal, word: demo.real || "", cps: rcp, cls: "is-real" },
          { tag: labels.cpFake, word: demo.fake || "", cps: fcp, cls: "is-fake" }
        ];
        rows.forEach((r) => {
          const row = document.createElement("div");
          row.className = "rt-cprow " + r.cls;
          const t = document.createElement("span");
          t.className = "rt-cptag";
          t.textContent = r.tag || "";
          row.appendChild(t);
          r.word.split("").forEach((ch, i) => {
            const c = document.createElement("span");
            c.className = "rt-cpcell";
            if (rcp[i] && fcp[i] && rcp[i] !== fcp[i] && r.cls === "is-fake") c.classList.add("is-latin");
            const g = document.createElement("span");
            g.className = "rt-cpglyph";
            g.textContent = ch;
            const p = document.createElement("span");
            p.className = "rt-cppoint";
            p.textContent = r.cps[i] || "";
            c.appendChild(g);
            c.appendChild(p);
            row.appendChild(c);
          });
          cpBox.appendChild(row);
        });
      }
      function paintCorpus(sc, hitIds) {
        corpusBox.innerHTML = "";
        const hitSet = new Set(hitIds);
        sc.corpus.forEach((d) => {
          const row = document.createElement("div");
          row.className = "rt-doc" + (hitSet.has(d.id) ? " is-hit" : "");
          const id = document.createElement("span");
          id.className = "rt-doc-id";
          id.textContent = d.id;
          const tx = document.createElement("span");
          tx.className = "rt-doc-text";
          tx.textContent = d.text;
          row.appendChild(id);
          row.appendChild(tx);
          corpusBox.appendChild(row);
        });
      }
      function apply(k) {
        const sc = scene(k);
        const hitIds = hits(sc);
        const half = oneArm() && k >= 3;
        paintKeys(k, sc);
        paintQuery(k, sc);
        paintNote(k, sc);
        paintCodepoints(sc);
        paintCorpus(sc, hitIds);
        fixNodes.forEach((n, i) => n.classList.toggle("is-on", k >= FIXES[i].from && !(FIXES[i].key === "yo" && half)));
        fixNodes[1].classList.toggle("is-half", half);
        found.textContent = tmpl(labels.foundTmpl, { n: hitIds.length, N: sc.corpus.length });
        found.className = "rt-found " + (hitIds.length ? "is-good" : "is-bad");
        const showRecall = k >= 3;
        recallLine.classList.toggle("is-hidden", !showRecall);
        toggle.classList.toggle("is-hidden", k < 3);
        toggle.classList.toggle("is-on", oneArm());
        toggle.setAttribute("aria-pressed", oneArm() ? "true" : "false");
        if (showRecall) {
          const to = half ? ladder.yoIndexOnly : k >= 5 ? ladder.yoPlusStem : ladder.yoBoth;
          recallLine.textContent = tmpl(labels.recallTmpl, { a: rec(ladder.raw), b: rec(to) });
          recallLine.className = "rt-recall " + (half ? "is-bad" : "is-good");
        }
        ladBox.classList.toggle("is-hidden", k < 5);
        rungNodes[3].classList.toggle("is-hidden", !half);
        svg.setAttribute("viewBox", `0 0 ${LW} ${LPAD * 2 + LROW * (half ? 4 : 3)}`);
        rungNodes.forEach((g, i) => g.classList.toggle(
          "is-now",
          half && i === 3 || !half && i === 2
        ));
      }
      return function update(k) {
        apply(k);
      };
    }
  });
})();
