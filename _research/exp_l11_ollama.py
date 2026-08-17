#!/usr/bin/env python3
"""exp_l11_ollama.py — REAL local-LLM experiments for L11 "Judging the Oracle"
(RAG evaluation · LLM-as-judge · agentic RAG).

WHY THIS IS A run-once SCRIPT, NOT a gen_*.py:
  reproduce.sh re-runs every _research/gen_*.py under the frozen CPython-3.9 toolchain and proves
  data/ + _research/data/ are BYTE-IDENTICAL (H3). A local LLM is only ~deterministic (seed+temp 0
  is stable on one machine/build but not across them), and Ollama is absent on CI. So the REAL run
  lives HERE, run ONCE by a human, FREEZING its transcripts + tallies into a committed artifact
  (_research/data/l11_ollama_*.json). The deterministic gen_l11.py then READS that frozen artifact
  (stdlib only) → data/l11-*.json. reproduce.sh re-runs gen_l11.py (frozen input + integer/× arithmetic
  → byte-identical) and never re-runs THIS, so the frozen artifact never drifts. H3 stays airtight and
  the numbers are genuinely measured (the transcripts are in the artifact for audit).

EXPERIMENTS (model: llama3.1:8b via the Ollama HTTP API at 127.0.0.1:11434, temperature 0, seed 42):
  E1  position bias   — the SAME good/bad answer pair judged in BOTH orders; a flip on swap is the
                        judge contradicting itself by POSITION alone (Goodhart: optimise the judge and
                        you game position, not quality). Reports flipRate + firstSlotWinRate.
  E2  verbosity bias  — concise-correct vs the SAME content padded longer; judged in both orders.
                        Reports longerPreferenceRate (0.5 = unbiased; >0.5 = the judge rewards length).
  E3  faithfulness    — the toy RAG answer (one planted UNSUPPORTED claim) + its context; the judge is
                        asked to list unsupported claims. Reports whether it CAUGHT the planted one.
  E4  ReAct trace     — a real 2-hop question over a tiny 3-fact KB with a lookup tool; the model emits
                        Thought/Action: lookup[..]; the harness returns Observation; loop to finish[..].
                        Captures the full agentic trace (used by the agentic-loop widget as the REAL run).

Run (ONCE, with Ollama up):  python3 _research/exp_l11_ollama.py
Output: _research/data/l11_ollama_judge.json, _research/data/l11_ollama_react.json
"""
from __future__ import annotations
import json, pathlib, urllib.request, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "_research" / "data"
MODEL = "llama3.1:8b"
API = "http://127.0.0.1:11434/api/generate"
OPTS = {"temperature": 0, "seed": 42, "num_predict": 220, "top_p": 1, "top_k": 1}


def gen(prompt, num_predict=None):
    """One deterministic completion from the local model (stdlib urllib; no ollama-py needed)."""
    opts = dict(OPTS)
    if num_predict:
        opts["num_predict"] = num_predict
    body = json.dumps({"model": MODEL, "prompt": prompt, "stream": False, "options": opts}).encode()
    req = urllib.request.Request(API, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read())["response"].strip()


def pick_AB(text):
    """Parse a judge verdict to 'A' / 'B' / '?'. Prefer an explicit 'Answer A/B', else first A|B token."""
    t = text.upper()
    m = re.search(r"\b(ANSWER\s*)?([AB])\b", t)
    return m.group(2) if m else "?"


