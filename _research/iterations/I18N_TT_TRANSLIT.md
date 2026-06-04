# I18N_TT_TRANSLIT.md — Tatar Cyrillic → Latin (Zamanälif) transliteration (reference spec)

> **Status: DESIGN REFERENCE (no code).** The reference for the i18n layer's Tatar dual-script support
> (SITE_ARCHITECTURE §2, §5.4). We author Tatar **once in Cyrillic (`tt-Cyrl`, the default)** and
> **derive Latin (`tt-Latn`, Zamanälif)** deterministically, with a heuristic pass for the
> harmony-dependent letters and a **human-reviewed override file** for the rest. The course author is a
> **native Tatar speaker** and is the reviewer of record — this table is a *validated starting point*,
> not an orthographic authority; the author's overrides win.
>
> **Why derive, not author twice:** halves the Tatar burden, and guarantees the two scripts can never
> *say different things* (enforced by the `tt-translit` gate, AUDIT_SITE).

---

## 1. Pipeline

```
i18n/L<n>.tt-Cyrl.json   (authored, native-reviewed)
        │  translit(table + heuristics)            i18n/tt-translit-table.json     (the base map, below)
        ▼                                          i18n/tt-translit-heuristics    (the rules, §3)
i18n/L<n>.tt-Latn.json   (DERIVED — never hand-authored except via overrides)
        ▲                                          i18n/tt-translit-overrides.json (human exceptions, §4)
   author spot-check  ───────────────────────────────────────────────────────────┘
```

The build runs `translit()`; the **`tt-translit` gate** re-runs it and asserts the committed
`tt-Latn` equals `translit(tt-Cyrl)` **except** where the override file sanctions a difference. So the
only legal divergence is a reviewed override — no silent drift.

---

## 2. Base table (`i18n/tt-translit-table.json`)

Zamanälif (modern Tatar Latin) alphabet: `A Ä B C Ç D E F G Ğ H I İ J K L M N Ñ O Ö P Q R S Ş T U Ü V W X Y Z ʼ`.
Most letters map 1:1 and deterministically. Casing: preserve source case (uppercase maps to the
uppercase Latin form; for digraphs, title-case the first letter — `Ю→Yu`, `ЮРТ→Yurt`).

### 2a. Deterministic (1:1) — safe to auto-apply

| Cyrillic | Latin | note | | Cyrillic | Latin | note |
|---|---|---|---|---|---|---|
| А а | A a |  | |П п | P p |  |
| Ә ә | Ä ä |  | | Р р | R r |  |
| Б б | B b |  | | С с | S s |  |
| Д д | D d |  | | Т т | T t |  |
| Ж ж | J j | [ʒ] | | Ү ү | Ü ü |  |
| Җ җ | C c | [ʑ/dʒ] | | Ф ф | F f |  |
| З з | Z z |  | | Х х | X x | [x] |
| И и | İ i | dotted | | Һ һ | H h |  |
| Й й | Y y |  | | Ч ч | Ç ç |  |
| Л л | L l |  | | Ш ш | Ş ş |  |
| М м | M m |  | | Ы ы | I ı | undotted |
| Н н | N n |  | | Э э | E e |  |
| Ң ң | Ñ ñ | [ŋ] | | О о | O o | *(see note)* |
| Ө ө | Ö ö |  | | | | |

> **Note on О/о:** in native Tatar words Cyrillic о often realizes the reduced [o]; in Latin it stays
> `o`. Russian-loan о stays `o` too → deterministic here, but loanword vowels are a common override
> target (§4).

### 2b. Context-dependent (heuristic + override) — the hard cases

These are where Cyrillic **under-specifies** what Zamanälif must distinguish (mostly **front/back vowel
harmony** and **iotation**). Default given; the heuristic (§3) refines; the override (§4) is final.

| Cyrillic | Default | Alternatives | Disambiguator |
|---|---|---|---|
| Г г | `g` | `ğ` | **back-harmony** word/syllable → `ğ` ([ɣ]); front → `g` |
| К к | `k` | `q` | **back-harmony** → `q`; front → `k` |
| В в | `w` | `v` | native Tatar [w] → `w`; Russian-loan [v] → `v` |
| У у | `u` | `w` | vowel [u] → `u`; glide after vowel → `w` |
| Е е | `e` | `ye`, `yı` | word-initial / after vowel → `ye` (front) / `yı` (back); else `e` |
| Ё ё | `yo` | `yö` | back → `yo`, front → `yö` (rare; loanwords) |
| Ю ю | `yu` | `yü` | back-harmony → `yu`; front-harmony → `yü` |
| Я я | `ya` | `yä` | back-harmony → `ya`; front-harmony → `yä` |
| Ц ц | `ts` | `s` | loanword [ts] → `ts`; some positions → `s` |
| Щ щ | `şç` | — | loanwords only |
| Ъ ъ | `ʼ` / ∅ | — | hard sign: separation mark `ʼ` or dropped |
| Ь ь | ∅ / `ʼ` | — | soft sign: usually dropped (palatalization implied by front vowels) |

