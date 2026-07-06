#!/usr/bin/env python3
"""gen_l11.py — TOY (stdlib-only, pure-arithmetic) worked-example numbers for L11 "Judging the Oracle"
(RAG evaluation: RAGAS · LLM-as-judge · agentic RAG: ReAct / Self-RAG / CRAG).

Every TOY number is COMPUTED from frozen toy inputs (fraction / mean / argmax arithmetic) so the JSON is
byte-stable (H3, reproducible on bare /usr/bin/python3 — imports ONLY stdlib + genlib.write_json). The
three climbs:

  RAGAS (four metrics on ONE fixed q/contexts/answer/ground-truth):
    faithfulness     = supported answer-claims / answer-claims      = 3/4   = 0.75   (one claim hallucinated)
    answerRelevance  = mean cos(original-q, reverse-questions)       = (0.92+0.88+0.31)/3 = 0.7033
    contextPrecision = Σ_{rank k relevant} precision@k / #relevant   = (1/1 + 2/3)/2 = 0.8333  (relevant at ranks 1,3)
    contextRecall    = ground-truth claims attributable to context / #gt = 2/3 = 0.6667
  LLM-AS-JUDGE:
    pointwise rubric mean over 3 criteria; pairwise winner = argmax mean (A 4.0 > B 2.6667).
    GOODHART (gateable): over-weighting 'completeness' (×2) flips the winner — the honest-better answer A
    (mean 4.3333) loses to the verbose-worse answer C (length-biased 4.25 > 4.0). The score becomes a target.
  AGENTIC: a toy 2-hop ReAct trace whose recall climbs 0→1→1 as the second hop retrieves the missing fact;
    Self-RAG reflection tokens + CRAG grades are the L10 callbacks.

REAL numbers (frozen, measured): the LLM-as-judge biases + the ReAct trace come from a REAL llama3.1:8b run
(_research/exp_l11_ollama.py, run once, temp 0, seed 42) frozen in _research/data/l11_ollama_*.json. This
generator READS those committed artifacts (stdlib json) and splices a "real" block — deterministic, so
reproduce.sh reproduces data/ byte-identically and never re-runs the model. The headline real findings:
  verbosityPreferenceRate = 1.0 (the judge ALWAYS prefers the longer answer — Goodhart, empirically),
  positionFollowRateTie   = 0.6667 (under a tie it anchors to the slot), accuracyClear = 1.0,
  faithfulness planted hallucination CAUGHT = True; ReAct solved a 2-hop question in 3 steps.

Output: data/l11-ragas.json, data/l11-judge.json, data/l11-agentic.json, data/l11-bench.json
Run:  python3 _research/gen_l11.py     (stdlib only — runs on bare /usr/bin/python3 too)
"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RESEARCH = ROOT / "_research" / "data"
from genlib import write_json


def r(x, n=4):
    return round(float(x), n)


def load_frozen(name, fallback):
    """Read a committed Ollama artifact (stdlib). Fall back to the frozen constants (identical to the
    measured run) so output stays byte-stable even if the artifact is absent on some host."""
    try:
        return json.loads((RESEARCH / name).read_text())
    except Exception:
        return fallback


# ════════════════ RAGAS (toy worked example) ════════════════
def build_ragas():
    question = "How does the heart pump blood?"
    contexts = [
        {"id": "c1", "rank": 1, "relevant": True,
         "text": "The heart is a muscular organ that pumps blood through the circulatory system."},
        {"id": "c2", "rank": 2, "relevant": False,
         "text": "Blood type is determined by antigens on the surface of red blood cells."},
        {"id": "c3", "rank": 3, "relevant": True,
         "text": "Ventricular systole contracts the ventricles, ejecting blood into the arteries."},
        {"id": "c4", "rank": 4, "relevant": False,
         "text": "The average adult human has roughly five litres of blood."},
    ]
    answer_claims = [
        {"text": "The heart is a muscular organ that pumps blood.", "supported": True},
        {"text": "It contracts rhythmically.", "supported": True},
        {"text": "Ventricular systole ejects blood into the arteries.", "supported": True},
        {"text": "William Harvey discovered this circulation in 1628.", "supported": False},  # hallucinated
    ]
    gt_claims = [
        {"text": "The heart pumps blood through the body.", "inContext": True},
        {"text": "Ventricular systole ejects blood into the arteries.", "inContext": True},
        {"text": "Diastole then refills the heart chambers.", "inContext": False},  # true but not retrieved
    ]
    reverse_q_cos = [0.92, 0.88, 0.31]  # 3 questions reverse-engineered from the answer; #3 drifts

    supported = sum(1 for c in answer_claims if c["supported"])
    faithfulness = r(supported / len(answer_claims))                      # 3/4 = 0.75
    answer_relevance = r(sum(reverse_q_cos) / len(reverse_q_cos))         # 0.7033

    # context precision (RAGAS): Σ_{k: rel_k} precision@k / total_relevant
    rel_flags = [c["relevant"] for c in contexts]
    total_rel = sum(rel_flags)
    csum = 0.0
    prec_at = []
    for k in range(1, len(contexts) + 1):
        rel_in_topk = sum(rel_flags[:k])
        pk = rel_in_topk / k
        prec_at.append({"k": k, "precisionAtK": r(pk), "relevant": rel_flags[k - 1]})
        if rel_flags[k - 1]:
            csum += pk
    context_precision = r(csum / total_rel)                              # (1 + 2/3)/2 = 0.8333

    gt_in = sum(1 for c in gt_claims if c["inContext"])
    context_recall = r(gt_in / len(gt_claims))                           # 2/3 = 0.6667

    return {
        "_src": "toy worked example (gen_l11.py, stdlib) — RAGAS four metrics, hand-checkable fractions/means",
        "question": question, "contexts": contexts,
        "answerClaims": answer_claims, "groundTruthClaims": gt_claims,
        "reverseQuestionCos": reverse_q_cos,
        "k": len(contexts), "totalRelevant": total_rel, "precisionAtK": prec_at,
        "faithfulness": faithfulness, "answerRelevance": answer_relevance,
        "contextPrecision": context_precision, "contextRecall": context_recall,
        "supportedClaims": supported, "answerClaimCount": len(answer_claims),
        "groundTruthInContext": gt_in, "groundTruthCount": len(gt_claims),
    }


# ════════════════ LLM-AS-JUDGE (toy rubric + Goodhart flip) + REAL biases ════════════════
def build_judge():
    criteria = ["relevance", "grounding", "completeness"]
    answers = [
        {"id": "A", "scores": [5, 4, 3]},   # the better answer
        {"id": "B", "scores": [4, 2, 2]},   # the weaker answer
    ]
    for a in answers:
        a["mean"] = r(sum(a["scores"]) / len(a["scores"]))
    pairwise_winner = max(answers, key=lambda a: a["mean"])["id"]        # A (4.0 > 2.6667)

    # GOODHART (gateable): a length-biased judge over-weights 'completeness' (×2) and flips the winner.
    good = {"id": "A", "scores": [5, 5, 3]}    # concise, more correct
    gamed = {"id": "C", "scores": [4, 3, 5]}   # verbose, padded, weaker grounding
    for x in (good, gamed):
        x["honestMean"] = r(sum(x["scores"]) / 3)                        # A 4.3333 > C 4.0  (honest)
        x["lengthBiasedScore"] = r((x["scores"][0] + x["scores"][1] + 2 * x["scores"][2]) / 4)  # A 4.0 < C 4.25
    goodhart = {
        "honest": {"good": good["honestMean"], "gamed": gamed["honestMean"],
                   "winner": "A" if good["honestMean"] > gamed["honestMean"] else "C"},
        "lengthBiased": {"good": good["lengthBiasedScore"], "gamed": gamed["lengthBiasedScore"],
                         "winner": "A" if good["lengthBiasedScore"] > gamed["lengthBiasedScore"] else "C"},
        "goodScores": good["scores"], "gamedScores": gamed["scores"],
        "note": "Honest mean: A (4.3333) > C (4.0). Over-weight 'completeness' ×2 (a proxy for length) and "
                "C (4.25) beats A (4.0): the metric became a target. This is Goodhart's law — L1→L4→L11.",
    }

    # ── REAL llama3.1:8b judge findings (frozen) ──
    fb = {"positionBiasClear": {"accuracy": 1.0, "flipRate": 0.0, "firstSlotWinRate": 0.5, "n": 6},
          "positionBiasTie": {"positionFollowRate": 0.6667, "positionAnchored": 4, "n": 6},
          "verbosityBias": {"longerPreferenceRate": 1.0, "longerWins": 10, "n": 5},
          "faithfulness": {"caughtPlanted": True}}
    art = load_frozen("l11_ollama_judge.json", fb)
    pc, pt = art["positionBiasClear"], art["positionBiasTie"]
    vb, fa = art["verbosityBias"], art["faithfulness"]
    real = {
        "_model": art.get("_model", "llama3.1:8b"),
        "accuracyClear": r(pc["accuracy"]), "nClear": pc["n"],
        "positionFollowRateTie": r(pt["positionFollowRate"]), "positionAnchoredTie": pt["positionAnchored"], "nTie": pt["n"],
        "verbosityPreferenceRate": r(vb["longerPreferenceRate"]), "verbosityLongerWins": vb["longerWins"], "nVerbosity": vb["n"],
        "faithfulnessCaughtPlanted": bool(fa["caughtPlanted"]),
        "note": "Real llama3.1:8b judge (temp 0, seed 42). Accurate when quality is CLEAR (1.0), but anchors "
                "to slot under a TIE (0.6667) and ALWAYS prefers the longer answer (1.0) — Goodhart, measured.",
    }

    return {
        "_src": "toy rubric arithmetic (gen_l11.py) + REAL frozen llama3.1:8b judge runs",
        "rubric": {"criteria": criteria, "scaleMin": 1, "scaleMax": 5},
        "answers": answers, "pairwiseWinner": pairwise_winner,
        "goodhart": goodhart, "real": real,
    }


# ════════════════ AGENTIC (toy ReAct/Self-RAG/CRAG) + REAL ReAct trace ════════════════
def build_agentic():
    # toy 2-hop ReAct: recall@1 of the final fact climbs 0 → 1 → 1 as the 2nd hop (step 1) lands the missing fact
    toy_react = {
        "question": "What did the founder of Acme Corp study?",
        "steps": [
            {"step": 0, "thought": "I need the founder of Acme Corp.", "action": "lookup[Acme Corp]",
             "observation": "Acme Corp was founded by Dana Reyes.", "recallAt1": 0},
            {"step": 1, "thought": "Now find what Dana Reyes studied.", "action": "lookup[Dana Reyes]",
             "observation": "Dana Reyes studied computer science at MIT.", "recallAt1": 1},
            {"step": 2, "thought": "I can answer now.", "action": "finish[computer science at MIT]",
             "observation": None, "recallAt1": 1},
        ],
        "recallByStep": [0, 1, 1], "hops": 2, "solved": True,
    }
    self_rag = {  # callback to L10 self-RAG
        "reflectionTokens": ["Retrieve", "IsRel", "IsSup", "IsUse"],
        "note": "The model emits reflection tokens to gate retrieval and critique its own output (L10 callback).",
    }
    crag = {  # callback to L10 CRAG
        "grades": ["correct", "ambiguous", "wrong"],
        "actions": {"correct": "use as-is", "ambiguous": "combine + web search", "wrong": "discard, rewrite"},
        "note": "A retrieval evaluator grades each doc and branches — the L10 self-correcting loop (callback).",
    }

    fb = {"steps": 3, "solved": True, "finalAnswer": "Pragmatic Bookshelf",
          "question": "What publishing company did an author of the book 'The Pragmatic Programmer' co-found?",
          "transcript": [
              {"step": 0, "type": "lookup", "query": "the pragmatic programmer",
               "observation": "The book 'The Pragmatic Programmer' was written by Andrew Hunt and David Thomas."},
              {"step": 1, "type": "lookup", "query": "andrew hunt",
               "observation": "Andrew Hunt is a software author who co-founded the publisher Pragmatic Bookshelf."},
              {"step": 2, "type": "finish"},
          ]}
    art = load_frozen("l11_ollama_react.json", fb)
    real = {
        "_model": art.get("_model", "llama3.1:8b"),
        "question": art["question"], "steps": art["steps"], "solved": bool(art.get("solved")),
        "finalAnswer": art.get("finalAnswer"),
        "trace": [{"step": t["step"], "type": t["type"],
                   "query": t.get("query"), "observation": t.get("observation")} for t in art["transcript"]],
        "note": "Real llama3.1:8b ReAct loop (temp 0, seed 42): a 2-hop question solved in 3 steps "
                "(book → author → publisher → finish). Structure (an entity list) made the small model a capable agent.",
    }

    return {
        "_src": "toy ReAct/Self-RAG/CRAG trace (gen_l11.py) + REAL frozen llama3.1:8b ReAct trace",
        "react": toy_react, "selfRag": self_rag, "crag": crag, "real": real,
    }


# ════════════════ CITATIONS / benchmarks ════════════════
def build_bench():
    return {
        "_src": "L11 citations (RAG evaluation + agentic). DOIs/arXiv ids hand-verified.",
        "citations": [
            {"key": "ragas", "title": "RAGAS: Automated Evaluation of Retrieval Augmented Generation",
             "authors": "Es, James, Espinosa-Anke, Schockaert", "year": 2023, "arxiv": "2309.15217"},
            {"key": "llm-judge", "title": "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena",
             "authors": "Zheng et al.", "venue": "NeurIPS", "year": 2023, "arxiv": "2306.05685"},
            {"key": "react", "title": "ReAct: Synergizing Reasoning and Acting in Language Models",
             "authors": "Yao et al.", "venue": "ICLR", "year": 2023, "arxiv": "2210.03629"},
            {"key": "self-rag", "title": "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection",
             "authors": "Asai et al.", "venue": "ICLR", "year": 2024, "arxiv": "2310.11511"},
            {"key": "crag", "title": "Corrective Retrieval Augmented Generation",
             "authors": "Yan et al.", "year": 2024, "arxiv": "2401.15884"},
            {"key": "adaptive-rag", "title": "Adaptive-RAG: Learning to Adapt Retrieval-Augmented LLMs through Question Complexity",
             "authors": "Jeong et al.", "venue": "NAACL", "year": 2024, "arxiv": "2403.14403"},
            {"key": "verbosity-bias", "title": "Verbosity Bias in Preference Labeling by Large Language Models",
             "authors": "Saito et al.", "year": 2023, "arxiv": "2310.10076"},
        ],
    }


def main():
    write_json(DATA / "l11-ragas.json", build_ragas())
    write_json(DATA / "l11-judge.json", build_judge())
    write_json(DATA / "l11-agentic.json", build_agentic())
    write_json(DATA / "l11-bench.json", build_bench())
    print("[gen_l11] wrote l11-ragas.json, l11-judge.json, l11-agentic.json, l11-bench.json")


if __name__ == "__main__":
    main()
