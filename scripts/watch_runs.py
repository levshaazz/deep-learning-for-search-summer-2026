#!/usr/bin/env python3
"""watch_runs.py — наблюдатель за прогонами семинаров: сохранил тетрадку → дамп в репозитории.

Зачем. Порядок «прогнать в Colab → вернуть .ipynb → extract_runs → check_notebooks» состоял
из трёх ручных шагов, и забытый второй означал, что G29 сверяет прозу со СТАРЫМИ числами и
молчит. Наблюдатель убирает всё, кроме прогона: он следит за тетрадками, вынимает дамп из
вывода, кладёт его в seminars/runs/ (CPU) или seminars/runs-t4/ (ускоритель) и сразу прогоняет
G29, печатая, что стало с долгом.

Где ищет (по умолчанию — все три, каких нет, те молча пропускаются):
  · seminars/            — если ядро локальное и тетрадка правится прямо в репозитории;
  · tmp/colab-t4/        — если прогонная копия возвращается сюда;
  · ~/Downloads          — если тетрадка скачана из браузерного Colab (имя вида «lab-bm25 (1)»
                           тоже подходит, довесок снимается).
Каталог можно задать явно: `python3 scripts/watch_runs.py ~/Desktop`.

Опрос по mtime, без сторонних зависимостей (H5). Выход — Ctrl-C.

Usage:  python3 scripts/watch_runs.py [каталог …] [--interval СЕК] [--once]
        npm run runs:watch
"""
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract_runs import extract, notebooks  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM = os.path.join(ROOT, "seminars")
G29 = os.path.join(ROOT, "_research", "check_notebooks.py")
DEFAULT_DIRS = [SEM,
                os.path.join(ROOT, "tmp", "colab-t4"),
                os.path.expanduser("~/Downloads")]
NAMES = None            # какие имена нас интересуют в ~/Downloads — заполняется на старте


def watched(dirs):
    """Список .ipynb во всех каталогах. В ~/Downloads берём только имена наших семинаров."""
    out = []
    for d in dirs:
        if not os.path.isdir(d):
            continue
        home_dl = os.path.realpath(d) == os.path.realpath(os.path.expanduser("~/Downloads"))
        for p in notebooks([d]):
            if home_dl and NAMES is not None:
                from extract_runs import clean_name
                if clean_name(os.path.basename(p)[:-6]) not in NAMES:
                    continue
            out.append(p)
    return out


def stamp(paths):
    """Отпечаток состояния: путь → (mtime, размер). Размер ловит правку в ту же секунду."""
    st = {}
    for p in paths:
        try:
            s = os.stat(p)
            st[p] = (s.st_mtime, s.st_size)
        except OSError:
            pass
    return st


def run_gate():
    """Прогнать G29 и вернуть его последнюю содержательную строку (итог гейта)."""
    try:
        r = subprocess.run([sys.executable, G29], capture_output=True, text=True, timeout=600)
    except Exception as e:                                   # noqa: BLE001
        return "G29 не запустился (%s)" % e
    lines = [x for x in (r.stdout or "").strip().splitlines() if x.strip()]
    tail = lines[-1] if lines else "(G29 промолчал)"
    return tail


def tick(dirs, verbose=False):
    """Один проход: вынуть дампы, при записи — прогнать гейт. → сколько записано."""
    written, _, _ = extract(dirs, quiet=not verbose)
    if written:
        print("[watch-runs] дампов обновлено: %d — запускаю G29…" % written)
        print("             " + run_gate())
    return written


def main(argv):
    global NAMES
    args = [a for a in argv[1:] if not a.startswith("--")]
    interval = 1.5
    if "--interval" in argv:
        try:
            interval = float(argv[argv.index("--interval") + 1])
        except (IndexError, ValueError):
            pass
    dirs = args or [d for d in DEFAULT_DIRS if os.path.isdir(d)]
    NAMES = {f[:-6] for f in os.listdir(SEM) if f.endswith(".ipynb")} if os.path.isdir(SEM) else set()
    if not dirs:
        print("[watch-runs] нечего наблюдать")
        return 1

    print("[watch-runs] смотрю за:")
    for d in dirs:
        print("             · %s" % (os.path.relpath(d, ROOT) if d.startswith(ROOT) else d))
    print("[watch-runs] прогоняй тетрадки как обычно; дампы лягут в seminars/runs{,-t4}/ сами.")
    tick(dirs, verbose=True)                                  # стартовый разбор того, что уже лежит
    if "--once" in argv:
        return 0

    prev = stamp(watched(dirs))
    print("[watch-runs] жду изменений (Ctrl-C — выход)")
    try:
        while True:
            time.sleep(interval)
            now = stamp(watched(dirs))
            changed = [p for p, v in now.items() if prev.get(p) != v]
            if changed:
                # Тетрадку могут дописывать в этот самый момент — даём ей осесть, иначе
                # прочитаем половину JSON и запишем «битый дамп» на ровном месте.
                time.sleep(0.6)
                for p in changed:
                    print("[watch-runs] изменилось: %s" % os.path.basename(p))
                tick(changed, verbose=True)
                prev = stamp(watched(dirs))
    except KeyboardInterrupt:
        print("\n[watch-runs] остановлен")
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
