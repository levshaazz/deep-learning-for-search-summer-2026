# arc.md — the course meta-arc: *The Expedition across the Galaxy of Information*

> **Status: CANON.** The single through-line that connects every lecture/Book chapter. It sits above
> the per-lecture catchphrases in [voice_wbw.md](../_research/voice_wbw.md) §4 and the per-lecture beat
> sheets (`narrative/L<n>.md`), and it pins every lecture to the course spine **Get Data → Measure →
> Rank**. Built per [NARRATIVE_METHOD.md](../_research/iterations/NARRATIVE_METHOD.md) (esp. P3 spatial
> metaphor, P11 spine question, P12 callbacks). Serega rules from [voice_wbw.md](../_research/voice_wbw.md) §2.

---

## 1. The premise (one paragraph, memorize it)

You (the student) have signed onto an **expedition across the Galaxy of Information** — an endless
ocean of documents, queries, signals, and noise. **Serega** is your guide and co-pilot (not the
captain — *you* become the captain by the end). The mission is to build **the Ship**: a machine that
can find the **one true record** in a galaxy of billions, and *keep finding it forever*. The Ship is
built one part per lecture. The galaxy has three territories — and they are the course spine. By
Project Defense, Serega hands you the helm: **you take the Ship out alone.**

## 2. The Galaxy map *is* the spine: **Get Data → Measure → Rank**

