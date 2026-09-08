#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_calendar — вывести КАЛЕНДАРЬ курса из одной даты старта.

Зачем. До 08.09.2026 календарь курса не существовал как данные: даты стояли руками на
слайдах вводной лекции и в src/lib/midterm.js — и все были неверные. Слайд дедлайнов нёс
июнь–июль от прошлого потока, титулы трёх дек — 03.06.2026, а мидтерм был объявлен
«Неделя 4 · Ср 24 июня», хотя по расписанию он в неделе 7. Три копии календаря в трёх
местах, ни одна не сверялась ни с чем.

Теперь источник один: `calendar.start` в data/course.json. Отсюда выводится ВСЁ:
  · дата каждого из 28 занятий      — неделя N идёт в день старта + (N−1) неделя;
  · дата мидтерма                   — из строки расписания kind=checkpoint;
  · выдача и дедлайн каждой работы  — работа выдаётся на своей мастерской, сдаётся
                                      в понедельник 23:59 накануне следующего занятия;
  · экзамен и защита                — недели после последней учебной (examWeeks).

Правило дедлайна выбрано не произвольно: сдача накануне занятия означает, что
преподаватель приходит на пару с уже проверенными работами, а у студента ровно неделя.
Сдвинулось расписание — правится одно число `start`, остальное пересчитывается.

Что скрипт ПИШЕТ: поле `date` в каждой строке `schedule`, блок `calendar.derived` и
`assignmentsSchedule`. Всё остальное в course.json он не трогает.

Usage:
    python3 _research/gen_calendar.py            (пересчитать и записать)
    python3 _research/gen_calendar.py --check    (только сверить, ничего не писать)
    python3 _research/gen_calendar.py --selftest
