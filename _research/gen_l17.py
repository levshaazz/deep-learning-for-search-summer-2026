#!/usr/bin/env python3
"""gen_l17.py — the L17 "Shannon Entropy" data generator (the entropy of language).

Emits TWO structurally-distinct files (provenance must never blur):

  • data/l17-entropy.json — MEASURED / COMPUTED by hand on tiny distributions (pure stdlib math.log2 →
      byte-identical under any CPython). The biased coin, the dyadic 4-symbol source whose optimal prefix
      code ACHIEVES its entropy, and the letter-frequency entropy of a toy phrase.
  • data/l17-bench.json  — REPORTED published numbers (Shannon 1948/1951, Cover-King 1978, Brown 1992) —
      the Fn n-gram entropy table, the 100-letter human-prediction bounds, redundancy, and the 'E' frequency.
      NOT computed here; each carries its citation so the deck labels provenance "reported by <cite>".

Run: python3 _research/gen_l17.py   (stdlib only; reproduce.sh re-runs it byte-identically)
"""
import json
import math
from collections import Counter
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def H(probs):
    """Shannon entropy in bits: H = -Σ p log2 p (skip zero-probability symbols)."""
    return round(sum(-p * math.log2(p) for p in probs if p > 0), 4)


def measure():
    # 1) biased coin — H < 1 bit means the skew is exploitable
    coin_p = 0.25
    coin_H = H([coin_p, 1 - coin_p])                       # 0.8113

    # 2) dyadic 4-symbol source: A=1/2, B=1/4, C=1/8, D=1/8. Optimal prefix code (A=0, B=10, C=110, D=111)
    #    has average length EXACTLY equal to the entropy — the Source Coding Theorem made concrete.
    probs = {"A": 1/2, "B": 1/4, "C": 1/8, "D": 1/8}
    code = {"A": "0", "B": "10", "C": "110", "D": "111"}
    src_H = H(list(probs.values()))                        # 1.75
    avg_len = round(sum(probs[s] * len(code[s]) for s in probs), 4)   # 1.75 — achieves H

    # 3) letter-frequency entropy of a toy phrase (F1-style: the per-letter entropy from single-letter freqs).
    #    Deterministic; shows redundancy vs the uniform log2(alphabet) baseline.
    PHRASE = "information theory measures surprise in bits"
    letters = [c for c in PHRASE.lower() if c.isalpha()]
    counts = Counter(letters)
    n = len(letters)
    freqs = {c: counts[c] / n for c in counts}
    phrase_H = H(list(freqs.values()))
    alphabet = len(counts)
    uniform_H = round(math.log2(alphabet), 4)              # F0 baseline for THIS alphabet
    redundancy = round(1 - phrase_H / uniform_H, 4)
    top = counts.most_common(3)

    return {
        "_doc": "COMPUTED by hand on tiny distributions (stdlib math.log2). Deck-displayable, reproducible. "
                "Generator: _research/gen_l17.py.",
        "coin": {"pHeads": coin_p, "H": coin_H, "_note": "biased coin, H<1 bit ⇒ the skew is exploitable"},
        "source4": {
            "probs": probs, "code": code, "H": src_H, "avgCodeLen": avg_len,
            "achievesEntropy": bool(abs(src_H - avg_len) < 1e-9),
            "_note": "dyadic source: the optimal prefix code's average length EQUALS the entropy (1.75 bits)",
        },
        "phrase": {
            "text": PHRASE, "letters": n, "alphabet": alphabet,
            "uniformH": uniform_H, "H": phrase_H, "redundancy": redundancy,
            "top3": [{"letter": c, "count": k, "freq": round(k / n, 4)} for c, k in top],
            "_note": "F1-style per-letter entropy from single-letter frequencies; below the uniform baseline",
        },
    }


def bench():
    """REPORTED numbers — Shannon 1948/1951, Cover-King 1978, Brown 1992. Not computed here."""
    return {
        "_doc": "REPORTED published numbers (transcribed from the primary papers). Provenance labels, NOT our toy.",
        "_source": "Shannon 1948 (BSTJ 27), Shannon 1951 (BSTJ 30), Cover & King 1978, Brown et al. 1992",
        "fn": {
            "_doc": "Shannon 1951 §2 — Fn n-gram entropy of printed English, bits/letter (26-letter / 27-with-space).",
            "cite": "Shannon 1951",
            "F0_26": 4.70, "F0_27": 4.76,     # log2(26)=4.70, log2(27)=4.755
            "F1_26": 4.14, "F1_27": 4.03,     # single-letter frequencies
            "F2_26": 3.56, "F2_27": 3.32,     # digram
            "F3_26": 3.30, "F3_27": 3.10,     # trigram
            "Fword_26": 2.62, "Fword_27": 2.14,
        },
        "humanBounds": {
            "_doc": "Shannon 1951 §6 — human-prediction experiment, 27-symbol, with 100 letters of context.",
            "cite": "Shannon 1951",
            "at100Upper": 1.3, "at100Lower": 0.6,   # bits/letter
            "guessedRight": 79, "guessedTotal": 102,  # 'Out of 102 symbols the subject guessed right 79 times'
        },
        "redundancy": {
            "_doc": "Shannon's redundancy of English.",
            "cite": "Shannon 1948/1951",
            "shortRangePct": 50,   # 1948, structure up to ~8 letters
            "longRangePct": 75,    # 1951, up to 100-letter structure
            "eightLetterEntropy": 2.3,  # 1948 estimate, bits/letter
        },
        "estimates": {
            "_doc": "Later machine/gambling estimates of the entropy of English.",
            "coverKing1978": 1.25,   # gambling estimate, bits/char
            "brown1992Upper": 1.75,  # word-trigram cross-entropy upper bound, bits/char
            "eFrequencyPct": 12.7,   # 'E' is the most frequent English letter (Morse single dot)
        },
        "history": {
            "_doc": "Key dates for the historical arc.",
            "nyquist": 1924, "hartley": 1928, "markovOnegin": 1913, "markovLetters": 20000,
            "shannon1948": 1948, "shannon1951": 1951,
        },
    }


if __name__ == "__main__":
    (DATA / "l17-entropy.json").write_text(json.dumps(measure(), indent=2, ensure_ascii=False) + "\n")
    (DATA / "l17-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    m = measure()
    print(f"[gen_l17] wrote data/l17-entropy.json (coin H={m['coin']['H']}, 4-sym H={m['source4']['H']} "
          f"= code {m['source4']['avgCodeLen']}, phrase H={m['phrase']['H']} vs uniform {m['phrase']['uniformH']}) "
          f"+ data/l17-bench.json")
