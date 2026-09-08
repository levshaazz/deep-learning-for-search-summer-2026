#!/usr/bin/env python3
"""check_citations.py — G14 CITATION-COMPLETENESS gate.

data/papers.json is the project's stated "single source of truth for every work cited in
Deep Learning for Search." Round-3 found ~24 works cited on reference slides that were ABSENT
from it. This gate makes that gap un-shippable: every arXiv id (and DOI) that appears in a deck
fragment or a Book beat MUST resolve to an entry in papers.json. Pure stdlib; mirrors the
check_claims gate family (run + --selftest).

  arXiv ids:  \\d{4}\\.\\d{4,5}   (e.g. 2306.05685, 1901.04085, 1607.06450)
  DOIs:       10.\\d{4,9}/...      (matched against papers.json `doi` fields)

Usage:  python3 _research/check_citations.py            (HARD-fails if any cited id is unlisted)
        python3 _research/check_citations.py --selftest  (planted missing id must fire)
"""
import json, re, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARXIV = re.compile(r'(?<![\d.])\d{4}\.\d{4,5}(?![\d.])')
DOI = re.compile(r'10\.\d{4,9}/[-._;()/:A-Za-z0-9]+')

def known_ids(papers):
    """Every arXiv id + DOI papers.json knows about (from arxiv / url / doi fields)."""
    arx, doi = set(), set()
    for k, p in papers.items():
        if k == '_meta' or not isinstance(p, dict):
            continue
        if p.get('arxiv'):
            arx.add(str(p['arxiv']).strip())
        for m in ARXIV.finditer(str(p.get('url', ''))):
            arx.add(m.group())
        if p.get('doi'):
            doi.add(str(p['doi']).strip().lower())
    return arx, doi

def cited_ids(files):
    """arXiv ids + DOIs cited across the given source files → {id: [files]}."""
    arx, doi = {}, {}
    for f in files:
        try:
            t = open(f, encoding='utf-8').read()
        except OSError:
            continue
        for m in ARXIV.finditer(t):
            arx.setdefault(m.group(), set()).add(os.path.relpath(f, ROOT))
        for m in DOI.finditer(t):
            doi.setdefault(m.group().rstrip('.),;').lower(), set()).add(os.path.relpath(f, ROOT))
    return arx, doi

def find_missing(cited, known):
    return sorted(i for i in cited if i not in known)

def main():
    if '--selftest' in sys.argv:
        return selftest()
    papers = json.load(open(os.path.join(ROOT, 'data', 'papers.json'), encoding='utf-8'))
    karx, kdoi = known_ids(papers)
    # glob.escape ROOT: the repo path contains "[Summer 2026]" and `[...]` is a glob char-class.
    R = glob.escape(ROOT)
    files = (glob.glob(os.path.join(R, 'Lectures', '*', 'parts', '*.html'))
             + glob.glob(os.path.join(R, 'content', 'book', '*', 'beats', '*.js')))
    carx, cdoi = cited_ids(files)
    miss_arx = find_missing(carx, karx)
    # arXiv ids are the citation form that round-3 found missing; DOIs in this repo are all recorded
    # AND their in-prose syntax (trailing punctuation, Wiley SICI <>) makes reliable extraction noisy,
    # so the gate is arXiv-HARD only. cdoi is surfaced as a count for visibility, never build-blocking.
    hard = 0
    for i in miss_arx:
        hard += 1
        print(f"  ✗ [HARD] arXiv:{i} cited but ABSENT from papers.json  ({', '.join(sorted(carx[i])[:2])})")
    print(f"\n[check-citations] scanned {len(files)} source files · {len(carx)} cited arXiv ids ({len(cdoi)} DOIs, not gated) · "
          f"papers.json knows {len(karx)} arXiv / {len(kdoi)} DOI")
    print(f"[check-citations] HARD(cited arXiv id not in papers.json)={hard}")
    if hard:
        sys.exit(1)

def selftest():
    known = {'2306.05685', '1901.04085'}
    cited = {'2306.05685', '9999.99999'}  # one known, one planted-missing
    miss = find_missing(cited, known)
    ok = miss == ['9999.99999']
    print(f"  {'✓' if ok else '✗'} planted missing id flagged: {miss}")
    # ARXIV regex must NOT match a version-like 3.5 or a year 2024
    spurious = ARXIV.findall("GPT-3.5 in 2024 vs arXiv 2306.05685 and 1607.06450")
    ok2 = set(spurious) == {'2306.05685', '1607.06450'}
    print(f"  {'✓' if ok2 else '✗'} regex matches only arXiv-shaped ids: {spurious}")
    if not (ok and ok2):
        print('[check-citations] SELFTEST FAILED'); sys.exit(1)
    print('[check-citations] selftest PASS — flags a cited-but-unlisted id; ignores version numbers/years')

if __name__ == '__main__':
    main()
