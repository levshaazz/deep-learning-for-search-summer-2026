#!/usr/bin/env python3
"""gen_l6_contextual.py — REAL contextual-embedding numbers for L6's "bank" corner-case.

The L6 Book asserts (qualitatively) that a static embedding crushes the two senses of
"bank" into one dot, while a contextual model returns "genuinely different points" for
"bank near river" vs "bank near deposited". This script turns that claim NUMERIC.

Real, reproducible worked example (run with /usr/bin/python3 — it has transformers+torch):
  data/l6-contextual.json  the classic polysemy demo on a SMALL BERT-style model:
                           three sentences where "bank" carries a river sense, a money
                           sense, and a second (control) money sense; the CONTEXTUAL
                           hidden vector of the "bank" token in each (last hidden layer);
                           and the cosines that make the point —
                             cross-sense  cos(bank_river, bank_money)   → MODERATE/LOW
                             within-sense cos(bank_money, bank_money2)  → HIGH
                           plus each "bank"'s cosine to its own river/money context word,
                           showing each occurrence leans toward its neighbours.

The lesson (the contrast static vs contextual): word2vec/GloVe give "bank" ONE vector — the
L5 static cosines already in data/l5-embeddings.json are the static baseline — so a static
model *cannot* produce a cross-sense gap at all (its "bank·bank" is 1.0 by construction).
A contextual model splits the senses: cross-sense cosine drops well below within-sense.

Model: distilbert-base-uncased (a BERT-style masked-LM encoder → TOKEN-level contextual
vectors, NOT a sentence model). "bank" is a single token in the BERT WordPiece vocab, so
the token index is unambiguous (we still locate it programmatically). Weights are fetched
once from the HuggingFace hub (one-time network, like the GloVe fetch in gen_l5.py) and
cached to a gitignored dir (HF_HOME under _research/data/.cache/).

Deterministic: eval() mode (dropout off), torch.no_grad(), torch manual seed pinned (no
sampling happens, but pinned for belt-and-braces). Same sentences → same vectors → same
cosines every run. Feeds the L6 Book prose (which will cite these exact numbers) and is
facts-gate-checkable.

Run:  /usr/bin/python3 _research/gen_l6_contextual.py
"""
from __future__ import annotations
import json, os, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
# Reuse the gen_l5 cache convention: everything heavy/regenerable under the gitignored
# _research/data/.cache/ . Point HuggingFace at a subdir there so model weights are cached
# (and gitignored) rather than landing in ~/.cache.
CACHE = ROOT / "_research" / "data" / ".cache"
HF_CACHE = CACHE / "hf"
HF_CACHE.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("HF_HOME", str(HF_CACHE))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

MODEL = "distilbert-base-uncased"
SEED = 0

# Three sentences. "bank" appears once in each; the river one is the odd sense out, the two
# money ones are the within-sense control pair. Sentences picked so the cross-sense cosine
# lands clearly BELOW the within-sense cosine (the whole point) — see the assert in main().
SENTENCES = {
    "river":  "She sat on the grassy bank of the river.",
    "money":  "She deposited her paycheck at the bank downtown.",
    "money2": "He waited in line at the bank to cash a cheque.",
}
# the context word whose contextual vector each "bank" should lean toward
CONTEXT_WORD = {"river": "river", "money": "deposited", "money2": "cash"}


def r(x, n=4):
    return round(float(x), n)


def cos(a, b) -> float:
    import torch
    return float(torch.nn.functional.cosine_similarity(a, b, dim=0))


def load_model():
    import torch
    from transformers import AutoTokenizer, AutoModel
    torch.manual_seed(SEED)
    tok = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModel.from_pretrained(MODEL)
    model.eval()  # dropout off → deterministic
    return tok, model


def token_vectors(tok, model, sentence: str, word: str):
    """Return (token_index_of `word`, last-hidden-layer vector at that index).

    `word` is a single BERT-vocab token here; we tokenize it alone to get its id, then find
    that id in the sentence's input_ids. Robust if the word were ever split into WordPieces
    (we'd take the first piece), but for "bank"/"river"/etc. it's a single token.
    """
    import torch
    enc = tok(sentence, return_tensors="pt")
    with torch.no_grad():
        out = model(**enc)
    hidden = out.last_hidden_state[0]  # (seq_len, dim) — the contextual vectors
    ids = enc["input_ids"][0].tolist()
    # id(s) the bare word maps to (no special tokens), take the first piece
    want_id = tok(word, add_special_tokens=False)["input_ids"][0]
    try:
        idx = ids.index(want_id)
    except ValueError:
        # fall back: scan decoded tokens for a startswith match
        toks = tok.convert_ids_to_tokens(ids)
        idx = next(i for i, t in enumerate(toks) if t.lstrip("#").startswith(word))
    return idx, hidden[idx]


