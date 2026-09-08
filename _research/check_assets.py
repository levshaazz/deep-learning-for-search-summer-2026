#!/usr/bin/env python3
"""
check_assets.py — the MISSING-IMAGE gate (G17). Pure-Python, no browser, no network.

HARD-fails the build when an illustration is REFERENCED (deck fragment / Book beat /
gallery) but is NOT on disk, OR when a generator BRIEF (gen_images.py JOBS) has no
generated PNG. This catches the "illustrations not generated / broken image ref"
class that the brand image-gate (check_images.py) misses — that gate reads the
BRIEFS, never the files, so a lecture with zero generated plates passes it.

  python3 _research/check_assets.py            # audit the repo
  python3 _research/check_assets.py --selftest # known-bad fixtures must fire

Exit: non-zero whenever HARD > 0 (a hard CI gate).
"""
import ast, re, sys, pathlib

ROOT   = pathlib.Path(__file__).resolve().parent.parent
IMGDIR = ROOT / "Lectures" / "assets" / "img"
GEN    = ROOT / "_research" / "gen_images.py"

# any  assets/img/<group>/<file>.png  reference (deck-relative, /Lectures/-absolute, or in JS)
IMG_RE = re.compile(r'assets/img/([A-Za-z0-9_]+/[A-Za-z0-9_.\-]+\.png)')


def load_jobs(src):
    """ast.literal_eval the JOBS list WITHOUT importing gen_images (no .env / requests)."""
    for node in ast.walk(ast.parse(src)):
        if isinstance(node, ast.Assign) and any(
                isinstance(t, ast.Name) and t.id == "JOBS" for t in node.targets):
            return ast.literal_eval(node.value)
    return []


def referenced_images():
    """rel-path → set(source files) for every assets/img/*.png the SHIPPED content references."""
    refs, sources = {}, []
    sources += sorted((ROOT / "Lectures").glob("*/parts/*.html"))   # deck fragment sources
    sources += sorted((ROOT / "content" / "book").glob("**/*.js"))  # Book beats / chapters
    sources += [ROOT / "src" / "lib" / "gallery.js"]                # the gallery (bestiary + scenes)
    for f in sources:
        if not f.exists():
            continue
        for m in IMG_RE.finditer(f.read_text(encoding="utf-8")):
            refs.setdefault(m.group(1), set()).add(str(f.relative_to(ROOT)))
    return refs


def audit_core(refs, jobs):
    """pure: given referenced paths + JOBS briefs, return the HARD findings (testable offline)."""
    report = []
    for rel, srcs in sorted(refs.items()):
        if not (IMGDIR / rel).exists():
            report.append(("HARD", f"REFERENCED but MISSING on disk: {rel}  (e.g. {sorted(srcs)[0]})"))
    for job in jobs:                       # (group, filename, aspect, has_serega, scene)
        fname = job[1]
        if not (IMGDIR / fname).exists():
            report.append(("HARD", f"BRIEF in gen_images.py JOBS but PNG NOT generated: {fname}"))
    return report


def run():
    refs = referenced_images()
    jobs = load_jobs(GEN.read_text(encoding="utf-8")) if GEN.exists() else []
    report = audit_core(refs, jobs)
    for sev, msg in report:
        print(f"  {'✗' if sev == 'HARD' else '!'} [{sev}] {msg}")
    hard = sum(1 for s, _ in report if s == "HARD")
    print(f"\n[asset-gate] scanned {len(refs)} referenced image(s) + {len(jobs)} brief(s)")
    print(f"[asset-gate] HARD(missing-referenced/ungenerated-brief)={hard}"
          + ("  — every referenced + briefed illustration exists on disk ✓" if hard == 0 else ""))
    return 1 if hard else 0


def selftest():
    sample = next((p.relative_to(IMGDIR).as_posix() for p in IMGDIR.glob("L*/*.png")), None)
    bad  = audit_core({"L99/L99-00-does-not-exist.png": {"_fixture"}}, [])   # missing ref → must fire
    good = audit_core({sample: {"_fixture"}}, []) if sample else [("HARD", "no sample plate on disk")]
    brief_bad = audit_core({}, [("L99", "L99/L99-00-nope.png", "16:9", True, "x")])  # ungenerated brief
    ok = len(bad) >= 1 and len(good) == 0 and len(brief_bad) >= 1
    print(f"[selftest] missing-ref fires={len(bad) >= 1}  real-plate-clean={len(good) == 0}  "
          f"ungenerated-brief fires={len(brief_bad) >= 1}")
    print("[selftest]", "PASS — missing-image detector fires on a missing ref + ungenerated brief, "
                        "silent on a real plate" if ok else "FAIL — blind to a missing image!")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else run())
