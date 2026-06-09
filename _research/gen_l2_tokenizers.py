#!/usr/bin/env python3
"""gen_l2_tokenizers.py — DATA for the L2 `tokenizer-compare` scroll-step widget.

The L2 chapter teaches three tokenizer FAMILIES (BPE merges by frequency, WordPiece by
likelihood-gain, Unigram by likelihood-loss) and the byte-level upgrade — but the Book had no
SIDE-BY-SIDE: the reader never SEES the four cutters disagree on one concrete input. This script
fixes that by training FOUR real tokenizers on the SAME small fixed corpus at the SAME small vocab
size with HuggingFace `tokenizers`, then encoding ONE sample input chosen to make the segmentations
diverge (a rare/compound word `unhappiness`, the gerund `replaying`, the plural `games`):

  data/l2-tokenizers.json   the four cutters on one input, ranked by token count:
    • BPE            — Whitespace pre-tokenizer + BPE; merges learned by FREQUENCY.
    • WordPiece      — `##` continuation prefix, greedy-longest-match encode (BERT's scheme).
    • Unigram        — a probabilistic LM whose Viterbi decode picks the best segmentation.
    • Byte-level BPE — ByteLevel pre-tokenizer (256-byte alphabet, `Ġ` = leading space) + BPE.
  Per tokenizer we emit: the token list for the sample, the token COUNT, and a few illustrative
  per-step pieces so the widget can step through HOW each one splits the rare word —
    • BPE       : the ordered list of learned merges that ASSEMBLE each sample word from its chars,
    • WordPiece : each word's greedy longest-match pieces with the `##` continuation flag,
    • Unigram   : the Viterbi-chosen segmentation of each word (likelihood decode).
  Plus the RANKING by token count (fewest → most) so the widget paints green=fewest … amber=most
  ("fewer tokens = more efficient" reads at a glance).

Determinism: a FIXED curated corpus, a FIXED vocab size, and HF's deterministic training (no RNG in
these trainers for a fixed corpus/vocab). Run twice → byte-identical JSON. The script PRINTS the four
token counts + the sample input + the rare-word segmentations, and asserts the count ranking
BPE < WordPiece < Unigram < ByteBPE so a silent regression in the spread is caught.

Run:  /usr/bin/python3 _research/gen_l2_tokenizers.py
"""
from __future__ import annotations
import json, pathlib, tempfile, os
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# ── hyper-parameters (fixed → reproducible) ───────────────────────────────────────────────────────
VOCAB = 150                      # SAME small vocab for all four — the apples-to-apples constraint.
SPECIAL = ["[UNK]"]
WP_PREFIX = "##"

# ── the curated training corpus (13 short English lines; deliberately morphology-rich so the cutters
#    learn `play/playing/replay`, `happy/happiness/unhappiness`, plurals, comparatives) ─────────────
CORPUS = [
    "the player plays the game and the players are playing again",
    "she plays games while he replays the older games today",
    "happiness and unhappiness both grow from small daily habits",
    "the happy player felt real happiness after a happy game",
    "lower lowest newer newest wider widest faster fastest slower",
    "we are running and they are jumping over the wide river",
    "the runner runs faster than the slower walkers walk away",
    "tokenizing text into tokens helps the model read the tokens",
    "reading and rereading the book made the reader much happier",
    "the cats and the dogs chase the smaller cat and the dog",
    "kindness and unkindness shape how kind the people behave here",
    "playing and replaying the game made the player feel happy",
    "the happiness of playing games is a kind of daily joy",
]

# ── the ONE sample input — a rare/compound word (`unhappiness`), a gerund (`replaying`), a plural
#    (`games`) so the four segmentations differ in interesting ways ──────────────────────────────────
SAMPLE = "the unhappiness of replaying games"
SAMPLE_WORDS = SAMPLE.split()                     # whitespace pre-tokenization mirrors the trainers


# ── training (HF tokenizers; deterministic for a fixed corpus + vocab) ──────────────────────────────
def train_bpe():
    tk = Tokenizer(models.BPE(unk_token="[UNK]"))
    tk.pre_tokenizer = pre_tokenizers.Whitespace()
    tk.train_from_iterator(CORPUS, trainer=trainers.BpeTrainer(
        vocab_size=VOCAB, special_tokens=SPECIAL, show_progress=False))
    return tk


