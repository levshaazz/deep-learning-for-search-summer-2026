    { id: 'climb-block', kind: 'scrolly', widget: 'transformer-block' },
    // Geometric counterpart to the labelled-box transformer-block above: each sublayer reshapes a
    // small 2-D token cloud (attention contracts → Add&Norm rescales to a unit ring → FFN warps each
    // point → Add&Norm). Book-only. Reads data/l6-block-geo.json.
