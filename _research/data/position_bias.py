#!/usr/bin/env python3
"""
position_bias.py — position bias from a DOCUMENTED click model (not a proprietary log).

We do NOT have a public, redistributable click-log handy, so this is an explicit,
reproducible *model* — labeled as such on the slide.

Attributions (carefully separated — session-5 CoVe fix to the session-4 drift):
  * the position-based examination model (the "examination hypothesis":
    CTR = examination × relevance, examination depending on RANK ONLY —
    here examination ∝ 1/rank^γ) is studied in **Craswell, Zoeter, Taylor,
    Ramsey 2008**, "An Experimental Comparison of Click Position-Bias Models"
    (WSDM 2008). NOTE it is NOT their *cascade* model — in the cascade model
    examination of rank r is conditional on the ranks above, which is a
    different formula from the rank-only decay used here;
  * the framing that **clicks reveal *relative* not absolute relevance** is
    **Joachims, Granka et al. 2005**, "Accurately Interpreting Clickthrough
    Data as Implicit Feedback" (SIGIR 2005); and
  * the ~32% rank-1 click share that anchors γ here is the **Enquiro 2005**
    "golden triangle" eye-tracking number.
γ is chosen so rank-1 ≈ 0.32 of clicks under the position-based model with equal relevance.

Output: position_bias.json — {gamma, ranks:[{rank, exam, click_share}], top1_pct,
top3_pct}. Consumed by L1 slide 29 (position bias) speaker notes as a grounded,
explicitly-synthetic illustration of why naive click logs are biased training data.
"""
from __future__ import annotations
import json, pathlib
import numpy as np

OUT = pathlib.Path(__file__).resolve().parent

def main() -> int:
    ranks = np.arange(1, 11)
    # find gamma so normalized 1/rank^gamma gives rank-1 share ~= 0.32
    def share1(g):
        w = 1.0 / ranks ** g
        return (w / w.sum())[0]
    g = 0.5
    for _ in range(60):                       # simple bisection-ish on gamma
        s = share1(g)
        g += 0.02 if s < 0.32 else -0.02
        if abs(s - 0.32) < 0.002: break
    w = 1.0 / ranks ** g
    share = w / w.sum()
    out = {
        "model": "position-based examination model (the 'examination hypothesis' studied in "
                 "Craswell, Zoeter, Taylor, Ramsey 2008, 'An Experimental Comparison of Click "
                 "Position-Bias Models'; NOT their cascade model — examination here depends on "
                 "rank only, not on the ranks above): CTR = examination × relevance, all "
                 "relevance EQUAL → clicks are pure position bias. examination ∝ 1/rank^gamma, "
                 "gamma fit so rank-1 ≈ 32% (Enquiro 2005 'golden triangle' eye-tracking number; "
                 "the 'clicks reveal relative not absolute relevance' framing is Joachims, "
                 "Granka et al. 2005, 'Accurately Interpreting Clickthrough Data as Implicit "
                 "Feedback').",
        "label_on_slide": "ILLUSTRATIVE — modelled, not from a proprietary click log.",
        "gamma": round(float(g), 3),
        "ranks": [{"rank": int(r), "exam": round(float(e), 4), "click_share": round(float(c), 4)}
                  for r, e, c in zip(ranks, w / w.max(), share)],
        "top1_pct": round(float(share[0] * 100), 1),
        "top3_pct": round(float(share[:3].sum() * 100), 1),
    }
    (OUT / "position_bias.json").write_text(json.dumps(out, indent=2) + "\n")
    print(f"[posbias] gamma={out['gamma']} · rank-1={out['top1_pct']}% · top-3={out['top3_pct']}%")
    print("[posbias] wrote position_bias.json")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
