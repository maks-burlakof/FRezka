import re
from datetime import datetime
from typing import Optional, Tuple
from pydantic import BaseModel, field_validator, model_validator


# Users, authentication


def validate_password(password: str) -> str:
    if not 5 <= len(password) <= 100:
        raise ValueError('Password must be at least 5 and no more than 100 characters long')
    return password


class UserCreate(BaseModel):
    username: str
    password: str

    @field_validator('username')
    @classmethod
    def validate_username(cls, username: str) -> str:
        if not 4 <= len(username) <= 25:  # Change also html form
            raise ValueError('Username must be at least 4 and no more than 25 characters long')
        if not re.match(r'^[A-Za-z0-9\._-]+$', username):
            raise ValueError('Username must consist of Latin letters, digits, .-_ characters')
        if username.isdigit():
            raise ValueError('Username must contain at least one letter')
        return username

    password = field_validator('password')(validate_password)


class UserUpdate(BaseModel):
    username: str
    kinopoisk_username: Optional[str] = None


class UserOut(BaseModel):
    username: str
    date_joined: datetime
    is_active: bool
    username_last_changed: datetime
    kinopoisk_username: Optional[str] = None


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str

    new_password = field_validator('new_password')(validate_password)

    @model_validator(mode='after')
    def check_passwords_match(self) -> 'UserChangePassword':
        if self.current_password is not None and self.new_password is not None and self.current_password == self.new_password:
            raise ValueError('The new password must not match the old password')
        return self


class TokenOut(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    id: int


# Movies


class MovieBase(BaseModel):
    id: int
    title: str
    cover_url: str
    rezka_url: str


class MovieCreate(MovieBase):
    pass


class MovieOut(MovieBase):
    date_created: datetime


# Timecodes


class TimecodeBase(BaseModel):
    movie_id: int
    timecode: int
    duration: int
    translator: Optional[int] = None
    season: Optional[int] = None
    episode: Optional[int] = None
    is_watched: Optional[bool] = False


class TimecodeCreate(TimecodeBase):
    pass


class TimecodeUpdate(TimecodeBase):
    timecode: Optional[int] = None
    duration: Optional[int] = None


class TimecodeOut(TimecodeBase):
    last_watched: datetime


class TimecodeMovieOut(MovieOut, TimecodeOut):
    pass
