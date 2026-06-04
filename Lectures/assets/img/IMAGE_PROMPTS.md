# IMAGE_PROMPTS.md — Generation pipeline (Serega · Wait But Why edition)

> **How to use this file.** Each entry has a header line — `name · ratio · → target path ·
> slide binding` — and a **Prompt** that begins with `⟪PREAMBLE⟫`. To generate, paste the
> full **STYLE PREAMBLE** (below) **then** the scene text into GPT Image / Nano Banana Pro,
> render at the stated ratio, and save to the exact target path. I (the deck) wire each `<img>`
> in during the **Art-pass** (Phase D). Canon: `_research/voice_wbw.md`.
>
> **Generate the charsheet FIRST** (bottom of this file) and use it as a style/character
> reference for every other prompt, so Serega doesn’t drift.
>
> **Tags:** `[rewrite]` = polished from an existing speaker-note `IMAGE PROMPT` draft (that draft
> gets deleted when the `<img>` lands). `[new]` = added to complete the catchphrase arc / creatures.
> **Precision slides are off-limits** (cascade numbers, BPE merges, cosine math, archflow/sequence) —
> no art replaces them; art goes on titles / dividers / hooks / quotes / finals / metaphors only.

---

## ⟪PREAMBLE⟫ — STYLE PREAMBLE (paste before every scene)

