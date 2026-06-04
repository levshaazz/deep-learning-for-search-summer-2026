# REFERENCE_IMPL_L2.md — reference implementation of one vertical slice (L2 "First Contact")

> **Status: DESIGN REFERENCE (no code).** A worked, end-to-end specification of how the source layers
> in [SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md) compose for **one lecture**, so future passes copy
> the pattern instead of re-deciding it. Covers both layers requested:
> **(b)** the content-collection schema + the L2 **beat sheet**, and
> **(a)** the **widget `manifest.json` contract** + the *"one figure → slide & Book"* rule.
> Narrative follows [NARRATIVE_METHOD.md](NARRATIVE_METHOD.md); data follows the existing
> [check_claims.py](../check_claims.py) facts. **Everything below is a spec / illustrative shape, not
> application code.**

We use L2 because it has the richest narrative (First Contact + the Sir-Cosine/Wraith arc) and the
most reusable figure (the cosine sphere).

---

## 0. The slice, at a glance (single-source dependency graph)

```
                       data/l2-cosine.json   ← ONE source of the numbers (cos, ‖x−y‖²=2(1−cosθ), √162≈12.73)
                              │ read by
                       widgets/cosine-sphere/ ← ONE figure (step-state model)
                       ┌──────┴───────┐ embedded by
        SLIDE renderer │              │ BOOK renderer
   /slides/02 (EN)  ───┘              └─── /{lang}/book/02 (EN/RU/TT)
   driver: arrow keys (deck.js)            driver: scroll (Scrollama) → SAME steps
                              ▲
                       narrative/L2.md  ← ONE beat sheet (both renderers must cover it)
                              ▲
                       i18n/L2.{ru,tt-Cyrl}.json (+ tt-Latn derived)  ← Book prose only; slides EN
```

Gates that hold this slice together: **shared-data** (numbers == `data/`), **beat-coverage** (both
renderers cover required beats), **scroll-step** (each Book step maps to a real widget step),
**i18n-coverage/-structure/tt-translit** (Book + chrome only — slides are EN). See SITE_ARCHITECTURE §10.

---

# Part (b) — content-collection schema + L2 beat sheet

## b.1 Directory layout for this lecture

```
content/lectures/02-first-contact.md      ← lecture entry (frontmatter + EN Book prose, beat-anchored)
narrative/L2.md                            ← the beat sheet (the contract; mirrored as frontmatter `beats`)
data/l2-cosine.json                        ← canonical worked example
data/l2-corpus-stats.json                  ← Zipf/Heaps numbers (other L2 widgets)
data/l2-bpe.json                           ← BPE/WordPiece merges (Tokenosaurus widget)
widgets/cosine-sphere/                      ← the figure (Part a)
i18n/L2.ru.json  i18n/L2.tt-Cyrl.json       ← Book translations (keyed); tt-Latn derived at build
Lectures/02-nlp-tokenization-similarity.html← the EXISTING deck (EN), unchanged; slide renderer target
```

## b.2 Astro content-collection schema (conceptual — Zod shape)

A `lectures` collection. Frontmatter is schema-validated at build (a malformed beat or missing data
ref **fails the build** — systematicity by construction).

```
lectures = collection({
  type: 'content',                      // body = EN Book prose, segmented by <!-- beat:ID --> anchors
  schema: z.object({
    number:      z.number(),            // 2
    slug:        z.string(),            // "02-first-contact"
    title:       z.object({ en, ru, ttCyrl }),         // chapter title ×3 (Book + chrome)
    catchphrase: z.object({ id: z.string(), open: i18nText, close: i18nText }),  // "first-contact"
    spineRole:   z.enum(['get-data','measure','rank']).array(),  // L2 → ['measure']
    creatures:   z.array(z.enum(['tokenosaurus','sir-cosine','dimensionality-wraith'])),
    slidesHref:  z.string(),            // "/slides/02"  (EN deck, cross-linked)
    dataRefs:    z.array(z.string()),   // ['l2-cosine','l2-corpus-stats','l2-bpe']
    beats:       z.array(BeatSchema),   // the spine, below
  })
})

BeatSchema = z.object({
  id:        z.string(),                                  // "climb-cosine"
  kind:      z.enum(['hook','problem','stakes','turn','climb','catch','payoff']),  // NARRATIVE_METHOD §2
  title:     i18nText,
  widget:    z.string().optional(),                       // "cosine-sphere"  (ref into widgets/)
  dataRefs:  z.array(z.string()).default([]),             // ['l2-cosine']
  requiredInSlides: z.boolean().default(true),
  requiredInBook:   z.boolean().default(true),
  precision: z.boolean().default(false),                  // true → the "clean/exact" zone (no humor)
})
i18nText = z.object({ en: z.string(), ru: z.string().optional(), ttCyrl: z.string().optional() })
```

