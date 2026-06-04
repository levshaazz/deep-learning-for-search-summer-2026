#!/usr/bin/env python3
"""
gen_images.py — generate the Serega / Wait-But-Why deck illustrations.

Canon: _research/voice_wbw.md   ·   Prompt source: Lectures/assets/img/IMAGE_PROMPTS.md
API:   https://imgeditor.co/api  (Banana Studio)

Usage:
  python3 _research/gen_images.py charsheet     # just the character sheet (verify first)
  python3 _research/gen_images.py all           # everything not yet on disk
  python3 _research/gen_images.py L0 L1         # only those groups (L0/L1/L2/char)
  python3 _research/gen_images.py --force all   # regenerate even if file exists
  python3 _research/gen_images.py --only L1-40-goodhart L2-48  # regenerate just matching files
  python3 _research/gen_images.py --ref <https-url> --force all # use a hosted Serega portrait
                                                # (e.g. L0-03-whoami) as the character reference
                                                # for every Serega scene (mode=image). A/B-validated.
  python3 _research/gen_images.py --list        # print the job table and exit

Key is read from .env (IMAGE_GENERATION_API_KEY). Files land at their target paths
under Lectures/assets/img/. Consistency of Serega leans on a strong repeated text
description (mode=text), which these models follow more predictably than edit-mode.
"""
import os, sys, time, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG  = ROOT / "Lectures" / "assets" / "img"
BASE_URL = "https://imgeditor.co/api/v1"
MODEL = "nano-banana-pro"

def load_key():
    env = ROOT / ".env"
    for line in env.read_text().splitlines():
        line = line.strip()
        if line.startswith("IMAGE_GENERATION_API_KEY"):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("IMAGE_GENERATION_API_KEY not found in .env")

API_KEY = load_key()

import requests  # noqa: E402

