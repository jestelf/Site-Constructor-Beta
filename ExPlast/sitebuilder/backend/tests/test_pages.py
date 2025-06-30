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

    # list
    lst=client.get(f"/projects/{pid}/pages").json()
    assert len(lst)==1

    # update
    upd=client.put(f"/projects/{pid}/pages/{pg['id']}", json={"title":"About Us"}).json()
    assert upd["title"]=="About Us"

    # delete
    del_resp = client.delete(f"/projects/{pid}/pages/{pg['id']}")
    assert del_resp.status_code==204
    assert client.get(f"/projects/{pid}/pages").json()==[]