# ════════════════ E1 · POSITION BIAS ════════════════
# 6 (question, good, bad) items: `good` is the more faithful/correct answer. We judge each in BOTH
# orders. A judge that tracked QUALITY would pick `good` both times (no flip). A flip on order swap is
# pure position bias — the Goodhart failure mode of LLM-as-judge.
JUDGE_PAIRS = [
    {"q": "What pumps blood through the body?",
     "good": "The heart pumps blood through the body via rhythmic contractions of its ventricles.",
     "bad":  "The lungs pump blood through the body by inflating and deflating during breathing."},
    {"q": "What is the capital of Japan?",
     "good": "The capital of Japan is Tokyo.",
     "bad":  "The capital of Japan is Kyoto, which has held that role continuously to the present day."},
    {"q": "Why does overlap help chunking recall?",
     "good": "Overlap lets a sliding window contain an answer span whole even when it straddles a chunk boundary.",
     "bad":  "Overlap helps recall because larger chunks always store more total tokens, so nothing is lost."},
    {"q": "What does cosine similarity measure?",
     "good": "Cosine similarity measures the angle between two vectors, ignoring their magnitudes.",
     "bad":  "Cosine similarity measures the straight-line distance between two vectors in space."},
    {"q": "What is recall@k?",
     "good": "Recall@k is the fraction of all relevant items that appear in the top k results.",
     "bad":  "Recall@k is the fraction of the top k results that the user actually clicked on."},
    {"q": "What is HNSW?",
     "good": "HNSW is a graph-based approximate nearest-neighbour index that does greedy search over a multi-layer small-world graph.",
     "bad":  "HNSW is a hashing scheme that buckets vectors by their exact coordinates for O(1) exact lookup."},
]

JUDGE_TMPL = ("You are grading two candidate answers to a question. Pick the single better answer.\n"
              "Question: {q}\n\nAnswer A: {a}\n\nAnswer B: {b}\n\n"
              "Which answer is better? Reply with exactly one character: A or B.")


def run_position_bias():
    trials, flips, firstslot_wins, correct = [], 0, 0, 0
    for it in JUDGE_PAIRS:
        # order 1: good=A, bad=B
        r1 = gen(JUDGE_TMPL.format(q=it["q"], a=it["good"], b=it["bad"]), num_predict=6)
        v1 = pick_AB(r1)                       # 'A' means it picked GOOD
        # order 2: bad=A, good=B
        r2 = gen(JUDGE_TMPL.format(q=it["q"], a=it["bad"], b=it["good"]), num_predict=6)
        v2 = pick_AB(r2)                       # 'A' means it picked BAD
        picked_good_1 = (v1 == "A")
        picked_good_2 = (v2 == "B")
        flip = (picked_good_1 != picked_good_2)     # same content, choice changed by order alone
        if flip:
            flips += 1
        if v1 == "A":
            firstslot_wins += 1
        if v2 == "A":
            firstslot_wins += 1
        correct += int(picked_good_1) + int(picked_good_2)
        trials.append({"q": it["q"], "order1_verdict": v1, "order2_verdict": v2,
                       "pickedGoodOrder1": picked_good_1, "pickedGoodOrder2": picked_good_2,
                       "flipped": flip, "raw1": r1[:120], "raw2": r2[:120]})
    n = len(JUDGE_PAIRS)
    return {"n": n, "trials": trials,
            "flips": flips, "flipRate": round(flips / n, 4),
            "firstSlotWins": firstslot_wins, "firstSlotWinRate": round(firstslot_wins / (2 * n), 4),
            "correctPicks": correct, "accuracy": round(correct / (2 * n), 4)}


# ── E1b · position bias under a TIE (two equally-valid answers; no quality signal) ──
# When quality is clear (above) a good judge tracks it. The bias surfaces when answers TIE: with no
# content signal, does the verdict follow the SLOT (A/B) or the CONTENT? Same letter in both orders =
# the judge is anchored to position. positionFollowRate is the headline (1.0 = pure position anchoring).
TIE_PAIRS = [
    {"q": "Name a graph-based approximate-nearest-neighbour index.",
     "x": "HNSW — a hierarchical navigable small-world graph.",
     "y": "NSW — a navigable small-world graph."},
    {"q": "Name a sparse lexical retrieval method.",
     "x": "BM25, a bag-of-words ranking function.",
     "y": "TF-IDF, a term-weighting scheme."},
    {"q": "Name a way to rewrite a query before retrieval.",
     "x": "HyDE — embed a hypothetical answer.",
     "y": "Multi-query — expand into several paraphrases."},
    {"q": "Name a chunking strategy for RAG.",
     "x": "Fixed-size chunks with overlap.",
     "y": "Recursive splitting on document structure."},
    {"q": "Name a dense-retrieval encoder family.",
     "x": "Bi-encoders such as DPR.",
     "y": "Sentence-transformers such as SBERT."},
    {"q": "Name a rank-fusion method.",
     "x": "Reciprocal rank fusion (RRF).",
     "y": "CombSUM score fusion."},
]


