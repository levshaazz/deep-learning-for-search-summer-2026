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
    """BM25 with the course convention; returns per-doc scores + the gold doc's per-term work.

    ROUNDING POLICY: the deck shows the per-term contributions at 4 dp NEXT TO their sum, so the
    emitted score is the sum of the ROUNDED terms (0.8594 + 0.5291 = 1.3885) — a student re-adding
    the displayed column must land exactly on the displayed total. (Summing unrounded and rounding
    once gave 1.3884, one ulp off the visible arithmetic.)"""
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
            s += round(bm, 4)
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


# ═════════════════ 3b · Snowball Russian — a stdlib port (no dependency, H3-safe) ═════════════════
# WHY A PORT: the deck's Act 2 recommends stemming as the fast default but never MEASURES it, and the
# audit found the "мир / мировой / мирный" over-stemming example was invented (Snowball gives three
# DIFFERENT stems there). Measuring the third pass needs a stemmer, and a runtime dependency would break
# H3 (stdlib-only, byte-identical under any CPython). So: a faithful port of the published algorithm
# (snowballstem.org/algorithms/russian/stemmer.html), guarded by a 30-pair CONTROL LIST asserted at
# generation time — if the port ever drifts from the reference outputs, gen_l20.py refuses to write.
VOWELS = set("аеиоуыэюя")

# endings, longest-match-first inside each `among` (Snowball semantics: the longest alternative wins;
# if its guard fails, the whole `among` fails — there is NO backtracking to a shorter alternative).
PERFECTIVE_GERUND_1 = ("вшись", "вши", "в")                      # must be preceded by а or я
PERFECTIVE_GERUND_2 = ("ившись", "ывшись", "ивши", "ывши", "ив", "ыв")
REFLEXIVE = ("ся", "сь")
ADJECTIVE = ("ими", "ыми", "его", "ого", "ему", "ому", "ее", "ие", "ые", "ое", "ей", "ий", "ый",
             "ой", "ем", "им", "ым", "ом", "их", "ых", "ую", "юю", "ая", "яя", "ою", "ею")
PARTICIPLE_1 = ("ющ", "ем", "нн", "вш", "щ")                     # must be preceded by а or я
PARTICIPLE_2 = ("ивш", "ывш", "ующ")
VERB_1 = ("ешь", "нно", "ете", "йте", "ла", "на", "ли", "ем", "ло", "но", "ет", "ют", "ны", "ть",
          "й", "л", "н")                                          # must be preceded by а or я
VERB_2 = ("ейте", "уйте", "ила", "ыла", "ена", "ите", "или", "ыли", "ило", "ыло", "ено", "ует",
          "уют", "ены", "ить", "ыть", "ишь", "ей", "уй", "ил", "ыл", "им", "ым", "ен", "ят",
          "ит", "ыт", "ую", "ю")
NOUN = ("иями", "ями", "ами", "ией", "иям", "ием", "иях", "ев", "ов", "ие", "ье", "еи", "ии",
        "ей", "ой", "ий", "ям", "ем", "ам", "ом", "ах", "ях", "ию", "ью", "ия", "ья", "а", "е",
        "и", "й", "о", "у", "ы", "ь", "ю", "я")
DERIVATIONAL = ("ость", "ост")
SUPERLATIVE = ("ейше", "ейш")


def _regions(w):
    """RV · R1 · R2 as defined by the Snowball Russian spec (returned as start indices)."""
    rv = len(w)
    for i, ch in enumerate(w):
        if ch in VOWELS:
            rv = i + 1
            break
    def after_vowel_consonant(start):
        for i in range(start, len(w) - 1):
            if w[i] in VOWELS and w[i + 1] not in VOWELS:
                return i + 2
        return len(w)
    r1 = after_vowel_consonant(0)
    r2 = after_vowel_consonant(r1) if r1 < len(w) else len(w)
    return rv, r1, r2


def _among(w, region_start, endings, need_a_ya=False):
    """One Snowball `among`: longest ending that FITS INSIDE the region; guard checked in-region too."""
    best = None
    for e in endings:
        if w.endswith(e) and len(w) - len(e) >= region_start:
            if best is None or len(e) > len(best):
                best = e
    if best is None:
        return None
    cut = len(w) - len(best)
    if need_a_ya:                                   # the ('а' or 'я') guard — also inside the region
        if cut - 1 < region_start or w[cut - 1] not in ("а", "я"):
            return None
    return w[:cut]


def _among2(w, region_start, g1, g2):
    """Two alternative groups inside ONE among: the longest match across both decides the guard."""
    cand = []
    for e in g1:
        if w.endswith(e) and len(w) - len(e) >= region_start:
            cand.append((len(e), True, e))
    for e in g2:
        if w.endswith(e) and len(w) - len(e) >= region_start:
            cand.append((len(e), False, e))
    if not cand:
        return None
    _, guarded, best = max(cand, key=lambda t: (t[0], not t[1]))
    cut = len(w) - len(best)
    if guarded:
        if cut - 1 < region_start or w[cut - 1] not in ("а", "я"):
            return None
    return w[:cut]


def snowball_ru(word):
    """Snowball Russian stemmer (stdlib port). Includes the 2018 prelude ё → е."""
    w = word.lower().replace("ё", "е")
    if not w or any(ch not in "абвгдежзийклмнопрстуфхцчшщъыьэюя" for ch in w):
        return w
    rv, _r1, r2 = _regions(w)

    # ── Step 1 ────────────────────────────────────────────────────────────────────────────────
    out = _among2(w, rv, PERFECTIVE_GERUND_1, PERFECTIVE_GERUND_2)
    if out is not None:
        w = out
    else:
        refl = _among(w, rv, REFLEXIVE)
        if refl is not None:
            w = refl
        adj = _among(w, rv, ADJECTIVE)
        if adj is not None:                          # ADJECTIVAL = adjective (+ optional participle)
            w = adj
            part = _among2(w, rv, PARTICIPLE_1, PARTICIPLE_2)
            if part is not None:
                w = part
        else:
            verb = _among2(w, rv, VERB_1, VERB_2)
            if verb is not None:
                w = verb
            else:
                noun = _among(w, rv, NOUN)
                if noun is not None:
                    w = noun

    # ── Step 2: a trailing и ──────────────────────────────────────────────────────────────────
    if w.endswith("и") and len(w) - 1 >= rv:
        w = w[:-1]
    # ── Step 3: a DERIVATIONAL ending inside R2 ───────────────────────────────────────────────
    der = _among(w, r2, DERIVATIONAL)
    if der is not None:
        w = der
    # ── Step 4: undouble н · superlative · a trailing soft sign ───────────────────────────────
    if w.endswith("нн") and len(w) - 1 >= rv:
        w = w[:-1]
    else:
        sup = _among(w, rv, SUPERLATIVE)
        if sup is not None:
            w = sup
            if w.endswith("нн") and len(w) - 1 >= rv:
                w = w[:-1]
        elif w.endswith("ь") and len(w) - 1 >= rv:
            w = w[:-1]
    return w


