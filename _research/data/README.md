# `_research/data/` — data-grounded artifacts (anti-«отсебятина»)

Every artifact here is produced from an **open public dataset** with a small,
deterministic Python script. The decks cite these numbers; if a value changes,
re-run the script and update the slide. Nothing in here is invented.

> Dataset shared across the three scripts: **20 Newsgroups** via
> `sklearn.datasets.fetch_20newsgroups(subset="all", remove=("headers","footers","quotes"))`.
> Public domain Usenet archive, English, ~18 700 documents, ~3.7 M tokens after
> a simple regex tokenizer.

| Artifact | Script | Output(s) | Slide(s) it feeds | License |
|---|---|---|---|---|
| Zipf's law (empirical) | `zipf.py` | `zipf_top.csv`, `zipf_summary.json`, `zipf_loglog.png` | L1-25 (Zipf beach), L2-10 (Zipf bar chart) | sklearn 20NG (public-domain) |
| BPE first 20 merges + demo tokenizations at vocab 1k / 4k / 16k | `bpe_merges.py` | `bpe_first_merges.json`, `bpe_demo_tokens.json`, `bpe_merges_summary.json` | L2-23 (BPE intro), L2-37 (digits split), L2-41 (token tax) | huggingface 🤗 tokenizers (Apache-2.0), 20NG corpus |
| Cosine vs Euclidean — classic pairs + real TF-IDF pair | `cosine.py` | `cosine_examples.json` | L2-49 (query angle), L2-56 (cosine vs Euclid), L2-48 (Sir Cosine) | sklearn (BSD-3), 20NG |

## How to regenerate

```bash
python3 _research/data/zipf.py
python3 _research/data/bpe_merges.py
python3 _research/data/cosine.py
```

All three are idempotent. 20 Newsgroups is fetched once and cached under
`~/scikit_learn_data/`. Total wall-clock from a cold cache: ~3–5 min.

## Headline numbers (last run)

- **Zipf slope ≈ −1.02** on the top-1000 tokens (Zipf's law: −1).
- **Coverage:** top-10 cover 20.6 %, top-100 cover 47.3 %, top-1000 cover 71.4 % of the corpus.
- **BPE first 5 merges (4k vocab):** `ĠĠ`, `Ġt`, `he`, `Ġa`, `in`.
- **"tokenization":** 5 tokens @ vocab 1k → 4 @ 4k → 3 @ 16k.
- **"327":** 3 tokens @ vocab 1k (`3|2|7`) → 2 @ ≥4k (`32|7`) — the literal
  evidence for the "digits split inconsistently" slide.
- **"привет":** 12 byte-level fragments at all three vocab sizes — the
  literal evidence for the "token tax" / non-Latin penalty.
- **Cosine classic:** (1,1) vs (10,10) → cos = 1.0, Euclid ≈ 12.73 (same
  direction; very different magnitude — the canonical "why cosine?" pair).
- **Cosine on TF-IDF:** space ↔ space cos ≈ 0.058, space ↔ hockey cos ≈ 0.0
  (same-topic outranks cross-topic, even on a raw TF-IDF representation).

## Adding a new artifact

1. Pick an **open dataset** with a permissive license and document it (URL + license).
2. Write a single self-contained `<topic>.py` next to this README that:
   - downloads/caches the data (no manual steps),
   - writes its outputs to the same folder,
   - prints a one-line summary to stdout.
3. Add a row to the table above and the headline numbers list.
4. Cite the artifact in the slide that uses it (notes or visible reference).

## Added (editor follow-up, priority 4)
- **heaps.py** → `heaps_summary.json`, `heaps_curve.png`. Heaps' law on 20 Newsgroups.
  Measured **β ≈ 0.5946**, K ≈ 12.72, R² = 0.998, V = 94 287 types on 3.66 M tokens
  (type count matches zipf.py — consistency check). → **slide L2-11 (Heaps)**.
- **embedding_demo.py** → `embedding_demo.json`. A real 8-dim dense embedding
  (TF-IDF → TruncatedSVD/LSA → L2-normalized) of a readable Newsgroups post.
  Unit vector `[0.50, −0.58, −0.14, 0.31, 0.20, −0.31, 0.40, 0.08]`, ‖v‖=1.
  → **slide L2-51 (Definition Vector)**, rendered with the `numgrid` template.
- **position_bias.py** → `position_bias.json`. Examination-model (Craswell 2008)
  position bias, γ≈0.94 anchored to the ~32% rank-1 (Joachims 2005). Under equal
  relevance: rank-1 = 32.3% of clicks, top-3 = 60.6%. **Explicitly synthetic/modelled**
  (no proprietary click log). → **slide L1-29 (position bias)** speaker notes.
