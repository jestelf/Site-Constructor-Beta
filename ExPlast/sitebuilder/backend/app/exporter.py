import os, io, zipfile, tempfile
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

def build_zip(project: Project, db: Session, data: dict | None = None) -> str:
    """Создать tmp-zip и вернуть его путь"""
    pages: list[ProjectPage] = []

    pdata = data if data is not None else project.data
    data_pages = pdata.get("pages") if isinstance(pdata, dict) else None
    if data_pages:
        for name, pdata in data_pages.items():
            pages.append(SimpleNamespace(name=name, data=pdata))
    else:
        pages = project.pages or []

    tmp_fd, tmp_name = tempfile.mkstemp(suffix=".zip")
    os.close(tmp_fd)                    # zipfile сам будет писать

    with zipfile.ZipFile(tmp_name, "w", zipfile.ZIP_DEFLATED) as zf:
        # каждая страница → отдельный html
        for pg in pages:
            html_bytes = _render(pg)
            fname = ("index" if pg.name == "index" else pg.name) + ".html"
            zf.writestr(fname, html_bytes)

    return tmp_name
