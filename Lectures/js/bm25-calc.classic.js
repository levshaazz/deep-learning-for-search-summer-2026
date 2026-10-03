/* AUTO-GENERATED offline classic bundle of widgets/bm25-calc/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/bm25-calc/logic.js
  var fmt2 = (x) => (Math.round(x * 100) / 100).toString();
  var mountBm25Calc = defineWidget({
    id: "bm25-calc",
    rootClass: "bm-root",
    exportName: "mountBm25Calc",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const MAX = 4, W = 480, H = 390;
      const tfidf = labels.mode === "tfidf";
      const scoreOf = (d) => tfidf ? d.tfidfScore : d.bm25Score;
      const ranking = tfidf ? data.tfidfRanking : data.bm25Ranking;
      if (tfidf) for (let k = 0; k <= MAX; k++) labels["s" + k] = labels["t" + k];
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg bm-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const docs = data.docs;
      const box = { x: 48, y: 24, w: W - 64, h: 210 };
      const rowH = box.h / docs.length;
      const bw = rowH - 8;
      const k1 = data.k1 != null ? data.k1 : 1.5;
      const idfPresence = (d) => d.terms.reduce((s, t) => s + (t.tf > 0 ? t.idf : 0), 0);
      const satScore = (d) => {
        if (tfidf) return scoreOf(d);
        return d.terms.reduce((s, t) => {
          if (t.tf <= 0) return s;
          return s + t.idf * (t.tf * (k1 + 1)) / (t.tf + k1);
        }, 0);
      };
      const fullScore = (d) => scoreOf(d);
      const partialScore = (d, step) => {
        if (step <= 1) return idfPresence(d);
        if (step === 2) return satScore(d);
        return fullScore(d);
      };
      let scaleMax = 0;
      docs.forEach((d) => {
        scaleMax = Math.max(scaleMax, idfPresence(d), satScore(d), fullScore(d));
      });
      const maxScore = scaleMax * 1.12 || 1;
      el("line", { x1: box.x, y1: box.y, x2: box.x, y2: box.y + box.h, class: "bm-axis" }, svg);
      el("text", { x: box.x, y: box.y + box.h + 18, class: "bm-axlbl" }, svg).textContent = (tfidf ? labels.txaxis : labels.xaxis) || (tfidf ? "TF-IDF score \u2192" : "BM25 score \u2192");
      const flat = maxScore * 0.28;
      const sx = (v) => v / maxScore * box.w;
      const rows = docs.map((d, i) => {
        const y0 = box.y + i * rowH + 4;
        const g = el("g", { class: "bm-row", "data-id": d.id }, svg);
        const rect = el("rect", { x: box.x, y: y0, width: sx(flat), height: bw, class: "bm-bar" }, g);
        el("text", { x: box.x - 6, y: y0 + bw / 2 + 4, class: "bm-id", "text-anchor": "end" }, g).textContent = d.id;
        const val = el("text", { x: box.x + sx(flat) + 6, y: y0 + bw / 2 + 4, class: "bm-val" }, g);
        val.textContent = "";
        return { d, g, rect, val, y0 };
      });
      const panel = { x: box.x, y: box.y + box.h + 44, w: box.w };
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      layer("idf", 1);
      layer("sat", 2);
      layer("len", 3);
      const head = (name, y, cls, text) => {
        add(name, el("text", { x: panel.x, y, class: "bm-annot " + cls }, svg)).textContent = text;
      };
      const sub = (name, y, text) => {
        add(name, el("text", { x: panel.x, y, class: "bm-annot bm-sub" }, svg)).textContent = text;
      };
      const terms = docs[0].terms;
      head("idf", panel.y, "bm-idf", terms.map((t) => `idf(${t.t}) = ${fmt2(t.idf)}`).join("    "));
      sub("idf", panel.y + 16, labels.idfHint || "rarer term \u21D2 higher idf");
      const repDoc = docs.find((d) => d.id === ranking[0]) || docs[0];
      const repTerm = repDoc.terms.reduce((a, b) => b.tf > a.tf ? b : a, repDoc.terms[0]);
      head("sat", panel.y + 40, "bm-sat", `${repDoc.id}: tf(${repTerm.t}) = ${repTerm.tf}`);
      sub("sat", panel.y + 56, labels.satHint || "doubling tf adds less each time \u2014 saturation");
      const shortDoc = docs.reduce((a, b) => b.len < a.len ? b : a, docs[0]);
      const longDoc = docs.reduce((a, b) => b.len > a.len ? b : a, docs[0]);
      head(
        "len",
        panel.y + 80,
        "bm-len",
        `|${shortDoc.id}|/avgdl = ${fmt2(shortDoc.len / data.avgdl)}   \xB7   |${longDoc.id}|/avgdl = ${fmt2(longDoc.len / data.avgdl)}`
      );
      sub("len", panel.y + 96, labels.lenHint || "short doc \u21D2 boost, long doc \u21D2 damp");
      return function update(k) {
        const final = k >= MAX;
        const scored = k >= 1;
        rows.forEach((r) => {
          const rank = final ? ranking.indexOf(r.d.id) : docs.indexOf(r.d);
          const targetY = box.y + rank * rowH + 4;
          r.g.setAttribute("transform", `translate(0 ${targetY - r.y0})`);
          const v = scored ? partialScore(r.d, k) : flat;
          r.rect.setAttribute("width", sx(v));
          r.rect.classList.toggle("is-scored", scored);
          r.rect.classList.toggle("is-winner", final && r.d.id === ranking[0]);
          const barEnd = box.x + sx(v);
          const inside = scored && barEnd > W - 50;
          r.val.setAttribute("x", inside ? barEnd - 6 : barEnd + 6);
          r.val.setAttribute("text-anchor", inside ? "end" : "start");
          r.val.classList.toggle("is-inside", inside);
          r.val.textContent = scored ? fmt2(v) : "";
          r.val.classList.toggle("is-winner", final && r.d.id === ranking[0]);
        });
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
