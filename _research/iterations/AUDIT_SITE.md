# AUDIT_SITE.md — gate-stack spec for the two-mode site (the 9 new gates)

> **Status: DESIGN REFERENCE (no code).** Specifies the new deterministic gates that extend
> [AUDIT_V2.md](AUDIT_V2.md) from "the decks" to "the whole site" (SITE_ARCHITECTURE §10). Same
> discipline as AUDIT_V2: **every HARD detector ships with a known-bad fixture in `_audit/fixtures/`
> that proves it fires (§2.4 rule) — no silent detectors**, and every gate reports `inspected/total`.
> The existing deck gates (`wbw-check`, `visual-gate`, `archflow/sequence/budget-audit`, golden,
> crossdeck, facts/narrative) keep running unchanged; these are **additive**.
>
> **Scope reminder:** slides are **EN-only**; the Book + chrome + reference pages are trilingual. i18n
> gates therefore exclude the decks. Numbers/data gates cover **both** media.

---

## 0. Where they run
New gates live in `_audit/` next to the existing ones, added to the iteration-harness preflight
self-tests and the per-build review gate (`iterate.sh`), and to `.github/workflows/ci.yml`. Each
entry below is **Purpose · Input · Output (pass/fail) · Severity · Known-bad fixture · Depends-on**.

---

## G1 — `shared-data` (numbers == one source)
- **Purpose:** kill numeric drift between slides, the Book, and the canonical `data/*.json`.
- **Input:** all `data/*.json` (source of truth) + every rendered number in the EN deck and the Book
  pages (and reference pages), matched by claim id (extends [check_claims.py](../check_claims.py)).
- **Output:** per claim, `displayed == source` within tolerance; report `N claims × {slide, book}`.
  **Fail** on any mismatch (claim id + surface + expected/actual).
- **Severity:** **HARD** (drift = wrong teaching).
- **Known-bad fixture:** a deck/Book fragment showing `euclid = 99` while `data/l2-cosine.json` says
  `12.73` → must fire; correcting the fragment clears it.
- **Depends-on:** `data/` layer populated; widgets read data by key (REFERENCE_IMPL_L2 a.6 rule 2).

## G2 — `token` (one design-token source)
- **Purpose:** prevent the `:root` divergence already visible between [index.html](../../index.html)
  and the deck CSS; enforce a single `tokens/design-tokens.css`.
- **Input:** `tokens/design-tokens.css` + every other CSS surface's `:root` (landing, deck, Book).
- **Output:** the set of token names/values defined anywhere outside the source file == ∅ (everything
  references the source). **Fail** lists each rogue/overriding token + file.
- **Severity:** **HARD**.
- **Known-bad fixture:** a stylesheet redefining `--accent:#FF0000` outside the token file → fires.
- **Depends-on:** token extraction (roadmap phase 1).

## G3 — `i18n-coverage` (ship partial languages safely)
- **Purpose:** report translation completeness per surface per language; allow shipping with partial
  RU/TT via fallback.
- **Input:** EN keys (canonical) + `i18n/*.{ru,tt-Cyrl}.json` (+ derived `tt-Latn`) for Book + chrome +
  reference. **Decks excluded** (EN-only).
- **Output:** `translated/total` per Book chapter + chrome + reference, per language, e.g.
  `L2 Book: en 100% · ru 80% · tt-Cyrl 35% · tt-Latn 35%` → drives a public status badge.
- **Severity:** **HARD only when EN (canonical) is incomplete**; RU/TT report **WARN + badge** (never
  block — the fallback `tt-Latn→tt-Cyrl→ru→en` keeps the page whole).
- **Known-bad fixture:** an EN key with no string (canonical hole) → HARD; a missing `tt-Cyrl` key →
  WARN only.
- **Depends-on:** i18n catalogs + fallback resolver.

## G4 — `i18n-structure` (catalogs are well-formed)
- **Purpose:** structural integrity of the translation catalogs.
- **Input:** all `i18n/*.json` + the `protected[]` term list (I18N_TT_TRANSLIT §4.2).
- **Output:** **Fail** on (a) **orphan key** (exists in a translation, not in EN canonical),
  (b) **missing key** referenced by a page/widget but absent from EN, (c) **protected-term
  translated** (a Latin technical term altered in any language), (d) malformed JSON / placeholder
  mismatch (e.g. `{n}` count differs across languages).
- **Severity:** **HARD**.
- **Known-bad fixture:** a `ru.json` key not present in EN (orphan) and a translation that renders
  `softmax`→`софтмакс` (protected violation) → both fire.
- **Depends-on:** key id convention; protected list.

## G5 — `tt-translit` (the two Tatar scripts can't diverge)
- **Purpose:** guarantee `tt-Latn` is a sanctioned derivation of `tt-Cyrl` (I18N_TT_TRANSLIT §5).
- **Input:** `i18n/*.tt-Cyrl.json`, committed `*.tt-Latn.json`, table + heuristics + overrides.
- **Output:** per key, `committed tt-Latn == translit(tt-Cyrl)` OR the diff is explained by an override
  entry. **Fail** lists unexplained divergences (key + expected vs actual). **WARN** lists
  `needs-review` (unknown-harmony) tokens for the author to pin.
