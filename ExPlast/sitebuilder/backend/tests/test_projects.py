import os
import tempfile

# выбираем временный SQLite-файл до импорта приложения
fd, path = tempfile.mkstemp(suffix=".db")
os.close(fd)
os.environ["DATABASE_URL"] = f"sqlite:///{path}"

from fastapi.testclient import TestClient
from sitebuilder.backend.app.main import app
from sitebuilder.backend.app.database import Base, engine

client = TestClient(app)

def setup_function():
    # чистая БД перед каждым тестом
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_create_and_read():
    new = {"name": "Draft", "data": {"pages": []}}
    r = client.post("/projects/", json=new)
    assert r.status_code == 201
    pid = r.json()["id"]

    r2 = client.get(f"/projects/{pid}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Draft"

def test_update():
    pid = client.post("/projects/", json={"name": "X", "data": {}}).json()["id"]
    r = client.put(f"/projects/{pid}", json={"name": "Y", "data": {}})
    assert r.status_code == 200
    assert r.json()["name"] == "Y"

def test_delete():
    pid = client.post("/projects/", json={"name": "Demo", "data": {}}).json()["id"]
    r = client.delete(f"/projects/{pid}")
    assert r.status_code == 204
    assert client.get(f"/projects/{pid}").status_code == 404
