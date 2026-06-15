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
    # ---- L3 · The Star Catalog (Classical IR + Rank Fusion) ----
    ("L3", "L3/L3-00-star-catalog.png", "16:9", True,
     "Serega the star-cartographer stands before a huge wall of tiny index cards that double as a "
     "star map; thin threads link little word-cards to clusters of stars, like a card catalogue laid "
     "over a night sky. He holds a quill, mid-plotting, delighted. Two accent colours only."),
    ("L3", "L3/L3-01-linear-scan-doom.png", "16:9", True,
     "a tiny Serega in a small rowboat paddling past an endless wall of identical stacked "
     "document-crates that stretch to the horizon, exhausted, checking each crate by hand, with a "
     "comic sweat-drop. Conveys that scanning every document is hopeless."),
    ("L3", "L3/L3-02-bm25-sextant.png", "4:3", True,
     "Serega squinting through a trusty brass sextant up at a few bright stars, ranking them by how "
     "bright each one looks; the sextant reads as an old reliable instrument. Warm-accent brass, blue stars."),
    ("L3", "L3/L3-04-lexical-gremlin-wall.png", "16:9", True,
     "the Lexical Gremlin, a small mischievous gremlin, wedges a brick wall between two "
     "identical-looking couches drawn on either side (a sofa shape on the left, a couch shape on the "
     "right, no words); Serega peeks over the wall looking puzzled. Keep the same gremlin design as earlier lectures."),

    # ---- L4 · The Proving Grounds (Ranking Metrics) ----
    ("L4", "L4/L4-00-proving-grounds.png", "16:9", True,
     "two little spaceships on a test-track arena; Serega in a referee cap holds up a blank "
     "scoreboard placard with no numbers, about to judge which ship's run was better. An arena of judgement."),
    ("L4", "L4/L4-01-cant-eyeball.png", "4:3", True,
     "Serega buried under a tall toppling stack of blank result-printouts, googly-eyed, trying and "
     "failing to eyeball which ranking is best. Conveys you cannot judge quality by eye at scale."),
    ("L4", "L4/L4-02-qrels-referee.png", "16:9", True,
     "Serega as a referee stamping documents with a big check mark or a big cross, sorting a pile into "
     "a relevant stack and a not-relevant stack. The act of making ground truth."),
    ("L4", "L4/L4-03-goodhart-trickster.png", "16:9", False,
     "Goodhart the Trickster, a grinning trickster, yanks a chart-line sharply upward with a "
     "fishing-rod clickbait hook, while a second true line stays flat and sad beside it. Conveys a "
     "measure that became a target and now lies. Keep the same trickster design as earlier lectures. "
     "No narrator figure in this one."),
    ("L4", "L4/L4-04-ndcg-ideal-vs-actual.png", "4:3", True,
     "two ladders side by side made of result-rungs; the left 'ideal' ladder has its biggest gems on "
     "the top rungs, the right 'actual' ladder has them scattered lower; Serega compares the two with "
     "a measuring tape. Conveys nDCG as actual versus ideal ordering."),

    # ---- L3 · The Star Catalog · DEEPENING (new art, L3-1N range) ----
    ("L3", "L3/L3-10-scan-vs-catalog.png", "16:9", True,
     "a split panel. LEFT: a tiny weary Serega with a torch drifting alone through an enormous "
     "black sky of a billion identical little stars, a hand-lettered tally '… checked 12 of "
     "1,000,000,000' trailing behind him — clearly hopeless. RIGHT: the same sky, but now a tidy "
     "wooden card-catalogue cabinet floats in space; Serega calmly pulls open one labelled drawer "
     "and a thin warm-orange beam shoots straight to the three stars he wanted. Big hand-lettered "
     "contrast 'scan everything?' versus 'look it up.' GREEN appears NOWHERE in the image except "
     "Serega's own skullcap — every star, every drawer, the torch, the beam are black ink + "
     "warm-orange only, no green anywhere else. No lettered title bar."),
    ("L3", "L3/L3-11-inverted-index-cards.png", "16:9", True,
     "the inverted index as a wall of constellation catalogue cards: a tall library wall of small "
     "index cards, each card a hand-lettered word at the top ('nova', 'binary', 'comet') and below "
     "it a little list of star-chart thumbnails the word points to (tiny sketched constellations "
     "with chart-numbers). Warm-orange string runs from each word-card to its charts like a "
     "detective board. Serega on a small ladder files one new card. Hand-lettered banner doodle "
     "'word -> list of star-charts'. GREEN appears NOWHERE except Serega's own skullcap — the "
     "cards, string, and charts are black ink + warm-orange only, no green anywhere else. No "
     "lettered title bar."),
    ("L3", "L3/L3-12-postings-compression.png", "16:9", True,
     "a long star-map scroll being folded and compressed like an accordion: the unfolded LEFT half "
     "shows star IDs strung out with big empty space between them ('7 … 12 … 13 … 99'); a "
     "warm-orange arrow and a hand crank push them through a little press so the RIGHT half stores "
     "only the gaps between neighbouring stars ('+7 +5 +1 +86'), the scroll now squeezed to a "
     "fraction of the width. Hand-lettered 'store the gaps, not the stars'. Serega turning the "
     "press crank, tiny satisfied smile. GREEN appears NOWHERE except Serega's own skullcap — the "
     "scroll, press, and numbers are black ink + warm-orange only, no green anywhere else. Tight, "
     "tidy, whiteboard feel. No lettered title bar."),
    ("L3", "L3/L3-13-bm25-saga.png", "16:9", True,
     "THE BM25 SAGA — engineering refined over generations. A left-to-right timeline of navigation "
     "instruments getting more refined each era, like an evolution chart, each on its own little "
     "pedestal with a short hand-lettered label: (1) a crude knotted rope and stick ('count "
     "words'), (2) a simple plumb-bob ('TF-IDF'), (3) a wooden quadrant, (4) a polished brass "
     "sextant glowing warm-orange ('BM25'), (5) a finely-engraved sextant with extra dials and "
     "tuning screws ('BM25 tuned'). Serega, a little older and greyer-haired at each station, "
     "lovingly tunes and upgrades the same instrument down the line — a workshop of refinement "
     "across decades. Hand-lettered arc 'refined, generation after generation'. Saturated "
     "brass/orange plus course blue. GREEN appears NOWHERE except Serega's own skullcap — the "
     "instruments and pedestals are black ink + warm-orange + blue only, no green anywhere else. "
     "This is the lecture centerpiece — make it evocative and proud. No lettered title bar."),
    ("L3", "L3/L3-14-pagerank-stars-voting.png", "16:9", True,
     "PageRank as a web of stars voting for each other. A constellation of stars connected by "
     "directed warm-orange arrows (link-votes) — each arrow is a little ballot flying from one "
     "star toward another. Most stars are small and dim; arrows pile onto ONE central authority "
     "star that glows the brightest (thicker outline, radiating doodle sparkle-lines, a tiny "
     "hand-lettered crown). A couple of popular stars also pass their vote-weight onward along fat "
     "arrows. Serega floats to the side with a clipboard tallying votes. Hand-lettered 'links = "
     "votes; authority glows'. The bright authority star is WARM-ORANGE, never green. GREEN "
     "appears NOWHERE except Serega's own skullcap — all stars and arrows are black ink + "
     "warm-orange only, no green anywhere else. No lettered title bar."),
    ("L3", "L3/L3-15-fusion-navigators-council.png", "16:9", True,
     "rank fusion as a council of navigators merging their star-charts. A round table in a ship's "
     "chart-room; three or four navigator stick-figures each lay down their own ranked star-chart "
     "(numbered lists '1,2,3' beside little constellations) — the charts disagree. Warm-orange "
     "arrows sweep all the charts into a central fused master-chart that one figure holds up. "
     "Serega chairs the council, a compass in hand. Hand-lettered 'many charts -> one ranking'. "
     "Keep the disagreement visible (different orderings), then the harmony of the merged chart. "
     "GREEN appears NOWHERE except Serega's own skullcap — the other navigators are bare-headed, "
     "and the table, charts and arrows are black ink + warm-orange + blue only, no green anywhere "
     "else. No lettered title bar."),
    ("L3", "L3/L3-16-bag-of-words.png", "16:9", True,
     "the Bag-of-Words / vector-space idea drawn literally. CENTER-LEFT: Serega tips a single "
     "document page upside-down into a literal cloth drawstring BAG (a plain sack), and the words "
     "tumble OUT of the page and fall into the bag as loose little word-scraps — their original "
     "left-to-right order clearly lost, scrambled and jumbled inside the sack (a couple of scraps "
     "spill mid-air, e.g. 'star', 'orbit', 'star', 'the'). CENTER-RIGHT, beside the bag: Serega has "
     "tallied the word COUNTS onto small paper tickets and stacked them into a tall numeric COLUMN "
     "VECTOR — a narrow vertical bracketed column of word:count rows ('star 2', 'orbit 1', 'the 4', "
     "'…') reading like a numeric vector. A warm-orange arrow runs from the bag to the column. One "
     "hand-lettered doodle label reads 'order out -> counts in'. Conveys 'a document becomes a "
     "vector of word counts'. GREEN appears NOWHERE in the image except Serega's own skullcap — the "
     "page, bag, word-scraps, tickets and column vector are black ink + warm-orange only, no green "
     "anywhere else. No lettered title bar; the ONLY hand-lettered marks are the few short word "
     "tally words, the tiny counts, and the one doodle label named."),
    ("L3", "L3/L3-17-reweight.png", "16:9", True,
     "the TF-IDF re-weighting idea drawn as a two-pan balance SCALE. On the LEFT pan sits the common "
     "word 'the' drawn TINY and squashed flat / pressed down low — cheap and worthless, weighed "
     "down to the bottom. On the RIGHT pan sits the rare word 'orbit' drawn BIG and bold and lifted "
     "HIGH, glowing warm-orange like a precious nugget of gold. Serega stands at the scale's pivot "
     "adjusting it, nudging the beam so the rare word rises. A thin warm-orange up-arrow lifts "
     "'orbit' and a small down-arrow pushes 'the' down. One hand-lettered doodle label reads "
     "'common -> cheap, rare -> gold'. Conveys 'weight terms by how rare they are'. GREEN appears "
     "NOWHERE in the image except Serega's own skullcap — the scale, both words, pans and arrows "
     "are black ink + warm-orange only, no green anywhere else. No lettered title bar; the ONLY "
     "hand-lettered marks are the two words 'the' and 'orbit' and the one doodle label named."),

    # ---- L4 · The Proving Grounds · DEEPENING (new art, L4-1N range) ----
    ("L4", "L4/L4-10-significance-dice.png", "16:9", True,
     "'the dice of chance' — is the difference real? Serega stands between two scoreboards showing "
     "two search systems with almost-equal scores ('0.612' versus '0.628'), scratching his head. "
     "In one hand he holds a pair of tumbling dice, in the other a spinning coin — asking whether "
     "the gap is skill or just luck. A faint warm-orange bell-curve arcs behind the two scores "
     "with a tiny shaded tail; a hand-lettered 'real… or random?' speech doodle. The mood: a "
     "referee unsure whether to call a winner. Keep numbers as illustrative doodle text only, not "
     "a real table. GREEN appears NOWHERE except Serega's own skullcap — the dice, coin, "
     "scoreboards and bell-curve are black ink + warm-orange only, no green anywhere else. No "
     "lettered title bar."),
    ("L4", "L4/L4-11-ab-parallel-universes.png", "16:9", True,
     "an A/B test as two parallel universes of users. The frame splits into two side-by-side "
     "bubble-worlds (two soap-bubble universes) divided by a wavy warm-orange seam: UNIVERSE A's "
     "crowd of little stick-users all see search ship A, UNIVERSE B's identical crowd sees ship B. "
     "A tiny dotted line randomly sorts incoming users into each bubble at the top. Below, two "
     "little tally-meters compare 'clicks' per universe. Serega stands on the seam between worlds, "
     "one foot in each, comparing. Hand-lettered 'same users, split in two — which world is "
     "better?'. GREEN appears NOWHERE except Serega's own skullcap — the bubbles, users, ships, "
     "seam and meters are black ink + course-blue + warm-orange only, no green anywhere else. No "
     "lettered title bar."),

    # ---- L5 · The Map of Meaning (Word Embeddings + Dimensionality Reduction) ----
    # NOTE on the gate: image-gate.mjs only tags char/L0/L1/L2 jobs as has_serega for the
    # green-leak check, so L5 images are treated as NON-Serega by the palette gate. That is
    # FINE as long as Serega's green tübetey stays a small element (<2% of canvas, like every
    # existing L3/L4 Serega plate measures 0.6–1.2%) and NO other green appears anywhere.
    # Every L5 plate therefore: (a) uses ONLY black ink + course-blue + warm-orange on
    # off-white (no reds/purples/greens except Serega's small cap); (b) bakes in ZERO
    # hand-lettered text/labels/numbers — the deck overlays its own labels, so these plates
    # are wordless (defeats the OCR baked-text class and the analogy-needs-no-baked-labels
    # requirement). Each scene below ends with an explicit "no words/letters/numbers anywhere"
    # clause on top of the shared ANTIPATTERN.
    ("L5", "L5/L5-00-map-of-meaning.png", "16:9", True,
     "HERO ESTABLISHING SHOT — the Map of Meaning. A vast hand-drawn star-map / celestial atlas "
     "fills the frame, but instead of stars the constellations are little WORD-PLACES: small "
     "labelled-looking map markers, tiny town/island/landmark doodle icons (a little flag, a small "
     "house, a dot-with-a-ring) scattered across the chart and joined by thin ink constellation "
     "lines into neighbourhoods, so the whole map reads as 'words are places, related words sit "
     "near each other'. Faint dotted latitude/longitude grid lines arc across the parchment. "
     "Serega the cartographer stands at the LEFT edge before this great map, one hand raised with a "
     "quill, charting it — proud and absorbed, mid-discovery. Warm-orange is used ONLY as thin "
     "accent strokes on a few key constellation lines and one glowing landmark; everything else is "
     "black ink on off-white parchment. The map and Serega together fill ≥85% of the canvas width "
     "edge-to-edge. ABSOLUTELY NO words, letters, numbers, place-names, or hand-lettered labels "
     "anywhere in the image — the markers and icons are wordless pictographs only (no text inside "
     "them, no caption, no title); the deck will add labels later. This is the lecture centerpiece "
     "— make it evocative and atlas-like."),
    ("L5", "L5/L5-02-words-to-coordinates.png", "16:9", True,
     "a single WORD-SCRAP (a small blank rectangular paper tag — NO text on it, just an empty "
     "ink-outlined card) is dropping from above through the air and landing exactly onto a clean "
     "2-D coordinate grid drawn on the off-white paper, where it lands it becomes a single bold "
     "ink DOT (a plotted point) sitting at a grid intersection. Show the motion: the blank card up "
     "high, a dotted fall-line, and the resolved warm-orange point on the grid below, so the idea "
     "'a word turns into coordinates / a point in space' is unmistakable. A couple of other points "
     "already sit on the grid nearby. The grid has plain ink axes (two perpendicular lines, small "
     "tick marks, NO numbers on the ticks). Serega stands to the RIGHT watching the word land on "
     "the grid, gesturing at the new point, delighted. Warm-orange appears ONLY as the resolved "
     "landing point and the thin fall-line. The grid + card + Serega fill ≥85% of canvas width. "
     "ABSOLUTELY NO words, letters, numbers or labels anywhere — the card is blank, the axes are "
     "unlabelled, no caption, no title; the deck adds labels later."),
    ("L5", "L5/L5-05-analogy-arrows.png", "16:9", False,
     "the famous word-analogy PARALLELOGRAM drawn purely as geometry on the Map of Meaning, with "
     "NO text labels at all (the deck overlays the words king/queen/man/woman itself). Four small "
     "ink dots (map-points) arranged as the corners of a parallelogram on a faint dotted map-grid. "
     "Two THICK warm-orange arrows run perfectly PARALLEL to each other, same length and same "
     "direction: the lower arrow points from the bottom-left point to the bottom-right point, and "
     "the upper arrow points from the top-left point to the top-right point — clearly the SAME "
     "displacement vector copied to two places, so 'the analogy is a direction on the map' reads "
     "instantly. Thin ink dashed lines complete the parallelogram's other two sides. Each of the "
     "four corner dots is a small plain ink dot (a couple may have a tiny wordless map-marker "
     "icon beside them, never a word). Composition fills 80–90% of the frame width, small uniform "
     "margins, the two parallel orange arrows are the visual hero. NO Serega in this scene, so NO "
     "green anywhere. ABSOLUTELY NO words, letters, numbers, or hand-lettered labels anywhere — "
     "the four points are unlabelled; the deck adds king/queen/man/woman afterwards."),
    ("L5", "L5/L5-08-cartographer.png", "16:9", False,
     "introduce a NEW friendly creature: THE CARTOGRAPHER — a kindly mapmaker character (a "
     "stick-figure in a long plain ink-outline mapmaker's apron, round head, two dot eyes, small "
     "smile, BARE-HEADED with no hat and absolutely no green) whose ONE job and ONE clear visual "
     "TELL is FOLDING a vast star-map down small enough to carry. Draw it as one unmistakable "
     "action: an enormous unfolded star-map (covered in tiny wordless constellation dots and thin "
     "ink lines) is being CREASED and folded along sharp accordion fold-lines by the Cartographer's "
     "hands, collapsing from a huge sheet on the LEFT down to a small neat folded map-square the "
     "Cartographer tucks under one arm on the RIGHT — conveying 'fold the high-dimensional map down "
     "to something carryable' (dimensionality reduction). Show the crisp diagonal crease-lines and "
     "a couple of fold-arrows (thin warm-orange) indicating the folding motion. Warm-orange appears "
     "ONLY as the thin fold/crease motion arrows and one accent constellation line; the rest is "
     "black ink on off-white. The Cartographer + map fill ≥85% of canvas width. NO Serega in this "
     "scene, so NO green anywhere at all. ABSOLUTELY NO words, letters, numbers, or labels anywhere "
     "— the map markers are wordless, no caption, no name-tag, no title; the deck names the "
     "creature later. Make the folding 'tell' the single dominant idea of the image."),
    ("L5", "L5/L5-10-folded-map-manifold.png", "16:9", False,
     "a curved / gently folded MAP SURFACE drawn as a flowing rolling sheet (like a wavy banner or "
     "a draped piece of parchment seen in soft 2-D — NO 3-D shading, just clean ink contour lines "
     "suggesting the curve), with small word-place dots scattered across it. The key idea: even as "
     "the sheet curves and folds, NEIGHBOURING dots stay neighbours — short ink links connect each "
     "dot to its nearest neighbours and those local clusters stay intact along the bends of the "
     "surface. Draw two or three little local clusters of dots, each cluster ringed by a thin ink "
     "loop, riding over the curves of the folded sheet so the eye reads 'local neighbourhoods are "
     "preserved on a curved manifold' (t-SNE / UMAP intuition). Warm-orange appears ONLY as the "
     "thin neighbour-link strokes inside the clusters; the draped sheet and its contour lines are "
     "black ink on off-white. The surface fills ≥85% of canvas width. NO Serega in this scene, so "
     "NO green anywhere. ABSOLUTELY NO words, letters, numbers, or labels anywhere — the dots are "
     "unlabelled, no caption, no title."),
    ("L5", "L5/L5-12-tsne-mirage.png", "16:9", False,
     "a DECEPTIVE map — a caveat plate about being fooled. Draw a hand-drawn treasure-map-style "
     "chart where the DISTANCES MISLEAD: two clusters of dots that look far apart on the paper are "
     "secretly linked by a hidden short-cut (a thin ink tunnel / a dotted wormhole line) showing "
     "they are actually close, while two dots drawn right next to each other are in fact separated "
     "by a little crevasse / a torn gap in the map showing they are actually far. Add one classic "
     "'mirage' cue: a wavy heat-shimmer ripple over part of the map and a small warm-orange "
     "warning-triangle hazard mark (a plain triangle outline with an exclamation-stroke inside it, "
     "NO letters) floating over the misleading region, so the plate reads 'this map LIES about "
     "distance — do not over-read it'. Warm-orange appears ONLY as the small hazard triangle and "
     "one mirage ripple stroke; everything else is black ink on off-white. The map fills ≥85% of "
     "canvas width. NO Serega in this scene, so NO green anywhere. ABSOLUTELY NO words, letters, "
     "numbers, or labels anywhere — the hazard triangle holds only an exclamation stroke (no "
     "letter), no caption, no title."),
    ("L5", "L5/L5-14-map-drawn.png", "16:9", True,
     "PAYOFF — the finished Map of Meaning, fully drawn at last, with Sir Cosine riding triumphantly "
     "ACROSS it. Sir Cosine is Serega-as-a-stick-figure-knight: he wears his GREEN Tatar skullcap "
     "directly on his head as always (NO helmet, NO second hat, just the small green skullcap), a "
     "plain course-blue tunic, long black wavy hair, and he rides across the great chart holding a "
     "lance or a banner-pole aloft in victory. Beneath and around him spreads the COMPLETED Map of "
     "Meaning: a rich star-atlas of word-place neighbourhoods — clusters of small wordless map "
     "markers and town/island icons joined by thin ink constellation lines into tidy related "
     "regions, faint dotted grid arcs, a couple of constellation lines glowing warm-orange as the "
     "route he rides along. The map looks DONE and harmonious (contrast with the earlier "
     "in-progress charting). The map + knight fill ≥85% of canvas width edge-to-edge. Serega's "
     "green skullcap is the ONLY green in the image and it is small (a cap, not a fill). Warm-orange "
     "appears ONLY as a few accent constellation lines / the route. ABSOLUTELY NO words, letters, "
     "numbers, place-names, or hand-lettered labels anywhere — the markers are wordless pictographs, "
     "no caption, no banner text, no title; the deck adds labels later. Make it feel like a "
     "victory-lap callback to Sir Cosine from L2."),

    # ---- L5 · The Map of Meaning · DEEPENING (A+ visual remediation, L5-0N range) ----
    # Same gate posture as the L5 block above: image-gate treats L5 as NON-Serega, so each plate
    # uses ONLY black ink + course-blue + warm-orange on off-white, keeps Serega's green cap tiny
    # (<2% canvas) when present, and bakes in ZERO words/letters/numbers (the book overlays labels).
    # These three break the bald text-wall runs the A+ audit flagged: climb-word2vec (flagship,
    # had no figure), turn-word2vec-family (dense, back-to-back wall), stakes-too-many-dims.
    ("L5", "L5/L5-03-word2vec-window.png", "16:9", True,
     "SKIP-GRAM as a sliding window predicting neighbours — purely visual, wordless. A horizontal "
     "row of identical small blank word-tiles (plain ink-outlined rectangles, NO text on any of "
     "them) runs left to right like a sentence strip. Over the MIDDLE tile sits a bold "
     "rounded-rectangle WINDOW FRAME (a clear viewfinder bracket) highlighting one CENTRE tile, "
     "drawn thicker / emphasised so it reads as the focus. From that centre tile, a fan of thin "
     "warm-orange PREDICTION ARROWS shoots OUTWARD to the two neighbour tiles on each side (left "
     "two, right two) — the centre word reaching out to guess its neighbours. The tiles just "
     "outside the window are dimmer/fainter so the window's reach is obvious. To convey the "
     "SLIDING, show a faint ghosted second copy of the window frame shifted one tile to the right "
     "with a small course-blue motion-arrow under the strip indicating the window slides along. "
     "Serega stands to the RIGHT, one hand nudging the window along the strip, delighted, his small "
     "green skullcap the ONLY green in the image. The strip + window + arrows fill ≥85% of canvas "
     "width. Warm-orange appears ONLY as the prediction arrows; the tiles, window frame and motion "
     "cue are black ink + light course-blue on off-white. ABSOLUTELY NO words, letters, numbers, "
     "or labels anywhere — every tile is blank, no caption, no title; the book adds words later. "
     "Keep it clean and diagrammatic so 'centre word predicts its neighbours, window slides' reads "
     "instantly."),
    ("L5", "L5/L5-04-word2vec-family.png", "16:9", False,
     "THE WORD2VEC FAMILY TREE drawn as a literal little hand-drawn tree / branching diagram, "
     "wordless. From one common ROOT node at the bottom (a single bold ink dot, the shared "
     "distributional idea) a trunk rises and splits into branches, each branch ending in a small "
     "distinct PICTOGRAPH node so the family reads as one idea seen many ways: (1) a left branch "
     "to a node showing a centre-out FAN of arrows (skip-gram: one tile reaching out to several); "
     "(2) a right branch to a node showing the MIRROR — several arrows pointing INWARD to one tile "
     "(CBOW: context predicting the centre); (3) a branch to a node showing a single word-tile "
     "broken into smaller sub-piece chips (fastText: word as a sum of character-chunk pieces); "
     "(4) a branch to a node showing a small grid/matrix being squeezed by an arrow into a thin "
     "stack of dots (the SVD / matrix-factorization cousin). The two top branches (skip-gram and "
     "CBOW) are drawn as clear mirror-images of each other to show 'same arrow, two directions'. "
     "Thin warm-orange appears ONLY on the branch lines that connect the root to its children; the "
     "nodes and pictographs are black ink + light course-blue on off-white. The tree fills ≥85% of "
     "canvas width. NO Serega in this scene, so NO green anywhere. ABSOLUTELY NO words, letters, "
     "numbers, or labels anywhere — every node is a wordless pictograph, no caption, no title; the "
     "book names skip-gram / CBOW / fastText / SVD later. Keep it tidy and balanced like a small "
     "genealogy chart."),
    ("L5", "L5/L5-06-too-many-dims.png", "16:9", True,
     "THE DIMENSIONALITY SQUEEZE — folding a fat high-dimensional vector down to two, wordless. "
     "On the LEFT, a very TALL narrow bracketed COLUMN VECTOR: a slim vertical stack of MANY small "
     "ink dots/cells running far up and down the frame (clearly hundreds of stacked cells — too "
     "many to count, overwhelming), drawn with plain ink, NO numbers inside the cells. A "
     "warm-orange FUNNEL / press in the centre squeezes that towering column down: thin "
     "warm-orange motion-arrows show the long stack being compressed through the narrow neck. On "
     "the RIGHT, what comes out the bottom of the funnel is a TINY result: just TWO bold dots "
     "plotted on a small clean 2-axis grid (two perpendicular ink axes with a couple of tick "
     "marks, NO numbers), so the eye reads 'hundreds of dimensions folded down to two you can "
     "see'. Serega stands at the RIGHT beside the little 2-D grid, gesturing at the two surviving "
     "dots, his small green skullcap the ONLY green in the image. Warm-orange appears ONLY as the "
     "funnel and the squeeze-arrows; the tall column, the grid and the two result dots are black "
     "ink + light course-blue on off-white. The column + funnel + grid fill ≥85% of canvas width. "
     "ABSOLUTELY NO words, letters, numbers, or labels anywhere — the cells and axes are unlabelled, "
     "no caption, no title; the book adds '300 -> 2' later. Make the contrast between the towering "
     "stack and the tiny two-dot result the single dominant idea."),

    # ---- L6 · The Council of Attention (Contextual embeddings · Transformers/Attention · Contrastive) ----
    # NOTE on the gate (same as L5): image-gate.mjs only tags char/L0/L1/L2 jobs as has_serega for
    # the green-leak check, so L6 images are treated as NON-Serega by the palette gate. That is FINE
    # as long as Serega's / Sir-Cosine's green tübetey stays a small element (<2% of canvas, like
    # every existing Serega plate measures 0.6–1.2%) and NO other green appears anywhere. Every L6
    # plate therefore: (a) uses ONLY black ink + course-blue + warm-orange on off-white (no
    # reds/purples/greens except the small cap on Serega/Sir-Cosine when present); (b) bakes in ZERO
    # hand-lettered text/labels/numbers — the deck overlays its own labels, so these plates are
    # wordless. CRUCIAL: the payoff plate's caged Lexical Gremlin must match the L1/L3 Gremlin —
    # small mischievous gremlin, pointy bat-like ears, wild spiky BLUE hair, blue body, big toothy
    # grin, thin noodle limbs (verbatim spec repeated in that scene).
    ("L6", "L6/L6-00-council-of-attention.png", "16:9", True,
     "HERO ESTABLISHING SHOT — the Council of Attention. A big round council table seen from a "
     "gentle top-down-ish flat angle, ringed by 6–8 simple seated councillor stick-figures, where "
     "EACH councillor is a TOKEN (a word-seat). The single unmistakable TELL: every figure LEANS / "
     "turns its head and body TOWARD whichever other councillor it is heeding — some lean hard "
     "across the table toward one neighbour, some only tilt slightly, so the eye reads 'attention is "
     "listening: each token leans toward whom it heeds'. Draw a few thin ink lean-lines / gaze-lines "
     "between the leaning figures, a couple of them traced in warm-orange to mark the strongest "
     "heeding. Serega the cartographer-chairman stands at the LEFT edge of the table, one hand "
     "raised, presiding over the council — proud and absorbed. The councillors are bare-headed "
     "(no green on them). The table + figures fill ≥85% of the canvas width edge-to-edge. "
     "Warm-orange appears ONLY as a few accent lean-lines; everything else is black ink + "
     "course-blue on off-white. Serega's small green skullcap is the ONLY green in the image. "
     "ABSOLUTELY NO words, letters, numbers, or hand-lettered labels anywhere — the seats are "
     "wordless, no caption, no title; the deck adds labels later. This is the lecture centerpiece — "
     "make it evocative, like a round-table council of listeners."),
    ("L6", "L6/L6-01-bank-two-meanings.png", "16:9", False,
     "ONE WORD, TWO WORLDS — the polysemy problem, drawn as a single word-card split down the "
     "middle. CENTER: one blank word-card / placard (NO text on it, just a plain ink-outlined "
     "rectangle) sitting on a vertical dividing seam that splits the whole frame into two contrasting "
     "little scenes. LEFT WORLD: a peaceful RIVER-BANK — a curving river with a grassy sloping shore, "
     "reeds, a little fish, drawn in black ink with course-blue water. RIGHT WORLD: a MONEY-BANK — a "
     "small classical bank building with columns, a coin stack and a dollar-bag with a warm-orange "
     "coin accent. A thin ink crack / lightning-bolt seam runs down between the two worlds straight "
     "through the single shared word-card, so it reads 'the SAME one word is torn between two "
     "unrelated meanings — one static vector can't be in two minds'. The split scene fills ≥85% of "
     "canvas width. NO Serega in this scene, so NO green anywhere at all (the riverbank grass is "
     "drawn in plain black ink hatching or course-blue, NOT green). ABSOLUTELY NO words, letters, "
     "numbers, or labels anywhere — the central card is BLANK, no caption, no title; the deck adds "
     "the word 'bank' later. Keep the two worlds clearly different so the polysemy reads instantly."),
    ("L6", "L6/L6-04-attention-weights.png", "16:9", False,
     "ATTENTION WEIGHTS as beams of different thickness — purely visual, no math. ONE central token "
     "(a bold ink dot / small circle, the 'query' token) sits left-of-centre, and from it a fan of "
     "BEAMS / threads reaches out to several neighbouring tokens (other small ink dots scattered "
     "around it). The single clear TELL: the beams have VERY DIFFERENT THICKNESSES — one or two are "
     "FAT bold warm-orange ribbons (strong attention), some are medium ink lines, and several are "
     "thin faint hairlines (weak attention), so the eye reads 'this token pays a lot of attention to "
     "a few neighbours and a little to the rest'. The thickest warm-orange beam clearly dominates "
     "and points to the most-heeded neighbour. Keep it clean and diagrammatic — just the central "
     "token, the neighbour dots, and the graded beams. The beam-fan fills ≥85% of canvas width. "
     "NO Serega in this scene, so NO green anywhere. Warm-orange appears ONLY as the one or two "
     "thickest dominant beams; the rest are black ink on off-white. ABSOLUTELY NO words, letters, "
     "numbers, or labels anywhere — the dots are unlabelled, no caption, no title."),
    ("L6", "L6/L6-07-positional-order.png", "16:9", False,
     "POSITIONAL ENCODING — giving tokens their order. A horizontal row of identical small "
     "word-tokens (plain blank ink-outlined tiles, NO text on them) sits along a flowing SINUSOID "
     "RIBBON — a clean hand-drawn sine wave (alternating sin/cos curves) that undulates left to "
     "right beneath the row, drawn in course-blue, threading through the tokens like a wave giving "
     "them their place in line. Below each token, a small ORDER-STAMP marks its position as a "
     "wordless pictograph: token 1 has one dot, token 2 has two dots, token 3 has three dots, and so "
     "on (counting pips, NOT digits), so the row reads 'each token gets a position-stamp from the "
     "wave'. To underline that ORDER MATTERS, show the same handful of token-tiles in two stacked "
     "rows whose tiles sit in a DIFFERENT left-to-right arrangement (a small swap), making clear "
     "'reordering changes everything' — the dog-bites-man vs man-bites-dog idea, purely with the "
     "tiles' positions, no words. Warm-orange appears ONLY as a thin accent on the swap-arrow / the "
     "crest of one wave. The wave + tokens fill ≥85% of canvas width. NO Serega, so NO green "
     "anywhere. ABSOLUTELY NO words, letters, numbers (the position-stamps are DOTS not digits), or "
     "labels anywhere — the tiles are blank, no caption, no title; the deck adds words later."),
    ("L6", "L6/L6-09-transformer-block.png", "16:9", False,
     "THE TRANSFORMER BLOCK as an engine — a machine/engine block assembled from stacked stages, "
     "wordless. Draw a tall mechanical ENGINE built as a vertical stack of clean rectangular "
     "machine-stages bolted on top of one another (like the cross-section of a layered engine or a "
     "stacked factory machine): from bottom to top, a few distinct stacked boxes connected by pipes "
     "and a couple of curving RETURN PIPES looping around the outside of the stack (suggesting "
     "residual/skip connections) and small gear / bolt details, so it reads as one repeating "
     "powerful engine-unit. A thin warm-orange flow-arrow runs UP through the centre of the stack "
     "showing tokens flowing through the engine. To suggest depth, show the same block faintly "
     "REPEATED / echoed behind it (×N stacking), receding slightly. Keep it crisp, mechanical, and "
     "diagrammatic — an engine, not a creature. The engine fills ≥85% of canvas width/height. "
     "NO Serega in this scene, so NO green anywhere. Warm-orange appears ONLY as the thin central "
     "flow-arrow and one or two accent pipes; the machine body is black ink on off-white with light "
     "course-blue accents. ABSOLUTELY NO words, letters, numbers, gauge-readings, or labels anywhere "
     "— the stages are wordless, no caption, no title; the deck labels the stages later."),
    ("L6", "L6/L6-12-contrastive-pull-push.png", "16:9", False,
     "CONTRASTIVE LEARNING as magnets — pull synonyms together, push impostors apart, drawn on a "
     "faint dotted embedding-grid. LEFT/CENTER: TWO small word-dots that are SYNONYMS are drawn as "
     "two magnets snapping TOGETHER — a short fat warm-orange ATTRACTION arrow pulls them into one "
     "tight pair, almost touching, with little motion-lines showing them rushing together. "
     "RIGHT/AROUND: one or two IMPOSTOR word-dots (false matches) are drawn as like-poles being "
     "SHOVED APART — black ink REPULSION arrows push them outward away from the pair, with "
     "spread-apart motion-lines, so the whole plate reads 'pull positives together, push negatives "
     "apart'. Draw the dots as simple horseshoe-magnet or bar-magnet doodles to make the "
     "attract/repel idea unmistakable. The magnets + arrows fill ≥85% of canvas width. NO Serega in "
     "this scene, so NO green anywhere. Warm-orange appears ONLY as the single ATTRACTION pull-arrow "
     "between the synonyms; the repulsion arrows and magnets are black ink on off-white with light "
     "course-blue magnet bodies. ABSOLUTELY NO words, letters, numbers, or labels anywhere — the "
     "dots/magnets are unlabelled, no caption, no title; the deck names positives/negatives later."),
    ("L6", "L6/L6-15-gremlin-caged.png", "16:9", False,
     "THE PAYOFF — the Lexical Gremlin finally CAGED, the emotional climax. CRITICAL CHARACTER "
     "CONTINUITY — the caged creature MUST be the SAME recurring Lexical Gremlin from earlier "
     "lectures: a SMALL mischievous gremlin with a round head, large POINTY bat-like ears sticking "
     "out sideways, wild SPIKY upward course-blue (#2A6FDB) hair/tuft, a course-blue body, a big "
     "wide toothy mischievous GRIN, two beady dot eyes, and thin noodle arms and legs — identical "
     "design to before, just now defeated. Draw this exact Gremlin shut INSIDE a sturdy CAGE: a "
     "clear box of vertical ink prison BARS with a little barred door, the Gremlin gripping two bars "
     "from the inside with a sulky / grumpy / pouting face (no longer smug — clearly beaten), small "
     "annoyed motion-marks around its head. OUTSIDE the cage, to the RIGHT, the satisfying reward: "
     "TWO word-tokens that used to be kept apart now sit happily TOGETHER, side by side and touching "
     "— two little couch/sofa pictographs (a simple sofa-shape and a couch-shape, drawn in course-"
     "blue, clearly the SAME furniture twice) nestled cosily next to each other, with a small "
     "warm-orange heart or a short warm-orange join-line between them showing 'couch' and 'sofa' "
     "finally collapsed together. The cage + the reunited couches fill ≥85% of canvas width. "
     "IMPORTANT PALETTE: the Gremlin's hair and body are course-BLUE (never green); the cage bars "
     "are black ink; NO Serega in this scene, so there is NO green ANYWHERE in the image at all. "
     "Warm-orange appears ONLY as the small heart / join-line between the two reunited couches. "
     "ABSOLUTELY NO words, letters, numbers, or labels anywhere — the couches are wordless "
     "pictographs, no caption, no title; the deck adds 'couch'/'sofa' later. Make the Gremlin "
     "RECOGNISABLE (same ears, same spiky blue hair, same grin-now-pout) and CLEARLY caged — this "
     "is the satisfying defeat, the emotional climax of the whole arc."),

    # ---- L6 · The Council of Attention · DEEPENING (A+ visual remediation, L6-2N range) ----
    # Same gate posture as the L6 block above: image-gate treats L6 as NON-Serega, so each plate
    # uses ONLY black ink + course-blue + warm-orange on off-white, keeps any Serega/Sir-Cosine
    # green cap tiny (<2% canvas), and bakes in ZERO words/letters/numbers. These seven break the
    # bald depth/cross-domain text-wall runs the A+ audit flagged (esp. the 5-deep wall
    # matryoshka -> anisotropy -> numerical -> crossdomain-vision -> crossdomain-everything).
    ("L6", "L6/L6-20-cost-wall.png", "16:9", True,
     "ATTENTION'S QUADRATIC COST WALL — the n-squared bottleneck, wordless. CENTER: a square "
     "SCORE GRID drawn as a checkerboard of small ink cells (rows = tokens, columns = tokens), so "
     "it reads as 'every token scored against every token' — a full n×n table. The single clear "
     "TELL of EXPLOSIVE GROWTH: draw the grid THREE times across the frame, growing dramatically — "
     "a tiny 3×3 grid on the LEFT, a medium 6×6 grid in the MIDDLE, and a huge dense grid on the "
     "RIGHT whose cells are too many to count, ballooning up toward the top of the frame like a "
     "rising wall, with thin warm-orange growth-arrows curving steeply upward between them to show "
     "the cost exploding far faster than the input grows. Behind the largest grid, suggest a sheer "
     "BRICK WALL the growth slams into (a few ink brick-courses) so the idea 'this is a hard wall "
     "you hit' lands. Serega stands small at the LEFT, craning up at the towering rightmost grid, "
     "a tiny comic sweat-drop, his small green skullcap the ONLY green in the image. Warm-orange "
     "appears ONLY as the steep growth-arrows; the grids and wall are black ink + light "
     "course-blue on off-white. The three grids + wall fill ≥85% of canvas width. ABSOLUTELY NO "
     "words, letters, numbers, or labels anywhere — the cells are blank, no caption, no title; the "
     "book adds the n-squared numbers later. Make the runaway growth of the grid the single "
     "dominant idea."),
    ("L6", "L6/L6-21-masks.png", "16:9", False,
     "CAUSAL vs BIDIRECTIONAL ATTENTION MASKS — two grids side by side, wordless. Draw TWO equal "
     "square attention grids of small ink cells with a clear gap between them. LEFT grid "
     "(bidirectional / BERT): the WHOLE grid is filled in — every cell shaded a light course-blue, "
     "so it reads 'every token may look at every token, both directions'. RIGHT grid (causal / "
     "GPT): only the lower-left TRIANGLE of cells is filled (a clean diagonal staircase), and the "
     "upper-right triangle is left blank/empty — a few of those empty future-cells crossed out "
     "with thin ink X's or a soft warm-orange diagonal barrier line running along the diagonal, so "
     "it reads 'a token may look only at itself and the past — the future is curtained off'. The "
     "diagonal divide on the right grid is the visual hero: full square versus triangle. NO Serega "
     "in this scene, so NO green anywhere (the bidirectional grid is shaded light course-BLUE, not "
     "green). Warm-orange appears ONLY as the thin diagonal barrier / the X-strokes over the "
     "masked future cells; everything else is black ink + light course-blue on off-white. The two "
     "grids fill ≥85% of canvas width. ABSOLUTELY NO words, letters, numbers, or labels anywhere — "
     "the cells and grids are unlabelled, no caption, no title; the book names causal / "
     "bidirectional later. Keep the full-square vs triangle contrast unmistakable."),
    ("L6", "L6/L6-22-heads.png", "16:9", False,
     "DIFFERENT ATTENTION HEADS ATTEND TO DIFFERENT THINGS — wordless. Draw the SAME short row of "
     "identical blank word-tiles (plain ink-outlined rectangles, NO text) repeated in THREE "
     "stacked horizontal strips, one above the other, each strip representing one head reading the "
     "same sentence. Over each strip, draw a DIFFERENT pattern of thin attention ARCS connecting "
     "the tiles, so the three heads visibly disagree about who heeds whom: TOP strip — each tile "
     "arcs to its IMMEDIATE NEIGHBOUR (a tidy 'previous/next token' chain, a positional head); "
     "MIDDLE strip — arcs link a couple of FAR-APART tiles across the strip (a long-range link, "
     "like subject to verb); BOTTOM strip — most arcs converge onto ONE special tile (a syntax/"
     "coreference head pointing at a head-word). One arc in each strip is drawn in warm-orange to "
     "mark that head's strongest link; the rest are black ink. The three different arc-patterns "
     "over identical tile-rows are the whole point: 'same sentence, different heads, different "
     "focus'. NO Serega in this scene, so NO green anywhere. Warm-orange appears ONLY as the one "
     "dominant arc per strip; the tiles and other arcs are black ink + light course-blue on "
     "off-white. The three strips fill ≥85% of canvas width and stack to fill the height. "
     "ABSOLUTELY NO words, letters, numbers, or labels anywhere — every tile is blank, no caption, "
     "no title; the book labels the heads later."),
    ("L6", "L6/L6-23-prenorm-highway.png", "16:9", False,
     "THE RESIDUAL HIGHWAY / PRE-NORM block — why a deep stack trains, wordless and diagrammatic. "
     "Draw a tall vertical UNINTERRUPTED HIGHWAY LINE running straight from the bottom to the top "
     "of the frame (a thick clean course-blue spine — the residual path that is never blocked). "
     "Along this spine, a few small rectangular SUBLAYER BOXES branch off to the SIDE: at each "
     "level, a thin line leaves the spine, passes through a little normalization gate (a small "
     "ink lens/funnel symbol) and then a sublayer box, and a curving RETURN ARROW merges its "
     "output back ONTO the spine via a small plus-circle (a residual add) — crucially the main "
     "spine itself runs through clean and uninterrupted, the gates sit only on the side-branches. "
     "Show this branch-and-rejoin pattern repeated up the spine 3 or 4 times (depth by repetition) "
     "with a faint echoed copy receding behind to suggest ×N. A thin warm-orange flow-arrow runs "
     "UP the spine showing signal flowing freely top to bottom. NO Serega in this scene, so NO "
     "green anywhere. Warm-orange appears ONLY as the single up-the-spine flow-arrow; the highway, "
     "boxes, gates and return-arrows are black ink + light course-blue on off-white. The block "
     "fills ≥85% of canvas height. ABSOLUTELY NO words, letters, numbers, gauge-readings, or "
     "labels anywhere — the boxes and gates are wordless, no caption, no title; the book names "
     "pre-norm / residual / LayerNorm later. Make the clean unblocked spine the dominant idea."),
    ("L6", "L6/L6-24-hardneg.png", "16:9", False,
     "A near-miss impostor among scattered dots, wordless, on a faint dotted grid. CENTER: a bold "
     "ink dot (the query) with a second bold ink dot sitting close beside it, joined by a short "
     "fat warm-orange ATTRACTION line pulling them together — the genuine close pair. Scattered "
     "FAR away in the four corners: a few lone ink dots, obviously distant, each with a simple "
     "thin ink push-away arrow pointing outward — trivially separated, no fuss. Then the hero of "
     "the plate: ONE more ink dot drawn sitting DECEPTIVELY CLOSE to the central query dot — "
     "almost as near as the close pair — wearing a tiny disguise so it reads as a sneaky "
     "look-alike: give THIS one dot a small comedic domino eye-mask and a little curled "
     "moustache doodle drawn directly ON the dot (a disguised impostor face). A single black ink "
     "REPULSION arrow shoves this disguised dot away from the query, and one lone hand-drawn "
     "question-mark glyph '?' floats just above it (the ONLY glyph of any kind in the image) to "
     "hint it might secretly belong. The tension between the genuinely-close pair and the "
     "deceptively-close disguised dot is the whole point. NO Serega in this scene, so NO green "
     "anywhere. Warm-orange appears ONLY as the single attraction line of the close pair; the "
     "disguised dot, the lone dots and the push-away arrows are black ink + light course-blue on "
     "off-white. The grid + dots fill ≥85% of canvas width. CRITICAL — this image is 100% "
     "WORDLESS: there are ABSOLUTELY NO words, no letters, no role-names, no captions, no labels "
     "of ANY kind anywhere on the canvas (do NOT write 'query', 'positive', 'negative', "
     "'impostor', or any other word beside any dot) — the ONLY hand-drawn mark that is not part "
     "of the dots/arrows is the single floating '?' glyph above the disguised dot. The book "
     "overlays every label later."),
    ("L6", "L6/L6-25-matryoshka.png", "16:9", False,
     "MATRYOSHKA EMBEDDINGS — nested, truncatable dimensions, wordless. Draw a set of classic "
     "Russian NESTING DOLLS in a row, opened and lined up from LARGEST on the LEFT down to "
     "SMALLEST on the RIGHT (4 or 5 dolls, clearly the same doll at shrinking sizes), each doll "
     "drawn as a simple ink-outline ovoid with a tiny painted face, bodies a light course-blue. "
     "The single clear TELL of 'one vector you can chop': BESIDE the dolls, draw a single tall "
     "bracketed COLUMN VECTOR of stacked ink cells with a warm-orange SCISSORS / cut-line crossing "
     "it partway down, and thin guide-lines matching each doll to a truncation depth on the column "
     "— the biggest doll to the full column, the smallest doll to just the top few cells — so the "
     "eye reads 'keep the first few coordinates for a small fast vector, or the whole thing for "
     "the accurate one; same vector, nested sizes'. NO Serega in this scene, so NO green anywhere "
     "(the dolls are light course-BLUE, never green). Warm-orange appears ONLY as the scissors / "
     "cut-line on the column; the dolls, column and guide-lines are black ink + light course-blue "
     "on off-white. The dolls + column fill ≥85% of canvas width. ABSOLUTELY NO words, letters, "
     "numbers, or labels anywhere — the column cells are blank, no caption, no title; the book "
     "adds 64 / 768 later. Make the shrinking-dolls-equals-truncatable-vector idea unmistakable."),
    ("L6", "L6/L6-26-anisotropy-cone.png", "16:9", False,
     "ANISOTROPY — the crowded cone vs the open sphere, wordless. A clear LEFT-vs-RIGHT contrast "
     "with a warm-orange transformation arrow between the halves. LEFT (anisotropic, the disease): "
     "a tight NARROW CONE of many thin ink arrows all crammed together pointing in nearly the SAME "
     "direction, squeezed into one wedge — so the eye reads 'every vector points the same way, "
     "everything looks similar, no contrast'. RIGHT (isotropic, the cure): the SAME bundle of "
     "arrows now fanned out EVENLY in all directions from a central origin, spread across a full "
     "round sphere/disc of directions — balanced, well-spread, using the whole space. A single "
     "thick warm-orange arrow in the middle points LEFT-to-RIGHT to show the fix (contrastive "
     "training / normalization opening the cone). This is a direct callback to the L2 "
     "Curse-of-Dimensionality motif — keep the cramped-cone vs even-sphere reading instant. NO "
     "Serega in this scene, so NO green anywhere. Warm-orange appears ONLY as the central "
     "transformation arrow; the cone, the sphere of arrows and the origin are black ink + light "
     "course-blue on off-white. The cone + sphere fill ≥85% of canvas width. ABSOLUTELY NO words, "
     "letters, numbers, or labels anywhere — no caption, no title; the book names anisotropy / "
     "whitening later. Make the squeezed-cone versus open-sphere contrast the dominant idea."),
    ("L6", "L6/L6-27-vit-patches.png", "16:9", True,
     "VISION TRANSFORMER — an image becomes a sentence of patches, wordless. On the LEFT, a "
     "simple hand-drawn PICTURE inside a frame (a plain wordless scene — say a little house with a "
     "sun, drawn in black ink with light course-blue), overlaid with a tidy GRID of cut-lines that "
     "slices it into equal square PATCHES (like a 4×4 cut). A warm-orange arrow leads RIGHT, where "
     "the patches have been UNGRIDDED and laid out in a single horizontal ROW of square tiles — a "
     "'sentence of patches' — each tile a little fragment of the original image, lined up left to "
     "right exactly like a row of word-tokens. Under the row, a few wordless position-stamps "
     "(counting pips: one dot, two dots, three dots — NOT digits) mark each patch's order, echoing "
     "the positional-encoding plate, so it reads 'patches are tokens; an image is a sentence'. "
     "Serega stands at the RIGHT pointing at the row of patch-tokens, delighted at the reuse, his "
     "small green skullcap the ONLY green in the image. Warm-orange appears ONLY as the "
     "image-to-row arrow; the picture, grid, patch-tiles and pips are black ink + light "
     "course-blue on off-white. The picture + patch-row fill ≥85% of canvas width. ABSOLUTELY NO "
     "words, letters, numbers (the position-stamps are DOTS not digits), or labels anywhere — no "
     "caption, no title; the book names ViT / patches later. Make 'cut the image into a row of "
     "tokens' the dominant idea."),
    ("L6", "L6/L6-28-everything-tokens.png", "16:9", False,
     "EVERYTHING IS A SEQUENCE OF TOKENS — the all-modalities montage, wordless. CENTER: one "
     "shared SPACE drawn as a faint dotted sphere/disc with a few bold ink dots inside it (the "
     "common embedding space). Arranged AROUND the edges, several different SOURCE modalities each "
     "feed INTO that centre via a thin warm-orange arrow, and each source is shown being chopped "
     "into a little ROW of identical token-tiles before it enters — so the unifying idea 'any "
     "modality becomes a row of tokens in one space' reads at a glance. Draw 5 wordless source "
     "pictographs around the centre: (1) a strip of text-tiles (words); (2) a small image cut into "
     "a patch-row (vision); (3) a sound WAVEFORM sliced into time-window tiles (audio); (4) a "
     "twisting DNA double-helix / protein chain chopped into bead-tiles (biology); (5) a little "
     "GRAPH of connected nodes (graph data). Each modality's row of tiles flows along its "
     "warm-orange arrow into the shared central space and lands as dots among the others, mingling "
     "— different senses, one map. NO Serega in this scene, so NO green anywhere (the helix, "
     "waveform and graph are black ink + light course-blue, never green). Warm-orange appears ONLY "
     "as the five feed-in arrows; all the source pictographs, tiles and the central space are "
     "black ink + light course-blue on off-white. The montage fills ≥85% of canvas width. "
     "ABSOLUTELY NO words, letters, numbers, or labels anywhere — every tile is blank, no caption, "
     "no title; the book names the modalities later. Make 'many different inputs, all tokenized "
     "into one shared space' the single dominant idea."),

    # ---- L7 · Scouts and Judges (Bi-encoders · Cross-encoders & Reranking · Multi-stage Pipelines) ----
    # Wordless idea/analogy plates (NOT data figures — the deck/Book widgets carry every number).
    # Palette: black ink + course-blue #2A6FDB + warm-orange #E8743B on off-white #FBFAF6. NO green
    # (has_serega=False → no green anywhere). ABSOLUTELY NO words/letters/numbers (overlays do all labels).
    ("L7", "L7/L7-00-scouts-and-judges.png", "16:9", False,
     "HERO ESTABLISHING SHOT — two-stage retrieval as Scouts and Judges, a wide frontier split in two. "
     "LEFT HALF: a loose band of fast SCOUT figures (light, simple, mid-stride, fanned out) sweeping "
     "across a vast field strewn with hundreds of tiny document-dots, motion-blur sense of speed, each "
     "scout quickly brushing past many dots — many-and-fast. RIGHT HALF: a few heavy, seated JUDGE "
     "figures on a raised bench, leaning in over a SINGLE object on the bench, slow and deliberate — "
     "few-and-careful. Between the two halves a thin warm-orange flow carries just a HANDFUL of dots "
     "from the scouts' wide net to the judges' bench (the shortlist hand-off). The whole image reads "
     "'many-fast sweep on the left, few-careful judging on the right'. Fills ≥85% of canvas width. NO "
     "Serega, so NO green anywhere; warm-orange ONLY on the thin hand-off flow and the one judged "
     "object; everything else black ink + course-blue on off-white. ABSOLUTELY NO words, letters, "
     "numbers, or labels anywhere — figures and dots unlabelled, no caption, no title."),
    ("L7", "L7/L7-01-cant-judge-everyone.png", "16:9", False,
     "WHY YOU CAN'T JUDGE EVERYONE — a single overwhelmed JUDGE figure seated at a small bench, dwarfed "
     "by an IMPOSSIBLY TALL, receding stack of identical cases/scrolls/folders that climbs up out of "
     "frame and recedes to a vanishing point — the O(N) wall. The lone judge looks UP at a stack that "
     "never ends, tiny against the toppling mountain of cases. One warm-orange accent on the single "
     "topmost case the judge is holding; the endless stack itself is black ink + faint course-blue on "
     "off-white. The towering stack dominates and dwarfs the judge. Fills ≥85% of canvas width. NO "
     "Serega, so NO green anywhere. ABSOLUTELY NO words, letters, numbers, or labels anywhere — the "
     "cases are blank, no caption, no title."),
    ("L7", "L7/L7-04-interview-room.png", "4:3", False,
     "THE INTERVIEW ROOM — the cross-encoder as a face-to-face interview. A small table where a QUERY "
     "figure and a single DOCUMENT figure sit ACROSS from each other, leaning in, really attending to "
     "one another. A beam of thin ink ATTENTION-LINES criss-crosses BETWEEN them, connecting points on "
     "the question to points on the page (both read TOGETHER, jointly). One or two of the strongest "
     "cross-lines are traced in warm-orange to mark the matched point. Intimate, single-pair, the exact "
     "opposite of the sweeping scouts. Blue attention-lines, warm-orange ONLY on the one or two "
     "strongest matched lines; figures and table black ink on off-white. Fills ≥85% of canvas width. NO "
     "Serega, so NO green anywhere. ABSOLUTELY NO words, letters, numbers, or labels anywhere — figures "
     "unlabelled, no caption, no title."),
    ("L7", "L7/L7-06-hiring-funnel.png", "16:9", False,
     "THE HIRING FUNNEL — the retrieval cascade as a literal narrowing funnel, left to right. A WIDE "
     "mouth on the left is crowded with MANY tiny applicant-dots (the corpus); they pour through a "
     "MIDDLE band that is narrower (the scouts' shortlist) and out a THIN spout on the right where just "
     "a FEW dots face a judge's bench. The widths shrink left→right (cheap-and-wide at the mouth, "
     "dear-and-narrow at the spout); the pool visibly thins from a crowd to a handful, shown by dot "
     "COUNT, never digits. A thin warm-orange flow-arrow runs through the funnel's throat. Echoes a "
     "classic recruitment funnel. Fills ≥85% of canvas width. NO Serega, so NO green anywhere; "
     "warm-orange ONLY on the central flow-arrow; funnel + dots black ink + course-blue on off-white. "
     "ABSOLUTELY NO words, letters, numbers (counts are DOTS, not digits), or labels anywhere — no "
     "caption, no title."),
    ("L7", "L7/L7-07-depth-dial.png", "4:3", False,
     "THE DEPTH DIAL — the rerank-depth / quality-vs-cost tradeoff as a single control. A clean "
     "hand-drawn round DIAL with a pointer, with a small balance/scale beside it trading an HOURGLASS "
     "(latency) against a MAGNIFYING GLASS (thoroughness). Turning the dial deeper tips the balance "
     "toward the magnifying glass (more care) but visibly drags the hourglass DOWN (more time) — so it "
     "reads 'turn it deeper: better but slower'. One warm-orange needle/pointer on the dial; the "
     "hourglass, magnifier and balance are black ink + course-blue on off-white. Levels shown by "
     "tick-marks and tilt, never digits. Fills ≥85% of canvas width. NO Serega, so NO green anywhere. "
     "ABSOLUTELY NO words, letters, numbers, or labels anywhere — no caption, no title."),
    ("L7", "L7/L7-08-team-wins.png", "16:9", False,
     "THE PAYOFF — Scouts and Judges WIN together. The fast SCOUTS hand a small SHORTLIST (a few "
     "warm-orange dots) to the JUDGES at the bench — the hand-off moment, the team working as one. The "
     "scouts (blue, light) on the left pass to the seated judges (black ink) on the right; behind them "
     "a faint horizon/road leads off-frame toward distant JUMP-GATE arches on the horizon (the bridge "
     "to the next quest). Warm-orange ONLY on the handed shortlist; crew + bench + road black ink + "
     "course-blue on off-white. The hand-off is the dominant action. Fills ≥85% of canvas width. NO "
     "Serega, so NO green anywhere. ABSOLUTELY NO words, letters, numbers, or labels anywhere — no "
     "caption, no title."),
    ("L7", "L7/L7-09-embedder-zoo.png", "16:9", False,
     "THE EMBEDDER ZOO — choosing a Scout from a whole family. A ROSTER / line-up of many SCOUT "
     "figures of visibly DIFFERENT builds and sizes (tall, short, broad, lean — a varied species of "
     "scouts) standing shoulder to shoulder in a row, as if being reviewed for selection. ONE scout "
     "near the centre is picked out, lit in warm-orange and stepped half a pace forward (the chosen "
     "model). The rest are black ink + course-blue on off-white. Reads 'a family of scouts to choose "
     "from, pick the right one'. Fills ≥85% of canvas width. NO Serega, so NO green anywhere; "
     "warm-orange ONLY on the single chosen scout. ABSOLUTELY NO words, letters, numbers, or labels "
     "anywhere — figures unlabelled, no caption, no title."),
    ("L7", "L7/L7-10-the-forge.png", "16:9", False,
     "THE FORGE — how Scouts and Judges are made (training). A blacksmith's FORGE / training ground "
     "where a smith-figure hammers a half-formed SCOUT figure into shape on an ANVIL, sparks flying; "
     "beside it a JUDGE figure is being drilled. A sense of practice, shaping, repetition. Tongs, "
     "anvil, a glowing billet. The sparks and the glow of the hot metal are the ONLY warm-orange "
     "accents; the smith, anvil, scout and judge are black ink + course-blue on off-white. Reads "
     "'these figures are forged and trained, not found'. Fills ≥85% of canvas width. NO Serega, so NO "
     "green anywhere. ABSOLUTELY NO words, letters, numbers, or labels anywhere — no caption, no title."),
    ("L7", "L7/L7-11-the-archive.png", "16:9", False,
     "THE ARCHIVE — building the index offline. A VAST pre-built ARCHIVE: towering rows of shelves and "
     "a giant card-catalog being filled and organised by a few librarian-figures who file long rows of "
     "identical cards into the index. NO reader, NO query present — this is build-time, done in advance. "
     "Receding shelves to a vanishing point convey scale. One warm-orange accent on the single card "
     "currently being filed; shelves, cards and librarians are black ink + course-blue on off-white. "
     "Reads 'the whole corpus filed away in advance, before any question'. Fills ≥85% of canvas width. "
     "NO Serega, so NO green anywhere. ABSOLUTELY NO words, letters, numbers, or labels anywhere — the "
     "cards are blank, no caption, no title."),
    ("L7", "L7/L7-12-the-product.png", "16:9", False,
     "THE PRODUCT — the cascade inside a real search / RAG assistant. LEFT: the SCOUT→JUDGE hand-off (a "
     "few warm-orange shortlist dots passing from blue scouts to a judge's bench). RIGHT: that feeds a "
     "single ANSWER DESK where an assistant-figure hands a finished ANSWER SHEET to a waiting USER "
     "figure; a small warm-orange CITATION TAG is clipped to the sheet (the grounding). The flow reads "
     "left→right: sweep → judge → deliver a sourced answer. Warm-orange ONLY on the shortlist dots and "
     "the citation tag; everyone and everything else black ink + course-blue on off-white. Fills ≥85% "
     "of canvas width. NO Serega, so NO green anywhere. ABSOLUTELY NO words, letters, numbers, or "
     "labels anywhere — the answer sheet is blank, no caption, no title."),

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

    # ---- L8 · The Alliance (Late Interaction / ColBERT · SPLADE · Hybrid · Learning to Rank) ----
    # Wordless idea/analogy plates (NOT data figures — the deck/Book widgets carry every number).
    # Palette: black ink + course-blue #2A6FDB + warm-orange #E8743B on off-white #FBFAF6. NO green
    # (has_serega=False → no green anywhere). ABSOLUTELY NO words/letters/numbers (overlays do all labels).
    ("L8", "L8/L8-00-the-alliance.png", "16:9", False,
     "HERO ESTABLISHING SHOT — two hosts converge into one. LEFT: an ANGULAR, GEOMETRIC column of "
     "figures (the lexical / sparse army, course-blue) marching in from the left, all sharp facets and "
     "straight edges. RIGHT: a FLOWING, ROUNDED column (the semantic / dense army, course-blue) sweeping "
     "in from the right, all soft curves. AT CENTRE, on a low rise where the two columns meet and merge, "
     "a lone STANDARD-BEARER figure holds ONE TALL BANNER bearing an abstract geometric emblem (the only "
     "warm-orange in the frame). The whole image reads 'many-from-two-into-one under a single banner'. "
     "Fills ≥85% of canvas width. NO Serega, so NO green anywhere; warm-orange ONLY on the one banner; "
     "the two armies and the rise are black ink + course-blue on off-white. ABSOLUTELY NO words, letters, "
     "numbers, or labels anywhere — figures and banner emblem unlabelled, no caption, no title."),
    ("L8", "L8/L8-01-token-muster.png", "16:9", False,
     "LATE INTERACTION as a muster of tokens — a FRONT ROW of small identical figures (the query tokens) "
     "faces an OPPOSITE ROW of small figures (the document tokens) across a gap. From each FRONT figure, "
     "a SINGLE bright beam shoots to the ONE opposite figure it matches best (its MaxSim partner); all "
     "other faint beams fade. The pattern 'each front figure picks exactly one strongest partner' is the "
     "whole image — a clean lattice of mostly-faint lines with a few bright ones. The bright matched "
     "beams are the ONLY warm-orange; the rows of figures and faint beams are black ink + course-blue on "
     "off-white. Fills ≥85% of canvas width. NO Serega, so NO green anywhere. ABSOLUTELY NO words, "
     "letters, numbers, or labels anywhere — figures unlabelled, no caption, no title."),
    ("L8", "L8/L8-02-expanded-banner.png", "4:3", False,
     "SPLADE term expansion as a kindling constellation — a SPARSE banner / constellation where, beyond "
     "a few LITERAL lit points (the words you typed), several FAINT RELATED points kindle and light up "
     "AROUND them (the expansion terms) — the emblem grows richer WITHOUT becoming a dense field (it "
     "stays clearly sparse, lots of empty dark space remains). The newly-kindled expansion points glow; "
     "ONE of them carries the single warm-orange accent; the literal points and connecting filaments are "
     "black ink + course-blue on off-white. Reads 'a few given points, a few more lighting up nearby, "
     "still sparse'. Fills ≥85% of canvas width. NO Serega, so NO green anywhere. ABSOLUTELY NO words, "
     "letters, numbers, or labels anywhere — points unlabelled, no caption, no title."),
    ("L8", "L8/L8-03-two-rivers.png", "16:9", False,
     "HYBRID as two rivers merging — TWO rivers flow toward each other and JOIN into one. The LEFT river "
     "is ANGULAR / FACETED (lexical / sparse), drawn with hard geometric bends; the RIGHT river is "
     "SMOOTH / CURVING (semantic / dense), drawn with soft meanders. They merge mid-frame into ONE "
     "BROADER, STRONGER river that flows on beneath a single RAISED BANNER on the bank. Blue water for "
     "both rivers and the merged flow; the one raised banner is the ONLY warm-orange; banks and "
     "surroundings are black ink on off-white. Reads 'two different waters become one stronger current "
     "under one banner'. Fills ≥85% of canvas width. NO Serega, so NO green anywhere. ABSOLUTELY NO "
     "words, letters, numbers, or labels anywhere — no caption, no title."),
    ("L8", "L8/L8-04-the-captain-orders.png", "4:3", False,
     "LEARNING TO RANK as a marshal ordering a formation — the STANDARD-BEARER, now as a MARSHAL, "
     "arranges a SCATTERED CROWD of small figures into a CLEAN RANKED COLUMN (a single file, in order), "
     "gesturing the line into place with one outstretched arm. On the left a disordered cluster; on the "
     "right the same figures resolved into a tidy ranked column. ONE figure at the HEAD of the ordered "
     "column carries the single warm-orange accent; the marshal, the crowd and the column are black ink "
     "+ course-blue on off-white. Reads 'chaos on the left becomes an ordered ranked line on the right'. "
     "Fills ≥85% of canvas width. NO Serega, so NO green anywhere. ABSOLUTELY NO words, letters, numbers, "
     "or labels anywhere — figures unlabelled, no caption, no title."),
    ("L8", "L8/L8-05-the-host-marches.png", "16:9", False,
     "PAYOFF — the united, ordered host marches out. The whole HOST (the merged army, now in clean "
     "ranked order) marches under the ONE raised banner toward a HORIZON where faint JUMP-GATE ARCHES "
     "and a road lead off-frame (the bridge to the next quests). The marching host is black ink + "
     "course-blue on off-white; the one raised banner is warm-orange; a faint hint of warm-orange marks "
     "the distant jump-gate on the horizon. Reads 'one ordered host under one banner, marching toward "
     "the road ahead'. Fills ≥85% of canvas width. NO Serega, so NO green anywhere. ABSOLUTELY NO words, "
     "letters, numbers, or labels anywhere — no caption, no title."),
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
