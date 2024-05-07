from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from .. import schemes, utils
from ..oauth2 import get_current_user
from ..database import get_db

router = APIRouter(prefix='/api/user', tags=['User API'])


@router.get('/', response_model=schemes.UserOut)
def get_user(user=Depends(get_current_user)):
    return user


@router.patch('/', response_model=schemes.UserOut)
def update_user(updated_data: schemes.UserUpdate, user=Depends(get_current_user)):
    if updated_data.username != user.username and user.username_last_changed:
        user.username_last_changed = utils.get_now()
    # TODO: continue here
    return user


@router.patch('/change-password/')
def change_password(change_password: schemes.UserChangePassword, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not utils.verify(change_password.current_password, user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid password')

    hashed_password = utils.get_hash(change_password.new_password)
    user.password = hashed_password

    db.commit()
    return {'detail': 'Password changed'}
