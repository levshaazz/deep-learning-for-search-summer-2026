#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fill_pptx — налить деку курса в ШАБЛОН ДИЗАЙНЕРА.

Чем это отличается от build_pptx.py, который лежит рядом. Тот делает СЛЕПОК: каждый блок —
отдельная рамка на измеренном месте, поверх пустого макета. Слепок честен по содержанию, но
для дизайнера бесполезен: 1472 независимых слайда никто не переложит, а правка одного
заголовка не меняет ничего, кроме этого заголовка.

Здесь наоборот. Слайд курса несёт `data-type`; тип сворачивается в СЕМЕЙСТВО МАКЕТА
(scripts/pptx_families.py), семейство — это макет в шаблоне дизайнера, а каждый кусок текста
едет в ПЛЕЙСХОЛДЕР С ТЕМ ЖЕ ИМЕНЕМ. Дизайнер правит шестнадцать макетов — меняются все 1472
слайда.

Сопоставление ТОЛЬКО по имени. По позиции развалилось бы от первой же правки макета, по
индексу — от вставки плейсхолдера в середину. Имя переживает и то и другое.

Три вещи приезжают не картинкой, и это главное отличие от слепка:
  · формулы     → настоящие формулы PowerPoint (OMML через pandoc), а не строка «\\(x\\)»;
  · таблицы     → настоящие таблицы PowerPoint, а не россыпь ячеек-рамок;
  · виджеты     → нативный вектор (asvg:svgBlip) с PNG-фолбэком; «Преобразовать в фигуру»
                  разбирает их на объекты.

Чего инструмент НЕ делает молча: не теряет контент. Если у макета нет плейсхолдера под роль,
содержимое едет отдельной рамкой на измеренном месте, и это печатается в отчёт. Потерять
абзац на одном слайде из тысячи — ровно тот дефект, который находит заказчик, а не мы.

Usage:
    _research/.venv-pptx/bin/python scripts/fill_pptx.py <дек> --template <файл.potx|pptx>
    _research/.venv-pptx/bin/python scripts/fill_pptx.py --selftest
