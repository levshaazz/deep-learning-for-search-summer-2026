# План доведения лекций до ума — «Wait But Why edition»

> Статус: ПЛАН (ничего в деках пока не меняем). Цель — превратить три готовых дека
> (`Lectures/00-introduction.html`, `01-search-ir-ml-system-design.html`,
> `02-nlp-tokenization-similarity.html`) из «технически корректных» в «фирменные»:
> единый рассказчик **Serega**, стиль **Wait But Why**, нарративные кэтчи (Sci-fi / LOTR),
> и настоящие иллюстрации вместо текущих inline-SVG-заглушек.
>
> Жёсткие инварианты (не нарушать на любом шаге): только существующий template (никаких
> новых типов слайдов/CSS-движка), вся математика в KaTeX, английский язык контента,
> pre-flight **0 errors / 0 warnings / 0 console errors**, проверка headless-рендером.

---

## 0. Источник стиля (прочитано в блоге)
Базовые наблюдения из waitbutwhy.com (пост «Why Procrastinators Procrastinate» + разборы):
- Длинный, разговорный, **от первого лица**; самоирония, «как будто старый друг объясняет».
- **Антропоморфные персонажи** олицетворяют абстракции (Instant Gratification Monkey,
  Panic Monster). → нам нужен набор таких «существ» для IR/NLP.
- **Зум**: от частного к космическому (масштабы, Ферми-оценки, таймлайны).
- Ритм: короткие рубленые фразы вперемешку с длинными; риторические вопросы.
- Акценты: *италик* для терминов, **жирный** для имён/ключевого, сноски-приколы.
- Рисунки: **нарочито простые stick-figure**, MS-Paint/Pixelmator-эстетика, плоские
  яркие цвета, выразительные лица, подписи от руки, юмор в самих картинках.

Источники: https://waitbutwhy.com/2013/10/why-procrastinators-procrastinate.html ·
https://waitbutwhy.com/ · https://inksights.rep-ink.com/2016/03/a-blog-with-stick-figures-has-some-of-the-most-engaging-marketing-copy-and-heres-why/ ·
https://singularityhub.com/2016/01/20/wait-but-why-elon-musks-favorite-blog-makes-good-ideas-available-to-everyone-with-cartoons/

---

## 1. Правила повествования (voice rules) — применяем во ВСЕХ деках
Эти правила лягут в `_research/voice_wbw.md` как канон для будущих лекций.
1. **Рассказчик — Serega**, от первого лица: «I'm Serega, and today we've got a problem…».
   Тёплый, на «ты» к аудитории, лёгкая самоирония.
2. **Один-два нарративных кэтча на лекцию** (см. §3): выдуманная Sci-fi/LOTR-ситуация,
   которая «обрамляет» технический материал. Кэтч открывает Part-дивайдеры и хук-слайды,
   изредка всплывает в speaker notes — но **технические слайды остаются чистыми** (формулы,
   таблицы, диаграммы без клоунады).
3. **Антропоморфные «существа»** для абстракций (переиспользуемые между лекциями):
   - *The Lexical Gremlin* — путает «couch» и «sofa» (vocabulary mismatch).
   - *Tokenosaurus* — режет слова на куски (tokenization).
   - *Sir Cosine & the Knights of the Unit Sphere* (similarity, LOTR-вайб).
   - *The Curse-of-Dimensionality Wraith* (назгул, distance concentration).
   - *Goodhart, the Trickster* (метрика, которая стала целью).
4. **Юмор — ненавязчивый**: 1 шутка/сноска на 2–3 слайда максимум; никогда не в ущерб
   точности. Шутки живут в подписях, speaker notes, и в самих картинках.
5. **Зум-приёмы**: масштабные числа (10^12 страниц, 15% новых запросов/день), таймлайны,
   «представь, что…». Уже частично есть — усилить.
6. **Связность**: сквозной кэтч начинается на title/divider и «закрывается» на финале
   (callback). Spine-слайд «Get Data → Measure → Rank» — общий якорь.

---

## 2. Персонаж «Serega» — спецификация для консистентной генерации
Чтобы GPT Image рисовал ОДНОГО и того же героя во всех картинках, фиксируем **character sheet**
(первый артефакт на генерацию — `serega-charsheet`, см. §5):

