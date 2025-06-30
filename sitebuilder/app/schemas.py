from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ElementBase(BaseModel):
    type: str
    content: str
    position: int

class ElementCreate(ElementBase): pass
class ElementRead(ElementBase):
    id: int

class PageBase(BaseModel):
    title: str
    path: str

class PageCreate(PageBase): pass
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