PREAMBLE = (
    "Hand-drawn explanatory marker-doodle illustration (the look of a smart, brisk sketch on "
    "paper): thick confident black ink outlines, off-white #FBFAF6 paper background, FLAT colour "
    "fills using only black ink, course blue #2A6FDB, and warm orange #E8743B (no other colours). "
    "Charming, slightly crude, expressive minimal stick figures. Flat 2D only, no perspective, no "
    "shading, no gradients. Composition: clean, generous white space; figures fill 60–80% of the "
    "frame with at least 8–12% empty paper margin on every side; nothing touches the canvas edge; "
    "everything readable from the back of a lecture hall. Hand-lettered labels are HORIZONTAL "
    "ONLY — never tilted, never stacked letter-on-letter, never rotated; properly spaced; spelled "
    "exactly as named in the scene description below. Line weight is uniform across the image "
    "(no thin spidery passages mixed with thick brush passages). "
)
# Locked appearance so Serega never drifts between images. Repeat the cap colour
# 3× to dominate cross-attention; spell it three ways (deep-green, forest-green,
# #2F7D4F) to anchor whichever token the model latches onto.
SEREGA = (
    "The recurring character Serega is a round-headed stick figure with LONG BLACK wavy hair "
    "flowing to the shoulders, two simple dot eyes and a tiny smile, thin noodle arms and legs, "
    "and a plain COURSE-BLUE (#2A6FDB) tunic. CRITICAL HEADWEAR — read carefully: "
    "Serega wears a DEEP FOREST-GREEN (#2F7D4F) Tatar skullcap (called a 'tubeteika' or "
    "'tübetey'), shaped like a short flat-topped pillbox cap, sitting flat directly on top of "
    "the head (NEVER stacked on top of another hat/helmet/cap, NEVER perched over a second cap, "
    "NEVER worn alongside any other headwear — there is EXACTLY ONE skullcap on Serega and it is "
    "the green one), with a thin ochre/yellow geometric embroidered trim around the rim. The cap "
    "colour is GREEN — repeat: forest GREEN, not blue, not purple, not red, not patterned with "
    "blue. The cap is GREEN in EVERY single image, without exception, every time the character "
    "appears, in every pose, in every scene. Same character, same green cap, same hair, same "
    "tunic — identical across all illustrations in the course. "
)
# Appended to every prompt: kills baked-in text/titles and 3D/photoreal failure modes.
# Stricter than session 0: explicit cap-colour ban list, no header bars, no English style names.
ANTIPATTERN = (
    " STRICT NEGATIVE CONSTRAINTS — the image must NOT include any of the following, under any "
    "circumstances: the words 'Wait But Why', 'WBW', 'doodle', 'sketch', 'style', or ANY style "
    "name or genre label anywhere; a title card, banner header, top header bar, bottom caption "
    "strip, watermark, artist signature, copyright mark, page number, decorative frame or border "
    "around the whole image; ANY text, letters, numbers, words or labels EXCEPT the few short "
    "hand-lettered English labels explicitly named in the scene description above (one label per "
    "named subject, no extras invented); gibberish, scribbled pseudo-text, lorem-ipsum, or asemic "
    "writing anywhere; faux-handwritten squiggles standing in for text; glyph-like marks, "
    "sparkles-shaped-as-letters or pseudo-text INSIDE any burst, firework, explosion, starfield, "
    "speech-cloud or background flourish (bursts contain only short straight strokes — no curves "
    "that resemble letters); rotated/vertical/diagonal text — every label is horizontal; any "
    "second Serega (only one Serega per image, never a reflection or shadow-clone); the colour "
    "GREEN used ANYWHERE except Serega's own skullcap — every OTHER figure (creatures, a knight's "
    "mount, the trickster, the alien, bystanders) is BARE-HEADED and wears no green and no "
    "skullcap; when Serega is absent from the scene there is NO green in the image at all; any "
    "second hat, helmet, hood or cap stacked above/below the green skullcap (Serega wears EXACTLY "
    "ONE piece of headwear — the green tübetey — never two pieces of headwear at once); any "
    "gradient, drop shadow, glow, bloom, halo, ambient occlusion, 3D, isometric projection, "
    "perspective, photorealism, painterly oil/watercolour shading, cel shading, cross-hatching, "
    "stippling; cluttered or busy backgrounds (background must be plain off-white #FBFAF6); "
    "more than four labels in total in one image; thin spidery linework — keep lines thick, "
    "uniform, and confident. All hand-lettered labels must be SHORT real English words, spelled "
    "correctly, sans-serif marker style, horizontal, and ONLY the labels requested by the scene "
    "description — no decorative subtitles, no signatures, no captions. "
    "ADDITIONAL session-3 constraints — large empty letterbox rails are FORBIDDEN: the subject "
    "and its labels must together occupy at least 80% of the canvas width (do not centre a small "
    "drawing in a sea of empty paper). When the warm orange accent is used, it appears ONLY as "
    "thin strokes, small spot fills (≤15% of the canvas area), or short underlines — NEVER as a "
    "large solid fill behind text, NEVER filling the body/cloak/clothing of a major figure, NEVER "
    "as a background wash. Wraiths / shadows / hooded figures / villains are filled in solid "
    "BLACK INK only — pure shadow, not warm-coloured. Any banner motif requested in the scene is "
    "a SLIM RIBBON (≤12% of the canvas height) at top or bottom, never a thick rectangular "
    "header bar that competes with the main subject. Knights / dinosaurs / animals NEVER carry "
    "topic-name signboards, posters, placards, billboards, or banners spelling out the lecture "
    "topic — labels are short tag words floating beside the relevant element only."
)

