from importlib import resources
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from starlette.responses import FileResponse
from starlette.background import BackgroundTask
from contextlib import asynccontextmanager

from . import models, schemas, crud, exporter
from .database import engine, get_db

# ────────────────────────────── init ─────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title='Site-Builder API', version='0.3.0', lifespan=lifespan)

# ────────────────────── список проектов ──────────────────────
@app.get('/projects/', response_model=list[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return crud.list_projects(db)

# ─────────────────────── проекты CRUD ────────────────────────
@app.post('/projects/', response_model=schemas.ProjectOut, status_code=201)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db, project)

@app.get('/projects/{pid}', response_model=schemas.ProjectOut)
def read_project(pid: int, db: Session = Depends(get_db)):
    pr = crud.get_project(db, pid)
    if not pr:
        raise HTTPException(404, 'Not found')
    return pr

@app.put('/projects/{pid}', response_model=schemas.ProjectOut)
def update_project(pid: int, proj: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    pr = crud.update_project(db, pid, proj)
    if not pr:
        raise HTTPException(404, 'Not found')
    return pr

@app.delete('/projects/{pid}', status_code=204)
def delete_project(pid: int, db: Session = Depends(get_db)):
    if not crud.delete_project(db, pid):
        raise HTTPException(404, 'Not found')


# ─────────────────────── страницы CRUD ───────────────────────
@app.post('/projects/{pid}/pages',  response_model=schemas.PageOut, status_code=201)
@app.post('/projects/{pid}/pages/', response_model=schemas.PageOut, status_code=201)
def create_page(pid: int, page: schemas.PageCreate, db: Session = Depends(get_db)):
    return crud.create_page(db, pid, page)

@app.get('/projects/{pid}/pages',  response_model=list[schemas.PageOut])
@app.get('/projects/{pid}/pages/', response_model=list[schemas.PageOut])
def list_pages(pid: int, db: Session = Depends(get_db)):
    return crud.list_pages(db, pid)

@app.get('/projects/{pid}/pages/{pgid}', response_model=schemas.PageOut)
def read_page(pid: int, pgid: int, db: Session = Depends(get_db)):
    pg = crud.get_page(db, pid, pgid)
    if not pg:
        raise HTTPException(404, 'Page not found')
    return pg

@app.put('/projects/{pid}/pages/{pgid}', response_model=schemas.PageOut)
def update_page(pid: int, pgid: int, page: schemas.PageUpdate, db: Session = Depends(get_db)):
    pg = crud.update_page(db, pid, pgid, page)
    if not pg:
        raise HTTPException(404, 'Page not found')
    return pg

@app.delete('/projects/{pid}/pages/{pgid}', status_code=204)
def delete_page(pid: int, pgid: int, db: Session = Depends(get_db)):
    if not crud.delete_page(db, pid, pgid):
        raise HTTPException(404, 'Page not found')


# ────────────────────────── экспорт ZIP ──────────────────────
@app.get('/projects/{pid}/export')
def export_zip(pid: int, db: Session = Depends(get_db)):
    pr = crud.get_project(db, pid)
    if not pr:
        raise HTTPException(404, 'Not found')
    zpath = exporter.build_zip(pr, db)
    return FileResponse(
        zpath,
        filename='site.zip',
        media_type='application/zip',
        background=BackgroundTask(os.unlink, zpath),
    )


# ─────────────────────── статика фронтенда ───────────────────
# структура корня проекта:
#             ├─ public/  – индекс и прочие статические файлы
#             ├─ style/   – стили
#             ├─ src/     – js-модули
#             └─ ExPlast/sitebuilder/backend/
BASE_DIR = resources.files("sitebuilder").parent.parent
FRONT_DIR = BASE_DIR / "public"
STYLE_DIR = BASE_DIR / "style"
SRC_DIR = BASE_DIR / "src"
# если путь не найден → явная ошибка при старте
if not FRONT_DIR.is_dir():
    raise RuntimeError(f"frontend directory not found: {FRONT_DIR}")
if not (FRONT_DIR / "index.html").is_file():
    raise RuntimeError(
        f"index.html not found in frontend directory: {FRONT_DIR}"
    )
for path in (STYLE_DIR, SRC_DIR):
    if not path.is_dir():
        raise RuntimeError(f"{path.name} directory not found: {path}")

# отдаём всё содержимое папки,
# html=True → запрос к '/' вернёт index.html
app.mount("/style", StaticFiles(directory=STYLE_DIR), name="style")
app.mount("/src", StaticFiles(directory=SRC_DIR), name="src")
app.mount("/", StaticFiles(directory=FRONT_DIR, html=True), name="frontend")
