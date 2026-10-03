/* AUTO-GENERATED offline classic bundle of widgets/entropy-gauge/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/entropy-gauge/logic.js
  var UID = 0;
  var mountEntropyGauge = defineWidget({
    id: "entropy-gauge",
    rootClass: "eg-root",
    exportName: "mountEntropyGauge",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const c = data && data.coin || {};
      const cc = data && data.coinCurve || {};
      const P = typeof c.pHeads === "number" ? c.pHeads : 0.25;
      const HBITS = typeof c.H === "number" ? c.H : 0.8113;
      const CE = typeof c.crossEntropyQ === "number" ? c.crossEntropyQ : 1;
      const KL = typeof c.klQ === "number" ? c.klQ : 0.1887;
      const PPQ = typeof c.pplQ === "number" ? c.pplQ : 2;
      const PPF = typeof c.pplFloor === "number" ? c.pplFloor : 1.7548;
      const SI = Array.isArray(c.selfInfo) && c.selfInfo.length === 2 ? c.selfInfo : [2, 0.415];
      const CP = Array.isArray(cc.p) ? cc.p : [];
      const CH = Array.isArray(cc.H) ? cc.H : [];
      const HMAX = typeof cc.max === "number" ? cc.max : 1;
      const ARGMAX = typeof cc.argmax === "number" ? cc.argmax : 0.5;
      const DEC = labels.dec === "," ? "," : ".";
      const f = (v) => typeof v !== "number" || !isFinite(v) ? "" : String(v).replace(".", DEC);
      const unit = (v) => v === 1 ? labels.bits1 || labels.bits || "bit" : labels.bits || "bits";
      const val = (v) => f(v) + " " + unit(v);
      const W = 600, PAD = 20;
      const CX = 158, CY = 200, R = 104;
      const RLBL = 86, RNEEDLE = 70, RFLOOR_IN = 30, RFLOOR_OUT = 114, RHLBL = 126;
      const VMAX = 6.6;
      const PX0 = 330, PX1 = 580, PY0 = 104, PY1 = 200;
      const BAR_X0 = 108, PXB = 62, ROWH = 24, ROW_A = 276, ROW_B = 310;
      const WTAG_X = 246, RD_X = 330;
      const rad = (v) => (180 - Math.max(0, Math.min(1, v / VMAX)) * 180) * Math.PI / 180;
      const dx = (v, r) => CX + r * Math.cos(rad(v));
      const dy = (v, r) => CY - r * Math.sin(rad(v));
      const xFor = (p) => PX0 + Math.max(0, Math.min(1, p)) * (PX1 - PX0);
      const yFor = (h) => PY1 - Math.max(0, h) / (HMAX || 1) * (PY1 - PY0);
      const n2 = (x) => x.toFixed(2);
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg eg-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const HID = "eg-hatch-" + ++UID;
      const defs = el("defs", {}, svg);
      const pat = el("pattern", {
        id: HID,
        width: 6,
        height: 6,
        patternUnits: "userSpaceOnUse",
        patternTransform: "rotate(45)"
      }, defs);
      el("line", { x1: 0, y1: 0, x2: 0, y2: 6, class: "eg-hatchline" }, pat);
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      const txt = (n, x, y, cls, s, anchor) => {
        const t = add(n, el("text", anchor ? { x, y, class: cls, "text-anchor": anchor } : { x, y, class: cls }, svg));
        t.textContent = s;
        return t;
      };
      layer("head", 0);
      txt("head", PAD, 24, "eg-head", labels.head || "the surprise needle");
      txt("head", PAD, 52, "eg-sub", labels.dialHead || "surprise, bits");
      txt("head", PAD, 264, "eg-sub", labels.barsHead || "per-outcome surprise, then weighted");
      layer("dial", 0);
      add("dial", el("path", { d: `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`, class: "eg-rim" }, svg));
      for (let v = 0; v <= 6; v++) {
        add("dial", el("line", {
          x1: n2(dx(v, R - 7)),
          y1: n2(dy(v, R - 7)),
          x2: n2(dx(v, R)),
          y2: n2(dy(v, R)),
          class: "eg-tickmark"
        }, svg));
      }
      for (const v of [0, 1, 2, 4, 6]) {
        const t = txt("dial", n2(dx(v, RLBL)), n2(dy(v, RLBL) + 4), "eg-tick", String(v), "middle");
        t.setAttribute("aria-hidden", "true");
      }
      layer("floor", 3);
      add("floor", el("line", {
        x1: n2(dx(HBITS, RFLOOR_IN)),
        y1: n2(dy(HBITS, RFLOOR_IN)),
        x2: n2(dx(HBITS, RFLOOR_OUT)),
        y2: n2(dy(HBITS, RFLOOR_OUT)),
        class: "eg-floor"
      }, svg));
      txt("floor", n2(dx(HBITS, RHLBL)), n2(dy(HBITS, RHLBL) + 4), "eg-floorlbl", labels.floorTag || "H", "middle");
      add("floor", el("line", { x1: PX0, y1: n2(yFor(HBITS)), x2: n2(xFor(P)), y2: n2(yFor(HBITS)), class: "eg-rule" }, svg));
      add("floor", el("circle", { cx: n2(xFor(P)), cy: n2(yFor(HBITS)), r: 5, class: "eg-dot" }, svg));
      layer("kl", 4);
      add("kl", el("path", {
        d: `M ${CX} ${CY} L ${n2(dx(HBITS, R))} ${n2(dy(HBITS, R))} A ${R} ${R} 0 0 1 ${n2(dx(CE, R))} ${n2(dy(CE, R))} Z`,
        fill: `url(#${HID})`,
        class: "eg-klwedge"
      }, svg));
      add("kl", el("path", { d: `M ${n2(dx(HBITS, R))} ${n2(dy(HBITS, R))} A ${R} ${R} 0 0 1 ${n2(dx(CE, R))} ${n2(dy(CE, R))}`, class: "eg-klrim" }, svg));
      const needle = add("dial", el("line", {
        x1: CX,
        y1: CY,
        x2: n2(dx(SI[0], RNEEDLE)),
        y2: n2(dy(SI[0], RNEEDLE)),
        class: "eg-needle"
      }, svg));
      add("dial", el("circle", { cx: CX, cy: CY, r: 5, class: "eg-hub" }, svg));
      const dialRead = txt("dial", CX, 234, "eg-read-main", "", "middle");
      layer("curve", 2);
      txt("curve", PX0, 52, "eg-sub", labels.curveHead || "H(p) \u2014 bits per toss");
      add("curve", el("line", { x1: PX0, y1: PY1, x2: PX1, y2: PY1, class: "eg-axis" }, svg));
      add("curve", el("line", { x1: PX0, y1: PY0, x2: PX0, y2: PY1, class: "eg-axis" }, svg));
      txt("curve", PX0 - 6, PY1 + 4, "eg-tick", f(0), "end");
      txt("curve", PX0 - 6, PY0 + 4, "eg-tick", f(HMAX), "end");
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        txt("curve", n2(xFor(p)), 218, "eg-tick", f(p), "middle");
      }
      if (CP.length && CP.length === CH.length) {
        const pts = CP.map((p, i) => n2(xFor(p)) + "," + n2(yFor(CH[i]))).join(" ");
        add("curve", el("polyline", { points: pts, class: "eg-curve" }, svg));
      }
      add("curve", el("line", { x1: n2(xFor(ARGMAX)), y1: PY0, x2: n2(xFor(ARGMAX)), y2: PY1, class: "eg-peakline" }, svg));
      add("curve", el("circle", { cx: n2(xFor(ARGMAX)), cy: n2(yFor(HMAX)), r: 4, class: "eg-peak" }, svg));
      txt("curve", n2(xFor(ARGMAX)), 94, "eg-peaklbl", (labels.maxTag || "max") + " = " + val(HMAX), "middle");
      layer("bars", 0);
      const railW = PXB * SI[0];
      const railA = add("bars", el("rect", { x: BAR_X0, y: ROW_A, width: n2(railW), height: ROWH, rx: 5, class: "eg-rail" }, svg));
      add("bars", el("rect", { x: BAR_X0, y: ROW_B, width: n2(railW), height: ROWH, rx: 5, class: "eg-rail" }, svg));
      const barA = add("bars", el("rect", { x: BAR_X0, y: ROW_A, width: n2(railW), height: ROWH, rx: 5, class: "eg-bar-rare" }, svg));
      const barB = add("bars", el("rect", { x: BAR_X0, y: ROW_B, width: n2(PXB * SI[1]), height: ROWH, rx: 5, class: "eg-bar-common" }, svg));
      const nameA = txt("bars", BAR_X0 - 8, ROW_A + ROWH / 2 + 4, "eg-name eg-t-rare", labels.outRare || "heads (p)", "end");
      const nameB = txt("bars", BAR_X0 - 8, ROW_B + ROWH / 2 + 4, "eg-name eg-t-common", labels.outCommon || "tails (1\u2212p)", "end");
      const valA = txt("bars", 0, ROW_A + ROWH / 2 + 4, "eg-val eg-t-rare", val(SI[0]));
      const valB = txt("bars", 0, ROW_B + ROWH / 2 + 4, "eg-val eg-t-common", val(SI[1]));
      const wtagA = txt("bars", WTAG_X, ROW_A + ROWH / 2 + 4, "eg-wtag", labels.wRare || "\xD7 p");
      const wtagB = txt("bars", WTAG_X, ROW_B + ROWH / 2 + 4, "eg-wtag", labels.wCommon || "\xD7 (1\u2212p)");
      const stackLbl = txt("bars", 0, ROW_B + ROWH / 2 + 4, "eg-stack", (labels.rdH || "H(p)") + " = " + val(HBITS));
      layer("rd3", 3);
      txt("rd3", RD_X, 250, "eg-read-note", labels.rdBelow || "below 1 bit \u21D2 the skew is exploitable");
      layer("rd4", 4);
      txt("rd4", RD_X, 286, "eg-read", (labels.rdCE || "H(p,q)") + " = " + val(CE));
      txt("rd4", RD_X, 308, "eg-read-red", (labels.rdKL || "KL(p\u2016q)") + " = " + val(KL));
      txt("rd4", RD_X, 330, "eg-read-note", (labels.rdPP || "PP") + " = " + f(PPQ) + "  (" + (labels.rdFloor || "floor") + " " + f(PPF) + ")");
      const H = frameHeightFor(336, 12);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const lenRaw = [PXB * SI[0], PXB * SI[1]];
      const wA = PXB * SI[0] * P;
      const lenW = [wA, PXB * HBITS - wA];
      const place = (r, x, y, w) => {
        r.setAttribute("x", n2(x));
        r.setAttribute("y", y);
        r.setAttribute("width", n2(Math.max(2, w)));
      };
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        const nv = k >= 4 ? CE : k >= 3 ? HBITS : SI[0];
        needle.setAttribute("x2", n2(dx(nv, RNEEDLE)));
        needle.setAttribute("y2", n2(dy(nv, RNEEDLE)));
        needle.classList.toggle("is-off-floor", k >= 4);
        dialRead.textContent = (k >= 4 ? labels.rdCE || "H(p,q)" : k >= 3 ? labels.rdH || "H(p)" : labels.rdSelf || "\u2212log\u2082 p") + " = " + val(nv);
        const stacked = k >= 2;
        const L = k >= 1 ? lenW : lenRaw;
        place(barA, BAR_X0, stacked ? ROW_B : ROW_A, L[0]);
        place(barB, stacked ? BAR_X0 + L[0] : BAR_X0, ROW_B, L[1]);
        railA.classList.toggle("is-hidden", stacked);
        valA.setAttribute("x", n2(BAR_X0 + L[0] + 8));
        valB.setAttribute("x", n2(BAR_X0 + L[1] + 8));
        stackLbl.setAttribute("x", n2(BAR_X0 + L[0] + L[1] + 8));
        valA.classList.toggle("is-hidden", k !== 0);
        valB.classList.toggle("is-hidden", k !== 0);
        wtagA.classList.toggle("is-hidden", k !== 1);
        wtagB.classList.toggle("is-hidden", k !== 1);
        nameA.classList.toggle("is-hidden", stacked);
        nameB.classList.toggle("is-hidden", stacked);
        stackLbl.classList.toggle("is-hidden", !stacked);
      };
    }
  });
})();
