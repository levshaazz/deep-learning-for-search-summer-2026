#!/usr/bin/env python3
"""
bpe_merges.py — train a small BPE on an open corpus and record the FIRST 20
merge operations, plus how a few demo strings get tokenized at vocab sizes
1k / 4k / 16k. This gives slide L2-23/L2-37/L2-41 honest, reproducible
merge steps and tokenizations — no invented merges.

Dataset: 20 Newsgroups (sklearn.datasets.fetch_20newsgroups, public domain).
Tokenizer: huggingface 🤗 tokenizers, byte-level BPE (the same family as
GPT-2 / Llama / many production models).

Outputs (alongside this file):
  bpe_first_merges.json     — the first 20 merge ops (in order)
  bpe_demo_tokens.json      — demo tokenization of {tokenization, internationalization, 327, café, привет}
  bpe_merges_summary.json   — corpus & vocab metadata
"""
from __future__ import annotations
import json, re, sys, pathlib
from sklearn.datasets import fetch_20newsgroups
from tokenizers import Tokenizer
from tokenizers.models import BPE
from tokenizers.trainers import BpeTrainer
from tokenizers.pre_tokenizers import ByteLevel as PreByteLevel
from tokenizers.decoders import ByteLevel as DecByteLevel

OUT = pathlib.Path(__file__).resolve().parent
DEMO_STRINGS = [
    "tokenization",
    "internationalization",
    "327",
    "café",
    "привет",
]

def train(vocab_size: int, lines: list[str]) -> Tokenizer:
    tok = Tokenizer(BPE(unk_token=None))
    tok.pre_tokenizer = PreByteLevel(add_prefix_space=False)
    tok.decoder = DecByteLevel()
    trainer = BpeTrainer(
        vocab_size=vocab_size,
        min_frequency=2,
        special_tokens=["<pad>", "<unk>", "<bos>", "<eos>"],
        initial_alphabet=PreByteLevel.alphabet(),
    )
    tok.train_from_iterator(lines, trainer=trainer, length=len(lines))
    return tok

def main() -> int:
    print("[bpe] downloading 20 newsgroups…", flush=True)
    data = fetch_20newsgroups(subset="all", remove=("headers", "footers", "quotes"))
    # one line per doc, keep blanks out
    lines = [d for d in data.data if d.strip()]
    print(f"[bpe] training BPE @ 1k / 4k / 16k on {len(lines):,} docs…", flush=True)
    sizes = (1_000, 4_000, 16_000)
    toks = {s: train(s, lines) for s in sizes}
    # First 20 merges from the 4k tokenizer (typical-size view)
    vocab = toks[4_000].get_vocab()
    # tokenizers doesn't expose the ordered merges directly; serialize and read
    cfg = json.loads(toks[4_000].to_str())
    merges = cfg["model"]["merges"][:20]
    # huggingface 0.21+ returns merges as ["a b", "ab c", ...]; older versions
    # as a list-of-pairs. Normalise to (left, right) tuples.
    norm_merges = []
    for m in merges:
        if isinstance(m, str):
            l, r = m.split(" ", 1)
        else:
            l, r = m
        norm_merges.append({"left": l, "right": r, "joined": l + r})
    (OUT / "bpe_first_merges.json").write_text(json.dumps(norm_merges, indent=2) + "\n")
    # Demo tokenization at each vocab size
    demos = {}
    for s, tok in toks.items():
        demos[f"vocab_{s}"] = {}
        for txt in DEMO_STRINGS:
            enc = tok.encode(txt)
            demos[f"vocab_{s}"][txt] = {
                "tokens": enc.tokens,
                "ids": enc.ids,
                "n_tokens": len(enc.tokens),
            }
    (OUT / "bpe_demo_tokens.json").write_text(json.dumps(demos, indent=2, ensure_ascii=False) + "\n")
    # Summary
    summary = {
        "dataset": "sklearn 20 newsgroups (all subsets, headers/footers/quotes removed)",
        "n_docs_for_training": len(lines),
        "vocab_sizes": list(sizes),
        "tokenizer": "byte-level BPE (huggingface tokenizers, same family as GPT-2/Llama)",
        "demo_strings": DEMO_STRINGS,
        "uses": {
            "L2-23 (Tokenosaurus / BPE intro)": "show real first-20 merges from bpe_first_merges.json",
            "L2-37 (digits split inconsistently)": "compare '327' tokenizations across vocab_1000/4000/16000",
            "L2-41 (token tax across languages)": "compare n_tokens for English / French / Russian rows",
        }
    }
    (OUT / "bpe_merges_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print("[bpe] wrote bpe_first_merges.json, bpe_demo_tokens.json, bpe_merges_summary.json")
    print(f"[bpe] first 5 merges (4k): {[m['joined'] for m in norm_merges[:5]]}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
