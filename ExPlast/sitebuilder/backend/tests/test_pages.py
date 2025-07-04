import os
import tempfile

# переключаем БД на временный файл до импорта приложения
fd, path = tempfile.mkstemp(suffix=".db")
os.close(fd)
os.environ["DATABASE_URL"] = f"sqlite:///{path}"

from fastapi.testclient import TestClient
from sitebuilder.backend.app.main import app
from sitebuilder.backend.app.database import Base, engine

client = TestClient(app)

def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_pages_crud():
    proj = client.post("/projects/", json={"name":"Site","data":{}}).json()
    pid = proj["id"]

    # create page
    pg = client.post(f"/projects/{pid}/pages", json={"name":"about","title":"О нас","data":{}}).json()
    assert pg["name"]=="about"
    assert pg["title"]=="О нас"

    # list
    lst=client.get(f"/projects/{pid}/pages").json()
    assert len(lst)==1
    assert lst[0]["title"]=="О нас"

    # update
    upd=client.put(f"/projects/{pid}/pages/{pg['id']}", json={"title":"About Us"}).json()
    assert upd["title"]=="About Us"
    updated=client.get(f"/projects/{pid}/pages/{pg['id']}").json()
    assert updated["title"]=="About Us"

    # delete
    del_resp = client.delete(f"/projects/{pid}/pages/{pg['id']}")
    assert del_resp.status_code==204
    assert client.get(f"/projects/{pid}/pages").json()==[]

def test_get_page():
    proj = client.post("/projects/", json={"name":"Site","data":{}}).json()
    pid = proj["id"]
    pg = client.post(f"/projects/{pid}/pages", json={"name":"about","title":"О нас","data":{}}).json()
    pgid = pg["id"]

    r = client.get(f"/projects/{pid}/pages/{pgid}")
    assert r.status_code == 200
    assert r.json()["id"] == pgid
    assert r.json()["title"] == "О нас"

    r2 = client.get(f"/projects/{pid}/pages/9999")
    assert r2.status_code == 404
