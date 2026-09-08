#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pptx_fixture — собрать ТЕХНИЧЕСКУЮ БОЛВАНКУ шаблона: 16 макетов с именованными
плейсхолдерами и ничем больше.

ЭТО НЕ ДИЗАЙН И НЕ ЗАГОТОВКА ДЛЯ ДИЗАЙНА. Голые прямоугольники, системный шрифт, серые
рамки. Файл существует ровно для двух вещей:

  1. Проверить связь. Наливальщик ищет плейсхолдеры ПО ИМЕНИ; болванка доказывает, что
     механизм работает, ещё до того как дизайнер потратит день. Без неё первая заливка в
     его шаблон была бы одновременно проверкой шаблона И проверкой нашего кода — а когда
     ломаются оба, не видно, что именно.
  2. Дать дизайнеру сверить ИМЕНА. Опечатка в имени плейсхолдера = молча пустая рамка на
     сотне слайдов; свериться глазами с болванкой дешевле, чем ловить это в готовом файле.

Специально уродливо. Красивая болванка стала бы «отправной точкой», а решение владельца
(07.09.2026) — макеты рисует дизайнер с нуля.

Почему макеты собираются XML-ом. python-pptx макеты создавать не умеет
(scanny/python-pptx#413): он умеет только пользоваться теми, что уже есть в файле. Значит
либо рисовать 16 макетов руками в PowerPoint, либо писать XML. Пишем XML — руками это
пришлось бы переделывать при каждой правке контракта.

Usage:  _research/.venv-pptx/bin/python scripts/pptx_fixture.py [--out FILE]
"""
import argparse
import copy
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pptx import Presentation                                          # noqa: E402
from pptx.oxml.ns import qn                                            # noqa: E402
from pptx.util import Emu                                              # noqa: E402
from pptx_families import FAMILIES, roles_of                           # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "_internal", "pptx-export", "_pptx", "_fixture.pptx")

EMU_PER_PX = 914400 // 144          # 1 px макета = 1/144 дюйма → кадр 1920×1080 = 13,333×7,5"
W, H = 1920, 1080

# Раскладка болванки: рамки складываются СТОЛБИКОМ по числу ролей семейства.
# Это не дизайн и не намёк на него — просто гарантия, что ни одна рамка не наезжает на
# соседнюю и каждое имя читается. Первая версия раскладывала роли по общей сетке, и на
# макете formula «body» ложился поверх «formula»: имена стали неразличимы ровно там, где
# болванку и смотрят — при сверке имён.
MARGIN, TOP, GAP = 120, 60, 12
FRAME_W, FRAME_H = 1920, 1080


def grid(roles):
    """Прямоугольники для ролей семейства: столбик на всю высоту кадра.
    Роли, которые естественно стоят парой (обозначение и его расшифровка), кладутся в
    одну строку — иначе на макете formula не видно, что это пара."""
    pairs = {"var-symbol": "var-desc", "column-1": "column-2"}
    rows, skip = [], set()
    for r in roles:
        if r in skip:
            continue
        mate = pairs.get(r)
        rows.append([r, mate] if mate and mate in roles else [r])
        if mate:
            skip.add(mate)
    h = max(40, int((FRAME_H - TOP * 2 - GAP * len(rows)) / max(len(rows), 1)))
    out, y = {}, TOP
    for row in rows:
        w = int((FRAME_W - MARGIN * 2 - GAP * (len(row) - 1)) / len(row))
        for i, r in enumerate(row):
            out[r] = (MARGIN + i * (w + GAP), y, w, h)
        y += h + GAP
    return out


# idx=0 по схеме OOXML принадлежит ЗАГОЛОВКУ, и body с таким индексом — нарушение.
# Keynote отказывается открывать такой файл целиком («формат недопустим»), PowerPoint
# молчит. Поэтому роль title получает настоящий p:ph type="title", остальные — body
# с индексами от единицы.
PH_TYPE = "body"


def _sp_placeholder(idx, shape_id, name, x, y, w, h):
    """XML одного плейсхолдера макета. Собран из строки намеренно: python-pptx не
    предоставляет конструктора плейсхолдера макета, а собирать его через oxml-фабрики —
    это тот же XML, только на десять строк длиннее и без возможности его прочитать."""
    from pptx.oxml import parse_xml
    from pptx.oxml.ns import nsdecls
    ph = ('<p:ph type="title"/>' if name == "title"
          else f'<p:ph type="{PH_TYPE}" idx="{idx}" hasCustomPrompt="1"/>')
    return parse_xml(
        f'<p:sp {nsdecls("p", "a")}>'
        f'  <p:nvSpPr>'
        f'    <p:cNvPr id="{shape_id}" name="{name}"/>'
        f'    <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
        f'    <p:nvPr>{ph}</p:nvPr>'
        f'  </p:nvSpPr>'
        f'  <p:spPr>'
        f'    <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
        f'    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        f'    <a:ln w="9525"><a:solidFill><a:srgbClr val="BBBBBB"/></a:solidFill>'
        f'      <a:prstDash val="dash"/></a:ln>'
        f'  </p:spPr>'
        f'  <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>'
        f'    <a:p><a:r><a:rPr lang="ru-RU" sz="1200"/><a:t>{name}</a:t></a:r></a:p>'
        f'  </p:txBody>'
        f'</p:sp>')


def build(out_path):
    prs = Presentation()
    prs.slide_width, prs.slide_height = Emu(W * EMU_PER_PX), Emu(H * EMU_PER_PX)
    master = prs.slide_master
    layouts = master.slide_layouts
    blank = layouts[6]                                    # «Пустой» — берём как донора

    # python-pptx не умеет добавлять макеты, но добавить УЗЕЛ в sldLayoutIdLst умеет любой,
    # кто готов возиться с частями пакета. Проще и надёжнее: клонировать пустой макет
    # столько раз, сколько семейств, — клон приходит со всеми связями пакета.
    made = []
    for fam in FAMILIES:
        el = copy.deepcopy(blank._element)
        for sp in el.find(qn("p:cSld")).find(qn("p:spTree")).findall(qn("p:sp")):
            el.find(qn("p:cSld")).find(qn("p:spTree")).remove(sp)     # донорские рамки прочь
        made.append((fam, el))

    # Клон макета — это новая ЧАСТЬ пакета, а не просто узел: без своей part она не
    # сохранится. python-pptx создаёт часть только через clone_layout, которого нет,
    # поэтому идём через низкий уровень пакета.
    from pptx.parts.slide import SlideLayoutPart
    from pptx.opc.constants import CONTENT_TYPE as CT
    from pptx.opc.packuri import PackURI

    package = prs.part.package
    n = len(layouts._sldLayoutIdLst)
    for k, (fam, el) in enumerate(made, start=1):
        # Два независимых счётчика, и это не педантизм. `idx` — адрес плейсхолдера, по
        # которому слайд находит его в макете; у заголовка он всегда 0. `id` — уникальный
        # номер фигуры в пределах макета. Один счётчик на двоих давал совпадающие id там,
        # где title стоит не первым в списке ролей (quote, final): дубль id делает файл
        # невалидным, причём PowerPoint это обычно прощает, а Keynote — нет.
        idx, shape_id = 0, 1
        boxes = grid(roles_of(fam))
        for role in roles_of(fam):
            x, y, w, h = boxes[role]
            shape_id += 1
            if role != "title":
                idx += 1                       # индексы body-плейсхолдеров начинаются с 1
            el.find(qn("p:cSld")).find(qn("p:spTree")).append(
                _sp_placeholder(idx, shape_id, role, x * EMU_PER_PX, y * EMU_PER_PX,
                                w * EMU_PER_PX, h * EMU_PER_PX))
        uri = PackURI(f"/ppt/slideLayouts/slideLayout{n + k}.xml")
        # именно SlideLayoutPart, а не generic XmlPart: у второго нет .slide_layout,
        # и python-pptx падает при первом же обходе списка макетов
        part = SlideLayoutPart(uri, CT.PML_SLIDE_LAYOUT, package, el)
        part.relate_to(master.part, "http://schemas.openxmlformats.org/officeDocument/"
                                   "2006/relationships/slideMaster")
        rId = master.part.relate_to(part, "http://schemas.openxmlformats.org/"
                                          "officeDocument/2006/relationships/slideLayout")
        el.set("type", "userDef")
        el.find(qn("p:cSld")).set("name", fam)
        # id макета в sldLayoutIdLst — не порядковый номер: по схеме это беззнаковое целое
        # от 2147483648. PowerPoint молча не откроет файл, если положить сюда 1.
        entry = layouts._sldLayoutIdLst._add_sldLayoutId()
        entry.set("id", str(2147483648 + n + k))
        entry.set(qn("r:id"), rId)

    # Одиннадцать стоковых макетов python-pptx («Title Slide», «Two Content»…) в болванке
    # только мешают: дизайнер должен видеть ровно наши шестнадцать имён и ничего похожего
    # рядом. Заодно это доказывает, что наливальщик не опирается на стоковые макеты.
    for lay in list(layouts)[:n]:
        layouts.remove(lay)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    prs.save(out_path)
    return len(made)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()
    n = build(a.out)
    print(f"[pptx-fixture] макетов: {n} → {os.path.relpath(a.out, ROOT)}")
    print("[pptx-fixture] это БОЛВАНКА для проверки имён, не дизайн — см. release/design-brief.md §7")
    return 0


if __name__ == "__main__":
    sys.exit(main())
