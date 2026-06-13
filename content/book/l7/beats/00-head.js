// content/book/l7.js — "Scouts and Judges" (L7): bi-encoders (DPR, SBERT), cross-encoders &
// reranking, and multi-stage pipelines. Beats match narrative/L7.md (25, in order). Scrolly widgets:
// biencoder (l7-biencoder), crossencoder (l7-crossencoder), neural-cascade (l7-cascade).
// Every displayed NUMBER comes from data/l7-biencoder.json + data/l7-crossencoder.json +
// data/l7-cascade.json + data/l7-msmarco.json (toy = stdlib-reproducible; real = frozen SBERT /
// cross-encoder), plus callbacks to data/l3-benchmarks.json + data/l4-metrics.json (facts-gate).
// EN canonical + RU + TT. KaTeX uses \lt/\gt, never a literal < or > inside math.

export default {
  id: '07',
  catchphrase: 'Scouts and Judges',
  beats: [
