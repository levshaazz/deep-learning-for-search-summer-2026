/* AUTO-GENERATED offline classic bundle of widgets/ranking-metrics/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/ranking-metrics/logic.js
  var fmt2 = (x) => (Math.round(x * 1e4) / 1e4).toString();
  var fmt22 = (x) => (Math.round(x * 100) / 100).toString();
  var mountRankingMetrics = defineWidget({
    id: "ranking-metrics",
    rootClass: "rm-root",
    exportName: "mountRankingMetrics",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const W = 480;
      const ranked = data.ranked;
      const svg = el("svg", {
        class: "wgt-svg rm-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const list = { x: 18, y: 56, w: 196, rowH: 40 };
      el("text", { x: list.x, y: list.y - 20, class: "rm-col-title" }, svg).textContent = labels.listTitle || "BM25 ranking";
      const hlK = data.ks.includes(5) ? 5 : data.ks[Math.floor(data.ks.length / 2)];
      const band = el("rect", {
        x: list.x - 4,
        y: list.y - 4,
        width: list.w + 8,
        height: list.rowH * hlK + 8,
        class: "rm-band is-hidden",
        rx: 8
      }, svg);
      const rows = ranked.map((d, i) => {
        const y0 = list.y + i * list.rowH;
        const g = el("g", { class: "rm-row", "data-id": d.id }, svg);
        el("rect", {
          x: list.x,
          y: y0,
          width: list.w,
          height: list.rowH - 6,
          class: "rm-rowbg" + (d.rel ? " is-rel" : ""),
          rx: 6
        }, g);
        el("text", {
          x: list.x + 14,
          y: y0 + (list.rowH - 6) / 2 + 4,
          class: "rm-rank",
          "text-anchor": "middle"
        }, g).textContent = d.rank;
        el("text", { x: list.x + 34, y: y0 + (list.rowH - 6) / 2 + 4, class: "rm-docid" }, g).textContent = d.id;
        const mark = el("text", {
          x: list.x + list.w - 16,
          y: y0 + (list.rowH - 6) / 2 + 5,
          class: "rm-mark " + (d.rel ? "is-rel" : "is-nonrel"),
          "text-anchor": "middle"
        }, g);
        mark.textContent = d.rel ? "\u2713" : "\u2717";
        const disc = (data.discounts || []).find((x) => x.rank === d.rank) || { discount: 0, contrib: 0 };
        const contribTxt = el("text", {
          x: list.x + list.w + 8,
          y: y0 + (list.rowH - 6) / 2 + 4,
          class: "rm-contrib is-hidden"
        }, g);
        contribTxt.textContent = `\xD7${fmt2(disc.discount)} = ${fmt2(disc.contrib)}`;
        return { d, g, mark, contribTxt, disc, y0 };
      });
      const panel = { x: 18, y: list.y + ranked.length * list.rowH + 26, w: W - 36 };
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      layer("rp", 1);
      layer("mrr", 2);
      layer("map", 3);
      layer("ndcg", 4);
      const head = (name, x, y, cls, text) => add(name, el("text", { x, y, class: "rm-annot " + cls }, svg)).textContent = text;
      const sub = (name, x, y, text) => add(name, el("text", { x, y, class: "rm-annot rm-sub" }, svg)).textContent = text;
      let py = panel.y;
      head("rp", panel.x, py, "rm-rp-h", labels.rpTitle || "Recall@k  &  Precision@k");
      const colX = [panel.x, panel.x + 90, panel.x + 200];
      add("rp", el("text", { x: colX[0], y: py + 18, class: "rm-th" }, svg)).textContent = "k";
      add("rp", el("text", { x: colX[1], y: py + 18, class: "rm-th" }, svg)).textContent = labels.recall || "Recall@k";
      add("rp", el("text", { x: colX[2], y: py + 18, class: "rm-th" }, svg)).textContent = labels.precision || "Precision@k";
      data.ks.forEach((k, i) => {
        const ry = py + 18 + (i + 1) * 16;
        const hot = k === hlK;
        add("rp", el("text", { x: colX[0], y: ry, class: "rm-td" + (hot ? " is-hot" : "") }, svg)).textContent = k;
        add("rp", el("text", { x: colX[1], y: ry, class: "rm-td" + (hot ? " is-hot" : "") }, svg)).textContent = fmt2(data.recallAtK[k]);
        add("rp", el("text", { x: colX[2], y: ry, class: "rm-td" + (hot ? " is-hot" : "") }, svg)).textContent = fmt2(data.precisionAtK[k]);
      });
      const tableBottom = panel.y + 18 + (data.ks.length + 1) * 16 + 10;
      head(
        "mrr",
        panel.x,
        tableBottom,
        "rm-mrr-h",
        `MRR = RR = 1/${data.firstRelevantRank} = ${fmt2(data.rr)}`
      );
      sub(
        "mrr",
        panel.x,
        tableBottom + 16,
        labels.mrrHint || "first relevant result;"
      );
      sub(
        "mrr",
        panel.x,
        tableBottom + 32,
        labels.mrrHintB || "MRR averages 1/rank over many queries"
      );
      const mapY = tableBottom + 56;
      let seen = 0;
      const hits = [];
      ranked.forEach((d) => {
        if (d.rel) {
          seen += 1;
          hits.push({ rank: d.rank, p: seen / d.rank });
        }
      });
      head("map", panel.x, mapY, "rm-map-h", `MAP = AP = ${fmt2(data.ap)}`);
      sub(
        "map",
        panel.x,
        mapY + 16,
        labels.mapHintLead || "mean of precision at each relevant rank:"
      );
      sub(
        "map",
        panel.x,
        mapY + 32,
        hits.map((h) => fmt22(h.p)).join(" + ") + " " + (labels.mapHintOver || "over") + " " + hits.length
      );
      const ndY = mapY + 56;
      const relContribs = (data.discounts || []).filter((d) => d.contrib > 0);
      head(
        "ndcg",
        panel.x,
        ndY,
        "rm-ndcg-h",
        `DCG = ${relContribs.map((d) => fmt2(d.contrib)).join(" + ")} = ${fmt2(data.dcg)}`
      );
      const idealHead = (data.idealOrder || []).slice(0, data.relevantTotal || 4);
      const idealStr = idealHead.join(" \u203A ") + ((data.idealOrder || []).length > idealHead.length ? " \u2026" : "");
      head(
        "ndcg",
        panel.x,
        ndY + 18,
        "rm-ndcg-h2",
        `IDCG = ${fmt2(data.idcg)}   (${labels.idealLabel || "ideal order"}: ${idealStr})`
      );
      add("ndcg", el("text", { x: panel.x, y: ndY + 46, class: "rm-annot rm-ndcg-big" }, svg)).textContent = `nDCG = ${fmt2(data.dcg)} / ${fmt2(data.idcg)} = ${fmt2(data.ndcg)}`;
      const listBottom = list.y + ranked.length * list.rowH;
      const panelBottom = ndY + 46;
      const H = frameHeightFor(Math.max(listBottom, panelBottom));
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        band.classList.toggle("is-hidden", k < 1);
        rows.forEach((r) => {
          r.g.classList.toggle("is-first-rel", k >= 2 && r.d.rank === data.firstRelevantRank);
          r.contribTxt.classList.toggle("is-hidden", k < 4);
          r.g.classList.toggle("is-ndcg", k >= 4);
        });
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
