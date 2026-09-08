#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pptx_package — собрать ПАКЕТ ДЛЯ ДИЗАЙНЕРА одной командой.

Зачем инструмент вместо инструкции. Пакет состоит из пяти разнородных кусков, лежащих в
пяти разных местах репозитория, и собирался руками. Класс ошибок отсюда предсказуем и
дорог: забыли шрифты — дизайнер верстает по подставленным системным метрикам и переделывает
всё; отдали болванку от прошлой правки контракта — он именует плейсхолдеры по устаревшему
списку, и заливка молча даёт пустые рамки. Обе ошибки обнаруживаются НЕ у нас, а через
неделю у него.

Что кладётся в пакет и зачем именно это:
  1. brief.md              — что делать (16 семейств, имена плейсхолдеров, договор о слотах темы);
  2. _fixture.pptx         — болванка для сверки ИМЁН; пересобирается здесь же, чтобы не
                             разъехаться с контрактом;
  3. fonts/                — гарнитуры курса (SIL OFL): без них метрики чужие;
  4. <дек>/ref/            — рендер каждого слайда таким, каким его видит студент: эталон,
                             с которым сверяются, а не pptx;
  5. <дек>/<дек>-filled.pptx — та же дека, налитая в болванку: видно, КАКОЙ контент приедет
                             в макет и в каком объёме.

Дек можно передать несколько. Пункты 1–3 при этом кладутся ОДИН раз на весь пакет: три
копии одного брифа означают три версии правды, как только его правят.

Проверка перед выдачей (шаг --check делает её всегда): пакет собирается только если
выгрузка деки СВЕЖАЯ. Устаревшая выгрузка — самая дорогая ошибка этого процесса: она не
видна ни по одному признаку, кроме даты, а дизайнер работает по ней неделю.

Usage:
    _research/.venv-pptx/bin/python scripts/pptx_package.py <дек> [<дек> …] [--out DIR]
    _research/.venv-pptx/bin/python scripts/pptx_package.py --selftest
"""
import argparse
import os
import shutil
import subprocess
import sys
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT = os.path.join(ROOT, "_internal", "pptx-export")
FONTS = os.path.join(ROOT, "Lectures", "vendor", "fonts")
BRIEF = os.path.join(ROOT, "release", "design-brief.md")
LICENSES = os.path.join(ROOT, "Lectures", "vendor", "LICENSES.md")
PY = sys.executable


# Пять семейств курса, все под SIL OFL и все есть на Google Fonts. Роли — из брифа §4.
FONT_FAMILIES = [
    ("IBM Plex Sans", "заголовки и текст"),
    ("Newsreader", "акцидентный серифный"),
    ("JetBrains Mono", "моноширинный: код и числа"),
    ("Pangolin", "рукописный, кириллица"),
    ("Patrick Hand", "рукописный, латиница"),
]

FONT_NOTE = """# Шрифты курса

Все пять — под лицензией SIL Open Font License, текст лицензий в `LICENSES.md` рядом.

| гарнитура | роль в курсе |
|---|---|
""" + "\n".join(f"| **{n}** | {r} |" for n, r in FONT_FAMILIES) + """

## Что здесь лежит и чего здесь НЕТ

Файлы `.woff2` в этой папке — веб-копии, которыми курс подключает шрифты на сайте и в деках.
**Установить их в систему нельзя**: ни macOS, ни Windows формат woff2 не принимают, а имена у
них хэшированные — это выгрузка Google Fonts, не дистрибутив.

Чтобы PowerPoint верстал нашими метриками, поставь начертания из источника:
<https://fonts.google.com> — там все пять по названию из таблицы выше, кнопка «Get font».

