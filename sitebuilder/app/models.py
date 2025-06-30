from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    is_active: bool = True
    sites: List["Site"] = Relationship(back_populates="owner")

class Site(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    slug: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    owner_id: int = Field(foreign_key="user.id")
    owner: User = Relationship(back_populates="sites")
    pages: List["Page"] = Relationship(back_populates="site")

class Page(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    path: str     # «/», «/about», …
    site_id: int = Field(foreign_key="site.id")
    site: Site = Relationship(back_populates="pages")
    elements: List["Element"] = Relationship(back_populates="page", sa_relationship_kwargs={"order_by": "Element.position"})

class Element(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str          # «text», «image», «button» …
    content: str       # JSON или текст
    position: int = 0  # сортировка
    page_id: int = Field(foreign_key="page.id")
    page: Page = Relationship(back_populates="elements")
