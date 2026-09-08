#!/usr/bin/env python3
"""
embedding_demo.py — a REAL dense embedding (numbers behind a vector), no heavy deps.

Dataset: 20 Newsgroups (sklearn). We build TF-IDF, then LSA (TruncatedSVD) to get
an 8-dimensional dense embedding — a genuine learned vector, not made-up floats —
and L2-normalize it (the course convention). Feeds the `numgrid` template on the
"what a vector actually is" beat (L2 · Definition Vector).

Output: embedding_demo.json — {doc_excerpt, dims, raw, unit, norm, method}.
"""
from __future__ import annotations
import json, pathlib
import numpy as np

OUT = pathlib.Path(__file__).resolve().parent

def main() -> int:
    from sklearn.datasets import fetch_20newsgroups
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.decomposition import TruncatedSVD
    print("[emb] loading 20 newsgroups…", flush=True)
    docs = fetch_20newsgroups(subset="train", remove=("headers", "footers", "quotes")).data
    tfidf = TfidfVectorizer(max_features=20000, stop_words="english").fit_transform(docs)
    svd = TruncatedSVD(n_components=8, random_state=0)
    emb = svd.fit_transform(tfidf)            # (n_docs, 8) dense LSA embedding

    # pick a READABLE doc: decent length + high share of alphabetic chars (skip ascii-art/junk)
    import re
    def quality(i):
        t = docs[i]
        if not (250 <= len(t) <= 700): return -1.0
        alpha = sum(c.isalpha() or c.isspace() for c in t) / len(t)
        words = len(re.findall(r"[A-Za-z]{3,}", t))
        return alpha if words > 30 else -1.0
    idx = max(range(min(2000, len(docs))), key=quality)
    raw = emb[idx]
    unit = raw / np.linalg.norm(raw)
    excerpt = " ".join(docs[idx].split())[:90]

    out = {
        "method": "TF-IDF (20k feats) → TruncatedSVD(8) → L2-normalize · sklearn · 20 Newsgroups",
        "doc_excerpt": excerpt,
        "dims": 8,
        "raw":  [round(float(x), 2) for x in raw],
        "unit": [round(float(x), 2) for x in unit],
        "norm_of_unit": round(float(np.linalg.norm(unit)), 3),
        "explained_var_ratio_sum": round(float(svd.explained_variance_ratio_.sum()), 3),
    }
    (OUT / "embedding_demo.json").write_text(json.dumps(out, indent=2) + "\n")
    print("[emb] unit vector:", out["unit"], "· |v|=", out["norm_of_unit"])
    print("[emb] wrote embedding_demo.json")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
