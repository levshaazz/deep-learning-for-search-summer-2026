// widgets.js — build-time registry of the "explainable units": each widget's manifest + i18n,
// plus the data files they read. The Book chapter renderer uses this to lay out scroll steps and
// build the client payload. (Client-side mount functions are imported in the page's bundled script.)
import csManifest from '../../widgets/cosine-sphere/manifest.json';
import csI18n from '../../widgets/cosine-sphere/i18n.json';
import bpeManifest from '../../widgets/bpe-merge-ledger/manifest.json';
import bpeI18n from '../../widgets/bpe-merge-ledger/i18n.json';
import zhManifest from '../../widgets/zipf-heaps/manifest.json';
import zhI18n from '../../widgets/zipf-heaps/i18n.json';
import hdManifest from '../../widgets/highd-histogram/manifest.json';
import hdI18n from '../../widgets/highd-histogram/i18n.json';

import dCosine from '../../data/l2-cosine.json';
import dCorpus from '../../data/l2-corpus-stats.json';
import dBpe from '../../data/l2-bpe.json';
import dHighd from '../../data/l2-highd.json';

export const WIDGET_META = {
  'cosine-sphere':    { manifest: csManifest, i18n: csI18n },
  'bpe-merge-ledger': { manifest: bpeManifest, i18n: bpeI18n },
  'zipf-heaps':       { manifest: zhManifest, i18n: zhI18n },
  'highd-histogram':  { manifest: hdManifest, i18n: hdI18n },
};

export const DATA = {
  'l2-cosine': dCosine,
  'l2-corpus-stats': dCorpus,
  'l2-bpe': dBpe,
  'l2-highd': dHighd,
};
