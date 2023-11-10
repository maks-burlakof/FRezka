import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


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

    @field_validator('password')
    @classmethod
    def validate_password(cls, password: str) -> str:
        if not 5 <= len(password) <= 100:
            raise ValueError('Password must be at least 5 and no more than 100 characters long')
        return password


class UserOut(BaseModel):
    username: str
    date_joined: datetime
    is_active: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    id: int


class MovieBase(BaseModel):
    id: int
    title: str
    cover_url: str
    rezka_url: str


class MovieCreate(MovieBase):
    pass


class MovieOut(MovieBase):
    date_created: datetime


class TimecodeBase(BaseModel):
    movie_id: int
    timecode: int
    duration: int
    translator: int
    season: Optional[int] = None
    episode: Optional[int] = None


class TimecodeCreate(TimecodeBase):
    pass


class TimecodeOut(TimecodeBase):
    pass
