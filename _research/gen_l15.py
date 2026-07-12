#!/usr/bin/env python3
"""gen_l15.py — the L15 "BERT & other Transformers" data generator.

Emits TWO structurally-distinct files (provenance must never blur):

  • data/l15-attention.json — COMPUTED by hand on tiny inputs (pure stdlib math.exp/sin/cos →
      byte-identical under any CPython). The self-attention forward pass (softmax of scaled Q·K),
      the √dₖ saturation demo, sinusoidal positional encodings, block-parameter count (12·d²),
      causal masking, the next-token softmax, the decoding-strategy distribution (softmax + top-k /
      top-p / temperature), and the O(n²) score-matrix memory. Every ≥2-dp number the deck DISPLAYS.
  • data/l15-bench.json  — REPORTED published numbers (Vaswani 2017, Devlin 2019, Sanh 2019, Brown
      2020, …) — model sizes (BERT-base 110M / large 340M), DistilBERT's 40/60/97, GPT-3 175B,
      context lengths. NOT computed here; each carries a `cite` key resolving to data/papers.json.

Run: python3 _research/gen_l15.py   (stdlib only; reproduce.sh re-runs it byte-identically)
"""
import json
import math
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def softmax(z, T=1.0, r=3):
    """Numerically-stable softmax of logits z at temperature T, each weight rounded to r dp."""
    s = [zi / T for zi in z]
    m = max(s)
    e = [math.exp(si - m) for si in s]
    tot = sum(e)
    return [round(ei / tot, r) for ei in e]


