#!/usr/bin/env python3
"""genlib.py — shared helpers for the data generators (gen_*.py).

Extracted verbatim from the per-generator duplicates so the rounding/serialisation behaviour is
IDENTICAL byte-for-byte (the facts-gate H3 invariant: re-running a generator must reproduce its
committed JSON exactly). Import what you need:

    from genlib import ROOT, DATA, r, rm, rv, softmax

⚠ The default `n` here is 4 (the value used by the GloVe/word2vec/t-SNE generators). The L5/L6 *viz*
generators rounded vectors/matrices to 3 by default — but every one of their call sites passes an
EXPLICIT n, so the shared default is never exercised there. `gen_l6.py` (which DOES rely on a 3-place
default and uses a no-dtype `np.asarray`) keeps its own `rm` and is not migrated. The four `cos`
implementations differ numerically (plain / zero-guard / +1e-12 / torch) and stay per-file; the
recursive `r` in gen_l6_enrich likewise stays local. So this lib holds only the provably-identical
helpers. Run the generators on /usr/bin/python3 (3.9.6) with PYTHONPATH pointing at the vendored
pylibs cache (_research/data/.cache/pylibs).
"""
from __future__ import annotations
import json
import pathlib
import numpy as np

# genlib.py lives in _research/, so parent.parent is the repo root — identical to each generator's
# own `pathlib.Path(__file__).resolve().parent.parent` (which it replaces).
ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def r(x, n=4):
    return round(float(x), n)


def rm(M, n=4):
    return [[r(v, n) for v in row] for row in np.asarray(M, dtype=float)]


def rv(v, n=4):
    return [r(x, n) for x in np.asarray(v, dtype=float).ravel()]


def softmax(z):
    z = np.asarray(z, dtype=float)
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()


def write_json(path, obj):
    """Serialise obj → pretty JSON, BYTE-IDENTICAL to the inline
    `path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\\n")` it replaces
    (the gen_l3 / gen_l4 serialisation: 2-space indent, raw UTF-8, one trailing newline).
    Other generators use a DIFFERENT format (no trailing newline / `encoding="utf-8"` /
    3-place vector rounding) and keep their inline call — per this lib's "only the
    provably-identical helpers" rule."""
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")