# The CONTROL LIST — hand-checked against the published reference vocabulary. gen_l20.py ASSERTS on it,
# so a drift in the port is a generation-time failure, not a silently wrong slide.
SNOWBALL_CONTROL = {
    "запрос": "запрос", "запроса": "запрос", "запросами": "запрос", "запросах": "запрос",
    "котёнок": "котенок", "котенок": "котенок", "котята": "котят", "котят": "кот",
    # NB «играя» → «игр», not «игра»: Step 1 handles only PERFECTIVE gerunds, so the imperfective
    # gerund falls through to the ADJECTIVAL among, where «ая» is an adjective ending. One more
    # under-stemming split inside a single lexeme — the port reproduces it, we do not paper over it.
    "играть": "игра", "играют": "игра", "играет": "игра", "играл": "игра", "играя": "игр",
    "кошки": "кошк", "дети": "дет", "щенок": "щенок", "магазин": "магазин",
    "мир": "мир", "мировой": "миров", "мирный": "мирн", "мириться": "мир",
    "стали": "стал", "сталь": "стал", "стал": "стал", "стать": "стат",
    "небо": "неб", "нёбо": "неб", "все": "все", "всё": "все",
    "банк": "банк", "банка": "банк", "ёлку": "елк", "ёлки": "елк", "елки": "елк",
    "ель": "ел", "ели": "ел",
}


def stemmer_block():
    """The Act-2 third pass, measured: what Snowball actually does to this lecture's own words."""
    bad = {w: (snowball_ru(w), ref) for w, ref in SNOWBALL_CONTROL.items() if snowball_ru(w) != ref}
    assert not bad, f"snowball_ru port drifted from the control list: {bad}"

    # the toy-corpus map the worked-by-hand slide walks
    toy = {}
    for w in QUERY + [t for d in DOCS.values() for t in d]:
        toy[w] = snowball_ru(w)

    # REAL conflations / splits (the invented «мир/мировой/мирный» example is replaced by these)
    conflate = [
        {"words": ["стал", "сталь", "стали"], "stem": snowball_ru("сталь"),
         "why": "over", "gloss": "past tense of «стать» and the noun «сталь» share one stem"},
        {"words": ["мир", "мириться"], "stem": snowball_ru("мириться"),
         "why": "over", "gloss": "two unrelated lexemes collapse"},
        {"words": ["небо", "нёбо"], "stem": snowball_ru("нёбо"),
         "why": "over", "gloss": "a minimal ё/е pair is destroyed"},
        {"words": ["банк", "банка"], "stem": snowball_ru("банка"),
         "why": "over", "gloss": "the bank and the jar"},
    ]
    split = [
        {"lemma": "котёнок", "forms": ["котёнок", "котята", "котят"],
         "stems": [snowball_ru(x) for x in ("котёнок", "котята", "котят")], "why": "under"},
        {"lemma": "стать", "forms": ["стать", "стал", "стали"],
         "stems": [snowball_ru(x) for x in ("стать", "стал", "стали")], "why": "under"},
        {"lemma": "мир", "forms": ["мир", "мировой", "мирный"],
         "stems": [snowball_ru(x) for x in ("мир", "мировой", "мирный")], "why": "none"},
    ]
    # the by-hand cascade the formal slide walks: «запросами» → RV → noun ending → «запрос»
    rv, r1, r2 = _regions("запросами")
    return {
        "_doc": "MEASURED by a stdlib PORT of the published Snowball Russian algorithm (regions RV/R1/R2 "
                "+ 4 steps + the 2018 prelude ё→е), asserted at generation time against a 36-word control "
                "list. No runtime dependency (H3). Generator: _research/gen_l20.py.",
        "controlPairs": len(SNOWBALL_CONTROL),
        "toyStems": toy,
        "conflations": conflate,
        "splits": split,
        "cascade": {"word": "запросами", "rv": rv, "r1": r1, "r2": r2,
                    "rvText": "запросами"[rv:], "ending": "ами", "stem": snowball_ru("запросами")},
        "distinctStemsForKitten": len(set(snowball_ru(x) for x in ("котёнок", "котята", "котят"))),
    }


# ═════════════════ 3c · the third pass: surface · stem · lemma, side by side ═════════════════
def bm25_three_way():
    """Adds the STEM pass to the existing surface/lemma runs, plus honest retrieval bookkeeping.

    E6 fix: the gold document's surface 'rank 2' is a TIE-BREAK ARTEFACT — four of five documents score
    exactly 0.0 and the sort is stable. The honest statement is `retrieved: false` (its postings list is
    empty, df = 0), so we emit retrieval flags next to the ranks and let the deck say so.
    """
    def pass_of(docs, query):
        scores, work, _ = bm25_all(docs, query)
        retrieved = {k: bool(scores[k] > 0) for k in scores}
        ranked = [k for k in sorted(scores, key=lambda k: -scores[k]) if retrieved[k]]
        return {
            "scores": scores,
            "retrieved": retrieved,
            "retrievedCount": sum(1 for v in retrieved.values() if v),
            "goldScore": scores[GOLD],
            "goldRetrieved": retrieved[GOLD],
            "goldRank": (ranked.index(GOLD) + 1) if retrieved[GOLD] else None,
            "goldRankTieSorted": rank_of(scores, GOLD),   # the artefact, kept as a footnote only
            "topDoc": ranked[0] if ranked else None,
            "goldWork": work[GOLD],
        }
    stem_docs = {k: [snowball_ru(t) for t in v] for k, v in DOCS.items()}
    stem_query = [snowball_ru(t) for t in QUERY]
    lem_docs = {k: lemmatize(v) for k, v in DOCS.items()}
    return {
        "_doc": "MEASURED — the SAME 5-doc toy and the SAME BM25 (k1=1.5, b=0.75), run three times: over "
                "raw surface forms, over Snowball stems, over lemmas. The point of the middle pass: "
                "stemming RESCUES the gold document from the void but still ranks it BEHIND the puppy, "
                "because «котята»→«котят» while «котят»→«кот» — one lexeme, three stems. Generator: "
                "_research/gen_l20.py.",
        "queryStems": stem_query,
        "surface": pass_of(DOCS, QUERY),
        "stem": pass_of(stem_docs, stem_query),
        "lemma": pass_of(lem_docs, lemmatize(QUERY)),
        "stemMap": {t: snowball_ru(t) for t in QUERY + [t for d in DOCS.values() for t in d]},
        "lemmaMap": {t: LEMMA.get(t, t) for t in QUERY + [t for d in DOCS.values() for t in d]},
        "docText": {k: " ".join(v) for k, v in DOCS.items()},
    }


