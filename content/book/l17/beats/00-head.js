// content/book/l17.js — "The Artificer's Quill" (L17): advanced query rewriting & decomposition —
// HyDE, step-back, multi-query + RRF, decomposition, and the trainable rewriter (RRR). Chapter 17 sits
// between L16 (grading the Oracle) and L18 (late chunking): L16 measured what the pipeline gets wrong,
// this chapter repairs the QUERY side of it, L18 the document side. It deepens L15's query
// understanding. Metaphor: Séréga is the Artificer, and
// the Quill rewrites the captain's rough question to close three gaps — vocabulary, specificity,
// compositionality. Two scrolly widgets anchor the climbs — hyde-embed and query-rewriter — each
// reading data/l14-rewrite.json (toy = stdlib-reproducible; the data stem keeps its original name).
// PROSE carries the story QUALITATIVELY;
// every NUMBER is shown by the mounted widgets (so it stays a single source). EN canonical + RU
// (native) + TT. KaTeX uses \lt/\gt and never a literal < or > inside math.

export default {
  id: '17',
  catchphrase: "The Artificer's Quill",
  beats: [
