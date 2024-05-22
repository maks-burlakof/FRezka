from typing import Optional, List, Annotated

from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemes
from ..oauth2 import get_current_user
from ..database import get_db
from ..parser.parser import Parser

router = APIRouter(prefix='/api/media', tags=['Media API'])
parser = Parser()


@router.get('/search')
def get_search_results(q: str):
    data = parser.search(q)
    return data


@router.get('/info')
def get_film_info(u: Annotated[str, Query(pattern='\w.html$')], user=Depends(get_current_user)):
    try:
        data = parser.film_info(url=u)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return data


@router.get('/stream')
def get_stream(u: Annotated[str, Query(pattern='\w.html$')], t: int, s: int = None, e: int = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
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


@router.get('/timecodes', response_model=List[schemes.TimecodeMovieOut])
def get_movies_timecodes(user=Depends(get_current_user), db: Session = Depends(get_db)):
    recent_watched = db.query(models.Timecode, models.Movie).join(
        models.Movie, models.Timecode.movie_id == models.Movie.id
    ).filter(
        models.Timecode.user_id == user.id, models.Timecode.is_watched == False
    ).order_by(models.Timecode.last_watched.desc()).limit(6).all()

    return [{**timecode.__dict__, **movie.__dict__} for timecode, movie in recent_watched]


@router.get('/timecode', response_model=schemes.TimecodeMovieOut)
def get_movie_timecode(id: Optional[int] = None, u: Optional[str] = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not id and not u:
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You must provide either movie_id or rezka_url')

    movie = db.query(models.Movie).filter(
        (models.Movie.rezka_url == u) if u else (models.Movie.id == id)
    ).first()
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Movie not found')

    timecode = db.query(models.Timecode).filter(models.Timecode.movie_id == movie.id and models.Timecode.user_id == user.id).first()
    if not timecode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User Timecode for the movie not found')

    return {**timecode.__dict__, **movie.__dict__}


@router.post('/timecode', response_model=schemes.TimecodeOut)
def create_update_timecode(updated_timecode: schemes.TimecodeCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
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


@router.patch('/timecode', response_model=schemes.TimecodeOut)
def update_timecode(updated_timecode: schemes.TimecodeUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    timecode_query = db.query(models.Timecode).filter(models.Timecode.movie_id == updated_timecode.movie_id and models.Timecode.user_id == user.id)
    timecode = timecode_query.first()

    if not timecode:
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User Timecode for the movie not found')
    else:
        timecode_query.update(updated_timecode.model_dump(exclude_unset=True, exclude_none=True), synchronize_session=False)
        db.commit()
        return timecode_query.first()