# (group, filename, aspect, has_serega, scene)
JOBS = [
    # ---- course cover (banner + GitHub social card) ----
    ("char", "_char/cover.png", "16:9", True,
     "the course cover banner for a graduate course called 'Deep Learning for Search'. Wide "
     "horizontal composition with generous off-white space. CENTER-LEFT: Serega standing in "
     "expedition captain pose, one hand pointing forward, looking confident. CENTER-RIGHT: a "
     "small floating procession of the course's cast (in order, drawn at smaller scale) — a "
     "goofy orange-and-blue cartoon dinosaur (Tokenosaurus) with a sub-words basket; a tiny "
     "stick-figure knight on a small unit-sphere arc holding a protractor (Sir Cosine); a "
     "small grinning trickster figure on the far right tugging a tiny line-graph up with a "
     "fishing-hook. BACKGROUND: a faint dotted constellation of document icons, magnifying "
     "glasses, and tiny 1s and 0s, evoking a galaxy of information, drawn very lightly so the "
     "characters dominate. ONE hand-lettered short label exactly: 'DEEP LEARNING FOR SEARCH'. "
     "No other text anywhere. No subtitle, no date, no author, no Wait But Why label."),

    # ---- character ----
    ("char", "_char/serega-charsheet.png", "3:2", True,
     "a character reference sheet showing the SAME hero six times in a row on off-white paper: "
     "(1) neutral standing, (2) pointing a hand, (3) scratching his head looking puzzled, "
     "(4) running, (5) holding a sword and a torch in a Lord-of-the-Rings pose, (6) seated at a "
     "spaceship console in a sci-fi pose. In EVERY pose he wears the same embroidered Tatar "
     "skullcap and has the same long black wavy hair to the shoulders. Tiny hand-lettered label "
     "under each pose."),

    # ---- L0 · The Briefing ----
    ("L0", "L0/L0-01-briefing.png", "16:9", True,
     "Serega as an expedition captain seated at a spaceship console, one hand pointing forward "
     "through a circular viewport at a glowing search bar shaped like a hatch opening onto a vast "
     "galaxy of information made of tiny 1s, 0s and document icons. Hand-lettered label "
     "'mission: search' rendered ONLY on a small rectangular hand-drawn TAG/PLACARD floating "
     "beside the captain at the level of his torch — the tag has a thin ink rectangle around the "
     "two words. The words 'mission: search' do NOT appear inside the viewport circle, NOT on the "
     "search bar, NOT on the hatch, NOT on the console; the viewport interior contains ONLY the "
     "galaxy of 1s, 0s and document icons, no words. Only one occurrence of the label in total."),
    ("L0", "L0/L0-03-whoami.png", "1:1", True,
     "a small friendly cameo of Serega waving hello, his free hand on his chest, a tiny "
     "hand-lettered speech bubble saying 'I'm Serega'. Plain off-white background."),
    ("L0", "L0/L0-06-quote-trail.png", "16:9", True,
     "a winding dotted trail starting at Serega typing keywords into a box and ending at a glowing "
     "brain-shaped database; small hand-lettered signposts along the path read 'keywords', "
     "'meaning', 'vectors', 'RAG'."),
    ("L0", "L0/L0-08-coursearc.png", "16:9", True,
     "six connected boxes climbing left to right like stepping stones over water, Serega hopping "
     "between them; hand-lettered labels on the boxes: 'IR', 'embeddings', 'neural', 'vector DB', "
     "'RAG', 'agentic'."),
    ("L0", "L0/L0-20-sendoff.png", "16:9", True,
     "Captain Serega standing in an open spaceship hatch, a torch raised in a salute, sending off "
     "the crew as a galaxy of information glows ahead; a tiny hand-lettered banner reads "
     "'good luck out there'."),

    # ---- L1 · The Lost Record ----
    ("L1", "L1/L1-06-needle.png", "16:9", True,
     "Serega on a tiny raft in a vast ocean made of stacked papers and 1s and 0s, one glowing "
     "orange document floating just out of reach; hand-lettered label 'the one I need'."),
    ("L1", "L1/L1-08-lossy-need.png", "16:9", False,
     "a big fuzzy thought-cloud full of tiny details being squeezed through a narrow funnel into "
     "two boxy words, then fanning back out to a row of document icons; hand-lettered "
     "'need -> query -> docs'."),
    ("L1", "L1/L1-14-grounding.png", "16:9", False,
     "a confident robot at a podium declaring 'a horse has 8 legs!' beside a small embarrassed "
     "horse that clearly has 4 legs; a thin orange arrow points to a box labelled "
     "'grounding / retrieval' that fixes it."),
    ("L1", "L1/L1-22-leaky-bucket.png", "16:9", False,
     "a leaky bucket catching gold stars with two stars falling out through holes at the bottom; a "
     "little robot labelled 'reranker' reaches down but cannot grab the fallen stars; hand-lettered "
     "\"can't re-rank what you didn't retrieve\"."),
    ("L1", "L1/L1-24-lexical-gremlin.png", "16:9", False,
     "LEFT: a couch and a sofa separated by a tall brick wall whose every brick is ORANGE "
     "(warm #E8743B fill, ink mortar lines) labelled 'BM25', with a small mischievous gremlin "
     "(the Lexical Gremlin) smugly holding the wall in place. Floating ABOVE the wall, a cloud "
     "that is FILLED with SOLID COURSE-BLUE (#2A6FDB) inside the cloud body, with a thin black "
     "ink outline around it — the cloud is unmistakably BLUE, not orange, not stippled — "
     "labelled 'embeddings'. Two blue ink arrows from the cloud bridge over the orange brick "
     "wall so that the couch and the sofa hold hands across it. The colour separation must be "
     "obvious: WALL = orange brick, CLOUD = solid blue. "
     "RIGHT: a thought bubble 'jaguar' splitting into three arrows pointing to a cat, a car, and "
     "a laptop. Strict: only one cloud, only one wall, only the four labels 'BM25', 'embeddings', "
     "'jaguar', and the three target words 'cat', 'car', 'laptop'."),
    ("L1", "L1/L1-25-zipf-beach.png", "16:9", True,
     "a Zipf curve drawn as a beach: a few tall spiky sandcastles on the left labelled 'head', "
     "trailing into endless tiny footprints in the sand to the right labelled 'tail, never seen "
     "before'; Serega with a magnifying glass squints at the tail."),
    ("L1", "L1/L1-29-position-bias.png", "16:9", False,
     "a search results page with a heatmap 'golden triangle' glowing orange in the top-left corner; "
     "a circular arrow loop reads 'click #1 -> logs say #1 is best -> rank it #1 again'; "
     "hand-lettered 'click logs lie'."),
    ("L1", "L1/L1-32-not-a-system.png", "16:9", True,
     "a proud Serega holding up a tiny laptop showing 'accuracy 0.92', while behind him looms a "
     "huge tangled machine of pipes, gauges and wires labelled 'production'."),
    ("L1", "L1/L1-33-iceberg.png", "16:9", True,
     "an iceberg: a tiny tip above the waterline labelled 'ML code ~5%', a vast submerged body "
     "filled with small boxes labelled 'config', 'data collection', 'serving', 'monitoring', "
     "'feature extraction'; a tiny boat with Serega on top peering down."),
    ("L1", "L1/L1-40-goodhart.png", "16:9", False,
     "two diverging line graphs: a rising green line 'CTR' and a falling dotted red line "
     "'real satisfaction', with a grinning trickster (Goodhart the Trickster) yanking the CTR line "
     "up with a clickbait fishing-hook; hand-lettered 'when a measure becomes a target'."),
    ("L1", "L1/L1-43-flywheel.png", "16:9", False,
     "two side-by-side flywheels: a smooth wheel labelled 'virtuous: users -> logs -> model -> "
     "results', and a red wheel whose bias arrow thickens each lap, labelled 'rich get richer'."),
    ("L1", "L1/L1-56-found.png", "16:9", True,
     "Serega on the raft, finally holding up the one glowing orange document overhead in triumph, "
     "the ocean of bytes calm around him; hand-lettered 'found it.'"),

    # ---- L2 · First Contact + LOTR ----
    # SESSION-5 (BLOCKING): the first-contact alien must match the L2-70 callback's
    # rendering — same character at the start and end of the L2 arc. L2-70 (session 4)
    # locked the alien as ink-outline-only with three thin orange stripes; session-4
    # shipped L2-06 with the alien rendered as a heavy solid-orange body (continuity
    # break). This prompt mirrors L2-70's locked rendering verbatim so the two
    # scenes render the same creature. Stricter per the AGENDA's "make prompts
    # stricter each session" directive: an explicit "alien body fills ≥85% of
    # canvas width edge-to-edge alongside Serega" clause defeats the
    # session-5 SUBJECTSMALL horizontal-span detector, and the orange budget
    # is repeated three ways (≤8% of canvas area · only as three thin arm
    # stripes · no warm wash anywhere on the alien) so the cross-attention
    # locks on the constraint.
    ("L2", "L2/L2-06-first-contact.png", "16:9", True,
     "Serega (human) and a friendly many-legged alien meeting for the first time, facing each "
     "other. CRITICAL CONTINUITY — the alien must be rendered IDENTICALLY to the L2 closing-arc "
     "callback (L2-70): the alien's body is drawn as BLACK INK OUTLINE ONLY — its silhouette is a "
     "thin clean ink line and its interior is the off-white #FBFAF6 paper showing through (NO "
     "solid orange fill on the alien's body, NO warm-coloured skin, NO orange wash anywhere on "
     "the alien). The alien is a tall friendly many-limbed humanoid in pure linework. The ORANGE "
     "accent appears ONLY as three short thin stripes along ONE of the alien's outer arms "
     "(decorative band markings, ≤8% of canvas area total). Between Serega and the alien floats "
     "a fuzzy speech-cloud full of question-marks (hand-drawn '?' glyphs only — those question-"
     "marks are the only marks inside the cloud, no other letters or words). One single hand-"
     "lettered label below the scene reads 'no shared symbols.' — this is the ONLY hand-lettered "
     "label in the image (one label total). COMPOSITION: Serega and the alien together span ≥85% "
     "of the canvas width edge-to-edge with the speech-cloud bridging them; do NOT centre the "
     "pair in a thin band with empty rails on the left and right (the session-5 horizontal-span "
     "gate will flag wide rails). The alien stands on the RIGHT and Serega on the LEFT, mirroring "
     "L2-70 so the start-of-arc and end-of-arc shots compose the same way."),
    ("L2", "L2/L2-08-discreteness.png", "16:9", False,
     "LEFT a smooth grey gradient bar labelled 'interpolates'; RIGHT two word-boxes 'cat' and 'dog' "
     "with a question mark between them and a crossed-out blurry box labelled 'not a word'."),
    ("L2", "L2/L2-10-zipf.png", "16:9", False,
     "a steep hand-drawn 1/r bar chart: the first few bars labelled 'the', 'of', 'and' towering "
     "over a long flat tail labelled 'words seen once'."),
    ("L2", "L2/L2-20-tradeoff.png", "16:9", False,
     "the granularity tradeoff drawn as a small juggler with three balls labelled 'vocab', "
     "'seq len', and 'OOV'; the juggler can only keep two in the air comfortably while the third "
     "drops; arrows show that pushing 'vocab' down inflates 'seq len' and vice versa. Hand-lettered "
     "labels exactly: 'vocab', 'seq len', 'OOV'."),
    ("L2", "L2/L2-23-tokenosaurus.png", "16:9", True,
     "Tokenosaurus, a goofy friendly cartoon dinosaur, snipping a single word laid horizontally "
     "in its teeth into three chunks 'token', 'iza', 'tion'; the three chunk-pieces are tumbling "
     "down into a small wicker basket labelled 'sub-words' below; Serega watches from one side, "
     "delighted. No signs, no banners, no posters, no signboards, no held placards — the dinosaur "
     "is NOT holding any sign or display board; the ONLY hand-lettered labels in the entire image "
     "are the three falling chunks 'token', 'iza', 'tion' and the basket label 'sub-words' (four "
     "labels total, nothing else)."),
    ("L2", "L2/L2-37-digits.png", "16:9", True,
     "the number '327' being scissored two different ways ('3|27' and '327'), with a confused Serega "
     "trying to add two misaligned columns of digits; hand-lettered \"place values don't line up\"."),
    ("L2", "L2/L2-41-token-tax.png", "16:9", False,
     "a bar chart of little stacked token-coins per language: English a short stack, Hindi, Telugu "
     "and Turkish much taller stacks; a hand-lettered '$' sign rising with the bars; label "
     "'same sentence, bigger bill'."),
    ("L2", "L2/L2-42-glitch-token.png", "16:9", True,
     "a dense cloud of small labelled embedding dots and one lonely dot far off on its own labelled "
     "'SolidGoldMagikarp ???'; a glitchy Serega short-circuiting with little sparks."),
    ("L2", "L2/L2-49-query-angle.png", "16:9", False,
     "a 2D plane with one bold arrow labelled 'query' and several thin arrows labelled 'docs', a "
     "small hand-drawn angle wedge between the query and the nearest doc; label 'relevant = close'."),
    ("L2", "L2/L2-48-sir-cosine.png", "16:9", True,
     "Sir Cosine, which is Serega as a stick-figure knight: he wears his GREEN Tatar skullcap "
     "directly on his head as always (NO helmet, NO separate blue cap, NO second hat on top — just "
     "the green skullcap), holds a small protractor, and stands on a glowing orange unit-sphere "
     "arc, measuring the angle between two lance-vectors. The knight + sphere geometry fills the "
     "MAJORITY of the canvas (≥75% of frame height). At the very top of the canvas there is a "
     "thin, narrow banner ribbon reading 'Knights of the Unit Sphere' — the banner is short and "
     "occupies at most 10% of the total image height, never more; it is a slim ribbon, NOT a fat "
     "rectangle, NOT a header bar, NOT a poster strip."),
    ("L2", "L2/L2-56-cosine-vs-euclid.png", "16:9", False,
     "two arrows starting from a small origin dot, both running along the same ray at 45 degrees, "
     "a short one whose tip is labelled '(1,1)' and a longer one whose tip is labelled '(10,10)'. "
     "A small curly brace spans both arrows at the origin with a HORIZONTAL hand-lettered label "
     "above it reading 'cosine identical'. A dashed orange segment connects the two arrow-tips and "
     "carries a HORIZONTAL hand-lettered label beside it reading 'Euclidean far'. Composition note: "
     "the figure fills 80–90% of the frame width with only a small uniform margin on the left and "
     "right (no wide empty rails). All four labels are strictly horizontal — never tilted, never "
     "rotated, never along the diagonal of an arrow."),
    ("L2", "L2/L2-61-wraith.png", "16:9", True,
     "the Curse-of-Dimensionality Wraith stands on the LEFT half of the frame: a tall hooded "
     "Nazgûl-like cloaked figure whose entire cloak and hood are filled in SOLID BLACK INK "
     "(deep matte black, no orange anywhere on the cloak, no warm fill — the wraith is pure "
     "shadow), with the hood pulled forward so the face is just a black void; one skeletal ink "
     "hand reaches RIGHT to crush a wide bell-shaped histogram. The histogram occupies the RIGHT "
     "half of the frame: a clean bell-curve of bars being squeezed down by the wraith's hand into "
     "a single thin spike; the ORANGE accent appears ONLY as the fill of those histogram bars "
     "(the cloak stays black ink, the orange stays on the bell being crushed). Serega as a small "
     "knight stands in the foreground bracing against the wraith. The ONLY hand-lettered label is "
     "the short horizontal phrase 'all equidistant' beneath the spike."),
    ("L2", "L2/L2-62-concentration.png", "16:9", False,
     "four hand-drawn histograms side by side labelled 'd=2', 'd=10', 'd=100', 'd=1000', the spread "
     "collapsing from a wide hill to a thin spike; label 'everything is equidistant'."),
    ("L2", "L2/L2-63-hubness.png", "16:9", False,
     "a crowd of small stick figures all pointing at two popular figures wearing crowns labelled "
     "'hub', while most of the others are ignored; label 'a few points hog all the neighbours'."),
    ("L2", "L2/L2-64-anisotropy.png", "16:9", False,
     "LEFT a tight bundle of arrows squeezed into a thin cone labelled 'all look similar'; an arrow "
     "pointing RIGHT to a balanced even sphere of arrows labelled 'whitened'."),
    ("L2", "L2/L2-70-first-contact-callback.png", "16:9", True,
     "Serega and the friendly alien now shaking hands. CRITICAL: the alien's body is drawn as "
     "BLACK INK OUTLINE ONLY — its silhouette is a thin clean ink line and its interior is the "
     "off-white #FBFAF6 paper showing through (NO solid orange fill on the alien's body, NO "
     "warm-coloured skin, NO orange wash anywhere on the alien). The alien is a tall friendly "
     "many-limbed humanoid in pure linework. The ORANGE accent appears ONLY as three short thin "
     "stripes along one of the alien's outer arms (decorative band markings, ≤8% of canvas area "
     "total). Between Serega and the alien, the previous scene's question-mark speech-cloud is "
     "now replaced by a single shared glowing course-blue (#2A6FDB) vector arrow running from "
     "Serega to the alien. Hand-lettered label 'contact.' on a small tag below the handshake — "
     "only label in the image. COMPOSITION: Serega (LEFT) and the alien (RIGHT) together span "
     "≥85% of the canvas width edge-to-edge; do NOT centre the pair in a thin band with empty "
     "rails (session-5 horizontal-span gate)."),

    # ---- reserve cameos ----
    ("char", "_char/serega-cameo-point.png", "1:1", True,
     "a small Serega cameo pointing to the right with a neutral smile. Plain off-white background."),
    ("char", "_char/serega-cameo-puzzled.png", "1:1", True,
     "a small Serega cameo scratching his head, looking puzzled. Plain off-white background."),
]

