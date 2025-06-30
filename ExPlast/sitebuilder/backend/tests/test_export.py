from fastapi.testclient import TestClient

# путь к вашему приложению (вы раньше использовали именно sitebuilder.backend)
from sitebuilder.backend.app.main import app
from sitebuilder.backend.app.database import Base, engine

client = TestClient(app)

# фикстура: «чистая БД перед каждым тестом»
def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_export_zip():
    # 1. создаём минимальный проект
    mock = {"html": "<h1>Hello</h1>", "css": "h1{color:red;}"}
    pid = client.post("/projects/", json={"name": "Demo", "data": mock}).json()["id"]

    # 2. запрашиваем экспорт
    resp = client.get(f"/projects/{pid}/export")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/zip"
    assert resp.content[:2] == b"PK"        # ZIP-подпись
