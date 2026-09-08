# milestones.md — arc beats for Midterm / Final / Project Defense

> **Даты выверены по `data/course.json.schedule` (2026-08-24).** До этого документ со статусом
> CANON называл три недели, ни одна из которых не совпадала с расписанием (Midterm «Week 4 Wed»
> против недели 7, защита «Week 7 Wed» против недели 14), а Final значился слотом, которого в
> расписании нет вовсе. Расписание — источник истины; этот файл описывает СМЫСЛ вех, а не даты.

> **Status: CANON.** The three milestones are **arc beats, not interruptions** (arc.md §3.4). They have
> no Climb (no new technical content) — they are framing/recap moments in the expedition. Reference
> pages: `/{lang}/assignments`, `/{lang}/labs`, `/{lang}/schedule`. No slide deck required (or a thin
> framing deck only).

## The First Trial — Midterm (Week 7, session 2 — per `data/course.json.schedule`)
- **Frame:** the crew is tested before the deep galaxy.
- **Beats:** `hook-trial` (Serega: "before we go deeper, the galaxy tests you") → `recap`
  (a spine-map recap: which territories/Ship parts are covered — Get Data + the start of Measure/Rank,
  L0–L12) → `payoff` ("survive this and the hyperspace lanes open").
- **Covers:** L0–L10 — everything scheduled up to the midterm slot (weeks 1–7): IR, system design,
  tokenization, similarity, classical IR, entropy, metrics, embeddings, attention, encoders, wiring,
  scouts-and-judges. (This used to read «L0–L12», contradicting `arc.md`, which says L0–L10; the
  schedule settles it.)
- **Reference:** exam scope + format on `/schedule`; no new `data/` or widgets.

## The Final Trial — Final (no slot in `schedule`; it exists only in `assessment.components`, 30 %)
- **Frame:** the galaxy's last test.
- **Beats:** `hook-final-trial` → `recap` (full spine map lit; the whole Ship assembled) → `payoff`
  ("one more flight — and then she's yours").
- **Covers:** the **core course L0–L20 only**, weighted toward the second half (ANN/serving, RAG, eval,
  agentic, advanced/multimodal). All **21 lectures (L0–L20)** are part of one course in dependency order — there is no
core/optional split and no separate deep-dive track. Exam coverage follows the schedule in
`data/course.json`: the midterm covers everything up to its slot, the final covers the course.

## You Take the Helm — Project Defense (Week 14, session 2 — the `project-search` workshop)
- **Frame:** Serega steps back; the **student becomes the captain**. The arc's resolution.
- **Beats:** `hook-handoff` (Serega hands over the Ship) → `the-defense` (students present their built
  systems — they *are* the captains now) → `payoff-callback` (**resolves the L0 send-off**: *"I said
  I'd make your life miserable — now go make the galaxy's life miserable. Fair winds, captain."*).
- **Covers:** the project; the arc closes. This is the single most important callback in the course
  (arc.md §6) — the L0 promise is answered here.

## Acceptance
- Each milestone lights the spine map (recap), carries the catchphrase frame, and **adds no new
  precision content**. The Defense payoff explicitly closes the L0 send-off (arc-level callback).
