#!/usr/bin/env python3
"""extract_runs.py — достать дампы прогонов из .ipynb и разложить по каталогам.

Зачем. Ноутбук пишет дамп в `runs/<имя>.json` внутри песочницы Colab — и там он и остаётся:
обратно приезжают только сами .ipynb. Из-за этого первый T4-прогон (19.08.2026) прошёл начисто,
а долг G29 в 79 чисел закрыть было нечем. Ячейка дампа ПЕЧАТАЕТ его между маркерами
<<<DLS-RUN-DUMP … DLS-RUN-DUMP>>>, вывод сохраняется прямо в тетрадке, и этот скрипт его вынимает.

Куда кладём — решает САМ ДАМП, а не аргумент командной строки: если в `runtime.gpu` что-то
есть, это прогон на ускорителе (T4 владельца) и он ложится в `seminars/runs-t4/`; если gpu
пустой — это CPU-прогон и он ложится в `seminars/runs/`. Так задуман кросс-рантайм-шаг [T4]
в check_notebooks: он сверяет качество между двумя прогонами СТРОГО, а тайминги — с допуском.
Маршрутизация по значению из самого дампа означает, что T4-прогон физически не может затереть
базовый CPU-дамп, даже если запустить скрипт не глядя.

Порядок работы после прогона:
    python3 scripts/extract_runs.py          # ищет .ipynb в seminars/ и tmp/colab-t4/
    python3 _research/check_notebooks.py     # G29 против свежих чисел
Или одной командой: `npm run runs`. Наблюдатель `npm run runs:watch` делает то же самое сам,
как только тетрадка сохранена.

Скрипт НИЧЕГО не выдумывает: если маркеров нет, он так и говорит и файл не трогает.

Usage:  python3 scripts/extract_runs.py [каталог|.ipynb …]
        python3 scripts/extract_runs.py --quiet     (молчит, когда всё уже на месте)
        python3 scripts/extract_runs.py --selftest
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM = os.path.join(ROOT, "seminars")
RUNS_CPU = os.path.join(SEM, "runs")
RUNS_GPU = os.path.join(SEM, "runs-t4")
DEFAULT_SRC = [SEM, os.path.join(ROOT, "tmp", "colab-t4")]
OPEN, CLOSE = "<<<DLS-RUN-DUMP", "DLS-RUN-DUMP>>>"


def dump_from(nb_path):
    """→ (payload, причина-если-нет). Читает ТОЛЬКО вывод ячеек, не исходник."""
    try:
        nb = json.load(open(nb_path, encoding="utf-8"))
    except (ValueError, OSError) as e:
        return None, "не читается (%s)" % type(e).__name__
    for cell in nb.get("cells", []):
        for out in cell.get("outputs", []):
            if out.get("output_type") != "stream":
                continue
            text = "".join(out.get("text", []))
            if OPEN not in text or CLOSE not in text:
                continue
            body = text.split(OPEN, 1)[1].split(CLOSE, 1)[0].strip()
            try:
                return json.loads(body), None
            except ValueError as e:
                return None, "маркеры есть, но JSON битый (%s)" % e
    return None, "маркеров нет — ноутбук прогнан старой версией либо ячейка дампа не выполнялась"


# Скачанная из Colab тетрадка часто приезжает с довеском в имени: «lab-bm25 (1).ipynb»,
# «Copy of lab-bm25.ipynb», «Копия lab-bm25.ipynb». Довесок снимаем — иначе имя файла не
# совпадёт с подписью внутри дампа и честный прогон был бы отвергнут как перепутанный файл.
DECOR_RE = re.compile(r"^(?:copy of |копия )?(.*?)(?:\s*\(\d+\)|\s*копия|\s*-\s*copy)?$", re.I)


def clean_name(stem):
    m = DECOR_RE.match(stem.strip())
    return (m.group(1) if m else stem).strip()


def target_dir(payload):
    """Каталог для дампа: ускоритель → runs-t4, иначе → runs. Решает сам дамп."""
    gpu = (payload.get("runtime") or {}).get("gpu")
    return RUNS_GPU if gpu else RUNS_CPU


def serialize(payload):
    return json.dumps(payload, ensure_ascii=False, indent=1, sort_keys=True)


def notebooks(paths):
    """Разворачивает аргументы (каталоги и файлы) в список .ipynb без дублей."""
    out = []
    for p in paths:
        if os.path.isdir(p):
            out += [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.endswith(".ipynb")]
        elif p.endswith(".ipynb") and os.path.isfile(p):
            out.append(p)
    seen, uniq = set(), []
    for p in out:
        rp = os.path.realpath(p)
        if rp not in seen:
            seen.add(rp)
            uniq.append(p)
    return uniq


def extract(paths, quiet=False, log=print):
    """→ (записано, без изменений, пропущено). Идемпотентно: тот же дамп не переписывается."""
    written = unchanged = skipped = 0
    for nb_path in notebooks(paths):
        name = clean_name(os.path.basename(nb_path)[:-6])
        payload, why = dump_from(nb_path)
        if payload is None:
            if not quiet:
                log("  · %s: %s" % (name, why))
            skipped += 1
            continue
        got = payload.get("notebook")
        if got != name:
            # Тетрадку переименовали или перепутали файлы — записать значило бы подписать
            # чужие числа именем этого ноутбука, а G29 сверяет прозу именно по имени.
            log("  ✗ %s: дамп подписан как «%s» — не записываю" % (name, got))
            skipped += 1
            continue
        out_dir = target_dir(payload)
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, name + ".json")
        body = serialize(payload)
        old = open(path, encoding="utf-8").read() if os.path.exists(path) else None
        where = os.path.relpath(out_dir, ROOT)
        if old == body:
            if not quiet:
                log("  = %s: без изменений (%s)" % (name, where))
            unchanged += 1
            continue
        open(path, "w", encoding="utf-8").write(body)
        gpu = (payload.get("runtime") or {}).get("gpu") or "CPU"
        log("  ✓ %s → %s · величин %d · рантайм %s"
            % (name, where, len(payload.get("metrics") or {}), gpu))
        written += 1
    return written, unchanged, skipped


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    quiet = "--quiet" in argv
    src = args or [p for p in DEFAULT_SRC if os.path.isdir(p)]
    if not src:
        print("[extract-runs] нечего смотреть: нет ни seminars/, ни tmp/colab-t4/")
        return 1
    written, unchanged, skipped = extract(src, quiet=quiet)
    if quiet and not written:
        return 0
    print("[extract-runs] записано %d, без изменений %d, без дампа %d" % (written, unchanged, skipped))
    if skipped and not written:
        print("            подсказка: дамп берётся из ВЫВОДА последней ячейки — тетрадку надо")
        print("            прогнать до конца и сохранить, иначе выводу неоткуда взяться.")
    return 0


# ── самопроверка ────────────────────────────────────────────────────────────────────────────
def selftest():
    import shutil
    import tempfile
    global RUNS_CPU, RUNS_GPU, ROOT
    tmp = tempfile.mkdtemp(prefix="extract_runs_selftest_")
    keep = (RUNS_CPU, RUNS_GPU, ROOT)
    RUNS_CPU = os.path.join(tmp, "runs")
    RUNS_GPU = os.path.join(tmp, "runs-t4")
    ROOT = tmp
    fails = []

    def nb_with(text, name="nb.ipynb"):
        p = os.path.join(tmp, name)
        json.dump({"cells": [{"cell_type": "code", "source": [], "outputs":
                              [{"output_type": "stream", "text": [text]}]}]},
                  open(p, "w", encoding="utf-8"))
        return p

    def payload(nbname="nb", gpu=None, metrics=None):
        return {"notebook": nbname, "runtime": {"gpu": gpu}, "metrics": metrics or {"a": 1}}

    def marked(pl):
        return "шум\n%s\n%s\n%s\nхвост\n" % (OPEN, json.dumps(pl, ensure_ascii=False), CLOSE)

    def check(label, cond):
        if not cond:
            fails.append(label)

    logged = []
    # 1. CPU-дамп ложится в runs/
    w, u, s = extract([nb_with(marked(payload(gpu=None)))], log=logged.append)
    check("CPU-дамп записан в runs/", w == 1 and os.path.exists(os.path.join(RUNS_CPU, "nb.json")))
    check("CPU-дамп не попал в runs-t4/", not os.path.exists(os.path.join(RUNS_GPU, "nb.json")))
    # 2. повторный запуск идемпотентен
    w, u, s = extract([os.path.join(tmp, "nb.ipynb")], log=logged.append)
    check("повтор ничего не переписывает", w == 0 and u == 1)
    # 3. GPU-дамп ложится в runs-t4/ и НЕ затирает CPU-дамп
    before = open(os.path.join(RUNS_CPU, "nb.json"), encoding="utf-8").read()
    extract([nb_with(marked(payload(nbname="nb-gpu", gpu="Tesla T4", metrics={"a": 2})),
                     name="nb-gpu.ipynb")], log=logged.append)
    check("GPU-дамп записан в runs-t4/", os.path.exists(os.path.join(RUNS_GPU, "nb-gpu.json")))
    check("GPU-дамп не тронул runs/",
          open(os.path.join(RUNS_CPU, "nb.json"), encoding="utf-8").read() == before)
    # 4. чужая подпись не пишется
    w, u, s = extract([nb_with(marked(payload(nbname="другой")), name="nb2.ipynb")], log=logged.append)
    check("перепутанный файл пропущен", w == 0 and s == 1)
    check("перепутанный файл не создал nb2.json",
          not os.path.exists(os.path.join(RUNS_CPU, "nb2.json")))
    # 5. нет маркеров — не падаем и не пишем
    w, u, s = extract([nb_with("обычный вывод без маркеров", name="nb3.ipynb")], log=logged.append)
    check("без маркеров — пропуск", w == 0 and s == 1)
    # 6. битый JSON внутри маркеров
    _, why = dump_from(nb_with("%s\n{не json}\n%s\n" % (OPEN, CLOSE), name="nb4.ipynb"))
    check("битый JSON назван битым", bool(why) and "битый" in why)
    # 7. скачанная копия «nb (1).ipynb» — тот же ноутбук, а не перепутанный файл
    w, u, s = extract([nb_with(marked(payload(gpu=None, metrics={"a": 9})), name="nb (1).ipynb")],
                      log=logged.append)
    check("«nb (1).ipynb» распознан как nb", w == 1)
    check("довесок в имени не создал лишний файл", sorted(os.listdir(RUNS_CPU)) == ["nb.json"])

    RUNS_CPU, RUNS_GPU, ROOT = keep
    shutil.rmtree(tmp, ignore_errors=True)
    for f in fails:
        print("  ✗ %s" % f)
    print("[extract-runs --selftest] проверок 10, провалов %d" % len(fails))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main(sys.argv))
