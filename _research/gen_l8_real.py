#!/usr/bin/env python3
"""gen_l8_real.py — REAL late-interaction (ColBERT) + learned-sparse (SPLADE) numbers for L8 "The Alliance".

Turns the toy worked examples (gen_l8.py) into REAL ones with small HuggingFace models, the exact
gen_l7_real.py precedent: torch/transformers imported LAZILY (inside functions), run on /usr/bin/python3
(it has torch+transformers), deterministic (model.eval() + torch.no_grad() + torch.manual_seed(0)),
weights fetched once and cached to a gitignored HF_HOME. The frozen JSON it writes is a COMMITTED
artifact, EXCLUDED from the byte-identity proof: reproduce.sh runs it under the light vendored toolchain
where torch is absent, so it FAILS-SOFT and does NOT mutate data/ → H3 holds (only a "proof incomplete"
warning, exactly like gen_l7_real). It is NOT in requirements-repro.txt.

It READ-MERGES (splices) its "real" block into the EXISTING toy JSON (gen_l8.py wrote the "toy" blocks
first; reproduce.sh runs gen_l8 BEFORE gen_l8_real alphabetically), preserving those toy blocks. Models:
  • ColBERT MaxSim : per-token embeddings (colbert-ir/colbertv2.0 if loadable, else the documented
                     fallback: sentence-transformers/all-MiniLM-L6-v2 per-token, L2-normalized) → MaxSim
  • SPLADE         : naver/splade-cocondenser-ensembledistil (MLM-head logits → log(1+ReLU), max-pool)

Two parts → two frozen "real" blocks:
  1. real ColBERT MaxSim on the river/bank/flood pair → data/l8-colbert.json  "real"
  2. real SPLADE expansion terms for "river flood"     → data/l8-splade.json   "real"

Each part is independently fail-soft: a checkpoint that will not load leaves its toy block untouched.

Run:  /usr/bin/python3 _research/gen_l8_real.py
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

COLBERT_MODEL = "colbert-ir/colbertv2.0"
TOKEN_FALLBACK = "sentence-transformers/all-MiniLM-L6-v2"
SPLADE_MODEL = "naver/splade-cocondenser-ensembledistil"
SEED = 0


def r(x, n=4):
    return round(float(x), n)


def _torch():
    import torch
    torch.set_num_threads(1)
    torch.manual_seed(SEED)
    return torch


def splice(path, **blocks):
    """Read the existing (toy) JSON, set ONLY the given top-level blocks, rewrite — matching
    genlib.write_json's serialisation (indent=2, ensure_ascii=False, one trailing newline) so the whole
    file stays byte-consistent. Never touches the frozen 'toy' block."""
    obj = json.loads(path.read_text())
    for k, v in blocks.items():
        obj[k] = v
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


# ═══════════════════════ PART 1 · real ColBERT-style MaxSim ═══════════════════════
def per_token_embeddings(model_name, texts):
    """Per-token, L2-normalized last_hidden_state (drop [CLS]/[SEP] padding via attention mask)."""
    torch = _torch()
    from transformers import AutoTokenizer, AutoModel
    tok = AutoTokenizer.from_pretrained(model_name)
    try:
        model = AutoModel.from_pretrained(model_name, use_safetensors=False, low_cpu_mem_usage=False)
    except Exception:
        model = AutoModel.from_pretrained(model_name)
    model.eval()
    out = []
    for t in texts:
        enc = tok(t, return_tensors="pt", truncation=True, max_length=64)
        with torch.no_grad():
            h = model(**enc).last_hidden_state[0]              # (T, D)
        mask = enc["attention_mask"][0].bool()
        h = h[mask]                                            # keep real tokens
        h = torch.nn.functional.normalize(h, p=2, dim=1)      # L2-normalize per token
        out.append(h)
    return out


def max_sim(Eq, Ed):
    """ColBERT MaxSim: sum over query tokens of the max cosine over doc tokens (both L2-normalized)."""
    torch = _torch()
    sims = Eq @ Ed.T                                           # (|q|, |d|)
    return float(sims.max(dim=1).values.sum())


def part1_colbert():
    query = "river bank flood"
    docRel = "the riverside plain flooded"
    docIrr = "the bank approved a loan"
    used = COLBERT_MODEL
    try:
        Eq, Er, Ei = per_token_embeddings(COLBERT_MODEL, [query, docRel, docIrr])
    except Exception:
        used = TOKEN_FALLBACK
        Eq, Er, Ei = per_token_embeddings(TOKEN_FALLBACK, [query, docRel, docIrr])
    msr, msi = max_sim(Eq, Er), max_sim(Eq, Ei)
    real = {
        "model": used, "dim": int(Eq.shape[1]), "normalized": True,
        "pair": {"query": query, "docRel": docRel, "docIrr": docIrr},
        "maxSimRel": r(msr), "maxSimIrr": r(msi),
        "note": "per-token L2-normalized embeddings; MaxSim = sum_i max_j cos; eval()+no_grad()+manual_seed(0); "
                "committed frozen. Toy and real agree on ORDERING (maxSimRel > maxSimIrr), not magnitude.",
    }
    splice(DATA / "l8-colbert.json", real=real)
    print(f"[l8-real] colbert  model={used}  maxSimRel={real['maxSimRel']} > maxSimIrr={real['maxSimIrr']}")
    return real


# ═══════════════════════ PART 2 · real SPLADE expansion ═══════════════════════
def part2_splade(k=12):
    torch = _torch()
    from transformers import AutoTokenizer, AutoModelForMaskedLM
    tok = AutoTokenizer.from_pretrained(SPLADE_MODEL)
    try:
        model = AutoModelForMaskedLM.from_pretrained(SPLADE_MODEL, use_safetensors=False, low_cpu_mem_usage=False)
    except Exception:
        model = AutoModelForMaskedLM.from_pretrained(SPLADE_MODEL)
    model.eval()
    query = "river flood"
    enc = tok(query, return_tensors="pt")
    with torch.no_grad():
        logits = model(**enc).logits[0]                        # (T, |V|)
    # SPLADE weight per vocab term: log(1+ReLU(logit)) then max-pool over positions.
    weights = torch.log1p(torch.relu(logits)).max(dim=0).values   # (|V|,)
    vals, idx = torch.topk(weights, k)
    literal = set(query.split())
    top = []
    for v, i in zip(vals.tolist(), idx.tolist()):
        term = tok.convert_ids_to_tokens(i)
        top.append({"term": term, "weight": r(v), "expansion": term not in literal})
    real = {
        "model": SPLADE_MODEL, "query": query,
        "queryTopTerms": top,
        "note": "MLM-head logits → log(1+ReLU), max-pooled over positions; top-k by weight; "
                "eval()+no_grad()+manual_seed(0); committed frozen. 'expansion'=true for non-literal terms.",
    }
    splice(DATA / "l8-splade.json", real=real)
    print(f"[l8-real] splade   top={[t['term'] for t in top[:6]]}")
    return real


def main() -> int:
    DATA.mkdir(parents=True, exist_ok=True)
    ok = 0
    try:
        part1_colbert(); ok += 1
    except Exception as e:
        print(f"[l8-real] colbert SKIPPED (fail-soft): {type(e).__name__}: {e}")
    try:
        part2_splade(); ok += 1
    except Exception as e:
        print(f"[l8-real] splade SKIPPED (fail-soft): {type(e).__name__}: {e}")
    if ok == 0:
        print("[l8-real] no torch / no checkpoints → toy blocks untouched ('proof incomplete'; H3 byte-identity intact)")
    else:
        print(f"[l8-real] done — spliced {ok}/2 real block(s) into l8-colbert/l8-splade")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
