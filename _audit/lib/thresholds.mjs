/* thresholds.mjs — dependency-FREE shared detector thresholds, so a constant that two places must agree
   on has ONE definition. Currently: the text-over-text OVERPRINT thresholds, shared by slide-viz-gate
   (which FLAGS overprint) and layout-gate (which asserts widgets/_layout.js `placeLabels` separates
   labels enough to never trip them) — "overlap has one definition." Kept out of gate-harness.mjs (which
   eagerly imports playwright) so the pure layout-gate stays Chromium-free. */

// text-label IoU above this → significant overlap (HARD in slide-viz).
export const IOU_OVERLAP = 0.45;
// if ≥ this fraction of the SMALLER text box is buried by another DIFFERENT-string text box → overprint.
export const OVERPRINT_COVER = 0.50;