Notes:
- `beats` is the **single source** the two renderers consume. `beat-coverage` gate fails if the deck
  or the Book omits a `required*` beat or reorders them.
- `precision:true` beats are flagged so the proofreader/voice gate knows humor is **banned** there
  (NARRATIVE_METHOD P9 / §2 density rule).
- Slides are EN, so `i18nText.ru/ttCyrl` are consumed only by the Book + chrome, never the deck.

## b.3 The L2 beat sheet (`narrative/L2.md` — the contract, fully written)

Catchphrase **"First Contact"** (Project-Hail-Mary vibe): Serega must teach a machine to understand an
alien's speech. Spine question threaded: *how do we measure when two meanings are close?* (the
**Measure** leg of Get Data → Measure → Rank).

| # | beat.id | kind | precision | widget | Slide (EN, terse) | Book (EN/RU/TT, prose) |
|---|---------|------|-----------|--------|-------------------|------------------------|
| 0 | `hook-first-contact` | hook | — | — | `divider`: "First Contact" + Serega-at-console art | Cold open: Serega meets the alien; subtitles are gibberish; "how do I tell if two things it says *mean* the same?" |
| 1 | `problem-length-lies` | problem | — | — | `quote`/`viz`: "a longer sentence isn't more meaning" | The naive move — count overlap / measure raw distance — gets fooled; *length lies* |
| 2 | `stakes-meaning-space` | stakes | — | — | `viz`: words → vectors in ℝⁿ (zoom: huge space) | Each phrase is a point in a high-dim *meaning space*; anchor: "an arrow in space" |
| 3 | `turn-measure-angle` | turn | — | — | `divider`: "Measure the **angle**, not the length" + Sir-Cosine art | The reveal: rotate the question from *how far* to *which direction*; **enter Sir Cosine & the Knights of the Unit Sphere** |
| 4 | `climb-cosine` | **climb** | **true** | **cosine-sphere** | `e2e`/`formula` mounting `cosine-sphere`: the exact worked vectors, cos, ‖x−y‖²=2(1−cosθ), √162≈12.73 | **Same `cosine-sphere` widget**, scroll-driven; clean prose between steps; **no jokes** — the math is real |
| 5 | `catch-curse-highd` | catch | — | — | `misconception`/`quiz`: "in high-d, all distances look the same" + Wraith art | The **Curse-of-Dimensionality Wraith** flattens the histogram into a spike; raw distance breaks worse than you'd think |
| 6 | `payoff-knights-win` | payoff | — | — | `final` callback: the Knights hold the sphere; bridge → embeddings | Resolve First Contact (the machine now *measures meaning*); hook into next chapter (dense embeddings) |

(Other L2 figures — `tokenosaurus`/BPE ledger from `l2-bpe.json`, Zipf/Heaps from
`l2-corpus-stats.json` — slot in as their own beats earlier in the chapter using the same pattern;
shown here is the similarity arc, the richest slice.)

## b.4 Book body anchoring

The EN Book prose lives in `content/lectures/02-first-contact.md`, segmented by beat anchors so the
build can interleave widgets and apply the i18n weave:

```
<!-- beat:hook-first-contact -->
I’m Serega, and I’ve got a problem. There’s an alien on my screen…       ← full WBW voice (P1, P8, P10)
<!-- beat:turn-measure-angle -->
So I stopped asking *how far apart* and started asking *which way*…
<!-- beat:climb-cosine widget=cosine-sphere -->
{/* the widget mounts here; prose between its steps comes from i18n step keys */}
```

RU and `tt-Cyrl` for these segments live keyed in `i18n/L2.ru.json` / `i18n/L2.tt-Cyrl.json`; `tt-Latn`
is derived. Coverage gate reports e.g. `L2 Book: en 100% · ru 80% · tt-Cyrl 35%` and the chapter still
ships (fallback `tt-Latn→tt-Cyrl→ru→en`).

---

# Part (a) — widget manifest contract + "one figure → slide & Book"

## a.1 The core rule (why this works at all)
From the audit: **`deck.js` is a step-state engine**, not a slide engine. A widget owns a *step-state
model* (`currentStep ∈ 0..maxStep`) and renders itself for any step. It **does not listen to input**.
Two thin **drivers** set the step:
- **Slide driver** = the existing `deck.js` arrow-key/step engine (already there — `data-current-step`,
  `slide:enter`, `data-from="k"`).
- **Book driver** = Scrollama: `onStepEnter(k)` sets the widget's `currentStep = k`.

Same widget, same data, same steps → the figure is **identical** in hall and on a phone, and the
`shared-data` + `scroll-step` gates can prove it.

## a.2 `widgets/cosine-sphere/manifest.json` (full illustrative shape)