def train_wordpiece():
    tk = Tokenizer(models.WordPiece(unk_token="[UNK]", max_input_chars_per_word=200))
    tk.pre_tokenizer = pre_tokenizers.Whitespace()
    tk.train_from_iterator(CORPUS, trainer=trainers.WordPieceTrainer(
        vocab_size=VOCAB, special_tokens=SPECIAL, show_progress=False,
        continuing_subword_prefix=WP_PREFIX))
    return tk


def train_unigram():
    tk = Tokenizer(models.Unigram())
    tk.pre_tokenizer = pre_tokenizers.Whitespace()
    tk.train_from_iterator(CORPUS, trainer=trainers.UnigramTrainer(
        vocab_size=VOCAB, special_tokens=SPECIAL, show_progress=False, unk_token="[UNK]"))
    return tk


def train_bytelevel():
    tk = Tokenizer(models.BPE(unk_token=None))
    tk.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=True)
    tk.decoder = decoders.ByteLevel()
    tk.train_from_iterator(CORPUS, trainer=trainers.BpeTrainer(
        vocab_size=VOCAB, show_progress=False,
        initial_alphabet=pre_tokenizers.ByteLevel.alphabet()))
    return tk


# ── illustrative per-step extraction ────────────────────────────────────────────────────────────────
def bpe_merges(tk):
    """The ordered list of learned BPE merge rules, as (left, right) tuples (rank = list index)."""
    with tempfile.TemporaryDirectory() as d:
        tk.model.save(d, "bpe")
        lines = (pathlib.Path(d) / "bpe-merges.txt").read_text(encoding="utf-8").splitlines()
    return [tuple(ln.split(" ")) for ln in lines if ln and not ln.startswith("#version")]


def assemble_with_bpe(word, rules):
    """Replay BPE on one whole word: start from characters, repeatedly apply the lowest-rank
    applicable adjacent-pair merge, and record each merge that fires. Returns (final_tokens,
    [{left,right,joined} ...]) — exactly the merges that BUILD this word, in the order they fire."""
    rank = {pair: i for i, pair in enumerate(rules)}
    syms = list(word)
    applied = []
    while True:
        best, best_rank, best_pos = None, None, None
        for i in range(len(syms) - 1):
            pair = (syms[i], syms[i + 1])
            r = rank.get(pair)
            if r is not None and (best_rank is None or r < best_rank):
                best, best_rank, best_pos = pair, r, i
        if best is None:
            break
        syms[best_pos:best_pos + 2] = ["".join(best)]
        applied.append({"left": best[0], "right": best[1], "joined": "".join(best)})
    return syms, applied


def wordpiece_split(tk, word):
    """The greedy longest-match pieces WordPiece produces for one word, each tagged whether it is a
    `##` continuation (a word-internal piece) or the bare word-start piece."""
    pieces = tk.encode(word, add_special_tokens=False).tokens
    return [{"piece": p, "continuation": p.startswith(WP_PREFIX),
             "bare": p[len(WP_PREFIX):] if p.startswith(WP_PREFIX) else p} for p in pieces]


def unigram_split(tk, word):
    """The Viterbi-chosen segmentation Unigram's LM decodes for one word (the likelihood-best split)."""
    return list(tk.encode(word, add_special_tokens=False).tokens)


# ── build one tokenizer's record ─────────────────────────────────────────────────────────────────────
def encode_record(name, tk, family, mechanism, marker):
    enc = tk.encode(SAMPLE)                          # add_special_tokens default for these = none added
    tokens = list(enc.tokens)
    return {
        "name": name, "family": family, "mechanism": mechanism, "marker": marker,
        "tokens": tokens, "count": len(tokens),
        "vocabSize": tk.get_vocab_size(),
    }


