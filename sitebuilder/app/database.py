from sqlmodel import SQLModel, create_engine, Session
from .core.config import settings

engine = create_engine(settings.database_url, echo=False, connect_args={"check_same_thread": False})

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
