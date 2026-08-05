#!/usr/bin/env python3
"""gen_l20.py — the L20 "Russian Search" data generator (morphology strikes back).

Emits TWO structurally-distinct files (provenance must never blur — same contract as gen_l16.py):

  • data/l20-ru.json    — MEASURED on tiny CONSTRUCTED toys (pure stdlib → byte-identical under any
      CPython; no numpy/ABI dependency, so reproduce.sh holds regardless of the 3.9 toolchain).
  • data/l20-bench.json — REPORTED/cited facts (MIRACL, mMARCO, ruMTEB, BGE-M3, mE5, tokenizer
      unfairness) — NOT computed here; each row carries its citation so the deck can label
      provenance "reported by <cite>" vs "measured on our toy."

WHAT THE TOYS DEMONSTRATE (the two spines of the lecture):

  1. TOKEN TAX — a BPE tokenizer trained on an English-heavy mix (9:1 EN:RU, mimicking the skew of
     real web-scale tokenizer training data) fragments Russian words into many more sub-word pieces
     than English words of the same meaning. We train a classic character-BPE (weighted pair counts,
     deterministic tie-break) and tokenize a parallel EN/RU sentence pair: tokens-per-word explodes
     for Russian. The toy reproduces the DIRECTION and ORDER of the effect (Russian pays a multiple),
     not any specific production tokenizer's exact ratio.

  2. LEMMA vs SURFACE for BM25 — Russian is fusional: a noun paradigm has 12 case/number slots, so
     query "котята играют" and the answer document "котёнок играет…" can share ZERO surface forms.
     Surface-form BM25 then scores the gold document 0.0 (not even a candidate) while an off-topic
     distractor that happens to repeat one exact query form wins. Lemmatize both sides and the gold
     document jumps to rank 1 — the ordering INVERSION the deck's worked-by-hand example walks.
     BM25 uses the course convention from gen_l3.py: k1=1.5, b=0.75, idf = ln((N-df+.5)/(df+.5)+1).

Run: python3 _research/gen_l20.py   (stdlib only; reproduce.sh re-runs it byte-identically)
"""
import json
import math
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

# ═══════════════════════════════ 1 · the token tax (BPE toy) ═══════════════════════════════
# Training mix: an English-heavy corpus (repeated EN_WEIGHT times) + one small Russian passage —
# the 9:1 skew stands in for the EN-dominant training data of real web-scale tokenizers.
EN_TRAIN = ("the search engine finds the meaning of the words the user typed "
            "the user asks and the engine answers the question with the best page "
            "a good search engine reads the query and finds the meaning")
RU_TRAIN = "поиск находит смысл запроса и слова пользователя"
EN_WEIGHT = 9
NUM_MERGES = 60

# Parallel test pair (same meaning, both fully in-vocabulary for their training halves).
EN_TEST = "the search finds the meaning of the query"
RU_TEST = "поиск находит смысл запроса"


def word_freqs():
    freqs = {}
    for _ in range(EN_WEIGHT):
        for w in EN_TRAIN.split():
            key = tuple(w)
            freqs[key] = freqs.get(key, 0) + 1
    for w in RU_TRAIN.split():
        key = tuple(w)
        freqs[key] = freqs.get(key, 0) + 1
    return freqs


def pair_counts(freqs):
    counts = {}
    for word, f in freqs.items():
        for i in range(len(word) - 1):
            p = (word[i], word[i + 1])
            counts[p] = counts.get(p, 0) + f
    return counts


def merge_word(word, pair):
    out, i = [], 0
    while i < len(word):
        if i < len(word) - 1 and (word[i], word[i + 1]) == pair:
            out.append(word[i] + word[i + 1])
            i += 2
        else:
            out.append(word[i])
            i += 1
    return tuple(out)


def train_bpe():
    """Classic BPE: greedily merge the most frequent adjacent pair; ties break lexicographically
    (max over (count, pair) — fully deterministic, no hashing order involved)."""
    freqs = word_freqs()
    merges = []
    for _ in range(NUM_MERGES):
        counts = pair_counts(freqs)
        if not counts:
            break
        best = max(counts.items(), key=lambda kv: (kv[1], kv[0]))[0]
        merges.append(best)
        freqs = {merge_word(w, best): f for w, f in freqs.items()}
    return merges


