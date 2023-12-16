from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from . import models
from .database import engine
from .routers import pages, media, auth, users

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount('/static', StaticFiles(directory='app/static/'), name='static')

app.include_router(pages.router)
app.include_router(media.router)
app.include_router(users.router)
app.include_router(auth.router)

origins = [
    'http://localhost',
    '0.0.0.0',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get("/hello")
async def root():
    return {"message": "Hello World"}
