#!/usr/bin/env python3
"""extract_runs.py — достать дампы прогонов из .ipynb и положить в seminars/runs/.

Зачем. Ноутбук пишет дамп в `runs/<имя>.json` внутри песочницы Colab — и там он и остаётся:
обратно приезжают только сами .ipynb. Из-за этого первый T4-прогон (19.08.2026) прошёл начисто,
а долг G29 в 79 чисел закрыть было нечем. Теперь ячейка дампа ПЕЧАТАЕТ его между маркерами
<<<DLS-RUN-DUMP … DLS-RUN-DUMP>>>, вывод сохраняется прямо в тетрадке, и этот скрипт его вынимает.

Порядок работы после прогона:
    1. вернуть прогнанные .ipynb в tmp/colab-t4/ (или куда угодно, путь передаётся аргументом);
    2. python3 scripts/extract_runs.py [каталог]        (по умолчанию tmp/colab-t4)
    3. python3 _research/check_notebooks.py             — G29 против свежих чисел.

Скрипт НИЧЕГО не выдумывает: если маркеров нет, он так и говорит и файл не трогает.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "seminars", "runs")
OPEN, CLOSE = "<<<DLS-RUN-DUMP", "DLS-RUN-DUMP>>>"


def dump_from(nb_path):
    """→ (payload, причина-если-нет). Читает ТОЛЬКО вывод ячеек, не исходник."""
    try:
        nb = json.load(open(nb_path, encoding="utf-8"))
    except (ValueError, OSError) as e:
        return None, f"не читается ({type(e).__name__})"
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
                return None, f"маркеры есть, но JSON битый ({e})"
    return None, "маркеров нет — ноутбук прогнан старой версией либо ячейка дампа не выполнялась"


def main(argv):
    src = argv[1] if len(argv) > 1 else os.path.join(ROOT, "tmp", "colab-t4")
    if not os.path.isdir(src):
        print(f"[extract-runs] нет каталога {src}")
        return 1
    os.makedirs(OUT, exist_ok=True)
    written, skipped = 0, 0
    for f in sorted(os.listdir(src)):
        if not f.endswith(".ipynb"):
            continue
        name = f[:-6]
        payload, why = dump_from(os.path.join(src, f))
        if payload is None:
            print(f"  ✗ {name}: {why}")
            skipped += 1
            continue
        got = payload.get("notebook")
        if got != name:
            print(f"  ✗ {name}: дамп подписан как «{got}» — перепутанные файлы, не записываю")
            skipped += 1
            continue
        path = os.path.join(OUT, name + ".json")
        json.dump(payload, open(path, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1, sort_keys=True)
        gpu = (payload.get("runtime") or {}).get("gpu") or "CPU"
        print(f"  ✓ {name}: величин {len(payload.get('metrics') or {})} · рантайм {gpu}")
        written += 1
    print(f"[extract-runs] записано {written}, пропущено {skipped} → seminars/runs/")
    return 1 if written == 0 else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
