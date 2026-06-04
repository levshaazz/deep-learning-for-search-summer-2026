#!/usr/bin/env bash
# =============================================================================
# iterate.sh — autonomous iteration harness for the WBW lecture decks.
# Runs N sessions of headless Claude Code. Each session:
#   backup decks+css -> run `claude -p` on AGENDA+LESSONS -> gate (wbw-check 0/0/0)
#   -> rollback if gate fails (and stop) -> screenshot (light+dark) -> VLM review
#   -> append findings to LESSONS.md for the next session.
# Prompts/work evolve via AGENDA + the growing LESSONS.md.
#
# Usage:  bash _research/iterate.sh [N]      (default N=5)
#         START_AT=3 bash _research/iterate.sh 5   (resume from session 3)
# Safety: stops the whole loop if a session breaks the gate (no tiraging breakage).
# =============================================================================
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ITER="$ROOT/_research/iterations"
AUDIT="$ROOT/_audit"
N="${1:-5}"
START_AT="${START_AT:-1}"
DECKS=( "Lectures/00-introduction.html" "Lectures/01-search-ir-ml-system-design.html" "Lectures/02-nlp-tokenization-similarity.html" )
# representative slides per deck for the VLM (style + hall-legibility, both themes)
SHOTS_L0="1,2,6,8,10,21"; DECK_L0="00-introduction.html"
SHOTS_L1="1,5,6,24,33,40,56"; DECK_L1="01-search-ir-ml-system-design.html"
SHOTS_L2="1,5,6,23,34,49,57,62,71"; DECK_L2="02-nlp-tokenization-similarity.html"
CLAUDE_FLAGS=( -p --dangerously-skip-permissions --add-dir "$ROOT" )
MAX_SESSION_SEC="${MAX_SESSION_SEC:-4500}"   # watchdog: kill a session's claude after N sec (macOS has no `timeout`)

log(){ echo "[$(date '+%H:%M:%S')] $*" | tee -a "$ITER/harness.log"; }

backup(){ # $1 = dest dir
  mkdir -p "$1"; for d in "${DECKS[@]}"; do cp "$ROOT/$d" "$1/"; done
  cp -R "$ROOT/Lectures/css" "$1/css"
}
restore(){ # $1 = src dir
  for d in "${DECKS[@]}"; do cp "$1/$(basename "$d")" "$ROOT/$d"; done
  rm -rf "$ROOT/Lectures/css"; cp -R "$1/css" "$ROOT/Lectures/css"
}
# Gate = BOTH checks: 0/0/0 errors (wbw-check) AND no real visual clipping (visual-gate).
# A slide can be 0/0/0 yet visually cropped (the viz-frame bug), so both are mandatory.
gate(){ ( cd "$AUDIT" && node wbw-check.mjs && echo "--- visual-gate ---" && node visual-gate.mjs \
         && echo "--- image-gate (palette) ---" && node image-gate.mjs \
         && echo "--- facts-gate (claims + arithmetic) ---" && python3 "$ROOT/_research/check_claims.py" \
         && echo "--- narrative-gate (anchors + agenda→divider) ---" && python3 "$ROOT/_research/check_narrative.py" ) ; }

