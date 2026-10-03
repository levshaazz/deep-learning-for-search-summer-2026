/* AUTO-GENERATED offline classic bundle of widgets/ab-test/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/ab-test/logic.js
  var pct = (x, d = 1) => (Math.round(x * 100 * 10 ** d) / 10 ** d).toString() + "%";
  var pp = (x, d = 1) => (Math.round(x * 100 * 10 ** d) / 10 ** d).toString();
  var num = (x, d) => (Math.round(x * 10 ** d) / 10 ** d).toString();
  var mountAbTest = defineWidget({
    id: "ab-test",
    rootClass: "ab-root",
    exportName: "mountAbTest",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const t = data.abTest;
      const A = t.control, B = t.treatment;
      const W = 480;
      const svg = el("svg", {
        class: "wgt-svg ab-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const box = { x: 28, y: 44, w: W - 56, h: 188 };
      const maxRate = Math.max(A.ctr, B.ctr) * 1.28;
      el("line", { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: "ab-axis" }, svg);
      el("text", { x: box.x, y: box.y - 12, class: "ab-axlbl", "text-anchor": "start" }, svg).textContent = labels.yaxis || "click-through rate";
      const arms = [
        { d: A, label: labels.armA || "A \xB7 control", cls: "ab-a" },
        { d: B, label: labels.armB || "B \xB7 variant", cls: "ab-b" }
      ];
      const slot = box.w / arms.length;
      const bw = Math.min(116, slot * 0.5);
      const bars = arms.map((arm, i) => {
        const cx = box.x + slot * i + slot / 2;
        const h = arm.d.ctr / maxRate * box.h;
        const y0 = box.y + box.h - h;
        const rect = el("rect", {
          x: cx - bw / 2,
          y: y0,
          width: bw,
          height: h,
          class: `ab-bar ${arm.cls}`,
          rx: 6
        }, svg);
        const val = el("text", { x: cx, y: y0 - 8, class: `ab-val ${arm.cls}`, "text-anchor": "middle" }, svg);
        val.textContent = pct(arm.d.ctr);
        el("text", { x: cx, y: box.y + box.h + 18, class: "ab-arm", "text-anchor": "middle" }, svg).textContent = arm.label;
        el("text", { x: cx, y: box.y + box.h + 34, class: "ab-sub", "text-anchor": "middle" }, svg).textContent = `n = ${arm.d.n.toLocaleString("en-US")}`;
        return { rect, val, cx, y0 };
      });
      const liftG = el("g", { class: "ab-layer ab-lift is-hidden" }, svg);
      const xA = bars[0].cx, xB = bars[1].cx, yTop = bars[1].y0 - 30;
      el("path", {
        d: `M ${xA} ${bars[0].y0 - 24} L ${xA} ${yTop} L ${xB} ${yTop} L ${xB} ${bars[1].y0 - 24}`,
        class: "ab-bracket",
        fill: "none"
      }, liftG);
      const liftTxt = el("text", { x: (xA + xB) / 2, y: yTop - 8, class: "ab-lift-txt", "text-anchor": "middle" }, liftG);
      liftTxt.textContent = `\u0394 +${pp(t.absoluteLift)} pts  \xB7  +${num(t.relativeLiftPct, 1)}%`;
      const panel = { x: box.x - 8, y: box.y + box.h + 50, w: box.w + 16 };
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      layer("lift", 1);
      layer("z", 2);
      layer("verdict", 3);
      const head = (n, x, y, cls, text) => add(n, el("text", { x, y, class: "ab-annot " + cls }, svg)).textContent = text;
      head(
        "lift",
        panel.x,
        panel.y,
        "ab-lift-h",
        `lift:  ${pct(A.ctr)} \u2192 ${pct(B.ctr)}   (+${num(t.relativeLiftPct, 1)}% relative)`
      );
      const st = t.steps || {};
      head(
        "z",
        panel.x,
        panel.y + 26,
        "ab-z-h",
        `pooled  p\u0304 = ${st.pPooledExpr || 1200 + 1320 + "/" + (1e4 + 1e4) + " = " + num(t.pooledCtr, 3)}`
      );
      head(
        "z",
        panel.x,
        panel.y + 46,
        "ab-z-sub",
        `SE = ${st.seExpr || "\u221A(p\u0304\xB7(1\u2212p\u0304)\xB7(1/nC+1/nT)) = " + num(t.se, 5)}`
      );
      head(
        "z",
        panel.x,
        panel.y + 64,
        "ab-z-sub",
        `z = ${st.zExpr || "(" + num(B.ctr, 3) + " \u2212 " + num(A.ctr, 3) + ")/" + num(t.se, 5) + " = " + num(t.z, 3)}`
      );
      const sig = t.significant05;
      head(
        "verdict",
        panel.x,
        panel.y + 86,
        "ab-v-h",
        `p \u2248 ${num(t.p, 3)}  ${sig ? "<" : "\u2265"}  0.05`
      );
      const v = add("verdict", el("text", { x: panel.x, y: panel.y + 110, class: "ab-annot ab-v-call" + (sig ? " is-real" : "") }, svg));
      v.textContent = sig ? labels.verdictReal || "The lift is real \u2014 ship B." : labels.verdictNoise || "Could be noise \u2014 hold.";
      const badge = el("text", { x: bars[1].cx, y: bars[1].y0 + 26, class: "ab-badge is-hidden", "text-anchor": "middle" }, svg);
      badge.textContent = sig ? "\u2713" : "?";
      const H = frameHeightFor(panel.y + 110);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        bars[1].rect.classList.toggle("is-hot", k >= 1);
        bars[1].rect.classList.toggle("is-real", k >= 3 && sig);
        badge.classList.toggle("is-hidden", k < 3);
        liftG.classList.toggle("is-hidden", k < 1);
        for (const n in layers) {
          const on = k >= layers[n].from;
          for (const node of layers[n].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
