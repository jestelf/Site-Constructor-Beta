from fastapi import APIRouter, Depends, Request, HTTPException, responses
from sqlmodel import Session, select
from fastapi.templating import Jinja2Templates
from ..database import get_session
from .. import models, schemas

router = APIRouter(prefix="/sites", tags=["sites"])
templates = Jinja2Templates(directory="app/templates")

@router.post("/", response_model=schemas.SiteRead)
def create_site(site_in: schemas.SiteCreate, db: Session = Depends(get_session)):
    site = models.Site.from_orm(site_in)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site

@router.get("/{slug}", response_class=responses.HTMLResponse)
def render_site(slug: str, request: Request, db: Session = Depends(get_session)):
    site = db.exec(select(models.Site).where(models.Site.slug == slug)).first()
    if not site:
        raise HTTPException(404)
    # пока отображаем первую страницу
    page = site.pages[0] if site.pages else None
    return templates.TemplateResponse("page.html", {"request": request, "site": site, "page": page})
