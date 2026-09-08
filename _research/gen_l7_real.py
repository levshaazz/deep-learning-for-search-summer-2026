#!/usr/bin/env python3
"""gen_l7_real.py — REAL bi-encoder / cross-encoder numbers for L7 "Scouts and Judges".

Turns the toy worked examples (gen_l7.py) into REAL ones with small HuggingFace models, the exact
gen_l6_contextual.py precedent: torch/transformers imported LAZILY (inside functions), run on
/usr/bin/python3 (it has torch+transformers), deterministic (model.eval() + torch.no_grad() +
torch.manual_seed(0)), weights fetched once and cached to a gitignored HF_HOME. The frozen JSON it
writes is a COMMITTED artifact, EXCLUDED from the byte-identity proof: reproduce.sh runs it under the
light vendored toolchain where torch is absent, so it fails-soft and does NOT mutate data/ → H3 holds
(only a "proof incomplete" warning, exactly like gen_l6_contextual). It is NOT in requirements-repro.txt.

It READ-MERGES (splices) its "real"/"contrast"/quality/latency/rerankDepth blocks into the EXISTING
toy JSON (gen_l7.py wrote the "toy" blocks first; reproduce.sh runs gen_l7 BEFORE gen_l7_real
alphabetically), preserving those toy blocks. Models:
  • bi-encoder   : sentence-transformers/all-MiniLM-L6-v2  (mean-pool + L2-normalise → cosine)
  • cross-encoder: cross-encoder/ms-marco-MiniLM-L-6-v2     (one relevance logit → sigmoid)

Four parts → four frozen artifacts:
  1. real bi-encoder cosines on the river-bank pair      → data/l7-biencoder.json   "real"
  2. real cross-encoder negation BAM + the contrast      → data/l7-crossencoder.json "real"+"contrast"
  3. real cross-encoder rerank of the L4 8-doc set        → data/l7-cascade.json      quality+latency
  4. real open-corpus retrieve→rerank subset (ERB, MIT)    → data/l7-real.json      (+ cascade rerankDepth)

Часть 4 пишет l7-real.json, а НЕ l7-rag.json: последний занят игрушечным списком стадий
виджета rag-pipeline из gen_l7.py. Один раз (07.09.2026) сюда было записано именно это имя —
виджет остался без данных, и книжная глава 10 поехала NaN-ами.

Run:  /usr/bin/python3 _research/gen_l7_real.py
"""
from __future__ import annotations
import json, math, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / "_research" / "data" / ".cache"
os.environ.setdefault("HF_HOME", str(CACHE / "hf"))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")

BI_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
CE_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
SEED = 0

# ── open-corpus subset knobs (fixed → auditable / reproducible) ─────────────────
# ПОЧЕМУ НЕ MS MARCO. Официальные условия датасета: «intended for non-commercial research
# purposes only». Показывать полученные ЧИСЛА на платном слайде можно (факты не охраняются),
# а вот сам прогон по датасету в коммерческом продукте под это ограничение попадает — и
# юридический разбор release/legal-review.md (пункт 8) предлагал снять вопрос целиком,
# пересчитав блок на открытом корпусе. Решение владельца 2026-09-07: пересчитать.
# EnterpriseRAG-Bench лежит под MIT и уже используется в Лабе 3 и Домашке 3, то есть студент
# всё равно с ним работает — курс не тащит ради одного слайда лишний датасет.
# REVISION пинуется намеренно: H3 требует байт-идентичного повтора, а датасет на Hub может
# быть обновлён — без пина «воспроизводимость» держалась бы на том, что никто не тронул Hub.
ERB_DATASET  = "onyx-dot-app/EnterpriseRAG-Bench"
ERB_REVISION = "main"     # пин снапшота; менять — только вместе с пересчётом чисел
ERB_SLICE    = "confluence"  # один source_type: однородный срез и первый в потоке
ERB_POOL     = 5000       # документов в срезе; столько же берёт Лаба 3 курса на этом же корпусе
                          # (в срезе confluence их 5189 — замерено 07.09 на прогоне)
MS_EVAL      = 40         # eval-вопросов: первые по question_id, ровно с одним gold-документом
MS_RERANK_DEPTH = 100     # практическая глубина переранжирования каскада (кросс-энкодер по top-100)
MS_DEPTHS = [10, 100, 1000]   # шкала глубины (переранжировать top-k, пересчитать nDCG@10)


