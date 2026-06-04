# CHARACTER_BIBLE.md — recurring cast for "Deep Learning for Search"

> **Purpose.** A durable canon so the same characters return across lectures, homeworks, labs
> and slides. Any future deck reuses these specs verbatim in image prompts so the cast never
> drifts. Pairs with `_research/voice_wbw.md` (voice) and `_research/gen_images.py` (generation).
>
> **Generation rules that apply to EVERY character (locked):**
> - Style: hand-drawn explanatory **marker-doodle** — thick black ink, off-white paper, FLAT
>   fills, only two accents: course **blue #2A6FDB** + warm **orange #E8743B**. Flat 2D, no 3D,
>   no gradients, no photorealism.
> - **No text inside the image** beyond the few short, correctly-spelled hand-lettered labels a
>   prompt explicitly lists. Never render style names, titles, watermarks, or the words
>   "Wait But Why".
> - Append the `ANTIPATTERN` block from `gen_images.py` to every prompt.

---

## ⭐ Serega — the narrator / guide (mascot, NOT the instructor)
**Role.** The friendly doodle guide who frames every lecture's story. He is the course mascot,
*distinct from the human lecturer* (Albert Nasybullin); Serega never claims to be the instructor.
He shape-shifts into the story role per lecture (captain, knight, first-contact explorer) but his
appearance is **fixed**.

**LOCKED appearance (identical in every image):**
- Round head, two dot eyes, tiny smile, thin noodle limbs.
- **Long black wavy hair to the shoulders.**
- **Deep-green (#2F7D4F) embroidered Tatar skullcap (tübetey) with a thin ochre geometric trim —
  the cap is GREEN in every image, never another colour, never a different hat.**
- Plain **blue (#2A6FDB) tunic**.

**Costume variants (appearance stays, role-dress changes):**
- *Captain Serega* (L0 "The Briefing") — at a spaceship console / open hatch, torch.
- *Sir Serega* (L2 similarity LOTR arc) — stick-figure knight; helmet **crested with the green
  tübetey**; carries a lance/protractor on the unit sphere.
- *Explorer Serega* (L2 "First Contact") — meets the alien.

**Recurring use.** Title beats, dividers, hooks, finale callbacks, and small corner **cameos**
(pointing / puzzled / waving). One Serega per image max; he may be absent on pure-metaphor art.

---

## The creature cast (personified abstractions)

Each entry: **what it personifies · visual spec · home topic · reuse note.**

### 🦖 Tokenosaurus
- **Personifies:** tokenization / sub-word splitting (BPE, WordPiece, Unigram).
- **Visual:** a goofy, friendly cartoon dinosaur, **orange #E8743B body with blue accents**,
  snipping long words into chunks with its teeth; chunks fall into a "sub-words" basket.
- **Home:** L2 tokenization arc. **Reuse:** any tokenizer/vocab topic; HW on BPE; the "tokenizer
  zoo" lab. Pair with Serega watching.

### 🛡️ Sir Cosine & the Knights of the Unit Sphere
- **Personifies:** cosine similarity; measuring the *angle* between vectors on the unit sphere.
- **Visual:** Serega as a stick-figure knight (green-tübetey-crested helm) standing on a glowing
  unit sphere, measuring the angle between two lance-vectors with a protractor; banner motif.
- **Home:** L2 similarity. **Reuse:** dense retrieval, ANN, re-ranking, "why we L2-normalize".

### 🥷 The Curse-of-Dimensionality Wraith
- **Personifies:** distance concentration / high-dimensional pathologies (concentration, hubness).
- **Visual:** a hooded shadowy cloaked figure (Nazgûl-like) crushing a wide bell-shaped histogram
  into a single thin spike; Sir Serega braces against it.
- **Home:** L2 high-d coda. **Reuse:** ANN pitfalls, embedding geometry, whitening/anisotropy.

### 👺 The Lexical Gremlin
- **Personifies:** the vocabulary mismatch (synonymy/polysemy) — "couch" ≠ "sofa" to BM25.
- **Visual:** a small mischievous gremlin smugly holding a brick "BM25 wall" between two synonyms;
  an orange "embeddings" cloud lets them reach over the wall.
- **Home:** L1 lexical gap. **Reuse:** query expansion, synonyms, dense vs lexical, hybrid search.

### 👽 The First-Contact Alien
- **Personifies:** the absence of a shared symbol system — what tokenisation, embeddings, and
  meaning negotiation are *for*. The first-contact moment (L2:s06) is the "no shared symbols"
  beat; the callback (L2:s71) is the "now we share a vector" close.
- **Visual:** a tall friendly many-limbed humanoid drawn as **BLACK INK OUTLINE ONLY** — silhouette
  is a thin clean ink line, the interior is the off-white #FBFAF6 paper showing through. The
  ORANGE accent appears ONLY as three short thin stripes along ONE outer arm (decorative band
  markings, ≤8% of canvas area). NEVER solid-orange skin, NEVER a warm wash, NEVER a green head
  (the green tübetey is Serega-only). The alien stands on the RIGHT of the frame; Serega on the
  LEFT — first-contact (s06) and callback (s71) compose the same way so the start-of-arc and
  end-of-arc shots feel like the same character on two pages.
- **Home:** L2 NLP arc — the bookend of the lecture (first-contact at s06, handshake-callback at
  s71). **Reuse:** any "meaning across symbol systems" beat — cross-lingual embeddings, transfer
  learning, vector-space lingua franca, code-switching tokenisation, multimodal alignment.

### 🎭 Goodhart the Trickster
- **Personifies:** "when a measure becomes a target it ceases to be a good measure."
- **Visual:** a grinning trickster yanking a rising CTR line up with a clickbait fishing-hook while
  a dashed "real satisfaction" line sinks.
- **Home:** L1 metrics. **Reuse:** any metrics/eval/Goodhart/proxy-vs-goal moment; A-B testing,
  reward hacking, RLHF cautionary notes.

---

## Optional future cast (placeholders — design when first needed)
- *The Index Librarian* — the inverted index / posting lists (L-future Classical IR).
- *The Reranker Bouncer* — cascade re-ranking ("you didn't retrieve it, I can't let it in").
- *RAG the Quartermaster* — retrieval-augmented generation (grounds the fluent-but-clueless LLM).

When introducing a new creature: add it here with the same fields, keep the locked style rules,
and prefer a single clear visual tell that reads at lecture-hall distance.
