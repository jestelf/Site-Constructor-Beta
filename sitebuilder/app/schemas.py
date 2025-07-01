from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ElementBase(BaseModel):
    type: str
    content: str
    position: int

class ElementCreate(ElementBase): pass
class ElementUpdate(BaseModel):
    type: Optional[str] = None
    content: Optional[str] = None
    position: Optional[int] = None
class ElementRead(ElementBase):
    id: int

class PageBase(BaseModel):
    title: str
    path: str

class PageCreate(PageBase): pass
class PageUpdate(BaseModel):
    title: Optional[str] = None
    path: Optional[str] = None
class PageRead(PageBase):
    id: int
    elements: List[ElementRead] = []

class SiteBase(BaseModel):
    title: str
    slug: str

class SiteCreate(SiteBase): pass
class SiteRead(SiteBase):
    id: int
    created_at: datetime
    pages: List[PageRead] = []

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