def measure():
    # ── Example 1 (slide 13): 3 tokens, d_k=4 (√d_k=2). Scaled scores E1=(1,0,3), values
    #    V1=(1,0), V2=(0,1), V3=(1,1). softmax → weights; weighted sum → context vector Y1. ──
    e1 = [1, 0, 3]
    a1 = softmax(e1)                                   # (0.114, 0.042, 0.844)
    V = [(1, 0), (0, 1), (1, 1)]
    y1 = (round(sum(a1[j] * V[j][0] for j in range(3)), 3),   # 0.958
          round(sum(a1[j] * V[j][1] for j in range(3)), 3))   # 0.886

    # ── √dₖ saturation (slide 11): same dot-product 6 unscaled vs 3 scaled (÷√4). ──
    sqrt_unscaled = softmax([0, 0, 6])                 # (0.002, 0.002, 0.995) — peaky
    sqrt_scaled = softmax([0, 0, 3])                   # (0.045, 0.045, 0.909) — softer

    # ── Positional encoding (slide 27): d=4, dims (2i,2i+1), i∈{0,1}. freq_i = 10000^{-2i/d}. ──
    freqs = [round(10000 ** (-2 * i / 4), 3) for i in (0, 1)]   # [1.0, 0.01]
    def pe(pos):
        out = []
        for f in freqs:
            out += [round(math.sin(pos * f), 3), round(math.cos(pos * f), 3)]
        return out
    pe0, pe1 = pe(0), pe(1)                             # (0,1,0,1) ; (0.841,0.540,0.010,1.000)

    # ── Block parameters (slide 31): attention 4d² + FFN 8d² = 12d² per block, d=768. ──
    d = 768
    per_block = 12 * d * d                             # 7 077 888
    per_block_m = round(per_block / 1e6, 2)            # 7.08
    tok_emb = 30522 * d                                # 23 440 896 ≈ 23.4M

    # ── Causal attention (slide 61): query t2, raw scores (0,2,3). no-mask vs causal (drop t3). ──
    causal_nomask = softmax([0, 2, 3])                 # (0.035, 0.259, 0.705)
    causal_masked = softmax([0, 2])                    # (0.119, 0.881)  — t3 weight 0

    # ── Autoregression next-token (slide 65): softmax(0,1,2). ──
    next_tok = softmax([0, 1, 2])                      # (0.090, 0.245, 0.665)

    # ── Decoding strategies (slide 79): logits z, base softmax + cumulative + top-k(2) + T. ──
    z = [2, 1, 0.5, 0, -1]
    base = softmax(z)                                  # (0.563,0.207,0.126,0.076,0.028)
    cum, acc = [], 0.0
    for p in base:
        acc = round(acc + p, 3)
        cum.append(acc)                                # 0.563,0.770,0.896,0.972,1.000
    topk2 = softmax(z[:2])                             # renormalize {t1,t2} → (0.731,0.269)
    t_sharp = softmax(z, T=0.5)                        # (0.829,0.112,0.041,0.015,0.002)
    t_soft = softmax(z, T=2.0)                         # (0.375,0.227,0.177,0.138,0.084)

    # ── O(n²) score-matrix memory (slide 88): E=QKᵀ is n×n; fp16 = 2n² bytes per head, h=12. ──
    #    Every figure is rounded ONCE, from bytes — never re-rounded from an already-rounded per-head
    #    figure (round(round(2·512²/1e6,2)·12,1) would report 6.2 MB, not the true 6.3 MB).
    heads = 12
    def mem(n, unit, r=2, h=1):
        return round(2 * n * n * h / unit, r)
    mem512_mb = mem(512, 1e6)                          # 0.52
    mem4k_mb = mem(4096, 1e6, 1)                       # 33.6
    mem32k_gb = mem(32768, 1e9)                        # 2.15
    mem512_mb_h = mem(512, 1e6, 1, heads)              # 6.3   (2·512²·12/1e6 = 6.291456)
    mem4k_mb_h = round(2 * 4096 ** 2 * heads / 1e6)    # 403   (402.653184 → integer MB)
    mem32k_gb_h = mem(32768, 1e9, 1, heads)            # 25.8  (25.769803776)

    return {
        "_doc": "COMPUTED by hand on tiny inputs (stdlib math.exp/sin/cos). Deck-displayable, reproducible. "
                "Generator: _research/gen_l15.py. Provenance for the L15 worked examples (self-attention, "
                "√dₖ, positional encoding, parameter count, causal mask, decoding, O(n²) memory).",
        "attention": {
            "dk": 4, "sqrtDk": 2, "scores": e1, "weights": a1, "weightSum": round(sum(a1), 3),
            "values": [list(v) for v in V], "output": list(y1),
            "_note": "Example 1: softmax(1,0,3)=(0.114,0.042,0.844) sum 1.000; Y1=(0.958,0.886) toward V3",
        },
        "sqrtScale": {
            "dot": 6, "unscaled": sqrt_unscaled, "scaledScore": 3, "scaled": sqrt_scaled,
            "_note": "same dot 6 → softmax(0,0,6)=(…,0.995) peaky vs ÷√4 → softmax(0,0,3)=(…,0.909) softer",
        },
        "posEnc": {
            "d": 4, "freqs": freqs, "pos0": pe0, "pos1": pe1,
            "_note": "PE d=4: pos0=(0,1,0,1); pos1=(sin1,cos1,sin.01,cos.01)=(0.841,0.540,0.010,1.000)",
        },
        "params": {
            "d": d, "perBlock": per_block, "perBlockM": per_block_m, "blocks": 12,
            "tokenEmb": tok_emb, "attnCoef": 4, "ffnCoef": 8, "blockCoef": 12,
            "_note": "12·768²=7 077 888≈7.08M per block; 12 blocks + embeddings ≈ 110M (BERT-base)",
        },
        "causal": {
            "scores": [0, 2, 3], "noMask": causal_nomask, "masked": causal_masked,
            "_note": "no-mask softmax(0,2,3)=(0.035,0.259,0.705) leaks future t3; causal softmax(0,2)=(0.119,0.881)",
        },
        "autoregr": {"scores": [0, 1, 2], "next": next_tok,
                     "_note": "next-token softmax(0,1,2)=(0.090,0.245,0.665)"},
        "decoding": {
            "logits": z, "base": base, "cumulative": cum, "topk2": topk2,
            "tempSharp": t_sharp, "tempSoft": t_soft, "TSharp": 0.5, "TSoft": 2.0,
            "_note": "z=(2,1,0.5,0,-1) → base (0.563,0.207,0.126,0.076,0.028); top-k(2) (0.731,0.269); "
                     "T=0.5 (0.829,…); T=2.0 (0.375,…)",
        },
        "memory": {
            "heads": heads, "n": [512, 4096, 32768],
            "mb512": mem512_mb, "mb4k": mem4k_mb, "gb32k": mem32k_gb,
            "mb512x12": mem512_mb_h, "mb4kx12": mem4k_mb_h,
            "gb32kx12": mem32k_gb_h,
            "_note": "fp16 2n² bytes/head: n=512→0.52MB, n=32k→2.15GB; ×12 heads → 6.3MB / 403MB / 25.8GB (O(n²))",
        },
        "uniform3": round(1 / 3, 3),
    }


