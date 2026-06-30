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
from genlib import write_json
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

    # ── NEW (от-и-до): fully-substituted intermediate steps for the cat/dog flagship ────────────────
    # Surfaces EVERY middle value the "step-by-step" slides display: avgdl derivation, substituted idf
    # pieces, and per-(term,doc) B-factor sub-parts (lenRatio→bracket→denom→numer→B) + B·idf + doc sum.
    cd_avgdl_steps = {
        "lengths": [cd_lens["D1"], cd_lens["D2"], cd_lens["D3"]],
        "sum": sum(cd_lens.values()),
        "count": cd_N,
        "avgdl": round(cd_avgdl, 4),
    }
    cd_idf_steps = {}
    for t in cd_query:
        dfc = cd_df.get(t, 0)
        numer = cd_N - dfc + 0.5
        denom = dfc + 0.5
        ratio = numer / denom
        ln_arg = 1 + ratio
        val = math.log(ln_arg)
        cd_idf_steps[t] = {
            "df": dfc, "N": cd_N,
            "numer": round(numer, 4), "denom": round(denom, 4),
            "ratio": round(ratio, 4), "lnArg": round(ln_arg, 4),
            "idf": round(val, 4),
            "expr": f"ln(1+({cd_N}-{dfc}+0.5)/({dfc}+0.5))=ln({ln_arg:.4f})={val:.4f}",
        }
    cd_steps_docs = []
    for i in ["D1", "D2", "D3"]:
        toks = cd_tokens[i]
        length = cd_lens[i]
        len_ratio = length / cd_avgdl
        bracket = (1 - B) + B * len_ratio
        term_steps = []
        doc_sum = 0.0
        for t in cd_query:
            f = toks.count(t)
            numer = (K1 + 1) * f
            denom = K1 * bracket + f
            Bfac = (numer / denom) if f else 0.0
            weight = Bfac * cd_idf[t]
            doc_sum += weight
            term_steps.append({
                "t": t, "tf": f,
                "lenRatio": round(len_ratio, 4),
                "bracket": round(bracket, 4),
                "numer": round(numer, 4),
                "denom": round(denom, 4),
                "B": round(Bfac, 4),
                "idf": round(cd_idf[t], 4),
                "weight": round(weight, 4),
                "Bexpr": (f"({K1}+1)·{f} / ({K1}·[(1-{B})+{B}·{length}/{cd_avgdl:.0f}]+{f})"
                          f" = {numer:.1f}/{denom:.4f} = {Bfac:.4f}") if f else "tf=0 → B=0",
            })
        cd_steps_docs.append({
            "id": i, "doc": cd_docs[i], "len": length,
            "lenRatio": round(len_ratio, 4),
            "bracket": round(bracket, 4),
            "terms": term_steps,
            "docSum": round(doc_sum, 4),
            "docSumExpr": " + ".join(f"{ts['weight']:.4f}" for ts in term_steps) + f" = {doc_sum:.4f}",
        })

    # ── NEW (от-и-до): worked intermediate steps for the nasa/shuttle 8-doc query ───────────────────
    # idf pieces for both terms; len of the top docs + corpus avgdl; full B-factor sub-parts for the
    # winning doc D2 (shuttle tf=3, nasa tf=1) with B·idf and the row sum 2.8151.
    q2_idf_steps = {}
    for t in QUERY2:
        dfc = df.get(t, 0)
        numer = N - dfc + 0.5
        denom = dfc + 0.5
        ratio = numer / denom
        ln_arg = 1 + ratio
        val = math.log(ln_arg)
        q2_idf_steps[t] = {
            "df": dfc, "N": N,
            "numer": round(numer, 4), "denom": round(denom, 4),
            "ratio": round(ratio, 4), "lnArg": round(ln_arg, 4),
            "idf": round(val, 4),
            "expr": f"ln(1+({N}-{dfc}+0.5)/({dfc}+0.5))=ln({ln_arg:.4f})={val:.4f}",
        }
    q2_doc_lens = {d["id"]: d["len"] for d in docs}
    # winning doc D2: full B-factor breakdown for shuttle (tf=3) and nasa (tf=1)
    d2 = next(d for d in docs if d["id"] == "D2")
    d2_len = d2["len"]
    d2_len_ratio = d2_len / avgdl
    d2_bracket = (1 - B) + B * d2_len_ratio
    q2_d2_terms = []
    q2_d2_sum = 0.0
    for t in QUERY2:
        f = d2["tokens"].count(t)
        numer = (K1 + 1) * f
        denom = K1 * d2_bracket + f
        Bfac = (numer / denom) if f else 0.0
        weight = Bfac * idf2[t]
        q2_d2_sum += weight
        q2_d2_terms.append({
            "t": t, "tf": f,
            "lenRatio": round(d2_len_ratio, 4),
            "bracket": round(d2_bracket, 4),
            "numer": round(numer, 4),
            "denom": round(denom, 4),
            "B": round(Bfac, 4),
            "idf": round(idf2[t], 4),
            "weight": round(weight, 4),
            "Bexpr": (f"({K1}+1)·{f} / ({K1}·[(1-{B})+{B}·{d2_len}/{avgdl:.3f}]+{f})"
                      f" = {numer:.1f}/{denom:.4f} = {Bfac:.4f}"),
        })

    # per-cell B-factors for every NON-ZERO (doc, term) cell of the displayed table rows (top-3:
    # D2, D3, D0) so the whole table is reproducible by hand. Same B formula; deterministic.
    q2_cells = []
    for did in [r for r in bm25_rank2][:3]:
        d = next(dd for dd in docs if dd["id"] == did)
        d_len = d["len"]
        d_len_ratio = d_len / avgdl
        d_bracket = (1 - B) + B * d_len_ratio
        for t in QUERY2:
            f = d["tokens"].count(t)
            if not f:
                continue
            numer = (K1 + 1) * f
            denom = K1 * d_bracket + f
            Bfac = numer / denom
            weight = Bfac * idf2[t]
            q2_cells.append({
                "doc": did, "t": t, "tf": f, "len": d_len,
                "lenRatio": round(d_len_ratio, 4),
                "bracket": round(d_bracket, 4),
                "numer": round(numer, 4),
                "denom": round(denom, 4),
                "B": round(Bfac, 4),
                "idf": round(idf2[t], 4),
                "weight": round(weight, 4),
                "Bexpr": (f"({K1}+1)·{f} / ({K1}·[(1-{B})+{B}·{d_len}/{avgdl:.3f}]+{f})"
                          f" = {numer:.1f}/{denom:.4f} = {Bfac:.4f}"),
            })

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

    # ── NEW (от-и-до): one fully-applied power-iteration update for node B (iteration 1) ─────────────
    # Start uniform PR0 = 1/3 each. B's in-links are A (outdeg 1) and C (outdeg 2). Show every piece.
    pr0 = 1.0 / nn
    pr_base = (1 - d_damp) / nn                       # (1-d)/n = 0.05
    contrib_A = pr0 / len(pr_out["A"])                # PR0(A)/outdeg(A) = 0.3333/1
    contrib_C = pr0 / len(pr_out["C"])                # PR0(C)/outdeg(C) = 0.3333/2
    contrib_sum = contrib_A + contrib_C
    damped = d_damp * contrib_sum                     # d·(0.3333+0.1667) = 0.425
    pr1_B = pr_base + damped                          # 0.05 + 0.425 = 0.475
    pr_worked_update = {
        "node": "B",
        "iteration": 1,
        "pr0": round(pr0, 4),
        "inLinks": ["A", "C"],
        "outDegrees": {n: len(pr_out[n]) for n in pr_nodes},
        "baseTerm": round(pr_base, 4),
        "baseExpr": f"(1-{d_damp})/{nn} = {pr_base:.4f}",
        "contribFromA": round(contrib_A, 4),
        "contribFromC": round(contrib_C, 4),
        "contribAExpr": f"PR0(A)/outdeg(A) = {pr0:.4f}/{len(pr_out['A'])} = {contrib_A:.4f}",
        "contribCExpr": f"PR0(C)/outdeg(C) = {pr0:.4f}/{len(pr_out['C'])} = {contrib_C:.4f}",
        "contribSum": round(contrib_sum, 4),
        "dampedTerm": round(damped, 4),
        "dampedExpr": f"{d_damp}·({contrib_A:.4f}+{contrib_C:.4f}) = {d_damp}·{contrib_sum:.4f} = {damped:.4f}",
        "pr1": round(pr1_B, 4),
        "pr1Expr": f"{pr_base:.4f} + {damped:.4f} = {pr1_B:.4f}",
        "note": "iterations 2–4 omitted — the same update is repeated until convergence.",
    }

    # ── NEW: published benchmark constants (CITED — not synthesized in this repo) ────────────────────
    benchmarks = {
        "_doc": "CITED published baselines — NOT computed in this repo. Use verbatim with the source string.",
        "_source": prov + " (constants quoted from the cited papers below)",
        "cited": True,
        "msmarco": {
            "metric": "MRR@10", "split": "MS MARCO passage dev",
            "BM25": 0.187, "denseDPR": 0.330, "ColBERT": 0.360,
            "source": "Nguyen et al. 2016 (MS MARCO); BM25 ≈0.187 MRR@10 (official Anserini/pyserini); dense MS MARCO dev MRR@10 ≈0.33 from later DPR-style reproductions (RocketQA, Qu et al. 2021 / pyserini) — the original DPR paper (Karpukhin 2020) does not evaluate MS MARCO; ColBERT Khattab & Zaharia 2020"
        },
        "beir": {
            "metric": "nDCG@10", "split": "BEIR avg (18 datasets, zero-shot)",
            "BM25": 0.43, "denseDPR": 0.23, "ColBERTv2": 0.50,
            "source": "Thakur et al. 2021 (BEIR), avg nDCG@10 over 18 zero-shot datasets: BM25 ≈0.43; original DPR (Karpukhin 2020 NQ checkpoint) only ≈0.23 (−47.7% vs BM25, the worst generalization in the paper); ColBERTv2 (Santhanam et al. 2022) ≈0.50 over its 13 reported BEIR sets"
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

    write_json(DATA / "l3-index.json", {
        "_doc": "Inverted index for L3 climb-index (term → docIDs + df) + a 2-term AND-merge trace.",
        "_source": prov, "N": N, "query": query,
        "docs": [{"id": d["id"], "cat": d["cat"], "snippet": d["snippet"], "len": d["len"]} for d in docs],
        "terms": {t: {"df": df[t], "postings": postings[t]} for t in query},
        "andMerge": {"lists": {t: postings[t] for t in query},
                     "intersection": sorted(set(postings[query[0]]) & set(postings[query[1]]))},
    })

    write_json(DATA / "l3-bm25.json", {
        "_doc": "TF-IDF and BM25 (k1=1.5, b=0.75) per query term per doc for L3 climb-tfidf/climb-bm25.",
        "_source": prov, "N": N, "avgdl": round(avgdl, 3), "k1": K1, "b": B, "query": query,
        "docs": scored, "bm25Ranking": bm25_rank, "tfidfRanking": tfidf_rank,
    })

    write_json(DATA / "l3-rrf.json", {
        "_doc": "Rank fusion for L3 climb-rrf: two rankers (BM25 vs TF-IDF cosine) fused with RRF (k=60).",
        "_source": prov, "k": RRF_K,
        "lists": {"bm25": bm25_rank, "cosine": cosine_rank},
        "fused": fused, "order": [f["id"] for f in fused],
    })

    write_json(DATA / "l3-keywords.json", {
        "_doc": "Live unsupervised keyphrase extraction (slide 37): the top TF-IDF terms of corpus doc D2 over "
                "the 8-doc vocab. idf is the BM25-smoothed form ln(1+(N-df+0.5)/(df+0.5)) (slide 32) so the "
                "weights carry straight into BM25; tfidf = tf * idf. Ranking: shuttle > crew/lost/maybe > better.",
        "_source": prov, "doc": kw_doc, "N": N,
        "terms": kw_terms,
    })

    # ── NEW FILES ───────────────────────────────────────────────────────────────────────────────────
    write_json(DATA / "l3-bm25-q2.json", {
        "_doc": "Second BM25 query on the 8-doc 20NG corpus with DISTINCT-df terms (nasa df=3, shuttle "
                "df=2) so the rarer term 'shuttle' carries the heavier idf — 'rare term dominates' fires. "
                "Same k1=1.5, b=0.75, avgdl as l3-bm25.json.",
        "_source": prov, "N": N, "avgdl": round(avgdl, 3), "k1": K1, "b": B, "query": QUERY2,
        "idf": {t: round(idf2[t], 4) for t in QUERY2},
        "docs": scored2, "bm25Ranking": bm25_rank2, "tfidfRanking": tfidf_rank2,
    })

    write_json(DATA / "l3-bm25-catdog.json", {
        "_doc": "Flagship BM25 mini-collection (computed in Python, NOT hardcoded). "
                "D1='cat cat dog', D2='cat dog dog mouse', D3='mouse cat'; query={cat,dog}; k1=1.5, b=0.75. "
                "BM25 smoothed idf = ln((N-df+0.5)/(df+0.5)+1). Expected ranking D2 > D1 > D3.",
        "_source": prov + " · self-contained toy collection",
        "docsText": cd_docs, "query": cd_query, "k1": K1, "b": B,
        "N": cd_N, "avgdl": round(cd_avgdl, 4),
        "df": {t: cd_df.get(t, 0) for t in cd_query},
        "idf": {t: round(cd_idf[t], 4) for t in cd_query},
        "docs": cd_scored, "ranking": cd_rank,
    })

    write_json(DATA / "l3-compression.json", {
        "_doc": "Postings-compression worked example: a sorted docID list, its gaps (delta), and "
                "variable-byte (7 data bits/byte) byte counts vs naive 32-bit ints.",
        "_source": prov + " · self-contained worked example",
        "docIds": docid_list, "gaps": gaps,
        "rawBytesPerId": raw_bytes, "rawBytesTotal": sum(raw_bytes),
        "varbyteBytesPerGap": vb_bytes, "varbyteBytesTotal": sum(vb_bytes),
        "compressionRatio": round(sum(raw_bytes) / sum(vb_bytes), 3),
        "note": "gaps are small → 1 varbyte each (<128); 16 bytes naive → 4 bytes gap+varbyte (4×).",
        "byteLayout": {"bitsPerByte": 7, "continuationBit": 1, "maxGapPerByte": 127,
                       "note": "1 byte = 1 continuation bit + 7 data bits ⇒ encodes 0–127; "
                               "every gap here ≤18 < 128 → fits in one byte."},
    })

    write_json(DATA / "l3-pagerank.json", {
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
        "workedUpdate": pr_worked_update,
    })

    write_json(DATA / "l3-benchmarks.json", benchmarks)

    # ── NEW FILES (от-и-до intermediate steps) ──────────────────────────────────────────────────────
    write_json(DATA / "l3-bm25-catdog-steps.json", {
        "_doc": "Fully-substituted INTERMEDIATE steps for the cat/dog BM25 flagship (companion to "
                "l3-bm25-catdog.json; same collection, k1=1.5, b=0.75). Surfaces every middle value the "
                "step-by-step slides display: (a) avgdl derivation; (b) substituted idf pieces; (c) per "
                "(term,doc) B-factor sub-parts lenRatio→bracket→numer/denom→B, the final weight B·idf, "
                "and the per-doc sum. B = (k1+1)·f / (k1·[(1-b)+b·len/avgdl] + f).",
        "_source": prov + " · self-contained toy collection — intermediate-step derivation",
        "query": cd_query, "k1": K1, "b": B, "N": cd_N,
        "avgdlSteps": cd_avgdl_steps,
        "idfSteps": cd_idf_steps,
        "docs": cd_steps_docs,
    })

    write_json(DATA / "l3-bm25-q2-steps.json", {
        "_doc": "Fully-substituted INTERMEDIATE steps for the nasa/shuttle 8-doc query (companion to "
                "l3-bm25-q2.json; same corpus, k1=1.5, b=0.75, avgdl as l3-bm25.json). (a) substituted idf "
                "pieces for both terms (N=8); (b) len of the top docs + corpus avgdl; (c) the full "
                "B-factor sub-parts for the WINNING doc D2 (shuttle tf=3, nasa tf=1) with B·idf and the "
                "row sum 2.8151; (d) 'cells' — the same per-cell B-factor breakdown for EVERY non-zero "
                "(doc,term) cell of the displayed top-3 rows (D2, D3, D0) so the whole table reproduces by "
                "hand. B = (k1+1)·f / (k1·[(1-b)+b·len/avgdl] + f).",
        "_source": prov + " · intermediate-step derivation",
        "query": QUERY2, "k1": K1, "b": B, "N": N, "avgdl": round(avgdl, 3),
        "idfSteps": q2_idf_steps,
        "docLens": q2_doc_lens,
        "winningDoc": {
            "id": "D2", "len": d2_len,
            "lenRatio": round(d2_len_ratio, 4), "bracket": round(d2_bracket, 4),
            "terms": q2_d2_terms,
            "rowSum": round(q2_d2_sum, 4),
            "rowSumExpr": " + ".join(f"{ts['weight']:.4f}" for ts in q2_d2_terms) + f" = {q2_d2_sum:.4f}",
        },
        "cells": q2_cells,
    })

    print(f"[gen_l3] N={N} avgdl={avgdl:.2f} query={query}")
    print(f"[gen_l3] BM25 ranking: {bm25_rank}")
    print(f"[gen_l3] cosine ranking: {cosine_rank}")
    print(f"[gen_l3] RRF fused: {[f['id'] for f in fused]}")
    print(f"[gen_l3] q2={QUERY2} idf={ {t: round(idf2[t],4) for t in QUERY2} } BM25 ranking: {bm25_rank2}")
    print(f"[gen_l3] cat/dog/mouse idf={ {t: round(cd_idf[t],4) for t in cd_query} } scores="
          f"{ {s['id']: s['bm25Score'] for s in cd_scored} } ranking={cd_rank}")
    print(f"[gen_l3] PageRank final={pr_final} ({len(iters)-1} iters) workedUpdate PR1(B)={pr_worked_update['pr1']}")
    print(f"[gen_l3] cat/dog steps: D1 sum={cd_steps_docs[0]['docSum']} (B·idf weights per doc emitted)")
    print(f"[gen_l3] nasa/shuttle steps: D2 rowSum={round(q2_d2_sum,4)} (shuttle/nasa B-factors emitted)")
    print("[gen_l3] wrote l3-index/bm25/rrf + l3-bm25-q2/-catdog/-compression/-pagerank/-benchmarks")
    print("[gen_l3] wrote NEW steps: l3-bm25-catdog-steps, l3-bm25-q2-steps")

if __name__ == "__main__":
    main()