---

## 3. Heuristics (`tt-translit-heuristics`)

Applied left-to-right per token, after the 1:1 map:

1. **Harmony class detection.** Scan the token's vowels. If it contains any **front** vowel
   (ә, е, и, ө, ү, э → ä, e, i, ö, ü) and no back vowel → **front** word. If any **back** vowel
   (а, о, у, ы → a, o, u, ı) → **back** word. Mixed (loanwords/compounds) → **unknown** → flag for
   override. Front → choose `g/k/yü/yä/yö`; back → `ğ/q/yu/ya/yo`.
2. **Iotation position.** Е/Ё/Ю/Я at **word start** or **after a vowel or ъ/ь** → the `y…` digraph;
   after a consonant → the bare vowel (`е→e`). 
3. **В/У glide.** В between/adjacent to vowels in a native word → `w`; in a Russian loan or where the
   token is on the protected/loan list → `v`. У as a syllable nucleus → `u`; as an off-glide → `w`.
4. **Soft/hard signs.** Drop ь by default (front-harmony already encodes palatalization); render ъ as
   `ʼ` only when it separates iotated vowels, else drop.
5. **Unknown-harmony or any rule conflict → do NOT guess silently.** Emit the default *and* add the
   token to a `needs-review` list the author sees (so coverage never blocks, but the author is pointed
   straight at the ambiguous tokens).

> **Honesty:** transliteration is **not 100% lossless** — exactly the front/back and v/w distinctions
> Cyrillic merges. Heuristics handle the common cases; the long tail is the override file + the
> author's eyes. This is by design, not a bug.

---

## 4. Override file (`i18n/tt-translit-overrides.json`) — format

Three override scopes, checked in order (most specific wins). All entries are **human-reviewed**; the
gate treats them as the sanctioned source of divergence.

```jsonc
{
  // 4.1 TOKEN overrides — a Cyrillic word → its exact Latin form. For loanwords, proper nouns,
  //      irregular harmony, and anything the heuristic gets wrong. The bread-and-butter case.
  "tokens": {
    "компьютер": "kompyuter",      // Russian loan: в-less, no harmony rule applies
    "Сергей":    "Sergey",          // proper noun
    "вакыт":     "waqıt",           // back-harmony: в→w, к→q, ы→ı  (heuristic likely right; pinned for safety)
    "гыйлем":    "ğıylem"           // back+front mix → pinned by author
  },

  // 4.2 PROTECTED terms — stay verbatim in BOTH scripts (technical vocabulary). Already-Latin terms
  //      (BM25, cosine, softmax) need no entry; this is for Cyrillic-spelled terms that must NOT
  //      transliterate at all, or must match the EN spelling.
  "protected": ["Python", "BM25", "softmax", "embedding", "RAG", "cosine"],

  // 4.3 REGEX overrides — ordered, for systematic patterns the table can't express. Use sparingly.
  "regex": [
    { "from": "ия\\b", "to": "iyä", "note": "word-final -ия → front -iyä" }
  ],

  // metadata
  "_reviewedBy": "course author (native Tatar)",
  "_note": "Most-specific scope wins: tokens > protected > regex > heuristic > base table."
}
```

**Resolution order (per token):** `tokens` exact match → `protected` (emit verbatim) → `regex` (in
order) → §3 heuristics → §2 base table. First hit wins.

---

## 5. The `tt-translit` gate (summary — full spec in AUDIT_SITE.md)
- **Input:** every `i18n/*.tt-Cyrl.json` + its committed `*.tt-Latn.json` + the table/heuristics/overrides.
- **Output / pass:** for each key, `committed tt-Latn == translit(tt-Cyrl)`; any difference must be
  explained by an override entry; otherwise **HARD-fail** with the offending key + expected vs actual.
- **Also reports:** the `needs-review` list (unknown-harmony / conflict tokens) as a **WARN** so the
  author can pin them. Coverage is never blocked by ambiguity — only by *unexplained divergence*.
- **Known-bad fixture:** a `tt-Cyrl` entry whose committed `tt-Latn` is hand-corrupted (e.g. `k`→`q`
  with no override) must fire the gate; adding the matching override must clear it.

## 6. Caveats / open items
- The base table reflects the modern Tatar Latin (Zamanälif) inventory; **author validation is
  authoritative** — adjust §2 if the author's standard differs (e.g., apostrophe vs no-apostrophe for
  ъ/ь, or `v` vs `w` default).
- Direction is **Cyrillic → Latin only** (we never author Latin first). No round-trip guarantee.
- Numerals, punctuation, KaTeX, and code spans pass through untouched (protected by §4.2 + the
  i18n-structure protected-term rule).
