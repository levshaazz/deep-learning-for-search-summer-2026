#!/usr/bin/env python3
"""check_glossary.py — GLOSSARY gate (G33): канон терминов §7 перестал быть обещанием.

Класс дефекта (ФАЗА 4.9 плана). Утверждённый глоссарий живёт таблицей в narrative/style-ru.md,
а проверялись из него ровно семь строк, зашитых регулярками в языковой линтер. Остальные
девятнадцать держались на внимательности редактора — и дрейфовали: «чанкинг», «эмбеддить»,
«переранжировщик», «лексический разрыв» уже приходилось вычищать заходами по всему курсу.

Гейт делает канон ДАННЫМИ (narrative/glossary-ru.json) и проверяет три вещи:

  [B] ЗАПРЕЩЁННЫЙ ВАРИАНТ в ru-регионе (спаны lang="ru" дек, ru-слои битов Книги, ru-строки
      i18n виджетов и src/lib). EN- и TT-слои не трогаются: канон русский.
  [S] СИНХРОННОСТЬ ДОКУМЕНТА И ДАННЫХ — каждый канон из JSON присутствует в таблице §7 и
      наоборот. Без этой проверки файл и таблица разъедутся, и обе стороны будут «правы».
  [P] ПУСТОЕ ОБОСНОВАНИЕ — у каждого запрета обязано быть поле why. Запрет без причины
      невозможно ни оспорить, ни снять; такие записи гниют.

Правило П4: пустой список терминов или пустой набор просканированных файлов — HARD, иначе гейт
хвалил бы вакуум.

Периметр НЕ включает narrative/*.md: сам стандарт цитирует запрещённые варианты как примеры,
и гейт обязан на них молчать — иначе он потребует переписать собственный источник.

Периметр НЕ включает seminars/*.ipynb — но не потому, что канон там не действует. Ноутбуки
заморожены, пока владелец гоняет комплект на T4: правка развела бы репозиторий с комплектом
на руках. Чтобы отсрочка не превратилась в забывчивость, гейт СЧИТАЕТ этот долг и печатает
его строкой DEBT (на код возврата не влияет). Когда долг дойдёт до нуля, строка сама попросит
завести семинары в source_files и удалить блок — конструкция самоликвидируется.

Usage:  python3 _research/check_glossary.py
        python3 _research/check_glossary.py --selftest
        python3 _research/check_glossary.py --list     (все вхождения, не только первые)
CI-регистрация — отдельным шагом, не здесь.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "narrative", "glossary-ru.json")
STYLE = os.path.join(ROOT, "narrative", "style-ru.md")

_RU_SPAN = re.compile(r'lang="ru">(.*?)</span>', re.S)
_RU_BEAT = re.compile(r"ru: *\[(.*?)\]", re.S)
_RU_JSON = re.compile(r'"ru": *"((?:[^"\\]|\\.)*)"')
_TAGS = re.compile(r"<[^>]+>")


def ru_regions(path, text):
    """Только русские регионы файла — канон не распространяется на EN/TT."""
    if path.endswith(".html"):
        return [_TAGS.sub(" ", m) for m in _RU_SPAN.findall(text)]
    if path.endswith(".js"):
        return _RU_BEAT.findall(text)
    if path.endswith(".json"):
        return _RU_JSON.findall(text)
    return []


def source_files(root=ROOT):
    R = glob.escape(root)
    return (sorted(glob.glob(os.path.join(R, "Lectures", "*", "parts", "*.html")))
            + sorted(glob.glob(os.path.join(R, "content", "book", "*", "beats", "*.js")))
            + sorted(glob.glob(os.path.join(R, "src", "lib", "*.js")))
            + sorted(glob.glob(os.path.join(R, "widgets", "*", "i18n.json"))))


def frozen_debt(terms, root=ROOT):
    """Вхождения запрещённых вариантов в замороженном seminars/ — счётчик, не приговор.

    Возвращает (вхождений, файлов). ipynb читается как JSON: в семинарах нет en/tt-слоёв,
    весь текст русский, поэтому регионы выделять не нужно.
    """
    hits, files = 0, 0
    for nb in sorted(glob.glob(os.path.join(glob.escape(root), "seminars", "*.ipynb"))):
        try:
            cells = json.load(open(nb, encoding="utf-8")).get("cells", [])
        except (ValueError, OSError):
            continue
        blob = "\n".join("".join(c.get("source", [])) for c in cells)
        n = sum(len(re.findall(t["ban"], blob, re.I)) for t in terms)
        if n:
            hits += n
            files += 1
    return hits, files


def load_terms(path=DATA):
    return json.load(open(path, encoding="utf-8")).get("terms", [])


def style_table(path=STYLE):
    """Каноны, объявленные в таблице §7 — для сверки с данными."""
    md = open(path, encoding="utf-8").read()
    try:
        start = md.index("## 7. Утверждённый глоссарий")
    except ValueError:
        return None
    end = md.index("\n## ", start + 10)
    out = []
    for line in md[start:end].split("\n"):
        if not line.startswith("|") or "**" not in line:
            continue
        cell = line.strip("|").split("|")[0]
        for m in re.findall(r"\*\*(.+?)\*\*", cell):
            out.append(m.strip())
    return out


def run(root=ROOT, data=DATA, style=STYLE, listing=False):
    errors, warns = [], []
    terms = load_terms(data)
    if not terms:
        print("[glossary] в narrative/glossary-ru.json нет ни одного термина — "
              "правило П4: «все термины каноничны» ⇒ терминов не ноль")
        return 1
    for t in terms:
        if not t.get("why", "").strip():
            errors.append(f"[P] запрет «{t.get('ban')}» без обоснования — такой запрет нельзя ни оспорить, ни снять")

    table = style_table(style)
    if table is None:
        errors.append("[S] в narrative/style-ru.md не найден раздел «## 7. Утверждённый глоссарий»")
    else:
        flat = " ".join(table).lower()
        for t in terms:
            head = t["canon"].split("/")[0].strip().lower()
            if head and head not in flat:
                errors.append(f"[S] канон «{t['canon']}» есть в данных, но не в таблице §7 — "
                              f"документ и проверка разъехались")

    files = source_files(root)
    if not files:
        errors.append("[B] не найдено ни одного файла с ru-регионами — проверять нечего, "
                      "и это не «зелено»")
    found = 0
    for f in files:
        text = open(f, encoding="utf-8").read()
        regions = ru_regions(f, text)
        if not regions:
            continue
        blob = "\n".join(regions)
        for t in terms:
            for m in re.finditer(t["ban"], blob, re.I):
                found += 1
                rel = os.path.relpath(f, root)
                msg = f"[B] {rel}: «{m.group(0)}» → канон «{t['canon']}» ({t['why']})"
                if listing or found <= 40:
                    errors.append(msg)
                elif found == 41:
                    errors.append("[B] … остальные вхождения скрыты, запусти с --list")

    for e in errors:
        print(f"  ✗ [HARD] {e}")
    for w in warns:
        print(f"  ! [WARN] {w}")
    debt_hits, debt_files = frozen_debt(terms, root)
    if debt_hits:
        print(f"[glossary] DEBT(seminars/, вне периметра — заморожены до T4-прогона)="
              f"{debt_hits} в {debt_files} ноутбук(ах): почини их и заведи seminars/*.ipynb "
              f"в source_files")
    else:
        print("[glossary] DEBT(seminars/)=0 — долг пуст: заведи seminars/*.ipynb в source_files "
              "и удали frozen_debt, иначе канон в ноутбуках снова поедет молча")
    print(f"[glossary] терминов: {len(terms)} · файлов: {len(files)} · HARD={len(errors)} WARN={len(warns)}")
    return 1 if errors else 0


def selftest():
    import shutil
    import tempfile
    import contextlib
    import io
    tmp = tempfile.mkdtemp(prefix="glossary_selftest_")
    os.makedirs(os.path.join(tmp, "narrative"))
    d = os.path.join(tmp, "Lectures", "01-x", "parts")
    os.makedirs(d)
    data = os.path.join(tmp, "narrative", "glossary-ru.json")
    style = os.path.join(tmp, "narrative", "style-ru.md")
    open(style, "w", encoding="utf-8").write(
        "## 7. Утверждённый глоссарий\n\n| Канон | Запрещённые |\n|---|---|\n"
        "| **чанкование** (chunking) | чанкинг |\n\n## 8. Дальше\n")
    json.dump({"terms": [{"canon": "чанкование", "ban": "чанкинг\\w*", "why": "гибрид основы и суффикса"}]},
              open(data, "w", encoding="utf-8"))

    def once(html, **kw):
        open(os.path.join(d, "01-s.html"), "w", encoding="utf-8").write(html)
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = run(root=tmp, data=data, style=style, **kw)
        return rc, buf.getvalue()

    fails = []
    rc, out = once('<span lang="ru">делаем чанкинг корпуса</span>')
    if rc == 0 or "чанкинг" not in out: fails.append("ban-fires")
    rc, _ = once('<span lang="ru">делаем чанкование корпуса</span>')
    if rc != 0: fails.append("canon-silent")
    # EN-слой не подпадает под русский канон
    rc, _ = once('<span lang="en">chunking the corpus</span><span lang="ru">чанкование</span>')
    if rc != 0: fails.append("en-untouched")
    # tt-слой тоже вне периметра
    rc, _ = once('<span lang="tt">чанкинг ясау</span><span lang="ru">чанкование</span>')
    if rc != 0: fails.append("tt-untouched")
    # расхождение данных и таблицы §7
    json.dump({"terms": [{"canon": "выдуманный термин", "ban": "нечто\\w*", "why": "тест"}]},
              open(data, "w", encoding="utf-8"))
    rc, out = once('<span lang="ru">чистый текст</span>')
    if rc == 0 or "разъехались" not in out: fails.append("sync-check")
    # запрет без обоснования
    json.dump({"terms": [{"canon": "чанкование", "ban": "чанкинг\\w*", "why": "  "}]},
              open(data, "w", encoding="utf-8"))
    rc, out = once('<span lang="ru">чистый текст</span>')
    if rc == 0 or "без обоснования" not in out: fails.append("why-required")
    # пустой словарь — П4
    json.dump({"terms": []}, open(data, "w", encoding="utf-8"))
    rc, _ = once('<span lang="ru">чистый текст</span>')
    if rc == 0: fails.append("empty-set")
    # счётчик замороженного долга: считает, но не валит — иначе отсрочка стала бы блокировкой
    json.dump({"terms": [{"canon": "чанкование", "ban": "чанкинг\\w*", "why": "гибрид"}]},
              open(data, "w", encoding="utf-8"))
    os.makedirs(os.path.join(tmp, "seminars"), exist_ok=True)
    json.dump({"cells": [{"source": ["делаем чанкинг корпуса\n", "и ещё раз чанкинг\n"]}]},
              open(os.path.join(tmp, "seminars", "lab-x.ipynb"), "w", encoding="utf-8"))
    rc, out = once('<span lang="ru">чанкование</span>')
    if rc != 0 or "DEBT(seminars/, вне периметра" not in out or "=2 в 1 " not in out:
        fails.append("frozen-debt-counted")
    os.remove(os.path.join(tmp, "seminars", "lab-x.ipynb"))
    rc, out = once('<span lang="ru">чанкование</span>')
    if rc != 0 or "DEBT(seminars/)=0" not in out: fails.append("frozen-debt-selfdestructs")

    shutil.rmtree(tmp, ignore_errors=True)
    for t in ("ban-fires", "canon-silent", "en-untouched", "tt-untouched", "sync-check",
              "why-required", "empty-set", "frozen-debt-counted", "frozen-debt-selfdestructs"):
        print(f"  [{'FAIL' if t in fails else 'OK'}] {t}")
    print("[selftest] FAIL: " + ", ".join(fails) if fails else "[selftest] PASS")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else run(listing="--list" in sys.argv))