H = {"Authorization": f"Bearer {API_KEY}"}

def build_prompt(has_serega, scene):
    return PREAMBLE + (SEREGA if has_serega else "") + scene + ANTIPATTERN

def generate_one(job, force=False, ref_url=None):
    group, fname, aspect, has_serega, scene = job
    out = IMG / fname
    if out.exists() and not force:
        print(f"  · skip (exists): {fname}")
        return ("skip", fname)
    out.parent.mkdir(parents=True, exist_ok=True)
    res = "1K" if aspect == "1:1" else "2K"
    # Reference-image mode: only for Serega scenes, and never for the charsheet/portrait
    # itself (it would be circular). A/B-validated: mode=image composes a NEW scene while
    # keeping the character. Requires ref_url to be a public https URL.
    use_ref = bool(ref_url) and has_serega and "charsheet" not in fname and "whoami" not in fname
    if use_ref:
        prompt = ("Use the supplied image ONLY as the character reference for Serega "
                  "(same face, same long black hair, same green Tatar skullcap, same blue tunic). "
                  "Draw a COMPLETELY NEW scene, do not copy the reference's pose or background: "
                  + build_prompt(has_serega, scene))
        body = {"prompt": prompt, "mode": "image", "image_url": ref_url, "model": MODEL,
                "aspect_ratio": aspect, "resolution": res, "num_images": 1, "output_format": "png"}
    else:
        prompt = build_prompt(has_serega, scene)
        body = {"prompt": prompt, "mode": "text", "model": MODEL,
                "aspect_ratio": aspect, "resolution": res,
                "num_images": 1, "output_format": "png"}
    try:
        r = requests.post(f"{BASE_URL}/images/generate", headers=H, json=body, timeout=60)
        j = r.json()
    except Exception as e:
        print(f"  ✗ {fname}: request error {e}")
        return ("error", fname)
    if r.status_code != 200 or not j.get("data", {}).get("task_id"):
        print(f"  ✗ {fname}: generate failed [{r.status_code}] {str(j)[:200]}")
        return ("error", fname)
    task_id = j["data"]["task_id"]
    # poll
    url = None
    for _ in range(120):  # up to ~6 min
        time.sleep(3)
        try:
            s = requests.get(f"{BASE_URL}/images/status", headers=H,
                             params={"task_id": task_id}, timeout=30).json()
        except Exception as e:
            print(f"    … poll retry ({e})")
            continue
        st = s.get("data", {}).get("status")
        if st == "completed":
            url = s["data"].get("image_url")
            break
        if st == "failed":
            print(f"  ✗ {fname}: generation failed {s['data'].get('error')}")
            return ("error", fname)
    if not url:
        print(f"  ✗ {fname}: timed out")
        return ("error", fname)
    try:
        dl = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=120)
        dl.raise_for_status()
        out.write_bytes(dl.content)
    except Exception as e:
        print(f"  ✗ {fname}: download error {e} (url={url})")
        return ("error", fname)
    kb = out.stat().st_size // 1024
    print(f"  ✓ {fname}  [{aspect} {res}, {kb} KB]")
    return ("ok", fname)

