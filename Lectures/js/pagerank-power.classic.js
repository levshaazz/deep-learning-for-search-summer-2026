/* AUTO-GENERATED offline classic bundle of widgets/pagerank-power/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
(() => {
  // widgets/_widget-base.js
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s2) {
    return String(s2).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  }
  function fmt(n, digits = 6) {
    if (typeof n !== "number" || !isFinite(n)) return "";
    return Number.isInteger(n) ? String(n) : n.toFixed(digits);
  }
  function mountName(id) {
    return "mount" + String(id).split("-").map((s2) => s2.charAt(0).toUpperCase() + s2.slice(1)).join("");
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

  // widgets/pagerank-power/logic.js
  var SVGNS2 = "http://www.w3.org/2000/svg";
  function s(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS2, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  var f4 = (n) => n.toFixed(4);
  var mountPagerankPower = defineWidget({
    id: "pagerank-power",
    rootClass: "pr-root",
    maxStep: 5,
    render({ host, data, labels }) {
      const nodes = data.nodes || ["A", "B", "C"];
      const outdeg = data.outDegree || {};
      const iters = data.iterations || [];
      const damping = data.damping != null ? data.damping : 0.85;
      const n = nodes.length;
      const vInit = iters[0] || [1 / 3, 1 / 3, 1 / 3];
      const vAfter1 = iters[1] || vInit;
      const vSettle = iters[4] || vAfter1;
      const finalArr = data.finalVector || (data.final ? nodes.map((id) => data.final[id]) : iters[iters.length - 1]);
      const vConverged = finalArr;
      const wu = data.workedUpdate || {};
      const wBase = wu.baseTerm != null ? wu.baseTerm : (1 - damping) / n;
      const wA = wu.contribFromA != null ? wu.contribFromA : 0;
      const wC = wu.contribFromC != null ? wu.contribFromC : 0;
      const wSum = wu.contribSum != null ? wu.contribSum : wA + wC;
      const wDamped = wu.dampedTerm != null ? wu.dampedTerm : damping * wSum;
      const wPR1 = wu.pr1 != null ? wu.pr1 : wBase + wDamped;
      let authIdx = 0;
      for (let i = 1; i < n; i++) if (vConverged[i] > vConverged[authIdx]) authIdx = i;
      const panel = document.createElement("div");
      panel.className = "wgt-panel pr-panel";
      host.appendChild(panel);
      const gWrap = document.createElement("div");
      gWrap.className = "pr-graph";
      const gHead = document.createElement("div");
      gHead.className = "pr-head";
      gHead.textContent = labels.graphHead || "The 3-page web";
      gWrap.appendChild(gHead);
      panel.appendChild(gWrap);
      const svg = s("svg", {
        viewBox: "0 -34 420 226",
        width: "100%",
        class: "wgt-svg pr-svg",
        role: "img",
        "aria-label": labels && labels.alt || "Three-page link graph: A points to B, B points to C, C points to A and B, so B has two in-links and is the authority."
      }, gWrap);
      const defs = s("defs", null, svg);
      const mk = (id, fill) => {
        const m = s("marker", {
          id,
          viewBox: "0 0 10 10",
          refX: "9",
          refY: "5",
          markerWidth: "6",
          markerHeight: "6",
          orient: "auto"
        }, defs);
        s("path", { d: "M0 0 L10 5 L0 10 z", fill }, m);
      };
      mk("pr-arr", "var(--ink-3, #6B7280)");
      mk("pr-arrA", "var(--accent, #2A6FDB)");
      const P = { A: { x: 78, y: 56 }, B: { x: 240, y: 38 }, C: { x: 344, y: 128 } };
      const edge = (a, b, accent) => {
        const dx = P[b].x - P[a].x, dy = P[b].y - P[a].y;
        const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        const rA = a === "B" ? 34 : 30, rB = b === "B" ? 34 : 30;
        s("line", {
          x1: P[a].x + ux * rA,
          y1: P[a].y + uy * rA,
          x2: P[b].x - ux * (rB + 4),
          y2: P[b].y - uy * (rB + 4),
          stroke: accent ? "var(--accent, #2A6FDB)" : "var(--ink-3, #6B7280)",
          "stroke-width": accent ? 3.5 : 3,
          "marker-end": accent ? "url(#pr-arrA)" : "url(#pr-arr)"
        }, svg);
      };
      edge("A", "B", true);
      edge("B", "C", false);
      edge("C", "A", false);
      edge("C", "B", true);
      nodes.forEach((id) => {
        const isAuth = id === nodes[authIdx];
        const r = isAuth ? 34 : 30;
        s("circle", {
          cx: P[id].x,
          cy: P[id].y,
          r,
          class: "pr-node" + (isAuth ? " pr-node-auth" : ""),
          fill: isAuth ? "var(--accent-soft, #DCE8FB)" : "var(--bg-card, #fff)",
          stroke: isAuth ? "var(--accent, #2A6FDB)" : "var(--ink-3, #6B7280)",
          "stroke-width": isAuth ? 4 : 3
        }, svg);
        const txt = s("text", {
          x: P[id].x,
          y: P[id].y + 9,
          "text-anchor": "middle",
          class: "pr-node-lbl",
          fill: isAuth ? "var(--accent-ink, #1B4FA0)" : "var(--ink, #14181F)"
        }, svg);
        txt.textContent = id;
        const od = s("text", {
          x: P[id].x,
          y: P[id].y + (isAuth ? 52 : 48),
          "text-anchor": "middle",
          class: "pr-node-od",
          fill: "var(--ink-3, #6B7280)"
        }, svg);
        od.textContent = `${labels.outdegLabel || "out"} ${outdeg[id] != null ? outdeg[id] : ""}`;
      });
      const tag = s("text", {
        x: P[nodes[authIdx]].x,
        y: P[nodes[authIdx]].y - 44,
        "text-anchor": "middle",
        class: "pr-auth-tag",
        fill: "var(--accent-ink, #1B4FA0)"
      }, svg);
      tag.textContent = labels.authorityTag || "2 in-links \u2192 authority";
      const barWrap = document.createElement("div");
      barWrap.className = "pr-bars-wrap";
      const bHead = document.createElement("div");
      bHead.className = "pr-head";
      const bHeadTxt = document.createElement("span");
      bHeadTxt.textContent = labels.vectorHead || "Rank vector PR";
      bHead.appendChild(bHeadTxt);
      const iterTag = document.createElement("span");
      iterTag.className = "pr-iter-tag";
      bHead.appendChild(iterTag);
      barWrap.appendChild(bHead);
      const bars = document.createElement("div");
      bars.className = "pr-bars";
      let vmax = 0;
      iters.forEach((v) => v.forEach((x) => {
        if (x > vmax) vmax = x;
      }));
      if (!vmax) vmax = 0.5;
      const cells = nodes.map((id, i) => {
        const cell = document.createElement("div");
        cell.className = "pr-bar-cell";
        const track = document.createElement("div");
        track.className = "pr-bar-track";
        const fill = document.createElement("div");
        fill.className = "pr-bar-fill" + (i === authIdx ? " pr-bar-auth" : "");
        const val = document.createElement("div");
        val.className = "pr-bar-val";
        fill.appendChild(val);
        track.appendChild(fill);
        const name = document.createElement("div");
        name.className = "pr-bar-name";
        name.textContent = id;
        cell.appendChild(track);
        cell.appendChild(name);
        bars.appendChild(cell);
        return { fill, val };
      });
      barWrap.appendChild(bars);
      panel.appendChild(barWrap);
      function setBars(vec, iterTagText) {
        vec.forEach((x, i) => {
          cells[i].fill.style.height = `${Math.max(2, x / vmax * 100)}%`;
          cells[i].val.textContent = f4(x);
        });
        iterTag.textContent = iterTagText || "";
      }
      const upd = document.createElement("div");
      upd.className = "pr-update";
      const uHead = document.createElement("div");
      uHead.className = "pr-head pr-update-head";
      uHead.textContent = labels.updateHead || "Power-iteration update";
      upd.appendChild(uHead);
      const rule = document.createElement("div");
      rule.className = "pr-rule";
      rule.textContent = "PR(i) = (1\u2212d)/n + d \xB7 \u03A3_{j\u2192i} PR(j)/outdeg(j)";
      upd.appendChild(rule);
      const work = document.createElement("div");
      work.className = "pr-work";
      work.innerHTML = `<div class="pr-work-line pr-w-base">base = (1\u2212${esc(damping)})/${esc(n)} = <b>${esc(f4(wBase))}</b></div><div class="pr-work-line pr-w-in">in-links of B: A/${esc(outdeg.A != null ? outdeg.A : 1)} = ${esc(f4(wA))} \xB7 C/${esc(outdeg.C != null ? outdeg.C : 2)} = ${esc(f4(wC))}</div><div class="pr-work-line pr-w-pr1">PR\u2081(B) = ${esc(f4(wBase))} + ${esc(damping)}\xB7${esc(f4(wSum))} = ${esc(f4(wBase))} + ${esc(f4(wDamped))} = <b class="pr-hot">${esc(f4(wPR1))}</b></div>`;
      upd.appendChild(work);
      panel.appendChild(upd);
      const banner = document.createElement("div");
      banner.className = "pr-banner";
      const order = nodes.map((id, i) => ({ id, v: vConverged[i] })).sort((a, b) => b.v - a.v);
      banner.innerHTML = `<span class="pr-banner-rank">` + order.map((o, i) => `<b>${esc(o.id)}</b> ${esc(f4(o.v))}`).join(' <span class="pr-gt">&gt;</span> ') + `</span><span class="pr-banner-tag">query-independent</span>`;
      panel.appendChild(banner);
      return function update(k) {
        if (k <= 1) setBars(vInit, `${labels.iterLabel || "iter"} 0`);
        else if (k === 2) setBars(vAfter1, `${labels.iterLabel || "iter"} 1`);
        else if (k === 3) setBars(vSettle, `${labels.iterLabel || "iter"} 4`);
        else setBars(vConverged, `${labels.iterLabel || "iter"} 25 \xB7 ${labels.convergedTag || "converged"}`);
        upd.classList.toggle("is-active", k >= 1);
        work.querySelector(".pr-w-base").classList.toggle("is-hidden", k < 1);
        work.querySelector(".pr-w-in").classList.toggle("is-hidden", k < 1);
        work.querySelector(".pr-w-pr1").classList.toggle("is-hidden", k < 2);
        bars.classList.toggle("is-settled", k >= 4);
        banner.classList.toggle("is-shown", k >= 5);
      };
    }
  });
})();
