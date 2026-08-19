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
# Serega's locked appearance + the whole recurring cast now live in the character bible
# (_research/mascots.py) — ONE source of truth so the mascots stay consistent across lectures
# and Claude Code sessions. The image-gate (_research/check_images.py) enforces Serega's
# presence per lecture and the green-only-on-the-tübetey palette rule.
from mascots import SEREGA, MASCOTS  # noqa: E402
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
     "shows star IDs strung out with big empty space between them ('3 … 8 … 12 … 30'); a "
     "warm-orange arrow and a hand crank push them through a little press so the RIGHT half stores "
     "only the gaps between neighbouring stars ('+3 +5 +4 +18'), the scroll now squeezed to a "
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
    # BRAND RESTORATION (2026-06-15): the recent units had let Serega fade out. The narrative / analogy /
    # payoff plates now bring Serega back as the recurring hero (has_serega=True) with Wait-But-Why
    # hand-lettered humor (a short English label, the odd googly-eyed figure). The pure technical-diagram
    # plates (attention beams, masks grid, heads arcs, residual highway, hard-negative dots, positional
    # row) stay clean and wordless — the deck overlays their labels. Palette throughout: black ink +
    # course-blue #2A6FDB + warm-orange #E8743B on off-white #FBFAF6; GREEN appears ONLY on Serega's
    # small tübetey. CRUCIAL: the payoff plate's caged Lexical Gremlin must match the L1/L3 Gremlin —
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
    ("L6", "L6/L6-01-bank-two-meanings.png", "16:9", True,
     "ONE WORD, TWO WORLDS — the polysemy problem, with Serega caught in the middle. CENTER: one blank "
     "word-card / placard (NO text on it, a plain ink-outlined rectangle) on a vertical dividing seam "
     "that splits the frame into two contrasting scenes; SEREGA stands right at the seam, scratching his "
     "head, looking from one side to the other, puzzled. LEFT WORLD: a peaceful RIVER-BANK — a curving "
     "river with a grassy sloping shore, reeds, a little fish, black ink with course-blue water. RIGHT "
     "WORLD: a MONEY-BANK — a small classical bank building with columns, a coin stack and a dollar-bag "
     "with a warm-orange coin accent. A thin ink crack / lightning-bolt seam runs down between the two "
     "worlds through the shared card, so it reads 'the SAME one word is torn between two unrelated "
     "meanings — one static vector can't be in two minds'. One short hand-lettered label above Serega "
     "reads 'WHICH BANK?'. The split scene fills ≥85% of canvas width. Serega's green tübetey is the ONLY "
     "green (the riverbank grass is black ink hatching or course-blue, NOT green); warm-orange ONLY on "
     "the coin. The central word-card stays BLANK — the deck adds the word 'bank' later."),
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
    ("L6", "L6/L6-09-transformer-block.png", "16:9", True,
     "THE TRANSFORMER BLOCK as an engine Serega tends — a tall mechanical ENGINE built as a vertical "
     "stack of clean rectangular machine-stages bolted on top of one another, connected by pipes, with a "
     "couple of curving RETURN PIPES looping around the outside (residual / skip connections) and small "
     "gear / bolt details — one repeating powerful engine-unit. SEREGA stands beside it as the mechanic, "
     "an oil-can in hand, giving the engine an approving pat. A thin warm-orange flow-arrow runs UP "
     "through the centre showing tokens flowing through. To suggest depth, the same block is faintly "
     "REPEATED behind it (×N), receding slightly. One short hand-lettered label reads 'STACK IT DEEP'. "
     "Crisp, mechanical, diagrammatic — an engine, not a creature. The engine fills ≥85% of canvas "
     "width/height. Serega's green tübetey is the ONLY green; warm-orange ONLY as the central flow-arrow "
     "and one or two accent pipes; the machine body is black ink on off-white with light course-blue "
     "accents. No gauge-readings or digits on the stages — the deck labels the stages later."),
    ("L6", "L6/L6-12-contrastive-pull-push.png", "16:9", True,
     "CONTRASTIVE LEARNING as magnets Serega works — pull synonyms together, push impostors apart, on a "
     "faint dotted embedding-grid. LEFT/CENTER: TWO small word-dots that are SYNONYMS snap TOGETHER like "
     "magnets — a short fat warm-orange ATTRACTION arrow pulls them into one tight pair, almost touching, "
     "with motion-lines rushing them together. RIGHT/AROUND: one or two IMPOSTOR word-dots (false "
     "matches) are SHOVED APART like like-poles — black ink REPULSION arrows push them outward, with "
     "spread-apart motion-lines. SEREGA stands in the middle like a referee, one hand pulling the "
     "synonyms together, the other shoving an impostor away, a focused look. Draw the dots as simple "
     "horseshoe-magnet or bar-magnet doodles to make attract/repel unmistakable. One short hand-lettered "
     "label reads 'PULL & PUSH'. The magnets + arrows fill ≥85% of canvas width. Serega's green tübetey "
     "is the ONLY green; warm-orange ONLY as the single ATTRACTION arrow between the synonyms; the "
     "repulsion arrows and magnets are black ink on off-white with light course-blue magnet bodies."),
    ("L6", "L6/L6-15-gremlin-caged.png", "16:9", True,
     "THE PAYOFF — Serega finally CAGES the Lexical Gremlin, the emotional climax. CRITICAL CHARACTER "
     "CONTINUITY — the caged creature MUST be the SAME recurring Lexical Gremlin from earlier lectures: "
     "a SMALL mischievous gremlin with a round head, large POINTY bat-like ears sticking out sideways, "
     "wild SPIKY upward course-blue (#2A6FDB) hair/tuft, a course-blue body, a big wide toothy GRIN, two "
     "beady dot eyes, and thin noodle arms and legs — identical design to before, just now defeated. "
     "Draw this exact Gremlin shut INSIDE a sturdy CAGE: a clear box of vertical ink prison BARS with a "
     "little barred door, the Gremlin gripping two bars from the inside with a sulky / pouting face (no "
     "longer smug — clearly beaten), small annoyed motion-marks. SEREGA stands beside the cage, "
     "triumphant — one hand resting on the cage, the other raised in victory, a big proud grin (he "
     "caught it at last). OUTSIDE the cage, to the RIGHT, the reward: TWO word-tokens that used to be "
     "kept apart now sit happily TOGETHER, touching — two little couch/sofa pictographs (a sofa-shape "
     "and a couch-shape, course-blue, clearly the SAME furniture twice) nestled cosily, with a small "
     "warm-orange heart between them ('couch' and 'sofa' finally collapsed together). One short "
     "hand-lettered label reads 'GOTCHA!'. The cage + reunited couches fill ≥85% of canvas width. "
     "PALETTE: the Gremlin's hair and body are course-BLUE (never green); the cage bars are black ink; "
     "Serega's green tübetey is the ONLY green in the image. Warm-orange appears ONLY as the small heart "
     "between the two couches. Make the Gremlin RECOGNISABLE (same ears, same spiky blue hair, "
     "same grin-now-pout) and CLEARLY caged — this is the satisfying defeat, the climax of the arc."),

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
    ("L6", "L6/L6-25-matryoshka.png", "16:9", True,
     "MATRYOSHKA EMBEDDINGS — nested, truncatable dimensions, with Serega demonstrating. A set of "
     "classic Russian NESTING DOLLS in a row, opened and lined up from LARGEST on the LEFT down to "
     "SMALLEST on the RIGHT (4 or 5 dolls, clearly the same doll at shrinking sizes), each a simple "
     "ink-outline ovoid with a tiny painted face, bodies light course-blue. BESIDE the dolls, a single "
     "tall bracketed COLUMN VECTOR of stacked ink cells with a warm-orange SCISSORS / cut-line crossing "
     "it partway down, and thin guide-lines matching each doll to a truncation depth — the biggest doll "
     "to the full column, the smallest to just the top few cells — so the eye reads 'keep the first few "
     "coordinates for a small fast vector, or the whole thing for the accurate one; same vector, nested "
     "sizes'. SEREGA stands by the column holding the scissors, about to snip, a clever little smile. One "
     "short hand-lettered label reads 'CHOP TO SIZE'. Serega's green tübetey is the ONLY green (the dolls "
     "are light course-BLUE, never green); warm-orange ONLY as the scissors / cut-line; the dolls, column "
     "and guide-lines are black ink + light course-blue on off-white. The dolls + column fill ≥85% of "
     "canvas width. The column cells stay blank — the book adds 64 / 768 later."),
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
    ("L6", "L6/L6-28-everything-tokens.png", "16:9", True,
     "EVERYTHING IS A SEQUENCE OF TOKENS — the all-modalities montage, Serega conducting. CENTER: one "
     "shared SPACE drawn as a faint dotted sphere/disc with a few bold ink dots inside it (the common "
     "embedding space); SEREGA stands at the centre like a conductor, arms out, welcoming every modality "
     "in. Arranged AROUND the edges, several SOURCE modalities each feed INTO that centre via a thin "
     "warm-orange arrow, each shown chopped into a little ROW of identical token-tiles before it enters. "
     "Draw 5 wordless source pictographs around the centre: (1) a strip of text-tiles (words); (2) a "
     "small image cut into a patch-row (vision); (3) a sound WAVEFORM sliced into time-window tiles "
     "(audio); (4) a twisting DNA double-helix chopped into bead-tiles (biology); (5) a little GRAPH of "
     "connected nodes (graph data). Each row of tiles flows along its warm-orange arrow into the shared "
     "central space and lands as dots among the others, mingling — different senses, one map. One short "
     "hand-lettered label reads 'ALL TOKENS'. Serega's green tübetey is the ONLY green (the helix, "
     "waveform and graph are black ink + light course-blue, never green); warm-orange ONLY as the five "
     "feed-in arrows; all source pictographs, tiles and the central space are black ink + light "
     "course-blue on off-white. The montage fills ≥85% of canvas width. Every tile stays blank — the "
     "book names the modalities later."),

    # ---- L7 · Scouts and Judges (Bi-encoders · Cross-encoders & Reranking · Multi-stage Pipelines) ----
    # Idea/analogy plates (NOT data figures — the deck/Book widgets carry every number). Serega is the
    # recurring hero living each analogy (scout-master, interviewer, smith, librarian, assistant), with
    # Wait-But-Why hand-lettered humor (a short English label + the odd googly-eyed figure) back in.
    # Palette: black ink + course-blue #2A6FDB + warm-orange #E8743B on off-white #FBFAF6; GREEN appears
    # ONLY on Serega's tübetey (has_serega=True).
    ("L7", "L7/L7-00-scouts-and-judges.png", "16:9", True,
     "HERO ESTABLISHING SHOT — Serega runs the two-stage hunt, Scouts and Judges, on a wide frontier "
     "split in two. LEFT HALF: a loose band of fast SCOUT figures (light, simple, mid-stride, fanned "
     "out) sweeping across a vast field strewn with hundreds of tiny document-dots, motion-blur speed, "
     "brushing past many dots — many-and-fast. RIGHT HALF: a few heavy, seated JUDGE figures on a "
     "raised bench leaning over a SINGLE object — few-and-careful. SEREGA stands at the seam between the "
     "halves, one hand waving the scouts out, the other presenting the shortlist to the judges, a "
     "confident grin. A thin warm-orange flow carries a HANDFUL of dots from the scouts' net to the "
     "judges' bench (the shortlist hand-off). Two short hand-lettered labels: 'SCOUTS' over the left, "
     "'JUDGES' over the right. Serega's green tübetey is the ONLY green; warm-orange ONLY on the hand-off "
     "flow and the one judged object; everything else black ink + course-blue on off-white. Fills ≥85% "
     "of canvas width."),
    ("L7", "L7/L7-01-cant-judge-everyone.png", "16:9", True,
     "WHY YOU CAN'T JUDGE EVERYONE — SEREGA as a single overwhelmed JUDGE seated at a small bench, "
     "dwarfed by an IMPOSSIBLY TALL receding stack of identical blank cases/scrolls/folders that climbs "
     "out of frame to a vanishing point — the O(N) wall. Serega looks UP, tiny and googly-eyed, a bead "
     "of sweat, at a stack that never ends. One warm-orange accent on the single topmost case he is "
     "holding; the endless stack is black ink + faint course-blue on off-white. One short hand-lettered "
     "label reads 'TOO MANY'. Serega's green tübetey is the ONLY green; the towering stack dominates and "
     "dwarfs him. Fills ≥85% of canvas width."),
    ("L7", "L7/L7-04-interview-room.png", "4:3", True,
     "THE INTERVIEW ROOM — the cross-encoder as a face-to-face interview that Serega conducts. At a "
     "small table a QUERY figure and a single DOCUMENT figure sit ACROSS from each other, leaning in, "
     "really attending to one another; SEREGA sits at the head of the table as the interviewer, jotting "
     "on a tiny clipboard. A beam of thin ink ATTENTION-LINES criss-crosses BETWEEN the pair, connecting "
     "points on the question to points on the page (both read TOGETHER, jointly). One or two strongest "
     "cross-lines are traced in warm-orange. One short hand-lettered label reads 'READ TOGETHER'. "
     "Serega's green tübetey is the ONLY green; blue attention-lines, warm-orange ONLY on the strongest "
     "matched line(s); figures and table black ink on off-white. Intimate, single-pair — the opposite of "
     "the sweeping scouts. Fills ≥85% of canvas width."),
    ("L7", "L7/L7-06-hiring-funnel.png", "16:9", True,
     "THE HIRING FUNNEL — Serega runs the retrieval cascade as a literal narrowing funnel, left to "
     "right. A WIDE mouth on the left is crowded with MANY tiny applicant-dots (the corpus); they pour "
     "through a NARROWER middle band (the scouts' shortlist) and out a THIN spout on the right where "
     "just a FEW dots face a judge's bench. SEREGA stands beside the funnel working a little crank/valve "
     "at the throat, watching the crowd thin to a handful. The widths shrink left→right (cheap-and-wide "
     "at the mouth, dear-and-narrow at the spout); the pool thins by dot COUNT, never digits. A thin "
     "warm-orange flow-arrow runs through the throat. One short hand-lettered label reads 'NARROW IT "
     "DOWN'. Serega's green tübetey is the ONLY green; warm-orange ONLY on the central flow-arrow; "
     "funnel + dots black ink + course-blue on off-white. No digits (counts are DOTS). Fills ≥85% of "
     "canvas width."),
    ("L7", "L7/L7-07-depth-dial.png", "4:3", True,
     "THE DEPTH DIAL — Serega works the rerank-depth / quality-vs-cost tradeoff as a single control. "
     "SEREGA turns a clean hand-drawn round DIAL with a pointer; beside it a small balance/scale trades "
     "an HOURGLASS (latency) against a MAGNIFYING GLASS (thoroughness). As Serega turns the dial deeper "
     "the balance tips toward the magnifying glass (more care) but visibly drags the hourglass DOWN "
     "(more time); Serega wears a knowing 'hmm' look. One warm-orange needle/pointer on the dial; the "
     "hourglass, magnifier and balance are black ink + course-blue on off-white. One short hand-lettered "
     "label reads 'DEEPER = SLOWER'. Serega's green tübetey is the ONLY green. Levels by tick-marks and "
     "tilt, never digits. Fills ≥85% of canvas width."),
    ("L7", "L7/L7-08-team-wins.png", "16:9", True,
     "THE PAYOFF — Serega's Scouts and Judges WIN together. The fast SCOUTS hand a small SHORTLIST (a "
     "few warm-orange dots) to the JUDGES at the bench — the hand-off moment, the team as one. SEREGA "
     "stands between them, arms raised in triumph, cheering the hand-off. The scouts (blue, light) on "
     "the left pass to the seated judges (black ink) on the right; behind them a faint horizon/road "
     "leads off-frame toward distant JUMP-GATE arches (the bridge to the next quest). One short "
     "hand-lettered label reads 'TEAM WINS'. Serega's green tübetey is the ONLY green; warm-orange ONLY "
     "on the handed shortlist; crew + bench + road black ink + course-blue on off-white. Fills ≥85% of "
     "canvas width."),
    ("L7", "L7/L7-13-the-judge-enters.png", "16:9", True,
     "THE JUDGE ENTERS — the lecture's second protagonist finally gets a curtain. A tall, imposing "
     "JUDGE figure (long robe, stern calm face — NOT a courtroom wig, a wise examiner) sits at a "
     "high desk and reads TWO papers held TOGETHER in one hand — a query sheet and a document sheet "
     "overlapping — through one magnifying lens: the whole point, the pair is judged JOINTLY. "
     "SEREGA stands below the desk, presenting the paired sheets upward with both hands, a little "
     "in awe. A queue of small scout figures waits behind Serega, each holding single sheets (the "
     "candidates the Scout retrieved). Black ink + course-blue on off-white; warm-orange ONLY on "
     "the joined pair of papers in the Judge's hand. One short hand-lettered label reads 'ONE PAIR, "
     "ONE VERDICT'. Serega's green tübetey the ONLY green. No lettered title bar. Reads 'slow, "
     "careful, sees both texts at once'. Fills ≥85% of canvas width."),
    ("L7", "L7/L7-09-embedder-zoo.png", "16:9", True,
     "THE EMBEDDER ZOO — Serega chooses a Scout from a whole family. A ROSTER / line-up of many SCOUT "
     "figures of visibly DIFFERENT builds and sizes (tall, short, broad, lean — a varied species of "
     "scouts) standing shoulder to shoulder in a row, as if reviewed for selection. SEREGA walks the "
     "line like a coach, pointing at ONE scout near the centre who is lit in warm-orange and stepped "
     "half a pace forward (the chosen model). The rest are black ink + course-blue on off-white. One "
     "short hand-lettered label reads 'PICK ONE'. Serega's green tübetey is the ONLY green; warm-orange "
     "ONLY on the single chosen scout. Reads 'a family of scouts, pick the right one'. Fills ≥85% of "
     "canvas width."),
    ("L7", "L7/L7-10-the-forge.png", "16:9", True,
     "THE FORGE — Serega forges his Scouts and Judges (training). At a blacksmith's FORGE / training "
     "ground, SEREGA the smith hammers a half-formed SCOUT figure into shape on an ANVIL, sparks flying; "
     "beside it a JUDGE figure is being drilled. A sense of practice, shaping, repetition — tongs, "
     "anvil, a glowing billet. The sparks and the glow of the hot metal are the ONLY warm-orange "
     "accents; the anvil, scout and judge are black ink + course-blue on off-white. One short "
     "hand-lettered label reads 'FORGED, NOT FOUND'. Serega's green tübetey is the ONLY green. Fills "
     "≥85% of canvas width."),
    ("L7", "L7/L7-11-the-archive.png", "16:9", True,
     "THE ARCHIVE — Serega builds the index offline. A VAST pre-built ARCHIVE: towering rows of shelves "
     "and a giant card-catalog being filled and organised. SEREGA, up a small library ladder, files one "
     "long row of identical cards into the index. NO reader, NO query present — this is build-time, done "
     "in advance. Receding shelves to a vanishing point convey scale. One warm-orange accent on the "
     "single card Serega is filing; shelves and cards black ink + course-blue on off-white. One short "
     "hand-lettered label reads 'BUILT AHEAD'. Serega's green tübetey is the ONLY green. Reads 'the whole "
     "corpus filed away before any question'. Fills ≥85% of canvas width."),
    ("L7", "L7/L7-12-the-product.png", "16:9", True,
     "THE PRODUCT — Serega ships the cascade inside a real search / RAG assistant. LEFT: the SCOUT→JUDGE "
     "hand-off (a few warm-orange shortlist dots passing from blue scouts to a judge's bench). RIGHT: "
     "that feeds a single ANSWER DESK where SEREGA, as the assistant, hands a finished ANSWER SHEET to a "
     "waiting USER figure; a small warm-orange CITATION TAG is clipped to the sheet (the grounding). The "
     "flow reads left→right: sweep → judge → deliver a sourced answer. One short hand-lettered label "
     "reads 'SOURCED ANSWER'. Serega's green tübetey is the ONLY green; warm-orange ONLY on the shortlist "
     "dots and the citation tag; everyone and everything else black ink + course-blue on off-white. "
     "Fills ≥85% of canvas width."),

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
     "two diverging line graphs: a rising WARM-ORANGE line 'CTR' (the gamed metric) and a falling "
     "dotted BLACK-INK line 'real satisfaction', with a grinning trickster (Goodhart the Trickster) "
     "yanking the CTR line up with a clickbait fishing-hook; hand-lettered 'when a measure becomes a "
     "target'. Palette is black ink + course-blue + warm-orange only — NO green, NO red anywhere."),
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
    # Idea/analogy plates (NOT data figures — the deck/Book widgets carry every number). Serega IS the
    # Standard-Bearer: he is the recurring hero across all six plates, raising the one banner and
    # marshalling the host. Wait-But-Why hand-lettered humor (a few SHORT English labels + googly-eyed
    # bystanders) is back. Palette: black ink + course-blue #2A6FDB + warm-orange #E8743B on off-white
    # #FBFAF6; GREEN appears ONLY on Serega's tübetey (has_serega=True).
    ("L8", "L8/L8-00-the-alliance.png", "16:9", True,
     "HERO ESTABLISHING SHOT — two armies unite under Serega's banner. LEFT: an ANGULAR, GEOMETRIC "
     "column of small figures (the lexical / sparse army, course-blue) marching in from the left, all "
     "sharp facets and straight edges. RIGHT: a FLOWING, ROUNDED column (the semantic / dense army, "
     "course-blue) sweeping in from the right, all soft curves. AT CENTRE, on a low rise where the two "
     "columns meet and merge, SEREGA stands as the STANDARD-BEARER, both hands raising ONE TALL BANNER "
     "bearing an abstract geometric emblem (the only warm-orange in the frame), a proud little smile on "
     "his face; the two armies look up and rally to his banner. One small hand-lettered banner-doodle "
     "reads 'ONE BANNER'. The whole image reads 'two-into-one under Serega's single banner'. Fills ≥85% "
     "of canvas width. Serega's green tübetey is the ONLY green; warm-orange ONLY on the one banner; the "
     "two armies and the rise are black ink + course-blue on off-white."),
    ("L8", "L8/L8-01-token-muster.png", "16:9", True,
     "LATE INTERACTION as a muster Serega conducts — a FRONT ROW of small identical figures (the query "
     "tokens) faces an OPPOSITE ROW of small figures (the document tokens) across a gap. SEREGA stands "
     "to one side like a drill-sergeant, pointing, as from each FRONT figure a SINGLE bright beam shoots "
     "to the ONE opposite figure it matches best (its MaxSim partner); all other faint beams fade. One "
     "front figure is googly-eyed and delighted it found its match. A short hand-lettered label by the "
     "brightest beam reads 'BEST MATCH'. The pattern 'each token salutes its one strongest partner' is "
     "the whole image — a clean lattice of mostly-faint lines with a few bright ones. The bright matched "
     "beams are the ONLY warm-orange; Serega's green tübetey is the ONLY green; the rows of figures and "
     "faint beams are black ink + course-blue on off-white. Fills ≥85% of canvas width."),
    ("L8", "L8/L8-02-expanded-banner.png", "4:3", True,
     "SPLADE term expansion as Serega kindling extra lanterns — SEREGA holds up a SPARSE banner / small "
     "constellation where a few LITERAL points are already lit (the words you typed); with a little "
     "torch he KINDLES several FAINT RELATED points nearby (the expansion terms) that flicker to life "
     "AROUND them — the emblem grows richer WITHOUT becoming a dense field (it stays clearly sparse, "
     "lots of empty dark space remains). Serega wears a pleased 'aha' expression. ONE newly-kindled "
     "point carries the single warm-orange accent; a short hand-lettered label by a new point reads "
     "'FOUND THESE TOO'. Serega's green tübetey is the ONLY green; the literal points and connecting "
     "filaments are black ink + course-blue on off-white. Reads 'a few given points, a few more lighting "
     "up nearby, still sparse'. Fills ≥85% of canvas width."),
    ("L8", "L8/L8-03-two-rivers.png", "16:9", True,
     "HYBRID as two rivers merging under Serega's banner — TWO rivers flow toward each other and JOIN "
     "into one. The LEFT river is ANGULAR / FACETED (lexical / sparse), drawn with hard geometric bends; "
     "the RIGHT river is SMOOTH / CURVING (semantic / dense), drawn with soft meanders. They merge "
     "mid-frame into ONE BROADER, STRONGER river. SEREGA stands on the bank at the confluence, planting "
     "his ONE RAISED BANNER over the merged current and nodding in approval. Blue water for both rivers "
     "and the merged flow; Serega's one raised banner is the ONLY warm-orange; Serega's green tübetey is "
     "the ONLY green; banks and surroundings are black ink on off-white. One short hand-lettered label "
     "on the merged river reads 'STRONGER TOGETHER'. Reads 'two different waters become one stronger "
     "current under Serega's banner'. Fills ≥85% of canvas width."),
    ("L8", "L8/L8-04-the-captain-orders.png", "4:3", True,
     "LEARNING TO RANK as Serega marshalling a formation — SEREGA, as the MARSHAL and STANDARD-BEARER, "
     "arranges a SCATTERED CROWD of small figures into a CLEAN RANKED COLUMN (a single file, in order), "
     "gesturing the line into place with one outstretched arm, his banner tucked under the other. On the "
     "LEFT a disordered cluster (one figure upside-down and googly-eyed, hopelessly confused); on the "
     "RIGHT the same figures resolved into a tidy ranked column. ONE figure at the HEAD of the ordered "
     "column carries the single warm-orange accent. A short hand-lettered label over the column reads "
     "'FALL IN LINE'. Serega's green tübetey is the ONLY green; Serega, the crowd and the column are "
     "black ink + course-blue on off-white. Reads 'Serega turns chaos on the left into an ordered ranked "
     "line on the right'. Fills ≥85% of canvas width."),
    ("L8", "L8/L8-05-the-host-marches.png", "16:9", True,
     "PAYOFF — Serega leads the united host out. The whole HOST (the merged army, now in clean ranked "
     "order) marches behind SEREGA, who walks at the front holding the ONE RAISED BANNER high with a "
     "small determined smile, toward a HORIZON where faint JUMP-GATE ARCHES and a road lead off-frame "
     "(the bridge to the next quests). The marching host is black ink + course-blue on off-white; "
     "Serega's one raised banner is warm-orange; a faint hint of warm-orange marks the distant jump-gate "
     "on the horizon; Serega's green tübetey is the ONLY green — do NOT add a green alien or any green "
     "creatures, every marching figure except Serega is bare of green (any cameo creature is course-blue "
     "or black ink). One short hand-lettered label on the road ahead reads 'ONWARD'. Reads 'one ordered "
     "host under Serega's banner, marching toward the road ahead'. Fills ≥85% of canvas width."),

    # ---- L9 · Hyperspace Lanes (ANN: HNSW / IVF / PQ · production) — 10 plates, Serega in 9 ----
    ("L9", "L9/L9-00-hyperspace-lanes.png", "16:9", True,
     "HERO. Serega stands at a spaceship console pulling a big lever that opens glowing hyperspace "
     "lanes streaking across a star-field of tiny document-dots; one bold ARROW-shaped vector (Victor "
     "the Vector, the same proud arrow character as earlier lectures) streaks along a lane. Black ink "
     "+ course-blue lanes + a warm-orange lever; Serega's green tübetey is the ONLY green. Fills ≥85% width."),
    ("L9", "L9/L9-01-star-by-star-death.png", "16:9", True,
     "Serega in a tiny rowboat paddling star-to-star one at a time, exhausted, a comic sweat-drop; "
     "behind him the tall hooded cloaked Curse-of-Dimensionality Wraith (same Nazgûl-like design as "
     "earlier lectures) reaches an ink hand out to crush a distance-histogram flat into a thin spike. "
     "Conveys exact NN dies twice over (linear cost + high-d concentration). Black ink + course-blue; "
     "Serega's green tübetey the ONLY green; the Wraith is bare and wears no green."),
    ("L9", "L9/L9-02-jump-gates-hnsw.png", "16:9", True,
     "Victor the Vector (the bold arrow character) hops gate→gate→gate across a layered small-world "
     "graph — an upper-layer entry node and a denser base layer of linked nodes — following a greedy "
     "path toward a target; Serega watches, reading a little hop-counter. Black ink graph + course-blue "
     "path + warm-orange target; Serega's green tübetey is the ONLY green; Victor wears no green."),
    ("L9", "L9/L9-03-sectors-ivf.png", "4:3", True,
     "the galaxy carved into three glowing pie-slice sectors (Voronoi cells), each with a centroid star; "
     "Serega probes only the two sectors nearest his query-marker with a torch, ignoring the far sector. "
     "Black ink sectors + course-blue + a warm-orange query-marker; Serega's green tübetey is the ONLY green."),
    ("L9", "L9/L9-04-fold-the-maps-pq.png", "16:9", True,
     "Serega folding a vast star-chart down into a tiny pocket codebook of stamped tiles (product "
     "quantization: 32 bytes → 4); the big chart on the left, the compact stamped booklet on the right, "
     "a fold-arrow between them. Black ink + course-blue chart + warm-orange booklet; Serega's green "
     "tübetey is the ONLY green."),
    ("L9", "L9/L9-05-turboquant-frontier.png", "4:3", False,
     "pure-metaphor frontier plate, NO narrator figure: a spinning random-rotation prism scatters an "
     "incoming vector into a tidy bell-shaped histogram of neat per-coordinate bins (TurboQuant — "
     "online, data-oblivious, no codebook). Black ink + course-blue only; there is NO green anywhere "
     "in this image. Fills ≥85% width."),
    ("L9", "L9/L9-06-engine-room-faiss.png", "16:9", True,
     "Serega as a ship's mechanic in the engine room where humming index-racks (FAISS) line the walls "
     "and a glowing vector-database tank bubbles beside them; he holds a wrench, at home among the "
     "machines. Two short hand-lettered labels read 'FAISS' on a rack and 'vector DB' on the tank. "
     "Black ink machines + course-blue tank + warm-orange wrench; Serega's green tübetey is the ONLY green."),
    ("L9", "L9/L9-07-latency-budget.png", "16:9", True,
     "Serega watching a round SLA dial with a plain black-ink face and a single needle (NO green 'good' "
     "zone, NO colored arc on the dial face) while a request runs a little pipeline of stages; a budget "
     "meter fills part-way and stays comfortably below a marked limit line (a fast serving budget under "
     "the SLA). Black ink dial + pipeline + course-blue meter fill + a warm-orange limit line; Serega's "
     "green tübetey is the ONLY green — nothing else is green, especially not the dial face."),
    ("L9", "L9/L9-08-iceberg-returns.png", "16:9", True,
     "a big iceberg: the small tip above the waterline is the 'demo', and the huge mass below water is "
     "the 90% — serving, monitoring, index rebuilds, drift — drawn as little gear/log icons in the "
     "submerged part; Serega peers over the edge of a small boat at the waterline, worried. Black ink "
     "iceberg + course-blue water; Serega's green tübetey is the ONLY green; the iceberg has no green."),
    ("L9", "L9/L9-09-lanes-open.png", "16:9", True,
     "FINAL. Glowing hyperspace lanes lit across the whole galaxy; Serega stands proudly at the helm "
     "and points the Ship toward a distant glowing ORACLE silhouette on the horizon (the hook to the "
     "next lecture). Black ink + course-blue lanes + a warm-orange distant Oracle glow; Serega's green "
     "tübetey is the ONLY green. Fills ≥85% width."),

    # ---- L9 · Hyperspace Lanes · DEEPENING (A+ expansion, L9-1N range) — Serega in all 6 ----
    # The image-gate treats L9 as a Serega lecture (hero L9-00 + final L9-09 stay the existing
    # Serega plates); these six keep the ratio healthy and stay on-palette: black ink + course-blue
    # + warm-orange on off-white, GREEN ONLY on Serega's tübetey, the recurring cast bare-headed.
    ("L9", "L9/L9-10-three-metrics.png", "16:9", True,
     "THREE RULERS FOR 'NEAR'. Serega at a navigation table holding three different measuring "
     "instruments at once and measuring the SAME two stars with each: a straight L2 ruler (a plain "
     "ink straightedge laid between the two stars), a protractor opened to read the COSINE angle "
     "between them, and a projection-shadow gauge for the inner product (a little gnomon casting one "
     "star's shadow along the other's direction). The two stars he measures are course-blue; the one "
     "query-star he measures FROM is warm-orange. The three instruments are black ink. Conveys 'three "
     "rulers weigh direction and length differently, on one pair of points'. Serega's green tübetey is "
     "the ONLY green in the image — the instruments and stars carry no green. Fills ≥85% width."),
    ("L9", "L9/L9-11-skiplist-to-hnsw.png", "4:3", True,
     "THE HNSW LINEAGE — skip-list to NSW to HNSW. Serega climbs a tall tower of stacked EXPRESS "
     "BALCONIES (skip-list lanes: a sparse top balcony with few rails, each balcony below it denser) "
     "and the bottom balconies descend onto a dense WEB of walkways (the small-world base layer of "
     "linked nodes). The express rails up the tower are warm-orange; the dense base web of walkways "
     "and nodes is black ink + light course-blue. Serega is partway up, one hand on a rail, reading "
     "the descent from sparse express lanes down into the dense graph below. Conveys the "
     "skip-list → NSW → HNSW lineage as one climbable structure. Serega's green tübetey is the ONLY "
     "green; the tower and web carry no green. Fills ≥85% width."),
    ("L9", "L9/L9-12-ef-knob.png", "16:9", True,
     "THE ef KNOB widens the search frontier. Serega turns a large labelled dial — one short "
     "hand-lettered label reads 'ef' on the dial face — and as he turns it a widening FAN of "
     "candidate-beams sweeps outward from the start, past a little LOCAL-MINIMUM PIT (a small ink "
     "crater the narrow beam would fall into) and reaches the true target star beyond it. A small "
     "recall GAUGE beside the dial climbs as the fan widens (a needle rising toward full). The "
     "candidate-beams are course-blue; the true target star is warm-orange; the dial, pit and gauge "
     "are black ink. Conveys 'a wider ef frontier escapes the local-minimum trap and lifts recall'. "
     "Serega's green tübetey is the ONLY green; the dial face has NO green zone and nothing else is "
     "green. Fills ≥85% width."),
    ("L9", "L9/L9-13-codebook-training.png", "4:3", True,
     "TRAINING A CODEBOOK — k-means Lloyd iterations as stamping. Serega stamps a sheet of tiles: a "
     "scatter of small black-ink points is herded over TWO passes toward two CENTROID-STAMPS, the "
     "points clustering tighter around the two stamps on the second pass than the first (show the "
     "before/after as two small panels or a left-to-right progression). The two centroid-stamps are "
     "course-blue; the moving assignment-arrows that reassign points to their nearer centroid are "
     "warm-orange; the scattered points are black ink. Serega holds the stamp, mid-press, a satisfied "
     "look as the clusters tighten. Conveys 'Lloyd's k-means: assign, recompute, the inertia falls'. "
     "Serega's green tübetey is the ONLY green; the tiles, points and centroids carry no green. "
     "Fills ≥85% width."),
    ("L9", "L9/L9-14-adc-table.png", "16:9", True,
     "ADC — distance from a table lookup. Serega reads a 4×4 DISTANCE-TABLE GRID pinned to the wall "
     "(a clean checkerboard of small ink cells, rows = subspaces, columns = centroids) and traces "
     "FOUR code-arrows — one per subspace — each dropping from a stored code down to one cell of the "
     "grid; he tallies the four looked-up cells on a small running SUM tally beside the grid. The "
     "grid and cells are black ink; the four code-arrows pointing into the grid are course-blue; the "
     "running sum tally is warm-orange. Conveys 'sum four table lookups, one per subspace, to score a "
     "PQ-coded vector — no full-vector math'. Serega's green tübetey is the ONLY green; the grid, "
     "arrows and tally carry no green. Fills ≥85% width."),
    ("L9", "L9/L9-15-choose-a-lane.png", "16:9", True,
     "CHOOSE A LANE — the index decision. Serega stands at a galactic junction SIGNPOST with five "
     "lane-arrows fanning off it, each a short hand-lettered label: 'Flat', 'HNSW', 'IVF', 'IVF-PQ', "
     "'HNSW-PQ' (five labels total, horizontal). He chooses by reading three little dials on a panel "
     "in his hand — one short hand-lettered label each: 'N', 'recall', 'RAM'. Victor the Vector (the "
     "bold proud arrow character) is poised at the mouth of the chosen lane, ready to launch down it. "
     "The chosen lane-arrow is warm-orange; the other four arrows and the signpost and dials are "
     "black ink + light course-blue. Conveys 'pick the index family by reading scale, recall and "
     "memory'. Serega's green tübetey is the ONLY green; Victor is bare-headed and wears no green; "
     "there is no green anywhere else. Fills ≥85% width."),

    # ---- L10 · The Oracle (RAG · chunking · query understanding) — 9 plates, Serega in 8 ----
    ("L10", "L10/L10-00-the-oracle.png", "16:9", True,
     "HERO. Serega consults RAGdoll the Oracle — the same patchwork rag-doll STITCHED from retrieved "
     "text-scrap patches with loose threads, two button eyes and a stitched smile as locked earlier — "
     "standing tall and confident, freshly fed with a stack of context-scrolls Serega hands it. "
     "RAGdoll is course-blue cloth with warm-orange patches; Serega's green tübetey is the ONLY green; "
     "RAGdoll wears no green. Fills ≥85% width."),
    ("L10", "L10/L10-01-confident-and-wrong.png", "16:9", True,
     "Serega asks a bare floating 'LLM brain'; it answers in a fluent speech-bubble that has NO source "
     "tag and a wrong date — and RAGdoll the Oracle slumps beside it, a seam visibly unravelling (stale, "
     "ungrounded). Black ink + course-blue + warm-orange unravelling thread; Serega's green tübetey is "
     "the ONLY green; the brain and RAGdoll wear no green."),
    ("L10", "L10/L10-02-retrieve-then-speak.png", "4:3", True,
     "the retrieve → augment → generate loop: Serega hands RAGdoll the Oracle a small stack of "
     "retrieved scrolls; RAGdoll reads them, THEN speaks a grounded answer in a tidy speech-bubble. A "
     "circular arrow shows the loop. Black ink + course-blue scrolls + warm-orange answer-bubble; "
     "Serega's green tübetey is the ONLY green; RAGdoll wears no green."),
    ("L10", "L10/L10-03-chunk-norris.png", "16:9", True,
     "Chunk Norris (the confident karate-master stick figure, an original character, same as earlier) "
     "roundhouse-kicks a long scroll into equal passages; in the corner the goofy friendly dinosaur "
     "Tokenosaurus snips a word into sub-word pieces; Serega holds a ruler measuring the overlap "
     "between adjacent passages so nothing falls between slices. Black ink + course-blue passages + "
     "warm-orange overlap band; Serega's green tübetey is the ONLY green; Chunk Norris and Tokenosaurus "
     "wear no green."),
    ("L10", "L10/L10-04-overlap-saves.png", "4:3", True,
     "two stacked passes over the SAME row of text, where the text is drawn as a row of small uniform "
     "word-blocks (NOT readable prose — just little rectangles) and the answer-phrase is a highlighted "
     "run of adjacent blocks. TOP pass: a hard boundary line slices through the highlighted run "
     "(size=200, no overlap); BOTTOM pass: an overlapping window encloses the whole highlighted run "
     "intact; Serega points at the rescued run with a small grin. Only three short hand-lettered labels — "
     "'size=200', 'overlap', 'rescued'. Black ink blocks + course-blue windows + a warm-orange "
     "highlighted run; Serega's green tübetey is the ONLY green."),
    ("L10", "L10/L10-05-hear-the-real-question.png", "16:9", True,
     "Serega cups a hand to his ear; two speech-bubbles float toward a single query-slot — one is the "
     "captain's LITERAL short words, the other the fuller TRUE intent behind them — and they converge "
     "into one combined query card. NO creature in this plate, Serega only. Black ink + course-blue "
     "bubbles + a warm-orange query-slot; Serega's green tübetey is the ONLY green."),
    ("L10", "L10/L10-06-hyde-hypothetical.png", "4:3", False,
     "pure-metaphor plate, NO narrator figure: a ghostly dashed-outline 'hypothetical document' is cast "
     "like a lure on a line into an embedding-space pond of dots, and it pulls the one true document-dot "
     "up to the surface (HyDE). Black ink + course-blue pond only; there is NO green anywhere in this "
     "image. Fills ≥85% width."),
    ("L10", "L10/L10-07-garbage-in.png", "16:9", True,
     "Confabulous — the same wispy translucent phantom drawn as a thin black-ink outline with a "
     "too-wide showman's grin as locked earlier — hands RAGdoll the Oracle a forged 'trust me' "
     "citation-scroll; RAGdoll, fed the garbage, recites it confidently. Its speech-bubble contains the "
     "single clearly-lettered word 'GARBAGE' above two struck-through wavy scribble-lines (obvious "
     "nonsense, NOT real words or letters); Serega frowns and folds his arms. Black ink phantom + "
     "course-blue + a warm-orange forged scroll; Serega's green tübetey is the ONLY green; Confabulous "
     "and RAGdoll wear no green."),
    ("L10", "L10/L10-08-it-speaks.png", "16:9", True,
     "FINAL. RAGdoll the Oracle stands tall and speaks a grounded, cited answer (a tidy speech-bubble "
     "with little source-tags); Serega nods approvingly — then glances up at a question-mark just "
     "forming over his head (the hook: but is it true?). Black ink + course-blue + warm-orange "
     "source-tags; Serega's green tübetey is the ONLY green; RAGdoll wears no green. Fills ≥85% width."),

    # ---- L10 · The Oracle · DEEPENING (A+ expansion, L10-1N range) — Serega in 5; two abstract ----
    # Same gate posture as the L10 block above (hero L10-00 + final L10-08 stay Serega plates).
    # Five plates feature Serega; the two pure-metaphor plates (late-chunking, self-RAG mirror) have
    # NO narrator and therefore NO green anywhere. Palette throughout: black ink + course-blue +
    # warm-orange on off-white; GREEN ONLY on Serega's tübetey; the recurring cast bare-headed.
    ("L10", "L10/L10-09-late-chunking.png", "4:3", False,
     "LATE CHUNKING — embed first, cut after. Two embedding diagrams side by side, pure metaphor, NO "
     "narrator figure. LEFT (naïve chunk-then-embed): a stack of separate isolated BUBBLES, each one "
     "a single chunk embedded ALONE, the bubbles drawn far apart and unconnected so each clearly "
     "forgets its neighbours. RIGHT (late chunking): one long continuous RIBBON embedded WHOLE in a "
     "single pass, and only THEN sliced by clean cut-lines into chunks — the slices stay part of the "
     "one ribbon. A small contrast between 'isolated bubbles' and 'one ribbon, then sliced' is the "
     "whole point. Black ink + course-blue only; warm-orange ONLY as the thin slice/cut-lines on the "
     "ribbon. There is NO narrator in this scene, so there is NO green anywhere in the image. "
     "Fills ≥85% width."),
    ("L10", "L10/L10-10-raptor-tree.png", "16:9", True,
     "RAPTOR — a tree of recursive summaries. RAGdoll the Oracle (the patchwork rag-doll stitched "
     "from text-scrap patches with loose threads, two button eyes and a stitched smile, as locked) "
     "stacks scraps into a PYRAMID: many leaf-scraps at the wide bottom are summarised UP into fewer "
     "summary-scraps in the middle, which summarise UP into ONE root-scrap at the apex (a clear "
     "many → fewer → one tree). Serega stands beside the pyramid and POINTS at the level his question "
     "lands on (one mid-level node). The scraps and tree are course-blue cloth + black ink; "
     "warm-orange ONLY on RAGdoll's patches and the thread that ties the levels. Conveys 'leaves → "
     "summaries → root; retrieve at the altitude the question needs'. Serega's green tübetey is the "
     "ONLY green; RAGdoll is bare-headed and wears no green. Fills ≥85% width."),
    ("L10", "L10/L10-11-rag-fusion.png", "4:3", True,
     "RAG-FUSION — consensus over paraphrase rankings (RRF). THREE Serega speech-bubbles (the same "
     "question paraphrased three ways) each cast a FISHING LINE into the SAME pond of "
     "document-dots — three lines from three bubbles into one shared pond. The lines' pulls act as "
     "votes that together haul ONE consensus document-dot up to the surface (the doc the paraphrases "
     "agree on). Only ONE Serega in the scene (the three bubbles are his paraphrases, drawn as plain "
     "speech-clouds, not three clones). The pond and dots are course-blue + black ink; the three "
     "fishing lines are black ink; warm-orange ONLY on the one consensus dot rising to the surface. "
     "Conveys 'reciprocal rank fusion: the doc several phrasings agree on wins'. Serega's green "
     "tübetey is the ONLY green; there is no green anywhere else. Fills ≥85% width."),
    ("L10", "L10/L10-12-decompose.png", "16:9", True,
     "DECOMPOSITION — split the compound question. Chunk Norris (the confident karate-master stick "
     "figure, an original character, same as earlier) CHOPS one big question-SCROLL into TWO "
     "sub-question scrolls with a clean karate strike; Serega stands to the side and COLLECTS both "
     "sub-answers (a small slip from each sub-scroll) to stitch into one. The scrolls are black ink "
     "+ light course-blue; warm-orange ONLY as the thin motion-arc of Chunk Norris's chopping strike. "
     "Conveys 'a two-part question fans into two atomic retrievals, then recombine'. Serega's green "
     "tübetey is the ONLY green; Chunk Norris is bare-headed and wears no green; there is no green "
     "anywhere else. Fills ≥85% width."),
    ("L10", "L10/L10-13-switchboard.png", "16:9", True,
     "LOGICAL / SEMANTIC ROUTING — pick the destination. Serega stands at a telephone SWITCHBOARD, "
     "plugging a single query-CABLE into the RIGHT source-pipe among THREE labelled sockets (a "
     "dispatcher choosing where the query goes). The three source-pipes lead off to three different "
     "destinations (drawn as three distinct little back-end icons — e.g. a doc-stack, a database "
     "drum, a globe). The switchboard and three pipes are black ink + light course-blue; warm-orange "
     "ONLY on the one query-cable Serega is plugging into the chosen socket. Conveys 'route the query "
     "to the right corpus/tool before retrieving'. Serega's green tübetey is the ONLY green; there is "
     "no green anywhere else. Fills ≥85% width."),
    ("L10", "L10/L10-14-crag-inspect.png", "4:3", True,
     "CRAG — grade the retrieval, then correct. RAGdoll the Oracle (the patchwork rag-doll as locked) "
     "holds each retrieved SCRAP up to a MAGNIFYING GLASS and stamps it with one of three marks — a "
     "check ✓, a cross ✗, or a question-mark ? — before stitching the good ones in; one rejected "
     "scrap (stamped ✗) is being tossed toward a labelled 'web' BASKET (the fall-back to web search). "
     "Serega watches at the side, arms folded, approving the inspection. The scraps, magnifier and "
     "basket are black ink + course-blue cloth; warm-orange ONLY on RAGdoll's patches and the stamp "
     "marks. Conveys 'evaluate each retrieval correct / ambiguous / wrong, then keep, augment, or "
     "discard'. Serega's green tübetey is the ONLY green; RAGdoll is bare-headed and wears no green; "
     "the 'web' basket and marks carry no green. Fills ≥85% width."),
    ("L10", "L10/L10-15-self-rag-mirror.png", "4:3", True,
     "SELF-RAG — the model critiques itself. RAGdoll the Oracle (the patchwork rag-doll as locked) "
     "glances into a MIRROR mid-stitch — needle and thread in hand, half-stitched — and in the "
     "reflection asks ITSELF whether it even needs to retrieve (a small thought-bubble over the "
     "mirror-image holds a plain question-mark glyph '?', the only glyph in the image). Serega stands "
     "quietly at the edge of the frame, a small approving observer of RAGdoll's self-reflection, not "
     "the focus. RAGdoll and the mirror are course-blue cloth + black ink; warm-orange ONLY on "
     "RAGdoll's patches and the loose thread. Conveys 'reflection tokens: decide whether to retrieve, "
     "then self-critique'. RAGdoll is bare-headed and wears no green, and neither does its "
     "reflection; Serega's green tübetey is the ONLY green in the image. Fills ≥85% width."),

    # ── L11 "Judging the Oracle" (RAG evaluation + agentic). Goodhart the Trickster gets his
    #    Measure-villain climax. hero (00) + final (08) feature Serega; Serega ratio 3/5 = 60%. ──
    ("L11", "L11/L11-00-judging-the-oracle.png", "16:9", True,
     "HERO. Serega the host stands before RAGdoll the Oracle (the patchwork rag-doll STITCHED from "
     "retrieved text-scrap patches with two button eyes and a stitched smile, as locked) and holds up "
     "a RUBRIC SCORECARD — a small clipboard with four tick-boxes (a scale, a checkmark, a magnifier, "
     "a net) — grading the Oracle's freshly-spoken answer-scroll. Serega's expression is discerning, "
     "weighing. Black ink + course-blue (RAGdoll cloth + clipboard) + warm-orange (the answer-scroll); "
     "Serega's green tübetey is the ONLY green; RAGdoll wears no green. No lettered title bar. Fills ≥85% width."),
    ("L11", "L11/L11-04-goodhart-returns.png", "16:9", False,
     "Goodhart the Trickster returns — the small sly grinning trickster with impish pointy features "
     "(locked design) — sneaking to a JUDGE'S desk and pressing a thumb on the scale, tilting a balance "
     "so a fat padded answer-scroll outweighs a slim correct one. The judge is a plain bare-headed stick "
     "figure wearing a blindfold. NO Serega in this scene, so NO green anywhere at all. Black ink + "
     "warm-orange (the tilted scale + padding) only. Conveys 'optimise the metric and you game it, not "
     "the quality — the score becomes a target'. No lettered title bar."),
    ("L11", "L11/L11-05-judge-gamed.png", "16:9", False,
     "two answer-cards before a bare-headed judge: a SHORT card (correct, tidy) and a LONG verbose card "
     "(the same content padded and stretched, repetitive); the judge's hand reaches for the LONG one. A "
     "small ruler shows the long card is merely bigger, not better. NO Serega in this scene, so NO green "
     "anywhere. Black ink + course-blue cards + warm-orange ruler only. Conveys verbosity bias in an "
     "LLM judge. No lettered title bar."),
    ("L11", "L11/L11-06-self-rag.png", "4:3", True,
     "the self-correcting loop: RAGdoll the Oracle reads a retrieved scroll, then re-reads its OWN draft "
     "answer through a small magnifier, crossing out one unsupported line and rewriting it; a circular "
     "arrow shows the retrieve→grade→correct loop. Serega stands quietly at the edge as a small approving "
     "observer, not the focus. Black ink + course-blue scrolls + warm-orange correction-mark; Serega's "
     "green tübetey is the ONLY green; RAGdoll wears no green. No lettered title bar."),
    ("L11", "L11/L11-08-grades-itself.png", "16:9", True,
     "FINAL. Serega stands proud beside RAGdoll the Oracle, who now holds up its OWN answer next to a "
     "small self-grading checklist — every box ticked, one line corrected — the Ship grades and corrects "
     "itself. A confident, resolved mood; a faint gateway-light ahead hints at the next frontier. Black "
     "ink + course-blue + warm-orange; Serega's green tübetey is the ONLY green; RAGdoll wears no green. "
     "No lettered title bar. Fills ≥85% width."),

    # ── L12 "The Deep Field" (advanced RAG · multimodal · ethics). Sir Cosine rules the shared CLIP
    #    space; arc-level helm handoff. hero (00) + final (08) feature Serega; Serega ratio 5/9 = 56%. ──
    ("L12", "L12/L12-00-the-deep-field.png", "16:9", True,
     "HERO. Serega the host stands at the prow of the Ship gazing into THE DEEP FIELD — a vast star-field "
     "where distant records glow as points and faint lines hint at links between them. He holds a small "
     "spyglass; awe and resolve. Black ink + course-blue starfield + warm-orange spyglass-glint; Serega's "
     "green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    ("L12", "L12/L12-01-constellation.png", "16:9", False,
     "a CONSTELLATION GRAPH: glowing star-nodes (entities) joined by faint lines (relations), with a path "
     "of THREE linked stars highlighted to show a multi-hop chain across the dark — distant stars cannot "
     "be reached in a single leap, only by hopping the links. NO Serega in this scene, so NO green "
     "anywhere. Black ink + course-blue stars + warm-orange highlighted path only. No lettered title bar."),
    ("L12", "L12/L12-02-shared-space.png", "4:3", True,
     "Serega holds up TWO cards that snap together in one shared space — a small picture-card (an image) "
     "and a word-card (its caption) — joined by a short warm-orange tether showing they sit close; other "
     "mismatched picture/word cards drift far apart. Conveys 'an image and its caption are neighbours in "
     "one space'. Black ink + course-blue cards + warm-orange tether; Serega's green tübetey is the ONLY "
     "green. No lettered title bar."),
    ("L12", "L12/L12-03-sir-cosine-crossmodal.png", "4:3", True,
     "Sir Cosine — Serega dressed as the stick-figure knight (locked design) — stands between a PICTURE "
     "and a WORD and measures the ANGLE between them with a knightly protractor-compass, the small angle "
     "meaning 'a match'. Conveys CLIP = cosine in a shared space, now across modalities. Black ink + "
     "course-blue + warm-orange protractor; Sir Cosine's green cap is the ONLY green. No lettered title bar."),
    ("L12", "L12/L12-04-colpali.png", "16:9", False,
     "a vision-language 'eye' reads a whole DOCUMENT PAGE as an image — patches of the page (a table, a "
     "figure, a paragraph) glow as it retrieves directly from the pixels, no OCR; a magnifier hovers over "
     "the page. NO Serega in this scene, so NO green anywhere. Black ink + course-blue page + warm-orange "
     "glowing patches only. No lettered title bar."),
    ("L12", "L12/L12-05-the-helm.png", "4:3", False,
     "the Ship's HELM — a ship's wheel at the bridge — lit and ready, the deep-field starlight beyond the "
     "viewport, waiting for a hand to take it. NO Serega in this scene, so NO green anywhere. Black ink + "
     "course-blue wheel + warm-orange console-glow only. No lettered title bar."),
    ("L12", "L12/L12-06-the-captain.png", "16:9", True,
     "Serega as the responsible CAPTAIN, one hand on the helm, weighing a decision: a small balance holds "
     "'cite + ground + abstain' on one pan against a tempting fluent-but-unsourced answer on the other — "
     "he chooses the grounded pan. Conveys 'with power, responsibility — the captain answers for the "
     "Ship'. Black ink + course-blue + warm-orange balance; Serega's green tübetey is the ONLY green. No "
     "lettered title bar."),
    ("L12", "L12/L12-07-mapped.png", "16:9", False,
     "the once-deep field now MAPPED — the star-field laced with bright routes connecting clusters of "
     "records, the whole galaxy charted as four linked regions (get data → measure → rank → generate) "
     "without any text labels. NO Serega in this scene, so NO green anywhere. Black ink + course-blue map "
     "+ warm-orange routes only. No lettered title bar."),
    ("L12", "L12/L12-08-helm-handoff.png", "16:9", True,
     "FINAL. Serega turns and HANDS THE HELM to YOU — offering the ship's wheel forward out of the frame, "
     "the mapped deep-field glowing behind him, a warm proud send-off into the Defense. Black ink + "
     "course-blue + warm-orange; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),

    # ── L11 expansion (5 → 13 plates): one plate per divider + the key worked/concept slides. The new
    #    highest-numbered plate (L11-12) is the Serega finale (image-gate sorts by filename). ──
    ("L11", "L11/L11-01-fluent-but-wrong.png", "16:9", True,
     "Serega frowns at RAGdoll the Oracle, which delivers a fluent answer-scroll stamped with a big "
     "confident seal — but the scroll has NO source tag and a wrong date circled. Conveys 'fluent does "
     "not mean correct; you cannot grade it by how confident it sounds'. Black ink + course-blue scroll "
     "+ warm-orange wrong-date circle; Serega's green tübetey is the ONLY green; RAGdoll wears no green."),
    ("L11", "L11/L11-02-four-metrics.png", "4:3", True,
     "Serega lays out a RAGAS scorecard with FOUR labelled dials — faithfulness, answer-relevance, "
     "context-precision, context-recall — each a little gauge needle. Conveys the four-way decomposition "
     "of RAG quality. Black ink + course-blue dials + warm-orange needles; Serega's green tübetey is the "
     "ONLY green. No lettered title bar."),
    ("L11", "L11/L11-03-faithfulness-claims.png", "16:9", False,
     "RAGdoll the Oracle's answer-scroll is split into four claim-strips; a magnifier checks each against "
     "a stack of retrieved context-cards — three strips get a check, one (an unsupported claim) gets a "
     "cross. NO Serega in this scene, so NO green anywhere. Black ink + course-blue cards + warm-orange "
     "cross only. Conveys faithfulness = supported claims / all claims."),
    ("L11", "L11/L11-07-react-loop.png", "4:3", True,
     "Serega watches a small agent walk a ReAct loop drawn as a circle: Thought → Action (a lookup) → "
     "Observation, then round again, a second lookup landing the missing fact. Conveys the agentic "
     "reason-act loop. Black ink + course-blue loop arrows + warm-orange observation-cards; Serega's "
     "green tübetey is the ONLY green. No lettered title bar."),
    ("L11", "L11/L11-09-position-bias.png", "16:9", False,
     "Goodhart the Trickster (the small sly grinning trickster with impish pointy features, locked "
     "design) swaps the LEFT/RIGHT order of two answer-cards before a blindfolded judge — and the judge's "
     "verdict flips with the position, not the content. NO Serega, so NO green anywhere. Black ink + "
     "warm-orange swap-arrows only. Conveys position bias in an LLM judge."),
    ("L11", "L11/L11-10-eval-matrix.png", "16:9", True,
     "Serega studies a comparison wall-chart with three columns — RAGAS, LLM-judge, human — and rows of "
     "ticks/crosses for what each catches and misses. Conveys 'pick the evaluator that fits the task'. "
     "Black ink + course-blue chart + warm-orange ticks; Serega's green tübetey is the ONLY green. No "
     "lettered title bar."),
    ("L11", "L11/L11-11-self-rag-crag.png", "4:3", False,
     "two small decision-diamond flows side by side: one grades each retrieval correct/ambiguous/wrong "
     "and branches (CRAG), the other emits reflection-token gates in a chain (self-RAG). NO Serega in "
     "this scene, so NO green anywhere. Black ink + course-blue diamonds + warm-orange branch-arrows "
     "only. Conveys the structured agentic cousins of free-form ReAct."),
    ("L11", "L11/L11-12-the-verdict.png", "16:9", True,
     "FINAL. Serega stands confident beside RAGdoll the Oracle, holding up a stamped VERDICT card with a "
     "clean checkmark — the Ship now grades AND corrects itself, ready for the frontier. A warm, resolved "
     "send-off mood. Black ink + course-blue + warm-orange; Serega's green tübetey is the ONLY green; "
     "RAGdoll wears no green. No lettered title bar. Fills ≥85% width."),

    # ── L12 expansion (9 → 16 plates): one plate per divider + worked/concept slide. New highest-numbered
    #    plate (L12-15) is the Serega finale. ──
    ("L12", "L12/L12-09-single-hop-trap.png", "16:9", False,
     "a single retrieval beam reaches ONE far star (record) and stops — a second, linked star stays dark "
     "and unreached, so a multi-step question goes unanswered. NO Serega in this scene, so NO green "
     "anywhere. Black ink + course-blue stars + warm-orange beam only. Conveys 'flat single-hop retrieval "
     "cannot chain across records'. No lettered title bar."),
    ("L12", "L12/L12-10-community-summaries.png", "4:3", False,
     "the constellation graph is encircled into TWO communities, each with a small folded summary-card "
     "beside it; a broad question is answered from the two summary-cards (global view), while a thin "
     "bridge-edge links the communities. NO Serega in this scene, so NO green anywhere. Black ink + "
     "course-blue communities + warm-orange summary-cards only. Conveys GraphRAG community summaries."),
    ("L12", "L12/L12-11-clip-topk.png", "4:3", True,
     "Sir Cosine — Serega dressed as the stick-figure knight (locked design) — holds one picture-card and "
     "a RANKED stack of caption-cards beside it: the matching caption sits on top (rank 1), the rest "
     "below. Conveys CLIP top-k retrieval: the right caption is the nearest. Black ink + course-blue "
     "cards + warm-orange rank-1 marker; Sir Cosine's green cap is the ONLY green. No lettered title bar."),
    ("L12", "L12/L12-12-ethics-bias.png", "16:9", False,
     "a retrieval funnel pours records into an answer, and a skewed scale shows some groups over- and "
     "under-represented — the bias the corpus and model carry through. NO Serega in this scene, so NO "
     "green anywhere. Black ink + course-blue funnel + warm-orange skewed-scale only. Conveys corpus + "
     "model bias in RAG. No lettered title bar."),
    ("L12", "L12/L12-13-attribution.png", "16:9", True,
     "Serega the captain points to an answer that carries clear CITATION tags linking each sentence back "
     "to its source-card — provenance you can inspect and contest. Black ink + course-blue source-cards "
     "+ warm-orange citation-threads; Serega's green tübetey is the ONLY green. Conveys attribution / "
     "verifiable provenance. No lettered title bar."),
    ("L12", "L12/L12-14-bestiary-bow.png", "16:9", True,
     "the recurring cast takes a small closing bow in a row with Serega at the centre: RAGdoll the Oracle, "
     "Sir Cosine, Goodhart the Trickster, Chunk Norris and Tokenosaurus (each in their locked design), a "
     "warm curtain-call. Black ink + course-blue + warm-orange; ONLY Serega's green tübetey and Sir "
     "Cosine's green cap are green; every other character is bare-headed with no green. No lettered title bar."),
    ("L12", "L12/L12-15-defense-doorway.png", "16:9", True,
     "FINAL. Serega stands at a glowing doorway labelled by an arrow (no text) onto the next stage, "
     "gesturing YOU through — the mapped deep-field behind, the Defense ahead. A warm, proud, send-off "
     "mood. Black ink + course-blue doorway-glow + warm-orange arrow; Serega's green tübetey is the ONLY "
     "green. No lettered title bar. Fills ≥85% width."),

    # ── L13 "The Crucible of Negatives" (hard-negative mining for dense retrieval). Metaphor: Serega is a
    #    BLADE forged in a crucible; negatives are sparring opponents. Forge/duel (00–11) pivots to the
    #    master-smith / tutelage (12). NEW mascots: the Impostor (false negative) + the Sparring Ghosts
    #    (stale negatives). hero (00) + final (14) feature Serega; Serega ratio 13/15 = 87%. ──
    ("L13", "L13/L13-00-the-crucible.png", "16:9", True,
     "HERO. Serega the host stands at a glowing forge gripping tongs that hold his own unfinished sword-blade "
     "in the white-hot CRUCIBLE — sparks rising, resolve on his face, about to be tempered by the fight ahead. "
     "Black ink + course-blue + warm-orange forge-glow; Serega's green tübetey is the ONLY green. No lettered "
     "title bar. Fills ≥85% width."),
    ("L13", "L13/L13-01-two-blades.png", "4:3", True,
     "Serega holds up TWO sword-blades that look identical; the LEFT one slices a ribbon clean while the RIGHT "
     "one bends limp and useless — same forge, same steel, only the sparring differed. Conveys 'same model, "
     "very different result — the negatives decided it'. Black ink + course-blue + one warm-orange ribbon; "
     "Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L13", "L13/L13-02-empty-arena.png", "16:9", True,
     "DIVIDER mood. Serega swings his blade at EMPTY air in a bare practice arena; with no opponent the edge "
     "stays dull and unhoned, his swing collapsing inward — 'no negatives, nothing to push against, the "
     "embedding collapses'. Black ink + course-blue arena + a faint warm-orange swing-arc; Serega's green "
     "tübetey is the ONLY green. No lettered title bar."),
    ("L13", "L13/L13-03-in-batch-arena.png", "4:3", True,
     "Serega spars in a busy ring against a WHOLE ROW of free practice partners pulled from the same training "
     "batch — each other fighter is somebody else's match, reused as his opponent for free (the in-batch grid). "
     "Black ink + course-blue partners + warm-orange ring-rope; Serega's green tübetey is the ONLY green. No "
     "lettered title bar."),
    ("L13", "L13/L13-04-sir-cosine-hardness.png", "4:3", True,
     "Sir Cosine — Serega dressed as the stick-figure knight (locked design) — stands on a glowing warm-orange "
     "unit-arc and measures the ANGLE to THREE opponents: a far one (easy, wide angle), a mid one (semi-hard), "
     "and a near one crowding his guard (hard, small angle). Conveys 'hardness = closeness in angle'. Black ink "
     "+ course-blue + warm-orange arc; Sir Cosine's green cap is the ONLY green. No lettered title bar."),
    ("L13", "L13/L13-05-shattered-blade.png", "4:3", True,
     "Serega's blade SHATTERS into shards as he strikes an impossibly over-spiked monster-opponent head-on — "
     "the very hardest negative breaks the training instead of sharpening it (FaceNet's collapse). His face: "
     "alarm. Black ink + course-blue + warm-orange spark of the break; Serega's green tübetey is the ONLY "
     "green. No lettered title bar."),
    ("L13", "L13/L13-06-forge-path.png", "16:9", False,
     "DIVIDER. A winding forge-PATH of milestone anvils marching forward into the distance, each anvil a stage "
     "of the craft — a tiny pebble, then a wooden dummy, then a sparring partner, then a mirror, then a "
     "filtered flame — showing the history of how opponents got chosen, with no figures present. NO Serega in "
     "this scene, so NO green anywhere. Black ink + course-blue anvils + warm-orange path only. No lettered "
     "title bar."),
    ("L13", "L13/L13-07-mirror-opponent.png", "16:9", True,
     "Serega faces his OWN reflection stepping out of a tall mirror to spar him — the model mining its own "
     "current near-misses as opponents. The mirror-Serega is a faint course-blue echo (a reflection, not a "
     "second character). Black ink + course-blue mirror + warm-orange glint; the real Serega's green tübetey "
     "is the ONLY green, and the reflection carries no separate green. No lettered title bar."),
    ("L13", "L13/L13-15-gradient-budget.png", "4:3", True,
     "Serega as quartermaster of the forge holds ONE small pouch of glowing warm-orange sparks — the whole "
     "gradient budget — and pours nearly all of it over the single opponent crowding his guard, while a line "
     "of far-away easy opponents get barely a fleck each and shrug, unpaid. Conveys 'each negative's push is "
     "a softmax share: easy ones earn ~zero, the near one takes the budget'. Black ink + course-blue "
     "opponents + warm-orange sparks; Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L13", "L13/L13-08-sparring-ghosts.png", "4:3", True,
     "Serega has moved on to a fresh stance while the Sparring Ghosts — translucent faded after-images of "
     "opponents he already beat — keep shadow-boxing an OLD position behind him, growing stale and easy "
     "(negatives going stale between index refreshes). Black ink + faint course-blue ghosts + warm-orange "
     "accent on Serega's fresh guard; Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L13", "L13/L13-09-the-impostor.png", "4:3", True,
     "Serega freezes mid-strike facing the Impostor — a masked duelist whose fencing mask is HALF-LIFTED to "
     "reveal a friendly warm-orange plus-badge underneath: the 'enemy' he was about to push away is actually "
     "an ally (an unlabelled positive). Serega's blade hesitates. Black ink + course-blue + warm-orange "
     "plus-badge; Serega's green tübetey is the ONLY green, the Impostor is bare-headed with no green. No "
     "lettered title bar."),
    ("L13", "L13/L13-10-two-by-two.png", "4:3", False,
     "A clean 2x2 quadrant chart drawn as a grid: the horizontal axis runs easy→hard (far opponent → "
     "close-crowding opponent), the vertical axis runs true↔false (a plain fighter ↔ a masked plus-badge "
     "ally); four small opponent-silhouettes sit one per cell, and the HARD-and-TRUE cell glows warm-orange as "
     "the target. NO Serega in this scene, so NO green anywhere. Black ink + course-blue grid + warm-orange "
     "target cell only. No lettered title bar."),
    ("L13", "L13/L13-11-blade-dulls.png", "16:9", True,
     "Serega strikes the Impostor — and his own keen blade visibly DULLS and chips from the blow, because "
     "pushing away a hidden ally drags his true target with it; Goodhart the Trickster smirks in the corner, "
     "pleased that a metric is being chased blind. Black ink + course-blue + a warm-orange chip-mark; Serega's "
     "green tübetey is the ONLY green, while the Impostor and Goodhart are bare-headed with no green. No "
     "lettered title bar."),
    ("L13", "L13/L13-12-master-smith.png", "4:3", True,
     "DIVIDER, mood shifts from duel to tutelage: a wise old master-smith (a bare-headed mentor figure) holds "
     "Serega's blade up to the light and GRADES each of his practice blows on a small tally, teaching him by "
     "degree instead of a blunt win/lose — the distillation teacher scoring soft margins. Serega watches as "
     "the eager apprentice. Black ink + course-blue + warm-orange tally-marks; Serega's green tübetey is the "
     "ONLY green, the master-smith is bare-headed with no green. No lettered title bar."),
    ("L13", "L13/L13-13-modern-forge.png", "16:9", True,
     "Serega works a modern TWIN-forge: on one side a vast furnace roaring with a huge crowd of sparks (a "
     "massive in-batch of easy opponents, spreading the heat evenly), on the other a delicate pair of tongs "
     "selecting just a FEW carefully-filtered glowing-hot sparks (a handful of mined, denoised hard negatives) "
     "to fold into the edge. Black ink + course-blue + warm-orange sparks; Serega's green tübetey is the ONLY "
     "green. No lettered title bar."),
    ("L13", "L13/L13-14-true-edge.png", "16:9", True,
     "FINAL. Serega raises the finished, keen TRUE-EDGED blade in a proud salute; behind him the worthy "
     "opponents he trained against — including the unmasked Impostor and the faded Sparring Ghosts — give a "
     "small respectful bow, and he gestures the path onward toward the next deep-dive. Warm, earned send-off. "
     "Black ink + course-blue + warm-orange edge-gleam; Serega's green tübetey is the ONLY green. No lettered "
     "title bar. Fills ≥85% width."),

    # ---- bestiary portraits: the L11/L12 recurring cast that lacked a depicting plate ----
    ("L11", "L11/L11-13-the-re-actor.png", "16:9", True,
     "PORTRAIT. Serega meets the Re-Actor — the earnest little theatrical actor on a tiny stage, one hand "
     "raised mid-declamation, ringed by a circular loop-arrow of three beats Thought -> Action -> Observation "
     "drawn as small masks/placards, with a couple of stick-on 'take two!' self-critique notes. Serega stands "
     "beside the stage giving an encouraging thumbs-up, learning the agentic self-critique loop. One short "
     "label 'Re-Actor'. Black ink + course-blue + a warm-orange loop; Serega's green tübetey is the ONLY green; "
     "the Re-Actor is bare-headed with no green."),
    ("L12", "L12/L12-16-clippy.png", "16:9", True,
     "PORTRAIT. Serega meets Clippy — the friendly bent-wire course-blue paperclip assistant with two big "
     "googly eyes and expressive ink eyebrows, holding a small picture in one loop and a line of text in the "
     "other and snapping them together into one shared slot (image-text alignment). Serega holds up a photo for "
     "Clippy to file into the shared space. One short label 'Clippy'. Black ink + course-blue wire + a "
     "warm-orange accent where image and text align; Serega's green tübetey is the ONLY green; Clippy is a bare "
     "paperclip with no green."),
    ("L12", "L12/L12-17-joey-multihop.png", "16:9", True,
     "PORTRAIT. Serega watches Joey Multi-Hop — a cheerful course-blue cartoon kangaroo with big springy feet "
     "and a little pouch of gathered clue-cards — captured mid-bound, leaping node -> node -> node across a "
     "dotted graph of stepping-stone document-nodes, a dashed warm-orange arc tracing the chain of hops, each "
     "landing tucking one clue-card into the pouch. Serega points along the chain of hops. One short label "
     "'Joey Multi-Hop'. Black ink + course-blue + a warm-orange hop-arc; Serega's green tübetey is the ONLY "
     "green; Joey is bare-headed with no green."),

    # ---- L14 "The Artificer's Quill" (advanced query rewriting & decomposition). Metaphor: Serega is the
    #      Artificer; the enchanted Quill rewrites the captain's rough question. Antagonist: the Lexical
    #      Gremlin (vocabulary mismatch). Cameos: Sir Cosine (geometry), Goodhart (the metric). ----
    ("L14", "L14/L14-00-the-quill.png", "16:9", True,
     "HERO. Serega the Artificer sits at a writing desk holding a glowing ENCHANTED QUILL, re-inking a rough "
     "scroll-question into a cleaner one that the archive can actually read; behind him tall archive shelves, "
     "and a small Lexical Gremlin peeks warily from a shelf. Air of craft and quiet power. Black ink + "
     "course-blue + a warm-orange quill-glow; Serega's green tübetey is the ONLY green. No lettered title bar. "
     "Fills ≥85% width."),
    ("L14", "L14/L14-01-gremlin-door.png", "4:3", True,
     "The Lexical Gremlin — a small ink-outlined gatekeeper creature — guards the archive door and turns away a "
     "scroll whose WORDS do not match the words carved on the shelves, even though the true answer sits just "
     "inside. Serega watches, realising the query must be reworded, not the archive. Black ink + course-blue "
     "door + a warm-orange rejected-scroll; Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L14", "L14/L14-02-old-quill.png", "4:3", True,
     "The OLD quill: Serega holds a plain grey feather that can only copy words it already sees, re-tracing "
     "terms from a small stack of just-retrieved scrolls — it cannot invent the missing word, and a faint "
     "dashed line shows it drifting back onto its own first pass (the classical pseudo-relevance-feedback "
     "ceiling). Black ink + course-blue scrolls + a warm-orange dashed drift; Serega's green tübetey is the "
     "ONLY green. No lettered title bar."),
    ("L14", "L14/L14-03-hyde-hypothetical.png", "4:3", True,
     "HyDE: with the enchanted quill Serega drafts a HYPOTHETICAL answer-scroll — the answer he wishes he had — "
     "written in the archive's own technical wording, then folds it into a glowing lens to search with. The "
     "drafted answer, not the question, becomes the key. Black ink + course-blue + a warm-orange answer-glow; "
     "Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L14", "L14/L14-04-two-spaces.png", "4:3", True,
     "Sir Cosine (a courtly compass-and-protractor figure) shows Serega two regions on a unit circle: a "
     "QUESTION-space where the raw query sits stranded near a decoy, and a DOCUMENT-space where the drafted "
     "pseudo-answer lands right beside the true scroll. An arrow shows the nearest neighbour flipping from "
     "decoy to gold. Black ink + course-blue arcs + a warm-orange flip-arrow; Serega's green tübetey is the "
     "ONLY green; Sir Cosine is bare-headed with no green. No lettered title bar."),
    ("L14", "L14/L14-05-step-back-ladder.png", "4:3", True,
     "STEP-BACK: Serega climbs a tall ladder up from a hyper-specific little question card at the bottom to a "
     "broad PRINCIPLE inscribed on a high shelf, retrieves the principle, then points back down to answer the "
     "specific — 'climb to retrieve, descend to answer'. Black ink + course-blue ladder + a warm-orange "
     "principle-glow; Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L14", "L14/L14-06-many-casts.png", "16:9", True,
     "MULTI-QUERY: Serega casts FIVE differently-worded fishing lines from one question into the archive-sea, "
     "each phrased line hooking a different relevant scroll — many wordings hedge the Gremlin's word-matching. "
     "Black ink + course-blue water + warm-orange lines; Serega's green tübetey is the ONLY green. No lettered "
     "title bar."),
    ("L14", "L14/L14-07-rrf-consensus.png", "4:3", True,
     "RRF fusion: three separate ranked columns of scrolls flow together, and the ONE scroll that several "
     "columns agree on near the top rises to the crown of a merged list, outranking a scroll that only a "
     "single column loved — consensus wins. Serega tallies the reciprocal ranks. Black ink + course-blue "
     "columns + a warm-orange winning-scroll; Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L14", "L14/L14-08-split-scroll.png", "4:3", True,
     "DECOMPOSITION: Serega snips one long compound scroll-question into three tidy atomic sub-question strips, "
     "sending each to fetch its own answer-scroll from a different shelf, then gathers them to compose the "
     "final reply. Black ink + course-blue shelves + warm-orange snip-line; Serega's green tübetey is the ONLY "
     "green. No lettered title bar."),
    ("L14", "L14/L14-09-quill-learns.png", "4:3", True,
     "The TRAINABLE quill (Rewrite-Retrieve-Read): the enchanted quill sharpens its OWN nib on a small "
     "whetstone as a warm-orange reward-arrow loops back from a good final answer — the quill learning to "
     "rewrite better. Serega nods, an apprentice-turned-master. Black ink + course-blue + a warm-orange reward "
     "loop; Serega's green tübetey is the ONLY green. No lettered title bar."),
    ("L14", "L14/L14-10-the-tax.png", "4:3", True,
     "THE TAX: a small ledger-and-coin scene — every rewrite costs an extra LLM-call coin — with Goodhart, the "
     "sly metric-gaming trickster, peeking over a recall gauge and tempting a verbose, padded rewrite. Serega "
     "weighs the cost against the gain, choosing to pay only for the gap he has. Black ink + course-blue ledger "
     "+ warm-orange coins; Serega's green tübetey is the ONLY green; Goodhart is bare-headed with no green. No "
     "lettered title bar."),
    ("L14", "L14/L14-11-captain-takes-quill.png", "16:9", True,
     "FINAL. Serega lays the enchanted Quill down on the desk and, with a warm nod, hands it to the captain "
     "(the student) who takes it up to re-ink their own questions; the Lexical Gremlin now steps aside, and the "
     "archive doors stand open. Earned, generous send-off. Black ink + course-blue + a warm-orange quill-glow; "
     "Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),

    # ---- L14 · session-4 TEACHING plates (the deck had illustrations only on its dividers + final;
    #      these six sit on learning slides and carry a MECHANISM, not the topic). ----
    ("L14", "L14/L14-12-k-drafts-average.png", "4:3", True,
     "AVERAGING k DRAFTS — variance, not bias. Serega pins FIVE drafted answer-scrolls around a target-ring "
     "on his desk and marks their common centre with a single pin. On the LEFT half the five scrolls are "
     "scattered evenly all round the ring and the centre-pin lands dead on the gold scroll at the middle — "
     "independent scatter cancels. On the RIGHT half all five scrolls hang tilted the SAME way off to one "
     "side, and the centre-pin has drifted right along with them, no nearer the gold — a shared lean does "
     "not cancel, averaging only reinforces it. A thin cord ties the centre-pin back to the original "
     "question-scroll at the desk edge, keeping it from being dragged too far (the raw-query anchor). "
     "Black ink + course-blue scrolls + a warm-orange centre-pin and cord; Serega's green tübetey is the "
     "ONLY green. NO hand-lettered words, letters, numbers or tags anywhere in the image — the scene must read "
     "with zero text (the course is bilingual). No lettered title bar. Fills ≥80% width."),
    ("L14", "L14/L14-13-replace-or-append.png", "4:3", True,
     "ONE DRAFT, TWO SUBSTITUTIONS. In the middle of the desk lies ONE drafted answer-scroll the enchanted "
     "quill has just written from the question-scroll, and from it the path FORKS in two. Upper branch: the "
     "drafted scroll ALONE is dropped through a round lens and sent off to the shelves, while the original "
     "question-scroll is left face-down on the desk, its words never travelling at all (replace). Lower "
     "branch: Serega PASTES the drafted scroll onto the tail of the original question-scroll to make one "
     "longer strip and sends that joined strip to the shelves, so both sets of words travel together "
     "(append). Serega stands at the fork with the paste-pot in one hand and the lens in the other, "
     "choosing. Black ink + course-blue scrolls + a warm-orange paste-seam and lens-rim; Serega's green "
     "tübetey is the ONLY green. NO hand-lettered words, letters, numbers or tags anywhere in the image — the "
     "scene must read with zero text (the course is bilingual). No lettered title bar. Fills ≥80% width."),
    ("L14", "L14/L14-14-search-region.png", "4:3", True,
     "THE CLIMB CAN ONLY WIDEN THE REGION. Serega holds a stack of stencil-cards pressed one over the other "
     "in front of the archive shelves; together they leave only a PINHOLE, and through that pinhole not one "
     "single shelf is visible — the over-specific question can be answered from nothing at all. He LIFTS the "
     "top few cards away and the opening widens into a broad window through which several shelves and one "
     "tall principle-scroll now come into view; taking conditions off can only widen the opening, never "
     "narrow it. The lifted cards are NOT thrown away: he holds them in his other hand, poised over the "
     "answer-sheet at his side, ready to be pressed back on when he writes the reply. Black ink + "
     "course-blue stencil-cards and shelves + a warm-orange widened opening; Serega's green tübetey is the "
     "ONLY green. NO hand-lettered words, letters, numbers or tags anywhere in the image — the scene must read "
     "with zero text (the course is bilingual). No lettered title bar. Fills ≥80% width."),
    ("L14", "L14/L14-15-union-bag.png", "4:3", True,
     "THE UNION LIFTS RECALL AND LOSES THE ORDER. Three neat ranked columns of scrolls stand side by side, "
     "each stacked in a clear top-to-bottom order like a small step-ladder. Serega tips all three columns "
     "into ONE open sack: the gold scroll that only the third column had found is now safely inside — "
     "coverage won. But inside the sack the scrolls lie in a jumbled heap with every rank gone, and Serega, "
     "reaching in with a puzzled frown, has no way to tell which one to hand out first. An empty "
     "presentation-tray waits beside him for the single ordered list he cannot yet build. Black ink + "
     "course-blue columns and sack + one warm-orange gold scroll; Serega's green tübetey is the ONLY "
     "green. NO hand-lettered words, letters, numbers or tags anywhere in the image — the scene must read with "
     "zero text (the course is bilingual). No lettered title bar. Fills ≥80% width."),
    ("L14", "L14/L14-16-chain-of-hops.png", "4:3", True,
     "A CHAIN IS AS WEAK AS ITS WEAKEST HOP. Three big chain-links in a row, each link cradling a little "
     "scroll that it hands forward to the next; a broad course-blue ribbon enters the first link and comes "
     "out visibly NARROWER after each one, so only a thin band still survives past the third. The MIDDLE "
     "link is cracked open, and from that crack onward every scroll the chain carries is drawn upside-down "
     "and wrong — the mistake is inherited by everything downstream and never repaired. Serega traces the "
     "shrinking ribbon with a finger and frowns at how little of it the last link still carries. Black ink + "
     "course-blue ribbon and links + a warm-orange crack; Serega's green tübetey is the ONLY "
     "green. NO hand-lettered words, letters, numbers or tags anywhere in the image — the scene must read with "
     "zero text (the course is bilingual). No lettered title bar. Fills ≥80% width."),
    ("L14", "L14/L14-17-reward-around-boxes.png", "4:3", True,
     "THE REWARD GOES ROUND THE SEALED BOXES, NOT THROUGH THEM. Two heavy sealed iron boxes stand in a row — "
     "an index-chest with no keyhole and a shut lantern-reader — and a thick arrow aimed straight through "
     "them stops flat against the first wall, unable to pass. So Serega works AROUND them: from the "
     "enchanted quill he samples THREE different rewrite-slips of the same question, sends each one round "
     "the outside of the boxes, and each slip comes back with a weight-stone of a different size hung on it. "
     "He hauls hardest on the slip carrying the heaviest stone, and the only thing that actually moves is "
     "the quill's own nib — the boxes are never opened. A small fixed counterweight hangs on the same beam, "
     "steadying the swing without tipping it either way. Black ink + course-blue boxes and slips + "
     "warm-orange weight-stones; Serega's green tübetey is the ONLY green. NO hand-lettered words, letters, "
     "numbers or tags anywhere in the image — the scene must read with zero text (the course is bilingual). No "
     "lettered title bar. Fills ≥80% width."),

    # ---- L15 "The Loom of Attention" (BERT & other Transformers — from attention to RLHF). Metaphor:
    #      Serega is a WEAVER at a great loom; words are threads; attention is where every thread crosses
    #      every other. Reused cast cameo: Tokenosaurus (sub-word threads), the Lexical Gremlin (old literal
    #      matcher). Serega in EVERY plate → satisfies the image-gate (>=40% + hero + final). ----
    ("L15", "L15/L15-00-the-loom.png", "16:9", True,
     "HERO. Serega the weaver stands at a great wooden LOOM, warm-orange warp-threads strung across it, a "
     "fabric of meaning half-woven where every thread crosses every other; at the frayed left edge ONE old "
     "overloaded single thread is straining and snapping (the RNN bottleneck it replaces). Air of calm craft "
     "and quiet power, a small proud smile. CRITICAL — draw NO boxed title, NO framed caption card, and NO "
     "hand-lettered character-name banner anywhere (absolutely NO 'Serega the Weaver' label box at the top or "
     "anywhere else): the ONLY hand-lettered words permitted in the whole image are the four short scene tags "
     "'loom', 'warp-threads', 'fabric of meaning', and 'RNN bottleneck', each floating beside the thing it "
     "names. Black ink + course-blue loom + thin warm-orange threads; Serega's green tübetey is the ONLY "
     "green. No lettered title bar, no header strip. Fills ≥85% width."),
    ("L15", "L15/L15-01-attention-table.png", "4:3", True,
     "words drawn as little thread-SPOOLS arranged around a round table; thin lines of DIFFERENT thickness "
     "connect each spool to all the others (weights), a few links clearly bolder than the rest. Serega leans "
     "in tuning the strongest link with one finger. Hand-lettered tags 'query' beside one spool, 'keys' along "
     "the links. Black ink + course-blue spools + thin warm-orange links; Serega's green tübetey the ONLY "
     "green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-02-self-attention.png", "4:3", True,
     "the SAME single row of word-thread-spools reaching across to one another (self-attention): one "
     "ambiguous spool hand-lettered 'bank' glows and leans toward river-word-spools on one try and toward "
     "money-word-spools on another, its meaning coloured by whichever neighbours it pulls toward. Serega "
     "watches, delighted at the context. Black ink + course-blue + a thin warm-orange lean-line; Serega's "
     "green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-03-multi-head.png", "4:3", True,
     "several SMALL looms lined up side by side, each weaving a DIFFERENT pattern from the same set of "
     "threads (one a tidy grid, one a diagonal, one a loose weave) — the attention 'heads'. Serega walks the "
     "row overseeing, then gathers the finished strips to sew into one. Black ink + course-blue looms + thin "
     "warm-orange thread accents; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-04-transformer-block.png", "4:3", True,
     "the loom MACHINE as one repeating powerful unit: an attention shuttle up top, a little feed-forward "
     "GEARBOX below it, a curved residual BYPASS-LOOP carrying the original thread straight around, and a "
     "round tension-GAUGE (LayerNorm) keeping the weave even; the whole unit stamped 'x N' to show it stacks. "
     "Serega the mechanic stands beside it, oil-rag in hand. Black ink + course-blue machine + one warm-orange "
     "gauge-needle; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-05-bert-bidirectional.png", "4:3", True,
     "Serega MENDING a small hole in a finished piece of cloth, reading the threads from BOTH sides of the "
     "gap at once (bidirectional) to know what colour to fill in — a little masked-out square patch hand-"
     "lettered 'mask'. Arrows come in from the LEFT and the RIGHT into the hole. Black ink + course-blue cloth "
     "+ a thin warm-orange fill-thread; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-06-pretrain-finetune.png", "4:3", True,
     "one HUGE heavy bolt of woven cloth on a stand (woven once, expensively — 'pretrain'), and beside it "
     "Serega quickly TAILORING a small neat garment cut from that same bolt ('fine-tune'), scissors and pins "
     "in hand, a satisfied grin. A thin warm-orange thread runs from the big bolt to the little garment. Black "
     "ink + course-blue; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-07-decoder-forward.png", "4:3", True,
     "Serega weaving FORWARD one thread at a time along a strip, with a CURTAIN drawn across the loom hiding "
     "all the threads AHEAD of his hands (the causal mask) so he can only use what is already woven behind "
     "him; he reaches for the next thread without peeking. Hand-lettered tag 'next'. Black ink + course-blue "
     "loom + warm-orange curtain-cord; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-08-gpt-scale.png", "4:3", True,
     "the same forward loom grown ENORMOUS, towering over a tiny Serega at its base; at the top just a FEW "
     "example rows are shown ('few-shot'), and the giant loom continues the pattern by itself down the whole "
     "bolt with no one touching it (in-context learning). Serega looks up, small and amazed. Black ink + "
     "course-blue giant loom + a thin warm-orange 'seen only a few' bracket; Serega's green tübetey the ONLY "
     "green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-09-three-families.png", "4:3", True,
     "three looms in a row, each behaving differently, with a short hand-lettered tag under each: one reads a "
     "whole finished cloth at once ('encoder'), one writes a strip forward thread by thread ('decoder'), one "
     "reads an input cloth then weaves a new output ('enc-dec'). Serega presents them with an open hand. Black "
     "ink + course-blue looms + thin warm-orange tag-underlines; Serega's green tübetey the ONLY green. No "
     "lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-10-efficient-attention.png", "4:3", True,
     "an ENORMOUS run of cloth far too long to cross every thread with every other; instead Serega weaves it "
     "in tidy separate WINDOWS / blocks, with just a few long warm-orange SKIP-threads jumping between distant "
     "blocks. A tiny hand-lettered 'n²' crossed out beside a giant tangle, next to a neat blocked weave. Black "
     "ink + course-blue blocks + thin warm-orange skip-threads; Serega's green tübetey the ONLY green. No "
     "lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-11-rlhf.png", "4:3", True,
     "Serega the master weaver ADJUSTING the finished pattern to please a CUSTOMER trying the garment on in "
     "front of a mirror (human preference); Serega turns a small round reward-DIAL and re-threads a row to "
     "match the customer's happy nod. Hand-lettered tag 'reward'. Black ink + course-blue + one warm-orange "
     "dial-mark; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-12-the-whole-loom.png", "16:9", True,
     "FINAL. Serega steps back and gestures proudly at one finished TAPESTRY that weaves the whole journey "
     "left to right: a frayed single-thread edge (RNN) → a dense all-crossing weave (attention) → a machine "
     "panel (the Transformer block) → two woven scenes, one reading and one writing forward (BERT / GPT) → a "
     "refined decorative border (RLHF). Earned, warm, generous send-off. Black ink + course-blue + thin "
     "warm-orange thread highlights; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),

    # ---- L15 · session-4 TEACHING plates (the deck ran the whole variants / decoding / efficiency / RLHF
    #      acts with no illustration at all; these six sit on learning slides and carry a MECHANISM). ----
    ("L15", "L15/L15-13-wordpiece-threads.png", "4:3", True,
     "SUB-WORD THREADS. Tokenosaurus — the goofy friendly cartoon dinosaur, course-blue body with a "
     "warm-orange belly, tiny arms, big good-natured toothy grin, soft back-plates — bites ONE long "
     "unfamiliar word-thread into three shorter lengths and knots them straight back into a single "
     "continuous thread, each continuation length starting with a small hook-eyelet that marks it as not "
     "the beginning of a word. Behind them a shallow drawer holds only a fixed set of common ready-made "
     "thread-spools; the unfamiliar thread was not in that drawer, yet Serega now holds the re-knotted "
     "length up whole and complete — nothing had to be thrown away as unknown. Two common short threads lie "
     "beside the drawer untouched and uncut, because they were already in it. Black ink + course-blue "
     "spools + warm-orange knots; Serega's green tübetey is the ONLY green. Tokenosaurus is bare-headed "
     "and wears no green. NO hand-lettered words, letters, numbers or tags anywhere in the image — the scene "
     "must read with zero text (the course is bilingual). No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-14-replaced-thread.png", "4:3", True,
     "REPLACED-THREAD DETECTION. On the LEFT a small bare-headed apprentice weaver at a tiny loom quietly "
     "swaps a handful of threads in a finished cloth for plausible look-alike replacements that sit almost "
     "invisibly among the originals. On the RIGHT Serega the inspector runs one finger along EVERY single "
     "thread of that whole cloth, flicking each thread-end either up or down as he passes — genuine or "
     "swapped — so his verdict-marks run right across the full width of the fabric. Behind him, for "
     "contrast, an older cloth hangs with only a few small square patches pinned over it, and there "
     "Serega's marks appear ONLY on those few patches while the rest of that cloth goes unexamined. Black "
     "ink + course-blue cloth + warm-orange swapped threads; Serega's green tübetey is the ONLY green. The "
     "apprentice weaver is a plain bare-headed course-blue stick figure with no green. NO hand-lettered words, "
     "letters, numbers or tags anywhere in the image — the scene must read with zero text (the course is "
     "bilingual). No lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-15-truncated-sampling.png", "4:3", True,
     "TWO WAYS TO CUT THE CANDIDATE SPOOLS. Two racks of candidate thread-spools stand side by side; on each "
     "rack the spools are drawn at different sizes, the fattest on the left tapering down to tiny ones on "
     "the right. Over the FIRST rack Serega lowers a rigid tray with a fixed number of slots, and it lifts "
     "exactly that many spools every time, whether the rack was steeply uneven or nearly flat — a fixed "
     "count. Over the SECOND rack he instead tips spools into a measuring jar marked with one fill-line, "
     "taking them fattest-first and stopping the instant the contents reach the line: from a steeply uneven "
     "rack the jar is full after just two fat spools, from a nearly flat rack it swallows a long row of "
     "small ones — a fixed amount, an adaptive count. Black ink + course-blue spools and racks + a "
     "warm-orange fill-line; Serega's green tübetey is the ONLY green. NO hand-lettered words, letters, "
     "numbers or tags anywhere in the image — the scene must read with zero text (the course is bilingual). No "
     "lettered title bar. Fills ≥80% width."),
    ("L15", "L15/L15-16-cross-shuttle.png", "4:3", True,
     "THE SHUTTLE THAT REACHES ACROSS. Two looms face each other. The RIGHT loom is weaving forward one row "
     "at a time with a curtain drawn over the un-woven rows ahead of its hands; its shuttle does NOT take "
     "thread from its own basket — it reaches ACROSS to the LEFT loom, where a finished cloth hangs fully "
     "woven and open, and draws its thread straight out of that finished cloth. The writer asks, the reader "
     "supplies. Serega stands between the two looms guiding the shuttle's line. Off to one side, drawn "
     "small, a SINGLE writing loom stands alone with no cloth facing it and its shuttle-arm hanging in empty "
     "air with nothing to reach into. Black ink + course-blue looms + one warm-orange cross-shuttle line; "
     "Serega's green tübetey is the ONLY green. NO hand-lettered words, letters, numbers or tags anywhere in "
     "the image — the scene must read with zero text (the course is bilingual). No lettered title bar. Fills "
     "≥80% width."),
    ("L15", "L15/L15-17-tiling-not-approximation.png", "4:3", True,
     "THE GIANT SHEET IS NEVER SPREAD OUT. A colossal square crossing-sheet, far too big for the workshop "
     "floor, stays ROLLED UP and leaning against the wall — it is never unrolled at all. Instead Serega "
     "works at a small bench-tray beside the loom: he carries in one block of warp-threads and one block of "
     "weft-threads from the big store-chest, weaves just that ONE tile on the tray, slides a running "
     "tally-bead along a wire to keep the balance right as each tile finishes, and carries only the narrow "
     "finished strip back to the chest. Beside him that finished strip is held up against a sample cut from "
     "the rolled sheet, and the two match thread for thread — the very same weave, exactly, merely never all "
     "laid out at once. Black ink + course-blue chest, tray and blocks + a warm-orange tally-bead; "
     "Serega's green tübetey is the ONLY green. NO hand-lettered words, letters, numbers or tags anywhere in "
     "the image — the scene must read with zero text (the course is bilingual). No lettered title bar. Fills "
     "≥80% width."),
    ("L15", "L15/L15-18-reward-from-pairs.png", "4:3", True,
     "A SINGLE WEIGHT LEARNED FROM COMPARISONS. On the LEFT a seated customer is handed TWO finished "
     "swatches at a time and simply points at the better one, over and over, while a small pile of these "
     "pointed-at pairs builds up on the table. From that pile Serega trains a little apprentice JUDGE who "
     "sits at a pan-balance: the customer's chair now stands EMPTY, and the judge alone hangs each NEW "
     "swatch on the balance and reads off one single weight for it. A dotted line carries that weight back "
     "to the loom, where Serega adjusts the weaving. The judge never weaves — the cloth the customer will "
     "actually wear still comes off the loom, and the judge only weighs it. Black ink + course-blue swatches "
     "+ a warm-orange balance-needle; Serega's green tübetey is the ONLY green. The customer and the "
     "apprentice judge are plain bare-headed course-blue stick figures with no green. NO hand-lettered words, "
     "letters, numbers or tags anywhere in the image — the scene must read with zero text (the course is "
     "bilingual). No lettered title bar. Fills ≥80% width."),

    # ---- L16 "Late Chunking" (contextual chunk embeddings for long docs). Metaphor: naive chunking = tear
    #      the pages out first then read each alone (a page loses WHO it is about); late chunking = read the
    #      whole book first, THEN mark the chunk boundaries so every card remembers the subject. Cameo: Chunk
    #      Norris (the L10 chunking mascot) whose over-eager slicing this corrects. Serega in every plate. ----
    ("L16", "L16/L16-00-read-first.png", "16:9", True,
     "HERO. Serega sits reading one whole thick BOOK cover to cover, a calm thought-bubble absorbing the "
     "entire story; a ruler rests across the open spine ready to MARK chunk boundaries only AFTER he has read "
     "it all. On the desk, three tidy index-cards wait. Air of patient craft. Hand-lettered tag 'read the "
     "whole book first'. Black ink + course-blue + one thin warm-orange thread of story running through the "
     "pages; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    ("L16", "L16/L16-01-tear-first.png", "4:3", True,
     "NAIVE chunking. Serega has TORN three pages out of a book and handed them to three little helpers who "
     "each read only their lone page. The middle helper stares baffled at a page reading 'Its 3.85 M "
     "residents...' with the word that says WHO (the subject) greyed-out and absent — a puzzled '...whose?' "
     "speech bubble over his head. The torn pages drift apart. Black ink + course-blue; the missing referent "
     "word faint grey; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-02-chunk-norris.png", "4:3", True,
     "Chunk Norris (the recurring karate-master chunking mascot, course-blue gi and belt, tidy ink moustache) "
     "mid roundhouse-kick chopping a long scroll into equal chunks that fly apart on clean cut-lines; Serega "
     "stands beside him holding up one hand 'wait — read it first', gently correcting the over-eager slicing. "
     "One warm-orange motion-arc on the kick. Chunk Norris is BARE-HEADED (no green); Serega's green tübetey "
     "the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-03-read-then-mark.png", "4:3", True,
     "LATE chunking. Serega has read the whole book, and the word 'Berlin' glows and THREADS forward through "
     "the text with a warm-orange line into the later pronoun 'Its' and 'the city' (binding the referent). "
     "NOW he lays a ruler across the pages and marks chunk boundaries — the pages stay bound, each remembers "
     "'Berlin'. Hand-lettered tag 'mark the pages last'. Black ink + course-blue + one warm-orange binding "
     "thread; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-04-the-lift.png", "4:3", True,
     "the coreference LIFT. One index-card labelled 'Its 3.85M residents' sits on a little vertical dial; when "
     "Serega reads the whole book first, the card's needle JUMPS up from a dull reading '0.71' to a bright "
     "'0.85'. Two short hand-lettered numbers '0.71' (grey, low) and '0.85' (warm-orange, high). Serega points "
     "proudly. Black ink + course-blue + one warm-orange high-mark; Serega's green tübetey the ONLY green. No "
     "lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-05-mean-pool.png", "4:3", True,
     "MEAN POOLING a chunk. A row of little token-vector arrows inside one bracketed chunk are gathered and "
     "AVERAGED by Serega into a single tidy card-vector (a funnel or an averaging-scale merging many small "
     "arrows into one). Hand-lettered tag 'one vector per chunk'. Black ink + course-blue arrows + one "
     "warm-orange resulting arrow; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-06-two-lates.png", "4:3", True,
     "THE TWO LATES, side by side. LEFT: late INTERACTION (ColBERT) — a passage kept as a fistful of many "
     "per-WORD sticky-notes, an expensive many-armed handshake at query time. RIGHT: late CHUNKING — Serega "
     "holds ONE tidy index-card per passage, cheap and free at query time. A small balance-scale between them "
     "tips 'query-time cost' vs 'index-time cost'. Hand-lettered 'interaction' / 'chunking'. Black ink + "
     "course-blue + thin warm-orange; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-07-vs-llm.png", "4:3", True,
     "late chunking vs the LLM way. LEFT: a costly robot/LLM stamps an extra CONTEXT paragraph onto each chunk "
     "(a paid extra step, little coin symbols). RIGHT: Serega gets the SAME result for free just by reading "
     "the whole book first — a thumbs-up, no coins. A small '=' between their two output-cards showing equal "
     "quality. Hand-lettered 'LLM prepend' / 'late chunking · free'. Black ink + course-blue + one warm-orange "
     "accent; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-08-drop-in.png", "4:3", True,
     "DROP-IN. Serega slots his tidy chunk-cards into the SAME existing filing cabinet / vector index he "
     "already had — nothing downstream changes (same drawers, same size). A little 'same index, same query "
     "cost' hand-lettered tag. Calm, satisfied. Black ink + course-blue cabinet + one warm-orange card; "
     "Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-09-needle-fail.png", "4:3", True,
     "the FAILURE case. A giant book of 8000 pages of pure nonsense-scribbles with ONE secret passphrase page "
     "hidden inside; when Serega reads the whole thing first, the secret gets SMEARED into the surrounding "
     "gibberish (its card goes muddy). Here he'd have been better off tearing out the one page — a wry shrug. "
     "Hand-lettered 'needle in a haystack'. Black ink + course-blue + faint warm-orange smear; Serega's green "
     "tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-10-evidence.png", "4:3", True,
     "the EVIDENCE, understated. A small honest bar-chart on an easel where the 'late' bar edges just above "
     "the 'naive' bar (a modest but real lift), Serega beside it tapping the small gap with a pointer and a "
     "level-headed nod — 'small, but free'. Hand-lettered 'naive' / 'late'. Black ink + course-blue bars + "
     "one warm-orange top-cap on the late bar; Serega's green tübetey the ONLY green. No lettered title bar. "
     "Fills ≥80% width."),
    ("L16", "L16/L16-11-the-whole-book.png", "16:9", True,
     "FINAL. Serega stands proudly beside the whole intact BOOK and a neat fanned row of index-cards, each "
     "card faintly glowing with the story it remembers (the warm-orange thread still linking them back to the "
     "book). Earned, warm send-off; a small takeaway feel of 'change WHEN you pool, not the model'. Black ink "
     "+ course-blue + thin warm-orange memory-threads; Serega's green tübetey is the ONLY green. No lettered "
     "title bar. Fills ≥85% width."),
    # -- L16 wave 2 (depth pass): the four gaps the deepened deck opened — what a torn card actually
    #    loses, the gap/size law, character-offsets → token-offsets, and the long-document machinery. --
    ("L16", "L16/L16-12-broken-references.png", "4:3", True,
     "THE BROKEN REFERENCES. Serega at a card-catalogue drawer holding up FOUR torn index-cards, each with its "
     "subject-word torn off and drifting away as a faint grey ghost-word just out of reach: one card reads 'Its "
     "3.85M residents...', one 'The city is also...', one 'the ratio rose to 3%' with the column-header gone, "
     "one 'she declined' with the name gone. A small hand-lettered tag floats by each ghost-word: 'pronoun', "
     "'definite', 'table header', 'ellipsis'. Serega reaches after them with a rueful look. Black ink + "
     "course-blue cards + one thin warm-orange thread trying to reconnect a ghost-word to its card; Serega's "
     "green tübetey is the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L16", "L16/L16-13-gap-law.png", "4:3", True,
     "THE GAP LAW, AS A SIDE-BY-SIDE PAIR. The frame is split into TWO EQUAL HALVES by one vertical "
     "hand-drawn divider line, and BOTH halves must be fully drawn — never leave the right half empty, "
     "blank or unfinished. LEFT HALF: a page with a NARROW course-blue chunk-window laid over it, and its "
     "own round dial whose single warm-orange needle points HIGH; hand-lettered under it 'small chunk - "
     "big gap'. RIGHT HALF: the SAME page with a WIDE course-blue chunk-window about four times wider, and "
     "its own round dial of the same size whose single warm-orange needle points LOW; hand-lettered under "
     "it 'big chunk - small gap'. The fraction 'g / s' is chalked once above the divider. Serega stands at "
     "the bottom centre astride the divider, one hand pointing at each dial. Serega is drawn WHOLE and "
     "WHOLE-BODIED: one head, one torso, EXACTLY TWO arms each growing visibly from a shoulder and ending "
     "in EXACTLY ONE hand, and EXACTLY TWO legs ending in two feet, all joined by continuous unbroken "
     "outlines. Draw NO floating fist, NO hand without an arm, NO arm without a shoulder, NO third limb; "
     "where a prop or ruler crosses him it passes BEHIND him and his outline stays continuous, never "
     "chopping his body into separate pieces. Draw his tunic ONCE — one garment, one hem, never a second "
     "skirt. His head-covering is a small round GREEN skullcap (tuebetey) sitting flat on the crown — "
     "never a fez, never a cone, never a tall hat, never olive or brown. Black ink + course-blue windows "
     "and dials + warm-orange needles; Serega's green tuebetey is the ONLY green. No lettered title bar. "
     "Fills >=80% width."),
    ("L16", "L16/L16-14-offsets.png", "4:3", True,
     "CHARACTERS TO TOKENS. TWO rulers lie one above and one below the same short line of text, both "
     "floating clear of any figure. The UPPER ruler is ticked very FINELY — MANY narrow ticks crowded "
     "close together, one per LETTER, because that is where the chunker cut. The LOWER ruler is ticked "
     "COARSELY — FEW WIDE ticks, one per TOKEN, each token-tick spanning several of the letter-ticks above "
     "it, because that is where the model actually reads. The line of text BETWEEN the two rulers carries NO "
     "real words: draw it as a row of plain wavy squiggles that are clearly NOT letters, in no alphabet at "
     "all — never Cyrillic, never English, never invented words. Serega stands entirely TO ONE SIDE of the "
     "rulers, so that NEITHER ruler crosses his body, and reaches across with one hand to pencil a single "
     "letter-mark DOWN onto the nearest token-mark — a small warm-orange tick where the two meet. A small "
     "square tag lettered 'CLS' sits at the LEFT end of the text line and a square tag lettered 'SEP' at "
     "the RIGHT end, both simply resting there. Hand-lettered 'characters' above the upper ruler and "
     "'tokens' below the lower one. Serega is drawn WHOLE and WHOLE-BODIED: one head, one torso, EXACTLY "
     "TWO arms each growing visibly from a shoulder and ending in EXACTLY ONE hand, and EXACTLY TWO legs "
     "ending in two feet, all joined by continuous unbroken outlines. Draw NO floating fist, NO hand "
     "without an arm, NO arm without a shoulder, NO third limb; where a prop or ruler crosses him it "
     "passes BEHIND him and his outline stays continuous, never chopping his body into separate pieces. "
     "Draw his tunic ONCE — one garment, one hem, never a second skirt. His head-covering is a small round "
     "GREEN skullcap (tuebetey) sitting flat on the crown — never a fez, never a cone, never a tall hat, "
     "never olive or brown. Black ink + course-blue rulers + one warm-orange alignment tick; Serega's "
     "green tuebetey is the ONLY green. No lettered title bar. Fills >=80% width."),
    ("L16", "L16/L16-15-too-big-for-the-desk.png", "4:3", True,
     "THE BOOK THAT OUTGREW THE DESK. A colossal volume far wider than Serega's reading desk; he keeps "
     "THREE overlapping desk-widths of it open at a time, and warm-orange BRIDGE-CLIPS are pinched across "
     "the two seams. Beside the desk a small waste-basket, into which DUPLICATE overlap pages are dropping "
     "— read once, filed once. TEXT RULE, absolute: the ONLY lettering anywhere in this image is the "
     "single short tag 'read the overlap - file it once', hand-lettered once, horizontally, below the "
     "desk. Every page, every book surface and every clip is BLANK — draw page content as plain wavy "
     "squiggles that are NOT letters. Do NOT write a sentence, a caption, a title or any English words "
     "inside or on the book. Serega is drawn WHOLE and WHOLE-BODIED: one head, one torso, EXACTLY TWO arms "
     "each growing visibly from a shoulder and ending in EXACTLY ONE hand, and EXACTLY TWO legs ending in "
     "two feet, all joined by continuous unbroken outlines. Draw NO floating fist, NO hand without an arm, "
     "NO arm without a shoulder, NO third limb; where a prop or ruler crosses him it passes BEHIND him and "
     "his outline stays continuous, never chopping his body into separate pieces. Draw his tunic ONCE — "
     "one garment, one hem, never a second skirt. His head-covering is a small round GREEN skullcap "
     "(tuebetey) sitting flat on the crown — never a fez, never a cone, never a tall hat, never olive or "
     "brown. Black ink + course-blue desk and book + warm-orange seam-clips; Serega's green tuebetey is "
     "the ONLY green. No lettered title bar. Fills >=80% width."),

    # ---- L17 "Shannon Entropy" (the entropy of language; strong historical flavour). Metaphor: Serega as a
    #      1948 Bell-Labs TELEGRAPH OPERATOR measuring SURPRISE on a bits gauge; a recurring red "entropy floor"
    #      line = the hard limit. Props: brass telegraph key, Morse dots/dashes, chalkboard H = -Σ p log p. ----
    ("L17", "L17/L17-00-telegraph.png", "16:9", True,
     "HERO. Serega sits at a brass TELEGRAPH KEY in a tidy 1920s Bell key-room, tapping out Morse; above the "
     "key a small round GAUGE labelled in little dot-marks reads 'bits'. He taps a single dot and a hand-"
     "lettered tag reads 'E = a dot' beside it. Air of calm period craft. Black ink + course-blue brass key + "
     "one thin warm-orange gauge-needle; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    ("L17", "L17/L17-01-morse-e-dot.png", "4:3", True,
     "Morse-code frequency coding. Serega sorts a printer's type-case, stacking the tall 'E' bin far higher "
     "than the rest, and beside it a little key gives 'E' a single DOT while a rare 'Q' gets a long dash-heavy "
     "code. Hand-lettered 'frequent → short'. Black ink + course-blue + one warm-orange dot; Serega's green "
     "tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-02-markov-onegin.png", "4:3", True,
     "Markov's chain. Serega traces a chain of little linked beads labelled V and C (vowel / consonant) across "
     "a page of Pushkin, each bead's next depending on the last; a small tally '43% V · 57% C'. Hand-lettered "
     "'the next letter remembers the last'. Black ink + course-blue beads + one warm-orange link; Serega's "
     "green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-03-the-bit.png", "4:3", True,
     "THE BIT. Serega flips one simple two-way LEVER / coin between 0 and 1 — the single yes/no unit of "
     "information — a small '1 bit' tag beside it. Clean and minimal. Black ink + course-blue lever + one "
     "warm-orange accent; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-04-surprise-meter.png", "4:3", True,
     "THE SURPRISE METER. A strip of English letters feeds past Serega left to right; over it a big round "
     "GAUGE reading in 'bits' — the needle barely twitches on the predictable letter after 't-h-_' (he calmly "
     "guesses 'e') but SPIKES on a genuinely unpredictable letter. Hand-lettered 'surprise'. Black ink + "
     "course-blue gauge + one warm-orange needle; Serega's green tübetey the ONLY green. No lettered title bar. "
     "Fills ≥80% width."),
    ("L17", "L17/L17-05-entropy-formula.png", "4:3", True,
     "Serega at a small chalkboard writing H = −Σ p log p and, beside it, a tiny drawing of a fair COIN (1 "
     "bit) and a fair DIE (≈2.585 bits) to anchor the scale. Thoughtful teacher pose, chalk in hand. Black ink "
     "+ course-blue chalkboard + one warm-orange underline; Serega's green tübetey the ONLY green. No lettered "
     "title bar. Fills ≥80% width."),
    ("L17", "L17/L17-06-biased-coin.png", "4:3", True,
     "a BIASED coin, worked. Serega holds a lopsided coin weighted toward tails; a little needle-gauge beside "
     "it reads below the '1 bit' mark — hand-lettered '0.81 bits'. He grins: the skew is exploitable. Black "
     "ink + course-blue coin + one warm-orange gauge-mark; Serega's green tübetey the ONLY green. No lettered "
     "title bar. Fills ≥80% width."),
    ("L17", "L17/L17-07-guessing-game.png", "4:3", True,
     "SHANNON'S GUESSING GAME. Serega, pencil in hand, guesses the next hidden letter of a covered sentence, "
     "keeping a tally of guesses; most letters he gets on the first try (a row of little '1' tallies), a rare "
     "one takes several. Hand-lettered '79 of 102 first try'. Black ink + course-blue + one warm-orange tally; "
     "Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-08-compression-floor.png", "4:3", True,
     "the COMPRESSION FLOOR. Serega presses a fat book down through a press to a slim compressed strip, but "
     "the press stops HARD at a solid red horizontal FLOOR line labelled 'H' — he cannot squeeze past it. "
     "Hand-lettered 'entropy = the floor'. Black ink + course-blue press + the single red floor line (this red "
     "line is allowed — it is a diagram rule, not a figure); Serega's green tübetey the ONLY green. No lettered "
     "title bar. Fills ≥80% width."),
    ("L17", "L17/L17-09-optimal-code.png", "4:3", True,
     "the OPTIMAL CODE. Serega hangs four symbols A B C D on a little binary TREE — A on a short branch '0', D "
     "on a long branch '111' — frequent symbols get short codes; a tag notes the average length equals the "
     "entropy '1.75 = 1.75'. Black ink + course-blue tree + one warm-orange short-branch; Serega's green "
     "tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-10-serega-vs-lm.png", "4:3", True,
     "THE BRIDGE. Split panel: LEFT 1951 Serega with pencil and guess-tallies; RIGHT a small modern neural-net "
     "box predicting the next token — and BOTH read off the SAME 'bits per character' gauge whose needle "
     "hovers just above a solid red floor line labelled 'H'. Hand-lettered 'cross-entropy'. Black ink + "
     "course-blue + the red floor line; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-11-the-floor.png", "16:9", True,
     "FINAL. Serega stands beside the big bits-per-character gauge, one hand resting on the solid red 'H — the "
     "entropy of English' FLOOR line; the needle sits just above it, unable to dip under. A calm, wise send-"
     "off — 'you can get close; you can't get under'. Black ink + course-blue gauge + the single red floor "
     "line; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    # -- L17 wave 2 (depth pass): conditional entropy, Kraft's shelf, block coding, IDF in bits,
    #    and perplexity as a proxy. The red floor line stays an allowed diagram rule (see L17-08). --
    ("L17", "L17/L17-12-conditional-entropy.png", "4:3", True,
     "CONDITIONAL ENTROPY. The two gauges STAND ON THE DESK, not in anybody's hands. On the LEFT of the "
     "desk the BIG gauge, hand-lettered 'before context', its single needle standing HIGH near the top of "
     "its dial. On the RIGHT of the desk a SMALLER gauge, hand-lettered 'after', its single needle "
     "standing plainly LOW. Read the two needles as clock hands: the BIG gauge's needle points to ELEVEN "
     "o'clock, high up its dial; the SMALL gauge's needle points to SEVEN o'clock, plainly DOWN near the "
     "bottom of its dial, so that at a glance the second reading is visibly LOWER than the first. Between "
     "the two gauges EXACTLY ONE thin warm-orange bracket carries the hand-lettered note 'what the last "
     "letter already told me' — that bracket and that note appear ONCE in the whole image, never repeated "
     "above and below the gauges. Serega stands behind the desk, both hands resting on "
     "its front edge, a course-blue telegraph key on the desk beside him, an open book and TWO course-blue "
     "baskets on it, one tagged with the single capital 'V' and one tagged with the single capital 'C'. Do "
     "NOT draw any chain, row or scatter of letter-tiles anywhere — the ONLY letters in the whole image "
     "are the short labels just named. Serega is drawn WHOLE and WHOLE-BODIED: one head, one torso, "
     "EXACTLY TWO arms each growing visibly from a shoulder and ending in EXACTLY ONE hand, and EXACTLY "
     "TWO legs ending in two feet, all joined by continuous unbroken outlines. Draw NO floating fist, NO "
     "hand without an arm, NO arm without a shoulder, NO third limb; where a prop or ruler crosses him it "
     "passes BEHIND him and his outline stays continuous, never chopping his body into separate pieces. "
     "Draw his tunic ONCE — one garment, one hem, never a second skirt. His head-covering is a small round "
     "GREEN skullcap (tuebetey) sitting flat on the crown — never a fez, never a cone, never a tall hat, "
     "never olive or brown. Black ink + course-blue key, baskets and gauges + one warm-orange bracket; no "
     "brass, no gold, no ochre anywhere. Serega's green tuebetey is the ONLY green. No lettered title bar. "
     "Fills >=80% width."),
    ("L17", "L17/L17-13-kraft-shelf.png", "4:3", True,
     "KRAFT'S INEQUALITY. Serega lays code-tags out along a SHELF that is exactly one unit long, and their "
     "WIDTHS HALVE down the row — this proportion is the whole point and must be drawn exactly. The FIRST tag "
     "is as wide as HALF the entire shelf and is hand-lettered '1 bit'. The SECOND tag is HALF AS WIDE AGAIN, "
     "a QUARTER of the shelf, hand-lettered '2 bits'. The THIRD is HALF AS WIDE AGAIN, an EIGHTH of the shelf, "
     "hand-lettered '3 bits'. Together those three exactly fill the shelf end to end with nothing left over. "
     "Serega tries to squeeze in one more small tag — and it does NOT fit, it slides off the end and tips "
     "downward. Hand-lettered 'the shelf is exactly full'. Every label "
     "is short, lower-case, thin hand-lettering — never bold block capitals, never a parenthetical. Every "
     "shape is a FLAT even fill of one colour with a uniform thin black outline: no marker streaks, no "
     "visible brush texture, no shading or gradient inside any fill. Black ink + course-blue tags + one "
     "warm-orange shelf-edge; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-14-block-coding.png", "4:3", True,
     "BLOCK CODING, LEFT TO RIGHT AND GROWING. Along the bottom, THREE bundles of coin-flips in a row, and "
     "the count must GROW from left to right and never shrink: the LEFTMOST bundle holds EXACTLY TWO "
     "coins, the MIDDLE bundle EXACTLY THREE, the RIGHTMOST bundle EXACTLY FOUR. Count them before drawing "
     "them. On the right stands ONE thermometer: a single straight vertical tube of constant width with a "
     "rounded bulb at the bottom, drawn as ONE closed continuous outline — never two half-tubes, never a "
     "tube that changes width, bends or breaks apart. Inside it a filled column, and THREE short "
     "horizontal marker lines across the tube, each LOWER than the one before, matching the three bundles; "
     "below them all a solid RED horizontal floor line the column never reaches. Hand-lettered 'tie them "
     "in bundles' once. Serega stands at the left, tying the two-coin bundle. Serega is drawn WHOLE and "
     "WHOLE-BODIED: one head, one torso, EXACTLY TWO arms each growing visibly from a shoulder and ending "
     "in EXACTLY ONE hand, and EXACTLY TWO legs ending in two feet, all joined by continuous unbroken "
     "outlines. Draw NO floating fist, NO hand without an arm, NO arm without a shoulder, NO third limb; "
     "where a prop or ruler crosses him it passes BEHIND him and his outline stays continuous, never "
     "chopping his body into separate pieces. Draw his tunic ONCE — one garment, one hem, never a second "
     "skirt. His head-covering is a small round GREEN skullcap (tuebetey) sitting flat on the crown — "
     "never a fez, never a cone, never a tall hat, never olive or brown. Black ink + course-blue bundles "
     "and thermometer + the single red floor line (this red line is allowed — it is a diagram rule, not a "
     "figure) + one warm-orange pointer; Serega's green tuebetey is the ONLY green. No lettered title bar. "
     "Fills >=80% width."),
    ("L17", "L17/L17-15-idf-gremlin.png", "4:3", True,
     "IDF IN BITS. One round gauge stands in the middle, its dial carrying two hand-lettered marks, '0 bits' "
     "at the left end and '3 bits' at the right end, with a single warm-orange needle swung right over to the "
     "'3 bits' mark. Serega holds up TWO flat rectangular tickets, one in each hand, both held straight and "
     "level so their lettering is perfectly HORIZONTAL and upright: the LEFT ticket is hand-lettered 'the' and "
     "the RIGHT ticket is hand-lettered 'rare'. Draw EXACTLY ONE Lexical Gremlin — one gremlin only, never a "
     "second — and he sits astride the 'the' ticket, grinning, because that word does no ranking at all. The "
     "gremlin is BARE-HEADED, blue, with no green on him anywhere. Black ink + course-blue tickets + one "
     "warm-orange needle; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L17", "L17/L17-16-perplexity-goodhart.png", "4:3", True,
     "PERPLEXITY AS A PROXY. A single round gauge stands on a stand between two figures; its one rim "
     "carries TWO scales, hand-lettered 'x2' on the outside and 'xe' on the inside, and the two readings "
     "disagree. Serega stands at the LEFT as a FULL figure with both feet on the ground, pointing at the "
     "gauge with one hand while the other rests at his side. Goodhart the trickster stands at the RIGHT, "
     "also a FULL figure with a head, a torso, TWO arms and TWO legs, one hand reaching in to BEND the "
     "needle rather than improve the source behind it. Draw no floating fist and no hand without an arm on "
     "either figure. Hand-lettered 'same loss, two numbers' once. Goodhart is BARE-HEADED, blue, with no "
     "green on him anywhere. Serega is drawn WHOLE and WHOLE-BODIED: one head, one torso, EXACTLY TWO arms "
     "each growing visibly from a shoulder and ending in EXACTLY ONE hand, and EXACTLY TWO legs ending in "
     "two feet, all joined by continuous unbroken outlines. Draw NO floating fist, NO hand without an arm, "
     "NO arm without a shoulder, NO third limb; where a prop or ruler crosses him it passes BEHIND him and "
     "his outline stays continuous, never chopping his body into separate pieces. Draw his tunic ONCE — "
     "one garment, one hem, never a second skirt. His head-covering is a small round GREEN skullcap "
     "(tuebetey) sitting flat on the crown — never a fez, never a cone, never a tall hat, never olive or "
     "brown. Black ink + course-blue scales + one warm-orange pointer; Serega's green tuebetey is the ONLY "
     "green. No lettered title bar. Fills >=80% width."),

    # ---- L18 "The Curved Map" (anisotropy & hubness). Metaphor: Serega the CARTOGRAPHER of a warped world;
    #      the embedding space is a distorted map projection (Mercator). Anisotropy = every town squashed into
    #      one narrow wedge; whitening = re-project to an even grid; hubness = all-roads-to-Rome hub towns;
    #      CSLS = a local-crowding toll. Serega in every plate; keep grid/towns non-green. ----
    ("L18", "L18/L18-00-warped-map.png", "16:9", True,
     "HERO. Serega the cartographer wrestles a round GLOBE flattening onto a badly-stretched flat MAP on his "
     "drafting table, ruler and compass in hand; the map is visibly warped. He studies it, determined to fix "
     "the projection. Hand-lettered 'the map is curved'. Black ink + course-blue map + thin warm-orange "
     "meridians; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    ("L18", "L18/L18-01-squashed-wedge.png", "4:3", True,
     "ANISOTROPY. A bad Mercator squashes ALL the little town-dots (word vectors) into one thin narrow WEDGE "
     "pointing the same direction, so every town looks close to every other. Serega holds a ruler labelled "
     "'cosine' between two obviously-different towns and it reads a suspiciously high '0.99'. Hand-lettered "
     "'strangers?'. Black ink + course-blue wedge of dots + one warm-orange ruler-mark; Serega's green tübetey "
     "the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-02-cone.png", "4:3", True,
     "the CONE. The town-dots pile into a tight cone-shaped wedge emanating from a point; a faint dotted sphere "
     "shows how much of the space they SHOULD fill but don't. Serega peers along the narrow cone with a "
     "spyglass. Hand-lettered 'a narrow cone'. Black ink + course-blue cone; Serega's green tübetey the ONLY "
     "green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-03-frequency-directions.png", "4:3", True,
     "the TOP directions encode FREQUENCY, not meaning. Serega finds that the biggest axes of his warped map "
     "just sort towns by how COMMON their names are (a little 'the / of / a' pile on one big arrow) — not by "
     "meaning; he prepares to snip that dominant arrow off. Hand-lettered 'drop the top axis'. Black ink + "
     "course-blue arrows + one warm-orange snip; Serega's green tübetey the ONLY green. No lettered title bar. "
     "Fills ≥80% width."),
    ("L18", "L18/L18-04-reproject-grid.png", "4:3", True,
     "WHITENING = re-project to an even grid. Serega, T-square in hand, re-grids the map: he slides the whole "
     "sheet to center the towns on the origin, then un-stretches and un-shears the axes so the squashed wedge "
     "POPS OPEN into a round, evenly-spread field of towns on a fresh square grid. Hand-lettered 'center → "
     "whiten'. Black ink + course-blue grid + thin warm-orange axes; Serega's green tübetey the ONLY green. No "
     "lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-05-honest-ruler.png", "4:3", True,
     "the ruler now tells the TRUTH. On the freshly re-projected even map, Serega lays his 'cosine' ruler "
     "between the two once-'0.99' strangers and it now reads a low, honest number — they ARE far apart. A "
     "small before/after inset of the ruler. Hand-lettered 'honest distance'. Black ink + course-blue + one "
     "warm-orange ruler-mark; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-06-contrastive.png", "4:3", True,
     "build isotropy IN. Serega pulls matching towns TOGETHER (a short warm-orange tether between a positive "
     "pair) while pushing everything else evenly APART across the whole round field — the contrastive way to "
     "get an even map from the start. Hand-lettered 'align + spread'. Black ink + course-blue towns + one "
     "warm-orange tether; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-07-rome-hub.png", "4:3", True,
     "HUBNESS = all roads lead to Rome. One over-crowded HUB town sits dead-center with a traffic-jam of "
     "arrows pointing INTO it from every direction (drawn with a fat ring to show 'everyone's neighbour'); "
     "Serega looks on, arms folded. Hand-lettered 'a hub'. Black ink + course-blue roads + one warm-orange "
     "hub-ring; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-08-anti-hubs.png", "4:3", True,
     "the ANTI-HUBS. Off in the map's corners, a few lonely town-dots sit with cobwebbed, untravelled roads — "
     "no one's neighbour, never visited; Serega points at one with a lantern, concerned it can't be found. "
     "Hand-lettered 'never retrieved'. Black ink + course-blue + faint warm-orange cobweb; Serega's green "
     "tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-09-crowding-tax.png", "4:3", True,
     "CSLS = the crowding tax. Serega stamps a '−r' TOLL on the gates of the crowded hub town (measuring how "
     "busy its own neighbourhood is), while the quiet anti-hub towns finally get fresh roads out to them. "
     "Popularity no longer counts as closeness. Hand-lettered 'local-crowding tax'. Black ink + course-blue + "
     "one warm-orange toll-stamp; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-10-two-fixes.png", "4:3", True,
     "TWO complementary fixes. LEFT: Serega re-projecting the grid (fixes the CONE). RIGHT: Serega stamping "
     "the crowding toll (fixes the NEIGHBOUR graph). A small '+' between them — you often need both. Hand-"
     "lettered 'whiten' / 'CSLS'. Black ink + course-blue + thin warm-orange; Serega's green tübetey the ONLY "
     "green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-11-even-map.png", "16:9", True,
     "FINAL. Serega stands proud on the freshly re-projected, evenly-gridded MAP, ruler in hand, the once-"
     "crowded hub now just one town among many spread honestly across the sheet; every road tells the truth. "
     "Earned, warm send-off — 'straight-line distance lies on a curved map; so straighten the map'. Black ink "
     "+ course-blue even grid + thin warm-orange meridians; Serega's green tübetey is the ONLY green. No "
     "lettered title bar. Fills ≥85% width."),
    # -- L18 wave 2 (depth pass): random-vs-real directions, the signal/noise dial, whitening = the L5
    #    move returning, the two tolls of CSLS, and the flat-but-still-crowded map. --
    ("L18", "L18/L18-12-two-rulers.png", "4:3", True,
     "TWO DIFFERENT BEASTS. Serega stands between two drafting tables. On the LEFT table a cloud of arrows "
     "flying off in every direction like a hedgehog, and a protractor frozen at a wide right angle; a small "
     "hand-lettered sign on the table reads 'random directions'. On the RIGHT table the SAME number of arrows, "
     "but all pinched into one thin wedge, and a second protractor showing a tiny sliver of an angle; its sign "
     "reads 'real embeddings'. Serega holds a ruler in each hand and looks at us with a 'these are two "
     "different animals' expression. He is the ONLY character in the picture — no bystanders, no second "
     "figure, nobody peering in from a corner, and nothing is cropped by the canvas border. Black ink + "
     "course-blue arrows + one warm-orange protractor arc, every fill FLAT with no glow, halo or shading; "
     "Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-13-signal-noise-dial.png", "4:3", True,
     "THE CONE DIAL. Serega the cartographer stands WHOLE and complete beside his table — his full head, cap, "
     "body, both arms and both legs are inside the frame, nothing of him cropped by the canvas border — with "
     "one hand resting on the knob of a large instrument on the table. The instrument is ONE big round dial "
     "marked not in numbers but with the hand-lettered word 'noise' at its left end and the hand-lettered "
     "words 'one shared axis' at its right end, its single warm-orange needle standing hard against the right "
     "end. A thin linkage runs from the instrument to two small panels beside it: the nearer panel shows the "
     "towns as a wide half-round cloud, the farther panel shows the same towns closed into a thin wedge, the "
     "two joined by one plain curved arrow of motion. Black ink + course-blue instrument, panels and towns + "
     "one warm-orange needle — no brass, no gold, no ochre, every fill FLAT with no shading. Serega's green "
     "tübetey is the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-14-whitening-returns.png", "4:3", True,
     "THE OLD TRACING RETURNS. Serega at his table lays a faded old tracing-sheet, marked in one corner with a "
     "small hand-lettered 'L5' and a sketched ellipse of axes, over a fresh map of meanings — and the SAME "
     "grid shows through both sheets. A pantograph in his hand. On the table beside him four little brass "
     "town-pins stuck through the paper in a stretched slanted diamond, and a separate strip where the same "
     "four pins form a perfect square. Hand-lettered 'same move, new map'. Black ink + course-blue grid + one "
     "warm-orange axis; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-15-two-tolls.png", "4:3", True,
     "TWO TOLLS, ONE THAT MATTERS. A road scene drawn on the map: a toll-gate on the way OUT of the crowded "
     "hub town, weighed down by a heavy counterweight stamped with a hand-lettered 'r' so the road visibly "
     "sags under it; and a SECOND toll-gate at the entrance to the query's town whose barrier is raised and "
     "chained permanently open — it exists but stops nobody. Serega stands between them with a ledger, "
     "pointing at the useless second gate. Hand-lettered 'this one reorders' / 'this one does nothing'. Black "
     "ink + course-blue roads + one warm-orange toll-stamp; Serega's green tübetey is the ONLY green. No "
     "lettered title bar. Fills ≥80% width."),
    ("L18", "L18/L18-16-flat-but-crowded.png", "4:3", True,
     "FLAT, AND STILL CROWDED. Serega holds up an already-STRAIGHTENED map — the grid is perfect, the wedge is "
     "gone — and he is frowning: on that flawless grid ONE town is still swollen and every road still drains "
     "into it. Behind him on the wall hangs the old warped map, crossed out. The point of the frame: the "
     "geometry was fixed, the crowd was not. Hand-lettered 'two cures, two diseases'. Black ink + course-blue "
     "grid + one warm-orange hub-ring; Serega's green tübetey is the ONLY green. No lettered title bar. "
     "Fills ≥80% width."),
    ("L18", "L18/L18-17-toll-gate.png", "16:9", True,
     "the GATES OF ROME. SEREGA IS THE ONLY PERSON IN THIS PICTURE — draw exactly one human figure, no second "
     "figure, no bystanders, nobody in the background, nobody peering in from a corner. He stands WHOLE and "
     "complete in the middle of the frame, head, cap, body, both arms and both legs inside the canvas, "
     "holding up an open ledger in both hands and looking at us. He is standing on a road that runs left to "
     "right across the map. To his RIGHT the road is closed by one lowered striped barrier on its post, and "
     "beyond it the road climbs into a big town of crowded roofs. To his LEFT a line of small empty carts "
     "waits on the road, running off the left edge. In the far upper LEFT corner, three small houses joined "
     "to the road by one thin new lane. The ONLY hand-lettered word anywhere in the frame is 'toll', small, "
     "on the barrier — do NOT letter anything else, no captions, no arrow-labels, no explanations, and do NOT "
     "reproduce any words from this instruction. Black ink + course-blue road, carts and houses + one "
     "warm-orange striped barrier, every fill FLAT with no glow, halo or shading; Serega's green tübetey is "
     "the ONLY green. No lettered title bar. Fills ≥85% width."),
    # ---- L19 "The Wiring Diagram" (neural circuit diagrams). Metaphor: Serega the SCHEMATIC-READER —
    #      he puts down the spec written in prose and picks up the wiring diagram of the same machine.
    #      Wires are axes; a solder joint (cup) is where an axis DIES; the bill is read off the drawing.
    #      Serega in every plate; wires/boards stay ink+blue+orange — green ONLY on his tübetey. ----
    ("L19", "L19/L19-00-two-documents.png", "16:9", True,
     "HERO. EXACTLY ONE Serega — he is a single character and must appear ONCE; do NOT draw him twice. He "
     "stands at a workbench. Lying face-up on the bench in front of him: a dense page of prose and formulae, "
     "just PUT DOWN. Held up in both his hands and turned toward us: a big clean WIRING DIAGRAM (boxes joined "
     "by wires) of the SAME machine — and he is reading it with obvious relief. Hand-lettered 'same machine' "
     "with a thin bracket spanning from the page on the bench to the diagram in his hands. Do NOT letter any "
     "object with its own name. Black ink + course-blue wires + thin warm-orange highlight; Serega's green "
     "tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    ("L19", "L19/L19-01-formula-hides.png", "4:3", True,
     "the FORMULA HIDES THE WIRES. Serega holds up a formula written on a card; behind/through it, ghosted "
     "and unreadable, are the wires it is actually describing — the card is opaque and blocks them. He "
     "squints, frustrated. Hand-lettered 'what does it cost?'. Black ink + course-blue ghost-wires + one "
     "warm-orange question-mark; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-02-wire-is-an-axis.png", "4:3", True,
     "a WIRE IS AN AXIS. Serega pinches a single long wire between finger and thumb and pulls it taut; small "
     "beads are threaded along it (the entries of the axis), and a little tag on the wire reads 'n'. The one "
     "clean idea of the whole lecture. Hand-lettered 'one wire, one axis'. Black ink + course-blue wire + "
     "warm-orange tag; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-03-solder-joint.png", "4:3", True,
     "the CUP = a SOLDER JOINT where an axis DIES. Serega solders two wire-ends together into one joint; the "
     "shared wire simply ENDS there — it does not come out the other side. A small puff of smoke; a tiny "
     "hand-lettered tally '2·a·b·c' beside the joint (the price of the joint). Hand-lettered 'the axis dies "
     "here'. Black ink + course-blue wires + warm-orange solder glow; Serega's green tübetey the ONLY green. "
     "No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-04-triangle-turned.png", "4:3", True,
     "the TRIANGLE POINTS ACROSS AN AXIS. Serega holds a triangular gauge against a grid of wires; turned one "
     "way it spans the ROWS, turned a quarter-turn it spans the COLUMNS — and the grid's shape is IDENTICAL "
     "either way. He is caught mid-turn, realising it matters. Hand-lettered 'which way?'. Black ink + "
     "course-blue grid + one warm-orange triangle; Serega's green tübetey the ONLY green. No lettered title "
     "bar. Fills ≥80% width."),
    ("L19", "L19/L19-05-counting-rule.png", "4:3", True,
     "COUNTING THE BILL OFF THE DRAWING. Serega, sleeves up, walks a wiring diagram with a mechanical counter/"
     "tally-clicker in hand, adding up the price of each box as he passes it, chalk marks on a slate. The "
     "diagram is being READ like an invoice. Hand-lettered 'count the boxes'. Black ink + course-blue diagram "
     "+ warm-orange chalk tally; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-06-crossover-seesaw.png", "4:3", True,
     "the CROSSOVER. A SEESAW: on one side a fat squat box labelled with a small hand-lettered 'n' (the "
     "feed-forward bulk), on the other a box that grows visibly with a hand-lettered 'n²' (the attention "
     "core). At short lengths the squat box wins and the seesaw tips left; Serega stands at the fulcrum "
     "chalking the exact tipping point. Hand-lettered 'where does it tip?'. Black ink + course-blue boxes + "
     "one warm-orange fulcrum; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-07-the-box-that-never-exists.png", "4:3", True,
     "FLASH-ATTENTION: the WIRE STAYS, the TENSOR GOES. A huge crate labelled with a hand-lettered 'n×n' sits "
     "in the middle of a wiring run, dwarfing everything; Serega, straining, DELETES the crate (an eraser "
     "sweeping it into a ghostly dotted outline) while the wires through it stay perfectly connected. Hand-"
     "lettered 'never build it'. Black ink + course-blue wires + one warm-orange eraser; Serega's green "
     "tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-08-cache-drum.png", "4:3", True,
     "the KV CACHE = an AXIS THAT GROWS. Serega feeds tokens one at a time into a machine while a fat CABLE "
     "DRUM beside him winds on, getting visibly heavier with every token; he braces against its weight. A "
     "small hand-lettered weight-tag hangs off the drum. Hand-lettered 'it grows'. Black ink + course-blue "
     "cable + warm-orange weight-tag; Serega's green tübetey the ONLY green. No lettered title bar. Fills "
     "≥80% width."),
    ("L19", "L19/L19-09-silent-short.png", "4:3", True,
     "the BUG THAT NEVER BLOWS THE FUSE. A wiring board where one wire is soldered to the WRONG terminal — "
     "but nothing sparks, no fuse blows, no smoke: the machine hums along contentedly, quietly producing "
     "nonsense. Serega leans in with a torch, and only the DIAGRAM in his other hand reveals the wrong "
     "terminal. Hand-lettered 'no stack trace'. Black ink + course-blue board + one warm-orange wrong-wire; "
     "Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-10-draw-your-own.png", "4:3", True,
     "DRAW YOUR OWN. Serega at a drafting table, sleeves rolled, drawing the wiring diagram of HIS OWN machine "
     "from scratch — a fresh sheet, ruler, a few confident wires already down, the real machine on the bench "
     "beside him for reference. Hand-lettered 'now yours'. Black ink + course-blue drawing + thin warm-orange "
     "ruler-line; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L19", "L19/L19-11-reads-the-price.png", "16:9", True,
     "FINAL. EXACTLY ONE Serega. He stands before a big finished WIRING DIAGRAM pinned up on the wall and "
     "traces one wire across it with his fingertip, saying the price out loud; a small warm-orange PRICE TAG "
     "on a string hangs from the wire exactly where his fingertip rests, and on the tag is a hand-drawn "
     "currency mark (no words). Behind him the real machine hums with its panels open, every wire legible. "
     "CRITICAL: do NOT label or caption any object with its own name — no 'Serega', no 'machine', no "
     "'diagram', no 'price-tag' captions and no arrows pointing at nouns. The ONLY hand-lettering anywhere in "
     "the plate is the single phrase 'the diagram is the invoice'. Earned, warm send-off. Black ink + "
     "course-blue wires + one warm-orange tag; Serega's green tübetey is the ONLY green. No lettered title "
     "bar. Fills ≥85% width."),

    # ---- L20 "Search in Russian" (supplementary). Metaphor: morphology strikes back — a Russian word carries
    #      case/number inside itself, so the English-trained Tokenosaurus chokes on it and pays a token tax;
    #      lemmatization folds the forms; dense retrieval matches meaning. Cameo: Tokenosaurus (the L2 tokenizer
    #      dinosaur). Serega in every plate. ----
    ("L20", "L20/L20-00-morphology-strikes-back.png", "16:9", True,
     "HERO. Serega stands beside Tokenosaurus (the friendly tokenizer dinosaur). The dinosaur bites a short "
     "English word-card whole in one clean chomp, but CHOKES on a long Russian word-card that shatters in his "
     "mouth into many little sub-word crumbs flying apart; a small vertical tally-meter beside them fills up "
     "with the extra crumbs. Serega gestures 'see the tax'. Hand-lettered tag 'token tax'. Tokenosaurus is "
     "BARE-HEADED (blue + orange, no green); Serega's green tübetey is the ONLY green. Black ink + course-blue "
     "+ one warm-orange meter. No lettered title bar. Fills ≥85% width."),
    ("L20", "L20/L20-01-token-tax.png", "4:3", True,
     "the TOKEN TAX, counted. On the LEFT one English word-card swallowed as a SINGLE tidy token; on the RIGHT "
     "one Russian word-card broken into SEVEN little character-tiles in a row. A small balance-scale between "
     "them tips heavily to the Russian side, and a tiny meter reads a multiplier mark. Serega points at the "
     "lopsided scale, wry. Hand-lettered '1 token' / 'many'. Black ink + course-blue tiles + one warm-orange "
     "scale-pan; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L20", "L20/L20-02-noun-paradigm.png", "4:3", True,
     "ONE WORD, MANY FORMS. Serega holds up a single noun-card that wears twelve different little costumes on a "
     "coat-rack behind it (the six cases across two numbers), all clearly the SAME character in different "
     "outfits. Below, a keyword-index filing cabinet mistakenly files them as ten separate unrelated cards in "
     "ten slots. Serega looks exasperated. Hand-lettered 'one word'. Black ink + course-blue + one warm-orange "
     "accent on the rack; Serega's green tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L20", "L20/L20-03-bm25-inversion.png", "4:3", True,
     "the RANKING INVERSION. A little vertical ranking-board with three document-cards. LEFT panel 'by form': "
     "an off-topic DECOY card sits at the TOP (#1) while the true GOLD answer-card is buried at #2, greyed. "
     "RIGHT panel 'by lemma': the GOLD card has JUMPED to #1 and glows, the decoy dropped. A warm-orange arrow "
     "shows the gold card rising. Serega points proudly at the risen gold card. Hand-lettered 'form' / 'lemma'. "
     "Black ink + course-blue cards + one warm-orange arrow; Serega's green tübetey the ONLY green. No lettered "
     "title bar. Fills ≥80% width."),
    ("L20", "L20/L20-04-lemma-mill.png", "4:3", True,
     "the LEMMA MILL. Serega turns the crank of a hand-mill; into the top hopper he pours several different "
     "inflected word-cards (clearly variants of one word), and out of the chute drops ONE tidy normalized "
     "lemma-card that lands neatly in an index box. A little funnel-of-forms narrows to one. Hand-lettered "
     "'many forms' / 'one lemma'. Black ink + course-blue mill + one warm-orange chute; Serega's green tübetey "
     "the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L20", "L20/L20-05-multilingual-space.png", "4:3", True,
     "ONE SHARED SPACE. Serega stands before a single soft cloud/coordinate space where two Russian word-cards "
     "(one plain, one inflected) land RIGHT NEXT to each other, and an English word-card of the same meaning "
     "lands nearby too — a small warm-orange link joining the near neighbours. Meaning, not spelling, decides "
     "closeness. Hand-lettered 'meaning'. Black ink + course-blue cloud + one warm-orange link; Serega's green "
     "tübetey the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L20", "L20/L20-06-small-cuts.png", "4:3", True,
     "the THOUSAND SMALL CUTS. Serega dressed as a calm medic bandages a patient-card labelled with a small "
     "heart-and-arrow 'recall' symbol (no long words) covered in many tiny nicks; beside each nick a small "
     "mischievous ortho-gremlin holds a little tag — 'ё/е', 'CASE', 'translit', 'ghbdtn'. None fatal alone, "
     "many together. Serega applies one small warm-orange plaster. The gremlins are BARE-HEADED, blue, NO "
     "green. Black ink + course-blue + one warm-orange plaster; Serega's green tübetey the ONLY green. No "
     "lettered title bar. Fills ≥80% width."),
    ("L20", "L20/L20-07-morphology-tamed.png", "16:9", True,
     "FINAL. EXACTLY ONE Serega. He stands proudly beside a now-calm, well-fed Tokenosaurus who gently holds a "
     "Russian word neatly reduced to ONE tidy lemma-card (no more choking); behind them a small ranking-board "
     "shows the gold answer-card risen to the #1 slot and glowing. Earned, warm send-off. Tokenosaurus is "
     "BARE-HEADED (blue + orange, no green). The ONLY hand-lettering anywhere is the single short phrase 'one "
     "form, both arms'. Black ink + course-blue + one warm-orange #1 highlight; Serega's green tübetey is the "
     "ONLY green. No lettered title bar. Fills ≥85% width."),
    # -- L20 wave 2 (depth pass): the zero-overlap hook, the morphology typology, the Snowball cascade,
    #    the stem/lemma fork, the empty postings drawer, the vocabulary arc, homoglyphs, and the launch
    #    checklist. Cameos: Tokenosaurus + the Lexical Gremlin, both bare-headed and green-free. --
    ("L20", "L20/L20-08-zero-shared-letters.png", "16:9", True,
     "ZERO SHARED LETTERS. Two big text-cards lie side by side on Serega's desk; he runs a magnifying glass "
     "over them hunting for even ONE letter they share, and finds none. Between the cards a taut string with a "
     "little hand-lettered tag '0 shared' sags and SNAPS. Out at the margin a tiny Lexical Gremlin gleefully "
     "bangs down a rubber stamp reading 'no match'. The gremlin is BARE-HEADED, blue, with no green on him. "
     "Black ink + course-blue cards; warm-orange only on the stamp; Serega's green tübetey is the ONLY green. "
     "No lettered title bar. Fills ≥85% width."),
    ("L20", "L20/L20-09-three-morphologies.png", "16:9", True,
     "THREE WORKBENCHES. There is EXACTLY ONE Serega in this picture — one single figure, drawn ONCE, standing "
     "at the LEFT edge of the scene with an arm sweeping along the row; never two Seregas, never three, never "
     "one per bench, no twin, no clone, no repeated figure of any kind. To his right stand three benches in a "
     "row. FIRST bench, hand-lettered 'fused': one word-blank with a single multi-notched plate FUSED into it, "
     "three meanings stamped on that one inseparable plate. SECOND bench, hand-lettered 'glued': the same "
     "word-blank with THREE separate washers threaded onto it in a row, each carrying one meaning, each easily "
     "slid off. THIRD bench, hand-lettered 'apart': the word-blank bare, its three meanings lying beside it as "
     "three separate little word-cards. Black ink + course-blue benches + one warm-orange accent on the fused "
     "plate; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    ("L20", "L20/L20-10-snowball-cascade.png", "4:3", True,
     "THE CASCADE. A word-blank enters the top of a vertical run of FOUR slanted sieve-chutes; on each sieve a "
     "shaved-off tail-piece stays behind while the word drops on, shorter each time. Beside the chutes a tall "
     "vertical ruler with three hand-lettered marks, 'RV', 'R1', 'R2', showing below which line the cutter is "
     "allowed to cut. At the bottom a short stub lands in a tray — and it is plainly NOT a word any more. "
     "Serega stands to one side steadying the ruler. Black ink + course-blue chutes + one warm-orange cut-line; "
     "Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥80% width."),
    ("L20", "L20/L20-11-stem-vs-lemma-fork.png", "16:9", True,
     "THE FORK. Two pipes, one above the other, each ending in trays on the right. The UPPER pipe carries a "
     "small AXE on its casing and is hand-lettered 'cut' ONCE, on the pipe itself: out of it three different "
     "forms of ONE word drop into THREE separate trays (they should have met), while two plainly DIFFERENT "
     "words drop together into ONE shared tray (they should not have). The LOWER pipe carries a plain closed "
     "BOOK on its casing — the book's cover is completely BLANK, with no lettering, no title and no marks of "
     "any kind on it — and the pipe is hand-lettered 'look it up' ONCE: out of it every form converges into a "
     "single tray, though one lone question mark hangs over that tray. Serega stands between the two pipes "
     "comparing the trays. The ONLY lettering anywhere in the image is the two short labels 'cut' and 'look it "
     "up', each written once, horizontally, in lower case. Black ink + course-blue pipes + warm-orange rims on "
     "the WRONG trays only; Serega's green tübetey is the ONLY green. No lettered title bar. Fills ≥85% width."),
    ("L20", "L20/L20-12-empty-postings.png", "4:3", True,
     "THE EMPTY DRAWER. A card-catalogue of the inverted index, its drawers labelled with different forms of "
     "one word. Serega pulls one drawer fully open and it is ABSOLUTELY empty — bare boards and a cobweb. On "
     "the desk nearby lies exactly the document he wanted, and between that drawer and the document there is "
     "NOT ONE thread, while every neighbouring drawer has threads running out to documents. A small "
     "hand-lettered tag on the empty drawer reads 'df = 0'. Tokenosaurus peers down into the empty drawer and "
     "snorts, disappointed. Tokenosaurus is BARE-HEADED (blue + orange, no green). Black ink + course-blue "
     "cabinet + one warm-orange thread; Serega's green tübetey is the ONLY green. No lettered title bar. "
     "Fills ≥80% width."),
    ("L20", "L20/L20-13-vocab-arc.png", "16:9", True,
     "THE VOCABULARY ARC. Three hand-mills stand in a row, each with a short label on its own body: '50k', "
     "'100k', '200k'. The SAME blank word-slab drops into each from above. Out of the first pours a handful of "
     "tiny crumbs; out of the second, three clean slices; out of the third, one whole piece. Under each mill a "
     "measuring flask whose level falls from left to right. Serega stands at the third mill giving a "
     "thumbs-up; Tokenosaurus at the first is choking on the crumbs. The ONLY lettering in the entire image is "
     "the three mill labels '50k', '100k' and '200k' — do NOT name or caption any object or character, do NOT "
     "write 'Serega', 'Tokenosaurus', 'word', 'flask' or any other word anywhere, and add no numbers beyond "
     "those three labels. Tokenosaurus is BARE-HEADED (blue + orange, no green). Black ink + course-blue mills "
     "+ one warm-orange flask level; Serega's green tübetey is the ONLY green. No lettered title bar. "
     "Fills ≥85% width."),
    ("L20", "L20/L20-14-homoglyph-mask.png", "4:3", True,
     "THE IMPOSTOR LETTERS. A row of SEVEN big capital letters hangs on a wall like plaques, and every one of "
     "them is the SAME shape: seven identical capital letter 'A' plaques side by side, indistinguishable at a "
     "glance. Serega shines a small lamp along the row, and inside the warm-orange beam THREE of the seven "
     "letters are revealed filled solid course-blue while the other four stay plain black outline — the three "
     "blue ones are the impostors hiding among their neighbours. Under every letter hangs a small blank tally "
     "tag: the four tags under the black letters each carry two short tally strokes, the three tags under the "
     "blue letters each carry three, so the impostors' tags plainly differ. Nearby the Lexical Gremlin, "
     "wearing a small domino eye-mask, tips a wink and tries to slip past. The revealed tint is course-blue "
     "and never green. The ONLY letters drawn anywhere are the seven identical capital A plaques; write no "
     "words, no captions and no numbers. The gremlin is BARE-HEADED, blue, with no green on him. Black ink + "
     "course-blue letters + one warm-orange lamp-beam; Serega's green tübetey is the ONLY green. No lettered "
     "title bar. Fills ≥80% width."),
    ("L20", "L20/L20-15-launch-checklist.png", "16:9", True,
     "THE LAUNCH DESK. Serega at the control desk of a Russian search stack: a tall CHECKLIST clipped to a "
     "board, ten line-items, nine already ticked, and he is ticking the tenth right now beside the single "
     "hand-lettered line 'measure on your own data'. Behind the desk two big levers — one for the index side, "
     "one for the query side — are COUPLED by a single tie-rod so neither can move without the other. A calm, "
     "well-fed Tokenosaurus dozes beside the desk. Tokenosaurus is BARE-HEADED (blue + orange, no green). "
     "Black ink + course-blue desk + warm-orange tick-marks; Serega's green tübetey is the ONLY green. No "
     "lettered title bar. Fills ≥85% width."),
]

H = {"Authorization": f"Bearer {API_KEY}"}

def build_prompt(has_serega, scene):
    # Single source of truth = mascots.py: inject the LOCKED `appearance` of every NON-Serega cast
    # member named (by keyword) in the scene, so the canon — not a brief's paraphrase — drives each
    # mascot's look (the same guarantee SEREGA already gets). Keywords are specific (e.g. "victor the
    # vector", "wraith", "ragdoll", "chunk norris", "confabulous") so a generic word never false-triggers.
    low = scene.lower()
    cast = "".join(" Recurring cast — keep this EXACT locked design: " + v["appearance"]
                   for m, v in MASCOTS.items()
                   if m != "serega" and any(kw in low for kw in v["keywords"]))
    return PREAMBLE + (SEREGA if has_serega else "") + cast + scene + ANTIPATTERN

def generate_one(job, force=False, ref_url=None, model=MODEL):
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
        body = {"prompt": prompt, "mode": "image", "image_url": ref_url, "model": model,
                "aspect_ratio": aspect, "resolution": res, "num_images": 1, "output_format": "png"}
    else:
        prompt = build_prompt(has_serega, scene)
        body = {"prompt": prompt, "mode": "text", "model": model,
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
    model = MODEL
    if "--model" in args:
        idx = args.index("--model"); model = args[idx+1] if idx+1 < len(args) else MODEL; del args[idx:idx+2]
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
    print(f"[gen] {len(jobs)} job(s) · model={model}" + (f" · ref={ref_url[:50]}…" if ref_url else " · text-only"))
    counts = {"ok": 0, "skip": 0, "error": 0}
    errors = []
    for job in jobs:
        st, fname = generate_one(job, force=force, ref_url=ref_url, model=model)
        counts[st] += 1
        if st == "error":
            errors.append(fname)
    print(f"\n[gen] done: {counts['ok']} ok, {counts['skip']} skipped, {counts['error']} errors")
    if errors:
        print("  failed:", ", ".join(errors))
        sys.exit(1)

if __name__ == "__main__":
    main()
