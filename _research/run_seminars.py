#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""run_seminars — авторский прогон семинаров с подстановкой опубликованных решений.

Что делает, по шагам:
  1. Берёт seminars/<имя>.ipynb, находит рамки `# --- твой код: ЗАДАНИЕ N ---` … `# --- конец ---`
     и решения в <details><summary>Задание N …</summary>. Кодовое решение (```python-блок)
     подставляется в рамку; прозаичное (задание-эссе без кода) кладётся в переменную
     `ANSWER_N = \"\"\"…\"\"\"`, чьё имя берётся из самой рамки.
  2. Комментирует shell-строки (`!pip …`): пины адресованы Colab, локальный прогон идёт
     в авторском venv (_research/.venv-seminars), и даунгрейдить его пины не должны.
  3. Исполняет ноутбук через nbclient В ПОРЯДКЕ ЯЧЕЕК; любой упавший assert валит прогон —
     это и есть проверка. Исполненная копия (с выводами) сохраняется рядом для разбора,
     в репозиторий она не коммитится.
  4. Дамп-ячейка ноутбука сама пишет runs/<имя>.json (RUNS_DIR укажет куда).

Порядок прогона — недельный порядок курса: цепочка артефактов (metrics.py → cascade.json →
fusion.json → …) накапливается в общем рабочем каталоге, и project-search обязан найти всё.

Запуск (обязательно интерпретатором авторского venv):
  _research/.venv-seminars/bin/python _research/run_seminars.py --workdir /tmp/run --runs seminars/runs
  … [--only lab-bm25,hw-rag]
"""
import argparse
import json
import pathlib
import re
import shutil
import sys
import time

ORDER = ["lab-bm25", "hw-ranking-metrics", "lab-cascade", "hw-alliance",
         "lab-ann", "hw-rag", "project-search"]

FRAME = re.compile(r"# --- твой код: ЗАДАНИЕ (\d+) ---\n(.*?)# --- конец ---", re.S)
DETAILS = re.compile(r"<details><summary>Задание (\d+)[^<]*</summary>(.*?)</details>", re.S)
PYBLOCK = re.compile(r"```python\n(.*?)```", re.S)


def solutions_of(nb):
    """№ задания → (код | None, проза)."""
    out = {}
    for c in nb["cells"]:
        if c["cell_type"] != "markdown":
            continue
        for m in DETAILS.finditer("".join(c["source"])):
            n, body = int(m.group(1)), m.group(2)
            code = PYBLOCK.search(body)
            prose = PYBLOCK.sub(" ", body)
            prose = re.sub(r"<[^>]+>|[*_`]", " ", prose)
            prose = re.sub(r"\s+", " ", prose).strip()
            out[n] = (code.group(1).rstrip() if code else None, prose)
    return out


def inject(nb, name):
    """Подставить решения во все рамки; вернуть число подстановок. Несовпадение — ошибка."""
    sols = solutions_of(nb)
    done = []
    for c in nb["cells"]:
        if c["cell_type"] != "code":
            continue
        src = "".join(c["source"])
        m = FRAME.search(src)
        if not m:
            continue
        n = int(m.group(1))
        if n not in sols:
            raise SystemExit(f"[{name}] рамка ЗАДАНИЕ {n} без решения в <details> — нечего подставлять")
        code, prose = sols[n]
        if code is None:
            var = re.search(r"(\w+)\s*=\s*(?:\.\.\.|\"\"\")", m.group(2))
            if not var:
                raise SystemExit(f"[{name}] ЗАДАНИЕ {n}: решение прозаичное, а переменной-приёмника в рамке нет")
            code = f'{var.group(1)} = """{prose}"""'
        new = f"# --- твой код: ЗАДАНИЕ {n} ---\n{code}\n# --- конец ---"
        src = src[:m.start()] + new + src[m.end():]
        lines = src.split("\n")
        c["source"] = [l + "\n" for l in lines[:-1]] + [lines[-1]]
        done.append(n)
    missing = sorted(set(sols) - set(done))
    if missing:
        print(f"[{name}] решения без рамок (прозаичные разборы, это норма): {missing}")
    return done


def neutralize_shell(nb):
    """`!…`-строки — только для Colab; локально комментируем (пины venv не трогаем)."""
    n = 0
    for c in nb["cells"]:
        if c["cell_type"] != "code":
            continue
        src = "".join(c["source"])
        if re.search(r"^\s*!", src, re.M):
            src = re.sub(r"^(\s*)!", r"\1# [локальный прогон] !", src, flags=re.M)
            lines = src.split("\n")
            c["source"] = [l + "\n" for l in lines[:-1]] + [lines[-1]]
            n += 1
    return n


def run_one(name, repo, workdir, runs_dir):
    import nbformat
    from nbclient import NotebookClient

    t0 = time.time()
    nb = json.loads((repo / "seminars" / f"{name}.ipynb").read_text(encoding="utf-8"))
    tasks = inject(nb, name)
    shells = neutralize_shell(nb)
    print(f"[{name}] решений подставлено: {tasks} · shell-ячеек закомментировано: {shells}", flush=True)

    node = nbformat.reads(json.dumps(nb), as_version=4)
    client = NotebookClient(node, timeout=3600, kernel_name="python3",
                            resources={"metadata": {"path": str(workdir)}})
    import os
    os.environ["RUNS_DIR"] = str(runs_dir)
    os.environ["DLS_DATA"] = str(repo / "data")   # источник чисел курса — репозиторный data/
    try:
        client.execute()
    finally:
        out = workdir / "executed"
        out.mkdir(exist_ok=True)
        nbformat.write(node, str(out / f"{name}.ipynb"))
    dt = time.time() - t0
    dump = runs_dir / f"{name}.json"
    ok = dump.exists()
    print(f"[{name}] {'OK' if ok else 'БЕЗ ДАМПА'} за {dt/60:.1f} мин · дамп: {dump if ok else 'НЕТ'}", flush=True)
    if not ok:
        raise SystemExit(f"[{name}] прогон завершился, а дампа нет — дамп-ячейка не исполнилась?")


def emit_colab(names, repo, out_dir):
    """Копии для кросс-рантайм прогона (Colab T4): решения подставлены, пины ЖИВЫЕ —
    в Colab они нужны, это его рантайм. Исполнение не выполняется."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in names:
        nb = json.loads((repo / "seminars" / f"{name}.ipynb").read_text(encoding="utf-8"))
        tasks = inject(nb, name)
        (out_dir / f"{name}.ipynb").write_text(
            json.dumps(nb, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"[emit] {name}: решения {tasks} → {out_dir / (name + '.ipynb')}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", help="общий рабочий каталог (цепочка артефактов)")
    ap.add_argument("--runs", help="куда класть дампы (RUNS_DIR)")
    ap.add_argument("--only", default="", help="через запятую; по умолчанию все семь в порядке недель")
    ap.add_argument("--emit-colab", metavar="DIR",
                    help="не исполнять: выписать копии с решениями для прогона в Colab")
    args = ap.parse_args()

    if args.emit_colab:
        repo = pathlib.Path(__file__).resolve().parent.parent
        names = [n.strip() for n in args.only.split(",") if n.strip()] or ORDER
        emit_colab(names, repo, pathlib.Path(args.emit_colab).resolve())
        return
    if not (args.workdir and args.runs):
        raise SystemExit("нужны --workdir и --runs (или --emit-colab DIR)")

    repo = pathlib.Path(__file__).resolve().parent.parent
    workdir = pathlib.Path(args.workdir).resolve()
    workdir.mkdir(parents=True, exist_ok=True)
    runs_dir = pathlib.Path(args.runs).resolve()
    runs_dir.mkdir(parents=True, exist_ok=True)

    names = [n.strip() for n in args.only.split(",") if n.strip()] or ORDER
    unknown = [n for n in names if n not in ORDER]
    if unknown:
        raise SystemExit(f"неизвестные ноутбуки: {unknown}")

    print(f"[run] порядок: {names}")
    print(f"[run] workdir={workdir} · runs={runs_dir} · python={sys.version.split()[0]}", flush=True)
    for name in names:
        run_one(name, repo, workdir, runs_dir)
    print("[run] ВСЕ ПРОГОНЫ ЗАВЕРШЕНЫ", flush=True)


if __name__ == "__main__":
    main()
