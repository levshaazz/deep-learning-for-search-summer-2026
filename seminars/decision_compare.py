#!/usr/bin/env python3
"""Actual local Laya / hosted Jev on one frozen teaching protocol.

python scripts/decision_compare.py --backend laya --output run-laya.json
python scripts/decision_compare.py --backend jev --output run-jev.json
python scripts/decision_compare.py --replay run-laya.json
python scripts/decision_compare.py --compare run-jev.json run-laya.json

Archives contain raw responses, never API keys. No model download / network in
replay or comparison. A four-passage demonstration is not a benchmark.
"""
import argparse
from datetime import datetime, timezone
import importlib.metadata
import json
import math
import os
from pathlib import Path
import platform
import time
import urllib.error
import urllib.request
import warnings

import jev_e2e as demo

LAYA_MODEL = "convaiinnovations/laya"
LAYA_REVISION = "55cf4c4ebb4ebe31b2550e8bdf3bd21b99753851"
PINS = {"laya": "0.3.24", "torch": "2.8.0", "transformers": "4.57.6"}
CONTEXTS = {"insufficient": ["A"], "sufficient": ["C"],
            "complement": ["B", "E"], "conflict": ["C", "C-minus"]}
CONTEXT_GOLD = {"insufficient": 0, "sufficient": 1, "complement": 1, "conflict": 0}


def specification():
    return {"version": 1, "query": demo.QUERY, "corpus": demo.CORPUS,
            "extra": demo.EXTRA, "score": demo.SCORE, "noul": demo.NOUL,
            "gold": demo.GOLD, "contexts": CONTEXTS, "context_gold": CONTEXT_GOLD,
            "policy": demo.POLICY, "gain": "2**r-1", "binary_useful": "r>=2",
            "logloss_epsilon": 1e-12,
            "laya_wire_precision": {"decimals": 4, "normalization": "divide each rounded probability by their sum; validate rounding bounds first"},
            "gold_provenance": "author labels fixed before inference, not independent human judgments"}


def requests():
    rows = []
    for doc in sorted(demo.CORPUS):
        request = demo.score_request(doc)
        request.pop("model")
        rows.append(("pair/" + doc, request))
    for name, ids in CONTEXTS.items():
        request = demo.context_request(ids)
        request.pop("model")
        rows.append(("context/" + name, request))
    return rows


def distribution(response, backend):
    answer = response["answers"]["relevance"]
    if answer["type"] != "score" or set(answer["probabilities"]) != {"0", "1", "2", "3"}:
        raise ValueError("Expected a four-level Score distribution")
    p = [demo.probability(answer["probabilities"][str(i)]) for i in range(4)]
    if type(answer["score"]) not in (int, float) or not math.isfinite(answer["score"]):
        raise ValueError("Invalid Score mean")
    # Laya 0.3.24 agent._decode_answers rounds each probability and score to
    # four decimals. Four independent roundings allow at most 4 * 0.5e-4 mass
    # error; a rounded mean allows (0+1+2+3)*0.5e-4 + 0.5e-4 = 0.00035.
    # Do NOT relax the Jev contract or silently normalise arbitrary bad output.
    rounded = backend == "laya"
    if rounded and any(v != round(v, 4) for v in p):
        raise ValueError("Laya wire precision changed; review the adapter")
    if not math.isclose(sum(p), 1, rel_tol=0, abs_tol=0.000200001 if rounded else 1e-6):
        raise ValueError("Score distribution must sum to one")
    if not math.isclose(answer["score"], sum(i*v for i, v in enumerate(p)), rel_tol=0,
                        abs_tol=0.000350001 if rounded else 1e-5):
        raise ValueError("Score value disagrees with probabilities")
    return [v/sum(p) for v in p] if rounded else p


def binary_metrics(probabilities, labels):
    if not labels or len(probabilities) != len(labels) or any(type(y) is not int or y not in (0, 1) for y in labels):
        raise ValueError("Expected equally sized nonempty probabilities and binary labels")
    probabilities = [demo.probability(p) for p in probabilities]
    eps = specification()["logloss_epsilon"]
    return {"n": len(labels),
            "brier": sum((p-y)**2 for p, y in zip(probabilities, labels))/len(labels),
            "logloss": -sum(y*math.log(max(eps, min(1-eps, p)))
                           +(1-y)*math.log(max(eps, min(1-eps, 1-p)))
                           for p, y in zip(probabilities, labels))/len(labels)}


