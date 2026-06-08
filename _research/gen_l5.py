#!/usr/bin/env python3
"""gen_l5.py — data for L5 'The Map of Meaning' (word embeddings + dim-reduction).

Real, reproducible worked examples (run with /usr/bin/python3 — it has sklearn+numpy):
  data/l5-embeddings.json  the king−man+woman≈queen analogy with REAL GloVe-50d cosines,
                           a few pairwise cosines (cat·dog ≫ cat·airplane), the gender/capital directions
  data/l5-dimred.json      PCA on a curated word set → 2-D coords + per-component explained variance,
                           plus a t-SNE 2-D layout (neighbor-preserving) for the "map of meaning" plot

Vectors: GloVe 6B 50-d (Wikipedia+Gigaword), fetched once from the gensim-data mirror (a gzipped
word2vec-format text file — NO gensim needed, we parse it with numpy) and cached locally (gitignored).
Deterministic: fixed word list, PCA random_state=0, t-SNE random_state=0. Numbers feed the deck, the
Book, the embedding-space / dimred-projection widgets, and become facts-gate-checkable.

Run:  /usr/bin/python3 _research/gen_l5.py
"""
from __future__ import annotations
import json, struct, zlib, pathlib, urllib.request, sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / "_research" / "data" / ".cache"
CACHE.mkdir(parents=True, exist_ok=True)
# Stanford GloVe 6B zip. glove.6B.50d.txt is the FIRST entry (deflate, flags=0, so the
# local header carries comp_size) — we range-fetch just that compressed block (~70 MB,
# not the full 862 MB) and raw-inflate it. The extracted demo-word vectors are cached small.
GLOVE_ZIP_URL = "https://nlp.stanford.edu/data/glove.6B.zip"
VEC_CACHE = CACHE / "glove50-demo-vectors.json"

# curated word set: a handful of clear semantic clusters so PCA/t-SNE shows real structure
CLUSTERS = {
    "royalty":   ["king", "queen", "prince", "princess", "throne", "crown"],
    "family":    ["man", "woman", "boy", "girl", "father", "mother"],
    "animals":   ["cat", "dog", "horse", "cow", "lion", "tiger", "kitten", "puppy"],
    "countries": ["france", "italy", "germany", "spain", "japan", "china"],
    "capitals":  ["paris", "rome", "berlin", "madrid", "tokyo", "beijing"],
    "tech":      ["computer", "software", "data", "internet", "algorithm", "network"],
    "transport": ["car", "truck", "train", "airplane", "bicycle", "boat"],
}
WORDS = sorted({w for ws in CLUSTERS.values() for w in ws})
# words the analogy / cosine demos need (subset of WORDS + a few extras)
NEEDED = set(WORDS) | {"king", "man", "woman", "queen", "cat", "dog", "airplane"}


def _range(url: str, start: int, end: int) -> bytes:
    req = urllib.request.Request(url, headers={"Range": f"bytes={start}-{end}", "User-Agent": "curl/8"})
    return urllib.request.urlopen(req, timeout=60).read()


def _glove50_text() -> str:
    """Range-fetch + raw-inflate just the first zip entry (glove.6B.50d.txt)."""
    head = _range(GLOVE_ZIP_URL, 0, 63)
    assert head[:4] == b"PK\x03\x04", "not a zip local header"
    (_, flags, method, _, _, _, comp_size, uncomp_size, fname_len, extra_len) = struct.unpack(
        "<HHHHHIIIHH", head[4:30])
    name = head[30:30 + fname_len].decode()
    assert method == 8 and (flags & 0x08) == 0, f"unexpected zip entry (method={method}, flags={flags})"
    assert name == "glove.6B.50d.txt", f"first entry is {name!r}"
    data_start = 30 + fname_len + extra_len
    print(f"[l5] range-fetching {name}: {comp_size/1e6:.0f} MB compressed → {uncomp_size/1e6:.0f} MB …", flush=True)
    blob = _range(GLOVE_ZIP_URL, data_start, data_start + comp_size - 1)
    return zlib.decompress(blob, -15).decode("utf-8")


def load_vectors() -> dict[str, np.ndarray]:
    if VEC_CACHE.exists():
        raw = json.loads(VEC_CACHE.read_text())
        cached = {w: np.asarray(v, dtype=np.float64) for w, v in raw.items()}
        if set(NEEDED) <= set(cached):
            return cached
    text = _glove50_text()
    vecs: dict[str, np.ndarray] = {}
    want = set(NEEDED)
    for line in text.splitlines():
        sp = line.find(" ")
        w = line[:sp]
        if w in want:
            vecs[w] = np.asarray(line[sp + 1:].split(" "), dtype=np.float64)
            want.discard(w)
            if not want:
                break
    missing = set(NEEDED) - set(vecs)
    if missing:
        print(f"[l5] WARNING: missing vectors for {sorted(missing)}", file=sys.stderr)
    VEC_CACHE.write_text(json.dumps({w: v.tolist() for w, v in vecs.items()}))
    return vecs


