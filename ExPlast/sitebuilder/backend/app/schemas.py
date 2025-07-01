from pydantic import BaseModel, ConfigDict
from typing import Optional, Any


# ---------- Project ----------
class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    data: dict[Any, Any] = {}

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[dict[Any, Any]] = None

class ProjectOut(ProjectBase):
    id: int
    data: dict[Any, Any]

    model_config = ConfigDict(from_attributes=True)


# ---------- Page ----------
class PageBase(BaseModel):
    name : str = 'page'
    title: Optional[str] = None   # ← новое
    data : dict[Any, Any] = {}

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    name : Optional[str] = None
    title: Optional[str] = None
    data : Optional[dict[Any, Any]] = None

class PageOut(PageBase):
    id        : int
    project_id: int

    model_config = ConfigDict(from_attributes=True)


# ---------- Version ----------
class VersionOut(BaseModel):
    id        : int
    project_id: int
    number    : int
    data      : dict[Any, Any]

    model_config = ConfigDict(from_attributes=True)
