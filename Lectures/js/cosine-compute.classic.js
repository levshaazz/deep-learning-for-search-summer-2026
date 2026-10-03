/* AUTO-GENERATED offline classic bundle of widgets/cosine-compute/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/cosine-compute/logic.js
  function sqrtText(n) {
    const r = Math.sqrt(n);
    return Number.isInteger(r) ? String(r) : "\u221A" + n;
  }
  function approx(x, d = 2) {
    return Number(x.toFixed(d)).toString();
  }
  var mountCosineCompute = defineWidget({
    id: "cosine-compute",
    rootClass: "cc-root",
    maxStep: 4,
    render({ host, data, labels }) {
      const pair = data.pairs.find((p) => p.id === data.primary) || data.pairs[0];
      const a = pair.u, b = pair.v;
      const n = Math.min(a.length, b.length);
      const dot = pair.u_dot_v;
      const sumA2 = a.reduce((s, x) => s + x * x, 0);
      const sumB2 = b.reduce((s, x) => s + x * x, 0);
      const normA = pair.normU;
      const normB = pair.normV;
      const denomProd = sumA2 * sumB2;
      const denom = Math.sqrt(denomProd);
      const cos = pair.cos;
      const cosText = Number.isInteger(cos) ? cos.toFixed(1) : approx(cos, 4);
      const panel = document.createElement("div");
      panel.className = "wgt-panel cc-panel";
      host.appendChild(panel);
      function block(cls, headHtml) {
        const r = document.createElement("div");
        r.className = `cc-block ${cls}`;
        const head = document.createElement("div");
        head.className = "cc-head";
        head.innerHTML = headHtml;
        r.appendChild(head);
        const body = document.createElement("div");
        body.className = "cc-body";
        r.appendChild(body);
        panel.appendChild(r);
        return { r, body };
      }
      const chip = (parent, txt, cls = "") => {
        const c = document.createElement("span");
        c.className = `cc-chip ${cls}`.trim();
        c.textContent = txt;
        parent.appendChild(c);
        return c;
      };
      const sym = (parent, txt, cls = "cc-op") => {
        const s = document.createElement("span");
        s.className = cls;
        s.textContent = txt;
        parent.appendChild(s);
        return s;
      };
      const vecRow = document.createElement("div");
      vecRow.className = "cc-block cc-vectors";
      const vecCard = (key, vec, cls) => {
        const card = document.createElement("div");
        card.className = `cc-veccard ${cls}`;
        const h = document.createElement("div");
        h.className = "cc-vechead";
        h.textContent = labels[key] || "";
        card.appendChild(h);
        const coords = document.createElement("div");
        coords.className = "cc-coords";
        coords.textContent = "(" + vec.map((x) => esc(x)).join(", ") + ")";
        card.appendChild(coords);
        vecRow.appendChild(card);
      };
      vecCard("vecHeadA", a, "cc-vec-a");
      vecCard("vecHeadB", b, "cc-vec-b");
      panel.appendChild(vecRow);
      const dotBlk = block("cc-dot", esc(labels.dotHead || "a\xB7b"));
      for (let i = 0; i < n; i++) {
        if (i > 0) sym(dotBlk.body, "+");
        const term = document.createElement("span");
        term.className = "cc-term";
        term.innerHTML = `<span class="cc-fac cc-fac-a">${esc(a[i])}</span><span class="cc-op cc-times">\xB7</span><span class="cc-fac cc-fac-b">${esc(b[i])}</span>`;
        dotBlk.body.appendChild(term);
      }
      sym(dotBlk.body, "=");
      chip(dotBlk.body, String(dot), "cc-res cc-res-dot");
      const normBlk = block("cc-norm", esc(labels.normHead || "\u2016a\u2016, \u2016b\u2016"));
      const normLine = (lbl, vec, sum2, val, cls) => {
        const line = document.createElement("div");
        line.className = "cc-normline";
        const squares = vec.map((x) => `${esc(x)}\xB2`).join(" + ");
        line.innerHTML = `<span class="cc-norm-lbl ${cls}">\u2016${esc(lbl)}\u2016</span><span class="cc-op">=</span><span class="cc-rad">\u221A(${squares})</span><span class="cc-op">=</span><span class="cc-rad cc-rad-exact">${esc(sqrtText(sum2))}</span><span class="cc-op">\u2248</span><span class="cc-approx">${esc(approx(val, 2))}</span>`;
        normBlk.body.appendChild(line);
      };
      normLine("a", a, sumA2, normA, "cc-fac-a");
      normLine("b", b, sumB2, normB, "cc-fac-b");
      const prodLine = document.createElement("div");
      prodLine.className = "cc-normline cc-prodline";
      prodLine.innerHTML = `<span class="cc-norm-lbl">\u2016a\u2016\xB7\u2016b\u2016</span><span class="cc-op">=</span><span class="cc-rad">${esc(sqrtText(sumA2))}\xB7${esc(sqrtText(sumB2))}</span><span class="cc-op">=</span><span class="cc-rad">\u221A${esc(denomProd)}</span><span class="cc-op">=</span><span class="cc-chip cc-res cc-res-denom">${esc(approx(denom, 2))}</span>`;
      normBlk.body.appendChild(prodLine);
      const ratioBlk = block("cc-ratio", esc(labels.ratioHead || "cosine"));
      const frac = document.createElement("div");
      frac.className = "cc-frac";
      frac.innerHTML = `<span class="cc-cosname">cos \u03B8</span><span class="cc-op">=</span><span class="cc-fraction"><span class="cc-numer">${esc(dot)}</span><span class="cc-bar"></span><span class="cc-denom">${esc(sqrtText(sumA2))}\xB7${esc(sqrtText(sumB2))}</span></span><span class="cc-op">=</span><span class="cc-fraction"><span class="cc-numer">${esc(dot)}</span><span class="cc-bar"></span><span class="cc-denom">${esc(approx(denom, 0))}</span></span><span class="cc-op">=</span><span class="cc-chip cc-res cc-res-cos">${esc(cosText)}</span>`;
      ratioBlk.body.appendChild(frac);
      const meaning = document.createElement("div");
      meaning.className = "cc-meaning";
      meaning.textContent = labels.sameDir || "same direction \u2192 1.0";
      ratioBlk.body.appendChild(meaning);
      return function update(k) {
        dotBlk.r.classList.toggle("is-hidden", k < 1);
        normBlk.r.classList.toggle("is-hidden", k < 2);
        prodLine.classList.toggle("is-hidden", k < 3);
        ratioBlk.r.classList.toggle("is-hidden", k < 4);
        vecRow.classList.toggle("is-faded", k >= 1);
        dotBlk.r.classList.toggle("is-faded", k >= 4);
        normBlk.r.classList.toggle("is-faded", k >= 4);
        ratioBlk.r.classList.toggle("is-final", k >= 4);
      };
    }
  });
})();