def validate_call(backend, call):
    if type(call["seconds"]) not in (int, float) or not math.isfinite(call["seconds"]) or call["seconds"] < 0:
        raise ValueError("Invalid call time")
    response = call["response"]
    if backend == "jev":
        if response["model"] != demo.MODEL:
            raise ValueError("Unexpected Jev model version")
        tokens = response["usage"]["input_tokens"]
        if type(tokens) is not int or tokens < 0:
            raise ValueError("Invalid API input-token usage")
    if backend == "laya" and response["usage"]["truncated"] is not False:
        raise ValueError("Laya truncated the shared input or omitted truncation status")
    if call["id"].startswith("pair/"):
        distribution(response, backend)
    else:
        answer = response["answers"]["answerable"]
        if answer["type"] != "noul":
            raise ValueError("Expected Noul answer")
        demo.probability(answer["noul"])


def summarize(record):
    expected = requests()
    calls = record["calls"]
    if len(calls) not in (8, 9):
        raise ValueError("Expected eight common calls, plus optional selected-context call")
    for call, (name, request) in zip(calls, expected):
        if call["id"] != name or call["request"] != request:
            raise ValueError("Input differs from the frozen shared protocol")
    gains, useful = {}, {}
    for call in calls:
        validate_call(record["backend"], call)
    for call, doc in zip(calls[:4], sorted(demo.CORPUS)):
        p = distribution(call["response"], record["backend"])
        gains[doc] = sum((2**i-1)*v for i, v in enumerate(p))
        useful[doc] = p[2]+p[3]
    ranked = demo.order(gains)
    controls = {}
    for call, name in zip(calls[4:8], CONTEXTS):
        answer = call["response"]["answers"]["answerable"]
        if answer["type"] != "noul":
            raise ValueError("Expected Noul answer")
        p = demo.probability(answer["noul"])
        action = "allow" if p > demo.POLICY["threshold"] else "defer"
        controls[name] = {"p": p, "gold": CONTEXT_GOLD[name], "action": action,
                          "loss": 9*(1-CONTEXT_GOLD[name]) if action == "allow" else 1}
    selected = next((controls[n] for n, ids in CONTEXTS.items() if ids == ranked[:1]), None)
    if selected is None:
        request = demo.context_request(ranked[:1]); request.pop("model")
        if len(calls) != 9 or calls[-1]["request"] != request or calls[-1]["id"] != "selected-context":
            raise ValueError("Missing actual gate call for the selected context")
        answer = calls[-1]["response"]["answers"]["answerable"]
        if answer["type"] != "noul":
            raise ValueError("Expected selected-context Noul answer")
        p = demo.probability(answer["noul"])
        selected = {"p": p, "action": "allow" if p > demo.POLICY["threshold"] else "defer"}
    elif len(calls) != 8:
        raise ValueError("Unexpected extra call")
    allowed = [v for v in controls.values() if v["action"] == "allow"]
    return {"baseline": demo.baseline(), "order": ranked, "expected_gains": gains,
            "ndcg3": demo.ndcg(ranked), "pair_usefulness": useful,
            "pair_metrics": binary_metrics(list(useful.values()), [int(demo.GOLD[d]>=2) for d in sorted(demo.CORPUS)]),
            "contexts": controls,
            "context_metrics": {**binary_metrics([v["p"] for v in controls.values()], list(CONTEXT_GOLD.values())),
                "coverage": len(allowed)/len(controls),
                "risk": sum(1-v["gold"] for v in allowed)/len(allowed) if allowed else None,
                "mean_loss": sum(v["loss"] for v in controls.values())/len(controls)},
            "output": {"action": selected["action"], "context_ids": ranked[:1],
                "cited_excerpt": demo.CORPUS[ranked[0]] if selected["action"] == "allow" else None,
                "generator_called": False},
            "common_call_seconds": sum(c["seconds"] for c in calls[:8]),
            "first_call_seconds": calls[0]["seconds"],
            "scope": "One authored EN query, four passages, four context cases; descriptive metrics only. No calibration or model-superiority conclusion."}


def replay_record(record):
    if record.get("status") != "complete" or record.get("provenance") != "actual-model-inference; authored teaching inputs":
        raise ValueError("Not a completed actual-inference archive")
    if record.get("backend") not in ("jev", "laya") or record.get("spec") != specification() or record.get("spec_sha256") != demo.digest(specification()):
        raise ValueError("Unknown backend or changed protocol")
    expected_model = {"id": LAYA_MODEL, "revision": LAYA_REVISION} if record["backend"] == "laya" else {"id": demo.MODEL}
    if record.get("model") != expected_model:
        raise ValueError("Unexpected model identity")
    if record["backend"] == "laya" and record.get("runtime", {}).get("packages") != PINS:
        raise ValueError("Unexpected Laya dependency versions")
    summary = summarize(record)
    if summary != record["summary"]:
        raise ValueError("Stored summary differs from raw responses")
    return record


def replay(path):
    return replay_record(json.loads(Path(path).read_text()))


