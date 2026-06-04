# NARRATIVE_METHOD.md — how we build the story (lectures + the Book)

> **Status: CANON-CANDIDATE / METHOD.** Practical methodology for constructing the Wait-But-Why
> narrative in this course, distilled from a close reading of the WBW corpus. It operationalizes
> [voice_wbw.md](../voice_wbw.md) (the *what* — Serega, creatures, catchphrases) into a repeatable
> *how* for every future lecture and Book chapter. Goal, in the author's words: **легко, весело,
> наглядно — но с глубиной** (light, fun, visual — yet deep).
>
> **Two surfaces, one story:** the *slides* render beats terse (EN, hall projection); the *Book*
> renders the same beats as full trilingual WBW prose. The beat sheet is the shared contract (see
> [SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md) §3, §6).

## Source corpus (read 2026-06-04)
- *Why Procrastinators Procrastinate* — anthropomorphic characters (Instant Gratification Monkey,
  Panic Monster), the "Dark Playground."
- *The AI Revolution: Road to Superintelligence (Pt 1)* — teaching a hard quantitative idea
  (exponential progress) via the time-traveler / Die Progress Unit, the staircase, staged ANI→AGI→ASI.
- *The Fermi Paradox* — scale-as-awe (grain-of-sand anchor), bucketing many hypotheses, recursion.
- *Putting Time in Perspective* — the visual *is* the argument (proportional timelines, 24-hour clock).
- *Religion for the Nonreligious* — abstract framework as spatial metaphor (the consciousness
  staircase, the fog), author as fellow-traveler.

---

## 1. The twelve principles (technique → teaching translation → our use)

