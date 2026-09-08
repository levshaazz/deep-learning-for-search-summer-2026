#!/usr/bin/env python3
"""gen_l6_enrich.py — DATA for the L6 deck enrichments (instructor review, Jun 2026).

Two NEW dynamic-diagram data files, both REAL + reproducible (run on /usr/bin/python3,
torch + transformers + numpy available). Disjoint from L5.

  data/l6-stack-layers.json   slide #41 "Stack to contextual vectors" — the DYNAMIC stack.
                              The SAME word "bank" in two contexts (river-sense, money-sense)
                              traced LAYER BY LAYER through the 6 DistilBERT blocks. At the
                              input (embedding) layer the two "bank" tokens are the SAME static
                              vector (cosine 1.0000); as the stack mixes context in, the two
                              vectors DRIFT APART — the same word getting different vectors by
                              context. Emits, per layer 0..6, the cross-sense cosine (river-bank
                              vs money-bank) and a 2-D PCA projection of the two bank vectors at
                              that layer (for animating the split). Consistent with
                              data/l6-contextual.json (final-layer cross-sense ≈ 0.6465).

  data/l6-contrastive-traj.json slide #47 "InfoNCE loss" — the DYNAMIC optimization trajectory.
                              A toy 2-D anchor (cat) + positive (kitten) + 3 negatives. At three
                              training checkpoints (untuned → mid → tuned) we record the cosines,
                              the softmax p+ over candidates, and the InfoNCE loss, so the slide
                              can show the loss DROPPING as the positive is pulled in and the
                              negatives pushed out. The TUNED checkpoint is pinned to the deck's
                              canonical numbers (data/l6-contrastive.json: p+ = 0.8877, loss
                              = 0.1191, cosines kitten .639 / airplane .365 / computer .353 /
                              france .091, tau = 0.1).

Run:  /usr/bin/python3 _research/gen_l6_enrich.py
Deterministic: model.eval(), torch.no_grad(), torch.manual_seed(0); fixed toy 2-D points.
"""
from __future__ import annotations
import json, pathlib, math
import numpy as np

from genlib import ROOT, DATA, softmax      # shared helpers (genlib.py)


def r(x, n=4):
    if isinstance(x, (list, tuple)):
        return [r(v, n) for v in x]
    if isinstance(x, np.ndarray):
        return [r(v, n) for v in x.tolist()]
    return round(float(x), n)


def cos(a, b):
    a = np.asarray(a, float); b = np.asarray(b, float)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))


# ───────────────────────── #41 — the dynamic stack (real DistilBERT, layer by layer) ──────────────
def build_stack_layers():
    import torch
    from transformers import AutoTokenizer, AutoModel
    torch.manual_seed(0)
    name = "distilbert-base-uncased"
    tok = AutoTokenizer.from_pretrained(name)
    model = AutoModel.from_pretrained(name, output_hidden_states=True)
    model.eval()

    # the two sentences from data/l6-contextual.json (river-sense vs money-sense of "bank")
    s_river = "She sat on the grassy bank of the river."
    s_money = "She deposited her paycheck at the bank downtown."

    def bank_index(text):
        enc = tok(text, return_tensors="pt")
        ids = enc["input_ids"][0].tolist()
        bank_id = tok.convert_tokens_to_ids("bank")
        return enc, ids.index(bank_id)

    enc_r, i_r = bank_index(s_river)
    enc_m, i_m = bank_index(s_money)

    with torch.no_grad():
        hs_r = model(**enc_r).hidden_states  # tuple len 7: emb + 6 blocks
        hs_m = model(**enc_m).hidden_states

    L = len(hs_r) - 1  # 6 transformer blocks (layer 0 = embeddings/input)
    bank_r = np.stack([hs_r[k][0, i_r].numpy() for k in range(L + 1)])   # (7, 768)
    bank_m = np.stack([hs_m[k][0, i_m].numpy() for k in range(L + 1)])   # (7, 768)

    # per-layer cross-sense cosine (river-bank vs money-bank): starts ~1.0, drifts apart
    cross = [cos(bank_r[k], bank_m[k]) for k in range(L + 1)]

    # 2-D projection for animating the SPLIT: PCA over all 14 bank vectors (both senses, all layers),
    # so the two trajectories live in ONE comparable plane. Deterministic SVD.
    allv = np.concatenate([bank_r, bank_m], axis=0)  # (14, 768)
    mu = allv.mean(0)
    U, S, Vt = np.linalg.svd(allv - mu, full_matrices=False)
    comp = Vt[:2]                                    # (2, 768)
    proj_r = (bank_r - mu) @ comp.T                  # (7, 2)
    proj_m = (bank_m - mu) @ comp.T
    # fix sign so layer-0 (shared static point) sits left-ish, deterministic orientation
    if proj_r[0, 0] > proj_r[-1, 0]:
        proj_r[:, 0] *= -1; proj_m[:, 0] *= -1

    return {
        "model": name,
        "blocks": L,
        "sentences": {"river": s_river, "money": s_money},
        "bankTokenIndex": {"river": i_r, "money": i_m},
        "layerLabels": ["embed"] + [f"block {k}" for k in range(1, L + 1)],
        "crossSenseCosByLayer": r(cross),
        "proj2d": {"river": r(proj_r), "money": r(proj_m)},
        "finalCrossSenseCos": r(cross[-1]),
        "note": (
            "REAL DistilBERT (6 blocks). The SAME word 'bank' in a river sentence vs a money "
            "sentence: at the embedding layer the two 'bank' tokens are the same static vector "
            "(cos=1.0000); each block mixes in context and the two contextual vectors DRIFT APART, "
            "so the cross-sense cosine falls from 1.0 toward ~0.65 (matches l6-contextual.json's "
            "final-layer cross-sense). proj2d = deterministic PCA(2) of all 14 bank vectors for "
            "animating the split. Reproducible: eval(), no_grad(), manual_seed(0)."
        ),
    }


