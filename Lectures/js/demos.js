/* =========================================================
   INTERACTIVE-DEMO — declarative API for live demonstrations.

   Markup:
     <interactive-demo kind="function-plot" algorithm="gradient-descent">
       <function fn="0.4*x*x + 0.8" range="-5..5"/>
       <param name="lr"    label="learning rate η" min="0.01" max="1.5" step="0.01" default="0.2"/>
       <param name="x0"    label="x₀ (start)"      min="-4"   max="4"   step="0.1"  default="3.5"/>
       <param name="iters" label="iterations"       min="1"    max="80"  step="1"    default="30"/>
       <readout name="loss"        label="L(x_T)"/>
       <readout name="iters_used"  label="steps used"/>
     </interactive-demo>

   Supported `kind` values (must match the DEMOS registry below exactly —
   preflight.js validates against the same list):
     • function-plot       — 1-variable function + iterative algorithm trajectory
     • distribution        — PDF/CDF of a parametric distribution

   To add a new kind, push into DEMOS — each entry exports build({el, conf, refs}).
   (An `attention` demo is NOT implemented; kind="attention" will render an
   "Unknown demo kind" error. Use the declarative e2e slide for attention.)
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_demos) return;
  window.__lec_demos = 1;

  if (new URL(location.href).searchParams.get('presenter') === '1') return;

  /* ---------- Tiny expression evaluator ---------- */
  /* Compiles author-supplied math expressions for `fn`/`formula`. The filter
     below blocks statements/keywords; it is not an isolation boundary, so
     only evaluate trusted (author) input. */
  const EVAL_CACHE = new Map();
  function compileExpr(expr, varNames) {
    const key = varNames.join('|') + ':' + expr;
    if (EVAL_CACHE.has(key)) return EVAL_CACHE.get(key);
    /* Block statements and disallowed keywords. */
    if (/[;{}\[\]`]|\b(?:while|for|function|class|async|await|new|import|export|window|document|globalThis|this|eval|Function|setTimeout|setInterval|fetch|XMLHttpRequest)\b/i.test(expr)) {
      throw new Error('Disallowed identifier in expression: ' + expr);
    }
    const body =
      `with (Math) { return (${expr}); }`;
    /* eslint-disable no-new-func */
    const fn = new Function(...varNames, body);
    EVAL_CACHE.set(key, fn);
    return fn;
  }

  /* ---------- Common chart helpers ---------- */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function ctxForCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    /* Measure the CONTAINER, not the canvas. We pin canvas.style.width to a px
       value below; if we measured canvas.clientWidth it would echo that stale
       px on every later call, so a canvas first drawn while its slide was
       hidden (measured 0 → clamped to 100) would stay 100×100 forever and never
       grow back once shown. The parent .demo-canvas box always reflects real
       layout, so it recovers the moment the slide becomes visible. */
    let W = 0, H = 0;
    const parent = canvas.parentElement;
    if (parent) {
      const cs = getComputedStyle(parent);
      W = parent.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      H = parent.clientHeight - parseFloat(cs.paddingTop || 0) - parseFloat(cs.paddingBottom || 0);
    }
    if (!W || !H) { W = canvas.clientWidth; H = canvas.clientHeight; }
    W = Math.max(100, W); H = Math.max(100, H);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H };
  }

  /* Watch the canvas's parent for size changes — when the slide becomes
     active (display: none → block), the parent suddenly has real width.
     We re-invoke draw() on every size change so the chart fills its
     box. Without this the canvas locks to whatever it measured at init
     time (often 100×100 if the slide was hidden). */
  function watchResize(el, redraw) {
    if (typeof ResizeObserver === 'undefined') return;
    /* Observe the CONTAINER, not the canvas: once canvas.style is pinned to px
       (see ctxForCanvas) the canvas no longer changes size with its slide, so a
       canvas-targeted observer would never fire on show/hide. The parent box
       goes 0 → real-width when the slide activates, which is the signal we want. */
    const target = el.parentElement || el;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(redraw);
    });
    ro.observe(target);
    return ro;
  }

  /* ---------- KIND: function-plot ---------- */
  /* Renders y = f(x) over a range; if `algorithm` is set, overlays
     an iterative method's trajectory of points. */
  const FUNCTION_PLOT = {
    build({ el, conf, refs, params, readouts }) {
      const fnConf = el.querySelector('function');
      if (!fnConf) throw new Error('<interactive-demo kind="function-plot"> needs a <function> child.');
      const fnExpr = fnConf.getAttribute('fn');
      const [rMin, rMax] = (fnConf.getAttribute('range') || '-5..5').split('..').map(Number);
      const f = compileExpr(fnExpr, ['x']);
      /* Numerical derivative — algorithm authors don't have to supply one. */
      const df = (x) => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;

      const algo = conf.algorithm;
      const algorithmFn = ALGOS[algo] || null;
      if (algo && !algorithmFn) console.warn(`Unknown algorithm "${algo}" — drawing function only.`);

      function draw() {
        const { ctx, W, H } = ctxForCanvas(refs.canvas);
        ctx.clearRect(0, 0, W, H);
        const padL = 40, padR = 16, padT = 24, padB = 36;
        const plotW = W - padL - padR, plotH = H - padT - padB;

        /* Sample y-range for autoscale */
        let yMin = Infinity, yMax = -Infinity;
        for (let xi = rMin; xi <= rMax; xi += (rMax - rMin) / 200) {
          const v = f(xi);
          if (isFinite(v)) {
            if (v < yMin) yMin = v;
            if (v > yMax) yMax = v;
          }
        }
        const yPad = (yMax - yMin) * 0.1 || 1;
        yMin -= yPad; yMax += yPad;

        const sx = (x) => padL + ((x - rMin) / (rMax - rMin)) * plotW;
        const sy = (y) => padT + (1 - (y - yMin) / (yMax - yMin)) * plotH;

        /* Axes */
        ctx.strokeStyle = cssVar('--rule') || '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
        ctx.stroke();
        ctx.font = `14px ${cssVar('--font-mono') || 'monospace'}`;
        ctx.fillStyle = cssVar('--ink-3') || '#888';
        ctx.fillText('x', padL + plotW - 8, padT + plotH + 24);
        ctx.fillText('y', padL - 28, padT + 12);

        /* Curve */
        ctx.strokeStyle = cssVar('--ink') || '#222';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let first = true;
        for (let xi = rMin; xi <= rMax; xi += (rMax - rMin) / 400) {
          const px = sx(xi), py = sy(f(xi));
          if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
        }
        ctx.stroke();

        /* Trajectory */
        let traj = null, stepsUsed = 0;
        if (algorithmFn) {
          traj = algorithmFn(f, df, params);
          stepsUsed = traj.length - 1;
          ctx.strokeStyle = cssVar('--c-red') || '#D7522C';
          ctx.lineWidth = 2;
          ctx.beginPath();
          traj.forEach((p, i) => {
            const px = sx(p.x), py = sy(p.y);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.fillStyle = cssVar('--c-red') || '#D7522C';
          traj.forEach((p, i) => {
            const px = sx(p.x), py = sy(p.y);
            ctx.beginPath();
            const r = i === 0 ? 6 : (i === traj.length - 1 ? 8 : 3);
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        /* Readouts */
        if (traj && readouts.loss && traj.length) {
          readouts.loss.textContent = traj[traj.length - 1].y.toFixed(3);
        }
        if (readouts.iters_used) {
          readouts.iters_used.textContent = String(stepsUsed);
        }
      }

      Object.values(refs.paramInputs).forEach(input => input.addEventListener('input', draw));
      new MutationObserver(draw).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-theme'],
      });
      const hostSlide = el.closest('.slide');
      hostSlide?.addEventListener('tweaks:applied', draw);
      /* Redraw on entry — slide had display:none, canvas had 0 box. */
      hostSlide?.addEventListener('slide:enter', () => {
        requestAnimationFrame(() => requestAnimationFrame(draw));
      });
      window.addEventListener('focus', draw);
      watchResize(refs.canvas, draw);
      /* Final fallback: deferred redraw after layout settles. */
      setTimeout(draw, 100);
      setTimeout(draw, 600);
      draw();
    },
  };

  /* ---------- KIND: distribution ---------- */
  /* Plots PDF + optional CDF of a parametric distribution. */
  const DISTRIBUTIONS = {
    normal: {
      pdf: (x, p) => {
        const z = (x - p.mu) / p.sigma;
        return Math.exp(-0.5 * z * z) / (p.sigma * Math.sqrt(2 * Math.PI));
      },
      range: (p) => [p.mu - 4 * p.sigma, p.mu + 4 * p.sigma],
    },
    beta: {
      pdf: (x, p) => {
        if (x <= 0 || x >= 1) return 0;
        const B = beta(p.alpha, p.beta);  // JS has no Math.tgamma; use Lanczos beta()
        return Math.pow(x, p.alpha - 1) * Math.pow(1 - x, p.beta - 1) / B;
      },
      range: () => [0.001, 0.999],
    },
    exponential: {
      pdf: (x, p) => x < 0 ? 0 : p.lambda * Math.exp(-p.lambda * x),
      range: (p) => [0, 5 / p.lambda],
    },
  };
  function gamma(z) {
    // Lanczos approximation for non-integer args.
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
               771.32342877765313, -176.61502916214059, 12.507343278686905,
               -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  function beta(a, b) { return gamma(a) * gamma(b) / gamma(a + b); }

  const DISTRIBUTION_PLOT = {
    build({ el, conf, refs, params, readouts }) {
      const dist = DISTRIBUTIONS[conf.distribution || 'normal'];
      if (!dist) throw new Error(`Unknown distribution: ${conf.distribution}`);

      function draw() {
        const { ctx, W, H } = ctxForCanvas(refs.canvas);
        ctx.clearRect(0, 0, W, H);
        const padL = 40, padR = 16, padT = 24, padB = 36;
        const plotW = W - padL - padR, plotH = H - padT - padB;
        const [rMin, rMax] = dist.range(params);

        let yMax = 0;
        for (let xi = rMin; xi <= rMax; xi += (rMax - rMin) / 200) {
          const v = dist.pdf(xi, params);
          if (v > yMax) yMax = v;
        }
        yMax *= 1.1;

        const sx = (x) => padL + ((x - rMin) / (rMax - rMin)) * plotW;
        const sy = (y) => padT + (1 - y / yMax) * plotH;

        ctx.strokeStyle = cssVar('--rule') || '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH);
        ctx.stroke();

        /* Fill area */
        ctx.fillStyle = cssVar('--accent-soft') || 'rgba(42,111,219,0.25)';
        ctx.beginPath();
        ctx.moveTo(sx(rMin), padT + plotH);
        for (let xi = rMin; xi <= rMax; xi += (rMax - rMin) / 200) {
          ctx.lineTo(sx(xi), sy(dist.pdf(xi, params)));
        }
        ctx.lineTo(sx(rMax), padT + plotH);
        ctx.closePath();
        ctx.fill();

        /* Outline */
        ctx.strokeStyle = cssVar('--accent') || '#2A6FDB';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let first = true;
        for (let xi = rMin; xi <= rMax; xi += (rMax - rMin) / 400) {
          const px = sx(xi), py = sy(dist.pdf(xi, params));
          if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.font = `14px ${cssVar('--font-mono') || 'monospace'}`;
        ctx.fillStyle = cssVar('--ink-3') || '#888';
        ctx.fillText('p(x)', padL - 28, padT + 12);
        ctx.fillText('x', padL + plotW - 8, padT + plotH + 24);
      }

      Object.values(refs.paramInputs).forEach(i => i.addEventListener('input', draw));
      new MutationObserver(draw).observe(document.documentElement,
        { attributes: true, attributeFilter: ['data-theme'] });
      draw();
    },
  };

  /* ---------- Algorithms (for function-plot) ---------- */
  const ALGOS = {
    'gradient-descent': (f, df, p) => {
      const lr = p.lr ?? 0.1;
      const N = Math.round(p.iters ?? 30);
      const traj = [];
      let x = p.x0 ?? 0;
      traj.push({ x, y: f(x) });
      for (let i = 0; i < N; i++) {
        x = x - lr * df(x);
        if (!isFinite(x) || Math.abs(x) > 1000) break;
        traj.push({ x, y: f(x) });
      }
      return traj;
    },
    'newton': (f, df, p) => {
      const N = Math.round(p.iters ?? 30);
      const traj = [];
      let x = p.x0 ?? 0;
      traj.push({ x, y: f(x) });
      const d2f = (x) => (df(x + 1e-4) - df(x - 1e-4)) / 2e-4;
      for (let i = 0; i < N; i++) {
        const denom = d2f(x);
        if (Math.abs(denom) < 1e-12) break;
        x = x - df(x) / denom;
        if (!isFinite(x) || Math.abs(x) > 1000) break;
        traj.push({ x, y: f(x) });
      }
      return traj;
    },
  };

  /* ---------- Registry ---------- */
  const DEMOS = {
    'function-plot': FUNCTION_PLOT,
    'distribution': DISTRIBUTION_PLOT,
  };

  /* ---------- Bootstrap each <interactive-demo> ---------- */
  function bootDemo(el) {
    if (el.dataset.demoBound) return;
    el.dataset.demoBound = '1';

    const kindName = el.getAttribute('kind');
    const kind = DEMOS[kindName];
    if (!kind) {
      console.warn(`Unknown <interactive-demo kind="${kindName}">`);
      el.innerHTML = `<div class="demo-error">Unknown demo kind: ${kindName}</div>`;
      return;
    }

    /* Read all `<param>` children, then BUILD the control panel & canvas */
    const paramConfs = [...el.querySelectorAll(':scope > param')].map(p => ({
      name: p.getAttribute('name'),
      label: p.getAttribute('label') || p.getAttribute('name'),
      min: parseFloat(p.getAttribute('min')),
      max: parseFloat(p.getAttribute('max')),
      step: parseFloat(p.getAttribute('step') || '1'),
      default: parseFloat(p.getAttribute('default')),
    }));
    const readoutConfs = [...el.querySelectorAll(':scope > readout')].map(r => ({
      name: r.getAttribute('name'),
      label: r.getAttribute('label') || r.getAttribute('name'),
    }));

    /* Build markup (.demo-frame from slides.css already styles this) */
    const wrap = document.createElement('div');
    wrap.className = 'demo-frame';
    wrap.innerHTML = `
      <div class="demo-canvas"><canvas></canvas></div>
      <div class="demo-controls">
        <h3>
          <span lang="ru">Параметры</span>
          <span lang="en">Parameters</span>
        </h3>
        ${paramConfs.map(p => `
          <label class="demo-knob">
            <div class="knob-label">
              <span class="knob-name">${escapeHtml(p.label)}</span>
              <span class="knob-value" data-demo-pv="${p.name}">${p.default}</span>
            </div>
            <input type="range" data-demo-p="${p.name}"
                   min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}">
          </label>
        `).join('')}
        ${readoutConfs.length ? `
          <div class="demo-readouts">
            ${readoutConfs.map(r => `
              <div class="demo-readout">
                <div class="readout-label">${escapeHtml(r.label)}</div>
                <div class="readout-value" data-demo-r="${r.name}">—</div>
              </div>
            `).join('')}
          </div>` : ''}
      </div>
    `;
    /* Preserve <function> / config children but hide them */
    [...el.children].forEach(c => c.style.display = 'none');
    el.appendChild(wrap);

    /* Wire up param refs */
    const canvas = wrap.querySelector('canvas');
    /* Size canvas to fill its container — needed before first ctx call */
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const params = {};
    const paramInputs = {};
    paramConfs.forEach(p => {
      params[p.name] = p.default;
      const input = wrap.querySelector(`[data-demo-p="${p.name}"]`);
      const display = wrap.querySelector(`[data-demo-pv="${p.name}"]`);
      paramInputs[p.name] = input;
      input.addEventListener('input', () => {
        params[p.name] = parseFloat(input.value);
        if (display) display.textContent = formatNum(params[p.name], p.step);
      });
    });

    const readouts = {};
    readoutConfs.forEach(r => {
      readouts[r.name] = wrap.querySelector(`[data-demo-r="${r.name}"]`);
    });

    /* Build the actual demo */
    const conf = {
      kind: kindName,
      algorithm: el.getAttribute('algorithm'),
      distribution: el.getAttribute('distribution'),
    };
    try {
      kind.build({ el, conf, refs: { canvas, paramInputs }, params, readouts });
    } catch (err) {
      console.error('Demo failed to build:', err);
      el.innerHTML = `<div class="demo-error">Demo error: ${err.message}</div>`;
    }
  }

  function formatNum(v, step) {
    if (step >= 1) return String(Math.round(v));
    const digits = Math.max(1, Math.min(3, Math.ceil(-Math.log10(step))));
    return v.toFixed(digits);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  document.addEventListener('deck:ready', () => {
    document.querySelectorAll('interactive-demo').forEach(bootDemo);
  });
})();