def build() -> dict:
    tok, model = load_model()

    bank, ctx = {}, {}
    bank_idx, ctx_idx = {}, {}
    for key, sent in SENTENCES.items():
        bi, bv = token_vectors(tok, model, sent, "bank")
        ci, cv = token_vectors(tok, model, sent, CONTEXT_WORD[key])
        bank[key], ctx[key] = bv, cv
        bank_idx[key], ctx_idx[key] = bi, ci

    cross_sense = r(cos(bank["river"], bank["money"]))     # river vs money  → expect LOW
    within_sense = r(cos(bank["money"], bank["money2"]))   # money vs money2 → expect HIGH
    # a second cross-sense pair (river vs the control money sentence), for robustness
    cross_sense2 = r(cos(bank["river"], bank["money2"]))

    # each "bank" leans toward its own context word more than toward the other sense's
    bank_to_context = {
        key: {
            "contextWord": CONTEXT_WORD[key],
            "cos": r(cos(bank[key], ctx[key])),
        }
        for key in SENTENCES
    }

    return {
        "model": MODEL,
        "layer": "last_hidden_state (final layer)",
        "dim": int(bank["river"].shape[0]),
        "sentences": {
            key: {
                "text": SENTENCES[key],
                "sense": "river" if key == "river" else "money",
                "bankTokenIndex": bank_idx[key],
                "contextWord": CONTEXT_WORD[key],
                "contextTokenIndex": ctx_idx[key],
            }
            for key in SENTENCES
        },
        "cosines": {
            "crossSense": cross_sense,        # cos(bank_river, bank_money)   — the senses split
            "crossSense2": cross_sense2,      # cos(bank_river, bank_money2)  — splits again
            "withinSense": within_sense,      # cos(bank_money, bank_money2)  — same sense, stays high
            "gap": r(within_sense - cross_sense),  # within − cross : how far context pulls senses apart
            "bankToContext": bank_to_context,      # each bank vs its own neighbour word
        },
        "staticBaseline": {
            "note": "A static embedding (word2vec/GloVe) gives 'bank' ONE vector, so its "
                    "bank-vs-bank cosine is 1.0000 by construction — no cross-sense gap is "
                    "even possible. See data/l5-embeddings.json for the L5 static cosines. "
                    "The contextual model below SPLITS the senses.",
            "staticBankSelfCos": 1.0,
        },
        "note": "REAL token-level contextual vectors from {m}. For each sentence we take the "
                "last-hidden-layer vector at the 'bank' token (a single BERT-vocab WordPiece, "
                "index located programmatically) and cosine the occurrences against each "
                "other. Reproducible: model.eval() (dropout off), torch.no_grad(), "
                "torch.manual_seed({s}); no sampling, so the run is deterministic — same "
                "sentences give the same cosines every time. The payoff: cross-sense cosine "
                "(river vs money) < within-sense cosine (money vs money) — context separates "
                "the two senses a single static vector could not.".format(m=MODEL, s=SEED),
    }


def main() -> int:
    out = build()
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "l6-contextual.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    c = out["cosines"]
    cross, within = c["crossSense"], c["withinSense"]
    # THE WHOLE POINT: context must pull the two senses apart further than two same-sense uses.
    assert cross < within, (
        f"cross-sense ({cross}) is NOT < within-sense ({within}); pick clearer sentences."
    )
    print(f"[l6c] model={out['model']} dim={out['dim']} layer=last")
    for key, s in out["sentences"].items():
        print(f"[l6c]   {key:7s} bank@{s['bankTokenIndex']}  \"{s['text']}\"")
    print(f"[l6c] cross-sense  cos(bank_river, bank_money)  = {cross}")
    print(f"[l6c] within-sense cos(bank_money, bank_money2) = {within}  "
          f"(gap {c['gap']}; cross < within ✓)")
    print("[l6c] wrote data/l6-contextual.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
