// widgets.js — build-time registry of the "explainable units": each widget's manifest + i18n,
// plus the data files they read. The Book chapter renderer uses this to lay out scroll steps and
// build the client payload. (Client-side mount functions are imported in the page's bundled script.)
//
// AUTO-REGISTERED (no import wall): manifests, i18n, and data JSONs are discovered with Vite
// `import.meta.glob(..., { eager: true })`. Adding a widget = dropping a `widgets/<id>/` folder with
// a manifest.json + i18n.json (and pointing its manifest `data` at a `data/<key>.json`) — ZERO edits
// here. WIDGET_META is keyed by manifest.id; DATA is keyed by the data file's basename (e.g.
// `data/l3-rrf.json` → `l3-rrf`), and only data files referenced by some manifest are included.

// Strip Vite's default-wrapped JSON modules to the raw object.
const unwrap = (m) => (m && m.default !== undefined ? m.default : m);
// basename without extension: '../../widgets/rrf-fusion/manifest.json' → 'rrf-fusion' (dir),
// '../../data/l3-rrf.json' → 'l3-rrf' (file).
const dirName = (p) => p.split('/').slice(-2)[0];
const fileKey = (p) => p.split('/').pop().replace(/\.json$/, '');

const manifestMods = import.meta.glob('../../widgets/*/manifest.json', { eager: true });
const i18nMods = import.meta.glob('../../widgets/*/i18n.json', { eager: true });
const dataMods = import.meta.glob('../../data/*.json', { eager: true });

// id → i18n object, by folder name.
const i18nById = {};
for (const [path, mod] of Object.entries(i18nMods)) i18nById[dirName(path)] = unwrap(mod);

// WIDGET_META, keyed by manifest.id (falls back to the folder name).
export const WIDGET_META = {};
for (const [path, mod] of Object.entries(manifestMods)) {
  const manifest = unwrap(mod);
  const id = manifest.id || dirName(path);
  WIDGET_META[id] = { manifest, i18n: i18nById[dirName(path)] };
}

// Which data keys are actually referenced by a widget manifest's `data: [...]`.
const referenced = new Set();
for (const { manifest } of Object.values(WIDGET_META))
  for (const key of manifest.data || []) referenced.add(key);

// DATA, keyed by data-file basename; only the referenced files are exposed (keeps the historical
// key set — the data/ dir holds many more JSONs than the widgets consume).
export const DATA = {};
for (const [path, mod] of Object.entries(dataMods)) {
  const key = fileKey(path);
  if (referenced.has(key)) DATA[key] = unwrap(mod);
}
