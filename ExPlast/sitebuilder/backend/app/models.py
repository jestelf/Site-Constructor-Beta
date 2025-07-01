from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Project(Base):
    __tablename__ = 'projects'
    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String,  index=True)
    data = Column(Text)        # JSON проекта (глобальные опции)
    pages = relationship('ProjectPage', back_populates='project',
                         cascade='all, delete-orphan')
    versions = relationship('ProjectVersion', back_populates='project',
                           cascade='all, delete-orphan')

class ProjectPage(Base):
    __tablename__ = 'project_pages'
    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'))
    name       = Column(String)          # «about», «contacts» …
    title      = Column(String)          # человеко-читаемый заголовок
    data       = Column(Text)            # JSON страницы (projectData)

    project = relationship('Project', back_populates='pages')


class ProjectVersion(Base):
    __tablename__ = 'project_versions'
    id         = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'))
    number     = Column(Integer)
    data       = Column(Text)

    project = relationship('Project', back_populates='versions')