def run_position_tie():
    trials, follow = [], 0
    for it in TIE_PAIRS:
        r1 = gen(JUDGE_TMPL.format(q=it["q"], a=it["x"], b=it["y"]), num_predict=6)
        v1 = pick_AB(r1)
        r2 = gen(JUDGE_TMPL.format(q=it["q"], a=it["y"], b=it["x"]), num_predict=6)
        v2 = pick_AB(r2)
        anchored = (v1 == v2 and v1 in ("A", "B"))   # same SLOT won both times → position-anchored
        if anchored:
            follow += 1
        trials.append({"q": it["q"], "order1_verdict": v1, "order2_verdict": v2,
                       "positionAnchored": anchored, "raw1": r1[:60], "raw2": r2[:60]})
    n = len(TIE_PAIRS)
    return {"n": n, "trials": trials, "positionAnchored": follow,
            "positionFollowRate": round(follow / n, 4)}


# ════════════════ E2 · VERBOSITY BIAS ════════════════
# Same correct content; `verbose` just pads with filler. A length-blind judge is ~50/50.
VERBOSITY_PAIRS = [
    {"q": "What is BM25?",
     "concise": "BM25 is a bag-of-words ranking function scoring documents by TF saturation and IDF.",
     "verbose": ("BM25, which stands for Best Match 25, is a very widely used and extremely popular bag-of-words "
                 "ranking function that scores documents by combining term-frequency saturation together with "
                 "inverse-document-frequency weighting, and it is, generally speaking, considered a strong baseline.")},
    {"q": "What is a cross-encoder?",
     "concise": "A cross-encoder jointly encodes the query and document together to score their relevance.",
     "verbose": ("A cross-encoder is a type of neural model that, rather than encoding the query and the document "
                 "separately, instead takes both the query and the document together as a single concatenated input "
                 "and jointly encodes them, thereby producing a single relevance score for that specific pair.")},
    {"q": "What is faithfulness in RAG?",
     "concise": "Faithfulness is the fraction of an answer's claims that are supported by the retrieved context.",
     "verbose": ("Faithfulness, in the context of retrieval-augmented generation evaluation, refers essentially to "
                 "the proportion or fraction of the individual factual claims made within a generated answer that "
                 "can actually be supported by, or grounded in, the retrieved context that was provided to the model.")},
    {"q": "What is nDCG?",
     "concise": "nDCG is DCG normalised by the ideal DCG, rewarding relevant items ranked higher.",
     "verbose": ("nDCG, or normalised discounted cumulative gain, is a ranking metric that takes the discounted "
                 "cumulative gain of a ranking and then normalises it by dividing through by the ideal discounted "
                 "cumulative gain, so that the resulting score rewards placing the more relevant items higher up.")},
    {"q": "What is query rewriting?",
     "concise": "Query rewriting transforms a query (e.g. HyDE, multi-query) to retrieve better.",
     "verbose": ("Query rewriting is the general technique of taking the user's original query and transforming or "
                 "reformulating it in some way, for example through HyDE or through multi-query expansion, with the "
                 "overall goal of improving the quality and recall of the documents that get retrieved.")},
]


