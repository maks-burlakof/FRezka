from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import models
from .database import engine
from .routers import pages, media, auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount('/static', StaticFiles(directory='app/static/'), name='static')

app.include_router(pages.router)
app.include_router(media.router)
app.include_router(auth.router)


@app.get("/hello")
async def root():
    return {"message": "Hello World"}
