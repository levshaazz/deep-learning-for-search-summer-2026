// content/book/l11.js — "Judging the Oracle" (L11): RAG evaluation (RAGAS, LLM-as-judge) + agentic RAG.
// The spine returns to MEASURE for the generative era: how to grade an Oracle that sounds confident
// whether it is right or wrong, and how to make the Ship critique and correct itself. Three exact
// climbs anchor the chapter — ragas-metrics (l11-ragas), llm-judge (l11-judge), agentic-loop
// (l11-agentic) — and the rag-control-flow widget returns (l10-selfrag) as the CRAG/Self-RAG callback.
// Goodhart, the Measure-territory villain (L1→L4), gets his definitive scene: optimise the judge and
// it games itself. Every displayed NUMBER comes from data/l11-ragas.json + data/l11-judge.json +
// data/l11-agentic.json (toy = stdlib-reproducible; real = frozen llama3.1:8b, temp 0, seed 42) and
// data/l11-bench.json (cited). EN canonical + RU (native) + TT. KaTeX uses \lt/\gt, never < or >.

export default {
  id: '11',
  catchphrase: 'Judging the Oracle',
  beats: [