def r(x, n=4):
    return round(float(x), n)


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


# ── lazy model loaders (parse without torch; only fail when actually RUN sans-torch) ──────────
def _torch():
    import torch
    torch.set_num_threads(1)
    torch.manual_seed(SEED)
    return torch


def load_bi():
    torch = _torch()
    from transformers import AutoTokenizer, AutoModel
    tok = AutoTokenizer.from_pretrained(BI_MODEL)
    try:
        model = AutoModel.from_pretrained(BI_MODEL, use_safetensors=False, low_cpu_mem_usage=False)
    except Exception:
        model = AutoModel.from_pretrained(BI_MODEL)
    model.eval()
    return tok, model


def load_ce():
    torch = _torch()
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    tok = AutoTokenizer.from_pretrained(CE_MODEL)
    # load the .bin fully into RAM (use_safetensors=False): mmap'd safetensors SIGBUS in the
    # cross-encoder forward on this torch/macOS build; a full RAM load is deterministic + stable.
    try:
        model = AutoModelForSequenceClassification.from_pretrained(CE_MODEL, use_safetensors=False, low_cpu_mem_usage=False)
    except Exception:
        model = AutoModelForSequenceClassification.from_pretrained(CE_MODEL)
    model.eval()
    return tok, model


def _device():
    """cuda, если она есть, иначе cpu.

    Генератор писался под локальный прогон в reproduce.sh (macOS, без ускорителя), поэтому
    переноса на GPU в нём не было вовсе — и запуск на T4 честно считал ВСЁ на процессоре:
    два часа на то, что видеокарта делает за минуты. Числа от устройства не зависят (eval()
    + no_grad() + фиксированный порядок), меняется только время, поэтому H3 это не трогает:
    локальный CPU-повтор даст тот же файл.
    """
    torch = _torch()
    return "cuda" if torch.cuda.is_available() else "cpu"


def embed(tok, model, texts, batch=64):
    """SBERT-style: mean-pool last_hidden_state over the attention mask, then L2-normalise."""
    torch = _torch()
    dev = _device()
    model = model.to(dev)
    out = []
    for i in range(0, len(texts), batch):
        chunk = texts[i:i + batch]
        enc = tok(chunk, padding=True, truncation=True, max_length=256, return_tensors="pt")
        enc = {k: v.to(dev) for k, v in enc.items()}
        with torch.no_grad():
            h = model(**enc).last_hidden_state            # (B, T, D)
        mask = enc["attention_mask"].unsqueeze(-1).float()
        summed = (h * mask).sum(1)
        cnt = mask.sum(1).clamp(min=1e-9)
        v = summed / cnt
        v = torch.nn.functional.normalize(v, p=2, dim=1)
        out.append(v.cpu())
    return torch.cat(out, 0)


def ce_logits(tok, model, pairs, batch=64):
    """One relevance logit per (query, doc) pair."""
    torch = _torch()
    dev = _device()
    model = model.to(dev)
    out = []
    for i in range(0, len(pairs), batch):
        chunk = pairs[i:i + batch]
        enc = tok([q for q, _ in chunk], [d for _, d in chunk],
                  padding=True, truncation=True, max_length=256, return_tensors="pt")
        enc = {k: v.to(dev) for k, v in enc.items()}
        with torch.no_grad():
            logits = model(**enc).logits.reshape(-1)
        out.extend(float(x) for x in logits)
    return out


def splice(path, **blocks):
    """Read the existing (toy) JSON, set ONLY the given top-level blocks, rewrite — matching
    genlib.write_json's serialisation (indent=2, ensure_ascii=False, one trailing newline) so the
    whole file stays byte-consistent. Never touches the frozen 'toy'/'stages' blocks."""
    obj = json.loads(path.read_text())
    for k, v in blocks.items():
        obj[k] = v
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