Почему это важно, а не формальность: если гарнитуры нет в системе, PowerPoint молча подставит
свою. Строки лягут по чужим метрикам, ты подгонишь макет под них, а в курсе он поедет — там
шрифты настоящие.
"""

def newest(path):
    """Время последней правки дерева. Нужна не точность, а порядок: свежее или нет."""
    best = 0
    if os.path.isfile(path):
        return os.path.getmtime(path)
    for dirpath, _dirs, files in os.walk(path):
        for f in files:
            best = max(best, os.path.getmtime(os.path.join(dirpath, f)))
    return best


def staleness(deck):
    """Выгрузка старше исходников деки? Возвращает (устарела, на сколько часов).

    Сравниваем с фрагментами деки, а не со сборкой: правят именно фрагменты, а собранный
    Lectures/NN-*.html — артефакт, который мог не пересобираться вовсе.
    """
    man = os.path.join(EXPORT, deck, "manifest.json")
    parts = os.path.join(ROOT, "Lectures", deck, "parts")
    if not os.path.exists(man):
        return True, None
    if not os.path.isdir(parts):
        return False, None
    lag = newest(parts) - os.path.getmtime(man)
    return lag > 0, round(lag / 3600, 1)


def build(decks, out_dir, skip_fill=False):
    problems = []
    # Свежесть проверяется ДО того, как что-либо собрано, и сразу по ВСЕМ декам: собрать
    # пакет наполовину и отказать на третьей деке — значит отдать полупакет, который
    # выглядит целым.
    for deck in decks:
        stale, hours = staleness(deck)
        if stale and hours is None:
            print(f"[package] нет выгрузки деки {deck} — сначала:\n"
                  f"          node scripts/export-pptx-extract.mjs {deck}.html")
            return 2
        if stale:
            print(f"[package] ОТКАЗ: выгрузка деки {deck} старше её исходников на {hours} ч.\n"
                  f"          Дизайнер получил бы слайды, которых уже нет. Пересними:\n"
                  f"          node scripts/export-pptx-extract.mjs {deck}.html")
            return 2

    os.makedirs(out_dir, exist_ok=True)

    # 1 — бриф
    shutil.copy2(BRIEF, os.path.join(out_dir, "brief.md"))

    # 2 — болванка: собирается ЗДЕСЬ, а не берётся готовой. Готовая могла остаться от
    # прошлой редакции контракта, и имена в ней разошлись бы с тем, что ждёт наливальщик.
    fixture = os.path.join(out_dir, "_fixture.pptx")
    r = subprocess.run([PY, os.path.join(ROOT, "scripts", "pptx_fixture.py"),
                        "--out", fixture], capture_output=True, text=True)
    if r.returncode != 0:
        print("[package] болванка не собралась:\n" + (r.stderr or r.stdout))
        return 1

    # 3 — ШРИФТЫ. Тонкость, из-за которой инструкция «поставь шрифты» была невыполнима:
    # в репозитории лежат только .woff2 с хэш-именами от Google Fonts — веб-копии, которые
    # курс подключает через @font-face. В систему woff2 не ставится ни на macOS, ни на
    # Windows, а именно установка нужна, чтобы PowerPoint верстал НАШИМИ метриками. Поэтому
    # кладём веб-копии как есть (пусть будут), лицензии рядом (условие OFL), и главное —
    # список семейств со ссылками на источник, откуда берутся устанавливаемые начертания.
    fonts_out = os.path.join(out_dir, "fonts")
    if os.path.isdir(FONTS):
        shutil.rmtree(fonts_out, ignore_errors=True)
        shutil.copytree(FONTS, fonts_out)
        if os.path.exists(LICENSES):
            shutil.copy2(LICENSES, os.path.join(fonts_out, "LICENSES.md"))
        with open(os.path.join(fonts_out, "ПРОЧТИ.md"), "w", encoding="utf-8") as fh:
            fh.write(FONT_NOTE)
    else:
        problems.append(f"нет каталога шрифтов {os.path.relpath(FONTS, ROOT)}")

    # 4–5 — по деке: эталонные рендеры и налитый файл, каждая в своей подпапке.
    # Бриф, болванка и шрифты выше — ОБЩИЕ на весь пакет: три копии одного брифа
    # означают три версии правды, как только его правят.
    total_ref = 0
    for deck in decks:
        sub = os.path.join(out_dir, deck)
        os.makedirs(sub, exist_ok=True)
        ref_src = os.path.join(EXPORT, deck, "ref")
        ref_out = os.path.join(sub, "ref")
        if os.path.isdir(ref_src):
            shutil.rmtree(ref_out, ignore_errors=True)
            shutil.copytree(ref_src, ref_out)
            total_ref += len(os.listdir(ref_out))
        else:
            problems.append(f"{deck}: нет эталонных рендеров ref/ — не с чем сверяться")
        if skip_fill:
            continue
        filled = os.path.join(sub, f"{deck}-filled.pptx")
        r = subprocess.run([PY, os.path.join(ROOT, "scripts", "fill_pptx.py"), deck,
                            "--template", fixture, "--out", filled],
                           capture_output=True, text=True)
        print((r.stdout or "").rstrip())
        if r.returncode != 0:
            print(f"[package] заливка {deck} не прошла:\n" + (r.stderr or ""))
            return 1

    n_font = len([f for f in os.listdir(fonts_out)
                  if f.lower().endswith(".woff2")]) if os.path.isdir(fonts_out) else 0
    print(f"\n[package] пакет: {os.path.relpath(out_dir, ROOT)}")
    print(f"[package]   общее: brief.md · _fixture.pptx · веб-шрифтов {n_font} (+памятка)")
    print(f"[package]   дек: {len(decks)} · эталонных рендеров всего {total_ref}")
    for p in problems:
        print(f"  ! {p}")
    return 1 if problems else 0


def selftest():
    fails = []

    def check(label, cond):
        if not cond:
            fails.append(label)
        print(("  [OK] " if cond else "  x    ") + label)

    check("бриф на месте", os.path.exists(BRIEF))
    check("каталог шрифтов на месте", os.path.isdir(FONTS))
    check("лицензии шрифтов рядом", os.path.exists(LICENSES))
    check("памятка о шрифтах называет все пять семейств",
          all(n in FONT_NOTE for n, _ in FONT_FAMILIES))
    check("памятка честно говорит, что woff2 не ставится",
          "Установить их в систему нельзя" in FONT_NOTE)
    stale, hours = staleness("нет-такой-деки")
    check("отсутствие выгрузки распознаётся как «нечего паковать»",
          stale is True and hours is None)
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        f = os.path.join(td, "a.txt")
        open(f, "w").write("x")
        check("свежесть дерева читается", newest(td) >= os.path.getmtime(f) - 1)
    if fails:
        print(f"[package] selftest FAIL — {len(fails)}")
        return 1
    print("[package] selftest PASS")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck", nargs="*", help="одна или несколько дек")
    ap.add_argument("--out")
    ap.add_argument("--skip-fill", action="store_true",
                    help="без заливки деки (быстрая пересборка брифа и болванки)")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.deck:
        ap.error("укажи деку (или несколько) либо --selftest")
    out = a.out or os.path.join(EXPORT, "_package",
                                a.deck[0] if len(a.deck) == 1 else "decks")
    return build(a.deck, out, a.skip_fill)


if __name__ == "__main__":
    sys.exit(main())
