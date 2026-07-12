    // THE CLIMB OF L06 — and the only place in the course where a computation is carried END TO END.
    // "the cat sat", from token id to document rank, in ten steps, with every number surviving every
    // arrow: lookup → +PE → Wq/Wk/Wv → Q·Kᵀ (the multiply-accumulate, finally SHOWN) → ÷√d_k → softmax
    // (exp, Σ, divide — opened) → ·V → mean-pool (the axis n dies; a sentence becomes a POINT) → q·dᵢ.
    // Its attention core REPRODUCES data/l6-attention.json exactly — the projections are SOLVED from the
    // chapter's canonical Q/K/V, not invented (gen_l6_chain.py asserts it), so the figure cannot drift
    // from the prose around it. It replaces `attention-e2e`, of which it is a strict superset: same
    // arithmetic, plus the embedding front end, the pooling that makes a passage indexable, and the
    // ranking that hands the reader straight to the contrastive half of this lecture.
    { id: 'climb-attention', kind: 'scrolly', widget: 'ncd-chain', data: 'l6-chain' },
    // Geometry companion to climb-attention: attention as a weighted pull of the value points; the
    // query "cat" lands at the attention-weighted average — the same output row as the numbers above
    // (blended4d ≈ l6-attention output[1], within tolerance; the chain reproduces those numbers, so the
    // companion still agrees with it). Book-only (no deck slide). Reads data/l6-attention-geo.json.
