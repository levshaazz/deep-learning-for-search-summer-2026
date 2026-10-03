/* AUTO-GENERATED offline classic bundle of widgets/significance-test/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/significance-test/logic.js
  var f4 = (x) => x.toFixed(4);
  var f3 = (x) => x.toFixed(3);
  var f3t = (x) => x.toFixed(3);
  var sgn = (x) => (x >= 0 ? "+" : "\u2212") + f4(Math.abs(x));
  var mountSignificanceTest = defineWidget({
    id: "significance-test",
    rootClass: "sig-root",
    exportName: "mountSignificanceTest",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const diffs = data.perQueryDiff;
      const n = data.nQueries;
      const mean = data.meanDiff;
      const sd = data.sdDiff;
      const se = data.seDiff;
      const tt = data.pairedTTest;
      const wil = data.wilcoxon;
      const perm = data.permutation;
      const ci = data.ci95;
      const nPos = diffs.filter((d) => d > 0).length;
      const nNeg = diffs.filter((d) => d < 0).length;
      const real = ci[0] > 0 && tt.p < 0.05 && perm.p < 0.05;
      const W = 480;
      const svg = el("svg", {
        class: "wgt-svg sig-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const box = { x: 30, y: 40, w: W - 56, h: 150 };
      const maxAbs = Math.max(...diffs.map(Math.abs)) * 1.12;
      const mid = box.y + box.h / 2;
      const scaleY = box.h / 2 / maxAbs;
      const zeroLane = 66;
      const plotW = box.w - zeroLane;
      const slot = plotW / n;
      const bw = Math.min(20, slot * 0.62);
      el("text", { x: box.x, y: box.y - 14, class: "sig-title", "text-anchor": "start" }, svg).textContent = labels.title || "B \u2212 A, per query";
      el("line", { x1: box.x, y1: mid, x2: box.x + plotW, y2: mid, class: "sig-zero" }, svg);
      el("text", {
        x: box.x + plotW + 8,
        y: mid,
        class: "sig-axlbl",
        "text-anchor": "start",
        "dominant-baseline": "middle"
      }, svg).textContent = labels.axisZero || "0 (tie)";
      const bars = diffs.map((d, i) => {
        const cx = box.x + slot * i + slot / 2;
        const h = Math.abs(d) * scaleY;
        const up = d >= 0;
        const y0 = up ? mid - h : mid;
        const cls = up ? "sig-up" : "sig-down";
        const rect = el("rect", {
          x: cx - bw / 2,
          y: y0,
          width: bw,
          height: Math.max(h, 1),
          class: `sig-bar ${cls}`,
          rx: 2
        }, svg);
        return { rect, cx, d, up };
      });
      const sideLabel = (y, cls, text) => {
        const tx = box.x;
        const w = text.length * 6 + 8;
        el("rect", { x: tx - 3, y: y - 9, width: w, height: 14, rx: 3, class: "sig-side-bg" }, svg);
        el("text", { x: tx, y, class: cls, "text-anchor": "start" }, svg).textContent = text;
      };
      sideLabel(box.y + 4, "sig-side sig-up-t", `\u25B2 ${labels.winB || "B wins"} (${nPos})`);
      sideLabel(box.y + box.h - 2, "sig-side sig-down-t", `\u25BC ${labels.winA || "A wins"} (${nNeg})`);
      const meanY = mid - mean * scaleY;
      const meanG = el("g", { class: "sig-meanline" }, svg);
      el("line", { x1: box.x, y1: meanY, x2: box.x + plotW, y2: meanY, class: "sig-mean" }, meanG);
      const labY = box.y - 2;
      el("line", { x1: box.x + plotW, y1: labY + 3, x2: box.x + plotW, y2: meanY, class: "sig-mean-tick" }, meanG);
      el("text", { x: box.x + box.w, y: labY, class: "sig-mean-t", "text-anchor": "end" }, meanG).textContent = `${labels.axisMean || "mean"} ${sgn(mean)}`;
      const px = box.x - 2;
      let py = box.y + box.h + 30;
      const layers = {};
      const layer = (k) => layers[k] = layers[k] || [];
      const add = (k, node) => {
        layer(k).push(node);
        return node;
      };
      const line = (k, y, cls, text) => {
        const t = el("text", { x: px, y, class: "sig-annot " + cls }, svg);
        t.textContent = text;
        return add(k, t);
      };
      line(
        1,
        py,
        "sig-perm-h",
        `${labels.permLabel || "flip every sign \u2014 2^15 ways"}  =  ${perm.permutations.toLocaleString("en-US")}`
      );
      line(
        1,
        py + 20,
        "sig-perm-sub",
        `count |mean| \u2265 ${f4(mean)}  \u2192  p = ${f4(perm.p)}  (\u2248 ${f3(perm.p)})`
      );
      py += 50;
      line(
        2,
        py,
        "sig-t-h",
        `t = ${f4(mean)} / (${f4(sd)}/\u221A${n}) = ${f3t(tt.t)}   (df = ${tt.df})`
      );
      line(
        2,
        py + 20,
        "sig-t-sub",
        `\u2192 p = ${f3(tt.p)} (t-test)    \xB7    Wilcoxon W = ${wil.W} \u2192 p = ${f3(wil.p)}`
      );
      py += 50;
      line(
        3,
        py,
        "sig-v-h",
        `perm ${f3(perm.p)}  \xB7  t ${f3(tt.p)}  \xB7  Wilcoxon ${f3(wil.p)}   ${real ? "all < 0.05" : ""}`
      );
      line(
        3,
        py + 22,
        "sig-ci-h",
        `95% CI [${f4(ci[0])}, ${f4(ci[1])}]  ${ci[0] > 0 ? "excludes 0" : "grazes 0"}`
      );
      const v = line(
        3,
        py + 46,
        "sig-v-call" + (real ? " is-real" : ""),
        real ? labels.verdictReal || "All p < 0.05, and the CI excludes 0 \u2014 the win is real, not noise." : labels.verdictNoise || "Could be luck \u2014 hold."
      );
      void v;
      const H = frameHeightFor(py + 46);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        meanG.classList.toggle("is-hidden", k < 0);
        for (const b of bars) b.rect.classList.toggle("is-extreme", k >= 1 && Math.abs(b.d) >= mean);
        for (const b of bars) b.rect.classList.toggle("is-real", k >= 3 && real && b.up);
        for (const key in layers) {
          const on = k >= Number(key);
          for (const node of layers[key]) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