# ═════════════════ 3d · the paradigm bench (widget W1) ═════════════════
VERB_FORMS = ["играю", "играешь", "играет", "играем", "играете", "играют",
              "играл", "играла", "играло", "играли", "играй", "играйте", "играть",
              "играющий", "игравший", "играя"]
ADJ_FORMS = ["новый", "нового", "новому", "новым", "новом", "новая", "новой", "новую", "новою",
             "новое", "новые", "новых", "новыми", "нов", "нова", "ново", "новы", "новее"]
EXTRA_FORMS = [
    {"name": "locative", "ru": "местный", "example": "в лесу", "vs": "о лесе"},
    {"name": "partitive", "ru": "партитив", "example": "чаю", "vs": "чая"},
    {"name": "vocative", "ru": "звательный", "example": "Саш", "vs": "Саша"},
]


def paradigm_widget():
    noun_forms = PARADIGM["singular"] + PARADIGM["plural"]
    cases = ["им.", "род.", "дат.", "вин.", "твор.", "предл."]
    cells = [[cases[i], "sg", PARADIGM["singular"][i]] for i in range(6)] + \
            [[cases[i], "pl", PARADIGM["plural"][i]] for i in range(6)]
    return {
        "_doc": "Pure inflectional bookkeeping for the paradigm bench (widget ru-paradigm): one noun, one "
                "verb, one adjective, and how many DISTINCT terms an un-normalized index sees for each.",
        "noun": {"lemma": PARADIGM["lemma"], "slots": 12, "distinct": len(set(noun_forms)),
                 "cells": cells, "forms": noun_forms},
        "verb": {"lemma": "играть", "forms": VERB_FORMS, "distinct": len(set(VERB_FORMS))},
        "adjective": {"lemma": "новый", "forms": ADJ_FORMS, "distinct": len(set(ADJ_FORMS))},
        "beyondTheTable": EXTRA_FORMS,
        "postings": {"beforeTerms": len(set(noun_forms)), "afterTerms": 1,
                     "recallBefore": round(1 / len(set(noun_forms)), 4), "recallAfter": 1.0},
    }


# ═════════════════ 3e · the negation trap (stop-words eat «не») ═════════════════
# The DEMO list is an explicit subset of the standard Russian stop list (the full Lucene `russian_stop.txt`
# has 159 entries — a REPORTED fact, see bench()["luceneStop"]). What matters here is measured, not cited:
# the standard list contains the negations, so two OPPOSITE queries become byte-identical.
DEMO_STOPWORDS = ["и", "в", "во", "не", "что", "он", "на", "я", "с", "со", "как", "а", "то", "все",
                  "она", "так", "его", "но", "да", "ты", "к", "у", "же", "вы", "за", "бы", "по",
                  "только", "ее", "мне", "было", "вот", "от", "меня", "еще", "нет", "о", "из", "ему",
                  "ни", "без", "для", "при", "над", "под", "чем", "или", "если", "уже", "ли", "бы"]
NEGATIONS = ["не", "ни", "без", "нет"]


def stopword_negation():
    a = "карта не работает".split()
    b = "карта работает".split()
    stop = set(DEMO_STOPWORDS)
    fa = [t for t in a if t not in stop]
    fb = [t for t in b if t not in stop]
    return {
        "_doc": "MEASURED on a two-query toy: after standard Russian stop-word removal, «карта не "
                "работает» and «карта работает» become the SAME token list. The deck's pipeline slide "
                "recommends stop-word removal with no warning; this is the warning. Generator: "
                "_research/gen_l20.py.",
        "demoListSize": len(DEMO_STOPWORDS),
        "negationsInList": [n for n in NEGATIONS if n in stop],
        "queryA": " ".join(a), "queryB": " ".join(b),
        "afterA": fa, "afterB": fb,
        "identical": fa == fb,
        "cures": ["subtract не/ни/без/нет from the stop list",
                  "index negation bigrams (не_работает) with a shingle filter",
                  "let the dense arm carry the negation"],
    }


# ═════════════════ 3f · the ё/е ladder (worked #3 + widget W3) ═════════════════
YO_DOCS = {
    "d1": {"text": "ёлку украсили дома", "rel": True},
    "d2": {"text": "ёлки продают на площади", "rel": True},
    "d3": {"text": "ель стоит в зале", "rel": True},
    "d4": {"text": "ели растут в лесу", "rel": True},
    "d5": {"text": "ёлку нарядили в школе", "rel": True},
    "d6": {"text": "елки везут из питомника", "rel": True},
    "d7": {"text": "котёнок играет с клубком", "rel": False},
    "d8": {"text": "магазин продаёт корм для котят", "rel": False},
}
YO_RELEVANT = [k for k, v in YO_DOCS.items() if v["rel"]]


