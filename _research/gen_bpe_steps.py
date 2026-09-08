#!/usr/bin/env python3
"""
gen_bpe_steps.py — the SOURCE OF TRUTH for data/l2-bpe-steps.json.

The L2 Book's `bpe-merge-ledger` widget shows only the FINAL learned merges (a
result, no working). The deck (Lectures/02-..., slide "BPE on a real word corpus")
instead RUNS the training loop live: split words into chars, count adjacent pairs
weighted by word frequency, pick the most frequent pair, merge it everywhere,
re-tokenize, repeat. This script reproduces exactly that loop on the deck's classic
toy corpus and emits, for each of the first ~5 merge steps:
    - the current tokenization of every corpus word (with its frequency),
    - the full adjacent-pair frequency tally (each pair -> weighted count),
    - the winning pair (and any tie), and the merge applied.

It is a plain-Python, dependency-free re-implementation of frequency BPE (the toy
corpus is tiny, so no huggingface needed — this keeps the trace fully reproducible
and ASCII-clean, byte-for-byte the numbers the deck shows: e s = 6+3 = 9, etc.).

Corpus (the canonical Sennrich-2016 / deck example):
    low^5, lower^2, newest^6, widest^3      with </w> end-of-word marker.

Run:   python3 _research/gen_bpe_steps.py
Writes: data/l2-bpe-steps.json   (relative to repo root)
"""
from __future__ import annotations
import json, pathlib, collections

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "l2-bpe-steps.json"

EOW = "</w>"                      # end-of-word marker, shown verbatim
N_MERGES = 5                     # first 5 merges = the live loop the deck walks
TALLY_TOP = 6                    # how many pair rows to keep per step (winner + rivals)

# (word, frequency) — the deck's corpus, superscripts are the corpus counts.
CORPUS = [("low", 5), ("lower", 2), ("newest", 6), ("widest", 3)]


def initial_tokens(word: str) -> list[str]:
    """Split a word into single characters plus the end-of-word marker."""
    return list(word) + [EOW]


def pair_counts(vocab: list[dict]) -> collections.Counter:
    """Adjacent-pair frequencies, each occurrence weighted by the word's count."""
    counts: collections.Counter = collections.Counter()
    for entry in vocab:
        toks, freq = entry["tokens"], entry["freq"]
        for a, b in zip(toks, toks[1:]):
            counts[(a, b)] += freq
    return counts


def per_pair_breakdown(vocab: list[dict], pair: tuple[str, str]) -> list[dict]:
    """Which words contribute to a pair's count (e.g. e s = newest^6 + widest^3)."""
    out = []
    for entry in vocab:
        toks, freq = entry["tokens"], entry["freq"]
        hits = sum(1 for a, b in zip(toks, toks[1:]) if (a, b) == pair)
        if hits:
            out.append({"word": entry["word"], "freq": freq, "occurrences": hits,
                        "contribution": hits * freq})
    return out


def apply_merge(vocab: list[dict], pair: tuple[str, str]) -> None:
    """Merge `pair` into one token everywhere it occurs (in place)."""
    a, b = pair
    for entry in vocab:
        toks = entry["tokens"]
        merged, i = [], 0
        while i < len(toks):
            if i < len(toks) - 1 and toks[i] == a and toks[i + 1] == b:
                merged.append(a + b)
                i += 2
            else:
                merged.append(toks[i])
                i += 1
        entry["tokens"] = merged


def snapshot(vocab: list[dict]) -> list[dict]:
    """A copy of the current tokenization (for embedding in a step record)."""
    return [{"word": e["word"], "freq": e["freq"], "tokens": list(e["tokens"])} for e in vocab]


def main() -> int:
    vocab = [{"word": w, "freq": f, "tokens": initial_tokens(w)} for w, f in CORPUS]

    steps = []
    merges = []  # the learned-merge ledger, in order
    for k in range(N_MERGES):
        counts = pair_counts(vocab)
        if not counts:
            break
        # winner = most frequent pair; ties broken deterministically (count desc,
        # then lexicographic on the joined symbol) so the trace is reproducible.
        ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0][0] + kv[0][1]))
        best_pair, best_count = ordered[0]
        max_count = best_count
        ties = [f"{a}{b}" for (a, b), c in ordered if c == max_count]

        tally = [{"left": a, "right": b, "joined": a + b, "count": c,
                  "isWinner": (a, b) == best_pair}
                 for (a, b), c in ordered[:TALLY_TOP]]

        steps.append({
            "step": k,
            "tokensBefore": snapshot(vocab),
            "tally": tally,
            "winner": {"left": best_pair[0], "right": best_pair[1],
                       "joined": best_pair[0] + best_pair[1], "count": best_count,
                       "breakdown": per_pair_breakdown(vocab, best_pair)},
            "tie": ties if len(ties) > 1 else [],
        })

        apply_merge(vocab, best_pair)
        merges.append({"rank": k + 1, "left": best_pair[0], "right": best_pair[1],
                       "joined": best_pair[0] + best_pair[1], "count": best_count})
        steps[-1]["tokensAfter"] = snapshot(vocab)

    out = {
        "_doc": ("Per-step BPE TRAINING trace for L2 'climb-bpe-steps' beat (widget bpe-steps). "
                 "The deck's 'BPE on a real word corpus' slide run live: split into chars+</w>, "
                 "count adjacent pairs weighted by word frequency, pick the most frequent, merge, "
                 "re-tokenize, repeat. Each step carries the corpus tokenization, the full pair "
                 "tally (winner flagged), the winner's per-word breakdown, and the resulting "
                 "merge. Numbers match the deck (e s = 6+3 = 9, s t = 9, l o = 5+2 = 7, ...)."),
        "_source": "_research/gen_bpe_steps.py (plain-Python frequency BPE; SOURCE OF TRUTH)",
        "corpus": [{"word": w, "freq": f} for w, f in CORPUS],
        "eow": EOW,
        "nMerges": len(merges),
        "merges": merges,
        "steps": steps,
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=True) + "\n")

    # console summary (sanity-check against the deck)
    print(f"[bpe-steps] wrote {OUT.relative_to(ROOT)} — {len(steps)} steps, {len(merges)} merges")
    for s in steps:
        w = s["winner"]
        bd = " + ".join(f"{b['word']}^{b['freq']}" for b in w["breakdown"])
        tie = f"  (tie: {', '.join(s['tie'])})" if s["tie"] else ""
        print(f"  step {s['step']}: {w['left']} {w['right']} = {bd} = {w['count']}  ->  {w['joined']}{tie}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