def run_verbosity_bias():
    trials, longer_wins = [], 0
    for it in VERBOSITY_PAIRS:
        r1 = gen(JUDGE_TMPL.format(q=it["q"], a=it["concise"], b=it["verbose"]), num_predict=6)
        v1 = pick_AB(r1)                       # 'B' means longer wins
        r2 = gen(JUDGE_TMPL.format(q=it["q"], a=it["verbose"], b=it["concise"]), num_predict=6)
        v2 = pick_AB(r2)                       # 'A' means longer wins
        longer_1 = (v1 == "B")
        longer_2 = (v2 == "A")
        longer_wins += int(longer_1) + int(longer_2)
        trials.append({"q": it["q"], "order1_verdict": v1, "order2_verdict": v2,
                       "longerWonOrder1": longer_1, "longerWonOrder2": longer_2,
                       "lenConcise": len(it["concise"]), "lenVerbose": len(it["verbose"]),
                       "raw1": r1[:80], "raw2": r2[:80]})
    n = len(VERBOSITY_PAIRS)
    n_judgements = 2 * n                   # each pair is judged TWICE (both slot orders) → the rate's
    return {"n": n,                        # denominator is JUDGEMENTS, not pairs: rate = longerWins/nJudgements
            "nJudgements": n_judgements, "trials": trials, "longerWins": longer_wins,
            "longerPreferenceRate": round(longer_wins / n_judgements, 4)}


# ════════════════ E3 · FAITHFULNESS JUDGE ════════════════
# The toy RAG answer has 4 atomic claims; claim #3 ("...discovered in 1628") is UNSUPPORTED by context.
FAITH_CONTEXT = ("[1] The heart is a muscular organ that pumps blood through the circulatory system. "
                 "[2] It contracts rhythmically; ventricular systole ejects blood into the arteries. "
                 "[3] One-way valves prevent backflow between the chambers.")
FAITH_ANSWER = ("The heart is a muscular organ that pumps blood. It contracts rhythmically, and ventricular "
                "systole ejects blood into the arteries. William Harvey discovered this circulation in 1628. "
                "One-way valves prevent backflow between the chambers.")
FAITH_PLANTED = "William Harvey discovered this circulation in 1628"
FAITH_PROMPT = ("Given the CONTEXT and an ANSWER, list every claim in the ANSWER that is NOT supported by the "
                "CONTEXT. If every claim is supported, reply 'NONE'.\n\nCONTEXT:\n{c}\n\nANSWER:\n{a}\n\n"
                "Unsupported claims:")


def run_faithfulness():
    resp = gen(FAITH_PROMPT.format(c=FAITH_CONTEXT, a=FAITH_ANSWER), num_predict=160)
    low = resp.lower()
    caught = ("harvey" in low) or ("1628" in low) or ("discover" in low)
    return {"context": FAITH_CONTEXT, "answer": FAITH_ANSWER, "plantedUnsupported": FAITH_PLANTED,
            "judgeResponse": resp, "caughtPlanted": caught}


# ════════════════ E4 · ReAct TRACE ════════════════
# A 2-hop question over a tiny KB with a single tool: lookup[entity] → fact. The model must chain two
# lookups (author of the book → that author's birth city) — single-hop retrieval cannot answer it.
KB = {
    "The Pragmatic Programmer": "The book 'The Pragmatic Programmer' was written by Andrew Hunt and David Thomas.",
    "Andrew Hunt": "Andrew Hunt is a software author who co-founded the publisher Pragmatic Bookshelf.",
    "David Thomas": "David Thomas is a programmer and author who co-wrote The Pragmatic Programmer.",
    "Pragmatic Bookshelf": "The Pragmatic Bookshelf is a publisher of software-development books founded in 2003.",
}
REACT_Q = ("What publishing company did an author of the book 'The Pragmatic Programmer' co-found?")
REACT_SYS = (
    "Answer the question with a ReAct loop. On each turn output ONE Thought line and then ONE action line:\n"
    "  Thought: <one short reasoning step>\n"
    "  Action: lookup[<entity>]      (read one fact from the knowledge base)\n"
    "or, once you can answer:\n"
    "  Action: finish[<final answer>]\n"
    "Look up entities by their EXACT name. Available entities: "
    + "; ".join(KB.keys()) + ".\n\n"
    "Question: " + REACT_Q + "\n")