run_session(){
  local i="$1" sdir="$ITER/session_$(printf '%02d' "$1")"
  mkdir -p "$sdir/shots" "$ITER/prompts"
  log "=== SESSION $i/$N — backup ==="
  backup "$sdir/pre"

  # Build the session prompt: AGENDA (with N substituted) + LESSONS + directive.
  local prompt_file="$sdir/prompt.txt"
  { sed -e "s/{SESSION_N}/$i/g" -e "s/{SESSION_TOTAL}/$N/g" "$ITER/AGENDA.md"
    echo; echo "=== CURRENT LESSONS (fix blocking first) ==="; echo
    cat "$ITER/LESSONS.md"
    echo; echo "=== DIRECTIVE ==="
    echo "Work session $i of $N now. Depth over breadth. End at 0/0/0 (node _audit/wbw-check.mjs)."
    echo "Write your summary to $sdir/notes.md. Make prompts stricter than last session."
  } > "$prompt_file"

  log "SESSION $i — running claude -p (watchdog ${MAX_SESSION_SEC}s)…"
  # exec so $! is the claude PID (not a pipe subshell), enabling a clean watchdog kill.
  ( cd "$ROOT" && exec claude "${CLAUDE_FLAGS[@]}" < "$prompt_file" ) > "$sdir/session.log" 2>&1 &
  local cpid=$! waited=0
  while kill -0 "$cpid" 2>/dev/null; do
    sleep 30; waited=$((waited+30))
    if [ "$waited" -ge "$MAX_SESSION_SEC" ]; then
      log "SESSION $i — WATCHDOG fired (${MAX_SESSION_SEC}s): killing claude $cpid + children + stray monitor loops"
      pkill -P "$cpid" 2>/dev/null; kill "$cpid" 2>/dev/null
      pkill -f 'until ! pgrep' 2>/dev/null   # kill the self-matching wait-loops session 1 spawned
      break
    fi
  done
  wait "$cpid" 2>/dev/null; local rc=$?
  log "SESSION $i — claude finished rc=$rc (waited ${waited}s)"

  log "SESSION $i — gate (wbw-check 0/0/0)…"
  if ! gate > "$sdir/gate.log" 2>&1; then
    log "SESSION $i — GATE FAILED. Rolling back to pre-session state and STOPPING."
    tail -30 "$sdir/gate.log" | tee -a "$ITER/harness.log"
    restore "$sdir/pre"
    echo "session $i: GATE FAIL — rolled back" >> "$ITER/STATUS"
    return 1
  fi
  log "SESSION $i — gate PASSED."

  log "SESSION $i — screenshots (light+dark)…"
  # §4.1 FULL COVERAGE: light = ALL slides (so the VLM sees 100%, not a ~15% fixed sample —
  # this is what let s30 slip). dark = the curated contrast-sensitive sample (dividers/finals/
  # heroes); deterministic contrast is already checked in BOTH themes on 100% of slides by visual-gate.
  local relshots="_research/iterations/session_$(printf '%02d' "$i")/shots"   # repo-relative (path has [brackets])
  ( cd "$AUDIT" \
      && node shot.mjs "$DECK_L0" all "$relshots" light && node shot.mjs "$DECK_L0" "$SHOTS_L0" "$relshots" dark \
      && node shot.mjs "$DECK_L1" all "$relshots" light && node shot.mjs "$DECK_L1" "$SHOTS_L1" "$relshots" dark \
      && node shot.mjs "$DECK_L2" all "$relshots" light && node shot.mjs "$DECK_L2" "$SHOTS_L2" "$relshots" dark \
  ) >> "$sdir/session.log" 2>&1
  log "SESSION $i — screenshots: 100% light coverage (all slides) + dark contrast-sample"

  # §2.3 golden-screenshot regression: report what this session changed vs the pre-series baseline
  # (review-gate, non-blocking — a change may be intended; the VLM + this list flag the unintended).
  ( cd "$AUDIT" && node golden.mjs ) > "$sdir/golden.log" 2>&1 || true
  log "SESSION $i — golden diff: $(grep -E 'CHANGED=' "$sdir/golden.log" 2>/dev/null | tail -1 || echo 'n/a')"

  # §4.3 cross-deck consistency (review-gate, non-blocking): same-type elements should look identical.
  ( cd "$AUDIT" && node crossdeck-gate.mjs ) > "$sdir/crossdeck.log" 2>&1 || true
  log "SESSION $i — crossdeck: $(grep -E 'WARN\(diverge\)=' "$sdir/crossdeck.log" 2>/dev/null | tail -1 || echo 'n/a')"

  log "SESSION $i — VLM review…"
  local vlm_prompt
  vlm_prompt="You are an INDEPENDENT visual reviewer with a FRESH context: you have NOT seen prior \
sessions' notes or rationalizations — judge only what is on screen now. Read the rubric at \
$ITER/RUBRIC.md and the canon ($ITER/CHARACTER_BIBLE.md, $ITER/REDESIGN_BRIEF.md, $ITER/AUDIT_V2.md). \
The shots in $sdir/shots/ are FULL coverage: every slide in light (named ...-sNN-light.png) + a dark \
contrast sample. Read EVERY PNG — do not sample. \
ANTI-RATIONALIZATION (§4.2): the deterministic gates already ran (wbw-check, visual-gate, image-gate); \
you may NOT talk away a number they report (e.g. a SUBJECTSMALL=51% or a TEXTCLIP) with narrative — \
bind every verdict to evidence. \
Assess against the rubric; write machine-readable JSON to $sdir/vlm.json in the rubric's exact schema, \
and INCLUDE a 'coverage' field: {light_seen, dark_seen, total} per deck (you must confirm you saw 100% \
of the light shots). Then PREPEND a '## Session $i — VLM review' section to $ITER/LESSONS.md with the \
coverage line, scores, blocking items, prioritized findings (deck:slide — issue + fix), and wins. Be \
strict and specific; cite slide numbers. Do not edit the decks."
  ( cd "$ROOT" && printf '%s' "$vlm_prompt" | claude "${CLAUDE_FLAGS[@]}" ) > "$sdir/vlm.log" 2>&1
  log "SESSION $i — review done. notes: $sdir/notes.md ; review: $sdir/vlm.json"

  # VLM is a BLOCKING gate: halt the loop (for human review) if it raised any blocking
  # item or scored a visual dimension below 4 (art = WBW-style fidelity, layout = fit/legibility).
  local vblock=0
  if [ -f "$sdir/vlm.json" ]; then
    vblock=$(node -e "try{const v=require('$sdir/vlm.json');const s=v.scores||{};const low=['art','layout'].some(k=>(s[k]??5)<4);process.stdout.write(String((Array.isArray(v.blocking)?v.blocking.length:0)+(low?1:0)))}catch(e){process.stdout.write('0')}" 2>/dev/null || echo 0)
  fi
  if [ "${vblock:-0}" != "0" ]; then
    log "SESSION $i — VLM BLOCKING ($vblock issue(s); art/layout<4 or blocking[] non-empty). See $sdir/vlm.json. Halting loop for review (work kept, not rolled back)."
    echo "session $i: VLM-BLOCK ($vblock)" >> "$ITER/STATUS"
    return 2
  fi
  echo "session $i: OK" >> "$ITER/STATUS"
  return 0
}

