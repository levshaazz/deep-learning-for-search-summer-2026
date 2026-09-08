#!/usr/bin/env python3
"""gen_l19.py — L19 "The Wiring Diagram": the BILL, read off the circuit.

WHY THIS FILE EXISTS. L19 makes one promise: that a neural circuit diagram is not decoration — you can
read the cost of a model straight off it, because every wire IS an axis and every box IS work over the
axes it touches. A lecture that makes that promise and then PRINTS a table of costs has broken it. So
every number L19 shows is derived here, from the glyphs, by the same counting rule a student can do by
hand at the board:

    a matmul over axes (a×b)·(b×c) costs 2·a·b·c flops — one multiply and one add per triple.

Apply it to the glyphs of one transformer block (BERT-base: d = 768, h = 12, L = 12, all cited to
data/l15-bench.json) and everything else follows:

    Wq,Wk,Wv   3 × (n×d)·(d×d)      → 6·n·d²      ┐
    L_O          (n×d)·(d×d)        → 2·n·d²      ├─ the LINEAR half: grows with n
    FFN        (n×d)·(d×4d) ×2      → 16·n·d²     ┘        24·n·d²
    QKᵀ          (n×d)·(d×n)        → 2·n²·d      ┐
    A·V          (n×n)·(n×d)        → 2·n²·d      ┴─ the ATTENTION CORE: grows with n²   4·n²·d

Set them equal and the crossover falls out with no arithmetic at all: 4n²d = 24nd² ⟺ **n = 6d**. For
BERT-base that is 4608 tokens — and THAT is the lecture's punchline. Everyone "knows" attention is
quadratic; almost nobody can say at what length the quadratic term actually starts to matter, because
the formula does not show it and the diagram does. Below 6d the model is mostly the FFN nobody talks
about; above it, the cup you drew in one stroke eats the machine.

MEMORY IS THE OTHER HALF, AND IT BITES FIRST. The n×n score box is materialised in fp16, per head:
h·n²·2 bytes. At n=512 that is small; at n=32768 it is 25.8 GB — the number L06 and L15 already print.
This file recomputes it from the glyph and ASSERTS it against data/l15-attention.json, so the new
lecture cannot drift from the two that already teach it.

The KV cache is the same trick run backwards: at decode time the n×n box never exists (a step's scores
are 1×(n+1)), and what you pay for instead is the CACHE — 2·d·2 bytes per token per layer. Shrink the
K/V head count (MQA/GQA) and that bill divides. The diagram shows exactly why: MQA does not touch the
query wire at all, only the two wires that get stored.

Everything is exact integer arithmetic on integers; no RNG, no numpy, stdlib only — byte-identical
under any CPython. `bash _research/reproduce.sh` must leave data/ unchanged.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

BENCH = json.loads((DATA / "l15-bench.json").read_text(encoding="utf-8"))
L15A = json.loads((DATA / "l15-attention.json").read_text(encoding="utf-8"))

BERT = BENCH["bertBase"]
D = BERT["hidden"]          # 768
H = BERT["heads"]           # 12
LAYERS = BERT["layers"]     # 12
DH = D // H                 # 64 — the per-head width the concat hexagon puts back together
FP16 = 2                    # bytes per element: the score box is materialised in half precision

# The lengths the course already uses everywhere (L06's memory slide, L15's KV-cache walk).
NS = L15A["memory"]["n"]    # [512, 4096, 32768]

MB = 1_000_000              # decimal MB/GB — the convention l15-attention.json already prints
GB = 1_000_000_000
KB = 1_000


def mm(a, b, c):
    """flops of an (a×b)·(b×c) matmul — one multiply and one add per (i,j,k) triple."""
    return 2 * a * b * c


def block_flops(n):
    """One transformer block, glyph by glyph. The split is the whole point: which terms carry n, and
    which carry n². Nothing here is a constant anyone had to look up."""
    qkv = 3 * mm(n, D, D)          # three chipped rectangles
    scores = mm(n, D, n)           # the CUP: the d axis dies
    av = mm(n, n, D)               # the second cup: the key axis dies
    out = mm(n, D, D)              # L_O
    ffn = mm(n, D, 4 * D) + mm(n, 4 * D, D)
    linear = qkv + out + ffn       # = 24·n·d²
    core = scores + av             # = 4·n²·d
    total = linear + core
    return {
        "qkv": qkv, "scores": scores, "av": av, "outProj": out, "ffn": ffn,
        "linear": linear, "attnCore": core, "total": total,
        "attnSharePct": round(100.0 * core / total, 1),
        "linearGF": round(linear / 1e9, 1), "attnCoreGF": round(core / 1e9, 1),
        "totalGF": round(total / 1e9, 1),
    }


def scores_bytes(n):
    """the n×n box the circuit draws, materialised: one per head, fp16."""
    return H * n * n * FP16


def kv_cache(kv_heads):
    """bytes of K+V cached per token, per layer, for `kv_heads` key/value heads (MHA: h, MQA: 1, GQA: g).
    The query wire is untouched — which is precisely why the saving is free of the head count h."""
    per_layer = 2 * (kv_heads * DH) * FP16      # K and V
    per_token = per_layer * LAYERS
    return per_token


def build():
    flops = {str(n): block_flops(n) for n in NS}

    # THE CROSSOVER. 4·n²·d = 24·n·d²  ⟺  n = 6d. Solved, not searched: the exponents come off the
    # diagram (a cup touching two n wires is n², a chipped rectangle touching one is n).
    n_star = 6 * D
    at_star = block_flops(n_star)
    assert at_star["attnCore"] == at_star["linear"], "n = 6d must be the exact crossover"

    # Store each figure AT THE PRECISION THE COURSE PRINTS IT. A data file that says 25.77 while every
    # slide, in three lectures, says 25.8 is not "more precise" — it is a second number, and the first
    # thing a reader does with two numbers is wonder which one is wrong. (This is the drift the widget
    # gate hunts; the data file does not get an exemption from it.)
    mem = {}
    for n in NS:
        b = scores_bytes(n)
        mem[str(n)] = {"bytes": b, "mb": round(b / MB, 1), "gb": round(b / GB, 1)}

    # The two lectures that already teach these numbers must not be contradicted by the one that
    # DERIVES them. Assert, do not hope. (Each is checked at the precision that lecture prints it:
    # L15 shows the 4k figure as a round 403 MB, not 402.7 — a hall number, and rightly so. The
    # assertion follows the number people actually see, not a tidier one we would prefer.)
    m = L15A["memory"]
    assert round(scores_bytes(512) / MB, 1) == m["mb512x12"], m["mb512x12"]
    assert round(scores_bytes(4096) / MB) == m["mb4kx12"], m["mb4kx12"]
    assert round(scores_bytes(32768) / GB, 1) == m["gb32kx12"], m["gb32kx12"]
    mem["4096"]["mb"] = round(scores_bytes(4096) / MB)   # print it the way L15 prints it

    mha, mqa, gqa = kv_cache(H), kv_cache(1), kv_cache(4)
    n_long = NS[-1]
    cache = {
        "mha": {"kvHeads": H, "perTokenB": mha, "perTokenKB": round(mha / KB, 1),
                "atLongMB": round(mha * n_long / MB, 1)},
        "mqa": {"kvHeads": 1, "perTokenB": mqa, "perTokenKB": round(mqa / KB, 1),
                "atLongMB": round(mqa * n_long / MB, 1), "shrink": mha // mqa},
        "gqa4": {"kvHeads": 4, "perTokenB": gqa, "perTokenKB": round(gqa / KB, 1),
                 "atLongMB": round(gqa * n_long / MB, 1), "shrink": mha // gqa},
        "n": n_long,
    }

    return {
        "_doc": (
            "L19 'The Wiring Diagram' — every cost in the lecture, DERIVED from the glyphs by "
            "_research/gen_l19.py, never typed. One rule does all of it: an (a×b)·(b×c) matmul costs "
            "2abc flops. Model constants (d=768, h=12, L=12) are BERT-base, cited to l15-bench.json; the "
            "n×n score-box memory is recomputed from the glyph and ASSERTED equal to l15-attention.json, "
            "so the lecture that DERIVES the bill cannot drift from the two that already print it."
        ),
        "_source": "_research/gen_l19.py (model ← data/l15-bench.json · memory asserted vs data/l15-attention.json)",
        "model": {"d": D, "heads": H, "layers": LAYERS, "dHead": DH, "bytesPerElem": FP16,
                  "cite": BERT["cite"]},
        "rule": "an (a×b)·(b×c) matmul costs 2·a·b·c flops — one multiply and one add per triple",
        "perBlock": {
            "linearCoef": 24, "attnCoef": 4,
            "_note": "linear = 24·n·d² (Wq,Wk,Wv,L_O = 8nd² · FFN = 16nd²); attention core = 4·n²·d (two cups)",
        },
        "flops": flops,
        "crossover": {"n": n_star, "rule": "n = 6d", "d": D,
                      "linearGF": at_star["linearGF"], "attnCoreGF": at_star["attnCoreGF"],
                      "_note": "4n²d = 24nd² ⟺ n = 6d. Below it the block is mostly the FFN; above it, "
                               "the cup eats the machine."},
        "scoreBox": mem,
        "kvCache": cache,
        "flash": {
            "cite": BENCH["efficientAttention"]["cite"],
            "avoidedGB": mem[str(n_long)]["gb"],
            "_note": "FlashAttention never MATERIALISES the n×n box: the wire is still there, the tensor "
                     "is not. What it avoids at n=32768 is exactly the score-box bytes computed above.",
        },
    }


def main():
    d = build()
    (DATA / "l19-cost.json").write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("[l19-cost] wrote data/l19-cost.json")
    print(f"  model      d={d['model']['d']} h={d['model']['heads']} L={d['model']['layers']}")
    for n, f in d["flops"].items():
        print(f"  n={n:>5}   linear {f['linearGF']:>8} GF · attention core {f['attnCoreGF']:>8} GF "
              f"→ attention is {f['attnSharePct']}% of the block")
    c = d["crossover"]
    print(f"  crossover  n = 6d = {c['n']} tokens — where the cup finally costs as much as everything else")
    k = d["kvCache"]
    print(f"  KV cache   MHA {k['mha']['perTokenKB']} KB/token → {k['mha']['atLongMB']} MB at n={k['n']}")
    print(f"             MQA {k['mqa']['perTokenKB']} KB/token → {k['mqa']['atLongMB']} MB "
          f"({k['mqa']['shrink']}× smaller)")
    print(f"             GQA-4 {k['gqa4']['perTokenKB']} KB/token ({k['gqa4']['shrink']}× smaller)")


if __name__ == "__main__":
    main()
