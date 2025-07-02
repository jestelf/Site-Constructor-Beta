import os
import zipfile
import tempfile
import json
import base64
from types import SimpleNamespace
from jinja2 import Template
from sqlalchemy.orm import Session
from .models import Project, ProjectPage

_HTML = """<!doctype html>
<html lang="ru"><head>
  <meta charset="utf-8">
  <title>{{ title }}</title>
  <style>{{ css }}</style>
</head><body{{ body_attr }}>
{{ html|safe }}
</body></html>"""

def _render(page: ProjectPage, config: dict | None = None) -> bytes:
    """Собрать полноценную HTML‑страницу из данных страницы."""

    tpl = Template(_HTML)
    pdata = page.data or {}
    cfg = config or {}

    if isinstance(pdata, str):
        try:
            pdata = json.loads(pdata)
        except Exception:
            pdata = {}

    html = ""
    css = ""
    style = ""
    if isinstance(pdata, dict):
        html = pdata.get("html") or pdata.get("gjs-html") or ""
        css = pdata.get("css") or pdata.get("gjs-css") or ""
        style = pdata.get("style") or ""

    if style:
        css = f"{css}\n{style}" if css else style

    body_style = []
    if isinstance(cfg, dict):
        bg = cfg.get("bgColor")
        if bg:
            body_style.append(f"background:{bg}")
        if cfg.get("style"):
            css = f"{css}\n{cfg.get('style')}" if css else cfg.get('style')

    body_attr = f" style=\"{' ; '.join(body_style)}\"" if body_style else ""

    return tpl.render(title=page.name, html=html, css=css, body_attr=body_attr).encode()

def build_zip(project: Project, db: Session) -> str:
    """Создать tmp-zip и вернуть его путь.

    Страницы проекта могут храниться как в базе данных, так и в JSON-поле
    проекта. Собираем их все и исключаем дубликаты. Также добавляем изображения
    из `project.data['project']['assets']`.
    """

    pages_dict: dict[str, SimpleNamespace] = {}

    if project.pages:
        for pg in project.pages:
            pdata = pg.data
            if isinstance(pdata, str):
                try:
                    pdata = json.loads(pdata)
                except Exception:
                    pdata = {}
            pages_dict.setdefault(pg.name, SimpleNamespace(name=pg.name, data=pdata))

    data_pages = project.data.get("pages") if isinstance(project.data, dict) else None
    if isinstance(data_pages, dict):
        for name, pdata in data_pages.items():
            pages_dict[name] = SimpleNamespace(name=name, data=pdata)
    elif isinstance(data_pages, list):
        for idx, pdata in enumerate(data_pages, 1):
            name = pdata.get("name") or f"page{idx}"
            pages_dict[name] = SimpleNamespace(name=name, data=pdata)

    pages = list(pages_dict.values())

    tmp_fd, tmp_name = tempfile.mkstemp(suffix=".zip")
    os.close(tmp_fd)                    # zipfile сам будет писать

    with zipfile.ZipFile(tmp_name, "w", zipfile.ZIP_DEFLATED) as zf:
        cfg = project.data.get("config") if isinstance(project.data, dict) else {}
        for pg in pages:
            html_bytes = _render(pg, cfg)
            fname = ("index" if pg.name == "index" else pg.name) + ".html"
            zf.writestr(fname, html_bytes)

        proj_data = project.data.get("project") if isinstance(project.data, dict) else {}
        assets = proj_data.get("assets") if isinstance(proj_data, dict) else []
        for idx, asset in enumerate(assets, 1):
            src = asset.get("src")
            if not src or not src.startswith("data:"):
                continue
            name = asset.get("name") or f"asset{idx}"
            try:
                header, b64 = src.split(",", 1)
                data = base64.b64decode(b64)
            except Exception:
                continue
            zf.writestr(f"assets/{name}", data)

    return tmp_name