def tokenize(word, merges):
    toks = tuple(word)
    for m in merges:
        toks = merge_word(toks, m)
    return list(toks)


def token_tax():
    merges = train_bpe()
    def count(sent):
        words = sent.split()
        splits = {w: tokenize(w, merges) for w in words}
        n = sum(len(splits[w]) for w in words)
        return words, splits, n
    en_words, en_splits, en_tok = count(EN_TEST)
    ru_words, ru_splits, ru_tok = count(RU_TEST)
    per_en = round(en_tok / len(en_words), 1)
    per_ru = round(ru_tok / len(ru_words), 1)
    return {
        "_doc": "MEASURED on a constructed BPE toy: character-BPE trained on a 9:1 EN:RU mix "
                "(EN_WEIGHT=9, NUM_MERGES=60, deterministic tie-break), then applied to a parallel "
                "EN/RU sentence. Reproduces the DIRECTION of the token tax (Russian fragments into "
                "several times more pieces), not any production tokenizer's exact ratio. "
                "Generator: _research/gen_l20.py.",
        "enWeight": EN_WEIGHT,
        "numMerges": NUM_MERGES,
        "enSentence": EN_TEST,
        "ruSentence": RU_TEST,
        "enWords": len(en_words),
        "ruWords": len(ru_words),
        "enTokens": en_tok,
        "ruTokens": ru_tok,
        "perWordEn": per_en,          # tokens per word, EN (1-dp — deck-displayable without 2-dp gating)
        "perWordRu": per_ru,          # tokens per word, RU
        "taxRatio": round(per_ru / per_en, 1),
        "enSplitSearch": en_splits["search"],
        "ruSplitZaprosa": ru_splits["запроса"],
    }


# ═══════════════════ 2 · the noun paradigm (why surface forms miss) ═══════════════════
# One inanimate masculine noun, the full 6-case × 2-number paradigm: 12 slots, 10 distinct
# surface strings (nominative == accusative in both numbers). Pure linguistic bookkeeping.
PARADIGM = {
    "lemma": "запрос",
    "singular": ["запрос", "запроса", "запросу", "запрос", "запросом", "запросе"],
    "plural":   ["запросы", "запросов", "запросам", "запросы", "запросами", "запросах"],
}


def paradigm():
    forms = PARADIGM["singular"] + PARADIGM["plural"]
    return {
        "_doc": "The full 6-case x 2-number paradigm of one inanimate noun — 12 slots, "
                "10 distinct surface strings (nom == acc in both numbers). A keyword index "
                "sees 10 unrelated terms unless you normalize.",
        "lemma": PARADIGM["lemma"],
        "cases": 6,
        "numbers": 2,
        "slots": 12,
        "distinctForms": len(set(forms)),
        "forms": forms,
    }


# ═══════════════════ 3 · BM25: surface forms vs lemmas (the inversion) ═══════════════════
# Query "котята играют" (kittens play). The GOLD document says "котёнок играет…" — same two
# lemmas, ZERO shared surface forms. An off-topic distractor repeats the exact form "играют"
# (children playing) and wins the surface-form ranking while the gold document scores 0.0.
# Lemmatize both sides → gold matches both query terms and takes rank 1: the inversion.
K1, B = 1.5, 0.75          # course convention (gen_l3.py)

QUERY = ["котята", "играют"]

DOCS = {
    "d1_gold":       ["котёнок", "играет", "с", "клубком", "ниток"],       # THE ANSWER — both lemmas, no surface match
    "d2_distractor": ["дети", "играют", "во", "дворе", "школы"],           # repeats the exact form "играют"; off-topic
    "d3_cats":       ["кошки", "спят", "на", "тёплой", "печи"],            # cats, but asleep — different lemmas
    "d4_puppy":      ["щенок", "играл", "с", "мячом"],                     # plays (other form), wrong animal
    "d5_shop":       ["магазин", "продаёт", "корм", "для", "котят"],       # kitten-form "котят", no playing
}
GOLD = "d1_gold"

