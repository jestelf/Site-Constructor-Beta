import os
import tempfile

# перед импорта приложения переключаем БД на временный файл
fd, path = tempfile.mkstemp(suffix=".db")
os.close(fd)
os.environ["DATABASE_URL"] = f"sqlite:///{path}"

from fastapi.testclient import TestClient

# путь к вашему приложению (вы раньше использовали именно sitebuilder.backend)
from sitebuilder.backend.app.main import app
import base64
from sitebuilder.backend.app.database import Base, engine
from sitebuilder.backend.app import exporter
import zipfile
import io

client = TestClient(app)


# фикстура: «чистая БД перед каждым тестом»
def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_export_zip():
    # 1. создаём минимальный проект в новой структуре
    mock = {"pages": {"index": {"html": "<h1>Hello</h1>", "css": "h1{color:red;}"}}}
    pid = client.post("/projects/", json={"name": "Demo", "data": mock}).json()["id"]

    # 2. запрашиваем экспорт
    resp = client.get(f"/projects/{pid}/export")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/zip"
    assert resp.content[:2] == b"PK"  # ZIP-подпись

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        html = zf.read("index.html").decode()
        assert "<h1>Hello</h1>" in html
        assert "h1{color:red;}" in html


def test_export_file_removed(monkeypatch, tmp_path):
    pid = client.post("/projects/", json={"name": "Demo", "data": {}}).json()["id"]

    path = tmp_path / "site.zip"

    def fake_build_zip(pr, db):
        with zipfile.ZipFile(path, "w") as zf:
            zf.writestr("index.html", "hi")
        return str(path)

    monkeypatch.setattr(exporter, "build_zip", fake_build_zip)

    resp = client.get(f"/projects/{pid}/export")
    assert resp.status_code == 200
    resp.close()
    assert not path.exists()


def test_export_sanitize_and_filtered_names():
    img = base64.b64encode(b"abc").decode()
    data = {
        "project": {
            "assets": [
                {"name": "bad name@.png", "src": f"data:image/png;base64,{img}"},
                {"name": "pic/../evil.png", "src": f"data:text/plain;base64,{img}"}
            ]
        },
        "pages": {
            "bad/../name": {"html": "hi", "css": ""},
        }
    }
    pid = client.post("/projects/", json={"name": "X", "data": data}).json()["id"]
    resp = client.get(f"/projects/{pid}/export")
    assert resp.status_code == 200

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        names = zf.namelist()
        # Проверяем, что оба ассета отфильтрованы
        assert "assets/bad_name_.png" in names
        assert "assets/pic____evil_png" in names
        # Проверяем страницу
        assert "bad____name.html" in names

        # Проверка содержимого файла
        assert zf.read("assets/bad_name_.png") == b"abc"

        # Проверка отсутствия опасных символов
        for name in names:
            assert ".." not in name
            if name.startswith("assets/"):
                assert "/" not in name[len("assets/") :]
            else:
                assert "/" not in name

