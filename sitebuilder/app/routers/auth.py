from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlmodel import Session
from ..database import get_session
from ..core.config import settings
from .. import crud, schemas, models

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def create_access_token(data: dict, expires: int):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")

@router.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_session)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not crud.pwd_ctx.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bad credentials")
    token = create_access_token({"sub": str(user.id)}, settings.access_token_expire_minutes)
    return {"access_token": token}