### P1 — Hook by demolition or by puzzle, never by definition
WBW never opens with "X is defined as…". It either **demolishes the naive view** (procrastination:
quotes the dictionary, then "tell beached whales they should avoid being out of the ocean") or
**validates a felt experience and turns it into a question** (Fermi: starry-night awe → "Where is
everybody?"). → **Our use:** every lecture/chapter opens on Serega's *problem*, framed by the
sci-fi/LOTR catchphrase, or on a naive approach that visibly fails. Never open a topic with its formal
definition. *(Slide: `title`/`divider` + a one-line hook. Book: a 2–4 paragraph cold open.)*

### P2 — Personify the abstraction as a named character with one visual tell and one job
The Monkey "thinks only about the present"; the Panic Monster is defined *purely by function* (the one
thing that scares the Monkey). One trait, one look, reused. → **Our use:** this is exactly our
**creatures** ([voice_wbw.md](../voice_wbw.md) §3). Each abstraction that recurs gets *one* creature
with *one* tell and *one* job: Lexical Gremlin = vocabulary mismatch; Tokenosaurus = sub-word
splitting; Sir Cosine = angle-on-the-sphere; the Wraith = distance concentration; Goodhart = metric
gaming. Introduce by contrast ("notice anything different?"), reuse across lectures, never invent a
second creature for the same idea.

### P3 — A spatial/physical metaphor carries the explanatory load
The staircase makes "levels of awareness" climbable; the fog makes "low self-awareness" something you
can be *lost in*; the exponential staircase makes "you're on the flat part of the curve" *visible*. →
**Our use:** pick **one governing spatial metaphor per hard idea** and let a figure embody it: the
*unit sphere* for cosine; the *funnel* for the retrieve→rank cascade; the *iceberg* for hidden ML
debt. The metaphor must be drawable and must be the same in slide and Book.

### P4 — Scale is an awe engine: one tangible anchor, dwarfed repeatedly
Fermi reuses the *grain of sand* and keeps multiplying past it ("10,000 stars for every grain of
sand"). Time-in-Perspective compresses 13.8 B years into one day so "modern humans = 1 second." →
**Our use:** for every big number (10¹² pages, ~15% never-seen queries/day, 10⁶→10 cascade), give a
**reusable physical anchor** and zoom against it. Keep the anchor consistent within a lecture.

### P5 — The visual is the argument, not decoration
"All timeline lengths are exactly accurate to the amount of time they're expressing." The diagram does
the cognitive work; prose only frames it. → **Our use:** the **widget/figure is load-bearing**. If a
beat's idea can be shown, the widget shows it and the prose points at it. This is why figures are
single-sourced and step-driven (same widget in slide and Book) — the *argument* must be identical in
both. Precision figures stay exact (cosine = 12.73 in both, always).

### P6 — Progressive disclosure: define terms gradually, each with a concrete example + a contrast
ANI→AGI→ASI are never dumped together; each arrives with an example (chess AI) and a contrast (the
"village idiot" vs Einstein on one tiny rung). → **Our use:** reveal one idea per beat; introduce each
term *at the moment it's needed*, paired with a worked instance and a foil. This maps onto the
step-engine (`data-from="k"` reveals; `walkthrough` ledger lines accrue one at a time).

### P7 — Name and disarm the reader's resistance
"*nahhhh* might feel right as you read this, but it's probably wrong." WBW says the skeptical thought
*out loud* and then reframes it. → **Our use:** pre-empt the student's "this seems pointless / I won't
need this / isn't this just X?" in speaker notes and Book asides. Convert objection into momentum.

### P8 — Author as fellow-traveler, not guru (epistemic humility)
"I'm about eight hours in and still on Step 1." Urban admits limits; it makes the framework *earned*. →
**Our use:** Serega is a **guide who is also figuring it out** ("buckle up, this one tripped me up
too"), never a lecturing authority. (Serega ≠ the instructor; the real bio stays formal — canon.)

### P9 — Humor as cognitive release, clustered at tension peaks, never on the precision
Jokes land right after dense passages ("This would suck"), in footnotes, inside the pictures — never
inside the actual mechanism. → **Our use:** ≤1 light beat per 2–3 slides; humor lives on
hooks/dividers/captions/notes and *inside doodles*, **never** on a formula, cascade number, or
derivation. A joke never costs a correct definition.

### P10 — Sentence rhythm: chop for conclusions, flow for explanation
Short declaratives close a thought ("It's a mess."); long sentences with dashes carry the reasoning;
rhetorical questions create turns; "you" implicates the reader. → **Our use (Book prose):** vary
cadence deliberately; end a beat on a short line; use direct address. *(Slides stay terse by nature —
this principle is mostly a Book principle.)*

### P11 — Curiosity scaffolding: pose the question before the answer; recur the spine question
Fermi keeps returning to "Where is everybody?"; AI Pt1 ends on "Will it be a nice God?" → **Our use:**
open a beat with the question it answers; thread the **course spine question** through every lecture:
*Get Data → Measure → Rank* — "how do we find the one record, and keep finding it forever?" End each
chapter on a hook into the next.

### P12 — Resolve with a callback + a reframe, not a tidy bow
Fermi ends not with an answer but a calibration ("whatever the truth is, it's mindblowing… maybe
there's more to the story"). Despair becomes possibility. → **Our use:** every lecture's **catchphrase
opens and closes** it (canon §6); the finale reframes what was learned and points forward. Avoid
"and that's it!" endings.

---

## 2. The Lecture/Chapter Spine (the reusable beat skeleton)

Every lecture and Book chapter is built from these beats, in order. This is the scaffold future passes
fill in. (Maps to the course's existing **Problem → What solves it → Detailed solution** pattern.)

| # | Beat | Job (WBW principle) | Slide render | Book render |
|---|------|---------------------|--------------|-------------|
| 0 | **Cold open / Hook** | P1, P11 — catchphrase situation; a puzzle or a failing naive view | `title` / `divider` + 1-line hook | 2–4 para cold open; Serega 1st-person |
| 1 | **The Problem** | P1, P2 — make it visceral; enter the antagonist creature | `divider`/`quote` + creature art | prose + inline doodle of the creature |
| 2 | **Stakes / Zoom** | P4 — why it matters; big number vs an anchor | `viz` / big-number slide | a scale paragraph; the anchor figure |
| 3 | **The Turn** | P3, P11 — "what solves it," introduced as hero metaphor/character | `divider` naming the idea | the reveal paragraph; question→answer |
| 4 | **The Climb** | P5, P6 — detailed solution; the figure does the work; worked example, exact numbers | `archflow`/`walkthrough`/`e2e`/`formula` (the **widget**) | the **same widget**, scroll-driven, with explanatory prose between steps |
| 5 | **The Catch** *(optional)* | P7, P9 — the gotcha / misconception / the trickster creature | `misconception`/`quiz` | an aside that names the trap |
| 6 | **Payoff / Callback** | P12 — resolve the catchphrase; reframe; bridge to next | `final` / `divider` callback | closing prose; hook into next chapter |

**Density rule (depth without losing lightness):** beats 0–3 and 5–6 are the *light/fun/visual* zone
(voice, art, humor live here). **Beat 4 — The Climb — is the depth zone and stays clean** (no
clowning; KaTeX exact; the worked example is real). Lightness *surrounds* rigor; it never dilutes it.
This is the single most important balance in the whole method.

---

## 3. Slides vs Book — same beats, different prose

| | Slides (EN, hall) | The Book (EN/RU/TT, personal device) |
|---|---|---|
| Granularity | one idea per slide; terse | flowing; a beat may be several scroll steps |
| Voice | minimal; voice lives in notes + art | **full WBW prose** — this is where P1/P8/P10/P11 breathe |
| Figures | widget mounted as `<section>` | **same widget**, steps driven by scroll position |
| Humor | captions, dividers, doodles | captions, asides, footnote gags, doodles |
| Length | bounded by hall legibility | as long as the idea needs (WBW essays are long on purpose) |

The Book is where the WBW format is *native* (long scrolling illustrated essay). Slides are the
disciplined lecture-hall projection of the same spine.

---

## 4. Acceptance checklist (run every narrative pass — extends voice_wbw §6)

- [ ] Opens on a **problem/puzzle/failing-naive-view**, not a definition (P1).
- [ ] Every recurring abstraction uses an **existing creature** (one tell, one job); no duplicate
      creatures for one idea (P2).
- [ ] Exactly **one governing spatial metaphor** per hard idea, drawn as the load-bearing figure (P3, P5).
- [ ] Big numbers have a **consistent physical anchor** (P4).
- [ ] Terms are introduced **progressively**, each with an example + a contrast (P6).
- [ ] The likely **student objection is named and disarmed** (P7).
- [ ] Serega reads as a **fellow-traveler**, never overwrites the real instructor bio (P8).
- [ ] Humor ≤ 1 per 2–3 beats; **none on precision content** (P9).
- [ ] (Book) Sentence cadence varies; beats end on short lines; direct "you" (P10).
- [ ] The **spine question** (Get Data → Measure → Rank) is threaded; chapter ends on a forward hook (P11).
- [ ] The **catchphrase opens and closes**; finale reframes, doesn't just stop (P12).
- [ ] **The Climb (beat 4) is clean and exact** — light surrounds rigor, never dilutes it.

## 5. Anti-patterns (kill on sight)
- Definition-first openings; wall-of-text without a figure; a joke riding on a formula; a second
  creature for an idea that already has one; "fun" that makes a number fuzzy; a metaphor that's
  decorative (not load-bearing); a chapter that resolves with no callback; Serega claiming to *be* the
  instructor; art that drifts from the locked Serega (cap + long wavy hair) — caught by `image-gate`.

---

## 6. Worked micro-example (L2 similarity arc → see [REFERENCE_IMPL_L2.md](REFERENCE_IMPL_L2.md))
> **Hook (P1):** Serega must teach a machine to tell whether two alien phrases *mean* the same thing —
> length keeps lying to him (a long sentence isn't "more meaning"). **Problem + creature (P2):** the
> naive *Euclidean* ruler is fooled by magnitude. **Turn + metaphor (P3):** measure the **angle**, not
> the distance — enter **Sir Cosine and the Knights of the Unit Sphere**. **Climb (P5/P6):** the
> `cosine-sphere` widget, step by step, on the *exact* worked vectors (cos, ‖x−y‖²=2(1−cosθ),
> √162≈12.73) — clean, no jokes. **Catch (P7):** in high dimensions the **Curse-of-Dimensionality
> Wraith** flattens all distances — the ruler breaks worse than you think. **Payoff (P12):** the
> Knights win on the sphere; callback to First Contact; bridge to embeddings (next lecture).
