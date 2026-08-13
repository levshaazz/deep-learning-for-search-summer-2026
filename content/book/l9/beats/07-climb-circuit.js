    // THE CLIMB. Attention read glyph by glyph — and the one figure in the Book where the COST is drawn
    // BESIDE the computation: the сводка (ledger) fills in as the axes are born and killed. It is deliberately
    // NOT ncd-chain: L7 already mounts ncd-chain (l6-chain) as its climb, and re-running «the cat sat» here
    // would teach this chapter's reader nothing he did not get in L7 — same steps, same numbers, same figure.
    // ncd-attention does the work L7's climb cannot: it prices the axis while it is alive (12 heads: 6.3 MB
    // at n=512 → 403 MB → 25.8 GB at 32768, from data/l15-attention.json memory.*), it shows the broadcast
    // weave MULTIPLYING the n×n box, and its last step DELETES the ÷√dₖ glyph — a circuit that still runs,
    // still type-checks, and never learns (softmax(0,0,6) → 0.995 saturated vs softmax(0,0,3) → 0.909).
    // That is this chapter's thesis in one figure: the diagram shows what the formula hides. 5 steps.
    { id: 'climb-circuit', kind: 'scrolly', widget: 'ncd-attention', data: 'l15-attention' },
