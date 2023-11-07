from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from .. import schemes
from ..oauth2 import get_current_user
from ..database import get_db

router = APIRouter(prefix='/api/user', tags=['User API'])


@router.get('/', response_model=schemes.UserOut)
def get_user(user=Depends(get_current_user)):
    return user
