/* AUTO-GENERATED offline classic bundle of widgets/biencoder/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/biencoder/logic.js
  var mountBiencoder = defineWidget({
    id: "biencoder",
    rootClass: "bi-root",
    exportName: "mountBiencoder",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const toy = data.toy || {};
      const q = toy.query && toy.query.vec || [];
      const d = toy.docRel && toy.docRel.vec || [];
      const qText = toy.query && toy.query.text || "";
      const dText = toy.docRel && toy.docRel.text || "";
      const cosRel = typeof toy.cosRel === "number" ? toy.cosRel : 0;
      const theta = Math.acos(Math.max(-1, Math.min(1, cosRel)));
      const thetaDeg = Math.round(theta * 180 / Math.PI);
      const cos3 = (c) => typeof c !== "number" ? "" : String(+c.toFixed(3)).replace(/^0\./, ".").replace(/^-0\./, "-.");
      const W = 560, PAD = 18;
      const boxW = 176, boxH = 44;
      const qx = PAD, dx = W - PAD - boxW;
      const qcx = qx + boxW / 2, dcx = dx + boxW / 2;
      const svg = el("svg", {
        viewBox: `0 0 ${W} 10`,
        class: "wgt-svg bi-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      const defs = el("defs", {}, svg);
      ["bi-ar-q", "bi-ar-d"].forEach((id) => {
        const m = el("marker", {
          id,
          viewBox: "0 0 10 10",
          refX: "8",
          refY: "5",
          markerWidth: "6",
          markerHeight: "6",
          orient: "auto-start-reverse"
        }, defs);
        el("path", { d: "M0,0 L10,5 L0,10 z", class: "bi-arhead" }, m);
      });
      function vecChip(name, cx, top, vec, role) {
        const cw = 24, gap = 3, n = vec.length;
        const totW = n * cw + (n - 1) * gap;
        const x0 = cx - totW / 2;
        vec.forEach((v, i) => {
          const x = x0 + i * (cw + gap);
          add(name, el("rect", { x, y: top, width: cw, height: 22, rx: 3, class: `bi-cellchip bi-cellchip-${role}` }, svg));
          add(name, el("text", { x: x + cw / 2, y: top + 16, class: "bi-cellval", "text-anchor": "middle" }, svg)).textContent = String(v);
        });
        return { bx: cx, by: top + 22 };
      }
      layer("towers", 0);
      [
        ["q", qx, qcx, labels.qLabel || "query tower", qText],
        ["d", dx, dcx, labels.dLabel || "doc tower", dText]
      ].forEach(([role, x, cx, title, text]) => {
        const top = 14;
        add("towers", el("rect", {
          x,
          y: top,
          width: boxW,
          height: boxH,
          rx: 10,
          class: `bi-tower bi-tower-${role}`,
          id: role === "d" ? "bi-dtower" : void 0
        }, svg));
        add("towers", el("text", { x: cx, y: top + boxH / 2 + 5, class: "bi-towerlbl", "text-anchor": "middle" }, svg)).textContent = title;
        add("towers", el("text", { x: cx, y: top + boxH + 17, class: "bi-input", "text-anchor": "middle" }, svg)).textContent = "\u201C" + text + "\u201D";
      });
      layer("vecs", 1);
      const chipTop = 98;
      const qChip = vecChip("vecs", qcx, chipTop, q, "q");
      const dChip = vecChip("vecs", dcx, chipTop, d, "d");
      const cxc = 196, cyc = 274, R = 84;
      add("vecs", el("circle", { cx: cxc, cy: cyc, r: R, class: "bi-circle", fill: "none" }, svg));
      add("vecs", el("circle", { cx: cxc, cy: cyc, r: 3, class: "bi-origin" }, svg));
      const aUp = -Math.PI / 2;
      const aQ = aUp - theta / 2, aD = aUp + theta / 2;
      const qpt = { x: cxc + R * Math.cos(aQ), y: cyc + R * Math.sin(aQ) };
      const dpt = { x: cxc + R * Math.cos(aD), y: cyc + R * Math.sin(aD) };
      add("vecs", el("line", { x1: cxc, y1: cyc, x2: qpt.x, y2: qpt.y, class: "bi-ray bi-ray-q" }, svg));
      add("vecs", el("line", { x1: cxc, y1: cyc, x2: dpt.x, y2: dpt.y, class: "bi-ray bi-ray-d" }, svg));
      add("vecs", el("circle", { cx: qpt.x, cy: qpt.y, r: 5, class: "bi-pt bi-pt-q" }, svg));
      add("vecs", el("circle", { cx: dpt.x, cy: dpt.y, r: 5, class: "bi-pt bi-pt-d", id: "bi-dpt" }, svg));
      add("vecs", el("line", {
        x1: qChip.bx,
        y1: qChip.by + 4,
        x2: qpt.x - 6,
        y2: qpt.y - 10,
        class: "bi-feed bi-feed-q",
        "marker-end": "url(#bi-ar-q)"
      }, svg));
      add("vecs", el("line", {
        x1: dChip.bx,
        y1: dChip.by + 4,
        x2: dpt.x + 6,
        y2: dpt.y - 10,
        class: "bi-feed bi-feed-d",
        "marker-end": "url(#bi-ar-d)"
      }, svg));
      add("vecs", el("text", { x: qpt.x - 14, y: qpt.y - 8, class: "bi-raylbl bi-raylbl-q", "text-anchor": "end" }, svg)).textContent = "q";
      add("vecs", el("text", { x: dpt.x + 14, y: dpt.y - 8, class: "bi-raylbl bi-raylbl-d", "text-anchor": "start" }, svg)).textContent = "d";
      layer("angle", 2);
      const ar = 36;
      const ax1 = cxc + ar * Math.cos(aQ), ay1 = cyc + ar * Math.sin(aQ);
      const ax2 = cxc + ar * Math.cos(aD), ay2 = cyc + ar * Math.sin(aD);
      add("angle", el("path", {
        d: `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} A ${ar} ${ar} 0 0 1 ${ax2.toFixed(1)} ${ay2.toFixed(1)}`,
        class: "bi-arc",
        fill: "none"
      }, svg));
      const pX = 348, pY = 222, pW = W - PAD - pX, pH = 108;
      add("angle", el("rect", { x: pX, y: pY, width: pW, height: pH, rx: 12, class: "bi-callbox" }, svg));
      add("angle", el("text", { x: pX + pW / 2, y: pY + 34, class: "bi-cosval", "text-anchor": "middle" }, svg)).textContent = (labels.cosLabel || "cos \u03B8") + " = " + cos3(cosRel);
      add("angle", el("text", { x: pX + pW / 2, y: pY + 64, class: "bi-theta", "text-anchor": "middle" }, svg)).textContent = "\u03B8 = " + thetaDeg + "\xB0";
      add("angle", el("text", { x: pX + pW / 2, y: pY + 90, class: "bi-readnote", "text-anchor": "middle" }, svg)).textContent = labels.nearNote || "small angle \u21D2 near";
      layer("cache", 3);
      const bx = dpt.x + 34, by = dpt.y - 2;
      add("cache", el("line", { x1: dpt.x, y1: dpt.y, x2: bx - 13, y2: by, class: "bi-cachetie" }, svg));
      [-6, 0, 6].forEach((dy) => add("cache", el(
        "ellipse",
        { cx: bx, cy: by + dy, rx: 13, ry: 4.5, class: "bi-cachechip" },
        svg
      )));
      add("cache", el("text", { x: bx, y: by + 24, class: "bi-cachelbl", "text-anchor": "middle" }, svg)).textContent = labels.cacheLabel || "cached";
      const H = frameHeightFor(cyc + R + 10, 8);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        svg.classList.toggle("bi-cached", k >= 3);
      };
    }
  });
})();
