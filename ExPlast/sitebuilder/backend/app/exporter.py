import os, io, zipfile, tempfile, json, base64
from types import SimpleNamespace
from jinja2 import Template
from sqlalchemy.orm import Session
from .models import Project, ProjectPage

_HTML = """<!doctype html>
<html lang="ru"><head>
  <meta charset="utf-8">
  <title>{{ title }}</title>
  <style>{{ css }}</style>
</head><body>
{{ html|safe }}
</body></html>"""

def _render(page: ProjectPage) -> bytes:
    tpl = Template(_HTML)
    css  = page.data.get("css", "")
    html = page.data.get("html", "")
    return tpl.render(title=page.name, html=html, css=css).encode()

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
    if data_pages:
        for name, pdata in data_pages.items():
            pages_dict[name] = SimpleNamespace(name=name, data=pdata)

    pages = list(pages_dict.values())

    tmp_fd, tmp_name = tempfile.mkstemp(suffix=".zip")
    os.close(tmp_fd)                    # zipfile сам будет писать

    with zipfile.ZipFile(tmp_name, "w", zipfile.ZIP_DEFLATED) as zf:
        for pg in pages:
            html_bytes = _render(pg)
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