def run(backend, output, device):
    if output.exists() or output.with_suffix(".partial.json").exists():
        raise ValueError("Choose a new output path; existing archives are never overwritten")
    if backend == "jev" and not os.environ.get("TYPESAFE_API_KEY"):
        raise ValueError("Set TYPESAFE_API_KEY outside source; no API call made")
    output.parent.mkdir(parents=True, exist_ok=True)
    record = {"schema_version": 1, "provenance": "actual-model-inference; authored teaching inputs",
              "backend": backend, "spec": specification(), "spec_sha256": demo.digest(specification()),
              "started_at": datetime.now(timezone.utc).isoformat(), "calls": [], "status": "incomplete",
              "runtime": {"python": platform.python_version(), "platform": platform.platform()}}
    def save(path):
        path.write_text(json.dumps(record, ensure_ascii=False, indent=2, allow_nan=False)+"\n")
    start = time.perf_counter()
    if backend == "laya":
        record["model"] = {"id": LAYA_MODEL, "revision": LAYA_REVISION}
        record["runtime"]["packages"] = {p: importlib.metadata.version(p) for p in PINS}
        if record["runtime"]["packages"] != PINS:
            raise ValueError("Use the pinned Laya environment")
        import torch
        import laya
        torch.manual_seed(17); torch.set_num_threads(4)
        print("Loading pinned Laya checkpoint (first use downloads weights)", flush=True)
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            agent = laya.load(LAYA_MODEL, revision=LAYA_REVISION, device=device, compile=False)
        record["runtime"]["load_warnings"] = [str(w.message) for w in caught]
        if agent.revision != LAYA_REVISION:
            raise ValueError("Checkpoint revision was not verified")
        record["runtime"]["device"] = str(agent.device)
        record["runtime"]["dtype"] = str(agent.dtype)
        record["runtime"]["threads"] = torch.get_num_threads()
        record["runtime"]["temperature"] = {"applied": agent.temperature,
            "by_options": agent.temperature_by_options, "raw": agent.temperature_raw,
            "raw_by_options": agent.temperature_by_options_raw}
        record["runtime"]["inference"] = {"max_len": 512, "head_max_len": 320, "compile": False}
        def infer(request):
            return agent.predict(**request, max_len=512, head_max_len=320)
    else:
        record["model"] = {"id": demo.MODEL}
        record["price_snapshot"] = demo.PRICE
        opener = urllib.request.build_opener(demo.NoRedirect())
        def infer(request):
            req = urllib.request.Request(demo.ENDPOINT, data=demo.encode({"model": demo.MODEL, **request}),
                headers={"Authorization": "Bearer "+os.environ["TYPESAFE_API_KEY"], "Content-Type": "application/json"})
            try:
                with opener.open(req, timeout=30) as response: return json.load(response)
            except urllib.error.HTTPError as error:
                raise RuntimeError(f"TypeSafe HTTP {error.code}; stopped without retries") from None
    record["load_seconds"] = time.perf_counter()-start
    save(output.with_suffix(".partial.json"))
    def call(name, request):
        print(backend, name, flush=True)
        start = time.perf_counter()
        response = infer(request)
        elapsed = time.perf_counter()-start
        record["calls"].append({"id": name, "request": request, "response": response, "seconds": elapsed})
        save(output.with_suffix(".partial.json"))
        # Preserve an invalid raw response for diagnosis, but stop BEFORE the
        # next (possibly billed) request. Contract errors are failures too.
        validate_call(backend, record["calls"][-1])
    for name, request in requests(): call(name, request)
    gains = {doc: sum((2**i-1)*p for i, p in enumerate(distribution(c["response"], backend)))
             for doc, c in zip(sorted(demo.CORPUS), record["calls"][:4])}
    if demo.order(gains)[:1] not in CONTEXTS.values():
        request = demo.context_request(demo.order(gains)[:1]); request.pop("model")
        call("selected-context", request)
    record["summary"] = summarize(record)
    record["status"] = "complete"
    record["completed_at"] = datetime.now(timezone.utc).isoformat()
    save(output)
    return replay(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--backend", choices=("laya", "jev"))
    mode.add_argument("--replay", type=Path)
    mode.add_argument("--compare", type=Path, nargs=2)
    parser.add_argument("--device", choices=("cpu", "mps", "cuda"), default="cpu")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if args.backend:
        if not args.output: parser.error("--backend requires --output")
        result = run(args.backend, args.output, args.device)["summary"]
    elif args.replay:
        result = replay(args.replay)["summary"]
    else:
        records = [replay(p) for p in args.compare]
        if {r["backend"] for r in records} != {"laya", "jev"}: raise ValueError("Provide one Jev and one Laya archive")
        result = {r["backend"]: r["summary"] for r in records}
    print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))


if __name__ == "__main__": main()