def main() -> int:
    bpe, wp, uni, byte = train_bpe(), train_wordpiece(), train_unigram(), train_bytelevel()

    rec_bpe  = encode_record("BPE", bpe, "merge (frequency)",
                             "merge the most FREQUENT adjacent pair", "none")
    rec_wp   = encode_record("WordPiece", wp, "merge (likelihood gain)",
                             "merge by likelihood score; mark word-internal pieces `##`", "##")
    rec_uni  = encode_record("Unigram", uni, "prune (likelihood loss)",
                             "fit a unigram LM, Viterbi-decode the best segmentation", "none")
    rec_byte = encode_record("Byte-level BPE", byte, "merge (frequency, on bytes)",
                             "256-byte alphabet + BPE; `Ġ` marks a leading space", "Ġ")

    # ── illustrative per-step pieces for the rare/compound sample words ──────────────────────────────
    rules = bpe_merges(bpe)
    bpe_steps = []
    for w in SAMPLE_WORDS:
        final, applied = assemble_with_bpe(w, rules)
        bpe_steps.append({"word": w, "tokens": final, "merges": applied})
    rec_bpe["perWord"] = bpe_steps

    rec_wp["perWord"] = [{"word": w, "pieces": wordpiece_split(wp, w)} for w in SAMPLE_WORDS]
    rec_uni["perWord"] = [{"word": w, "tokens": unigram_split(uni, w)} for w in SAMPLE_WORDS]
    # byte-level: show the per-word byte pieces (the Ġ-prefixed run), no merge replay needed.
    rec_byte["perWord"] = [{"word": w, "tokens": byte.encode(w).tokens} for w in SAMPLE_WORDS]

    tokenizers = [rec_bpe, rec_wp, rec_uni, rec_byte]

    # ── ranking by token count (fewest → most): fewest=green … most=amber ────────────────────────────
    order = sorted(range(len(tokenizers)), key=lambda i: (tokenizers[i]["count"], tokenizers[i]["name"]))
    ranking = [{"rank": r + 1, "name": tokenizers[i]["name"], "count": tokenizers[i]["count"]}
               for r, i in enumerate(order)]
    for entry in ranking:
        for t in tokenizers:
            if t["name"] == entry["name"]:
                t["rank"] = entry["rank"]

    counts = {t["name"]: t["count"] for t in tokenizers}

    # ── invariants (so a silent regression in the spread or determinism is caught) ───────────────────
    assert counts["BPE"] < counts["WordPiece"] < counts["Unigram"] < counts["Byte-level BPE"], \
        f"token-count ranking changed: {counts}"
    assert all(t["count"] == len(t["tokens"]) for t in tokenizers), "count != len(tokens)"
    # the rare word `unhappiness` must segment DIFFERENTLY across at least three cutters (the whole point)
    seg = {}
    for t in tokenizers:
        pw = next(p for p in t["perWord"] if p["word"] == "unhappiness")
        toks = pw["tokens"] if "tokens" in pw else [pp["piece"] for pp in pw["pieces"]]
        seg[t["name"]] = toks
    assert len({tuple(v) for v in seg.values()}) >= 3, f"unhappiness segmentations not diverse: {seg}"

    out = {
        "method": ("Four tokenizers trained with HuggingFace `tokenizers` on ONE fixed 13-line corpus "
                   f"at the SAME vocab size ({VOCAB}), then run on one sample input. BPE merges by "
                   "frequency; WordPiece merges by likelihood gain and marks `##` continuations; "
                   "Unigram fits a probabilistic LM and Viterbi-decodes the best split; byte-level BPE "
                   "uses a 256-byte alphabet (`Ġ` = leading space). Ranked by token count."),
        "vocabSize": VOCAB,
        "corpus": CORPUS,
        "sample": SAMPLE,
        "sampleWords": SAMPLE_WORDS,
        "tokenizers": tokenizers,
        "ranking": ranking,             # [{rank, name, count}] sorted fewest → most
        "counts": counts,               # {name: count} flat map for facts-checking
        "spread": {"min": ranking[0]["count"], "max": ranking[-1]["count"]},
        "note": ("Same word, same vocab budget, four cutters → four different segmentations and four "
                 "different token counts. Fewer tokens = more efficient (less compute, cheaper API, "
                 "longer effective context). The byte-level cutter spends most of a small vocab on its "
                 "256-byte alphabet, so it can merge little and stays near character-level — most tokens."),
    }

    DATA.mkdir(exist_ok=True)
    (DATA / "l2-tokenizers.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    # ── PRINT the four counts + the sample + the rare-word segmentations (facts-checkable) ───────────
    print(f"[l2tok] sample input: {SAMPLE!r}  (vocab={VOCAB} for all four)")
    for entry in ranking:
        t = next(x for x in tokenizers if x["name"] == entry["name"])
        print(f"[l2tok] #{entry['rank']} {entry['name']:15s} count={entry['count']:2d}  {t['tokens']}")
    print(f"[l2tok] count ranking (fewest→most): "
          + " < ".join(f"{e['name']}={e['count']}" for e in ranking))
    print(f"[l2tok] rare word `unhappiness` segmentations:")
    for name, toks in seg.items():
        print(f"[l2tok]   {name:15s} → {toks}")
    print(f"[l2tok] wrote data/l2-tokenizers.json  (spread {out['spread']['min']}…{out['spread']['max']} tokens)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
