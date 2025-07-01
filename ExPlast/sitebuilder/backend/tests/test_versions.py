from fastapi.testclient import TestClient
from sitebuilder.backend.app.main import app
from sitebuilder.backend.app.database import Base, engine

client = TestClient(app)

def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def test_versions_flow():
    pid = client.post('/projects/', json={'name':'Site','data':{}}).json()['id']
    # first save
    client.put(f'/projects/{pid}', json={'data':{'a':1}})
    # second save
    client.put(f'/projects/{pid}', json={'data':{'a':2}})

    vs = client.get(f'/projects/{pid}/versions').json()
    assert len(vs) == 3  # initial + two saves
    v2 = client.get(f'/projects/{pid}/versions/2').json()
    assert v2['data']['a'] == 1
