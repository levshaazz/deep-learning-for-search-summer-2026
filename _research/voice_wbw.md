# voice_wbw.md — Narrative & Character Canon (“Wait But Why edition”)

> **Status: CANON.** This file is the single source of truth for the *Serega* narrator,
> the Wait-But-Why voice, the recurring “creatures”, the per-lecture catchphrases, and the
> illustration **STYLE PREAMBLE**. Every deck and every future lecture obeys this file.
> Image prompts live in `Lectures/assets/img/IMAGE_PROMPTS.md` and **reference this file**.

**Hard invariants (never violated):**
- Only the existing template — no new slide types, no new CSS engine.
- All math in **KaTeX**. Content language is **English**.
- Pre-flight must stay **0 errors / 0 warnings / 0 console errors**; verify by headless render.
- **Technical slides stay clean.** Formulas, tables, diagrams, cascade numbers, BPE merges,
  cosine math, archflow/sequence — *no clowning*. The WBW voice & art live on
  titles / dividers / hooks / quotes / finals / metaphors, never on precision slides.

---

## 1. Voice rules (apply to ALL decks)

1. **Narrator is Serega**, first person: *“I’m Serega, and today we’ve got a problem…”*
   Warm, talks *to* the audience (“you”), light self-deprecation, like an old friend explaining.
2. **One–two narrative catchphrases per lecture** (§4). A made-up Sci-fi / LOTR situation
   that *frames* the technical material. The catchphrase opens Part-dividers and hook slides,
   occasionally surfaces in speaker notes, and **closes with a callback on the final slide**.
3. **Anthropomorphic “creatures”** personify abstractions (§3) — reusable across lectures.
4. **Humor is unobtrusive:** ≤ 1 joke/footnote per **2–3 slides**, *never* at the cost of
   accuracy. Jokes live in captions, speaker notes, and inside the pictures themselves.
5. **Zoom moves:** big numbers (10¹² pages, ~15% never-seen queries/day), timelines,
   “imagine that…”. Already partly present — amplify, don’t overdo.
6. **Connectedness:** the catchphrase begins on title/divider and *resolves* on the finale.
   The spine slide **Get Data → Measure → Rank** is the shared anchor across the course.

### Rhythm & typography (how the prose should *feel*)
- Mix short, chopped sentences with long ones. Rhetorical questions are welcome.
- *Italic* for terms on first use; **bold** for names/key ideas; footnote-style asides for gags.
- Prefer the concrete over the abstract: a raft on an ocean of bytes beats “large corpus”.
- One idea per beat. If a slide needs two jokes, delete one.

### What the voice is **not**
- Not a stand-up routine; not snarky; not ironic about the *student*.
- Not memes/pop-culture name-drops on technical slides.
- Never sacrifices a correct definition to land a line.

---

## 2. Character: **Serega** (the narrator made visible)

> **Serega is a course MASCOT / guide — NOT the instructor.** The real lecturer is
> **Albert Nasybullin** (formal bio + email stay exactly as-is, untouched). Serega is the
> doodle expedition-guide who narrates the journey and appears in the art. Serega narrates
> first-person *as a guide* (“buckle up, here’s the plan…”) but **never claims to be the
> instructor** and never overwrites the real bio/contact details. Think mascot co-pilot, not
> a rename of the human teaching the course.


Locked **character sheet** so the image model draws the *same* hero every time. The first
artifact to generate is `_char/serega-charsheet.png` (see prompt block at the bottom of
`IMAGE_PROMPTS.md`); every later prompt references the STYLE PREAMBLE (§5) so style/hero
don’t drift between pictures.

