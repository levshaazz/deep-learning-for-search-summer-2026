/* rrf-fusion/logic.js — L3 'climb-rrf' beat: Reciprocal Rank Fusion explainer.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no input. Reads data/l3-rrf.json
   (two input rankers + the RRF-fused order). Three DOM-div columns:
   LEFT = BM25, MIDDLE = Cosine, RIGHT = Fused (revealed last). All text via
   i18n keys; theme via CSS var(--token, fallback). Works under arrow keys
   (slide) or scroll (Book). maxStep = 3.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, esc() and the
   window.mountRrfFusion registration; render() only draws the three columns + score readout. */
import { defineWidget, esc } from '../_widget-base.js';

export const mountRrfFusion = defineWidget({
  id: 'rrf-fusion',
  rootClass: 'rrf-root',
  maxStep: 3,
  render({ host, data, labels }) {
    const k = data.k;
    const bm25 = data.lists?.bm25 || [];
    const cosine = data.lists?.cosine || [];
    const order = data.order || [];
    const fused = data.fused || [];
    const top = fused[0] || null; // the top fused doc, picked at step 1

    const grid = document.createElement('div');
    grid.className = 'rrf-grid';
    host.appendChild(grid);

    // Build one ranked column of chips. `role` themes it; `kind` is "input" or "fused".
    function buildColumn(role, headKey, ids, kind, rankKey) {
      const col = document.createElement('div');
      col.className = 'rrf-col';
      col.dataset.role = role;
      col.dataset.kind = kind;

      const head = document.createElement('div');
      head.className = 'rrf-head';
      head.textContent = labels[headKey] || role;
      col.appendChild(head);

      const list = document.createElement('div');
      list.className = 'rrf-list';
      col.appendChild(list);

      const chips = ids.map((id, i) => {
        const rank = i + 1;
        const chip = document.createElement('div');
        chip.className = 'rrf-chip';
        chip.dataset.id = id;
        chip.dataset.rank = String(rank);
        chip.innerHTML =
          `<span class="rrf-rank">${rank}</span>` +
          `<span class="rrf-docid">${esc(id)}</span>` +
          `<span class="rrf-recip"></span>`;
        list.appendChild(chip);
        return chip;
      });

      grid.appendChild(col);
      return { col, list, chips };
    }

    const colA = buildColumn('bm25', 'headBm25', bm25, 'input');
    const colB = buildColumn('cosine', 'headCosine', cosine, 'input');
    const colF = buildColumn('fused', 'headFused', order, 'fused');

    // ── Full fused table (additive; revealed at the final step alongside the fused column).
    // Every doc gets a row: rank-in-A, rank-in-B, and Σ 1/(k+rank). Sorted by RRF (data.order).
    // This surfaces the RRF lesson the column alone hides: rank-based fusion can TIE two docs
    // each ranker saw differently, and a doc ranked high by ONE ranker can lose to a doc ranked
    // middling by BOTH. Both effects are detected from the data — no hard-coded ids.
    const byId = Object.fromEntries(fused.map((d) => [d.id, d]));
    const rows = order.map((id) => byId[id]).filter(Boolean);

    // Detect the tie group: docs sharing the (numerically) largest equal RRF, beyond the very top.
    function tieGroup(list) {
      const groups = new Map();
      list.forEach((d) => {
        const key = d.rrf.toFixed(6);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(d.id);
      });
      for (const ids of groups.values()) if (ids.length >= 2) return new Set(ids);
      return new Set();
    }
    // Detect the "high by one, middling by both" upset: an adjacent (winner, loser) pair where the
    // LOSER was ranked strictly HIGHER than the winner by at least one ranker, yet the winner — more
    // balanced across both rankers — still scores more overall. (Skip the tie pair so the two effects
    // read as separate lessons.) Captures e.g. a doc that one ranker put at rank 5 losing to a doc
    // neither ranker put above rank 5.
    function upsetPair(list) {
      for (let i = 1; i < list.length; i++) {
        const win = list[i - 1], lose = list[i];
        if (ties.has(win.id) && ties.has(lose.id)) continue;
        const loserBeatsOnOne =
          lose.rankBm25 < win.rankBm25 || lose.rankCosine < win.rankCosine;
        if (loserBeatsOnOne) return { winner: win.id, loser: lose.id };
      }
      return null;
    }
    const ties = tieGroup(rows);
    const upset = upsetPair(rows);

    const table = document.createElement('div');
    table.className = 'rrf-table is-hidden';
    table.setAttribute('role', 'table');

    const thead = document.createElement('div');
    thead.className = 'rrf-trow rrf-thead';
    thead.setAttribute('role', 'row');
    thead.innerHTML =
      `<span class="rrf-th rrf-th-doc">${esc(labels.tblDoc || 'Doc')}</span>` +
      `<span class="rrf-th rrf-th-rk" data-role="bm25">${esc(labels.headBm25 || 'A')}</span>` +
      `<span class="rrf-th rrf-th-rk" data-role="cosine">${esc(labels.headCosine || 'B')}</span>` +
      `<span class="rrf-th rrf-th-rrf">${esc(labels.tblRrf || 'RRF')}</span>`;
    table.appendChild(thead);

    const fmt6 = (n) => (typeof n === 'number' ? n.toFixed(6) : '');
    rows.forEach((d) => {
      const row = document.createElement('div');
      row.className = 'rrf-trow';
      row.setAttribute('role', 'row');
      row.dataset.id = d.id;
      if (ties.has(d.id)) row.classList.add('is-tie');
      if (upset && d.id === upset.winner) row.classList.add('is-upset-win');
      if (upset && d.id === upset.loser) row.classList.add('is-upset-lose');
      row.innerHTML =
        `<span class="rrf-td rrf-td-doc">${esc(d.id)}</span>` +
        `<span class="rrf-td rrf-td-rk" data-role="bm25">${d.rankBm25}</span>` +
        `<span class="rrf-td rrf-td-rk" data-role="cosine">${d.rankCosine}</span>` +
        `<span class="rrf-td rrf-td-rrf">${fmt6(d.rrf)}</span>`;
      table.appendChild(row);
    });

    // Caption strip under the table: spell out the tie + the upset in words, with exact numbers.
    const note = document.createElement('div');
    note.className = 'rrf-note';
    const tieNote = document.createElement('div');
    tieNote.className = 'rrf-note-line is-tie';
    if (ties.size >= 2) {
      const ids = [...ties];
      const a = byId[ids[0]], b = byId[ids[1]];
      const tpl = labels.tieNote ||
        '{a} and {b} TIE at {score}: {a} = 1/({k}+{ar1})+1/({k}+{ar2}), {b} = 1/({k}+{br1})+1/({k}+{br2}) — same sum, ranks just swapped.';
      tieNote.textContent = tpl
        .replace('{a}', a.id).replace('{a}', a.id)
        .replace('{b}', b.id).replace('{b}', b.id)
        .replace('{score}', fmt6(a.rrf))
        .replaceAll('{k}', String(k))
        .replace('{ar1}', String(a.rankBm25)).replace('{ar2}', String(a.rankCosine))
        .replace('{br1}', String(b.rankBm25)).replace('{br2}', String(b.rankCosine));
      note.appendChild(tieNote);
    }
    if (upset) {
      const w = byId[upset.winner], l = byId[upset.loser];
      const lBest = Math.min(l.rankBm25, l.rankCosine);
      const upsetLine = document.createElement('div');
      upsetLine.className = 'rrf-note-line is-upset';
      const tpl = labels.upsetNote ||
        '{loser} ranked {lbest} by one ranker, yet {winner} — only ({wr1},{wr2}) — outscores it ({ws} > {ls}): middling by both beats high by one.';
      upsetLine.textContent = tpl
        .replace('{loser}', l.id).replace('{lbest}', String(lBest))
        .replace('{winner}', w.id)
        .replace('{wr1}', String(w.rankBm25)).replace('{wr2}', String(w.rankCosine))
        .replace('{ws}', fmt6(w.rrf)).replace('{ls}', fmt6(l.rrf));
      note.appendChild(upsetLine);
    }

    // Score readout sits under the fused column; revealed at step 2.
    const score = document.createElement('div');
    score.className = 'rrf-score is-hidden';
    if (top) {
      const fmt = (n) => (typeof n === 'number' ? n.toFixed(6) : '');
      score.innerHTML =
        `<span class="rrf-docid">${esc(top.id)}</span>` +
        `<span class="rrf-sum">` +
        `<span class="rrf-term">${fmt(top.contributions?.bm25)}</span>` +
        `<span class="rrf-op">+</span>` +
        `<span class="rrf-term">${fmt(top.contributions?.cosine)}</span>` +
        `<span class="rrf-op">=</span>` +
        `<span class="rrf-total">${fmt(top.rrf)}</span>` +
        `</span>`;
    }
    colF.col.appendChild(score);

    // The full table + its prose notes live BELOW the 3-column grid, full width inside the host.
    host.appendChild(table);
    if (note.childElementCount) {
      note.classList.add('is-hidden');
      host.appendChild(note);
    }

    // Find a chip by doc id within a column's chip set.
    function chipOf(set, id) {
      return set.chips.find((c) => c.dataset.id === id) || null;
    }

    // per-step update (factory clamps s to [0,maxStep] and owns caption/counter)
    return function update(s) {
      // Column visibility: inputs always shown; fused only from step 3.
      colF.col.classList.toggle('is-hidden', s < 3);
      score.classList.toggle('is-hidden', s < 2);

      // Final reveal (step 3): the full fused table + tie/upset notes appear alongside the
      // fused column. Earlier steps stay exactly as before — additive only.
      table.classList.toggle('is-hidden', s < 3);
      note.classList.toggle('is-hidden', s < 3);

      // Reset per-step chip decorations across all columns.
      [colA, colB, colF].forEach((set) => {
        set.chips.forEach((c) => {
          c.classList.remove('is-pick', 'is-top');
          c.querySelector('.rrf-recip').textContent = '';
        });
      });

      // Step 1+: pick the top fused doc in BOTH input lists, annotate reciprocals.
      if (s >= 1 && top) {
        const a = chipOf(colA, top.id);
        const b = chipOf(colB, top.id);
        if (a) {
          a.classList.add('is-pick');
          a.querySelector('.rrf-recip').textContent = reciprocalText(k, top.rankBm25);
        }
        if (b) {
          b.classList.add('is-pick');
          b.querySelector('.rrf-recip').textContent = reciprocalText(k, top.rankCosine);
        }
      }

      // Step 3: the fused doc ranked #1 by both rises to the top — flag it.
      if (s >= 3 && top) {
        const f = chipOf(colF, top.id);
        if (f) f.classList.add('is-top');
      }
    };
  },
});

function reciprocalText(k, rank) {
  return `1/(${k}+${rank})`;
}
