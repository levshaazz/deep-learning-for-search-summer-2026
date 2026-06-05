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
import fnManifest from '../../widgets/retrieve-rank-funnel/manifest.json';
import fnI18n from '../../widgets/retrieve-rank-funnel/i18n.json';
import pbManifest from '../../widgets/pos-bias-curve/manifest.json';
import pbI18n from '../../widgets/pos-bias-curve/i18n.json';
import cmManifest from '../../widgets/course-map/manifest.json';
import cmI18n from '../../widgets/course-map/i18n.json';
import iiManifest from '../../widgets/inverted-index/manifest.json';
import iiI18n from '../../widgets/inverted-index/i18n.json';
import bmManifest from '../../widgets/bm25-calc/manifest.json';
import bmI18n from '../../widgets/bm25-calc/i18n.json';
import rfManifest from '../../widgets/rrf-fusion/manifest.json';
import rfI18n from '../../widgets/rrf-fusion/i18n.json';
import rmManifest from '../../widgets/ranking-metrics/manifest.json';
import rmI18n from '../../widgets/ranking-metrics/i18n.json';

import dCosine from '../../data/l2-cosine.json';
import dCorpus from '../../data/l2-corpus-stats.json';
import dBpe from '../../data/l2-bpe.json';
import dHighd from '../../data/l2-highd.json';
import dFunnel from '../../data/l1-funnel.json';
import dClick from '../../data/l1-click-model.json';
import dIndex from '../../data/l3-index.json';
import dBm25 from '../../data/l3-bm25.json';
import dRrf from '../../data/l3-rrf.json';
import dMetrics from '../../data/l4-metrics.json';

export const WIDGET_META = {
  'cosine-sphere':        { manifest: csManifest, i18n: csI18n },
  'bpe-merge-ledger':     { manifest: bpeManifest, i18n: bpeI18n },
  'zipf-heaps':           { manifest: zhManifest, i18n: zhI18n },
  'highd-histogram':      { manifest: hdManifest, i18n: hdI18n },
  'retrieve-rank-funnel': { manifest: fnManifest, i18n: fnI18n },
  'pos-bias-curve':       { manifest: pbManifest, i18n: pbI18n },
  'course-map':           { manifest: cmManifest, i18n: cmI18n },
  'inverted-index':       { manifest: iiManifest, i18n: iiI18n },
  'bm25-calc':            { manifest: bmManifest, i18n: bmI18n },
  'rrf-fusion':           { manifest: rfManifest, i18n: rfI18n },
  'ranking-metrics':      { manifest: rmManifest, i18n: rmI18n },
};

export const DATA = {
  'l2-cosine': dCosine,
  'l2-corpus-stats': dCorpus,
  'l2-bpe': dBpe,
  'l2-highd': dHighd,
  'l1-funnel': dFunnel,
  'l1-click-model': dClick,
  'l3-index': dIndex,
  'l3-bm25': dBm25,
  'l3-rrf': dRrf,
  'l4-metrics': dMetrics,
};
