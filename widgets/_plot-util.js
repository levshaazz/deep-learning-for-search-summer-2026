/* _plot-util.js — tiny, dependency-free plot-geometry helpers shared by the Book plot widgets.

   WHY: the widget audit (_internal/book_audit2/p1-widgets.md) found one shared root cause behind 4
   of the 5 widget defects — *geometry computed without clamping/sizing to the frame box*:
     • a fit line evaluated at the raw x-domain endpoints extrapolates ABOVE the frame (negative
       screen-y) and exits the right edge   (zipf-heaps);
     • an SVG box sized for one column while a metric panel stacks far below it overflows the box
       (ranking-metrics);
     • too-small y-domain / edge padding jams the top data point and its label against the frame
       edge   (zipf-heaps, pos-bias-curve).

   These three pure functions fix that class once, theme-agnostically (no DOM, no styling):
     • padDomain(min,max,frac)            — widen a data domain by a fraction of its span so marks
                                            and their labels never land on the frame edge.
     • clampSegmentToRect(x1,y1,x2,y2,r)  — clip a line segment to the plot rect (Liang–Barsky), so
                                            only the part INSIDE the frame is drawn.
     • frameHeightFor(maxY, pad)          — size an SVG's viewBox height to its deepest content, so
                                            nothing stacks past the box. */

/* Widen [min,max] by `frac` of the span on BOTH ends (frac defaults to 0.08). For a degenerate
   (min===max) domain, pads by `frac` of |min| (or 1 if min is 0) so the point isn't on the edge. */
export function padDomain(min, max, frac = 0.08) {
  let span = max - min;
  if (!(span > 0)) span = Math.abs(min) || 1;
  const p = span * frac;
  return { min: min - p, max: max + p, span: max - min + 2 * p };
}

/* Clip the segment (x1,y1)→(x2,y2) to the axis-aligned rect {x,y,w,h} via Liang–Barsky.
   Returns the clipped endpoints {x1,y1,x2,y2} (the portion inside the rect) or null if the segment
   lies entirely outside. Endpoints already inside are returned unchanged. */
export function clampSegmentToRect(x1, y1, x2, y2, rect) {
  const xmin = rect.x, ymin = rect.y, xmax = rect.x + rect.w, ymax = rect.y + rect.h;
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;            // parallel to this edge AND outside it
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
      else          { if (t < t0) return null; if (t < t1) t1 = t; }
    }
  }
  return {
    x1: x1 + t0 * dx, y1: y1 + t0 * dy,
    x2: x1 + t1 * dx, y2: y1 + t1 * dy,
  };
}

/* viewBox height that fits content whose deepest drawn y is `maxY`, plus a bottom `pad` (default 24).
   Use as `const H = frameHeightFor(deepestY)` so the SVG box grows with its content instead of
   clipping/overflowing at a hard-coded height. */
export function frameHeightFor(maxY, pad = 24) {
  return Math.ceil(maxY + pad);
}