# ═══════════════════════ PART 1 · real bi-encoder cosines ═══════════════════════
def part1_biencoder():
    tok, model = load_bi()
    query = "river bank"
    docRel = "a beaver by the river bank"
    docIrr = "the bank approved my loan"
    E = embed(tok, model, [query, docRel, docIrr])
    cosRel = float((E[0] * E[1]).sum())
    cosIrr = float((E[0] * E[2]).sum())
    real = {
        "model": BI_MODEL, "dim": int(E.shape[1]), "pooling": "mean", "normalized": True,
        "pair": {"query": query, "docRel": docRel, "docIrr": docIrr},
        "cosRel": r(cosRel), "cosIrr": r(cosIrr),
        "note": "mean-pooled, L2-normalized; eval()+no_grad()+manual_seed(0); computed once, committed frozen",
    }
    splice(DATA / "l7-biencoder.json", real=real)
    print(f"[l7-real] bi  cosRel={real['cosRel']}  cosIrr={real['cosIrr']}")
    return real


# ═══════════════════════ PART 2 · real cross-encoder vs bi-encoder (the lexical-overlap distractor) ══════════
# NOTE: the toy block (gen_l7.py) teaches the head arithmetic with a CONSTRUCTED negation (the Judge
# CAN penalise term interactions). The REAL ms-marco-MiniLM reranker scores TOPICAL relevance, so it
# does not flip on a bare "not" (verified at build time across 13 pairs: it rates a negation doc ~1.0,
# same as the true answer). The cross-encoder's genuine, data-backed edge is rejecting a KEYWORD-SHARING
# DISTRACTOR that does not answer — which the bi-encoder over-rates. That is what we freeze here.
def part2_crossencoder():
    tokc, ce = load_ce()
    tokb, bi = load_bi()
    query = "what is the capital of australia"
    docRel = "Canberra is the capital of Australia"
    docBad = "Australia is a large country with many cities"   # shares 'Australia', does NOT answer
    lr, lb = ce_logits(tokc, ce, [(query, docRel), (query, docBad)])
    scoreRel, scoreBad = sigmoid(lr), sigmoid(lb)
    Eb = embed(tokb, bi, [query, docRel, docBad])
    biCosRel = float((Eb[0] * Eb[1]).sum())
    biCosBad = float((Eb[0] * Eb[2]).sum())
    real = {
        "model": CE_MODEL, "query": query,
        "pairRel": {"doc": docRel, "logit": r(lr), "score": r(scoreRel)},
        "pairBad": {"doc": docBad, "logit": r(lb), "score": r(scoreBad)},
        "note": "sigmoid of the single relevance logit; eval()+no_grad()+manual_seed(0); committed frozen. "
                "The toy block teaches the head arithmetic with a constructed negation; this REAL pair shows "
                "the cross-encoder's actual edge — rejecting a keyword-sharing distractor that does not answer.",
    }
    contrast = {
        "query": query, "docRel": docRel, "docBad": docBad,
        "biCosRel": r(biCosRel), "biCosBad": r(biCosBad),            # Scout: narrow gap → nearly fooled
        "crossScoreRel": r(scoreRel), "crossScoreBad": r(scoreBad),  # Judge: huge gap → rejects distractor
        "note": "the distractor shares the keyword 'Australia' but does not answer. The bi-encoder (Scout) "
                "rates it close to the true answer (narrow gap); the cross-encoder (Judge), reading query+doc "
                "together, rejects it (huge gap). biCosBad > crossScoreBad, and the Judge's gap >> the Scout's "
                "gap: joint reading discriminates where separate encoding blurs.",
    }
    splice(DATA / "l7-crossencoder.json", real=real, contrast=contrast)
    print(f"[l7-real] cross  scoreRel={real['pairRel']['score']}  scoreBad={real['pairBad']['score']}  "
          f"biCosRel={contrast['biCosRel']}  biCosBad={contrast['biCosBad']}")
    return real, contrast


# ═══════════════════════ PART 3 · real cross-encoder rerank of the L4 8-doc set ═══════════════════════
def _ndcg_binary(order_rels, k=None):
    """nDCG with binary relevance: gains = order_rels (0/1) in ranked order; ideal = all 1s first."""
    rels = order_rels if k is None else order_rels[:k]
    dcg = sum(rel / math.log2(i + 2) for i, rel in enumerate(rels))
    ideal = sorted(order_rels, reverse=True)
    if k is not None:
        ideal = ideal[:k]
    idcg = sum(rel / math.log2(i + 2) for i, rel in enumerate(ideal))
    return dcg / idcg if idcg else 0.0


