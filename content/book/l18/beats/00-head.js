// content/book/l18.js — "Read the Whole Book First" (L18): Late Chunking — contextual chunk embeddings for
// long documents (Günther et al. 2024, arXiv:2409.04701). Chapter 18 sits between L17 (rewriting the query)
// and L19 (search in Russian): L17 repaired the question, this chapter repairs the documents it lands on.
// Retrieval quality here is nDCG@10 — the ranking metric from L5, not a RAG-eval score. Metaphor: naive chunking =
// tear the pages out first (a chunk forgets WHO it is about); late chunking = read the whole book first, THEN
// mark the chunk boundaries. PROSE qualitative; numbers shown/gated in the deck + data/. EN canonical + native
// RU + native TT. Séréga plates (nano-banana-pro).

export default {
  id: '18',
  catchphrase: 'Read the Whole Book First',
  beats: [
