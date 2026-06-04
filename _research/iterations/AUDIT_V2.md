# AUDIT_V2.md — audit-strengthening spec (grounded in the 5-session retro)

> Each item below is derived from a REAL incident in sessions 1–5. Format:
> **Why** (the incident) · **Build** (what to add) · **Where** (file) · **Severity** ·
> **Validate** (must self-test) · **Status**. Every new HARD detector MUST ship with a
> known-bad fixture proving it fires (see §2.4) — no silent detectors.
> Gates stay: `wbw-check` (0/0/0) + `visual-gate` (HARD=0); this spec extends both and adds
> two new audit stages (`facts-gate`, `image-gate`) + a coverage report.
> Severity legend: **HARD** = blocks the session (rollback or halt). **WARN** = reported, non-blocking.

---

## 1. Facts & narrative logic (today: only the subjective VLM)

### 1.1 Claims-ledger (deterministic numbers)
- **Why:** session-4 citation/number drift; numbers were trusted, not checked.
- **Build:** `_audit/facts-gate.mjs` (or `_research/check_claims.py`) extracts every number / date /
  attribution / formula token from each slide's DOM, and asserts each numeric claim **matches an
  artifact** in `_research/data/*.json` exactly (β≈0.59, √162≈12.73, γ≈0.94, 94 287 types, …).
  Any number with no matching grounded source → flag.
- **Where:** `_research/check_claims.py` (Python — reads the JSON artifacts + decks directly).
  **Severity:** number that contradicts an artifact = **HARD** (DRIFT); a must-appear grounded value
  that is ABSENT = **HARD** (MISSING).