def part3_cascade_l4():
    l4 = json.loads((DATA / "l4-metrics.json").read_text())
    docs = l4["ranked"]                       # 8 docs: id, cat, rel (0/1), rank (BM25), snippet
    query = "space"                           # the L4 query intent
    tokc, ce = load_ce()
    logits = ce_logits(tokc, ce, [(query, d["snippet"]) for d in docs])
    scored = sorted(zip(docs, logits), key=lambda x: -x[1])
    rerankedOrder = [d["id"] for d, _ in scored]
    rerankedNdcg = _ndcg_binary([d["rel"] for d, _ in scored])
    bm25 = json.loads((DATA / "l4-metrics.json").read_text())["ndcg"]
    quality = {
        "set": "L4 8-doc 20NG sci.space (data/l4-metrics.json)",
        "query": query,
        "bm25Ndcg": bm25,                      # 0.6766 (binary-relevance nDCG, the L4 BM25 order)
        "idealNdcg": 1.0,
        "rerankedOrder": rerankedOrder,
        "rerankedNdcg": r(rerankedNdcg),
    }
    # latency — CITED representative magnitudes (hardware-dependent, never CI-measured).
    # ONE coherent regime: the cascade reranks at depth 100 (= MS_RERANK_DEPTH, the depth the frozen
    # MS MARCO MRR 0.6732 is measured at), GPU-BATCHED — 100 pairs ≈ 120 ms at batch ≈32, NOT
    # 100 × 12 ms; 12 ms/pair is the one-pair sequential CPU figure (sequential CPU top-100 ≈ 1.2 s).
    latency = {
        "cited": True,
        "queryEncodeMs": 8, "annSearchMs": 5,
        "rerankDepth": 100, "rerankBatch": 32,
        "crossPerPairMs": 12, "rerankMs": 120, "totalMs": 133,
        "source": "representative all-MiniLM-L6-v2 / ms-marco-MiniLM-L-6-v2 latencies. rerankMs prices "
                  "the cascade's depth-100 rerank GPU-batched (batch ≈32): 100 pairs ≈ 120 ms — NOT "
                  "100 × crossPerPairMs; crossPerPairMs=12 is the one-pair sequential CPU figure (a "
                  "sequential CPU top-100 would be ~1.2 s). Hardware-dependent — cited, not CI-measured",
    }
    splice(DATA / "l7-cascade.json", quality=quality, latency=latency)
    print(f"[l7-real] cascade  bm25Ndcg={bm25} → rerankedNdcg={quality['rerankedNdcg']}  order={rerankedOrder}")
    return quality


