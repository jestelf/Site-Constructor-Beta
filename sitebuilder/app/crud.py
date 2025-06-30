from sqlmodel import Session, select
from . import models, schemas
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(session: Session, email: str):
    return session.exec(select(models.User).where(models.User.email == email)).first()

def create_user(session: Session, email: str, password: str):
    db_user = models.User(email=email, hashed_password=pwd_ctx.hash(password))
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

# Аналогично: CRUD для Site, Page, Element
