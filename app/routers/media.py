from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from .. import models, schemes
from ..oauth2 import get_current_user
from ..database import get_db
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
def get_stream(u: str, t: int, s: int = None, e: int = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        streams, movie_data = parser.stream(url=u, translation=t, season=s, episode=e)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not db.query(models.Movie).filter(models.Movie.id == movie_data['id']).first():
        movie_pd = schemes.MovieCreate(**movie_data)
        movie_new = models.Movie(**movie_pd.model_dump())
        db.add(movie_new)
        db.commit()

    return streams


@router.get('/latest')
def get_latest_films():
    data = parser.latest_movies()
    return data


@router.get('/timecode/{movie_id}', response_model=schemes.TimecodeOut)
def get_timecode(movie_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    timecode = db.query(models.Timecode).filter(models.Timecode.movie_id == movie_id and models.Timecode.user_id == user.id).first()
    if not timecode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User Timecode for the movie not found')
    return timecode


@router.post('/timecode', response_model=schemes.TimecodeOut)
def create_timecode(updated_timecode: schemes.TimecodeCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    timecode_query = db.query(models.Timecode).filter(models.Timecode.movie_id == updated_timecode.movie_id and models.Timecode.user_id == user.id)
    timecode = timecode_query.first()

    if not timecode:
        new_timecode = models.Timecode(**updated_timecode.model_dump(), user_id=user.id)
        db.add(new_timecode)
        db.commit()
        db.refresh(new_timecode)
        return new_timecode
    else:
        timecode_query.update(updated_timecode.model_dump(), synchronize_session=False)
        db.commit()
        return timecode_query.first()
