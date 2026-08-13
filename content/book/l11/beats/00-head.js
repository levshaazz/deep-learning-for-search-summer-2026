// content/book/l11.js — "The Crucible of Negatives" (L11): hard negative mining in contrastive
// learning for dense retrieval. Chapter 11 of the course: L10 built the Scout (bi-encoder) and showed
// in-batch negatives in passing; this chapter is about WHICH negatives, and why that choice decides the
// edge. It hands a sharpened dense retriever to L12 (The Alliance), where it marches beside sparse.
// Metaphor: Séréga is a blade forged in a crucible; negatives are the sparring opponents that give it
// an edge. Four scrolly
// widgets anchor the climbs — infonce-calc, hardness-sphere, mining-comparator, impostor-denoise —
// each reading data/l13-negatives.json (toy = frozen-toolchain-reproducible; the spine block is a
// pedagogical lineup, the recall block is measured over 20 seeds). PROSE carries the story
// QUALITATIVELY; every NUMBER is shown by the mounted widgets (so it stays a single source). EN
// canonical + RU (native) + TT. KaTeX uses \lt/\gt and never a literal < or > inside math.

export default {
  id: '11',
  catchphrase: 'The Crucible of Negatives',
  beats: [
