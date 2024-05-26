from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import PlainTextResponse

router = APIRouter(prefix='', tags=['Pages'])
templates = Jinja2Templates(directory='app/templates/')


@router.get('/')
def index(request: Request):
    context = {
        'request': request,
    }
    return templates.TemplateResponse('index.html', context)


@router.get('/login')
def login(request: Request):
    context = {
        'request': request,
    }
    return templates.TemplateResponse('login.html', context)


@router.get('/search')
def search(request: Request):
    context = {
        'request': request,
        'q': request.query_params.get('q'),
    }
    return templates.TemplateResponse('search.html', context)


@router.get('/collection')
def collections(request: Request):
    context = {
        'request': request,
    }
    return templates.TemplateResponse('collection.html', context)


@router.get('/film')
def film_page(request: Request):
    context = {
        'request': request,
    }
    return templates.TemplateResponse('film.html', context)


@router.get('/profile')
def profile(request: Request):
    context = {
        'request': request,
    }
    return templates.TemplateResponse('profile.html', context)


@router.get('/robots.txt', response_class=PlainTextResponse)
def robots():
    data = """User-agent: *\nDisallow: /"""
    return data
