from fastapi import APIRouter, status, Depends, HTTPException
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import schemes, utils, models, oauth2
from ..database import get_db

router = APIRouter(prefix='/api/auth', tags=['Authentication API'])


@router.post('/login', response_model=schemes.TokenOut)
def login(user_credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_credentials.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid credentials')
    if not utils.verify(user_credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid credentials')
    access_token = oauth2.create_access_token(data={'id': user.id})
    return {'access_token': access_token, 'token_type': 'bearer'}


@router.post('/register', response_model=schemes.UserOut, status_code=status.HTTP_201_CREATED)
def register(user: schemes.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='User with this username already exists')

    hashed_password = utils.get_hash(user.password)
    user.password = hashed_password

    new_user = models.User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