def kb_lookup(query):
    """Robust KB match: normalise underscores/punctuation → spaces, then pick the BEST-overlap entity
    (max shared tokens, tie-break longest key) so 'A Hunt and David Thomas' doesn't grab David Thomas."""
    qn = re.sub(r"[_\W]+", " ", query).strip().lower()
    qt = set(qn.split())
    for k, v in KB.items():                              # exact / substring first
        kn = k.lower()
        if kn == qn or kn in qn or qn in kn:
            return v
    best, best_score = None, 0
    for k, v in KB.items():
        ov = len(set(k.lower().split()) & qt)
        if ov > best_score or (ov == best_score and best and len(k) > len(best[0])):
            best, best_score = (k, v), ov
    return best[1] if best and best_score >= 1 else "No record found."


def run_react(max_steps=7):
    transcript, scratch = [], ""
    final = None
    for step in range(max_steps):
        out = gen(REACT_SYS + scratch + "\n", num_predict=90)
        lines = [l.strip() for l in out.splitlines() if l.strip()]
        # take the FIRST action line if any (the model often emits a Thought then an Action together);
        # capture a preceding thought as the step's reasoning.
        act = next((l for l in lines if re.search(r"Action:\s*(lookup|finish)\[", l, re.I)), None)
        thought = next((l for l in lines if re.search(r"Thought:", l, re.I)), None)
        entry = {"step": step, "model": (act or thought or (lines[0] if lines else ""))[:200]}
        if thought:
            entry["thought"] = re.sub(r"^Thought:\s*", "", thought, flags=re.I)[:200]
        if act and re.search(r"finish\[", act, re.I):
            final = re.search(r"finish\[(.+?)\]", act, re.I).group(1).strip()
            entry["type"] = "finish"
            transcript.append(entry)
            break
        elif act:
            key = re.search(r"lookup\[(.+?)\]", act, re.I).group(1).strip().lower().strip("'\"")
            obs = kb_lookup(key)
            entry.update({"type": "lookup", "query": key, "observation": obs})
            scratch += f"\n{act}\nObservation: {obs}"
            transcript.append(entry)
        else:
            entry["type"] = "thought"
            scratch += f"\n{thought or (lines[0] if lines else '')}"
            transcript.append(entry)
    return {"question": REACT_Q, "kb": KB, "transcript": transcript, "finalAnswer": final,
            "steps": len(transcript), "solved": final is not None}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"[exp-l11] model={MODEL} (temp 0, seed 42). Running real judge experiments…")

    print("[exp-l11] E1 position bias (clear pairs)…")
    pos = run_position_bias()
    print(f"          flipRate={pos['flipRate']}  firstSlotWinRate={pos['firstSlotWinRate']}  acc={pos['accuracy']}")

    print("[exp-l11] E1b position bias (TIE pairs)…")
    postie = run_position_tie()
    print(f"          positionFollowRate={postie['positionFollowRate']}")

    print("[exp-l11] E2 verbosity bias…")
    verb = run_verbosity_bias()
    print(f"          longerPreferenceRate={verb['longerPreferenceRate']}")

    print("[exp-l11] E3 faithfulness judge…")
    faith = run_faithfulness()
    print(f"          caughtPlanted={faith['caughtPlanted']}")

    judge = {"_model": MODEL, "_frozen": True,
             "_note": "Real llama3.1:8b judge runs (temp 0, seed 42). Frozen transcripts + tallies; "
                      "read by gen_l11.py. Re-running may differ across machines — these are the committed values.",
             "positionBiasClear": pos, "positionBiasTie": postie, "verbosityBias": verb, "faithfulness": faith}
    (OUT / "l11_ollama_judge.json").write_text(json.dumps(judge, indent=2, ensure_ascii=False) + "\n")
    print(f"[exp-l11] wrote {OUT / 'l11_ollama_judge.json'}")

    print("[exp-l11] E4 ReAct trace…")
    react = run_react()
    react = {"_model": MODEL, "_frozen": True, **react}
    (OUT / "l11_ollama_react.json").write_text(json.dumps(react, indent=2, ensure_ascii=False) + "\n")
    print(f"[exp-l11] wrote {OUT / 'l11_ollama_react.json'}  (steps={react['steps']}, final={react['finalAnswer']!r})")
    print("[exp-l11] done.")


if __name__ == "__main__":
    main()