> **Serega** — a friendly stick-figure character in Wait-But-Why style: simple round head,
> dot eyes + tiny smile, thin noodle limbs. **Signature traits (always present):**
> a **Tatar tюбетейка (embroidered skullcap, tübətəy)** on his head, and **long black wavy
> hair** flowing out from under the cap to shoulder length. Drawn with thick black ink
> outlines on off-white paper, 1–2 flat accent colours (course blue #2A6FDB + warm
> accents), MS-Paint / Pixelmator crudeness, expressive but minimal. No gradients, no 3D.

- Лист поз (для переиспользования): нейтральная, указывает рукой, чешет затылок (озадачен),
  бежит, держит меч/факел (LOTR-сцены), сидит у пульта космокорабля (Sci-fi).
- Все последующие промпты ссылаются на этот канон строкой-преамбулой (§5), чтобы стиль/герой
  не «плавали» между картинками.

---

## 3. Нарративные кэтчи по лекциям (Sci-fi / LOTR)
Каждой лекции — свой сквозной сюжет; технический материал «нанизан» на него.

- **Лекция 0 (Введение).** Кэтч: *«The Briefing»* — Serega как капитан экспедиции даёт
  брифинг перед полётом сквозь «Galaxy of Information». Дивайдеры = этапы миссии. Финал
  (цитата «I will make your life miserable») = напутствие капитана.
- **Лекция 1 (Search & IR + ML System Design).** Кэтч: *«The Lost Record»* (Project Hail
  Mary-вайб, уже частично заложен) — оператор станции ищет ОДНУ запись среди миллиардов;
  IR = найти, ML System Design = построить машину, которая ищет вечно. Существа: Lexical
  Gremlin, Goodhart the Trickster, the Iceberg (Sculley).
- **Лекция 2 (NLP · Tokenization · Similarity).** Кэтч: *«First Contact»* (уже частично) —
  Serega учит машину понимать речь пришельца (Rocky-вайб) + LOTR-арка для similarity:
  *«Sir Cosine and the Knights of the Unit Sphere»* против *Curse-of-Dimensionality Wraith*.
- **Шаблон для будущих лекций:** 1 сквозной кэтч + 1–2 существа + callback на финале;
  выбирать Sci-fi для систем/инфраструктуры, LOTR для «путешествий/квестов» (retrieval, RAG).

---

## 4. Система иллюстраций (как встроить, не сломав template)
**Папки** (создаются при исполнении, не сейчас):
```
Lectures/assets/img/
  _char/serega-charsheet.png        # лист персонажа (референс)
  L0/  L0-06-bigpicture.png ...      # по одному файлу на иллюстрацию
  L1/  L1-05-needle.png ...
  L2/  L2-06-firstcontact.png ...
```
**Нейминг:** `L{deck}-{slideNN}-{slug}.{png|webp}` — NN = номер слайда (data-screen-label),
slug — короткий смысл. Так картинку легко сопоставить со слайдом.

**Куда вставлять (3 режима, все — в рамках template):**
1. **Full-slide hook** (title/divider/quote/hook): фон или крупная картинка 16:9 —
   кладём `<img>` в существующий слот (как фото лектора), либо как `.viz-frame` картинку.
2. **Viz-frame иллюстрация**: заменяет/дополняет нынешний inline-SVG — `<img>` внутри
   `.viz-frame` (универсальное правило light-canvas уже гарантирует корректный фон в обеих темах).
3. **Inline-камео Serega**: маленький `<img>` в углу слайда (decorative, `pointer-events:none`),
   ~120–200px, как «ведущий».

**Важно:** диаграммы, где важна ТОЧНОСТЬ (cascade-цифры, BPE-merge, cosine-вычисление,
archflow/sequence) **оставляем как есть** (template-компоненты/SVG) — WBW-арт идёт на
хуки/дивайдеры/обложки/метафоры, а не на точные схемы. Это снимает риск «поехавших» картинок.

**Соотношения сторон:**
- full-slide hook / divider фон → **16:9**
- viz-frame метафора → **16:9** (широкая) или **4:3**
- Serega-камео / портрет → **1:1** или **3:4**
- charsheet → **3:2** (несколько поз в ряд)

---

## 5. Файл промптов для GPT Image — спецификация (твой генерационный pipeline)
**Артефакт:** `Lectures/assets/img/IMAGE_PROMPTS.md` (создам на этапе исполнения).
Формат каждой записи — таблица + блок промпта:

