from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from .. import models, schemas

router = APIRouter(prefix="/pages", tags=["pages"])

# ───────── CRUD ──────────
@router.post("/", response_model=schemas.PageRead)
def create_page(page_in: schemas.PageCreate, db: Session = Depends(get_session)):
    db_page = models.Page.from_orm(page_in)
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@router.get("/{page_id}", response_model=schemas.PageRead)
def read_page(page_id: int, db: Session = Depends(get_session)):
    page = db.get(models.Page, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.patch("/{page_id}", response_model=schemas.PageRead)
def update_page(page_id: int, page_in: schemas.PageUpdate, db: Session = Depends(get_session)):
    page = db.get(models.Page, page_id)
    if not page:
        raise HTTPException(status_code=404)
    for k, v in page_in.dict(exclude_unset=True).items():
        setattr(page, k, v)
    db.add(page)
    db.commit()
    db.refresh(page)
    return page

@router.delete("/{page_id}", status_code=204)
def delete_page(page_id: int, db: Session = Depends(get_session)):
    page = db.get(models.Page, page_id)
    if not page:
        raise HTTPException(status_code=404)
    db.delete(page)
    db.commit()