log "################ ITERATION HARNESS — $N sessions (start $START_AT) ################"
# §4.4 port-preflight: a stale gate/server on a fixed port → mid-run EADDRINUSE. Fail fast.
for p in 8137 8141 8143 8147; do
  if lsof -ti "tcp:$p" >/dev/null 2>&1; then
    log "ABORT: port $p already in use (another gate/server/harness running). Free it, then retry."
    exit 3
  fi
done
# §2.4 detector self-test preflight: a blind detector must abort the whole series.
log "Preflight: detector self-tests (image-gate · facts-gate · visual-gate)…"
if ! ( cd "$AUDIT" && node image-gate.mjs --selftest \
         && python3 "$ROOT/_research/check_claims.py" --selftest \
         && python3 "$ROOT/_research/check_narrative.py" --selftest \
         && node gate-selftest.mjs \
         && node crossdeck-gate.mjs --selftest ) >> "$ITER/harness.log" 2>&1; then
  log "ABORT: a HARD detector failed its known-bad fixture (image/facts/visual-gate selftest). Fix the detector before running."
  exit 3
fi
# §2.3 golden-screenshot baseline = the pre-series state; per-session diffs report cumulative drift.
log "Preflight: approving golden-screenshot baseline…"
( cd "$AUDIT" && node golden.mjs --approve ) >> "$ITER/harness.log" 2>&1 \
  || log "WARN: golden baseline approve failed — per-session regression diffs will be skipped."
# §1.3 CoVe: fresh-context citation verification (once per series). The claim-verifier sees ONLY the
# deterministically-extracted attributions (citations.json), never the decks — the independence trick.
# MISMATCH is SURFACED (logged), not auto-rolled-back: agent judgement is nuanced, so the editor/VLM
# acts on cove.json (this is exactly how the L1:s41 Netflix/Chapelle misattribution was caught).
log "Preflight: CoVe citation verification…"
python3 "$ROOT/_research/extract_citations.py" >> "$ITER/harness.log" 2>&1 || true
cove_prompt="You are an INDEPENDENT citation verifier with a FRESH context — you have NOT seen the slides, only the extracted citations. Read $ROOT/_research/data/citations.json (array of {id,citation,claim}). For EACH, verify against the REAL paper (use WebSearch / the paper-search MCP tools) that the claimed contribution matches the paper's ACTUAL contribution; catch wrong-paper attributions. Write JSON to $ITER/cove.json: {\"results\":[{\"id\":..,\"citation\":..,\"verdict\":\"OK|MISMATCH|UNVERIFIABLE\",\"note\":..}]}. Do not edit any files."
( cd "$ROOT" && printf '%s' "$cove_prompt" | claude "${CLAUDE_FLAGS[@]}" ) > "$ITER/cove.log" 2>&1 || true
cove_mm=$(node -e "try{const v=require('$ITER/cove.json');process.stdout.write(String((v.results||[]).filter(r=>r.verdict==='MISMATCH').length))}catch(e){process.stdout.write('?')}" 2>/dev/null || echo '?')
log "Preflight: CoVe done — ${cove_mm} citation MISMATCH(es) (see $ITER/cove.json; surfaced, non-blocking)."
for i in $(seq "$START_AT" "$N"); do
  run_session "$i"; rc=$?
  if [ "$rc" = "1" ]; then
    log "Loop HALTED at session $i — GATE FAILURE (rolled back to pre-session). Inspect session_$(printf '%02d' "$i")/gate.log; fix, then resume with START_AT=$i."
    exit 1
  elif [ "$rc" = "2" ]; then
    log "Loop HALTED at session $i — VLM BLOCKING (work KEPT). Review session_$(printf '%02d' "$i")/vlm.json + LESSONS.md; address, then resume with START_AT=$((i+1))."
    exit 2
  fi
done
log "################ ALL $N SESSIONS COMPLETE ################"