- **Validate:** fixture with a wrong number (β=0.42) must flag. **Status:** ✅ **DONE.** Manifest of
  **8 grounded values** (heaps β 0.59 + R² 0.998, Zipf slope −1.02 + V=94 287 types, Euclid √162≈12.73,
  pos-bias γ=0.94 + top-1 32.3% + top-3 60.6%); each re-reads its artifact at runtime (so the manifest
  can't drift from the source) and asserts the displayed value matches within tolerance. Decks pass
  clean (HARD=0, 100% of grounded values); `--selftest` fires DRIFT on β=0.42. Wired into `iterate.sh`
  gate() + the self-test preflight.

### 1.2 Arithmetic verified by code
- **Why:** worked examples (cosine, BPE-merge, WordPiece scores) were taken on faith.
- **Build:** for each worked-example slide, re-compute the arithmetic in Python (e.g. ‖a−b‖, cos,
  the BPE score `freq(AB)·|V|/(freq(A)·freq(B))`, merge counts) and compare to the slide's stated
  result within tolerance.
- **Where:** folded into `_research/check_claims.py` (`arithmetic_checks`). **Severity:** mismatch = **HARD**.
  **Validate:** perturb one result, confirm it fires. **Status:** ✅ **DONE (full).** (1) Re-computes the
  cosine worked example — u=(1,1), v=(10,10) → cos=1.0, Euclid=√162≈12.73 — vs `cosine_examples.json`
  + slide. (2) GENERAL: scans every displayed `a·b/(c·d) = result` across all decks (both `\frac{}{}`
  and inline-division forms) and recomputes it — the BPE/WordPiece merge scores (29/30/31) live here.
  6 displayed fractions all correct; `--selftest` fires on a planted `1·29/(1·1) = 28`.

### 1.3 CoVe verifier with clean context
- **Why:** session-4 VLM mis-attributed Craswell/Joachims; the same agent that wrote it can't catch it.
- **Build:** a fresh-context verifier (the `claim-verifier` agent) that NEVER saw the decks or prior
  rationalizations; it gets ONLY the extracted citation + the claimed contribution and checks each
  against the real paper (attribution must match the paper's actual contribution per title/abstract).
- **Where:** `_research/extract_citations.py` (deterministic extraction → `data/citations.json`) +
  a `claim-verifier` agent run in the harness preflight. **Severity:** wrong attribution = surfaced
  (logged in `cove.json`), NOT auto-rolled-back (agent judgement is nuanced; editor/VLM acts).
  **Status:** ✅ **DONE — and it caught a real bug.** Extraction pulls 16 inline author–year
  attributions + their claimed contribution (skips refs/title/final, filters venue/month noise). A
  fresh-context verifier (sees ONLY citations.json, never the decks) checked each vs the real paper:
  **15 OK / 1 MISMATCH**. The MISMATCH (**L1:s41**) had survived all 5 sessions + the backlog pass —
  the ">100× more sensitive" figure read as Chapelle et al. 2012's, but that's Netflix's own
  interleaving study (2017); Chapelle 2012 contributes the "1–2 orders of magnitude" result. FIXED.
  Wired into `iterate.sh` preflight (extract → claim-verifier → `cove.json`, MISMATCH count logged).

### 1.4 Narrative-logic graph (deterministic + targeted VLM)
- **Why:** no check that a term is introduced before use, or that the catchphrase opens↔closes.
- **Build:** dependency pass — flag a term used before its `definition` slide; assert agenda `#/N`
  anchors resolve to dividers AND the lecture catchphrase appears on both an opening beat and the
  finale. Plus a dedicated VLM pass scoring ONLY "connectedness / non-sequitur between adjacent slides".
- **Where:** `_research/check_narrative.py` (static) + VLM rubric `narrative` sub-score.
  **Severity:** broken anchor = **HARD**; agenda-target-not-a-divider = **WARN**. **Status:** ✅ **DONE
  (structural parts).** Anchor integrity (every internal `#/N` resolves; slide № = leading int of
  `data-screen-label`, verified sequential 1..N) + agenda→divider (each jump lands on a section break /
  closing). All three decks clean; `--selftest` fires on `#/999`. Also covers §2.5's anchor check.
  Wired into gate() + preflight. **DEFERRED to the full-coverage VLM** (not static): catchphrase
  bookending + term-used-before-defined — a static text check false-positives (the closing Serega
  cameo is `aria-hidden`, so the mascot has no late-slide *text*); the VLM `narrative` sub-score judges flow.

---

## 2. Template (catch what the editor missed by hand)

### 2.1 Structural contract per slide-type
- **Why:** bugs came from malformed/bespoke slides; standardization is a stated goal.
- **Build:** from `TEMPLATE_CATALOG.md`, assert each `data-type=X` slide has the required DOM +
  only whitelisted classes, and **no bespoke inline styles** outside an allowlist (promotes the
  "classes over inline" rule into a gate).
- **Where:** `_audit/visual-gate.mjs` (DOM pass, no render needed). **Severity:** missing required
  node = **HARD** (CONTRACT). **Validate:** malformed fixture fires. **Status:** ✅ **DONE.** Added a
  per-type `REQUIRE` map (definition→.def-card, formula→.formula-stage, table→table.cmp-table,
  walkthrough/e2e→.walk-step/.e2e-step[data-step] + data-max-step, misconception→.misc-card,
  agenda→a.toc-item, objectives→.obj-item, arch→.arch-node, timeline→.tl-node, art-hero→.art-hero__fig,
  refs→.ref-list, quiz→exactly one [data-correct="true"]). All 149 slides pass. Validated by
  inject-restore: renaming a `.def-card` fires `CONTRACT type="definition" missing required .def-card`.
  TODO: the stray-inline-style WARN (left out for now — the editor legitimately uses layout-only inline
  styles like img max-width; needs a prop allowlist before it's noise-free).

### 2.2 More "content in-frame but lost" detectors
- **Why:** TEXTCLIP (s30) was a blind spot; others likely remain.
- **Build:** **OVERLAP** (two content elements / a cameo and text whose rects intersect) and
  **MIN-FONT-AT-HALL-SCALE** (effective rendered px after auto-fit < ~22px → flag; this is the
  quiz-overflow concern, currently only the VLM's subjective call).
- **Where:** `_audit/visual-gate.mjs`. **Severity:** OVERLAP (cameo over readable text) = **WARN**.
  **Validate:** overlapping fixture fires. **Status:** 🟡 **OVERLAP DONE; MIN-FONT DROPPED (with cause).**
  OVERLAP added (a `.cameo` covering >22% of a text block's area); validated by inject-restore
  (enlarged the L0:s21 cameo → `OVERLAP cameo covers 24% of "Let's begin."`). **MIN-FONT investigated
  and DROPPED:** this engine renders every slide at `scale=1.000` (verified across all 149 slides) —
  there is NO measurable auto-fit shrink, so effective-px == design-px and a scale-based font gate
  would be permanently blind (forbidden by §2.4). Overflow legibility is already covered by OVERFLOW-V.
  Rationale is recorded as a code comment where the detector would have lived.
- **Done already (this class):** OVERFLOW-H, OFFFRAME, CLIPPED(img), LOWCONTRAST, SUBJECTSMALL, TEXTCLIP,
  CONTRACT, OVERLAP.

### 2.3 Golden-screenshot regression
- **Why:** the editor's L2-57 inset fix crowded the bottom line; only the VLM caught it.
- **Build:** keep a per-slide approved baseline PNG; pixel-diff each render; flag changed regions
  above a threshold for review (catches unintended visual regressions deterministically).
- **Where:** `_audit/golden.mjs` + `_audit/golden/` baselines (local, gitignored). **Severity:**
  unreviewed diff = **WARN** (review-gate, non-blocking). **Status:** ✅ **DONE.** `golden.mjs --approve`
  captures all 149 slides (light, `--no-chrome`); default mode re-renders + `magick compare -metric AE
  -fuzz 2%` per slide, flags CHANGED > 2500 px. **Key fix:** the auto-hiding nav `.toolbar` made
  renders non-deterministic (35k-px phantom diff on the title slide) — added `--no-chrome` to `shot.mjs`
  to hide it, after which the no-change baseline is a clean 0/0/0. Validated: a one-line caption edit on
  L0:s10 flagged exactly `s10 (6286 px)` and nothing else. Wired into `iterate.sh`: baseline approved in
  preflight, per-session diff logged to `golden.log` (cumulative drift vs pre-series).

### 2.4 Detector self-test (regression suite for the gate itself)
- **Why:** SUBJECTSMALL once mis-cleared L2-57; TEXTCLIP was validated MANUALLY (revert→fire→restore).
- **Build:** `_audit/gate-selftest.mjs` — a folder of known-bad fixture slides, one per detector;
  the harness runs it FIRST and aborts the series if any detector fails to fire on its fixture.
- **Where:** `_audit/gate-selftest.mjs` + `image-gate.mjs --selftest` + `check_claims.py --selftest`.
  **Severity:** a blind detector = **HARD** (abort, exit 3). **Status:** ✅ **DONE.** Three self-tests now
  run in the harness preflight; any blindness aborts the series: (1) `image-gate --selftest` (purple →
  OUTOFPALETTE, green-on-non-Serega → GREEN-LEAK); (2) `check_claims.py --selftest` (β=0.42 → DRIFT);
  (3) `gate-selftest.mjs` — writes a throwaway fixture deck (L2 + injected violations), runs visual-gate
  on it, asserts **CONTRACT + TEXTCLIP + OVERLAP** all fire, deletes the fixture. (visual-gate gained a
  one-line tweak to accept any deck filename, not just the 3 canon decks, so the fixture can be pointed
  at.) Institutionalizes the manual revert→fire→restore validation across all the newer detectors.

### 2.5 Links/anchors + asset weight as deterministic gates
- **Why:** agenda `#/N` anchors had to be hand-fixed on every insert; image weight regressed to ~95 MB once.
- **Build:** assert every internal `#/N` / cross-link resolves; assert total `assets/img` weight <
  budget (≈25 MB) and each image < cap (≈400 KB).
- **Where:** anchors → `check_narrative.py` (§1.4, DONE); weight → `image-gate.mjs`. **Severity:** broken
  anchor = **HARD**; over-budget = **WARN**. **Status:** ✅ **DONE.** Anchor integrity shipped in §1.4.
  Weight pass added to `image-gate`: total budget 30 MB, per-file cap 512 KB; current = 8.3 MB / largest
  448 KB → WARN=0. (Reports total weight every run so a regression toward the old 95 MB is visible.)

---

## 3. Image generation (unified palette + references)

### 3.1 Palette gate (deterministic)
- **Why:** Goodhart green-cap leak, orange alien, orange wraith — all caught only by VLM eyes over 2–3 sessions.
- **Build:** `_audit/image-gate.mjs` — quantize each generated PNG; assert dominant colours ∈
  {black/ink, blue #2A6FDB, orange #E8743B}; **green #2F7D4F allowed only on Serega-tagged images and
  only in a small area (the cap)**. Any purple/red/large-orange-fill/green-on-non-Serega → flag.
- **Where:** new `_audit/image-gate.mjs` (post-gen, per PNG). **Severity:** out-of-palette dominant = **HARD**.
  **Validate:** feed an off-palette fixture image, confirm it fires. **Status:** ✅ **DONE.** Built
  `_audit/image-gate.mjs` using **HSV banned-hue mass** (robust to AA/JPEG mid-tones: only
  saturated≥0.30 pixels count). Detects OUTOFPALETTE (off-brand saturated hue), GREEN-LEAK
  (green on non-Serega, has_serega parsed from gen_images JOBS), GREEN-LARGE. `--selftest` fixtures
  (purple + green-leak) both fire; all 40 current images pass HARD=0 (100% coverage). Wired into
  `iterate.sh` gate() + a self-test preflight that aborts the series if a detector goes blind.

### 3.2 Activate `--ref` (plumbing already built)
- **Why:** character drift was fought with text-prompt repetition for 5 sessions; `--ref` was never on.
- **Build:** host `serega-charsheet`/`whoami` (GitHub Pages https), pass as `image_url` (`mode=image`)
  for every Serega scene; add **per-character reference** (Tokenosaurus, the alien) so continuity
  (s06↔s71) holds by construction. `gen_images.py --ref <url>` exists; wire a `REFS` map per character.
- **Where:** `_research/gen_images.py` (+ a hosted-URL config). **Severity:** n/a (generation policy).
  **Dependency:** GitHub Pages publish. **Status:** PLUMBING DONE, ACTIVATION BLOCKED on hosting.

### 3.3 Generate-N-keep-best
- **Why:** L2-57 letterbox "regen-blind" failed 3 consecutive sessions.
- **Build:** generate N candidates per image; auto-score each (palette §3.1 + subject-coverage
  [SUBJECTSMALL bbox] + OCR-no-text §3.4); keep the highest scorer; if none passes, fall back to a
  layout fix (trim/inset) rather than re-rolling.
- **Where:** `_research/gen_images.py` (`--best N`). **Severity:** n/a. **Status:** PLANNED.

### 3.4 OCR-no-text (deterministic, replaces VLM eyeballing)
- **Why:** baked-in "Wait But Why" / "TOKENIZATION" signage slipped until VLM noticed.
- **Build:** run OCR (Tesseract) on each generated PNG; allow ONLY the short labels named in that
  image's prompt; any extra recognized text → flag.
- **Where:** `_audit/image-gate.mjs` (tesseract, `--psm 11`). **Severity:** baked watermark = **HARD**.
  **Status:** ✅ **DONE.** Uses a **denylist** of forbidden phrases (`waitbutwhy`, `placeholder`, …) rather
  than "only allowed labels" — high-precision, so legit hand-lettered labels (`embeddings`, `qu`) never
  false-flag. All 40 real images clean (the anti-pattern prompts held); `--selftest` fires BAKEDTEXT on a
  "Wait But Why" fixture. Fast (~8 s for 40 imgs). Skips gracefully if tesseract is absent.

---

## 4. Cross-cutting strictness

### 4.1 Coverage as an explicit metric (TOP PRIORITY)
- **Why:** the VLM saw only the fixed shot-list = **22 of 149 slides (~15%)**; **~85% were never
  VLM-reviewed** → s30 slipped and the USER found it.
- **Build:** every audit reports `inspected / total` per deck. Deterministic gates (`wbw-check`,
  `visual-gate`, `facts-gate`, `image-gate`) MUST be **100%**. The VLM moves to **full coverage with
  stratified rotation** (every slide reviewed across the series; no permanent fixed sample), and the
  harness logs which slides each session's VLM actually saw.
- **Where:** harness (`iterate.sh`) + each gate's summary line. **Severity:** any gate < 100%
  deterministic coverage = **HARD** (config error). **Status:** ✅ **DONE.** `shot.mjs` now supports
  `all` (1..total) + a theme arg; the harness shoots **100% of slides in light** + the curated
  contrast-sensitive sample in dark (deterministic contrast already covers BOTH themes 100% via
  visual-gate). `shot.mjs` prints `coverage: N/total × themes`; `image-gate` prints `inspected N/N
  (100%)`. The VLM prompt now states the shots are full coverage, forbids sampling, and must emit a
  `coverage:{light_seen,dark_seen,total}` field confirming it saw 100% of light shots. *(Closes the s30 class.)*

### 4.2 Anti-rationalization for the VLM
- **Why:** session-4 VLM "rationalized away" the L2-57 rails ("natural diagonal artefact").
- **Build:** the VLM gets a **fresh context** and must **bind each verdict to the deterministic
  detector number** (e.g. it cannot clear a SUBJECTSMALL=51% by narrative); borderline calls use
  **≥2 independent reviewers / majority vote**.
- **Where:** harness VLM stage prompt + a second reviewer pass on contested items. **Severity:**
  unbound hand-wave override = ignored. **Status:** 🟡 **PARTIAL.** VLM prompt now declares a FRESH
  context (hasn't seen prior rationalizations) and an explicit anti-rationalization clause: it may
  NOT talk away a deterministic-gate number (SUBJECTSMALL/TEXTCLIP) with narrative — verdicts bind to
  evidence. TODO: the ≥2-independent-reviewers / majority-vote pass on contested items.

### 4.3 Cross-deck consistency
- **Why:** "same role → same look" was a goal but never gated.
- **Build:** compare computed styles of same-`data-type` slides across L0/L1/L2 (a `definition` must
  render identically everywhere); flag divergence.
- **Where:** `_audit/crossdeck-gate.mjs` (playwright). **Severity:** divergent same-type styling = **WARN**.
  **Status:** ✅ **DONE.** Compares computed font/colour/border of role-signature elements **scoped by
  slide-type** (`.slide[data-type="definition"] .def-term`, `…[objectives] .obj-check`, table `th`,
  `.divider-num`, kicker, …) across all 3 decks; since they share one stylesheet, any divergence = a
  deck-local override. Real decks: **WARN=0** (consistent). `--selftest` injects an inline override into
  one deck → DIVERGE fires. **Key design note:** selectors MUST be type-scoped — comparing the first
  match in document order is unsound (L0's only `.def-term` is an instructor name-card, L0's first
  `.obj-check` is a non-objectives checklist — both legitimately differ and gave false DIVERGEs until scoped).

### 4.4 Process discipline (codified)
- **Why:** the harness hung on a self-matching `pgrep` loop; the editor's doubled `&` orphaned a run.
- **Build (rules, mostly DONE):** watchdog timeout on `claude -p` (DONE); AGENDA bans self-matching
  `until ! pgrep <pattern>` loops (DONE); the harness — not inline `&` — owns process tracking, and
  gates are NEVER run manually while a session is live (fixed-port clash). Add: a preflight that
  refuses to start if another `iterate.sh`/gate server is already bound to ports 8137/8141/8143/8147.
- **Where:** `iterate.sh`. **Severity:** port-in-use at start = **HARD** (abort). **Status:** ✅ **DONE.**
  watchdog + pgrep-ban (prior) + **port-preflight** now added: the harness `lsof`-checks ports
  8137/8141/8143/8147 at the very start and aborts (exit 3) if any is bound (stale gate/server/harness).

---

## Build order (risk-caught ÷ effort) — progress
1. ✅ **§4.1 coverage metric + full VLM coverage** — DONE (closed the s30 root class).
2. ✅ **§3.1 palette gate** — DONE · ⛔ **§3.2 `--ref`** — blocked on GitHub Pages hosting.
3. ✅ **§1.1 claims-ledger + §1.2 arithmetic** — DONE (facts now checkable, not subjective).
4. ✅ **§2.1 structural contract** (CONTRACT) + **§2.2 OVERLAP** — DONE · MIN-FONT dropped (engine has no auto-fit shrink to measure).
5. ✅ **§2.3 golden-screenshot + §2.4 detector self-test (full)** — DONE (regression baseline + 3 preflight self-tests).

**Build order COMPLETE + nearly all 2nd-tier DONE.** Also DONE: ✅ §1.2 full, ✅ §1.3 CoVe,
✅ §1.4 narrative graph, ✅ §2.5 anchors+asset-weight, ✅ §3.4 OCR-no-text, ✅ §4.3 cross-deck,
✅ §4.4 port-preflight.
Remaining: §3.2 `--ref` (⛔ blocked on Pages), §3.3 generate-N-keep-best (needs API),
§4.2 majority-vote (VLM-side).

**Gate stack now (preflight → per-session):**
PREFLIGHT — port-check (8137/8141/8143/8147 free, else abort) → 4 detector self-tests (`image-gate`
incl. BAKEDTEXT, `check_claims`, `check_narrative`, `gate-selftest`); any blind detector aborts
(exit 3) → golden baseline approved → CoVe citation verification (`cove.json`).
PREFLIGHT self-tests are 5 now (image, claims, narrative, gate-selftest, crossdeck).
PER-SESSION — `wbw-check` (0/0/0) → `visual-gate` (HARD=0; 8 detectors incl. CONTRACT/OVERLAP/TEXTCLIP)
→ `image-gate` (palette + OCR-no-text + weight) → `facts-gate` (claims + all-fractions arithmetic) →
`narrative-gate` (anchors+agenda) → `golden` diff + `crossdeck` (both review-gates), all 100% coverage,
then a full-coverage anti-rationalizing VLM. Remaining: §3.2(`--ref`, Pages-blocked), §3.3, §4.2(vote).

Each shipped item flips its **Status** to DONE here and is added to the gate's `--list`/summary so
the next series enforces it. New HARD detector ⇒ a fixture in `_audit/fixtures/` (§2.4) is mandatory.
