# LESSONS.md — accumulated review findings (newest at top). Read before each session.

## AUDIT_V2 §1.3 CoVe + §1.4 narrative-gate — built, and CoVe caught a REAL misattribution
- **§1.4 narrative-gate (`_research/check_narrative.py`, deterministic):** anchor integrity (every
  internal `#/N` resolves; HARD) + agenda→divider (each agenda jump lands on a section break /
  closing; WARN). Slide number = leading int of `data-screen-label` (verified sequential 1..N). All
  three decks clean; `--selftest` fires on `#/999`. Wired into gate() + preflight. (Catchphrase
  bookend + term-before-defined were DEFERRED to the full-coverage VLM — a static text check
  false-positives, e.g. the closing Serega cameo is aria-hidden so "Serega" has no late-slide text.)
- **§1.3 CoVe citation verifier:** `extract_citations.py` deterministically pulls inline author–year
  attributions + their claimed contribution (skips refs/title/final, filters venue/month noise) →
  `_research/data/citations.json` (16 attributions). A FRESH-CONTEXT claim-verifier agent (never sees
  the decks — the independence trick) checked each against the real paper. Verdict: **15 OK / 1
  MISMATCH**. The MISMATCH (**L1:s41**) survived all 5 sessions + the backlog pass: the ">100× more
  sensitive" interleaving figure read as **Chapelle et al. 2012**'s, but that paper (search-engine
  interleaving validation) reports the **1–2 orders of magnitude** gain; the **>100×** is **Netflix's
  own interleaving study (2017)**. FIXED: split the attribution so each number is correctly sourced.
  Wired into the harness preflight (extract + claim-verifier → `cove.json`; MISMATCH surfaced, not
  auto-rolled-back — agent judgement is nuanced, editor acts on it). **Lesson: a fresh-context
  verifier catches drift that same-context review keeps missing — run CoVe whenever citations change.**


## Editor bug-fix (user-reported) — L2:s30 corpus line clipped + NEW TEXTCLIP gate
User caught L2:s30 (e2e "WordPiece, worked"): the left panel's corpus line was rendered as KaTeX
DISPLAY MATH `$$\text{corpus}=\texttt{"the quick brown fox jumps over the lazy dog"}$$`. Math never
wraps, so the long `\texttt{}` string overflowed the `.e2e-panel` (overflow:hidden) and was clipped
("…over th" → gone). Fix: render the literal string as WRAPPING HTML (mono span, `white-space:normal;
overflow-wrap:anywhere`), not math. **Authoring rule (now in TEMPLATE_CATALOG): long literal strings
/ code go in HTML that wraps, NEVER inside `$$…$$` (KaTeX display math is single-line, no wrap).**
NEW GATE: added a **TEXTCLIP** detector to `visual-gate.mjs` (HARD) — scans inner overflow:hidden
boxes for `scrollWidth/Height > clientWidth/Height`, catching content (text/math) clipped inside an
in-frame box. **Validated**: it fires `TEXTCLIP-X .e2e-panel 866>687px` on the reverted bug, 0 in
the fixed state. This closes the last gate blind spot (box-vs-frame + image-CLIPPED + contrast +
TEXTCLIP now cover overflow, off-frame, image-crop, colour-on-colour, and text-in-box clipping).


## Editor backlog pass (post-session-5) — targeted polish, gates green (0/0/0, HARD=0)
Resolved the session-5 non-blocking findings; decisions recorded so future sessions don't reopen:
- **L2:s49 Sir Cosine SUBJECTSMALL (3-session carry) — ACCEPTED, EXEMPTED.** The "Knights of the
  Unit Sphere" banner is canon (CHARACTER_BIBLE); ~51% coverage is banner-by-design. Added
  `L2-48-sir-cosine.png` to `SUBJECT_EXEMPT` in visual-gate (do NOT re-flag / 4th regen).
- **L0:s10 arch course-arc doodle — ENLARGED.** Scoped inline `max-height:30vh; max-width:94%`
  on the `.art-strip img` fills the band the s5 arch-frame tightening freed.
- **L0:s21 final — BOOKEND CAMEO ADDED.** New `_char/serega-cameo-wave.png` (Captain Serega waving,
  green tübetey, no text) wired as `.cameo.bl`, mirroring L1:s56 / L2:s71 — closes the L0 briefing bookend.
- **Quiz overflow (L1:s15, L2:s16) — ACCEPTED as-is (step-engine re-architecture DECLINED).**
  Both render complete and legible; the engine auto-fit shrink is ~8% and not a real legibility
  defect at hall scale (verified full-frame). The `quiz`→`walkthrough`+`data-max-step` rebuild was
  judged not worth the breakage risk for these two slides. Keep WARN; do not re-attempt unless a
  future quiz genuinely clips content (visual-gate HARD would catch that).
- **Left as accepted/low-priority:** L1:s24 tiny seated figures (regen risk on the strongest
  named-creature slide outweighs the gain) and the dark-theme `PART NN` kicker (s5 weight bump made
  it acceptable; borderline-only). Revisit only if a future reviewer re-raises with evidence.


