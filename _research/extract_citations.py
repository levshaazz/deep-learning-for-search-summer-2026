#!/usr/bin/env python3
"""
extract_citations.py — AUDIT_V2 §1.3 (part 1): deterministic citation extraction.

Pulls every inline author–year attribution from the three decks together with the SENTENCE that
makes the claim (the "claimed contribution"). Output feeds the CoVe verifier (a fresh-context
claim-verifier agent that has NOT seen the decks): it checks that each attribution matches the
paper's ACTUAL contribution — the class of bug that produced the session-4 Craswell/Joachims drift.

Output: _research/data/citations.json — [{id, deck, slide, citation, claim}].
Run the verifier on it with the claim-verifier subagent (see iterate.sh CoVe stage / README).
"""
from __future__ import annotations
import re, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DECKS = {
    "L0": ROOT / "Lectures/00-introduction.html",
    "L1": ROOT / "Lectures/01-search-ir-ml-system-design.html",
    "L2": ROOT / "Lectures/02-nlp-tokenization-similarity.html",
}
# author(s) + year — "Smith 2008", "Smith & Jones 2005", "Smith et al. (2016)"
CITE = re.compile(r'([A-Z][a-zA-Z]+(?:(?:,? (?:&|and) [A-Z][a-zA-Z]+)|(?:,? et al\.?))?)[,\s]+\(?((?:19|20)\d{2})\)?')
# leading tokens that are venues / months / seasons, NOT author surnames → drop
STOP = {"Summer","Winter","Fall","Spring","Autumn","RecSys","NeurIPS","SIGIR","WSDM","ICML","ICLR",
        "ACL","EMNLP","NAACL","KDD","WWW","CIKM","TREC","Vol","Part","Chapter","Table","Figure",
        "Section","January","February","March","April","May","June","July","August","September",
        "October","November","December","Proceedings","Conference","Journal","Workshop",
        # venues / publishers / months / non-author leading tokens seen in the bibliography text
        "University","Forum","CACM","ICDT","Reilly","Developers","Beyond","Megatrends","Bio",
        "Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Sept","Oct","Nov","Dec","Pearson","Manning"}
SKIP_TYPES = {"refs", "final", "title"}   # bibliography / closing / cover — not contribution claims
DTYPE = re.compile(r'data-type="([^"]*)"')
SECTION = re.compile(r'<section class="slide"([^>]*)>(.*?)</section>', re.S)
LABEL = re.compile(r'data-screen-label="([^"]*)"')

def text_of(html_fragment):
    t = re.sub(r'<aside class="slide-notes".*?</aside>', ' ', html_fragment, flags=re.S)  # notes aren't shown
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()

def sentence_around(text, idx):
    start = max(text.rfind('. ', 0, idx) + 2, 0)
    end = text.find('. ', idx); end = end + 1 if end != -1 else min(len(text), idx + 200)
    return text[start:end].strip()

def extract():
    out, seen = [], set()
    for deck, p in DECKS.items():
        html = p.read_text()
        for attrs, body in SECTION.findall(html):
            lab = (LABEL.search(attrs).group(1) if LABEL.search(attrs) else "?")
            dt = (DTYPE.search(attrs).group(1) if DTYPE.search(attrs) else "?")
            if dt in SKIP_TYPES:
                continue
            txt = text_of(body)
            for m in CITE.finditer(txt):
                authors, year = m.group(1).strip(), m.group(2)
                lead = authors.split()[0].rstrip(",")
                if lead in STOP:
                    continue
                citation = f"{authors} {year}"
                key = re.sub(r'\W+', '', citation).lower()
                if key in seen:
                    continue
                seen.add(key)
                out.append({"id": f"{deck}:{lab.split()[0]}", "deck": deck, "slide": lab,
                            "citation": citation, "claim": sentence_around(txt, m.start())})
    return out

if __name__ == "__main__":
    cites = extract()
    (ROOT / "_research/data/citations.json").write_text(json.dumps(cites, indent=2) + "\n")
    print(f"[extract_citations] {len(cites)} unique attributions → _research/data/citations.json")
    for c in cites:
        print(f"  {c['id']:8} {c['citation']:28} — {c['claim'][:70]}")
