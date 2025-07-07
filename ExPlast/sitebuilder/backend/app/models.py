from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Project(Base):
    __tablename__ = 'projects'
    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String,  index=True)
    data = Column(Text)        # JSON проекта (глобальные опции)
    pages = relationship('ProjectPage', back_populates='project',
                         cascade='all, delete-orphan')

class ProjectPage(Base):
    __tablename__ = 'project_pages'
    __table_args__ = (
        UniqueConstraint('project_id', 'name', name='uix_project_page_name'),
    )
    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'))
    name       = Column(String, unique=True)          # «about», «contacts» …
    title      = Column(String)          # человеко-читаемый заголовок
    data       = Column(Text)            # JSON страницы (projectData)

    project = relationship('Project', back_populates='pages')
