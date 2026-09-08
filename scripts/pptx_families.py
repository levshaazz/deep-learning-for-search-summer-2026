#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pptx_families — КОНТРАКТ между курсом и шаблоном дизайнера.

Один файл, который читают все три инструмента: болванка (`pptx_fixture.py`), наливальщик
(`build_pptx.py`) и обратный перенос темы. Здесь и только здесь записано:

  · во что сворачиваются 28 значений `data-type` — 16 СЕМЕЙСТВ макетов;
  · какие роли (= имена плейсхолдеров) живут в каждом семействе и обязательны ли они.

Почему семейства, а не типы один в один. Половина типов курса — это «заголовок плюс одна
большая фигура»: viz, arch, archflow, timeline, funnel, sequence, demo. Просить дизайнера
нарисовать семь одинаковых макетов — это семь мест, где они разъедутся. Свести их в одно
семейство — значит получить одно решение, применённое к 227 слайдам.

Имена ролей — это ИМЕНА ПЛЕЙСХОЛДЕРОВ в .potx (Область выделения PowerPoint). Наливальщик
ищет по имени и ни по чему больше: сопоставление по позиции развалилось бы от первой же
правки макета, а по индексу — от вставки плейсхолдера в середину.

Правило совместимости: имя роли, однажды отданное дизайнеру, НЕ переименовывается — иначе
его шаблон перестаёт наливаться молча. Новую роль добавлять можно; старую убирать нельзя.
"""

# ── тип слайда → семейство макета ────────────────────────────────────────────────────────
FAMILY_OF_TYPE = {
    "definition": "definition",
    "viz": "figure", "arch": "figure", "archflow": "figure", "timeline": "figure",
    "funnel": "figure", "sequence": "figure", "demo": "figure",
    "two-col": "two-col",
    "table": "table",
    "formula": "formula", "derivation": "formula", "theorem": "formula",
    "divider": "divider",
    "misconception": "misconception",
    "refs": "refs", "references": "refs",
    "default": "free", "": "free",
    "walkthrough": "steps", "e2e": "steps",
    "agenda": "agenda", "objectives": "agenda",
    "quiz": "quiz",
    "quote": "quote",
    "title": "title",
    "final": "final", "art-hero": "final",
    "code": "code",
}

# Роли расширены 08.09.2026 по замеру ВСЕГО курса, а не пилотной деки. Первая редакция
# контракта выводилась по деке 10 — и на остальных двадцати 388 блоков не нашли своей
# роли: проза (`body`) встречается во всех семействах, фигура заезжает в двухколоночные и
# табличные слайды, «свободный» тип таскает карточку определения. Урок общий: контракт,
# выведенный по одному экземпляру, описывает экземпляр.
# ── семейство → роли. req=обязательна · many=повторяется на слайде ───────────────────────
# «many» меняет поведение наливальщика: один плейсхолдер размножается по числу кусков
# контента (пункты списка, варианты ответа, источники), а не склеивает их в одну рамку.
FAMILIES = {
    "definition":    dict(req=["title", "def-tag", "def-term", "def-body"],
                          opt=["kicker", "def-where", "figure", "caption", "body", "table"],
                          many=["bullet"]),
    "figure":        dict(req=["title", "figure"],
                          opt=["kicker", "caption", "body", "subtitle", "column-1", "column-2", "table"], many=[]),
    "two-col":       dict(req=["title", "column-1", "column-2"],
                          opt=["kicker", "caption", "body", "figure", "table"], many=[]),
    "table":         dict(req=["title", "table"],
                          opt=["kicker", "body", "caption", "figure", "column-1", "column-2"], many=[]),
    "formula":       dict(req=["title", "formula"],
                          opt=["kicker", "def-where", "body", "figure", "table"],
                          many=["var-symbol", "var-desc"]),
    "divider":       dict(req=["title"],
                          opt=["act-number", "act-sub", "figure", "body"], many=[]),
    "misconception": dict(req=["title", "myth", "truth"],
                          opt=["kicker", "figure", "body"], many=[]),
    # Ссылка приезжает ОДНИМ абзацем, а не четырьмя полями: в разметке автор, название,
    # издание и год лежат инлайн внутри <li>, и экстрактор отдаёт <li> целиком. Просить
    # дизайнера нарисовать четыре рамки, в которые никогда ничего не приедет, — вранье.
    "refs":          dict(req=["title"], opt=["kicker", "body"], many=["bullet"]),
    "free":          dict(req=["title", "body"],
                          opt=["kicker", "figure", "caption", "subtitle", "def-tag", "def-term", "def-body", "table"], many=["bullet"]),
    "steps":         dict(req=["title"],
                          opt=["kicker", "body", "figure"],
                          many=["step-caption", "formula", "step-calc"]),
    "agenda":        dict(req=["title"], opt=["kicker", "body", "figure"], many=["bullet"]),
    "quiz":          dict(req=["title", "quiz-q"], opt=["kicker", "body", "figure"],
                          many=["quiz-option"]),
    "quote":         dict(req=["quote"], opt=["title", "caption", "figure", "body"], many=[]),
    "title":         dict(req=["title"], opt=["subtitle", "figure", "body"], many=[]),
    "final":         dict(req=[], opt=["title", "figure", "body", "act-number", "act-sub"], many=[]),
    "code":          dict(req=["title", "code"], opt=["kicker", "code-header", "body", "bullet"],
                          many=[]),
}

# Роли, которые наливальщик умеет ставить, но макет вправе их не иметь: тогда содержимое
# едет отдельной рамкой на измеренном месте и об этом печатается отчёт. Молча терять контент
# нельзя — это ровно тот класс дефекта, который замечают в готовом файле у заказчика.
FALLBACK_OK = True


def family_of(slide_type):
    """Семейство макета для типа слайда. Незнакомый тип — во 'free', а не падение:
    новый тип появится в курсе раньше, чем дизайнер нарисует под него макет."""
    return FAMILY_OF_TYPE.get(slide_type or "", "free")


def roles_of(family):
    f = FAMILIES[family]
    return list(dict.fromkeys(f["req"] + f["opt"] + f["many"]))


def all_roles():
    out = []
    for fam in FAMILIES:
        out += roles_of(fam)
    return sorted(set(out))


def selftest():
    """Контракт обязан быть замкнут: каждое семейство существует, роли не пусты,
    и в FAMILY_OF_TYPE нет ссылки на семейство, которого нет."""
    fails = []
    for t, fam in FAMILY_OF_TYPE.items():
        if fam not in FAMILIES:
            fails.append(f"тип {t!r} ведёт в несуществующее семейство {fam!r}")
    for fam, spec in FAMILIES.items():
        if not roles_of(fam):
            fails.append(f"семейство {fam!r} без ролей")
        dup = set(spec["req"]) & set(spec["opt"])
        if dup:
            fails.append(f"семейство {fam!r}: роль и обязательна, и опциональна — {sorted(dup)}")
    if fails:
        for f in fails:
            print("  x", f)
        return 1
    print(f"[pptx-families] PASS — {len(FAMILIES)} семейств, "
          f"{len(FAMILY_OF_TYPE)} типов, {len(all_roles())} ролей")
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(selftest())
