#!/usr/bin/env python3
"""import_runs.py — принять архивы прогонов семинаров и разложить по репозиторию.

Как приезжает прогон. Последняя ячейка каждого семинара складывает в каталог прогона две
вещи — `<имя>.json` (все числовые результаты + конфигурация рантайма) и `run_log.txt`
(журнал печатей, снятый Tee с самого начала занятия), — жмёт это в zip и показывает
кликабельную ссылку `data:`. Жмёшь ссылку — архив падает в загрузки браузера. Этот скрипт
забирает его оттуда.

Почему архив, а не файл в песочнице: каталог прогона живёт на машине Colab и умирает вместе
с ней; вывод ячейки — единственное, что доезжает обратно, и ссылка внутри него доезжает тоже.
Журнал в архиве важен не меньше чисел: тетрадка, сохранённая без выходов, теряет всю
диагностику, и разбирать потом нечего.

Куда кладём — решает САМ ДАМП: если в `runtime.gpu` что-то есть, это прогон на ускорителе и
он ложится в `seminars/runs-t4/`; если пусто — CPU-прогон, `seminars/runs/`. Так задуман
кросс-рантайм-шаг [T4] в check_notebooks (качество строго, тайминги с допуском), и T4-прогон
физически не может затереть базовый CPU-дамп, с которым его же и сравнивают. Журналы всегда
ложатся в `seminars/runs/logs/<имя>.log` — они диагностика, а не числа.

Usage:  python3 scripts/import_runs.py                 (берёт архивы из ~/Downloads)
        python3 scripts/import_runs.py ПУТЬ [ПУТЬ …]   (каталог или конкретный .zip)
        python3 scripts/import_runs.py --gate          (после разбора прогнать G29)
        python3 scripts/import_runs.py --selftest
"""
import json
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM = os.path.join(ROOT, "seminars")
RUNS_CPU = os.path.join(SEM, "runs")
RUNS_GPU = os.path.join(SEM, "runs-t4")
LOGS = os.path.join(RUNS_CPU, "logs")
DEFAULT_SRC = [os.path.expanduser("~/Downloads")]
LOG_NAME = "run_log.txt"


def known_notebooks():
    if not os.path.isdir(SEM):
        return set()
    return {f[:-6] for f in os.listdir(SEM) if f.endswith(".ipynb")}


# Скачанный браузером архив приезжает с довеском: «lab-bm25 (1).zip», «lab-bm25-2.zip».
DECOR_RE = re.compile(r"^(.*?)(?:\s*\(\d+\)|-\d+)?$")


def clean_name(stem):
    m = DECOR_RE.match(stem.strip())
    return (m.group(1) if m else stem).strip()


def read_archive(path):
    """→ (payload, журнал|None, причина-если-нет). Читает только то, что положила тетрадка."""
    try:
        with zipfile.ZipFile(path) as z:
            names = z.namelist()
            jsons = [n for n in names if n.endswith(".json") and "/" not in n]
            if not jsons:
                return None, None, "в архиве нет дампа <имя>.json — это не прогон семинара"
            try:
                payload = json.loads(z.read(jsons[0]).decode("utf-8"))
            except ValueError as e:
                return None, None, "дамп в архиве битый (%s)" % e
            log = None
            if LOG_NAME in names:
                log = z.read(LOG_NAME).decode("utf-8", "replace")
            return payload, log, None
    except (zipfile.BadZipFile, OSError) as e:
        return None, None, "архив не читается (%s)" % type(e).__name__


def target_dir(payload):
    """Каталог для дампа: ускоритель → runs-t4, иначе → runs. Решает сам дамп."""
    return RUNS_GPU if (payload.get("runtime") or {}).get("gpu") else RUNS_CPU


