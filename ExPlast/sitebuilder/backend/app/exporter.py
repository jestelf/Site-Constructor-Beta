import os, io, zipfile, tempfile
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

def _render(page: ProjectPage, css: str) -> bytes:
    tpl = Template(_HTML)
    return tpl.render(title=page.name, html=page.data["html"], css=css).encode()

def build_zip(project: Project, db: Session) -> str:
    """Создать tmp-zip и вернуть его путь"""
    css  = project.data.get("css", "")
    pages = project.pages or []

    tmp_fd, tmp_name = tempfile.mkstemp(suffix=".zip")
    os.close(tmp_fd)                    # zipfile сам будет писать

    with zipfile.ZipFile(tmp_name, "w", zipfile.ZIP_DEFLATED) as zf:
        # каждая страница → отдельный html
        for pg in pages:
            html_bytes = _render(pg, css)
            fname = ("index" if pg.name == "index" else pg.name) + ".html"
            zf.writestr(fname, html_bytes)

    return tmp_name
