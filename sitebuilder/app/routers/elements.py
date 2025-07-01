from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from ..database import get_session
from .. import models, schemas

router = APIRouter(prefix="/elements", tags=["elements"])

@router.post("/", response_model=schemas.ElementRead)
def create_element(el_in: schemas.ElementCreate, db: Session = Depends(get_session)):
    el = models.Element.from_orm(el_in)
    db.add(el)
    db.commit()
    db.refresh(el)
    return el

@router.patch("/{el_id}", response_model=schemas.ElementRead)
def update_element(el_id: int, el_in: schemas.ElementUpdate, db: Session = Depends(get_session)):
    el = db.get(models.Element, el_id)
    if not el:
        raise HTTPException(status_code=404)
    for k, v in el_in.dict(exclude_unset=True).items():
        setattr(el, k, v)
    db.add(el)
    db.commit()
    db.refresh(el)
    return el

@router.delete("/{el_id}", status_code=204)
def delete_element(el_id: int, db: Session = Depends(get_session)):
    el = db.get(models.Element, el_id)
    if not el:
        raise HTTPException(status_code=404)
    db.delete(el)
    db.commit()
