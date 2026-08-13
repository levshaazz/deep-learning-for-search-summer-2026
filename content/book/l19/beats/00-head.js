// content/book/l19.js — "Morphology Strikes Back" (L19): Search in Russian — the token tax, lemmas vs
// sub-words for BM25, and Russian / multilingual embedders. Chapter 19 sits between L18 (late chunking)
// and L20 (advanced RAG & ethics): the pipeline is built, measured and tuned — now it meets a language
// that is not English. Metaphor: a Russian
// word carries case/number inside itself, so the English-trained Tokenosaurus chokes on it and pays a token
// tax; lemmatization folds the forms; dense retrieval matches meaning. Numbers shown/gated in the deck +
// data/l20-*.json (gen_l20.py). EN canonical + native RU + native TT. Séréga plates (nano-banana-pro).

export default {
  id: '19',
  catchphrase: 'Morphology Strikes Back',
  beats: [
