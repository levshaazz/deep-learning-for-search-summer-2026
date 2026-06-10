    { id: 'climb-block-geo', kind: 'scrolly', widget: 'block-geometry', data: 'l6-block-geo' },
    // What LayerNorm DOES to one feature vector: recenter (mean 5→0) → unit-scale (var 7.5→1, onto the
    // sphere) → learned γ·+β. Sits just before the modern-block prose that discusses Add&Norm.
    // Book-only. Reads data/l6-layernorm.json.