# ═══════════════════════ PART 4 · real MS MARCO passage retrieve → rerank subset ═══════════════════════
def part4_msmarco():
    """Реальный retrieve→rerank на ОТКРЫТОМ корпусе (EnterpriseRAG-Bench, MIT).

    Устройство повторяет прежний сабсет один в один, чтобы числа остались сопоставимы по
    смыслу: у каждого eval-вопроса РОВНО ОДИН золотой документ (в MS MARCO это был
    единственный is_selected пассаж, здесь — вопрос с одним expected_doc_id), корпус
    фиксирован и содержит все золотые документы, ранги считаются по одному релевантному.
    """
    from datasets import load_dataset
    qs = load_dataset(ERB_DATASET, "questions", split="test", revision=ERB_REVISION)
    # eval-вопросы: первые MS_EVAL по question_id среди тех, у кого ровно один gold-документ.
    single = [i for i in sorted(range(len(qs)), key=lambda i: str(qs[i]["question_id"]))
              if len(qs[i]["expected_doc_ids"]) == 1]
    # Корпус: первые ERB_POOL документов ОДНОГО source_type из потока. Документы в потоке
    # сгруппированы по типу, поэтому один короткий проход даёт однородный срез — материализовать
    # все ~500К длинных документов (гигабайты) не нужно и незачем.
    stream = load_dataset(ERB_DATASET, "documents", split="test",
                          revision=ERB_REVISION, streaming=True)
    docs = []
    for d in stream:
        if d["source_type"] == ERB_SLICE:
            docs.append(d)
            if len(docs) >= ERB_POOL:
                break
    if len(docs) < ERB_POOL:
        raise SystemExit(f"[l7-real] в срезе '{ERB_SLICE}' только {len(docs)} документов, "
                         f"нужно {ERB_POOL} — поменяй ERB_SLICE/ERB_POOL осознанно")
    def text_of(d):
        return ((d.get("title") or "").strip() + "\n" + (d.get("content") or "").strip()).strip()
    corpus = [text_of(d) for d in docs]
    # Кросс-энкодеру документ подаётся УСЕЧЁННЫМ, и это не экономия, а верное моделирование.
    # В прежнем сабсете реранкер читал пассаж MS MARCO — 60–80 токенов на пару. Здесь документ
    # длинный, и каждая пара упирается в потолок 512 токенов: тех же 40×1000 пар считаются
    # в 6–8 раз дольше (первый заход на T4 не уложился в два часа). В проде реранкер тоже
    # видит не весь документ, а его начало или чанк — окно модели просто не вмещает большего,
    # и хвост, который она всё равно обрежет, платить за себя не должен.
    CE_CHARS = 1200
    corpus_for_ce = [t[:CE_CHARS] for t in corpus]
    doc_index = {d["doc_id"]: n for n, d in enumerate(docs)}
    # eval-вопросы: те, чей единственный золотой документ ЛЕЖИТ в этом срезе. Иначе gold просто
    # отсутствует в индексе, и recall меряет не качество модели, а дырку в корпусе — ошибка,
    # которую в готовых числах уже не разглядеть.
    eval_rows = [i for i in single if qs[i]["expected_doc_ids"][0] in doc_index][:MS_EVAL]
    if len(eval_rows) < MS_EVAL:
        raise SystemExit(f"[l7-real] в срезе '{ERB_SLICE}' нашлось только {len(eval_rows)} вопросов "
                         f"с одним золотым документом, нужно {MS_EVAL}")
    relIndexForRow = {i: doc_index[qs[i]["expected_doc_ids"][0]] for i in eval_rows}
    qids = [str(qs[i]["question_id"]) for i in eval_rows]
    ds = qs                                   # ниже используется как источник текста запроса
    print(f"[l7-real] {ERB_DATASET}: corpus={len(corpus)} '{ERB_SLICE}' docs, "
          f"eval={len(eval_rows)} queries (каждый с одним золотым документом внутри среза)")

    tokb, bi = load_bi()
    print(f"[l7-real] кодирую корпус: {len(corpus)} документов…", flush=True)
    Ecorp = embed(tokb, bi, corpus)                                  # (N, D) L2-normalized
    Equery = embed(tokb, bi, [ds[ri]["question"] for ri in eval_rows])  # (Q, D)
    torch = _torch()
    sims = Equery @ Ecorp.T                                          # (Q, N) cosine (both normalized)
    ranks_ret = []                                                   # retrieve rank of the relevant passage (1-indexed)
    topk_ret = []                                                    # top-1000 corpus indices per query
    for qi, ri in enumerate(eval_rows):
        order = torch.argsort(sims[qi], descending=True).tolist()
        rel = relIndexForRow[ri]
        ranks_ret.append(order.index(rel) + 1)
        topk_ret.append(order[:max(MS_DEPTHS)])

    def recall_at(k):
        return r(sum(1 for rk in ranks_ret if rk <= k) / len(ranks_ret))

    def mrr_at(ranks, k=10):
        return r(sum((1.0 / rk) if rk <= k else 0.0 for rk in ranks) / len(ranks))

    retrieve = {
        "model": BI_MODEL,
        "recallAt": {"10": recall_at(10), "100": recall_at(100), "1000": recall_at(1000)},
        "mrrAt10": mrr_at(ranks_ret, 10),
    }

    # cross-encoder rerank: score the top-max(depths) retrieved once per query, derive every depth.
    tokc, ce = load_ce()
    rerank_ranks_at = {k: [] for k in MS_DEPTHS}                     # per depth: relevant's rank after rerank
    rerank_ndcg_at = {}
    example = None
    for qi, ri in enumerate(eval_rows):
        cand = topk_ret[qi]                                          # corpus indices, retrieve order
        rel = relIndexForRow[ri]
        q = ds[ri]["question"]
        logits = ce_logits(tokc, ce, [(q, corpus_for_ce[c]) for c in cand])
        if (qi + 1) % 10 == 0 or qi == 0:
            print(f"[l7-real]   реранк: запрос {qi + 1}/{len(eval_rows)}", flush=True)
        order = [cand[j] for j in sorted(range(len(cand)), key=lambda j: -logits[j])]
        for k in MS_DEPTHS:
            kk = min(k, len(cand))
            # rerank only the top-k RETRIEVED candidates (depth = the retrieve cutoff the Judges see):
            sub_cand = cand[:kk]
            sub_logits = logits[:kk]
            sub_order = [sub_cand[j] for j in sorted(range(len(sub_cand)), key=lambda j: -sub_logits[j])]
            rk = (sub_order.index(rel) + 1) if rel in sub_order else 10 ** 9
            rerank_ranks_at[k].append(rk)
        if example is None:
            # example pair: the TOP-1 retrieved passage for this query (real bi-cos + real cross-score).
            top_c = cand[0]
            example = {
                "qid": str(ds[ri]["question_id"]), "query": q,
                "topPassage": corpus[top_c][:240],
                "biCos": r(float(sims[qi][top_c])),
                "crossScore": r(sigmoid(logits[0])),
            }
    for k in MS_DEPTHS:
        # nDCG@10 over the reranked order (single binary relevant → 1/log2(rank+1) if rank≤10 else 0).
        ndcgs = [(1.0 / math.log2(rk + 1)) if rk <= 10 else 0.0 for rk in rerank_ranks_at[k]]
        rerank_ndcg_at[k] = r(sum(ndcgs) / len(ndcgs))
    rerank = {
        "model": CE_MODEL, "rerankDepth": MS_RERANK_DEPTH,
        "mrrAt10": mrr_at(rerank_ranks_at[MS_RERANK_DEPTH], 10),
        "ndcgAt10": rerank_ndcg_at[MS_RERANK_DEPTH],
    }

    msmarco = {
        "_doc": "Live EnterpriseRAG-Bench subset (frozen). REAL bi-encoder retrieval + cross-encoder "
                "rerank over a fixed, auditable corpus. Shows the cascade lift: rerank.mrrAt10 > "
                "retrieve.mrrAt10, and recall climbs with retrieval depth (the floor the whole "
                "pipeline is capped by). Corpus is MIT-licensed — see release/legal-review.md item 8.",
        "_source": f"_research/gen_l7_real.py · {ERB_DATASET} @{ERB_REVISION} "
                   f"(questions sorted by question_id, first {MS_EVAL} with exactly one gold doc → eval; "
                   f"corpus = all gold docs + first {ERB_POOL} '{ERB_SLICE}' docs from the stream) "
                   f"· SBERT {BI_MODEL} + cross-encoder {CE_MODEL}",
        "subset": {
            "dataset": f"{ERB_DATASET} @{ERB_REVISION}", "nQueries": len(eval_rows),
            "corpusSize": len(corpus), "sliceType": ERB_SLICE, "slicePool": ERB_POOL, "qids": qids,
        },
        "retrieve": retrieve,
        "rerank": rerank,
        "examplePair": example,
        "note": "fixed qid list + eval()/no_grad() + manual_seed(0); committed frozen; heavy step, "
                "fail-soft in reproduce.sh.",
    }
    (DATA / "l7-real.json").write_text(json.dumps(msmarco, indent=2, ensure_ascii=False) + "\n")

    # the depth dial → splice into the cascade (rerank top-k nDCG@10 + cited latency ~∝ k).
    # SAME GPU-batched regime as the latency block (≈1.2 ms/pair amortized at batch ≈32): k=100 → 120 ms
    # matches latency.rerankMs exactly; k=10 is one part-filled batch (~15 ms), k=1000 → ~1.2 s.
    cited_latency = {10: 15, 100: 120, 1000: 1200}
    rerankDepth = [{"k": k, "ndcg": rerank_ndcg_at[k], "latencyMs": cited_latency[k]} for k in MS_DEPTHS]
    splice(DATA / "l7-cascade.json", rerankDepth=rerankDepth)
    print(f"[l7-real] ERB  recall@{{10,100,1000}}={list(retrieve['recallAt'].values())}  "
          f"retrieve.mrr={retrieve['mrrAt10']} → rerank.mrr={rerank['mrrAt10']} ndcg={rerank['ndcgAt10']}")
    print(f"[l7-real] depth dial nDCG@10 by k: {[(d['k'], d['ndcg']) for d in rerankDepth]}")
    return msmarco


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    part1_biencoder()
    part2_crossencoder()
    part3_cascade_l4()
    part4_msmarco()
    print("[l7-real] done — spliced real blocks into l7-biencoder/crossencoder/cascade; wrote l7-real")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
