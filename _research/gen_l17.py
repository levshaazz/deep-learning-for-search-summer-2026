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
from itertools import product
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def H(probs):
    """Shannon entropy in bits: H = -Σ p log2 p (skip zero-probability symbols)."""
    return round(sum(-p * math.log2(p) for p in probs if p > 0), 4)


def _h_raw(probs):
    return sum(-p * math.log2(p) for p in probs if p > 0)


def h2(p):
    """Binary entropy H(p) in bits, unrounded."""
    return _h_raw([p, 1 - p])


def _zipf_truncated(cutoff, k=0.1):
    """Shannon 1951's word model, recomputed: p_n = k/n truncated at rank `cutoff`.

    Returns (Σ p, H on the raw p, H after normalising k so Σ p = 1), each rounded to 4 dp.
    This exists to SHOW that Shannon's printed 11.82 bits/word does not follow from the model he
    describes — the honest figure is ≈9.4, and Grignetti 1964 published ≈9.8. Pure stdlib, so the
    three numbers the slide prints are reproducible byte-for-byte.
    """
    ps = [k / n for n in range(1, cutoff + 1)]
    s = sum(ps)
    norm = [p / s for p in ps]
    return round(s, 4), round(_h_raw(ps), 4), round(_h_raw(norm), 4)


def huffman(probs):
    """Huffman code LENGTHS + the merge log, deterministically.

    Pure stdlib, no heapq tie ambiguity: the queue is kept sorted by (probability, insertion order),
    so the SAME tree is built on every CPython. Returns ({symbol: codeword length}, [merge records]).
    A merge record is (pLeft, pRight, pParent, [left leaves], [right leaves]) — the widget replays
    this log instead of re-deriving the tree in the browser (numbers never computed client-side).
    """
    nodes = [(p, i, [s]) for i, (s, p) in enumerate(sorted(probs.items()))]
    lens = {s: 0 for s in probs}
    merges, order = [], len(nodes)
    while len(nodes) > 1:
        nodes.sort(key=lambda n: (n[0], n[1]))
        a, b = nodes.pop(0), nodes.pop(0)
        for s in a[2] + b[2]:
            lens[s] += 1
        merges.append({"pLeft": round(a[0], 6), "pRight": round(b[0], 6),
                       "pParent": round(a[0] + b[0], 6),
                       "left": sorted(a[2]), "right": sorted(b[2])})
        nodes.append((a[0] + b[0], order, a[2] + b[2]))
        order += 1
    return lens, merges


def mean_len(probs, lens):
    return sum(probs[s] * lens[s] for s in probs)


def codewords(merges):
    """Read the codewords straight off the merge log — left edge = 0, right edge = 1.

    EXACTLY what widgets/huffman-build/logic.js does when it draws the tree, so the widget's picture
    and the deck's table cannot disagree about which leaf carries which bits (they did: slide 29a
    showed E 11 / T 10 / A 00 while slide 29b's table said E 00 / T 01 / A 10 — both valid Huffman
    codes, one figure, two answers).
    """
    if not merges:
        return {}
    root = merges[-1]
    code = {}

    def walk(group, prefix):
        if len(group) == 1:
            code[group[0]] = prefix or "0"
            return
        key = tuple(sorted(group))
        for m in merges:                     # the merge that CREATED this group
            if tuple(sorted(m["left"] + m["right"])) == key:
                walk(m["left"], prefix + "0")
                walk(m["right"], prefix + "1")
                return
    walk(root["left"], "0")
    walk(root["right"], "1")
    return {s: code[s] for s in sorted(code)}


# ── frequency tables EMBEDDED in the generator (H3: no external corpus is read, so the JSON is
#    byte-identical on any machine). English: Lewand, "Cryptological Mathematics" (2000), the
#    standard 26-letter relative-frequency table. Russian: the leading frequencies of the RNC
#    frequency dictionary (Ляшевская & Шаров 2009), letter-level, 33 letters. Values are PERCENT;
#    the generator normalises them and computes H itself — the entropy is ours, the counts are cited.
EN26 = {"a": 8.167, "b": 1.492, "c": 2.782, "d": 4.253, "e": 12.702, "f": 2.228, "g": 2.015,
        "h": 6.094, "i": 6.966, "j": 0.153, "k": 0.772, "l": 4.025, "m": 2.406, "n": 6.749,
        "o": 7.507, "p": 1.929, "q": 0.095, "r": 5.987, "s": 6.327, "t": 9.056, "u": 2.758,
        "v": 0.978, "w": 2.360, "x": 0.150, "y": 1.974, "z": 0.074}
