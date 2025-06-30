import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .database import init_db
from .routers import auth, sites, pages, elements  # pages/elements routers аналогичны

init_db()

app = FastAPI(title="Site Builder")
app.include_router(auth.router)
app.include_router(sites.router)
app.include_router(pages.router)
app.include_router(elements.router)
from fastapi.responses import RedirectResponse

@app.get("/")
def root():
    # сразу перенаправляем в Swagger, чтобы было видно, что сервер работает
    return RedirectResponse(url="/docs")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

if __name__ == "__main__":
    uvicorn.run("app.main:app", reload=True)