def bench():
    """REPORTED published numbers — each `cite` resolves to a data/papers.json id. Not computed here."""
    return {
        "_doc": "REPORTED published numbers (transcribed from the primary papers). Provenance labels, NOT our toy. "
                "Each `cite` is a data/papers.json id.",
        "_source": "Vaswani 2017, Devlin 2019, Sanh 2019, Liu 2019, Lan 2020, Clark 2020, Raffel 2020, Lewis 2020, "
                   "Radford 2019, Brown 2020, Dao 2022 — see data/papers.json",
        "transformer": {
            "cite": "vaswani-2017-transformer",
            "dModel": 512, "heads": 8, "dFF": 2048, "encLayers": 6, "decLayers": 6,
            "_doc": "Attention Is All You Need — the base Transformer (enc-dec).",
        },
        "bertBase": {
            "cite": "devlin-2019-bert",
            "layers": 12, "hidden": 768, "heads": 12, "paramsM": 110,
            "_doc": "BERT-base: L=12, H=768, A=12 → ~110M parameters.",
        },
        "bertLarge": {
            "cite": "devlin-2019-bert",
            "layers": 24, "hidden": 1024, "heads": 16, "paramsM": 340,
            "_doc": "BERT-large: L=24, H=1024, A=16 → ~340M parameters.",
        },
        "distilbert": {
            "cite": "distilbert-2019",
            "smallerPct": 40, "fasterPct": 60, "gluePct": 97,
            "_doc": "DistilBERT: ~40% smaller, ~60% faster, retains ~97% of BERT's GLUE score.",
        },
        "gpt3": {
            "cite": "gpt3-2020",
            "paramsB": 175, "contextTokens": 2048,
            "_doc": "GPT-3: 175B parameters, 2048-token context; in-context few-shot learning.",
        },
        "variants": {
            "_doc": "BERT-family training-objective variants (facts, not our computation).",
            "roberta": {"cite": "roberta-2019", "_note": "no NSP, dynamic masking, more data/compute"},
            "albert": {"cite": "albert-2020", "_note": "factorized embeddings + cross-layer weight sharing"},
            "electra": {"cite": "electra-2020", "_note": "replaced-token detection over all tokens"},
        },
        "encDec": {
            "_doc": "Encoder-decoder / seq2seq denoisers.",
            "t5": {"cite": "t5-2020", "_note": "text-to-text unified framework"},
            "bart": {"cite": "bart-2020", "_note": "denoising seq2seq pre-training"},
        },
        "efficientAttention": {
            "cite": "dao-2022-flashattention",
            "_doc": "FlashAttention: exact attention in O(n) memory (no materialized n×n matrix).",
        },
    }


if __name__ == "__main__":
    (DATA / "l15-attention.json").write_text(json.dumps(measure(), indent=2, ensure_ascii=False) + "\n")
    (DATA / "l15-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    m = measure()
    print(f"[gen_l15] wrote data/l15-attention.json (Ex1 weights={m['attention']['weights']} → "
          f"Y1={m['attention']['output']}; params/block={m['params']['perBlockM']}M; "
          f"mem 32k={m['memory']['gb32k']}GB) + data/l15-bench.json")
