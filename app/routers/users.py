from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from .. import schemes, utils, models
from ..oauth2 import get_current_user
from ..database import get_db

router = APIRouter(prefix='/api/user', tags=['User API'])


@router.get('/', response_model=schemes.UserOut)
def get_user(user=Depends(get_current_user)):
    return user


@router.patch('/', response_model=schemes.UserOut)
def update_user(updated_data: schemes.UserUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if updated_data.username != user.username:
        now = datetime.now(tz=user.username_last_changed.tzinfo)
        if (now - user.username_last_changed).days < 30:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='You can change your username only once a month')
        user.username_last_changed = now

    user_query = db.query(models.User).filter(models.User.id == user.id)
    user_query.update({
        **updated_data.model_dump(exclude_unset=True),
        'username_last_changed': user.username_last_changed,
    }, synchronize_session=False)
    db.commit()

    return user_query.first()


@router.patch('/change-password')
def change_password(change_password: schemes.UserChangePassword, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not utils.verify(change_password.current_password, user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid password')

    hashed_password = utils.get_hash(change_password.new_password)
    user.password = hashed_password

    db.commit()
    return {'detail': 'Password changed'}
