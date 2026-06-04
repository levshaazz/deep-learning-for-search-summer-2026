#!/usr/bin/env python3
"""
check_claims.py — facts-gate (AUDIT_V2 §1.1 claims-ledger + §1.2 arithmetic) upgraded to the
SITE_ARCHITECTURE G1 'shared-data' contract.

The single source of grounded numbers is the curated product layer `data/l*-*.json` (co-located
with data/course.json; read by the decks, the Book, and the widgets). This gate enforces the whole
chain so a number cannot drift at any hop:

  [P] PROVENANCE :  curated data/l*-*.json  ==  generator output _research/data/*.json   (HARD)
  [C] CLAIMS     :  what a DECK displays     ==  curated data/l*-*.json                   (HARD)
  [A] ARITHMETIC :  recompute cos/Euclid & every displayed a·b/(c·d)  ==  result          (HARD)

So `data/` is THE source; [P] proves it matches the upstream generator, [C] proves the decks match
`data/`. When the Book lands, add its built HTML to `texts` and the same [C]/[A] checks cover it.

Usage:  python3 _research/check_claims.py            (check decks against data/)
        python3 _research/check_claims.py --selftest  (known-bad fixtures must flag, §2.4)
"""
from __future__ import annotations
import json, re, sys, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"               # curated product source of truth
RAW  = ROOT / "_research/data"     # generator artifacts (upstream provenance)
DECKS = {
    "L0": ROOT / "Lectures/00-introduction.html",
    "L1": ROOT / "Lectures/01-search-ir-ml-system-design.html",
    "L2": ROOT / "Lectures/02-nlp-tokenization-similarity.html",
}

def load(base, name):
    return json.load(open(base / name))

def num(s):  # parse a displayed number: U+2212 minus, thousands spaces/commas, trailing dot
    s = s.replace("−", "-").replace(",", "").replace(" ", "")
    s = re.sub(r"\.+$", "", s)
    return float(s)

# Curated product data (the single source). Loaded once.
COS  = load(DATA, "l2-cosine.json")
CORP = load(DATA, "l2-corpus-stats.json")
CLICK = load(DATA, "l1-click-model.json")
def primary_pair():
    return next(p for p in COS["pairs"] if p["id"] == COS["primary"])

# ── [P] PROVENANCE: curated data/ must equal the generator artifact it was lifted from ──────────
def provenance_checks(report):
    raw_heaps, raw_zipf, raw_pos, raw_cos = (load(RAW, "heaps_summary.json"), load(RAW, "zipf_summary.json"),
                                             load(RAW, "position_bias.json"), load(RAW, "cosine_examples.json"))
    rc = raw_cos["classic_pairs"][0]
    pp = primary_pair()
    checks = [
        ("heaps.beta",  CORP["heaps"]["beta"],          raw_heaps["beta"],   1e-9),
        ("vTypes",      CORP["vTypes"],                  raw_heaps["V_total"],0),
        ("heaps.r2",    CORP["heaps"]["r2"],             raw_heaps["r2"],     1e-9),
        ("zipf.slope",  CORP["zipf"]["loglogSlope"],     raw_zipf["loglog_slope_fit_top1000"], 1e-9),
        ("cos.cos",     pp["cos"],                       rc["cos"],           1e-9),
        ("cos.euclid",  pp["euclid"],                    rc["euclid"],        1e-5),
        ("click.gamma", CLICK["gamma"],                  raw_pos["gamma"],    1e-9),
        ("click.top1",  CLICK["top1Pct"],                raw_pos["top1_pct"], 1e-9),
        ("click.top3",  CLICK["top3Pct"],                raw_pos["top3_pct"], 1e-9),
    ]
    bad = 0
    for name, cur, raw, tol in checks:
        if abs(cur - raw) > tol:
            bad += 1
            report.append(("HARD", f"provenance({name}): data/ has {cur} but generator says {raw}"))
    if not bad:
        report.append(("OK", f"provenance: {len(checks)} curated values == generator artifacts ✓"))

# ── [C] CLAIMS: every grounded value read from data/, asserted present+matching in the deck ─────
def claims():
    pp = primary_pair()
    return [
        dict(id="heaps β",   deck="L2", value=round(CORP["heaps"]["beta"], 2), tol=0.02,
             anchor=r"(?:β|\\beta)\s*(?:≈|\\approx|=)\s*([\d.]+)", must=True),
        dict(id="V types",   deck="L2", value=CORP["vTypes"], tol=0.5,
             anchor=r"\b(94[\s,]?287)\b", must=True),
        dict(id="zipf slope",deck="L2", value=round(CORP["zipf"]["loglogSlope"], 2), tol=0.03,
             anchor=r"([−-]1\.0\d+)", must=True),
        dict(id="heaps R²",  deck="L2", value=round(CORP["heaps"]["r2"], 3), tol=0.002,
             anchor=r"R(?:²|\^?2)\s*=\s*(0\.99\d)", must=True),
        dict(id="euclid",    deck="L2", value=round(pp["euclid"], 2), tol=0.05,
             anchor=r"(?:sqrt\{162\}|√162)\\?\s*(?:≈|\\approx)\s*([\d.]+)", must=True),
        dict(id="γ pos-bias",deck="L1", value=CLICK["gamma"], tol=0.005,
             anchor=r"(?:γ|\\gamma)\s*(?:≈|=|\\?\s*=)?\s*(0\.9\d)", must=True),
        dict(id="top-1 %",   deck="L1", value=CLICK["top1Pct"], tol=0.2,
             anchor=r"\b(32\.3)\s*%", must=True),
        dict(id="top-3 %",   deck="L1", value=CLICK["top3Pct"], tol=0.2,
             anchor=r"\b(60\.6)\b", must=True),
    ]

