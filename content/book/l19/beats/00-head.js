// content/book/l19.js — "The Wiring Diagram" (L19): neural circuit diagrams (Abbott 2024, TMLR,
// arXiv:2402.05424). Supplementary deep-dive; it is where the notation L06 teaches in four slides
// finally EARNS its keep. Thesis: a formula tells you what to compute and hides what it costs; a
// circuit shows both — a wire is an axis, a cup is a contraction where an axis DIES, a triangle is a
// softmax ACROSS an axis, and one counting rule (2·a·b·c) turns the picture into an invoice.
// Every number is DERIVED in data/l19-cost.json (+ l15-attention, l6-chain) — none is typed here.
// EN canonical + native RU + native TT. Séréga the schematic-reader; Séréga plates L19-00…L19-11.

export default {
  id: '19',
  catchphrase: 'The Wiring Diagram',
  beats: [
