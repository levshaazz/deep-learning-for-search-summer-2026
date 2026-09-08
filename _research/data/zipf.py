#!/usr/bin/env python3
"""
zipf.py — empirical Zipf's law on a real open corpus.

Dataset: 20 Newsgroups (sklearn.datasets.fetch_20newsgroups), public domain
mailing-list archive, English. Cleaned of headers/footers/quotes to leave
running prose only. ~18 700 documents, ~3 M tokens after a simple regex tokenizer.

Outputs (alongside this file):
  zipf_top.csv     — top-50 tokens with rank, count, frequency
  zipf_summary.json — {N_docs, N_tokens, N_types, head, slope_fit, head_pct}
  zipf_loglog.png   — log-log plot (rank vs count), with a 1/r reference line

The slope of the log-log line should be close to -1 (Zipf's law).
The 'head' row shows how few tokens cover what fraction of the corpus —
this is the headline number for slide L2-10 (Zipf).
"""
from __future__ import annotations
import json, re, sys, pathlib, collections
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = pathlib.Path(__file__).resolve().parent
TOKEN = re.compile(r"[A-Za-z]+")

def main() -> int:
    from sklearn.datasets import fetch_20newsgroups
    print("[zipf] downloading 20 newsgroups (cached after first run)…", flush=True)
    data = fetch_20newsgroups(subset="all", remove=("headers", "footers", "quotes"))
    docs = data.data
    counts: collections.Counter[str] = collections.Counter()
    for d in docs:
        # ascii-letters only, lowercased — keeps the curve interpretable
        for tok in TOKEN.findall(d.lower()):
            counts[tok] += 1
    n_tokens = sum(counts.values())
    n_types  = len(counts)
    ranked = counts.most_common()
    # Top-50 table
    rows = ["rank,token,count,freq"]
    for i, (tok, c) in enumerate(ranked[:50], 1):
        rows.append(f"{i},{tok},{c},{c / n_tokens:.6f}")
    (OUT / "zipf_top.csv").write_text("\n".join(rows) + "\n")
    # Log-log fit on the top-1000 (linear regression on log-rank vs log-count)
    top = ranked[:1000]
    ranks  = np.arange(1, len(top) + 1, dtype=float)
    cnts   = np.asarray([c for _, c in top], dtype=float)
    lr, lc = np.log(ranks), np.log(cnts)
    slope, intercept = np.polyfit(lr, lc, 1)
    # Headline coverage stats — what fraction of the corpus the head holds
    cum = np.cumsum(cnts) / n_tokens
    head_idx = {10: 0, 100: 0, 1000: 0}
    for k in head_idx:
        if k <= len(cum):
            head_idx[k] = float(cum[k - 1])
    # Plot
    fig, ax = plt.subplots(figsize=(7, 5), dpi=140)
    ax.loglog(ranks, cnts, lw=0, marker="o", ms=2.0, color="#2A6FDB", label="empirical")
    # 1/r reference normalised to first point (cnts[0])
    ref = cnts[0] / ranks
    ax.loglog(ranks, ref, ls="--", lw=1.2, color="#E8743B", label="1/r reference")
    ax.set_xlabel("rank r (log)")
    ax.set_ylabel("count (log)")
    ax.set_title(f"Zipf on 20 Newsgroups · slope ≈ {slope:.2f}  (Zipf law: −1)")
    ax.grid(True, which="both", ls=":", lw=0.5, alpha=0.5)
    ax.legend(loc="upper right", frameon=False)
    fig.tight_layout()
    fig.savefig(OUT / "zipf_loglog.png", facecolor="#FBFAF6")
    plt.close(fig)
    summary = {
        "dataset": "sklearn 20 newsgroups (all subsets, headers/footers/quotes removed)",
        "n_docs": len(docs),
        "n_tokens": n_tokens,
        "n_types": n_types,
        "loglog_slope_fit_top1000": round(float(slope), 4),
        "loglog_intercept": round(float(intercept), 4),
        "head_coverage": {f"top_{k}": round(v, 4) for k, v in head_idx.items()},
        "top10": [{"rank": i + 1, "token": t, "count": c} for i, (t, c) in enumerate(ranked[:10])],
    }
    (OUT / "zipf_summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(f"[zipf] {n_tokens:,} tokens · {n_types:,} types · slope = {slope:.3f}")
    print(f"[zipf] top-10 cover {head_idx[10]*100:.1f}%  ·  top-100 cover {head_idx[100]*100:.1f}%  ·  top-1000 cover {head_idx[1000]*100:.1f}%")
    print(f"[zipf] wrote zipf_top.csv, zipf_summary.json, zipf_loglog.png")
    return 0

if __name__ == "__main__":
    sys.exit(main())