RU33 = {"о": 10.967, "е": 8.449, "а": 8.013, "и": 7.353, "н": 6.697, "т": 6.258, "с": 5.468,
        "р": 4.734, "в": 4.538, "л": 4.400, "к": 3.486, "м": 3.203, "д": 2.977, "п": 2.804,
        "у": 2.615, "я": 2.001, "ы": 1.898, "ь": 1.735, "г": 1.687, "з": 1.641, "б": 1.592,
        "ч": 1.450, "й": 1.208, "х": 0.966, "ж": 0.940, "ш": 0.718, "ю": 0.639, "ц": 0.486,
        "щ": 0.361, "э": 0.331, "ф": 0.267, "ъ": 0.037, "ё": 0.037}


def letter_block(table, alphabet_size, top_n=8):
    total = sum(table.values())
    freqs = {c: v / total for c, v in table.items()}
    h = _h_raw(list(freqs.values()))
    ceil = math.log2(alphabet_size)
    ranked = sorted(freqs.items(), key=lambda kv: (-kv[1], kv[0]))
    return {
        "alphabet": alphabet_size,
        "uniformH": round(ceil, 4),
        "H": round(h, 4),
        "redundancy": round(1 - h / ceil, 4),
        "meanPct": round(100 / alphabet_size, 2),
        "top": [[c, round(p, 4)] for c, p in ranked[:top_n]],
        "bars": [round(p, 4) for _, p in ranked],
    }


