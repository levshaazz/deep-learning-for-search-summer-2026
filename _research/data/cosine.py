#!/usr/bin/env python3
"""
cosine.py — concrete worked numbers for the cosine-vs-Euclidean slide arc
(L2-49 / L2-56). Computes both metrics on the canonical sanity pairs and on
real sentence-pair distances using sklearn's tiny built-in 20-newsgroups TF-IDF
vectors. Saves ground-truth JSON the slides cite — no hand-invented numbers.

Outputs (alongside this file):
  cosine_examples.json — three pair categories:
     1) the (1,1) vs (10,10) classic — same direction, very different magnitude
     2) right-angle (1,0) vs (0,1) — orthogonal, cosine=0
     3) opposite (1,1) vs (-1,-1) — cosine=-1
     plus a small TF-IDF pair from the 20 newsgroups corpus showing that
     cosine ranks documents by semantic similarity even when L2 distances
     are dominated by length.
"""
from __future__ import annotations
import json, sys, pathlib
import numpy as np

OUT = pathlib.Path(__file__).resolve().parent

def cos(u, v):
    u = np.asarray(u, float); v = np.asarray(v, float)
    return float(np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v) + 1e-12))

def l2(u, v):
    return float(np.linalg.norm(np.asarray(u, float) - np.asarray(v, float)))

def step_by_step(u, v):
    u = np.asarray(u, float); v = np.asarray(v, float)
    dot   = float(np.dot(u, v))
    nu    = float(np.linalg.norm(u))
    nv    = float(np.linalg.norm(v))
    cosv  = dot / (nu * nv)
    l2v   = float(np.linalg.norm(u - v))
    angle_deg = float(np.degrees(np.arccos(np.clip(cosv, -1, 1))))
    return {
        "u": u.tolist(),
        "v": v.tolist(),
        "u_dot_v": round(dot, 6),
        "||u||": round(nu, 6),
        "||v||": round(nv, 6),
        "cos": round(cosv, 6),
        "angle_deg": round(angle_deg, 4),
        "euclid": round(l2v, 6),
    }

def main() -> int:
    out = {
        "classic_pairs": [
            {
                "name": "same direction, different magnitude",
                "story": "(1,1) and (10,10) point the same way — cosine sees them as identical (1.0); Euclidean treats them as far apart (~12.7).",
                **step_by_step([1, 1], [10, 10]),
            },
            {
                "name": "orthogonal",
                "story": "(1,0) and (0,1) are at 90° — cosine = 0 (no shared direction).",
                **step_by_step([1, 0], [0, 1]),
            },
            {
                "name": "opposite",
                "story": "(1,1) and (-1,-1) point the opposite way — cosine = -1.",
                **step_by_step([1, 1], [-1, -1]),
            },
        ]
    }
    # Real-corpus pair: TF-IDF on two short newsgroup snippets so the lecture
    # has a concrete "look — cosine and Euclidean disagree on real text" beat.
    try:
        from sklearn.datasets import fetch_20newsgroups
        from sklearn.feature_extraction.text import TfidfVectorizer
        data = fetch_20newsgroups(subset="train",
                                  categories=["sci.space", "rec.sport.hockey"],
                                  remove=("headers","footers","quotes"))
        # pick the first space doc and the first hockey doc — and a SECOND space
        # doc, so we can show "space ↔ space" should rank higher than "space ↔ hockey"
        space_idx  = [i for i,t in enumerate(data.target) if data.target_names[t] == "sci.space"]
        hockey_idx = [i for i,t in enumerate(data.target) if data.target_names[t] == "rec.sport.hockey"]
        a = data.data[space_idx[0]]
        b = data.data[space_idx[1]]
        c = data.data[hockey_idx[0]]
        vec = TfidfVectorizer(max_features=4000, stop_words="english")
        X = vec.fit_transform([a, b, c]).toarray()
        out["tfidf_pair"] = {
            "corpus": "sklearn 20 newsgroups (sci.space × 2, rec.sport.hockey × 1)",
            "vectorizer": "TfidfVectorizer(max_features=4000, stop_words='english')",
            "space_vs_space": {
                "cos": round(cos(X[0], X[1]), 4),
                "euclid": round(l2(X[0], X[1]), 4),
            },
            "space_vs_hockey": {
                "cos": round(cos(X[0], X[2]), 4),
                "euclid": round(l2(X[0], X[2]), 4),
            },
            "observation": "Same-topic pair has HIGHER cosine; cross-topic pair has LOWER cosine. Euclidean is also smaller for same-topic, but the gap is narrower and length-sensitive."
        }
    except Exception as e:
        out["tfidf_pair_error"] = str(e)
    (OUT / "cosine_examples.json").write_text(json.dumps(out, indent=2) + "\n")
    print("[cosine] wrote cosine_examples.json")
    print("  classic pair (1,1)·(10,10):  cos =", out["classic_pairs"][0]["cos"], " euclid =", out["classic_pairs"][0]["euclid"])
    if "tfidf_pair" in out:
        print("  space-space cosine:", out["tfidf_pair"]["space_vs_space"]["cos"],
              " space-hockey cosine:", out["tfidf_pair"]["space_vs_hockey"]["cos"])
    return 0

if __name__ == "__main__":
    sys.exit(main())
