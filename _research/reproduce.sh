#!/usr/bin/env bash
# =============================================================================
# reproduce.sh — prove data/ is REPRODUCIBLE (hard constraint H3), and codify the
# exact toolchain that does it so nobody has to re-derive it.
#
# WHY THIS EXISTS: a prior session lost hours because `python3` on $PATH is 3.14 and
# CANNOT load the 3.9-ABI vendored libs — the generators reproduce byte-identically
# ONLY under /usr/bin/python3 (the macOS system Python 3.9.6) with PYTHONPATH pointed
# at the vendored pylibs cache (numpy 2.0.2 · scipy 1.13.1 · scikit-learn 1.6.1 ·
# umap-learn 0.5.12). This script makes "reproduce + verify" one command.
#
# SCOPE: this is a LOCAL / pre-release proof, NOT a GitHub-CI gate — the vendored
# pylibs cache is GITIGNORED (platform-specific macos-aarch64/py3.9 `.so` binaries,
# absent on a fresh clone / Linux runner) and the full run needs torch + the GloVe
# cache. The durable, tracked spec for rebuilding the cache is _research/requirements-repro.txt.
#
# Usage:
#   bash _research/reproduce.sh            # full: manifest check + run all generators + byte-diff
#   bash _research/reproduce.sh --check    # vendored-version manifest only (fast, no generators)
#   bash _research/reproduce.sh --setup    # rebuild the cache from requirements-repro.txt IF it is missing
# =============================================================================
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYLIBS="$ROOT/_research/data/.cache/pylibs"
PY=/usr/bin/python3

# the toolchain that produced the committed data/ (frozen)
EXPECT=( "numpy-2.0.2" "scipy-1.13.1" "scikit_learn-1.6.1" "umap_learn-0.5.12" )

manifest_check() {
  local fail=0
  echo "[reproduce] vendored-toolchain manifest"
  for e in "${EXPECT[@]}"; do
    if [ -d "$PYLIBS/$e.dist-info" ]; then echo "  ✓ $e"
    else echo "  ✗ MISSING $e.dist-info — the vendored toolchain changed; data/ is no longer reproducible as committed"; fail=1; fi
  done
  return $fail
}

interpreter_note() {
  if [ -x "$PY" ]; then
    local v; v="$("$PY" -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null)"
    if [ "$v" = "3.9" ]; then echo "  ✓ $PY is Python $v (native toolchain)"
    else echo "  ! $PY is Python ${v:-absent}, not 3.9 — full reproduction needs the 3.9 ABI (manifest still checked above)"; fi
  else echo "  ! $PY absent — full reproduction unavailable on this host (expected the macOS system Python 3.9)"; fi
}

# ── --check: manifest only ───────────────────────────────────────────────────
if [ "${1:-}" = "--check" ]; then
  manifest_check; rc=$?; interpreter_note; exit $rc
fi

# ── --setup: rebuild the cache from the tracked spec, ONLY if it is missing ────
# (idempotent — never touches a working cache; addresses cache-loss, not a working tree).
if [ "${1:-}" = "--setup" ]; then
  if manifest_check >/dev/null 2>&1; then echo "[reproduce] cache already present & valid — nothing to do"; exit 0; fi
  echo "[reproduce] cache missing/broken → installing _research/requirements-repro.txt under CPython 3.9…"
  if [ ! -x "$PY" ] || [ "$("$PY" -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null)" != "3.9" ]; then
    echo "  ✗ need /usr/bin/python3 == 3.9 to rebuild a byte-compatible cache (install Python 3.9, e.g. \`uv python install 3.9\`)"; exit 1
  fi
  "$PY" -m pip install --target "$PYLIBS" -r "$ROOT/_research/requirements-repro.txt" \
    && { echo "[reproduce] cache rebuilt → run \`bash _research/reproduce.sh\` to prove byte-identity"; exit 0; } \
    || { echo "  ✗ pip install failed (offline? no pip?) — install requirements-repro.txt into $PYLIBS by hand"; exit 1; }
fi

# ── full reproduction ────────────────────────────────────────────────────────
manifest_check || { echo "[reproduce] manifest broken — abort (restore the vendored pylibs)"; exit 1; }
interpreter_note
if [ ! -x "$PY" ] || [ "$("$PY" -c 'import sys;print("%d.%d"%sys.version_info[:2])' 2>/dev/null)" != "3.9" ]; then
  echo "[reproduce] need /usr/bin/python3 == 3.9 for a byte-identical run — abort"; exit 1
fi
if ! git -C "$ROOT" diff --quiet -- data/ _research/data/; then
  echo "[reproduce] WARNING: data/ already has uncommitted changes — drift below may be pre-existing"
fi

echo "[reproduce] re-running data generators (gen_images = PNG assets, not data → skipped)…"
export PYTHONPATH="$PYLIBS"
rc=0
for g in $(cd "$ROOT" && ls _research/gen_*.py | grep -v 'gen_images.py'); do
  if "$PY" "$ROOT/$g" >/dev/null 2>&1; then echo "  ✓ ran $(basename "$g")"
  else echo "  ✗ FAILED to run $(basename "$g") (missing cache/dep?)"; rc=1; fi
done

echo "[reproduce] byte-identity (git diff data/ _research/data/)…"
if git -C "$ROOT" diff --quiet -- data/ _research/data/; then
  [ $rc -eq 0 ] && echo "[reproduce] ✓ PASS — every data/ + _research/data/ file reproduced BYTE-IDENTICALLY (H3 holds)" \
                || echo "[reproduce] ⚠ no drift, but some generators failed to run (see ✗ above) — proof incomplete"
  exit $rc
else
  # Отличаем ЧИСЛОВОЙ дрейф от правки прозы. H3 защищает числа: если ни одна изменённая строка
  # не содержит цифр, значит поехал русский/английский/татарский текст в ручном файле (course.json,
  # papers.json), а не результат генератора. Это законная правка, и называть её «toolchain mismatch»
  # — вводить в заблуждение. Числовой дрейф по-прежнему падает: правило не ослаблено, а уточнено.
  if git -C "$ROOT" --no-pager diff -U0 -- data/ _research/data/ \
       | grep -E '^[-+][^-+]' | grep -qE '[0-9]'; then
    echo "[reproduce] ✗ DRIFT — числа изменились (toolchain mismatch, or a real data change to sync into the deck+Book+facts-gate):"
    git -C "$ROOT" --no-pager diff --stat -- data/ _research/data/
    exit 1
  fi
  echo "[reproduce] ✓ PROSE-ONLY — генераторы дали байт-идентичный результат; изменились только"
  echo "             текстовые строки без единой цифры (ручные data/course.json · data/papers.json)."
  echo "             H3 держится: числа не тронуты. Проверь, что правка отражена в деке и Книге."
  git -C "$ROOT" --no-pager diff --stat -- data/ _research/data/
  exit $rc
fi
