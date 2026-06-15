// content/book/l8.js — "The Alliance" (L8): late interaction (ColBERT), learned sparse (SPLADE),
// hybrid fusion, and Learning to Rank (RankNet → LambdaRank → LambdaMART). Beats match the L8 plan
// (43, in order). Scrolly widgets: colbert-maxsim (l8-colbert), splade-expansion (l8-splade),
// hybrid-fusion (l8-hybrid), ltr-lambda (l8-ltr).
// Every displayed NUMBER comes from data/l8-colbert.json + data/l8-splade.json + data/l8-hybrid.json +
// data/l8-ltr.json (toy = stdlib-reproducible) and data/l8-bench.json (cited), plus callbacks to
// data/l3-benchmarks.json + data/l4-metrics.json (facts-gate). EN canonical + RU (native) + TT.
// KaTeX uses \lt/\gt, never a literal < or > inside math.

export default {
  id: '08',
  catchphrase: 'The Alliance',
  beats: [
