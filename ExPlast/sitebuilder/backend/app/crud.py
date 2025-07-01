import json
from typing import Optional, Any
from sqlalchemy.orm import Session

from . import models, schemas


# ─── helpers ──────────────────────────────────────────────────
def _dumps(data: Optional[dict[Any, Any]]) -> Optional[str]:
    return json.dumps(data) if data is not None else None

def _loads(text: Optional[str]) -> dict[Any, Any]:
    return json.loads(text) if text else {}

def _attach_dict(obj, field: str = "data"):
    """Преобразует obj.<field> из JSON-строки в dict (для ответа)."""
    if isinstance(getattr(obj, field, None), str):
        setattr(obj, field, _loads(getattr(obj, field)))
    return obj

def _attach_page(pg):
    """добавляет атрибут .title в объект страницы"""
    _attach_dict(pg)
    if not getattr(pg, "title", None):
        pg.title = pg.data.get("title")
    return pg


# ─── Projects CRUD ────────────────────────────────────────────
def create_project(db: Session, pr: schemas.ProjectCreate):
    db_pr = models.Project(name=pr.name, data=_dumps(pr.data))
    db.add(db_pr); db.commit(); db.refresh(db_pr)
    create_version(db, db_pr.id, pr.data)
    return _attach_dict(db_pr)

def get_project(db: Session, pid: int):
    pr = db.query(models.Project).filter_by(id=pid).first()
    if not pr:
        return None
    _attach_dict(pr)
    pr.pages = [_attach_page(pg) for pg in pr.pages]
    return pr

def update_project(db: Session, pid: int, pr: schemas.ProjectUpdate):
    db_pr = db.query(models.Project).filter_by(id=pid).first()
    if not db_pr:
        return None
    if pr.name is not None:
        db_pr.name = pr.name
    if pr.data is not None:
        db_pr.data = _dumps(pr.data)
    db.commit(); db.refresh(db_pr)
    if pr.data is not None:
        create_version(db, pid, pr.data)
    return _attach_dict(db_pr)


def list_projects(db: Session):
    """Вернуть список всех проектов."""
    return [
        _attach_dict(pr)
        for pr in db.query(models.Project).order_by(models.Project.id).all()
    ]


# ─── Versions CRUD ───────────────────────────────────────────
def create_version(db: Session, pid: int, data: dict[Any, Any]):
    num = db.query(models.ProjectVersion).filter_by(project_id=pid).count() + 1
    ver = models.ProjectVersion(project_id=pid, number=num, data=_dumps(data))
    db.add(ver); db.commit(); db.refresh(ver)
    return _attach_dict(ver)


def list_versions(db: Session, pid: int):
    return [
        _attach_dict(v)
        for v in db.query(models.ProjectVersion)
                    .filter_by(project_id=pid)
                    .order_by(models.ProjectVersion.number)
                    .all()
    ]


def get_version(db: Session, pid: int, number: int):
    ver = (
        db.query(models.ProjectVersion)
          .filter_by(project_id=pid, number=number)
          .first()
    )
    return _attach_dict(ver) if ver else None


# ─── Pages CRUD ───────────────────────────────────────────────
def create_page(db: Session, pid: int, page: schemas.PageCreate):
    db_pg = models.ProjectPage(project_id=pid,
                               name = page.name,
                               data = _dumps(page.data))
    db.add(db_pg); db.commit(); db.refresh(db_pg)
    res = _attach_page(db_pg)
    res.title = page.title or res.title
    return res

def list_pages(db: Session, pid: int):
    return [_attach_page(pg)
            for pg in db.query(models.ProjectPage)
                        .filter_by(project_id=pid).all()]

def update_page(db: Session, pid: int, pgid: int, page: schemas.PageUpdate):
    db_pg = (db.query(models.ProjectPage)
               .filter_by(project_id=pid, id=pgid).first())
    if not db_pg:
        return None
    if page.name  is not None: db_pg.name  = page.name
    if page.data  is not None: db_pg.data  = _dumps(page.data)
    # title храним только в ответе
    db.commit(); db.refresh(db_pg)
    res = _attach_page(db_pg)
    if page.title is not None:
        res.title = page.title
    return res

def delete_page(db: Session, pid: int, pgid: int) -> bool:
    pg = (db.query(models.ProjectPage)
            .filter_by(project_id=pid, id=pgid).first())
    if not pg:
        return False
    db.delete(pg); db.commit()
    return True
