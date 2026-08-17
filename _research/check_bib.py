#!/usr/bin/env python3
"""check_bib.py — BIB gate: every cited work agrees with data/papers.json, the single
source of truth for the course bibliography.

Why it exists: one work carried two different years in two decks (HNSW: 2018 in deck 10,
2020 in deck 13; Step-Back: 2023 in deck 15, 2024 in deck 17) and nothing burned, because
the bibliography lived as free-typed prose. The fix is a key, not fuzzy text: every
bibliography <li> on a references slide carries data-paper-id="<key from papers.json>"
(several space-separated keys when one <li> legitimately cites several works — e.g. the
"Selected course papers" roll-up in deck 00 or the RusBEIR pair in deck 19), and this gate
compares the displayed record against the keyed entry.

Rules:
  A (HARD)  every arXiv id `arXiv:NNNN.NNNNN` / arxiv.org/abs/NNNN.NNNNN appearing in
            Lectures/*/parts/*.html or content/book/*/beats/*.js exists in papers.json.
  B (HARD)  every <li> containing ref-authors on a references slide (parts file whose
            basename contains "references" or "refs") carries data-paper-id, and every
            key in it exists in papers.json. Entries with NO papers.json record yet are
            grandfathered in KNOWN_UNTAGGED below — that list may only shrink: the next
            iteration adds the records to papers.json and tags them.
  C (HARD)  surnames displayed in ref-authors are a subset of the entry's authors
            (union over all keys of the <li>). Particles (van/von/de la/…) and multi-word
            surnames (Spärck Jones) are handled; corporate authors ("Jina AI",
            "OpenAI / HuggingFace") carry no "Surname, I." pattern and are skipped.
  D (HARD)  the displayed ref-year equals the entry's `year` (any key of the <li>);
            and one paper id may not carry two different displayed years across decks.
  E (WARN)  ref-venue agrees with the entry's `venue` (normalized containment either way,
            or via the VENUE_ABBREV table below).
  Non-empty guard (правило П4): fewer than MIN_TAGGED tagged entries on a real run means
  the scanner itself is broken — exit 1, a hollow pass must not look green.

Usage:  python3 _research/check_bib.py              (gate the tree)
        python3 _research/check_bib.py --selftest   (fixtures: each rule fires / stays silent)
        python3 _research/check_bib.py --list-untagged   (debug: dump untagged entries)

NOT registered in CI yet (FIX-plan 4.2 — registration is a separate step).
"""
import re
import sys
import os
import glob
import json
import html
import unicodedata
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN_TAGGED = 200  # non-empty guard: 231 tagged today; a scanner that lost most of them must not look green

ARXIV_RE = re.compile(r'(?:arxiv\.org/abs/|arXiv:\s?)(\d{4}\.\d{4,5})')
LI_RE = re.compile(r'<li\b[^>]*>.*?</li>', re.S)
PAPER_ID_RE = re.compile(r'data-paper-id="([^"]+)"')

# a personal-name chunk looks like "Surname, I." — capture the (possibly particled,
# possibly multi-word) surname right before a comma that is followed by a capital initial
PARTICLES = r"(?:van|von|der|de|del|della|den|da|dos|la|le)"
SURNAME_RE = re.compile(
    r"((?:%s\s+)*[A-ZÀ-Ž][\w'’\-]+(?:\s+[A-ZÀ-Ž][\w'’\-]+)*)\s*,\s*(?=[A-ZÀ-Ž])" % PARTICLES)

