#!/usr/bin/env python3
"""gen_l3.py — data for L3 'The Star Catalog' (Classical IR + Rank Fusion).

Builds a tiny, deterministic 20 Newsgroups sub-corpus and computes — exactly, reproducibly —
the worked examples the lecture/Book/widgets use:
  data/l3-index.json  inverted index (postings + df) + a 2-term AND-merge trace
  data/l3-bm25.json   per-term TF-IDF and BM25 (k1=1.5, b=0.75) for a fixed query + rankings
  data/l3-rrf.json    two rankers (BM25 vs TF-IDF cosine) fused with RRF (k=60)

Relevance for L4 reuses the 20NG category labels (kept in l3-bm25.json `cat`). Deterministic: no
RNG; sub-corpus = the N shortest docs (stable sort). Run:  python3 _research/gen_l3.py
"""
import json, re, math, pathlib
from sklearn.datasets import fetch_20newsgroups

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CATS = ["sci.space", "rec.sport.hockey"]
QUERY = ["space", "team"]   # fixed, discriminative: space→sci.space, team→hockey
PER_CAT = 4                 # 4 docs per category → 8 total
LEN_MIN, LEN_MAX = 15, 80   # keep real length variety (BM25 length-norm matters)
SNIPPET = 9
K1, B, RRF_K = 1.5, 0.75, 60
STOP = set("the a an of to in is and for on it that this with as was are be by or i you we he "
           "they at from but not have has had will would can could s t".split())

def tokenize(text):
    toks = re.findall(r"[a-z]{2,}", text.lower())
    return [t for t in toks if t not in STOP]

