#!/usr/bin/env python3
"""install_hooks.py — поставить git-хуки репозитория, не сломав хуки Git LFS.

Почему копией, а не через core.hooksPath: на .git/hooks висят четыре хука Git LFS
(post-checkout, post-commit, post-merge, pre-push). Переключение hooksPath на .githooks
отключило бы их разом — и выкачка больших файлов тихо перестала бы работать. Поэтому
каждый наш хук кладётся отдельным файлом рядом, а чужие не трогаются.

Usage:  python3 scripts/install_hooks.py          (поставить)
        python3 scripts/install_hooks.py --check  (проверить, ничего не менять)
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, ".githooks")
HOOKS = ["pre-commit"]


def git_dir():
    out = subprocess.run(["git", "rev-parse", "--git-dir"], cwd=ROOT,
                         capture_output=True, text=True)
    if out.returncode:
        return None
    d = out.stdout.strip()
    return d if os.path.isabs(d) else os.path.join(ROOT, d)


def main(argv):
    check = "--check" in argv
    gd = git_dir()
    if not gd:
        print("[hooks] это не git-репозиторий")
        return 1
    dst_dir = os.path.join(gd, "hooks")
    os.makedirs(dst_dir, exist_ok=True)
    rc = 0
    for h in HOOKS:
        src, dst = os.path.join(SRC, h), os.path.join(dst_dir, h)
        want = open(src, encoding="utf-8").read()
        have = open(dst, encoding="utf-8").read() if os.path.exists(dst) else None
        if have == want:
            print("  = %s: уже стоит" % h)
            continue
        if check:
            print("  ! %s: %s" % (h, "отличается" if have else "не поставлен"))
            rc = 1
            continue
        if have is not None and "extract_runs" not in have:
            # Чужой хук с тем же именем не затираем молча — это была бы потеря чужой работы.
            print("  ✗ %s: уже существует ЧУЖОЙ хук, не трогаю (%s)" % (h, dst))
            rc = 1
            continue
        shutil.copyfile(src, dst)
        os.chmod(dst, 0o755)
        print("  ✓ %s → %s" % (h, os.path.relpath(dst, ROOT)))
    print("[hooks] %s" % ("проверено" if check else "готово"))
    return rc


if __name__ == "__main__":
    sys.exit(main(sys.argv))