# rule E: known venue abbreviations → substrings accepted in the papers.json venue
VENUE_ABBREV = {
    'SIGIR':   ['sigir', 'acm sigir'],
    'EMNLP':   ['emnlp', 'empirical methods in natural language processing'],
    'NeurIPS': ['neurips', 'nips', 'neural information processing systems'],
    'ICLR':    ['iclr', 'international conference on learning representations'],
    'ICML':    ['icml', 'international conference on machine learning'],
    'ACL':     ['acl', 'association for computational linguistics'],
    'NAACL':   ['naacl'],
    'EACL':    ['eacl'],
    'COLING':  ['coling'],
    'CACM':    ['cacm', 'communications of the acm'],
    'JMLR':    ['jmlr', 'journal of machine learning research'],
    'TMLR':    ['tmlr', 'transactions on machine learning research'],
    'TACL':    ['tacl', 'transactions of the association for computational linguistics'],
    'TPAMI':   ['tpami', 'pattern analysis and machine intelligence'],
    'TOIS':    ['tois', 'transactions on information systems'],
    'KDD':     ['kdd', 'knowledge discovery and data mining'],
    'WWW':     ['www', 'world wide web'],
    'CIKM':    ['cikm', 'information and knowledge management'],
    'WSDM':    ['wsdm', 'web search and data mining'],
    'ECIR':    ['ecir', 'european conference on information retrieval'],
    'TREC':    ['trec', 'text retrieval conference'],
    'CVPR':    ['cvpr', 'computer vision and pattern recognition'],
    'VLDB':    ['vldb', 'very large data bases'],
    'AAAI':    ['aaai'],
    'BSNLP':   ['bsnlp'],
    'FAT*':    ['facct', 'fat'],
    'ICDT':    ['icdt'],
    'ESANN':   ['esann'],
    'SIGMOD':  ['sigmod'],
    'JACM':    ['journal of the acm'],
    'JASIS':   ['journal of the american society for information science'],
    'J. Documentation': ['journal of documentation'],
    'Found. & Trends':  ['foundations and trends'],
    'CUP':       ['cambridge university press'],
    'Cambridge': ['cambridge university press'],
    'arXiv':     ['arxiv'],
}

