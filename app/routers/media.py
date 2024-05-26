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
def search(q: str, p: Optional[int] = 1):
    try:
        data = parser.search(q=q, page=p)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return data


@router.get('/collection')
def collection(u: str, p: Optional[int] = 1):
    try:
        data = parser.collection(url=u, page=p)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return data


@router.get('/info')
def film_info(u: Annotated[str, Query(pattern='\w.html$')], user=Depends(get_current_user)):
    try:
        data = parser.film_info(url=u)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return data


@router.get('/stream')
def stream(u: Annotated[str, Query(pattern='\w.html$')], t: int, s: int = None, e: int = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
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
def latest_movies():
    data = parser.latest_movies()
    return data


@router.get('/timecodes', response_model=List[schemes.TimecodeMovieOut])
def timecodes_and_movies(user=Depends(get_current_user), db: Session = Depends(get_db)):
    recent_watched = db.query(models.Timecode, models.Movie).join(
        models.Movie, models.Timecode.movie_id == models.Movie.id
    ).filter(
        models.Timecode.user_id == user.id, models.Timecode.is_watched == False
    ).order_by(models.Timecode.last_watched.desc()).limit(6).all()

    return [{**timecode.__dict__, **movie.__dict__} for timecode, movie in recent_watched]


@router.get('/timecode', response_model=schemes.TimecodeMovieOut)
def timecode_and_movie(id: Optional[int] = None, u: Optional[str] = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
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
def timecode(updated_tcode: schemes.TimecodeCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tcode_query = db.query(models.Timecode).filter(models.Timecode.movie_id == updated_tcode.movie_id and models.Timecode.user_id == user.id)
    tcode = tcode_query.first()

    if not tcode:
        new_tcode = models.Timecode(**updated_tcode.model_dump(), user_id=user.id)
        db.add(new_tcode)
        db.commit()
        db.refresh(new_tcode)
        return new_tcode
    else:
        tcode_query.update(updated_tcode.model_dump(), synchronize_session=False)
        db.commit()
        return tcode_query.first()


@router.patch('/timecode', response_model=schemes.TimecodeOut)
def timecode(updated_tcode: schemes.TimecodeUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tcode_query = db.query(models.Timecode).filter(models.Timecode.movie_id == updated_tcode.movie_id and models.Timecode.user_id == user.id)
    tcode = tcode_query.first()

    if not tcode:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User Timecode for the movie not found')
    else:
        tcode_query.update(updated_tcode.model_dump(exclude_unset=True, exclude_none=True), synchronize_session=False)
        db.commit()
        return tcode_query.first()