"""
import datetime
import io
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COURSE = os.path.join(ROOT, "data", "course.json")

RU_MONTH_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня",
                "июля", "августа", "сентября", "октября", "ноября", "декабря"]
EN_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
RU_WD = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]
EN_WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

# Какая мастерская чем является для студента. Порядок берётся из расписания, но НАЗВАНИЕ
# («Лаба 1», «Задание 2») живёт здесь: в расписании лежат технические имена тетрадок, а
# на слайде студент читает человеческие. Проект идёт отдельной строкой — он не «лаба 4».
ACTIVITY_LABEL = {
    "lab-bm25":            {"ru": "Лаба 1", "en": "Lab 1"},
    "hw-ranking-metrics":  {"ru": "Задание 1", "en": "Assignment 1"},
    "lab-cascade":         {"ru": "Лаба 2", "en": "Lab 2"},
    "hw-alliance":         {"ru": "Задание 2", "en": "Assignment 2"},
    "lab-ann":             {"ru": "Лаба 3", "en": "Lab 3"},
    "hw-rag":              {"ru": "Задание 3", "en": "Assignment 3"},
    "project-search":      {"ru": "Проект", "en": "Project"},
}


def ru_date(d):
    return f"{d.day} {RU_MONTH_GEN[d.month - 1]}"


def en_date(d):
    return f"{EN_MONTH[d.month - 1]} {d.day}"


def session_date(start, week):
    """Дата занятия недели N. Обе сессии недели идут в один день — так ведётся курс."""
    return start + datetime.timedelta(weeks=week - 1)


def due_date(start, week):
    """Дедлайн работы, выданной на неделе N: понедельник накануне занятия недели N+1.

    То есть день старта + N недель − 1 день. Для вторничного курса это понедельник,
    для любого другого дня — накануне занятия, что и требуется: преподаватель приходит
    на пару с проверенными работами.
    """
    return session_date(start, week + 1) - datetime.timedelta(days=1)


def build(course):
    cal = course["calendar"]
    start = datetime.date.fromisoformat(cal["start"])
    weeks = cal["weeks"]

    sched = course["schedule"]
    for row in sched:
        row["date"] = session_date(start, row["week"]).isoformat()

    midterm = next((r for r in sched if r["kind"] == "checkpoint"), None)
    assignments = []
    for row in sched:
        name = row.get("assignment")
        if not name:
            continue
        label = ACTIVITY_LABEL.get(name)
        if not label:
            continue
        rel = session_date(start, row["week"])
        due = due_date(start, row["week"])
        assignments.append({
            "id": name, "label": label, "week": row["week"],
            "released": rel.isoformat(), "due": due.isoformat(),
        })

    # ПРОЕКТ — исключение из общего правила, и это записано явно, а не спрятано в коде.
    # Общее правило («выдан на своей мастерской, сдан через шесть дней») даёт проекту
    # выдачу 8 декабря и дедлайн 14-го — при защите 22-го и четырёх чек-поинтах внутри.
    # Capstone так не работает: мастерская недели 14 — это рабочая сессия по проекту, а
    # не его выдача. Поэтому выдача берётся из calendar.projectReleaseWeek, а дедлайн —
    # дата защиты. Оба числа видимы в данных, менять их можно не трогая код.
    defense = next((e for e in cal.get("examWeeks", []) if e["kind"] == "defense"), None)
    prw = cal.get("projectReleaseWeek")
    for a in assignments:
        if a["id"] != "project-search":
            continue
        if prw:
            a["released"] = session_date(start, prw).isoformat()
        if defense:
            a["due"] = session_date(start, defense["week"]).isoformat()
        a["note"] = {"ru": "capstone: выдаётся заранее, сдаётся на защите",
                     "en": "capstone: released early, delivered at the defense"}

    exams = []
    for e in cal.get("examWeeks", []):
        d = session_date(start, e["week"])
        exams.append({"kind": e["kind"], "week": e["week"], "date": d.isoformat(),
                      "provisional": e.get("provisional", False)})

    cal["derived"] = {
        "firstSession": session_date(start, 1).isoformat(),
        "lastSession": session_date(start, weeks).isoformat(),
        "weekday": {"ru": RU_WD[start.weekday()], "en": EN_WD[start.weekday()]},
        "midtermDate": midterm["date"] if midterm else None,
        "midtermWeek": midterm["week"] if midterm else None,
        "exams": exams,
    }
    course["assignmentsSchedule"] = assignments
    return course


def write(course, path=COURSE):
    with io.open(path, "w", encoding="utf-8") as fh:
        json.dump(course, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def main(argv):
    course = json.load(open(COURSE, encoding="utf-8"))
    if "calendar" not in course:
        print("в data/course.json нет блока calendar — добавь его, я не выдумываю даты")
        return 2
    before = json.dumps(course, ensure_ascii=False, sort_keys=True)
    build(course)
    after = json.dumps(course, ensure_ascii=False, sort_keys=True)
    cal = course["calendar"]["derived"]
    print(f"[calendar] старт {course['calendar']['start']} ({cal['weekday']['ru']}) · "
          f"недель {course['calendar']['weeks']} · "
          f"последнее занятие {cal['lastSession']}")
    print(f"[calendar] мидтерм: неделя {cal['midtermWeek']} · {cal['midtermDate']}")
    for e in cal["exams"]:
        mark = " (ориентировочно)" if e["provisional"] else ""
        print(f"[calendar] {e['kind']}: неделя {e['week']} · {e['date']}{mark}")
    print(f"[calendar] работ с датами: {len(course['assignmentsSchedule'])}")
    if "--check" in argv:
        if before != after:
            print("[calendar] РАСХОЖДЕНИЕ: данные не пересчитаны — прогони без --check")
            return 1
        print("[calendar] данные совпадают с выводом ✓")
        return 0
    write(course)
    print("[calendar] записано в data/course.json")
    return 0


def selftest():
    fails = []

    def check(label, cond):
        if not cond:
            fails.append(label)
        print(("  [OK] " if cond else "  x    ") + label)

    start = datetime.date(2026, 9, 8)
    check("старт — вторник", start.weekday() == 1)
    check("неделя 1 — день старта", session_date(start, 1) == start)
    check("неделя 7 — через шесть недель",
          session_date(start, 7) == datetime.date(2026, 10, 20))
    check("неделя 14 — последняя учебная",
          session_date(start, 14) == datetime.date(2026, 12, 8))
    check("дедлайн недели 3 — понедельник накануне занятия недели 4",
          due_date(start, 3) == datetime.date(2026, 9, 28)
          and due_date(start, 3).weekday() == 0)
    check("между выдачей и сдачей ровно шесть дней",
          (due_date(start, 3) - session_date(start, 3)).days == 6)
    check("русская дата в родительном падеже", ru_date(start) == "8 сентября")
    check("английская дата короткая", en_date(start) == "Sep 8")
    fake = {"calendar": {"start": "2026-09-08", "weeks": 14,
                         "examWeeks": [{"kind": "final", "week": 15}]},
            "schedule": [{"week": 7, "kind": "checkpoint"},
                         {"week": 3, "kind": "workshop", "assignment": "lab-bm25"}]}
    out = build(fake)
    check("дата проставлена в каждую строку расписания",
          all("date" in r for r in out["schedule"]))
    check("мидтерм найден по kind=checkpoint",
          out["calendar"]["derived"]["midtermDate"] == "2026-10-20")
    check("работа получила выдачу и дедлайн",
          out["assignmentsSchedule"][0]["released"] == "2026-09-22"
          and out["assignmentsSchedule"][0]["due"] == "2026-09-28")
    check("экзамен после последней учебной недели",
          out["calendar"]["derived"]["exams"][0]["date"] == "2026-12-15")

    fake2 = {"calendar": {"start": "2026-09-08", "weeks": 14, "projectReleaseWeek": 7,
                          "examWeeks": [{"kind": "defense", "week": 16}]},
             "schedule": [{"week": 14, "kind": "workshop", "assignment": "project-search"}]}
    pr = build(fake2)["assignmentsSchedule"][0]
    check("проект выдаётся не на своей мастерской, а заранее",
          pr["released"] == "2026-10-20")
    check("и сдаётся на защите, а не через шесть дней", pr["due"] == "2026-12-22")
    if fails:
        print(f"[calendar] selftest FAIL — {len(fails)}")
        return 1
    print("[calendar] selftest PASS")
    return 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main(sys.argv))
