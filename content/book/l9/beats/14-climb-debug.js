    // THREE BROKEN CIRCUITS, and the middle one is the whole chapter. ncd-debug walks a shape bug (a cup fed
    // two axes of different lengths — a type checker catches it), then the SHAPE-PRESERVING bug (two circuits
    // that are identical except for the orientation of the softmax triangle: n×n in, n×n out, every assertion
    // passes, and one of them learns nonsense), then a composition bug (the head axis left dangling, so the
    // block no longer preserves n×m and the tower stops stacking). It earns its place because it is the only
    // figure in the Book where you are asked to FIND a defect rather than follow a derivation — and because
    // bug 2 cannot be shown in any other notation: in the formula the two circuits are the same string.
    // Reads l15-attention (h=12, m=768, d_head=64). 3 steps.
    { id: 'climb-debug', kind: 'scrolly', widget: 'ncd-debug', data: 'l15-attention' },
