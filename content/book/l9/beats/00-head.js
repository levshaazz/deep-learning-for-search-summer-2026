// content/book/l9.js — "Hyperspace Lanes" (L9): approximate nearest neighbour (HNSW, IVF, PQ),
// FAISS / vector DBs, and production serving (quantization, latency, caching). Beats match the L9 plan.
// Scrolly widgets: hnsw-graph (l9-hnsw), ivf-cells (l9-ivf), pq-quantize (l9-pq). The latency climb
// reuses the deck `sequence` slide-type (not a widget); the Book states its budget in prose.
// Every displayed NUMBER comes from data/l9-hnsw.json + data/l9-ivf.json + data/l9-pq.json +
// data/l9-latency.json (toy = stdlib-reproducible, recomputed by provenance_l9) and data/l9-bench.json
// (cited). EN canonical + RU (native) + TT. KaTeX uses \lt/\gt, never a literal < or > inside math.

export default {
  id: '09',
  catchphrase: 'Hyperspace Lanes',
  beats: [