def yo_ladder():
    def run(query, index_fold, query_fold, stem=False):
        def norm(tok, fold):
            t = tok.replace("ё", "е") if fold else tok
            return snowball_ru(t) if stem else t
        q = [norm(t, query_fold) for t in query.split()]
        hits = []
        for did, d in YO_DOCS.items():
            toks = [norm(t, index_fold) for t in d["text"].split()]
            if any(t in toks for t in q):
                hits.append(did)
        rel_hits = [h for h in hits if YO_DOCS[h]["rel"]]
        return {"hits": hits, "relevantHits": rel_hits,
                "recall": round(len(rel_hits) / len(YO_RELEVANT), 4)}

    configs = [
        {"id": "raw-e",      "query": "елку", "indexFold": False, "queryFold": False, "stem": False},
        {"id": "raw-yo",     "query": "ёлку", "indexFold": False, "queryFold": False, "stem": False},
        {"id": "index-only", "query": "ёлку", "indexFold": True,  "queryFold": False, "stem": False},
        {"id": "both-arms",  "query": "елку", "indexFold": True,  "queryFold": True,  "stem": False},
        {"id": "both-stem",  "query": "елку", "indexFold": True,  "queryFold": True,  "stem": True},
        {"id": "stem-only",  "query": "елку", "indexFold": False, "queryFold": False, "stem": True},
    ]
    rows = []
    for c in configs:
        r = run(c["query"], c["indexFold"], c["queryFold"], c["stem"])
        rows.append({**c, **r})
    by = {r["id"]: r["recall"] for r in rows}
    return {
        "_doc": "MEASURED on an 8-document ё/е toy (6 relevant). The ladder: 0 → fold ё→е in BOTH arms → "
                "add Snowball. The row that earns the lecture: folding the INDEX ONLY is worse than doing "
                "nothing — recall falls back to zero. Snowball folds ё→е itself (prelude, 2018), so the "
                "stemmed field is cured for free while keyword/phrase/facet fields are NOT. Generator: "
                "_research/gen_l20.py.",
        "docs": {k: v["text"] for k, v in YO_DOCS.items()},
        "relevant": YO_RELEVANT,
        "rows": rows,
        "ladder": {"raw": by["raw-e"], "yoBoth": by["both-arms"],
                   "yoPlusStem": by["both-stem"], "yoIndexOnly": by["index-only"]},
        "snowballFoldsYoItself": by["stem-only"] == by["both-stem"],
    }


# ═════════════════ 3g · keyboard layout · homoglyphs · bytes (Act 4 by hand) ═════════════════
QWERTY = "qwertyuiop[]asdfghjkl;'zxcvbnm,./`"
JCUKEN = "йцукенгшщзхъфывапролджэячсмитьбю.ё"
PROBES = ["ghbdtn", "rjntyjr buhftn", "gjbcr", "pfghjc", "vjcrdf", "cbthf"]
BACK_PROBES = ["привет", "запрос", "котёнок", "сибирь", "поиск"]


def layout_map():
    fwd = dict(zip(QWERTY, JCUKEN))
    back = {v: k for k, v in fwd.items()}
    conv = lambda s: "".join(fwd.get(ch, ch) for ch in s)
    unconv = lambda s: "".join(back.get(ch, ch) for ch in s)
    return {
        "_doc": "MEASURED: the ЙЦУКЕН↔QWERTY key-position map applied character by character. Fixes the "
                "deck's factual error — `cbthf` is «сиера», NOT «сибирь» (which is typed `cb,bhm`, using "
                "the comma and the m key). Generator: _research/gen_l20.py.",
        "keys": len(fwd),
        "map": fwd,
        "probes": [{"typed": p, "fixed": conv(p)} for p in PROBES],
        "back": [{"word": w, "typed": unconv(w)} for w in BACK_PROBES],
        "yoKey": {"letter": "ё", "key": back["ё"],
                  "note": "ё lives on the backtick key, so a layout typo always loses it"},
    }


HOMO_LOWER = {"а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x"}
HOMO_UPPER = {"А": "A", "В": "B", "Е": "E", "К": "K", "М": "M", "Н": "H",
              "О": "O", "Р": "P", "С": "C", "Т": "T", "У": "Y", "Х": "X"}
HOMO_WORDCHECK = ["оса", "раса", "сор", "сера", "асс", "хор", "роса", "сухо", "касса",
                  "кот", "поиск", "сосна", "россия", "море"]


def homoglyphs():
    full = [w for w in HOMO_WORDCHECK if all(ch in HOMO_LOWER for ch in w)]
    real = "сосна"
    # swap every letter that HAS a Latin twin; «н» has none, so it stays Cyrillic — that is the whole
    # trick: the string looks identical, mixes two alphabets, and matches nothing.
    fake = "".join(HOMO_LOWER.get(ch, ch) for ch in real)
    return {
        "_doc": "MEASURED against the Unicode confusables set (UTS #39): exactly 7 LOWERCASE Cyrillic "
                "letters have a visually identical Latin twin, 12 uppercase ones do. A word built only "
                "from those letters can be re-typed in Latin, look identical, and score BM25 = 0. "
                "Generator: _research/gen_l20.py.",
        "lower": HOMO_LOWER, "upper": HOMO_UPPER,
        "lowerCount": len(HOMO_LOWER), "upperCount": len(HOMO_UPPER),
        "fullyHomoglyphable": full,
        "demo": {
            "real": real, "fake": fake,
            "realCodepoints": ["U+%04X" % ord(c) for c in real],
            "fakeCodepoints": ["U+%04X" % ord(c) for c in fake],
            "equal": real == fake,
            "swapped": sum(1 for a, b in zip(real, fake) if a != b),
        },
        "asymmetry": {"note": "В→B is a confusable but в is not; Н→H is but н is not",
                      "upperOnly": sorted(set(HOMO_UPPER) - set(k.upper() for k in HOMO_LOWER))},
    }


BYTE_WORDS = ["query", "запроса", "search", "поиск", "kitten", "котёнок"]