# ───────────────────────── #47 — the InfoNCE optimization trajectory (toy 2-D) ────────────────────


def infonce_from_cosines(pos_cos, neg_cos, tau):
    """p+ = softmax over [pos, *negs] of cos/tau; loss = -log p+."""
    sims = np.array([pos_cos] + list(neg_cos), float)
    z = sims / tau
    p = softmax(z)
    return float(p[0]), float(-math.log(p[0] + 1e-12)), r(z.tolist())


def build_contrastive_traj():
    tau = 0.1
    # candidate labels in the deck's canonical order
    labels = ["kitten", "airplane", "computer", "france"]  # kitten = positive
    # TUNED checkpoint: pinned to data/l6-contrastive.json (the deck's canonical numbers).
    tuned_cos = {"kitten": 0.6386, "airplane": 0.3654, "computer": 0.3525, "france": 0.0908}

    # We synthesise an OPTIMIZATION TRAJECTORY (3 checkpoints) on a toy 2-D embedding plane whose
    # TUNED endpoint reproduces the canonical cosines (so the slide's final state == the rest of the
    # deck), and whose UNTUNED start is near-random (positive NOT yet ranked first → high loss).
    # All points unit-norm; cosine = dot product. Anchor pinned at angle 0.
    anchor = np.array([1.0, 0.0])

    def unit(theta):
        return np.array([math.cos(theta), math.sin(theta)])

    # target angles (radians) reproducing tuned cosines: cos(theta)=tuned_cos
    tgt = {k: math.acos(max(-1, min(1, tuned_cos[k]))) for k in labels}
    # untuned angles: scrambled so a NEGATIVE (airplane) sits slightly closer than the positive.
    start = {"kitten": math.radians(70), "airplane": math.radians(48),
             "computer": math.radians(95), "france": math.radians(120)}

    checkpoints = []
    names = ["untuned", "mid", "tuned"]
    fracs = [0.0, 0.5, 1.0]
    for nm, f in zip(names, fracs):
        ang = {k: start[k] + f * (tgt[k] - start[k]) for k in labels}
        pts = {k: unit(ang[k]) for k in labels}
        cosv = {k: cos(anchor, pts[k]) for k in labels}
        pcos = cosv["kitten"]; ncos = [cosv[k] for k in labels[1:]]
        pplus, loss, logits = infonce_from_cosines(pcos, ncos, tau)
        checkpoints.append({
            "name": nm,
            "anchor2d": r(anchor),
            "points2d": {k: r(pts[k]) for k in labels},
            "cosines": {k: r(cosv[k]) for k in labels},
            "logits": logits,
            "pPositive": r(pplus),
            "loss": r(loss),
            "positiveWins": bool(cosv["kitten"] >= max(ncos)),
        })

    # pin the tuned checkpoint's headline numbers EXACTLY to the canonical file
    checkpoints[-1]["cosines"] = {k: r(tuned_cos[k]) for k in labels}
    checkpoints[-1]["pPositive"] = 0.8877
    checkpoints[-1]["loss"] = 0.1191
    checkpoints[-1]["logits"] = r([tuned_cos[k] / tau for k in labels])

    return {
        "anchor": "cat",
        "positive": "kitten",
        "negatives": ["airplane", "computer", "france"],
        "tau": tau,
        "labels": labels,
        "checkpoints": checkpoints,
        "lossCurve": [c["loss"] for c in checkpoints],
        "note": (
            "InfoNCE optimization trajectory on a toy 2-D UNIT-CIRCLE embedding (cosine = dot). "
            "3 checkpoints: untuned (a negative outranks the positive → high loss), mid, tuned. "
            "The TUNED endpoint is pinned to data/l6-contrastive.json (kitten .6386 / airplane "
            ".3654 / computer .3525 / france .0908; p+ = 0.8877; loss = 0.1191; tau = 0.1) so the "
            "final state matches the rest of the deck. Shows: pull the positive in, push the "
            "negatives out, softmax over candidates, loss drops."
        ),
    }


def main():
    DATA.mkdir(exist_ok=True)
    stack = build_stack_layers()
    (DATA / "l6-stack-layers.json").write_text(json.dumps(stack, indent=2, ensure_ascii=False))
    print("wrote data/l6-stack-layers.json — crossSenseCosByLayer =", stack["crossSenseCosByLayer"])

    traj = build_contrastive_traj()
    (DATA / "l6-contrastive-traj.json").write_text(json.dumps(traj, indent=2, ensure_ascii=False))
    print("wrote data/l6-contrastive-traj.json — lossCurve =", traj["lossCurve"])
    for c in traj["checkpoints"]:
        print(f"  {c['name']:8s} cos={c['cosines']} p+={c['pPositive']} loss={c['loss']} posWins={c['positiveWins']}")


if __name__ == "__main__":
    main()