def main():
    args = [a for a in sys.argv[1:]]
    force = "--force" in args
    args = [a for a in args if a != "--force"]
    ref_url = None
    if "--ref" in args:
        idx = args.index("--ref"); ref_url = args[idx+1] if idx+1 < len(args) else None; del args[idx:idx+2]
    if "--list" in args:
        for g, f, a, s, _ in JOBS:
            print(f"  [{g}] {f}  {a}  serega={s}")
        print(f"\n  {len(JOBS)} jobs total")
        return
    if not args:
        print(__doc__); return
    only = None
    if "--only" in args:
        idx = args.index("--only"); only = [a for a in args[idx+1:]]; args = args[:idx]
    if only:
        jobs = [j for j in JOBS if any(s in j[1] for s in only)]
    elif args == ["all"]:
        jobs = JOBS
    elif args == ["charsheet"]:
        jobs = [j for j in JOBS if j[1].endswith("serega-charsheet.png")]
    else:
        groups = set(a if a != "char" else "char" for a in args)
        jobs = [j for j in JOBS if j[0] in groups]
    if not jobs:
        raise SystemExit(f"no jobs matched {args}")
    print(f"[gen] {len(jobs)} job(s) · model={MODEL}" + (f" · ref={ref_url[:50]}…" if ref_url else " · text-only"))
    counts = {"ok": 0, "skip": 0, "error": 0}
    errors = []
    for job in jobs:
        st, fname = generate_one(job, force=force, ref_url=ref_url)
        counts[st] += 1
        if st == "error":
            errors.append(fname)
    print(f"\n[gen] done: {counts['ok']} ok, {counts['skip']} skipped, {counts['error']} errors")
    if errors:
        print("  failed:", ", ".join(errors))
        sys.exit(1)

if __name__ == "__main__":
    main()
