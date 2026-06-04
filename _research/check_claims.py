#!/usr/bin/env python3
"""
check_claims.py — AUDIT_V2 §1.1 claims-ledger + §1.2 arithmetic-by-code (deterministic).

For every GROUNDED quantity (a value produced by a data script under _research/data/*.json),
this gate finds where the decks display it and asserts the displayed number MATCHES the artifact
within tolerance. Catches the "drift" class (a slide says β=0.42 while heaps_summary.json says
0.5946) WITHOUT the VLM. The artifact is re-read at runtime, so the manifest can't silently drift
from the source either.

§1.2: re-computes the cosine/Euclid worked example in Python and asserts the artifact AND the slide
agree — not "trust what's written".

Severity: a displayed value that CONTRADICTS its artifact = HARD; a must-appear claim that is
ABSENT = HARD. Missing-optional = WARN.

Usage:  python3 _research/check_claims.py            (check the decks)
        python3 _research/check_claims.py --selftest  (known-bad fixture must flag, §2.4)
"""
from __future__ import annotations
import json, re, sys, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "_research/data"
DECKS = {
    "L0": ROOT / "Lectures/00-introduction.html",
    "L1": ROOT / "Lectures/01-search-ir-ml-system-design.html",
    "L2": ROOT / "Lectures/02-nlp-tokenization-similarity.html",
}

def art(name):  # read an artifact json
    return json.load(open(DATA / name))

def num(s):  # parse a displayed number: handle U+2212 minus, thousands spaces/commas, trailing dot
    s = s.replace("−", "-").replace(",", "").replace(" ", "")
    s = re.sub(r"\.+$", "", s)          # strip a trailing sentence period the anchor may have caught
    return float(s)

# ---- claims manifest: each grounded value + where/how it's rendered ----
# value() reads the artifact at runtime (no manual drift). anchor has ONE capture group = the
# displayed number. tol = absolute tolerance. must = at least one match required.
def claims():
    heaps, zipf, pos, cos = art("heaps_summary.json"), art("zipf_summary.json"), \
        art("position_bias.json"), art("cosine_examples.json")
    cls = cos["classic_pairs"][0] if isinstance(cos, dict) else cos[0]
    return [
        dict(id="heaps β",   deck="L2", value=round(heaps["beta"], 2), tol=0.02,
             anchor=r"(?:β|\\beta)\s*(?:≈|\\approx|=)\s*([\d.]+)", must=True),
        dict(id="V types",   deck="L2", value=zipf["n_types"], tol=0.5,
             anchor=r"\b(94[\s,]?287)\b", must=True),
        dict(id="zipf slope",deck="L2", value=round(zipf["loglog_slope_fit_top1000"], 2), tol=0.03,
             anchor=r"([−-]1\.0\d+)", must=True),
        dict(id="heaps R²",  deck="L2", value=round(heaps["r2"], 3), tol=0.002,
             anchor=r"R(?:²|\^?2)\s*=\s*(0\.99\d)", must=True),
        dict(id="euclid",    deck="L2", value=round(cls["euclid"], 2), tol=0.05,
             anchor=r"(?:sqrt\{162\}|√162)\\?\s*(?:≈|\\approx)\s*([\d.]+)", must=True),
        dict(id="γ pos-bias",deck="L1", value=pos["gamma"], tol=0.005,
             anchor=r"(?:γ|\\gamma)\s*(?:≈|=|\\?\s*=)?\s*(0\.9\d)", must=True),
        dict(id="top-1 %",   deck="L1", value=pos["top1_pct"], tol=0.2,
             anchor=r"\b(32\.3)\s*%", must=True),
        dict(id="top-3 %",   deck="L1", value=pos["top3_pct"], tol=0.2,
             anchor=r"\b(60\.6)\b", must=True),
    ]

def check_claim(c, text):
    hits = re.findall(c["anchor"], text)
    if not hits:
        return ("HARD" if c["must"] else "WARN", f'{c["id"]}: NOT FOUND in {c["deck"]} (expected ≈{c["value"]})')
    bad = [h for h in hits if abs(num(h) - c["value"]) > c["tol"]]
    if bad:
        return ("HARD", f'{c["id"]}: DRIFT in {c["deck"]} — displayed {bad} vs artifact {c["value"]}')
    return ("OK", f'{c["id"]}: {len(hits)} match(es) ≈{c["value"]} ✓')

# §1.2: every displayed "a·b/(c·d) = result" on a slide must actually equal a·b/(c·d) — both the
# \frac{}{} form and the inline (a·b)/(c·d) form (the BPE/WordPiece merge scores live here).
FRAC = re.compile(r'\\frac\{(\d+)\\cdot (\d+)\}\{(\d+)\\cdot (\d+)\}\s*=\s*(\d+)')
DIVN = re.compile(r'\((\d+)\\cdot (\d+)\)/\((\d+)\\cdot (\d+)\)\s*=\s*(\d+)')

def arithmetic_checks(report, texts):
    # cosine/Euclid worked example — recompute, assert artifact + slide agree.
    u, v = (1.0, 1.0), (10.0, 10.0)
    cos = (u[0]*v[0] + u[1]*v[1]) / (math.hypot(*u) * math.hypot(*v))
    euclid = math.hypot(u[0]-v[0], u[1]-v[1])
    cosart = (art("cosine_examples.json")["classic_pairs"][0]
              if isinstance(art("cosine_examples.json"), dict) else art("cosine_examples.json")[0])
    if abs(cos - cosart["cos"]) > 1e-6 or abs(euclid - cosart["euclid"]) > 1e-4:
        report.append(("HARD", f"arithmetic(cos): recomputed cos={cos:.4f}/euclid={euclid:.4f} ≠ artifact "
                               f'{cosart["cos"]}/{cosart["euclid"]}'))
    else:
        report.append(("OK", f"arithmetic(cos): cos={cos:.0f}, euclid=√162≈{euclid:.2f} == artifact ✓"))
    # BPE/WordPiece (and any) displayed fractions/divisions — recompute each.
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
    for c in claims():
        report.append(check_claim(c, text[c["deck"]]))
    arithmetic_checks(report, text)
    hard = sum(1 for s, _ in report if s == "HARD")
    warn = sum(1 for s, _ in report if s == "WARN")
    print(f"[facts-gate] {len(report)} claims checked (100% of grounded values)")
    for sev, msg in report:
        print(f"  {'✗' if sev=='HARD' else ('!' if sev=='WARN' else '✓')} [{sev}] {msg}")
    print(f"\n[facts-gate] HARD(drift/missing)={hard}  WARN={warn}")
    return 1 if hard else 0

def selftest():
    # §2.4: a deck snippet with a WRONG β must flag DRIFT.
    bad = 'fill="var(--ink-2)">β ≈ 0.42 — measured</text>'
    c = next(x for x in claims() if x["id"] == "heaps β")
    sev, msg = check_claim(c, bad)
    okD = sev == "HARD" and "DRIFT" in msg
    print("[selftest]", msg)
    # arithmetic: a deliberately-wrong displayed fraction must flag
    rep = []
    arithmetic_checks(rep, {"L2": r'\frac{1\cdot 29}{1\cdot 1} = 28'})
    okA = any(s == "HARD" and "is WRONG" in m for s, m in rep)
    print("[selftest]", next((m for s, m in rep if s == "HARD"), "arithmetic: NO FLAG"))
    ok = okD and okA
    print("[selftest]", "PASS — drift + bad-arithmetic both fire" if ok else "FAIL — a check is blind!")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
