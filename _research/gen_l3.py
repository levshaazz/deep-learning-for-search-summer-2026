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

    # ── NEW (deepening): second query with DISTINCT-df terms so "rare term dominates" fires ─────────
    # nasa (df=3, lower idf) vs shuttle (df=2, higher idf): the rarer term gets the heavier weight.
    QUERY2 = ["nasa", "shuttle"]
    idf2 = {t: math.log((N - df.get(t, 0) + 0.5) / (df.get(t, 0) + 0.5) + 1) for t in QUERY2}
    scored2 = []
    for d in docs:
        terms = []
        tfidf_sum = bm25_sum = 0.0
        for t in QUERY2:
            f = tf(t, d)
            ti = f * idf2[t]
            bm = idf2[t] * (f * (K1 + 1)) / (f + K1 * (1 - B + B * d["len"] / avgdl)) if f else 0.0
            terms.append({"t": t, "tf": f, "df": df.get(t, 0), "idf": round(idf2[t], 4),
                          "tfidf": round(ti, 4), "bm25": round(bm, 4)})
            tfidf_sum += ti
            bm25_sum += bm
        scored2.append({"id": d["id"], "cat": d["cat"], "len": d["len"], "snippet": d["snippet"],
                        "terms": terms, "tfidfScore": round(tfidf_sum, 4), "bm25Score": round(bm25_sum, 4)})
    bm25_rank2 = [s["id"] for s in sorted(scored2, key=lambda s: (-s["bm25Score"], s["id"]))]
    tfidf_rank2 = [s["id"] for s in sorted(scored2, key=lambda s: (-s["tfidfScore"], s["id"]))]

    # ── NEW: cat/dog/mouse flagship BM25 mini-collection (computed, not hardcoded) ──────────────────
    cd_docs = {"D1": "cat cat dog", "D2": "cat dog dog mouse", "D3": "mouse cat"}
    cd_query = ["cat", "dog"]
    cd_tokens = {i: t.split() for i, t in cd_docs.items()}
    cd_lens = {i: len(toks) for i, toks in cd_tokens.items()}
    cd_N = len(cd_docs)
    cd_avgdl = sum(cd_lens.values()) / cd_N
    cd_df = {}
    for toks in cd_tokens.values():
        for t in set(toks):
            cd_df[t] = cd_df.get(t, 0) + 1
    cd_idf = {t: math.log((cd_N - cd_df.get(t, 0) + 0.5) / (cd_df.get(t, 0) + 0.5) + 1) for t in cd_query}
    cd_scored = []
    for i in ["D1", "D2", "D3"]:
        toks = cd_tokens[i]
        weights = []
        score = 0.0
        for t in cd_query:
            f = toks.count(t)
            bm = cd_idf[t] * (f * (K1 + 1)) / (f + K1 * (1 - B + B * cd_lens[i] / cd_avgdl)) if f else 0.0
            weights.append({"t": t, "tf": f, "df": cd_df.get(t, 0), "idf": round(cd_idf[t], 4),
                            "bm25": round(bm, 4)})
            score += bm
        cd_scored.append({"id": i, "doc": cd_docs[i], "len": cd_lens[i],
                          "terms": weights, "bm25Score": round(score, 4)})
    cd_rank = [s["id"] for s in sorted(cd_scored, key=lambda s: (-s["bm25Score"], s["id"]))]

    # ── NEW: postings-compression worked example (gaps + variable-byte) ─────────────────────────────
    def varbyte_len(n):  # bytes a non-negative gap takes in variable-byte coding (7 bits/byte)
        if n == 0:
            return 1
        bytes_n = 0
        while n > 0:
            n >>= 7
            bytes_n += 1
        return bytes_n
    docid_list = [3, 8, 12, 30]
    gaps = [docid_list[0]] + [docid_list[i] - docid_list[i - 1] for i in range(1, len(docid_list))]
    raw_bytes = [4 for _ in docid_list]               # naive 32-bit docIDs
    vb_bytes = [varbyte_len(g) for g in gaps]         # gaps are tiny → 1 byte each here

    # ── NEW: PageRank toy graph (power iteration to convergence) ────────────────────────────────────
    pr_nodes = ["A", "B", "C"]
    pr_edges = [["A", "B"], ["B", "C"], ["C", "A"], ["C", "B"]]   # A→B, B→C, C→A, C→B
    pr_out = {n: [] for n in pr_nodes}
    for s, t in pr_edges:
        pr_out[s].append(t)
    d_damp = 0.85
    nn = len(pr_nodes)
    idx = {n: k for k, n in enumerate(pr_nodes)}
    # column-stochastic transition matrix M[i][j] = P(j → i)
    M = [[0.0] * nn for _ in range(nn)]
    for j in pr_nodes:
        outs = pr_out[j]
        if outs:
            for i in outs:
                M[idx[i]][idx[j]] += 1.0 / len(outs)
        else:  # dangling: spread evenly
            for i in pr_nodes:
                M[idx[i]][idx[j]] += 1.0 / nn
    pr = [1.0 / nn] * nn
    iters = [[round(x, 6) for x in pr]]
    for _ in range(200):
        new = [(1 - d_damp) / nn + d_damp * sum(M[i][j] * pr[j] for j in range(nn)) for i in range(nn)]
        iters.append([round(x, 6) for x in new])
        if max(abs(new[i] - pr[i]) for i in range(nn)) < 1e-6:
            pr = new
            break
        pr = new
    pr_final = {pr_nodes[i]: round(pr[i], 6) for i in range(nn)}

    # ── NEW: published benchmark constants (CITED — not synthesized in this repo) ────────────────────
    benchmarks = {
        "_doc": "CITED published baselines — NOT computed in this repo. Use verbatim with the source string.",
        "_source": prov + " (constants quoted from the cited papers below)",
        "cited": True,
        "msmarco": {
            "metric": "MRR@10", "split": "MS MARCO passage dev",
            "BM25": 0.187, "denseDPR": 0.330, "ColBERT": 0.360,
            "source": "Nguyen et al. 2016 (MS MARCO); BM25 baseline ≈0.187 MRR@10 (official Anserini/pyserini); DPR Karpukhin et al. 2020; ColBERT Khattab & Zaharia 2020"
        },
        "beir": {
            "metric": "nDCG@10", "split": "BEIR avg (18 datasets, zero-shot)",
            "BM25": 0.43, "denseDPR": 0.38, "ColBERTv2": 0.50,
            "source": "Thakur et al. 2021 (BEIR): BM25 avg nDCG@10 ≈0.43, a strong zero-shot baseline that many dense models fail to beat"
        }
    }

    # ── NEW: Bag-of-Words + TF-IDF live examples (BoW matrix, car/truck table, keyword extraction) ───
    # (a) tiny document-term count matrix for a BoW slide
    bow_sentences = ["the cat sat on the mat", "the dog sat on the log", "cats and dogs play"]
    bow_vocab = sorted({w for s in bow_sentences for w in s.split()})
    bow_matrix = [[s.split().count(w) for w in bow_vocab] for s in bow_sentences]
    # (b) car/truck TF-IDF table with idf = log(2/df) (natural log, 2 docs)
    ct_docs = {"A": "The car is driven on the road", "B": "The truck is driven on the highway"}
    ct_tokens = {i: t.lower().split() for i, t in ct_docs.items()}
    ct_N = len(ct_docs)
    ct_vocab = sorted({w for toks in ct_tokens.values() for w in toks})
    ct_df = {w: sum(1 for toks in ct_tokens.values() if w in toks) for w in ct_vocab}
    ct_idf = {w: math.log(ct_N / ct_df[w]) for w in ct_vocab}      # log(2/df): df=2 → 0, df=1 → log 2
    ct_rows = []
    for w in ct_vocab:
        row = {"term": w, "df": ct_df[w], "idf": round(ct_idf[w], 4)}
        for i in ct_docs:
            toks = ct_tokens[i]
            tf_norm = toks.count(w) / len(toks)
            row[f"tf_{i}"] = round(tf_norm, 4)
            row[f"tfidf_{i}"] = round(tf_norm * ct_idf[w], 4)
        ct_rows.append(row)
    # (c) keyword extraction: top TF-IDF terms of one corpus doc (D2) over the 8-doc vocab
    kw_doc = "D2"
    kw_tokens = next(d["tokens"] for d in docs if d["id"] == kw_doc)
    kw_scores = {}
    for t in set(kw_tokens):
        kw_scores[t] = kw_tokens.count(t) * idf_all[t]
    kw_top = sorted(kw_scores.items(), key=lambda kv: (-kv[1], kv[0]))[:8]
    kw_terms = [{"term": t, "tf": kw_tokens.count(t), "df": df[t],
                 "idf": round(idf_all[t], 4), "tfidf": round(s, 4)} for t, s in kw_top]

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

    # ── NEW FILES ───────────────────────────────────────────────────────────────────────────────────
    (DATA / "l3-bm25-q2.json").write_text(json.dumps({
        "_doc": "Second BM25 query on the 8-doc 20NG corpus with DISTINCT-df terms (nasa df=3, shuttle "
                "df=2) so the rarer term 'shuttle' carries the heavier idf — 'rare term dominates' fires. "
                "Same k1=1.5, b=0.75, avgdl as l3-bm25.json.",
        "_source": prov, "N": N, "avgdl": round(avgdl, 3), "k1": K1, "b": B, "query": QUERY2,
        "idf": {t: round(idf2[t], 4) for t in QUERY2},
        "docs": scored2, "bm25Ranking": bm25_rank2, "tfidfRanking": tfidf_rank2,
    }, indent=2, ensure_ascii=False) + "\n")

    (DATA / "l3-bm25-catdog.json").write_text(json.dumps({
        "_doc": "Flagship BM25 mini-collection (computed in Python, NOT hardcoded). "
                "D1='cat cat dog', D2='cat dog dog mouse', D3='mouse cat'; query={cat,dog}; k1=1.5, b=0.75. "
                "BM25 smoothed idf = ln((N-df+0.5)/(df+0.5)+1). Expected ranking D2 > D1 > D3.",
        "_source": prov + " · self-contained toy collection",
        "docsText": cd_docs, "query": cd_query, "k1": K1, "b": B,
        "N": cd_N, "avgdl": round(cd_avgdl, 4),
        "df": {t: cd_df.get(t, 0) for t in cd_query},
        "idf": {t: round(cd_idf[t], 4) for t in cd_query},
        "docs": cd_scored, "ranking": cd_rank,
    }, indent=2, ensure_ascii=False) + "\n")

    (DATA / "l3-compression.json").write_text(json.dumps({
        "_doc": "Postings-compression worked example: a sorted docID list, its gaps (delta), and "
                "variable-byte (7 data bits/byte) byte counts vs naive 32-bit ints.",
        "_source": prov + " · self-contained worked example",
        "docIds": docid_list, "gaps": gaps,
        "rawBytesPerId": raw_bytes, "rawBytesTotal": sum(raw_bytes),
        "varbyteBytesPerGap": vb_bytes, "varbyteBytesTotal": sum(vb_bytes),
        "compressionRatio": round(sum(raw_bytes) / sum(vb_bytes), 3),
        "note": "gaps are small → 1 varbyte each (<128); 16 bytes naive → 4 bytes gap+varbyte (4×).",
    }, indent=2, ensure_ascii=False) + "\n")

    (DATA / "l3-pagerank.json").write_text(json.dumps({
        "_doc": "PageRank toy graph, power iteration to convergence (tol 1e-6). Links A→B, B→C, C→A, "
                "C→B; damping d=0.85. M is column-stochastic (M[i][j]=P(j→i)). For THIS edge set B is "
                "the authority (2 in-links: A,C) → computed final ≈ {A:0.215, B:0.397, C:0.388}. "
                "(The plan's hint [0.194,0.350,0.457] is for a different edge set; this is the exact "
                "power-iteration result for the edges specified here.)",
        "_source": prov + " · self-contained toy graph",
        "nodes": pr_nodes, "edges": pr_edges, "damping": d_damp,
        "outDegree": {n: len(pr_out[n]) for n in pr_nodes},
        "transitionMatrix": [[round(M[i][j], 4) for j in range(nn)] for i in range(nn)],
        "matrixLegend": "rows/cols ordered as nodes; M[i][j] = prob of moving j→i",
        "iterations": iters, "numIterations": len(iters) - 1, "final": pr_final,
        "finalVector": [pr_final[n] for n in pr_nodes],
    }, indent=2, ensure_ascii=False) + "\n")

    (DATA / "l3-benchmarks.json").write_text(json.dumps(benchmarks, indent=2, ensure_ascii=False) + "\n")

    (DATA / "l3-tfidf-examples.json").write_text(json.dumps({
        "_doc": "Bag-of-Words & TF-IDF live examples for L3: (a) BoW document-term count matrix; "
                "(b) car/truck TF-IDF table with idf=log(2/df) (common words → idf 0, vanish); "
                "(c) keyword extraction = top TF-IDF terms of corpus doc D2.",
        "_source": prov + " · (a)+(b) self-contained; (c) over the 8-doc 20NG vocab",
        "bow": {"sentences": bow_sentences, "vocab": bow_vocab, "matrix": bow_matrix},
        "carTruck": {"docs": ct_docs, "N": ct_N, "idfFormula": "log(2/df)", "rows": ct_rows,
                     "note": "the, is, driven, on appear in both → df=2 → idf=0 → contribute nothing; "
                             "only car/road (A) and truck/highway (B) score."},
        "keywords": {"doc": kw_doc, "snippet": next(d["snippet"] for d in docs if d["id"] == kw_doc),
                     "top": kw_terms, "idfFormula": "ln((N-df+0.5)/(df+0.5)+1), N=8"},
    }, indent=2, ensure_ascii=False) + "\n")

    print(f"[gen_l3] N={N} avgdl={avgdl:.2f} query={query}")
    print(f"[gen_l3] BM25 ranking: {bm25_rank}")
    print(f"[gen_l3] cosine ranking: {cosine_rank}")
    print(f"[gen_l3] RRF fused: {[f['id'] for f in fused]}")
    print(f"[gen_l3] q2={QUERY2} idf={ {t: round(idf2[t],4) for t in QUERY2} } BM25 ranking: {bm25_rank2}")
    print(f"[gen_l3] cat/dog/mouse idf={ {t: round(cd_idf[t],4) for t in cd_query} } scores="
          f"{ {s['id']: s['bm25Score'] for s in cd_scored} } ranking={cd_rank}")
    print(f"[gen_l3] PageRank final={pr_final} ({len(iters)-1} iters)")
    print("[gen_l3] wrote l3-index/bm25/rrf + l3-bm25-q2/-catdog/-compression/-pagerank/-benchmarks/-tfidf-examples")

if __name__ == "__main__":
    main()