```jsonc
{
  "id": "cosine-sphere",
  "version": "1.0.0",
  "title": { "en": "Cosine on the unit sphere", "ru": "Косинус на единичной сфере",
             "ttCyrl": "Берәмлек сферасында косинус" },
  "maxStep": 4,                       // 0..4 — single source of step count for BOTH drivers
  "coordSpace": { "w": 1000, "h": 600 },   // intrinsic units; scales in slide auto-fit AND responsive Book
  "data": ["l2-cosine"],              // reads data/l2-cosine.json — the ONLY source of numbers
  "protectedTerms": ["cosine", "Euclidean", "L2"],   // stay Latin in all langs (i18n-structure gate)
  "a11y": { "role": "img", "altKey": "cosine-sphere.alt" },

  // The shared STEP CONTRACT — what each step reveals/focuses + where its caption/number come from.
  "steps": [
    { "step": 0, "labelKey": "cosine-sphere.s0", "focus": "two-vectors",  "reads": null },
    { "step": 1, "labelKey": "cosine-sphere.s1", "focus": "euclid-ruler", "reads": "euclid" },   // ‖x−y‖
    { "step": 2, "labelKey": "cosine-sphere.s2", "focus": "angle-theta",  "reads": "theta"  },
    { "step": 3, "labelKey": "cosine-sphere.s3", "focus": "unit-sphere",  "reads": "cos"    },
    { "step": 4, "labelKey": "cosine-sphere.s4", "focus": "identity",     "reads": "relation" } // ‖x−y‖²=2(1−cosθ)
  ],

  // How each renderer MOUNTS the same widget.
  "mounts": {
    "slide": { "dataType": "e2e", "driver": "deck-step" },        // <section data-type="e2e"> in the EN deck
    "book":  { "island": "client:visible", "driver": "scrollama" } // Astro island; scroll sets the step
  }
}
```

## a.3 `data/l2-cosine.json` (the one source of the numbers)

```jsonc
{
  "x": [ ... ], "y": [ ... ],          // the worked vectors
  "cos": 1.0,                          // displayed cosine (matches check_claims "cos=1")
  "euclid": 12.7279,                   // √162 ≈ 12.73  (matches check_claims "euclid ≈12.73")
  "relation": "‖x−y‖² = 2(1 − cos θ)", // the identity shown at step 4 (LaTeX rendered by KaTeX)
  "provenance": "L2 similarity worked example; verified by _research/check_claims.py"
}
```
The slide and the Book both read these fields; **neither hard-codes 12.73**. `check_claims.py` is
repointed to assert this file == what renders in both surfaces.

## a.4 Slide mount (existing engine, unchanged)
The deck embeds the widget as a normal stepped section; `data-from="k"` / the step counter drive it:
```html
<section class="slide" data-type="e2e" data-max-step="4" data-widget="cosine-sphere"> … </section>
```
Arrow keys advance steps exactly as today. No deck-engine change — `data-widget` is just a mount hint
the build uses to inject the widget fragment.

## a.5 Book mount (Astro island + Scrollama driver)
The Book page renders the prose column with one `.scroll-step[data-step="k"]` marker per widget step,
and pins the widget. The driver bridges scroll → the **same** step API:
```
onStepEnter({ index }) → widget.setStep(index)   // index ∈ 0..maxStep, validated against manifest
```
`scroll-step` gate: every `.scroll-step[data-step]` in the Book must have `0 ≤ step ≤ manifest.maxStep`
(the scroll analog of the existing narrative-anchor gate).

## a.6 The contract, stated as invariants (copy for every future widget)
1. **Driver-agnostic:** the widget exposes `setStep(k)` / `maxStep` and renders for any `k`. It
   **never** binds keyboard or scroll itself. (Drivers do.)
2. **One data source:** all numbers come from a `data/*.json` listed in `data[]`. No literals in the
   figure.
3. **One step count:** `maxStep` in the manifest is authoritative for both `data-max-step` (slide) and
   the Scrollama step list (Book).
4. **i18n by key:** all human text is `labelKey` into the catalogs; the figure ships no prose. (Slide
   uses EN values; Book uses the woven language.)
5. **Protected terms** stay Latin in every language (`protectedTerms[]`; i18n-structure gate).
6. **Precision figures carry `precision:true` on their beat** → humor banned in surrounding prose
   (NARRATIVE_METHOD §2).
7. **Self-test fixture:** ships with a known-bad input that the relevant gate catches (AUDIT_V2 §2.4
   discipline) — e.g. a planted `euclid: 99` must fail `shared-data`.

---

## 3. What a future pass copies
For lecture *N*: create `content/lectures/NN-*.md` (+ beats), `narrative/LN.md` (fill the 7-beat
spine), `data/lN-*.json` (numbers, verified), any new `widgets/*/manifest.json` (obey a.6), and
`i18n/LN.{ru,tt-Cyrl}.json` for the Book. Slides stay EN. Run the gate stack. The schema + the beat
spine + the widget contract mean each new lecture is **assembly, not invention**.