## Session 5 — VLM review
**gate (independently re-stated):** `wbw-check` 15/0/0 verified against deck counts
(L0=22, L1=56, L2=71 — unchanged from session 4). `visual-gate` HARD=0 in BOTH light
and dark themes (overflow / offframe / clipped / LOWCONTRAST / SUBJECTSMALL); WARN
dropped 4 → 3 (L2:s46 fully cleared via option-trim, removed from the flag list).
Residual WARNs: L1:s15 quiz at 1179 px (untouched), L2:s16 quiz at 1122 px (down
from 1211 via option-A kernel trim, still 42 px over), L2:s49 banner `L2-48-sir-cosine.png`
at 51 % SUBJECTSMALL coverage (third-session carry-forward, explicit session-6
decision required). KaTeX still typesets (L2:s57 ‖x−y‖² → 2(1−cos θ); √162 ≈ 12.73).
No raw `$$` leaks; QR + Prism still render; no baked-in style text observed; **every
visible Serega across 22 sampled PNGs wears the GREEN tübetey** (#2F7D4F) — zero
violations.

**rubric (0–5, strict):** narrative **5** · examples **5** · stepwise **4** ·
templating **4** · history **5** · cases **5** · layout **4** · art **4** ·
data_grounding **5**.
`layout` lifts 3 → 4: the THREE-session L2:s57 letterbox-rails blocker finally
closed (editor PNG-trim + viz-frame centred-inset); L0:s06 charsheet duplicate
labels resolved; title-meta + divider-num + closing-H1 chrome polished. Residual
quiz overflows (L1:s15, L2:s16) and the L2:s49 banner WARN keep it from 5.
`art` holds at 4: the L2:s06 first-contact alien continuity carry-forward is
RESOLVED cleanly (ink outline + three stripes, mirrors L2:s71) — the bookend
works as a single creature on two pages — but L2:s49 sir-cosine banner has now
shipped THREE consecutive sessions at 51 % SUBJECTSMALL, two of those as
explicit "decide one way or the other" hand-offs. `data_grounding` lifts 4 → 5:
L1:s29 Joachims/Craswell citation drift now resolved at slide + .py + .json
levels; CoVe rule extended to "cited contribution must match paper's actual
contribution per title". `stepwise` and `templating` hold at 4: session-4
finding #2 (convert quiz overflows to `walkthrough` + `data-max-step`) was
NOT acted on; session-5 used incremental option-trim (productive but doesn't
solve the engine auto-fit). The institutional step-engine fix is carried
forward in session-5 notes §1 + §4 as the next big move.

**BLOCKING (must fix before session 6):** *none*. Session 5 closed both
session-4 BLOCKERS (L2:s57 rails, L0:s06 duplicate labels) plus the session-4
BLOCKING-finding-1 carry-forward (L2:s06 alien continuity). No new HARD-gate
defects surfaced. The L2:s57 bottom-line crowding (item #1 below) is a layout
follow-on to the editor's centred-inset fix, treated as a high-priority
FINDING rather than a BLOCKER because it does not regress a hard gate.

**FINDINGS (prioritized, deck:slide — issue + fix):**
1. **`L2:s57` — 'How the three relate' bottom line clipped after the editor's
   viz-frame centred-inset fix.** The closing italicized sentence
   *"Magnitude is where they part ways."* now sits flush with the lower canvas
   edge in BOTH themes; the previous fix solved the horizontal-rails defect by
   tightening the viz-frame to 360 px but did not re-budget the vertical stack
   above it. **Do NOT re-open the rails complaint** — the `SUBJECT_EXEMPT`
   allowlist entry for `L2-56-cosine-vs-euclid.png` stands. Fix: either (a) drop
   viz-frame height from 360 → 320 px AND tighten the gap above it, OR
   (b) move the closing sentence above the viz-frame so the figure becomes
   the closing visual beat, not a sandwich element.
2. **`L1:s15` quiz overflow STILL at 1179 px** (engine auto-fit). Options are
   already one-line each — the residual lives in the explanation reveal block.
   Session-5 left this untouched and carry-forwarded the institutional fix:
   add `.slide[data-type="quiz"][data-max-step] [data-step].is-step-hidden
   { display: none }` to `wbw-art.css`, convert L1:s15 to `data-max-step="2"`,
   AND extend `visual-gate.mjs` to also measure each stepped slide at its max
   step (otherwise the step-engine conversion cheats the detector). The two
   changes must land together.
3. **`L2:s16` quiz still 1122 px** (42 px over 1080). Session-5 option-A
   kernel trim landed −89 px (1211 → 1122) — a pedagogical win (the catalog
   rule now reads "options carry kernel claims; reveal carries elaboration")
   but still overshoots. Same institutional fix as #2.
4. **`L2:s49` `L2-48-sir-cosine.png` SUBJECTSMALL WARN STILL at 51 %.** THREE
   consecutive sessions with the flag. Session-5 explicitly punted to session
   6 with two paths laid out in notes §2: (a) re-prompt with "knight + sphere
   fills ≥80 % of frame width edge-to-edge" + drop slide-level viz-frame
   `max-width: 50%` → 60 %, OR (b) add `L2-48-sir-cosine.png` to
   `SUBJECT_EXEMPT` with a one-line LESSONS rationale ('banner composition
   by design'). **Pick one in session 6 — don't ship a fourth flag.**
5. **`L1:s24` Lexical Gremlin tiny seated figures** (carried forward
   untouched from session-4 finding #11). Two seated stick-figures on the
   left of the brick wall at ~3 % slide width without green tübeteys. If
   Seregas, regen with green caps visible at scene scale; if bystanders,
   add a one-line DOM caption ('two users'). Low priority but the metaphor
   currently rides on tiny ambiguous figures.
6. **`L0:s10` arch-doodle still small in the freed band.** S5-3 tightened
   the arch-frame to 360 px (clean improvement — the doodle no longer
   hangs in a vacuum) but the doodle occupies only ~30 % slide width while
   the freed ~300 px vertical band is underutilised. Fix: lift `.art-strip
   img` cap from `max-width: 88%` → 95 % OR add a scoped
   `[data-screen-label="10 Architecture"] .art-strip img { max-height: 38vh }`
   override.
7. **`L0:s21` closing slide missing footer cameo.** L1:s56 ('found it'
   Serega) and L2:s71 (Serega + alien handshake) both carry a corner
   cameo that callbacks the deck's opening character beat. L0:s21 has
   no cameo — a small Captain-Serega-waving callback to L0:s02 'The
   briefing' completes the bookend (the L0 deck IS the briefing-themed
   lecture so the asymmetry is most visible here). Fix: add a
   `.cameo-strip` doodle to L0:s21 mirroring the L2:s71 pattern.
8. **`L1:s05` / `L2:s05` (and L2:s17 / L2:s37 / L2:s49 / L2:s62) dark-theme
   `PART NN` kicker** — session-5 S5-1 weight bump (500 → 600 + 0.22 em
   tracking + 5 px underline at 0.9 opacity) is visibly improved but the
   kicker stroke still reads slightly thin against the editorial-serif
   sub-line. Optional polish: kicker `font-size` +2 px OR underline 2 px → 3 px
   in dark only. Borderline; flag if a future reviewer raises the same
   hall-distance concern.
9. **`L1:s24` gremlin-vs-Serega silhouette ambiguity.** Secondary observation
   for the tiny-figures fix in #5: if the next regen happens for the seated
   figures, ensure the gremlin atop the wall is visually distinct from a
   Serega (no green cap; non-tunic body; distinct silhouette) per the
   CHARACTER_BIBLE 'Lexical Gremlin' spec.

**WINS (this session):**
- **`L2:s06` first-contact alien CONTINUITY FIXED** — the session-4 carry-forward
  (heavy solid-orange body vs L2:s71 ink-outline + three-stripe form) is resolved.
  Regenerated PNG is BLACK INK OUTLINE ONLY with three thin orange stripes on
  ONE outer arm (≤8 % canvas), Serega LEFT alien RIGHT, ≥85 % width composition.
  First-contact (s06) and handshake-callback (s71) now read as the same
  creature on two pages. CHARACTER_BIBLE 'First-Contact Alien' entry locks
  the canon.
- **`L2:s57` letterbox-rails RESOLVED** via editor PNG-trim + viz-frame
  centred-inset. THIRD-session blocking item finally closed. `SUBJECT_EXEMPT`
  allowlist seeded with `L2-56-cosine-vs-euclid.png` prevents the next reviewer
  from re-opening.
- **`L0:s06` charsheet duplicate labels RESOLVED.** `.poses-row` DOM
  figcaption removed; baked-in PNG pose labels are the single source of truth.
- **Closing-slide H1 marker-display face.** L0:s21 'Let's begin.',
  L1:s56 'Questions?', L2:s71 'Questions?' all in the hand-feel marker font
  that opens the deck on title + divider H1s. Each lecture bookends in the
  same personality it opens with. Closes session-4 finding #6.
- **Title-meta LIGHT-theme contrast bumped (S5-2).** `.meta-label` at 72 %
  ink, `.meta-value` at 92 % ink on cream canvas. Closes session-4 finding #7
  at both CSS and gate levels (`.title-footer .meta-label` + `.meta-value`
  added to LOWCONTRAST `TEXT_SEL` sweep).
- **Divider-num DARK weight bump (S5-1).** `.divider-num` weight 600 +
  0.22 em letter-spacing + 5 px underline at 0.9 opacity on dark. Closes
  session-4 finding #8.
- **`L1:s29` Joachims/Craswell citation drift RESOLVED** at slide + .py
  + .json levels. Craswell-Zoeter-Taylor-Ramsey 2008 owns the cascade
  examination model + `1/r^γ` form; Joachims-Granka 2005 owns 'clicks
  reveal relative not absolute relevance'; Enquiro 2005 anchors γ=0.94.
  CoVe rule extended: 'cited contribution must match paper's actual
  contribution per title' — closes session-4 finding #9.
- **`L2:s16` quiz option-A kernel trim** (−89 px) AND **`L2:s46` fully
  resolved** (1178 → under 1080, dropped out of flag list). Catalog rule
  for `data-type="quiz"` now reads 'options carry kernel claims; reveal
  carries elaboration' — the right pedagogical pattern.
- **`L0:s10` arch-frame tightened (S5-3)** to 360 px with companion
  `.art-strip img` cap lift; staircase doodle no longer hangs in a vacuum.
- **`L0:s08` quote slide tightened (S5-4)** with quote-mark line-height
  fix + scoped blockquote margins; first-attempt mistake (raising viz-frame
  max-height OFFFRAMED the figure because aspect-ratio clamps height to
  width × ratio) is captured as the permanent lesson: 'aspect-ratio-bound
  viz-frames are constrained by min(maxW, maxH × ratio); change one
  without the other, the figure clamps OFFFRAME.'
- **Visual gate detector hardened.** SUBJECTSMALL now uses horizontal-bbox-
  width / canvas-width alongside area; `SUBJECT_EXEMPT` allowlist mechanism
  seeded; LOWCONTRAST sweep picks up title-row tokens. The detector reports
  `{area, hspan}` and flags whichever metric trips first.
- **Image prompts hardened.** L2-06 prompt carries (1) CONTINUITY clause
  pinning to L2-70, (2) composition clause `subject spans ≥85 % of canvas
  width edge-to-edge` (future-proofs against the new horizontal-span
  detector at prompt level), (3) anti-pattern repetition — orange budget
  repeated three ways. Same composition clause back-propagated to L2-70.
- **CHARACTER_BIBLE institutionalised** The First-Contact Alien entry
  (ink outline only; ≤8 % orange budget on one arm; RIGHT-side composition;
  bookend at L2:s06 + L2:s71). Future canon-creature reuse picks up this
  character with the same locked spec.
- **Hard gates GREEN end-to-end.** Deck counts L0=22 / L1=56 / L2=71
  verified; HARD=0 in both themes; WARN 4 → 3.
- **ZERO green-tübetey violations** across 22 sampled Serega instances
  (L0:s06 charsheet 6 of 6, L0:s08, L0:s10, L1:s06, L1:s33, L2:s05,
  L2:s06, L2:s23, L2:s49 knight-helm crest, L2:s62 knight-helm crest,
  L2:s71). The CHARACTER_BIBLE locked-appearance rule holds across
  regenerations.

## Editor follow-up (post-session-4) — both session-4 blockers RESOLVED
- **L2:s57 (cosine-vs-Euclid) — RESOLVED & ACCEPTED.** The model would not fill the rails across
  3 sessions (diagonal diagram; corner whitespace is inherent). Editor fix: trimmed the PNG's
  uniform cream border (`magick -fuzz 6% -trim`, 1600×893→1167×852) so content reaches the asset
  edges, and sized the slide's viz-frame to a centered inset (`height:360px; max-width:540px;
  margin:auto`). Renders as a tidy centered figure with NO empty rails (verified). **Session 5:
  do NOT re-flag or regenerate L2-57 — the rail complaint is closed.**
- **L0:s06 (charsheet duplicate labels) — RESOLVED.** Removed the DOM `.poses-row` figcaption;
  the baked-in PNG pose labels are the single source of truth.

Session 5 focus: the non-blocking FINDINGS — L2:s06 alien colour-continuity with L2:s71, the three
quiz overflows → `walkthrough`, and the L0:s08 / L0:s10 whitespace balance. Do NOT reopen resolved items.

## Session 4 — VLM review
**gate (independently re-stated):** `wbw-check` 15/0/0 across L0=22, L1=56, L2=71;
`visual-gate` HARD=0 in BOTH themes (overflow / offframe / clipped / LOWCONTRAST /
**new** SUBJECTSMALL); WARN=4 — three pre-existing engine-auto-fit on quiz slides
(L1:s15 at 1179 px, L2:s16 at 1211 px, L2:s46 at 1178 px) plus one new SUBJECTSMALL
on L2-48 sir-cosine at 51% subject coverage. Both hard gates pass; the new
canvas-pixel bbox detector promotes the session-2/3 PNG-internal letterbox finding
class into an objective gate.

**rubric (0–5, strict):** narrative **5** · examples **5** · stepwise **4** ·
templating **4** · history **5** · cases **5** · layout **3** · art **4** ·
data_grounding **4**.
`cases` lifts from 4 → 5 because the `.misc-anchor` class promotion plus three new
worked anchors (L1:s29 Joachims/Craswell γ=0.94, L1:s52 Covington 2016 weighted
watch-time, L2:s66 (1,1)/(10,10) cos/Euclid) closed the last three NAMED-not-WORKED
misconception cards. `layout` drops 4 → 3 because the L2:s57 letterbox-rail blocker
ships for the third consecutive session under a faulty session-4 disposition; the
new SUBJECTSMALL heuristic mis-cleared it. `art` holds at 4 — three image regens
landed cleanly (L1:s24 cloud-vs-wall, L0:s02 placard, L2:s71 alien stripes) but a
new continuity defect surfaced (L2:s06 first-contact alien is still heavy-orange,
inconsistent with the L2:s71 fix). `data_grounding` holds at 4 — anchors trace to
disk but a citation attribution drift surfaced on L1:s29 (Craswell 2008 owns the
1/r^γ examination model, not Joachims 2005).

**BLOCKING (must fix before session 5):**
- **`L2:s57` — letterbox rails STILL present (THIRD consecutive session).** At
  1920×1080 the (0,0)→(10,10) diagonal subject occupies only the centre ~33% of
  the wide viz-frame; LEFT ~33% and RIGHT ~33% are empty cream rails on both
  sides. Session-4 disposition ("subject is corner-anchored, whitespace is a
  natural diagonal artefact") is incorrect against the rendered PNG — the
  subject bbox sits squarely in the middle band, not corner-to-corner; there is
  no ink in the left third and no ink in the right third. The new SUBJECTSMALL
  detector mis-cleared this asset because the bbox-area heuristic over the
  entire PNG canvas masks centre-with-rails composition. Fix: either
  (a) re-run `gen_images.py --force --only L2-56-cosine-vs-euclid` with an
  explicit "subject fills ≥85% of frame width edge-to-edge; the (1,1) anchor in
  the bottom-left corner and the (10,10) arrowhead in the top-right corner"
  clause, OR (b) crop the slide-level viz-frame to `max-width:55%` so the cream
  rails disappear from the canvas. Also tighten the SUBJECTSMALL detector to
  additionally flag when bbox horizontal span is <60% of canvas width (not only
  bbox area) — that single heuristic would have caught this.
- **`L0:s06` — duplicate pose labels.** The underlying PNG already carries
  baked-in "(1) NEUTRAL", "(2) POINTING", "(3) PUZZLED", "(4) RUNNING",
  "(5) KNIGHT", "(6) SCI-FI" captions under each figure, AND the session-3
  `.poses-row` DOM class repeats the same six tokens in ALL-CAPS directly
  below. Two horizontal label strips ~30 px apart say the same thing — visual
  noise occupying ~14% of slide area in duplicate captions, and a borderline
  ANTIPATTERN against the bible's "no text inside the image beyond the few
  short hand-lettered labels a prompt explicitly lists". Fix: pick ONE source
  of truth — either re-prompt `L0-06-character-sheet` with a blank caption
  strip (rely on `.poses-row` DOM row) OR remove `.poses-row` from L0:s06
  (keep the baked-in PNG labels). DOM-side is the cheaper one-line fix.

**FINDINGS (prioritized, deck:slide — issue + fix):**
1. **`L2:s06` — first-contact alien still heavy solid-orange** while the
   matching closing-callback L2:s71 (same character) was correctly re-prompted
   in session 4 to ink-outline + three thin stripe accents. Two slides depict
   the same alien at the start and end of the L2 arc with different palettes.
   Fix: re-prompt `L2-06-first-contact.png` with the same "alien body is ink
   OUTLINE ONLY; orange only as three thin arm stripes" clause used for L2-70,
   so the character renders identically at first introduction and final
   callback. Continuity > novelty for canon creatures.
2. **`L1:s15`, `L2:s16`, `L2:s46` quiz overflow** still at 1179 / 1211 / 1178 px
   (engine auto-fits to sub-22 px effective). Trimming one option did not move
   row count in the 2×2 grid. Fix: convert all three from `data-type="quiz"`
   to `data-type="walkthrough"` with a question step and a reveal step (engine
   already supports `data-max-step` reveals — see L2:s52 e2e). Eliminates the
   2-row grid, drops content-bottom under 1080, AND teaches better
   (commit-then-reveal is the WBW pedagogy).
3. **`L0:s08` — pull-quote scene illustration tiny in vast slide.** The Serega
   + brain + embedding/vectors/RAG arrows viz sits at ~13% slide width in the
   lower third while the upper two-thirds carries only the centred quote
   (~540 px empty vertical band above). Fix: scale the viz-frame to ≥30% width
   OR tighten the quote container's `padding-top` so the composition centres
   vertically. Currently reads as decorative bottom-edge ornament not as a
   teaching figure.
4. **`L0:s10` — arc-of-course arch-flow vast empty band.** ~400 px of empty
   vertical space inside the arch-container above the node row
   (IR / vec / net / ANN / RAG / A+M); the supporting staircase doodle below
   hangs awkwardly in the bottom band. Fix: drop the arch-frame `min-height`
   to fit the node row tightly (`max-height: 360px`), freeing ~400 px for the
   doodle to grow to ~1.6× its current size — restores air-vs-emphasis ratio.
5. **`L2-48-sir-cosine` SUBJECTSMALL WARN at 51% coverage** flagged by the
   session-4 new detector. Knight + protractor + unit-sphere composition is
   sound but carries ~25% in-PNG left/right padding. Decision in session 5:
   either (a) re-prompt with "knight + sphere fills ≥80% of frame width" AND
   drop the slide's `max-width:50%` to `60%`, OR (b) document 51% as an
   acceptable banner baseline and lower the WARN threshold to 50%. Do not
   ship a third session with a flagged asset.
6. **`L0:s21`, `L1:s56`, `L2:s71` closing "Questions?" slides** — H1 renders
   in the editorial serif while the new hand-feel marker display font is
   reserved for divider H1s (visible on L1:s05, L2:s05, L2:s49, L2:s62). The
   closing beat is exactly where the deck should reprise the hand-feel and
   bookend the part-break chrome. Fix: switch closing-slide H1 ("Let's begin."
   on L0:s21 and "Questions?" on L1:s56 / L2:s71) to the same marker display
   font. Lightweight CSS rule on `.slide[data-type="final"] h1`.
7. **`L0:s01`, `L1:s01`, `L2:s01` title-slide metadata low-contrast in LIGHT.**
   "LECTURER · Albert Nasybullin", "DATE · 03.06.2026", "ROOM · 106" render
   in a faded light-blue-grey on the cream canvas that lands at or near the
   WCAG-AA floor. Same family as session-2 dark-theme divider-sub fix but
   applied to title-row metadata in the light branch. Fix: bump
   `.title-meta` (or whichever token names the row) to
   `color-mix(in srgb, var(--ink) 80%, transparent)` in light, hold dark
   unchanged. Wire into the existing LOWCONTRAST detector pass.
8. **`L2:s05` (and the other 5 dark-theme dividers) — "PART NN" kicker thin
   at hall scale.** Orange #E8743B on near-black bg passes WCAG-AA on paper
   but the thin stroke loses visual weight at lecture-hall distance. Same on
   L1:s05 / L2:s17 / L2:s37 / L2:s49 / L2:s62. Fix: bump
   `.divider-kicker` font-weight 500 → 600 in dark theme, or thicken the
   underline from 1 px → 2 px on dark. Wire into the contrast gate.
9. **`L1:s29` misconception-anchor citation drift.** The anchor credits
   "Joachims 2005" with γ=0.94 and the 1/r^γ examination-decay model. That
   model is Craswell-Zoeter-Taylor-Ramsey 2008 ("An Experimental Comparison
   of Click Position-Bias Models"); Joachims 2005 originated the
   clicks-as-relative-not-absolute-relevance framing
   (Joachims, Granka et al. "Accurately Interpreting Clickthrough Data as
   Implicit Feedback"). Conflating them robs Craswell 2008 of model credit.
   Fix: change inline citation to
   "Craswell et al. 2008 (cascade examination model, γ=0.94);
   Joachims et al. 2005 (clicks ≠ relevance)". CoVe should have caught this;
   add "attribution check on cited paper title" to the loop.
10. **`L0:s06` ANTIPATTERN edge documentation.** Distinct from the duplicate-
    label blocker above: if the path forward is to keep the baked-in PNG
    labels (remove `.poses-row`), document the labels as an explicit canonical
    exception in `CHARACTER_BIBLE.md` ("character-sheet style indices may
    carry baked pose names"). Otherwise the next reviewer will re-open the
    antipattern question every session.
11. **`L1:s24` Lexical Gremlin scene — small ambiguous figures.** Otherwise
    the strongest art win of this session; but the two seated figures on the
    left of the brick wall (couch/sofa folks) render at ~3% slide width and
    lack the green tübetey, so they read as generic stick-people rather than
    two Seregas debating word choice. Fix: if they are Seregas, regen with
    green caps visible at that scale; if not, leave but add a one-line
    "two users" caption so the metaphor doesn't ride on tiny ambiguous figures.

**WINS:**
- **`L1:s24` cloud-vs-wall palette fixed (session-3 BLOCKING #2 resolved).**
  Embeddings cloud is now SOLID course-blue (#2A6FDB) body against the orange-
  brick BM25 wall; the metaphor "cloud bridges synonyms over the wall" now
  reads at a single glance at hall scale. The session-4 prompt-diff pattern
  that pins per-figure palette ("WALL = orange brick, CLOUD = solid blue") is
  the right template for every multi-figure scene going forward.
- **`L0:s02` "mission: search" label moved out of porthole (session-3
  finding #4 resolved).** Label now lives on a hand-drawn rectangular placard
  beside Captain Serega at torch level; the viewport interior holds only the
  galaxy of 1s/0s/document icons, no words. Clean resolution without losing
  the scene label.
- **`L2:s71` alien octopus stripes (session-3 finding #8 resolved).** Closing-
  callback alien is now ink-outline only with three thin orange stripes along
  one arm; orange budget ≤8% of canvas.
- **`L2:s62` wraith divider spacing fixed (session-3 finding #1 resolved).**
  "Concentration · hubness · anisotropy — why naive nearest-neighbour can
  mislead." now clears the wraith viz-frame's top edge in both themes; the
  wraith remains solid black ink with bell-histogram crush.
- **`L2:s34` timeline kicker rows in confident muted ink (session-3 finding
  #2 resolved).** PENN TREEBANK / GAGE / SCHUSTER & NAKAJIMA / SENNRICH ET
  AL. / KUDO / GPT-2 RADFORD ET AL. / TIKTOKEN now via
  `color-mix(var(--ink) 72%, transparent)`; reads as muted ink rather than
  pale reddish tint at hall scale in both themes.
- **`L2:s49` light-theme divider-sub bumped to opacity 0.85 (session-3 finding
  #6 resolved).** "Measures of similarity — a ruler for meaning." now reads
  confidently in both branches.
- **`.misc-anchor` CSS class promoted from inline pattern (session-3 finding
  #7 fully resolved).** All 7 misconception slides now carry worked numeric/
  named anchors: L1:s27 Furnas 1987 <20%, L1:s29 γ=0.94 position-bias,
  L1:s39 Kohavi/Tang/Xu ~1-in-3, L1:s52 Covington 2016 weighted watch-time,
  L2:s27 singer-merge BPE trace, L2:s43 GPT-2 token 28666 + Rumbelow/Watkins
  Feb 2023, L2:s66 cos=1 vs Euclid=√162≈12.73. The rubric `cases` dimension
  lifts from 4 → 5 on this single move.
- **New `SUBJECTSMALL` detector wired into `visual-gate.mjs`.** Per-deck
  canvas-pixel bbox scan (min(r,g,b)≤240 AND alpha≥200 = ink-subject) at
  <55% WARN / <40% HARD, cached per URL. Surfaces L2-48-sir-cosine at 51%
  for session-5 triage. Promotes the VLM-only letterbox finding class into
  an objective gate. (Caveat: detector mis-cleared L2:s57 — see BLOCKING; the
  heuristic needs a width-span check alongside the area check.)
- **Hand-feel marker display font lives on divider H1s** (L1:s05 "The needle
  in the cosmos", L2:s05 "Teaching a machine to read", L2:s49 "How close are
  two meanings?", L2:s62 "When high dimensions break intuition"). Each major
  part-break reads as a personality beat distinct from the editorial-serif
  bodies — honours REDESIGN_BRIEF "hand-feel only for kickers/labels" while
  making part-breaks feel hand-drawn at hall scale.
- **Hard gates green end-to-end:** `wbw-check` 15/0/0 (L0=22, L1=56, L2=71);
  `visual-gate` HARD=0 in BOTH themes; WARN=4 (3 pre-existing engine-auto-fit
  on quiz slides + 1 new SUBJECTSMALL surfacing).
- **Data-grounding artifact suite intact and growing:** bpe_merges +
  bpe_demo_tokens + bpe_first_merges + bpe_merges_summary; cosine_examples;
  embedding_demo; heaps_curve.png + heaps_summary; position_bias; zipf_loglog
  + zipf_summary + zipf_top.csv. The session-4 new anchors (L1:s29 γ=0.94,
  L2:s66 cos/Euclid) trace back to `position_bias.json` and
  `cosine_examples.json` respectively.
- **Process win — mid-write CoVe self-correction.** Session-4 caught its own
  L1:s29 fabrication (used γ^(r-1) instead of the actual 1/r^γ examination-
  decay model and quoted invented per-rank shares) by re-reading
  `position_bias.json` before finalizing. Same fix applied to a fabricated
  sentence-transformer demo in L2:s66 (re-anchored to
  `cosine_examples.json[classic_pairs[0]]`). Lesson institutionalized in
  notes: "when an anchor cites a data file, read the file BEFORE writing the
  anchor."

**LESSON for the loop:** session-4 declined to fix session-3 BLOCKING #1
(L2:s57 letterbox) on the rationale that diagonal subjects naturally produce
whitespace artefacts, and pointed at the new SUBJECTSMALL detector as
corroborating evidence. The rendered PNG disproves the rationale — the
subject is centre-with-rails, not corner-anchored, and the detector mis-
cleared the asset because its area-based heuristic is blind to centred
compositions in wide canvases. **Two lessons:** (i) when a session pushes
back on a flagged blocker, the push-back itself needs an independent visual
verification (re-screenshot, draw a bbox), not just a written argument plus
a heuristic; (ii) new detectors must be tested against the precise failure
mode they were built to catch — a width-span check would have caught
L2:s57 while a bbox-area check did not. Session 5 must (a) fix L2:s57 with
either a regen or a viz-frame crop, (b) extend SUBJECTSMALL with a horizontal-
span heuristic, and (c) add an "if a session declines a blocker, re-screenshot
and bbox" rule to the harness gate.

---

## Session 3 — VLM review
**gate (independently re-stated):** `wbw-check` 15/0/0 across L0=22, L1=56, L2=71;
`visual-gate` HARD=0 in BOTH themes (overflow / offframe / clipped / **new** LOWCONTRAST);
WARN=4 (pre-existing engine-auto-fit on quiz/formula slides L1:s15, L2:s16, L2:s46, L2:s53).
Both hard gates pass; the new theme-aware WCAG-AA contrast detector caught **14 dark-theme
`.divider-num` failures** that the session-2 box-overflow gate could not see.

**rubric (0–5, strict):** narrative **5** · examples **5** · stepwise **5** · templating **4** ·
history **5** · cases **4** · layout **4** · art **4** · data_grounding **4**.
All five session-2 dimensions held or rose. `art` and `layout` recovered from 3→4 because the
two session-2 blockers landed (dark-theme divider-sub + BLACK wraith) and the misconception
cases moved from NAMED → WORKED. The two remaining art/layout drags are documented as
blockers below.

**BLOCKING (must fix before session 4):**
- **`L2:s57` — letterbox regression survived the re-prompt.** The cosine-vs-Euclidean
  (1,1)/(10,10) illustration occupies only ~30% of the PNG width inside the viz-frame; the
  left and right ~35% are empty white rails. Session-3 ANTIPATTERN was tightened with the
  "≥80% canvas width" clause but the rendered asset still carries the rails. Re-run with
  `--force --only L2-56-cosine-vs-euclid` and verify the PNG itself (not just the slide CSS)
  before declaring the fix. This violates REDESIGN hard-constraint #4 (all illustrations
  fully visible at hall scale).
- **`L1:s24` — embeddings cloud and BM25 wall both render in the same orange/brick stipple.**
  The "cloud bridges synonyms" metaphor visually merges into the wall it is supposed to leap
  over. Session-3 deferred finding #9 must land in session 4: re-prompt `L1-24-lexical-gremlin`
  with "embeddings cloud filled with course-blue #2A6FDB so it contrasts with the brick BM25
  wall in the same frame". The Lexical Gremlin scene is otherwise the strongest
  named-creature + grounded-number slide in the deck — do not regenerate the gremlin or the
  wall, only the cloud fill.

**FINDINGS (prioritized, deck:slide — issue + fix):**
1. **`L2:s62` — divider-sub crowds the wraith art.** "Concentration · hubness · anisotropy
   — why naive nearest-neighbour can mislead." sits immediately above the viz-frame in both
   themes; the descender of "mislead." touches the top edge of the figure container. Fix:
   add `margin-bottom: var(--sp-4)` to `.slide[data-type="divider"] .divider-sub` OR raise
   the wraith viz-frame's `margin-top` from `sp-4` to `sp-6`.
2. **`L2:s34` — dark-theme timeline kicker rows ride the legibility floor.** PENN TREEBANK
   / GAGE / SCHUSTER & NAKAJIMA / SENNRICH ET AL. / KUDO / GPT-2 RADFORD ET AL. / TIKTOKEN
   render in a faint reddish ochre that is just above WCAG-AA on cream but lands at the
   edge at hall scale. Fix: theme-aware bump to
   `color-mix(in srgb, var(--ink) 75%, transparent)` so the kicker reads as a confident
   muted ink rather than a pale tint. (Same family as the session-2 dark-theme contrast
   patch, applied to the timeline component.)
3. **`L1:s15`, `L2:s16`, `L2:s46` (quiz overflow), `L2:s53` (cosine-formula overflow) —
   content-bottoms 1179 / 1211 / 1273 / 1120 px against the 1080 floor.** Engine auto-fits,
   but the resulting type is sub-22 px effective. Fix: trim one option per quiz card OR
   split each quiz into a two-step `walkthrough` (question → reveal); for s53 promote the
   algebra to a fuller `formula` slide and migrate the prose into a follow-on caption.
4. **`L0:s02` — "mission: search" inside the porthole reads as a baked-in topic title.**
   The bible permits explicit scene labels, but a topic-name string at the centre of the
   focal element edges close to the ANTIPATTERN. Fix: either document as a canonical scene
   label or re-prompt with the words moved out of the porthole onto a hand-tag floating
   beside Captain Serega's torch.
5. **`L2:s23` — Tokenosaurus still carries a "Token" mark on its chest.** The session-3
   regen correctly removed the "TOKENIZATION" signboard; verify the residual mark is the
   falling chunk "token" mid-air (per the spec) and not body lettering. If body lettering,
   re-prompt with the three chunks drawn distinctly mid-air and the dino's chest blank.
6. **`L2:s49` light theme — divider-sub a touch thin.** "Measures of similarity — a ruler
   for meaning." in light theme uses the session-3 `color-mix(70%)` rule, which is correct
   for dark but slightly faint in light. Fix: drop to 60% transparency for the light branch
   only, or introduce a `--divider-sub-color` token defined per theme.
7. **Misconception-anchor pattern is in 4 of 7 misconception slides.** Anchored: L1:s27,
   L1:s39, L2:s27, L2:s43. Still NAMED-not-WORKED: **L1:s29** (position bias — use
   Joachims 2005 γ≈0.94 from `_research/data/position_bias.json`), **L1:s52** (framing
   bug — add a concrete A/B-test mis-framing case), **L2:s66** (cosine misconception —
   add a worked numeric counter-example, e.g. two L2-normalized vectors with cos=0.99 but
   semantically unrelated). After the 5th anchor, promote the orange-bar sub-panel from
   inline style to a `.misc-anchor` CSS class (the notes file recommends this once usage
   ≥6×).
8. **`L2:s71` closing "contact" callback doodle** — green tübetey is correct, but the alien
   octopus is rendered as a heavy solid-orange body that grazes the "orange accent ≤15%
   canvas area" antipattern. Fix: switch the alien's body to ink outline + thin orange
   stripe accents, matching the L2:s06 first-contact rendering of the same character.

**WINS:**
- **All four session-2 dark-theme divider-subtitle contrast failures** (L1:s05, L2:s05,
  L2:s49, L2:s62) are visibly fixed in both themes. The `color-mix(in srgb, var(--bg) 70%,
  transparent)` swap and the theme-aware `.divider-num` override land cleanly — the four
  dividers that were ghost-text on cream now read confidently in both light and dark.
- **Curse-of-Dimensionality Wraith (`L2:s62`) is now SOLID BLACK INK** with a darker hood
  void; orange appears only on the bell histogram being crushed; Sir Serega braces with the
  green tübetey-crested helm — bible-perfect ("Nazgûl-like") and palette-clean.
- **Sir Cosine (`L2:s49`) banner reduced to a slim ribbon ≤12% of frame height** — the
  knight + protractor + unit-sphere geometry now fills the rest; the previous 25%-of-frame
  banner is gone.
- **Tokenosaurus (`L2:s23`) regenerated without the "TOKENIZATION" signboard** — the
  snipping-into-basket scene reads as the metaphor it should be, not a topic placard.
- **`L0:s06` character-sheet pose labels** (NEUTRAL · POINTING · PUZZLED · RUNNING ·
  KNIGHT · SCI-FI) now live in slide DOM under the figure via the reusable `.poses-row`
  class — kicker-sized, ALL-CAPS, hairline-top, hall-legible.
- **`L0:s10` arc-of-course chips monochrome ink** in both themes — the session-2 six-color
  rainbow is gone; the new `.arch-node[data-color="current"]` CSS rule is staged for
  per-lecture course-arc reuse without re-introducing the rainbow.
- **Misconception cases pulled from NAMED → WORKED**: L1:s27 (Furnas 1987 <20% +
  couch/sofa vs java spam); L1:s39 (Kohavi/Tang/Xu 2020 ~1-in-3 offline→online); L2:s27
  (singer-merge demo, 2 vs 4 tokens, two trained tokenizers); L2:s43 (GPT-2 token id 28666
  + Rumbelow & Watkins LessWrong Feb 2023). This single move lifts the `cases` rubric
  from 3 → 4.
- **`L2:s34` timeline dense-mode font budget tightened** (kicker 22→18, body 22→24, what
  30→28, year 38→36) — body sits comfortably above the 22 px hall-legibility floor in both
  themes.
- **New WCAG-AA LOWCONTRAST detector wired into `visual-gate.mjs` as a HARD gate**,
  theme-aware on both `[light, dark]`, with a `localStorage` seed that defeats
  `tools.js → applyTheme()` snapback. Caught 14 dark-theme `.divider-num` failures
  invisible to the session-2 box-overflow gate — VLM finding promoted into an objective
  detector before the slide fix landed.
- **`_research/data/` artifact suite is healthy and growing**: bpe_merges + bpe_demo_tokens
  + bpe_first_merges + bpe_merges_summary; cosine_examples; embedding_demo; heaps_curve.png
  + heaps_summary; position_bias; zipf_loglog.png + zipf_summary + zipf_top.csv. Anchored
  numbers (Furnas <20%, Heaps β≈0.59 R²=0.998, position-bias γ≈0.94, singer-merge BPE
  trace) all trace back to disk.
- **Hard gates green end-to-end**: `wbw-check` 15/0/0 (L0=22 / L1=56 / L2=71);
  `visual-gate` HARD=0 in BOTH themes; WARN=4 are pre-existing.

**LESSON for the loop:** the contrast detector found 14 dark-theme `.divider-num` failures
that no slide author and no PDF reviewer would have flagged with the eye alone, because the
deck's own `applyTheme()` was reverting `data-theme="dark"` on every boot. The compounding
risk is bigger than the single bug class: **any time a theme reset masks a defect, the gate
that misses it will also miss the next ten defects in that family.** Sessions 4 and beyond
should treat "the gate didn't catch this but the eye did" as a tooling gap — promote the
finding into a detector first, fix the offending slides second. Next candidate detectors:
(a) viz-frame-vs-PNG width ratio (would have caught the L2:s57 letterbox before the
session-3 re-prompt was declared a fix); (b) per-image dominant-color clash on adjacent
sub-figures within a single frame (would have caught L1:s24 cloud-vs-wall); (c) art-tag
text density inside circular focal elements (would have caught the L0:s02 porthole label).

---

## Session 2 — VLM review
**gate (independently re-stated):** wbw-check 0/0/0 on all three (L0=22, L1=56, L2=71);
visual-gate HARD=0, WARN=4 (engine-auto-fit on quiz/formula, pre-existing). Both hard gates pass.

**rubric (0–5, strict):** narrative **4** · examples **4** · stepwise **4** · templating **4** ·
history **5** · cases **3** · layout **3** · art **3** · data_grounding **4**.
The two dimensions that DROPPED relative to session 1 are **layout** and **art** — both pulled
down by a single newly-exposed class of bugs (see blocking #1) and a single bible-violating
illustration (blocking #2). They are addressable, not structural.

**BLOCKING (must fix before session 3):**
- **`L1:s05`, `L2:s05`, `L2:s49`, `L2:s62` — divider-subtitle contrast bug in DARK theme.**
  Root cause located: `Lectures/css/slides.css:210-216` hard-codes
  `.slide[data-type="divider"] .divider-sub { color: rgba(255,255,255,.65); }`.
  The divider's `.is-active` block flips the canvas (`background: var(--ink); color: var(--bg)`)
  which inverts correctly in dark theme to a CREAM paper canvas — but `.divider-sub` stays
  white-65% and is therefore ghost-text on cream. Fix: drop the hard-coded color and use
  `color: color-mix(in srgb, var(--bg) 75%, transparent)` (theme-aware), or define
  `--divider-sub` in both theme blocks. This violates REDESIGN_BRIEF hard-constraint #3
  ("Light AND dark themes both legible").
- **`L2:s62` — Curse-of-Dimensionality Wraith is solid ORANGE.** CHARACTER_BIBLE specifies
  "hooded shadowy cloaked figure (Nazgûl-like)"; the rendered figure uses the warm accent as
  the large-fill body color, violating BOTH the bible (wraith is shadow, not warm) AND the
  REDESIGN palette rule ("accents sparingly, never as large fills behind text"). Re-prompt
  L2-62-wraith with `--force --only`: cloak is BLACK/ink with a darker hood shadow; the
  ORANGE stays on the bell histogram being crushed (correctly canon).

**FINDINGS (prioritized, deck:slide — issue + fix):**
1. **`L0:s10` — six-color chip rainbow on the course-arc.** IR/vec/net/ANN/RAG/A+M chips
   render with six distinct border colours (purple, ink, ink, green, amber, orange). The
   palette is locked to ink + blue + orange. Fix: monochrome ink borders for ALL chips,
   the current-step chip gets the warm orange accent ring; arrows stay ink-grey.
2. **`L2:s57` — letterboxed worked-example.** The cosine-vs-Euclidean (1,1)/(10,10)
   illustration sits inside a wide `viz-frame` with ~30 % empty rails left and right; one of
   the labels ("Euclidean: very far!") is also tilted, violating session-2 PREAMBLE
   ("HORIZONTAL ONLY — never tilted"). Two fixes: (a) wrap in `.split-art` so the doodle
   pins to one column and prose to the other, OR (b) re-prompt L2-57 under the strict prompts
   with the horizontal-only constraint enforced.
3. **`L2:s23` — Tokenosaurus holds a "TOKENIZATION" sign.** This reads as a baked-in topic
   title (ANTIPATTERN bans "decorative subtitles, signatures, captions"). Re-prompt with
   "no signs, no banners, no posters; the dinosaur just snips the word into chunks; the
   only labels are the chunks falling into the sub-words basket."
4. **`L0:s06` — character-sheet labels (NEUTRAL / POINTING / PUZZLED / RUNNING / LOTR /
   SCI-FI) are tiny grey numerals at hall scale.** Either render the labels in slide DOM
   below the character-sheet image (kicker-sized), or re-prompt the image with one
   accent-orange label per pose at ~3× the current weight.
5. **`L2:s34` — timeline body text approaches the 22 px hall-legibility floor.** Cards are
   information-rich but eat the font budget. Either drop from 7 to 5 epochs (collapse 2024+
   into "Modern" and lift one earlier point into prose) or shrink the kicker line so the body
   sits at ≥ 22 px effective.
6. **`L2:s49` — Sir Cosine banner consumes ~25 % of the image's vertical real estate.**
   Bible says "banner motif", which is satisfied, but the banner is too large; re-prompt
   "thin banner at the top, ≤ 12 % of the frame; the knight + unit-sphere geometry fills the
   rest."
7. **Cases dimension — failure-mode slides are NAMED but not WORKED.** `L2:s27` (BPE
   non-unique), `L2:s43` (glitch tokens), `L1:s27` (exact-match), `L1:s39` (offline-online
   gap) — each names the phenomenon but does not show an instance. Add one concrete numeric
   example per misconception (e.g. the SolidGoldMagikarp token id, or a worked BPE merge
   ambiguity with two valid orderings).
8. **`L0:s08` — arc-of-search illustration is under-scaled.** ~480 px in a 1920 px canvas
   beside an otherwise empty pull-quote. Either widen the figure to 50–60 % or convert the
   slide to `art-hero` with the quote as caption.
9. **`L1:s24` — embeddings cloud icon is the same brick-shade as the BM25 wall.** Tint the
   cloud with the blue accent so "the cloud bridges synonyms" reads at the back of the hall.

**WINS:**
- Session-1 art blockers all held: **L1-40 Goodhart is blue-capped** (not green); **L2-48
  Sir Cosine** has green tübetey as the helm crest with no cap-on-cap; **L0-20 bursts** are
  clean of glyph-like marks. The session-1 editor follow-up + targeted regens stuck.
- **Tokenization timeline (L2 s34)** is live with 7 anchor points (1993 Penn Treebank → 2024
  tiktoken) — directly fills the previously-weak `history` dimension (now 5/5).
- Hand-feel display font on dividers + the "PART 0X" amber kicker with the blue underline
  reads beautifully in **LIGHT theme** on every divider (L1 s05, L2 s05, L2 s49, L2 s62) —
  the dark-theme regression on those same slides is purely the `.divider-sub` colour bug
  above, not a design failure.
- **L2 s57** carries real worked arithmetic (`||a−b|| = √162 ≈ 12.73`) AND the
  cosine→squared-Euclidean identity `2(1 − cos θ)` — the stepwise rubric is satisfied even
  with the letterboxing issue.
- **L1 s24 Lexical Gremlin** scene is canonical-bible-clean: BM25 brick wall, embeddings
  cloud, jaguar polysemy with cat/car/laptop, Furnas 1987 ~80 % disagreement number anchored
  in the caption — the strongest "named creature + grounded number" slide in the deck.
- **L0 s02** "mission: search" captain-Serega scene composes the cap, the spaceship
  console, and the chunks-as-stars metaphor in one frame using only allowed scene labels.
- The three canonical BOTH regression fixes (L1 s14, L2 s8, L2 s20) are wired with
  `.split-art` / `.art-strip` per `TEMPLATE_CATALOG.md`, and the one new image
  (L2-20-tradeoff juggler) was generated under the session-2-strict prompts.
- Data-grounded numbers surfacing across captions (Furnas 1987 ~80 %; Heaps β≈0.59 R²=0.998;
  position-bias γ≈0.94) — `data_grounding` moved from 0 (session 0) → 4 (session 2).

**LESSON for the loop:** the visual gate's CLIPPED/OFFFRAME/OVERFLOW detectors fired 0/0/0
HARD on this session and yet the VLM eye found **four divider-subtitle contrast failures
the gate cannot see** — colour-on-colour contrast is a separate concern from box overflow.
Add a contrast-ratio check (WCAG-AA, effective on-screen color vs background) to
`visual-gate.mjs`, theme-aware, on every `.divider-sub`, `.kicker`, `.tag`, and `caption`
node. The current gate would have passed this session as green when the dark-theme dividers
are objectively unreadable.

---


## CRITICAL BUG FIXED — viz-frame images were silently cropped (editor was wrong, user was right)
Symptom: L2 s8 (discreteness) and others showed only part of the image ("interpolates"→"terpolates").
Root cause: `.viz-frame` is `display:grid; place-items:center` with **no track template** → the
single auto-track sizes to **min-content** and balloons the cell *larger than the frame*; a child
`<img>` with `%`/`max-%` then resolves against the oversized cell and is clipped by the frame's
`overflow:hidden`. Affected **all 24 viz-frame images** (worst where art reaches the edges).
Fix (in `css/wbw-art.css`): `.viz-frame { grid-template-columns:minmax(0,1fr); grid-template-rows:
minmax(0,1fr); }` + inline `max-width/max-height:100%;width/height:auto` on imgs + defensive
`.viz-frame > img { max-*:100%; … }`. Verified: slide 8 + L1-24/25/40, L2 hubness render whole.
**New gate:** `_audit/visual-gate.mjs` now has a **CLIPPED** detector (img element bigger than its
overflow:hidden ancestor) — this exact class. HARD=0 after fix; wbw-check still 0/0/0.
LESSON for the loop: a slide can be `0/0/0` AND visually cropped — the autonomous gate MUST run
`visual-gate.mjs` (CLIPPED/OFFFRAME/OVERFLOW-H = HARD) in addition to wbw-check, and the VLM must
eyeball every image full-frame. DOM box-overflow alone misses content cropped inside an in-frame box.

## CNN-templates verdict (strict — recorded per AGENDA)
- **timeline** — ADOPTED. Built as `data-type="timeline"`; applied to L1 s30 (search history) and
  L2 s34 (tokenization history). Fills the weakest rubric dimension (history). Keep using it.
- **origin-story / cause→effect** (CNN "Hubel & Wiesel 1958 → conv") — REJECTED as a template.
  It is a narrative, not a layout; already served by timeline + two-col + `.wbw-arrow`. No new type.
- **image-as-grid-of-numbers** — ADAPTED, not copied. Literal pixel grids are CNN-only. The
  search-relevant version is a generalized **`numgrid`** (token-IDs / embedding floats / TF-IDF /
  cosine columns). Built `numgrid` CSS in wbw-art.css; apply on a data-grounded "what a vector
  actually is" beat (pairs with the embedding data script in the data-grounding task).

## Editor follow-up (post-session-1, targeted manual)
**RESOLVED** the three session-1 art blockers via `gen_images.py --force --only`:
- Green cap moved to **Serega-only** (removed from PREAMBLE; ANTIPATTERN now bans green on any
  other figure + bare-heads everyone else + no green when Serega absent). → Goodhart (L1-40) now
  blue-capped; cover cast bare-headed.
- Sir-Cosine scene rewritten: "green skullcap directly on head, NO helmet, NO cap-on-cap" → fixed.
- Added "no glyph-like marks inside bursts/fireworks/starfields" → L0-20 bursts clean.
- Added `--only <slug>` selector for targeted re-prompt; re-optimized (≤320 KB). Decks still 0/0/0.
Still open: reference-image (whoami) plumbing + A/B; 2nd timeline (L2 tokenization); CNN verdict;
heavier WBW redesign; cover 1200×630 social crop; Heaps + position-bias data scripts.

## Session 1 — review (editor-verified; auto-VLM was skipped, see harness note)
**gate:** independently re-ran `wbw-check` → **0/0/0** on all three (22/56/70). Claim holds.
**rubric (verified/est.):** narrative 4 · examples 4 · stepwise 4 · templating 4 · history 4 ·
cases 3 · layout 4 · art 4 · data_grounding 4.

**blocking (fix in session 2 — TARGETED re-prompt only, do NOT blanket-regen 36):**
- **Cap leakage:** Goodhart-the-Trickster (L1-40) wears Serega's GREEN tübetey. The cap is
  Serega-only. Add ANTIPATTERN clause: "the green tübetey is worn by Serega ONLY; all other
  characters/creatures are bare-headed unless the scene names a hat." Re-prompt L1-40 only.
- **Sir Cosine cap-on-cap (L2-48):** rendered as a blue cap with a small green tübetey perched on
  top. Re-prompt: "the tübetey IS the helmet's crest — no separate blue cap underneath, no second
  hat." Bible says crest, not cap-on-cap.
- **Stray pseudo-text in bursts:** faint glyph-like marks inside fireworks/explosions (L0-20, check
  cover). Add: "no glyph-like marks, sparkles-as-letters, or pseudo-text inside any burst /
  firework / explosion / starfield."

**findings:**
- **ALWAYS re-optimize after regen** (resize ≤1600 + 128-colour). Session 1 left 36 images at full
  2K (≈95 MB regression). Editor re-optimized → 22 MB. Bake this step into the regen flow.
- CNN-templates verdict (origin-story / image-grid) still pending — decide and record.
- Pending: cover 1200×630 social-card crop; heavier WBW redesign (hand-feel display font for
  kickers/dividers only); a 2nd timeline (L2 tokenization history); Heaps + position-bias data scripts.
- **User directive:** use `Lectures/assets/img/L0/L0-03-whoami.png` as the canonical Serega
  reference for all future Serega-scenes (mode=image + image_url). Needs https hosting + a `--ref`
  path in gen_images.py + an A/B test (reference vs text-only; confirm it composes a NEW scene
  rather than editing the portrait). Non-Serega scenes stay text-only.

**wins:** `timeline` template live (L1 s30 = 7-node search history, BM25/dense pivots);
data-grounding pipeline established (`_research/data/` zipf.py · bpe_merges.py · cosine.py + README,
wired into L2 s10/s37/s41/s56); all 36 images regenerated with green cap + no baked-in style text;
course cover created + wired into index.html OG tags; reversible WBW chrome polish in wbw-art.css.

**HARNESS note (for the editor, not the session agent):** session 1's `claude -p` hung ~16 min at
the tail because the agent spawned background monitor loops `until ! pgrep -f "gen_images.py --force
all"; do sleep; done` — the pgrep pattern matches the loop's OWN command line, so it never exits.
Before running sessions 2–5: (a) add a wall-clock **watchdog** that kills `claude -p` after N min so
a hang can't block the loop; (b) add an AGENDA rule: "never spawn `until ! pgrep <pattern>` loops
whose pattern matches themselves — run gen_images in the foreground, or poll by output file count."

---


## Session 0 — starting state (seeded by editor, pre-loop)
**blocking (do first in session 1):**
- Image prompts were just hardened (`gen_images.py`: anti-pattern block, locked GREEN tübetey,
  no baked-in text). The 35 existing images were generated with the OLD prompts — several have
  baked-in "Wait But Why style" titles and the tübetey colour drifts. → Regenerate ALL 35 with the
  new prompts (`--force all`), re-optimize, and visually confirm: no stray text, cap green.

**findings (prioritized):**
- Full visual redesign (`REDESIGN_BRIEF.md`) has NOT started — decks still use the original chrome.
- No data-grounded artifacts yet (`_research/data/` empty). Many example numbers (Zipf, fertility,
  BPE merges, cosine values) should be regenerated from open datasets.
- No `timeline` template yet; the "history/evolution" rubric dimension is under-served.
- Course cover image not yet created.

**wins:** voice-pass + 35 illustrations wired across 3 decks at 0/0/0; reusable patterns
(`.split-art`, `.cameo`, `.art-hero`, `.art-strip`) exist in `css/wbw-art.css`.

**rubric scores (baseline est.):** narrative 4 · examples 3 · stepwise 3 · templating 4 ·
history 2 · cases 3 · layout 4 · art 2 · data_grounding 0