def main():
    bunch = fetch_20newsgroups(subset="train", categories=CATS,
                               remove=("headers", "footers", "quotes"), shuffle=False)
    # Deterministic: per category, the first PER_CAT docs (dataset order) that contain a query term
    # and have real length variety. Real docs → differentiated BM25 / cosine rankings (RRF demo).
    per_cat = {c: [] for c in CATS}
    for text, y in zip(bunch.data, bunch.target):
        cat = bunch.target_names[y]
        toks = tokenize(text)
        if LEN_MIN <= len(toks) <= LEN_MAX and any(q in toks for q in QUERY):
            if len(per_cat[cat]) < PER_CAT:
                per_cat[cat].append(toks)
    chosen = [(toks, c) for c in CATS for toks in per_cat[c]]
    docs = [{"id": f"D{i}", "cat": c, "tokens": toks, "len": len(toks),
             "snippet": " ".join(toks[:SNIPPET]) + "…"} for i, (toks, c) in enumerate(chosen)]
    N = len(docs)
    avgdl = sum(d["len"] for d in docs) / N
    query = QUERY

    # df + postings
    df = {}
    postings = {}
    for d in docs:
        for t in set(d["tokens"]):
            df[t] = df.get(t, 0) + 1
            postings.setdefault(t, []).append(d["id"])
    for t in postings:
        postings[t].sort()

    idf = {t: math.log((N - df.get(t, 0) + 0.5) / (df.get(t, 0) + 0.5) + 1) for t in query}

    def tf(t, d):
        return d["tokens"].count(t)

    # per-doc TF-IDF + BM25 over the query
    scored = []
    for d in docs:
        terms = []
        tfidf_sum = bm25_sum = 0.0
        for t in query:
            f = tf(t, d)
            ti = f * idf[t]
            bm = idf[t] * (f * (K1 + 1)) / (f + K1 * (1 - B + B * d["len"] / avgdl)) if f else 0.0
            terms.append({"t": t, "tf": f, "df": df.get(t, 0), "idf": round(idf[t], 4),
                          "tfidf": round(ti, 4), "bm25": round(bm, 4)})
            tfidf_sum += ti
            bm25_sum += bm
        scored.append({"id": d["id"], "cat": d["cat"], "len": d["len"], "snippet": d["snippet"],
                       "terms": terms, "tfidfScore": round(tfidf_sum, 4), "bm25Score": round(bm25_sum, 4)})

    bm25_rank = [s["id"] for s in sorted(scored, key=lambda s: (-s["bm25Score"], s["id"]))]
    tfidf_rank = [s["id"] for s in sorted(scored, key=lambda s: (-s["tfidfScore"], s["id"]))]

    # a SECOND ranker: cosine of full TF-IDF vectors (whole vocab) → different order for RRF
    vocab = sorted(df)
    idf_all = {t: math.log((N - df[t] + 0.5) / (df[t] + 0.5) + 1) for t in vocab}
    def vec(tokens):
        v = {t: tokens.count(t) * idf_all[t] for t in set(tokens)}
        return v
    qv = {t: idf_all[t] for t in query}  # query as tf=1 per term
    def cos(a, b):
        dot = sum(a[t] * b.get(t, 0) for t in a)
        na = math.sqrt(sum(x * x for x in a.values())) or 1
        nb = math.sqrt(sum(x * x for x in b.values())) or 1
        return dot / (na * nb)
    cos_scores = {d["id"]: cos(qv, vec(d["tokens"])) for d in docs}
    cosine_rank = sorted(cos_scores, key=lambda i: (-cos_scores[i], i))

    # RRF over {bm25_rank, cosine_rank}
    def rr(rank_list, doc):
        return 1.0 / (RRF_K + rank_list.index(doc) + 1)  # 1-based rank
    fused = []
    for d in docs:
        c_bm = rr(bm25_rank, d["id"])
        c_cos = rr(cosine_rank, d["id"])
        fused.append({"id": d["id"], "rrf": round(c_bm + c_cos, 6),
                      "contributions": {"bm25": round(c_bm, 6), "cosine": round(c_cos, 6)},
                      "rankBm25": bm25_rank.index(d["id"]) + 1, "rankCosine": cosine_rank.index(d["id"]) + 1})
    fused.sort(key=lambda f: (-f["rrf"], f["id"]))

    prov = "_research/gen_l3.py · 20 Newsgroups (sci.space, rec.sport.hockey), 8 shortest docs, deterministic"

    (DATA / "l3-index.json").write_text(json.dumps({
        "_doc": "Inverted index for L3 climb-index (term → docIDs + df) + a 2-term AND-merge trace.",
        "_source": prov, "N": N, "query": query,
        "docs": [{"id": d["id"], "cat": d["cat"], "snippet": d["snippet"], "len": d["len"]} for d in docs],
        "terms": {t: {"df": df[t], "postings": postings[t]} for t in query},
        "andMerge": {"lists": {t: postings[t] for t in query},
                     "intersection": sorted(set(postings[query[0]]) & set(postings[query[1]]))},
    }, indent=2, ensure_ascii=False) + "\n")

    (DATA / "l3-bm25.json").write_text(json.dumps({
        "_doc": "TF-IDF and BM25 (k1=1.5, b=0.75) per query term per doc for L3 climb-tfidf/climb-bm25.",
        "_source": prov, "N": N, "avgdl": round(avgdl, 3), "k1": K1, "b": B, "query": query,
        "docs": scored, "bm25Ranking": bm25_rank, "tfidfRanking": tfidf_rank,
    }, indent=2, ensure_ascii=False) + "\n")

    (DATA / "l3-rrf.json").write_text(json.dumps({
        "_doc": "Rank fusion for L3 climb-rrf: two rankers (BM25 vs TF-IDF cosine) fused with RRF (k=60).",
        "_source": prov, "k": RRF_K,
        "lists": {"bm25": bm25_rank, "cosine": cosine_rank},
        "fused": fused, "order": [f["id"] for f in fused],
    }, indent=2, ensure_ascii=False) + "\n")

    print(f"[gen_l3] N={N} avgdl={avgdl:.2f} query={query}")
    print(f"[gen_l3] BM25 ranking: {bm25_rank}")
    print(f"[gen_l3] cosine ranking: {cosine_rank}")
    print(f"[gen_l3] RRF fused: {[f['id'] for f in fused]}")
    print("[gen_l3] wrote data/l3-index.json, l3-bm25.json, l3-rrf.json")

if __name__ == "__main__":
    main()
