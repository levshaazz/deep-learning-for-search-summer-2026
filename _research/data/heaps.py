#!/usr/bin/env python3
"""
heaps.py — empirical Heaps' law on a real open corpus.

Dataset: 20 Newsgroups (sklearn.datasets.fetch_20newsgroups), public domain,
English, headers/footers/quotes stripped (same corpus as zipf.py / bpe_merges.py).

Heaps' law: the vocabulary size V grows with the number of tokens read N as
    V = K * N^β      (sublinear, 0<β<1, never saturates).
We tokenize the corpus in document order, track cumulative (N, V) at log-spaced
checkpoints, and fit β, K by least squares on log V = log K + β log N.

Outputs (alongside this file):
  heaps_summary.json — {N_tokens, V_total, beta, K, r2, checkpoints:[…]}
  heaps_curve.png    — V vs N with the fitted power-law overlaid
Consumed by slide L2-11 (Heaps): the measured β replaces the generic "0.4–0.6".
"""
from __future__ import annotations
import json, re, pathlib
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = pathlib.Path(__file__).resolve().parent
TOKEN = re.compile(r"[A-Za-z]+")

def main() -> int:
    from sklearn.datasets import fetch_20newsgroups
    print("[heaps] loading 20 newsgroups (cached after first run)…", flush=True)
    docs = fetch_20newsgroups(subset="all", remove=("headers", "footers", "quotes")).data

    seen: set[str] = set()
    N = 0
    Ns, Vs = [], []
    next_cp = 1000  # first checkpoint; then log-spaced
    for d in docs:
        for tok in TOKEN.findall(d.lower()):
            N += 1
            seen.add(tok)
            if N >= next_cp:
                Ns.append(N); Vs.append(len(seen))
                next_cp = int(next_cp * 1.3)
    Ns.append(N); Vs.append(len(seen))
    Ns_a, Vs_a = np.array(Ns, float), np.array(Vs, float)

    # Fit log V = log K + beta log N  (drop the first few noisy points)
    m = Ns_a > 5000
    lx, ly = np.log(Ns_a[m]), np.log(Vs_a[m])
    beta, logK = np.polyfit(lx, ly, 1)
    K = float(np.exp(logK))
    pred = logK + beta * lx
    ss_res = float(np.sum((ly - pred) ** 2)); ss_tot = float(np.sum((ly - ly.mean()) ** 2))
    r2 = 1 - ss_res / ss_tot

    summary = {
        "dataset": "20 Newsgroups (sklearn, headers/footers/quotes removed)",
        "N_tokens": int(N), "V_total": int(len(seen)),
        "beta": round(float(beta), 4), "K": round(K, 3), "r2": round(r2, 5),
        "note": "V = K * N^beta fit on log-log, N>5000.",
        "checkpoints": [{"N": int(n), "V": int(v)} for n, v in zip(Ns, Vs)],
    }
    (OUT / "heaps_summary.json").write_text(json.dumps(summary, indent=2) + "\n")

    plt.figure(figsize=(7, 4.2))
    plt.loglog(Ns_a, Vs_a, ".", ms=4, label="20 Newsgroups")
    plt.loglog(Ns_a, K * Ns_a ** beta, "-", lw=1.5,
               label=f"fit  V = {K:.1f}·N^{beta:.3f}")
    plt.xlabel("tokens read  N"); plt.ylabel("distinct types  V")
    plt.title(f"Heaps' law — β ≈ {beta:.3f} (R²={r2:.3f})")
    plt.legend(); plt.tight_layout()
    plt.savefig(OUT / "heaps_curve.png", dpi=120)

    print(f"[heaps] N={N:,} tokens · V={len(seen):,} types · beta={beta:.4f} · K={K:.2f} · R2={r2:.4f}")
    print("[heaps] wrote heaps_summary.json, heaps_curve.png")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