# The tiny lemma dictionary (the toy's stand-in for mystem/pymorphy): surface form → lemma.
LEMMA = {
    "котята": "котёнок", "котят": "котёнок", "котёнок": "котёнок",
    "играют": "играть", "играет": "играть", "играл": "играть",
    "кошки": "кошка", "спят": "спать", "дети": "ребёнок",
    "щенок": "щенок", "магазин": "магазин", "продаёт": "продавать",
    "корм": "корм", "мячом": "мяч", "клубком": "клубок", "ниток": "нитка",
    "дворе": "двор", "школы": "школа", "тёплой": "тёплый", "печи": "печь",
    "с": "с", "на": "на", "во": "в", "для": "для",
}


def lemmatize(tokens):
    return [LEMMA.get(t, t) for t in tokens]


def bm25_all(docs, query):
    """BM25 with the course convention; returns per-doc scores + the gold doc's per-term work."""
    N = len(docs)
    avgdl = sum(len(d) for d in docs.values()) / N
    df = {}
    for t in query:
        df[t] = sum(1 for d in docs.values() if t in d)
    idf = {t: math.log((N - df[t] + 0.5) / (df[t] + 0.5) + 1) for t in query}
    scores, work = {}, {}
    for did, d in docs.items():
        s, terms = 0.0, []
        for t in query:
            f = d.count(t)
            bm = idf[t] * (f * (K1 + 1)) / (f + K1 * (1 - B + B * len(d) / avgdl)) if f else 0.0
            terms.append({"t": t, "tf": f, "df": df[t], "idf": round(idf[t], 4), "bm25": round(bm, 4)})
            s += bm
        scores[did] = round(s, 4)
        work[did] = terms
    return scores, work, round(avgdl, 1)


def rank_of(scores, doc):
    order = sorted(scores, key=lambda k: -scores[k])   # stable: ties keep insertion order
    return order.index(doc) + 1


def bm25_lemma_toy():
    surf_scores, surf_work, avgdl = bm25_all(DOCS, QUERY)
    lem_docs = {k: lemmatize(v) for k, v in DOCS.items()}
    lem_query = lemmatize(QUERY)
    lem_scores, lem_work, _ = bm25_all(lem_docs, lem_query)
    return {
        "_doc": "MEASURED on a constructed 5-doc Russian corpus (stdlib BM25, k1=1.5, b=0.75, "
                "idf=ln((N-df+.5)/(df+.5)+1) — the gen_l3.py course convention). Surface-form BM25: "
                "the gold doc shares ZERO surface forms with the query -> score 0.0, while a "
                "distractor repeating the exact form 'играют' wins. Lemmatized BM25: the gold doc "
                "matches both query lemmas -> rank 1. Reproduces the ORDERING INVERSION, not any "
                "production system's magnitudes. Generator: _research/gen_l20.py.",
        "k1": K1,
        "b": B,
        "avgdl": avgdl,
        "query": QUERY,
        "queryLemmas": lem_query,
        "goldDoc": GOLD,
        "surface": {
            "scores": surf_scores,
            "goldScore": surf_scores[GOLD],
            "goldMatches": 0,
            "topDoc": max(surf_scores, key=lambda k: surf_scores[k]),
            "goldRank": rank_of(surf_scores, GOLD),
        },
        "lemma": {
            "scores": lem_scores,
            "goldScore": lem_scores[GOLD],
            "goldRank": rank_of(lem_scores, GOLD),
            "goldWork": lem_work[GOLD],       # per-term df/idf/tf/bm25 for the worked-by-hand slide
            "runnerUp": sorted(lem_scores, key=lambda k: -lem_scores[k])[1],
        },
        "inversion": bool(rank_of(surf_scores, GOLD) > rank_of(lem_scores, GOLD)),
    }


