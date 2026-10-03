/* AUTO-GENERATED offline classic bundle of widgets/pca-rotate/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function padDomain(min, max, frac = 0.08) {
    let span = max - min;
    if (!(span > 0)) span = Math.abs(min) || 1;
    const p = span * frac;
    return { min: min - p, max: max + p, span: max - min + 2 * p };
  }
  function clampSegmentToRect(x1, y1, x2, y2, rect) {
    const xmin = rect.x, ymin = rect.y, xmax = rect.x + rect.w, ymax = rect.y + rect.h;
    const dx = x2 - x1, dy = y2 - y1;
    let t0 = 0, t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return null;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return null;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return null;
          if (t < t1) t1 = t;
        }
      }
    }
    return {
      x1: x1 + t0 * dx,
      y1: y1 + t0 * dy,
      x2: x1 + t1 * dx,
      y2: y1 + t1 * dy
    };
  }
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }
  function parseViewBox(vb) {
    const p = String(vb || "").trim().split(/[\s,]+/).map(Number);
    return p.length === 4 && p.every((n) => isFinite(n)) ? { x: p[0], y: p[1], w: p[2], h: p[3] } : null;
  }
  function cameraTo(svg, target, opts = {}) {
    const dur = typeof opts.dur === "number" ? opts.dur : 520;
    const ease = opts.ease || ((t2) => 1 - Math.pow(1 - t2, 3));
    const from = parseViewBox(svg.getAttribute("viewBox")) || { x: 0, y: 0, w: 100, h: 100 };
    const full = opts.clampTo || svg.__cameraFull || from;
    const aspect = full.w / full.h;
    let t = target ? { ...target } : { ...full };
    if (opts.pad) {
      t = { x: t.x - opts.pad, y: t.y - opts.pad, w: t.w + 2 * opts.pad, h: t.h + 2 * opts.pad };
    }
    if (t.w / t.h > aspect) {
      const nh = t.w / aspect;
      t.y -= (nh - t.h) / 2;
      t.h = nh;
    } else {
      const nw = t.h * aspect;
      t.x -= (nw - t.w) / 2;
      t.w = nw;
    }
    t.w = Math.min(t.w, full.w);
    t.h = Math.min(t.h, full.h);
    t.x = Math.max(full.x, Math.min(t.x, full.x + full.w - t.w));
    t.y = Math.max(full.y, Math.min(t.y, full.y + full.h - t.h));
    if (svg.__cameraCancel) svg.__cameraCancel();
    const setVB = (b) => svg.setAttribute("viewBox", `${b.x.toFixed(2)} ${b.y.toFixed(2)} ${b.w.toFixed(2)} ${b.h.toFixed(2)}`);
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || dur <= 0 || typeof requestAnimationFrame !== "function") {
      setVB(t);
      svg.__cameraCancel = null;
      if (opts.onDone) opts.onDone();
      return () => {
      };
    }
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    let raf = 0, cancelled = false;
    const tick = (now) => {
      if (cancelled) return;
      const p = Math.min(1, ((now || Date.now()) - t0) / dur);
      const e = ease(p);
      setVB({
        x: from.x + (t.x - from.x) * e,
        y: from.y + (t.y - from.y) * e,
        w: from.w + (t.w - from.w) * e,
        h: from.h + (t.h - from.h) * e
      });
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        svg.__cameraCancel = null;
        if (opts.onDone) opts.onDone();
      }
    };
    const cancel = () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      svg.__cameraCancel = null;
    };
    svg.__cameraCancel = cancel;
    raf = requestAnimationFrame(tick);
    return cancel;
  }
  function cameraInit(svg) {
    const vb = parseViewBox(svg.getAttribute("viewBox"));
    if (vb) svg.__cameraFull = vb;
    return vb;
  }
  function cameraHome(svg, opts = {}) {
    return cameraTo(svg, svg.__cameraFull || null, opts);
  }

  // widgets/pca-rotate/logic.js
  var PC_COLOR = ["var(--accent, #2A6FDB)", "var(--c-violet, #7D5BA6)", "var(--ink-4, #9CA3AF)"];
  var mountPcaRotate = defineWidget({
    id: "pca-rotate",
    rootClass: "pcr-root",
    exportName: "mountPcaRotate",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const cloud = data.cloud3d || [];
      const frames = data.frames || [];
      const eigvecRaw = data.eigenvectors || [];
      const eigvec = eigvecRaw.length ? eigvecRaw[0].map((_, i) => eigvecRaw.map((row) => row[i])) : [];
      const evPct = data.explainedVarPct || [];
      const var2d = data.var2dPct;
      const final2d = data.final2d || [];
      const frameForStep = [0, 0, 2, 3];
      const ptsAt = (fi) => frames[fi] && frames[fi].points || cloud;
      const A = 0.6, B = 0.32;
      const iso = (x, y, z) => ({
        u: x - z * A,
        // screen "x" (data x spreads right, z recedes left)
        v: -y * 0.92 - z * B
        // screen "y" (data y up; z lifts slightly)
      });
      const allUV = [];
      frames.forEach((f) => (f.points || []).forEach((p) => allUV.push(iso(p[0], p[1], p[2]))));
      cloud.forEach((p) => allUV.push(iso(p[0], p[1], p[2])));
      eigvec.forEach((v, i) => {
        const L = 3.4;
        allUV.push(iso(v[0] * L, v[1] * L, v[2] * L));
        allUV.push(iso(-v[0] * L, -v[1] * L, -v[2] * L));
      });
      const us = allUV.map((p) => p.u), vs = allUV.map((p) => p.v);
      const du = padDomain(Math.min(...us), Math.max(...us), 0.12);
      const dv = padDomain(Math.min(...vs), Math.max(...vs), 0.12);
      const W = 480;
      const PAD_L = 20, PAD_R = 20, PAD_T = 34;
      const plotH = 300;
      const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - PAD_R, h: plotH };
      const sU = box.w / du.span, sV = box.h / dv.span;
      const s = Math.min(sU, sV);
      const cu = (du.min + du.max) / 2, cv = (dv.min + dv.max) / 2;
      const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
      const projIso = (x, y, z) => {
        const p = iso(x, y, z);
        return { x: cx + (p.u - cu) * s, y: cy + (p.v - cv) * s };
      };
      const originIso = projIso(0, 0, 0);
      const fx = final2d.map((p) => p[0]), fy = final2d.map((p) => p[1]);
      const dfx = padDomain(Math.min(...fx), Math.max(...fx), 0.12);
      const dfy = padDomain(Math.min(...fy), Math.max(...fy), 0.12);
      const scaleFlat = Math.min(box.w / dfx.span, box.h / dfy.span);
      const cfx = (dfx.min + dfx.max) / 2, cfy = (dfy.min + dfy.max) / 2;
      const proj2d = (px, py) => ({ x: cx + (px - cfx) * scaleFlat, y: cy - (py - cfy) * scaleFlat });
      const H = frameHeightFor(PAD_T + plotH + 16, 8);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg pcr-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      cameraInit(svg);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      layer("frame", 0);
      add("frame", el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "pcr-frame" }, svg));
      layer("chrome", 0, 3);
      const ttl = add("chrome", el("text", { x: box.x, y: box.y - 12, class: "pcr-title" }, svg));
      const sub = add("chrome", el("text", { x: box.x + box.w, y: box.y - 12, class: "pcr-sub", "text-anchor": "end" }, svg));
      layer("cloud", 0, 3);
      const dots = cloud.map(() => add("cloud", el("circle", { r: 4.5, class: "pcr-dot" }, svg)));
      layer("axes", 1, 3);
      const AXLEN = 3.4;
      const alignedTip = [[AXLEN, 0, 0], [0, AXLEN, 0], [0, 0, AXLEN]];
      const initTip = eigvec.map((v) => [v[0] * AXLEN, v[1] * AXLEN, v[2] * AXLEN]);
      const axisEls = [0, 1, 2].map((i) => {
        const g = el("g", {}, svg);
        const line = el("line", { class: "pcr-axis", stroke: PC_COLOR[i], "stroke-width": i === 2 ? 1.6 : 2.6 }, g);
        const lbl = el("text", { class: "pcr-axislbl", fill: PC_COLOR[i] }, g);
        lbl.textContent = `PC${i + 1}`;
        add("axes", g);
        return { line, lbl };
      });
      layer("varlabels", 3, 3);
      const varEls = [0, 1, 2].map((i) => {
        const t = add("varlabels", el("text", { class: "pcr-varlbl", fill: PC_COLOR[i] }, svg));
        if (typeof evPct[i] === "number") t.textContent = `PC${i + 1}: ${evPct[i].toFixed(2)}%`;
        return t;
      });
      layer("flat", 4, 4);
      const flatXY = final2d.map((p) => proj2d(p[0], p[1]));
      const fxs = flatXY.map((p) => p.x), fys = flatXY.map((p) => p.y);
      const fMinX = Math.min(...fxs, cx), fMaxX = Math.max(...fxs, cx);
      const fMinY = Math.min(...fys, cy), fMaxY = Math.max(...fys, cy);
      const AX_PAD = 22;
      const axL = Math.max(box.x + 6, fMinX - AX_PAD), axR = Math.min(box.x + box.w - 6, fMaxX + AX_PAD);
      const axT = Math.max(box.y + 6, fMinY - AX_PAD), axB = Math.min(box.y + box.h - 6, fMaxY + AX_PAD);
      add("flat", el("line", { x1: axL, y1: cy, x2: axR, y2: cy, class: "pcr-flataxis" }, svg));
      add("flat", el("line", { x1: cx, y1: axT, x2: cx, y2: axB, class: "pcr-flataxis" }, svg));
      add("flat", el("text", { x: axR, y: cy - 6, class: "pcr-flatlbl", "text-anchor": "end" }, svg)).textContent = "PC1";
      add("flat", el("text", { x: cx + 6, y: axT + 12, class: "pcr-flatlbl" }, svg)).textContent = "PC2";
      flatXY.forEach((q) => add("flat", el("circle", { cx: q.x, cy: q.y, r: 4.5, class: "pcr-flatdot" }, svg)));
      const headY = Math.min(box.y + box.h - 8, axB + 24);
      const flatHead = add("flat", el("text", { x: cx, y: headY, class: "pcr-flathead", "text-anchor": "middle" }, svg));
      if (typeof var2d === "number")
        flatHead.textContent = (labels.kept2d || "PC1 + PC2 keep") + " " + var2d.toFixed(2) + "%";
      const flatTarget = (() => {
        if (!flatXY.length) return null;
        const PAD = 26;
        const minX = Math.min(axL, ...fxs, cx) - PAD, maxX = Math.max(axR, ...fxs, cx) + PAD;
        const minY = Math.min(axT, ...fys) - PAD, maxY = Math.max(headY, axB, ...fys) + PAD;
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      })();
      function placeFrame(fi) {
        const pts = ptsAt(fi);
        dots.forEach((d, i) => {
          const p = pts[i] || cloud[i] || [0, 0, 0];
          const q = projIso(p[0], p[1], p[2]);
          d.setAttribute("cx", q.x);
          d.setAttribute("cy", q.y);
        });
        const frac = frames[fi] && typeof frames[fi].frac === "number" ? frames[fi].frac : 0;
        axisEls.forEach((ax, i) => {
          const t0 = initTip[i] || [0, 0, 0], t1 = alignedTip[i];
          const tip = [0, 1, 2].map((d) => t0[d] + (t1[d] - t0[d]) * frac);
          const tp = projIso(tip[0], tip[1], tip[2]);
          const seg = clampSegmentToRect(originIso.x, originIso.y, tp.x, tp.y, box);
          if (seg) {
            ax.line.setAttribute("x1", seg.x1);
            ax.line.setAttribute("y1", seg.y1);
            ax.line.setAttribute("x2", seg.x2);
            ax.line.setAttribute("y2", seg.y2);
            ax.lbl.setAttribute("x", seg.x2 + (seg.x2 >= originIso.x ? 4 : -4));
            ax.lbl.setAttribute("y", seg.y2 - 4);
            ax.lbl.setAttribute("text-anchor", seg.x2 >= originIso.x ? "start" : "end");
            ax.line.classList.remove("is-hidden");
            ax.lbl.classList.remove("is-hidden");
          } else {
            ax.line.classList.add("is-hidden");
            ax.lbl.classList.add("is-hidden");
          }
        });
        varEls.forEach((t, i) => {
          const t1 = alignedTip[i];
          const isPC3 = i === 2;
          const frac2 = isPC3 ? 0.78 : 0.45;
          const dy = isPC3 ? 18 : 14;
          const tp = projIso(t1[0] * frac2, t1[1] * frac2, t1[2] * frac2);
          if (isPC3) t.setAttribute("text-anchor", "end");
          const minX = isPC3 ? box.x + 88 : box.x + 4;
          const maxX = isPC3 ? box.x + box.w - 4 : box.x + box.w - 86;
          t.setAttribute("x", Math.max(minX, Math.min(maxX, tp.x)));
          t.setAttribute("y", Math.max(box.y + 14, Math.min(box.y + box.h - 6, tp.y + dy)));
        });
      }
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const n of L.nodes) n.classList.toggle("is-hidden", !on);
        }
        if (k <= 3) placeFrame(frameForStep[k]);
        if (k === 4 && flatTarget) cameraTo(svg, flatTarget, { dur: 620 });
        else cameraHome(svg, { dur: 480 });
        if (k === 0) {
          ttl.textContent = labels.t3d || "3-D cloud";
          sub.textContent = labels.subCorr || "correlated";
        } else if (k === 1) {
          ttl.textContent = labels.tAxes || "principal axes";
          sub.textContent = "PC1 \xB7 PC2 \xB7 PC3";
        } else if (k === 2) {
          ttl.textContent = labels.tRotate || "rotating\u2026";
          sub.textContent = labels.subRigid || "rigid turn";
        } else if (k === 3) {
          ttl.textContent = labels.tAligned || "axes aligned";
          sub.textContent = labels.subAligned || "PCs on screen axes";
        } else {
          ttl.textContent = labels.tFlat || "projected to 2-D";
          sub.textContent = typeof var2d === "number" ? `${var2d.toFixed(2)}% ${labels.varKept || "kept"}` : "";
        }
      };
    }
  });
})();