The spine is not a slogan — it's the **map of the galaxy** and the **loop every search system runs**.
Three territories; each builds one subsystem of the Ship. Every lecture lives in a territory (some
straddle a border — that border crossing *is* the lecture's hook).

| Territory | Spine leg | What it asks | What of the Ship it builds | Governing metaphor (P3) |
|-----------|-----------|--------------|----------------------------|--------------------------|
| **I. The Archives** | **Get Data** | *How do we capture & represent the stuff?* | Sensors & Archives: tokenizer, embeddings, the index | raw matter → coordinates on a map |
| **II. The Instruments** | **Measure** | *How do we tell what's close / what's good?* | Instruments: similarity, relevance, metrics, evaluation | rulers, angles, the unit sphere |
| **III. The Bridge** | **Rank** | *How do we order & deliver the answer, at scale, forever?* | Navigation & Bridge: the cascade, ANN, serving, RAG | the funnel; hyperspace lanes |

**The spine slide** (the shared anchor, every lecture): a three-stop map *Get Data → Measure → Rank*
with the current lecture's stop lit. It opens the agenda and is the recurring "you are here." This is
NARRATIVE_METHOD **P11** made physical — the same question threads the whole course.

## 3. Arc rules (how the catchphrases chain into one journey)

1. **Each lecture = one mission with its own catchphrase**, but it *advances the expedition*: it opens
   with a **callback** to where the Ship stands, and closes with a **hook** toward the next part
   (P12). The catchphrase opens (divider/hook) and closes (finale) the lecture (voice_wbw §6).
2. **Sci-fi for systems/infrastructure; LOTR/quest for journeys** (voice_wbw §4). Retrieval, RAG,
   ranking → quest; tokenization, ANN, serving, production → sci-fi.
3. **Creatures recur and pay off across lectures** (P2) — a creature introduced as a *problem* often
   returns later as *defeated by a new tool* (the strongest connective device — see §5).
4. **Milestones are arc beats, not interruptions:** Midterm = *The First Trial*; Final = *The Final
   Trial*; Defense = *You Take the Helm*.
5. **The Ship is cumulative:** never re-introduce a subsystem as if new — reference the part built in
   the earlier lecture ("remember the index we built in *The Star Catalog*?").

## 4. The lectures → catchphrase → spine (the full expedition)

| L | Lecture (syllabus) | Catchphrase | Mode | Spine leg | Problem → Solution (the mission) |
|---|---|---|---|---|---|
| **0** | Introduction | **The Briefing** | sci-fi | *whole map* | Serega briefs the crew before the flight; lays out the galaxy (the spine) and the rules. Finale = the captain's send-off ("I will make your life miserable" line). |
| **1** | Search & IR · ML System Design | **The Lost Record** | sci-fi | Rank-anchored (+all) | One record among billions must be found — *and kept findable forever*. IR = find it; ML System Design = build the machine that keeps finding it. Creatures: **Lexical Gremlin**, **Goodhart**, the **Iceberg** (hidden ML debt). |
| **2** | NLP · Tokenization · Similarity | **First Contact** | sci-fi → LOTR | Get Data → Measure | Teach a machine to understand an alien's speech (tokenize), then to tell when two meanings are *close* (similarity). **Tokenosaurus**; **Sir Cosine & the Knights of the Unit Sphere** vs the **Curse-of-Dimensionality Wraith**. |
| **3** | Classical IR (TF-IDF, BM25, inverted index) · Ranking Metrics | **The Star Catalog** | sci-fi | Measure + Rank | You can't scan every star — build the **inverted index** (the catalog) so any record is found instantly; **BM25** = the trusty old sextant; **metrics** = how you grade your navigation. |
| **4** | Intro DL for Search · Word embeddings · dim. reduction | **The Map of Meaning** | LOTR/quest | Get Data | Words get *coordinates* — meaning becomes a place you can travel. Dimensionality reduction = folding the great map small enough to carry. **Callback:** the alien from First Contact finally gets a position on the map. |
| **5** | Dense & contextual embeddings · contrastive learning · Transformers & Attention | **The Council of Attention** | sci-fi | Get Data → Measure | The crew learns *who to listen to* (attention). Contrastive learning pulls synonyms together and pushes impostors apart — **the weapon that finally cages the Lexical Gremlin** (callback to L1). |
| **6** | Bi-encoders (DPR, SBERT) · Cross-encoders & reranking · multi-stage | **Scouts and Judges** | LOTR/quest | Rank | Two kinds of crew: **Scouts** (bi-encoders) sweep fast and wide; **Judges** (cross-encoders) deliberate slowly on the few. The neural cascade is born (callback to The Lost Record's funnel). |
| **7** | Late interaction (ColBERT) · SPLADE · hybrid & RRF · Learning to Rank | **The Alliance** | LOTR/quest | Rank | Sparse and dense armies were fighting alone; **hybrid + RRF** unite them under one banner (the council fuses their votes). **Learning to Rank** = training the captain to order the host. |
| — | **Midterm** | **The First Trial** | — | — | The crew is tested before the deep galaxy. |
| **8** | ANN: HNSW, IVF, PQ · FAISS · vector DBs · Production | **Hyperspace Lanes** | sci-fi | Rank / serving | Linear scan dies at galaxy scale — open **hyperspace lanes** (HNSW = navigable small-world jump-gates); **PQ** compresses the star-maps to fit; production keeps the Ship fast and cheap. |
| **9** | RAG fundamentals · chunking · query understanding & rewriting | **The Oracle** | sci-fi | Rank → Generate | The Ship stops merely *finding* and starts *answering*: retrieve, then speak. Query rewriting = hearing what the captain *really* asked. |
| **10** | RAG evaluation (RAGAS, LLM-as-judge) · Agentic RAG (ReAct, Self-RAG, CRAG) | **Judging the Oracle** | sci-fi | Measure (eval) | How do you grade an Oracle that sounds confident either way? **Goodhart returns** (the LLM-judge can be gamed). The agentic loop = the Ship that critiques and corrects itself. |
| **11** | Advanced RAG (multi-hop, GraphRAG) · Multimodal (CLIP, ColPali) · ethics & safety | **The Deep Field** | LOTR/quest | Rank → Generate (frontier) | The longest quest: multi-hop reasoning across many records; **GraphRAG** = the constellation map; multimodal = learning to *see*, not only read; ethics = the captain's responsibility for what the Ship says. |
| — | **Final** | **The Final Trial** | — | — | The galaxy's last test. |
| — | **Project Defense** | **You Take the Helm** | — | — | Serega steps back. The student is now the captain; the Ship is theirs. Callback to The Briefing. |

## 5. Creature roster across the arc (the payoff chains — P2)

| Creature | Personifies | Introduced | Returns / pays off |
|----------|-------------|------------|---------------------|
| **Lexical Gremlin** | vocabulary mismatch ("couch" ≠ "sofa") | L1 (problem) | **L5** — *caged by contrastive learning* (the satisfying defeat) |
| **Goodhart the Trickster** | a measure that became a target | L1 (metrics) | **L3** (ranking metrics), **L10** (gaming the LLM-judge) — the recurring villain of *Measure* |
| **Tokenosaurus** | sub-word splitting | L2 | cameo whenever tokenization matters (L9 chunking) |
| **Sir Cosine & the Knights** | cosine similarity / angle on the sphere | L2 (hero) | **L4–L7** — the Knights ride wherever similarity is scored |
| **Curse-of-Dimensionality Wraith** | distance concentration in high-d | L2 (catch) | **L8** — why exact NN dies and ANN/PQ are needed |
| **The Iceberg** | hidden technical debt (Sculley) | L1 | **L8/L9** — production/serving is the 90% below the water |

Rule: a creature has **one tell, one job**, and is **reused, never duplicated** (NARRATIVE_METHOD P2).
Creatures appear only on hooks/metaphor/viz beats — **never on precision (Climb) beats** (P9).

## 6. Connective tissue (the open/close template every lecture obeys)

- **Open** with the spine slide ("you are here") + a one-line callback to the Ship's current state.
- **Hook** with the lecture's catchphrase situation (the mission).
- **Close** by resolving the catchphrase *and* hooking the next ("…but the Scouts bring back too many —
  next time, who *judges* them?").
- The finale callback of L0 ("I will make your life miserable") is the captain's standing promise; the
  finale callback of Defense answers it ("…and now you can make the *galaxy's* life miserable").

## 7. Acceptance criteria for the arc (gate: beat-coverage + manual)
- [ ] Every lecture maps to ≥1 spine leg and lights the **spine slide** at its stop.
- [ ] Catchphrase **opens and closes** each lecture; close hooks the next (no orphan endings).
- [ ] Each lecture **references the Ship part** built earlier (cumulative, never re-introduced).
- [ ] Every creature obeys one-tell-one-job; every introduced *problem-creature* has a later *payoff*.
- [ ] Sci-fi vs LOTR assignment matches §3 rule (systems = sci-fi, journeys = quest).
- [ ] The Defense callback resolves the L0 send-off (the arc closes).
