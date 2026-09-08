    // THE BILL AT DECODE TIME. ncd-kvcache is the only figure in the family that draws an axis which GROWS
    // while the model runs: prefill builds the whole n×n box once (the 25.8 GB the ledger prices), and then
    // every decoded token adds exactly ONE k row and ONE v row — visible as the boxes in front of the old
    // rows disappearing. It earns its place here because it flips the chapter's own conclusion: during
    // decoding the expensive axis is the CACHE, not the cup, and that reversal is invisible in the formula
    // (identical at prefill and at decode) while the circuit shows it in one glance. Reads l15-attention.
    // 3 steps.
    { id: 'climb-kvcache', kind: 'scrolly', widget: 'ncd-kvcache', data: 'l15-attention' },
