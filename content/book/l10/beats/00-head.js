// content/book/l10.js — "The Oracle" (L10): RAG fundamentals, chunking, query understanding & rewriting.
// The rag-pipeline widget is the recurring ANCHOR figure: it mounts as the master on climb-rag, then
// returns with one stage in focus (focusStage:'chunk') on the chunking turn, poisoned (mode:'poisoned')
// on the catch, and all-green (mode:'all-green') on the payoff — beat-level labels override the i18n.
// New scrolly widgets: chunking-demo (l10-chunking), query-rewrite (l10-rewrite). Every displayed NUMBER
// comes from data/l10-rag.json + data/l10-chunking.json + data/l10-rewrite.json (toy = stdlib-reproducible,
// recomputed by provenance_l10) and data/l10-bench.json (cited). EN canonical + RU (native) + TT.
// KaTeX uses \lt/\gt, never a literal < or > inside math.

export default {
  id: '10',
  catchphrase: 'The Oracle',
  beats: [
