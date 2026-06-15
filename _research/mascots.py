#!/usr/bin/env python3
"""
mascots.py — the LOCKED character bible for the course illustrations.

Single source of truth for every recurring mascot's appearance, so the cast stays
visually CONSISTENT between lectures and from one Claude Code session to the next.
gen_images.py imports SEREGA from here; the image-gate (_research/check_images.py)
imports MASCOTS + SEREGA_MIN_RATIO to enforce the brand rules below.

WHY THIS FILE EXISTS — the brand drifted once already: Serega quietly faded out of
the recent units (L5→L6→L7→L8 went 5→3→0→0 plates with him) even though his look was
already pinned in gen_images.py. A written convention does not stop drift; a registry
+ a gate does. New lectures REUSE this cast; a genuinely new character is added by
locking an entry HERE FIRST — never by describing a recurring character ad-hoc in a
single brief (that is how a character starts to drift).

RULES (mechanically enforced by check_images.py):
  - Serega is the through-line narrator. Every lecture features him in a healthy share
    of plates (>= SEREGA_MIN_RATIO) AND in its hero (first) and final (last) plate.
  - GREEN appears ONLY on the green Tatar tübetey — worn by Serega (and by his
    Sir-Cosine costume). Nowhere else: every other character is bare-headed, no green.
  - Use the cast where it fits; introduce a new mascot only by adding a locked entry
    here, and only when a recurring on-brand character genuinely earns it.
"""

# ── Serega — the host. Locked so he never drifts between images. Repeat the cap colour
#    3× and spell it three ways (deep-green, forest-green, #2F7D4F) to anchor whichever
#    token the model latches onto. (Imported verbatim by gen_images.build_prompt.) ──
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

