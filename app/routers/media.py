from fastapi import APIRouter, HTTPException, status, Depends

from ..oauth2 import get_current_user
from ..parser.parser import Parser

router = APIRouter(prefix='/api/media', tags=['Media API'])
parser = Parser()


@router.get('/search')
def get_search_results(q: str, user=Depends(get_current_user)):
    data = parser.search(q)
    return data


@router.get('/info')
def get_film_info(u: str, user=Depends(get_current_user)):
    try:
        data = parser.film_info(url=u)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return data


@router.get('/stream')
def get_stream(u: str, t: int, s: int = None, e: int = None, user=Depends(get_current_user)):
    try:
        data = parser.stream(url=u, translation=t, season=s, episode=e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return data