def bytes_by_hand():
    rows = [{"word": w, "chars": len(w), "bytes": len(w.encode("utf-8")),
             "ratio": round(len(w.encode("utf-8")) / len(w), 2)} for w in BYTE_WORDS]
    ru = [r for r in rows if r["ratio"] > 1.5]
    return {
        "_doc": "MEASURED with str/encode: a byte-level BPE starts from TWICE the material on Cyrillic, "
                "because every Cyrillic letter is 2 UTF-8 bytes while ASCII is 1. That is where the "
                "fragmentation begins, before a single merge is learned. Generator: _research/gen_l20.py.",
        "rows": rows,
        "cyrillicBytesPerChar": round(sum(r["bytes"] for r in ru) / sum(r["chars"] for r in ru), 2),
        "latinBytesPerChar": 1.0,
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
        # ── the numbers Act 2, Act 3 and Act 4 were missing (2026-08 research pass) ────────────────
        "savoy2009": {
            "_doc": "The single most important number in the lecture: what NOT normalizing Russian costs. "
                    "CLEF 2005-2008, 94 topics, mean MAP over 6 retrieval models (Table 6). Differences "
                    "against 'no normalization' are always significant; the differences AMONG the "
                    "stemmers are not. Caveat the authors raise themselves: the collections are short "
                    "(19 and 15 distinct terms per document), so part of the gain is a short-document effect.",
            "cite": "Dolamic & Savoy, JASIST 60(12):2540-2547, 2009",
            "mapNone": 0.0898, "mapLight": 0.1710, "mapAggressive": 0.1684,
            "mapSnowball": 0.1650, "mapNgram4": 0.1644,
            "gainLightPct": 90.3, "gainSnowballPct": 83.6, "gainNgramPct": 83.0,
            "lossOfNotNormalizingPct": 47.5,
            "stopwordEffectPct": 2,
            "crossLanguageGainPct": {"en": 4, "nl": 4.1, "es": 7, "fr": 9, "it": 15,
                                     "de": 19, "sv": 29, "fi": 40, "ru": 90.3},
            "elasticsearch": {"russian": "Snowball", "light_russian": "Savoy light stemmer",
                              "lemmatizerBuiltIn": False},
            "note": "search snippets circulate a '+96 %' figure; the paper says +90.3 % — do not repeat it",
        },
        "miraclRu": {
            "_doc": "MIRACL's RUSSIAN dev split — the missing THIRD SCORE of the lecture. Hybrid "
                    "(BM25 + mDPR fusion) beats both arms; this is the only published Russian number "
                    "that justifies the deck's 'hybrid is the production baseline' claim.",
            "cite": "Zhang et al., TACL 2023, arXiv:2210.09984",
            "devQueries": 1252, "judgements": 13100,
            "corpusPassages": 9543918, "articles": 1476045, "dump": "2019-02-01",
            "annotators": 31,
            "ndcgBm25": 0.334, "ndcgDense": 0.407, "ndcgHybrid": 0.532,
            "recallBm25": 0.661, "recallDense": 0.797, "recallHybrid": 0.874,
            "hybridOverBm25": 0.198, "hybridOverDense": 0.125,
            "hybridKind": "BM25 + mDPR score fusion (NOT RRF — no RRF number for Russian is published)",
        },
        "mmarcoRu": {
            "_doc": "mMARCO's Russian split — machine-translated, hence the translationese caveat. The "
                    "authors' own finding: BLEU correlates weakly with retrieval quality, and synonymous "
                    "translation breaks lexical overlap, which hurts BM25 specifically.",
            "cite": "Bonifacio et al. 2021, arXiv:2108.13897",
            "passages": 8841823, "devQueries": 6980,
            "mrrBm25": 0.124, "mrrMiniLM": 0.251, "mrrMt5": 0.263,
            "translators": ["Helsinki OPUS-MT", "Google Translate"],
            "bleuQualityR2": 0.33,
        },
        "rumtebComposition": {
            "_doc": "What ruMTEB actually contains — 23 tasks in 7 categories, of which only THREE are "
                    "retrieval. The average over 23 tasks is not your metric (the L4 lesson). Version "
                    "matters: v1 is superseded_by v1.1, whose retrieval tasks were swapped for "
                    "HardNegatives.v2 — v1 and v1.1 numbers are NOT comparable.",
            "cite": "Snegirev et al., NAACL 2025, arXiv:2408.12503 (+ the mteb sources)",
            "tasks": 23, "categories": 7,
            "byCategory": {"classification": 9, "clustering": 3, "multilabel": 2, "pairClassification": 1,
                           "reranking": 2, "retrieval": 3, "sts": 3},
            "retrievalTasks": ["MIRACLRetrieval", "RiaNewsRetrieval", "RuBQRetrieval"],
            "version": "MTEB(rus, v1.1)",
            "taskSizes": {"RuBQ": {"docs": 56826, "queries": 1692, "relPerQuery": 1.68},
                          "RiaNews": {"docs": 704344, "queries": 10000, "relPerQuery": 1.0},
                          "MIRACLru": {"docs": 9543918, "queries": 1252, "relPerQuery": 2.84}},
        },
        "ruLeaderboard": {
            "_doc": "A snapshot of MTEB(rus, v1.1) restricted to models with FULL coverage of all 23 "
                    "tasks. Two showcase facts: BERTA at 128 M parameters lands 2 points behind an 8 B "
                    "model, and the two encoders the deck used to recommend (sbert_large_nlu_ru, LaBSE) "
                    "are near the BOTTOM on retrieval — they are not retrievers.",
            "cite": "MTEB leaderboard backend, snapshot 2026-08-09",
            # derived at generation time from the two rows below, so the showcase sentence is gated too
            "bertaGapToQwen8b": round(71.42 - 69.39, 2),        # 2.03 average points
            "bertaSizeRatioToQwen8b": round(7.57 / 0.128),      # x59 parameters
            "rows": [
                {"model": "ai-sage/Giga-Embeddings-instruct", "paramsB": 3.23, "dim": 2048, "avg": 74.16, "retrieval": 81.41},
                {"model": "Qwen/Qwen3-Embedding-8B", "paramsB": 7.57, "dim": 4096, "avg": 71.42, "retrieval": 78.19},
                {"model": "ai-forever/FRIDA", "paramsB": 0.82, "dim": 1536, "avg": 70.95, "retrieval": 76.38},
                {"model": "sergeyzh/BERTA", "paramsB": 0.128, "dim": 768, "avg": 69.39, "retrieval": 73.79},
                {"model": "google/embeddinggemma-300m", "paramsB": 0.31, "dim": 768, "avg": 65.19, "retrieval": 71.50},
                {"model": "deepvk/USER-bge-m3", "paramsB": 0.36, "dim": 1024, "avg": 62.86, "retrieval": 74.12},
                {"model": "ai-forever/ru-en-RoSBERTa", "paramsB": 0.40, "dim": 1024, "avg": 61.85, "retrieval": 67.53},
                {"model": "BAAI/bge-m3", "paramsB": 0.57, "dim": 1024, "avg": 61.63, "retrieval": 75.20},
                {"model": "deepvk/USER2-base", "paramsB": 0.15, "dim": 768, "avg": 61.24, "retrieval": 66.13},
                {"model": "intfloat/multilingual-e5-base", "paramsB": 0.28, "dim": 768, "avg": 58.37, "retrieval": 67.39},
                {"model": "intfloat/multilingual-e5-small", "paramsB": 0.12, "dim": 384, "avg": 57.25, "retrieval": 66.19},
                {"model": "sentence-transformers/LaBSE", "paramsB": 0.47, "dim": 768, "avg": 49.07, "retrieval": 31.53, "legacy": True},
                {"model": "ai-forever/sbert_large_nlu_ru", "paramsB": 0.43, "dim": 1024, "avg": 45.71, "retrieval": 11.00, "legacy": True},
                {"model": "cointegrated/rubert-tiny2", "paramsB": 0.03, "dim": 312, "avg": 42.72, "retrieval": 11.21, "legacy": True},
            ],
        },
        "rusbeir": {
            "_doc": "RusBEIR — the Russian BEIR the deck did not know about. Its BM25 baseline is built "
                    "on exactly this lecture's Act-2 conclusion: the Elasticsearch analyzer is TURNED OFF "
                    "and replaced by lowercase → punctuation → tokenize → pymorphy3 lemmatization → stop-words.",
            "cite": "Kovalev et al., arXiv:2504.12879 (Dialogue 2025) and arXiv:2511.05079",
            "datasetsV1": 17, "datasetsV2": 27,
            "ndcgBm25": 52.16, "ndcgMe5Large": 60.12, "ndcgBgeM3": 61.13,
            "ndcgBm25Rerank": 59.87, "ndcgBgeM3Rerank": 65.85,
            "bestSingleModel": {"model": "FRIDA", "ndcg": 51.33, "onDatasets": 27},
            "rerankerGainPoints": 9,
            "bm25PlusReranker": 50.66, "bgeM3Alone": 50.99,
            "mmarcoRuBm25": 15.25,
        },
        "rusbeirLength": {
            "_doc": "The table that overturns 'dense always wins': the SAME content re-cut into longer "
                    "windows. BM25 trails by >15 points on sentence-length chunks and OVERTAKES every "
                    "dense model on full articles. Which arm wins is a function of document length — "
                    "the direct bridge to L10/L16 chunking.",
            "cite": "Kovalev et al., arXiv:2511.05079, Table 5",
            "windows": [
                {"window": "sentences", "words": 17.6, "bm25": 13.58, "me5Large": 16.70, "bgeM3": 17.30, "frida": 20.79},
                {"window": "w2", "words": 35.3, "bm25": 21.27, "me5Large": 24.98, "bgeM3": 25.56, "frida": 28.84},
                {"window": "w4", "words": 70.5, "bm25": 27.48, "me5Large": 29.09, "bgeM3": 29.03, "frida": 30.71},
                {"window": "w6", "words": 105.8, "bm25": 31.54, "me5Large": 31.42, "bgeM3": 31.15, "frida": 32.09},
                {"window": "full-articles", "words": 2059, "bm25": 74.95, "me5Large": 60.62},
            ],
        },
        "fertility": {
            "_doc": "Tokens per word on FLORES-200 (dev+devtest, 2009 parallel sentences) — the same "
                    "corpus Petrov et al. used; our reproduction matched their published values to "
                    "within 2 tokens. Three punchlines: OpenAI's own arc x5.74 → x2.49 → x1.42 (the tax "
                    "is a CHOICE, not a law); BGE-M3 and multilingual-E5 share XLM-R's 250k vocabulary, "
                    "so one number covers all three; and ruBERT is the only tokenizer where Russian is "
                    "CHEAPER than English.",
            "cite": "measured on FLORES-200; Petrov et al. arXiv:2305.15425; Arnett et al. arXiv:2403.00686",
            "rows": [
                {"tokenizer": "GPT-2 / r50k", "vocabK": 50, "en": 1.227, "ru": 7.773, "premium": 5.74},
                {"tokenizer": "BERT-base-uncased", "vocabK": 30, "en": 1.227, "ru": 6.006, "premium": 4.43},
                {"tokenizer": "cl100k_base (GPT-3.5/4)", "vocabK": 100, "en": 1.233, "ru": 3.388, "premium": 2.49},
                {"tokenizer": "Llama 2", "vocabK": 32, "en": 1.415, "ru": 2.555, "premium": 1.64},
                {"tokenizer": "Llama 3.1", "vocabK": 128, "en": 1.232, "ru": 2.209, "premium": 1.62},
                {"tokenizer": "o200k_base (GPT-4o)", "vocabK": 200, "en": 1.220, "ru": 1.915, "premium": 1.42},
                {"tokenizer": "Gemma 2", "vocabK": 256, "en": 1.232, "ru": 1.889, "premium": 1.39},
                {"tokenizer": "XLM-R = BGE-M3 = mE5", "vocabK": 250, "en": 1.392, "ru": 1.804, "premium": 1.17},
                {"tokenizer": "ruBERT", "vocabK": 120, "en": 1.949, "ru": 1.444, "premium": 0.67},
            ],
            "cyrillicTokensInVocab": {"r50k": 17, "r50kMultiChar": 0, "cl100k": 729, "o200k": 14211},
            "r50kCyrillicList": "о а е и т р с н л к у в я м д ы ь",
            "bytePremium": 1.984, "charPremium": 1.089, "cyrillicBytesPerChar": 1.824,
            "claudeCaveat": "no public Claude tokenizer; its docs warn tiktoken under-counts by 15-20 % "
                            "and more on non-English — do NOT extrapolate this table to Claude",
        },
        "lemmaAccuracy": {
            "_doc": "Top-1 lemmatization accuracy on one shared test set — the only recent head-to-head. "
                    "Two lessons the deck needs: real accuracy is 89-95 %, not the '<1 % errors' folklore "
                    "(that figure measured the RECALL of the parse SET, not top-1); and the gap between "
                    "PyMorphy2 and PyMorphy2* (an oracle over all its parses) is EXACTLY the price of "
                    "context-blindness — 3-4 points.",
            "cite": "Rubic2, BSNLP / ACL 2025",
            "rows": [
                {"model": "MyStem", "rnc": 91.60, "fiction": 91.64, "news": 91.65, "social": 91.98, "wiki": 89.56, "caps": 78.90},
                {"model": "PyMorphy2", "rnc": 91.23, "fiction": 95.21, "news": 94.10, "social": 93.76, "wiki": 89.35, "caps": 80.15},
                {"model": "Stanza", "rnc": 93.79, "fiction": 97.65, "news": 97.32, "social": 95.10, "wiki": 89.70, "caps": 59.24},
                {"model": "PyMorphy2* (oracle)", "rnc": 94.08, "fiction": 97.56, "news": 95.79, "social": 96.97, "wiki": 90.25, "caps": 83.25},
                {"model": "Rubic2 (neural)", "rnc": 99.05, "fiction": 99.39, "news": 99.69, "social": 97.86, "wiki": 96.36, "caps": 82.87},
            ],
            "oracleGapRnc": 2.85, "oracleGapSocial": 3.21,
        },
        "pymorphyBlind": {
            "_doc": "pymorphy3's top-1 parse WITHOUT context — the concrete proof that a dictionary "
                    "lemmatizer does not disambiguate. An index built on these lemmas silently destroys "
                    "the query «первый том».",
            "cite": "pymorphy3 2.0.6, OpenCorpora dictionary",
            "rows": [
                {"form": "том", "top1": "тот", "p": 0.896, "lost": "том (a volume)", "pLost": 0.006},
                {"form": "банка", "top1": "банк", "p": 0.955, "lost": "банка (a jar)", "pLost": 0.045},
                {"form": "стали", "top1": "стать", "p": 0.975, "lost": "сталь (steel)", "pLost": 0.011},
                {"form": "жгут", "top1": "жечь", "p": 0.600, "lost": "жгут (a tourniquet)", "pLost": 0.200},
                {"form": "белки", "top1": "белка", "p": 0.300, "lost": "белок (protein)", "pLost": 0.300},
            ],
        },
        "toolStatus": {
            "_doc": "The state of the Russian normalization tooling in 2026 — the deck used to recommend "
                    "an unmaintained package (pymorphy2) and a non-free binary (Mystem) with no licence "
                    "warning. Both are corrected here.",
            "cite": "PyPI / GitHub / vendor licences, snapshot 2026-08",
            "rows": [
                {"tool": "pymorphy2", "version": "0.9.1", "released": "2020-09-26", "context": False,
                 "licence": "MIT", "maintained": False, "wordsPerSec": 11000},
                {"tool": "pymorphy3", "version": "2.0.6", "released": "2025-10-09", "context": False,
                 "licence": "MIT", "maintained": True, "python": "3.9-3.14", "wordsPerSec": 11000},
                {"tool": "Mystem 3.1", "version": "3.1", "released": "2019-06-20", "context": True,
                 "licence": "non-free (non-commercial, 2011 agreement)", "maintained": False, "wordsPerSec": 62000},
                {"tool": "Snowball ru", "version": "stable", "released": "2018-03-16", "context": False,
                 "licence": "BSD", "maintained": True, "wordsPerSec": 33000, "foldsYo": True},
                {"tool": "spaCy ru_core_news", "version": "3.8.0", "released": "2024", "context": "partial",
                 "licence": "MIT", "maintained": True, "wordsPerSec": 2300, "lemmatizerIs": "pymorphy3"},
                {"tool": "Stanza / UDPipe 2", "version": "1.x", "released": "2024", "context": True,
                 "licence": "Apache / CC", "maintained": True, "wordsPerSec": 800},
                {"tool": "Natasha / Slovnet", "version": "1.x", "released": "2023", "context": "morphotag",
                 "licence": "MIT", "maintained": True, "wordsPerSec": 5000},
            ],
            "segalovich2003": {"snowballLostConflations": 487, "mystemLostConflations": 41, "ratio": 12},
        },
        "rerankersRu": {
            "_doc": "Rerankers for Russian, honestly: the multilingual cross-encoders do not publish a "
                    "Russian number, and the one ru-only cross-encoder was trained on machine-translated "
                    "mMARCO with no published evaluation at all. The only citable Russian reranker result "
                    "is RusBEIR's, and it is for bge-reranker-v2-m3.",
            "cite": "model cards + RusBEIR arXiv:2511.05079",
            "rows": [
                {"model": "bge-reranker-v2-m3", "paramsB": 0.60, "licence": "Apache-2.0", "ruNumber": "RusBEIR only"},
                {"model": "jina-reranker-v2-base-multilingual", "paramsB": 0.278, "licence": "CC-BY-NC (non-commercial)", "ruNumber": None},
                {"model": "Qwen3-Reranker-0.6B", "paramsB": 0.60, "licence": "Apache-2.0", "context": 32768, "ruNumber": None},
                {"model": "DiTy/cross-encoder-russian-msmarco", "paramsB": 0.18, "licence": "MIT",
                 "trainedOn": "machine-translated mmarco-ru", "ruNumber": None},
            ],
        },
        "yoStats": {
            "_doc": "MEASURED on FLORES-ru (231 992 Cyrillic letters): how rare ё is in professionally "
                    "written Russian, and how inconsistent it is INSIDE ONE corpus. The token price is "
                    "the sting: writing the letter doubles the cost of the word.",
            "cite": "measured on FLORES-200 ru; token counts on cl100k_base",
            "yoShareOfLettersPct": 0.163, "yoShareAmongYoEPct": 1.93, "cyrillicLetters": 231992,
            "pairs": [{"e": "все", "eCount": 60, "yo": "всё", "yoCount": 29},
                      {"e": "еще", "eCount": 27, "yo": "ещё", "yoCount": 23},
                      {"e": "ее", "eCount": 28, "yo": "её", "yoCount": 18},
                      {"e": "чем", "eCount": 57, "yo": "чём", "yoCount": 0}],
            "tokensVse": 1, "tokensVsyo": 2,
        },
        "luceneStop": {
            "_doc": "The trap the pipeline slide used to recommend without warning. In Elasticsearch the "
                    "`russian` analyzer chain is standard → lowercase → russian_stop → russian_keywords → "
                    "russian_stemmer: the STOP filter runs BEFORE the stemmer, and the stop list has no ё "
                    "forms at all. So «всё» survives stop-word removal while «все» does not — one lexeme, "
                    "two behaviours, because of an optional pair of dots. Cure: a ё→е char_filter BEFORE "
                    "the stop filter.",
            "cite": "Lucene russian_stop.txt / NLTK / spaCy sources",
            "luceneEntries": 159, "nltkEntries": 151, "spacyEntries": 768,
            "luceneYoEntries": 0,
            "chain": ["standard", "lowercase", "russian_stop", "russian_keywords", "russian_stemmer"],
            "examples": [{"inList": "все", "notInList": "всё"}, {"inList": "еще", "notInList": "ещё"},
                         {"inList": "его", "notInList": "её"}, {"inList": "чем", "notInList": "чём"}],
        },
        "confusables": {
            "_doc": "Unicode's own confusables data — the source of truth for homoglyph normalization.",
            "cite": "UTS #39 confusables.txt 17.0.0 (2025-07-22)",
            "cyrillicConfusables": 141, "lowerPairs": 7, "upperPairs": 12,
            "idnAttack": {"year": 2017, "author": "Xudong Zheng", "domain": "xn--80ak6aa92e.com",
                          "displayed": "аpple.com", "fixedIn": "Chrome 58"},
            "tokenCost": {"real": "Москва", "realTokens": 1, "fake": "Mocквa", "fakeTokens": 4},
        },
        "unicodeRu": {
            "_doc": "Two Unicode facts about Russian, one reassuring and one dangerous. Reassuring: there "
                    "is NO Turkish-I problem in Cyrillic — zero special-casing entries, so case folding is "
                    "1:1 and locale-independent. Dangerous: ё and й both DECOMPOSE under NFD, so the same "
                    "text can be two different byte strings. Rule: NFC on input, always.",
            "cite": "UnicodeData.txt / SpecialCasing.txt / CaseFolding.txt",
            "specialCasingCyrillic": 0, "caseFoldingFTCyrillic": 0,
            "decompositions": [{"char": "ё", "cp": "U+0451", "nfd": ["U+0435", "U+0308"]},
                               {"char": "й", "cp": "U+0439", "nfd": ["U+0438", "U+0306"]}],
            "phrase": {"text": "мой ёжик", "nfcCodepoints": 8, "nfdCodepoints": 10},
            "compositionExclusion": False,
        },
        "gost779": {
            "_doc": "Transliteration standards, and the correction the deck needs: the widely repeated "
                    "'GOST 7.79 gives щ → shch' is WRONG. System B gives shh, system A (= ISO 9) gives ŝ; "
                    "shch is the BGN / passport spelling. A user types none of the three.",
            "cite": "GOST 7.79-2000 (ISO 9:1995); FMS order No. 211 of 2014-03-26 (ICAO Doc 9303)",
            "standardNumber": 7.79,      # the standard's own number, gated so the deck cannot mistype it
            "systemA": {"щ": "ŝ", "ш": "š", "ж": "ž", "ч": "č", "х": "h", "ё": "ë", "ю": "û", "я": "â"},
            "systemB": {"щ": "shh", "ш": "sh", "ж": "zh", "ч": "ch", "х": "x", "ц": "cz/c",
                        "ё": "yo", "ю": "yu", "я": "ya", "й": "j", "ы": "y'", "э": "e'"},
            "pike": {"iso9": "ŝuka", "gostB": "shhuka", "bgn": "shchuka"},
            "surprise": {"word": "хорошо", "gostB": "xorosho"},
        },
        "yandexTypos": {
            "_doc": "The source for 'layout typos are massive in web search' the deck asserted without one.",
            "cite": "Yandex research, «Самые частые орфографические ошибки в поисковых запросах», H1 2012",
            "queriesPerDayMillions": 150, "shareWithAnError": 0.1,
            "shareOfErrorsThatAreTypos": 0.5,
            "thailandYPct": 85, "agentstvoLostTPct": 25,
        },
        "opencorpora": {
            "_doc": "Russian morphology in one number: ~12.5 surface forms per lexeme. That is BM25's "
                    "problem stated arithmetically — one lexeme's df is smeared across ~12 terms, so idf lies.",
            "cite": "OpenCorpora dictionary / pymorphy docs",
            "lexemes": 400000, "wordforms": 5000000, "paradigms": 3000,
            "formsPerLexeme": 12.5, "ramMb": 15,
        },
        "bpeVocabGrowth": {
            "_doc": "L2's own measurement, reused here as the mechanism explanation: growing the vocabulary "
                    "16-fold changed NOTHING for a Russian word, because no Cyrillic merges were learned.",
            "cite": "measured in L2 — _research/data/bpe_demo_tokens.json",
            "word": "привет", "vocabSizes": [1000, 4000, 16000], "tokens": [12, 12, 12],
        },
        "frontier": {
            "_doc": "The frontier slide used to name ByT5 (2021) and CANINE (2021) — history, not frontier. "
                    "What is actually moving in 2026: vocabulary budgets sized per language, byte-level "
                    "fallbacks inside production tokenizers, and instruction-tuned multilingual embedders "
                    "where the Russian gap is closed by data, not by architecture.",
            "cite": "field survey, 2026-08",
            "history": [{"model": "ByT5", "year": 2021}, {"model": "CANINE", "year": 2021}],
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
        "stemmer": stemmer_block(),
        "threeWay": bm25_three_way(),
        "paradigmWidget": paradigm_widget(),
        "stopwords": stopword_negation(),
        "yoLadder": yo_ladder(),
        "layout": layout_map(),
        "homoglyphs": homoglyphs(),
        "bytes": bytes_by_hand(),
    }
    (DATA / "l20-ru.json").write_text(json.dumps(ru, indent=2, ensure_ascii=False) + "\n")
    (DATA / "l20-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    t, b = ru["tokenTax"], ru["bm25"]
    print(f"[gen_l20] wrote data/l20-ru.json (tax {t['perWordEn']} vs {t['perWordRu']} tok/word = x{t['taxRatio']}; "
          f"BM25 gold rank {b['surface']['goldRank']} (score {b['surface']['goldScore']}) -> "
          f"{b['lemma']['goldRank']} (score {b['lemma']['goldScore']}), inversion={b['inversion']}) "
          f"+ data/l20-bench.json")
