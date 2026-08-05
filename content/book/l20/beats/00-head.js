// content/book/l20.js — "Morphology Strikes Back" (L20): Search in Russian — the token tax, lemmas vs
// sub-words for BM25, and Russian / multilingual embedders. Supplementary deep-dive. Metaphor: a Russian
// word carries case/number inside itself, so the English-trained Tokenosaurus chokes on it and pays a token
// tax; lemmatization folds the forms; dense retrieval matches meaning. Numbers shown/gated in the deck +
// data/l20-*.json (gen_l20.py). EN canonical + native RU + native TT. Séréga plates (nano-banana-pro).

export default {
  id: '20',
  catchphrase: 'Morphology Strikes Back',
  beats: [