- **Severity:** **HARD** on unexplained divergence; **WARN** on ambiguity (never blocks coverage).
- **Known-bad fixture:** a `tt-Latn` value hand-corrupted (`k`→`q`, no override) → HARD; adding the
  matching override clears it.
- **Depends-on:** I18N_TT_TRANSLIT table/heuristics/overrides.

## G6 — `scroll-step` (every Book step maps to a real widget step)
- **Purpose:** the scroll analog of the existing narrative-anchor gate — no scroll marker points at a
  nonexistent figure step.
- **Input:** every Book page's `.scroll-step[data-step]` markers + the mounted widgets' `manifest.json`
  (`maxStep`, `steps[]`).
- **Output:** for each marker, `0 ≤ data-step ≤ widget.maxStep` and the step exists in `steps[]`;
  every widget step 0..maxStep is reachable by ≥1 marker (no orphan steps). **Fail** lists bad markers
  / unreachable steps.
- **Severity:** **HARD** (a dead scroll step = a broken explanation).
- **Known-bad fixture:** a Book page with `data-step="9"` against a `maxStep:4` widget → fires.
- **Depends-on:** widget manifests (REFERENCE_IMPL_L2 a.2); Scrollama driver contract (a.5).

## G7 — `beat-coverage` (slides and Book tell the SAME story)
- **Purpose:** enforce that both renderers cover every `required` narrative beat, in order
  (NARRATIVE_METHOD §2; the contract is the beat sheet).
- **Input:** `narrative/L<n>.md` / the lecture entry's `beats[]` (the contract) + the deck's
  `data-screen-label`/section sequence + the Book's `<!-- beat:ID -->` anchors.
- **Output:** for each lecture, the set of `requiredInSlides` beats appears in the deck **in order**,
  and `requiredInBook` beats appear in the Book **in order**; `precision:true` beats are flagged for
  the humor-ban check. **Fail** lists missing/reordered beats per surface.
- **Severity:** **HARD** (divergent stories = the reuse guarantee broken).
- **Known-bad fixture:** a beat sheet with `climb-cosine` that the Book omits → fires; a deck with two
  beats swapped → fires.
- **Depends-on:** content-collection schema; beat anchors in both renderers.

## G8 — `responsive` (the Book works on a phone)
- **Purpose:** the inverse of the deck's hall-only assumption — Book pages must read on small screens
  (the deck's mobile warning does **not** apply to the Book).
- **Input:** rendered Book pages (Playwright) at a set of widths (e.g. 390 / 768 / 1280 px).
- **Output:** at each width: no horizontal overflow, sticky graphic + prose layout intact (graphic
  pins, prose flows), tap targets ≥ min size, font ≥ min, widget canvas scales (no clip). **Fail**
  lists page + width + defect. (Reuses visual-gate primitives where possible.)
- **Severity:** **HARD** for the Book; **N/A** for decks (excluded).
- **Known-bad fixture:** a Book page with a fixed-px wide table that overflows at 390 px → fires.
- **Depends-on:** Book layout; Playwright (already in `_audit/node_modules`).

## G9 — `link-integrity` (nothing dangles across the generated site)
- **Purpose:** no broken internal links across landing / Book / slides / reference, including
  per-language routes and the slide↔Book cross-links.
- **Input:** the built static site (`dist/`/`docs/`) — crawl every internal `href`/`src` + the i18n
  route table + `slidesHref`/`bookHref` cross-links.
- **Output:** every internal link resolves to an existing file/route; every lecture's slide↔Book
  cross-link is mutual; every language route exists or correctly falls back. **Fail** lists each dead
  link + its source page.
- **Severity:** **HARD**.
- **Known-bad fixture:** a Book chapter linking `/slides/99` (no such deck) → fires.
- **Depends-on:** Astro build output; routing table (SITE_ARCHITECTURE §9).

---

## Summary table

| Gate | Covers | Severity | Excludes decks? |
|------|--------|----------|------------------|
| G1 shared-data | numbers vs `data/` | HARD | no (both media) |
| G2 token | one `:root` source | HARD | no |
| G3 i18n-coverage | translation % + badge | HARD(EN)/WARN(RU,TT) | yes |
| G4 i18n-structure | catalog integrity | HARD | yes |
| G5 tt-translit | Cyrl↔Latn derivation | HARD/WARN | yes |
| G6 scroll-step | Book step ↔ widget | HARD | yes (decks use step-engine, already audited) |
| G7 beat-coverage | same story both surfaces | HARD | no |
| G8 responsive | Book on small screens | HARD | yes (decks hall-only) |
| G9 link-integrity | no dead links | HARD | no |

## Build order (suggested, mirrors roadmap)
1. **G2 token** + **G1 shared-data** — land with phases 1–2 (foundation + data). Cheapest, highest
   drift-prevention ROI.
2. **G6 scroll-step** + **G7 beat-coverage** — land with phase 3–5 (widget + first Book story).
3. **G3/G4/G5 i18n trio** — land with phase 4 (trilingual spine).
4. **G8 responsive** + **G9 link-integrity** — land with phase 6 (scale + deploy).

Each flips its status to DONE here and is added to the harness `--list`/summary as shipped — same
convention as AUDIT_V2.
