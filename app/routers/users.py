from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from ..oauth2 import get_current_user
from ..database import get_db

router = APIRouter(prefix='/api/user', tags=['User API'])


@router.get('/')
def get_user(user=Depends(get_current_user), db: Session = Depends(get_db)):
    print(user, type(user))
    return user