def archives(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            out += [os.path.join(p, f) for f in sorted(os.listdir(p)) if f.endswith(".zip")]
        elif p.endswith(".zip") and os.path.isfile(p):
            out.append(p)
    seen, uniq = set(), []
    for p in out:
        rp = os.path.realpath(p)
        if rp not in seen:
            seen.add(rp)
            uniq.append(p)
    return uniq


def write_if_changed(path, body):
    """→ True, если файл действительно изменился. Идемпотентность: повтор не шумит."""
    old = open(path, encoding="utf-8").read() if os.path.exists(path) else None
    if old == body:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(body)
    return True


def import_runs(paths, log=print, quiet=False):
    """→ (принято, без изменений, пропущено)."""
    known = known_notebooks()
    took = same = skipped = 0
    for zp in archives(paths):
        stem = clean_name(os.path.basename(zp)[:-4])
        payload, runlog, why = read_archive(zp)
        if payload is None:
            # Чужой архив в загрузках — обычное дело, молчим о нём, если он даже не назван
            # именем семинара; ругаемся только когда имя совпало, а внутри не то.
            if stem in known:
                log("  ✗ %s: %s" % (stem, why))
                skipped += 1
            continue
        name = payload.get("notebook")
        if name not in known:
            log("  ✗ %s: дамп подписан как «%s» — такого семинара нет" % (stem, name))
            skipped += 1
            continue
        dump_path = os.path.join(target_dir(payload), name + ".json")
        body = json.dumps(payload, ensure_ascii=False, indent=1, sort_keys=True)
        changed = write_if_changed(dump_path, body)
        if runlog is not None:
            write_if_changed(os.path.join(LOGS, name + ".log"), runlog)
        where = os.path.relpath(target_dir(payload), ROOT)
        gpu = (payload.get("runtime") or {}).get("gpu") or "CPU"
        if changed:
            log("  ✓ %s → %s · величин %d · рантайм %s%s"
                % (name, where, len(payload.get("metrics") or {}), gpu,
                   "" if runlog is None else " · журнал %d строк" % runlog.count("\n")))
            took += 1
        else:
            if not quiet:
                log("  = %s: без изменений (%s)" % (name, where))
            same += 1
    return took, same, skipped


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    src = args or [p for p in DEFAULT_SRC if os.path.isdir(p)]
    if not src:
        print("[import-runs] нечего смотреть: нет ~/Downloads, а путь не задан")
        return 1
    took, same, skipped = import_runs(src)
    print("[import-runs] принято %d, без изменений %d, отвергнуто %d" % (took, same, skipped))
    if not took and not same:
        print("            в этих путях нет архивов прогона. Архив создаёт последняя ячейка")
        print("            семинара — жми в её выводе ссылку «Скачать прогон».")
    if "--gate" in argv and (took or same):
        print()
        os.execv(sys.executable, [sys.executable, os.path.join(ROOT, "_research", "check_notebooks.py")])
    return 0


# ── самопроверка ────────────────────────────────────────────────────────────────────────────
def selftest():
    import shutil
    import tempfile
    global RUNS_CPU, RUNS_GPU, LOGS, ROOT, known_notebooks
    tmp = tempfile.mkdtemp(prefix="import_runs_selftest_")
    keep = (RUNS_CPU, RUNS_GPU, LOGS, ROOT, known_notebooks)
    RUNS_CPU = os.path.join(tmp, "runs")
    RUNS_GPU = os.path.join(tmp, "runs-t4")
    LOGS = os.path.join(RUNS_CPU, "logs")
    ROOT = tmp
    known_notebooks = lambda: {"nb", "nb2"}                      # noqa: E731
    fails = []

    def check(label, cond):
        if not cond:
            fails.append(label)

    def make_zip(fname, payload, log="строка\n", extra=None):
        p = os.path.join(tmp, fname)
        with zipfile.ZipFile(p, "w") as z:
            if payload is not None:
                z.writestr("%s.json" % payload.get("notebook", "x"),
                           json.dumps(payload, ensure_ascii=False))
            if log is not None:
                z.writestr(LOG_NAME, log)
            if extra:
                z.writestr(*extra)
        return p

    def payload(nb="nb", gpu=None, metrics=None):
        return {"notebook": nb, "runtime": {"gpu": gpu}, "metrics": metrics or {"a": 1}}

    quiet_log = []
    # 1. CPU-архив: дамп в runs/, журнал в runs/logs/
    took, same, sk = import_runs([make_zip("nb.zip", payload())], log=quiet_log.append)
    check("CPU-дамп принят", took == 1 and os.path.exists(os.path.join(RUNS_CPU, "nb.json")))
    check("журнал сохранён", os.path.exists(os.path.join(LOGS, "nb.log")))
    check("CPU-дамп не попал в runs-t4", not os.path.exists(os.path.join(RUNS_GPU, "nb.json")))
    # 2. повтор идемпотентен
    took, same, sk = import_runs([make_zip("nb.zip", payload())], log=quiet_log.append)
    check("повтор ничего не переписывает", took == 0 and same == 1)
    # 3. GPU-архив уходит в runs-t4 и не трогает CPU-дамп
    before = open(os.path.join(RUNS_CPU, "nb.json"), encoding="utf-8").read()
    import_runs([make_zip("nb-gpu.zip", payload(gpu="Tesla T4", metrics={"a": 2}))],
                log=quiet_log.append)
    check("GPU-дамп в runs-t4", os.path.exists(os.path.join(RUNS_GPU, "nb.json")))
    check("GPU-дамп не тронул runs/",
          open(os.path.join(RUNS_CPU, "nb.json"), encoding="utf-8").read() == before)
    # 4. имя со скачанным довеском
    took, same, sk = import_runs([make_zip("nb2 (1).zip", payload(nb="nb2"))], log=quiet_log.append)
    check("«nb2 (1).zip» принят", took == 1 and os.path.exists(os.path.join(RUNS_CPU, "nb2.json")))
    # 5. чужой архив в загрузках — молча мимо
    took, same, sk = import_runs([make_zip("отчёт.zip", None, log=None,
                                           extra=("readme.txt", "не прогон"))],
                                 log=quiet_log.append)
    check("чужой архив не принят и не шумит", took == 0 and sk == 0)
    # 6. дамп чужого семинара — отвергаем вслух
    took, same, sk = import_runs([make_zip("nb.zip", payload(nb="какой-то"))], log=quiet_log.append)
    check("неизвестный семинар отвергнут", took == 0 and sk == 1)
    # 7. битый zip
    bad = os.path.join(tmp, "nb.zip")
    open(bad, "wb").write("не zip".encode("utf-8"))
    took, same, sk = import_runs([bad], log=quiet_log.append)
    check("битый архив назван битым", took == 0 and sk == 1)
    # 8. архив без журнала — дамп всё равно принимается
    os.remove(os.path.join(RUNS_CPU, "nb.json"))
    took, same, sk = import_runs([make_zip("nb.zip", payload(metrics={"a": 3}), log=None)],
                                 log=quiet_log.append)
    check("архив без журнала принят", took == 1)

    RUNS_CPU, RUNS_GPU, LOGS, ROOT, known_notebooks = keep
    shutil.rmtree(tmp, ignore_errors=True)
    for f in fails:
        print("  ✗ %s" % f)
    print("[import-runs --selftest] проверок 11, провалов %d" % len(fails))
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main(sys.argv))