# ── B: bibliography entries with NO papers.json record yet (may only shrink) ─────────────
# Key: (parts-file basename, normalized ref-authors). These are real works the course
# cites whose records are simply not in papers.json yet — mostly the Shannon deck (04),
# textbooks/docs (SLP3, minBPE, tiktoken), vendor blogs (Jina/Weaviate/Anthropic/Chonkie),
# book chapters (Penrose 1971), tech reports (GPT-1/GPT-2) and RU standards (ГОСТ, UTS#39).
KNOWN_UNTAGGED = {
    ('Lectures/02-nlp-tokenization-similarity/parts/71-references.html', 'jurafsky d martin j h'),
    ('Lectures/02-nlp-tokenization-similarity/parts/71-references.html', 'karpathy a'),
    ('Lectures/02-nlp-tokenization-similarity/parts/71-references.html', 'openai huggingface'),
    ('Lectures/04-shannon-entropy/parts/44-refs-primary.html', 'hartley r v l'),
    ('Lectures/04-shannon-entropy/parts/44-refs-primary.html', 'markov a a'),
    ('Lectures/04-shannon-entropy/parts/44-refs-primary.html', 'nyquist h'),
    ('Lectures/04-shannon-entropy/parts/44-refs-primary.html', 'shannon c e'),
    ('Lectures/04-shannon-entropy/parts/45-refs-modern.html', 'brown p f della pietra s a della pietra v j lai j c mercer r l'),
    ('Lectures/04-shannon-entropy/parts/45-refs-modern.html', 'cover t m king r c'),
    ('Lectures/04-shannon-entropy/parts/45-refs-modern.html', 'huffman d a'),
    ('Lectures/04-shannon-entropy/parts/45-refs-modern.html', 'tribus m mcirvine e c'),
    ('Lectures/04-shannon-entropy/parts/45b-refs-search.html', 'church k w gale w a'),
    ('Lectures/04-shannon-entropy/parts/45b-refs-search.html', 'cronen townsend s zhou y croft w b'),
    ('Lectures/04-shannon-entropy/parts/45b-refs-search.html', 'jurafsky d martin j h'),
    ('Lectures/04-shannon-entropy/parts/45b-refs-search.html', 'lafferty j zhai c'),
    ('Lectures/04-shannon-entropy/parts/45b-refs-search.html', 'pibiri g e venturini r'),
    ('Lectures/04-shannon-entropy/parts/45b-refs-search.html', 'robertson s'),
    ('Lectures/04-shannon-entropy/parts/45b-refs-search.html', 'яглом а м яглом и м'),
    ('Lectures/08-bert-transformers/parts/075-refs-gpt-scaling.html', 'radford a et al'),
    ('Lectures/09-wiring-diagram/parts/56-references.html', 'abbott v zardini g'),
    ('Lectures/09-wiring-diagram/parts/56-references.html', 'penrose r'),
    ('Lectures/14-curved-map/parts/49-refs-fixes.html', 'schnitzer d flexer a schedl m widmer g'),
    ('Lectures/14-curved-map/parts/49b-refs-modern.html', 'ait saada m nadif m'),
    ('Lectures/14-curved-map/parts/49c-refs-hubness-practice.html', 'feldbauer r flexer a'),
    ('Lectures/18-late-chunking/parts/74-refs-context.html', 'anthropic'),
    ('Lectures/18-late-chunking/parts/75-refs-vendor.html', 'chonkie'),
    ('Lectures/18-late-chunking/parts/75-refs-vendor.html', 'jina ai'),
    ('Lectures/18-late-chunking/parts/75-refs-vendor.html', 'weaviate'),
    ('Lectures/19-russian-search/parts/45-refs-morphology.html', 'dolamic l savoy j'),
    ('Lectures/19-russian-search/parts/45-refs-morphology.html', 'segalovich i'),
    ('Lectures/19-russian-search/parts/46a-refs-tooling.html', 'porter m snowball'),
    ('Lectures/19-russian-search/parts/46a-refs-tooling.html', 'rubic2'),
    ('Lectures/19-russian-search/parts/46a-refs-tooling.html', 'unicode consortium apache lucene'),
    ('Lectures/19-russian-search/parts/46a-refs-tooling.html', 'инструменты tooling'),
    ('Lectures/19-russian-search/parts/46a-refs-tooling.html', 'стандарты и отраслевые данные standards industry data'),
}


def deaccent(s):
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))


def norm(s):
    """lowercase, deaccented, letters/digits only, single spaces (unicode-aware)."""
    s = deaccent(s.lower())
    s = re.sub(r'[^\w ]+', ' ', s, flags=re.UNICODE).replace('_', ' ')
    return re.sub(r'\s+', ' ', s).strip()


