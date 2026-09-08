#!/usr/bin/env python3
"""
wire_art.py — Phase D mode-2 wiring: inside a given slide, swap the first
<svg>…</svg> in its .viz-frame for an <img>, and strip that slide's stale
IMAGE PROMPT speaker-note draft. Section-scoped by data-screen-label so it
only ever touches the intended slide.

Usage: python3 _research/wire_art.py <deck-key>     # deck-key: L0 | L1 | L2
"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LECT = ROOT / "Lectures"
IMG_STYLE = 'style="width:100%;height:100%;object-fit:contain;display:block;"'

DECKS = {
    "L1": ("01-search-ir-ml-system-design.html", [
        ("08 Visualization · Lossy need", "assets/img/L1/L1-08-lossy-need.png",
         "Need compressed through a funnel into a two-word query, then fanned out to documents"),
        ("22 Recall ceiling", "assets/img/L1/L1-22-leaky-bucket.png",
         "Leaky bucket of stars; the reranker robot cannot grab stars that already fell through"),
        ("24 Visualization · Lexical gap", "assets/img/L1/L1-24-lexical-gremlin.png",
         "The Lexical Gremlin holds a BM25 wall between couch and sofa; jaguar splits into cat, car, laptop"),
        ("25 Visualization · Long tail", "assets/img/L1/L1-25-zipf-beach.png",
         "Zipf long tail drawn as a beach: head sandcastles, endless never-seen-before tail"),
        ("33 ML iceberg", "assets/img/L1/L1-33-iceberg.png",
         "ML iceberg: tiny ML-code tip above the waterline, vast hidden infrastructure below"),
        ("40 Visualization · Goodhart", "assets/img/L1/L1-40-goodhart.png",
         "Goodhart the Trickster pulls the CTR line up with a clickbait hook as real satisfaction falls"),
    ]),
    "L2": ("02-nlp-tokenization-similarity.html", [
        ("8 Discreteness", "assets/img/L2/L2-08-discreteness.png",
         "Smooth interpolation bar vs discrete cat / dog word-boxes with no in-between word"),
        ("10 Zipf", "assets/img/L2/L2-10-zipf.png",
         "Steep Zipf bar chart: the, of, and tower over a long flat tail of words seen once"),
        ("37 Digits", "assets/img/L2/L2-37-digits.png",
         "The number 327 scissored two different ways; place values do not line up"),
        ("41 Token tax", "assets/img/L2/L2-41-token-tax.png",
         "Token-coins per language: English short, Hindi/Telugu/Turkish tall; same sentence, bigger bill"),
        ("62 Concentration", "assets/img/L2/L2-62-concentration.png",
         "Histograms d=2,10,100,1000 collapsing from a wide hill to a thin spike; everything equidistant"),
        ("63 Hubness", "assets/img/L2/L2-63-hubness.png",
         "A crowd all pointing at two crowned hub figures; a few points hog all the neighbours"),
        ("64 Anisotropy", "assets/img/L2/L2-64-anisotropy.png",
         "A narrow cone of arrows that all look similar versus a balanced whitened sphere of arrows"),
    ]),
}

def wire(html, label, img, alt):
    pat = re.compile(
        r'(<section class="slide"[^>]*data-screen-label="' + re.escape(label) + r'"[^>]*>)(.*?)(</section>)',
        re.DOTALL)
    m = pat.search(html)
    if not m:
        print(f"  ! label not found: {label}"); return html, False
    head, body, tail = m.group(1), m.group(2), m.group(3)
    svg = re.compile(r'<svg\b.*?</svg>', re.DOTALL)
    if not svg.search(body):
        print(f"  ! no <svg> in: {label}"); return html, False
    imgtag = f'<img src="{img}?v=1" alt="{alt}" {IMG_STYLE} />'
    body = svg.sub(imgtag, body, count=1)
    body = re.sub(r'\s*<strong>IMAGE PROMPT.*?(?=</aside>)', '', body, flags=re.DOTALL)
    print(f"  ✓ wired {label}")
    return html[:m.start()] + head + body + tail + html[m.end():], True

def main():
    key = sys.argv[1] if len(sys.argv) > 1 else ""
    if key not in DECKS:
        raise SystemExit("usage: wire_art.py <L1|L2>")
    fname, jobs = DECKS[key]
    path = LECT / fname
    html = path.read_text()
    n = 0
    for label, img, alt in jobs:
        html, ok = wire(html, label, img, alt)
        n += ok
    path.write_text(html)
    print(f"[wire_art:{key}] {n}/{len(jobs)} slides wired")

if __name__ == "__main__":
    main()
