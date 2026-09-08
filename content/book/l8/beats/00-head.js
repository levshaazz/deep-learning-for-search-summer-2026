// content/book/l8.js — "The Loom of Attention" (L8): BERT & other Transformers — from
// attention to RLHF. Chapter 08 of the course: L7 (The Council of Attention) introduced the crossing and
// one encoder block; this chapter builds the whole loom around it and follows it out to the three model
// families and to RLHF, then hands L9 (The Wiring Diagram) the machine whose bill L9 teaches you to read.
// The DECK is bilingual RU/EN, this Book chapter is trilingual en/ru/tt.
// Metaphor: Séréga is a WEAVER at a great loom — words are threads, ATTENTION is where every thread crosses every other; the Transformer block is the loom
// machine; BERT weaves seeing the whole cloth (bidirectional), GPT weaves forward one thread at a time
// (autoregression), decoding chooses the next thread, efficient attention weaves in blocks (O(n²)), and
// RLHF adjusts the pattern to the wearer's taste. Séréga illustration plates (nano-banana-pro). PROSE
// carries the story; EN canonical + native RU + native TT.

export default {
  id: '08',
  catchphrase: 'The Loom of Attention',
  beats: [