def cos(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def r(x, n=4):
    return round(float(x), n)


def build_embeddings(V: dict[str, np.ndarray]) -> dict:
    # --- the analogy: king − man + woman ≈ ? ---
    target = V["king"] - V["man"] + V["woman"]
    ranking = []
    for w, v in V.items():
        if w in ("king", "man", "woman"):
            continue
        ranking.append((w, cos(target, v)))
    ranking.sort(key=lambda t: -t[1])
    analogy_top = [{"word": w, "cos": r(c)} for w, c in ranking[:6]]

    # gender direction consistency: (queen−king) vs (woman−man)
    gender_dir_cos = r(cos(V["queen"] - V["king"], V["woman"] - V["man"]))
    # capital analogy: paris − france + italy ≈ rome ?
    cap_target = V["paris"] - V["france"] + V["italy"]
    cap_rank = sorted(
        ((w, cos(cap_target, v)) for w, v in V.items() if w not in ("paris", "france", "italy")),
        key=lambda t: -t[1],
    )
    capital_top = [{"word": w, "cos": r(c)} for w, c in cap_rank[:4]]

    # pairwise cosines: near vs far
    pairs = [("cat", "dog"), ("cat", "kitten"), ("dog", "puppy"),
             ("cat", "airplane"), ("king", "queen"), ("king", "computer")]
    pair_cos = [{"a": a, "b": b, "cos": r(cos(V[a], V[b]))} for a, b in pairs]

    return {
        "method": "GloVe 6B 50-d (Wikipedia + Gigaword)",
        "dim": 50,
        "analogy": {
            "expr": "king − man + woman",
            "expected": "queen",
            "top": analogy_top,                  # top[0] should be 'queen'
            "answerCos": next((t["cos"] for t in analogy_top if t["word"] == "queen"), None),
        },
        "genderDirectionCos": gender_dir_cos,    # ≈ how parallel (queen−king) and (woman−man) are
        "capitalAnalogy": {"expr": "paris − france + italy", "expected": "rome", "top": capital_top},
        "pairs": pair_cos,                       # cat·dog ≫ cat·airplane
        "words": {w: [r(x, 4) for x in V[w][:6]] for w in ("king", "queen", "man", "woman")},  # first 6 dims, for show
    }


def build_dimred(V: dict[str, np.ndarray]) -> dict:
    from sklearn.decomposition import PCA
    from sklearn.manifold import TSNE

    words = [w for w in WORDS if w in V]
    X = np.vstack([V[w] for w in words])              # (n, 50)
    Xc = X - X.mean(axis=0)

    pca = PCA(n_components=min(10, X.shape[0] - 1), random_state=0).fit(Xc)
    evr = [r(x, 4) for x in pca.explained_variance_ratio_]
    coords2 = pca.transform(Xc)[:, :2]
    pca_pts = [{"w": w, "x": r(coords2[i, 0], 3), "y": r(coords2[i, 1], 3),
                "c": next(k for k, ws in CLUSTERS.items() if w in ws)}
               for i, w in enumerate(words)]

    n = len(words)
    perp = max(2, min(15, n // 3))
    ts = TSNE(n_components=2, random_state=0, perplexity=perp, init="pca",
              learning_rate="auto").fit_transform(X)
    # normalize t-SNE coords to a tidy box for the widget
    ts = ts - ts.mean(axis=0)
    ts = ts / (np.abs(ts).max() + 1e-9)
    tsne_pts = [{"w": words[i], "x": r(ts[i, 0], 3), "y": r(ts[i, 1], 3),
                 "c": next(k for k, ws in CLUSTERS.items() if words[i] in ws)}
                for i in range(n)]

    return {
        "method": "PCA + t-SNE on GloVe-50",
        "nWords": n,
        "dimIn": 50,
        "clusters": list(CLUSTERS.keys()),
        "pca": {"explainedVarRatio": evr,
                "var2dPct": r(sum(pca.explained_variance_ratio_[:2]) * 100, 1),
                "points": pca_pts},
        "tsne": {"perplexity": perp, "points": tsne_pts},
    }


def main() -> int:
    V = load_vectors()
    emb = build_embeddings(V)
    dim = build_dimred(V)
    (DATA / "l5-embeddings.json").write_text(json.dumps(emb, indent=2), encoding="utf-8")
    (DATA / "l5-dimred.json").write_text(json.dumps(dim, indent=2), encoding="utf-8")
    a = emb["analogy"]
    print(f"[l5] analogy: {a['expr']} → {a['top'][0]['word']} (cos {a['top'][0]['cos']}); "
          f"expected queen, answerCos={a['answerCos']}")
    print(f"[l5] capital: → {emb['capitalAnalogy']['top'][0]['word']} "
          f"(cos {emb['capitalAnalogy']['top'][0]['cos']})")
    print(f"[l5] pairs: " + ", ".join(f"{p['a']}·{p['b']}={p['cos']}" for p in emb["pairs"]))
    print(f"[l5] PCA 2-D keeps {dim['pca']['var2dPct']}% var; t-SNE perp={dim['tsne']['perplexity']}; "
          f"{dim['nWords']} words")
    print("[l5] wrote data/l5-embeddings.json + data/l5-dimred.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
