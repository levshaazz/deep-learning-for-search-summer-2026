# IMAGE_PROMPTS_L3_L4.md — mascot illustration prompts for L3 & L4

> **Status: DESIGN / READY-TO-GENERATE.** Prompts for the Wait-But-Why mascot illustrations for
> **L3 'The Star Catalog'** (Classical IR + Rank Fusion) and **L4 'The Proving Grounds'** (Ranking
> Metrics). Follows [voice_wbw.md](../voice_wbw.md) §5 (STYLE PREAMBLE), §2 (Serega), §3 (creatures).
> **Workflow:** you generate (GPT Image / Nano Banana Pro) and drop the PNGs into the listed folders;
> filenames are fixed so the decks/Book can wire them. Each prompt is self-contained — paste verbatim.

## How to use
- Generate at the listed **aspect ratio**; save as the **filename** into the **folder**.
- After generating, optimise (≤1600 px, ~128-colour palette) and check: **no baked-in text/titles**,
  Serega's skullcap is **green**, flat 2-D (no gradients/3-D) — the same gates `image-gate.mjs` enforces.
- Reference the locked character sheet `Lectures/assets/img/_char/serega-charsheet.png` for consistency.

## STYLE PREAMBLE (verbatim — already embedded in each prompt below)
> Wait But Why style hand-drawn doodle: thick black ink outlines, off-white paper, flat 1–2 accent
> colours (course blue #2A6FDB + one warm accent #E8743B), crude MS-Paint charm, expressive minimal
> stick figures, hand-lettered labels, no gradients / no 3D. When the narrator appears it is the
> recurring character **Serega**: round-headed stick figure wearing an embroidered **green** Tatar
> skullcap (tübətəy) with long black wavy hair to the shoulders.

## ANTI-PATTERN block (verbatim — embedded in each prompt)
> NO baked-in text, titles, captions, watermarks, or the words "Wait But Why". NO gradients, NO 3-D,
> NO photorealism. Serega's skullcap is GREEN. Flat 2-D doodle only. Leave whitespace for the deck to
> add its own labels.

---

## L3 — *The Star Catalog* · folder `Lectures/assets/img/L3/`

**L3-00-star-catalog** · 16:9 · hook/divider
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: Serega the star-cartographer stands before a huge wall of
> tiny index cards that double as a star map — each card a constellation, threads linking words to
> clusters of stars. He holds a quill, mid-plotting, delighted. The wall suggests a card catalogue and
> a night sky at once. Two accent colours only (blue stars, one warm thread).

**L3-01-linear-scan-doom** · 16:9 · problem
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: tiny Serega rowing a small boat past an endless wall of
> identical document-crates stretching to the horizon, exhausted, checking each one by hand. Conveys
> "scanning everything is hopeless." Sweat drop, comic fatigue.

**L3-02-bm25-sextant** · 4:3 · scoring metaphor
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: Serega squinting through a trusty brass **sextant** labelled
> by shape (not text) at a few bright stars, ranking them by how bright they look. The sextant is the
> "old reliable instrument" (BM25). Warm-accent brass, blue stars.

**L3-03-rank-fusion-council** · 16:9 · fusion (RRF)
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: two separate star-charts held up by two crew members, each
> with a different ordering of the same stars; their beams meet and merge into a single brighter,
> agreed constellation in the middle. Conveys "two rankers' votes fused into one." No numbers/text.

**L3-04-lexical-gremlin-wall** · 16:9 · catch (creature, reused from L1)
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: the **Lexical Gremlin** — a small mischievous gremlin —
> wedging a brick wall between two identical-looking couches drawn on either side (one labelled by a
> simple sofa-icon, the other a couch-icon, NO words), so they can't see each other. Serega peeks over
> the wall, puzzled. Same Gremlin design as L1.

---

## L4 — *The Proving Grounds* · folder `Lectures/assets/img/L4/`

**L4-00-proving-grounds** · 16:9 · hook/divider
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: two little spaceships on a test track / arena, Serega in a
> referee cap holding up a blank scoreboard (no numbers), about to judge which ship's run was better.
> An arena of judgement. Blue ships, one warm scoreboard frame.

**L4-01-cant-eyeball** · 4:3 · problem
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: Serega buried under a towering, toppling stack of result-
> printouts (blank ranked lists, no text), trying and failing to eyeball which is best, googly-eyed.
> Conveys "you can't judge quality by eye at scale."

**L4-02-qrels-referee** · 16:9 · relevance judgments
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: Serega as a referee stamping documents with a big check or
> cross (✓ / ✗ shapes, not words) — sorting a pile into "relevant" and "not". The act of making ground
> truth. Warm ✓, blue ✗.

**L4-03-goodhart-trickster** · 16:9 · catch (creature, reused from L1)
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: **Goodhart the Trickster** — a grinning trickster — yanking
> a chart-line sharply upward with a fishing-rod clickbait hook, while a second, true line stays flat
> and sad beside it. Conveys "the measure became a target and now it lies." Same Trickster design as L1.

**L4-04-ndcg-ideal-vs-actual** · 4:3 · nDCG metaphor
> [STYLE PREAMBLE] [ANTI-PATTERN]. Scene: two ladders side by side made of result-rungs; the left
> "ideal" ladder has its biggest gems on the top rungs, the right "actual" ladder has them scattered
> lower. Serega compares them with a measuring tape. Conveys nDCG = actual vs ideal ordering. No text.

---

## Wiring note
Decks reference these as `assets/img/L3/<name>.png` / `assets/img/L4/<name>.png` (deck-relative); the
Book references them base-prefixed via `withBase('/Lectures/assets/img/L3/<name>.png')`. Creatures
(Lexical Gremlin, Goodhart) MUST match their L1 designs — see `iterations/CHARACTER_BIBLE.md`.
