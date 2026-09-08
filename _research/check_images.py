#!/usr/bin/env python3
"""
check_images.py — the image-gate (brand / mascot consistency). Pure Python, no
browser, no network, no .env. Reads the illustration BRIEFS from gen_images.py via
`ast` (so it never executes the generator — no API key, no `requests` needed) and
the locked cast from mascots.py.

WHY IT EXISTS
-------------
The course's recurring mascots (Serega + the cast in mascots.py) are the brand. They
once drifted to nothing — Serega faded 5→3→0→0 plates across L5→L6→L7→L8 — even though
his look was pinned in code. A written rule does not stop drift; this gate does. It
HARD-fails the build when, for any lecture LN:

  1. RATIO — the share of plates with has_serega=True is below SEREGA_MIN_RATIO (0.40),
  2. BOOKENDS — its hero (first) or final/payoff (last) plate has has_serega=False,
  3. PALETTE — the SEREGA appearance constant is broken, the single-source import is
     gone, or a brief introduces GREEN anywhere other than the green tübetey.

So a new lecture cannot silently ship Serega-less, brand-anonymous plates again.

USAGE
  python3 _research/check_images.py            # audit the real JOBS
  python3 _research/check_images.py --selftest # planted-violation fixtures (no repo state)

EXIT: non-zero whenever HARD > 0 (a hard CI gate, like check_claims.py).
"""
import ast, re, sys, pathlib
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
GEN = ROOT / "_research" / "gen_images.py"
sys.path.insert(0, str(ROOT / "_research"))
import mascots as M  # noqa: E402

# ── JOBS extraction — ast.literal_eval the JOBS list WITHOUT importing gen_images
#    (importing it would load .env + requests + run main()). The JOBS entries are pure
#    literals: (group, filename, aspect, has_serega, scene). ──────────────────────────
def load_jobs(src_text):
    for node in ast.walk(ast.parse(src_text)):
        if isinstance(node, ast.Assign) and any(
            isinstance(t, ast.Name) and t.id == "JOBS" for t in node.targets):
            return ast.literal_eval(node.value)
    raise SystemExit("[image-gate] could not find the JOBS list in gen_images.py")

# ── green-only-on-the-tübetey lint. Every sentence of a brief that mentions "green"
#    must also carry one of these safe tokens — i.e. it is the cap, or an explicit
#    negation ("no/never/not green", "the ONLY green"). Anything else is a green leak. ──
_GREEN_OK = ("tübetey", "tubetey", "tubeteika", "skullcap", "no green",
             "never green", "not green", "only green", "green one", "no other green")

def green_violations(scene):
    out = []
    for sent in re.split(r"(?<=[.;])\s+", scene):
        low = sent.lower()
        if "green" in low and not any(tok in low for tok in _GREEN_OK):
            out.append(sent.strip()[:90])
    return out

LECTURE = re.compile(r"L\d+")

# ── the core audit (pure: takes a JOBS list, returns HARD-violation strings). Factored
#    out so --selftest can drive it with synthetic JOBS. ───────────────────────────────
def audit_jobs(jobs, min_ratio=M.SEREGA_MIN_RATIO):
    V, summary = [], []
    byL = defaultdict(list)
    for grp, fname, aspect, serega, scene in jobs:
        if LECTURE.fullmatch(grp):
            byL[grp].append((fname, bool(serega)))
    for g in sorted(byL):
        rows = sorted(byL[g])                       # by filename → hero first, final last
        n = len(rows); t = sum(1 for _, s in rows if s); ratio = t / n if n else 0
        hero, final = rows[0], rows[-1]
        ok = ratio >= min_ratio and hero[1] and final[1]
        summary.append(f"  {g}: {t}/{n} Serega ({ratio:.0%})  hero={'✓' if hero[1] else '✗'}"
                       f"  final={'✓' if final[1] else '✗'}  {'ok' if ok else 'FAIL'}")
        if ratio < min_ratio:
            V.append(f"[{g}] Serega ratio {t}/{n}={ratio:.0%} < {min_ratio:.0%} — the mascot is "
                     f"fading out of this lecture; give Serega more plates (mascots.py registry).")
        if not hero[1]:
            V.append(f"[{g}] HERO plate {hero[0].split('/')[-1]} has has_serega=False — the "
                     f"opening plate must feature Serega.")
        if not final[1]:
            V.append(f"[{g}] FINAL/payoff plate {final[0].split('/')[-1]} has has_serega=False — "
                     f"the payoff plate must feature Serega.")
    # palette lint over EVERY job (lectures + char/cover/cameos)
    for grp, fname, aspect, serega, scene in jobs:
        for s in green_violations(scene):
            V.append(f"[{fname.split('/')[-1]}] GREEN outside the tübetey — \"{s}…\" "
                     f"(green is reserved for Serega's cap; every other figure is bare-headed).")
    return V, summary

