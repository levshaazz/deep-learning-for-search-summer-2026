#!/usr/bin/env python3
"""sync_solved.py — собрать ПРОГОННЫЕ копии семинаров (с решениями вместо заглушек).

Зачем. Студенческая тетрадка содержит `...` в местах заданий: прогнать её целиком нельзя —
первый же assert упадёт. Поэтому прогоняется отдельная копия, где заглушки заменены решениями
(правило «решения в <details> обязаны быть проверены прогоном», seminars/README.md). Копии
живут в gitignored tmp/colab-t4/ — и без этого скрипта разъезжаются с тетрадками: правку прозы
или новую ячейку в seminars/ приходилось переносить руками, а забытый перенос означал прогон
устаревшего кода.

Что делает. Берёт свежую тетрадку из seminars/, а из старой копии — ТОЛЬКО вписанные решения
(тело блоков `# --- твой код … ---` … `# --- конец ---`) и переносит их в новую. Всё остальное —
проза, порядок ячеек, ячейка дампа — приезжает из seminars/, потому что источник истины там.
Выводы прошлого прогона стираются: копия отправляется в Colab чистой.

Блок, которого в старой копии нет (новое задание), остаётся заглушкой — и скрипт говорит об
этом вслух: такой ноутбук упадёт на прогоне, решение надо вписать руками ОДИН раз, после чего
следующий sync его подхватит.

Usage:  python3 scripts/sync_solved.py            (seminars/ → tmp/colab-t4/)
        python3 scripts/sync_solved.py --check    (только отчёт, ничего не пишет)
        python3 scripts/sync_solved.py --selftest
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "seminars")
DST = os.path.join(ROOT, "tmp", "colab-t4")

OPEN_RE = re.compile(r"^[ \t]*#\s*-{2,}\s*тво[йя][^\n]*-{2,}[ \t]*$", re.M)
CLOSE_RE = re.compile(r"^[ \t]*#\s*-{2,}\s*конец\s*-{2,}[ \t]*$", re.M)
STUB_RE = re.compile(r"(^|\n)[ \t]*\S[^\n]*=\s*\.\.\.[ \t]*(#[^\n]*)?(?=\n|$)|(^|\n)[ \t]*\.\.\.[ \t]*(?=\n|$)")
# Второй вид заглушки — текстовое задание: ANSWER = """Впиши ответ сюда: …""". Многоточий в нём
# нет, и первая редакция скрипта его не видела: переносилось 2 решения из 3 в каждом ноутбуке,
# а прогон падал на assert про длину ответа. Ловим по самой формуле приглашения.
STUB_TEXT_RE = re.compile(r"[«\"']?\s*[Вв]пиши\s+(ответ|защиту|разбор|текст)?\s*сюда")


def blocks(src):
    """→ [(начало-тела, конец-тела)] для каждого блока «твой код … конец»."""
    out = []
    for m in OPEN_RE.finditer(src):
        c = CLOSE_RE.search(src, m.end())
        if not c:
            continue
        out.append((m.end(), c.start()))
    return out


def is_stub(body):
    """Заглушка — либо многоточие-плейсхолдер, либо текстовое «Впиши … сюда»."""
    return bool(STUB_RE.search(body) or STUB_TEXT_RE.search(body))


def block_key(src, start):
    """Ключ блока — текст его открывающей строки («# --- твой код: ЗАДАНИЕ 2 ---»).

    Сопоставлять блоки по ПОРЯДКУ нельзя: добавленная выше ячейка сдвигает нумерацию, перенос
    срывается, и решение теряется. Заголовок задания стабилен при любых правках вокруг.
    """
    line_start = src.rfind("\n", 0, start) + 1
    return " ".join(src[line_start:start].split()).lower()


def solved_bodies(solved):
    """Карта «ключ блока → тело» из старой копии. Повторяющиеся ключи различаются порядком."""
    out, seen = {}, {}
    for a, b in blocks(solved):
        k = block_key(solved, a)
        seen[k] = seen.get(k, 0) + 1
        out[(k, seen[k])] = solved[a:b]
    return out


def graft(fresh, solved):
    """Перенести решения из `solved` в блоки `fresh` ПО ЗАГОЛОВКУ. → (новый src, перенесено, заглушек)"""
    bank = solved_bodies(solved)
    out, prev, moved, stubs, seen = [], 0, 0, 0, {}
    for fa, fbnd in blocks(fresh):
        body_f = fresh[fa:fbnd]
        k = block_key(fresh, fa)
        seen[k] = seen.get(k, 0) + 1
        body_s = bank.get((k, seen[k]))
        out.append(fresh[prev:fa])
        if is_stub(body_f) and body_s is not None and not is_stub(body_s):
            out.append(body_s)
            moved += 1
        else:
            out.append(body_f)
            if is_stub(body_f):
                stubs += 1
        prev = fbnd
    out.append(fresh[prev:])
    return "".join(out), moved, stubs


def sync_notebook(fresh_nb, solved_nb):
    """→ (копия-для-прогона, перенесено, осталось-заглушек). Структуру берём из fresh.

    Блоки ищутся по всей старой копии, а не в «той же по счёту» ячейке: раньше добавленная
    ячейка ломала сопоставление, перенос давал ноль, а запись всё равно происходила — и
    вписанные вручную решения стирались заглушками без возможности восстановления
    (tmp/colab-t4 в .gitignore). Теперь ключ — заголовок задания.
    """
    solved_all = "\n".join("".join(c.get("source", []))
                           for c in (solved_nb or {}).get("cells", [])
                           if c.get("cell_type") == "code")
    moved = stubs = 0
    for fc in fresh_nb["cells"]:
        if fc["cell_type"] != "code":
            continue
        src_f = "".join(fc["source"])
        if not blocks(src_f):
            continue
        new_src, m, st = graft(src_f, solved_all)
        moved += m
        stubs += st
        fc["source"] = new_src.splitlines(keepends=True)
    for c in fresh_nb["cells"]:                     # копия уезжает в Colab чистой
        if c["cell_type"] == "code":
            c["outputs"] = []
            c["execution_count"] = None
    return fresh_nb, moved, stubs


def stub_count(nb):
    """Сколько блоков-заглушек в тетрадке (для защиты от записи, стирающей решения)."""
    n = 0
    for c in (nb or {}).get("cells", []):
        if c.get("cell_type") != "code":
            continue
        src = "".join(c.get("source", []))
        n += sum(1 for a, b in blocks(src) if is_stub(src[a:b]))
    return n


def main(argv):
    check = "--check" in argv
    if not os.path.isdir(SRC):
        print("[sync-solved] нет каталога seminars/")
        return 1
    os.makedirs(DST, exist_ok=True)
    total_stubs = 0
    refused = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".ipynb"):
            continue
        fresh = json.load(open(os.path.join(SRC, f), encoding="utf-8"))
        dst_path = os.path.join(DST, f)
        solved = json.load(open(dst_path, encoding="utf-8")) if os.path.exists(dst_path) else None
        had = stub_count(solved) if solved else None
        nb, moved, stubs = sync_notebook(fresh, solved)
        total_stubs += stubs
        mark = "✓" if not stubs else "!"
        tail = " · ЗАГЛУШЕК БЕЗ РЕШЕНИЯ: %d" % stubs if stubs else ""
        print("  %s %-24s решений перенесено %2d%s" % (mark, f[:-6], moved, tail))
        # ЗАЩИТА: не записывать копию, в которой заглушек БОЛЬШЕ, чем было. Такая запись стёрла бы
        # вписанные вручную решения, а tmp/colab-t4 в .gitignore — восстановить их нечем. Ровно это
        # и происходило, когда сопоставление блоков срывалось: перенос 0, а запись всё равно шла.
        if solved is not None and had is not None and stubs > had:
            refused += 1
            print("    ✗ ОТКАЗ ЗАПИСИ: было заглушек %d, стало бы %d — копия с решениями сохранена."
                  % (had, stubs))
            print("      Проверь, совпадают ли заголовки блоков «# --- твой код: … ---» в обоих файлах.")
            continue
        if not check:
            json.dump(nb, open(dst_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            open(dst_path, "a", encoding="utf-8").write("\n")
    where = os.path.relpath(DST, ROOT)
    print("[sync-solved] %s копи%s → %s" % ("проверено" if check else "записано",
                                            "и" if check else "и", where))
    if total_stubs:
        print("            %d заглушек без решения: впиши их в копии ОДИН раз, дальше sync"
              " перенесёт их сам." % total_stubs)
    if refused:
        print("            %d копи(я/и) НЕ перезаписаны — они содержат решения, которых нет в"
              " свежей тетрадке." % refused)
        return 1
    return 0


# ── самопроверка ────────────────────────────────────────────────────────────────────────────
def selftest():
    fails = []

    def check(label, cond):
        if not cond:
            fails.append(label)

    fresh = "# --- твой код: ЗАДАНИЕ 1 ---\nx = ...\n# --- конец ---\nassert x\n"
    solved = "# --- твой код: ЗАДАНИЕ 1 ---\nx = 42\n# --- конец ---\nassert x\n"
    out, moved, stubs = graft(fresh, solved)
    check("решение перенесено", "x = 42" in out and moved == 1 and stubs == 0)
    check("код вне блока не тронут", out.endswith("assert x\n"))

    # проза из fresh побеждает: за пределами блока источник истины — тетрадка
    fresh2 = "print('новая подпись')\n# --- твой код ---\ny = ...\n# --- конец ---\n"
    solved2 = "print('старая подпись')\n# --- твой код ---\ny = 7\n# --- конец ---\n"
    out2, moved2, _ = graft(fresh2, solved2)
    check("проза берётся из свежей тетрадки", "новая подпись" in out2 and "старая" not in out2)
    check("решение всё равно перенесено", "y = 7" in out2 and moved2 == 1)

    # блоки ищутся по ЗАГОЛОВКУ: лишний блок в свежей тетрадке не срывает перенос остальных
    out3, moved3, stubs3 = graft(fresh + fresh.replace("ЗАДАНИЕ 1", "ЗАДАНИЕ 2"), solved)
    check("лишний блок не мешает перенести известный", moved3 == 1 and stubs3 == 1)
    check("неизвестный блок остался заглушкой", "y = ..." not in out3 and out3.count("x = 42") == 1)

    # РЕГРЕСС, из-за которого терялись решения: ячейка, добавленная ВЫШЕ блока, сдвигала
    # сопоставление по порядку, перенос давал ноль, а запись всё равно шла поверх копии.
    fresh_shift = "import numpy\n" + fresh
    out5, moved5, _ = graft(fresh_shift, solved)
    check("сдвиг ячейкой выше не ломает перенос", moved5 == 1 and "x = 42" in out5)
    check("добавленный код свежей тетрадки сохранён", "import numpy" in out5)

    # уже решённый блок не затирается старым решением
    out4, moved4, _ = graft(solved.replace("42", "43"), solved)
    check("готовое решение не перезаписано", "43" in out4 and moved4 == 0)

    # заглушка-многоточие в одиночной строке
    check("голое ... — заглушка", is_stub("\n    ...\n"))
    check("обычный код — не заглушка", not is_stub("\n    z = 1\n"))
    check("текстовое задание — заглушка", is_stub('ANSWER = """\nВпиши ответ сюда: минимум 80 слов.\n"""'))
    check("написанный ответ — не заглушка", not is_stub('ANSWER = """\nДва способа: раз и два.\n"""'))

    # выводы стираются
    nb = {"cells": [{"cell_type": "code", "source": ["x = ...\n"],
                     "outputs": [{"output_type": "stream", "text": ["мусор"]}], "execution_count": 3}]}
    nb2, _, _ = sync_notebook(json.loads(json.dumps(nb)), None)
    check("выводы копии очищены", nb2["cells"][0]["outputs"] == []
          and nb2["cells"][0]["execution_count"] is None)

    for f in fails:
        print("  ✗ %s" % f)
    print("[sync-solved --selftest] проверок 14, провалов %d" % len(fails))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main(sys.argv))
