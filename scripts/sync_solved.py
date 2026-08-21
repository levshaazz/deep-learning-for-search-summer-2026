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


def graft(fresh, solved):
    """Перенести решения из `solved` в одноимённые блоки `fresh`. → (новый src, перенесено, осталось-заглушек)"""
    fb, sb = blocks(fresh), blocks(solved)
    if len(fb) != len(sb):
        # Блоки не сопоставимы один-к-одному — переносить наугад нельзя: решение уехало бы
        # в чужое задание. Возвращаем как есть и считаем все заглушки нерешёнными.
        return fresh, 0, sum(1 for a, b in fb if is_stub(fresh[a:b]))
    out, prev, moved, stubs = [], 0, 0, 0
    for (fa, fbnd), (sa, sbnd) in zip(fb, sb):
        body_f, body_s = fresh[fa:fbnd], solved[sa:sbnd]
        out.append(fresh[prev:fa])
        if is_stub(body_f) and not is_stub(body_s):
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
    """→ (копия-для-прогона, перенесено, осталось-заглушек). Структуру берём из fresh."""
    solved_cells = (solved_nb or {}).get("cells", [])
    moved = stubs = 0
    # сопоставляем кодовые ячейки по порядку — тетрадки различаются только телом заданий
    fresh_code = [c for c in fresh_nb["cells"] if c["cell_type"] == "code"]
    solved_code = [c for c in solved_cells if c.get("cell_type") == "code"]
    pairs = zip(fresh_code, solved_code) if len(fresh_code) == len(solved_code) else []
    for fc, sc in pairs:
        src_f, src_s = "".join(fc["source"]), "".join(sc.get("source", []))
        if not blocks(src_f):
            continue
        new_src, m, st = graft(src_f, src_s)
        moved += m
        stubs += st
        fc["source"] = new_src.splitlines(keepends=True)
    if not pairs:
        stubs = sum(1 for c in fresh_code for a, b in blocks("".join(c["source"]))
                    if is_stub("".join(c["source"])[a:b]))
    for c in fresh_nb["cells"]:                     # копия уезжает в Colab чистой
        if c["cell_type"] == "code":
            c["outputs"] = []
            c["execution_count"] = None
    return fresh_nb, moved, stubs


def main(argv):
    check = "--check" in argv
    if not os.path.isdir(SRC):
        print("[sync-solved] нет каталога seminars/")
        return 1
    os.makedirs(DST, exist_ok=True)
    total_stubs = 0
    for f in sorted(os.listdir(SRC)):
        if not f.endswith(".ipynb"):
            continue
        fresh = json.load(open(os.path.join(SRC, f), encoding="utf-8"))
        dst_path = os.path.join(DST, f)
        solved = json.load(open(dst_path, encoding="utf-8")) if os.path.exists(dst_path) else None
        nb, moved, stubs = sync_notebook(fresh, solved)
        total_stubs += stubs
        mark = "✓" if not stubs else "!"
        tail = " · ЗАГЛУШЕК БЕЗ РЕШЕНИЯ: %d" % stubs if stubs else ""
        print("  %s %-24s решений перенесено %2d%s" % (mark, f[:-6], moved, tail))
        if not check:
            json.dump(nb, open(dst_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            open(dst_path, "a", encoding="utf-8").write("\n")
    where = os.path.relpath(DST, ROOT)
    print("[sync-solved] %s копи%s → %s" % ("проверено" if check else "записано",
                                            "и" if check else "и", where))
    if total_stubs:
        print("            %d заглушек без решения: впиши их в копии ОДИН раз, дальше sync"
              " перенесёт их сам." % total_stubs)
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

    # разное число блоков → не переносим наугад
    out3, moved3, stubs3 = graft(fresh + fresh, solved)
    check("несопоставимые блоки не переносятся", moved3 == 0 and stubs3 == 2)

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
    print("[sync-solved --selftest] проверок 11, провалов %d" % len(fails))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main(sys.argv))