def audit_registry():
    """The SEREGA constant + the single-source import must stay intact."""
    V = []
    s = M.SEREGA
    if not isinstance(s, str) or len(s) < 300:
        V.append("mascots.SEREGA appearance constant is missing or too short.")
    else:
        low = s.lower()
        for need in ("green", "tübetey", "skullcap"):
            if need not in low:
                V.append(f"mascots.SEREGA no longer pins '{need}' — Serega's look is no longer locked.")
    if "from mascots import SEREGA" not in GEN.read_text():
        V.append("gen_images.py no longer imports SEREGA from mascots.py — the single source of truth "
                 "for the cast is broken (the constant could drift again).")
    if not M.GREEN_CAP_MASCOTS:
        V.append("no green-cap mascot registered — Serega's cap rule has nothing to anchor on.")
    return V

# ─────────────────────────── selftest ───────────────────────────
def _clean_lecture(prefix, n, serega_flags, scene="a plain scene, NO green anywhere."):
    return [(prefix, f"{prefix}/{prefix}-{i:02d}-x.png", "16:9", f, scene)
            for i, f in zip(range(n), serega_flags)]

def selftest():
    ok = True
    def check(label, fired, want):
        nonlocal ok
        good = fired == want
        ok = ok and good
        print(f"{' ok ' if good else 'FAIL'} {label}: {'FIRE' if fired else 'silent'}"
              f"{'' if good else ' (WRONG)'}")

    # CLEAN — a healthy lecture: 3/3 Serega, hero+final True, no green leak → silent.
    clean = _clean_lecture("L9", 3, [True, True, True])
    v, _ = audit_jobs(clean)
    check("clean lecture stays silent", bool(v), False)

    # S1 RATIO — 1/4 Serega (25% < 40%) → fire.
    v, _ = audit_jobs(_clean_lecture("L9", 4, [True, False, False, False]))
    check("ratio below floor fires", any("ratio" in x for x in v), True)

    # S2 HERO — first plate False (but ratio ok at 67%) → fire on hero.
    v, _ = audit_jobs(_clean_lecture("L9", 3, [False, True, True]))
    check("hero without Serega fires", any("HERO" in x for x in v), True)

    # S3 FINAL — last plate False → fire on final.
    v, _ = audit_jobs(_clean_lecture("L9", 3, [True, True, False]))
    check("final without Serega fires", any("FINAL" in x for x in v), True)

    # S4 GREEN LEAK — a brief that paints something green that is not the cap → fire.
    leak = [("L9", "L9/L9-00-x.png", "16:9", True, "a big GREEN dragon breathes fire.")]
    v, _ = audit_jobs(leak)
    check("green leak fires", any("GREEN outside" in x for x in v), True)

    # S5 GREEN OK — green only as the cap / negations → silent.
    safe = [("L9", "L9/L9-00-x.png", "16:9", True,
             "Serega's green tübetey is the ONLY green; NO green anywhere else."),
            ("L9", "L9/L9-01-x.png", "16:9", True, "the grass is course-blue, NOT green.")]
    v, _ = audit_jobs(safe)
    check("safe green (cap + negation) stays silent", any("GREEN outside" in x for x in v), False)

    # S6 BROKEN CONSTANT — a stubbed-out SEREGA fires the registry audit.
    real = M.SEREGA
    try:
        M.SEREGA = "tiny"
        check("broken SEREGA constant fires", bool(audit_registry()), True)
    finally:
        M.SEREGA = real

    print("\n[image-gate selftest]", "PASS" if ok else "FAIL")
    return 0 if ok else 1

# ─────────────────────────── main ───────────────────────────
def main():
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    jobs = load_jobs(GEN.read_text())
    V, summary = audit_jobs(jobs)
    V += audit_registry()
    print(f"[image-gate] {len(jobs)} briefs · {len(M.MASCOTS)} mascots registered "
          f"· Serega floor {M.SEREGA_MIN_RATIO:.0%}")
    print("\n".join(summary))
    if V:
        print(f"\n[image-gate] HARD violations ({len(V)}):")
        for x in V:
            print("  ✗ " + x)
        print(f"\n[image-gate] HARD(mascot-ratio/bookends/palette)={len(V)}")
        sys.exit(1)
    print("\n[image-gate] HARD(mascot-ratio/bookends/palette)=0  — the cast is present and on-palette.")
    sys.exit(0)

if __name__ == "__main__":
    main()