def strip_tags(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def load_papers():
    with open(os.path.join(ROOT, 'data', 'papers.json'), encoding='utf-8') as f:
        papers = json.load(f)
    papers.pop('_meta', None)
    return papers


def field(block, cls):
    """text content of the <span class=cls> — balanced, so nested lang-spans survive."""
    m = re.search(r'<span class="%s"[^>]*>' % cls, block)
    if not m:
        return ''
    depth, end = 1, len(block)
    for mm in re.finditer(r'<span\b|</span>', block[m.end():]):
        depth += 1 if mm.group(0) == '<span' else -1
        if depth == 0:
            end = m.end() + mm.start()
            break
    return strip_tags(block[m.end():end])


def surnames(authors_text):
    """personal surnames displayed in a ref-authors span; [] for corporate labels."""
    t = re.sub(r'\([^)]*\)', ' ', authors_text)        # drop "(OpenAI)" affiliations
    t = re.sub(r'\bet al\.?', ' ', t)
    return SURNAME_RE.findall(t)


def author_has_surname(surname, author_full_names):
    sn = norm(surname)
    return any(re.search(r'\b%s\b' % re.escape(sn), norm(a)) for a in author_full_names)


def venue_ok(ref_venue, entry_venue):
    rv, ev = norm(ref_venue), norm(entry_venue)
    if not rv or not ev:
        return True                                     # nothing displayed / recorded → not E's business
    if ev in rv or rv in ev:
        return True
    for abbr, expansions in VENUE_ABBREV.items():
        a = norm(abbr)
        if re.search(r'\b%s\b' % a, rv) and any(e in ev for e in expansions + [a]):
            return True
        if re.search(r'\b%s\b' % a, ev) and any(e in rv for e in expansions + [a]):
            return True
    return False


def check_ref_slides(ref_texts, papers, allow_untagged=KNOWN_UNTAGGED):
    """ref_texts: {display-name: html-text} of references slides.
    → (hard, warn, tagged_count, untagged_list, years_by_key)"""
    hard, warn, untagged = [], [], []
    tagged = 0
    years_by_key = defaultdict(set)                     # key → {(year, file)}
    for fname, text in ref_texts.items():
        # Ключ — display-имя целиком: basename прощал бы одноимённые файлы других дек.
        base = fname
        for m in LI_RE.finditer(text):
            block = m.group(0)
            if 'ref-authors' not in block:
                continue
            open_tag = block.split('>', 1)[0]
            authors = field(block, 'ref-authors')
            year_txt = field(block, 'ref-year')
            venue = field(block, 'ref-venue')
            idm = PAPER_ID_RE.search(open_tag)
            if not idm:
                if (base, norm(authors)) in allow_untagged:
                    untagged.append((fname, authors))
                else:
                    hard.append('B %s: запись «%s» без data-paper-id' % (fname, authors[:60]))
                continue
            keys = idm.group(1).split()
            missing = [k for k in keys if k not in papers]
            if missing:
                hard.append('B %s: ключ(и) %s нет в papers.json' % (fname, ', '.join(missing)))
                continue
            tagged += 1
            entries = [papers[k] for k in keys]
            # C: displayed surnames ⊆ union of entry authors. A literal "et al." IN the
            # papers.json author list makes it an open list (the record is truncated, e.g.
            # bert-flow-2020) — a displayed surname can then never be disproven, skip.
            all_authors = [a for e in entries for a in e.get('authors', [])]
            open_list = any(norm(a) == 'et al' for a in all_authors)
            if not open_list:
                for sn in surnames(authors):
                    if not author_has_surname(sn, all_authors):
                        hard.append('C %s [%s]: фамилия «%s» не среди авторов записи (%s)'
                                    % (fname, keys[0], sn, '; '.join(all_authors[:4])))
            # D: displayed year == entry year (any key)
            ym = re.fullmatch(r'(\d{4})', year_txt.strip())
            if ym:
                y = int(ym.group(1))
                entry_years = {e.get('year') for e in entries}
                if y not in entry_years:
                    hard.append('D %s [%s]: год на слайде %d ≠ papers.json %s'
                                % (fname, keys[0], y, sorted(entry_years)))
                for k in keys:
                    if papers[k].get('year') is not None:
                        years_by_key[k].add((y, fname))
            # E: venue agreement (single-key entries only — roll-ups have no single venue)
            if len(keys) == 1 and not venue_ok(venue, entries[0].get('venue', '')):
                warn.append('E %s [%s]: площадка «%s» ≠ «%s»'
                            % (fname, keys[0], venue[:50], entries[0].get('venue', '')[:50]))
    # D (cross-deck): one paper id, one displayed year
    for k, ys in years_by_key.items():
        distinct = {y for y, _ in ys}
        if len(distinct) > 1:
            hard.append('D [%s]: один id несёт разные годы по декам: %s'
                        % (k, sorted(ys)))
    # KNOWN_UNTAGGED может только сокращаться — и это механизм, а не комментарий (правило
    # G13/G22): запись, которой больше не соответствует непомеченный <li>, обязана быть
    # удалена — её разметили или файл переименован. Иначе allowlist тихо копит мёртвые
    # прощения; перевыпуск 2026-08-17 нашёл 4 таких на 39 записях.
    seen = {(f, norm(a)) for f, a in untagged}
    for entry in sorted(allow_untagged - seen):
        hard.append('B/allowlist %s: запись «%s» из KNOWN_UNTAGGED не найдена среди непомеченных — '
                    'удали её (список только сокращается)' % entry)
    return hard, warn, tagged, untagged


def check_arxiv_ids(texts, papers):
    """texts: {display-name: raw text}. Rule A."""
    known = {v['arxiv'] for v in papers.values() if v.get('arxiv')}
    hard = []
    for fname, text in texts.items():
        for a in sorted(set(ARXIV_RE.findall(html.unescape(text)))):
            if a not in known:
                hard.append('A %s: arXiv:%s нет в papers.json' % (fname, a))
    return hard


def collect_tree():
    ref_texts, all_texts = {}, {}
    for f in sorted(glob.glob(os.path.join(glob.escape(ROOT), 'Lectures', '*', 'parts', '*.html'))):
        rel = os.path.relpath(f, ROOT)
        text = open(f, encoding='utf-8').read()
        all_texts[rel] = text
        if re.search(r'(references|refs)', os.path.basename(f)):
            ref_texts[rel] = text
    for f in sorted(glob.glob(os.path.join(glob.escape(ROOT), 'content', 'book', '*', 'beats', '*.js'))):
        all_texts[os.path.relpath(f, ROOT)] = open(f, encoding='utf-8').read()
    return ref_texts, all_texts


def main():
    if '--selftest' in sys.argv:
        return selftest()
    papers = load_papers()
    ref_texts, all_texts = collect_tree()
    hard_a = check_arxiv_ids(all_texts, papers)
    hard_b, warn, tagged, untagged = check_ref_slides(ref_texts, papers)
    hard = hard_a + hard_b
    if '--list-untagged' in sys.argv:
        for f, a in untagged:
            print('UNTAGGED %s | %s' % (f, a))
    for msg in hard:
        print('  ✗ [HARD] %s' % msg)
    for msg in warn:
        print('  ! [WARN] %s' % msg)
    print('[check-bib] HARD(arXiv-id/ключ/авторы/год)=%d  WARN(площадка)=%d  '
          'ПОКРЫТИЕ=%d размеченных записей, %d в списке KNOWN_UNTAGGED'
          % (len(hard), len(warn), tagged, len(untagged)))
    if tagged < MIN_TAGGED:
        print('[check-bib] ✗ сканер сломан: найдено %d размеченных записей (< %d) — '
              'пустой прогон не может считаться зелёным' % (tagged, MIN_TAGGED))
        sys.exit(1)
    if hard:
        sys.exit(1)


# ── selftest ─────────────────────────────────────────────────────────────────────────────
FIX_PAPERS = {
    'goodwin-2020-valid': {
        'authors': ['Alice Goodwin', 'Bob van der Ok', 'Karen Spärck Jones'],
        'year': 2020, 'title': 'A Valid Paper', 'venue': 'SIGIR 2020', 'arxiv': '2001.00001',
    },
    'open-2020-etal': {
        'authors': ['Alice Goodwin', 'et al.'],
        'year': 2020, 'title': 'A Truncated Author List', 'venue': 'SIGIR 2020',
    },
}

def _li(authors, year, key=None, venue='SIGIR 2020', link='https://arxiv.org/abs/2001.00001'):
    attr = ' data-paper-id="%s"' % key if key else ''
    return ('<li%s><span class="ref-body"><span class="ref-authors">%s</span> · '
            '<span class="ref-title"><a href="%s">T</a></span> · '
            '<span class="ref-venue">%s</span></span>'
            '<span class="ref-year">%d</span></li>' % (attr, authors, link, venue, year))


def selftest():
    ok = []
    P = FIX_PAPERS
    valid = _li('Goodwin, A., van der Ok, B. &amp; Sp&auml;rck Jones, K.', 2020,
                key='goodwin-2020-valid')

    h, w, tagged, _ = check_ref_slides({'refs.html': valid}, P, allow_untagged=set())
    ok.append(('валидная запись молчит (HARD=0, WARN=0)', h == [] and w == [] and tagged == 1))

    h, _, _, _ = check_ref_slides({'refs.html': valid}, P,
                                  allow_untagged={('ghost.html', 'ghost a')})
    ok.append(('B/allowlist: мёртвое прощение горит (список только сокращается)',
               any('allowlist' in m for m in h)))

    h, _, _, _ = check_ref_slides(
        {'refs.html': _li('Goodwin, A. &amp; Extra, C.', 2020, key='goodwin-2020-valid')},
        P, allow_untagged=set())
    ok.append(('C: лишний соавтор горит', any(m.startswith('C') for m in h)))

    h, _, _, _ = check_ref_slides(
        {'refs.html': _li('Goodwin, A. &amp; Somebody, X.', 2020, key='open-2020-etal')},
        P, allow_untagged=set())
    ok.append(('C: открытый список авторов («et al.» в записи) не горит',
               not any(m.startswith('C') for m in h)))

    h, _, _, _ = check_ref_slides(
        {'refs.html': _li('Goodwin, A.', 2019, key='goodwin-2020-valid')}, P, allow_untagged=set())
    ok.append(('D: неверный год горит', any(m.startswith('D') for m in h)))

    h = check_arxiv_ids({'x.html': 'see arXiv:9999.99999 for details'}, P)
    ok.append(('A: несуществующий arXiv-id горит', any(m.startswith('A') for m in h)))
    h = check_arxiv_ids({'x.html': 'see arXiv:2001.00001'}, P)
    ok.append(('A: известный arXiv-id молчит', h == []))

    h, _, _, _ = check_ref_slides({'refs.html': _li('Goodwin, A.', 2020)}, P, allow_untagged=set())
    ok.append(('B: запись без data-paper-id горит', any(m.startswith('B') for m in h)))

    h, _, _, _ = check_ref_slides(
        {'refs.html': _li('Goodwin, A.', 2020, key='ghost-key')}, P, allow_untagged=set())
    ok.append(('B: несуществующий ключ горит', any(m.startswith('B') for m in h)))

    two = {'a.html': _li('Goodwin, A.', 2020, key='goodwin-2020-valid'),
           'b.html': _li('Goodwin, A.', 2021, key='goodwin-2020-valid')}
    h, _, _, _ = check_ref_slides(two, P, allow_untagged=set())
    ok.append(('D: два разных года на один id по декам горят',
               any('разные годы' in m for m in h)))

    _, w, _, _ = check_ref_slides(
        {'refs.html': _li('Goodwin, A.', 2020, key='goodwin-2020-valid', venue='CIKM 2020')},
        P, allow_untagged=set())
    ok.append(('E: чужая площадка даёт WARN', any(m.startswith('E') for m in w)))
    _, w, _, _ = check_ref_slides(
        {'refs.html': _li('Goodwin, A.', 2020, key='goodwin-2020-valid',
                          venue='Proc. ACM SIGIR conference')}, P, allow_untagged=set())
    ok.append(('E: известная аббревиатура площадки молчит', w == []))

    failed = [name for name, passed in ok if not passed]
    for name, passed in ok:
        print('  %s %s' % ('✓' if passed else '✗', name))
    if failed:
        print('[check-bib] selftest FAIL: %d/%d' % (len(failed), len(ok)))
        sys.exit(1)
    print('[check-bib] selftest PASS — A/B/C/D горят на фикстурах, E предупреждает, '
          'валидная запись молчит (%d проверок)' % len(ok))


if __name__ == '__main__':
    main()