```
### L1-05-needle  ·  16:9  ·  → Lectures/assets/img/L1/L1-05-needle.png  ·  slide 05 (divider P01)
**Prompt:** <STYLE PREAMBLE> + сцена.
```
Где **STYLE PREAMBLE** (общая для всех, чтобы держать единый стиль/героя):
> «Wait But Why style hand-drawn doodle: thick black ink outlines, off-white paper,
> flat 1–2 accent colours (blue #2A6FDB + warm), crude MS-Paint charm, expressive minimal
> stick figures, hand-lettered labels, no gradients/no 3D. Recurring character **Serega**:
> round-headed stick figure wearing an embroidered **Tatar skullcap (tübətəy)** with **long
> black wavy hair** to the shoulders. 16:9.»

Файл будет содержать: (а) charsheet-промпт; (б) по строке на каждую нужную картинку с
именем, соотношением, целевым путём и привязкой к слайду. Ты генеришь → кладёшь в указанные
пути → я подключаю `<img>` к слайдам (отдельная фаза).

**Инвентарь картинок (черновой, ~25–30 шт.):**
- **L0:** charsheet; title-art (briefing); P01 «who am I» камео; bigpicture (galaxy of info);
  course-arc; finale (captain's send-off). (~6)
- **L1:** needle-in-cosmos; drowning-in-data; lexical gremlin (couch vs sofa); zipf long-tail
  beach; position-bias loop; model-not-a-system; ML iceberg; data-flywheel-vs-evil-twin;
  Goodhart trickster. (~9)
- **L2:** first-contact (Serega + alien); discreteness (cat+dog≠average); zipf few-words;
  tokenosaurus; fertility token-tax; glitch-token «SolidGoldMagikarp» blind-spot;
  Sir Cosine & knights of the unit sphere; curse-of-dimensionality wraith; hubness. (~9)
- Запас: 2–3 камео Serega для дивайдеров.

(Существующие `IMAGE PROMPT` в speaker notes — переиспользуем как черновики, переписав под
Serega + STYLE PREAMBLE.)

---

## 6. План по декам (что правим на слайдах)
Для каждого дека — 2 прохода:
- **Voice-pass:** переписать title/дивайдеры/хуки/финал под рассказчика Serega + кэтч (§3),
  расставить 3–5 ненавязчивых шуток. Технические слайды — не трогаем по сути, только
  лёгкие связки в подписях/notes.
- **Art-pass:** в слоты §4 подключить `<img>` из `assets/img/...` (после генерации).
  Заменяем хук-SVG на арт; точные схемы оставляем.

Ориентировочные слайды под арт/voice — см. инвентарь §5 (привязка по номерам).

---

## 7. Технический долг / общий punch-list (из честной оценки)
- [ ] **Вычитка `/proofread`** всех трёх деков (опечатки/грамматика) — ещё не делалась построчно.
- [ ] **Обновить `_audit/ci-gate.mjs`** ожидаемые счётчики слайдов (L0=20, L1=56, L2=70).
- [ ] **Собрать offline-standalone** (`build-vendor.mjs` → `build-standalone.mjs`) — после арта.
- [ ] **GitHub Pages**: наполнить репозиторий (по твоему решению) + проверить, что `<img>`-пути
      работают на github.io.
- [ ] **office hours / GitHub / email / фото** — уже проставлены (проверить перед сдачей).
- [ ] **Остальной курс** (пятница Pair 3+4: Classical IR / BM25 / Ranking Metrics; недели 2–7) —
      не создан; строить теми же правилами (voice_wbw + charsheet переиспользуются).

---

## 8. Фазы выполнения и критерии приёмки
**Фаза A — Канон (быстро):** `_research/voice_wbw.md` (правила §1) + Serega charsheet-промпт.
**Фаза B — Промпты:** `Lectures/assets/img/IMAGE_PROMPTS.md` (§5) со всеми ~25–30 записями.
  → *ты генеришь картинки и кладёшь в пути.*
**Фаза C — Voice-pass** по 3 декам (§6), pre-flight 0/0/0 после каждого.
**Фаза D — Art-pass**: подключить `<img>`, headless-проверка (нет overflow/наложений, обе темы,
  светлый canvas в dark), pre-flight 0/0/0.
**Фаза E — Финализация:** `/proofread`, ci-gate counts, standalone build, визуальный VLM-проход.

**Критерии «готово»:** единый Serega во всех картинках; кэтч открывается и закрывается в каждой
лекции; ненавязчивый юмор; 0 ошибок pre-flight/консоли; ни одной «поехавшей» иллюстрации
(headless-аудит чист); все картинки подключены и читаемы в light и dark.

---

### Что я НЕ трогаю сейчас
Никаких правок в `.html`/`.css`. Этот файл — только план. По твоему «go» начну с Фазы A/B
(канон стиля + файл промптов), затем дашь картинки — подключу (Фаза D).