def check_claim(c, text):
    hits = re.findall(c["anchor"], text)
    if not hits:
        return ("HARD" if c["must"] else "WARN", f'{c["id"]}: NOT FOUND in {c["deck"]} (expected ≈{c["value"]})')
    bad = [h for h in hits if abs(num(h) - c["value"]) > c["tol"]]
    if bad:
        return ("HARD", f'{c["id"]}: DRIFT in {c["deck"]} — displayed {bad} vs data/ {c["value"]}')
    return ("OK", f'{c["id"]}: {len(hits)} match(es) ≈{c["value"]} ✓')

# ── [A] ARITHMETIC: recompute cos/Euclid from data/ vectors; recompute every displayed fraction ──
FRAC = re.compile(r'\\frac\{(\d+)\\cdot (\d+)\}\{(\d+)\\cdot (\d+)\}\s*=\s*(\d+)')
DIVN = re.compile(r'\((\d+)\\cdot (\d+)\)/\((\d+)\\cdot (\d+)\)\s*=\s*(\d+)')

def arithmetic_checks(report, texts):
    pp = primary_pair()
    u, v = tuple(pp["u"]), tuple(pp["v"])
    cos = (u[0]*v[0] + u[1]*v[1]) / (math.hypot(*u) * math.hypot(*v))
    euclid = math.hypot(u[0]-v[0], u[1]-v[1])
    if abs(cos - pp["cos"]) > 1e-6 or abs(euclid - pp["euclid"]) > 1e-4:
        report.append(("HARD", f"arithmetic(cos): recomputed cos={cos:.4f}/euclid={euclid:.4f} ≠ data/ "
                               f'{pp["cos"]}/{pp["euclid"]}'))
    else:
        report.append(("OK", f"arithmetic(cos): cos={cos:.0f}, euclid=√162≈{euclid:.2f} == data/ ✓"))
    nfrac, bad = 0, 0
    for deck, txt in texts.items():
        for a, b, c, d, res in FRAC.findall(txt) + DIVN.findall(txt):
            nfrac += 1
            if abs(int(a)*int(b)/(int(c)*int(d)) - int(res)) > 1e-9:
                bad += 1
                report.append(("HARD", f"arithmetic({deck}): displayed {a}·{b}/({c}·{d}) = {res} is WRONG "
                                       f"(= {int(a)*int(b)/(int(c)*int(d)):g})"))
    if not bad:
        report.append(("OK", f"arithmetic(fractions): {nfrac} displayed a·b/(c·d) results all correct ✓"))

def main():
    text = {k: p.read_text() for k, p in DECKS.items()}
    report = []
    provenance_checks(report)                       # [P] data/ == generator
    for c in claims():                              # [C] deck == data/
        report.append(check_claim(c, text[c["deck"]]))
    arithmetic_checks(report, text)                 # [A] recompute
    hard = sum(1 for s, _ in report if s == "HARD")
    warn = sum(1 for s, _ in report if s == "WARN")
    print(f"[facts-gate] {len(report)} checks — source: data/ (provenance→curated→deck)")
    for sev, msg in report:
        print(f"  {'✗' if sev=='HARD' else ('!' if sev=='WARN' else '✓')} [{sev}] {msg}")
    print(f"\n[facts-gate] HARD(drift/missing)={hard}  WARN={warn}")
    return 1 if hard else 0

def selftest():
    # §2.4: a deck snippet with a WRONG β must flag DRIFT against data/.
    bad = 'fill="var(--ink-2)">β ≈ 0.42 — measured</text>'
    c = next(x for x in claims() if x["id"] == "heaps β")
    sev, msg = check_claim(c, bad)
    okD = sev == "HARD" and "DRIFT" in msg
    print("[selftest:claim]", msg)
    # arithmetic: a deliberately-wrong displayed fraction must flag.
    rep = []
    arithmetic_checks(rep, {"L2": r'\frac{1\cdot 29}{1\cdot 1} = 28'})
    okA = any(s == "HARD" and "is WRONG" in m for s, m in rep)
    print("[selftest:arith]", next((m for s, m in rep if s == "HARD"), "arithmetic: NO FLAG"))
    # provenance: a curated value that disagrees with the generator must flag (simulate in-memory).
    rep2 = []
    saved = CORP["heaps"]["beta"]
    CORP["heaps"]["beta"] = 0.42
    provenance_checks(rep2)
    CORP["heaps"]["beta"] = saved
    okP = any(s == "HARD" and "provenance" in m for s, m in rep2)
    print("[selftest:prov]", next((m for s, m in rep2 if s == "HARD"), "provenance: NO FLAG"))
    ok = okD and okA and okP
    print("[selftest]", "PASS — claim-drift + bad-arithmetic + provenance-drift all fire"
          if ok else "FAIL — a check is blind!")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