# ═══════════════════════════════ 4 · reported bench facts ═══════════════════════════════
def bench():
    """REPORTED/cited facts — transcribed from the primary sources, NOT computed here."""
    return {
        "_doc": "REPORTED published facts — each row transcribed from its cited primary source. "
                "Provenance: 'reported by <cite>', NOT measured on our toys.",
        "miracl": {
            "_doc": "MIRACL — multilingual open-retrieval benchmark; human-annotated (not translated); "
                    "Russian is one of its languages.",
            "cite": "Zhang et al. 2023, arXiv:2210.09984",
            "languages": 18,
            "russianIncluded": True,
            "annotation": "native-speaker, per-language corpora (Wikipedia)",
        },
        "mmarco": {
            "_doc": "mMARCO — MS MARCO passage ranking machine-translated into 13 languages incl. "
                    "Russian; translationese caveat applies.",
            "cite": "Bonifacio et al. 2021, arXiv:2108.13897",
            "languages": 13,
            "russianIncluded": True,
            "annotation": "machine-translated from English MS MARCO",
        },
        "rumteb": {
            "_doc": "ruMTEB — the Russian branch of MTEB: Russian-language embedding tasks incl. "
                    "retrieval; introduced together with the ru-en-RoSBERTa model.",
            "cite": "Snegirev et al. 2024, arXiv:2408.12503",
            "tasks": 23,
            "model": "ru-en-RoSBERTa",
        },
        "bgem3": {
            "_doc": "BGE-M3 — multilingual (100+ languages incl. Russian), multi-granularity "
                    "(up to 8192 tokens), multi-function (dense + sparse + multi-vector in one model).",
            "cite": "Chen et al. 2024, arXiv:2402.03216",
            "languagesAtLeast": 100,
            "maxTokens": 8192,
            "functions": ["dense", "sparse", "multi-vector"],
        },
        "me5": {
            "_doc": "multilingual-E5 — the multilingual E5 family (same query:/passage: prefixes as "
                    "English E5); strong multilingual retrieval baseline covering Russian.",
            "cite": "Wang et al. 2024, arXiv:2402.05672",
            "prefixes": ["query: ", "passage: "],
        },
        "labse": {
            "_doc": "LaBSE — language-agnostic BERT sentence embeddings; trained on parallel pairs, "
                    "covers 109 languages; a bitext/translation-retrieval specialist (not ad-hoc search).",
            "cite": "Feng et al. 2022, arXiv:2007.01852",
            "languages": 109,
        },
        "tokenTax": {
            "_doc": "Tokenizer unfairness across languages: for the SAME content some languages pay "
                    "up to 15x more tokens than English in production LLM tokenizers.",
            "cite": "Petrov et al. 2023, arXiv:2305.15425",
            "maxPremium": 15,
        },
        "tools": {
            "_doc": "The classic Russian normalization stack (all rule/dictionary-based, CPU-cheap).",
            "snowball": {"cite": "Porter 2001 (Snowball)", "what": "rule-based Russian stemmer"},
            "mystem": {"cite": "Segalovich 2003", "what": "fast dictionary lemmatizer with disambiguation heuristics"},
            "pymorphy2": {"cite": "Korobov 2015", "what": "OpenCorpora-dictionary morphological analyzer (Python)"},
        },
    }


if __name__ == "__main__":
    ru = {
        "_doc": "MEASURED toys for L20 'Russian Search' — token tax (BPE on a 9:1 EN:RU mix), the "
                "noun paradigm, and the BM25 surface-vs-lemma ordering inversion. All stdlib, "
                "deterministic. Generator: _research/gen_l20.py.",
        "tokenTax": token_tax(),
        "paradigm": paradigm(),
        "bm25": bm25_lemma_toy(),
    }
    (DATA / "l20-ru.json").write_text(json.dumps(ru, indent=2, ensure_ascii=False) + "\n")
    (DATA / "l20-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    t, b = ru["tokenTax"], ru["bm25"]
    print(f"[gen_l20] wrote data/l20-ru.json (tax {t['perWordEn']} vs {t['perWordRu']} tok/word = x{t['taxRatio']}; "
          f"BM25 gold rank {b['surface']['goldRank']} (score {b['surface']['goldScore']}) -> "
          f"{b['lemma']['goldRank']} (score {b['lemma']['goldScore']}), inversion={b['inversion']}) "
          f"+ data/l20-bench.json")