# ── the rest of the recurring cast. Each entry's `appearance` is the locked spec to paste
#    into a brief when that character is used; `keywords` is how the gate spots the character
#    in a brief; `carries_green` is True ONLY for the green-cap wearers (Serega + Sir Cosine);
#    `palette` is the per-character colour note. Bare-headed creatures wear NO green. ──
MASCOTS = {
    "serega": {
        "name": "Serega",
        "role": "the host / narrator — appears in (nearly) every lecture, lives each analogy",
        "appearance": SEREGA,
        "keywords": ["serega"],
        "carries_green": True,        # the ONLY base character with the green tübetey
        "lectures": "all",
    },
    "sir_cosine": {
        "name": "Sir Cosine",
        "role": "Serega in a knight costume — geometry / cosine-similarity scenes (L2)",
        "appearance": (
            "Sir Cosine is Serega dressed as a stick-figure knight (a plain surcoat over the "
            "course-blue tunic), KEEPING his green Tatar tübetey directly on his head — NO helmet, "
            "NO second cap over it. He wields a small protractor and lance-vectors and measures the "
            "angle between them on a glowing warm-orange unit-sphere arc. He is a COSTUME of Serega, "
            "so he is the only character besides Serega who wears the green cap."
        ),
        "keywords": ["sir cosine", "sir-cosine"],
        "carries_green": True,        # a Serega costume → keeps the green cap
        "lectures": ["L2"],
    },
    "tokenosaurus": {
        "name": "Tokenosaurus",
        "role": "the friendly tokenizer dinosaur — tokenization / sub-words (L2)",
        "appearance": (
            "Tokenosaurus is a goofy, friendly cartoon dinosaur: rounded and approachable, a "
            "course-blue body with a warm-orange belly, tiny arms, big good-natured toothy grin, "
            "a row of soft back-plates. He snips words into sub-word chunks. He is BARE-HEADED — "
            "no skullcap, no green anywhere on him (blue + orange only)."
        ),
        "keywords": ["tokenosaurus", "dinosaur"],
        "carries_green": False,
        "lectures": ["L2"],
    },
    "lexical_gremlin": {
        "name": "the Lexical Gremlin",
        "role": "antagonist — literal keyword matching that keeps synonyms apart (L1, L6)",
        "appearance": (
            "The Lexical Gremlin is a SMALL mischievous gremlin: a round head, large POINTY "
            "bat-like ears sticking out sideways, wild SPIKY upward COURSE-BLUE (#2A6FDB) hair, a "
            "course-blue body, a big wide toothy mischievous grin, two beady dot eyes, thin noodle "
            "arms and legs. BARE-HEADED, blue — NO green ever, NO skullcap. Same design every time "
            "(smug when winning, sulky/pouting when beaten)."
        ),
        "keywords": ["gremlin"],
        "carries_green": False,
        "lectures": ["L1", "L6"],
    },
    "goodhart": {
        "name": "Goodhart the Trickster",
        "role": "antagonist — gaming the metric / 'when a measure becomes a target' (L1)",
        "appearance": (
            "Goodhart the Trickster is a small, sly grinning trickster figure with impish pointy "
            "features, drawn in course-blue, who games a metric by yanking a line-graph UP with a "
            "clickbait fishing-hook. BARE-HEADED — no skullcap, no green."
        ),
        "keywords": ["goodhart", "trickster"],
        "carries_green": False,
        "lectures": ["L1"],
    },
    "alien": {
        "name": "the First-Contact Alien",
        "role": "the 'no shared symbols' interlocutor — embeddings as a shared language (L2)",
        "appearance": (
            "The First-Contact Alien is a tall friendly many-limbed humanoid drawn in BLACK INK "
            "OUTLINE ONLY — its silhouette is a clean thin ink line and its interior is the "
            "off-white paper showing through (no fill, no coloured skin). The ONLY warm accent is "
            "three short thin warm-orange stripes along ONE outer arm (<=8% of canvas). BARE-HEADED, "
            "NO green. Canon composition: Serega on the LEFT, alien on the RIGHT."
        ),
        "keywords": ["alien"],
        "carries_green": False,
        "lectures": ["L2"],
    },
    "wraith": {
        "name": "the Curse-of-Dimensionality Wraith",
        "role": "antagonist — high-dimensional concentration / 'all equidistant' (L2)",
        "appearance": (
            "The Curse-of-Dimensionality Wraith is a tall hooded Nazgûl-like cloaked figure whose "
            "entire cloak and hood are SOLID BLACK INK (deep matte black, pure shadow, no fill of "
            "any other colour), the hood pulled forward so the face is a black void, one skeletal "
            "ink hand reaching out to crush a histogram. BARE (hooded) — NO green anywhere."
        ),
        "keywords": ["wraith"],
        "carries_green": False,
        "lectures": ["L2"],
    },

    # ── NEW pun-cast (owner-approved 2026-06-15) — locked ahead of the RAG arc (L10–L12),
    #    multimodal, and the embeddings callback (L5/L6). Names are wordplay; the DRAWINGS are
    #    original (no likeness of any real person or branded mascot). All bare-headed, no green. ──
    "ragdoll": {
        "name": "RAGdoll (the Oracle)",
        "role": "the RAG system / the answering Oracle — retrieve-then-generate (anchors L10–L12)",
        "appearance": (
            "RAGdoll is the Oracle drawn as a patchwork rag-doll STITCHED TOGETHER from retrieved scraps "
            "of paper and document-snippets: a friendly stuffed figure whose body is a quilt of little "
            "text-patches with loose threads at the seams, two simple button eyes and a stitched smile, "
            "course-blue cloth with warm-orange patches and stitching. Freshly fed with retrieved context "
            "it stands tall and confident; with stale or missing context it visibly comes apart at the "
            "seams (a patch dangling, a thread unravelling). BARE-HEADED, no green anywhere — course-blue "
            "+ warm-orange cloth on black ink only."
        ),
        "keywords": ["ragdoll", "rag-doll"],
        "carries_green": False,
        "lectures": ["L10", "L11", "L12"],
    },
    "chunk_norris": {
        "name": "Chunk Norris",
        "role": "chunking — splits long documents into well-sized, overlapping passages (L10)",
        "appearance": (
            "Chunk Norris is a confident karate-master stick figure (an ORIGINAL character, NOT a likeness "
            "of any real person): course-blue gi and belt, a determined squint and a tidy ink moustache, "
            "mid roundhouse-kick chopping a long scroll/document into equal passage-chunks that fly apart "
            "along clean cut-lines, a faint warm-orange motion-arc tracing the kick. He fusses over a small "
            "OVERLAP between chunks so nothing falls between slices. BARE-HEADED, no green — black ink + "
            "course-blue with a single warm-orange accent on the kick."
        ),
        "keywords": ["chunk norris"],
        "carries_green": False,
        "lectures": ["L10"],
    },
    "confabulous": {
        "name": "Confabulous",
        "role": "the hallucination phantom — confident fabricated answers/citations; the villain of RAG eval (L11)",
        "appearance": (
            "Confabulous is a wispy translucent PHANTOM drawn as a thin black-ink outline with the "
            "off-white paper showing through (a friendly-ghost silhouette), wearing a too-wide showman's "
            "grin and presenting a bogus citation-scroll with a theatrical flourish and a little sparkle. "
            "One warm-orange accent on the fake citation tag (a hand-lettered 'trust me'). BARE-HEADED, no "
            "cap, no green — black-ink outline + faint course-blue wisps + one warm-orange accent."
        ),
        "keywords": ["confabulous"],
        "carries_green": False,
        "lectures": ["L11"],
    },
    "re_actor": {
        "name": "the Re-Actor",
        "role": "agentic RAG — the Thought→Action→Observation self-critique loop (ReAct / Self-RAG / CRAG, L11)",
        "appearance": (
            "the Re-Actor is an earnest little theatrical actor (course-blue, simple stick figure) caught "
            "mid-performance on a tiny stage, one hand raised mid-declamation; a circular loop-arrow of "
            "three beats — Thought, Action, Observation — drawn as small masks/placards around it, and a "
            "scatter of stick-on self-critique notes ('take two!'). One warm-orange accent on the loop-arrow. "
            "BARE-HEADED, no green — black ink + course-blue + a warm-orange loop."
        ),
        "keywords": ["re-actor"],
        "carries_green": False,
        "lectures": ["L11"],
    },
    "clippy": {
        "name": "Clippy",
        "role": "multimodal alignment — image↔text in one shared space (CLIP, L12)",
        "appearance": (
            "Clippy is a friendly bent-wire PAPERCLIP assistant character (an affectionate nod to the "
            "classic late-90s office help-assistant trope — an ORIGINAL drawing, not a copy of any branded "
            "mascot): a single course-blue paperclip bent into a body with two big googly eyes and "
            "expressive ink eyebrows, gesturing helpfully. It holds a small picture in one loop and a line "
            "of text in the other and snaps them together into one shared slot. One warm-orange accent "
            "where image and text align. BARE-HEADED (it is a paperclip — no cap), no green — course-blue "
            "wire + black ink + a warm-orange accent."
        ),
        "keywords": ["clippy", "paperclip"],
        "carries_green": False,
        "lectures": ["L12"],
    },
    "joey_multihop": {
        "name": "Joey Multi-Hop",
        "role": "multi-hop reasoning — hops node→node→node to assemble an answer (multi-hop / GraphRAG, L12)",
        "appearance": (
            "Joey Multi-Hop is a cheerful cartoon KANGAROO (course-blue, rounded, big springy feet, a "
            "little pouch holding gathered clue-cards) captured mid-bound leaping from one document-node to "
            "the next across a dotted graph of stepping-stone nodes, a dashed warm-orange arc tracing the "
            "chain of hops; each landing tucks one clue into the pouch. BARE-HEADED, no green — black ink + "
            "course-blue + a warm-orange hop-arc."
        ),
        "keywords": ["joey multi-hop", "kangaroo"],
        "carries_green": False,
        "lectures": ["L12"],
    },
    "victor_vector": {
        "name": "Victor the Vector",
        "role": "embeddings — a word/point becomes a vector with magnitude AND direction (L5, L6)",
        "appearance": (
            "Victor the Vector is a sleek, confident character built around a bold ARROW (an ORIGINAL "
            "character, NOT a likeness of any film character): a stick figure whose pose forms a clear "
            "directional arrow, striking a proud 'magnitude AND direction' stance with one arm extended "
            "like an arrow-shaft and a small grin of mathematical pride; he plots words as little arrows "
            "from an origin on a faint coordinate grid. Course-blue body with a warm-orange arrowhead "
            "accent. BARE-HEADED, no green — black ink + course-blue + a warm-orange arrowhead."
        ),
        "keywords": ["victor the vector"],
        "carries_green": False,
        "lectures": ["L5", "L6"],
    },
}

# Every lecture must feature Serega in at least this share of its plates (tightest current
# unit is L1 at 0.42, so 0.40 is the floor with a small margin). Raise deliberately, never lower.
SEREGA_MIN_RATIO = 0.40

# Characters that legitimately carry the green cap (Serega + his Sir-Cosine costume).
GREEN_CAP_MASCOTS = [m for m, v in MASCOTS.items() if v["carries_green"]]