def measure():
    # 1) biased coin — H < 1 bit means the skew is exploitable
    coin_p = 0.25
    coin_H = H([coin_p, 1 - coin_p])                       # 0.8113
    #    worked cross-entropy: model the biased coin with a WRONG fair-coin q=(1/2,1/2).
    #    H(p,q) = -Σ p log2 q = 1.0 bit (both -log2 0.5 = 1); KL = H(p,q)-H(p); PPL = 2^H.
    coin_q = 0.5
    coin_Hq = round(-(coin_p * math.log2(coin_q) + (1 - coin_p) * math.log2(1 - coin_q)), 4)  # 1.0
    coin_kl = round(coin_Hq - coin_H, 4)                    # 0.1887 — the wrong-model tax
    coin_ppl_q = round(2 ** coin_Hq, 4)                    # 2.0 — effective branches under q
    coin_ppl_floor = round(2 ** coin_H, 4)                 # 1.7548 — the entropy floor's perplexity
    #    the REVERSE tax: KL is not symmetric. D(q‖p) charges the fair coin's own bits against p.
    coin_kl_rev = round(sum(q * math.log2(q / pp) for q, pp in ((0.5, 0.25), (0.5, 0.75))), 4)  # 0.2075
    #    the two needle jumps the entropy-gauge widget draws at step 0 (so it computes nothing itself).
    #    Keep the RAW self-informations too: contrib below multiplies by them UNROUNDED (round after
    #    the arithmetic, never arithmetic on the rounded display values — 0.75·0.415 = 0.3112 is the
    #    stale product; the true p·(−log2 p) rounds to 0.3113 and sums to the displayed H 0.8113).
    coin_self_info_raw = [-math.log2(coin_p), -math.log2(1 - coin_p)]
    coin_self_info = [round(x, 4) for x in coin_self_info_raw]  # [2.0, 0.415]

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
    phrase_H_raw = _h_raw(list(freqs.values()))   # keep unrounded: floorBits multiplies by n BEFORE rounding
    phrase_H = round(phrase_H_raw, 4)
    alphabet = len(counts)
    uniform_H = round(math.log2(alphabet), 4)              # F0 baseline for THIS alphabet
    redundancy = round(1 - phrase_H / uniform_H, 4)
    top = counts.most_common(3)

    # 3b) the SAME phrase, Huffman-coded: the by-hand code is 144 bits against 156 fixed / 312 ASCII.
    ph_lens, _ = huffman(freqs)
    ph_avg = round(mean_len(freqs, ph_lens), 4)
    ph_total = sum(counts[c] * ph_lens[c] for c in counts)

    # 4) the surprise CURVE the entropy-gauge widget draws: H(p) on a 0.01 grid, so the browser
    #    computes NOTHING — it reads the same numbers the facts-gate checks.
    curve_p = [round(i / 100, 2) for i in range(1, 100)]

    # 5) Huffman on a NON-dyadic source — the ordinary case, where the code MISSES the floor.
    nd_probs = {"E": 0.35, "T": 0.25, "A": 0.20, "O": 0.12, "I": 0.08}
    nd_lens, nd_merges = huffman(nd_probs)
    nd_H = _h_raw(list(nd_probs.values()))
    nd_avg = mean_len(nd_probs, nd_lens)

    # 6) BLOCK coding the biased coin: Huffman over n-flip blocks walks L̄/n down toward H = 0.8113.
    #    This is H ≤ L̄_n/n < H + 1/n seen with the eyes — and the answer to "you said 0.811 bits
    #    but a single flip cannot be sent in a fraction of a bit".
    block_ns = [1, 2, 3, 4, 5, 8]
    block_avg = []
    for bn in block_ns:
        bp = {"".join(map(str, bits)): coin_p ** sum(bits) * (1 - coin_p) ** (bn - sum(bits))
              for bits in product([0, 1], repeat=bn)}
        bl, _ = huffman(bp)
        block_avg.append(round(mean_len(bp, bl) / bn, 4))

    # 7) Kraft's inequality on the two codes the deck shows: both are COMPLETE (Σ 2^-l = 1).
    block_excess = [round(x - coin_H, 4) for x in block_avg]
    #    Gallager 1978 Thm 2: the Huffman redundancy is bounded by P1 + σ, σ = 1 − log2 e + log2(log2 e)
    gallager_sigma = round(1 - math.log2(math.e) + math.log2(math.log2(math.e)), 4)
    gallager_bound = round(max(nd_probs.values()) + gallager_sigma, 4)

    kraft_dyadic = round(sum(2 ** -l for l in (1, 2, 3, 3)), 4)
    kraft_nondyadic = round(sum(2 ** -nd_lens[s] for s in nd_lens), 4)

    # 8) MARKOV 1913 from his RAW counts (20 000 letters of Onegin, ъ/ь excluded): the conditional
    #    entropy and the mutual information the whole Fn act is really about — on a RUSSIAN text.
    mk_letters, mk_vowels, mk_vv = 20000, 8638, 1104
    mk_cons = mk_letters - mk_vowels                   # 11362
    mk_cv = mk_vowels - mk_vv                          # 7534 — consonants that follow a vowel
    mk_p = mk_vowels / mk_letters                      # 0.4319
    mk_pvv = mk_vv / mk_vowels                         # P(vowel | vowel)   = 0.1278
    mk_pvc = mk_cv / mk_cons                           # P(vowel | consonant) = 0.6631
    mk_HX = h2(mk_p)
    mk_HgivenV, mk_HgivenC = h2(mk_pvv), h2(mk_pvc)
    mk_Hcond = mk_p * mk_HgivenV + (1 - mk_p) * mk_HgivenC
    mk_expected_vv = round(mk_p ** 2 * (mk_letters - 1))   # 3731 if letters were independent

    # 9) Robertson (2004), appendix: a binary source whose ENTROPY has operational status
    #    (a coding theorem) while its POINTWISE self-informations have none.
    rb_p1 = 0.89
    return {
        "_doc": "COMPUTED by hand on tiny distributions (stdlib math.log2). Deck-displayable, reproducible. "
                "Generator: _research/gen_l17.py.",
        "coin": {
            "pHeads": coin_p, "H": coin_H,
            "modelQ": coin_q, "crossEntropyQ": coin_Hq, "klQ": coin_kl,
            "pplQ": coin_ppl_q, "pplFloor": coin_ppl_floor,
            "klReverse": coin_kl_rev, "selfInfo": coin_self_info,
            "contrib": [round(coin_p * coin_self_info_raw[0], 4), round((1 - coin_p) * coin_self_info_raw[1], 4)],
            "_note": "biased coin, H<1 bit ⇒ the skew is exploitable; a wrong fair-coin q pays "
                     "H(p,q)=1.0 bit (KL tax 0.1887), perplexity 2.0 vs the floor 1.7548",
        },
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
        "coinCurve": {
            "p": curve_p,
            "H": [round(h2(p), 4) for p in curve_p],
            "argmax": 0.5, "max": 1.0,
            "_note": "H(p) for the two-outcome source on a 0.01 grid — the entropy-gauge widget READS this "
                     "curve instead of computing it, so the figure cannot drift from the facts-gate",
        },
        "phraseHuffman": {
            "avgCodeLen": ph_avg,
            "codeLen": {c: ph_lens[c] for c in sorted(ph_lens)},
            "totalBits": ph_total,
            "fixedBits": 4 * n,
            "asciiBits": 8 * n,
            "floorBits": round(phrase_H_raw * n, 4),   # n·H from the RAW H (39·3.66761802 = 143.0371, not 39·3.6676)
            "entropyGap": round(uniform_H - phrase_H, 4),
            "_note": "the same 39-letter phrase actually coded: Huffman 144 bits vs 156 (fixed 4-bit) vs "
                     "312 (ASCII); the entropy floor is 143.0 bits, so the code overpays by ~1 bit TOTAL",
        },
        "huffman": {
            "nonDyadic": {
                "probs": nd_probs,
                "H": round(nd_H, 4),
                "codeLen": nd_lens,
                "code": codewords(nd_merges),   # left = 0, right = 1 — the widget's own reading
                "avgCodeLen": round(nd_avg, 4),
                "excess": round(nd_avg - nd_H, 4),
                "excessPct": round(100 * (nd_avg - nd_H) / nd_H, 1),
                "gallagerSigma": gallager_sigma, "gallagerBound": gallager_bound,
                "idealLen": {s: round(-math.log2(p), 4) for s, p in nd_probs.items()},
                "merges": nd_merges,
                "_note": "the ORDINARY case: integer codeword lengths cannot equal −log2 p, so L̄ = 2.2000 "
                         "misses H = 2.1531 by 0.0469 bit. The dyadic source4 is the happy exception.",
            },
            "kraft": {"dyadic": kraft_dyadic, "nonDyadic": kraft_nondyadic,
                      "_note": "Σ 2^-l ≤ 1 — both codes are COMPLETE (the shelf is exactly full)"},
            "blocks": {
                "p": coin_p, "n": block_ns, "avgPerSymbol": block_avg, "excess": block_excess, "floor": coin_H,
                "_note": "Huffman over n-flip blocks: 1.0 → 0.8158 bits/flip against the floor 0.8113. "
                         "This is H ≤ L̄n/n < H + 1/n with the eyes.",
            },
        },
        "markovOnegin": {
            "letters": mk_letters, "vowels": mk_vowels, "consonants": mk_cons,
            "vowelVowelPairs": mk_vv, "consonantAfterVowel": mk_cv,
            "expectedVVifIndependent": mk_expected_vv,
            "pVowel": round(mk_p, 4),
            "pVowelGivenVowel": round(mk_pvv, 4),
            "pVowelGivenConsonant": round(mk_pvc, 4),
            "H": round(mk_HX, 4),
            "HgivenVowel": round(mk_HgivenV, 4),
            "HgivenConsonant": round(mk_HgivenC, 4),
            "Hconditional": round(mk_Hcond, 4),
            "mutualInformation": round(mk_HX - mk_Hcond, 4),
            "dropPct": round(100 * (mk_HX - mk_Hcond) / mk_HX, 1),
            "_note": "conditional entropy + mutual information computed from Markov's OWN 1913 counts "
                     "(reported in data/l17-bench.json markov): one letter of context is worth 0.2247 bit",
        },
        "letterFreq": {
            "en26": letter_block(EN26, 26),
            "ru33": letter_block(RU33, 33),
            "_src": "frequency tables are EMBEDDED in gen_l17.py (EN: Lewand 2000; RU: RNC frequency "
                    "dictionary, Ляшевская & Шаров 2009, letter-level). H is computed here, not quoted.",
        },
        "robertson": {
            "p": [rb_p1, round(1 - rb_p1, 2)],
            "H": round(h2(rb_p1), 4),
            "selfInfo": [round(-math.log2(rb_p1), 4), round(-math.log2(1 - rb_p1), 4)],
            "_note": "Robertson 2004, appendix: H = 0.4999 bit has operational status (a coding theorem "
                     "halves the stream); the pointwise 0.1681 / 3.1844 bits have none.",
        },
        "idfBits": {
            "N": 8, "df": 4,
            "pTerm": 0.5,
            "bits": round(-math.log2(0.5), 4),
            "natsL3": 0.6931,
            "bitsRareTerm": round(-math.log2(1 / 8), 4),
            "natsRareTerm": round(-math.log(1 / 8), 4),
            "bitsEveryDoc": 0.0,
            "_note": "the L3 worked IDF re-read in bits: df=4 of N=8 ⇒ p=0.5 ⇒ exactly 1 bit "
                     "(= 0.6931 nat, the number data/l3-bm25.json already carries); 1-in-8 ⇒ 3 bits.",
        },
        "natsBits": {"natInBits": round(1 / math.log(2), 4), "bitInNats": round(math.log(2), 4),
                     "_note": "PPL = b^H must use the SAME base as the loss: 1 nat = 1.4427 bits"},
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
            # UNITS (the defect the old table hid): the 26-letter column is bits per LETTER, the
            # 27-symbol column is bits per SYMBOL (a letter OR a space). They are not comparable:
            # 100 letters of English carry ~123 symbols, so at large n the 27-column ≈ 0.818 × the
            # 26-column — Shannon's own factor 4.5/5.5 (mean word length + its space).
            "_units": "F*_26 = bits per LETTER (26-letter alphabet); F*_27 = bits per SYMBOL "
                      "(26 letters + space). Ratio at large n ≈ 4.5/5.5 = 0.818 — not a typo.",
            "unitFactor": 0.818,
            "spaceFreq": 0.186,          # the space is the commonest symbol of the 27-symbol source
            # REPORTED, NOT DERIVED. Shannon 1951 prints 11.82 bits/word, but the Zipf fit he
            # describes does not yield it: with p_n = k/n truncated at rank 8727 the probabilities
            # sum to 0.9651 and −Σ p log2 p = 9.1353 (9.4141 after normalising k so the sum is 1).
            # Grignetti 1964 (Information and Control 7(3) 304–306) is the published correction:
            # ≈9.8 bits/word. The deck therefore quotes 11.82 as REPORTED and never writes "⟹".
            "wordBitsPerWord": 11.82,
            "wordBitsGrignetti": 9.8,    # Grignetti 1964's recomputation of the same quantity
            "wordRankCutoff": 8727,
            # …and the arithmetic that shows 11.82 is NOT implied by the stated model. COMPUTED here
            # (stdlib, deterministic) so the slide's "it does not follow" is itself facts-gated.
            "zipfSum":        _zipf_truncated(8727)[0],   # Σ 0.1/n  = 0.9651 (< 1: the fit is truncated)
            "zipfH":          _zipf_truncated(8727)[1],   # −Σ p log2 p = 9.1353 on the un-normalised p
            "zipfHNormalised": _zipf_truncated(8727)[2],  # …and 9.4141 once k is scaled so Σ p = 1
            "meanWordLenShannon": 4.5,   # letters, NO space (Shannon's divisor: 11.82 / 4.5 = 2.62)
            "meanWordLenJM": 5.5,        # letters WITH the space (Nádas 1984, used by Jurafsky & Martin)
            "wordFreqThe": 0.071, "wordFreqOf": 0.034,   # Shannon's own two most frequent words
            "ceiling27": 4.755, "ceiling26": 4.700,      # log2 of each alphabet, to the printed precision
        },
        "humanBounds": {
            "_doc": "Shannon 1951 §6 — human-prediction experiment, 27-symbol, with 100 letters of context.",
            "cite": "Shannon 1951",
            "at100Upper": 1.3, "at100Lower": 0.6,   # bits/letter
            "guessedRight": 79, "guessedTotal": 102,  # 'Out of 102 symbols the subject guessed right 79 times'
            # THREE different demonstrations live in the 1951 paper and must not be blended:
            #  • 89/129  — a SINGLE-guess demonstration passage;
            #  • 79/102  — the MULTI-guess demonstration passage (the two numbers above);
            #  • 80/100  — Table I, the 100-letters-of-context column. THIS is "four in five".
            "table1At100Right": 80, "table1At100Total": 100,
            "singleGuessRight": 89, "singleGuessTotal": 129,
            "passages": 100, "passageLen": 15,      # 100 passages of FIFTEEN letters (contexts 0…14)
            "text": "Jefferson the Virginian (Dumas Malone, 1948)",
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
            "coverKing1978": 1.3,   # gambling estimate ≈1.3 bits/char (Cover & King 1978, abstract)
            "brown1992Upper": 1.75,  # word-trigram cross-entropy upper bound, bits/char
            # PROVENANCE FIX: 12.7 % is the standard 26-letter CORPUS table (Lewand 2000 and the
            # tables it descends from) — NOT a figure printed by Shannon 1951, whose alphabet has 27
            # symbols (with p(space) ≈ 0.186 the share of E mechanically falls to ≈10.3 %).
            "eFrequencyPct": 12.7,
            "eFrequencyCite": "Lewand 2000 (26-letter corpus table)",
            "eFrequencyOn27Pct": 10.3,
            "coverKing1978Capital": 1.34,   # Table III, the mean-capital estimate C&T actually quote
            "coverKing1978Best": 1.29,      # best single subject; the 12-subject spread is 1.29…1.90
            "coverKing1978Subjects": 12,
            "coverKing1978Chars": 75,
        },
        "modern": {
            "_doc": "Bits-per-char TODAY — only on text8, which IS Shannon's 27-symbol alphabet.",
            "cite": "Dai et al. 2019; Sukhbaatar et al. 2019; Radford et al. 2019; Valmeekam et al. 2023",
            "text8TransformerXL": 1.08,
            "text8AdaptiveSpan": 1.07,
            "text8Gpt2": 0.98,
            "text8Llmzip": 0.709,
            "cmixEnwik8": 1.17,           # the enwik8 record — a BYTE scale, not comparable with the above
            "enwikCeilingBits": 7.687,    # log2 206
            "text8CeilingBits": 4.755,    # log2 27
            "enwikAlphabet": 206,     # enwik8/enwik9 are BYTES of Wikipedia XML — a different source
            "text8Alphabet": 27,
            "_warn": "enwik8/enwik9 bpc and text8 bpc are NOT the same scale (log2 206 = 7.687 vs "
                     "log2 27 = 4.755). Only text8 numbers may be put beside Shannon's 4.76 / 1.0.",
        },
        "perplexity": {
            "_doc": "Perplexity anchored: WSJ n-grams (Jurafsky & Martin, Katz + Good-Turing) and LMs.",
            "cite": "Jurafsky & Martin SLP3 §3; Radford et al. 2019; Brown et al. 2020",
            "wsjTrainWords": 38000000, "wsjVocab": 19979,
            "wsjUnigram": 962, "wsjBigram": 170, "wsjTrigram": 109,
            "gpt2Ptb": 35.76, "gpt2Wikitext103": 17.48, "gpt3Ptb": 20.50,
            "wsjBitsUnigram": 9.91, "wsjBitsBigram": 7.41, "wsjBitsTrigram": 6.77,   # log2 of the three above
            "shannonWordBits": 7.15, "shannonWordPpl": 142.02,   # 1.3 bits/letter × 5.5 letters/word
            "originCite": "Jelinek, Mercer, Bahl & Baker, JASA 62(S1):S63, 1977",
        },
        "ru": {
            "_doc": "The entropy of Russian — Yaglom & Yaglom 1973 ch. IV §3 (31 letters + space = 32).",
            "cite": "Яглом & Яглом 1973 (первичный ряд — Лебедев & Гармаш 1958)",
            "H0": 5.0, "H1": 4.348, "H2": 3.521, "H3": 3.006,
            # the English column printed beside it, on Shannon's 27-symbol scale (same table in Yaglom)
            "enH0": 4.755, "enH1": 4.029, "enH2": 3.319, "enH3": 3.099,
            "alphabet": 32, "spaceFreq": 0.175,
            # …and the ceiling you would get if ё and ъ were DROPPED rather than merged — the slide
            # prints it precisely to show that dropping and merging are different operations.
            "ceiling31": round(math.log2(31), 3),
            "_warn": "log2 33 = 5.044 is the MODERN 33-letter ceiling, not Yaglom's telegraph alphabet.",
        },
        "search": {
            "_doc": "The search payoff — the reported numbers behind acts 6's IDF / index / clarity slides.",
            "cite": "Spärck Jones 1972; Robertson 2004; Church & Gale 1995; Pibiri & Venturini 2020; "
                    "Cronen-Townsend, Zhou & Croft 2002",
            "sjCranfieldN": 200, "sjWeightAt90": 2, "sjWeightAt3": 7,
            "sjSmoothAt90": 2.15, "sjSmoothAt3": 7.06,      # log2(N/n)+1 — her buckets track it within half a bit
            "churchGaleBoycottIdf": 6.98, "churchGaleSomewhatIdf": 6.45,
            "churchGaleBoycottH": 0.077, "churchGalePoissonH": 0.092, "churchGaleSomewhatH": 0.093,
            # Figure 3 is a two-branch LATTICE, not a chain: one root "train" splits into the dog sense
            # and the railroad sense. Labels transcribed verbatim (Method-1 scores; Method-2 in the
            # paper's parentheses, not used here). The deck used to mislabel 0.65/0.73 as
            # "railroad train"/"obedience train" — "obedience train" is not a query in the paper.
            "claritySeries": [0.33, 0.65, 0.73, 2.43],
            "claritySeriesLabels": ["train", "train dog", "railroad train", "obedience train dog"],
            # Table 1 (clarity) vs Table 3 (average IDF): average IDF wins on ONE of six collections.
            "clarityTrec7": 0.577, "clarityIdfTrec7": 0.467,
            # Table 2 vs Table 4 — the TREC Query track, 1804 queries: average IDF is near-random.
            "clarityQueryTrack": 0.39, "clarityIdfQueryTrack": 0.025, "clarityIdfQueryTrackP": 0.14,
            "churchGaleDocs": 85432, "churchGaleBoycottDf": 676, "churchGaleSomewhatDf": 979,
            "gov2Bic": 2.94, "gov2GapEntropy": 3.02, "gov2Pef": 3.12, "gov2OptPfor": 3.63,
            "gov2EliasDelta": 3.74, "gov2Rice": 4.08, "gov2VByte": 8.81,
            "clarityPrimeLendingRate": 2.85, "clarityVague": 0.37, "clarityThreshold": 1.1,
            "claritySpearmanTrec7": 0.577, "clarityIdfBaselineAp": 0.409, "clarityAp88": 0.368,
        },
        "history": {
            "_doc": "Key dates for the historical arc.",
            "nyquist": 1924, "hartley": 1928, "markovOnegin": 1913, "markovLetters": 20000,
            "shannon1948": 1948, "shannon1951": 1951,
        },
        "markov": {
            "_doc": "Markov's OWN 1913 counts (20 000 letters of Onegin, ъ/ь excluded) — the raw "
                    "material data/l17-entropy.json markovOnegin computes on.",
            "cite": "Markov 1913 (tr. Custance & Link 2006); Hayes 2013",
            "letters": 20000, "vowels": 8638, "consonants": 11362,
            "vowelVowelPairs": 1104, "consonantConsonantPairs": 3827,
            "blocks": 200, "blockLen": 100,
            "coverage": "the whole of chapter one and sixteen stanzas of chapter two",
        },
        "morse": {
            "_doc": "The Morristown type-case count and how close Morse's code lands to the optimum.",
            "cite": "Gleick, The Information (2011); J. D. Cook 2017 on Norvig's frequencies; Pierce 1980",
            "typeE": 12000, "typeT": 9000, "typeZ": 200,
            "dotDashUnitsMorse": 4.527, "dotDashUnitsOptimal": 4.126, "efficiencyPct": 91,
            # …and the same comparison on the OFFICIAL ITU timing, where the inter-symbol and
            # inter-letter gaps are counted too. The efficiency is DERIVED here, not typed: the deck
            # used to print 93.5 %, but 5.6616 / 6.0054 is 94.3 % — the two operands were never on
            # the slide, so nothing checked the ratio.
            "ituUnitsMorse": 6.0054, "ituUnitsOptimal": 5.6616,
            "ituEfficiencyPct": round(100 * 5.6616 / 6.0054, 1),
            "_warn": "WHO did the counting (Morse or Vail) is disputed — Gleick: 'their partisans differ'.",
        },
    }


if __name__ == "__main__":
    (DATA / "l17-entropy.json").write_text(json.dumps(measure(), indent=2, ensure_ascii=False) + "\n")
    (DATA / "l17-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    m = measure()
    print(f"[gen_l17] wrote data/l17-entropy.json (coin H={m['coin']['H']}, 4-sym H={m['source4']['H']} "
          f"= code {m['source4']['avgCodeLen']}, phrase H={m['phrase']['H']} vs uniform {m['phrase']['uniformH']}) "
          f"+ data/l17-bench.json")