"""
import argparse
import copy
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pptx import Presentation                                            # noqa: E402
from pptx.oxml import parse_xml                                          # noqa: E402
from pptx.oxml.ns import nsdecls, qn                                     # noqa: E402
from pptx.util import Emu, Pt                                            # noqa: E402
from pptx.enum.text import PP_ALIGN
from pptx.opc.package import Part                                         # noqa: E402
from pptx.opc.packuri import PackURI                                      # noqa: E402
from pptx.opc.constants import RELATIONSHIP_TYPE as RT                                      # noqa: E402
from pptx_families import family_of, FAMILIES                            # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "_internal", "pptx-export")
EMU_PER_PX = 914400 // 144
ALIGN = {"left": PP_ALIGN.LEFT, "center": PP_ALIGN.CENTER, "right": PP_ALIGN.RIGHT,
         "justify": PP_ALIGN.JUSTIFY}
SVG_EXT_URI = "{96DAC541-7B7A-43D3-8B79-37D633B846F1}"
NS_ASVG = "http://schemas.microsoft.com/office/drawing/2016/SVG/main"
NS_A14 = "http://schemas.microsoft.com/office/drawing/2010/main"
NS_M = "http://schemas.openxmlformats.org/officeDocument/2006/math"
NS_MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"


def px(v):
    return Emu(int(round(v * EMU_PER_PX)))


# ── формулы: LaTeX → OMML ────────────────────────────────────────────────────────────────
class Math:
    """LaTeX → OMML через pandoc.

    Почему pandoc, а не XSL от Microsoft. Канонический путь — прогнать MathML через
    MML2OMML.XSL, но этот файл поставляется с Office: тащить его в репозиторий значит
    тащить чужой лицензированный артефакт ради сборки. pandoc делает то же самое своей
    библиотекой texmath, работает офлайн и уже стоит в системе.

    Кэш по хэшу исходника: одна формула встречается на десятке слайдов, а запуск pandoc
    стоит десятки миллисекунд — на деке это разница между секундой и минутой.
    """

    def __init__(self):
        self.cache = {}
        self.ok = shutil.which("pandoc") is not None
        self.fails = 0

    def omml(self, tex):
        if not self.ok:
            return None
        key = hashlib.sha1(tex.encode("utf-8")).hexdigest()
        if key in self.cache:
            return self.cache[key]
        out = None
        try:
            with tempfile.TemporaryDirectory() as td:
                docx = os.path.join(td, "m.docx")
                subprocess.run(["pandoc", "-f", "markdown", "-t", "docx", "-o", docx],
                               input=f"${tex}$", text=True, check=True,
                               capture_output=True, timeout=30)
                with zipfile.ZipFile(docx) as z:
                    doc = z.read("word/document.xml").decode("utf-8")
                m = re.search(r"<m:oMath[ >].*?</m:oMath>", doc, re.S)
                if m:
                    out = m.group(0)
        except Exception:
            out = None
        if out is None:
            self.fails += 1
        self.cache[key] = out
        return out


def omml_paragraph_xml(omml, fallback_text):
    """OMML внутри абзаца DrawingML.

    Формула в PowerPoint живёт не как отдельная фигура, а внутри абзаца текстовой рамки,
    завёрнутая в mc:AlternateContent (MS-ODRAWXML §1.3.5): ветка mc:Choice несёт a14:m с
    математикой для тех, кто её понимает, ветка mc:Fallback — обычный текст для тех, кто
    нет. Без Fallback старый просмотрщик показал бы пустоту вместо формулы.
    """
    esc = (fallback_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    body = omml.replace("<m:oMath>", f'<m:oMath xmlns:m="{NS_M}">', 1) \
        if "xmlns:m=" not in omml.split(">", 1)[0] else omml
    return (
        f'<mc:AlternateContent xmlns:mc="{NS_MC}" {nsdecls("a")}>'
        f'  <mc:Choice xmlns:a14="{NS_A14}" Requires="a14">'
        f'    <a14:m>{body}</a14:m>'
        f'  </mc:Choice>'
        f'  <mc:Fallback>'
        f'    <a:r><a:rPr lang="ru-RU"/><a:t>{esc}</a:t></a:r>'
        f'  </mc:Fallback>'
        f'</mc:AlternateContent>')


# ── текст ────────────────────────────────────────────────────────────────────────────────
MATH_RE = re.compile(r"^\\[\[(](.*)\\[\])]$", re.S)


# Склейка слов — дефект, который видно ТОЛЬКО в pptx. В деке слова разводит вёрстка
# (display:block, отступы), а в текстовой рамке разделителя нет, и получается
# «считай заранееO(N)», «Домен.Топ MTEB», «би-энкодером— две башни». Каждый раз это
# находилось глазами на рендере; теперь ищется само и печатается числом.
# Тире ловим только с пробелом СПРАВА: дефект выглядит как «би-энкодером— две башни»
# (слева пробел потерян, справа остался). А «пары «пользователь—объект»» — составное
# слово, пробелов нет ни с одной стороны, и это не дефект. Без этой оговорки гейт
# ругался на нормальный русский и приучал бы пролистывать его предупреждения.
GLUE_RE = re.compile(r"[а-яёa-z]{2}(?:\\\(|—[  ]|\.[А-ЯЁA-Z][а-яёa-z])")


def glue_suspects(runs):
    return len(GLUE_RE.findall("".join(r["t"] for r in runs)))


def add_text_run(paragraph, text, bold=False, ital=False):
    """Добавить текст в абзац, превращая \n в НАСТОЯЩИЙ разрыв строки a:br.

    В DrawingML перенос — это отдельный элемент, а не символ. python-pptx переводит \n в
    разрыв только при присваивании в TextFrame.text; в run.text он уезжает управляющим
    символом и виден в PowerPoint вертикальной чертой. Наши переносы приходят из двух мест —
    тегов <br> и блочных потомков вроде .term-en, — и оба до этой правки склеивали строки.
    """
    parts = text.split("\n")
    for i, chunk in enumerate(parts):
        if i:
            paragraph._p.append(parse_xml(f'<a:br {nsdecls("a")}/>'))
        if not chunk:
            continue
        r = paragraph.add_run()
        r.text = chunk
        if bold:
            r.font.bold = True
        if ital:
            r.font.italic = True


def no_bullet(paragraph):
    """Снять маркер списка с абзаца.

    Плейсхолдер типа body наследует от мастера списочное форматирование, и КАЖДЫЙ абзац,
    который мы туда кладём, получает точку — включая тело определения и подпись к рисунку.
    Хуже того, деки несут собственный маркер («·», «✓», «✗») текстом, и получается двойной:
    «• · Домен». Свой маркер оставляем как есть — в нём бывает смысл, галочка против
    крестика, — а чужой снимаем. Захочет дизайнер настоящие списки PowerPoint — включит их
    в макете, это его решение, а не наш побочный эффект.
    """
    pPr = paragraph._p.get_or_add_pPr()
    for tag in ("a:buChar", "a:buAutoNum", "a:buNone"):
        for el in pPr.findall(qn(tag)):
            pPr.remove(el)
    pPr.append(parse_xml(f'<a:buNone {nsdecls("a")}/>'))


def fill_text_frame(tf, blocks, math, stats, keep_style=False):
    """Налить абзацы в текстовую рамку. Один блок — один абзац.

    keep_style=False по умолчанию НАМЕРЕННО: кегль, цвет и гарнитуру задаёт макет
    дизайнера, а не наш замер из браузера. Смысл всей затеи в том, чтобы его типографика
    победила; проставив здесь размеры из деки, мы бы её затёрли и вернулись к слепку.
    Жирное и курсивное — другое дело: это разметка смысла, она едет.
    """
    tf.word_wrap = True
    first = True
    for b in blocks:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        no_bullet(p)
        if keep_style and b.get("style", {}).get("align"):
            p.alignment = ALIGN.get(b["style"]["align"])
        stats["glue"] += glue_suspects(b.get("runs", []))
        for run in b.get("runs", []):
            t = run["t"]
            if run.get("math"):
                m = MATH_RE.match(t.strip())
                tex = m.group(1) if m else t
                xml = math.omml(tex)
                if xml:
                    p._p.append(parse_xml(omml_paragraph_xml(xml, tex)))
                    stats["omml"] += 1
                    continue
                stats["math_text"] += 1
                t = tex                       # pandoc не справился — отдаём исходник текстом
            add_text_run(p, t, bold=run.get("b"), ital=run.get("i"))


# ── картинки ─────────────────────────────────────────────────────────────────────────────
def _add_svg_part(slide, svg_path):
    """Положить SVG частью пакета и вернуть rId.

    Мимо get_or_add_image_part: тот гонит файл через PIL, чтобы узнать размер и формат, а
    PIL векторов не читает и падает с UnidentifiedImageError. Нам размер и не нужен —
    геометрию задаёт PNG-основа, SVG идёт вторым слоем через asvg:svgBlip.
    Дедупликация по пути: один виджет стоит на нескольких слайдах, и без неё файл
    распухал бы копиями одного и того же вектора.
    """
    package = slide.part.package
    cache = getattr(package, "_dls_svg_parts", None)
    if cache is None:
        cache = {}
        package._dls_svg_parts = cache
    key = os.path.abspath(svg_path)
    part = cache.get(key)
    if part is None:
        n = len(cache) + 1
        uri = PackURI(f"/ppt/media/dls-vector{n}.svg")
        part = Part(uri, "image/svg+xml", package, open(svg_path, "rb").read())
        cache[key] = part
    return slide.part.relate_to(part, RT.IMAGE)


def add_svg_picture(slide, png_path, svg_path, box):
    """Картинка с нативным SVG и PNG-фолбэком.

    PowerPoint 2016+ читает вектор из расширения asvg:svgBlip внутри a:blip и умеет
    «Преобразовать в фигуру». Всё остальное (Keynote, Google Slides, старые версии) видит
    только PNG — поэтому PNG вставляется как основной blip, а SVG добавляется рядом.
    Порядок обязателен: без PNG файл откроется пустой рамкой там, где вектор не понят.
    """
    x, y, w, h = box
    pic = slide.shapes.add_picture(png_path, px(x), px(y), px(w), px(h))
    if not svg_path or not os.path.exists(svg_path):
        return pic, False
    rId = _add_svg_part(slide, svg_path)
    blip = pic._element.blipFill.find(qn("a:blip"))
    ext_lst = blip.find(qn("a:extLst"))
    if ext_lst is None:
        ext_lst = parse_xml(f'<a:extLst {nsdecls("a")}/>')
        blip.append(ext_lst)
    ext_lst.append(parse_xml(
        f'<a:ext {nsdecls("a")} uri="{SVG_EXT_URI}">'
        f'  <asvg:svgBlip xmlns:asvg="{NS_ASVG}" '
        f'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        f'r:embed="{rId}"/>'
        f'</a:ext>'))
    return pic, True


# ── таблицы ──────────────────────────────────────────────────────────────────────────────
def add_table(slide, block, box, math, stats):
    rows = block["rows"]
    ncols = max(len(r["cells"]) for r in rows)
    x, y, w, h = box
    shape = slide.shapes.add_table(len(rows), ncols, px(x), px(y), px(w), px(h))
    tbl = shape.table
    for ri, row in enumerate(rows):
        for ci in range(ncols):
            cell = tbl.cell(ri, ci)
            if ci >= len(row["cells"]):
                cell.text = ""
                continue
            src = row["cells"][ci]
            fill_text_frame(cell.text_frame, [{"runs": src["runs"]}], math, stats)
            # «хорошо/плохо» — это смысл, а не украшение: без пометки различение исчезает.
            # Цвет здесь НЕ ставим (его задаёт стиль таблицы шаблона), ставим только курсив
            # как машинно-читаемый след, по которому дизайнер найдёт эти ячейки.
            if src.get("tone"):
                for p in cell.text_frame.paragraphs:
                    for r in p.runs:
                        r.font.italic = (src["tone"] == "bad")
    return shape


# ── раскладка одного слайда ──────────────────────────────────────────────────────────────
def placeholders_by_name(slide, layout):
    """Плейсхолдеры слайда, разложенные по ИМЕНАМ ИЗ МАКЕТА.

    Тонкость, на которой всё чуть не встало: имя плейсхолдера при клонировании на слайд
    НЕ переносится. python-pptx (и сам PowerPoint) даёт клону родовое имя вроде
    «Text Placeholder 3», и поиск по имени на слайде находит ноль совпадений — молча, без
    единой ошибки: контент просто весь уезжает в запасные рамки. Именем владеет макет,
    слайд связан с ним только числом `idx`. Поэтому имя берём из макета, а фигуру ищем
    по idx.

    Заодно это ровно та причина, по которой дизайнер обязан именовать плейсхолдеры В
    МАКЕТЕ, а не на слайде-примере.
    """
    by_idx = {}
    for ph in layout.placeholders:
        by_idx[ph.placeholder_format.idx] = ph.name.strip()
    out = {}
    for ph in slide.placeholders:
        name = by_idx.get(ph.placeholder_format.idx)
        if name:
            out.setdefault(name, []).append(ph)
    return out


def box_of(shape):
    return (shape.left / EMU_PER_PX, shape.top / EMU_PER_PX,
            shape.width / EMU_PER_PX, shape.height / EMU_PER_PX)


def drop(shape):
    shape._element.getparent().remove(shape._element)


# Синонимы ролей: разметка различает <img> и <svg>, а макету всё равно — это «фигура».
# Держать их врозь означало бы просить у дизайнера две рамки под одно место в кадре.
ROLE_ALIAS = {"image": "figure", "figure-frame": "figure"}


def role_for(block):
    """Роль блока с поправкой на колонку: содержимое двухколоночного слайда едет в
    column-1/column-2, каким бы ни был его собственный класс."""
    col = block.get("col")
    if col is not None and col in (0, 1):
        return f"column-{col + 1}"
    role = block.get("role") or "body"
    return ROLE_ALIAS.get(role, role)


def fill_slide(prs, layout, s, deck_dir, math, stats, report, no_svg=False):
    slide = prs.slides.add_slide(layout)
    phs = placeholders_by_name(slide, layout)
    used = set()

    groups = {}
    for b in s["blocks"]:
        groups.setdefault(role_for(b), []).append(b)

    for role, blocks in groups.items():
        target = phs.get(role, [None])[0]
        texts = [b for b in blocks if b["kind"] == "text"]
        figs = [b for b in blocks if b["kind"] in ("figure", "image")]
        tables = [b for b in blocks if b["kind"] == "table"]

        if target is not None:
            used.add(role)
            box = box_of(target)
            if texts:
                fill_text_frame(target.text_frame, texts, math, stats)
            else:
                drop(target)                       # плейсхолдер занят картинкой/таблицей
        else:
            box = None
            report["missing"].setdefault(role, 0)
            report["missing"][role] += len(blocks)
            if texts:
                # ЗАПАСНОЙ ХОД: сначала общий `body` макета, и только если его нет —
                # плавающая рамка на измеренном месте. Разница принципиальная: в первом
                # случае текст остаётся ВНУТРИ дизайна (наследует кегль, цвет, поля), во
                # втором висит поверх него по координатам деки. Пока запасным ходом была
                # только рамка, редкая роль означала кляксу на чужом макете — а таких
                # блоков по курсу набралось 388.
                host = phs.get("body", [None])[0] if role != "body" else None
                if host is not None and host is not target:
                    used.add("body")
                    fill_text_frame(host.text_frame, texts, math, stats)
                    stats["into_body"] += 1
                else:
                    b0 = texts[0]
                    r = b0["rect"]
                    tb = slide.shapes.add_textbox(px(r["x"]), px(r["y"]),
                                                  px(max(r["w"], 40)), px(max(r["h"], 20)))
                    fill_text_frame(tb.text_frame, texts, math, stats, keep_style=True)
                    stats["fallback_boxes"] += 1

        for b in tables:
            bx = box or (b["rect"]["x"], b["rect"]["y"], b["rect"]["w"], b["rect"]["h"])
            add_table(slide, b, bx, math, stats)
            stats["tables"] += 1

        for b in figs:
            png = os.path.join(deck_dir, b["file"]) if b.get("file") else None
            if b["kind"] == "image":
                png = os.path.join(ROOT, "Lectures", b["src"].lstrip("/"))
            if not png or not os.path.exists(png):
                stats["missing_assets"] += 1
                continue
            svg = None if no_svg else (
                os.path.join(deck_dir, b["svgFile"]) if b.get("svgFile") else None)
            bx = box or (b["rect"]["x"], b["rect"]["y"], b["rect"]["w"], b["rect"]["h"])
            bx = fit(bx, b["rect"])
            _, vector = add_svg_picture(slide, png, svg, bx)
            stats["figures"] += 1
            stats["vector"] += 1 if vector else 0

    for name, lst in phs.items():
        for ph in lst:
            if name not in used:
                drop(ph)                            # незаполненный плейсхолдер = «щёлкни сюда»

    if s.get("notes"):
        slide.notes_slide.notes_text_frame.text = s["notes"]
    return slide


def fit(box, rect):
    """Вписать фигуру в отведённую макетом рамку, сохранив пропорции. Растянуть виджет
    по чужой рамке — значит соврать: подписи внутри него посчитаны под свою геометрию."""
    x, y, w, h = box
    rw, rh = max(rect["w"], 1), max(rect["h"], 1)
    k = min(w / rw, h / rh)
    nw, nh = rw * k, rh * k
    return (x + (w - nw) / 2, y + (h - nh) / 2, nw, nh)


# ── прогон ───────────────────────────────────────────────────────────────────────────────
def register_notes_master(prs):
    """Дописать в presentation.xml узел notesMasterIdLst.

    python-pptx создаёт часть notesMaster и связь на неё, но НЕ регистрирует её в
    presentation.xml. По схеме PresentationML notesMasterIdLst обязателен, если в пакете
    есть заметки. PowerPoint такую вольность прощает, Keynote — нет: он отказывается
    открывать файл целиком со словами «формат недопустим», и ни одного намёка на то, что
    дело в заметках. Полчаса бисекции ушло ровно на это; повторять их не надо.

    Порядок узлов в presentation.xml задан схемой жёстко: sldMasterIdLst, notesMasterIdLst,
    handoutMasterIdLst, sldIdLst, sldSz, notesSz. Вставка не в своё место так же невалидна,
    как отсутствие узла, поэтому опираемся на sldMasterIdLst и ставим сразу после него.
    """
    xml = prs.part._element
    if xml.find(qn("p:notesMasterIdLst")) is not None:
        return False
    rel = next((r for r in prs.part.rels.values()
                if r.reltype.endswith("/notesMaster")), None)
    if rel is None:
        return False
    node = parse_xml(
        f'<p:notesMasterIdLst {nsdecls("p", "r")}>'
        f'<p:notesMasterId r:id="{rel.rId}"/></p:notesMasterIdLst>')
    anchor = xml.find(qn("p:sldMasterIdLst"))
    if anchor is None:
        xml.insert(0, node)
    else:
        anchor.addnext(node)
    return True


def layouts_by_name(prs):
    out = {}
    for lay in prs.slide_master.slide_layouts:
        out[lay.name.strip().lower()] = lay
    return out


def run(deck, template, out_path, limit=None, no_svg=False, no_math=False):
    deck_dir = os.path.join(SRC, deck)
    man_path = os.path.join(deck_dir, "manifest.json")
    if not os.path.exists(man_path):
        print(f"нет выгрузки {os.path.relpath(man_path, ROOT)} — сначала "
              f"node scripts/export-pptx-extract.mjs {deck}.html")
        return 2
    man = json.load(open(man_path, encoding="utf-8"))

    prs = Presentation(template)
    prs.slide_width, prs.slide_height = px(man["design"]["w"]), px(man["design"]["h"])
    for sl in list(prs.slides._sldIdLst):          # шаблон мог приехать со слайдами-примерами
        prs.slides._sldIdLst.remove(sl)

    lays = layouts_by_name(prs)
    math = Math()
    if no_math:
        math.ok = False
    stats = dict(omml=0, math_text=0, tables=0, figures=0, vector=0,
                 fallback_boxes=0, missing_assets=0, glue=0, into_body=0)
    report = dict(missing={}, no_layout={})

    slides = man["slides"][:limit] if limit else man["slides"]
    for s in slides:
        fam = family_of(s.get("type"))
        lay = lays.get(fam)
        if lay is None:
            report["no_layout"].setdefault(fam, 0)
            report["no_layout"][fam] += 1
            lay = lays.get("free") or list(prs.slide_master.slide_layouts)[0]
        fill_slide(prs, lay, s, deck_dir, math, stats, report, no_svg=no_svg)

    register_notes_master(prs)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    prs.save(out_path)

    print(f"[fill-pptx] {deck}: слайдов {len(slides)} → {os.path.relpath(out_path, ROOT)}")
    print(f"[fill-pptx] формул OMML {stats['omml']} · таблиц {stats['tables']} · "
          f"фигур {stats['figures']} (вектором {stats['vector']})")
    if not math.ok:
        print("  ! pandoc не найден — формулы поехали текстом; поставь pandoc и пересобери")
    if stats["math_text"]:
        print(f"  ! формул, которые pandoc не осилил: {stats['math_text']} — уехали исходником")
    if stats["glue"]:
        print(f"  ! подозрений на склейку слов: {stats['glue']} — вёрстка деки разводила их "
              f"отступом, в текстовой рамке разделителя нет; ищи по деке")
    if stats["missing_assets"]:
        print(f"  ! файлов картинок не нашлось: {stats['missing_assets']}")
    if report["no_layout"]:
        for fam, n in sorted(report["no_layout"].items(), key=lambda kv: -kv[1]):
            print(f"  ! в шаблоне нет макета «{fam}» — {n} слайд(ов) уехали на «free»")
    if stats["into_body"]:
        print(f"  · блоков, ушедших в общий body макета: {stats['into_body']} — "
              f"внутри дизайна, но не в своей роли")
    if stats["fallback_boxes"]:
        print(f"  ! блоков в ПЛАВАЮЩИХ рамках поверх макета: {stats['fallback_boxes']} — "
              f"у макета нет ни своей роли, ни body")
    if report["missing"]:
        print(f"  ! ролей без плейсхолдера: {len(report['missing'])} — контент НЕ потерян, "
              f"он в отдельных рамках на измеренных местах:")
        for role, n in sorted(report["missing"].items(), key=lambda kv: -kv[1])[:12]:
            print(f"      {role:<14} {n} блок(ов)")
    return 0


def selftest():
    """Проверяем то, что ломается молча: обёртку OMML, вписывание фигуры и маршрутизацию
    ролей. Всё три — чистые функции, браузер и PowerPoint не нужны."""
    fails = []

    def check(label, cond):
        if not cond:
            fails.append(label)
        print(("  [OK] " if cond else "  x    ") + label)

    x = omml_paragraph_xml("<m:oMath><m:r><m:t>x</m:t></m:r></m:oMath>", "x")
    check("обёртка OMML несёт ветку a14 и ветку Fallback",
          "a14:m" in x and "mc:Fallback" in x and "<m:oMath" in x)
    check("текст фолбэка экранирован",
          "&lt;" in omml_paragraph_xml("<m:oMath/>", "a<b"))
    b = fit((0, 0, 100, 100), {"w": 200, "h": 100})
    check("фигура вписана с сохранением пропорций и по центру",
          abs(b[2] - 100) < 1e-6 and abs(b[3] - 50) < 1e-6 and abs(b[1] - 25) < 1e-6)
    check("колонка перебивает собственную роль блока",
          role_for({"role": "def-body", "col": 1}) == "column-2")
    check("блок без роли уезжает в body", role_for({}) == "body")
    check("каждое семейство контракта имеет хоть одну роль",
          all(FAMILIES[f] for f in FAMILIES))
    m = MATH_RE.match(r"\[x^2\]")
    check("разделители формулы снимаются", bool(m) and m.group(1) == "x^2")

    from pptx import Presentation as _P
    _p = _P()
    _s = _p.slides.add_slide(_p.slide_layouts[6])
    _s.notes_slide.notes_text_frame.text = "проба"
    check("notesMasterIdLst дописывается", register_notes_master(_p) is True)
    _kids = [c.tag.split("}")[-1] for c in _p.part._element]
    check("и встаёт сразу после sldMasterIdLst",
          _kids.index("notesMasterIdLst") == _kids.index("sldMasterIdLst") + 1)
    check("повторный вызов ничего не дублирует", register_notes_master(_p) is False)

    _tb = _s.shapes.add_textbox(0, 0, 100, 100)
    _par = _tb.text_frame.paragraphs[0]
    no_bullet(_par)
    no_bullet(_par)
    _pPr = _par._p.get_or_add_pPr()
    check("маркер снят и снят ровно один раз",
          len(_pPr.findall(qn("a:buNone"))) == 1)

    _par2 = _tb.text_frame.add_paragraph()
    add_text_run(_par2, "первая\nвторая")
    check("перенос строки стал элементом a:br, а не символом",
          len(_par2._p.findall(qn("a:br"))) == 1 and len(_par2.runs) == 2)
    check("и в тексте не осталось управляющего символа",
          all("\n" not in r.text for r in _par2.runs))

    check("склейка вокруг формулы ловится",
          glue_suspects([{"t": r"считай заранее\(O(N)\)"}]) == 1)
    check("склейка после точки ловится",
          glue_suspects([{"t": "Домен.Топ MTEB"}]) == 1)
    check("нормальный текст не ловится",
          glue_suspects([{"t": "би-энкодером — две башни. Топ MTEB"}]) == 0)
    check("составное слово через тире не ловится",
          glue_suspects([{"t": "пары «пользователь—объект», признаки"}]) == 0)
    check("а потерянный пробел перед тире — ловится",
          glue_suspects([{"t": "би-энкодером— две башни"}]) == 1)
    if fails:
        print(f"[fill-pptx] selftest FAIL — {len(fails)}")
        return 1
    print("[fill-pptx] selftest PASS")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck", nargs="?")
    ap.add_argument("--template", default=os.path.join(SRC, "_pptx", "_fixture.pptx"))
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--limit", type=int, help="взять первые N слайдов (для отладки)")
    ap.add_argument("--no-svg", action="store_true", help="без нативного вектора")
    ap.add_argument("--no-math", action="store_true", help="формулы текстом, без OMML")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.deck:
        ap.error("укажи деку или --selftest")
    out = a.out or os.path.join(SRC, "_pptx", a.deck + "-filled.pptx")
    return run(a.deck, a.template, out, limit=a.limit,
               no_svg=a.no_svg, no_math=a.no_math)


if __name__ == "__main__":
    sys.exit(main())