> Wait But Why style hand-drawn doodle: thick black ink outlines, off-white paper, flat 1–2
> accent colours (course blue **#2A6FDB** + one **warm orange** accent), crude MS-Paint charm,
> expressive minimal stick figures, hand-lettered labels, **no gradients, no 3D**. When the
> narrator appears it is the recurring character **Serega**: round-headed stick figure wearing
> an embroidered **Tatar skullcap (tübətəy)** with **long black wavy hair to the shoulders**.

Aspect ratios: full-slide hook / divider → **16:9** · viz-frame metaphor → **16:9** or **4:3** ·
Serega cameo / portrait → **1:1** or **3:4** · charsheet → **3:2**.

---

# Lecture 0 — Introduction · catchphrase “The Briefing”

### L0-01-briefing · 16:9 · → assets/img/L0/L0-01-briefing.png · slide 01 Title `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + **Serega** as an expedition captain seated at a spaceship console, one
hand pointing forward through a viewport at a glowing search-bar shaped like a hatch opening onto
a vast **Galaxy of Information** (stars made of tiny 1s, 0s and document icons). Hand-lettered
label “mission: search”. Calm, confident, whiteboard-sketch feel.

### L0-03-whoami · 1:1 · → assets/img/L0/L0-03-whoami.png · slide 03 Divider P01 `[new]`
**Prompt:** ⟪PREAMBLE⟫ + a small corner **cameo of Serega** waving hello, free hand on his chest,
tiny hand-lettered speech bubble “I’m Serega.” Minimal background, decorative. (Cameo for the
“who am I” divider; `pointer-events:none` when placed.)

### L0-06-quote-trail · 16:9 · → assets/img/L0/L0-06-quote-trail.png · slide 06 Quote `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a winding dotted trail starting at **Serega** typing keywords into a box
and ending at a glowing brain-shaped database; small hand-lettered signposts along the path:
“keywords”, “meaning”, “vectors”, “RAG”. The journey of the course, one warm-orange accent.

### L0-08-coursearc · 16:9 · → assets/img/L0/L0-08-coursearc.png · slide 08 Architecture `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + six connected boxes climbing left-to-right like stepping stones over
water, **Serega** hopping between them; hand-lettered labels “IR”, “embeddings”, “neural”,
“vector DB”, “RAG”, “agentic”. Two flat accent colours.
*Placement: decorative companion / divider art — the precise course-spine diagram on this slide stays as-is.*

### L0-20-sendoff · 16:9 · → assets/img/L0/L0-20-sendoff.png · slide 20 Quote (finale callback) `[new]`
**Prompt:** ⟪PREAMBLE⟫ + **Captain Serega** standing in the open hatch, torch/flashlight raised,
giving a send-off salute to the crew as the Galaxy of Information glows ahead; tiny hand-lettered
banner “good luck out there”. Warm but a little ominous — the captain’s send-off. (Closes “The Briefing”.)

---

# Lecture 1 — Search & IR + ML System Design · catchphrase “The Lost Record”

### L1-06-needle · 16:9 · → assets/img/L1/L1-06-needle.png · slide 06 Hook · Drowning `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + **Serega** on a tiny raft in a vast ocean made of stacked papers and
1s and 0s, one glowing **orange** document floating just out of reach; hand-lettered label
“the one I need”. Single warm-orange accent. (Opens “The Lost Record”.)

### L1-08-lossy-need · 16:9 · → assets/img/L1/L1-08-lossy-need.png · slide 08 Visualization · Lossy need `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a big fuzzy thought-cloud full of tiny details being squeezed through a
narrow funnel into two boxy words, then fanning back out to a row of document icons; hand-lettered
“need → query → docs”, one warm-orange accent.

### L1-14-grounding · 16:9 · → assets/img/L1/L1-14-grounding.png · slide 14 Visualization · Products hook `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a confident robot at a podium declaring “a horse has 8 legs!” beside a
small embarrassed horse that clearly has 4; a thin warm-orange arrow points to a
“grounding / retrieval” box that fixes it. Hand-lettered labels, whiteboard feel.

### L1-22-leaky-bucket · 16:9 · → assets/img/L1/L1-22-leaky-bucket.png · slide 22 Recall ceiling `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a leaky bucket catching gold stars with two stars falling out through
holes at the bottom; a little robot labelled “reranker” reaches down but can’t grab the fallen
stars; hand-lettered “can’t re-rank what you didn’t retrieve”, one warm-orange accent.

### L1-24-lexical-gremlin · 16:9 · → assets/img/L1/L1-24-lexical-gremlin.png · slide 24 Lexical gap `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + LEFT: a **couch** and a **sofa** separated by a brick wall labelled
“BM25”, with **the Lexical Gremlin** (a small gremlin) smugly holding the wall in place; a warm-orange
dotted cloud labelled “embeddings” lets them reach over and hold hands. RIGHT: a thought bubble
“jaguar” splitting into three arrows to a cat, a car, and a laptop. Hand-lettered labels.

### L1-25-zipf-beach · 16:9 · → assets/img/L1/L1-25-zipf-beach.png · slide 25 Long tail `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a Zipf curve drawn as a beach: a few tall spiky sandcastles on the left
labelled “head”, trailing into endless tiny footprints in the sand to the right labelled
“tail · never seen before”; **Serega** with a magnifying glass squints at the tail. One warm-orange accent.

### L1-29-position-bias · 16:9 · → assets/img/L1/L1-29-position-bias.png · slide 29 Position bias `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a search results page with a heatmap “golden triangle” glowing orange in
the top-left corner; a circular arrow loop “click #1 → logs say #1 is best → rank it #1 again”;
hand-lettered “click logs lie”, one warm-orange accent.

### L1-32-not-a-system · 16:9 · → assets/img/L1/L1-32-not-a-system.png · slide 32 Hook · Not a system `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a proud **Serega** holding up a tiny laptop showing “accuracy 0.92”,
while behind him looms a huge tangled machine of pipes, gauges and wires labelled “production”.
One warm-orange accent. (Opens the ML-System-Design arc.)

### L1-33-iceberg · 16:9 · → assets/img/L1/L1-33-iceberg.png · slide 33 ML iceberg `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + an iceberg: a tiny tip above the waterline labelled “ML code ~5%”, a vast
submerged body filled with small boxes “config, data collection, serving, monitoring, feature
extraction”; a tiny boat with **Serega** on top peering down. One warm-orange accent.

### L1-40-goodhart · 16:9 · → assets/img/L1/L1-40-goodhart.png · slide 40 Visualization · Goodhart `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + two diverging line graphs: a rising line “CTR” and a falling dotted red
line “real satisfaction”, with **Goodhart the Trickster** (a grinning trickster) yanking the CTR
line up with a clickbait fishing-hook; hand-lettered “when a measure becomes a target”, one warm-orange accent.

### L1-43-flywheel · 16:9 · → assets/img/L1/L1-43-flywheel.png · slide 43 Data flywheel `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + two side-by-side flywheels: a smooth wheel labelled “virtuous:
users → logs → model → results”, and a red wheel whose bias arrow thickens each lap, labelled
“rich get richer”. One warm-orange accent, whiteboard feel.

### L1-56-found · 16:9 · → assets/img/L1/L1-56-found.png · slide 56 Final (finale callback) `[new]`
**Prompt:** ⟪PREAMBLE⟫ + **Serega** on the raft, finally holding up the one glowing **orange**
document overhead in triumph, the ocean of bytes calm around him; hand-lettered “found it.”
(Closes “The Lost Record”.)

---

# Lecture 2 — NLP · Tokenization · Similarity · catchphrase “First Contact” + LOTR arc

### L2-06-first-contact · 16:9 · → assets/img/L2/L2-06-first-contact.png · slide 6 Hook `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + two figures facing each other — **Serega** (human) and a friendly
many-legged **alien** — with a fuzzy speech-cloud full of question marks between them;
hand-lettered label “no shared symbols”. (Opens “First Contact”.)

### L2-08-discreteness · 16:9 · → assets/img/L2/L2-08-discreteness.png · slide 8 Discreteness `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + LEFT a smooth grey gradient bar labelled “interpolates”; RIGHT two
word-boxes “cat” and “dog” with a question mark between them and a crossed-out blurry box labelled
“not a word”. One accent colour. (Words are discrete — you can’t average them.)

### L2-10-zipf · 16:9 · → assets/img/L2/L2-10-zipf.png · slide 10 Zipf `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a steep hand-drawn 1/r bar chart: the first few bars labelled “the”,
“of”, “and” towering over a long flat tail labelled “words seen once”. One accent colour.

### L2-23-tokenosaurus · 16:9 · → assets/img/L2/L2-23-tokenosaurus.png · slide 23 Definition BPE `[new]`
**Prompt:** ⟪PREAMBLE⟫ + **Tokenosaurus** — a goofy friendly dinosaur — snipping the word
“tokenization” into chunks “token”, “iza”, “tion” with its teeth/scissor-claws, the pieces
falling into a basket labelled “sub-words”; **Serega** watches, delighted. One warm-orange accent.
*Placement: hook/metaphor companion for the tokenization arc — the BPE-merge worked example stays as-is.*

### L2-37-digits · 16:9 · → assets/img/L2/L2-37-digits.png · slide 37 Digits `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + the number “327” being scissored two different ways (“3|27” and “327”),
with a confused **Serega** trying to add two misaligned columns; hand-lettered “place values don’t
line up”. One accent colour.

### L2-41-token-tax · 16:9 · → assets/img/L2/L2-41-token-tax.png · slide 41 Token tax `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a bar chart of little token-coins per language: English a short stack,
Hindi / Telugu / Turkish tall stacks; a hand-lettered “$” rising with the bars; label
“same sentence, bigger bill”. Two accent colours.

### L2-42-glitch-token · 16:9 · → assets/img/L2/L2-42-glitch-token.png · slide 42 Glitch tokens `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a dense cloud of small labelled embedding dots and one lonely dot far off
labelled “SolidGoldMagikarp ???”; a glitchy **Serega** short-circuiting with sparks. One accent colour.

### L2-49-query-angle · 16:9 · → assets/img/L2/L2-49-query-angle.png · slide 49 Hook P4 `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a 2D plane with one bold arrow labelled “query” and several thin arrows
labelled “docs”, a small hand-drawn angle wedge between the query and the nearest doc; label
“relevant = close”. One accent colour.

### L2-48-sir-cosine · 16:9 · → assets/img/L2/L2-48-sir-cosine.png · slide 48 Divider P4 `[new]`
**Prompt:** ⟪PREAMBLE⟫ + **Sir Cosine**, a stick-figure knight in a tübətəy-crested helm (it’s
**Serega** as a knight), standing on a glowing **unit sphere**, measuring the *angle* between two
lance-vectors with a protractor; small banner “the Knights of the Unit Sphere”. LOTR-quest mood,
one warm-orange accent. (Opens the similarity LOTR arc.)

### L2-56-cosine-vs-euclid · 16:9 · → assets/img/L2/L2-56-cosine-vs-euclid.png · slide 56 Relationships `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + two arrows on the same ray, a short one “(1,1)” and a long one
“(10,10)”; a curly brace saying “cosine: identical!” and a long dashed **red** segment saying
“Euclidean: very far!”. One accent + one red.

### L2-61-wraith · 16:9 · → assets/img/L2/L2-61-wraith.png · slide 61 Divider high-d `[new]`
**Prompt:** ⟪PREAMBLE⟫ + **the Curse-of-Dimensionality Wraith** — a hooded Nazgûl-like shadow —
crushing a wide bell-shaped histogram down into a single thin spike with its hand; knight **Serega**
braces against it; hand-lettered “everything becomes equidistant”. One accent + one red.
(Opens the high-dimensional arc; the precise concentration plots that follow stay as-is.)

### L2-62-concentration · 16:9 · → assets/img/L2/L2-62-concentration.png · slide 62 Concentration `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + four hand-drawn histograms side by side labelled d=2, 10, 100, 1000, the
spread collapsing from a wide hill to a thin spike; label “everything is equidistant”. Gradient of
accent colours (flat, no smooth gradient — stepped swatches).

### L2-63-hubness · 16:9 · → assets/img/L2/L2-63-hubness.png · slide 63 Hubness `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + a crowd of stick figures all pointing at two “popular” figures wearing
crowns labelled “hub”, most others ignored; label “a few points hog all the neighbours”.
One accent + one red.

### L2-64-anisotropy · 16:9 · → assets/img/L2/L2-64-anisotropy.png · slide 64 Anisotropy `[rewrite]`
**Prompt:** ⟪PREAMBLE⟫ + LEFT a tight bundle of arrows squeezed into a thin cone labelled
“all look similar”; an arrow to RIGHT showing a balanced sphere of arrows labelled “whitened”.
One red + one green.

### L2-70-first-contact-callback · 16:9 · → assets/img/L2/L2-70-first-contact-callback.png · slide 70 Final (finale callback) `[new]`
**Prompt:** ⟪PREAMBLE⟫ + **Serega** and the **alien** now shaking hands / high-fiving, the
question-mark speech-cloud replaced by a shared glowing vector arrow between them; hand-lettered
“contact.” (Closes “First Contact”.)

---

# Reserve — divider cameos (use as needed)

### serega-cameo-point · 1:1 · → assets/img/_char/serega-cameo-point.png `[new]`
**Prompt:** ⟪PREAMBLE⟫ + small **Serega** cameo pointing to the right (toward slide content),
neutral smile, transparent/no background. Decorative divider host.

### serega-cameo-puzzled · 1:1 · → assets/img/_char/serega-cameo-puzzled.png `[new]`
**Prompt:** ⟪PREAMBLE⟫ + small **Serega** cameo scratching his head, puzzled, transparent/no
background. For “misconception / common pitfall” dividers.

---

# ⭐ GENERATE FIRST — Serega character sheet (style/character reference)

### serega-charsheet · 3:2 · → assets/img/_char/serega-charsheet.png `[new]`
**Prompt:** ⟪PREAMBLE⟫ + a **character reference sheet** of one consistent hero, **Serega**, drawn
six times in a row on off-white paper: (1) neutral standing, (2) pointing a hand, (3) scratching
head (puzzled), (4) running, (5) holding a sword/torch (LOTR pose), (6) seated at a spaceship
console (Sci-fi pose). In **every** pose he wears the embroidered **Tatar skullcap (tübətəy)** and
has **long black wavy hair to the shoulders**, round head, dot eyes, tiny smile, noodle limbs.
Thick black ink, flat course-blue + warm-orange accents, no gradients, no 3D. Hand-lettered tiny
labels under each pose.