> **Serega** — a friendly stick-figure in Wait-But-Why style: simple round head, dot eyes +
> a tiny smile, thin noodle limbs. **Signature traits (ALWAYS present):** an **embroidered
> Tatar skullcap (tübətəy)** on his head, and **long black wavy hair** flowing out from under
> the cap down to shoulder length. Thick black ink outlines on off-white paper; 1–2 flat
> accent colours (course blue **#2A6FDB** + a warm accent); MS-Paint / Pixelmator crudeness;
> expressive but minimal. **No gradients, no 3D.**

**Pose sheet (reuse these):** neutral; pointing a hand; scratching head (puzzled); running;
holding a sword/torch (LOTR scenes); seated at a spaceship console (Sci-fi).

**Consistency rule:** if a picture shows the narrator, it shows *Serega* — cap + long wavy
hair, every time. A picture may also have *no* narrator (pure metaphor); that’s fine.

---

## 3. Reusable creatures (personified abstractions)

| Creature | Personifies | Visual tell | Home lecture(s) |
|---|---|---|---|
| **The Lexical Gremlin** | vocabulary mismatch (“couch” ≠ “sofa”) | a gremlin wedging a brick wall between two synonyms | L1 (lexical gap) |
| **Tokenosaurus** | tokenization / sub-word splitting | a goofy dino snipping words into chunks with teeth | L2 (BPE/WordPiece) |
| **Sir Cosine & the Knights of the Unit Sphere** | cosine similarity, angles on the sphere | a knight measuring the *angle* between vector-lances on a glowing sphere | L2 (similarity) |
| **The Curse-of-Dimensionality Wraith** | distance concentration in high-d | a Nazgûl-like wraith flattening a histogram into a thin spike | L2 (high-d) |
| **Goodhart the Trickster** | a measure that became a target | a grinning trickster bending a CTR line up with a clickbait hook | L1 (metrics) |

Creatures appear **only** on hooks/metaphor/viz-frame slides — never on a precision diagram.

---

## 4. Per-lecture catchphrases (Sci-fi / LOTR)

- **L0 — Introduction · “The Briefing.”** Serega = expedition captain briefing the crew
  before the flight through the **Galaxy of Information**. Dividers = mission stages.
  Finale (the *“I will make your life miserable”* line) = the captain’s send-off.
- **L1 — Search & IR + ML System Design · “The Lost Record.”** (Project-Hail-Mary vibe.)
  A station operator hunts **one** record among billions. IR = *find it*; ML System Design =
  *build the machine that keeps finding it forever*. Creatures: Lexical Gremlin, Goodhart the
  Trickster, the Iceberg (Sculley “Hidden Technical Debt”).
- **L2 — NLP · Tokenization · Similarity · “First Contact”** (Rocky/Project-Hail-Mary vibe) —
  Serega teaches a machine to understand an alien’s speech; then a **LOTR arc** for
  similarity: *Sir Cosine and the Knights of the Unit Sphere* vs the *Curse-of-Dimensionality
  Wraith*.
- **Future-lecture template:** 1 through-line catchphrase + 1–2 creatures + a finale callback.
  Pick **Sci-fi** for systems/infrastructure, **LOTR/quest** for journeys (retrieval, RAG).

---

## 5. STYLE PREAMBLE (verbatim string for every image prompt)

> **Wait But Why style hand-drawn doodle:** thick black ink outlines, off-white paper, flat
> 1–2 accent colours (course blue **#2A6FDB** + one warm accent), crude MS-Paint charm,
> expressive minimal stick figures, hand-lettered labels, **no gradients / no 3D**. When the
> narrator appears it is the recurring character **Serega**: round-headed stick figure wearing
> an embroidered **Tatar skullcap (tübətəy)** with **long black wavy hair to the shoulders**.

Aspect ratios by use (from the illustration system):
- Full-slide hook / divider background → **16:9**
- Viz-frame metaphor → **16:9** (wide) or **4:3**
- Serega cameo / portrait → **1:1** or **3:4**
- Charsheet → **3:2** (several poses in a row)

---

## 6. Acceptance criteria (for any deck claiming “WBW-done”)
- One consistent Serega across all images (cap + long wavy hair).
- The catchphrase **opens and closes** the lecture (callback on the final slide).
- Humor is unobtrusive (≤ 1 per 2–3 slides) and never on precision slides.
- 0 pre-flight errors / 0 warnings / 0 console errors (headless-verified).
- No “melted” illustration (headless visual audit clean); every image readable in **light and dark**.

---

### Source notes (style research)
Tim Urban / waitbutwhy.com: long conversational first-person; named anthropomorphic archetypes
(Instant Gratification Monkey, Panic Monster); zoom from particular → cosmic; deliberately crude
stick-figure art doing serious explanatory work. Refs:
`waitbutwhy.com/2013/10/why-procrastinators-procrastinate.html`,
`inksights.rep-ink.com/2016/03/...stick-figures...`,
`singularityhub.com/2016/01/20/wait-but-why-...`.
